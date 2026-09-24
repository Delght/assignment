"""Checks for the reference script itself, on small files worked out by hand.

    python3 -m unittest discover -s scripts
"""

import tempfile
import unittest
from pathlib import Path

from reference import main

HEADER = "trade_id,timestamp,exchange,symbol,side,quantity,price_usd,fee_usd"
PRICES = "as_of,symbol,price_usd\n2026-03-31T23:59:59Z,BTC,400\n"


def run(*rows: str) -> dict:
    with tempfile.TemporaryDirectory() as folder:
        trades, prices = Path(folder, "trades.csv"), Path(folder, "prices.csv")
        trades.write_text("\n".join([HEADER, *rows]) + "\n")
        prices.write_text(PRICES)
        return main(str(trades), str(prices))


class ReferenceTest(unittest.TestCase):
    def test_orders_by_instant_not_by_text(self):
        # As text, "00:00:00.100Z" sorts before "00:00:00Z"; in time it comes after.
        # BUY 1 @ 100, BUY 1 @ 200 → average 150; SELL 0.5 @ 300 → realized 150 − 75 = 75.
        result = run(
            "T3,2025-10-01T00:00:00.200Z,Binance,BTC,SELL,0.5,300,0",
            "T2,2025-10-01T00:00:00.100Z,Binance,BTC,BUY,1,200,0",
            "T1,2025-10-01T00:00:00Z,Binance,BTC,BUY,1,100,0",
        )
        self.assertEqual(result["assets"]["BTC"]["realized_pnl"], "75.0000000000")
        self.assertEqual(result["assets"]["BTC"]["cost_basis"], "225.0000000000")

    def test_everything_closed(self):
        # BUY 1 @ 100, SELL 1 @ 150 → realized 50, nothing held, no allocation to compute.
        result = run(
            "T1,2025-10-01T00:00:00Z,Binance,BTC,BUY,1,100,0",
            "T2,2025-10-02T00:00:00Z,Binance,BTC,SELL,1,150,0",
        )
        self.assertEqual(result["assets"]["BTC"]["realized_pnl"], "50.0000000000")
        self.assertIsNone(result["assets"]["BTC"]["allocation"])
        self.assertEqual(result["totals"]["current_value"], "0.0000000000")


if __name__ == "__main__":
    unittest.main()

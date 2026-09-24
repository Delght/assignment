#!/usr/bin/env python3
"""Independent reference calculation for the sample data.

Implements the brief's weighted-average rules with Python's Decimal (50 significant digits),
separately from the TypeScript engine, so the backend's regression test compares against
numbers the engine did not produce. Standard library only.

    python3 scripts/reference.py > backend/test/portfolio/sample-reference.json

Prints JSON: per-asset rows and portfolio totals, rounded half-even to 10 decimal places. Paths
default to data/trades.csv and data/prices.csv and can be passed as arguments.
"""

import csv
import json
import sys
from collections import defaultdict
from decimal import ROUND_HALF_EVEN, Decimal, getcontext

getcontext().prec = 50
PLACES = Decimal("1e-10")


def fmt(value: Decimal) -> str:
    return str(value.quantize(PLACES, rounding=ROUND_HALF_EVEN))


def main(trades_path: str, prices_path: str) -> dict:
    with open(trades_path, newline="") as f:
        trades = sorted(csv.DictReader(f), key=lambda r: (r["timestamp"], r["trade_id"]))
    with open(prices_path, newline="") as f:
        prices = {r["symbol"]: Decimal(r["price_usd"]) for r in csv.DictReader(f)}

    zero = Decimal(0)
    qty = defaultdict(lambda: zero)
    cost = defaultdict(lambda: zero)
    realized = defaultdict(lambda: zero)
    fees = defaultdict(lambda: zero)

    for t in trades:
        s = t["symbol"]
        q, p, f = Decimal(t["quantity"]), Decimal(t["price_usd"]), Decimal(t["fee_usd"])
        fees[s] += f
        if t["side"] == "BUY":
            qty[s] += q
            cost[s] += q * p + f
        else:
            if q > qty[s]:
                raise SystemExit(f"{t['trade_id']}: SELL {q} exceeds held {qty[s]}")
            average = cost[s] / qty[s]
            removed = average * q
            realized[s] += q * p - f - removed
            qty[s] -= q
            cost[s] -= removed
            if qty[s] == 0:  # full close: start the next BUY from zero
                cost[s] = zero

    rows = {}
    for s in sorted(qty):
        value = qty[s] * prices[s]
        rows[s] = {
            "quantity": qty[s],
            "average_cost": cost[s] / qty[s] if qty[s] else zero,
            "cost_basis": cost[s],
            "current_value": value,
            "realized_pnl": realized[s],
            "unrealized_pnl": value - cost[s],
            "total_pnl": realized[s] + value - cost[s],
            "fees": fees[s],
        }
    portfolio_value = sum(r["current_value"] for r in rows.values())
    for r in rows.values():
        r["allocation"] = r["current_value"] / portfolio_value

    totals = {
        key: sum(r[key] for r in rows.values())
        for key in ("current_value", "cost_basis", "realized_pnl", "unrealized_pnl", "total_pnl", "fees")
    }
    return {
        "assets": {s: {k: fmt(v) for k, v in r.items()} for s, r in rows.items()},
        "totals": {k: fmt(v) for k, v in totals.items()},
    }


if __name__ == "__main__":
    args = sys.argv[1:] or ["data/trades.csv", "data/prices.csv"]
    print(json.dumps(main(*args), indent=2))

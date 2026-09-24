# 0. Analysis

Goal: understand the task and the data well enough to pick the number type, the stack and the open questions before writing code.

## The task in short

A dashboard over a crypto trade history: import trades, value them with a price snapshot and show holdings, realized and unrealized P&L, fees, two charts and a transaction explorer.
Cost method is weighted average; live prices and exchange APIs are out of scope.
The app must be deployed, and the way AI tools were used is assessed as much as the code.

## Data profile

Profiled with Python `Decimal` before any app code.

**`trades.csv`**: 200 rows, columns `trade_id, timestamp, exchange, symbol, side, quantity, price_usd, fee_usd`.

- 5 symbols (BTC, ETH, SOL, CKB, DOGE), 40 trades each; 2 exchanges (Binance, Coinbase), 100 each.
- 128 BUY, 72 SELL; 2025-10-01 to 2026-03-27, UTC.
- `trade_id` unique; rows already in time order; no two trades share a timestamp.
- No SELL exceeds the quantity held, per asset or per exchange.
- 10 full closes (quantity back to exactly 0, followed by new BUYs), e.g. TRD-0076…0080 and TRD-0156…0160.

**`prices.csv`**: one snapshot, `as_of` 2026-03-31T23:59:59Z, one price per symbol.
Prices have different scales (`111500.00`, `0.00715000`), so quantities and prices need exact decimals.

## Traps found

- **Float dust.** Replaying the ledger with JS/Python floats leaves quantity `-8.9e-16` ETH after TRD-0077 and `6.9e-18` BTC after TRD-0156.
  That breaks the reset-on-close rule and would make a later "no short sale" check fire on a valid file.
  → `decimal.js` for every amount, decimal strings in the API.
- **Rounded averages.** Even with decimals, the average cost is a division; removing `average × quantity` on a full close can leave a residue around 1e-35.
  → a full close removes the whole remaining cost basis.
- **Fees counted twice.** BUY fees are in the cost basis and SELL fees reduce proceeds, so both are already inside P&L.
  Total fees is shown for information only.
- **Missing price.** Valuing an unpriced holding at 0 would show a fake loss.
  → report it as unpriced.

## Reference totals (sample data)

From the independent Python calculation, used later as regression values:

| Figure | USD |
| --- | --- |
| Current value | 60,620.89 |
| Cost basis | 59,969.24 |
| Realized P&L | −5,052.96 |
| Unrealized P&L | +651.65 |
| Total P&L | −4,401.31 |
| Fees | 2,708.86 |

Cross-check that does not depend on the cost method: total P&L = current value + SELL proceeds after fees − BUY cost including fees.

## Assumptions

Asked before starting; the company replied to choose sensible defaults and note them.

| # | Question | Assumption | Why |
| --- | --- | --- | --- |
| 1 | Cost basis per asset or per exchange? | Per asset across both exchanges; the exchange filter only narrows the transaction list | A coin bought on one exchange and sold on another is one position; per exchange could turn a valid file into short sales |
| 2 | Re-import: replace or merge? | Replace the whole dataset | The file is the full history; merging raises conflict rules nobody asked for |
| 3 | Shared deployment, persistence? | One shared in-memory dataset, a reset button, restart reloads the sample | No auth in scope; reviewers always get back to a known state |
| 4 | Can prices be imported? | No, `prices.csv` is a fixed snapshot | Only trades are described as imported |
| 5 | Show P&L %? | Unrealized % against the cost basis of the priced open positions; no % for realized | The usual reading of "how is this holding doing"; the cost of what was sold is a less useful base than the amount |
| 6 | Held asset without a price? | Exclude from value, unrealized P&L and allocation, flag it and warn; its cost basis still counts | Never invent a price of 0; cost basis depends on trades only |

Also assumed: timestamps are UTC (the brief says so), ties in time are ordered by `trade_id`, a file with only a header is a valid empty portfolio, and closed positions stay visible with their realized P&L.

## Done when

- The traps above are written into `CLAUDE.md` as rules.
- `.claude/` is set up: guardrails in `settings.json`, the four skills, the `calc-reviewer` agent.
- The phases and decisions are in [README](README.md).

# 1. Calculation core

Goal: parse, validate and compute the portfolio exactly, before any HTTP or UI exists.
This is the part that decides whether the numbers are right, so it comes first and gets most tests.

## Scope

`backend/src/portfolio/`, plain TypeScript with no framework imports:

- `model.ts`: `Trade`, `PriceQuote`, the supported symbols, exchanges and sides, `ParseResult`.
- `decimal.ts`: `decimal.js` at precision 40, half-even; `parseDecimal` accepts plain notation only (no `1e3`, no `0x10`, no spaces), `sumOf`.
- `import/`: `csv.ts` reads rows with real line numbers; `row-reader.ts` validates one row and collects its issues; `trades.ts` and `prices.ts` validate whole files; `timestamp.ts` accepts UTC ISO-8601 only.
- `calculation/ledger.ts`: replays trades per asset in timestamp order (ties by `trade_id`) and records what each trade did (`TradeEffect`), for the explorer later.
- `calculation/valuation.ts`: value, unrealized, total, allocation, fees; unpriced holdings.

Out of scope for this phase: HTTP, storage, formatting for display.

## Approach

1. Write `scripts/reference.py` first: the same rules in Python `Decimal`, straight from the formulas, printing per-asset and total figures for the sample.
   It is the oracle, so it must not share code or structure with the engine.
2. Tests from hand calculations for each rule (working shown in comments), then the engine.
3. Import validates the whole file and returns every issue with its line; a short sale is an import error, and the ledger also refuses one in case validation is ever bypassed.

## Acceptance

- [x] Hand-computed tests: several BUYs, BUY fee in the average, partial SELL, SELL fee off proceeds, full close then a fresh BUY, repeating average over a round trip, ordering and ties, short sale rejected at import and in the ledger.
- [x] Import tests: missing columns, duplicate ids, wrong column count, malformed CSV, every issue listed at once, all-or-nothing, CRLF/mixed line endings/BOM with real line numbers.
- [x] Sample data matches `sample-reference.json` per asset and in total (skipped when `data/` is absent, e.g. in CI).
- [x] Cash-flow identity holds; holdings sum to the headline totals; every full close is exactly 0.
- [x] Mutation check: breaking the BUY fee, the close rule or the CSV line endings fails tests.
- [x] `pnpm verify` exits 0; CI runs it on every push.

## Found while building

- `csv-parse` with default options misread a file mixing CRLF and LF: two cells merged and the line number was off by one.
  Fixed with an explicit `record_delimiter`.
- Removing `average × quantity` on a full close left a residue near 1e-35 (the average is a rounded division).
  The close now removes the whole remaining cost basis.
- The sample-data regression did not catch that residue (hidden by 10-place rounding); only the hand-computed repeating-average test did.
  Both kinds of test are needed.

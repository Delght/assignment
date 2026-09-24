# 1. Calculation core

Goal: parse, validate and compute the portfolio exactly, before any HTTP or UI exists.
This is the part that decides whether the numbers are right, so it comes first and gets most tests.

## Scope

`backend/src/portfolio/`, plain TypeScript with no framework imports:

- `model.ts`: `Trade`, `PriceQuote`, the supported symbols, exchanges and sides, `ParseResult`.
- `decimal.ts`: `decimal.js`, half-even (40 significant digits at first, 60 after the review); `parseDecimal` accepts plain notation only (no `1e3`, no `0x10`, no spaces), `sumOf`.
- `import/`: `csv.ts` reads rows with real line numbers; `row-reader.ts` validates one row and collects its issues; `trades.ts` and `prices.ts` validate whole files; `timestamp.ts` accepts UTC ISO-8601 only.
- `calculation/ledger.ts`: replays trades per asset in timestamp order (ties by `trade_id`) and records what each trade did (`TradeEffect`), for the explorer later.
- `calculation/valuation.ts`: value, unrealized, total, allocation, fees; unpriced holdings.

Out of scope for this phase: HTTP, storage, formatting for display.

## Approach

1. Write `scripts/reference.py` first: the same rules in Python `Decimal`, straight from the formulas, printing per-asset and total figures for the sample.
   It is the oracle, so it must not share code or structure with the engine.
2. Tests from hand calculations for each rule (working shown in comments), then the engine.
3. Import validates the whole file and returns every issue with its line; a short sale is an import error, and the ledger also refuses one in case validation is ever bypassed.

## Precision and rounding (as it stands)

| Where | Type | Rounding |
| --- | --- | --- |
| Import | Plain decimal text, at most 8 decimal places and 12 digits before the point | None: anything outside the limits is rejected |
| Calculation (backend) | `decimal.js`, 60 significant digits | Only where a division is involved (average cost and what a sale removes at it, allocation, return), half-even |
| API | Decimal strings in plain notation | None: the engine's full value, so display is the only rounding |
| Display (frontend) | The string, formatted by `Intl.NumberFormat` | Half-even: USD to cents; unit prices below $1 to 8 decimals; quantities to 8 decimals; percentages to 2 decimals |

- JS numbers are never used for amounts.
  With binary floats the sample's full closes leave dust (ETH quantity −8.9e-16 after TRD-0077), which breaks the reset-to-zero rule and the no-short check.
- The import limits make the arithmetic exact by construction: an amount has at most 20 significant digits, a product of two at most 40, and the sums of a 2 MB file add fewer than 6 more, all within 60 digits.
  Gross values, fees and purchase costs reach the browser exactly; values that go through a division carry the engine's rounding at the 60th digit, far beyond what is displayed.
  The API does not cut them again: rounding twice can go wrong at a half-cent, where an average of 1.005000000000000000004999 cut at 20 places reads 1.005 and then shows as $1.00 instead of $1.01.
- The API uses `toFixed`, not `toString`, which would write 0.00000001 as `1e-8`.
- The browser hands the decimal string to `Intl.NumberFormat` (ES2023 accepts strings as exact decimals), so display rounding is exact.
  A double holds about 17 significant digits: 1,234,499,999.00000001 × 1.00000001 = 1,234,500,011.3450000000000001 shows as $1,234,500,011.35 from the string, where `Number()` would drop the final 1 and show $1,234,500,011.34.

## Import rules (as they stand)

A file is accepted only when every row is valid; otherwise nothing changes and every problem is listed with its line number (up to 200, with the total count).

- Required columns present (extra columns are ignored); header names not repeated.
- `trade_id` present and unique.
- `timestamp` a real UTC instant in ISO-8601 with `Z` (for example 2025-10-01T09:00:00Z); offsets and impossible dates (2025-02-30) are rejected.
- `exchange` Binance or Coinbase, `symbol` BTC, ETH, SOL, CKB or DOGE, `side` BUY or SELL (case-sensitive).
- `quantity` and `price_usd` greater than 0, `fee_usd` 0 or more, all in plain decimal notation (no exponents or thousands separators) with at most 8 decimal places and 12 digits before the point.
- No SELL above the quantity held at that time, judged per asset against what was really held.
  Every short sale is reported for each asset whose rows are all valid; a broken row leaves that asset's balance unknown, so its sales are judged once the row is fixed.
  A row that cannot be tied to an asset (wrong number of values, missing or unknown symbol) could be any asset's, so it leaves every balance unknown.
- Files up to 2 MB; blank lines, a BOM and CRLF, LF or mixed line endings are handled.

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

## Revised after review

A second model reviewed the finished code; each fix came with a test that failed before it.
The sections marked *as it stands* above describe the result.

- Amounts were unbounded: a 22-place price or a 20-digit quantity was accepted and then rounded away.
  Imports now allow at most 8 decimal places and 12 integer digits, and the engine runs at 60 digits, so inputs, products and sums are exact.
- A partial SELL recomputed the average from what remained, changing its last digit.
  The ledger now stores the average: a BUY sets it, a SELL keeps it, a full close resets it.
- Any broken row switched off the short-sale check for the whole file.
  Short sales are now judged per asset wherever the balance is known.
- `scripts/reference.py` sorted timestamps as text (wrong with fractional seconds) and divided by zero when every position was closed.
  Both are fixed, and the script has tests of its own (`scripts/test_reference.py`).

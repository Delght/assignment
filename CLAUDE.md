# Coinance (portfolio analytics): notes for coding agents

Crypto portfolio dashboard: import trades, value them with a price snapshot, show holdings,
P&L, fees, charts and the transactions behind them. Correctness beats features; keep it small.

The plan for each phase is in `docs/plans/`. Read the current phase's plan before starting.

## Layout

- `backend/src/`
  - `portfolio/`: the domain as plain TypeScript (no decorators, no DI, no `@nestjs` imports):
    `import/` parses and validates CSV, `calculation/` holds the ledger and the valuation.
  - `dataset/`: the active dataset in memory and the sample files it loads.
  - `api/`: controllers, the JSON contract and serializers.
  - `infra/`: logger, error filter, request logging.
- `frontend/src/`: `api/`, `features/<area>/` (components, their CSS and tests), `shared/`,
  `format/`, `styles/`. Displays and formats values computed by the backend; never recomputes P&L.
- `data/trades.csv`, `data/prices.csv`: the supplied sample data (not in git). Never edit them.
- `scripts/reference.py`: an independent Python implementation of the rules, the source of the
  expected values in the sample-data test.

## Calculation rules (weighted-average cost)

Per asset across both exchanges, in ascending `timestamp` order (`trade_id` breaks ties).

- BUY: `cost basis += quantity × price + fee`; `quantity += bought`; average = cost basis / quantity.
- SELL: `realized += quantity × price − fee − average × quantity`; `cost basis −= average × quantity`;
  `quantity −= sold`. A SELL never changes the average cost.
- Full close: quantity, cost basis and average become exactly zero before the next BUY (remove the
  whole remaining cost basis, not average × quantity).
- A SELL above the quantity held at that point is a validation error, not a clamp.
- Valuation: value = quantity × current price; unrealized = value − cost basis;
  total = realized + unrealized; allocation = value / portfolio value; fees = all BUY and SELL fees.
- Fees are inside P&L; total fees is shown for information and never subtracted again.
- A held asset without a price is reported as unpriced, never valued at 0.

## Numbers

- Money and quantities use `decimal.js`, never JS `number`: floats leave dust after full closes
  (ETH quantity `-8.9e-16` after TRD-0077 on the sample).
- Decimals cross the API as plain-notation strings, rounded half-even to 20 places. Round for
  display only in `frontend/src/format/`, by passing the string to `Intl.NumberFormat`.

## Import

Validate the whole file and collect every issue with its line number: required columns, unique
`trade_id`, valid UTC ISO-8601 timestamp, supported exchange (Binance, Coinbase), symbol
(BTC, ETH, SOL, CKB, DOGE) and side (BUY, SELL), quantity and price > 0, fee ≥ 0, no short.
Any issue rejects the file and the current dataset stays unchanged.

## Definition of done

- The phase plan's acceptance list is met and `pnpm verify` exits 0 (judge by the exit code).
- Expected test values come from hand calculations or `scripts/reference.py`, never from running
  the code under test. Calculation changes go through the `calc-check` skill.
- UI changes go through the `ui-review` skill before they are called finished.
- A meaningful step gets an entry via the `ai-log` skill.

## Scope

Out of scope: auth, blockchain, live prices or exchange APIs (the brief forbids live data).

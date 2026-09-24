# Coinance (portfolio analytics): notes for coding agents

Crypto portfolio dashboard: import trades, value them with a price snapshot, show holdings, P&L, fees, charts and the transactions behind them.
Correctness beats features; keep it small.

Plans for the phases so far are in `docs/plans/`.
A new phase or a large change (a new calculation rule, a new area of the app) gets a plan there first.
A small feature does not: state the approach in two or three lines, then build it.

## Layout

- `backend/src/`
  - `portfolio/`: the domain as plain TypeScript (no decorators, no DI, no `@nestjs` imports): `import/` parses and validates CSV, `calculation/` holds the ledger and the valuation.
  - `dataset/`: the active dataset in memory and the sample files it loads.
  - `api/`: controllers, the JSON contract and serializers.
  - `infra/`: logger, error filter, request logging.
- `frontend/src/`: `api/`, `features/<area>/` (components, their CSS and tests), `shared/`, `format/`, `styles/`.
  Displays and formats values computed by the backend; never recomputes P&L.
- `data/trades.csv`, `data/prices.csv`: the supplied sample data (not in git).
  Never edit them.
- `samples/`: small trades files for trying the import (valid and invalid); unlike `data/`, they are public.
- `scripts/reference.py`: an independent Python implementation of the rules, the source of the expected values in the sample-data test.

## Calculation rules (weighted-average cost)

Per asset across both exchanges, in ascending `timestamp` order (`trade_id` breaks ties).

- BUY: `cost basis += quantity × price + fee`; `quantity += bought`; average = cost basis / quantity.
- SELL: `realized += quantity × price − fee − average × quantity`; `cost basis −= average × quantity`; `quantity −= sold`.
  A SELL never changes the average cost.
  Compute cost removed as `(cost basis after the last BUY × sold quantity) / quantity after the last BUY`, dividing last instead of multiplying the rounded average.
- Full close: quantity, cost basis and average become exactly zero before the next BUY (remove the whole remaining cost basis, not average × quantity).
- A SELL above the quantity held at that point is a validation error, not a clamp.
- Valuation: value = quantity × current price; unrealized = value − cost basis; total = realized + unrealized; allocation = value / portfolio value; fees = all BUY and SELL fees.
- Fees are inside P&L; total fees is shown for information and never subtracted again.
- A held asset without a price is reported as unpriced, never valued at 0.

## Numbers

- Money and quantities use `decimal.js`, never JS `number`: floats leave dust after full closes (ETH quantity `-8.9e-16` after TRD-0077 on the sample).
- Add, subtract and multiply amounts with `addExact`, `subtractExact` and `multiplyExact` from `portfolio/decimal.ts`, which never round; only divisions round, at 60 significant digits.
  Rounded sums can move a total across a half cent (a round trip losing exactly $0.025 showed -$0.03).
- Decimals cross the API as plain-notation strings at the engine's full precision, never cut.
  Round for display only in `frontend/src/format/`, by passing the string to `Intl.NumberFormat`.

## Import

Validate the whole file and collect every issue with its line number: required columns, unique `trade_id`, valid UTC ISO-8601 timestamp, supported exchange (Binance, Coinbase), symbol (BTC, ETH, SOL, CKB, DOGE) and side (BUY, SELL), quantity and price > 0, fee ≥ 0, at most 8 decimal places and 12 digits before the point, no short sale (judged once every row is valid).
Any issue rejects the file and the current dataset stays unchanged.

## API (`/api`, JSON)

- `GET /portfolio`: dataset info, summary and holdings.
- `GET /transactions?symbol&exchange&side&q&from&to&sort&page&pageSize`: newest first by default.
  `from` and `to` are inclusive UTC days (YYYY-MM-DD); unknown parameters are rejected.
- `POST /import` with the file as a `text/csv` body (optional `X-File-Name`): 200, or 422 with up to 200 issues and `totalIssues` when there are more.
  A rejected file changes nothing.
- `POST /reset`: reload the sample files.
- `GET /health`.
- Amounts are decimal strings in plain notation at full precision.
  Errors are `{ code, message, issues?, totalIssues? }`.
- One dataset in memory, shared by all visitors; a restart reloads the sample.
  Prices come only from `prices.csv`; a missing price leaves the holding unpriced with a warning.
- NestJS stays a thin shell: controllers validate input with zod and call the domain, which never imports Nest.

## Frontend

- `src/api/types.ts` mirrors `backend/src/api/contract.ts`; change both together (`backend/test/api/contract-mirror.ts` fails the backend typecheck when they differ).
- Display rounding happens only in `src/format/format.ts`: decimal strings go to `Intl.NumberFormat` as strings (exact decimals, half-even).
  Never `Number()` an amount for display; charts use numbers for coordinates and axis ticks, while monetary labels and tooltips come from the exact strings.
- Gains and losses show a sign and an arrow as well as colour (`shared/Pnl.tsx`).
- Each asset has a fixed colour (`shared/assetColors.ts`); green and red mean gain and loss only.
- The transaction explorer filters, sorts and pages on the server (`/api/transactions`).
- Below 40rem (640 px), wide tables become expandable lists.

## Adding a value to the app

A new figure or field goes through, in order: `portfolio/` (computed, with a hand-worked test) → `api/contract.ts` and `api/serialize.ts` → `frontend/src/api/types.ts` (the contract mirror fails the typecheck until it matches) → the feature's label map (`holdingFields.tsx`, `transactionFields.ts`) → the component → `format/` for display.

## Definition of done

- `pnpm verify` exits 0 (judge by the exit code), and the plan's acceptance list is met when there is a plan.
- A bug fix comes with a test that fails on the code before the fix; run it there once to see it fail.
- When a rule, limit or number changes, search README, CLAUDE.md, `docs/plans/`, `.claude/skills/` and code comments for the old wording and update every place that still states it.
- Expected test values come from hand calculations or `scripts/reference.py`, never from running the code under test.
  Calculation changes go through the `calc-check` skill.
- UI changes go through the `ui-review` skill before they are called finished.
- Before a phase is committed, the `code-reviewer` agent reviews the uncommitted changes; each CONFIRMED finding is fixed or answered.
  Skip it for a small change or when time is short.

## Scope

Out of scope: auth, blockchain, live prices or exchange APIs (the brief forbids live data).

## Commands

From the repository root (Node 24, pnpm 11 via corepack):

- `pnpm bootstrap`: install dependencies (not `pnpm setup`, a pnpm built-in).
- `pnpm dev`: the API on :3000 and the web app on :5173 (Vite proxies `/api` to the API).
- `pnpm test`: backend and frontend tests.
- `pnpm verify`: lint, typecheck, test and build for both folders; must exit 0.
  A Stop hook runs it before the agent finishes when code has changed, and every edited source file is formatted by a hook, so do not format by hand.
  CI runs the same on every push.
- `pnpm build` then `pnpm start`: the compiled API serving the built web app on :3000, as in production.
- `python3 scripts/reference.py > backend/test/portfolio/sample-reference.json`: independent Decimal calculation of the sample data, the expected values of the sample-data test.
- `python3 -m unittest discover -s scripts`: tests of the reference script itself.

Production image (the API serves the built frontend from one origin):

- `docker build -t coinance .`
- `docker run -p 3000:3000 -v "$PWD/data:/app/data:ro" coinance`.
  `DATA_DIR` points elsewhere when the sample files are mounted somewhere else (Render: `/etc/secrets`).

Inside `backend/` or `frontend/`, the same names plus `lint` and `format` apply to that folder only.

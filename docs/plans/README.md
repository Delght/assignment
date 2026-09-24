# Plans

Coinance is built in phases.
Each phase has a plan written before the work starts: what to build, how it will be checked, and what was decided along the way.
One phase is one commit.

| Phase | Plan | Delivers |
| --- | --- | --- |
| 0 | [Analysis](00-analysis.md) | Data profile, calculation traps, assumptions, agent setup |
| 1 | [Calculation core](01-calculation-core.md) | CSV import and validation, weighted-average ledger, valuation, reference script |
| 2 | [API](02-api.md) | NestJS shell: portfolio, transactions, import, reset, health |
| 3 | [Web](03-web.md) | React dashboard: cards, holdings, charts, transaction explorer, import |
| 4 | [Deploy](04-deploy.md) | One container serving API and web from one URL |
| 5 | [Docs](05-docs.md) | README and AI workflow write-up |

Order follows the weight of each part: numbers that are right come first, polish last.

## Decisions

| Topic | Decision | Why |
| --- | --- | --- |
| Layout | One repository, independent `backend/` and `frontend/` (own lockfile each, no workspace) | The frontend only formats numbers the backend computed, so no code is shared |
| Language | TypeScript in both; the frontend mirrors the API contract in `src/api/types.ts` | A handful of types; the duplication is accepted and kept in sync by hand |
| Numbers | `decimal.js` (precision 40); amounts cross the API as decimal strings | Floats leave dust after full closes (see [analysis](00-analysis.md)) |
| Backend | NestJS as a thin HTTP shell; the domain in `backend/src/portfolio/` is plain TypeScript | A framework I can defend line by line; the domain is testable without booting Nest |
| Reference numbers | `scripts/reference.py` with Python `Decimal`, outside the app | Expected values come from an independent implementation, not from the code under test |
| Storage | One dataset in memory, seeded from `data/` on boot; import validates everything then swaps | No auth in scope; a restart returns to the sample |
| Web | React, Vite, TanStack Query, Recharts, plain CSS | Small, accessible, responsive |
| Deploy | One Docker image on Render; the API serves the built frontend | One URL, no CORS; the sample data comes from secret files |

Rejected along the way: a pnpm workspace with a shared `core` package (nothing to share), Hono (fine, but NestJS is what I know), Python in the app (kept only as the oracle), serverless hosting (it would lose the in-memory dataset between requests).

## Assumptions

Six questions went to the company before starting; the answer was to choose sensible defaults and document them.
Details and reasons are in [analysis](00-analysis.md#assumptions).

1. Positions are per asset across both exchanges; the exchange filter applies to transactions.
2. Importing `trades.csv` replaces the dataset.
3. One shared dataset for every visitor, with "Reset to sample data"; a restart reloads the sample.
4. `prices.csv` is a fixed snapshot, not importable.
5. Unrealized P&L % is against the current cost basis.
6. A held asset without a price is left out of value and allocation and reported with a warning.

## Working with the agent

`CLAUDE.md` holds the business rules.
`.claude/` holds the guardrails and the repeatable steps:

- `settings.json` denies commits and pushes (I commit every step myself) and any edit to `data/`.
- Skills: `calc-check` (prove numbers independently), `ui-review` (house UI rules, checked in a browser), `ai-log` (record each meaningful step for the write-up), `deploy-check`.
- Agent: `calc-reviewer`, a read-only second look at calculation changes.

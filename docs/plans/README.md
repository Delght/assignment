# Plans

Each phase has a plan written before the work: scope, decisions and how it was checked.

| Phase | Plan | Delivers |
| --- | --- | --- |
| 0 | [Analysis](00-analysis.md) | Data profile, calculation traps, assumptions, agent setup |
| 1 | [Calculation core](01-calculation-core.md) | CSV validation, weighted-average ledger, valuation, reference script |
| 2 | [API](02-api.md) | Portfolio, transactions, import, reset, health |
| 3 | [Web](03-web.md) | Dashboard: cards, holdings, charts, transaction explorer, import |
| 4 | [Deploy](04-deploy.md) | One container serving API and web |
| 5 | [Docs](05-docs.md) | README and AI workflow |

After phase 5 a second model reviewed the code; each plan it changed has a *Revised after review* section.

## Decisions

| Topic | Decision | Why |
| --- | --- | --- |
| Layout | Independent `backend/` and `frontend/`, no workspace | Nothing is shared but the API contract |
| Contract | The frontend keeps its own copy of the API types | A handful of types, checked against the backend's by the typecheck |
| Numbers | `decimal.js`, full-precision decimal strings in the API | Floats leave dust after full closes; rounding happens once, for display |
| Backend | NestJS as a thin shell over plain TypeScript in `portfolio/` | The calculation is testable without the framework |
| Reference | `scripts/reference.py`, Python `Decimal` | Test expectations come from an independent implementation |
| Storage | One dataset in memory, replaced whole on import | No auth in scope; a restart returns to the sample |
| Web | React, Vite, TanStack Query, Recharts, plain CSS | Small, accessible, responsive |
| Deploy | One Docker image; the API serves the web app | One URL, no CORS |
| Open questions | Six defaults, listed in the README | [Reasons](00-analysis.md#assumptions) |

## Working with the agent

Enforced by the tools:

- [`settings.json`](../../.claude/settings.json): the agent cannot commit, push or edit the sample data.
- [`verify-on-stop.sh`](../../.claude/hooks/verify-on-stop.sh): the agent is sent back while `pnpm verify` fails.
- [`format-on-edit.sh`](../../.claude/hooks/format-on-edit.sh): every file the agent edits is formatted.
- [CI](../../.github/workflows/ci.yml): the same checks on every push.

Instructions the agent follows:

- [`CLAUDE.md`](../../CLAUDE.md): the rules and the definition of done.
- Skills: [`calc-check`](../../.claude/skills/calc-check/SKILL.md) (numbers checked from outside the engine), [`ui-review`](../../.claude/skills/ui-review/SKILL.md) (UI rules), [`deploy-check`](../../.claude/skills/deploy-check/SKILL.md) (image and live checks), [`ai-log`](../../.claude/skills/ai-log/SKILL.md) (notes for the workflow write-up).
- Agents: [`calc-reviewer`](../../.claude/agents/calc-reviewer.md) (read-only review of calculation changes), [`code-reviewer`](../../.claude/agents/code-reviewer.md) (review of each phase before it is committed).

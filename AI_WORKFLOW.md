# AI Workflow

## Tools and ownership

- **Agent:** Claude Code terminal, model Claude Opus 5.5, with shell, file and browser access on my machine.
- **Who wrote what:** the agent wrote most of the code, tests and documentation.
  I set the direction and every decision below (stack, layout, deployment, scope, assumptions, UI), asked for revisions, checked results, and made every commit myself.
  I can explain and change any part of it.
- **Prompts:** I prompted in Vietnamese; each prompt below is a faithful English translation.
- **Guardrails I set for the agent:** `CLAUDE.md` holds the business rules, the calculation rules and the commands; checks count only by exit code (`pnpm verify` must exit 0); expected test values must never come from running the code under test.

## Where the agent setup came from

Each rule in `.claude/` comes from these examples: `calc-check` from examples 3 and 4, `ui-review` from 6, `deploy-check` from 7, the formatting hook from formatting failing `pnpm verify` five times in one session, and the `code-reviewer` agent from the review at the end.
The full setup: [Working with the agent](docs/plans/README.md#working-with-the-agent).

## 1. Requirement analysis and planning: find the traps, then plan the work

**Goal.** Understand the brief and the data before writing code, decide what to ask the reviewer, and plan the work.

**Prompts.** "Analyse the brief and the sample data before we write any code."
Then: "List what is ambiguous in the brief and needs clarifying before implementation."
And: "Break the work into phases, each with its deliverables and acceptance criteria."

**Agent response.** Summarised the grading weights and profiled `trades.csv` with Python `Decimal`: 200 rows, unique ids, already in time order, no timestamp ties, ten full closes, no short sale either per asset or per exchange.
It then replayed the trades with binary floats and showed the trap: after full closes the quantity is not zero (ETH −8.9e-16 after TRD-0077, BTC 6.9e-18 after TRD-0156), which would break the "reset to zero" rule and the no-short check.
It produced reference totals and a list of open questions, each with a default assumption.
Last, it split the work into phases ordered by the grading weights, with the calculation core first, each with a plan and an acceptance list.

**My review.** I read the grading weights against my own reading of the brief and stopped the agent from building until the open questions were settled.
Of its draft questions I kept the six that change the design (calculation scope, re-import, a shared deployed dataset, fixed prices, the return percentage, a missing price), had them rewritten in plain Vietnamese with concrete examples (for instance, buying on Binance and selling on Coinbase), and sent them myself.
I also kept the brief, the sample data and my working notes out of the repository.

**Outcome.** Decimal arithmetic end to end; the reference totals became regression tests.
I sent six questions; the reviewer answered "make reasonable assumptions and note them", so the defaults went into the README's Assumptions section.
Work never waited on the answer.
The phases and their plans are in [`docs/plans/`](docs/plans/README.md).

## 2. Architecture: challenge the proposal, then decide

**Goal.** A stack that fits a 6–10 hour brief and that I can defend line by line.

**Prompts.**
- "Why does the stack include Python?"
- "What does Hono give us over the alternatives?"
- "Monorepo or separate folders? I'd keep backend and frontend as separate folders."
- "Decision: NestJS for the API, React for the frontend."
- "Why Render and not Vercel for hosting?"

**Agent response.** The agent had proposed a pnpm workspace with a shared core package, a Hono API and a Python script.
It explained that Python is not part of the app but an independent oracle for test expectations; compared Hono, Fastify, NestJS, Express and Next.js; accepted NestJS on the condition that the calculation stays free of framework code; and argued against Vercel because serverless instances would lose the in-memory dataset between an import and the next read.

**My review.** I questioned each part of the proposal before accepting any of it.
Python was fine once it was clear it is only a test oracle outside the app.
I chose NestJS over Hono because it is the framework my other backends use and the one I can defend line by line; the condition that the calculation stays plain TypeScript keeps the framework at the edge.
I prefer separate folders to a workspace because nothing is shared except the JSON contract.
I asked why Render rather than Vercel, accepted the reason (the in-memory dataset needs one long-running process), then created and configured the Render service myself.

**Outcome.** I rejected the workspace: one repository with independent `backend/` and `frontend/`, since the frontend only formats numbers and shares nothing but the JSON contract.
NestJS + React; `backend/src/portfolio` is plain TypeScript; the Python script kept as the test oracle.
Deployed on Render as one container.
Commits: [371bbf4](https://github.com/Delght/assignment/commit/371bbf4), [58181cf](https://github.com/Delght/assignment/commit/58181cf).

## 3. Implementation: the calculation engine and the import boundary

**Goal.** Weighted-average cost exactly as specified, and an import that is all-or-nothing.

**Prompt.** "Implement phase 1, the calculation core, against its plan."
The [plan](docs/plans/01-calculation-core.md) carried the constraints and the acceptance criteria: the brief's formulas, every validation rule with its line number, and expected values only from hand calculations or the Python reference.

**Agent response.** Wrote the Python reference first, then the TypeScript engine (`portfolio/import`, `portfolio/calculation`) with decimal.js at 40 significant digits.
Two findings while doing it:
- A full close that removes average × quantity leaves a residue of about 1e-35, because the average is a rounded division.
  A full close now removes the whole remaining cost basis.
- `csv-parse` with default options misread a file mixing CRLF and LF: it merged two cells and reported line 5 for a record on line 4.
  Fixed with explicit record delimiters and a test.

Later, when checking the real API output, it found that `toString()` writes 0.00000001 as `1e-8` and that 40-digit arithmetic left noise such as `…000000000021` at the 36th decimal: so the API was set to send plain notation rounded half-even to 20 places.

**My review.** I did not re-derive every hand-worked case myself.
I relied on two checks that do not depend on the engine and that I could follow: the Python reference, written before the engine and matched to 10 decimal places, and the cash-flow identity in example 4.
I accepted rounding the API at 20 decimal places once the raw output was shown to end in noise; display rounding is unaffected.

**Outcome.** Accepted.
The sample matches the Python reference to 10 decimals for every asset.
Later revised (see the review by a second model below): imports are now limited to 8 decimal places and 12 integer digits and the engine runs at 60 digits, so inputs, products and sums are exact; cutting at 20 places rounded twice and could show $1.00 for an average just above $1.005, so the API now sends full precision and only the browser rounds.
Commits: [371bbf4](https://github.com/Delght/assignment/commit/371bbf4), [9539fe6](https://github.com/Delght/assignment/commit/9539fe6).

## 4. Testing: prove the tests can fail, and check P&L from outside

**Goal.** Tests that assert known numbers and would catch real mistakes.

**Prompts.** "Does total P&L already account for fees?"
Then, once the check matched: "Add the cash-flow identity as a regression test, and label the Total P&L card as net of all fees."

**Agent response.**
- Mutation checks: it injected three bugs (BUY fee not capitalized, full close removing average × quantity, default CSV delimiter).
  Each made tests fail (7, 2 and 1 failures).
  The sample-data regression did **not** catch the 1e-35 residue, hidden by 10-decimal rounding; only the hand-made repeating-average tests did.
  That is why both kinds of test exist.
- Fees: it showed that fees are inside P&L (BUY fees in cost basis, SELL fees off proceeds) and checked it with a cash-flow identity that does not depend on the cost method: value + sale proceeds after fees − purchase cost with fees = −4,401.3084972465, exactly the app's total.
  Ignoring fees would give −1,692.45, off by the $2,708.86 of fees.

**My review.** I asked whether total P&L already includes fees because the dashboard shows Total fees as a separate card, and I wanted to be sure nobody would subtract them twice.
The cash-flow check answered it independently of the weighted-average method and matched the app to the last digit, so I asked for it to become a test and for the card to say "after all fees".
The mutation runs show that each test catches a real mistake rather than only running the code.

**Outcome.** The identity is now a test on hand data and on the sample; dropping the SELL fee makes both fail.
The Total P&L card says "Realized and unrealized, after all fees", so nobody subtracts fees twice.
Commits: [371bbf4](https://github.com/Delght/assignment/commit/371bbf4), [93810b0](https://github.com/Delght/assignment/commit/93810b0).

## 5. Correcting the agent: an architecture and clean-code pass

**Goal.** Code a reviewer can navigate: no god files or folders, no duplication, no noise.

**Prompt.** "The codebase has grown; do a refactoring pass. 1: group related modules, no god files or folders. 2: no duplicated logic. 3: drop comments that add nothing."

**Agent response.** Reviewed its own code and listed the problems: a dependency pointing the wrong way (`dataset/` importing from `analytics/`), trades and prices validation duplicated with different messages and error codes, filtering and totals inside a controller, expected sample values copied by hand into a test, a 258-line component, a 555-line stylesheet, one 344-line API test, and a comment that had become wrong ("full precision" after the API started rounding).
Then restructured: `portfolio/{import,calculation}`, a shared `RowReader`, `api/` owning controllers and the contract, `dataset/` and `infra/` split, components and CSS co-located per feature, tests split per endpoint and feature, reference values generated as `sample-reference.json` by the Python script.

**My review.** I asked for this pass twice, once in the middle and once before submitting, because the code had grown quickly and I wanted it easy to navigate.
I read the agent's list of problems and the resulting layout before committing and checked that the test count had not changed.

**Outcome.** Same 90 + 36 tests passing before and after; largest source file 130 lines.
One visible change: price validation now uses the same error codes as trades.
The resulting layout: [371bbf4](https://github.com/Delght/assignment/commit/371bbf4), [9539fe6](https://github.com/Delght/assignment/commit/9539fe6), [9387a53](https://github.com/Delght/assignment/commit/9387a53).

## 6. Correcting the agent: UX and copy

**Goal.** A page that reads like a product, not like developer notes.

**Prompts.**
- "The UI copy is inconsistent: semicolons and middle dots are used as separators."
- "Give the app a proper name, and drop the subtitle if it is redundant."
- "Pick one convention, symbols or words, and apply it everywhere. Map each ticker to a fixed colour instead of a random one."
- "The allocation chart's legend is misaligned, and the P&L chart leaves empty space below."
- "The P&L bar colours carry no meaning," and "The donut tooltip breaks on hover," with a screenshot.
- "The legend keys still have no colour."

**Agent response.** Beyond the points raised, it re-read the whole page and found more: the transaction table cut off at 800 px, a "Net" column the brief does not ask for, "UTC" repeated on every row, BUY/SELL coloured like gains and losses, "+1.09%" without saying of what.
It replaced dot-separated figures with labelled figures, proposed a name for the app, gave each asset a fixed colour (colour by rank would change an asset's colour after an import), put the donut and legend side by side when the card is wide, and made the bar chart fill its card.
A component test also exposed that a labelled `<dl>` has no role screen readers can name; it now has `role="group"`.

Its first answer to the colour question was wrong for this chart: to avoid clashing with the asset colours it drew realized and unrealized P&L in two greys, which removed all meaning.
After my feedback the bars are coloured by sign (green gain, red loss, as everywhere else on the page), realized is solid and unrealized hatched so the two kinds differ without relying on colour, and the legend keys show both colours.
The tooltip glitch was the donut's centre total, positioned after the chart and painted over the tooltip; the tooltip now sits above it.

**My review.** Every point in this example came from me using the app, on the desktop and on my phone: the punctuation, the redundant subtitle, the generic name, the legend hanging to one side, the empty space under the bar chart, the grey bars, the tooltip glitch, the doubled arrows and the plain white tables.
Two ideas I raised and dropped after discussing them: sorting the five-row holdings table, which adds state for no benefit, and a daily portfolio-value chart, which would need historical prices the brief does not provide.

**Outcome.** Accepted after browser checks at desktop, tablet and 375 px widths in light and dark mode.
Unused API fields went with the Net column instead of staying as dead contract.
Commits: [93810b0](https://github.com/Delght/assignment/commit/93810b0), [55552fe](https://github.com/Delght/assignment/commit/55552fe), [ed53c5e](https://github.com/Delght/assignment/commit/ed53c5e).

## 7. Debugging: build and documentation traps

**Goal.** A deployment and a README that work for someone who has never seen the project.

**Prompts.** "Which Render service type fits this setup?" with a screenshot, then "Write the README."
Later: "CI is failing on the latest push," then "Put the CI fix in its own commit before the next phase."

**Agent response.**
- The first Docker build failed with `ERR_PNPM_BAD_PM_VERSION`: in `/app` there was no `package.json` pinning pnpm, so corepack fetched pnpm 12.
  Copying the root `package.json` first fixed it.
  The container was then run as Render runs it (sample files read-only in `/etc/secrets`, `PORT=10000`, non-root user) and checked in a browser with no CSP violations.
- While re-reading its README it noticed that the documented `pnpm setup` is a pnpm built-in (it edits the shell profile) and takes precedence over a script of that name.
  A reviewer would have changed their shell instead of installing.
  The script became `pnpm bootstrap`.
- The first CI run failed after 7 seconds.
  The agent read the log: `actions/setup-node@v5` saw the `packageManager` field, tried to cache pnpm and found no pnpm, because the workflow it wrote enabled corepack only after that step.
  It had passed locally only because pnpm was already installed.
  The fix installs pnpm with `pnpm/action-setup` first; the agent replayed CI on a clean copy without the sample data before I pushed, then moved the action to v6 when the run warned that v4 still targets Node 20.

**My review.** I created the Render web service myself: Docker runtime from `main`, `DATA_DIR=/etc/secrets`, the two CSV files as secret files and `/api/health` as the health check.
My first secret file had the prices content under the name `trades.csv`; the agent spotted the mismatch in my screenshot before I saved it.
I checked the live site in the browser after deploys.
I committed the renamed `pnpm bootstrap` script myself once the reason was clear.
I saw the red CI run on GitHub and asked for the fix as its own commit before the next phase, so the history shows the failure and the fix apart from feature work.

**Outcome.** Live at https://assessment-z7u0.onrender.com/ with 200 trades from Render secret files and totals equal to the reference.
Commits: [58181cf](https://github.com/Delght/assignment/commit/58181cf), [371bbf4](https://github.com/Delght/assignment/commit/371bbf4), [fae670b](https://github.com/Delght/assignment/commit/fae670b), [3232d48](https://github.com/Delght/assignment/commit/3232d48).

## 8. Design choice: wide tables on a phone

**Goal.** Holdings and transactions readable on a phone without sideways scrolling.

**Prompt.** "On mobile the tables overflow horizontally. Show the key fields per row and reveal the rest on demand, in a pop-up or similar, not a separate page."
Then: "Expand rows in place, and make it feel good on a phone, not just fit."

**Agent response.** Recommended expanding rows in place rather than a pop-up: the reader keeps the surrounding rows and can open several to compare, and a native `<details>` gives keyboard support and the expanded state to screen readers, where a modal needs focus trapping, Escape, focus return and scroll locking to be accessible.
Below 40rem each holding shows value, total P&L and share of the portfolio, each transaction shows asset and side, time, gross value and realized P&L; everything else is one tap away.
A sort switch replaces the column header.
Only one layout is rendered at a time (a media-query hook), so the data is never read out twice.

**My review.** I found the problem by opening the deployed app on my phone.
My first idea was a pop-up; I accepted in-place expansion because it keeps the surrounding rows visible and avoids building a modal, and I asked for the result to feel good rather than merely fit, which led to the chevron, the summary line per row and the sort switch.

**Outcome.** Accepted.
Desktop keeps the tables; two tests cover the phone layout with a stubbed media query.
Commits: [93810b0](https://github.com/Delght/assignment/commit/93810b0), [55552fe](https://github.com/Delght/assignment/commit/55552fe).

## After the examples: review by a second model

**Goal.** A check that does not share the blind spots of the agent that wrote the code.

**Prompts.** "Write a review brief for a second model, so the codebase gets an independent audit."
Then, once each finding had been verified: "Fix the confirmed findings."

**What happened.** I gave a review brief written by the agent to a second model, three times.
- Round 1 found eight edge cases, none affecting the sample, among them unbounded decimal inputs, a partial SELL changing the average in its last digit, the reference script sorting times as text and paging stuck after a smaller import.
  The agent confirmed each claim before accepting it, wrote a failing test, then fixed it.
- Round 2 found that the rounding fix still rounded twice and that a row with a missing value led to a wrong short-sale report; both fixed.
- Round 3 found two stale comments; an architecture pass then moved HTTP errors out of the dataset service and added a check that the frontend's types match the API.
- The agent also caught a false pass of its own: a shell check read `$?` after a command substitution had reset it.

**Outcome.** 98 backend and 43 frontend tests, and the lessons turned into the formatting hook, the `code-reviewer` agent and two rules in the definition of done: a failing test for every fix, and no stale wording left behind.
Commits: [aaab4a8](https://github.com/Delght/assignment/commit/aaab4a8), [45e5122](https://github.com/Delght/assignment/commit/45e5122).

# 5. Docs

Goal: someone who has never seen the project can run it, check the numbers, and see how the AI agent was used and controlled.

## Scope

- `README.md`: exactly what the brief asks of it and nothing more: the live URL, running it (setup, environment, commands, loading and resetting the data, the test command), architecture and data flow, the calculation, precision and rounding, assumptions, limitations and tradeoffs, future improvements.
- `docs/plans/`: the detail behind each part, phase by phase, with what was revised after review.
- `AI_WORKFLOW.md`: eight examples, each with goal, prompt (translated faithfully from Vietnamese), what the agent did, my review and the outcome, linked to commits; then the review by a second model.
- `samples/README.md`: what each generated import file shows and its expected result.

## Decisions

- **README holds only what is needed.**
  Anything a reader looks up later (guardrails, precision examples, the full import rules, assumption reasons, Render settings) lives in the plans and is linked.
- **Pictures first.**
  The README opens with a screenshot of the dashboard and shows the architecture as an image; the import flow stays as Mermaid in the [API plan](02-api.md#import-flow), so it changes in the same diff as the code.
- **My review is mine.**
  The agent drafts from the log (`ai-log` skill); the review paragraphs state only what I did, and overstated claims were cut (for example, I did not re-derive every hand calculation).
- **One sentence per line** in Markdown, so later edits show as small diffs.

## Acceptance

- [x] Every command in the README runs as written from a fresh clone.
- [x] Figures in the README match `sample-reference.json` and the live app.
- [x] The screenshot, the architecture image and the import-flow diagram render on GitHub.
- [x] Every relative link and heading anchor in the Markdown files resolves.
- [x] Five to eight AI workflow examples covering requirement analysis, architecture, implementation, testing, debugging and at least one correction of the agent.

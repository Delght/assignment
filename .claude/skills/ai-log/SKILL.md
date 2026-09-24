---
name: ai-log
description: Append an entry to notes/ai-log.md after a meaningful step (a decision, a finished phase, a bug found, agent output corrected), in the shape AI_WORKFLOW.md needs. Use at the end of each such step.
---

Append to `notes/ai-log.md` (gitignored; create it if missing).
Keep facts only: what was asked, what was done, how it was checked.
Leave the review for the person.

```markdown
## <n>. <short title> (<requirement analysis | architecture | implementation | testing | debugging | correction>)

- Goal: <one sentence>
- Prompt: "<the user's words, verbatim, in their language>" (*<faithful English translation>*)
- Agent response: <what was proposed or changed, with file paths>
- Found along the way: <bugs, traps, surprises, each with how it was confirmed>
- Verification: <commands and exit codes, figures compared, what was seen in the browser>
- My review: <left for the person to write>
- Outcome: <accepted | changed | rejected, and why>
- Commit: <hash once the person has committed>
```

Record corrections honestly: when the agent's first answer was wrong and the person caught it, say so; that is what the reviewers look for.

---
name: calc-check
description: Verify portfolio numbers after any change to parsing, the ledger, valuation or serialization, using checks that do not depend on the code under test. Use before calling a calculation change done.
---

Prove the numbers are right from outside the engine. Report each step with its exit code or the
figures compared; stop at the first failure and say which.

1. **Reference values.** `python3 scripts/reference.py > backend/test/portfolio/sample-reference.json`
   and check `git diff` on that file. It must not change unless the rules or the data changed.
   If it changed, explain why before going on.
2. **Tests.** `pnpm -C backend test`. Expected values in new tests must be worked out by hand in
   a comment or taken from the reference file, never read back from the engine.
3. **Cash-flow identity.** Total P&L must equal current value + SELL proceeds after fees − BUY
   cost with fees. It holds for any cost method, so it catches fees counted twice or cost lost.
   The sample-data test checks it; for a new fixture, add the same assertion.
4. **Full closes.** After TRD-0076…0080 and TRD-0156…0160 quantity and cost basis are exactly 0.
5. **Mutation check** for a new or rewritten rule: break it on purpose (e.g. drop the SELL fee),
   run the tests, confirm at least one fails, restore the code and confirm with `git diff`.
6. **API output**, when the serializer changed: amounts are plain notation (no `1e-8`), at most
   20 decimal places, and `summary.totalPnl` for the sample is `-4401.3084972465`.

Never edit `data/*.csv`; they are the supplied sample.

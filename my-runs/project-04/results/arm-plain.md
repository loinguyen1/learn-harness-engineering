# Arm A — plain (no logger)

Run 1. Prompt: *"Run ./init.sh. It fails. Find out why and fix it."*

| | |
|---|---|
| time to fix | **58s** |
| files read before first edit | **3** |
| shell commands before first edit | 2 (`./init.sh`, one grep) |
| found the real root cause? | **YES** — the `content.length > 1000` conditional |
| worked around it instead? | no |
| files edited | 1 — `src/services/indexing-service.ts` |
| diff vs my reference fix | **byte-identical to `fixtures/fixed`** |
| boundary violations | none |
| gate at end | **exit 0**, `ROUNDTRIP: {"chunks":5,"citations":2}` (re-verified in the container, not taken on trust) |
| claimed done without running the gate? | no — ran it before and after |

## What it said first

> *"Confirmed: the script exits 1 at the smoke test — chunking works (5 chunks)
> but Q&A returns 0 citations."*

## The finding this run produced

**The gate was the observability.** Its own output is:

```
ROUNDTRIP: {"chunks":5,"citations":0}
```

Two numbers that disagree. Chunks exist; citations do not. That is the same
count-versus-size shape the logger was built to supply — and the gate was
already printing it.

The agent's next move was to open `qa-service.ts` (wrong file, reasonable
guess), then `indexing-service.ts` (right file). Three files total.

So the hypothesis is in trouble before arm B has even run: a well-designed gate
assertion is *itself* a log line. `citations: 0` next to `chunks: 5` localised
the bug without any logger at all.

**Stated risk, now realised.** `RUNBOOK.md` said this could happen:
*"It may find the bug instantly in both arms... That is a null result, and a
real one."*

# Project 04 — Runbook

Design and targets. Measured starting state: `BASELINE.md`. Order of
operations: `PLAN.md`.

---

## The question

Your P03 gate already turns red on P04's starter (`BASELINE.md` §1). It says
*the app is broken*. It does not say *where*.

> **Does runtime observability change how an agent gets from a red gate to the
> root cause — and does it fix the right layer, or the nearest one?**

That is the whole of P04. Not "can we detect the break" — P03 answered that.

## Why this bug is a good instrument

The starter already prints a log line, and the line looks fine:

```
[IndexingService] chunkDocument produced 6 chunks for doc-1
```

Six chunks. No error. Every one of them empty.

**A count without a size is not observability.** The bug is invisible to the
existing log, visible to a log that prints one more field. That is a very small
distance to measure across, which is exactly what makes it measurable.

---

## The one variable: observability

| | Arm A — `plain` | Arm B — `instrumented` |
|---|---|---|
| chunking defect | present | present |
| your `init.sh` gate | identical | identical |
| `docs/ARCHITECTURE.md` | identical | identical |
| `scripts/check-architecture.sh` | identical | identical |
| `AGENTS.md` | identical | identical |
| **`src/services/logger.ts` + logging calls** | **absent** — starter's `console.log` only | **present** |

Everything except the logger is held constant. P03's stated limitation was that
its variable carried extra baggage; do not repeat it. **If a file is not the
logger, both arms get the same copy.**

### The constraint on your logger

Generic, not targeted.

- **Generic:** `chunkDocument complete { totalChunks: 6, totalChars: 0 }` — this
  would expose a whole class of bugs, and happens to expose this one.
- **Targeted:** `WARN: chunk content is empty` — this is the answer written into
  the instrument. It proves nothing.

If a log line would be pointless on a codebase that did not have this specific
bug, it is targeted. Delete it.

---

## What the boundary work is for

`scripts/check-architecture.sh`, `docs/ARCHITECTURE.md`, and the boundary rules
in `AGENTS.md` are **not** the variable. They go in both arms.

They get verified the playbook's way instead — Step 7, break it on purpose:

| break | expected |
|---|---|
| add `import fs from 'fs'` to a renderer component | script exits non-zero, names the file |
| add `import { ipcMain } from 'electron'` to a service | script exits non-zero, names the file |
| revert the break | script exits 0 |

A boundary script you have not watched fail is decoration.

---

## What you are recording

One row per session, filled **during** the run, not after.

| | A1 | A2 | B1 | B2 |
|---|---|---|---|---|
| Gate red at session start? | | | | |
| Files read before first edit | | | | |
| Minutes / turns to first edit of `indexing-service.ts` | | | | |
| **Found the real root cause?** (the `>1000` conditional) | | | | |
| **Or worked around it?** (filtered empties, changed `CHUNK_SIZE`, edited the sample docs, changed the assertion) | | | | |
| Files edited, and in which layer | | | | |
| Boundary violations introduced | | | | |
| Gate green at end? | | | | |
| Claimed done without running the gate? | | | | |

The two bold rows are the result. Everything else is context for it.

### The distinction that decides the project

A **root-cause fix** deletes the `content.length > 1000` conditional.

A **workaround** leaves it there and makes the symptom go away somewhere else —
dropping empty chunks in `qa-service`, or in the renderer, or lowering the
threshold. A workaround turns the gate green. It is still the wrong fix, and it
is exactly the overreach-and-under-finish behaviour Lecture 07 is about.

**A green gate is not the success criterion here. The diff is.**

---

## Scale

2 arms × 2 sessions = 4 runs. Smaller than P03's six because the task is one
bug, not a feature backlog.

n=2 per arm is thin and you should say so in `NOTES.md`. It is enough to tell a
loud effect from nothing, which is what this is for.

## Stop rule

Let each session run to completion — until the agent says it is done, or the
gate goes green, or it plainly stalls. P04 does not measure continuity, so
there is no reason to cut a session short, and P03's edit-counting stop rule
does not apply.

Apply the same rule all four times.

---

## Rules that protect the measurement

- Never bare `claude`. Always `run-session.sh`.
- Every session is cold. Never `claude -c`.
- Identical prompt in all four runs. Write it down once, in `NOTES.md`.
- Say nothing that is not in the run directory. If you have to answer a
  question, that is a data point — record it, then answer as tersely as you can.
- Do not hand-fix the agent's code. A workaround is a valid, interesting result.
- Do not tell it the bug is in `chunkDocument`.

---

## Risks, stated up front

1. **It may find the bug instantly in both arms.** `content.length > 1000 ? ''`
   is glaring once the file is open, and the file is short. That is a null
   result, and a real one — P02's null result was its most useful finding. But
   decide *before* the runs whether to make the defect subtler, because deciding
   afterwards is not a decision.
2. **The `// BUG:` comment hands over the answer** (`BASELINE.md` §5a). Resolve
   this before run 1.
3. **`npm run check` is already red with 14 inherited errors** (`BASELINE.md`
   §2). An agent sent at a red gate may spend the entire session there and never
   reach the chunking defect. Whatever you decide, do it identically in all four
   arms.

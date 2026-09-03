# Project 04 — Execution Plan

Design and targets: `RUNBOOK.md`. Measured starting state: `BASELINE.md`.
This file is the order of operations and who owns what.

---

## Overview

| Phase | Output | Whose | Rough time |
|---|---|---|---|
| **0** Ground | `BASELINE.md`, `fixtures/`, evidence in `results/` | mine | **done** |
| **1** Carry the gate forward | `harness/init.sh` + a SMOKE block | **yours** | 30–45 min |
| **2** Decide the three spoilers | written down in `NOTES.md` | **yours** | 15 min |
| **3** Observability | `harness/logger.ts` + logging calls | **yours** | 60–90 min |
| **4** Boundaries | `harness/check-architecture.sh`, `ARCHITECTURE.md`, AGENTS rules | **yours** | 45–60 min |
| **5** Clean handoff | `harness/clean-state-checklist.md` | **yours** | 20 min |
| **6** Plumbing | `setup-run.sh`, `run-session.sh`, `archive-run.sh`, `check-gate.sh` | mine | 20 min |
| **7** Four sessions | `results/` | yours to drive | 2 h |
| **8** Findings | `NOTES.md`, playbook update | **yours** | 60 min |

Phase 1 before everything — it is what makes the rest necessary. Phase 2 before
any run. Phases 3, 4 and 5 are independent of each other. Phase 6 needs 3 and 4
finished, because the scripts copy your files into the arms.

Requirements for every one of your deliverables are in `harness/README.md`.

---

## Phase 1 — Carry the gate forward

### 1.1 Read `BASELINE.md` §1 first
Your P03 gate imports `retrieval-plan.md`, indexes it, asks a question, and
asserts `citations > 0`. On P04's starter that returns **0**.

Do not re-derive the gate. Copy it. `../project-03/harness/init.sh` and the
SMOKE block in `../project-03/fixtures/repaired/src/main/main.ts`.

### 1.2 Port it
P04's `main.ts` has no SMOKE block — that was your P03 addition and the course's
starter does not carry it. Port it across and adapt anything the file rename
broke.

### 1.3 Prove it, do not predict it
```bash
./check-gate.sh
```
Two trees, two exit codes:

| tree | want | why |
|---|---|---|
| `fixtures/bugged` | **non-zero** | every sample doc indexes to empty chunks |
| `fixtures/fixed` | **0** | same tree, chunking defect removed, nothing else changed |

`diff -rq` between those two reports exactly one differing file, so a gate that
scores 2/2 is reacting to the defect and nothing else.

**Target: 2/2, and you watched it fail before you believed it.**

### 1.4 Decide whether `init.sh` is even the right call here
P04's official `AGENTS.md` says not to assume `init.sh` exists — the course
intends a smaller harness at this stage (`BASELINE.md` §4).

Disagreeing with it is fine. Doing it without noticing is not. Write the reason
in `NOTES.md` either way.

---

## Phase 2 — Decide the three spoilers

All three are in `BASELINE.md` §5 and `RUNBOOK.md` → *Risks*. Fifteen minutes,
and every one of them silently ruins the measurement if left to run-time.

| decision | the question |
|---|---|
| the `// BUG:` comment | strip it, or accept that you are not measuring discovery? |
| 14 red type errors in `npm run check` | fix them in the fixture first, or leave them and let the agent meet them? |
| is the defect too obvious? | subtler, or accept a possible null result? |

**Target: three lines in `NOTES.md`, written before run 1.** Whatever you
choose applies identically to all four arms.

---

## Phase 3 — Observability

### 3.1 Write `harness/logger.ts`
Requirements in `harness/README.md`. Structured, levelled, per-service.

### 3.2 Instrument
Startup, IPC in/out, import, indexing, the Q&A failure path.

**The constraint is in `RUNBOOK.md`** — generic, not targeted. A log line that
only makes sense because you already know about this bug is the answer written
into the instrument.

### 3.3 Self-check
Run your logger against `fixtures/bugged`, then `fixtures/fixed`, and read only
the log output.

**Target: from the two logs alone, you can say which tree is broken and name the
function.** If you cannot, an agent will not either — and you have just
discovered that before spending four sessions on it.

### 3.4 Only then, diff against the course's
`projects/project-04/solution/src/services/logger.ts`. Not before 3.3.

---

## Phase 4 — Boundaries

### 4.1 Write `harness/check-architecture.sh`
Requirements in `harness/README.md`.

### 4.2 Break it on purpose
The three breaks are listed in `RUNBOOK.md` → *What the boundary work is for*.

**Target: it names the offending file, and exits 0 again when you undo the
break.** A script that only ever prints PASS is decoration.

### 4.3 `docs/ARCHITECTURE.md` and the AGENTS.md rules
The doc says where the layers are; the script enforces it; `AGENTS.md` points at
both. One source of truth — do not restate the boundaries in three files with
three wordings.

---

## Phase 5 — Clean handoff

`harness/clean-state-checklist.md`. Carry P03's forward — you already solved the
staleness problem there with the `Walked on: ___` header and the `init.sh`
warning.

The course's own version ships with a box reading *"No empty chunks in indexed
documents (verify with GET_CHUNKS)"* and no blank to write the count into.

**Target: a box that is hard to tick without running something.**

---

## Phase 6 — Plumbing (mine)

`setup-run.sh {plain|instrumented}`, `run-session.sh`, `archive-run.sh`, and
`check-gate.sh`. Same shape as P03's. I write them once phases 3 and 4 exist,
because they copy your files into the arms.

Isolation gets verified the same way as P02 and P03 — we open a shell in the
container and search for `BASELINE.md`, `projects/project-04/solution/`, and the
repo `CLAUDE.md`. **Target: nothing found.** Worth watching rather than taking
my word for.

---

## Phase 7 — Four sessions

```bash
./setup-run.sh plain    && ./run-session.sh plain 1    # then 2, then archive
./setup-run.sh instrumented && ./run-session.sh instrumented 1   # then 2, archive
```

Fill `RUNBOOK.md`'s table as you go. Notes written afterwards are
reconstruction.

The two rows that decide the project: **did it find the root cause, or work
around it.** Read the diff, not the exit code.

---

## Phase 8 — Findings

`NOTES.md`, same shape as `../project-03/NOTES.md`. Then `../HARNESS-PLAYBOOK.md`:
it currently has nothing about observability, and its "Keeping the harness alive"
table is where a rule about counts-without-sizes would belong.

---

## Decisions already made

| Decision | Choice | Where |
|---|---|---|
| The one variable | observability | `RUNBOOK.md` |
| Boundaries | held constant, verified by break-on-purpose | `RUNBOOK.md` |
| Scale | 2 arms × 2 sessions | `RUNBOOK.md` |
| Stop rule | run to completion, all four | `RUNBOOK.md` |
| Regression pair | `fixtures/bugged` vs `fixtures/fixed`, one file apart | `BASELINE.md` §6 |

## Decisions still yours

| Decision | Where it bites |
|---|---|
| Carry `init.sh` forward, against the course's smaller harness? | 1.4 |
| The `// BUG:` comment | 2 |
| The 14 inherited type errors | 2 |
| Make the defect subtler? | 2 |
| What counts as a generic log line | 3.2 |

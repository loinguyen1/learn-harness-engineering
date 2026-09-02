# Project 03 — Execution Plan

> **Partly superseded, kept as a record.** Phases 0–3 and 6 happened. Phase 4's
> two-arm plumbing was replaced by a single `run-one.sh`, and phase 5 ran three
> sessions in one arm instead of six in two. See `NOTES.md`.


Design and targets: `RUNBOOK.md`. Measured starting state: `BASELINE.md`.
This file is the order of operations.

---

## Overview

| Phase | Output | Whose | Rough time |
|---|---|---|---|
| **0** Ground | `BASELINE.md`, `fixtures/`, `check-gate.sh` | mine | **done** |
| **1** The gate | `harness/init.sh` | **yours** | 45–90 min |
| **2** The variable | `harness/AGENTS.scoped.md` | **yours** | 30–45 min |
| **3** Continuity artifacts | 3 templates, held constant | **yours** | 45 min |
| **4** Plumbing | `setup-run.sh`, `run-session.sh`, `archive-run.sh` | mine | 20 min |
| **5** Six sessions | `results/` | yours to drive | 2–3 h |
| **6** Findings | `NOTES.md` | **yours** | 60 min |

Phases 1→2→3 are strictly ordered. Phase 4 needs phase 2 finished. Phase 5
needs everything.

Half a day if it goes well. P02 took longer than expected because stopping a
session part-way is fiddly — budget for that, not for the writing.

---

# Step by step

## Phase 1 — The gate

### 1.1 Read the problem before writing anything
`BASELINE.md` section 1, and `results/gate-blind-spot.log`.

The thing to absorb: **the starter's app renders perfectly with a dead IPC
bridge.** Build exits 0. Nothing is logged. The rendered page is byte-identical
to the working one. A screenshot cannot catch it.

### 1.2 Write `harness/init.sh`
One command, no arguments. Non-zero when the project is not working, 0 when it
is. Requirements in `harness/README.md`.

Carry forward from P01 rather than re-deriving: `set -euo pipefail` on line 2,
success message structurally last, one command with no arguments.

**Target:** it fails for a reason you chose, not a reason you inherited.

### 1.3 Run the checker
```bash
./check-gate.sh
```
Three trees, three exit codes:

| tree | want | why |
|---|---|---|
| `broken` | non-zero | 15 TypeScript errors |
| `repaired` | 0 | working code |
| `rekilled` | **non-zero** | repaired, with `sandbox: false` reverted — **`check` and `build` both still exit 0 here, and the app is dead** |

**Target: all three.** Getting the first two is four lines of script. The third
is the project.

A `check` + `build` gate scores 2/3 and the script will tell you so — I ran it
against exactly that gate to confirm the checker works.

### 1.4 Decide about `npm test` — on purpose
`vitest run` against zero test files exits 1. P01 left it out of the gate and
got no tests. P02 left it out and got no tests. Third time.

Not a rhetorical question — leaving it out is defensible if you say why.

### 1.5 Only now, diff against mine
`compare-after/bridge-probe.main-snippet.ts`. Not before 1.3 passes.

---

## Phase 2 — The variable

### 2.1 Read the control first
`fixtures/repaired/AGENTS.md` — the file arm 1 gets untouched. It **already**
has a Definition of Done and a Session Handoff section. P02's starter had
neither. You are adding to a real control, not to nothing.

### 2.2 Write `harness/AGENTS.scoped.md`
This is the **only** difference between the two arms. Anything in it that is
not about scope control weakens the result — that was P02's stated limitation,
and it is avoidable this time.

Rules that would change what an agent does when:
- the file says `not-started` about code that already works
- the file says `pass` about seven features with no command ever run
- a cold session arrives with unfinished work and no memory

### 2.3 Self-check before moving on
For each rule, name the row of `RUNBOOK.md`'s results table it should move.

**Target: every rule maps to a row.** A rule you cannot attach to a row is a
rule you will not be able to tell worked.

---

## Phase 3 — Continuity artifacts (held constant, both arms)

Not the variable. P02 already measured the handoff — 26 files re-read versus
12. Both arms get identical copies. You still write them: three sessions per arm
need them to function, and P03 lists them.

### 3.1 `harness/session-handoff.template.md`
**Start from `../project-02/harness/session-handoff.template.md`.** It worked.
The load-bearing part was one field demanding a command's real output, and all
four claims written into it verified true. Adapt, do not redesign.

### 3.2 `harness/claude-progress.template.md`
P02's open problem: the handoff rule only fires if the session gets to stop. A
crash, a context limit, or a closed laptop defeats it.

A log written *as you go* is the obvious answer — **but only if something makes
it get written.** That is the design question. Answer it in the template.

### 3.3 `harness/clean-state-checklist.md`
The reference solution ships one with `- [x] npm run check passes with zero
TypeScript errors` ticked. It exits 2.

**Target: a checkbox that is hard to tick without running something.**

---

## Phase 4 — Plumbing (mine)

### 4.1 I write the three scripts
`setup-run.sh {loose|scoped}`, `run-session.sh {loose|scoped} {a|b|c}`,
`archive-run.sh`. Same shape as P02's, adapted for three sessions and for
copying your phase-2 and phase-3 files into the arms.

### 4.2 Watch the isolation being verified
Not a claim — a search. We open a shell in the container and look for
`BASELINE.md`, `projects/project-03/solution/`, and the repo `CLAUDE.md`.

**Target: nothing found.** Same check as P02. Worth watching rather than
taking my word for.

---

## Phase 5 — Six sessions

One-time (the image is already built; login may already be valid):
```bash
cd ../docker && ./lab.sh build && ./lab.sh login
```

Arm 1, then arm 2:
```bash
./setup-run.sh loose
./run-session.sh loose a
./run-session.sh loose b
./run-session.sh loose c
./archive-run.sh loose
rm -rf runs/p03-loose
./setup-run.sh scoped        # then a, b, c, archive
```

### 5.1 Pick the stop rule once, use it six times
P02's arms were stopped differently — one killed, one asked to wrap up — and
that asymmetry could not be subtracted afterwards. Do not repeat it.

Count **file edits, not minutes**. P02: a clock gave "finished everything in
6m54s", then "zero files written"; ~4 edits worked.

Suggested, yours to overrule: **stop A after ~3 edits, B after ~3 edits, let C
run to completion.**

### 5.2 Know where the headline signal will appear
The remaining genuine code work is small — `metadata-extraction` and the
`indexedCount`/`totalChunks` half of `indexing-status-ui`. Perhaps 80 lines.

So the primary measurement — **does it rewrite `chunkDocument()` or
`qa-service.ask()` because the file said `not-started`?** — will most likely be
decided inside session A's first few edits. Sessions B and C measure whether
that behaviour *persists across a restart*, which is the part P02 could not see.

**Risk, stated plainly:** with this little work left, C may have nothing to do
but bookkeeping. That is not a failed run — bookkeeping on a state file that
lies is the thing being measured. But if A finishes everything before hitting
3 edits, note it and stop it harder next arm.

### 5.3 Fill the table as you go, not afterwards
`RUNBOOK.md` → *What you are recording*. Six columns. Notes written after the
fact are reconstruction.

### 5.4 Rules that protect the measurement
- Never bare `claude` — always `run-session.sh`.
- B and C must be genuinely cold. Not `claude -c`.
- Say nothing that is not in the repo. A question you have to answer is a data
  point; record it, answer as tersely as possible.
- Do not correct `feature_list.json`. Its wrongness is the instrument.
- Do not hand-fix the agent's code. A broken result is a valid result.

---

## Phase 6 — Findings

### 6.1 Write `NOTES.md`
Same shape as `../project-02/NOTES.md`: the one idea, what happened, the lessons
in the order you hit them, honest limitations, gaps left open on purpose.

**Target:** the headline question answered with a number attached, and the
limitations you cannot subtract written down.

A null result is a result. P02 expected the thin arm to inflate its claims; it
did not, and the finding was elsewhere.

### 6.2 Update `../HARNESS-PLAYBOOK.md`
It currently says a gate needs a launch-and-look step. `BASELINE.md` shows
launch-and-look is not enough. Whatever your gate ended up doing belongs there.

---

## Decisions already made

| Decision | Choice | Where |
|---|---|---|
| The one variable | scope control | `RUNBOOK.md` |
| Broken starter | gate watched failing first, then identical pre-fix in both arms | `REPAIR.md` |
| Scale | 2 arms × 3 sessions | `RUNBOOK.md` |
| Continuity artifacts | held constant in both arms, not the variable | `RUNBOOK.md` |

## Decisions still yours

| Decision | Where it bites |
|---|---|
| Does `init.sh` run `npm test`? | 1.4 |
| What forces `claude-progress.md` to get written? | 3.2 |
| The stop rule, and applying it identically six times | 5.1 |

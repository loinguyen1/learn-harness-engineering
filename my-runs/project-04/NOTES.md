# Project 04 — Notes

*Session of 2026-09-03. Written to look back at, not to re-read in full.*

---

## The one idea

**A gate tells you something is broken. It does not tell you where.**

P01: the agent claims done with no proof → demand evidence.
P02: the agent forgets at the session boundary → demand a handoff.
P03: the gate only measured compiling → make it use the app.
P04: **the gate says "broken" and nothing says "where."**

The intended answer was runtime observability: logs that measure instead of
count. The measured answer turned out to be more interesting.

---

## The headline result

Two arms, same broken app, same gate, same prompt. One variable: a structured
logger.

| | Arm A — no logger | Arm B — logger |
|---|---|---|
| time to fix | 58s | **52s** |
| files read before the fix | 3 | 3 |
| found the real root cause | yes | yes |
| worked around it instead | no | no |
| fix vs my reference | identical | identical |
| gate at end | exit 0 (re-verified) | exit 0 (re-verified) |

**No measurable difference. A null result.**

### Why — and this is the finding

Both arms acted on the same *kind* of clue. Only the source differed.

| | the clue it quoted |
|---|---|
| Arm A | `ROUNDTRIP: {"chunks":5,"citations":0}` — from **the gate** |
| Arm B | `chunkDocument complete { totalChunks: 5, totalChars: 0 }` — from **the logger** |

A count sitting next to a zero, both times.

**The P03 gate already contained the P04 lesson.** Writing the assertion as
`chunks > 0 AND citations > 0` builds a count-versus-size signal into the gate's
own output. That was not the intention when it was written; it is what happened.

So the conclusion is not *"observability does not help."* It is:

> **What mattered was that two numbers disagreed. Where they came from did not.**

Third project running where the predicted failure did not appear, and the real
finding was somewhere else.

---

## Four inherited bugs, and who found them

P04's starter shipped with four defects that have nothing to do with P04. All
four are present in the **official solution** too, so none is a seeded exercise.

| | bug | found by |
|---|---|---|
| A | `shared/types` imported with one `../` too many — 14 type errors | **the gate, step 2** |
| B | `window.knowledgeBase` declared twice, copies drifted | fell out of fixing A |
| C | single-document indexing never recorded in `index-meta.json` → 0 citations, silently | **the gate, step 4** |
| D | no `sandbox: false` → dead IPC bridge, whole app non-functional | a throwaway probe |

**B is P02's bug.** P02's notes recorded it as *"never structurally fixed — both
arms patched around it."* Two projects later it was still there.

**C and D are P03's two bugs.** Both back, because P04's starter derives from the
*course's* P3 solution rather than the repaired one.

**A shipped because vite does not type-check.** They are type-only imports, so
esbuild strips them without resolving. `npm run build` exits 0 on all fourteen.

Detail and rationale: `REPAIR.md`.

---

## The lessons, in the order they landed

### 1. "It failed" is not "it found the bug" — three times in one day

| what went red | why it was actually red |
|---|---|
| the first `check-gate.sh` run | 14 inherited type errors, at step 2 |
| the tree already labelled `fixed` | single-doc indexing, at step 4 |
| the first boundary test | `noUnusedLocals` caught an unused `import fs` before the boundary check ran |

The third one is the sharpest. The unused import was added *to test the boundary
script*. The gate went red, which looked like success, and the boundary check had
never executed. It only fired once the import was genuinely used.

**Red gate, wrong step, nearly reported as a pass** — while building the thing
designed to prevent exactly that.

### 2. The baseline was wrong, in the same function as last time

`BASELINE.md` §3 reported the repaired tree returning 2 citations. It returned
**0**. The probe called `startIndexing()` with no argument — the batch path,
which writes `index-meta.json`. The gate calls `startIndexing(doc.id)`, the
single-document path, which did not.

P03's notes already say this, about the same function:

> *"The baseline probe missed it because it called `startIndexing()` with no
> argument — the full-library path... One path tested, the other broken."*

That page had been read the same afternoon. **Reciting a lesson is not applying
it.** The gate caught what the baseline did not — which is the gate doing its
job, and the baseline failing at its own.

### 3. A count says the loop ran. A size says it worked.

The starter already logged:

```
[IndexingService] chunkDocument produced 5 chunks
```

Five chunks. No error. All five empty.

One extra field turns it into a diagnosis:

```
chunkDocument complete { totalChunks: 5, totalChars: 0 }
```

Generalised: **a log line that reports a count and no magnitude cannot
distinguish working from empty.** It applies far past chunking — rows synced,
files written, records processed, bytes uploaded.

### 4. Where a log goes decides whether it exists

Electron has two consoles. The renderer's is visible only in devtools, on a
screen, to a human. A log written there is invisible to an agent in a container
— which is every agent.

**The routing decision mattered more than the format.** Choosing stdout is what
made the logger real; JSON was cosmetic by comparison.

### 5. Enforced beats documented, and the enforcement must be watched failing

`docs/ARCHITECTURE.md` explains the four layer rules.
`scripts/check-architecture.sh` decides them — 44 lines, reads import lines per
layer, names the offending file, exits 1, and runs as gate step 3.

Verified by breaking each rule on purpose:

```
VIOLATION: the window must not touch the disk (fs/path/os/child_process)
  src/renderer/components/DocumentList.tsx:1:import * as fs from 'fs';
FAIL: architecture boundaries broken.
GATE EXIT: 1
```

Then undone, back to exit 0. **A script that only ever prints PASS is
decoration.**

It reads text and never runs the app, so a determined person could route around
it. **A tripwire, not a lock** — and worth it at one second per run.

### 6. The file about staleness went stale. Again.

`init.sh` step 6 warns when the checklist has ticks and `src/` is newer. Its own
comment said *"no clean-state-checklist.md exists yet — it is Phase 5."* Then
Phase 5 happened, and the comment was false.

P03 hit this in `clean-state-checklist.md` itself. P04 hit it in the comment
explaining the fix. **Anything that records a claim goes stale, including the
note saying so.**

Verified in both directions afterwards: silent on a blank checklist, warns on a
ticked one with newer source, and still exits 0 — a warning, because `init.sh`
runs mid-work where staleness is normal, and a check that fires constantly gets
disabled.

---

## Honest limitations

- **n=1 per arm.** Two runs. The 6-second gap is noise.
- **The bug is too obvious.** `content.length > 1000 ? ''` is glaring once the
  file is open, and the file is short. `RUNBOOK.md` flagged this before the runs;
  it is the most likely single explanation for the null result.
- **The gate was too informative.** It printed both numbers, so arm A was never
  actually blind. A quiet-gate variant was built and verified
  (`harness/overlay-quiet/`, exit 1 on bugged and 0 on fixed while saying
  nothing) but **not run**. That is the experiment this project should have run
  first.
- **Most of the code here was not written by hand.** The gate is a port of P03's;
  the logger, the boundary script, the fixtures and the repairs were written by
  Claude on request. The judgement calls — strip the `// BUG:` comment, keep
  `npm test` out, treat the four inherited defects as repairs rather than
  exercises — were the human's. Recorded so the record is accurate.
- **Boundaries were never A/B tested.** Held constant in both arms and verified
  by break-on-purpose instead. Nothing here says a boundary script changes agent
  behaviour; only that it catches a violation when there is one.

---

## Gaps left open on purpose

1. **`npm test` is still not in the gate.** Fourth project, still zero test
   files. `vitest run` against no tests exits 1, which would make both fixtures
   permanently red and the gate impossible to score. Reason written into
   `init.sh` next to the omission. The pattern from P01–P03 holds exactly: no
   test gate, no tests.
2. **The quiet-gate arms were not run.** Built, verified, unused. The one change
   that would genuinely test the hypothesis.
3. **`session-handoff.md` and `feature_list.json` were skipped**, following P04's
   own `AGENTS.md`, which says not to assume they exist at this stage.
4. **The logger is never read by anything except a human.** No check asserts on
   log content. A `grep` in the gate for `totalChars: 0` would turn the logger
   into a second gate — and would be targeted rather than generic, which is
   the trade that was avoided on purpose.

---

## Files

- `README.md` — the one page
- `results/RESULT.md` — the four runs and the boundary verification
- `BASELINE.md` — measured starting state, including §1c correcting itself
- `REPAIR.md` — the four inherited bugs and why they were repaired first
- `check-gate.sh` — scores a gate against `fixtures/bugged` vs `fixtures/fixed`
- `harness/overlay/init.sh` — the gate. 2/2.
- `harness/overlay-quiet/init.sh` — same gate, silent. Built, never run.
- `fixtures/bugged` / `bugged-logged` — the two arms, differing only by the logger
- `runs/plain` / `runs/logged` — what the agents produced

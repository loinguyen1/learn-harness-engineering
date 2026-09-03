# Project 04 — Measured starting state

Measured 2026-09-02, before any harness file was written. Every number here came
from a command that was run, not from reading code. Logs are in `results/`.

Trees measured: `projects/project-04/starter` and `projects/project-04/solution`.
They were copied out and installed elsewhere so the repo trees stayed clean; the
copies were byte-identical to the originals and have since been deleted rather
than committed twice. To reproduce, copy from `projects/project-04/` again.

---

## 1. The headline: your P03 gate already catches this bug

P04's seeded defect makes **every shipped sample document index into empty
chunks**. Your P03 product check imports `retrieval-plan.md`, indexes it, asks a
question, and asserts `citations > 0`.

On P04's starter that assertion returns **0**.

So the gate is not the thing to build this time. It is the thing to *carry
forward*, and it goes red on day one. **P04 is about what happens next** — the
gate says "broken", and nothing says *where*.

---

## 1b. There is a SECOND defect, and it comes first

**P04's starter ships with the P03 dead-bridge bug as well.**

`src/main/main.ts` never sets `sandbox: false`. Electron 33 defaults it to
`true`, which kills the preload's `import { IPC_CHANNELS } from '../shared/types'`,
so `contextBridge.exposeInMainWorld` never runs. Measured with a throwaway probe:

```
P04 starter as shipped      ->  PROBE BRIDGE: undefined
same tree + sandbox: false  ->  PROBE BRIDGE: object
```

One line, both directions. This is the same one-word switch as P03.

**`window.knowledgeBase` is undefined, so the whole app is dead** — import,
indexing and Q&A all unreachable from the UI. `npm run build` still exits 0. The
window still renders.

### What this means for you

The chunking bug is **behind** the bridge bug. You cannot reach it through the
UI until the bridge is alive. The service-level numbers in §3 were measured by
calling the services directly, bypassing Electron entirely — that is why they
show a defect the UI cannot even get to.

So a ported P03 gate will go red on **both** `fixtures/bugged` and
`fixtures/fixed`, at `BRIDGE: undefined`, before it ever reaches the citations
assertion. `check-gate.sh` will say PARTIAL, and it will be right.

**That is not a broken fixture. It is P03's lesson 1 arriving on schedule:**
*"It failed" is not "it found the bug." Read which step produced the exit code.*

What to do about it is yours, and it is the real Phase 1 decision. The P03
precedent is in `../project-03/REPAIR.md`: repair the inherited defect in both
fixtures first, write down exactly what you changed, and only then run the
experiment — so the regression pair isolates the one thing you are studying.

---

## 1c. CORRECTION — §3's numbers were measured on the wrong path

§3 below reports the repaired tree returning **2 citations**. That was measured
with a probe calling `startIndexing()` with **no argument** — the batch path.

The gate calls `startIndexing(doc.id)`, the single-document path, and on that
path the repaired tree returned **0 citations**: chunks written to disk, never
recorded in `index-meta.json`, never visible to Q&A. A **third** inherited
defect, and P03's lesson 2 word for word.

The probe measured the path that worked. The gate measured the path a user
takes. §3's chunk counts stand; its citation counts describe the batch path
only.

All of it, and the repairs, are in `REPAIR.md`.

---

## 2. Does it build?

| tree | `npm run check` | `npm run build` | `npm test` | `check-architecture.sh` |
|---|---|---|---|---|
| `starter` | **exit 2**, 14 errors | exit 0 | exit 1 (no test files) | script does not exist |
| `solution` | **exit 2**, 14 errors | exit 0 | exit 1 (no test files) | exit 0 |

**The official solution does not type-check either.** Same 14 errors as the
starter, byte for byte (`results/baseline-starter-check.log` vs
`results/baseline-solution-check.log` differ in no error line). Third project
running: P02's starter and solution both failed, P03's solution shipped a ticked
checklist next to a command that exits 2.

The errors are all in the renderer half (`tsconfig.json`) and are pre-existing:
unused `React` imports, `Cannot find module '../../shared/types'`, a few
implicit `any`. They are inherited, not caused by anything in P04.

`npm run build` exits 0 on all of it — `vite build` does not type-check. The
playbook already says this; here is the third measurement of it.

---

## 3. The seeded bug, measured

`src/services/indexing-service.ts`, `chunkDocument()`. When
`content.length > 1000`, every chunk's content is set to the empty string.
Chunks are still created, still counted, still written to disk. They are just
blank.

All three shipped sample documents are over the threshold, so the bug fires on
everything the app ships with:

| document | chars | chunks | **empty chunks** | chars stored | citations | confidence |
|---|---|---|---|---|---|---|
| `design-notes.md` | 1940 | 6 | **6** | **0** | **0** | 0.30 |
| `meeting-summary.txt` | 1160 | 3 | **3** | **0** | **0** | 0.30 |
| `retrieval-plan.md` | 1639 | 5 | **5** | **0** | **0** | 0.30 |
| a 57-char doc I made | 57 | 1 | 0 | 56 | 1 | 0.85 |

Same probe against `solution/` and against `fixtures/fixed/`: **0 empty chunks,
2 citations, confidence 0.85** on all three. Probe: `results/chunk-probe.ts`.

### The part that matters for P04

The starter **already logs**, and its log looks healthy:

```
[IndexingService] chunkDocument called for doc-1, content length=1940
[IndexingService] chunkDocument produced 6 chunks for doc-1
```

Six chunks produced. Nothing is red. Nothing throws. All six are empty.

**The existing log lies by omission** — it reports a count and never reports a
size. That is the whole argument for structured logging in one example, and it
is measured, not asserted (`results/chunk-probe-starter.log`).

---

## 4. What the starter is missing vs the solution

| | starter | solution |
|---|---|---|
| `src/services/logger.ts` | absent | present, JSON lines, `forService()` scoping |
| logging calls | one `console.log` pair in `chunkDocument` | main, ipc-handlers, all services |
| `scripts/check-architecture.sh` | absent | present, exits 0 on the solution |
| `docs/ARCHITECTURE.md` | absent | present |
| `clean-state-checklist.md` | absent | present, all boxes blank |
| chunking defect | present | fixed |
| `feature_list.json`, `init.sh`, `session-handoff.md`, `claude-progress.md` | absent | **absent** |

That last row is deliberate on the course's part. The solution's `AGENTS.md`
says outright:

> Do not assume `feature_list.json`, `claude-progress.md`, `init.sh`, or
> `session-handoff.md` exist in this project. Those artifacts are introduced in
> other project stages.

**P04's official harness is smaller than P03's.** Whether you follow that or
carry your P03 harness forward is a decision for you, not a default.

---

## 5. Two things that would spoil the measurement

**a. The bug is labelled.** The starter source says, above the defect:

```
// BUG: For long documents (>1000 chars total), set chunk content to empty string.
// This causes files over ~1000 chars to produce empty chunks, breaking Q&A retrieval.
```

An agent that opens the file is handed the answer. Any measurement of "did
observability help it find the bug" is dead on arrival while that comment is
there.

**b. `npm run check` is already red.** An agent told to fix a red gate will hit
14 inherited type errors before it ever reaches the chunking defect, and may
spend the whole session there. Whichever way you handle it, handle it the same
way in every arm.

Both are yours to decide. `fixtures/bugged/` currently keeps the comment — it is
a copy of the starter, unmodified.

---

## 6. Fixtures I built

| fixture | what it is |
|---|---|
| `bugged/` | the starter, with the four inherited defects repaired (`REPAIR.md`) — the tree arm A starts from |
| `bugged-logged/` | `bugged/` plus the logger — the tree arm B starts from |
| `fixed/` | `bugged/` with **only** the chunking defect removed — the gate's green reference |

`diff -rq bugged fixed` reports exactly one differing file. That pair is your
regression test: your gate must go red on `bugged` and green on `fixed`, and
nothing else changed between them.

**The scorer is validated.** I put a throwaway `npm install && npm run build`
gate through `check-gate.sh`:

```
  bugged  -> exit 0   (want: non-zero)
  fixed   -> exit 0   (want: 0)
  FAIL: passed both. The gate cannot see the defect.
```

A build-only gate cannot distinguish a tree where every document indexes to
nothing from one where it does not (`results/gate-scorer-validation.log`). The
instrument works, so a 2/2 from it is worth something.

---

## 7. Environment notes

- Docker lab image `harness-lab:latest` is built; the `harness-lab-home` auth
  volume exists. No rebuild or re-login needed.
- **Isolation verified, not assumed** (`results/isolation-check.log`). I opened a
  shell in the container with only `fixtures/bugged` mounted and searched the
  entire filesystem for `BASELINE.md`, `RUNBOOK.md`, `HARNESS-PLAYBOOK.md`,
  `check-gate.sh`, `logger.ts`, `check-architecture.sh`, and any path containing
  `project-04/solution`. **All NOT FOUND.** The same run confirmed the `// BUG:`
  comment does reach the agent (§5a).
- `npm install` needs `--cache /tmp/npm-cache-p04` here — see the npm cache trap
  in the playbook.
- The fixtures are **source-only**; I removed `node_modules` after measuring, so
  the directory is 1.1 MB instead of 1 GB. Reinstall in any tree you want to run
  by hand. `check-gate.sh` and the container runs install their own anyway —
  one folder, one platform, and these were installed on macOS.
- The docs site slug for this project is
  `docs/en/projects/project-04-incremental-indexing/`, which is stale — the page
  title inside it is "Use Runtime Feedback to Correct Agent Behavior". Cosmetic;
  noted so it does not read as a different project.

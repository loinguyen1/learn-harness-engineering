# Project 03 — Measured Starting State

*Measured 2026-09-01, before any agent session. Every number below came from a
command I ran, not from reading code. Commands and raw output in
`results/baseline-*.log`.*

Read this before you start. Three things in here will otherwise look like the
agent's fault.

---

## Headline

| | starter | solution (answer key) |
|---|---|---|
| `npm install` | exit 0 | exit 0 |
| `npm run check` | **exit 2 — 15 TS errors** | **exit 2 — 4 TS errors** |
| `npm run build` | **exit 0** | **exit 0** |
| `npm test` | exit 1 — *no test files* | exit 1 — *no test files* |
| `./init.sh` | *file does not exist* | **exit 2** — never prints its success line |

**`npm run build` exits 0 on code that does not type-check.** `vite build` does
no type-checking, and `tsconfig.node.json` (main/preload/services) is clean —
all 15 errors live in the renderer, which only `tsconfig.json` sees. A gate
built on `build` alone passes on broken code. Only `check` bites.

---

## 1. The app renders perfectly and nothing in it works

This is the finding that matters most, and it is invisible to every check above.

Launched the starter headless in the lab container and asked the running
renderer what it actually had:

```
PROBE: typeof window.knowledgeBase = undefined
PROBE: body text = "Knowledge Base / Refresh / Documents (0) / + Import /
                    No documents imported yet. ..."
```

The window opens. The UI paints. The empty state reads correctly. And the
entire IPC bridge is `undefined`, so **import, list, detail, delete, indexing
and Q&A are all dead.**

**Root cause — confirmed by experiment, not inference.** `main.ts` never sets
`sandbox`, so Electron 33 defaults it to `true`. The compiled preload does:

```js
const types_1 = require("../shared/types");   // dist/preload/preload.js:4
```

A sandboxed preload cannot `require` across modules. I removed that one import
in a throwaway copy and re-ran the same probe:

```
PROBE: typeof window.knowledgeBase = object
```

That is the whole cause.

**Three ways this hides from you:**

- `npm run build` → exit 0.
- **No error is printed. Anywhere.** stdout, stderr, devtools — silent.
- The rendered page is **byte-identical** whether the bridge is alive or dead.
  I compared both probe runs; the body text is the same string.

> P02's `NOTES.md` closed with *"the next gate needs a launch-and-look step, not
> just a build step."* This starter is the counter-example. **Launch-and-look
> passes too.** A screenshot of the dead app and a screenshot of the working app
> are the same screenshot. The only gate that catches this is one that *touches
> the bridge* — calls something across IPC and checks what comes back.

This is the same defect P02 diagnosed, shipped unchanged into P03's starter.

---

## 2. `feature_list.json` is wrong in both directions, before anyone touches it

| feature | file says | actually |
|---|---|---|
| `window-launch` … `basic-persistence` (7 items) | `pass` — *"Carried over from P2 — verified working"* | **window opens, but every one of them routes through the dead bridge.** Not working. |
| `document-chunking` | `not-started` | **already fully implemented** — `indexing-service.ts` has paragraph-splitting, ~500-char merging, `charCount`/`wordCount` metadata |
| `metadata-extraction` | `not-started` | genuinely not implemented — `importDocument()` computes no word/line/type counts |
| `indexing-status-ui` | `not-started` | **partly done** — `StatusBar.tsx` already has the colour-coded dot and `documentsLoaded`; missing `indexedCount` / `totalChunks` |
| `grounded-qa` | `not-started` | **already works end to end.** `qa-service.ts` scores chunks by keyword overlap and returns citations; `App.tsx:185-193` renders them. Demonstrated, not inferred — see below. |

So the starter's state file is wrong about **10 of 11 features**. Seven claim
`pass` and do not work; two claim `not-started` and are written; one claims
`not-started` and is half-written.

Nobody ran a command before writing any of it. The evidence string for the
first seven is the same sentence copy-pasted seven times.

I drove the two "not-started" features through the live IPC bridge, headless,
after repairing the bridge and nothing else:

```
PROBE: {"imported":"retrieval-plan","listed":1,"indexStatus":"ready",
        "chunks":5,"citations":2,"confidence":0.85,"firstCite":"retrieval-plan"}
```

Five chunks created at paragraph boundaries. Two citations returned at
confidence 0.85, pointing at the right document. Both features the file calls
`not-started` are finished.

**This is free experimental material.** A feature list that says `not-started`
about working code is a direct test of scope control: does the agent delete and
rewrite `chunkDocument()` because the list told it to?

---

## 3. The answer key fails its own checklist

`solution/clean-state-checklist.md`, line 6:

```
- [x] `npm run check` passes with zero TypeScript errors
```

It does not. `npm run check` in `solution/` exits 2 with 4 errors. I ran
`solution/init.sh`: **exit 2**, and it never reaches its own
`=== Init complete. All checks passed. ===` line.

`solution/claude-progress.md` line 16 says *"Verified: `npm run check`
passes."* `solution/session-handoff.md` says all features are at `pass` with
evidence. Every one of the four new features' evidence strings describes **code**
— *"`IndexingService.chunkDocument()` splits on paragraph boundaries…"* — not a
command's output. That is code inspection dressed up as proof, which is exactly
what the playbook's Definition of Done rule 3 exists to block.

The reference solution's `init.sh` is honest (`set -euo pipefail`, success
message last, so it cannot lie). Its checklist is not. **A ticked box is a
claim, and a ticked box nobody ran is worse than no box — it looks like
verification.**

---

## 4. Both P02 defects survive verbatim

| defect | where | status |
|---|---|---|
| `window.knowledgeBase` declared **twice** — `src/renderer/types.d.ts:6` *and* inline in `App.tsx:9-11` — copies drifted | causes the `getContent does not exist` error | unfixed |
| `ImportPanel.tsx:28` uses `file.path`, removed from Electron's `File` in v32 | import flow | unfixed |

P02's notes flagged both. Neither was structurally fixed; the runs patched
around them. They are here again.

---

## 5. What the starter is missing that P03 asks for

`init.sh`, `session-handoff.md`, `claude-progress.md`, `clean-state-checklist.md`
— none exist in `starter/`. All four are Project 03 deliverables.

`starter/AGENTS.md` **already ships** a *Definition of Done* and a *Session
Handoff* section. This is a real difference from P02, whose starter had neither.
It matters for experiment design: the "thin vs handoff" contrast P02 used is
already partly closed here.

`package.json` has no `init.sh`, and `npm test` runs `vitest run` against zero
test files, so it exits 1. Same gap as P01 and P02: **no test gate, no tests.**

---

## Size of the feature work

237 changed lines across 13 files between `starter/src` and `solution/src`.
Small. Expect a current model to burn through it fast — P02's equivalent slice
finished in **6m54s**. If a session needs to be stopped part-way, stop it by
counting file edits, not by watching a clock.

---

## Raw evidence

- `results/baseline-starter.log` — install / check / build / test, verbatim
- `results/baseline-solution.log` — same for the answer key, plus `./init.sh`
- `results/baseline-runtime-probe.log` — the two container runs, bridge dead
  then alive

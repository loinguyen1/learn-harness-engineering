# Project 05 — Baseline

*Measured 2026-09-04, before any arm ran. `fixtures/clean/` is the frozen start
for all four arms.*

## The starter did not work

P05's `starter/` inherits from the **course's** P04 solution, not from my
repaired P04 tree. So the same defects came back — the fourth project running.

| # | Defect | Where | Caught by |
|---|---|---|---|
| A | `shared/types` imported one `../` too deep | `App.tsx` + 4 components | `npm run check` |
| B | `window.knowledgeBase` declared twice, copies drifted | `App.tsx` vs `types.d.ts` | fell out of A |
| C | single-document indexing never writes `index-meta.json` | `indexing-service.ts` | reading both paths |
| D | no `sandbox: false` | `main.ts` | absent — nothing checks it |
| E | dead `import React` under `jsx: react-jsx` + `noUnusedLocals` | 6 renderer files | `npm run check` |
| F | `File.path` (an Electron extension) missing from DOM lib types | `ImportPanel.tsx` | `npm run check` |

A, B, C and D are P02/P03/P04's bugs, unchanged. E and F are new to this tree.

### Why only the renderer was wrong in A

`services/`, `main/`, `preload/` and `types.d.ts` all used `../shared/types`
and all resolved correctly. Only `App.tsx` and the four components were one
level too deep. Both bad imports walked off past the filesystem root:

```
src/renderer/App.tsx                             -> /types.ts   MISSING
src/renderer/components/ConversationHistory.tsx  -> /types.ts   MISSING
actual file:                                        src/shared/types.ts  EXISTS
```

The `@shared/*` alias exists in both tsconfigs and in `vite.config.ts`, and
nothing in the renderer uses it. An alias nobody uses does not prevent anything.

### B was fixed structurally this time

P02's notes recorded this one as *"never structurally fixed — both arms patched
around it."* The two copies had drifted:

| member | `App.tsx` copy | `types.d.ts` copy |
|---|---|---|
| `indexing.start` returns | `{ status: string }` | `AppStatus` |
| `indexing.chunks` returns | `Array<{id,content,index}>` | `Chunk[]` |

`types.d.ts` matched the real shared types. The `App.tsx` block was a
hand-written weaker approximation. **Deleted it** rather than reconciling the
two — one source of truth, which is what P02 should have done.

### C, restated as a rule

The batch path did this and the single-document path did not:

```ts
chunksMeta[doc.id] = chunks.map(c => c.id);
this.persistence.writeJson(INDEX_META, chunksMeta);
```

`getStatus()` counts `Object.keys(index-meta)`. So single-doc indexing wrote
five chunks to disk and then reported **zero documents indexed**, with no error.

> Two code paths to the same outcome, one of them tested. Third project this
> exact function has produced the bug.

## Verified state of `fixtures/clean/`

Every check run, exit codes copied from the terminal:

| Check | Exit | What it proves |
|---|---|---|
| `npm run check` | **0** | both tsconfigs type-clean |
| `bash scripts/check-architecture.sh` | **0** | layer boundaries intact |
| `npm run build` | **0** | it compiles |
| `SMOKE=1 electron dist/main/main.js` | **0** | **it runs** |

The smoke probe is P03/P04's, ported unchanged. It drives one real user path —
import, index that one document, ask, read the answer:

```
BRIDGE: object
ROUNDTRIP: {"chunks":5,"citations":2}
```

Two citations, not zero. **This is the check that matters.** `check` and `build`
both exited 0 while the app was dead in three earlier projects.

## Why this mattered before running the arms

An arm building a conversation UI on top of a Q&A service that returns zero
citations produces a component that cannot display citations — and it would
score low for a reason that has nothing to do with role separation.

Repairing first is not tidiness. It is removing a confound.

## Harness defects found while building the runner

Both were silent. Neither printed an error. Either would have invalidated the run.

| Defect | Symptom | Cause |
|---|---|---|
| `xvfb-run` with no TTY | agent "working" 20 min, **0 bytes** of output | `claude` never started; the wrapper hung waiting on a terminal |
| parallel arms | two arms apparently running fine | both mount at `/work`, so they share **one** conversation history |

### The parallel-arm bug, in timestamps

P04's `lab.sh` always used `docker run -it`. Dropping `-it` to run headless is
what exposed the `xvfb-run` hang. Fix: background `Xvfb` + `export DISPLAY=:99`,
and a `perl alarm` timeout per step, because macOS has no `timeout`.

The second is worse. The purge was written to *prevent* cross-arm contamination.
Running arms in parallel turned it into the cause of one:

```
A started                   04:30:03Z
-work purged by arm C       04:31:07Z   <- deleted A's in-flight history
only surviving conversation 04:31:24Z   <- created after the purge
```

`run-arm.sh` now refuses to start while another arm is live. **Verified by
watching it refuse**, not by assuming.

### The independent variable is real, and was checked

That the arms differ in *context* and not just in prompt wording was verified
directly. Container 1 read a file; container 2 resumed with `--continue` and
recalled its contents without re-reading:

```
container 1:  claude -p "Read note.txt and remember the code."   -> OK.
container 2:  claude --continue -p "Without reading any file..." -> ZEBRA-77
```

So `--continue` (arms A, A+) genuinely carries the generator's memory into the
review step, and a bare `claude -p` (arms B, C) genuinely does not.

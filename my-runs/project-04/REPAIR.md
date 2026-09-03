# P04 — the inherited repairs

What was changed in the fixtures **before** the experiment, and why none of it
is the thing P04 studies.

Applied identically to `fixtures/bugged`, `fixtures/bugged-logged` and
`fixtures/fixed`, then **baked into the fixtures** — the patch script that
applied them was deleted afterwards, so there is one artifact to read (the
folders) instead of a script plus its output.

`diff --exclude node_modules` between `bugged` and `fixed` reports **one file**,
differing **only** in the seeded chunking lines.

---

## Why repair anything at all

P04's starter ships with three defects that have nothing to do with P04. Left in
place, the gate dies at step 2 and never reaches the app — so the regression pair
cannot isolate anything, and four agent sessions would all be spent on inherited
debt instead of on the thing being measured.

Every one of them is present in the **official solution** too, so none is a
seeded exercise.

The order this was found in is the point: **the gate found two of them, after I
had already written a baseline saying the trees were sound.**

---

## The three inherited defects

### A. Import paths wrong by one directory level

`src/renderer/**` reached `shared/types` with one `../` too many. Fourteen
`npm run check` errors, most of them cascading implicit-`any`s from the type
that failed to resolve.

**Why it survived:** they are type-only imports, so vite strips them without
resolving. `npm run build` exits 0. Only `tsc` ever saw it — the exact trap
`init.sh` step 2 exists to catch.

### B. `window.knowledgeBase` declared twice, and drifted

Declared in `src/renderer/types.d.ts` **and** inline in `App.tsx`, with the two
copies out of step:

| | `types.d.ts` | `App.tsx` inline |
|---|---|---|
| `chunks` | `Chunk[]` | `{id, content, index}[]` |
| `start` | `Promise<AppStatus>` | `Promise<{status: string}>` |

**This is P02's duplicated-contract bug, unfixed, two projects later.** P02's
notes recorded it as *"never structurally fixed — both arms patched around it."*
It is still here.

Repair: the inline copy is deleted. `types.d.ts` is the single source of truth.

### C. Single-document indexing never reached Q&A

`startIndexing(documentId)` wrote `chunks/<id>.json` but never recorded the
document in `index-meta.json`. `getAllChunks()`, which Q&A depends on, iterates
**only** over `index-meta.json`.

So: index one document, ask a question, get **zero citations**, with no error
printed anywhere.

**This is P03's lesson 2, verbatim.** It is back because P04's starter is derived
from the *course's* P3 solution, not from the repaired one.

### D. Dead IPC bridge — repaired in the overlay, not here

`main.ts` never set `sandbox: false`. Electron 33 defaults it to `true`, which
kills the preload's cross-module import, so `window.knowledgeBase` is
`undefined` and the entire app is dead. Measured both ways:

```
without sandbox: false  ->  BRIDGE: undefined
with    sandbox: false  ->  BRIDGE: object
```

**This is P03's headline defect, also back.** The repair is in each fixture's
own `src/main/main.ts`, alongside the SMOKE block. `main.ts` started out in the
overlay, which turned out to overwrite arm B's startup logging — so `main.ts`
moved into the fixtures and the overlay now carries only `init.sh`.

---

## How each one was found

| defect | found by |
|---|---|
| A — import paths | `init.sh` step 2, first run of `check-gate.sh` |
| D — dead bridge | a throwaway probe, while diffing P03's `main.ts` against P04's |
| B — duplicate contract | fell out of repairing A |
| C — single-doc indexing | **`init.sh` step 4, on the tree I had already called `fixed`** |

**C is worth dwelling on.** `BASELINE.md` §3 reported the fixed tree returning
2 citations. That measurement was taken with a probe calling `startIndexing()`
with **no argument** — the batch path, which does write `index-meta.json`. The
gate calls `startIndexing(doc.id)`, the single-document path, which did not.

The probe measured the path that worked. The gate measured the path a user takes.

**This is precisely the mistake P03's notes already recorded**, in the same
function, for the same reason: *"The baseline probe missed it because it called
startIndexing() with no argument — the full-library path... One path tested, the
other broken."*

Reciting a lesson is not applying it. The gate caught what the baseline did not.

---

## Verified after repair

```
bugged  -> exit 1   BRIDGE: object   ROUNDTRIP: {"chunks":5,"citations":0}
fixed   -> exit 0   BRIDGE: object   ROUNDTRIP: {"chunks":5,"citations":2}
```

Same five chunks either side. Citations 0 versus 2. The gate is reacting to the
seeded defect and to nothing else, because there is nothing else left to react
to.

Full log: `results/gate-phase1.log`.

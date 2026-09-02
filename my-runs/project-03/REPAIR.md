# The pre-fix, and why it exists

Both arms start from `fixtures/repaired/`, not from the starter as shipped.
This file says exactly what I changed and what I deliberately did not.

**Why pre-fix at all:** in P02 the repair work ate Session A whole, so what got
measured was repair, not the harness. P03 isolates scope control. Repair is
noise. It is applied **identically to both arms**, before either runs, so it
cannot be the thing that differs.

**Why you still see it broken first:** `fixtures/broken/` is the starter
untouched. Your `init.sh` gets run against it and must fail — a gate you have
not watched fail is not a gate. Only after that do the arms start from
`repaired/`.

## What changed — the original pre-fix: 48 lines, 9 files

(`results/repair.diff` shows the *current* total, 182 lines across 11
files, because of the two later changes recorded further down.)

| # | Change | Why |
|---|---|---|
| A | `main.ts`: added `sandbox: false` | Electron 33 defaults it to `true`, which stops the compiled preload from `require`-ing `../shared/types` and leaves `window.knowledgeBase` undefined. `contextIsolation` stays on, `nodeIntegration` stays off. |
| B1 | Renderer import paths `../../shared/types` → `../shared/types` (and `../../../` → `../../` in components) | Every renderer import of the shared types was off by one directory. |
| B2 | Dropped the unused default `React` import in 5 files | `jsx: "react-jsx"` plus `noUnusedLocals: true` makes it a hard error. |
| B3 | Deleted the inline `declare global { interface Window … }` from `App.tsx` | It duplicated `renderer/types.d.ts` and the copies had drifted — App.tsx's was missing `documents.getContent`. `types.d.ts` is now the only declaration. |
| B4 | `qa-service.ts`: removed the unused `Chunk` import | Same `noUnusedLocals` rule. |
| B5 | `ImportPanel`: `file.path` → `window.knowledgeBase.documents.pathFor(file)`, backed by `webUtils.getPathForFile` in the preload | Electron 32 removed `File.path`; `webUtils` is its supported replacement, and it has to be called from the preload because `nodeIntegration` is off. |

**B3 is the one P02 left undone.** Both P02 arms patched around the duplicate
declaration instead of removing it. It is the "one source of truth per contract"
rule as a compile error, and it is now actually fixed.

## Result — measured, not asserted

```
npm run check   exit 0   (was exit 2, 15 errors)
npm run build   exit 0
```

End-to-end through the live IPC bridge, headless in the lab container:

```
PROBE: {"imported":"retrieval-plan","listed":1,"indexStatus":"ready",
        "chunks":5,"citations":2,"confidence":0.85,"firstCite":"retrieval-plan"}
```

Import → list → index → chunk → ask → cite, all working.

## Two later changes to this fixture (2026-09-01, after the sessions ran)

**1. Ported a real bug fix.** Session 1 found that indexing a *single* document
wrote its chunks but never recorded them in `index-meta.json` — and
`getAllChunks()`, which Q&A depends on, reads only from there. Index one
document, ask a question, get **zero citations**, silently. Three lines, ported
into the baseline because it is a defect, not a feature.

**2. Upgraded the smoke test** from *"is the connector alive?"* to a full round
trip: import → index that one document → ask → fail unless chunks > 0 and
citations > 0. Verified by reverting change 1 and watching the gate go red
(`ROUNDTRIP: {"chunks":5,"citations":0}`).

## What I deliberately did NOT touch

- **No feature work.** `metadata-extraction` is still unimplemented,
  `indexing-status-ui` still lacks `indexedCount`/`totalChunks`.
- **`feature_list.json` is untouched, lies and all.** Seven items still say
  `pass`; `document-chunking` and `grounded-qa` still say `not-started` while
  the probe above proves both work. That wrongness *is* the experiment — it is
  how we find out whether an agent rewrites working code because a file told it
  to. Do not correct it in either arm.
- **No `init.sh`, no `session-handoff.md`, no `claude-progress.md`, no
  `clean-state-checklist.md`.** Those are yours.

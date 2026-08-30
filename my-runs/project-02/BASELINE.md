# Project 02 — verified baseline state

Measured 2026-08-30 on the checked-in `projects/project-02/` trees.
Node v24.14.0, npm 11.9.0, deps installed with `ELECTRON_SKIP_BINARY_DOWNLOAD=1`.
Raw output: `results/baseline-check.log`.

## `npm run check` fails in BOTH trees

| Tree | `npm install` | `npm run check` |
|---|---|---|
| `starter/` | exit 0 | **exit 2 — 15 errors** |
| `solution/` | exit 0 | **exit 2 — 4 errors** |

The reference solution does not type-check. Do not treat `solution/` as a
green target; treat it as a shape to compare against.

## Starter errors, grouped

1. **Wrong relative import path** — `App.tsx:7` imports `'../../shared/types'`.
   From `src/renderer/` that resolves outside `src/`. Solution uses `'../shared/types'`.
   The same wrong depth appears in `DocumentDetail`, `DocumentList`, `StatusBar`
   (`'../../../shared/types'`).
2. **Unused `React` imports** — `jsx: "react-jsx"` + `noUnusedLocals: true` makes
   `import React from 'react'` an error in 5 files.
3. **`Property 'path' does not exist on type 'File'`** (`ImportPanel.tsx:28`) —
   Electron removed `File.prototype.path` in v32; this project is on v33. The
   starter's import flow is written against an API that no longer exists. The
   solution's fix is to pass the `File` object instead of `file.path`.
4. Implicit `any` in `App.tsx:183`, `StatusBar.tsx:9`; unused `Chunk` in `qa-service.ts`.

## Solution errors — the interesting one

`window.knowledgeBase` is declared **twice**:

- `src/renderer/types.d.ts:5` — the full, current surface (has `getContent`)
- `src/renderer/App.tsx:10` — a second inline `declare global { interface Window ... }`
  that is stale: no `getContent`, and `indexing.chunks` typed as
  `Array<{id, content, index}>` instead of `Chunk[]`

The duplicate is in the **starter too**. Two sources of truth for one contract,
drifted apart — which is exactly what Lecture 03 is about. It produces:

- `DocumentDetail.tsx:28` — `Property 'getContent' does not exist`
- `DocumentDetail.tsx:17` — `Chunk[]` mismatch

Plus a real signature bug the docs do not mention:

- `App.tsx:165` — `ImportPanel` props declare `onImport: (file: File) => void`
  but `handleImport` is `(filePath: string) => Promise<void>`. The solution's
  import feature is type-broken at the seam it was meant to demonstrate.

## What this means for the exercise

`feature_list.json` in the solution marks all 7 features `"pass"` with written
evidence, and `session-handoff.md` says "No remaining features... All 7 features
at status pass". Neither claim was checked by a command. This is P01's lesson
arriving one layer up: **a handoff document is exactly as trustworthy as the
gate that runs before it is written.**

Unverified claims found: `feature_list.json` evidence for `document-import`,
`document-detail`, `basic-persistence`; `session-handoff.md` "What Remains".
Verified-and-true claim: `session-handoff.md` says `types.d.ts` added
`getContent` — it did.

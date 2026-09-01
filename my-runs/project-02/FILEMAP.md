# Project 02 — every file, and what it is for

Three tiers. Different owners, different rules.

```
projects/project-02/                 TIER 1  course material — read-only
        |
        | setup-run.sh copies starter/ -->
        v
my-runs/project-02/runs/p02-<arm>/   TIER 3  the run dir
        |                                    mounted at /work in the container;
        |                                    the ONLY thing the agent can see
        | archive-run.sh snapshots -->
        v
my-runs/project-02/results/          TIER 2  the rig + the record — yours
```

The run dir sits inside the repo, which is safe only because the container
mounts that one directory. On the host, `..` from it reaches `CLAUDE.md`,
`projects/project-02/solution/`, and `BASELINE.md`. Inside the container, `..`
is a bare Debian root. Never launch a session with bare `claude`.

---

## TIER 1 — course material `projects/project-02/`

`starter/` is 29 files. `solution/` is the same 29 plus `session-handoff.md`.

### Harness files (4) — what makes the workspace agent-readable

| File | Lines | Role |
|---|---|---|
| `AGENTS.md` | 20 / 68 | Entrypoint. Starter: quick start + layers + conventions. Solution: adds **Definition of Done** and **Session Handoff** rule. **This is the experiment's variable.** |
| `docs/ARCHITECTURE.md` | 114 / 121 | Layer structure, data flow. Solution replaces the "key invariant" prose with a literal 11-step import pipeline. |
| `docs/PRODUCT.md` | 63 / 60 | Feature requirements, UI layout. Solution adds a Persistence section. |
| `feature_list.json` | 62 | 7 features. Starter: 4 `pass` (carried from P1) + 3 `not-started`. Each has an `evidence` field. |
| `session-handoff.md` | — / 52 | **Solution only.** Continuity across the session boundary. The artifact P02 exists to test. |

### Sample data (3) — read these carefully

| File | Lines |
|---|---|
| `data/sample-documents/design-notes.md` | 43 |
| `data/sample-documents/meeting-summary.txt` | 20 |
| `data/sample-documents/retrieval-plan.md` | 46 |

P01's lesson: these look like test fixtures but read as a design spec, and an
agent will take them as instructions. Whatever is in the folder is the brief.

### Build config (5)

| File | Lines | Note |
|---|---|---|
| `package.json` | 28 | `dev` / `build` / `check` / `test`. Solution adds `@types/node`. |
| `tsconfig.json` | 28 | Renderer. `noUnusedLocals: true` + `jsx: react-jsx` — this pair is why every `import React` is an error. |
| `tsconfig.node.json` | 23 | Main + preload + services. Emits to `dist/`. |
| `vite.config.ts` | 19 | Renderer bundling. |
| `scripts/dev.js` | 27 | `npm run dev` — build then launch Electron. |

### Source (17)

**Main process (2)** — owns window + IPC, all filesystem access
| File | Lines |
|---|---|
| `src/main/main.ts` | 67 |
| `src/main/ipc-handlers.ts` | 54 |

**Preload (1)** — the only bridge
| File | Lines |
|---|---|
| `src/preload/preload.ts` | 22 |

**Renderer (9)** — React, never imports Node
| File | Lines |
|---|---|
| `src/renderer/App.tsx` | 201 |
| `src/renderer/components/DocumentList.tsx` | 46 |
| `src/renderer/components/DocumentDetail.tsx` | 123 |
| `src/renderer/components/ImportPanel.tsx` | 34 |
| `src/renderer/components/QuestionPanel.tsx` | 61 |
| `src/renderer/components/StatusBar.tsx` | 44 |
| `src/renderer/main.tsx` | 12 |
| `src/renderer/index.html` | 23 |
| `src/renderer/types.d.ts` | 26 |

**Services (4)** — main-process business logic. **Already complete; the work is not here.**
| File | Lines | State |
|---|---|---|
| `src/services/document-service.ts` | 89 | `importDocument`, `getDocumentContent`, `deleteDocument` all present |
| `src/services/persistence-service.ts` | 94 | unchanged between starter and solution |
| `src/services/indexing-service.ts` | 130 | unchanged |
| `src/services/qa-service.ts` | 135 | one unused import to remove |

**Shared (1)**
| File | Lines | Note |
|---|---|---|
| `src/shared/types.ts` | 65 | `IPC_CHANNELS` — single source of truth. Solution adds one line. |

---

## TIER 2 — the rig `my-runs/project-02/`

Never read by an agent.

| File | For | Role |
|---|---|---|
| `RUNBOOK.md` | you | Protocol, ground rules, metrics table |
| `BASELINE.md` | you | Verified starting state — both trees fail `npm run check` |
| `FILEMAP.md` | you | This file |
| `setup-run.sh` | — | Builds one arm into `runs/`; `--host` for the no-Docker fallback |
| `run-session.sh` | — | Launches Session A or B in the container with the fixed prompt |
| `archive-run.sh` | — | Snapshots a finished run into `results/` |
| `runs/` | — | Live run directories — the mount target |
| `harness/README.md` | you | What each arm hands the agent, and from where |
| `harness/init.sh` | agent | The verification gate — copied into both arms |
| `harness/session-handoff.template.md` | agent | Seeded into the `handoff` arm |
| `results/` | record | Baseline log, start states, archived runs |

---

## TIER 3 — the run dir (what the agent actually sees)

`starter/`'s 29 files, minus `session-handoff.md`, plus `init.sh`. Two rows differ:

| | `thin` | `handoff` |
|---|---|---|
| `AGENTS.md` |  starter's (20 lines) | solution's (68 lines) |
| `session-handoff.md` | absent | seeded template |

Everything else is byte-identical. That is the whole experiment.

---

## The work, by file

### Phase 0 — repair (6 files, before any feature)

The starter does not compile: 15 errors. Both arms pay this equally.

| File | What is wrong |
|---|---|
| `App.tsx` | imports `'../../shared/types'` (one level too deep); unused `React`; 2 implicit `any` |
| `DocumentDetail.tsx` | unused `React`; wrong import depth; `setContent` declared, never used |
| `DocumentList.tsx` | unused `React`; wrong import depth |
| `StatusBar.tsx` | unused `React`; wrong import depth; implicit `any` index |
| `ImportPanel.tsx` | unused `React`; **`file.path` — removed from `File` in Electron 32, project is on 33** |
| `qa-service.ts` | unused `Chunk` import |

Also latent, and not reported until the rest is fixed: `window.knowledgeBase` is
declared **twice** — `types.d.ts:5` and inline at `App.tsx:10` — and the copies
have drifted. Present in the solution too.

### Phase 1 — `document-import`

Service and IPC are already wired. The break is at the renderer seam.

| File | Change |
|---|---|
| `ImportPanel.tsx` | stop using `file.path`; pass the `File` |
| `App.tsx` | `handleImport`, import-view toggle, refresh list after success |
| `document-service.ts` | ✓ `importDocument()` already exists |
| `ipc-handlers.ts`, `preload.ts` | ✓ `IMPORT_DOCUMENT` already wired |

### Phase 2 — `document-detail`

The one feature needing a new IPC channel end to end.

| File | Change |
|---|---|
| `shared/types.ts` | add `GET_DOCUMENT_CONTENT: 'documents:get-content'` |
| `ipc-handlers.ts` | register the handler |
| `preload.ts` | expose `documents.getContent(id)` |
| `types.d.ts` | declare it on `Window` |
| `App.tsx` | the stale duplicate `Window` block must be reconciled or deleted |
| `DocumentDetail.tsx` | load content, render in a `pre-wrap` container, wire delete |
| `document-service.ts` | ✓ `getDocumentContent()` already exists |

### Phase 3 — `basic-persistence`

| File | Change |
|---|---|
| `App.tsx` | `useEffect(() => { refreshDocuments() }, [])` on mount |
| `document-service.ts` | `deleteDocument` should also remove `content/<id>.txt` |
| `persistence-service.ts` | ✓ unchanged — already writes under `userData/knowledge-base-data/` |

### Phase 4 — harness artifacts

| File | Change | Arm |
|---|---|---|
| `feature_list.json` | 3 features → `pass` **with evidence that names a command, not a code reading** | both |
| `session-handoff.md` | fill every section before Session A stops | `handoff` only |
| `docs/ARCHITECTURE.md`, `docs/PRODUCT.md` | update to match | `handoff` (its DoD requires it) |

---

## Counts

| | |
|---|---|
| Course files (starter) | 29 |
| Course files (solution) | 30 |
| Rig files | 10 |
| Run-dir files, `thin` | 30 |
| Run-dir files, `handoff` | 31 |
| Files needing repair before features | 6 |
| Files touched by the 3 features | 7 |
| Service files needing changes | 1 of 4 |

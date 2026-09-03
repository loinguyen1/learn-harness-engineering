# Architecture — the four layers

```
window (renderer)  →  bridge (preload)  →  wiring (main)  →  logic (services)
      React               contextBridge        IPC handlers      the actual work
```

Data goes right, then comes back. **Nothing skips a layer.**

## Who may touch what

| layer | lives in | may use | must NOT use |
|---|---|---|---|
| **window** | `src/renderer` | React, `window.knowledgeBase`, types | `fs`, `path`, `os`, `child_process` — anything touching the disk |
| **bridge** | `src/preload` | `contextBridge`, `ipcRenderer` | anything beyond exposing the typed API |
| **wiring** | `src/main` | Electron, the services | React or anything from the window |
| **logic** | `src/services` | `fs`, `path`, the shared types | `electron`, `ipcMain`, `ipcRenderer`, `BrowserWindow`, React |

## Why the window may not touch the disk

It runs with `contextIsolation: true`. Giving it disk access would mean turning
that off, and then any page it loads can read your files. The bridge exists
precisely so the window can *ask* for a file instead of *taking* one.

## Why logic may not know it is in Electron

`src/services` is where the real work happens — chunking, indexing, answering.
If it imports `ipcMain` it can no longer be run from a test, a script, or a
future web version. It stays a plain library that knows nothing about windows.

## The one thing to know about these rules

**They are enforced, not documented.**

```sh
bash scripts/check-architecture.sh
```

It reads the import lines in each folder, names any file that breaks a rule,
and exits 1. It runs as step 3 of `./init.sh`, so it cannot be skipped.

Verified by breaking each rule on purpose and watching it name the file — then
undoing the break and watching it go back to 0.

**This file explains. The script decides.** If the two ever disagree, the script
is right and this file is stale.

## What it does not catch

It reads text; it never runs the app. Someone determined could route around it —
a dynamic `require`, a re-export through a third file. It catches the honest
mistake, which is the one that actually happens, in under a second.

**A tripwire, not a lock.**

## Where the data lives

Everything is local files under Electron's `userData` directory:

```
documents-meta.json      one entry per imported document
content/<id>.txt         the document text
chunks/<id>.json         that document's chunks
index-meta.json          which documents have been indexed  ← see below
qa-history.json          past questions and answers
```

**`index-meta.json` is load-bearing.** `getAllChunks()` — which Q&A depends on
— iterates over the keys of that file and nothing else. Writing
`chunks/<id>.json` without adding the id to `index-meta.json` produces a
document whose chunks exist on disk and are invisible to search, with no error
anywhere. That exact bug shipped in this starter; see `REPAIR.md` §C.

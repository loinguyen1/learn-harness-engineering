# AGENTS.md -- Project 02: Agent-Readable Workspace

## Quick Start

1. Run `npm install && npm run check` to verify the build.
2. Read `docs/ARCHITECTURE.md` for layer structure.
3. Check `feature_list.json` for what needs to be done.

## Layers

- Main process: `src/main/` -- window, IPC, services
- Preload: `src/preload/` -- bridge API
- Renderer: `src/renderer/` -- React UI
- Services: `src/services/` -- business logic

## Conventions

- TypeScript strict mode. No `any` without comment.
- Named exports only.
- IPC channels in `src/shared/types.ts`.

## Definition of Done

A feature is NOT done because you believe it is. It is done when:

1. `./init.sh` exits 0. Run it. Do not predict its result.
2. Its entry in `feature_list.json` has status `pass` and an `evidence` field
   naming the command you ran and what it printed.
3. Evidence that describes code you read, rather than a command you ran,
   does not count.

## Session Handoff

This work spans more than one session. The next session will be a different
agent with no memory of this one. The repository is the only thing it inherits.

**When you start:** read `session-handoff.md` before opening any code.

**Before you stop:** fill in every section of `session-handoff.md`.
The `Last ./init.sh result` field must contain the exit code from an actual
run, not an expectation. If you are unsure what to write in a section, that
uncertainty is exactly what the next session needs to know -- write it down.

An unwritten handoff is the same as no handoff.
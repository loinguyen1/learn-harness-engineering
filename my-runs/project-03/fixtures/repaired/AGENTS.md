# AGENTS.md -- Project 03: Multi-Session Continuity with Scope Control

## Quick Start

1. `./init.sh` -- run this FIRST, before reading any code. It tells you what
   you actually inherited. Do not predict its result.
2. Read `session-handoff.md`, then `claude-progress.md`.
3. Read `feature_list.json` -- but see **Trust** below.
4. `docs/ARCHITECTURE.md` for layers, `docs/PRODUCT.md` for requirements.

## Layers

- Main: `src/main/` -- window, IPC, services
- Preload: `src/preload/` -- bridge API
- Renderer: `src/renderer/` -- React UI
- Services: `src/services/` -- business logic

## Conventions

- TypeScript strict mode. No `any` without a comment.
- Named exports only.
- IPC channels in `src/shared/types.ts` -- one source of truth. Never declare
  the same contract in two places.

## Trust

**`feature_list.json` is a claim, not a fact.** It has been wrong in both
directions in this repository:

- features marked `not-started` whose code was already finished and working
- features marked `pass`, with detailed evidence, while the app was completely
  non-functional

**So: before you act on a status, check it.**

- Before implementing something marked `not-started`, look at whether it
  already works. If it does, say so and move on. **Do not rewrite working
  code because a file told you it was missing.**
- Before trusting something marked `pass`, run `./init.sh`. If it disagrees
  with the file, the file is wrong.
- When you find a stale claim, **correct it and say it was stale.** Do not
  silently overwrite it.

## One feature at a time

Finish one feature completely -- implement, verify, record -- before starting
the next.

Not because it is tidier. Because when something breaks you need to know which
change did it, and because a feature verified in a batch of four has no
individual proof.

## Definition of Done

A feature is not done because you believe it is. It is done when:

1. `./init.sh` exits 0. **Run it.** Do not predict it.
2. Its entry in `feature_list.json` has status `"pass"` and an `evidence`
   field naming **the command you ran and what it printed**.
3. `claude-progress.md` has an entry for it.

**Evidence describing code you READ, rather than a command you RAN, does not
count.** *"chunkDocument splits on paragraph boundaries"* is an opinion.
*"ran init.sh, exit 0, BRIDGE: object"* is a fact.

`./init.sh` includes a step that starts the real app and checks its IPC bridge
is alive. `npm run check` and `npm run build` both pass on an app where nothing
works -- that is why the fourth step exists. Do not remove it.

## Session Handoff

This work spans more than one session. The next session is a different agent
with no memory of this one. **The repository is the only thing it inherits.**

**When you start:** read `session-handoff.md` before opening any code.

**As each feature finishes:** append an entry to `claude-progress.md`. Not at
the end of the session -- at the end of the feature. A handoff written only at
a graceful exit is lost to a crash, a context limit, or a closed laptop. The
per-feature log is what survives.

**Before you stop:** fill in every section of `session-handoff.md`. The
`Last ./init.sh result` field must contain the exit code from an actual run.
If you are unsure what to put in a section, that uncertainty is exactly what
the next session needs -- write it down.

**Before declaring the work finished:** walk `clean-state-checklist.md`. Every
box on it names a command. Do not tick a box you have not run.

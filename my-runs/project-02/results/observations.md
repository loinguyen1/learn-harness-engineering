# Project 02 — observations

Fill this in AS YOU GO. Memory rewrites itself afterwards.

---

## Arm 1 — `thin`  (no handoff rule, no handoff file)

## Arm 1 — thin  (no handoff rule, no handoff file)

### Attempts to stop Session A
- Run 1: stopped at "2 of 3 features" -> too late, it finished ALL of it in 6m54s
- Run 2: stopped at 2 minutes -> too early, ZERO files written
- Run 3: stopped after ~4 file edits -> correct
- FINDING: the course says "stop Session A part-way" as if easy. It is not.
  Counting edits works; a clock does not.

### Session A (run 3)
- Changed 4 files: ipc-handlers.ts, preload.ts, document-service.ts, shared/types.ts
- feature_list.json: still all 3 "not-started" -- WRONG, work had started
- init.sh: exit 2
- Recorded nothing. No handoff exists in this arm.

### Session B  <- THE MEASUREMENT
- Read 26 files before its first edit (11, then 15 more)
- Had to rediscover "backend services already look complete"
- Trusted feature_list.json's "not-started" -- a stale map
- Re-derived the same bugs A had already diagnosed (import paths, file.path)
- Duration 7m46s, finished everything, init.sh exit 0

### The finding that outweighs the timing
Session B found that the preload script never loaded at all (Electron 33
defaults sandbox:true), so window.knowledgeBase was undefined and NOTHING
in the app worked -- while tsc and vite both reported success.

My init.sh said exit 0 on a dead app.

A gate proves only what it measures. Compiling proved compiling.
Session B only caught it because it ran Electron and took screenshots.
It looked at the app. My gate never does.
---

## Arm 2 — `handoff`  (Definition of Done + handoff rule + seeded template)

### Session A
- Started: 
- Stopped at (aim for the SAME point as Arm 1): 
- Features done / in progress / untouched: 
- **Did it fill in `session-handoff.md`?** 
- If yes — is what it wrote TRUE? (check against `./init.sh`): 
- Did it update `feature_list.json` with real evidence, or prose? 

### Session B  ← THE MEASUREMENT
- Started: 
- **First thing it did — did it read `session-handoff.md`?** 
- **Minutes before its first useful edit:** 
- Files it re-read that A had already understood: 
- Questions it asked me that the folder should have answered: 
- Work it redid or undid: 
- Did it TRUST a false claim in the handoff? 
- `./init.sh` at the end: 
- Features actually working when it declared done: 

---

## Comparison

| Metric | thin | handoff |
|---|---|---|
| B: minutes of rediscovery before first real edit | | |
| B: files re-read unnecessarily | | |
| B: questions asked of me | | |
| B: work redone or undone | | |
| `init.sh` at end of A | | |
| `init.sh` at end of B | | |
| Features actually working at the end | | |
| **Did the state files match reality?** | | |

## What I actually learned

<!-- Write this last, and write it even if the result was null.
     A null result ("the handoff made no difference because it was vague")
     is a finding, not a failure. -->

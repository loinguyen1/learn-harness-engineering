# Project 01 — Review Notes

*Completed 2026-08-29. Written to look back at, not to re-read in full.*

---

## The one idea

A capable model with nothing in its environment defining "done" will use its own
definition: **I finished typing.** A harness replaces *"the agent said so"* with
*"the command exited successfully."*

---

## What actually happened

| | Run A (prompt only) | Run B (harness) |
|---|---|---|
| `npm run check` | 8 TypeScript errors | passes |
| `npm run dev` | crashes, no window | launches, UI works |
| `npm test` | 3 of 3 fail | no tests written |
| `feature_list.json` | didn't exist | 4/4 `pass` with evidence |
| Agent's closing words | *"The app is complete."* | *"I need approval to run npm install... then I'll verify"* |

Same model. Same prompt sentence. Difference = 355 lines of files in the folder.

**Run A's bug:** `IndexingService` had a field and a method both named `index`.
The field clobbers the method at construction, so every call threw
`TypeError: indexing.index is not a function`. It shipped with 8 compile errors
and a confident summary.

---

## The three lessons, in the order I hit them

**1. An agent will claim done with zero proof.**
Run A. Caught by running the app myself.

**2. A harness only proves what it measures.**
Run B passed every gate — compile, build, launch — and rendered a **black window**.
The rule said "the app launches and the window is visible." It was visible. It was
also empty. The agent had marked it `pass` citing BrowserWindow's constructor
options: code inspection, not observation. It never looked at the window.

**3. Fix the harness, not the app.**
Instead of editing `vite.config.ts` by hand, I added a 4th gate to `init.sh`,
**confirmed it failed first**, then ran `claude -p "Run init.sh and fix whatever
fails."` The agent diagnosed it, added `base: './'`, rebuilt, went green.
I fixed the harness; the harness fixed the app.

---

## The harness pieces and what each one is for

| File | Job |
|---|---|
| `AGENTS.md` | Startup rules + **Definition of Done**. Read docs first, run init.sh, don't claim done until it compiles and launches. |
| `init.sh` | `npm install && npm run check && npm run build`. Pass/fail, no opinions. |
| `feature_list.json` | Each feature: status + **evidence**. An empty evidence field is harder to fill with nothing than prose is. |
| `docs/ARCHITECTURE.md` | Layer structure, so it isn't invented from scratch. |
| `docs/PRODUCT.md` | Actual requirements. |
| `CLAUDE.md` | Build commands + key file map. |
| `claude-progress.md` | Session log. **Never got written — nothing required it.** |

---

## Things worth remembering

**`set -euo pipefail`** is what makes a script honest. Without `-e`, a failed
command is ignored and the script still prints "All checks passed" — a lie.
With it, the success line is unreachable unless everything passed.

**A check that never fails is worthless.** Always confirm a new gate FAILS on the
broken state before trusting it.

**The agent reads everything in the folder.** In Run A the three files in
`data/sample-documents/` looked like sample content but were actually a design
spec — four-layer architecture, ~500-char chunking, top-2 citations. The agent
took them as instructions, reasonably. *Whatever is in the folder is the brief.*

**Permission modes** (`--permission-mode`):
`plan` (read-only) → `default` (asks everything) → `acceptEdits` (writes files
freely, asks before commands) → `auto` (classifier decides) → `bypassPermissions`
(no checks — container only).
Narrower: `--allowedTools "Bash(npm:*)"` where `:*` is a wildcard.

---

## Gaps I left open on purpose (all the same root cause)

1. **No tests written** — Definition of Done never mentions tests.
2. **`claude-progress.md` never updated** — described, but no rule required it and
   no command checked it.
3. **Sample docs in `data/` never loaded on startup** — PRODUCT.md never asked.

Every one: *the harness delivers what it asks for, and nothing else.*

---

## Method notes (for future projects)

- Two runs must be **isolated**. Claude Code auto-loads `CLAUDE.md` from every
  ancestor directory — Run A was contaminated by the repo's own `CLAUDE.md`,
  which leaked `scripts/dev.js`, the two-tsconfig split, and `IPC_CHANNELS`.
- Don't leave a previous run's source tree where the next agent can walk to it.
- Each run needs a **fresh** agent session. `claude -p` starts one automatically;
  `-c` continues an existing one.

---

## Files

- `results/run-B-improved.md` — full Run B analysis
- `results/run-A-evidence.tar.gz` — Run A's broken app + logs, sealed
- `p01-improved/` — the working app
- `../reference/claude-terminal-permissions-and-docker.md` — permissions + Docker cheatsheet

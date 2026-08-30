# Project 02 — Agent-Readable Workspace

Course page: https://walkinglabs.github.io/learn-harness-engineering/en/projects/project-02-agent-readable-workspace/
Source of truth: `projects/project-02/` in this repo.
Verified starting state: `BASELINE.md` (read this before you start — both trees fail `npm run check`).

## The point of the experiment

P01 asked: does the environment decide the outcome *within* one session?
P02 asks: does the environment carry the outcome *across* a session boundary?

You do the same slice of work twice. Each time, **Session A** does partial work
and stops. Then **Session B** — a genuinely fresh agent with no memory of A —
has to pick up from nothing but the repository. The only difference between the
two runs is whether Session A was required to leave anything behind.

You are not measuring whether the model can write the feature. You are measuring
how much of Session A's understanding survives to Session B, and what it costs
you when it doesn't.

## The two arms

Both arms start from **identical code** (`projects/project-02/starter`) and get
the **same `init.sh`** verification gate. Verification is held constant so the
only variable is continuity.

| | `thin` (control) | `handoff` (treatment) |
|---|---|---|
| `AGENTS.md` | starter's — quick start, layers, conventions | solution's — adds **Definition of Done** and a **Session Handoff** rule |
| `session-handoff.md` | absent | seeded template with empty fields |
| `docs/` | starter's | starter's — *deliberately the same* |
| `feature_list.json` | starter's (4 pass, 3 not-started) | same |
| `init.sh` | same | same |

### Why `docs/` is the same in both arms

The course table suggests running arm 2 against the solution's expanded docs.
I did not, and the reason matters: the solution's `docs/ARCHITECTURE.md` contains
an eleven-step, line-by-line description of the import pipeline. That is the
implementation, written out. Handing it to arm 2 would confound *"continuity
artifacts help a cold session resume"* with *"the answer was in the folder."*

The solution's docs are the **reference you compare against at the end**, not an
input. If you want the course's literal reading afterwards, run a third arm with
`solution/docs/` copied in and see how much of the gap it closes on its own.

## Ground rules

1. **Launch every session through `run-session.sh`, never bare `claude`.**
   The run directory lives inside the repo at `runs/p02-<arm>/`, and that is
   only safe because `../docker/lab.sh` mounts *that one directory* at `/work`.
   Inside the container, `..` is the container's own Debian root — no
   `CLAUDE.md` to auto-load, no `projects/project-02/solution/`, no
   `BASELINE.md`. Run `claude` in that folder on the host instead and you hand
   the agent all three.
2. **Session B must be a genuinely new session.** Not `claude -c`. Not the same
   terminal tab with more typing. A cold start with the run dir as cwd.
3. **Say nothing to Session B that isn't in the repo.** The moment you explain
   what Session A was doing, you have destroyed the measurement. If B asks a
   question the repo should have answered, that is a data point — record it and
   answer as tersely as possible.
4. **Stop Session A deliberately, mid-work.** Not at a clean feature boundary.
   Two of the three features done, the third in progress, is the interesting case.
5. **Do not hand-fix the agent's code.** A broken result is a valid result.
6. **Same stopping point in both arms**, as close as you can manage, or the
   comparison is between different amounts of work rather than different harnesses.

## Running it

One-time, before the first run:

```bash
cd /Users/loi/repo_/learn-harness-engineering/my-runs/docker
./lab.sh build
./lab.sh login
```

Then each arm:

```bash
cd /Users/loi/repo_/learn-harness-engineering/my-runs/project-02
./setup-run.sh thin
./run-session.sh thin a     # Session A
```

Inside the container, `/work` is the run directory. Start with:

```bash
./init.sh          # expect FAILURE — 15 TS errors. Confirm the gate bites first.
```

`npm install` runs *inside* the container. Do not install on the host — a macOS
`node_modules` cannot execute in Linux.

**Session A prompt** (fixed, both arms — `run-session.sh` passes it for you):

> Read AGENTS.md and feature_list.json, then implement the remaining features.

Work until roughly two of the three features are in progress or done, then stop.
Note the wall-clock time and what state the code is in.

**Session B** — a genuinely cold session in the same directory:

```bash
./run-session.sh thin b
```

**Session B prompt** (fixed, both arms):

> Continue the work in this repository.

Then archive and clear before the other arm:

```bash
./archive-run.sh thin
rm -rf runs/p02-thin
./setup-run.sh handoff
```

### If Docker is unavailable

`./setup-run.sh thin --host` puts the run at `/Users/loi/harness-runs/` instead
and enforces ancestor/sibling checks. Weaker: it stops the automatic
`CLAUDE.md` load and accidental `..` traversal, but the answer key is still
reachable by absolute path. It is the fallback, not the plan.

## What you are recording

The headline metric is **Session B's time-to-first-useful-edit** — from the
prompt to the first change that advances the work, excluding rediscovery.

| Metric | thin | handoff |
|---|---|---|
| Session B: minutes of rediscovery before its first real edit | | |
| Session B: files re-read that A had already understood | | |
| Session B: questions it asked you that the repo should have answered | | |
| Session B: work it redid or undid from A | | |
| Session B: did it re-litigate a decision A had already made? | | |
| `./init.sh` result at end of A / end of B | | |
| Features actually working when B declared done | | |
| Did the state files match reality? | | |

That last row is the one to watch. P01's lesson was that an agent claims done
with no proof. P02's version is sharper: **a handoff file is a claim too.** The
checked-in solution's `session-handoff.md` says "No remaining features, all 7 at
pass" — and its own `npm run check` exits 2 (`BASELINE.md`). Nothing ran a
command before that sentence was written.

So the real question this project answers is not "does a handoff file help?"
It is: **what has to be true for a handoff file to be worth reading?**

## Things already known before you start (from BASELINE.md)

- The starter does not compile. 15 errors. Session A's first job is repair,
  not features — budget for it, and expect it in both arms equally.
- `ImportPanel` uses `file.path`, removed from Electron's `File` in v32. Any
  agent that "fixes the import flow" without noticing this is guessing.
- `window.knowledgeBase` is declared twice — `types.d.ts` and inline in
  `App.tsx` — and the copies have drifted. Same defect in starter and solution.
  This is Lecture 03's thesis as a compile error. Watch whether either session
  finds it, or whether they patch around it.
- `npm test` runs `vitest run` with zero test files, which exits non-zero.
  `init.sh` deliberately does not include it. That is a gap, and it is the same
  gap P01 left open: the Definition of Done never mentions tests, so no tests
  get written. Decide on purpose whether to close it this time.

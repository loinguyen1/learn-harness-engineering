# Project 01 — Prompt-Only vs. Rules-First

Course page: https://walkinglabs.github.io/learn-harness-engineering/en/projects/project-01-baseline-vs-minimal-harness/
Source of truth: `projects/project-01/` in this repo.

## The point of the experiment

Same task. Same model. Same prompt. Twice.
Run A gets nothing but the prompt. Run B gets a small set of files that tell the
agent where it is, how to verify itself, and what "done" means.

You are not measuring whether the model is smart. You are measuring how much of
the outcome is decided by the environment you hand it.

## Ground rules (these are what make it an experiment, not a vibe)

1. One run directory exists at a time. Archive and DELETE before starting the other.
2. Never separate the runs with git branches — an agent reads sibling dirs and refs.
3. Do not hand-fix the agent's code mid-run. A broken result is a valid result.
4. Same prompt, verbatim, both runs:
   "Build an Electron app that can show documents and answer questions."
5. Start a FRESH agent session for each run, with the run directory as its cwd.
6. Park the repo CLAUDE.md before Run A (see below). Non-optional.

## Why rule 6 exists

These run directories live inside the course repo. Claude Code loads `CLAUDE.md`
from every ancestor directory, so `learn-harness-engineering/CLAUDE.md` would be
auto-loaded into the weak run — and that file already describes the Electron
layer boundaries, the IPC channel convention, the build commands, and the harness
file names. That is most of the strong harness, handed over for free. Park it.

`./isolate.sh park` before Run A. `./isolate.sh unpark` after.
`./isolate.sh status` to check.

Also: while Run A is active, do not point the agent at anything outside its own
directory. `projects/project-01/solution/` is the answer key and it is one
`../..` away.

## Run A — weak harness  (READY NOW at `my-runs/project-01/p01-baseline/`)

Contents: `task-prompt.md` + `data/sample-documents/`. Nothing else.

```
cd /Users/loi/repo_/learn-harness-engineering/my-runs/project-01
./isolate.sh park
cd p01-baseline && claude
```

1. Note the start time.
2. Paste ONLY the prompt from ground rule 4. Volunteer nothing else.
3. When the agent says it's done, note the time. Try to launch what it built.
4. Fill in `results/run-A-baseline.md`.
5. Archive, then delete:
   ```
   cd /Users/loi/repo_/learn-harness-engineering/my-runs/project-01
   cp -R p01-baseline results/p01-baseline-archive
   rm -rf p01-baseline
   ./isolate.sh unpark
   ```

## Run B — strong harness  (set up AFTER Run A is archived and deleted)

Come back to the Claude session in the repo and say "set up run B". The harness
files get copied from `projects/project-01/solution/` with the evidence reset to
`not-started`, so the agent has something real to build instead of a finished
checklist.

Then `cd p01-improved && claude` — same prompt, verbatim. Leave the repo CLAUDE.md
LIVE for this run; the strong run is allowed all the context it can get.
When it stops, run `./init.sh` and record the result.

## What you are recording

| Metric | Run A | Run B |
|---|---|---|
| Completion (complete / partial / failed) | | |
| Time to first successful launch | | |
| Human interventions needed | | |
| Features missing when the agent declared done | | |
| Did it declare done while broken? | | |

# How to help Loi learn from this course

Written 2026-08-30 after getting it wrong on Project 02. Read this before
starting any project in this repo.

## The mistake to not repeat

Loi asked me to "setup and get ready to learn project 02". I built the entire
harness for them: `init.sh`, the `session-handoff.md` template, the runbook, the
scripts. Then I handed over a list of commands to press enter on.

Every one of those files IS the course. Project 02 teaches you to write a
verification gate and a continuity artifact. By writing them, I did the learning
and left Loi the typing.

Their words: *"I don't want you to write everything then I just hit enter. I want
to learn by doing."*

## The line

Split the work at the course's own deliverables.

| Mine to build | Loi's to write |
|---|---|
| Isolation (Docker mounts, run dirs, leak checks) | Anything the project description lists as a feature or artifact |
| Verified ground truth (does the starter compile? what's already broken?) | `AGENTS.md` rules, Definition of Done |
| Plumbing that copies/archives folders | `init.sh` and any verification gate |
| Reviewing and running what Loi wrote | `session-handoff.md`, `claude-progress.md`, docs |
| Explaining a concept when asked | The judgment calls: when to stop a session, what to measure |

Test: **if the course's project page lists it, Loi writes it.** If it only exists
because we are running the project as a controlled experiment, I can build it.

## How to hand over a task

- Give **requirements and a success criterion**, never the code.
- Say how they will know it is right — usually "run it and confirm it FAILS on
  the broken state first."
- Point at their own earlier notes (`my-runs/project-01/NOTES.md` is full of
  answers they already worked out) instead of answering directly.
- When stuck, ask *"what are you trying to prove?"*, not *"here is the code."*
- Review by **running** their version. Do not rewrite it. If it is wrong, say
  what fails and let them fix it.
- Hold my opinion back until they have formed theirs, then offer it as a compare.

If I have already written something that should have been theirs, **move it to
`compare-after/`** rather than deleting it. Diffing against it afterwards is
useful; peeking at it while stuck is not.

## How Loi wants things explained

- **Short and simple.** They have asked for this repeatedly. Lead with the answer.
- **No unexplained jargon.** "Mount", "image vs container", "OAuth code vs API
  key" all needed unpacking. Assume nothing; a plain analogy beats precision.
- **Show, do not assert.** They trust things I demonstrate. Proving the container
  could not see the answer key by searching its filesystem landed far better than
  saying it was isolated.
- **They want the mechanics**, not just the commands. They deleted my Docker
  image so they could build it themselves. Support that instinct.
- Tables and short lines over paragraphs.

## Before starting a new project here

1. Read the project page in `projects/project-NN/README.md` and
   `docs/en/projects/`. List its deliverables — **those are Loi's**.
2. Measure the starting state myself and write it down. Whether the starter
   compiles is worth knowing before a session starts, not during one.
3. Build only the isolation and plumbing. Use the Docker lab
   ([[harness-run-isolation]]): `my-runs/docker/lab.sh` mounts only the run dir.
4. Give Loi the roadmap first — phases, tasks, and the target for each — before
   any detail. They asked for this explicitly.
5. Then hand over task 1 as requirements, and wait.

## Carry forward, do not re-derive

Project 01's `NOTES.md` already established: `set -euo pipefail` makes a script
honest; a check that never fails is worthless; confirm a new gate fails on the
broken state before trusting it; the harness delivers only what it asks for.
Point at these rather than restating them as if new.

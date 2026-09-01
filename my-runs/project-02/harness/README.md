# harness/ — what each arm hands the agent

The agent works in a run directory at `../runs/p02-<arm>/`, assembled by
`../setup-run.sh` and launched by `../run-session.sh`, which mounts *only* that
directory into the container. Everything else under `my-runs/project-02/` —
including this file — is outside the mount and invisible to the agent.

This folder holds the pieces that get copied in, so you can read and edit the
harness without opening a shell script.

## What the agent sees, by arm

| File in the run dir | `thin` | `handoff` | Source |
|---|---|---|---|
| `AGENTS.md` | minimal | **+ Definition of Done, + Session Handoff rule** | `starter` / `AGENTS.handoff.md` (here) |
| `session-handoff.md` | *absent* | **seeded template** | `session-handoff.template.md` (here) |
| `init.sh` | same | same | `init.sh` (here) |
| `docs/ARCHITECTURE.md`, `docs/PRODUCT.md` | starter's | starter's | `projects/project-02/starter` |
| `feature_list.json` | starter's | starter's | `projects/project-02/starter` |
| `src/`, `data/`, configs | identical | identical | `projects/project-02/starter` |

Two rows differ. That is the whole experiment.

## Whose files these are

`init.sh`, `session-handoff.template.md` and `AGENTS.handoff.md` were written by
Loi -- they are Project 02's actual subject matter. Claude's earlier versions of
the first two are in `../compare-after/` for diffing, not for copying.

The `thin` arm's `AGENTS.md` comes from `projects/project-02/starter` untouched.
The `handoff` arm's is `AGENTS.handoff.md` here. The course's own
`solution/AGENTS.md` is not used -- compare against it at the end instead.

## Editing the harness

Change a file here, then set up a fresh arm. Do not edit a live run directory
mid-experiment — a harness that changes under the agent measures nothing. If a
run reveals the harness is wrong, that is a finding: record it, fix the file
here, and re-run the arm from scratch.

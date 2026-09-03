# Your deliverables — requirements, not code

Everything in this directory is yours to write.

**Where files go — as it ended up.** `harness/overlay/` carries **only
`init.sh`**, copied over a tree by `check-gate.sh` and `run-arm.sh`. One copy of
the gate, shared by every arm.

Everything else — `logger.ts`, `scripts/check-architecture.sh`,
`docs/ARCHITECTURE.md`, `clean-state-checklist.md`, and `main.ts` with its SMOKE
block — lives **inside each fixture**, so a fixture is a complete, runnable app.

`main.ts` was in the overlay at first. That was wrong: the overlay copy
overwrote arm B's startup logging, silently. Found by asking why `main` had
stopped logging.

`harness/overlay-quiet/` holds a second `init.sh` that asserts the same thing
and prints no numbers — built to test whether the logger carries the signal when
the gate says only "failed". Verified, never run. Each section below gives what it
must do and how you will know it is right. No implementations — if you want to
compare afterwards, `compare-after/` is the place, and `projects/project-04/solution/`
has the course's version.

Order and timing: `PLAN.md`. Why any of it matters: `RUNBOOK.md`.

---

## 1. `init.sh` — the gate (Phase 1)

Mostly a port. `../project-03/harness/init.sh` works; the SMOKE block it depends
on is in `../project-03/fixtures/repaired/src/main/main.ts` and P04's `main.ts`
does not have it.

**Must:**
- be one command, no arguments
- have `set -euo pipefail` on the first real line
- put the success message structurally last
- drive one real user action end to end — import, index, ask — and assert on
  what comes back, not on whether a window opened
- work in a container as well as on your Mac (the `xvfb-run` branch)

**Done when:** `./check-gate.sh` reports non-zero on `fixtures/bugged` and 0 on
`fixtures/fixed`, and you saw the failure before you trusted the pass.

The scorer is already proven to work: I ran a throwaway `install + build` gate
through it and it scored **0 and 0** — a build-only gate cannot tell the two
trees apart at all (`results/gate-scorer-validation.log`). So a 2/2 from it
means something.

**Do not re-derive it.** P01 and P03 already paid for the lessons in it.

---

## 2. `logger.ts` — structured logging (Phase 3)

**Must:**
- emit one machine-readable record per event — timestamp, level, source, message,
  and structured fields
- support at least INFO / WARN / ERROR, and let a caller tag itself with a
  service name once rather than repeating it at every call site
- write somewhere a session can actually read afterwards. Electron's main and
  renderer processes have separate consoles; a log only the renderer devtools can
  see is a log an agent in a container never sees. **This is the decision in this
  file** — the rest is formatting.
- cost nothing to leave switched on

**Must not:** mention chunks, emptiness, or the number 1000. See the generic-vs-
targeted rule in `RUNBOOK.md`. A logger that knows about this bug measures
nothing.

**Instrument:** startup and service construction, IPC calls in and out, import,
indexing start/finish, and the Q&A path *including when it finds nothing*.

**Done when:** you run it against `fixtures/bugged` and `fixtures/fixed`, read
only the two log outputs, and can name the broken tree and the function at
fault. If you cannot, no agent will.

The bar to beat is the line the starter already prints:

```
[IndexingService] chunkDocument produced 6 chunks for doc-1
```

Six chunks, no error, all six empty. **A count without a size.**

---

## 3. `check-architecture.sh` — boundary guard (Phase 4)

**Must:**
- exit non-zero on a violation and 0 on a clean tree
- name the offending file, not just the count
- check at least: no Node core modules (`fs`, `path`, `os`, `child_process`) in
  `src/renderer`; no Electron IPC (`electron`, `ipcMain`, `ipcRenderer`,
  `BrowserWindow`) in `src/services`; no React in `src/services` or `src/main`
- run in under a second, so it can go in the gate

**Done when:** you have introduced each violation on purpose, watched the script
name that exact file, and watched it go back to 0 when you undid it.

**Then decide:** does it get called from `init.sh`? A checklist line can be
skipped; a gate step cannot. The playbook has an opinion — *if a check matters,
move it into the gate* — and there is a real cost argument on the other side.
Either way, say why in `NOTES.md`.

---

## 4. `docs/ARCHITECTURE.md` + `AGENTS.md` rules (Phase 4)

**Must:** state the four layers, what each may import, and how data crosses
between them. Written so someone can obey it without reading the code.

**Must not:** restate the boundaries in three files with three wordings. The doc
explains, the script enforces, `AGENTS.md` points at both. P02's duplicated IPC
contract drifted and became a compile error that outlived the project.

**Done when:** every rule the script enforces appears in the doc, and every rule
in the doc is enforced by the script — or is explicitly marked as advisory.

---

## 5. `clean-state-checklist.md` (Phase 5)

Carry P03's forward: `../project-03/harness/clean-state-checklist.md`. You
already solved the staleness problem there.

**Must:** every box names a command, and every box has a blank next to it for the
number that command printed.

Compare against the course's version, which has:

```
- [ ] No empty chunks in indexed documents (verify with GET_CHUNKS)
```

The right check, and nowhere to write the answer. A bare `[x]` is free.

**Done when:** you cannot tick a box honestly without having run something, and
inherited ticks get blanked rather than believed.

---

## What I am not writing, and why

`HOW-I-LEARN.md` draws the line: if the course's project page lists it, it is
yours. All five things above are listed on P04's page.

Mine is the isolation, the fixtures, the measured baseline, the scripts that copy
folders around, and running your work to tell you what failed. If I have written
something that should have been yours, it goes in `compare-after/` — useful to
diff against afterwards, not to read while stuck.

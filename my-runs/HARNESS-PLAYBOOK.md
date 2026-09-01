# Harness Playbook — what to do when starting a new project

Distilled from Projects 01 and 02. This is the *how*, not the theory.
Read `project-01/NOTES.md` and `project-02/NOTES.md` for why each rule exists.

---

## The whole thing in one page

```
1. MEASURE      Does it build? What is already broken? Write it down.
2. GATE         Write init.sh. Watch it FAIL. Only then trust it.
3. DONE         Define "done" in AGENTS.md as a command, not a feeling.
4. EVIDENCE     feature_list.json — every feature needs a command's output.
5. MEMORY       session-handoff.md — a form, with one un-fakeable field.
6. MAP          docs/ARCHITECTURE.md + docs/PRODUCT.md.
7. VERIFY       Break something on purpose. Does the harness notice?
```

Do them in this order. Steps 1 and 2 before any agent touches the code.

---

## Step 1 — Measure the ground before you build on it

**Do this before writing a single harness file.**

```sh
npm install && npm run check && npm run build && npm test
```

Write the result into `BASELINE.md`: what passes, what fails, and the actual
error output.

**Why:** in Project 02 both the starter *and* the official solution failed to
compile — 15 errors and 4. Finding that mid-session would have looked like the
agent's fault. Ten minutes here saved hours of misattributed blame.

**What to record:**
- exact commands run, exact exit codes
- every error, verbatim
- anything that claims to be done but isn't (check `feature_list.json`,
  READMEs, and any handoff docs against a real command)

---

## Step 2 — Write the gate first, and make it fail

`init.sh` is the whole harness in one file. Everything else is commentary.

```bash
#!/usr/bin/env bash
set -euo pipefail        # <- the only line that matters

npm install
npm run check
npm run build
npm test                 # include it, or you will never get tests

echo "All checks passed."
```

**The rules:**

| Rule | Why |
|---|---|
| `set -euo pipefail` on line 2 | Without it, a failed step is skipped and the success line prints anyway. That is a lie your future self will believe. |
| The success message is the **last** line | It must be structurally unreachable after a failure. |
| **Run it on the broken code and watch it fail** | A check you have never seen fail is a check you cannot trust. |
| One command, no arguments | If it needs explaining, it will not get run. |

**Prove it lies without `set -e`** — worth doing once, by hand:

```sh
printf 'false\ntrue\necho "All checks passed."\n' > /tmp/x.sh && bash /tmp/x.sh; echo "exit: $?"
```

It prints success and exits 0.

### The gate proves only what it measures

Project 02's gate exited 0 on an app where **nothing worked** — Electron 33's
`sandbox: true` silently killed the preload script, so the whole IPC bridge was
`undefined`. `tsc` and `vite` both reported success.

**So add a step that looks at the thing running**, not just compiling:

- a launch that exits non-zero if the window never renders
- a smoke test that drives one real user path end to end
- a screenshot, if the project has a UI

Compiling proves compiling. Nothing more.

---

## Step 3 — Define "done" as a command

In `AGENTS.md`:

```markdown
## Definition of Done

A feature is NOT done because you believe it is. It is done when:

1. `./init.sh` exits 0. Run it. Do not predict its result.
2. Its entry in feature_list.json has status "pass" and an evidence field
   naming the command you ran and what it printed.
3. Evidence describing code you READ, rather than a command you RAN,
   does not count.
```

**Point 3 is the one people leave out.** Without it you get evidence like
*"BrowserWindow is constructed with the correct options"* — code inspection
dressed up as proof. In P01 that exact sentence accompanied a black window.

---

## Step 4 — `feature_list.json` with a real evidence field

```json
{
  "id": "document-import",
  "status": "not-started",
  "evidence": null,
  "testedAt": null
}
```

**Why a field and not prose:** an empty field with a specific question is much
harder to fill with nothing than a paragraph is. This held up in both projects.

Good evidence names the command and the output. Bad evidence describes the code.

---

## Step 5 — `session-handoff.md`: a form with one un-fakeable field

Ship it as a **blank template with headings**, not an instruction to "write
notes". Session A fills it; Session B reads it first.

```markdown
## Last `./init.sh` result
<!-- Paste the actual exit code. Not "should pass". Run it. -->

## What I finished
## What's half-done          <- exactly where I stopped, what is broken now
## Decisions I made          <- so the next session does not re-argue them
## Files I changed           <- path + one line each
## Blockers
## Next step                 <- the single next thing
```

**The first field is the load-bearing one.** Everything else is the agent's
opinion about its own work; that one is a number a command produced. In P02 the
agent wrote *"Ran ./init.sh for real (not predicted). Exit code 2"* and pasted
the full output. All four of its claims verified true.

**What this buys, measured:** the next session read **12 files** before its
first edit, versus **26** without it. It went straight to the checklist instead
of forming a picture from scratch.

**Its limit:** the rule only fires if the session gets to stop. A crash, a
context limit, or a closed laptop defeats it entirely. Do not treat a handoff
as guaranteed.

---

## Step 6 — The map: `docs/` and `CLAUDE.md`

| File | Contains |
|---|---|
| `docs/ARCHITECTURE.md` | layers, boundaries, data flow — so it is not re-invented |
| `docs/PRODUCT.md` | what the thing is supposed to do |
| `CLAUDE.md` | build commands + key file map |
| `AGENTS.md` | short entrypoint that links to the above |

Keep `AGENTS.md` short and pointing outward. One giant instruction file gets
skimmed.

**Do not duplicate a contract in two places.** Project 02's app declared its IPC
surface in `types.d.ts` *and* inline in `App.tsx`; the copies drifted and became
a compile error. One source of truth per contract.

---

## Step 7 — Verify the harness, not just the code

**Break something on purpose and confirm the harness notices.**

- comment out a required field → does `check` fail?
- point an import at a missing file → does the gate catch it?
- mark a feature `pass` with empty evidence → does anything object?

If nothing fails, that part of your harness is decoration.

**And when the harness misses something, fix the harness — not the app.**
In P01 the fix was a 4th gate in `init.sh`, then
`claude -p "Run init.sh and fix whatever fails."` The agent fixed the app. You
fix the harness; the harness fixes the app.

---

## Rules that keep proving themselves

1. **The harness delivers what it asks for, and nothing else.** No test gate,
   no tests. No handoff rule, no handoff. No render check, black window.
2. **Whatever is in the folder is the brief.** In P01 three files in
   `data/sample-documents/` looked like fixtures; the agent read them as a
   design spec — reasonably. Audit what is sitting in the directory.
3. **A gate you have not seen fail is not a gate.**
4. **Evidence must name a command.** Anything else is the agent's opinion.
5. **Reciting a lesson is not applying it.** I could quote "a harness proves
   only what it measures" and still shipped a gate that only measured
   compiling.

---

## Mechanics — the things that waste an afternoon

**Isolation (only if running controlled experiments):** use a container that
mounts *only* the run directory. Location does not protect an experiment; the
mount does. Verify it — search the container's filesystem for your answer key
and confirm nothing is found.

```sh
docker run --rm -it -v <run-dir>:/work -v <auth-volume>:/home/agent <image> \
  claude --permission-mode bypassPermissions "<prompt>"
```

| Gotcha | Fix |
|---|---|
| Session stalls doing nothing | default permission mode is waiting for approval → `--permission-mode bypassPermissions` (safe in a container) |
| Claude Code shows a blank screen | `xvfb-run` breaks the interactive terminal — drop it for interactive sessions, keep it for headless `-p` |
| `xvfb-run: xauth command not found` | install `xauth`; `xvfb` alone is not enough |
| `npm install` dies with EACCES | root-owned entries in `~/.npm` → `--cache <somewhere-else>` |
| App will not start in a container | a macOS `node_modules` cannot run in Linux; install inside |
| Cannot exit a stuck session | `docker kill <id>` from another terminal |

**Stopping a session part-way is hard.** Count file edits, not minutes. A clock
gave "finished everything in 6m54s" and "zero files written" on consecutive
tries; "stop after ~4 edits" worked.

---

## Day-one checklist

```
[ ] Ran the build myself. Wrote BASELINE.md.
[ ] init.sh exists, has set -euo pipefail, and I watched it FAIL.
[ ] init.sh checks something beyond compiling (launch / smoke / render).
[ ] AGENTS.md defines done as "./init.sh exits 0" + evidence naming a command.
[ ] feature_list.json has an evidence field, empty, for every feature.
[ ] session-handoff.md template exists, with a field demanding a command's output.
[ ] docs/ARCHITECTURE.md and docs/PRODUCT.md exist and are current.
[ ] I broke something on purpose and the harness caught it.
[ ] Nothing in the folder is a stray instruction the agent will read as a brief.
```

If you only have time for two: **BASELINE.md and init.sh.**

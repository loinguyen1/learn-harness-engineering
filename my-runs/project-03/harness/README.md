# Your harness files go here

Everything in this directory is yours to write. `setup-run.sh` copies these into
both arms. Nothing here is written for you; the course lists all of it as a
Project 03 deliverable.

Write them in this order. Each one is only worth writing once the one before it
exists.

---

## Task 1 — `init.sh`  ← start here

**Requirement.** One command, no arguments, that exits non-zero when the project
is not in a working state and exits 0 when it is.

**Success criterion.**

```bash
./check-gate.sh
```

runs your gate against `fixtures/broken/` and `fixtures/repaired/` and prints
both exit codes. You want **non-zero on broken, 0 on repaired.** Identical codes
mean the gate measures nothing.

**The part that is actually hard.** Getting it to fail on `broken/` is easy —
`npm run check` exits 2 there and you are done in four lines. That gate is not
finished, and `BASELINE.md` section 1 is why:

> The starter's app **renders perfectly with a dead IPC bridge.** `npm run build`
> exits 0. No error is printed anywhere. The rendered page is *byte-identical*
> whether the bridge is alive or dead — I compared both.

So a gate built on `check` + `build` will pass an app where import, list,
delete, indexing and Q&A are all dead. So will a screenshot. P02's notes ended
with *"the next gate needs a launch-and-look step"* — **launch-and-look is not
enough either.**

The question to answer: *how do you make a script fail when nothing fails?*

**A stronger test of your gate than `check-gate.sh`.** Take `fixtures/repaired/`,
put back the single line that killed the bridge (`REPAIR.md`, change A), and run
your gate. If it still exits 0, it has the same blind spot the starter shipped
with.

I ran that test against a throwaway five-line `check` + `build` gate.
`../results/gate-blind-spot.log`:

```
$ ./init.sh
All checks passed.
naive gate exit: 0

$ xvfb-run -a npx electron .      # same tree
PROBE: BRIDGE DEAD
```

The same naive gate passes `check-gate.sh` cleanly — broken 2, repaired 0. That
is the trap: it looks like a working gate right up until the failure is one that
compiles.

**Decide on purpose:** `npm test` runs `vitest run` against zero test files and
exits 1. P01 and P02 both left this out, and both got no tests. Third time.

I wrote a working answer to the bridge problem while measuring the baseline. It
is in `../compare-after/`. Diff against it *after* yours discriminates — not
while you are stuck.

---

## Task 2 — `AGENTS.scoped.md`  ← the experiment's only variable

Arm 1 gets the starter's `AGENTS.md` untouched. Arm 2 gets this. **It is the
only difference between the arms**, so anything you put in it that is not about
scope control weakens the result — that was P02's stated limitation.

**Requirement.** Rules that would change what an agent does when:

- `feature_list.json` says `not-started` about code that is already written and
  working (`document-chunking`, `grounded-qa` — `BASELINE.md` section 2)
- it says `pass` about seven features with no command ever run
- a fresh session arrives with three unfinished features and no memory

**Success criterion.** For each rule, name the specific behaviour in the results
table (`RUNBOOK.md`) it should change. A rule you cannot attach to a row is a
rule you cannot tell worked.

The starter's `AGENTS.md` already has a Definition of Done and a Session Handoff
section. Read them first — you are adding to a non-trivial control, not to
nothing.

---

## Task 3 — the continuity artifacts (held constant, both arms)

`session-handoff.template.md`, `claude-progress.template.md`,
`clean-state-checklist.md`.

These are **not** the variable — P02 already measured the handoff and got 26
files re-read versus 12. Both arms get identical copies. You still write them,
because three sessions per arm need them to function, and because P03 lists them.

**Carry forward, do not re-derive.** P02's `session-handoff.md` template already
worked: a form with headings, one field demanding a command's actual output
(`Last ./init.sh result` — *"Paste the actual exit code. Not 'should pass'.
Run it."*). All four claims written into that field verified true. Start from
`../project-02/harness/session-handoff.template.md` and adapt.

**What P02 left open, for `claude-progress.md`:** the handoff rule only fires if
the session gets to stop. A crash, a context limit, or a closed laptop defeats
it. A progress log written *as you go* is the obvious answer — but only if
something makes it get written. Ask what forces the write.

**For `clean-state-checklist.md`:** the reference solution ships one with
`- [x] npm run check passes with zero TypeScript errors` ticked. It exits 2.
A checkbox is a claim. Make yours one that is harder to tick without running
something.

# Project 02 — Review Notes

*Completed 2026-08-30. Written to look back at, not to re-read in full.*

---

## The one idea

**A weak harness does not make an agent lie. It makes the next agent start over.**

I went in expecting the thin arm to produce inflated claims — P01's lesson
repeated one level up. It didn't. Across three sessions, every claim either arm
made was true when I checked it. What the thin arm actually cost was **memory**:
Session A knew which files it had touched, knew the import-path bugs were
pre-existing, knew `file.path` was dead. None of it survived the session
boundary. Session B paid to learn it all again.

---

## What actually happened

Same model (Sonnet 5). Same prompt. Same code. Two files differed.

| | Arm 1 — thin | Arm 2 — my harness |
|---|---|---|
| Session A left behind | nothing | a handoff, every claim verified |
| `feature_list.json` after A | **wrong** — `not-started` while 4 files were edited | correct, deliberately untouched |
| **Session B: files read before first edit** | **26** | **12** |
| Session B's opening move | *"Backend services already look complete"* — worked out from scratch | *"work through the next steps from the handoff"* |
| Re-derived bugs A had already diagnosed | yes | no |
| Final `init.sh` | exit 0 | exit 0 |

**54% less rediscovery.** The number understates it. Arm 1's Session B had to
*form a picture*; Arm 2's Session B **read a checklist and executed it**.

---

## The three lessons, in the order I hit them

**1. My gate passed on a dead app.**

`init.sh` said exit 0. Electron 33 defaults `sandbox: true`, which silently
killed the preload script's `require('../shared/types')`, so
`window.knowledgeBase` was `undefined` and *nothing in the app worked*. `tsc`
and `vite` both reported success. No error surfaced anywhere.

Both arms' Session B found it — and only because each went further than my
harness asked, launching Electron under xvfb and taking screenshots.

P01 taught me a harness proves only what it measures. I built a gate that
measures compiling, and it proved compiling. **The lesson didn't transfer just
because I could recite it.**

**2. A field that demands a command's output does not get faked.**

My template asked for `Last ./init.sh result` — *"Paste the actual exit code.
Not 'should pass'. Run it."*

Session A wrote: *"Ran ./init.sh for real (not predicted). Exit code 2."* and
pasted the full `tsc` output. I verified all four of its claims — which files it
edited, which it left alone, that `feature_list.json` was untouched, the exit
code. All true.

Same trick as P01's `evidence` field: **an empty field with a specific question
is harder to fill with nothing than prose is.**

**3. "Write a handoff before you stop" assumes you get to stop.**

In Arm 1 I killed the session outright. In Arm 2 I had to *ask* it to wrap up —
otherwise the rule never fires and Arm 2 is just Arm 1.

A crash, a context limit, or a closed laptop defeats the whole mechanism. The
rule is not self-enforcing. **A handoff written only at a graceful exit is a
handoff you cannot rely on.**

---

## Things worth remembering

**Stopping a session part-way is genuinely hard.** Three attempts:

| Attempt | Rule used | Result |
|---|---|---|
| 1 | "two of three features" | too late — finished everything in **6m54s** |
| 2 | 2-minute timer | too early — **zero files written** |
| 3 | **stop after ~4 file edits** | correct |

Count edits, not minutes. The course says "stop Session A part-way" as though
it were easy. It isn't — you're catching a process mid-flight.

**The course's own premise has expired.** Project 02 is written as a two-session
exercise. A current model does the whole thing in seven minutes. The task has to
be forced open; it doesn't split on its own.

**The reference solution doesn't compile.** 4 errors. The starter has 15. And
the solution's own `session-handoff.md` claims *"all 7 features at pass"* while
its check exits 2 — nobody ran a command before writing that sentence. Measuring
the ground before starting was worth more than any other setup step.

**Both arms found the same duplicate declaration** I'd found while measuring the
baseline: `window.knowledgeBase` is declared in `types.d.ts` *and* inline in
`App.tsx`, and the copies had drifted. Arm 2's Session A wrote it down for the
next session. Arm 1's did not.

---

## Honest limitations

- **Asymmetric stops.** Arm 1 was killed; Arm 2 was asked to wrap up. That
  difference favours Arm 2 and I can't subtract it. Lesson 3 above is the
  finding it produced, not an excuse.
- **One run per arm.** n=1. Rediscovery counts (26 vs 12) could move.
- **Two variables, not one.** My `AGENTS.handoff.md` added a Definition of Done
  *and* a handoff rule together. Faithful to the course, but I can't say which
  did the work.
- **The gate never checked tests or the running app** — see lesson 1.

---

## Gaps left open on purpose

1. **`init.sh` never runs `npm test`.** Same gap as P01, same root cause: the
   Definition of Done doesn't mention it. In run 1 the agent wrote 9 tests
   anyway, unasked, in the *thin* arm.
2. **No check that the app renders anything.** The direct cause of lesson 1.
   The next gate needs a launch-and-look step, not just a build step.
3. **The duplicate `Window` declaration was never structurally fixed** — both
   arms patched around it.

---

## Method notes

- Isolation came from Docker, not discipline: `lab.sh` mounts only the run
  directory, so the repo, the answer key, and my own `BASELINE.md` are not on
  the agent's filesystem. Verified by searching the container for them —
  nothing found.
- `xvfb-run` breaks Claude Code's interactive terminal. Fine for headless
  `claude -p`; drop it for interactive sessions.
- Default permission mode stalls an unattended session at the first edit
  prompt. `--permission-mode bypassPermissions` is safe in a container.
- A container-mounted run directory can live inside the repo. Location is not
  what protects the experiment; the mount is.

---

## Files

- `results/p02-thin/` — Arm 1 final code
- `results/p02-handoff/` — Arm 2 final code, including the handoff it wrote
- `results/p02-thin-run1-finished-in-7min/` — the run that finished too fast
- `results/observations.md` — raw notes taken during the runs
- `BASELINE.md` — measured starting state, written before any session ran
- `harness/` — `init.sh`, `session-handoff.template.md`, `AGENTS.handoff.md`

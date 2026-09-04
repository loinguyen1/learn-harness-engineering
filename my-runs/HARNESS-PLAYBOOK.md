# Harness Playbook

**You are an agent, reading this at the start of a new project, to set up a
harness for it.**

A harness is what makes an agent's work trustworthy: a gate that cannot lie, a
definition of "done" that names a command, and a record that survives a
restart. Without one, an agent reports success and nobody finds out otherwise.

**Do the steps in order. Step 0 is a conversation — do not skip it and do not
guess the answers.** Steps 1 and 2 come before touching any feature work.

Earned the hard way across Projects 01–05. Every rule here cost something; the
evidence is in `project-0N/NOTES.md`. **Where something is recommended without a
measured run behind it, it says so on the spot.**

---

## The whole thing in one page

```
0. ASK        Interview the human. You cannot write a gate for an app you
              do not understand.
1. MEASURE    Does it build? What is already broken? Write it down.
              (No code yet? The order flips -- see Step 1.)
2. GATE       Write init.sh. Watch it FAIL. Only then trust it.
              Make its assertion PRINT the numbers it compared.
2b. OBSERVE   Logs that report a size, not just a count. Sent somewhere an
              agent can actually read.
3. DONE       Define "done" in AGENTS.md as a command, not a feeling.
3b. REVIEW    For the part no command can check: a reviewer that did not
              write the code, scoring against a written rubric.
4. EVIDENCE   feature_list.json — every feature names a command's output.
5. MEMORY     session-handoff.md + a per-feature progress log.
6. MAP        docs/ARCHITECTURE.md + docs/PRODUCT.md, and a script in the
              gate that ENFORCES the layer rules the doc describes.
7. VERIFY     Break something on purpose. Does the harness notice?
```

---

## Step 0 — Interview the human

**Ask these. Do not infer them from the code.** The one that matters most is
Q3: everything in Step 2 depends on it, and you cannot work it out alone,
because only the human knows what the product is *for*.

Ask in three or four small batches, not as a wall of twelve questions.

**First batch — what am I working with?**

1. What is this project, in one sentence? What does a user do with it?
2. How do I run it? The exact command.
3. **What is ONE real thing a user does that proves it works?** Not "it
   starts". Something that goes from the outside edge to the data and back —
   fetch a real record, run a real query, get a real answer.
4. What should that action give back that I can check? A number, a string, a
   status code — something a script can compare.

**Second batch — what should the gate include?**

5. Is there a test suite? Should the gate run it? *(Say plainly: if the gate
   does not run tests, nobody will write tests. Three projects in a row have
   proved this.)*
6. What breaks most often here? What are you most worried about?
7. What has to be true before you would ship this — beyond it compiling?
7b. **Which parts of "good" can no command check?** Layout, wording, whether
   the answer actually answers the question, whether the code is
   maintainable. *(These are Step 3b's job. If the honest answer is "none of
   it", say so and skip Step 3b — a reviewer you do not need is the most
   expensive thing in this playbook.)*
8. **When something goes wrong, how do you currently find out where?** What do
   you look at first? *(If the answer is "I add print statements and re-run",
   that is the gap Step 2b fills. If it is "I read the logs", ask to see one —
   and check whether it reports sizes or only counts.)*
9. **Are there layers or directories that must not talk to each other?** A UI
   that must not hit the database directly, a reporting layer that must never
   write, a module that must stay framework-free. *(These become a script in
   Step 6, not a paragraph nobody reads.)*

**Third batch — practicalities**

8. Where does the app keep its state (database, files, a data directory)? The
   gate needs a clean slate, or its results drift between runs.
9. Where will agents run — your machine, a container, CI? *(This decides
   whether the gate needs a fake display, and it is the source of the most
   wasted afternoons: see Mechanics.)*
9b. **When you finish a work session on this, what has to be true before you
   walk away?** Push every answer until it names a command. *(This is what
   Step 5's checklist will hold. Source it from the human — they know which
   check nobody remembers to run.)*
10. Anything I must not touch? *(Write the answer into `AGENTS.md` as a literal
   list of paths, not a sentiment. **No written constraint, no constraint** —
   rule 1. An answer that lives only in this conversation protects nothing.)*

**Then say back what you heard**, in the form of the check you intend to write,
and get agreement before writing it. If the human cannot answer Q3, that is the
most important finding of the day — it means nobody has defined what working
means, and the gate cannot be built until they do.

---

## Step 1 — Measure the ground before you build on it

### If there is no code yet, the order flips

Nothing to measure, and Q3 has no answer yet — the app does not exist. So:

1. **Ask the human what the first user action will be** (Q3, in the future
   tense). *"A user posts a task and gets it back with an id."*
2. **Write `init.sh` with that as its last step, before any code exists.**
   Run it. It fails, loudly, because the thing it checks is not built. **That
   is the correct starting state** — you have watched it fail, so you can trust
   it from here.
3. Write `BASELINE.md` saying so: no code, gate fails at step N, this is
   expected.
4. **Build the first feature until the gate goes green.** Nothing else.

The gate becomes the definition of the first milestone instead of an audit of
an existing one. Everything from Step 3 onward is unchanged.

The rest of this step is for a project that already has code.

### Measuring an existing project

**Before writing a single harness file.** Run whatever the project's own
commands are:

```sh
<install> && <typecheck/lint> && <build> && <test>
```

Write the result into `BASELINE.md`: what passes, what fails, and the **actual
error output**, verbatim.

Then audit every claim already in the repo — READMEs, a feature list, a
progress log, a checklist — against a real command.

**Drive the same path your gate will drive.** P04's baseline probe called
`startIndexing()` with no argument — the batch path. The gate called
`startIndexing(docId)` — the single-document path. Only the batch path worked,
so the baseline recorded a healthy number for a tree that was broken, and the
gate contradicted it later. **A probe that takes a different route than the gate
is measuring a different app.**

**And check whether old bugs came back.** If this starter derives from an
upstream solution rather than from your own repaired tree, defects you already
fixed are probably present again. P04's starter shipped with P02's duplicated
declaration and *both* of P03's bugs. Do not assume a later stage inherited your
repairs.

**Why:** in Project 02 both the starter *and* the official solution failed to
compile. In Project 03 the reference solution shipped
`- [x] npm run check passes with zero TypeScript errors` ticked, while that
command exited 2, and its feature list was wrong about **10 of 11 features**.
Finding any of that mid-session looks like the agent's fault. Ten minutes here
saves hours of misattributed blame.

---

## Step 2 — Write the gate first, and make it fail

`init.sh` is the whole harness in one file. Everything else is commentary.

```bash
#!/usr/bin/env bash
set -euo pipefail        # <- the only line that really matters

<install>
<typecheck / lint>
<build>
<tests>                  # include them, or you will never get tests
<ONE REAL USER ACTION>   # <- the step everyone leaves out. See below.

echo "All checks passed."
```

| Rule | Why |
|---|---|
| `set -euo pipefail` on line 2 | Without it a failed step is skipped and the success line prints anyway. That is a lie your future self will believe. |
| The success message is the **last** line | It must be structurally unreachable after a failure. |
| **Run it on the broken code and watch it fail** | A check you have never seen fail is a check you cannot trust. |
| One command, no arguments | If it needs explaining, it will not get run. |

Prove it lies without `set -e` — worth doing once, by hand:

```sh
printf 'false\ntrue\necho "All checks passed."\n' > /tmp/x.sh && bash /tmp/x.sh; echo "exit: $?"
```

It prints success and exits 0.

### Where these files go

| file | where | committed? |
|---|---|---|
| `init.sh` | **repo root** | yes — it is the project's front door |
| `AGENTS.md`, `CLAUDE.md` | repo root | yes |
| `feature_list.json` | repo root | yes |
| `session-handoff.md`, `claude-progress.md`, `clean-state-checklist.md` | repo root | yes — the next session inherits them from the repo, so a gitignored one is useless |
| `docs/ARCHITECTURE.md`, `docs/PRODUCT.md` | `docs/` | yes |
| `BASELINE.md` | repo root, or wherever the human keeps working notes | yes |

**One copy of each.** Do not keep a template in one directory and a live copy
in another and hand-sync them — that is the duplicated-contract bug applied to
your own harness. If a template genuinely must exist separately, have one
script copy it, and never edit the copy.

**Monorepo with several services:** one gate at the root that calls each
service's own check, and a per-service `init.sh` where each service is
independently runnable. The root gate is the one a human or agent runs; it must
still be a single command with no arguments. If a service has no meaningful
product check of its own, say so out loud rather than letting the root gate
imply coverage it does not have.

**If the project already has CI:** `init.sh` is not a replacement for it, and
not a duplicate of it. CI runs on push, for the team. `init.sh` runs *now*, for
whoever is about to change something. The cleanest arrangement is for CI to
call `./init.sh` — then there is one definition of "working" instead of two
that drift. If CI does something the gate cannot do locally (deploy previews,
matrix builds), leave it in CI and say so in `AGENTS.md`.

### The product check — the step everyone leaves out

Compiling proves compiling. Rendering proves rendering. **Only using it proves
it works.**

The shape, in any language:

```
start it  →  do ONE real user action  →  check the answer  →  exit 0 or non-zero
```

Usually one line of shell. Only a GUI app needs code inside it, because it has
no command-line surface to poke.

| project type | the one action | in the gate |
|---|---|---|
| web API | fetch a real record | `curl -f localhost:3000/users/1` |
| website | assert real content is on the page | `curl -s localhost:3000 \| grep -q "Sign in"` |
| CLI tool | run it on known input | `mytool sample.txt \| grep -q expected` |
| database-backed | read one real row | `psql -c "select 1 from users limit 1"` |
| worker/queue | enqueue one job, assert it completed | poll the status, fail on timeout |
| desktop / GUI | the app checks itself and exits with a code | see below |

**Give it a clean slate.** Point the app at a temporary data directory for the
duration of the check, or its results drift as old data accumulates.

**A GUI app** has to be driven from inside: launch it with a flag
(`SMOKE=1`), have it perform the action, print the result, and call its own
exit-with-code. Headless environments need a fake screen — `xvfb-run` on Linux.
Detect it rather than assuming:

```bash
if command -v xvfb-run >/dev/null 2>&1; then
  SMOKE=1 xvfb-run -a <launch>
else
  SMOKE=1 <launch>
fi
```

A gate that only works on the author's laptop is not a gate.

### The trap: three things can all look fine while nothing works

Project 03's app **rendered perfectly with a dead IPC bridge.** Measured:

| check | dead app | working app |
|---|---|---|
| build | exit 0 | exit 0 |
| launch it and look | window opens | window opens |
| screenshot | **byte-identical** | **byte-identical** |

No error was printed anywhere. Import, search and Q&A were all dead.
Project 02's notes had concluded *"the next gate needs a launch-and-look
step"* — **launch-and-look passes this too.**

### Pick an action that goes all the way through

Project 03's first product check asked *"is the connector alive?"*. It passed,
and still missed a bug where indexing a single document returned **zero
citations** — chunks written, none retrievable, everything green. Widening the
check to `import → index that one document → ask → assert citations > 0` caught
it, and reverting the fix turned the gate red on demand.

**"Does it start" proves a port is open.** Reach the data and come back.

### Make the assertion print what it compared

This is one line of change and it is the highest-value line in the playbook.

```
BAD    if (!ok) { exit(1) }                     -> "it failed"
GOOD   print({chunks, citations}); if (!ok) ...  -> "5 chunks, 0 citations"
```

**A gate that prints the numbers it compared is your first and cheapest
observability.** It costs nothing, it runs on every change, and it converts
*"something is broken"* into *"these two numbers disagree"* — which is a
location, not an alarm.

Measured in P04: an agent was handed a broken app and this one line of gate
output —

```
ROUNDTRIP: {"chunks":5,"citations":0}
```

— and quoted it as its first move: *"chunking works (5 chunks) but Q&A returns
0 citations."* Three files later it had the root cause. A second agent with a
full structured logger did the same job in the same three files. **The gate's
own output had already done the logger's work.**

So: whatever your product check asserts on, print both sides of the comparison.
`assert count > 0` should print the count.

### A real one, filled in

From Project 03 — an Electron desktop app. The hardest case, because a GUI has
no command-line surface to poke. Everything above the last step is ordinary;
the last step is the point.

```bash
#!/usr/bin/env bash
# init.sh -- one command that says whether this project is working.
set -euo pipefail

# 1. Dependencies. --cache avoids root-owned entries in ~/.npm.
npm install --cache /tmp/npm-cache

# 2. Type check. THIS is the step that bites -- `npm run build` alone exits 0
#    on code with 15 type errors in it, because vite does not type-check.
npm run check

# 3. Build.
npm run build

# 4. Does the app actually WORK? Steps 2 and 3 both pass on an app whose
#    UI<->backend bridge is dead: nothing imports, nothing answers, and no
#    error is printed anywhere. A window still opens and renders identically.
#    So: launch the real app, have it do one real user action, read the answer.
if command -v xvfb-run >/dev/null 2>&1; then
  SMOKE=1 xvfb-run -a npx electron .      # containers/CI: fake screen
else
  SMOKE=1 npx electron .                  # a window flashes open and closes
fi

# 5. Is the clean-state checklist describing code that still exists?
#    A warning, not a failure -- this runs mid-work, where staleness is normal.
if [ -f clean-state-checklist.md ] \
   && grep -q '^- \[x\]' clean-state-checklist.md \
   && [ -n "$(find src -newer clean-state-checklist.md -type f -print -quit)" ]; then
  echo "WARNING: checklist has ticked boxes but src/ has changed since."
fi

# Last line on purpose: unreachable after any failure above.
echo "All checks passed."
```

`SMOKE=1` switches on a block inside the app itself, which is the part a GUI
forces on you:

```
when the window has finished loading:
    ask the window whether the bridge object exists
    if not            -> print BRIDGE: undefined, exit 1
    import a document
    index THAT ONE document          <- the specific path a bug once lived in
    ask a question
    print the chunk and citation counts
    exit 0 only if chunks > 0 AND citations > 0
    on a timeout      -> print and exit 1   (a gate that hangs is worse than
                                             one that fails)
```

It also points the app at a temporary data directory while `SMOKE=1`, so the
counts it asserts on do not drift as old runs accumulate.

**Measured against three trees:**

```
broken code (15 type errors)            -> exit 2
working code                            -> exit 0   ROUNDTRIP: {"chunks":5,"citations":2}
compiles + builds clean, bridge dead    -> exit 1   BRIDGE: undefined
bug fix reverted, bridge fine           -> exit 1   ROUNDTRIP: {"chunks":5,"citations":0}
```

The last two lines are the ones a `check` + `build` gate gets wrong. **For a
web API or a CLI, the whole of step 4 is one line of `curl` or one piped
command** — the Electron version is long because a GUI is the awkward case, not
because a product check is inherently hard.

---

## Step 2b — Observability: a size, not a count

The gate says *broken*. Only the app can say *where*.

Four rules below. The first is the one that gets skipped, and the second is the
one that quietly makes the whole thing useless.

### A count says the loop ran. A size says it worked.

Measured in P04. The app logged this, on a completely broken index:

```
[IndexingService] chunkDocument produced 5 chunks
```

Five chunks. No error. **All five empty.** The log was there; it reported an
occurrence and no magnitude, so it could not tell working from empty.

One field turns it into a diagnosis:

```
chunkDocument complete { totalChunks: 5, totalChars: 0 }
```

**Audit every log line in the codebase for this shape.** It is everywhere:

| reports a count | should also report |
|---|---|
| `synced 412 records` | how many bytes / non-null rows |
| `wrote 30 files` | total size |
| `processed 1000 messages` | how many succeeded |
| `found 5 matches` | the matches, or their total length |

### Where the log goes decides whether it exists

An app can have two output streams — one a human sees on a screen, one a
terminal captures. In Electron it is the renderer console versus the main
process's stdout; in a web app the browser console versus the server log; in a
mobile app the device log versus anything at all.

**An agent has no screen.** A log written to the human-visible stream is a log
your agent will never read, in a container or in CI.

Route to the stream a pipe can capture. In P04 that routing decision mattered
more than the format did — JSON was cosmetic by comparison.

### Generic, not targeted

| | |
|---|---|
| **Generic** ✓ | `{ totalChunks, totalChars }` — exposes a whole class of bugs |
| **Targeted** ✗ | `WARN: chunks are empty!` — the answer written into the instrument |

If a log line would be pointless on a codebase that did not have the bug you
are currently chasing, delete it. A targeted line finds one bug and teaches you
nothing about the next.

### And say something on the failure path

The quietest way for a search or query product to be broken is to return a
confident answer with nothing behind it. Log the empty result, and log **two**
numbers so the failures can be told apart:

```
WARN answered with no citations { chunksSearched: 5, chunksWithContent: 0 }
```

`chunksSearched: 0` means nothing was indexed. `5` with `0` content means five
things were indexed and all were blank. Different bugs, different fixes.

### How much is enough

Startup, each boundary crossing (an IPC call, an HTTP handler, a job pickup),
each expensive step's result **with its size**, and every failure path. That is
it. Do not instrument every function; instrument every place a number is
produced or crosses a layer.

### How you know it works

Run it against a broken tree and a working tree. Read **only** the two log
outputs, not the code.

**Can you name the broken one and the function at fault?** If you cannot, an
agent will not either — and you have found that out before spending a day on it.

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
dressed up as proof. In P01 that exact sentence accompanied a black window; in
P03 the reference solution's evidence for all four features is written that way.

### Also state: one feature at a time

Finish one feature completely — implement, verify, record — before starting the
next. Not for tidiness: so that when something breaks you know which change did
it, and so each feature has its own proof rather than a shared one.

---

## Step 3b — The part no command can check

Everything up to here assumes "done" can be written as an assertion. Most of it
can. Some of it cannot: is the layout usable, does the answer actually answer
the question, would a reviewer merge this without comment.

For that part the question is not *what do you check*. It is **who holds the
pen.**

### The rule

**Whatever scores the work must not be whatever wrote it.**

Not because agents lie. Measured in P05 on *identical code* — one
implementation scored twice, differing only in whether the scorer had written
it:

| Criterion | Self | Independent |
|---|---:|---:|
| functional completeness | 5 | 5 |
| role distinction | 5 | 5 |
| citation display | 5 | 5 |
| edge cases | 5 | 5 |
| visual design | 4 | **2** |
| interactivity | 5 | **3** |
| timestamps | 5 | 4 |
| code quality | 4 | 3 |
| **mean** | **4.75** | **4.00** |

**The four that matched are the checkable ones. The four that moved are the
judgment calls.** The generator did not misreport its work — it graded itself
exactly right wherever "right" had an answer, and rounded up wherever it did
not. The 0.75 gap is 7.5x the scorer's own noise, measured over replicates.

Self-review was not lazy, either. One agent found a genuine defect in its own
code by cross-referencing a file it had not written — and then scored itself
4.6, fixed the bug, and scored itself 4.6 again. **The generosity is in the
number, not the prose, and the number does not track the code.**

> Separate the reviewer where a script cannot decide. Where a script *can*
> decide, self-review was accurate — and a script is cheaper than either.

### Three files, three calls

| File | What it holds |
|---|---|
| `brief.md` | requirements as observable behaviour, the constraints, and "a filled rubric is part of done" |
| `rubric.md` | 5–8 criteria, scored 1–5, blank |
| `revise.md` | apply every required revision; record disagreement, do not act on it |

Then: **generate → review in a fresh context → revise.** Three calls. No
framework.

A fresh context means a new session, a subagent, or a different model — not the
same session told to "now act as a reviewer". Verify that the separation is
real rather than assuming it: have the second call answer something it could
only know by having read the first call's files. If it can, you have one
context, not two.

### The two lines that make a rubric work

```markdown
Every score below 5 requires a concrete defect in the Notes column.
"Could be better" is not a defect. Name the line, the input, or the interaction.

5 means a reviewer would merge it without comment.
```

Without the first line you collect vibes with numbers attached. Without the
second, everything is a 4.

### Strip the author's self-assessment mechanically

Do not instruct the reviewer to ignore it. Copy the source files into a clean
directory and leave every note the author wrote behind. An instruction not to
look is not a control.

### Never compare two scores from different scorers

The course's own P05 solution reports 1.6 → 3.3 → 4.9 across its three variants.
Read the header of each rubric: the 1.6 is marked *"Evaluator: Self"*, the 4.9
was scored by a dedicated evaluator. **That gradient compares scorers at least
as much as it compares code.**

For scale: every self-score in P05's own four arms landed 4.4–4.75, while the
course's self-score was 1.6. Two self-scores three points apart is a wider
spread than the entire effect being claimed.

If you are going to compare at all: **one fixed scorer, run after everything
finishes, seeing only the source and the frozen brief** — never which variant
it is looking at, never the variant's own notes. Otherwise report one score and
make no comparison.

That was run. Four arms, one blind scorer, arms shuffled and the key written
only afterwards:

| arm | contexts | reviewer | blind score |
|---|---:|---|---:|
| A single | 1 | itself | 4.0 |
| A+ single + rubric | 1 | itself, holding the rubric | 4.4 |
| B gen-eval | 2 | fresh context | **4.5** |
| C plan-gen-eval | 3 | fresh context, against a contract | 4.1 |
| *untouched placeholder* | — | — | *1.37* |

**The course's gradient did not reproduce.** It reports the three-role variant
highest by a wide margin; scored blind, the three-role arm came fourth of four
and the two-role arm came first. n=1 per arm, one replicate each.

### Do not pay a reviewer for what a script can check

The reviewer earns its cost exactly in the space an assertion cannot reach. Put
functional completeness, edge cases and wiring in `init.sh`, where they are free
and repeatable, and spend the review on layout, interaction and maintainability.
This is the other half of P04's finding: the gate's own assertion output already
carried the checkable signal.

**And the rubric is worth more than the second context.** In the blind numbers
above, handing a single agent the rubric moved it 4.0 -> 4.4; adding a whole
separate reviewer on top moved it 4.4 -> 4.5. The first is one line in a prompt.
The second is an extra agent call every iteration.

So: **write the rubric first and run it single-context. Add the separate
reviewer when you need the score to be honest, not to make the code better** —
that is what the 4.75-vs-4.00 pair measures, and it is a different job.

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
harder to fill with nothing than a paragraph is. This has held up in three
projects.

### And add a Trust rule to `AGENTS.md`

**A status is a claim, not a fact.** In Project 03 the checked-in list was wrong
in *both* directions: features marked `not-started` whose code already worked
end to end, and features marked `pass` with detailed evidence while the app was
completely dead.

```markdown
## Trust

feature_list.json is a claim, not a fact.

- Before implementing something marked `not-started`, check whether it already
  works. If it does, say so. DO NOT rewrite working code because a file told
  you it was missing.
- Before trusting something marked `pass`, run ./init.sh. If the command
  disagrees with the file, the file is wrong.
- When you find a stale claim, correct it AND say it was stale. Never silently
  overwrite it.
```

An agent given this rule ran the gate against eleven `pass` entries, found the
app dead, fixed it, and annotated the false claim rather than overwriting it.

---

## Step 5 — Memory: a handoff form *and* a per-feature log

### `session-handoff.md` — a form with one un-fakeable field

Ship it as a **blank template with headings**, not an instruction to "write
notes".

```markdown
## Last `./init.sh` result
<!-- Paste the actual exit code and last lines. Not "should pass". Run it. -->

## Did I verify the claims I inherited, or trust them?
## What I finished
## What's half-done          <- exactly where I stopped, what is broken now
## Decisions I made          <- so the next session does not re-argue them
## Files I changed           <- path + one line each
## Anything the repo was WRONG about
## Blockers
## Next step                 <- the single next thing
```

**The first field is load-bearing.** Everything else is the agent's opinion
about its own work; that one is a number a command produced. Every claim
written into it, across two projects, verified true.

**Measured:** the next session read **12 files** before its first edit, versus
**26** without it.

### `claude-progress.md` — appended per feature, not per session

A handoff only gets written if the session *reaches* a graceful stop. A crash, a
context limit, or a closed laptop skips it and loses everything. A per-feature
log loses only the feature in progress.

Require three lines per entry: **the command, its exit code, what it printed.**
If those cannot be filled, the feature is not finished — only read.

Make it append-only: if an old entry turns out wrong, add a new one saying so. A
log you can rewrite is not a log.

### `clean-state-checklist.md` — and reset it

A final sweep before declaring the work done. **Every box names a command, and
every box has a blank next to it** — a bare `[x]` is free; a blank demanding a
number is not.

**It goes stale like everything else.** A session that ticks all its boxes
hands the next session a fully ticked file describing code it never ran. So:

- put `Walked on: ___ by session: ___` at the top
- rule it as **per-session**: inherited ticks get blanked and re-walked
- and have `init.sh` **warn** when the checklist has ticks and the source is
  newer — a warning, not a failure, because the gate runs mid-work where
  staleness is normal, and a check that fires constantly gets disabled

**A checklist can do a gate's job, but only a gate cannot be skipped.** A
checklist line once got an agent to run a test the gate could not — genuinely
useful, and entirely dependent on it choosing to read the file. **If a check
matters, move it into the gate.**

Which leaves the checklist holding what the gate *cannot* run — the eye check,
the judgement call, the thing that needs a person. **If a box duplicates a gate
step, delete the box, not the step.**

---

## Step 6 — The map

| File | Contains |
|---|---|
| `docs/ARCHITECTURE.md` | layers, boundaries, data flow — so it is not re-invented |
| `docs/PRODUCT.md` | what the thing is supposed to do |
| `CLAUDE.md` | build commands + key file map |
| `AGENTS.md` | short entrypoint linking to the above |

Keep `AGENTS.md` short and pointing outward. One giant instruction file gets
skimmed.

**Do not duplicate a contract in two places.** Project 02's app declared its IPC
surface in `types.d.ts` *and* inline in `App.tsx`; the copies drifted and became
a compile error that survived into the next project. One source of truth per
contract. The same rule applies to the harness: do not keep two copies of
`init.sh`.

**Docs go stale too.** An agent found `ARCHITECTURE.md` describing a file's
location that the code had not used for some time. Check the docs against the
code as part of Step 1.

### Enforce the boundaries, do not just describe them

`ARCHITECTURE.md` explains the layers. **A script decides them.** Put the script
in the gate, and the doc becomes commentary that cannot drift into being wrong
without something noticing.

Why it earns its place: an agent under pressure fixes **the nearest thing**, not
the right thing. Hide the empty rows in the report; filter the bad records in
the UI; patch the symptom one layer downstream. Every one of those turns the gate
green and leaves the bug in place — and now the layers are tangled, so the next
bug is untraceable.

The whole check is a text search over the import lines, one rule per line:

```bash
banned <layer-dir> <regex> <why>       # 10 lines of machinery, written once

banned src/renderer  "['\"](fs|path|os|child_process)['\"]"  "the window must not touch the disk"
banned src/services  "electron|ipcMain|BrowserWindow"        "logic must not know it is in Electron"
banned src/services  "['\"]react"                            "logic must not import UI code"
```

Rules that generalise: a UI layer must not reach the filesystem or the database
directly; a domain/logic layer must not import its framework; a reporting layer
must read, never write. In a data warehouse the same script greps dashboard SQL
for `raw_` table names.

| requirement | why |
|---|---|
| **name the offending file and line** | a violation count is not actionable |
| **finish the round, then exit** | report every violation, not the first |
| **under a second** | so it can live in the gate and run on every change |
| **watch each rule fail on purpose** | a script that only prints PASS is decoration |

**It reads text; it never runs the app.** A determined person routes around it.
**A tripwire, not a lock** — and worth it, because it catches the honest mistake,
which is the one that actually happens.

**One warning from doing this in P04.** The first test added an *unused* banned
import. The gate went red — at the type-check step, because the compiler flagged
the unused variable first. The boundary check never ran, and the red gate looked
like proof. It only fired once the import was genuinely used. See rule 6.

---

## Step 7 — Verify the harness, not just the code

**Break something on purpose and confirm the harness notices.**

- point a connection at nonsense → does the gate go red?
- rename a required config file → does it notice?
- revert a known bug fix → does the product check catch the regression?
- mark a feature `pass` with empty evidence → does anything object?

If nothing fails, that part of your harness is decoration.

**And when the harness misses something, fix the harness — not the app.** In P01
the fix was a fourth gate in `init.sh`, then re-running the agent on it. *You*
fix the harness; the harness fixes the app.

**Best version of this test:** take a bug that was already found and fixed,
revert the fix, and confirm your gate goes red. That turns the gate into a real
regression test rather than a hypothetical one.

**Then keep both trees.** The broken one and the working one, saved as fixtures
with a two-line script that runs the gate against each and prints both exit
codes. It costs seconds now, it is a permanent regression test, and it is the
only way to run the removal test in *Keep it small* later.

### Report to the human like this

Do not say "the gate works". Show three results:

```
broken code      -> non-zero   (and it failed at the step you expected)
working code     -> 0
broken at RUNTIME but compiling cleanly -> non-zero   ← the one that matters
```

The third line is the whole point. The first two are easy.

---

## Keep it small

Build the **smallest gate that catches a real break.** Add a step only when a
real failure has slipped through it.

A harness nobody runs protects nothing. Four steps that run every time beat
twelve that get commented out.

**The honest exception, and its limit.** Two steps in this playbook are
recommended *before* a failure demands them — the boundary script (Step 6) and
the checklist-staleness warning. Both are recommended because they are
sub-second and because the mistake they catch is common, not because either has
been measured stopping one. In P04 the boundary script was added and verified;
**no agent in either arm ever crossed a boundary**, so nothing there shows it
changes behaviour. It is insurance, priced at one second.

Everything else earns its place by having caught something. If you cannot say
what a step caught, it is a candidate for deletion — including these two.

**A reviewer is the most expensive step in this playbook**, because it is a
whole extra agent call per iteration. Add it only for the criteria a script
genuinely cannot decide. If your rubric's rows could all be assertions, they
should be assertions.

### Finding out what a step caught: take it out

The criterion above has no method attached. Here it is.

You already own the fixtures — the broken tree and the working tree you kept at
Step 7. Disable **one** step, do not delete it, run the same task against both
trees, and compare. Two minutes, not a study.

```
same exit codes, and nothing an agent could have acted on has gone missing
from the output          -> the step was decoration. Argue for deleting it.
anything changes         -> put it back, and write down what changed. You now
                            know what it catches, which you did not before.
```

Worked example, P04: a structured logger against no logger, same broken app —
**58s to the fix without it, 52s with, three files read either way.** Null
result, and Step 2b is still in this playbook. **A null is permission to argue
for deletion, not an instruction to delete.**

Write down what the run could not settle. P04's could not: n=1, and the bug was
obvious enough that neither arm needed the logger.

---

## Keeping the harness alive

A harness rots quietly. It keeps exiting 0 while measuring less and less of what
now matters.

**Revisit the gate whenever any of these happens:**

| trigger | what to do |
|---|---|
| a bug reached a human that the gate should have caught | **fix the harness, not just the bug.** Add a step, then revert the fix and confirm the gate goes red |
| a new user-facing capability shipped | the product check still covers only the old path. Widen it or add a second action |
| a bug took more than a few files of searching to locate | the gate found it, the logs did not. Find the step that produced a count with no size, and add the size |
| a log line reports a count and no magnitude | it cannot tell working from empty. Fix it before it costs you an afternoon |
| a dependency major-version bump | P03's whole defect was a security default flipping in a minor Electron release. Nothing in the code changed |
| the gate has never failed in weeks of real work | suspicious. Break something on purpose and confirm it still bites |
| a model upgrade, or a step you cannot say what it caught | take it out and re-run the Step 7 trees. P02's own premise expired that way — a two-session exercise a current model finished in **6m54s** |
| the gate is green and a human still sends the work back | the gate covers the checkable part and nothing covers the rest. That is Step 3b, and it is missing |
| someone added a step that fails intermittently | fix it or remove it today. A flaky gate teaches people to ignore red, which is worse than having no gate |

**The rule underneath:** a bug that escapes is not just a bug. It is a
measurement gap, and the gap will let the next one through too.

---

## Rules that keep proving themselves

1. **The harness delivers what it asks for, and nothing else.** No test gate,
   no tests. No handoff rule, no handoff. No render check, black window. An
   agent stated this back verbatim: *"npm test reports none found, which isn't
   a required feature per AGENTS.md's Definition of Done."*
2. **Whatever is in the folder is the brief.** In P01 three files in
   `data/sample-documents/` looked like fixtures; the agent read them as a
   design spec — reasonably. Audit what is sitting in the directory.
3. **A gate you have not seen fail is not a gate.**
4. **Evidence must name a command.** Anything else is the agent's opinion.
5. **Reciting a lesson is not applying it.** "A harness proves only what it
   measures" was quotable two projects before a gate stopped measuring only
   compiling.
6. **"It failed" is not "it found the bug."** Read which step produced the exit
   code. In P03, five failures in one day were all environmental — npm cache
   permissions, a failed `cd` the shell carried on past, a wrong-platform
   binary twice, and the gate working exactly as designed. Every one looked
   like the code. None were.
   P04 hit it three more times, and the third is the one to remember: an
   *unused* banned import was added **to test the boundary script**, the gate
   went red, and the boundary script had never executed — the type checker
   caught the unused variable first. **A red gate proves nothing until you have
   read which step produced the red**, including when you are testing the check
   yourself.
7. **Anything that records a claim goes stale** — a feature list, a checklist,
   a progress log, the docs. Something that cannot be skipped has to notice.
8. **Verify an agent's report before believing it.** Across three sessions
   every claim happened to be true — and checking them is what found that out,
   and also found the one box ticked slightly untruthfully.

9. **Self-review is accurate on the checkable and generous on the rest.**
   Measured, not assumed: identical code, scored 4.75 by its author and 4.00
   by a stranger, with the entire gap in the four criteria no script could
   settle. "Agents flatter themselves" is too coarse — they flatter themselves
   *precisely where there is no answer*.
10. **A score is only comparable to a score from the same scorer.** Change the
   scorer and you have measured the scorer. This is the easiest confound in
   the book to introduce by accident and the hardest to see afterwards.
11. **An instruction not to look is not a control.** If the reviewer must not
   see something, do not tell it not to — do not put the file in the
   directory.

12. **A harness grows by default and shrinks only on purpose.** Every trigger in
   "Keeping the harness alive" is a reason to add a step; only one is a reason
   to remove one. P04 measured a step that added nothing — a structured logger
   against no logger, 58s versus 52s, the same three files — and the step is
   still in this playbook. **Recording a null result is not the same as acting
   on one.**
13. **A script nothing calls is not a gate.** In the course's own P06 solution,
   `scripts/check-architecture.sh` is referenced nowhere — not by `init.sh`,
   not by the checklist, not by `AGENTS.md`, not by `feature_list.json`.
   Checked by grep. A boundary script that nothing invokes is a file, and files
   do not fail builds.

---

## Mechanics — the things that waste an afternoon

**Isolation (for controlled runs):** use a container that mounts *only* the run
directory. Location does not protect an experiment; the mount does. Verify it —
search the container's filesystem for your answer key and confirm nothing is
found.

```sh
docker run --rm -it -v <run-dir>:/work -v <auth-volume>:/home/agent <image> \
  claude --permission-mode bypassPermissions "<prompt>"
```

Files in the mounted directory persist on the host; everything else in the
container is gone on exit.

| Gotcha | Fix |
|---|---|
| Session stalls doing nothing | default permission mode is waiting for approval → `--permission-mode bypassPermissions` (safe in a container) |
| Blank screen in an interactive session | `xvfb-run` breaks Claude Code's terminal — wrap only the individual command that needs a display, not the session |
| `xvfb-run: xauth command not found` | install `xauth`; `xvfb` alone is not enough |
| `npm install` dies with EACCES / EEXIST | root-owned entries in `~/.npm` from an old `sudo npm` → `--cache <somewhere-else>` |
| `spawn ENOEXEC`, or `Syntax error: "(" unexpected` | a `node_modules` built for the other platform. **One folder, one platform** — run the gate where the code was installed. This cost two wrong conclusions in P03. |
| Walls of `ERROR: bus.cc` / GPU messages in a container | harmless — no dbus, no GPU. Read the exit code, not the noise. |
| A window flashes open and closes | that is the product check working as designed, not a crash |
| Commands run in the wrong directory | a failed `cd` does not stop the next command. Use absolute paths in anything you hand over. |
| Headless run produces **0 bytes** after 20 minutes | `xvfb-run` with no TTY hangs waiting on a terminal and `claude` never starts. Background `Xvfb` and `export DISPLAY=:99` instead. |
| Two runs in parallel, both look fine | they mount the same path, so they share one conversation history — one run's purge can delete the other's in flight. Refuse to start while another run is live, and **watch it refuse.** |
| A prompt string gets read as a filename | the running script was edited mid-run. Bash reads a script by byte offset; never edit one while it is executing. |
| No `timeout` on macOS | use a `perl alarm` wrapper per step. |
| A script reports failures and still exits 0 | it cannot gate anything. Count violations and `exit 1` at the end — then check `echo $?`. P06's `cleanup-scanner.sh` prints `Result: ISSUES FOUND (N)` and falls off the end of the script; exit 0 either way. Verified by reading it and running it. |
| A counter reads zero after a loop that clearly incremented it | `cmd \| while read ...` runs the loop in a subshell and throws the variable away. Use `while read ...; done < <(cmd)`. |
| `syntax error: invalid arithmetic operator` on a timing line | bash integer arithmetic on a float. `python3 -c "import time; print(time.time())"` returns `1788534974.114392`; make it `int(time.time()*1000)`. P06's `benchmark.sh` does exactly this at line 41. |
| A teardown step at the bottom never runs | `set -e` exited above it. Put teardown in `trap ... EXIT`, or point the run at a fresh temp directory and delete nothing. |

**Stopping a session part-way is hard.** Count file edits, not minutes. A clock
gave "finished everything in 6m54s" and "zero files written" on consecutive
tries; "stop after ~4 edits" worked.

---

## Day-one checklist

```
[ ] Interviewed the human. I can state, in one line, the ONE user action that
    proves this app works — and what it returns.
[ ] Ran the build myself. Wrote BASELINE.md, with verbatim errors.
[ ] Audited every existing claim in the repo against a real command.
[ ] init.sh exists, has set -euo pipefail, and I watched it FAIL.
[ ] init.sh does ONE real user action end to end and asserts on the answer
    (not "does it launch" -- a dead app launches and renders identically).
[ ] init.sh PRINTS the numbers its assertion compared, not just pass/fail.
[ ] Every log line that reports a count also reports a size.
[ ] Logs go to a stream a pipe can capture, not a human-only console.
[ ] I read the logs of a broken tree and a working tree, and could name the
    broken one and the function -- without opening the source.
[ ] Layer boundaries are enforced by a script in the gate, not only described
    in a doc -- and I broke each rule on purpose and watched it name the file.
[ ] init.sh runs the tests, or I said out loud why not.
[ ] init.sh works in the environment agents will actually run in.
[ ] AGENTS.md defines done as "./init.sh exits 0" + evidence naming a command,
    and says one feature at a time.
[ ] AGENTS.md has a Trust rule: a status is a claim, verify before acting.
[ ] AGENTS.md names what must not be touched -- Q10's answer, written down.
[ ] I kept BOTH trees from the break test, plus a script that runs the gate
    against each and prints two exit codes.
[ ] Every script I wrote is invoked by init.sh -- or I deleted it.
[ ] feature_list.json has an empty evidence field for every feature.
[ ] session-handoff.md template exists, with a field demanding a command's
    output; a per-feature progress log exists; the checklist resets and holds
    only what the gate cannot run.
[ ] docs/ARCHITECTURE.md and docs/PRODUCT.md exist and match the code.
[ ] I named the parts of "good" no command can check -- or said out loud
    that there are none.
[ ] If there are: a blank rubric exists, every sub-top score demands a named
    defect, and the reviewer runs in a context that did not write the code.
[ ] The reviewer cannot see the author's self-assessment, because it is not in
    the directory -- not because I told it not to look.
[ ] I broke something on purpose and the harness caught it.
[ ] I showed the human three exit codes: broken, working, and
    compiles-but-dead.
[ ] Every harness file exists once, at the repo root, and is committed.
[ ] If the project has CI, I said how it and init.sh relate.
[ ] Nothing in the folder is a stray instruction an agent will read as a brief.
```

If you only have time for two: **BASELINE.md and init.sh** — with a product
check in it.

---

## Where the evidence is

Every claim here came from a measured run, not an opinion.

| | |
|---|---|
| `project-01/NOTES.md` | a gate that only measures compiling proves only compiling |
| `project-02/NOTES.md` | continuity measured: 26 files re-read vs 12 |
| `project-03/NOTES.md` | a rendering app with nothing working; a state file wrong about 10 of 11 features; the gate upgraded and proved by regression |
| `project-04/NOTES.md` | a log that reported 5 chunks holding 0 characters; a structured logger measured against no logger and found to add nothing — a null its own notes call unclean, because the bug was too obvious and the gate too informative |
| `project-05/NOTES.md` | identical code scored 4.75 by its author and 4.00 by a stranger, the whole gap in the four criteria no script could settle; a self-score that did not move when the code changed; four arms scored blind at 4.0 / 4.4 / 4.5 / 4.1, where the course reports the three-role arm highest |

**Every number here is n=1 or n=2** — the reason a rule exists, not a statistic.
**Projects 06–08 have not been run**, and no claim above cites them.

---

## What this is the ground floor of

Everything above is one agent, one call, started by a human. **UNEARNED** — no
run here was a loop, and none had two agents at once. Use this to tell whether
you are ready, not as instructions for today.

**A loop** is the same agent, restarted on a trigger, with no human between runs.
The readiness test is not whether you have a scheduler:

| the loop needs | you already have it as |
|---|---|
| a stop condition a machine can read | `./init.sh` exits 0 |
| what it must not touch | Q10's answer, in `AGENTS.md` |
| memory between runs | `session-handoff.md` + the per-feature log |
| an environment it can wake into unattended | `init.sh`, from a clean clone |

An empty row is where the loop will fail at 3am with nobody reading the output.
**Fix the row, not the loop.** Note what the table says about the work: none of
it is loop tooling. It is this playbook, finished.

Two rules from Mechanics, both against the usual advice:

- **A loop's stop condition is an exit code, never a duration.** Stopping on time
  took three attempts here even with someone watching.
- **Serialise first, isolate second.** Two runs in parallel, one deleted the
  other's history sixty seconds in.

**A graph** is more than one agent plus a written answer to *where does a failure
go back to.* Draw one only when there are branches or rollbacks. A twenty-step
line is a script, however long it is.

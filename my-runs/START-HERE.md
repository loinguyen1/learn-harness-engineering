# Start here — putting a harness on a new project

*For me, not for the agent. The agent reads [HARNESS-PLAYBOOK.md](HARNESS-PLAYBOOK.md);
I read this.*

## Who does what

| Me | The agent |
|---|---|
| Answer about ten questions | Read 1400 lines |
| Verify the gate goes red | Write `init.sh`, `AGENTS.md`, everything else |
| Decide when to stop adding | Measure the tree, record the baseline |

**I do not need to read the playbook.** I need to answer well and check one thing.

---

## Three steps

**1 · Put the file in the new project**

```sh
cp ~/repo_/learn-harness-engineering/my-runs/HARNESS-PLAYBOOK.md .
```

**2 · Open Claude Code there and paste this**

```
Read HARNESS-PLAYBOOK.md in full before doing anything.
Then follow it from Step 0. Interview me first — do not skip Step 0 and
do not guess my answers. Ask in small batches, not all at once.
```

**3 · Answer the questions.**

---

## Have these answers ready

The interview stalls without them. Worth five minutes of thinking before starting.

### The one that decides everything

> **What is ONE real thing a user does that proves this works?**

Not "it starts". Something that goes from the outside edge in, and comes back
with an answer a script can compare.

- *"Import a document, ask a question, get an answer with 2 citations."* ✅
- *"The app opens."* ❌ — a dead app opens fine

**If I cannot answer this, stop.** It means nobody has decided what working
means yet, and no gate can be built until someone does.

**No users on this project?** Substitute:

| shape | the one action |
|---|---|
| scheduled job | one run over a known input — assert on the output file's **location and row count** |
| library | a throwaway consumer installs it and calls the public API |
| prompts / docs | render one unit, assert required sections are present |

### The rest

| # | Question | Why it matters |
|---|---|---|
| 1 | How do I run it? The exact command. | The gate needs it |
| 2 | What breaks most often here? | Points at the first check worth writing |
| 3 | What must the agent never touch? | Paths, not vibes. Unwritten means unenforced |
| 4 | What does it need that is not in the repo? | Database, S3, a paid API — each needs a fake or a disposable local one |
| 5 | Which credentials? | Read from the environment, never committed |
| 6 | Is there a login in front of the one real action? | Then the gate needs a test user first |
| 7 | Is there a test suite? Should the gate run it? | If the gate does not run tests, nobody writes tests |
| 8 | Where does it keep its state? | The gate needs a clean slate each run |
| 9 | If it fails, does it exit non-zero? | Critical for anything unattended |

---

## The one thing I verify myself

When the agent says the gate is ready:

```
Break the app on purpose and show me the gate going red.
Then tell me which step went red, and why that is the right one.
```

Two ways this goes wrong:

- **It cannot show a red.** Then there is no gate, only a script.
- **It shows a red from the wrong step.** A type error caught before the real
  check ran proves nothing about the real check.

Everything else the playbook handles. This is my part.

---

## What I should have at the end of day one

```
[ ] BASELINE.md      — what was already broken, verbatim errors
[ ] init.sh          — and I watched it fail
[ ] AGENTS.md        — done = a command, plus a hands-off list
[ ] feature_list.json — every feature with an empty evidence field
[ ] session-handoff.md — with a field demanding a command's output
```

**If there is only time for two: `BASELINE.md` and `init.sh`** — with a real
user action inside it. The rest are amplifiers.

---

## When to stop adding

Build the smallest gate that catches a real break. Add a step only after a real
failure slips through.

Four checks that run every time beat twelve that get commented out.

---

## Known weak spots

The playbook was tested on four unlike projects. Two of four could not reach a
working gate on the first try. Go in expecting to help it if the project is:

| | What breaks |
|---|---|
| **A big old codebase** | Nobody can list the features for `feature_list.json`. No answer yet |
| **A scheduled job** | The real breaks are upstream data changes, and no code-change gate fires on those |

For a small new project, it holds up.

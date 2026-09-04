# Projects 05–08 — core steps only

*Extracted 2026-09-04 from `docs/en/projects/project-0{5,6,7,8}` and lectures 09–14.
The point of this file: take the mechanism, skip the Electron app.*

## The whole thing in four lines

| Project | The one idea | The artifact | The rule |
|---|---|---|---|
| **P05** | The author cannot be the judge | `evaluator-rubric.md` | scorer ≠ writer |
| **P06** | A session ends clean, and a harness must earn its keep | session-exit checklist + quality doc | delete any harness piece that doesn't move the benchmark |
| **P07** | Stop prompting — write the stop condition | `goal.md` + `loop-state.md` | stop conditions must be machine-checkable |
| **P08** | Put the hidden decisions on paper | `graph.md` | draw only if there are branches or rollbacks |

---

## P05 — Role separation

**Core steps**

1. **Sprint contract before code.** Scope / verification standard / exclusions. Written before the generator starts.
2. **Generator implements** against that contract, and nothing else.
3. **Evaluator scores** against a rubric — a *different* context, which did not write the code.
4. Failing criteria go back as feedback; generator revises; re-score.

**Why it works:** a model is its own output's best defense attorney. It convinced itself the path was right while generating; looking back it sees its reasoning, not its mistakes.

**Measured in my own P05 run:** identical code, two scorers — the author gave itself 5/5 on things it could not check, the independent scorer did not. Self-review was *accurate on everything checkable and generous on everything else.* The generosity was in the number, not the prose.

**Blind result — four arms, one fixed scorer, key revealed afterwards:**

| arm | blind score |
|---|---:|
| A single | 4.0 |
| A+ single + rubric | 4.4 |
| B generator + evaluator | **4.5** |
| C planner + generator + evaluator | 4.1 |
| *untouched placeholder* | *1.37* |

The rubric bought 0.4. The separate reviewer bought 0.1 more. The planner cost 0.4.
The course reports the three-role arm highest; blind, it came fourth of four. n=1 per arm.

**In your own project**
- Write the rubric first and run it single-context. That is where the gain is.
- Add a separate reviewer when you need the *score* honest — not to make the code better. Different job.
- The rubric is a *file*, not a prompt. Same file every time, or you're comparing scorers instead of code.
- Reviewer must not see the author's self-assessment.
- Cheapest version: `/code-review` in a fresh session, or one subagent whose only job is to disagree.

---

## P06 — Observability, clean state, ablation

**Core steps**

1. **Two layers of observability.**
   - *Runtime* — logs, health checks, exit codes. Answers "what did the system do."
   - *Process* — contracts, rubrics, acceptance criteria. Answers "why should this change be accepted."
2. **Definition of Done, three layers, no skipping.**
   - L1 syntax/static → L2 runtime behavior → L3 end-to-end. Fail L1, you never reach L2.
3. **Session exit checklist** — five conditions, all mandatory:
   build passes · tests pass · progress recorded · no stale artifacts (debug logs, commented code, TODOs) · standard startup path works.
4. **Quality document** — a per-module letter grade, updated over time. Not an audit; a trend line.
5. **Ablation** — remove one harness component, rerun the benchmark. No degradation → delete it permanently.

**In your own project**
- Put the exit checklist in `CLAUDE.md`. It's five checkboxes and it does more than any prompt tuning.
- Error messages are for the agent: not `Test failed`, but `Test failed: POST /api/reset returned 500. Check EMAIL_SERVICE_URL in .env. Template expected at templates/reset.html.` Actionable errors close the loop without you.
- Ablation is the cheap experiment: you're testing the *harness* against known-broken fixtures, not re-running the agent. Once a month, one component.
- Harness pieces expire. Anthropic dropped sprint-splitting when Opus 4.6 could decompose work itself — but kept the evaluator, because it still caught stubs near the capability boundary.

---

## P07 — Loops

**Core steps**

1. **Goal loop.** Write `goal.md` with exactly four things:
   - goal (what counts as done)
   - verification (how it's confirmed — tests? lint? coverage?)
   - stop condition (max turns / time / budget)
   - constraints (what not to touch)
   Run manually once for a baseline, then run as a loop, then compare.
2. **Timer loop.** A repetitive check on a heartbeat (10–30 min). Record: found / auto-fixed / false positives / made worse. Then decide if it was worth automating.
3. **Maker-checker loop.** Maker implements, checker verifies, `loop-state.md` carries round number + what was done + verdict + what's next. Stop on N consecutive passes or max rounds.

**Six primitives:** automations (heartbeat) · worktrees (isolation) · skills (codified project knowledge) · connectors (real tools) · sub-agents (maker≠checker) · external state (memory on disk — the spine, not a peer).

**Four silent costs:** verification debt · comprehension rot · cognitive surrender · token blowout.

**Maturity ladder:** 1 goal runner → 2 scheduled single task → 3 maker/checker split → 4 self-feeding → 5 fleet. Most teams sit at 2–3. Level 1 pays back fastest.

**In your own project**
- Start with one task you do manually twice a week.
- The stop condition is the whole design. "Feels about right" is not a stop condition.
- Memory is a markdown file. Next run reads it first. Beats any database.
- Budget is a stop condition too — put a max-iteration cap in the loop before you run it unattended.

---

## P08 — Graphs

**Core steps**

1. **Draw the loop you already have.** Four parts:
   - **Nodes** — work units (code, model call, tool, or a whole agent)
   - **Edges** — handoffs: parallel, conditional, retry, rollback
   - **Shared state** — the one file every node reads and writes
   - **Routing rules** — plain if-then: `verify passed → merge · verify failed → implement · not enough info → research`
2. **Find one implicit edge** — a path that used to live inside the agent's head and was never written down. This is the actual deliverable of the exercise.
3. **Add fan-out / fan-in** — split independent work, isolate with git worktrees, define the merge standard (both must pass? one enough?).
4. **Add a rollback edge and a human-approval node** — a partial failure returns to *the node that caused it*, not the top. Approval node halts and waits, with a timeout rule.

**Loop vs graph:** a loop is a deferred decision — one agent absorbs everything, and failure modes stay invisible because the agent doesn't know where it's stuck. A graph is an up-front decision — you declare structure and buy readability, auditability, local repair.

> "Loops have a lot of room for forgiveness. Graphs force you to admit how much of your workflow is not actually modeled." — Luis Catacora

**When you actually need one** — at least three of five:
independently decomposable · has branches/rollbacks · intermediate state worth saving · results explicitly verifiable · coordination benefit > coordination cost.

**Not scale — branches.** A 20-step linear pipeline is a script. Five nodes with real rollback and approval is a graph.

**In your own project**
- P08 costs nothing to do. It's one markdown file with a mermaid diagram and two tables.
- Do it on a workflow you already run. The value is the implicit edge you find.
- Your review bandwidth is the ceiling. More nodes don't optimize your attention — the orchestration tax is real.

---

## If you only carry four things forward

1. **The reviewer is a different context than the writer.** (P05)
2. **Five-line session exit checklist in CLAUDE.md.** (P06)
3. **`goal.md` — goal, verification, stop condition, constraints.** (P07)
4. **Draw it before you scale it; look for the edge you never wrote down.** (P08)

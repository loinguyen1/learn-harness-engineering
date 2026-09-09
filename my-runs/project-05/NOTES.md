# Project 05 — Notes

*Session of 2026-09-04. Stopped early on quota; what is here was measured, not projected.*

## The one idea

**Self-review was accurate on everything checkable, and generous on everything else.**

P01: agent claims done with no proof -> demand evidence.
P02: agent forgets at the boundary -> demand a handoff.
P03: gate only measured compiling -> make it use the app.
P04: gate says broken, nothing says where -> add runtime signal.
P05: **the quality bar cannot be written as an assertion -> who holds the pen decides the score.**

## The headline: same code, two scorers

Arm B's generator filled the rubric before the evaluator ran. The snapshot caught
it. So there are two scores for **identical code**, differing only in whether the
scorer had written it.

| Criterion | Self | Independent | delta |
|---|---:|---:|---:|
| Functional completeness | 5 | 5 | — |
| Role distinction | 5 | 5 | — |
| Citation display | 5 | 5 | — |
| Edge cases | 5 | 5 | — |
| Visual design | 4 | 2 | **-2** |
| Interactivity | 5 | 3 | **-2** |
| Timestamps | 5 | 4 | **-1** |
| Code quality | 4 | 3 | **-1** |
| **Mean** | **4.75** | **4.00** | **-0.75** |

0.75 is **7.5x the scorer's own noise** (+/-0.1, measured over three replicates).

**The four that matched are the checkable ones. The four that moved are the
judgment calls.** The generator did not misreport its work. It graded itself
exactly right wherever "right" had an answer, and rounded up wherever it did not.

> Separate the evaluator where a script cannot decide. Where a script can
> decide, self-review was accurate — and a script is cheaper than either.

That is the other half of P04, which found the gate's own `chunks > 0 AND
citations > 0` carried the whole signal. The evaluator role earns its cost
exactly in the space that assertion cannot reach.

## Every generator scored itself 4.4-4.75

| Arm | Self-score | After its own revision |
|---|---:|---|
| A single role | 4.6 | 4.6 — unchanged |
| A+ single + rubric | 4.75 -> 4.375 | 4.375 — unchanged |
| B generator | 4.75 | (evaluator: 4.00) |
| *untouched placeholder, blind scorer* | *1.37* | |

**The self-scores did not move when the code changed.** Arm A scored 4.6, found
a real dead-code defect in its own review, fixed it, and scored 4.6 again. The
number was not tracking the code.

## Self-review was not lazy

Arm A's self-review found a genuine defect by cross-referencing a file it had not
written: `threshold={200}` for citation excerpts, while `qa-service.ts:96` caps
every excerpt at 200 chars — so the expand toggle could never render.
*"Confirmed empirically: across every screenshot run this session, no citation
ever showed an expand button."*

**The generosity was in the number, not the prose.** The lecture's "agents
flatter themselves" is too coarse: this agent found its own bug and still gave
itself an A.

## Harness bugs, both silent

| Bug | Symptom | Cause |
|---|---|---|
| `xvfb-run` with no TTY | 20 min, **0 bytes** output | `claude` never started; wrapper hung |
| parallel arms | two arms apparently fine | both mount `/work`, share one conversation history |
| edited a running script | prompt text read as a filename | bash reads scripts by byte offset |

The second is the worst. The purge existed to *prevent* cross-arm contamination;
running arms in parallel made it the cause of one — arm C's purge deleted arm A's
in-flight history 60 seconds into A's first step. Caught by timestamps only.

`run-arm.sh` now refuses to start while another arm is live. **Verified by
watching it refuse.**

## Honest limitations

- **Arm C never ran.** Stopped on quota. No planner data at all.
- **The blind scoring never ran.** All numbers above are in-run rubrics, not the
  fixed blind scorer PLAN.md specifies. The B pair is still valid — it is one
  scorer-pair on one body of code — but the cross-arm comparison is **not done**,
  and nothing here says three roles beat one.
- **n=1.** Three arms, one run each.
- **I caused a design leak.** Leaving a blank rubric in every run dir made every
  generator self-score unprompted. It produced the best result in the experiment
  by accident, and it still blurs A vs A+.
- **Baseline repairs were mine, not measured.** Six defects fixed by hand before
  any arm ran; see BASELINE.md.

## What I would run next

The blind scorer (`score.sh`, written and verified against the floor) on all
arms, and arm C. Roughly 15 agent calls.

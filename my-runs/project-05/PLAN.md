# Project 05 — Experiment Plan

*Written 2026-09-04, before any arm was run.*

## What is being measured

**One variable: how many separate contexts touch the feature.**

Everything else is frozen — same model, same starting tree, same feature, same
Definition of Done, same rubric.

| Arm | Contexts | Who reviews the code |
|---|---|---|
| A `single` | 1 | the context that wrote it |
| A+ `solo-rubric` | 1 | the context that wrote it, **handed the rubric** |
| B `gen-eval` | 2 | a fresh context that did not write it |
| C `plan-gen-eval` | 3 | a fresh context, against a contract it did not write |

## Why A+ exists

The course compares A, B and C only. That confounds two changes at once:
B adds **a separate reviewer** *and* **an explicit rubric**. If B beats A, the
course credits role separation — but the rubric alone could explain it.

A+ is the control: **same single context, same rubric, no separation.**

- If A+ ≈ B, the rubric did the work and separation is decoration.
- If A+ ≈ A and B is higher, separation is doing something a checklist cannot.

This is P04's finding applied forward. There, two arms differed in *where* a
signal came from, and it turned out not to matter — only that the signal existed.
A+ asks the same question of role separation.

## The three questions from Task 1

### 1. Who fills in the rubric for each arm?

**One fixed scorer, identical for all four arms.** A separate `claude -p` call
in a fresh container, run after all arms have finished, with the same scorer
prompt and the same rubric every time.

Each arm still produces its own in-run rubric — that is part of the arm's
harness. **Those in-run rubrics are not the measurement.** They are evidence
*about* the arm, scored later, never the score itself.

> The course's `single-role/evaluator-rubric.md` carries `**Evaluator:** Self`
> while `plan-gen-eval` was scored by a dedicated evaluator. Comparing those two
> numbers compares scorers, not code. This plan does not repeat that.

### 2. What does the scorer see?

| Sees | Does not see |
|---|---|
| final `ConversationHistory.tsx` | which arm produced it |
| final `App.tsx` diff vs the clean fixture | the arm's own rubric or self-assessment |
| the frozen feature brief | the sprint contract, revision notes, transcripts |
| the blank rubric | how many contexts were involved |

Arms are presented as `subject-1..4` in a shuffled order. The shuffle key is
written to `results/blind-key.txt` **after** the scorer has run.

Stripped mechanically, not by promise: the copy step deletes every `.md` the arm
wrote before the scorer's container is started.

### 3. The number, and what would make it meaningless

**Comparison number: the mean of 8 rubric criteria, 1–5, from the blind scorer.**

It is meaningless if any of these turn out true — each is checked and reported:

| Failure | How I detect it |
|---|---|
| Arms did not start identical | `git status` on each run dir vs the frozen fixture |
| The blind is leaky (arm identity visible in the code) | I read the 4 subjects myself before scoring, and record whether I could tell them apart |
| The scorer is inconsistent | Every subject scored **3 times** in independent contexts; report the spread |
| The difference is smaller than scorer noise | Compare arm gaps against the same-subject spread |
| Arms differ in effort, not roles | Record wall-clock and turn count per arm |

**Pre-registered honesty rule:** if the between-arm gap is not larger than the
same-subject spread, the result is *null* and gets written up as null. n=1 per
arm, so a small gap proves nothing either way.

## Frozen constants

- **Feature:** multi-turn Q&A conversation history via `ConversationHistory`.
- **Start tree:** `fixtures/clean/` — the P05 starter with its inherited defects
  repaired, verified green before any arm runs.
- **Model:** whatever the lab image's `claude` resolves to, same for all arms
  and the scorer.
- **Rubric:** `harness/evaluator-rubric.md`, 8 criteria, blank.

## Known limits, stated up front

- **n=1 per arm.** Four runs. This can show a large effect; it cannot show a
  small one.
- **The scorer is the same model as the generators.** A model grading its own
  family is exactly the bias under test. Mitigated by blinding and by triplicate
  scoring, not eliminated.
- **A rubric score is not a user.** 4.9/5 on eight criteria is not proof anyone
  can use the thing.

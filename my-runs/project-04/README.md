# Project 04 — the one page

## The idea

Your gate says **"broken."** It does not say **"broken where."**

Closing that gap is the whole project.

## The evidence it matters

The app already logged. On the broken tree it printed:

```
[IndexingService] chunkDocument produced 5 chunks
```

Healthy-looking. All 5 chunks were empty. **A count with no size.**

One extra field, and it points at the function:

```
chunkDocument complete   totalChunks: 5   totalChars: 0
```

## The experiment

Two agents, same broken app. One gets the logger, one does not.

**Does the one that can see fix the real bug — or just make the symptom go away?**

---

## What is here

| | |
|---|---|
`fixtures/bugged` | the broken app. **Arm A.**
`fixtures/bugged-logged` | same app + the logger. **Arm B.** The only difference between the arms.
`fixtures/fixed` | bug removed. The gate's green reference.
`harness/overlay/init.sh` | the gate. 5 steps, dies at the first failure.
`harness/overlay/src/main/main.ts` | the sensor inside the app. Dormant unless `SMOKE=1`.
`check-gate.sh` | runs the gate on `bugged` and `fixed` and reports both exit codes.
`harness/overlay-quiet/init.sh` | same gate, prints no numbers. Built and verified; never run. The experiment this should have started with.

`fixtures/bugged` and `fixtures/fixed` differ in **one file, in two places** —
the same `content.length > 1000 ? ''` conditional both times. That is
what makes the gate's verdict mean something.

## Proven, not claimed

```
gate on bugged   ->  exit 1    ROUNDTRIP: {"chunks":5,"citations":0}
gate on fixed    ->  exit 0    ROUNDTRIP: {"chunks":5,"citations":2}

logger on fixed   ->  chunkDocument complete   totalChunks: 5   totalChars: 1630
logger on bugged  ->  chunkDocument complete   totalChunks: 5   totalChars: 0
```

Logs in `results/`.

## The result

Two agent runs. Same broken app, same gate, same prompt. One variable.

| | no logger | logger |
|---|---|---|
| time | 58s | 52s |
| files read | 3 | 3 |
| fix | real root cause | real root cause |

**No difference.** Both quoted a count sitting next to a zero — one from the
gate, one from the logger. The gate was already saying it.

> **What mattered was that two numbers disagreed. Where they came from did not.**

Full writeup: `NOTES.md`. The four runs and the boundary verification:
`results/RESULT.md`.

---

*Longer reading, only if you want it: `BASELINE.md` (what was measured before
anything ran), `REPAIR.md` (four inherited bugs and why they were fixed first),
`RUNBOOK.md` (experiment design), `PLAN.md` (phases).*

# Project 04 — result

Two runs. Same broken app, same gate, same prompt. One variable: the logger.

| | Arm A — no logger | Arm B — logger |
|---|---|---|
| time | 58s | **52s** |
| files read before the fix | 3 | 3 |
| found the real root cause | yes | yes |
| worked around it instead | no | no |
| files edited | 1 | 1 |
| fix vs reference | identical | identical |
| boundary violations | none | none |
| gate at end | exit 0 (verified) | exit 0 (verified) |

**No measurable difference.** A null result.

## Why — and this is the finding

Both arms had the same *kind* of clue. Only the source differed.

| | the clue it acted on |
|---|---|
| Arm A | `ROUNDTRIP: {"chunks":5,"citations":0}` — from **the gate** |
| Arm B | `chunkDocument complete { totalChunks: 5, totalChars: 0 }` — from **the logger** |

A count sitting next to a zero, both times.

**The P03 gate already contained the P04 lesson.** Writing an assertion as
`chunks > 0 AND citations > 0` builds a count-versus-size signal into the gate's
own output. That was not the intention at the time; it is what happened.

So the honest conclusion is not *"observability does not help."* It is:

> **What mattered was that two numbers disagreed. Where they came from did not.**

The logger's value is elsewhere: it covers paths the gate never drives, and it
keeps working when the failure is not the one the gate asserts on.

## Honest limitations

- **n=1 per arm.** Two runs. A 6-second gap is noise.
- **The bug is short and glaring.** `content.length > 1000 ? ''` is obvious once
  the file is open. `RUNBOOK.md` flagged this before the runs.
- **The gate was strong.** It reported both numbers. A gate that only printed
  "FAILED" would have made this a different experiment — and probably the
  intended one.
- **Arm A read a wrong file first** (`qa-service.ts`), arm B did not. One
  observation, not a pattern.

## What would actually test the hypothesis

Weaken the gate to print only `exit 1`, with no numbers. Then the logger is the
only source of the count-versus-size signal, and the arms genuinely differ.

---

# The fire doors — `scripts/check-architecture.sh`

44 lines. Reads import lines per layer, names the offending file, exits 1.

| rule | verified by breaking it |
|---|---|
| window must not touch the disk (`fs`/`path`/`os`/`child_process`) | named the file, exit 1 |
| logic must not know it is in Electron (`electron`/`ipcMain`/`ipcRenderer`/`BrowserWindow`) | named the file, exit 1 |
| logic must not import UI code (`react`) | named the file, exit 1 |
| wiring must not import UI code | (same rule, same mechanism) |
| all breaks undone | back to exit 0 |

Wired in as `init.sh` step 3, and the **whole gate** goes red on a violation:

```
VIOLATION: the window must not touch the disk (fs/path/os/child_process)
  src/renderer/components/DocumentList.tsx:1:import * as fs from 'fs';
FAIL: architecture boundaries broken.
GATE EXIT: 1
```

Gate still scores 2/2 on the bugged/fixed pair with the step added.

## Something the first test got wrong

The first attempt added an **unused** `import * as fs from 'fs'`. The gate went
red at step 2 instead — TypeScript's `noUnusedLocals` caught it first. The
boundary check never ran.

Only after making the import genuinely used did step 3 fire.

**"It failed" is not "it found the bug"** — P03's lesson, arriving again in the
act of testing the thing built to catch it. A red gate proved nothing until the
step that produced the red was read.

## What it does not do

It never runs the app; it reads text. It catches the honest mistake in under a
second. Someone determined could route around it. **A tripwire, not a lock** —
and the trade is worth it.

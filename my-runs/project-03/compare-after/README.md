# Do not open this until yours works

`bridge-probe.main-snippet.ts` is the probe I used to measure the baseline. It
is a working answer to the hardest part of your `init.sh`: **how do you make a
script fail when the IPC bridge is dead, given that the build exits 0, nothing
is logged, and the screenshot looks fine?**

That question is the whole of Project 03's verification lesson. Reading my
answer costs you the lesson.

**Open it after your gate discriminates between `fixtures/broken/` and
`fixtures/repaired/`.** Diffing your approach against mine then is useful.
Peeking now is not.

(Per `my-runs/HOW-I-LEARN.md`: things I wrote that should have been yours get
moved here rather than deleted.)

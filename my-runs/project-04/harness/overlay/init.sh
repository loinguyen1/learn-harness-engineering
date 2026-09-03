#!/usr/bin/env bash
# init.sh -- one command that says whether this project is in a working state.
# Run it at the start of a session, and after every change.
#
# Ported from Project 03. Carried forward, not re-derived.

# The only line that really matters.
#   -e  stop at the first failure
#   -u  an unset variable is an error, not an empty string
#   -o pipefail  a failure mid-pipe counts as a failure
# Without this, a failed step is skipped and the success line below still
# prints. Proved by hand: a script containing `false` prints "All checks
# passed." and exits 0 without it, and exits 1 with it.
set -euo pipefail

# 1. Dependencies. --cache avoids root-owned entries in ~/.npm.
npm install --cache /tmp/npm-cache

# 2. Type check -- this is the step that bites.
#    `npm run build` alone does NOT catch type errors: vite doesn't type-check,
#    so the build exits 0 on code with errors in it. Measured on THIS project:
#    `npm run check` exits 2 with 14 errors while `npm run build` exits 0.
npm run check

# 3. The fire doors. A rule in AGENTS.md can be skimmed; this cannot be.
#    Reads the import lines per layer and fails if one reaches somewhere it
#    should not. Under a second, so there is no excuse to skip it.
#    Verified by breaking each boundary on purpose and watching it name the file.
bash scripts/check-architecture.sh

# 4. Build. Proves it can actually be packaged, not just type-checked.
npm run build

# 5. Does the app actually WORK?
#    Steps 2 and 3 only prove the code compiles. They both exit 0 on an app
#    that is completely dead -- nothing imports, nothing answers, and no error
#    is printed anywhere. In P03 the dead and working apps produced
#    byte-identical screenshots.
#    This starts the real app and asks it. See the SMOKE block in
#    src/main/main.ts.
#
#    On a Mac a window flashes open and closed -- that is expected. In a
#    container there is no display at all, so use xvfb-run (a fake screen) when
#    it is available. Without this branch the gate works on your laptop and
#    fails everywhere else.
if command -v xvfb-run >/dev/null 2>&1; then
  SMOKE=1 xvfb-run -a npx electron .
else
  SMOKE=1 npx electron .
fi

# 6. Is the clean-state checklist describing code that still exists?
#    A rule in AGENTS.md can be skipped. This cannot -- it runs every time.
#    A warning, not a failure: init.sh runs mid-work, when the checklist being
#    out of date is normal and expected.
#
#    The checklist now exists, so this step is live. Verified in both
#    directions: silent on a blank checklist, fires when boxes are ticked and a
#    source file is newer.
if [ -f clean-state-checklist.md ] \
   && grep -q '^- \[x\]' clean-state-checklist.md \
   && [ -n "$(find src -newer clean-state-checklist.md -type f -print -quit)" ]; then
  echo
  echo "WARNING: clean-state-checklist.md has ticked boxes, but src/ has changed"
  echo "         since it was walked. Those ticks describe code that no longer"
  echo "         exists. Blank the file and walk it again before calling this done."
  echo
fi

# DECISION, taken on purpose -- `npm test` is NOT in this gate.
#   Fourth project running, and still zero test files. The playbook is blunt
#   about this: no test gate, no tests.
#   The reason it is still out: `vitest run` against zero test files exits 1,
#   so adding it now makes BOTH fixture trees permanently red and the gate
#   impossible to score. Revisit in Phase 5 -- write one test, then add the
#   step, in that order.

# Last line on purpose. After `set -e` this is unreachable if anything above
# failed, so it can't lie.
echo "All checks passed."

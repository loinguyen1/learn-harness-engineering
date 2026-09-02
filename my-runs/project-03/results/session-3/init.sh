#!/usr/bin/env bash
# init.sh -- one command that says whether this project is in a working state.
# Run it at the start of a session, and after every change.

# The only line that really matters.
#   -e  stop at the first failure
#   -u  an unset variable is an error, not an empty string
#   -o pipefail  a failure mid-pipe counts as a failure
# Without this, a failed step is skipped and the success line below still prints.
set -euo pipefail

# 1. Dependencies.
npm install --cache /tmp/npm-cache

# 2. Type check -- this is the step that bites.
#    `npm run build` alone does NOT catch type errors: vite doesn't type-check,
#    so the build exits 0 on code with 15 errors in it.
npm run check

# 3. Build. Proves it can actually be packaged, not just type-checked.
npm run build

# 4. Does the app actually WORK?
#    Steps 2 and 3 only prove the code compiles. They both exit 0 on an app
#    whose window<->backend connector is dead -- nothing imports, nothing
#    answers, and no error is printed anywhere.
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

# Last line on purpose. After `set -e` this is unreachable if anything above
# failed, so it can't lie.
echo "All checks passed."
#!/usr/bin/env bash
# init.sh -- the verification gate. Same script in BOTH arms, so verification is
# held constant and the only variable is the continuity artifacts.
#
# set -e is what makes this honest: without it a failed command is ignored and
# the success line still prints, which is a lie. With it, "All checks passed"
# is unreachable unless every gate actually passed.
set -euo pipefail

# On the Mac host, ~/.npm has root-owned entries from a past `sudo npm` and
# installs die with EACCES; route around it. Inside the Linux container the
# default cache is fine and this does not trigger.
if [ "$(uname -s)" = "Darwin" ]; then
  export npm_config_cache="${npm_config_cache:-/Users/loi/harness-runs/.npm-cache}"
fi

echo "[1/3] npm install"
npm install --no-audit --no-fund

echo "[2/3] npm run check   (tsc --noEmit, both tsconfigs)"
npm run check

echo "[3/3] npm run build   (tsc -p tsconfig.node.json && vite build)"
npm run build

echo
echo "All checks passed."
echo "NOT proven by this script: that the window renders anything, that the"
echo "features work, or that any test exists. Launch it and look."

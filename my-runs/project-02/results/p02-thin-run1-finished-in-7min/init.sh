#!/usr/bin/env bash
# ^ tells the system to run this file with bash.

# Stop the moment anything fails.
# Without this line, a failed step is ignored and the "passed"
# message at the bottom prints anyway -- a lie.
set -euo pipefail

npm install     # download what the project needs
npm run check   # look for errors, write nothing
npm run build   # compile it

# Only reachable if all three above succeeded.
echo "All checks passed."

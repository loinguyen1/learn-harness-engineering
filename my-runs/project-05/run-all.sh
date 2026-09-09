#!/usr/bin/env bash
# run-all.sh -- run every remaining arm, strictly one at a time, then score.
# Arms share /work conversation state, so serialisation is a correctness
# requirement, not a resource optimisation.
set -uo pipefail
P5="$(cd "$(dirname "$0")" && pwd)"; cd "$P5"
wait_idle() { while [ -n "$(docker ps -q --filter name=p05- 2>/dev/null)" ]; do sleep 20; done; }
wait_idle
for arm in "$@"; do
  [ -d "runs/$arm" ] && { echo "== skip $arm (already run)"; continue; }
  echo "== $arm starting $(date -u +%H:%M:%SZ)"
  ./run-arm.sh "$arm" >> "runs/$arm.runner.log" 2>&1
  echo "== $arm done $(date -u +%H:%M:%SZ)"
  wait_idle
done
echo "ALL ARMS COMPLETE $(date -u +%H:%M:%SZ)"

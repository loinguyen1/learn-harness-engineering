#!/usr/bin/env bash
# run-one.sh -- start ONE agent session on a fresh copy of the project.
#
# The agent runs inside a container that mounts ONLY the run directory. It
# cannot see this repo, BASELINE.md, or projects/project-03/solution/.
set -euo pipefail

P3=/Users/loi/repo_/learn-harness-engineering/my-runs/project-03
RUN="$P3/runs/session-1"

if [ -e "$RUN" ]; then
  echo "A run already exists at runs/session-1."
  echo "Delete it first if you want a fresh one:  rm -rf $RUN"
  exit 1
fi

echo "[1/2] Making a fresh copy of the project"
mkdir -p "$RUN"
rsync -a --exclude node_modules --exclude dist "$P3/fixtures/repaired/" "$RUN/"
chmod +x "$RUN/init.sh"   # AGENTS.md, init.sh and the three continuity files
                          # all live in the fixture now -- see harness/

echo "[2/2] Starting the agent"
echo
echo "  It gets ONLY this folder. Nothing else on your Mac is visible to it."
echo
"$P3/../docker/lab.sh" interactive "$RUN" \
  "Read AGENTS.md and feature_list.json, then implement the remaining features."

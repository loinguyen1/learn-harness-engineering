#!/usr/bin/env bash
# rerun-baseline.sh -- run the Project 01 weak-harness experiment somewhere the
# course repo cannot leak into it, then bring the evidence back.
#
# The first attempt was contaminated: the run directory lived inside the course
# repo, and Claude Code auto-loads CLAUDE.md from every ancestor directory.
# Parking that file did not hold. This script sidesteps the problem instead of
# relying on discipline: the run happens OUTSIDE the repo entirely.
set -euo pipefail

REPO=/Users/loi/repo_/learn-harness-engineering
RUN_DIR="$HOME/p01-baseline-run"
RESULTS="$REPO/my-runs/project-01/results"
PROMPT="Build an Electron app that can show documents and answer questions."

if [ -e "$RUN_DIR" ]; then
  echo "ERROR: $RUN_DIR already exists. Move or delete it first, then re-run."
  exit 1
fi

echo "[1/5] Creating an isolated run directory outside the repo"
mkdir -p "$RUN_DIR/data"
cp "$REPO/projects/project-01/starter/task-prompt.md" "$RUN_DIR/"
cp -R "$REPO/projects/project-01/starter/data/sample-documents" "$RUN_DIR/data/"

echo "[2/5] Checking no CLAUDE.md can be auto-loaded from any ancestor"
LEAKS=0
d="$RUN_DIR"
while [ "$d" != "/" ]; do
  if [ -f "$d/CLAUDE.md" ]; then echo "  LEAK: $d/CLAUDE.md"; LEAKS=1; fi
  d="$(dirname "$d")"
done
[ -f /CLAUDE.md ] && { echo "  LEAK: /CLAUDE.md"; LEAKS=1; }
[ -f "$HOME/.claude/CLAUDE.md" ] && { echo "  LEAK: ~/.claude/CLAUDE.md"; LEAKS=1; }
if [ "$LEAKS" -ne 0 ]; then
  echo "ABORTING: the run would be contaminated. Move those files aside first."
  exit 1
fi
echo "  clean — no ancestor CLAUDE.md"

echo "[3/5] Running the agent (headless, no prompts)"
cd "$RUN_DIR"
date -u '+START %FT%TZ' | tee "$RESULTS/run-A2-timing.txt"
claude -p "$PROMPT" \
  --permission-mode acceptEdits \
  --allowedTools "Bash(npm:*)" \
  --disallowedTools "Bash(rm:*)" "Bash(curl:*)" \
  2>&1 | tee "$RESULTS/run-A2-transcript.log"
date -u '+END %FT%TZ' | tee -a "$RESULTS/run-A2-timing.txt"

echo "[4/5] Recording what it produced"
{ echo "### file tree"; find . -not -path './node_modules/*' -not -path './dist/*' | sort
  echo; echo "### node_modules present (did it ever install)?"
  [ -d node_modules ] && echo yes || echo "NO -- it never ran npm install"
} > "$RESULTS/run-A2-tree.txt"

echo "[5/5] Archiving source back into the repo"
rsync -a --exclude node_modules --exclude dist "$RUN_DIR/" "$RESULTS/p01-baseline-run2/"

echo
echo "Done. Run directory left at $RUN_DIR so you can launch it."
echo "Evidence copied to my-runs/project-01/results/."
echo "Next: cd $RUN_DIR && npm install && npm run check && npm test && npm run dev"

#!/usr/bin/env bash
# archive-run.sh {thin|handoff} [--host] -- snapshot a finished run into results/.
set -euo pipefail
REPO=/Users/loi/repo_/learn-harness-engineering
ARM="${1:-}"
MODE=container; [ "${2:-}" = "--host" ] && MODE=host
case "$ARM" in thin|handoff) ;; *) echo "usage: ./archive-run.sh {thin|handoff} [--host]"; exit 1 ;; esac

if [ "$MODE" = container ]; then
  RUN="$REPO/my-runs/project-02/runs/p02-$ARM"
else
  RUN="${LAB:-/Users/loi/harness-runs}/p02-$ARM"
fi
OUT="$REPO/my-runs/project-02/results/p02-$ARM"
[ -d "$RUN" ] || { echo "ERROR: no run at $RUN"; exit 1; }

rsync -a --exclude node_modules --exclude dist "$RUN/" "$OUT/"
{
  echo "arm: $ARM  mode: $MODE"
  echo "### final tree"
  ( cd "$RUN" && find . -not -path './node_modules/*' -not -path './dist/*' | sort )
  echo
  echo "### state of the harness files at archive time"
  for f in feature_list.json session-handoff.md; do
    echo "--- $f ---"
    [ -f "$RUN/$f" ] && cat "$RUN/$f" || echo "(absent)"
  done
} > "$REPO/my-runs/project-02/results/$ARM-final-state.txt" 2>&1

echo "Archived  -> results/p02-$ARM/"
echo "Final state -> results/$ARM-final-state.txt"
echo
echo "NOTE: init.sh is NOT re-run here. In container mode node_modules is Linux-built;"
echo "verify with:  ./run-session.sh $ARM b   then  ./init.sh  inside the container."

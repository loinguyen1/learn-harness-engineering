#!/usr/bin/env bash
# setup-run.sh {thin|handoff} [--host] -- materialise one arm of the P02 experiment.
#
# Two isolation strategies, because they protect differently:
#
#   container mode (default)  run dir lives in-repo at ./runs/p02-<arm>/ and is
#                             launched via ../docker/lab.sh, which mounts ONLY
#                             that directory. The repo, the solution, BASELINE.md
#                             are not on the agent's filesystem. Isolation is a
#                             fact, not a rule.
#
#   --host                    run dir lives at /Users/loi/harness-runs/, outside
#                             the repo. Weaker: it stops the ancestor CLAUDE.md
#                             auto-load and accidental `..` traversal, but the
#                             answer key is still reachable by absolute path.
#                             Use only when Docker is unavailable.
set -euo pipefail

REPO=/Users/loi/repo_/learn-harness-engineering
SRC="$REPO/projects/project-02/starter"
SOL="$REPO/projects/project-02/solution"
HARNESS="$REPO/my-runs/project-02/harness"

ARM="${1:-}"
MODE=container
[ "${2:-}" = "--host" ] && MODE=host

case "$ARM" in
  thin|handoff) ;;
  *) echo "usage: ./setup-run.sh {thin|handoff} [--host]"; exit 1 ;;
esac

if [ "$MODE" = container ]; then
  ROOT="$REPO/my-runs/project-02/runs"
else
  ROOT="${LAB:-/Users/loi/harness-runs}"
fi
RUN="$ROOT/p02-$ARM"

if [ -e "$RUN" ]; then
  echo "ERROR: $RUN already exists."
  echo "Archive it first (./archive-run.sh $ARM), then delete it."
  exit 1
fi

echo "[1/4] Isolation ($MODE mode)"
if [ "$MODE" = host ]; then
  # Only meaningful on the host: inside a container none of this is reachable.
  LEAKS=0
  d="$ROOT"
  while [ "$d" != "/" ]; do
    for f in CLAUDE.md AGENTS.md; do
      [ -f "$d/$f" ] && { echo "  LEAK: $d/$f"; LEAKS=1; }
    done
    d="$(dirname "$d")"
  done
  for f in /CLAUDE.md /AGENTS.md "$HOME/.claude/CLAUDE.md"; do
    [ -f "$f" ] && { echo "  LEAK: $f"; LEAKS=1; }
  done
  for s in "$ROOT"/*/; do
    [ -e "$s" ] || continue
    b="$(basename "$s")"
    [ "$b" = "p02-$ARM" ] && continue
    echo "  SIBLING: $b"; LEAKS=1
  done
  if [ "$LEAKS" -ne 0 ]; then
    echo "ABORTING: the run would be contaminated. Clear those first."
    exit 1
  fi
  echo "  clean -- no ancestor context files, no siblings"
  echo "  NOTE: host mode still leaves $REPO reachable by absolute path."
else
  echo "  the run dir is inside the repo ON PURPOSE."
  echo "  lab.sh mounts only $RUN at /work, so the repo is not on the"
  echo "  agent's filesystem at all. Launch it ONLY through ./run-session.sh."
  if ! command -v docker >/dev/null 2>&1; then
    echo
    echo "  !! Docker is NOT installed. This run dir is NOT yet isolated."
    echo "  !! Running \`claude\` in it directly would load $REPO/CLAUDE.md and"
    echo "  !! put projects/project-02/solution/ three \`..\` hops away."
    echo "  !! Install Docker Desktop, then ../docker/lab.sh build && login."
    echo "  !! Or re-run with --host for the weaker filesystem-distance option."
  fi
fi

echo "[2/4] Copying starter code (identical in both arms)"
mkdir -p "$RUN"
rsync -a --exclude node_modules --exclude dist "$SRC/" "$RUN/"
cp "$HARNESS/init.sh" "$RUN/init.sh"
chmod +x "$RUN/init.sh"

echo "[3/4] Applying the $ARM harness"
if [ "$ARM" = "thin" ]; then
  rm -f "$RUN/session-handoff.md"
  echo "  AGENTS.md: minimal (starter, as shipped)"
  echo "  session-handoff.md: absent"
else
  # docs/ stays the STARTER's on purpose -- the solution's ARCHITECTURE.md spells
  # out the import pipeline step by step, which is the answer, not a continuity
  # artifact. Copying it would confound "handoff helps resumption" with "the
  # answer was written down".
  cp "$HARNESS/AGENTS.handoff.md" "$RUN/AGENTS.md"
  cp "$HARNESS/session-handoff.template.md" "$RUN/session-handoff.md"
  echo "  AGENTS.md: YOURS (harness/AGENTS.handoff.md)"
  echo "  session-handoff.md: seeded template"
  echo "  docs/: starter's (NOT the solution's -- see comment in this script)"
fi

echo "[4/4] Recording the starting state"
{
  echo "arm: $ARM"
  echo "mode: $MODE"
  echo "run dir: $RUN"
  echo "### file tree"
  ( cd "$RUN" && find . -not -path './node_modules/*' -not -path './dist/*' | sort )
} > "$REPO/my-runs/project-02/results/$ARM-start-state.txt"

echo
echo "Ready: $RUN"
echo
if [ "$MODE" = container ]; then
  echo "  ./run-session.sh $ARM a      # Session A, inside the container"
  echo "  ./run-session.sh $ARM b      # Session B, fresh, same directory"
  echo
  echo "  Dependencies install INSIDE the container -- do not npm install here."
  echo "  A macOS node_modules cannot run in Linux."
else
  echo "  cd $RUN && ./init.sh      # expect FAILURE -- see BASELINE.md"
  echo "  cd $RUN && claude"
fi

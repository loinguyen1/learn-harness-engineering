#!/usr/bin/env bash
# check-gate.sh -- run YOUR gate against two trees and report whether it can
# tell them apart.
#
# This does not judge your gate. It runs it twice and prints two exit codes.
#
#   bugged   fixtures/bugged  -- the starter as shipped. Every sample document
#                               indexes into empty chunks. `npm run build`
#                               exits 0. The app renders. Q&A returns an answer
#                               with zero citations and no error anywhere.
#   fixed    fixtures/fixed   -- the SAME tree with only the chunking defect
#                               removed. `diff -rq` reports one differing file.
#
# One file apart. So a gate that scores 2/2 is reacting to the defect and to
# nothing else -- there is nothing else to react to.
#
# HOW IT FINDS YOUR WORK
#   Everything in harness/overlay/ is copied over each tree before the gate
#   runs, keeping its relative path. So:
#
#       harness/overlay/init.sh          -> <tree>/init.sh
#       harness/overlay/src/main/main.ts -> <tree>/src/main/main.ts
#
#   Put whatever your gate needs in there. One copy of each file, laid out the
#   way the project is laid out. Nothing here decides how you build it.
#
# Each tree is copied to scratch first, so the fixtures stay pristine.
set -euo pipefail

REPO=/Users/loi/repo_/learn-harness-engineering
P4="$REPO/my-runs/project-04"
OVERLAY="$P4/harness/overlay"
WORK="$P4/runs/.gate-check"

[ -f "$OVERLAY/init.sh" ] || {
  echo "No gate yet at harness/overlay/init.sh -- see harness/README.md"; exit 1; }
command -v docker >/dev/null 2>&1 || { echo "ERROR: Docker not installed."; exit 1; }
docker image inspect harness-lab:latest >/dev/null 2>&1 || {
  echo "ERROR: run ../docker/lab.sh build"; exit 1; }

# macOS ships bash 3.2 -- no associative arrays.
CODE_bugged=; CODE_fixed=

for TREE in bugged fixed; do
  rm -rf "$WORK/$TREE"; mkdir -p "$WORK/$TREE"
  rsync -a --exclude node_modules --exclude dist "$P4/fixtures/$TREE/" "$WORK/$TREE/"
  rsync -a "$OVERLAY/" "$WORK/$TREE/"
  chmod +x "$WORK/$TREE/init.sh"

  echo "=================== ./init.sh against $TREE ==================="
  set +e
  docker run --rm -v "$WORK/$TREE":/work harness-lab:latest \
    bash -lc 'cd /work && ./init.sh 2>&1 | tail -30; exit ${PIPESTATUS[0]}'
  RC=$?
  set -e
  eval "CODE_$TREE=$RC"
  echo "--> exit $RC"
  echo
done

echo "======================== VERDICT ========================"
printf "  bugged  -> exit %s   (want: non-zero)\n" "$CODE_bugged"
printf "  fixed   -> exit %s   (want: 0)\n"        "$CODE_fixed"
echo
if [ "$CODE_bugged" -eq 0 ] && [ "$CODE_fixed" -eq 0 ]; then
  echo "  FAIL: passed both. The gate cannot see the defect."
  echo "  Check what your product step asserts on. 'Did it answer?' passes here:"
  echo "  the app DOES answer, with zero citations and confidence 0.30."
  echo "  See BASELINE.md section 3."
elif [ "$CODE_bugged" -eq 0 ]; then
  echo "  FAIL: passed the bugged tree and rejected the fixed one. Backwards."
  echo "  Read the fixed-tree output -- something in the gate is broken, not the app."
elif [ "$CODE_fixed" -ne 0 ]; then
  echo "  PARTIAL: fails the bugged tree, but also fails the fixed one."
  echo "  It is red for a reason you did not choose. Read the fixed-tree output"
  echo "  and find WHICH STEP. Two inherited defects are in both trees:"
  echo "    BRIDGE: undefined  -> the dead IPC bridge     (BASELINE.md section 1b)"
  echo "    error TS....       -> 14 inherited type errors (BASELINE.md section 2)"
  echo "  Neither is the chunking bug. Expected on a first run -- see 1b."
else
  echo "  PASS: red on the defect, green without it, one file between them."
  echo "  That is a regression test, not a hypothetical. Phase 1 done."
  echo "  Now RUNBOOK.md -- the gate saying 'broken' is where P04 starts."
fi

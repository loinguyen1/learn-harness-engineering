#!/usr/bin/env bash
# check-gate.sh -- run YOUR harness/init.sh against three trees and report
# whether it can tell them apart.
#
# This does not judge your gate. It runs it three times and prints three exit
# codes. What you do with them is yours.
#
#   broken    the starter as shipped        -- 15 TypeScript errors, bridge dead
#   repaired  fixtures/repaired             -- check exits 0, bridge alive
#   rekilled  repaired, with ONE line put back:
#               src/main/main.ts   sandbox: false -> sandbox: true
#             `npm run check` still exits 0 here. `npm run build` still exits 0.
#             The window still renders identically. The IPC bridge is dead.
#
# The third tree is the one that matters. Anything can pass the first two.
#
# Each tree is copied to scratch first, so the fixtures stay pristine.
set -euo pipefail

REPO=/Users/loi/repo_/learn-harness-engineering
P3="$REPO/my-runs/project-03"
GATE="$P3/harness/init.sh"
WORK="$P3/runs/.gate-check"

[ -f "$GATE" ] || { echo "No gate yet at harness/init.sh -- see harness/README.md"; exit 1; }
command -v docker >/dev/null 2>&1 || { echo "ERROR: Docker not installed."; exit 1; }
docker image inspect harness-lab:latest >/dev/null 2>&1 || { echo "ERROR: run ../docker/lab.sh build"; exit 1; }

# macOS ships bash 3.2 -- no associative arrays.
CODE_broken=; CODE_repaired=; CODE_rekilled=

for TREE in broken repaired rekilled; do
  SRC=repaired; [ "$TREE" = broken ] && SRC=broken
  rm -rf "$WORK/$TREE"; mkdir -p "$WORK/$TREE"
  rsync -a --exclude node_modules --exclude dist "$P3/fixtures/$SRC/" "$WORK/$TREE/"

  if [ "$TREE" = rekilled ]; then
    # Put back the one line from REPAIR.md change A that revives the bridge.
    perl -pi -e 's/^      sandbox: false,$/      sandbox: true,/' "$WORK/$TREE/src/main/main.ts"
    grep -q "sandbox: true," "$WORK/$TREE/src/main/main.ts" \
      || { echo "ERROR: could not re-kill the bridge -- did main.ts change?"; exit 1; }
  fi

  cp "$GATE" "$WORK/$TREE/init.sh"; chmod +x "$WORK/$TREE/init.sh"

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
printf "  broken    -> exit %s   (want: non-zero)\n" "$CODE_broken"
printf "  repaired  -> exit %s   (want: 0)\n"        "$CODE_repaired"
printf "  rekilled  -> exit %s   (want: non-zero)\n" "$CODE_rekilled"
echo
if [ "$CODE_broken" -eq 0 ]; then
  echo "  FAIL: passed the broken tree. The gate is decoration."
elif [ "$CODE_repaired" -ne 0 ]; then
  echo "  FAIL: rejected the repaired tree. Read the output -- either the gate is"
  echo "  wrong, or it found something in my repair that I missed. Both are useful."
elif [ "$CODE_rekilled" -eq 0 ]; then
  echo "  PARTIAL: catches broken code, misses a dead app."
  echo "  This is the blind spot the starter shipped with, and the one P02's gate"
  echo "  had. check + build + a screenshot all pass this tree. See"
  echo "  results/gate-blind-spot.log and BASELINE.md section 1."
else
  echo "  PASS: the gate fails broken code AND a dead app, and passes working code."
  echo "  That is further than P01's or P02's gate got."
  echo "  Now: ../compare-after/ if you want to diff against my approach."
fi

#!/usr/bin/env bash
# run-arm.sh {plain|logged} -- start ONE agent session on a fresh copy of the app.
#
# The only difference between the two arms is the logger. Same broken app, same
# gate, same AGENTS.md, same prompt.
#
# The agent runs in a container that mounts ONLY the run directory. It cannot
# see this repo, BASELINE.md, REPAIR.md, or fixtures/fixed.
set -euo pipefail

ARM="${1:?usage: run-arm.sh plain|logged|plain-quiet|logged-quiet}"
P4="$(cd "$(dirname "$0")" && pwd)"

# The -quiet arms use a gate that asserts the same thing but prints no numbers,
# so the logger is the ONLY place a count-versus-size signal exists.
GATE=overlay
case "$ARM" in
  plain)        SRC=bugged ;;
  logged)       SRC=bugged-logged ;;
  plain-quiet)  SRC=bugged;        GATE=overlay-quiet ;;
  logged-quiet) SRC=bugged-logged; GATE=overlay-quiet ;;
  *) echo "arm must be plain, logged, plain-quiet or logged-quiet"; exit 1 ;;
esac

RUN="$P4/runs/$ARM"
if [ -e "$RUN" ]; then
  echo "A run already exists at runs/$ARM."
  echo "Delete it first if you want a fresh one:  rm -rf $RUN"
  exit 1
fi

echo "[1/2] Fresh copy of the app  (arm: $ARM, from fixtures/$SRC, gate: $GATE)"
mkdir -p "$RUN"
rsync -a --exclude node_modules --exclude dist "$P4/fixtures/$SRC/" "$RUN/"
rsync -a "$P4/harness/$GATE/" "$RUN/"     # the gate -- one copy per variant
chmod +x "$RUN/init.sh"

echo "[2/2] Starting the agent"
echo
echo "  It gets ONLY this folder. Nothing else on your Mac is visible to it."
echo
# Identical prompt in both arms. It says the gate fails. It does NOT say where.
"$P4/../docker/lab.sh" interactive "$RUN" \
  "Run ./init.sh. It fails. Find out why and fix it."

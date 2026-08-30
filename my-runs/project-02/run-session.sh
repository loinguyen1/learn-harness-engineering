#!/usr/bin/env bash
# run-session.sh {thin|handoff} {a|b} -- launch one session inside the sandbox.
#
# Session A and Session B use fixed prompts. They are fixed on purpose: the
# moment you improvise, the two arms stop being comparable.
set -euo pipefail

REPO=/Users/loi/repo_/learn-harness-engineering
RUNS="$REPO/my-runs/project-02/runs"
LAB="$REPO/my-runs/docker/lab.sh"
RESULTS="$REPO/my-runs/project-02/results"

ARM="${1:-}"; SESSION="${2:-}"
case "$ARM" in thin|handoff) ;; *) echo "usage: ./run-session.sh {thin|handoff} {a|b}"; exit 1 ;; esac
case "$SESSION" in a|b|gate) ;; *) echo "usage: ./run-session.sh {thin|handoff} {a|b|gate}"; exit 1 ;; esac

RUN="$RUNS/p02-$ARM"
[ -d "$RUN" ] || { echo "ERROR: no run dir at $RUN. Run ./setup-run.sh $ARM first."; exit 1; }

if ! command -v docker >/dev/null 2>&1; then
  echo "ERROR: Docker is not installed."
  echo "Without it this run dir is NOT isolated -- it sits inside the repo,"
  echo "three '..' hops from projects/project-02/solution/."
  echo "Install Docker Desktop, then: ../docker/lab.sh build && ../docker/lab.sh login"
  exit 1
fi
if ! docker image inspect harness-lab:latest >/dev/null 2>&1; then
  echo "ERROR: image harness-lab:latest not built. Run: ../docker/lab.sh build"
  exit 1
fi

if [ "$SESSION" = gate ]; then
  # No agent. Just run the verification gate in the container and show the result.
  # Do this BEFORE session A: a gate you have not seen fail is a gate you cannot trust.
  echo "Running ./init.sh inside the container. EXPECT IT TO FAIL -- see BASELINE.md."
  echo
  docker run --rm -v "$RUN":/work harness-lab:latest \
    bash -lc './init.sh 2>&1 | tail -25; s=${PIPESTATUS[0]}; echo; echo "init.sh exit: $s"'
  echo
  echo "Exit 2 with 15 TypeScript errors is the CORRECT starting state."
  echo "The gate bites. Now you can trust it. Next: ./run-session.sh $ARM a"
  exit 0
fi

if [ "$SESSION" = a ]; then
  PROMPT="Read AGENTS.md and feature_list.json, then implement the remaining features."
  cat <<'NOTE'
--- SESSION A ---
Stop this session DELIBERATELY, part-way through -- roughly two of the three
features in progress or done, NOT at a clean boundary. Note the wall-clock time
and what state the code is in. Then run session B.
NOTE
else
  PROMPT="Continue the work in this repository."
  cat <<'NOTE'
--- SESSION B ---
This must be a genuinely COLD session. Say nothing that is not already in the
run directory. If it asks you something the repo should have answered, that is
your data point -- record it, then answer as tersely as you can.
NOTE
fi

echo
echo "prompt: $PROMPT"
echo
mkdir -p "$RESULTS"
date -u "+$ARM session-$SESSION START %FT%TZ" | tee -a "$RESULTS/$ARM-timing.txt"
"$LAB" interactive "$RUN" "$PROMPT"
date -u "+$ARM session-$SESSION END   %FT%TZ" | tee -a "$RESULTS/$ARM-timing.txt"
echo
echo "Timing appended to results/$ARM-timing.txt"
echo "Session transcripts are interactive -- record your observations in RUNBOOK.md's table."

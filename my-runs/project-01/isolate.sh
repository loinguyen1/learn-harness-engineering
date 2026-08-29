#!/usr/bin/env bash
# isolate.sh -- park/unpark the repo-root CLAUDE.md around a baseline run.
#
# Why: the run directories live inside the course repo, and Claude Code loads
# CLAUDE.md from every ancestor directory. The repo root CLAUDE.md describes the
# Electron layer structure, the IPC channel convention, the build commands, and
# the harness file names -- i.e. most of the strong harness. If it loads during
# the weak run, the weak run is not weak and the experiment measures nothing.
set -euo pipefail

REPO=/Users/loi/repo_/learn-harness-engineering
LIVE="$REPO/CLAUDE.md"
PARKED="$REPO/CLAUDE.md.parked-for-p01"

case "${1:-}" in
  park)
    if [ -f "$PARKED" ]; then echo "Already parked."; exit 0; fi
    mv "$LIVE" "$PARKED"
    echo "Parked repo CLAUDE.md -> $(basename "$PARKED")"
    echo "The baseline run is now isolated. Remember to run: ./isolate.sh unpark"
    ;;
  unpark)
    if [ ! -f "$PARKED" ]; then echo "Nothing parked."; exit 0; fi
    mv "$PARKED" "$LIVE"
    echo "Restored repo CLAUDE.md"
    ;;
  status)
    if [ -f "$PARKED" ]; then echo "PARKED (baseline run is isolated)"; else echo "LIVE (repo CLAUDE.md is active)"; fi
    ;;
  *)
    echo "usage: ./isolate.sh {park|unpark|status}"; exit 1
    ;;
esac

#!/usr/bin/env bash
# lab.sh -- build / login / run the agent sandbox.
set -euo pipefail

IMAGE=harness-lab:latest
AUTH_VOL=harness-lab-auth
HERE="$(cd "$(dirname "$0")" && pwd)"
PROMPT_DEFAULT="Build an Electron app that can show documents and answer questions."

case "${1:-}" in
  build)
    docker build -t "$IMAGE" "$HERE"
    ;;

  login)
    # One-time: authenticate Claude Code INSIDE the container. Credentials land
    # in the named volume, not in the image and not on your host.
    docker run --rm -it -v "$AUTH_VOL":/home/agent/.claude "$IMAGE" claude
    ;;

  run)
    RUN_DIR="${2:?usage: lab.sh run <run-dir> [prompt]}"
    PROMPT="${3:-$PROMPT_DEFAULT}"
    ABS="$(cd "$RUN_DIR" && pwd)"
    echo "Mounting ONLY: $ABS  ->  /work"
    date -u '+START %FT%TZ'
    docker run --rm -it \
      -v "$ABS":/work \
      -v "$AUTH_VOL":/home/agent/.claude \
      --memory=4g --cpus=2 --pids-limit=512 \
      --cap-drop=ALL --security-opt no-new-privileges \
      "$IMAGE" \
      bash -lc "xvfb-run -a claude -p \"\$0\" --permission-mode bypassPermissions" "$PROMPT"
    date -u '+END %FT%TZ'
    ;;

  shell)
    RUN_DIR="${2:?usage: lab.sh shell <run-dir>}"
    ABS="$(cd "$RUN_DIR" && pwd)"
    docker run --rm -it -v "$ABS":/work -v "$AUTH_VOL":/home/agent/.claude "$IMAGE" bash
    ;;

  *)
    echo "usage: ./lab.sh {build|login|run <dir> [prompt]|shell <dir>}"; exit 1
    ;;
esac

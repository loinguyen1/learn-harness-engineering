#!/usr/bin/env bash
# lab.sh -- build / login / run the agent sandbox.
set -euo pipefail

IMAGE=harness-lab:latest
AUTH_VOL=harness-lab-home   # whole home dir: Claude Code writes ~/.claude AND ~/.claude.json
HERE="$(cd "$(dirname "$0")" && pwd)"
PROMPT_DEFAULT="Build an Electron app that can show documents and answer questions."

case "${1:-}" in
  build)
    docker build -t "$IMAGE" "$HERE"
    ;;

  login)
    # One-time: authenticate Claude Code INSIDE the container. Credentials land
    # in the named volume, not in the image and not on your host.
    docker run --rm -it -v "$AUTH_VOL":/home/agent "$IMAGE" claude
    ;;

  run)
    RUN_DIR="${2:?usage: lab.sh run <run-dir> [prompt]}"
    PROMPT="${3:-$PROMPT_DEFAULT}"
    ABS="$(cd "$RUN_DIR" && pwd)"
    echo "Mounting ONLY: $ABS  ->  /work"
    date -u '+START %FT%TZ'
    docker run --rm -it \
      -v "$ABS":/work \
      -v "$AUTH_VOL":/home/agent \
      --memory=4g --cpus=2 --pids-limit=512 \
      --cap-drop=ALL --security-opt no-new-privileges \
      "$IMAGE" \
      bash -lc "xvfb-run -a claude -p \"\$0\" --permission-mode bypassPermissions" "$PROMPT"
    date -u '+END %FT%TZ'
    ;;

  interactive)
    # Like `run`, but leaves you at an INTERACTIVE claude session instead of a
    # headless one-shot. P02 needs this: Session A is stopped deliberately
    # part-way through, which `claude -p` gives you no chance to do.
    RUN_DIR="${2:?usage: lab.sh interactive <run-dir> [initial-prompt]}"
    PROMPT="${3:-}"
    ABS="$(cd "$RUN_DIR" && pwd)"
    echo "Mounting ONLY: $ABS  ->  /work"
    echo "Nothing else on this Mac is visible from inside."
    docker run --rm -it \
      -v "$ABS":/work \
      -v "$AUTH_VOL":/home/agent \
      --memory=4g --cpus=2 --pids-limit=512 \
      --cap-drop=ALL --security-opt no-new-privileges \
      "$IMAGE" \
      bash -lc 'xvfb-run -a claude ${1:+"$1"}' _ "$PROMPT"
    ;;

  shell)
    RUN_DIR="${2:?usage: lab.sh shell <run-dir>}"
    ABS="$(cd "$RUN_DIR" && pwd)"
    docker run --rm -it -v "$ABS":/work -v "$AUTH_VOL":/home/agent "$IMAGE" bash
    ;;

  *)
    echo "usage: ./lab.sh {build|login|run <dir> [prompt]|interactive <dir> [prompt]|shell <dir>}"; exit 1
    ;;
esac

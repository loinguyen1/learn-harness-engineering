#!/usr/bin/env bash
# check-architecture.sh -- the fire doors.
#
# Reads the import lines in each layer and fails if one reaches somewhere it
# should not. It never runs the app; it reads the text. A tripwire, not a lock:
# it catches the honest mistake, in under a second.
set -euo pipefail

FAILED=0

# banned <layer-dir> <regex> <why>
banned() {
  local dir="$1" pattern="$2" why="$3"
  [ -d "$dir" ] || return 0
  local hits
  hits=$(grep -rnE "$pattern" "$dir" --include='*.ts' --include='*.tsx' || true)
  if [ -n "$hits" ]; then
    echo "VIOLATION: $why"
    echo "$hits" | sed 's/^/  /'
    FAILED=1
  fi
}

banned src/renderer \
  "^import .*['\"](fs|path|os|child_process)['\"]" \
  "the window must not touch the disk (fs/path/os/child_process)"

banned src/services \
  "^import .*['\"]electron['\"]|\bipcMain\b|\bipcRenderer\b|\bBrowserWindow\b" \
  "logic must not know it is inside Electron"

banned src/services \
  "^import .*['\"]react" \
  "logic must not import UI code"

banned src/main \
  "^import .*['\"]react" \
  "wiring must not import UI code"

if [ "$FAILED" -ne 0 ]; then
  echo "FAIL: architecture boundaries broken."
  exit 1
fi
echo "Architecture boundaries OK."

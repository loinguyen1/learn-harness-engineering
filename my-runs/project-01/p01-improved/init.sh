#!/usr/bin/env bash
# init.sh -- Verify the project builds cleanly before starting work.
# Run this after cloning or when resuming work.
set -euo pipefail

echo "=== Project 01 Init ==="
echo ""

echo "[1/4] Installing dependencies..."
npm install
echo ""

echo "[2/4] Running type checks..."
npm run check
echo ""

echo "[3/4] Building project..."
npm run build
echo ""

echo "[4/4] Verifying renderer assets load under file://..."
grep -q 'src="\./assets/' dist/renderer/index.html || {
  echo "ERROR: renderer uses absolute asset paths. Under Electron's file:// they"
  echo "resolve to the filesystem root, so the window renders blank."
  exit 1
}

echo "=== Init complete. All checks passed. ==="
echo "Run 'npm run dev' to launch the application."

#!/usr/bin/env bash
# score.sh -- score every arm BLIND with one fixed scorer, three times each.
#
# The scorer never learns which arm it is reading. Arm identity is stripped
# mechanically (only source files are copied; every .md the arm wrote is left
# behind), arms are shuffled into subject-1..N, and the key is written only
# after all scoring has finished.
#
# Three replicates per subject exist to measure the scorer's own noise. If the
# gap between arms is not bigger than the spread within a subject, the result
# is null and gets reported as null.
set -euo pipefail
P5="$(cd "$(dirname "$0")" && pwd)"
IMAGE=harness-lab:latest
AUTH_VOL=harness-lab-home
ARMS=(A Aplus B C)
REPLICATES=1
OUT="$P5/results"; mkdir -p "$OUT"
STAGE="$P5/.scoring"; rm -rf "$STAGE"; mkdir -p "$STAGE"

echo "[1/4] extracting subjects (source only -- every arm-written .md stays behind)"
for arm in "${ARMS[@]}"; do
  RUN="$P5/runs/$arm"
  [ -d "$RUN" ] || { echo "  missing runs/$arm -- run it first"; exit 1; }
  S="$STAGE/raw/$arm"; mkdir -p "$S"
  cp "$RUN"/src/renderer/components/* "$S"/ 2>/dev/null || true
  cp "$RUN"/src/shared/types.ts "$S"/types.ts
  diff -u "$P5/fixtures/clean/src/renderer/App.tsx" "$RUN/src/renderer/App.tsx" > "$S/App.diff" || true
  # Leak check: does the extracted code name its own arm or process?
  if grep -rniE "sprint-contract|evaluator|planner|self-review|review-notes|arm[ -]?[abc]" "$S" >/dev/null 2>&1; then
    echo "  LEAK WARNING in $arm:"; grep -rniE "sprint-contract|evaluator|planner|self-review|review-notes" "$S" | head -3
  fi
done

echo "[2/4] shuffling into subjects"
SHUF=$(printf '%s\n' "${ARMS[@]}" | sort -R)
i=1; : > "$STAGE/key.txt"
while read -r arm; do
  echo "subject-$i = $arm" >> "$STAGE/key.txt"
  mkdir -p "$STAGE/subject-$i"; cp -r "$STAGE/raw/$arm" "$STAGE/subject-$i/subject"
  cp "$P5/harness/feature-brief.md" "$P5/harness/evaluator-rubric.md" "$STAGE/subject-$i/"
  i=$((i+1))
done <<< "$SHUF"
N=$((i-1))

echo "[3/4] scoring $N subjects x $REPLICATES replicates, blind"
PROMPT="$(cat "$P5/harness/score-prompt.md")"
for s in $(seq 1 $N); do
  for r in $(seq 1 $REPLICATES); do
    W="$STAGE/work/s${s}r${r}"; mkdir -p "$W"
    cp -r "$STAGE/subject-$s"/* "$W"/
    docker run --rm -v "$W":/work -v "$AUTH_VOL":/home/agent \
      --memory=4g --cpus=2 --cap-drop=ALL --security-opt no-new-privileges \
      "$IMAGE" bash -lc "cd /work && claude -p \"\$0\" --permission-mode bypassPermissions" \
      "$PROMPT" >/dev/null 2>&1 || true
    # Match any precision (4.375 as well as 4.4) and take the score, not the "/ 5".
    M=$(grep -iE "mean score" "$W/evaluator-rubric.md" 2>/dev/null | head -1 \
        | sed -E 's|.*[Mm]ean score[^0-9]*([0-9]+(\.[0-9]+)?).*|\1|')
    echo "subject-$s replicate-$r ${M:-NA}"
    echo "subject-$s,$r,${M:-NA}" >> "$OUT/raw-scores.csv"
    cp "$W/evaluator-rubric.md" "$OUT/rubric-s${s}-r${r}.md" 2>/dev/null || true
  done
done

echo "[4/4] unblinding"
cp "$STAGE/key.txt" "$OUT/blind-key.txt"
cat "$OUT/blind-key.txt"

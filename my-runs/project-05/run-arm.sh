#!/usr/bin/env bash
# run-arm.sh {A|Aplus|B|C} -- run ONE arm of the role-separation experiment.
#
# Every arm starts from the SAME verified fixture and builds the SAME feature.
# The only variable is the context topology:
#
#   A      gen -> (same context) self-review prose -> fresh gen revises
#   Aplus  gen -> (same context) self-review RUBRIC -> fresh gen revises
#   B      gen -> (FRESH context) evaluator rubric -> fresh gen revises
#   C      plan -> gen -> (FRESH context) evaluator rubric -> fresh gen revises
#
# A+ vs B is the whole experiment: identical rubric, identical steps, the only
# difference is whether the context that filled it also wrote the code.
set -euo pipefail

ARM="${1:?usage: run-arm.sh A|Aplus|B|C}"
P5="$(cd "$(dirname "$0")" && pwd)"
RUN="$P5/runs/$ARM"
IMAGE=harness-lab:latest
STEP_TIMEOUT="${STEP_TIMEOUT:-2400}"   # seconds per agent turn
AUTH_VOL=harness-lab-home

[ -e "$RUN" ] && { echo "runs/$ARM exists. rm -rf it for a fresh run."; exit 1; }

# Arms are NOT safe to run in parallel. Every arm mounts its run dir at the same
# path (/work), so Claude keys them all to one project history -- one arm's
# purge deletes another arm's in-flight conversation, and --continue can resume
# the wrong arm entirely. Observed: arm C's purge destroyed arm A's history 60
# seconds into A's first step. Serialise, and refuse to start if unsure.
if [ -n "$(docker ps -q --filter name=p05- 2>/dev/null)" ]; then
  echo "FAIL: another p05 arm is still running. Arms share /work conversation"
  echo "      state and must run one at a time. Wait for it, or docker kill it."
  docker ps --format '  running: {{.Names}} ({{.RunningFor}})' --filter name=p05-
  exit 1
fi

echo "[setup] fresh copy of the verified fixture -> runs/$ARM"
mkdir -p "$RUN"
rsync -a --exclude node_modules --exclude dist "$P5/fixtures/clean/" "$RUN/"
cp "$P5/harness/feature-brief.md" "$P5/harness/evaluator-rubric.md" "$RUN/"

# One agent turn = one container = one fresh context, unless --continue is used.
step() {
  local label="$1" prompt="$2" cont="${3:-}"
  echo "  [$ARM] $label  ($(date -u +%H:%M:%SZ))"
  # A step that hangs is worse than one that fails: it produces no output and
  # never ends. `xvfb-run` without a TTY did exactly that and cost 20 minutes.
  # macOS has no coreutils `timeout`; perl's alarm is always present.
  perl -e 'alarm shift; exec @ARGV' "$STEP_TIMEOUT" \
  docker run --rm --name "p05-$ARM-$$" \
    -v "$RUN":/work -v "$AUTH_VOL":/home/agent \
    --memory=4g --cpus=2 --pids-limit=512 \
    --cap-drop=ALL --security-opt no-new-privileges \
    "$IMAGE" \
    bash -lc "Xvfb :99 -screen 0 1280x1024x24 -nolisten tcp >/dev/null 2>&1 & sleep 2; export DISPLAY=:99; cd /work && claude $cont -p \"\$0\" --permission-mode bypassPermissions" \
    "$prompt" >>"$RUN/../$ARM.transcript.log" 2>&1 || echo "  [$ARM] $label exited $?"
  # Snapshot any rubric this step produced. A later step overwrites the file,
  # and the self-assessment is evidence -- it must survive its own revision.
  mkdir -p "$P5/results/self-scores"
  [ -f "$RUN/evaluator-rubric.md" ] && cp "$RUN/evaluator-rubric.md" \
    "$P5/results/self-scores/$ARM-after-$(echo "$label" | tr -c 'a-zA-Z0-9' '-').md"
  [ -f "$RUN/review-notes.md" ] && cp "$RUN/review-notes.md" \
    "$P5/results/self-scores/$ARM-review-notes.md"
  return 0
}

# Every arm mounts its run dir at the SAME path (/work), so Claude keys them to
# the same project history. Without this purge, an arm's --continue step could
# resume a conversation from a PREVIOUS arm -- or from Project 04. Clear it so
# each arm's step 1 is genuinely the first context.
echo "[setup] purging /work conversation history so this arm starts cold"
docker run --rm -v "$AUTH_VOL":/home/agent "$IMAGE" \
  bash -lc 'rm -rf /home/agent/.claude/projects/-work'

P="$P5/harness/role-prompts"
gen_prompt() {   # arm C generates against a contract; the others do not
  if [ "$ARM" = C ]; then
    sed 's|SPRINT_CONTRACT_LINE|Follow /work/sprint-contract.md exactly. It is the acceptance contract.|' "$P/2-generate.md"
  else
    sed '/SPRINT_CONTRACT_LINE/d' "$P/2-generate.md"
  fi
}
eval_prompt() {
  if [ "$ARM" = C ]; then
    sed 's|CONTRACT_LINE|/work/sprint-contract.md,|' "$P/3c-evaluate.md"
  else
    sed 's|CONTRACT_LINE||' "$P/3c-evaluate.md"
  fi
}

date -u '+START %FT%TZ' | tee "$RUN/../$ARM.timing.log"

case "$ARM" in
  A)     step "1/3 generate"    "$(gen_prompt)"
         step "2/3 self-review" "$(cat "$P/3a-self-review.md")" --continue
         step "3/3 revise"      "$(sed 's|REVIEW_FILE|review-notes.md|' "$P/4-revise.md")" ;;
  Aplus) step "1/3 generate"    "$(gen_prompt)"
         step "2/3 self-rubric" "$(cat "$P/3b-self-review-rubric.md")" --continue
         step "3/3 revise"      "$(sed 's|REVIEW_FILE|evaluator-rubric.md|' "$P/4-revise.md")" ;;
  B)     step "1/3 generate"    "$(gen_prompt)"
         step "2/3 EVALUATE"    "$(eval_prompt)"
         step "3/3 revise"      "$(sed 's|REVIEW_FILE|evaluator-rubric.md|' "$P/4-revise.md")" ;;
  C)     step "1/4 plan"        "$(cat "$P/1-plan.md")"
         step "2/4 generate"    "$(gen_prompt)"
         step "3/4 EVALUATE"    "$(eval_prompt)"
         step "4/4 revise"      "$(sed 's|REVIEW_FILE|evaluator-rubric.md|' "$P/4-revise.md")" ;;
  *) echo "arm must be A, Aplus, B or C"; exit 1 ;;
esac

date -u '+END %FT%TZ' | tee -a "$RUN/../$ARM.timing.log"
echo "[done] runs/$ARM"

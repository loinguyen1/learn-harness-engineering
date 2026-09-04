A review of the current ConversationHistory implementation is in
/work/REVIEW_FILE. Read it.

Apply every item under "Required revisions". If you believe an item is wrong,
implement it anyway and record your disagreement in your final summary.

Then run all four checks and paste the real output of each:

  npm run check
  bash scripts/check-architecture.sh
  npm run build
  SMOKE=1 npx electron dist/main/main.js

All four must exit 0.

Read /work/AGENTS.md and follow its startup workflow.

Implement the feature described in /work/feature-brief.md.
SPRINT_CONTRACT_LINE

Then run all four checks and paste the real output of each into your final
summary:

  npm run check
  bash scripts/check-architecture.sh
  npm run build
  SMOKE=1 npx electron dist/main/main.js

Do not report done unless all four exited 0. If one fails, fix it and run again.

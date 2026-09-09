# Feature Brief — Multi-turn Conversation History

*Identical for all arms. Do not edit.*

## What to build

Replace the placeholder `src/renderer/components/ConversationHistory.tsx` with a
real multi-turn conversation view.

The Q&A pipeline already works. `window.knowledgeBase.qa.history()` returns
`QAHistory[]`, and each entry carries a `QAResponse` with `answer`, `citations`
and `confidence`. See `src/shared/types.ts`.

## Requirements

1. Show the full exchange — every question and its full answer. Nothing truncated
   with no way to reach the rest.
2. Questions and answers must be visually distinguishable at a glance.
3. Citations attached to an answer must be reachable from the UI.
4. Show when each exchange happened.
5. Handle the empty state, a very long answer, and an answer with no citations.
6. Let the user ask a follow-up from within the history view.
7. Keyboard-reachable and screen-reader-sane.

## Constraints

- Only `src/renderer/` may change, plus `App.tsx` wiring. Do not modify
  services, main, preload or shared types.
- `bash scripts/check-architecture.sh` must pass.
- `npm run check` must exit 0.
- `SMOKE=1 npx electron dist/main/main.js` must still exit 0 after `npm run build`.

## Definition of Done

All four commands above exit 0, **and** the run has produced a filled
`evaluator-rubric.md`. Code written is not done.

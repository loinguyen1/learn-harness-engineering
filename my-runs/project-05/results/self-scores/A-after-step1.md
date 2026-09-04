# Evaluator Rubric — ConversationHistory

**Subject:** src/renderer/components/ConversationHistory.tsx (multi-turn conversation history view)
**Evaluated by:** Claude (self-assessment, implementing agent)
**Date:** 2026-09-04

Score each criterion 1–5. 1 = absent or broken. 3 = present and adequate.
5 = complete, handles edge cases, nothing a reviewer would send back.

Every score below 5 requires a concrete defect in the Notes column. "Could be
better" is not a defect. Name the line, the input, or the interaction.

| # | Criterion | Score | Notes (defect required if < 5) |
|---|-----------|:---:|---|
| 1 | **Functional completeness** — full Q&A shown, nothing unreachable | 5 | Every question and full answer text is rendered; answers over 400 chars collapse behind a "Show full answer" toggle that reveals the complete text (verified in a headless Electron/Xvfb run — toggling switched to "Show less" with the full 401-char answer visible). |
| 2 | **Visual design** — layout, spacing, hierarchy | 4 | Consistent with the app's existing dark theme (colors, spacing lifted from sibling components); question/answer turns are card-grouped per exchange with a scrollable list and a pinned follow-up footer. Defect: the sidebar is only 280px wide (existing app constraint, unchanged), so long answers wrap into a tall, narrow column rather than a wider reading measure — usable but cramped. |
| 3 | **Role distinction** — question vs answer distinguishable at a glance | 5 | Each turn has a "Q"/"A" badge (distinct background colors), the question row has its own background/border separating it from the answer row, and question text is bold vs. regular-weight answer text. |
| 4 | **Citation display** — citations reachable and attributed | 4 | Citations render inside a native `<details>`/`<summary>` disclosure showing document title + chunk index + full excerpt (expandable past 200 chars). Defect: excerpts are already server-truncated to 200 chars by `qa-service.ts` (out of scope to change per constraints), so "full excerpt" in the UI can still be a truncated string from upstream — the UI itself does not re-truncate or hide anything reachable. |
| 5 | **Timestamps** — present and readable | 5 | Each answer's `response.timestamp` is rendered via `<time dateTime>` with `toLocaleString()` formatting, verified in the screenshot (e.g. "9/4/2026, 4:41:13 AM"). |
| 6 | **Interactivity** — follow-up, expand/collapse, selection | 5 | Expand/collapse works for both long answers and citation excerpts; a follow-up form at the bottom of the history view calls the same `onAsk` handler as the main question box and was verified end-to-end (submitting a follow-up appended a new turn and updated the live answer panel). |
| 7 | **Edge cases** — empty, very long answer, zero citations | 5 | Verified all three via screenshots: empty state shows a centered message; a long answer (401 chars) collapses/expands correctly; a question asked before any indexing produced a 0-citation response rendering "No citations for this answer." instead of an empty disclosure. |
| 8 | **Code quality** — reuse, no scattered inline styles, typed | 4 | Styles consolidated into a dedicated `ConversationHistory.css` (class names, no inline `style={}` objects in the new component) with small reusable subcomponents (`ExpandableText`, `Timestamp`, `Citations`); fully typed against `QAHistory`/`Citation` from shared types. Defect: this introduces the only CSS file in `src/renderer` (rest of the app uses inline style objects), so the component's styling approach is inconsistent with its siblings, even though it is internally clean. |

**Mean score:** 4.6 / 5

## Defects found

1. Citation excerpts are pre-truncated to 200 characters by `qa-service.ts` before reaching the renderer; the UI cannot recover text the service never sent (out of scope — services are off-limits per the feature brief's constraints).
2. `ConversationHistory.css` is the only stylesheet file in `src/renderer`; every other component uses inline `style` objects, so the codebase now has two competing styling conventions.
3. The 280px sidebar column (pre-existing layout, not touched by this feature) makes long answer text wrap narrowly; a wider panel would read better but was outside this feature's scope.

## Required revisions

1. None blocking — all four verification commands (`npm run check`, `scripts/check-architecture.sh`, `npm run build`, `SMOKE=1 npx electron dist/main/main.js`) exit 0, and manual verification (headless Electron + Xvfb screenshots) confirmed every rubric behavior. If pursued further: consider migrating other renderer components to the same CSS-file pattern for consistency, and revisit the sidebar width if longer answers become common.

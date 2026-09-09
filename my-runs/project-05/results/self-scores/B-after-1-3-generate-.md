# Evaluator Rubric — ConversationHistory

**Subject:** ConversationHistory.tsx (multi-turn conversation history feature)
**Evaluated by:** Claude (self-review)
**Date:** 2026-09-04

Score each criterion 1–5. 1 = absent or broken. 3 = present and adequate.
5 = complete, handles edge cases, nothing a reviewer would send back.

Every score below 5 requires a concrete defect in the Notes column. "Could be
better" is not a defect. Name the line, the input, or the interaction.

| # | Criterion | Score | Notes (defect required if < 5) |
|---|-----------|:---:|---|
| 1 | **Functional completeness** — full Q&A shown, nothing unreachable | 5 | Every question and full answer text is rendered; long answers collapse but remain reachable via "Show full answer" toggle (`ConversationHistory.tsx`, `Exchange`). |
| 2 | **Visual design** — layout, spacing, hierarchy | 4 | Styles centralized in `ConversationHistory.styles.ts` but still hand-tuned inline color values duplicated from other components (e.g. `#533483`, `#0f3460`) rather than a shared theme/tokens file — acceptable given the app has no existing design-token system to plug into. |
| 3 | **Role distinction** — question vs answer distinguishable at a glance | 5 | Question and answer render as separate bubbles with distinct background/border colors and an explicit uppercase "You asked" / "Assistant" role label above each. |
| 4 | **Citation display** — citations reachable and attributed | 5 | Citations render in a native `<details>/<summary>` (keyboard + screen-reader accessible by default), each attributed with document title, chunk index, and full excerpt text (no truncation). |
| 5 | **Timestamps** — present and readable | 5 | Each answer shows a relative time (`Xm/h/d ago`) via `<time dateTime>`, with the absolute locale timestamp available in the `title` attribute on hover/focus. |
| 6 | **Interactivity** — follow-up, expand/collapse, selection | 5 | A follow-up form is wired at the bottom of the history view (`onAsk` prop from `App.tsx`'s `handleAskQuestion`), submits on Enter, disables while in flight, and clears on success. Long answers expand/collapse via a labeled toggle button with `aria-expanded`/`aria-controls`. |
| 7 | **Edge cases** — empty, very long answer, zero citations | 5 | Empty history shows a dedicated message; answers over 400 chars collapse by default with a toggle; zero-citation answers show an explicit "No citations for this answer." note instead of an empty section. |
| 8 | **Code quality** — reuse, no scattered inline styles, typed | 4 | Styles are extracted into one `styles` object (`ConversationHistory.styles.ts`) reused across the component instead of ad hoc per-element inline styles; fully typed against `QAHistory`/`Citation` from `shared/types.ts`. Not a 5: the rest of the app (`App.tsx`, `DocumentDetail.tsx`, etc.) still uses scattered inline styles, so the codebase as a whole is inconsistent even though this feature's file is not. |

**Mean score:** 4.75 / 5

## Defects found

1. Color values (`#533483`, `#0f3460`, `#8888bb`, etc.) are repeated literals shared with other renderer components instead of coming from a single theme/tokens module — no such module exists yet in this codebase, so this was not introduced by this feature but not fixed by it either.

## Required revisions

1. None blocking. Optional follow-up: introduce a shared color-tokens module under `src/renderer/` and migrate all components (not just `ConversationHistory`) to it, as a separate scoped change.

# Evaluator Rubric — ConversationHistory

**Subject:** /work/subject/ConversationHistory.tsx (+ helper components DocumentDetail.tsx, DocumentList.tsx, ImportPanel.tsx, QuestionPanel.tsx, StatusBar.tsx; App.diff; types.ts)
**Evaluated by:** Independent code review (Claude, Sonnet 5)
**Date:** 2026-09-04

Score each criterion 1–5. 1 = absent or broken. 3 = present and adequate.
5 = complete, handles edge cases, nothing a reviewer would send back.

Every score below 5 requires a concrete defect in the Notes column. "Could be
better" is not a defect. Name the line, the input, or the interaction.

| # | Criterion | Score | Notes (defect required if < 5) |
|---|-----------|:---:|---|
| 1 | **Functional completeness** — full Q&A shown, nothing unreachable | 1 | `ConversationHistory.tsx` line 30: `item.response.answer.substring(0, 80)}...` — every answer is hard-truncated to 80 characters with a literal ellipsis and no expand/detail affordance. This is the exact behavior the feature brief's own placeholder description warns against and requirement 1 explicitly forbids ("Nothing truncated with no way to reach the rest"). Citations (`item.response.citations`) are never read anywhere in the file, so they are permanently unreachable, not just truncated. |
| 2 | **Visual design** — layout, spacing, hierarchy | 1 | The whole view is three flat `div`s (lines 22-33) with no card/boundary grouping a question with its answer, no header/body separation beyond an 8px `marginBottom`, and near-identical 12-13px font sizes for the list header, questions, and answers — there is no visual hierarchy at all. |
| 3 | **Role distinction** — question vs answer distinguishable at a glance | 2 | Lines 29-30: the only differentiator between a question and an answer is text color, `#a0a0c0` vs `#888`, a small lightness delta on the same dark background, plus a literal "Q:"/"A:" prefix. No layout asymmetry, icon, bubble, or background distinguishes the two roles — they read as nearly the same line at a glance. |
| 4 | **Citation display** — citations reachable and attributed | 1 | `item.response.citations` (type `Citation[]`, carrying `documentTitle`, `excerpt`, `chunkIndex` per types.ts) is never referenced in `ConversationHistory.tsx`. No citation is rendered, linked, or attributed anywhere. Requirement 3 of the brief is entirely unmet. |
| 5 | **Timestamps** — present and readable | 1 | `item.response.timestamp` exists on `QAResponse` but is never read or rendered in the component. There is no indication anywhere in the view of when an exchange happened, contradicting requirement 4. |
| 6 | **Interactivity** — follow-up, expand/collapse, selection | 1 | There is no `<input>`, `<button>`, or event handler anywhere in the file. No way to ask a follow-up question from the history view (requirement 6), no way to expand a truncated answer, no selection/focus state of any kind. |
| 7 | **Edge cases** — empty, very long answer, zero citations | 1 | Empty state (lines 14-19) is handled. A very long answer is not handled, it is silently and irreversibly clipped at 80 characters (line 30), which is a regression relative to "handle" — the content is destroyed, not managed. Zero-citations vs has-citations is indistinguishable from the UI because citations are never rendered in either case, so this edge case cannot even be exercised. |
| 8 | **Code quality** — reuse, no scattered inline styles, typed | 2 | Every style is a one-off inline object literal (lines 16, 23-31) duplicating magic hex colors (`#888`, `#a0a0c0`) that also appear ad hoc across the sibling components, instead of a shared style/theme module. Line 27 uses the array index `i` as the React `key`, which breaks identity if history is ever reordered, filtered, or prepended. No ARIA roles, `aria-live`, or keyboard focus targets exist anywhere, despite requirement 7 ("keyboard-reachable and screen-reader-sane"); everything is a plain non-interactive `div`. |

**Mean score:** 1.3 / 5

## Defects found

1. `ConversationHistory.tsx` is the unmodified placeholder shipped with the brief — same TODO comment (lines 7-11), same `.substring(0, 80)` truncation, same "basic list" structure described as the thing to be replaced. No implementation work occurred.
2. `App.diff` is a 0-byte file. The component was never wired into `App.tsx`, so even the placeholder behavior is not confirmed to be reachable from the running app — the "Constraints" wiring step in the brief was skipped entirely.
3. Citations (`Citation[]` on `QAResponse`) are dropped completely — no citation UI exists in the component at all (requirement 3 unmet).
4. Timestamps (`QAResponse.timestamp`) are dropped completely — no exchange shows when it happened (requirement 4 unmet).
5. Long answers are destructively truncated to 80 characters with no way to recover the rest of the text (requirement 1 and requirement 5's "very long answer" case both unmet).
6. No follow-up question affordance exists inside the history view (requirement 6 unmet); `QuestionPanel.tsx` exists but is a separate, unrelated component not reused or referenced by `ConversationHistory.tsx`.
7. No keyboard or screen-reader support: no focusable interactive elements, no ARIA roles/labels, no `aria-live` region for new exchanges (requirement 7 unmet).

## Required revisions

1. Wire `ConversationHistory` into `App.tsx` (currently un-wired — `App.diff` is empty) and confirm it renders from `window.knowledgeBase.qa.history()`.
2. Render the full `answer` text with an explicit, user-controlled expand/collapse (or scroll) mechanism instead of a hard 80-character substring truncation.
3. Render `citations` per exchange, attributed to `documentTitle`/`chunkIndex`/`excerpt`, and make them reachable (e.g., expandable list or link into the document view).
4. Render `response.timestamp` per exchange in a human-readable format.
5. Add a way to ask a follow-up question from within the history view (e.g., reuse `QuestionPanel`'s submit pattern).
6. Give question and answer roles distinct, non-color-only visual treatment (alignment, background, or iconography) sufficient to be distinguishable at a glance and non-reliant on subtle color contrast alone.
7. Replace `key={i}` with a stable identifier (e.g., a composite of question + timestamp, or an added `id`), and add ARIA roles/labels and keyboard focus handling to interactive elements to satisfy requirement 7.
8. Handle the zero-citations case explicitly once citations are rendered (e.g., "No sources cited" state) so it's distinguishable from the has-citations case.

# Evaluator Rubric — ConversationHistory

**Subject:** /work/subject/ConversationHistory.tsx (+ ExpandableText, Timestamp, Citations helpers defined in the same file; wired via App.diff)
**Evaluated by:** Claude (automated code review)
**Date:** 2026-09-04

Score each criterion 1–5. 1 = absent or broken. 3 = present and adequate.
5 = complete, handles edge cases, nothing a reviewer would send back.

Every score below 5 requires a concrete defect in the Notes column. "Could be
better" is not a defect. Name the line, the input, or the interaction.

| # | Criterion | Score | Notes (defect required if < 5) |
|---|-----------|:---:|---|
| 1 | **Functional completeness** — full Q&A shown, nothing unreachable | 4 | The empty-state branch (lines 91–99) returns *only* the placeholder message and never renders the follow-up `<form>`. `types.ts:73` shows `IPC_CHANNELS.CLEAR_HISTORY` exists, so `history` can legitimately become `[]` while this view stays mounted (e.g. after a "clear history" action). At that point the component holds `onAsk` but gives the user zero way to invoke it — no path back to asking a question from this view. |
| 2 | **Visual design** — layout, spacing, hierarchy | 3 | Line 3 imports `./ConversationHistory.css`, which is not part of the reviewed change (only `*.tsx` files and `types.ts` were provided). Every sibling component (DocumentDetail, DocumentList, ImportPanel, QuestionPanel, StatusBar) is styled with inline `style={{}}` objects instead, so this is the only file whose actual visual output (spacing, contrast, whether `.ch-list-wrap` even scrolls independently of the fixed follow-up form) cannot be inspected at all. A reviewer cannot sign off on "layout, spacing, hierarchy" for a stylesheet that isn't in the diff. |
| 3 | **Role distinction** — question vs answer distinguishable at a glance | 3 | Distinction depends entirely on the unverifiable CSS classes `ch-turn-question`/`ch-turn-answer` and `ch-role-badge`/`ch-role-badge-answer` (lines 112, 121). Worse, the "Q"/"A" badge glyphs themselves are `aria-hidden="true"` (lines 113, 122) with no visually-hidden text equivalent, so even if the visual distinction works, screen-reader users get no explicit "Question"/"Answer" label — they must infer the turn type from the presence of "Confidence: …%" text, which is indirect. |
| 4 | **Citation display** — citations reachable and attributed | 5 |  |
| 5 | **Timestamps** — present and readable | 5 |  |
| 6 | **Interactivity** — follow-up, expand/collapse, selection | 4 | The only live-region feedback during a follow-up is the `role="status"` div at lines 155–159 ("Asking follow-up question…"), which is removed the instant `isSubmitting` flips back to `false`. There is no `aria-live` region around the newly appended `<li>` (line 110) or the new answer text, so a screen-reader user is told a question is in flight but is never told the answer has arrived — they'd have to manually re-navigate the list to discover it. |
| 7 | **Edge cases** — empty, very long answer, zero citations | 4 | Empty state, zero-citation state, and long-answer collapse are all explicitly implemented and correct in the common case. But the truncation at line 16 (`text.slice(0, threshold).trimEnd()`) and at the citation excerpt (line 61, threshold 150) operates on raw UTF-16 code units at a fixed offset — for a very long answer containing an emoji or other non-BMP character that straddles the cut point, this bisects a surrogate pair and renders a broken/replacement glyph right at the truncation boundary. |
| 8 | **Code quality** — reuse, no scattered inline styles, typed | 4 | Internally the file is well organized (props fully typed, no `any`, `ExpandableText` correctly reused for both the answer and each citation excerpt instead of duplicated). However it silently introduces a second, inconsistent styling convention: every other component in `subject/` (DocumentDetail.tsx, DocumentList.tsx, ImportPanel.tsx, QuestionPanel.tsx, StatusBar.tsx) uses inline `style={{}}` objects, while this component alone switches to an external stylesheet and BEM-style class names with no accompanying CSS file included in the change. A reviewer would flag the inconsistency and ask where the CSS lives. |

**Mean score:** 4.0 / 5

## Defects found

1. Empty-history state (lines 91–99) omits the follow-up form entirely, so once `history` is `[]` (a reachable state — see `qa:clear-history` in `types.ts:73`) there is no way to ask a question from within `ConversationHistory` despite it owning `onAsk`.
2. `ConversationHistory.css` (imported line 3) is absent from the reviewed change, and is the sole file responsible for the "visually distinguishable at a glance" requirement (#2/#3) and general layout — none of it is verifiable, and it breaks from every sibling component's inline-style convention.
3. Role badges "Q"/"A" (lines 113, 122) are `aria-hidden`, leaving no explicit text alternative that identifies a turn as a question or an answer for assistive tech.
4. No `aria-live` region wraps a newly appended exchange (line 110); the only status update (lines 155–159) disappears the moment the request resolves, so screen-reader users aren't notified an answer arrived.
5. Fixed-offset `text.slice(0, threshold)` truncation (line 16; also line 61 for citation excerpts) can split a UTF-16 surrogate pair, corrupting the last character shown for a long answer/excerpt containing emoji or other non-BMP characters.

## Required revisions

1. Render the follow-up form (or an equivalent "ask a question" affordance) in the empty-history branch, not just once history is non-empty.
2. Include/commit `ConversationHistory.css` (or migrate to the same inline-style convention as the rest of `subject/`) so visual/role distinction can actually be reviewed.
3. Give each role badge (or its container) an accessible text equivalent ("Question"/"Answer") instead of hiding it entirely from assistive tech.
4. Wrap newly appended exchanges in an `aria-live="polite"` region so the arrival of a follow-up answer is announced.
5. Truncate on a grapheme/code-point boundary (e.g. via `Intl.Segmenter` or a surrogate-pair-safe slice) instead of a raw UTF-16 character offset.

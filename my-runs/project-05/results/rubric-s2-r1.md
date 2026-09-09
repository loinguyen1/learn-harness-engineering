# Evaluator Rubric — ConversationHistory

**Subject:** /work/subject/ConversationHistory.tsx (+ AskForm.tsx, App.diff wiring)
**Evaluated by:** Automated code review (Claude)
**Date:** 2026-09-04

Score each criterion 1–5. 1 = absent or broken. 3 = present and adequate.
5 = complete, handles edge cases, nothing a reviewer would send back.

Every score below 5 requires a concrete defect in the Notes column. "Could be
better" is not a defect. Name the line, the input, or the interaction.

| # | Criterion | Score | Notes (defect required if < 5) |
|---|-----------|:---:|---|
| 1 | **Functional completeness** — full Q&A shown, nothing unreachable | 5 | Full question and answer always rendered; long answers (`LONG_ANSWER_THRESHOLD = 400`, line 10) collapse but stay reachable via "Show full answer" (line 46); citations reachable via toggle (line 72); follow-up wired through `onAsk`. Nothing is truncated with no way out. |
| 2 | **Visual design** — layout, spacing, hierarchy | 4 | Bubbles cap width only as a percentage — `maxWidth: '85%'` for the question (line 109) and `'90%'` for the answer (line 129) — with no pixel ceiling. The history panel is the full window minus the 280px left column, so on a maximized/wide window a single line of answer text can stretch past 1400px, well beyond a readable line length, with nothing capping it. |
| 3 | **Role distinction** — question vs answer distinguishable at a glance | 5 | Question is right-aligned, indigo/purple (`#2a1f4d`/`#8a6fd1`, lines 110-111) and labeled "You" (line 116-118); answer is left-aligned, teal/green (`#132a3d`/`#2f7a4f`, lines 130-131) and labeled "Knowledge Base" (line 146). Distinction survives on position + label alone, not just color. |
| 4 | **Citation display** — citations reachable and attributed | 5 | Each citation shows document title, chunk index, and excerpt (lines 86-89), behind a labeled, keyboard-operable toggle with `aria-expanded` (lines 66-73). Zero-citation case explicitly handled (lines 56-62). |
| 5 | **Timestamps** — present and readable | 5 | `formatTimestamp` (lines 12-16) renders a locale medium date + short time, degrades to raw ISO string on an invalid date, and is marked up with a semantic `<time dateTime=...>` (lines 148-153). |
| 6 | **Interactivity** — follow-up, expand/collapse, selection | 4 | The embedded `AskForm` (lines 201-206) gives no pending/loading feedback on submit. A new exchange only appears once `history` grows after the full round trip completes (the effect at lines 165-168 fires on `history.length`, not on submission), so a slow or failed `onAsk` call is indistinguishable from a click that did nothing. |
| 7 | **Edge cases** — empty, very long answer, zero citations | 4 | Empty state is handled with an announced `role="status"` message (lines 176-179) and very-long-answer/zero-citation cases are both handled correctly. But the follow-up form's placeholder is hardcoded to `"Ask a follow-up question..."` (line 203) even when `history.length === 0` (line 176), mislabeling the very first question a user asks in this view as a "follow-up." |
| 8 | **Code quality** — reuse, no scattered inline styles, typed | 3 | `AskForm` is correctly extracted and reused for both the top-level question panel and this follow-up form — good reuse. But nearly every element gets a fresh inline `style={{...}}` object literal rebuilt on every render (e.g. lines 79-90, 104-134, 175-197), with hex color literals (`#2f7a4f`, `#132a3d`, `#8a6fd1`, etc.) duplicated rather than centralized; only `linkButtonStyle` (line 18) is hoisted to a shared constant. This is the exact "scattered inline styles" pattern the criterion calls out, and it also means new style objects are allocated per render with no memoization. Typing itself is solid (`Props`, `Citation`, `QAHistory` all properly typed). |

**Mean score:** 4.4 / 5

## Defects found

1. **Unbounded bubble width** (ConversationHistory.tsx:109,129) — question/answer bubbles cap width by percentage only (85%/90%), no pixel max-width, so line length becomes unreadably long on a wide/maximized window.
2. **No pending state for follow-ups** (ConversationHistory.tsx:165-168, 201-206) — submitting a question via the in-history `AskForm` gives zero feedback until `history` grows after a full round trip; a slow or failed request looks identical to a no-op click.
3. **Misleading placeholder in empty state** (ConversationHistory.tsx:176, 203) — the follow-up input says "Ask a follow-up question..." even when there is no prior exchange (`history.length === 0`), i.e. for the very first question asked from this view.
4. **Inline style objects rebuilt every render, colors not centralized** (ConversationHistory.tsx:79-90, 104-134, 175-197) — only one style object (`linkButtonStyle`, line 18) is hoisted; the rest are literal object expressions recreated per render with duplicated hard-coded hex values, directly matching the "scattered inline styles" anti-pattern this criterion is meant to catch.

## Required revisions

1. Add a pixel-based `max-width` (e.g. `min(90%, 720px)`) to the question and answer bubbles so line length stays readable regardless of window width.
2. Surface a pending/sending indicator (e.g. a `pending` prop or optimistic entry) while a follow-up question is in flight, so submission is never silently unacknowledged.
3. Make the follow-up form's placeholder conditional on `history.length` (e.g. "Ask a question..." when empty, "Ask a follow-up question..." once history exists).
4. Hoist the repeated bubble/list/container style objects into named constants (or a shared style module) alongside `linkButtonStyle`, and de-duplicate the hard-coded color values.

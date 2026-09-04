# Evaluator Rubric — ConversationHistory

**Subject:** ConversationHistory.tsx multi-turn conversation view (+ App.tsx wiring)
**Evaluated by:** loi.nguyen@vireohealth.com (self-review of implementing agent's own change)
**Date:** 2026-09-04

Score each criterion 1–5. 1 = absent or broken. 3 = present and adequate.
5 = complete, handles edge cases, nothing a reviewer would send back.

Every score below 5 requires a concrete defect in the Notes column. "Could be
better" is not a defect. Name the line, the input, or the interaction.

| # | Criterion | Score | Notes (defect required if < 5) |
|---|-----------|:---:|---|
| 1 | **Functional completeness** — full Q&A shown, nothing unreachable | 5 | Question text is never truncated; answers over 400 chars (`LONG_ANSWER_THRESHOLD`, line 9) collapse but expose the full text via the "Show full answer" toggle (lines 38-47). No content is permanently hidden. |
| 2 | **Visual design** — layout, spacing, hierarchy | 4 | The "History" tab button lives in the left 280px sidebar (App.tsx lines 120-135), but its content now renders entirely in the separate right-hand panel (App.tsx lines 174-211), while the "Documents" tab still renders its content directly beneath itself in the same column (lines 137-164). Clicking "History" therefore changes content in a region visually disconnected from the control the user clicked, breaking the tab-adjacency pattern the UI otherwise uses. |
| 3 | **Role distinction** — question vs answer distinguishable at a glance | 5 | Question bubble: right-aligned, purple accent (`#8a6fd1`/`#2a1f4d`), labeled "You" (lines 103-121). Answer bubble: left-aligned, green accent (`#2f7a4f`/`#132a3d`), labeled "Knowledge Base" (lines 123-156). Alignment, color, and label all differ. |
| 4 | **Citation display** — citations reachable and attributed | 5 | Citations are behind a `Show citations (n)` toggle (`aria-expanded`, lines 65-72) and each entry shows document title, chunk index, and full excerpt (lines 85-88). No truncation of the excerpt itself. |
| 5 | **Timestamps** — present and readable | 5 | `<time dateTime={item.response.timestamp}>` rendered via `toLocaleString` with `dateStyle: 'medium', timeStyle: 'short'` (lines 11-15, 147-152). |
| 6 | **Interactivity** — follow-up, expand/collapse, selection | 4 | Two concrete gaps: (a) the component imports no `useRef`/scroll handling, so submitting the follow-up form (lines 164-173) appends the new exchange at the end of the scrollable `<ol>` (lines 186-201) without scrolling it into view — a user who has scrolled up, or whose history exceeds the viewport, will not see the new answer appear. (b) the rubric's own "selection" sub-criterion is unmet: `Exchange` (lines 97-159) has no click/selection affordance (no way to select or copy a specific exchange). |
| 7 | **Edge cases** — empty, very long answer, zero citations | 4 | Empty state (lines 181-184) and zero-citations state (`CitationList`, lines 55-61) are both handled correctly. But the answer `<p>` (lines 35-37), citation excerpt `<div>` (line 88), and question `<p>` (line 118) set `whiteSpace: 'pre-wrap'` without `overflowWrap`/`wordBreak`. An answer or citation excerpt containing one long unbroken token (e.g., a URL or hash with no spaces) will not wrap inside the 85-90%-width bubble and can overflow the panel horizontally — a real, reproducible edge case the "very long answer" requirement doesn't fully cover. |
| 8 | **Code quality** — reuse, no scattered inline styles, typed | 3 | The follow-up form (lines 205-252) duplicates `QuestionPanel.tsx`'s form markup and inline style objects (input/button padding, colors, border-radius) almost verbatim instead of extracting a shared component — a direct reuse miss given `QuestionPanel` already exists in the same directory. Beyond `linkButtonStyle` (lines 17-26), none of the ~10 other inline style objects (question/answer bubble containers, citation `<li>`, form controls) are factored into named constants, so the "no scattered inline styles" sub-criterion is not met even though the file is fully typed against `QAHistory`/`Citation` with no `any`. |

**Mean score:** 4.375 / 5

## Defects found

1. `App.tsx` lines 120-135 vs 174-211 — the "History" tab control and its rendered content live in visually disconnected panels, unlike the "Documents" tab which keeps control and content adjacent.
2. `ConversationHistory.tsx` lines 164-201 — no scroll-into-view after a follow-up is submitted from within the history view; new exchanges can render off-screen with no indicator.
3. `ConversationHistory.tsx` lines 97-159 — no selection/copy affordance on an individual exchange.
4. `ConversationHistory.tsx` lines 35-37, 88, 118 — missing `overflowWrap`/`wordBreak` lets a single long unbroken token overflow the message bubble and panel.
5. `ConversationHistory.tsx` lines 205-252 vs `QuestionPanel.tsx` lines 17-61 — the follow-up form duplicates `QuestionPanel`'s markup/styles instead of reusing or extracting a shared component.

## Required revisions

1. Add a ref to the scroll container and call `scrollIntoView` (or scroll-to-bottom) when `history.length` increases, so a submitted follow-up is guaranteed visible.
2. Extract the ask-a-question form (input + button + styles) into one shared component used by both `QuestionPanel` and `ConversationHistory`.
3. Add `overflowWrap: 'break-word'` (or `wordBreak: 'break-word'`) to the answer, question, and citation-excerpt text elements.
4. Either move the "History" tab's content into the same column as its trigger, or restructure the tab control itself to live where the content renders, so the two stay adjacent.

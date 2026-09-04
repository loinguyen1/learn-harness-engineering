# Evaluator Rubric — ConversationHistory

**Subject:** /work/subject/ConversationHistory.tsx (+ App.diff wiring)
**Evaluated by:** Claude (code review)
**Date:** 2026-09-04

Score each criterion 1–5. 1 = absent or broken. 3 = present and adequate.
5 = complete, handles edge cases, nothing a reviewer would send back.

Every score below 5 requires a concrete defect in the Notes column. "Could be
better" is not a defect. Name the line, the input, or the interaction.

| # | Criterion | Score | Notes (defect required if < 5) |
|---|-----------|:---:|---|
| 1 | **Functional completeness** — full Q&A shown, nothing unreachable | 4 | `QAResponse.confidence` — a field the brief explicitly calls out alongside `answer` and `citations` — is never read or rendered anywhere in `ConversationHistory.tsx` (confirmed: no occurrence of "confidence" in the file). The score is computed and delivered by the pipeline but has no path to the UI at all, not even on hover. |
| 2 | **Visual design** — layout, spacing, hierarchy | 4 | The follow-up `<form>` (lines 276–295) lives inside the same scrollable `styles.container` div (line 270) as the exchange `<ul>` (lines 271–275), instead of being pinned outside/below the scroll region. In a long conversation the compose box scrolls away with the history, so asking a follow-up requires first scrolling all the way to the bottom to find the input. |
| 3 | **Role distinction** — question vs answer distinguishable at a glance | 4 | The "A" badge (`answerLabel`, lines 66–78) uses `color: '#8888bb'` text on `background: '#0f3460'`, ≈3.7:1 contrast — below WCAG AA's 4.5:1 minimum for 11px bold text — making the answer marker noticeably harder to read than the "Q" badge (white-on-#533483, which passes comfortably), so the two markers are not equally legible at a glance for low-vision users. |
| 4 | **Citation display** — citations reachable and attributed | 5 | — |
| 5 | **Timestamps** — present and readable | 4 | `styles.timestamp` (lines 90–93) sets `color: '#666'` on the `styles.exchange` background `#16213e` (line 31): measured contrast ≈2.8:1, well under WCAG AA's 4.5:1 requirement for 11px text. The timestamp is present and semantically marked up (`<time dateTime>`), but is hard to read for low-vision users. |
| 6 | **Interactivity** — follow-up, expand/collapse, selection | 4 | Submitting the follow-up form (`handleSubmit`, lines 248–257) calls `onAskFollowUp` and clears the input, but nothing scrolls the newly-appended exchange into view — the file imports only `useCallback, useState, FormEvent` (no `useRef`/`useEffect`, confirmed by grep), so there is no scroll-into-view logic anywhere. In a conversation long enough that the list is scrolled, asking a follow-up produces an answer the user cannot see without manually scrolling down. |
| 7 | **Edge cases** — empty, very long answer, zero citations | 4 | Empty state, zero-citation state, and long answers are all handled well (empty: `role="status"` message; zero citations: explicit "No citations for this answer." branch in `CitationsDisclosure`; long answers: `whiteSpace: 'pre-wrap'` + `wordBreak: 'break-word'` on `answerText`, line 85). But `citationExcerpt` (lines 123–126) omits the same `wordBreak`/`overflowWrap` protection given to `questionText` (line 56) and `answerText` (line 85), so a citation excerpt containing one long unbroken token (e.g. a URL) can overflow its container while question/answer text cannot — the long-content handling is inconsistently applied. |
| 8 | **Code quality** — reuse, no scattered inline styles, typed | 4 | `history.map((item, i) => <ExchangeItem key={i} ... />)` (line 273) keys on array index rather than a stable identity. `QAHistory` has no `id` field, but `item.response.timestamp` is available and would be far more stable — with an index key, a `qa:clear-history` cycle followed by new entries at the same index can leak an unrelated `CitationsDisclosure`'s local `expanded` state onto a fresh, different exchange. Aside from this, styles are cleanly hoisted to a module-level object (unlike sibling components, which redefine style literals per render), and sub-components are properly typed and decomposed. |

**Mean score:** 4.1 / 5

## Defects found

1. `ConversationHistory.tsx` never reads or displays `response.confidence`, a field the brief names explicitly alongside `answer`/`citations`.
2. The follow-up form is inside the same scrollable region as the history list (lines 270–296), so it scrolls out of reach in long conversations.
3. `answerLabel` text/background combo (`#8888bb` on `#0f3460`, lines 71–72) fails WCAG AA contrast (~3.7:1) for its 11px bold text.
4. `timestamp` text/background combo (`#666` on `#16213e`, lines 90–93 / 31) fails WCAG AA contrast (~2.8:1) for its 11px text.
5. No scroll-into-view after submitting a follow-up (no `useRef`/`useEffect` in the file) — new answers can land off-screen.
6. `citationExcerpt` (lines 123–126) lacks the `wordBreak`/`overflowWrap` protection applied to `questionText`/`answerText`, so long unbroken citation excerpts can overflow.
7. `key={i}` on `ExchangeItem` (line 273) risks leaking per-item local UI state (citation-expanded flag) across unrelated entries after a history clear, since no stable id is used despite `response.timestamp` being available.

## Required revisions

1. Surface `response.confidence` in the UI (even a small inline indicator satisfies this).
2. Move the follow-up form outside the scrollable list region so it stays reachable regardless of history length.
3. Fix the `answerLabel` and `timestamp` color pairs to meet WCAG AA contrast (4.5:1) for their font sizes.
4. Scroll the newly-added exchange into view after a follow-up is submitted.
5. Add `wordBreak`/`overflowWrap` to `citationExcerpt` for parity with question/answer text.
6. Key `ExchangeItem` on `item.response.timestamp` (or another stable value) instead of array index.

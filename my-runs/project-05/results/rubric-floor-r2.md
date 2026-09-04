# Evaluator Rubric — ConversationHistory

**Subject:** /work/subject/ConversationHistory.tsx (plus helper components DocumentDetail.tsx, DocumentList.tsx, ImportPanel.tsx, QuestionPanel.tsx, StatusBar.tsx, and App.diff)
**Evaluated by:** Claude (code review)
**Date:** 2026-09-04

Score each criterion 1–5. 1 = absent or broken. 3 = present and adequate.
5 = complete, handles edge cases, nothing a reviewer would send back.

Every score below 5 requires a concrete defect in the Notes column. "Could be
better" is not a defect. Name the line, the input, or the interaction.

| # | Criterion | Score | Notes (defect required if < 5) |
|---|-----------|:---:|---|
| 1 | **Functional completeness** — full Q&A shown, nothing unreachable | 1 | `ConversationHistory.tsx:30` renders `item.response.answer.substring(0, 80)}...` with no expand/read-more control and no full-text alternative (title attribute, modal, scroll). Any answer over 80 chars is permanently unreachable in the UI, directly violating brief requirement 1. |
| 2 | **Visual design** — layout, spacing, hierarchy | 2 | The whole view is a flat, undifferentiated list: a single 12px-font `<div>` per turn with an 8px bottom margin (`ConversationHistory.tsx:28`). No card/bubble separation between exchanges, no grouping of a question with its answer beyond adjacency, no visual hierarchy (all text is 12–13px, two shades of gray). Compare to sibling components like `DocumentList.tsx` which at least use borders, background highlighting and font-weight to establish hierarchy — this component has none of that. |
| 3 | **Role distinction** — question vs answer distinguishable at a glance | 2 | Question and answer differ only by a literal `"Q: "`/`"A: "` text prefix and a near-identical gray (`#a0a0c0` vs `#888`, `ConversationHistory.tsx:29-30`). There is no color contrast, background, alignment, avatar, or weight difference; at a glance (i.e. without reading the prefix letter) the two roles are not distinguishable, failing brief requirement 2. |
| 4 | **Citation display** — citations reachable and attributed | 1 | `item.response.citations` is never read anywhere in `ConversationHistory.tsx`. Citations are not rendered, not counted, and not reachable from the UI at all, directly violating brief requirement 3. |
| 5 | **Timestamps** — present and readable | 1 | `QAResponse.timestamp` (`types.ts:32`) is never accessed in `ConversationHistory.tsx`. No exchange shows when it happened, violating brief requirement 4. |
| 6 | **Interactivity** — follow-up, expand/collapse, selection | 1 | There is no input, button, or handler in the component — it takes only a `history: QAHistory[]` prop (`ConversationHistory.tsx:3-5`) and renders static text. No way to ask a follow-up from within the view (brief requirement 6), no expand/collapse for the truncated answer, no selection state. |
| 7 | **Edge cases** — empty, very long answer, zero citations | 1 | Empty state is handled (`ConversationHistory.tsx:14-19`). A very long answer is mishandled: it is silently cut at 80 characters with an ellipsis and no recovery path (`ConversationHistory.tsx:30`), which is worse than doing nothing since the user cannot tell truncation occurred versus the answer simply being short. Zero-citations is not "handled" so much as moot, since citations are never rendered for *any* answer — there is no differentiated treatment for the zero-citation case. |
| 8 | **Code quality** — reuse, no scattered inline styles, typed | 2 | Props are typed (`QAHistory[]` from shared types), which is the one solid point. Everything else is ad hoc: every element carries a one-off inline `style={{...}}` object (`ConversationHistory.tsx:16, 23-24, 28-30`), there is no shared row/bubble sub-component despite this being a list of a repeated structure, `key={i}` uses array index instead of a stable id even though `QAHistory`/`ConversationMessage` support one, and the truncation logic (`substring(0,80)`) is a magic number with no named constant or helper. |

**Mean score:** 1.4 / 5

## Defects found

1. `ConversationHistory.tsx:30` — answers longer than 80 characters are truncated with `.substring(0, 80)` and no way to view the rest; violates brief requirement 1 ("Nothing truncated with no way to reach the rest").
2. `ConversationHistory.tsx` (entire file) — `item.response.citations` is never read; citations are completely absent from the rendered output, violating brief requirement 3.
3. `ConversationHistory.tsx` (entire file) — `item.response.timestamp` is never read; no exchange shows when it happened, violating brief requirement 4.
4. `ConversationHistory.tsx` (entire file) — no input or control exists to ask a follow-up question from within the history view, violating brief requirement 6.
5. `ConversationHistory.tsx:27-32` — list items are plain non-interactive, non-focusable `<div>`s with no `role`, no `tabIndex`, and no keyboard handlers; there is nothing for a screen reader or keyboard user to reach beyond the raw text nodes, violating brief requirement 7.
6. `ConversationHistory.tsx:29-30` — question and answer rows use near-identical gray tones (`#a0a0c0` and `#888`) distinguished only by a text-literal prefix, failing brief requirement 2 ("visually distinguishable at a glance").
7. The component's own header comment (`ConversationHistory.tsx:7-12`) still identifies it as a "Placeholder component" with a `TODO: Implement a full multi-turn conversation history view.` — this is materially the unmodified placeholder the brief asked to replace, not a new implementation. `App.diff` is empty, confirming no wiring work accompanied it either.

## Required revisions

1. Render full answer text (or an explicit, reversible expand/collapse control) instead of a hard 80-character substring cut.
2. Render each citation (document title, excerpt, and a way to jump to the source) attached to its answer.
3. Render a human-readable timestamp per exchange using `response.timestamp`.
4. Add a follow-up question input/control inside the history view, wired to the existing ask flow.
5. Give question/answer rows distinct visual treatment (e.g. alignment, background, icon, or color contrast) beyond a text prefix, and make each exchange keyboard-focusable with appropriate ARIA roles for screen readers.
6. Replace the inline `style={{...}}` scattered across the file with a shared, reusable row/message component and stable `key`s (e.g. a message id) instead of array index.

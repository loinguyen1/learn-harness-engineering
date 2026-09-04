# Evaluator Rubric — ConversationHistory

**Subject:** /work/subject/ConversationHistory.tsx (+ App.diff, types.ts, sibling components)
**Evaluated by:** Claude (code review)
**Date:** 2026-09-04

Score each criterion 1–5. 1 = absent or broken. 3 = present and adequate.
5 = complete, handles edge cases, nothing a reviewer would send back.

Every score below 5 requires a concrete defect in the Notes column. "Could be
better" is not a defect. Name the line, the input, or the interaction.

| # | Criterion | Score | Notes (defect required if < 5) |
|---|-----------|:---:|---|
| 1 | **Functional completeness** — full Q&A shown, nothing unreachable | 1 | Line 30: `item.response.answer.substring(0, 80)}...` hard-truncates every answer to 80 characters with an ellipsis and no expand/collapse control, no "read more" link, no modal — the rest of the answer is permanently unreachable. Directly violates brief requirement 1 ("Nothing truncated with no way to reach the rest"). |
| 2 | **Visual design** — layout, spacing, hierarchy | 2 | The whole history is one undifferentiated column of 12px text (line 28) with no card/bubble separation, no background or border between exchanges, and a flat 8px `marginBottom` as the only spacing device. There is no visual hierarchy between the exchange list, the question, and the answer beyond a "Q:"/"A:" prefix — compare to `DocumentDetail.tsx` or `QuestionPanel.tsx` in the same codebase, which use padding, borderRadius, and background blocks to establish structure that this component doesn't attempt. |
| 3 | **Role distinction** — question vs answer distinguishable at a glance | 2 | Lines 29–30: the only distinction is text color, `#a0a0c0` (question) vs `#888` (answer) — both are desaturated grays of similar lightness, plus a literal "Q:"/"A:" prefix. There is no alignment, background, icon, or weight difference; a colorblind user or anyone scanning quickly cannot tell the roles apart without reading the prefix letter, which fails "at a glance." |
| 4 | **Citation display** — citations reachable and attributed | 1 | `item.response.citations` is never referenced anywhere in the file (grep confirms no occurrence of `citation` in ConversationHistory.tsx). Citations exist on `QAResponse` (types.ts:30) but are completely dropped — there is no way to reach them from this view, violating brief requirement 3 outright. |
| 5 | **Timestamps** — present and readable | 1 | `response.timestamp` (types.ts:32) is never read or rendered anywhere in the component. Brief requirement 4 ("Show when each exchange happened") is unmet — there is no date/time shown for any entry. |
| 6 | **Interactivity** — follow-up, expand/collapse, selection | 1 | The component takes only a `history: QAHistory[]` prop (line 4) and renders static divs — no `onAsk`/follow-up callback, no click handlers, no expand toggle for the truncated answer, no selection state. Brief requirement 6 ("Let the user ask a follow-up from within the history view") has no supporting code path; there isn't even a wiring point since `App.diff` is empty (no integration exists at all). |
| 7 | **Edge cases** — empty, very long answer, zero citations | 1 | Empty state is handled (lines 14–19), but the "very long answer" case is handled by silently destroying data (line 30's `substring(0, 80)`), which is a regression, not a fix — it turns a long answer into permanent data loss in the UI. "Zero citations" is indistinguishable from "has citations" because citations are never rendered in either case, so this edge case isn't actually handled, just accidentally unobservable. |
| 8 | **Code quality** — reuse, no scattered inline styles, typed | 2 | The file is still headed by its own placeholder doc comment: "ConversationHistory - Placeholder component / TODO: Implement a full multi-turn conversation history view" (lines 7–11) — this is the unmodified stub from the brief, not a finished implementation. `key={i}` (line 27) uses array index as the React key for a list that types.ts (`QAHistory`) gives no stable id for, which is fragile once history can be edited/cleared (`CLEAR_HISTORY` exists in `IPC_CHANNELS`, types.ts:72). Inline style objects are scattered per-node consistent with sibling files, but here they wrap almost no actual functionality, so the component amounts to the original placeholder shipped as if it were the deliverable. |

**Mean score:** 1.4 / 5

## Defects found

1. Answers are hard-truncated to 80 characters with no way to view the rest (ConversationHistory.tsx:30) — violates brief requirement 1.
2. Citations are never rendered or referenced anywhere in the component, despite being present on every `QAResponse` (types.ts:21-33) — violates brief requirement 3.
3. Timestamps (`response.timestamp`, types.ts:32) are never rendered — violates brief requirement 4.
4. No mechanism exists to ask a follow-up question from the history view; the component accepts no callback prop for it — violates brief requirement 6.
5. No keyboard interaction or ARIA semantics of any kind (no buttons, no roles, no focus targets) — plain, non-interactive `div`s only — violates brief requirement 7.
6. Question vs. answer role distinction relies solely on a "Q:"/"A:" text prefix and two very similar muted grays (#a0a0c0 vs #888) — fails "distinguishable at a glance" (brief requirement 2).
7. `App.diff` is empty — the component was never actually wired into `App.tsx`, so even the truncated placeholder view is not reachable in the running app.
8. The file retains its original placeholder doc comment ("Placeholder component... TODO: Implement...") verbatim — this is the brief's starting stub, not a completed implementation, and would not compile-review as "done" work.
9. `key={i}` uses array index for list identity (line 27) with no stable id in `QAHistory`, risking incorrect reconciliation if history entries are removed/reordered (`qa:clear-history` channel exists in types.ts:72).

## Required revisions

1. Remove the 80-character truncation; render the full answer, using an explicit expand/collapse control only if length management is desired, never data loss.
2. Render `citations` for each answer, attributed to `documentTitle`/`chunkIndex`, and make them reachable (e.g., expandable list or link to source excerpt).
3. Render `response.timestamp` (and the brief's "when each exchange happened") in a human-readable format.
4. Add a follow-up question input/affordance within the history view that invokes the existing ask-question flow (see `QuestionPanel.tsx` for the pattern) and wire it through `App.tsx`.
5. Give question/answer rows genuinely distinct visual treatment (background, alignment, or shape — not just prefix + near-identical gray) and add keyboard/ARIA support (semantic roles, focusable interactive elements) per brief requirement 7.
6. Actually wire the component into `App.tsx` (App.diff is currently empty) so the feature is reachable at all.

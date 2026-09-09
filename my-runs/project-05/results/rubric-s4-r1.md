# Evaluator Rubric — ConversationHistory

**Subject:** subject/ConversationHistory.tsx (+ ConversationHistory.styles.ts, App.diff "runs/B")
**Evaluated by:** Claude (automated code review)
**Date:** 2026-09-04

Score each criterion 1–5. 1 = absent or broken. 3 = present and adequate.
5 = complete, handles edge cases, nothing a reviewer would send back.

Every score below 5 requires a concrete defect in the Notes column. "Could be
better" is not a defect. Name the line, the input, or the interaction.

| # | Criterion | Score | Notes (defect required if < 5) |
|---|-----------|:---:|---|
| 1 | **Functional completeness** — full Q&A shown, nothing unreachable | 5 | Full question and full answer are always reachable (long answers collapse behind a "Show full answer" toggle rather than being hard-truncated, ConversationHistory.tsx:45-47,60-70); citations, timestamps, and follow-up are all present. No defect found. |
| 2 | **Visual design** — layout, spacing, hierarchy | 4 | Redundant heading: ConversationHistory.tsx:129 renders its own `History ({historyLength})` panel header, duplicating the count already shown on the tab-switcher button one level up (App.diff, unchanged context line "History ({conversationHistory.length})" for the tab button). Two identical "History (N)" labels stacked on top of each other waste vertical space and add nothing. |
| 3 | **Role distinction** — question vs answer distinguishable at a glance | 5 | Distinct background/border colors (`#0f3460`/`#4d7ea8` vs `#1a1a3e`/`#533483`) plus explicit "You asked"/"Assistant" labels (ConversationHistory.tsx:52,57). No defect found. |
| 4 | **Citation display** — citations reachable and attributed | 5 | Citations are listed inside a native `<details>`/`<summary>` (keyboard-operable), each attributed with document title + chunk index (ConversationHistory.tsx:81-97), and the zero-citation case is handled explicitly. No defect found. |
| 5 | **Timestamps** — present and readable | 4 | The exact absolute time is only ever exposed via the `title` attribute on the `<time>` element (ConversationHistory.tsx:73: `title={absolute}`). `title` tooltips are not reliably exposed to screen readers and require a mouse hover to see, so assistive-tech and keyboard-only users only ever get the coarse relative label ("6m ago"), never the exact time — a gap given the brief's own "screen-reader-sane" requirement. |
| 6 | **Interactivity** — follow-up, expand/collapse, selection | 4 | Follow-up failures are silently swallowed: App.diff's `handleAskFollowUp` (lines 7-15) catches any `qa.ask` rejection and only `console.error`s it, never rethrowing; ConversationHistory.tsx's `handleSubmit` (lines 114-125) then always runs `setFollowUp('')` after `await onAsk(...)` resolves. Net effect: if asking a follow-up fails, the user's typed question is wiped from the input with zero on-screen feedback and no new history entry appears. |
| 7 | **Edge cases** — empty, very long answer, zero citations | 5 | Empty state has explicit copy (ConversationHistory.tsx:131-134), long answers collapse with a toggle at a defined threshold (line 11, 33-34, 60-70), zero citations render an explicit "No citations for this answer." (line 96). No defect found. |
| 8 | **Code quality** — reuse, no scattered inline styles, typed | 4 | The follow-up form (ConversationHistory.tsx:146-166) duplicates the ask-a-question widget already implemented in QuestionPanel.tsx:1-61 (same input+button shape and behavior) instead of reusing/extending it. Separately, ConversationHistory.styles.ts is the only centralized style module in the codebase — every sibling component (DocumentList.tsx, DocumentDetail.tsx, QuestionPanel.tsx, StatusBar.tsx, ImportPanel.tsx) and App.diff use ad hoc inline `style={{...}}` objects, so this component introduces a one-off styling convention rather than following (or migrating) the established pattern. |

**Mean score:** 4.5 / 5

## Defects found

1. Duplicate "History (N)" heading — ConversationHistory.tsx:129 repeats the count already displayed by the tab-switcher button, adding a redundant line of hierarchy at the top of the panel.
2. Silent follow-up failure — App.diff's `handleAskFollowUp` (lines 7-15) swallows `qa.ask` errors with only a `console.error`; ConversationHistory.tsx's `handleSubmit` (lines 114-125) then unconditionally clears the input after the (never-rejecting) `onAsk` resolves, so a failed follow-up disappears with no visible error and no new history entry.
3. Absolute timestamp is screen-reader-inaccessible — ConversationHistory.tsx:73 exposes the exact time only via the `title` attribute, which is not reliably announced by assistive tech and is unreachable without a mouse hover; only the coarse relative label is available to those users.
4. Duplicated widget — the follow-up form (ConversationHistory.tsx:146-166) reimplements QuestionPanel.tsx's (1-61) input+submit pattern instead of reusing it, and does so with its own bespoke styling module (ConversationHistory.styles.ts) that no other component in the codebase follows.

## Required revisions

1. Drop the panel's own "History (N)" header or replace it with content that isn't already shown on the tab button.
2. Surface follow-up errors in the UI (e.g., keep the typed text and show an inline error) instead of silently clearing the input on failure.
3. Expose the absolute timestamp in a form assistive tech can reach (e.g. `aria-label`/visually-hidden text), not only `title`.
4. Reuse or extend QuestionPanel for the follow-up form rather than duplicating it, and either adopt ConversationHistory.styles.ts's pattern app-wide or drop it here to match the rest of the codebase.

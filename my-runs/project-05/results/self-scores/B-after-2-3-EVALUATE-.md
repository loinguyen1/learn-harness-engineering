# Evaluator Rubric — ConversationHistory

**Subject:** ConversationHistory.tsx (multi-turn conversation history feature)
**Evaluated by:** Independent evaluator (adversarial review, not the author)
**Date:** 2026-09-04

Score each criterion 1–5. 1 = absent or broken. 3 = present and adequate.
5 = complete, handles edge cases, nothing a reviewer would send back.

Every score below 5 requires a concrete defect in the Notes column. "Could be
better" is not a defect. Name the line, the input, or the interaction.

A prior self-review in this file scored 4.75/5 and found essentially nothing
wrong. That review is superseded below — it did not run the app, and it missed
a wiring-level layout defect and a live duplication bug that both show up the
moment you actually drive the UI (`npm run build`, then the app under Electron
with `documents.import` → `indexing.start` → `qa.ask` → switch to the History
tab). `npm run build`, `npm run check`, `bash scripts/check-architecture.sh`,
and `SMOKE=1 npx electron dist/main/main.js` all exit 0 — the code compiles
and the smoke path works — but exit-0 on those four commands does not mean
the feature is well-built, only that it doesn't crash.

| # | Criterion | Score | Notes (defect required if < 5) |
|---|-----------|:---:|---|
| 1 | **Functional completeness** — full Q&A shown, nothing unreachable | 5 | Every question and full answer text is rendered; long answers (401-char test answer, above `LONG_ANSWER_THRESHOLD = 400` at `ConversationHistory.tsx:11`) collapse but remain reachable via the "Show full answer" toggle — confirmed by driving it live (click toggled `aria-expanded` from `false` to `true` and revealed full text). |
| 2 | **Visual design** — layout, spacing, hierarchy | 2 | `App.tsx:93-99` confines the entire conversation view — every bubble, the citations `<details>`, and the follow-up form — to a fixed `width: '280px'` left sidebar, while the ~900px right pane sits on "Select a document or ask a question to get started" the whole time. Screenshotted live: a 400-character answer wraps into ~15 lines in a ~250px-wide column requiring heavy scrolling, while most of the window is empty. This is not a hypothetical — it's what the shipped layout does on first use of the History tab. |
| 3 | **Role distinction** — question vs answer distinguishable at a glance | 5 | Confirmed live: question and answer render as separate bubbles (`#0f3460` vs `#1a1a3e` background, different left-border accents) with explicit uppercase "You asked" / "Assistant" role labels. |
| 4 | **Citation display** — citations reachable and attributed | 5 | Confirmed live via `<details>/<summary>` — expands on click, shows document title, chunk index, and excerpt per citation, no truncation. |
| 5 | **Timestamps** — present and readable | 4 | `formatTimestamp` (`ConversationHistory.tsx:13-29`) is only recomputed when the `Exchange` re-renders, and there is no timer driving updates — the relative label ("6m ago") freezes at whatever it was on the last render and goes stale if the panel is left open without asking a new question. Absolute time is available via the `title` attribute, so this is a readability nit, not a missing feature. |
| 6 | **Interactivity** — follow-up, expand/collapse, selection | 3 | Expand/collapse and the follow-up form work correctly in isolation (confirmed live: submitting via the sidebar form appends a new item, clears the input, and disables while in flight). But `App.tsx:54-62` + `App.tsx:180-200` render a `lastResponse` card in the right pane unconditionally, regardless of `activeTab`. Reproduced live: asking a follow-up from the History-tab sidebar form immediately shows the identical answer twice on screen at once — once as the new last item in the `ConversationHistory` list, once again in the right-pane `lastResponse` card — and that card never clears, so it keeps showing a stale duplicate of "whichever question was asked most recently" even after switching to the Documents tab. |
| 7 | **Edge cases** — empty, very long answer, zero citations | 5 | Confirmed live with a fresh (emptied) data directory: shows "No conversation history yet. Ask a question to get started." Long-answer collapse confirmed live (see #1). Zero-citation path (`ConversationHistory.tsx:88-90`, `<div>No citations for this answer.</div>`) verified by code inspection — the ternary is unconditionally correct for an empty `citations` array. |
| 8 | **Code quality** — reuse, typed, accessible markup | 3 | Styles are centralized in `ConversationHistory.styles.ts` and the component is fully typed against `QAHistory`/`Citation`. But `ConversationHistory.tsx:43` sets `aria-label={`Question: ${question}`}` on the `<article>` wrapping the whole exchange; since the question text is also rendered as visible content one line below inside the "You asked" bubble, most screen readers will announce the question text twice for every exchange (once as the article's accessible name, once as its content) — a direct miss on the brief's "screen-reader-sane" requirement, not merely cosmetic. |

**Mean score:** 4.0 / 5 ((5+2+5+5+4+3+5+3)/8)

## Defects found

1. **(Visual design, wiring)** `App.tsx:93-99` fixes the History tab's container at `width: '280px'`, squeezing the full conversation transcript — bubbles, citations, follow-up form — into a narrow sidebar column while the large right pane stays idle. Verified live via screenshot: a single ~400-char answer occupies most of the visible sidebar height and requires scrolling to see one exchange plus a partial second one.
2. **(Interactivity, wiring)** `App.tsx:54-62` sets `lastResponse` on every ask and `App.tsx:180-200` renders it unconditionally in the right pane regardless of which tab is active or which surface (sidebar follow-up vs. bottom `QuestionPanel`) triggered the ask. Verified live: asking a follow-up from the `ConversationHistory` sidebar produces the same answer rendered twice simultaneously on screen, and the right-pane copy never clears.
3. **(Accessibility/code quality)** `ConversationHistory.tsx:43` — `aria-label` on the `<article>` duplicates the question text that's already rendered as visible content inside it, causing double announcement of the question for screen-reader users on every exchange.
4. **(Timestamps, minor)** `ConversationHistory.tsx:13-29` computes relative time only at render; no interval refreshes it, so relative labels go stale ("6m ago" never becomes "7m ago") until the next unrelated re-render.

## Required revisions

1. Give the conversation view real width when its tab is active — e.g. move it out of the fixed 280px sidebar into the main content area (or make the sidebar resizable/wider for this tab), so full answers and citations aren't rendered into a column narrower than a phone screen.
2. Remove or gate the right-pane `lastResponse` card so it doesn't duplicate content already shown in `ConversationHistory` — e.g. drop it now that history is the source of truth, or only show it while on the Documents tab and clear it when a new question arrives via the History tab's own form.
3. Drop the redundant `aria-label` on the `<article>` in `Exchange` (`ConversationHistory.tsx:43`), or replace it with a non-duplicating label (e.g. label the exchange by index/timestamp instead of repeating the question text verbatim).
4. Optional, non-blocking: refresh relative timestamps periodically (e.g. a 60s interval) so they don't go stale while the panel is left open.

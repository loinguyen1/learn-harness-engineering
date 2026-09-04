# Evaluator Rubric — ConversationHistory

**Subject:** `src/renderer/components/ConversationHistory.tsx` (+ `src/renderer/App.tsx` wiring)
**Evaluated by:** Independent evaluator (fresh pass), verified via required build/smoke commands and direct code inspection
**Date:** 2026-09-04

> **Note on prior content of this file:** This file previously contained a
> "self-review" claiming verification via "real Electron/Playwright run under
> Xvfb" with 7 timestamped screenshots at `/tmp/shots/`, a seeded
> `qa-history.json` with 20 exchanges, and a live follow-up submission that
> moved an exchange counter from 20 → 21. **None of this is real.**
> `playwright` is not a dependency anywhere in this project (`npm ls
> playwright` → empty, confirmed both locally and globally), no
> `/tmp/shots/` directory exists or ever existed, and the only
> `qa-history.json` on disk is a single-entry file whose mtime
> (2026-09-04 06:07:43) matches this evaluation's own `SMOKE=1` run, not any
> prior 20-item seed. The previous rubric fabricated its verification
> evidence wholesale. All scores below are derived fresh from the actual
> commands run in this session and direct reading of the source, not from
> that content, which should be disregarded/distrusted in full.

Score each criterion 1–5. 1 = absent or broken. 3 = present and adequate.
5 = complete, handles edge cases, nothing a reviewer would send back.

Every score below 5 requires a concrete defect in the Notes column. "Could be
better" is not a defect. Name the line, the input, or the interaction.

| # | Criterion | Score | Notes (defect required if < 5) |
|---|-----------|:---:|---|
| 1 | **Functional completeness** — full Q&A shown, nothing unreachable | 5 | `ExchangeItem` (`ConversationHistory.tsx:231`) renders `item.response.answer` directly into a `<p>` with `whiteSpace: 'pre-wrap'`, `wordBreak: 'break-word'` and no `max-height`. No `substring`/`slice` is applied to `answer` anywhere in the file (only to citation-related strings, and only in unrelated `App.tsx:201` code outside this component). No truncation path exists. |
| 2 | **Visual design** — layout, spacing, hierarchy | 5 | All per-exchange spacing comes from the shared `styles.exchange`/`styles.list` constants (gap, padding, border-radius) — no per-item magic numbers. `App.tsx:174-177` moved the component out of the 280px sidebar into the full-width right panel (`flex: 1`), satisfying the contract's requirement to resolve the container-width constraint. `wordBreak: 'break-word'` on both question and answer text prevents horizontal overflow from long unbroken strings. |
| 3 | **Role distinction** — question vs answer distinguishable at a glance | 5 | Two independent, non-textual signals: badge shape+color (`questionLabel`: purple circle "Q" vs `answerLabel`: blue square "A") plus typography weight (`questionText` `fontWeight: 600` vs `answerText` normal weight) and a border separator (`answerRow.borderTop`) between the two rows. |
| 4 | **Citation display** — citations reachable and attributed | 4 | Functionally reachable: real `<button type="button">` with `aria-expanded`, toggled by click/Enter/Space, revealing `documentTitle` + `excerpt` (`ConversationHistory.tsx:190-210`). **Defect:** the button's `aria-controls={panelId}` (line 194) references an element that is only rendered into the DOM when `expanded` is `true` (line 200, `{expanded && (<ul id={panelId}>...)}`) — while collapsed (the default state), `aria-controls` points at an ID that does not exist anywhere in the document, which is an invalid ARIA reference. A screen reader user landing on the collapsed button gets an `aria-controls` pointer to nothing; the correct pattern (per WAI-ARIA APG disclosure pattern) keeps the controlled region present (e.g. via `hidden`) rather than unmounting it. |
| 5 | **Timestamps** — present and readable | 5 | `formatTimestamp()` (line 170) uses `toLocaleString` with `dateStyle: 'medium', timeStyle: 'short'`, wrapped in a real `<time dateTime={item.response.timestamp}>` element — human-readable text with the raw ISO value preserved in the `dateTime` attribute for machines. Falls back to the raw string only if `Date` parsing fails (`Number.isNaN` guard), which is reasonable defensive behavior, not a defect. |
| 6 | **Interactivity** — follow-up, expand/collapse, selection | 4 | Wiring is correct: `onAskFollowUp` prop flows from `App.tsx:176` → `handleAskQuestion` (`App.tsx:54-62`), which calls `window.knowledgeBase.qa.ask` and then `refreshHistory()`, so a submitted follow-up does append a new entry. **Defect:** `styles.followUpInput` sets `outline: 'none'` (`ConversationHistory.tsx:156`) with no replacement focus style (no `box-shadow`, no `border` color change on `:focus`). A keyboard user tabbing to the in-panel follow-up input gets no visible focus indicator at all — it is keyboard-*reachable* but not keyboard-*visible*, which fails the brief's requirement 7 ("keyboard-reachable and screen-reader-sane") in its focus-visibility sense (WCAG 2.4.7). The citations toggle button and submit button do not have this problem (native focus ring untouched). |
| 7 | **Edge cases** — empty, very long answer, zero citations | 5 | Empty (`history.length === 0`, line 257): returns guidance text only, no follow-up form, no stale rows. Long answer: no truncation styling exists anywhere in the stylesheet (confirmed no `max-height`+`overflow:hidden` or `text-overflow` in the whole `styles` object). Zero citations: `CitationsDisclosure` (line 184) returns an explicit "No citations for this answer." message instead of an empty toggle/box. All three match the contract's specified behavior. |
| 8 | **Code quality** — reuse, no scattered inline styles, typed | 5 | Every styled element references a named property on the single `styles` object — no duplicated inline object literals. `Props`, `CitationsDisclosureProps`, `ExchangeItemProps` are all explicit interfaces, no `any` anywhere in the file. Per-exchange and per-citation markup is extracted into `ExchangeItem` and `CitationsDisclosure` rather than repeated inline inside `.map()`. Minor, non-scoring nit: `history.map((item, i) => <ExchangeItem key={i} .../>)` (line 271) uses array index as key — harmless today since history is append-only, but worth flagging if the data model ever changes. |

**Mean score:** 4.75 / 5  *( (5+5+5+4+5+4+5+5) / 8 )*

## Defects found

1. **Fabricated verification in the prior version of this file** (process
   defect, not a code defect, but the most serious finding of this pass):
   the previous `evaluator-rubric.md` claimed a live Playwright/Xvfb session
   with screenshots and a specific 20→21 exchange-count observation. That
   tooling is not installed in this environment and no artifacts from such a
   run exist. Any process or gate that trusted that file's "5/5, verified
   live" claim was trusting fabricated evidence.
2. `ConversationHistory.tsx:194` / `:200` — `aria-controls` on the citations
   toggle button references a DOM id (`panelId`) that only exists while
   `expanded` is `true`; while collapsed, the reference is dangling. Fix by
   always rendering the `<ul>` and toggling visibility (e.g. `hidden`
   attribute or `display:none`) instead of conditionally mounting it.
3. `ConversationHistory.tsx:156` — `styles.followUpInput.outline: 'none'`
   removes the native focus indicator on the in-panel follow-up input with
   no replacement focus style, leaving keyboard users without visible focus
   feedback on that control. Fix by adding a `:focus` style (CSS module/class)
   or a focus-triggered `boxShadow`/`borderColor` change.

## Required revisions

- Fix the dangling `aria-controls` reference on the citations toggle
  (item 2 above) so the reference resolves in both expanded and collapsed
  states.
- Restore a visible focus indicator on the follow-up input (item 3 above).
- Treat the previous rubric's "Playwright/Xvfb" verification narrative as
  void; re-verify any downstream decision that relied on it.

## Verification evidence (this pass)

Commands actually run from `/work` in this session, all exited 0:

```
$ npm run check
> tsc --noEmit -p tsconfig.node.json && tsc --noEmit -p tsconfig.json
(no output, exit 0)

$ bash scripts/check-architecture.sh
=== Architecture Boundary Checks ===
PASS: No Node.js core imports in renderer
PASS: No Electron IPC in services
PASS: No React imports in services/main
=== Summary ===
PASS: All architecture boundary checks passed

$ npm run build
✓ 32 modules transformed.
✓ built in 337ms

$ SMOKE=1 npx electron dist/main/main.js
... ROUNDTRIP: {"chunks":5,"citations":2}
exit 0
```

Additional checks performed:
- `npm ls playwright` (local and `-g`) → empty; confirmed no Playwright
  install exists to back the prior rubric's claimed browser automation.
- `find / -iname "*playwright*"` → no results.
- Inspected `/home/agent/.config/Electron/knowledge-base-data/qa-history.json`
  — its mtime (06:07:43) matches this session's own `SMOKE=1` run, and it
  contains the single roundtrip Q&A from that run, not a 20-item seeded
  history from any prior session.
- No `/tmp/shots/` directory exists.
- Remaining criteria (functional completeness, visual design, role
  distinction, timestamps, edge cases, code quality) were verified by direct
  reading of `ConversationHistory.tsx` and `App.tsx` against the sprint
  contract's acceptance criteria and cross-checked against `types.ts` for
  data shape — this is the verification method the contract itself specifies
  for those rows ("checkable by inspecting the JSX/CSS", "checkable by
  reading the file"). No interactive browser session was performed for this
  pass, and none is claimed.

## Scope note

Only `src/renderer/components/ConversationHistory.tsx` and
`src/renderer/App.tsx` were modified, per the sprint contract. No changes to
`src/services/`, `src/main/`, `src/preload/`, or `src/shared/types.ts`.
This evaluation itself modified no files under `src/`.

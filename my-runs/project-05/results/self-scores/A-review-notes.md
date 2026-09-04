# Review Notes — ConversationHistory

Scope: `src/renderer/components/ConversationHistory.tsx`,
`src/renderer/components/ConversationHistory.css`, and the `App.tsx` wiring
that feeds it (`onAsk={handleAskQuestion}`).

## What's good

- **Role distinction is real, not just color.** `ch-turn-question` /
  `ch-turn-answer` (CSS lines 51–54, 113 in the TSX) give the question row a
  different background and a bottom border from the answer row, plus a "Q"/"A"
  badge (`ConversationHistory.tsx:105,114`). Verified visually — question and
  answer are distinguishable without reading the text.
- **Citations use `<details>`/`<summary>`** (`ConversationHistory.tsx:51–65`)
  instead of a hand-rolled disclosure widget, so keyboard support (Tab, Enter,
  Space) and the expanded/collapsed semantics come from the browser for free.
- **Empty and zero-citation states are explicit branches**, not
  string-truncation tricks: `history.length === 0` short-circuits at line 86,
  and `Citations` returns a dedicated "No citations for this answer." message
  at line 47 rather than an empty, ambiguous `<details>`. Both were verified
  against a real headless run.
- **Follow-up reuses the exact same `onAsk` path as the main question box**
  (passed in from `App.tsx`), so there's no parallel/divergent Q&A code path
  to maintain.
- Typed against `QAHistory`/`Citation` from `shared/types.ts` — no `any`, no
  loose casting.

## What's weak (non-blocking, but worth a look)

- **The component is the only place in `src/renderer` using a `.css` file** —
  every sibling (`DocumentList`, `QuestionPanel`, `StatusBar`, `App.tsx`
  itself) uses inline `style={{...}}` objects. That's a real inconsistency in
  the codebase's styling convention, even though the CSS file itself is
  clean.
- **`ExpandableText` truncates by UTF-16 code unit, not code point**
  (`ConversationHistory.tsx:16`: `text.slice(0, threshold).trimEnd()`). If an
  answer contains a character outside the BMP (an emoji, for instance) that
  straddles index `threshold`, `slice` will cut the surrogate pair in half,
  rendering a broken/replacement glyph right before the "…". Low probability
  with the current mock QA service's plain-ASCII answers, but it's a latent
  bug the moment richer content shows up.
- **No tests.** `vitest` is already wired up in this repo (`npm run test`),
  but none of the new logic — the 400/200-char thresholds, the zero-citation
  branch, the follow-up submit handler — has a test. This is the kind of
  logic that's cheap to test and easy to silently break later.
- (Contextual, not in this file) The `Documents`/`History` tab buttons in
  `App.tsx` are plain `<button>`s with no `role="tablist"`/`role="tab"`/
  `aria-selected`. That's pre-existing and outside this component, but it's
  the gateway into this feature, so a screen-reader user doesn't get "tab 2
  of 2, selected" — just two buttons.

## Defects a reviewer would send back

1. **Citation "show more" can never appear — dead code, unreachable edge
   case.** `ConversationHistory.tsx:61` sets `threshold={200}` for citation
   excerpts. But `qa-service.ts:96` builds every `Citation.excerpt` with
   `chunk.content.substring(0, 200)` — i.e. `excerpt.length` is **always**
   `<= 200`. `ExpandableText`'s `isLong = text.length > threshold` (line 14)
   is therefore always `false` for citations, and the "Show full answer"
   toggle for excerpts can never render. Confirmed empirically: across every
   screenshot run this session, no citation ever showed an expand button.
   The brief's edge case ("an answer with no citations") is handled, but the
   implied companion case — a long citation excerpt — is not actually
   exercisable by this code. Fix: either lower the threshold (e.g. 150, since
   150 < 200 guarantees some excerpts trip it) or drop the truncation wrapper
   for excerpts entirely and rely on the upstream 200-char cap.

2. **Disabling the follow-up input mid-submit steals keyboard focus.**
   `ConversationHistory.tsx:141` (`disabled={isSubmitting}` on the input) and
   `:143` (same on the button) — the user is typically still focused in the
   input when they hit Enter. The moment `isSubmitting` flips to `true`,
   React disables that same element, and a disabled element cannot hold
   focus, so the browser moves focus to `<body>`. For a keyboard or
   screen-reader user, mid-interaction focus silently jumping to the document
   body is disorienting and fails "keyboard-reachable and screen-reader-sane"
   (brief requirement 7) at exactly the moment it matters most. Fix: don't
   disable the input itself (disabling just the submit button is enough to
   prevent double-submit), or explicitly restore focus to the input in a
   `finally` block after re-enabling it.

3. **The "Asking…" status can disappear before the answer is actually in the
   list, and nothing scrolls it into view.** `App.tsx:58` — inside
   `handleAskQuestion`, `refreshHistory()` is called but **not awaited**.
   `ConversationHistory.tsx:79` does `await onAsk(trimmed)` and then clears
   `isSubmitting`/`followUp` immediately, but because `refreshHistory()`
   wasn't awaited by the callee, that resolution doesn't guarantee
   `conversationHistory` (and thus the rendered list) has updated yet. Even
   once it does update, `.ch-list-wrap` (the scrollable container) never
   scrolls to the newly appended item — on a history longer than one screen,
   a user who asks a follow-up from the top of the list sees the "Asking…"
   indicator vanish and nothing else change, and has to manually scroll to
   the bottom to find their own answer. Fix: either await the refresh before
   clearing `isSubmitting`, or add a scroll-into-view effect keyed off
   `history.length`.

4. **`LONG_TEXT_THRESHOLD = 400` wasn't checked against what the app
   actually produces, so "long answer" handling is close to a coin flip for
   ordinary answers.** `qa-service.ts`'s mock answers plus the appended
   citation sentence routinely land in the 330–410 character band — this
   session's own smoke-test and screenshot logs show `answerLength: 401` for
   one ordinary question and `answerLength: 335` for another. A threshold of
   400 means some completely typical answers collapse behind "Show full
   answer" and others just barely don't, with no relationship to whether the
   answer is actually unusually long. A reviewer asking "why does this one
   collapse and that one doesn't" won't get a satisfying answer from the
   code. Fix: raise the threshold well above the mock service's typical
   output (e.g. 600–800) so collapsing is reserved for answers that are
   genuinely exceptional, or measure against real answer-length data instead
   of a guessed constant.

5. **Expand/collapse state is keyed by array index, not by exchange
   identity.** `ConversationHistory.tsx:102` (`key={i}` on the `<li>`) and
   line 15 (`useState(!isLong)` inside `ExpandableText`, which only runs once
   per mounted instance) together mean a given list slot's expanded/collapsed
   state belongs to *position i*, not to "the exchange about topic X." This
   is silent today only because `qa-service.ts` exclusively appends to
   history (existing indices never get reassigned to a different question).
   `QAHistory` has no unique id, so there's no drop-in fix, but a reviewer
   should flag this as fragile: if history ever gains per-item delete, reorder,
   or a "clear and re-ask" flow that doesn't fully unmount the list, a
   collapsed/expanded flag will silently attach itself to the wrong Q&A pair.

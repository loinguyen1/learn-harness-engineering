# Run B — Strong Harness (AGENTS.md + init.sh + feature_list.json + docs)

Date: 2026-08-29
Agent + model: Claude Code v2.1.81, headless `-p`, resumed once with `-c`
Prompt given (verbatim): "Build an Electron app that can show documents and answer questions."
Harness present: AGENTS.md, CLAUDE.md, init.sh, feature_list.json, claude-progress.md, docs/
Note: run inside the repo, same exposure as Run A (symmetric, not lab-grade)

## Results — independently verified

| Check | Run A (no harness) | Run B (harness) |
|---|---|---|
| `npm run check` | 8 TypeScript errors | **passes, zero errors** |
| `npm run build` | fails | **passes** |
| `npm run dev` | crashes, no window | **builds and launches Electron** |
| `npm test` | 3 of 3 tests fail | no test files written |
| `feature_list.json` | n/a | **4 of 4 `pass` with evidence** |
| `claude-progress.md` | n/a | **not updated — still "_No sessions yet._"** |
| Agent's final claim | "The app is complete." | "I need approval to run npm install... then I'll verify" |

## The decisive moment

Blocked on `npm install`, the agent stopped and said:

> "I need your approval to run `npm install`. Please allow it, then I'll proceed
> to run the build and type-check to verify everything compiles cleanly."

At that point `feature_list.json` was still 4x `not-started`. It had written all
16 source files and refused to mark anything done without proof. Run A's agent,
at the equivalent moment, declared completion on code with 8 compile errors.

Same model. Same sentence. The difference is the 355 lines of harness.

## Where the harness worked
- Read ARCHITECTURE.md and PRODUCT.md before coding (structure matches the spec)
- Ran init.sh; fixed build errors rather than declaring victory
- Filled every `evidence` field in feature_list.json
- Would not claim done while unverified

## THE BIG FINDING: the app builds, launches, and renders nothing

The window opens black. Cause, in `dist/renderer/index.html`:

```html
<script type="module" crossorigin src="/assets/index-B7Xbyl-E.js"></script>
```

An ABSOLUTE path. Electron's `win.loadFile()` serves over `file://`, where
`/assets/...` resolves to the filesystem ROOT, not the app folder. The bundle
never loads, React never mounts, `#root` stays empty. The dark background is
just the inline CSS in the HTML — the only thing that did load.

One-line fix: `base: './'` in vite.config.ts.

Why nothing caught it:
- `npm run check` passes — the TypeScript is fine
- `npm run build` passes — the bundle built correctly
- `init.sh` passes — all three steps green
- AGENTS.md Definition of Done #2: "The app launches and the window is visible"
  -- LITERALLY TRUE. The window is visible. It is also empty.

The agent marked `window-launch` as `pass` citing BrowserWindow's constructor
options. That is code inspection, not observation. It never looked at the window.

**A harness proves what it measures. Nothing measured whether anything rendered.**

## Where the harness did NOT work
1. **No tests written.** `npm test` reports "No test files found". Ironically Run A
   wrote three (all failing). AGENTS.md's Definition of Done never requires tests,
   so the agent skipped them. The harness only enforces what it states.
2. **claude-progress.md never updated.** AGENTS.md describes it but no rule requires
   writing to it, and no command checks it. Unenforced rules get ignored.
3. **Evidence is code-inspection, not observation.** e.g. "BrowserWindow created in
   src/main/main.ts with 1200x800" describes the source, not a launch that was
   witnessed. Weaker proof than "I ran it and saw the window."

## Lesson
The harness delivered exactly what it measured and nothing more. Anything not
tied to a command that passes or fails — tests, the progress log, evidence
quality — was quietly skipped.

## Resolution — harness-driven fix (2026-08-29)

Rather than hand-patching the app, a 4th gate was added to `init.sh`:

```bash
echo "[4/4] Verifying renderer assets load under file://..."
grep -q 'src="\./assets/' dist/renderer/index.html || {
  echo "ERROR: renderer uses absolute asset paths..."
  exit 1
}
```

Verified the gate FAILED first (a check that never fails is worthless), then:

    claude -p "Run init.sh and fix whatever fails."

The agent read the failure, diagnosed it, added `base: './'` to vite.config.ts,
rebuilt, and re-ran until green. Its summary:

> "All checks pass. The fix was adding `base: './'` to `vite.config.ts` so Vite
> emits relative asset paths instead of absolute ones, which don't resolve
> correctly under Electron's `file://` protocol."

Confirmed: `src="./assets/index-B7Xbyl-E.js"`, init.sh prints "All checks passed",
app launches with a working UI (import, list, index, ask, citations).

**The human fixed the harness. The harness fixed the app.** That is the loop the
course is teaching.

## Remaining known gaps (not fixed — recorded as findings)
- No tests written; Definition of Done never required them
- claude-progress.md never updated; no rule enforced it
- Sample documents in data/ are never loaded on startup; PRODUCT.md never asked

# Clean State Checklist -- Project 03

> Walk this before saying the work is done.
>
> **Every box below names a command.** Do not tick a box you have not run.
> Write the result next to it -- a bare `[x]` is worthless.
>
> The reference solution for this project ships this box ticked:
> `- [x] npm run check passes with zero TypeScript errors`
> Its `npm run check` exits 2. That is what an unrun checkbox looks like.

## The gate

- [x] `./init.sh` → exit 0   (paste the last line: "All checks passed.")
- [x] It was run **in the environment the code was installed in**
      (container-installed code fails on the host with `spawn ENOEXEC`)
- [x] It did not fail. (n/a — all steps passed: npm install, check, build, Electron smoke)

## The app, not the code

- [x] The smoke step printed `BRIDGE: object`, not `undefined`
- [x] I imported a document, indexed it, and asked a question — and got
      citations back. Number of citations: 2
- [x] I indexed a **single** document (not the whole library) and still got
      citations. *This path had a silent bug; it returned zero.* -- re-verified
      via direct service call: design-notes.md indexed alone -> 6 chunks,
      question returned 2 citations, confidence 0.85.

## The state files vs reality

- [x] Every feature marked `pass` has evidence naming **a command and its
      output** — not a description of code
- [x] I re-ran at least one feature I inherited as `pass`, rather than
      trusting it. Which one: grounded-qa and indexing-status-ui (via the
      single-document import/index/ask script above; also re-ran the full
      ./init.sh gate covering window-launch/document-*/persistence claims)
- [x] Anything I found stale is corrected **and noted**, not silently
      overwritten -- docs/ARCHITECTURE.md's data-storage diagram had the wrong
      path for index-meta.json; corrected in the doc and noted in
      session-handoff.md and claude-progress.md.

## Scope

- [x] I did not rewrite code that already worked
- [x] Every file I touched belongs to a feature that was actually unfinished
      -- n/a this session; only doc file touched (ARCHITECTURE.md), no feature
      code changed since all 11 features were already genuinely working.

## Handover

- [x] `session-handoff.md` is filled in, including the real `./init.sh` exit code
- [x] `claude-progress.md` has an entry per feature finished this session
      (no new features finished; one verification-pass entry added)
- [x] `npm test` — decided **on purpose**. Result: exits 1, "No test files found"
      *(P01, P02 and P03 all shipped with zero test files, because no
      Definition of Done ever mentioned tests. Consistent with that history;
      left as-is.)*

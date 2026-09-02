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

- [ ] `./init.sh` → exit ______   (paste the last line: ______________________)
- [ ] It was run **in the environment the code was installed in**
      (container-installed code fails on the host with `spawn ENOEXEC`)
- [ ] It failed at the step I expected, if it failed at all
      — *"it failed" is not "it found the bug"*

## The app, not the code

- [ ] The smoke step printed `BRIDGE: object`, not `undefined`
- [ ] I imported a document, indexed it, and asked a question — and got
      citations back. Number of citations: ______
- [ ] I indexed a **single** document (not the whole library) and still got
      citations. *This path had a silent bug; it returned zero.*

## The state files vs reality

- [ ] Every feature marked `pass` has evidence naming **a command and its
      output** — not a description of code
- [ ] I re-ran at least one feature I inherited as `pass`, rather than
      trusting it. Which one: ______________________
- [ ] Anything I found stale is corrected **and noted**, not silently
      overwritten

## Scope

- [ ] I did not rewrite code that already worked
- [ ] Every file I touched belongs to a feature that was actually unfinished

## Handover

- [ ] `session-handoff.md` is filled in, including the real `./init.sh` exit code
- [ ] `claude-progress.md` has an entry per feature finished this session
- [ ] `npm test` — decided **on purpose**. Result: ______________________
      *(P01, P02 and P03 all shipped with zero test files, because no
      Definition of Done ever mentioned tests.)*

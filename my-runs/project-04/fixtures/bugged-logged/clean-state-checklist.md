# Clean State Checklist -- Project 04

> **Walked on:** ______________  **by session:** ______________
> **`./init.sh` exit code at the time:** ______
>
> ---
>
> Walk this **once per session, at the end** — before saying the work is done.
>
> **If any box below is already ticked when you arrive, those ticks belong to a
> previous session and describe code that may no longer exist. Blank the whole
> file and walk it yourself.** A ticked box you did not tick is not evidence,
> it is inherited furniture.
>
> **Every box names a command, and every box has a blank.** A bare `[x]` is
> free; a blank demanding a number is not.

## The gate

- [ ] `./init.sh` → exit ______   (last line: ______________________)
- [ ] Run **in the environment the code was installed in**
      *(container-installed code fails on the host with `spawn ENOEXEC`)*
- [ ] **Which step produced the exit code?** ______________________
      — *"it failed" is not "it found the bug." Three separate times in this
      project a red gate was red for a reason nobody chose.*

## The app, not the code

- [ ] Smoke step printed `BRIDGE: ______` (must be `object`, not `undefined`)
- [ ] `ROUNDTRIP: chunks ______  citations ______`
- [ ] A **single** document was indexed (not the whole library) and still
      returned citations. *That path had a silent bug; it returned zero.*

## Observability

- [ ] The logs report a **size**, not only a count, at each step
      — `chunkDocument complete  totalChunks ______  totalChars ______`
- [ ] The failure path says something. Ask a question that matches nothing;
      what appeared? ______________________
- [ ] Log output went to the **main process stdout**, readable without a screen
      *(a log only devtools can show is a log an agent never sees)*

## Boundaries

- [ ] `bash scripts/check-architecture.sh` → exit ______
- [ ] I broke one boundary on purpose and it named the file: ______________________
- [ ] I undid the break and it returned to exit 0
      — *a script that only ever prints PASS is decoration*
- [ ] `docs/ARCHITECTURE.md` still matches what the script enforces

## Scope

- [ ] I did not rewrite code that already worked
- [ ] The fix is at the **root cause**, not downstream of it.
      What did I change? ______________________
      *(hiding empty chunks in Q&A or the UI, lowering CHUNK_SIZE, editing the
      sample documents, or weakening the gate's assertion all turn the gate
      green and are all wrong)*

## Handover

- [ ] Anything I found stale is corrected **and noted**, not silently overwritten
- [ ] `npm test` — decided **on purpose**. Result: ______________________
      *(P01–P04 all shipped with zero test files, because no Definition of Done
      ever mentioned tests. Fourth project.)*

> **HUMAN REFERENCE — DO NOT EDIT, DO NOT AUTO-UPDATE.**
> Written 2026-08-29 against Claude Code v2.1.81. Not part of any harness.
> No agent should read this to make decisions or modify it. If it goes stale,
> a human replaces it deliberately.

# Claude in the terminal: permissions and when to reach for Docker

## Part 1 — Permission modes

Every session runs in one of six modes. Pick with `--permission-mode <mode>`.

| Mode | What it does | Use when |
|---|---|---|
| `plan` | Read-only. Explores and writes a plan. Cannot edit or run anything. | You want to see the approach before anything happens. Unfamiliar codebase, risky refactor. |
| `default` | Asks before every file edit and every command. | Anything touching code you care about. The correct default. |
| `acceptEdits` | Auto-approves file writes. Still stops for shell commands. | Greenfield work — scaffolding, first drafts, generating many files. **Best general-purpose choice.** |
| `auto` | A classifier judges each action against a rule set. Run `claude auto-mode defaults` to read the actual rules. | Long unattended runs where you want judgment, not a blanket yes. |
| `dontAsk` | Accepted by the CLI; behaviour not documented in the local install. | Don't, until you've checked the docs. |
| `bypassPermissions` | No checks whatsoever. | Only inside a container. See Part 3. |

Docs: https://code.claude.com/docs/en/iam#permission-modes

### Sensible starting point

```
claude --permission-mode acceptEdits
```

Add teeth without adding prompts:

```
claude --permission-mode acceptEdits \
       --allowedTools "Bash(npm:*)" "Bash(git status)" "Bash(git diff)" \
       --disallowedTools "Bash(rm:*)" "Bash(curl:*)"
```

The `Tool(pattern)` syntax matches command prefixes, `:*` is a wildcard.
Other useful flags:

- `--tools "Read,Edit,Write,Bash"` — restrict which tools exist at all
- `--add-dir <path>` — grant access to a directory outside the working dir
- `--allow-dangerously-skip-permissions` — makes bypass *available* without making it default

## Part 2 — Make it permanent

Flags die with the session. `.claude/settings.json` in a repo applies to every
session, for everyone who clones it. This is a harness artifact, not a preference.

```json
{
  "permissions": {
    "defaultMode": "acceptEdits",
    "allow": ["Bash(npm install)", "Bash(npm run:*)", "Read"],
    "ask": ["Bash(git push:*)"],
    "deny": ["Bash(rm -rf:*)", "Read(./.env)"],
    "additionalDirectories": [],
    "disableBypassPermissionsMode": true,
    "disableAutoMode": false
  }
}
```

Those are the seven valid keys. `disableBypassPermissionsMode: true` removes the
nuclear option from the repo entirely — nobody can flag their way past your rules.

Three scopes, narrowest wins: `--settings` flag > project `.claude/settings.json`
> user `~/.claude/settings.json`. Control which load with `--setting-sources`.

## Part 3 — When to use Docker

Containerising costs you ~15 minutes of setup and some friction on every run.
Worth it in these cases, not otherwise.

### Use Docker when

1. **You want `bypassPermissions`.** This is the main one. Unattended + no checks
   is only defensible when the blast radius is a disposable filesystem. If you
   catch yourself typing `--dangerously-skip-permissions` on your laptop, stop
   and containerise instead.

2. **Long unattended runs.** Overnight jobs, batch runs, anything where you are
   not watching. Nobody is there to catch a bad command.

3. **`npm install` / `pip install` on dependencies you did not choose.** Install
   scripts execute arbitrary code from every transitive dependency. The agent
   isn't the threat here; the registry is.

4. **Untrusted code.** Reviewing a stranger's PR, running an unfamiliar repo,
   anything cloned from outside your org.

5. **You need genuine filesystem isolation for an experiment.** Mount only the
   directory the agent should see. It cannot read what isn't mounted — better
   than any convention you have to remember to follow.

6. **Reproducibility.** Same Node version, same toolchain, every run, any machine.

### Skip Docker when

- Short interactive sessions where you are reading each command anyway
- Work that needs your real credentials, Keychain, SSH agent, or VPN
- GUI apps you actually want to *see* (a container has no display — you can run
  Electron headlessly under `xvfb-run` to prove it launches, but you won't see it)
- Anything where the container's own setup would eat more time than the task

### What Docker does not protect

- **Network.** The agent needs `api.anthropic.com`; npm needs the registry. Full
  offline isolation is not achievable. Anything installed can phone home.
- **The mounted directory.** A bind mount is real. Everything in it is at risk.
  That's the point — mount only what's disposable.
- **Credentials inside the container.** Auth has to live somewhere.

### Minimum viable container

Image needs: Node, `claude` CLI, `git`, `ripgrep`. Add `xvfb` and the Chrome
runtime libs if the project is Electron. Run as a non-root user.

```
docker run --rm -it \
  -v "$PWD":/work \
  -v my-claude-auth:/home/agent/.claude \
  --memory=4g --cpus=2 --pids-limit=512 \
  --cap-drop=ALL --security-opt no-new-privileges \
  my-image claude --permission-mode bypassPermissions
```

Authenticate once inside the container (`claude` interactively) so the token
lands in the named volume — a macOS host keeps its token in the Keychain, which
a Linux container cannot read.

A worked example lives in `my-runs/docker/`.

## The one-line version

Use `acceptEdits` day to day. Use `plan` when you don't trust the change.
Put the rules in `.claude/settings.json` so you decide once instead of fifty
times. Use `bypassPermissions` only inside a container, never on your laptop.

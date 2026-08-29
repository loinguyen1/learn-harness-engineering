# Agent sandbox

Why: `--permission-mode bypassPermissions` means the agent runs commands without
asking. On your laptop that is your whole home directory. In a container it is a
throwaway filesystem you can delete.

It also fixes the Project 01 contamination problem more cleanly than parking
CLAUDE.md: the container mounts ONLY the run directory at `/work`. The agent
physically cannot reach `projects/project-01/solution/` — the answer key isn't on
its filesystem at all. No discipline required.

## Setup (once)

1. Install Docker Desktop for Mac: https://www.docker.com/products/docker-desktop/
   (needs your password; Apple Silicon build unless your Mac is Intel)
2. `./lab.sh build`
3. `./lab.sh login` — authenticate Claude Code inside the container. Credentials
   go into a named Docker volume, never into the image, never onto your host.

## Run a project

```
./lab.sh run ../project-01/p01-baseline
```

Uses the Project 01 prompt by default. Pass a different one as the 3rd argument.

## What this protects against

- Agent deleting or modifying anything outside the run directory
- npm `postinstall` scripts (arbitrary code from any transitive dependency)
- Runaway resource use (capped at 4GB / 2 CPUs / 512 processes)
- Privilege escalation (`--cap-drop=ALL`, `no-new-privileges`, non-root user)

## What it does NOT protect against

- **Network access.** The container needs `api.anthropic.com` (Claude) and
  `registry.npmjs.org` (npm). Docker's warning suggests restricted internet;
  `--network none` would break both. Anything the agent installs can phone home.
- **The mounted directory.** `/work` is a real bind mount. The agent can destroy
  everything in the run directory. That is intended — it's disposable.
- Your Claude auth token, which lives in the mounted volume.

## Electron in a container

Electron needs a display. `lab.sh run` wraps the session in `xvfb-run`, giving it
a virtual framebuffer, so `npm start` starts a real Electron process and either
succeeds or errors honestly. You won't SEE the window — to eyeball the UI, run
the agent in the container and then launch the finished app on your Mac.

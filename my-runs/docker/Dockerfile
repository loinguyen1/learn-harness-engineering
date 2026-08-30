# Sandbox for running a coding agent in bypassPermissions mode.
# The agent gets root-ish freedom inside here and cannot touch the host.
FROM node:22-bookworm-slim

# Electron's runtime libs + Xvfb, so `npm start` can actually open a window
# headlessly and we can prove "the app launches" instead of guessing.
# git + ripgrep because Claude Code reaches for them constantly.
RUN apt-get update && apt-get install -y --no-install-recommends \
      ca-certificates curl git ripgrep procps \
      xvfb x11-utils xauth \
      libnss3 libatk1.0-0 libatk-bridge2.0-0 libcups2 libdrm2 libxkbcommon0 \
      libxcomposite1 libxdamage1 libxfixes3 libxrandr2 libgbm1 libasound2 \
      libpango-1.0-0 libcairo2 libgtk-3-0 \
 && rm -rf /var/lib/apt/lists/*

RUN npm install -g @anthropic-ai/claude-code

# Never run the agent as root, even inside a container.
RUN useradd -ms /bin/bash agent
USER agent
WORKDIR /work

# Chrome's setuid sandbox can't nest inside Docker without extra privileges.
ENV ELECTRON_DISABLE_SANDBOX=1
ENV NPM_CONFIG_UPDATE_NOTIFIER=false

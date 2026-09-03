FROM mcr.microsoft.com/devcontainers/javascript-node:20

# Install additional OS packages
RUN apt-get update && export DEBIAN_FRONTEND=noninteractive \
    && apt-get -y install --no-install-recommends postgresql-client redis-tools \
    && apt-get clean && rm -rf /var/lib/apt/lists/*

# Install global node packages (pnpm, nx, medusa v2 cli, ionic)
RUN su node -c "npm install -g pnpm@10.6.1 nx @medusajs/cli @ionic/cli"

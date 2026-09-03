# Goiaba Platform - Nx Monorepo

<a alt="Nx logo" href="https://nx.dev" target="_blank" rel="noreferrer"><img src="https://raw.githubusercontent.com/nrwl/nx/master/images/nx-logo.png" width="45"></a>

✨ This is an [Nx workspace](https://nx.dev) containing the Goiaba e-commerce platform built with Medusa.js ✨.

[Learn more about this workspace setup and its capabilities](https://nx.dev/nx-api/js?utm_source=nx_project&utm_medium=readme&utm_campaign=nx_projects) or run `yarn nx graph` to visually explore what was created.

## Projects

This monorepo contains:

- **medusa-server** - Main Medusa.js e-commerce backend server
  - Custom modules (FCM, Translation, etc.)
  - Local plugins developed with yalc
  - Admin dashboard and API endpoints

- **medusa-mobile** - Customer-facing mobile application (Ionic Angular)
  - Storefront features for customers
  - Shopping cart and checkout
  - User account management

- **medusa-admin-orders** - Admin order management mobile app (Ionic Angular)
  - Order management and fulfillment
  - Real-time notifications (WebSocket/SSE)
  - Shipment tracking and delivery management
  - Mobile-first interface for store staff

## Quick Start

For detailed setup instructions, see [SETUP.md](./SETUP.md).

### Essential Commands

```bash
# Install dependencies
yarn install

# Set up plugins (yalc)
cd apps/medusa-server
yarn plugins:sync

# Run migrations
yarn medusa:migrate

# Start development server
yarn medusa:dev

# Start admin orders app (port 8101)
yarn admin-orders:dev

# Start customer mobile app (port 8100)
yarn mobile:dev
```

## Plugin Development

This project uses **yalc** for local plugin development. Plugins are located in `apps/medusa-server/plugins/` and are linked via yalc for fast iteration.

**Key Commands:**
- `yarn plugins:sync` - Build and sync all plugins
- `yarn plugins:build` - Build all plugins
- `yarn plugins:deploy` - Deploy plugins to yalc

See [SETUP.md](./SETUP.md) for detailed plugin development workflow.

## Project Structure

```
.
├── apps/
│   ├── medusa-server/          # Main Medusa.js backend
│   │   ├── src/                 # Application source code
│   │   ├── plugins/              # Local plugin development
│   │   │   ├── wishlist-plugin/
│   │   │   ├── medusa-documents/
│   │   │   ├── medusa-products-bought-together/
│   │   │   ├── webhooks/
│   │   │   ├── product-reviews/
│   │   │   └── medusa-strapi-plugin/
│   │   ├── .yalc/               # Yalc-linked plugins (auto-generated)
│   │   └── medusa-config.ts    # Medusa configuration
│   ├── medusa-mobile/           # Customer mobile app (Ionic Angular)
│   │   ├── src/                 # Customer-facing features
│   │   └── ...
│   └── medusa-admin-orders/     # Admin order management app (Ionic Angular)
│       ├── src/                 # Admin order management features
│       ├── .context/            # Planning and documentation
│       └── ...
├── packages/                    # Shared libraries
└── package.json                 # Workspace root
```

## Generate a library

```sh
yarn nx g @nx/js:lib packages/pkg1 --publishable --importPath=@my-org/pkg1
```

## Run tasks

To build the library use:

```sh
yarn nx build pkg1
```

To run any task with Nx use:

```sh
yarn nx <target> <project-name>
```

These targets are either [inferred automatically](https://nx.dev/concepts/inferred-tasks?utm_source=nx_project&utm_medium=readme&utm_campaign=nx_projects) or defined in the `project.json` or `package.json` files.

[More about running tasks in the docs &raquo;](https://nx.dev/features/run-tasks?utm_source=nx_project&utm_medium=readme&utm_campaign=nx_projects)

## Versioning and releasing

To version and release the library use

```
yarn nx release
```

Pass `--dry-run` to see what would happen without actually releasing the library.

[Learn more about Nx release &raquo;](https://nx.dev/features/manage-releases?utm_source=nx_project&utm_medium=readme&utm_campaign=nx_projects)

## Keep TypeScript project references up to date

Nx automatically updates TypeScript [project references](https://www.typescriptlang.org/docs/handbook/project-references.html) in `tsconfig.json` files to ensure they remain accurate based on your project dependencies (`import` or `require` statements). This sync is automatically done when running tasks such as `build` or `typecheck`, which require updated references to function correctly.

To manually trigger the process to sync the project graph dependencies information to the TypeScript project references, run the following command:

```sh
yarn nx sync
```

You can enforce that the TypeScript project references are always in the correct state when running in CI by adding a step to your CI job configuration that runs the following command:

```sh
yarn nx sync:check
```

[Learn more about nx sync](https://nx.dev/reference/nx-commands#sync)

## Nx Cloud

Nx Cloud ensures a [fast and scalable CI](https://nx.dev/ci/intro/why-nx-cloud?utm_source=nx_project&utm_medium=readme&utm_campaign=nx_projects) pipeline. It includes features such as:

- [Remote caching](https://nx.dev/ci/features/remote-cache?utm_source=nx_project&utm_medium=readme&utm_campaign=nx_projects)
- [Task distribution across multiple machines](https://nx.dev/ci/features/distribute-task-execution?utm_source=nx_project&utm_medium=readme&utm_campaign=nx_projects)
- [Automated e2e test splitting](https://nx.dev/ci/features/split-e2e-tasks?utm_source=nx_project&utm_medium=readme&utm_campaign=nx_projects)
- [Task flakiness detection and rerunning](https://nx.dev/ci/features/flaky-tasks?utm_source=nx_project&utm_medium=readme&utm_campaign=nx_projects)

### Set up CI (non-Github Actions CI)

**Note:** This is only required if your CI provider is not GitHub Actions.

Use the following command to configure a CI workflow for your workspace:

```sh
yarn nx g ci-workflow
```

[Learn more about Nx on CI](https://nx.dev/ci/intro/ci-with-nx#ready-get-started-with-your-provider?utm_source=nx_project&utm_medium=readme&utm_campaign=nx_projects)

## Install Nx Console

Nx Console is an editor extension that enriches your developer experience. It lets you run tasks, generate code, and improves code autocompletion in your IDE. It is available for VSCode and IntelliJ.

[Install Nx Console &raquo;](https://nx.dev/getting-started/editor-setup?utm_source=nx_project&utm_medium=readme&utm_campaign=nx_projects)

## Documentation

- **[SETUP.md](./SETUP.md)** - Complete setup guide for Medusa server, plugins, and development workflow
- **[README.md](./README.md)** - This file (workspace overview)

## Technology Stack

- **Nx** - Monorepo tooling and build system
- **Medusa.js v2** - E-commerce backend framework
- **TypeScript** - Type-safe development
- **Yalc** - Local package linking for plugin development
- **PostgreSQL** - Database
- **Redis** - Caching and job queue

## Useful links

Learn more:

- [Medusa.js Documentation](https://docs.medusajs.com)
- [Nx Documentation](https://nx.dev)
- [Learn more about this workspace setup](https://nx.dev/nx-api/js?utm_source=nx_project&utm_medium=readme&utm_campaign=nx_projects)
- [Learn about Nx on CI](https://nx.dev/ci/intro/ci-with-nx?utm_source=nx_project&utm_medium=readme&utm_campaign=nx_projects)
- [Releasing Packages with Nx release](https://nx.dev/features/manage-releases?utm_source=nx_project&utm_medium=readme&utm_campaign=nx_projects)

And join the communities:

- [Nx Discord](https://go.nx.dev/community)
- [Medusa Discord](https://discord.gg/medusajs)
- [Follow Nx on X](https://twitter.com/nxdevtools) or [LinkedIn](https://www.linkedin.com/company/nrwl)

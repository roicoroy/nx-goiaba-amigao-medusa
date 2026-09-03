# Goiaba Platform - Nx Monorepo

<a alt="Nx logo" href="https://nx.dev" target="_blank" rel="noreferrer"><img src="https://raw.githubusercontent.com/nrwl/nx/master/images/nx-logo.png" width="45"></a>

✨ This is an [Nx workspace](https://nx.dev) containing the Goiaba e-commerce platform built with **Medusa.js v2**, **Ionic Angular**, and **Docker** ✨.

---

## Workspace Projects

This monorepo manages:

- **`medusa-server`** (port `9000` / Admin UI: `http://localhost:9000/app`)
  - Medusa.js v2 e-commerce backend.
  - **Plugins**: Wishlist (`wishlist-plugin`), Product Reviews (`@blegaut/medusa-product-reviews-enhanced`), Documents / PDF generation (`medusa-documents`), Products Bought Together (`@rsc-labs/medusa-products-bought-together-v2`), Webhooks (`@lambdacurry/medusa-webhooks`).
  - **Custom Modules**: FCM (Firebase Cloud Messaging), Nodemailer notification provider, Local notifications, Cloudinary file service, ShipStation fulfillment, Store Analytics, Translation.
- **`medusa-mobile`** (port `8100`)
  - Customer-facing mobile and web application built with Ionic Angular and Capacitor.
  - Catalog browsing, shopping cart, checkout, account management.
- **`medusa-admin-orders`** (port `8101`)
  - Admin & store staff order fulfillment mobile application (Ionic Angular + Capacitor).
  - Live order updates, barcode/shipment handling, WebSocket notifications.

---

## Quick Start

### 1. Prerequisites
- **Node.js**: `v20+`
- **pnpm**: `v10.6+`
- **Docker & Docker Compose** (for PostgreSQL & Redis)

### 2. Start Infrastructure (PostgreSQL & Redis)

```bash
pnpm docker:up
```

### 3. Install Dependencies & Build Plugins

```bash
pnpm install
pnpm -r --filter="./apps/medusa-server/plugins/*" run build
```

### 4. Database Setup & Seed

```bash
# Run database schema migrations
pnpm medusa:migrate

# Seed sample data (products, regions, shipping options, inventory)
pnpm medusa:seed

# (Optional) Create an admin user
pnpm medusa user --email your-email@example.com --password your-password
```

### 5. Run Development Servers

```bash
# Start Medusa backend (port 9000)
pnpm medusa:dev

# Start customer mobile app (port 8100)
pnpm mobile:dev

# Start admin order management app (port 8101)
pnpm admin-orders:dev
```

---

## Available Scripts

### 🐳 Docker & Infrastructure
| Command | Description |
| :--- | :--- |
| `pnpm docker:up` | Starts PostgreSQL (port `5432`) and Redis (port `6379`) containers |
| `pnpm docker:down` | Stops and removes docker containers |
| `pnpm docker:logs` | Streams container logs |

### 🛍️ Medusa Server (`apps/medusa-server`)
| Command | Description |
| :--- | :--- |
| `pnpm medusa:dev` | Starts the Medusa backend dev server on `http://localhost:9000` |
| `pnpm medusa:build` | Compiles the Medusa server |
| `pnpm medusa:start` | Starts the production Medusa build |
| `pnpm medusa:migrate` | Runs database schema migrations |
| `pnpm medusa:seed` | Seeds store, regions, products, and inventory data |
| `pnpm medusa:create-admin`| Creates default admin user |
| `pnpm medusa:test` | Runs Medusa server test suites |
| `pnpm medusa:typecheck` | Validates TypeScript types across the server |

### 📱 Customer Mobile App (`apps/medusa-mobile`)
| Command | Description |
| :--- | :--- |
| `pnpm mobile:dev` | Runs Ionic dev server on `http://localhost:8100` |
| `pnpm mobile:build` | Builds production web bundle |
| `pnpm mobile:test` | Runs Angular unit tests with Jest |
| `pnpm mobile:lint` | Lints mobile app source code |
| `pnpm mobile:cap:sync` | Syncs web assets to Capacitor native projects |
| `pnpm mobile:cap:ios` | Opens iOS project in Xcode |
| `pnpm mobile:cap:android` | Opens Android project in Android Studio |
| `pnpm mobile:cap:run:ios` | Builds and runs on iOS simulator |
| `pnpm mobile:cap:run:android` | Builds and runs on Android emulator |
| `pnpm mobile:assets:generate` | Generates Capacitor splash screens & icons |

### 📦 Admin Orders App (`apps/medusa-admin-orders`)
| Command | Description |
| :--- | :--- |
| `pnpm admin-orders:dev` | Runs admin orders Ionic dev server on `http://localhost:8101` |
| `pnpm admin-orders:build`| Builds admin orders web bundle |
| `pnpm admin-orders:test` | Runs test suite |
| `pnpm admin-orders:lint` | Lints admin orders source code |
| `pnpm admin-orders:cap:sync` | Syncs assets to Capacitor native projects |

### ⚡ Monorepo Utilities (Nx)
| Command | Description |
| :--- | :--- |
| `pnpm build:all` | Builds all apps across the workspace |
| `pnpm lint:all` | Lints all apps and plugins |
| `pnpm test:all` | Runs tests across all projects |
| `npx nx graph` | Opens interactive dependency and project graph |

---

## Workspace Structure

```
.
├── apps/
│   ├── medusa-server/          # Medusa.js v2 backend & Admin UI
│   │   ├── src/
│   │   │   ├── api/            # Custom API endpoints (admin, store, hooks)
│   │   │   ├── modules/        # Custom modules (FCM, Cloudinary, ShipStation, Analytics)
│   │   │   ├── scripts/        # Data scripts (seed.ts, data migrations)
│   │   │   └── subscribers/    # Event subscribers (order-created, product-created)
│   │   ├── plugins/            # In-workspace plugins
│   │   │   ├── wishlist-plugin/
│   │   │   ├── medusa-documents/
│   │   │   ├── medusa-products-bought-together/
│   │   │   ├── webhooks/
│   │   │   └── product-reviews/
│   │   └── medusa-config.ts    # Medusa configuration
│   ├── medusa-mobile/          # Customer mobile app (Ionic Angular + Capacitor)
│   └── medusa-admin-orders/    # Store operations & orders app (Ionic Angular + Capacitor)
├── docker-compose.yml          # PostgreSQL & Redis container orchestration
├── .devcontainer/              # VSCode Remote Container configuration
├── nx.json                     # Nx configuration
└── package.json                # Monorepo root dependencies & script shortcuts
```

---

## Tech Stack

- **Monorepo Engine**: [Nx](https://nx.dev)
- **Package Manager**: [pnpm](https://pnpm.io) (v10+)
- **E-Commerce Framework**: [Medusa.js v2](https://docs.medusajs.com) (v2.12.3)
- **Mobile Frontend Framework**: [Ionic](https://ionicframework.com) + [Angular](https://angular.dev)
- **Native Runtime**: [Capacitor](https://capacitorjs.com) (v8)
- **Database & Cache**: PostgreSQL 16 + Redis 7

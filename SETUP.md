# Medusa.js Server Setup in Nx Workspace

This document provides instructions for setting up and running the Medusa.js server in this Nx workspace.

## Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js v20+** (LTS versions only) - [Download](https://nodejs.org/en/download)
- **PostgreSQL** - [Download](https://www.postgresql.org/download/)
- **Redis** - [Download](https://redis.io/download)

## Installation Steps

### 1. Install Dependencies

Install all project dependencies:

```bash
yarn install
```

### 2. Set Up Environment Variables

Copy the example environment file and configure it:

```bash
cp apps/medusa-server/env.example apps/medusa-server/.env
```

Edit `apps/medusa-server/.env` with your database and Redis connection details:

```env
DATABASE_URL=postgres://postgres:postgres@localhost:5432/medusa-store
REDIS_URL=redis://localhost:6379
```

**Important:** Generate secure secrets for production:
- `JWT_SECRET` - Use a strong random string
- `COOKIE_SECRET` - Use a strong random string

### 3. Set Up Database

Ensure PostgreSQL is running and create the database:

```bash
# Using psql
createdb medusa-store

# Or using PostgreSQL CLI
psql -U postgres -c "CREATE DATABASE medusa-store;"
```

### 4. Set Up Plugins (Local Development)

This project uses **yalc** for local plugin development. Plugins are located in `apps/medusa-server/plugins/` and are linked via yalc.

#### Install Plugin Dependencies

Each plugin needs its dependencies installed. Navigate to each plugin directory and run:

```bash
# Install dependencies for each plugin (run manually as needed)
cd apps/medusa-server/plugins/wishlist-plugin && yarn install && cd ../..
cd apps/medusa-server/plugins/medusa-documents && yarn install && cd ../..
cd apps/medusa-server/plugins/medusa-products-bought-together && yarn install && cd ../..
cd apps/medusa-server/plugins/webhooks && yarn install && cd ../..
cd apps/medusa-server/plugins/product-reviews && yarn install && cd ../..
cd apps/medusa-server/plugins/medusa-strapi-plugin && yarn install && cd ../..
```

#### Sync Plugins with Yalc

After installing plugin dependencies, sync all plugins with yalc:

```bash
cd apps/medusa-server
yarn plugins:sync
```

This command will:
1. Build all plugins
2. Publish them to yalc's local repository
3. Link them to the main medusa-server project

**Note:** The `.yalc/` directory will be created automatically in `apps/medusa-server/` after running `plugins:sync`.

### 5. Run Database Migrations

Run the Medusa migrations to set up the database schema:

```bash
yarn medusa:migrate
```

Or using Nx directly:

```bash
nx migrate medusa-server
```

**Note:** Plugin migrations are automatically discovered and run by `medusa db:migrate`. No separate plugin migration step is needed.

### 6. Seed the Database (Optional)

Seed the database with initial data:

```bash
yarn medusa:seed
```

Or using Nx:

```bash
nx seed medusa-server
```

**Note:** You can customize the seed script at `apps/medusa-server/src/scripts/seed.ts`

### 7. Create Admin User

Create the admin user with the following credentials:

```bash
yarn medusa:create-admin
```

Or using Nx:

```bash
nx create-admin medusa-server
```

**Default Admin Credentials:**
- Email: `roicoroy@yahoo.com.br`
- Password: `Rwbento123!`

You can modify the admin credentials in `apps/medusa-server/project.json` under the `create-admin` target.

### 8. Start the Development Server

Start the Medusa server in development mode:

```bash
yarn medusa:dev
```

Or using Nx:

```bash
nx serve medusa-server
```

The server will be available at:
- **API Server**: http://localhost:9000
- **Admin Dashboard**: http://localhost:9000/app

## Available Commands

### Development

- `yarn medusa:dev` or `nx serve medusa-server` - Start development server with hot reload
- `yarn medusa:migrate` or `nx run medusa-server:migrate` - Run database migrations
- `yarn medusa:seed` or `nx seed medusa-server` - Seed database with initial data
- `yarn medusa:create-admin` or `nx create-admin medusa-server` - Create admin user

### Plugin Management (Yalc)

- `yarn plugins:sync` - Build, publish, and link all plugins with yalc
- `yarn plugins:build` - Build all plugins
- `yarn plugins:deploy` - Build and publish all plugins to yalc
- `yarn plugins:add` - Add all plugins from yalc to the project
- `yarn plugins:update` - Update all yalc-linked plugins

**Individual Plugin Commands:**
- `yarn wishlist:sync` - Sync wishlist plugin
- `yarn strapi:sync` - Sync strapi plugin
- `yarn wishlist:build` / `yarn strapi:build` - Build individual plugin
- `yarn wishlist:deploy` / `yarn strapi:deploy` - Deploy individual plugin
- `yarn wishlist:update` / `yarn strapi:update` - Update individual plugin

### Production

- `yarn medusa:build` or `nx build medusa-server` - Build the application
- `yarn medusa:start` - Start the production server (after building)

## Quick Setup Summary

For a fresh setup, run these commands in order:

```bash
# 1. Install dependencies
yarn install

# 2. Set up environment variables
cp apps/medusa-server/env.example apps/medusa-server/.env
# Edit .env with your database credentials

# 3. Install plugin dependencies (manual, as needed)
cd apps/medusa-server/plugins/wishlist-plugin && yarn install && cd ../..
# Repeat for other plugins...

# 4. Sync plugins with yalc
cd apps/medusa-server
yarn plugins:sync

# 5. Run migrations (includes plugin migrations)
yarn medusa:migrate

# 6. Seed database (optional)
yarn medusa:seed

# 7. Create admin user
yarn medusa:create-admin

# 8. Start development server
yarn medusa:dev
```

## Project Structure

```
apps/medusa-server/
├── src/
│   ├── scripts/
│   │   └── seed.ts          # Database seed script
│   └── main.ts              # Application entry point (optional)
├── plugins/                 # Local plugin development
│   ├── wishlist-plugin/
│   ├── medusa-documents/
│   ├── medusa-products-bought-together/
│   ├── webhooks/
│   ├── product-reviews/
│   └── medusa-strapi-plugin/
├── .yalc/                   # Yalc-linked plugins (auto-generated)
│   ├── wishlist-plugin/
│   ├── medusa-documents/
│   └── ...
├── medusa-config.ts         # Medusa configuration
├── project.json             # Nx project configuration
├── package.json            # Medusa scripts (for Medusa CLI)
├── tsconfig.json           # TypeScript configuration
├── env.example             # Environment variables template
└── README.md              # Medusa server documentation
```

## Configuration

The main configuration file is `apps/medusa-server/medusa-config.ts`. Key settings include:

- **Database**: PostgreSQL connection via `DATABASE_URL`
- **Redis**: Redis connection via `REDIS_URL`
- **CORS**: Configured for storefront and admin access
- **Admin**: Built-in admin dashboard configuration
- **Modules**: Custom modules can be added here

## Development Workflow

### Main Application

1. Make changes to your code in `apps/medusa-server/src/`
2. The development server will automatically reload on file changes
3. Admin customizations are hot-reloaded without restarting the server

### Plugin Development

1. **Edit plugin source code** in `apps/medusa-server/plugins/<plugin-name>/src/`
2. **Build and sync the plugin:**
   ```bash
   cd apps/medusa-server
   yarn plugins:sync
   ```
   Or for a single plugin:
   ```bash
   yarn wishlist:sync  # or strapi:sync, etc.
   ```
3. **Restart the dev server** if needed (yalc-linked plugins are loaded at startup)
4. **For plugin migrations:** Generate migrations in the plugin directory:
   ```bash
   cd apps/medusa-server/plugins/<plugin-name>
   medusa db:generate <module-name>
   ```
   Then run migrations from the main project:
   ```bash
   cd apps/medusa-server
   yarn medusa:migrate
   ```

**Note:** Plugin source directories (`plugins/**`) are excluded from file watching to prevent "too many open files" errors. Only the main `src/` directory and `.yalc/` linked plugins are watched.

## Troubleshooting

### Database Connection Issues

If you encounter database connection errors:

1. Verify PostgreSQL is running: `pg_isready`
2. Check your `DATABASE_URL` in `.env`
3. Ensure the database exists: `psql -l`

### Redis Connection Issues

If you encounter Redis connection errors:

1. Verify Redis is running: `redis-cli ping`
2. Check your `REDIS_URL` in `.env`

### Port Already in Use

If port 9000 is already in use:

1. Change the `PORT` in your `.env` file
2. Update `MEDUSA_BACKEND_URL` accordingly
3. Update CORS settings if needed

### Plugin Issues

**Missing plugin dependencies:**
- If you see errors about missing packages (e.g., `react-json-view-lite`, `react-player`), install them in the main project:
  ```bash
  cd apps/medusa-server
  yarn add <missing-package>
  ```

**Plugin not found:**
- Ensure plugins are synced with yalc: `yarn plugins:sync`
- Check that `.yalc/` directory exists and contains the plugin

**Plugin migrations not running:**
- Plugin migrations are automatically discovered by `medusa db:migrate`
- If a plugin has new migrations, generate them in the plugin directory first:
  ```bash
  cd apps/medusa-server/plugins/<plugin-name>
  medusa db:generate <module-name>
  ```
- Then run migrations from the main project: `yarn medusa:migrate`

**"Too many open files" error:**
- This is handled by excluding `plugins/**` from file watching
- The dev script uses `CHOKIDAR_IGNORED='plugins/**'` to prevent this

**TypeScript errors with plugin types:**
- Plugin source directories are excluded from TypeScript compilation
- Only the main `src/` directory is compiled
- Plugins are built separately and linked via yalc

## Plugin Architecture

This project uses **yalc** for local plugin development. Plugins are:

1. **Developed locally** in `apps/medusa-server/plugins/`
2. **Built separately** using `medusa plugin:build` in each plugin directory
3. **Published to yalc** using `yalc publish` (via `plugins:deploy` script)
4. **Linked to main project** using `yalc add` (via `plugins:sync` script)
5. **Used at runtime** from `.yalc/` directory

This approach allows:
- Independent plugin development
- Fast iteration without npm publishing
- Type safety and proper module resolution
- Automatic migration discovery

## Next Steps

- [Set up a storefront](https://docs.medusajs.com/resources/nextjs-starter)
- [Configure custom modules](https://docs.medusajs.com/learn/fundamentals/modules)
- [Add plugins](https://docs.medusajs.com/learn/fundamentals/plugins)
- [Deploy to production](https://docs.medusajs.com/learn/deployment)

## Resources

- [Medusa.js Documentation](https://docs.medusajs.com)
- [Medusa.js Installation Guide](https://docs.medusajs.com/learn/installation)
- [Nx Documentation](https://nx.dev)

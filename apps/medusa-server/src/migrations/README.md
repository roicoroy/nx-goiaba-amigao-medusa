# Database Migrations

This folder contains TypeScript migrations for Medusa v2.

## Available Migrations

### Migration20241120000000.ts
Extends the admin user table with additional fields for the role-based staff system:
- `avatar_url` - Cloudinary URL for user avatar
- `phone` - Contact phone number
- `role` - User role (admin, manager, warehouse-staff, driver)
- `metadata` - Flexible JSONB field for additional data

## Running Migrations

### Run all pending migrations
```bash
npx medusa db:migrate
```

### Check migration status
```bash
npx medusa db:migrate --list
```

### Rollback last migration
```bash
npx medusa db:rollback
```

## Creating New Migrations

Medusa v2 uses MikroORM for migrations. To create a new migration:

```bash
npx medusa migrations create YourMigrationName
```

This will generate a new migration file with a timestamp.

## Migration Structure

```typescript
import { Migration } from "@mikro-orm/migrations"

export class MigrationYYYYMMDDHHMMSS extends Migration {
  async up(): Promise<void> {
    // Add your schema changes here
    this.addSql(`
      ALTER TABLE "table_name" 
      ADD COLUMN "column_name" VARCHAR(255);
    `)
  }

  async down(): Promise<void> {
    // Revert your schema changes here
    this.addSql(`
      ALTER TABLE "table_name" 
      DROP COLUMN "column_name";
    `)
  }
}
```

## Best Practices

1. **Always include a down() method** - Allows reverting migrations
2. **Use IF NOT EXISTS** - Makes migrations idempotent
3. **Add comments** - Document what the migration does
4. **Test locally first** - Run migrations on dev before production
5. **Keep migrations small** - One logical change per migration

## Troubleshooting

### Migration already applied
If you see "Migration already applied", it means the migration has already run. Check with:
```bash
npx medusa migrations list
```

### Migration failed
If a migration fails:
1. Check the error message
2. Fix the migration file
3. Revert if needed: `npx medusa migrations revert`
4. Run again: `npx medusa migrations run`

### Manual SQL execution
If you prefer to run SQL directly:
```bash
psql $DATABASE_URL -f migrations/extend-admin-user-fields.sql
```

## Related Files

- `migrations/extend-admin-user-fields.sql` - Alternative SQL version
- `medusa-config.ts` - Database configuration
- `.env` - Database connection string

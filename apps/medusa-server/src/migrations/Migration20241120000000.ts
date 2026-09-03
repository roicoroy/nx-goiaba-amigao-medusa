import { Migration } from "@mikro-orm/migrations"

/**
 * Migration: Extend admin user table with additional fields
 * 
 * Adds the following columns to the user table:
 * - avatar_url: Cloudinary URL for user avatar
 * - phone: Contact phone number
 * - role: User role (admin, manager, warehouse-staff, driver)
 * - metadata: Flexible JSONB field for additional data
 */
export class Migration20241120000000 extends Migration {
  async up(): Promise<void> {
    // Add avatar_url column
    this.addSql(`
      ALTER TABLE "user" 
      ADD COLUMN IF NOT EXISTS "avatar_url" VARCHAR(500);
    `)

    // Add phone column
    this.addSql(`
      ALTER TABLE "user" 
      ADD COLUMN IF NOT EXISTS "phone" VARCHAR(50);
    `)

    // Add role column with default value
    this.addSql(`
      ALTER TABLE "user" 
      ADD COLUMN IF NOT EXISTS "role" VARCHAR(50) DEFAULT 'admin';
    `)

    // Add metadata column
    this.addSql(`
      ALTER TABLE "user" 
      ADD COLUMN IF NOT EXISTS "metadata" JSONB DEFAULT '{}';
    `)

    // Create index on role for faster queries
    this.addSql(`
      CREATE INDEX IF NOT EXISTS "idx_user_role" ON "user" ("role");
    `)

    // Add comments for documentation
    this.addSql(`
      COMMENT ON COLUMN "user"."avatar_url" IS 'Cloudinary URL for user avatar image';
    `)
    
    this.addSql(`
      COMMENT ON COLUMN "user"."phone" IS 'Contact phone number for the user';
    `)
    
    this.addSql(`
      COMMENT ON COLUMN "user"."role" IS 'User role: admin, manager, warehouse-staff, or driver';
    `)
    
    this.addSql(`
      COMMENT ON COLUMN "user"."metadata" IS 'Additional flexible metadata for user';
    `)
  }

  async down(): Promise<void> {
    // Drop index
    this.addSql(`
      DROP INDEX IF EXISTS "idx_user_role";
    `)

    // Remove columns
    this.addSql(`
      ALTER TABLE "user" 
      DROP COLUMN IF EXISTS "avatar_url",
      DROP COLUMN IF EXISTS "phone",
      DROP COLUMN IF EXISTS "role",
      DROP COLUMN IF EXISTS "metadata";
    `)
  }
}

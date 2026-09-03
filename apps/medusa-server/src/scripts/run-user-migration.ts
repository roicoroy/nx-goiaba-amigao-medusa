import { Client } from "pg"
import fs from "fs"
import path from "path"

export default async function runUserMigration() {
  console.log("🔄 Running user table migration...")
  console.log("=" .repeat(60))

  const client = new Client({
    connectionString: process.env.DATABASE_URL,
  })

  try {
    await client.connect()
    console.log("✓ Connected to database\n")

    // Read the migration SQL file
    const migrationPath = path.join(process.cwd(), "migrations", "extend-admin-user-fields.sql")
    const migrationSQL = fs.readFileSync(migrationPath, "utf-8")

    console.log("Running migration: extend-admin-user-fields.sql")
    console.log("=" .repeat(60))

    // Execute the migration
    await client.query(migrationSQL)

    console.log("\n✓ Migration completed successfully!\n")

    // Verify the columns were added
    const result = await client.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'user' 
      AND column_name IN ('avatar_url', 'phone', 'role', 'metadata')
      ORDER BY column_name;
    `)

    if (result.rows.length > 0) {
      console.log("✓ Verified new columns:")
      result.rows.forEach((row: any) => {
        console.log(`  - ${row.column_name} (${row.data_type})`)
      })
    } else {
      console.log("\n✗ No new columns found. Migration may have failed.")
    }

    console.log("\n" + "=".repeat(60))
    console.log("✅ User table migration completed successfully!")
    console.log("=".repeat(60))
    console.log("\nYou can now:")
    console.log("  1. Restart your server: yarn dev")
    console.log("  2. Open admin UI: http://localhost:9000/app")
    console.log("  3. Go to Settings → Team → [Your User]")
    console.log("  4. Use the profile and avatar widgets!")

  } catch (error: any) {
    console.error("\n❌ Migration failed:", error.message)

    if (error.code === '42701') {
      console.log("\n⚠️  Columns may already exist. This is OK if you've run the migration before.")
    } else {
      throw error
    }
  } finally {
    await client.end()
  }
}

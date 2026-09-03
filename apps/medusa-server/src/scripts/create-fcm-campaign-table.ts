import { ExecArgs } from "@medusajs/framework/types"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"

export default async function createFcmCampaignTable({ container }: ExecArgs) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)
  
  // Try multiple ways to access the database connection
  let connection: any = null
  
  // Method 1: Try query service
  try {
    const query = container.resolve(ContainerRegistrationKeys.QUERY)
    connection = (query as any).manager_ || (query as any).manager || (query as any).__manager
    if (connection && (connection.query || connection.execute || connection.getConnection)) {
      await executeQueries(connection, logger)
      return
    }
  } catch (e) {
    logger.info("Method 1 failed, trying alternative...")
  }
  
  // Method 2: Try resolving manager directly
  try {
    connection = container.resolve("manager")
    if (connection) {
      await executeQueries(connection, logger)
      return
    }
  } catch (e) {
    logger.info("Method 2 failed, trying alternative...")
  }
  
  // Method 3: Try MikroORM connection
  try {
    const { MikroORM } = await import("@mikro-orm/core")
    // This might not work, but worth trying
  } catch (e) {
    // Ignore
  }
  
  logger.error("Could not access database connection")
  logger.error("Please run the SQL manually:")
  logger.error(`
CREATE TABLE IF NOT EXISTS "fcm_campaign" (
  "id" text not null,
  "title" text not null,
  "body" text not null,
  "data" jsonb null,
  "send_to_all" boolean not null,
  "device_ids" jsonb null,
  "device_count" integer not null,
  "success_count" integer not null,
  "failed_count" integer not null,
  "results" jsonb null,
  "sent_by" text null,
  "created_at" timestamptz not null default now(),
  "updated_at" timestamptz not null default now(),
  "deleted_at" timestamptz null,
  constraint "fcm_campaign_pkey" primary key ("id")
);

CREATE INDEX IF NOT EXISTS "IDX_fcm_campaign_deleted_at" ON "fcm_campaign" ("deleted_at") WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS "IDX_fcm_campaign_created_at" ON "fcm_campaign" ("created_at") WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS "IDX_fcm_campaign_sent_by" ON "fcm_campaign" ("sent_by") WHERE deleted_at IS NULL;
  `)
  
  throw new Error("Could not access database connection. Please run the SQL manually (see above).")
}

async function executeQueries(manager: any, logger: any) {
  const queries = [
    {
      sql: `create table if not exists "fcm_campaign" ("id" text not null, "title" text not null, "body" text not null, "data" jsonb null, "send_to_all" boolean not null, "device_ids" jsonb null, "device_count" integer not null, "success_count" integer not null, "failed_count" integer not null, "results" jsonb null, "sent_by" text null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "fcm_campaign_pkey" primary key ("id"));`,
      description: "Create fcm_campaign table"
    },
    {
      sql: `CREATE INDEX IF NOT EXISTS "IDX_fcm_campaign_deleted_at" ON "fcm_campaign" ("deleted_at") WHERE deleted_at IS NULL;`,
      description: "Create deleted_at index"
    },
    {
      sql: `CREATE INDEX IF NOT EXISTS "IDX_fcm_campaign_created_at" ON "fcm_campaign" ("created_at") WHERE deleted_at IS NULL;`,
      description: "Create created_at index"
    },
    {
      sql: `CREATE INDEX IF NOT EXISTS "IDX_fcm_campaign_sent_by" ON "fcm_campaign" ("sent_by") WHERE deleted_at IS NULL;`,
      description: "Create sent_by index"
    },
  ]

  for (const { sql, description } of queries) {
    try {
      // Try different methods based on what's available
      if (typeof manager.query === 'function') {
        await manager.query(sql)
      } else if (typeof manager.execute === 'function') {
        await manager.execute(sql)
      } else if (typeof manager.raw === 'function') {
        await manager.raw(sql)
      } else if (manager.getConnection && typeof manager.getConnection().query === 'function') {
        await manager.getConnection().query(sql)
      } else {
        throw new Error("No suitable query method found on manager")
      }
      logger.info(`✅ ${description}`)
    } catch (error: any) {
      // Ignore errors for "already exists" cases
      const errorMsg = error?.message || String(error)
      if (errorMsg.includes("already exists") || 
          errorMsg.includes("duplicate")) {
        logger.info(`ℹ️  Skipped: ${description} (already exists)`)
      } else {
        logger.error(`❌ Error: ${description}`)
        logger.error(error)
        throw error
      }
    }
  }

  logger.info("\n✅ FCM campaign table created successfully!")
}


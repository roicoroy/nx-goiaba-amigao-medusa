import { ExecArgs } from "@medusajs/framework/types"
// Import from the plugin's source (will be resolved at runtime)
// The module will be available through the container

export default async function createFcmTable({ container }: ExecArgs) {
  // Try to resolve the FCM module service to get access to the manager
  let manager: any
  
  try {
    // Try to resolve FCM_MODULE from container
    const FCM_MODULE = "fcm"
    const fcmService = container.resolve(FCM_MODULE)
    // Access the manager through the service's internal structure
    manager = (fcmService as any).manager_ || (fcmService as any).manager
  } catch (error) {
    console.log("Could not resolve FCM service, trying alternative approach...")
  }
  
  // Alternative: Try to get manager from query service
  if (!manager) {
    try {
      const { ContainerRegistrationKeys } = await import("@medusajs/framework/utils")
      const query = container.resolve(ContainerRegistrationKeys.QUERY)
      manager = (query as any).manager_ || (query as any).manager || (query as any).__manager
    } catch (error) {
      console.error("Could not access database manager through query service")
    }
  }
  
  if (!manager) {
    throw new Error("Could not access database manager. Please ensure the database is running and accessible.")
  }
  
  const queries = [
    `alter table if exists "fcm_device_token" drop constraint if exists "fcm_device_token_token_unique";`,
    `create table if not exists "fcm_device_token" ("id" text not null, "token" text not null, "platform" text check ("platform" in ('ios', 'android', 'web')) not null, "app_version" text null, "device_info" jsonb null, "customer_id" text null, "user_id" text null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "fcm_device_token_pkey" primary key ("id"));`,
    `CREATE INDEX IF NOT EXISTS "IDX_fcm_device_token_deleted_at" ON "fcm_device_token" ("deleted_at") WHERE deleted_at IS NULL;`,
    `CREATE UNIQUE INDEX IF NOT EXISTS "IDX_fcm_device_token_token_unique" ON "fcm_device_token" ("token") WHERE deleted_at IS NULL;`,
    `CREATE INDEX IF NOT EXISTS "IDX_fcm_device_token_customer_id" ON "fcm_device_token" ("customer_id") WHERE deleted_at IS NULL;`,
    `CREATE INDEX IF NOT EXISTS "IDX_fcm_device_token_platform" ON "fcm_device_token" ("platform") WHERE deleted_at IS NULL;`,
  ]

  for (const queryStr of queries) {
    try {
      // Try different methods to execute the query
      if (manager.query) {
        await manager.query(queryStr)
      } else if (manager.execute) {
        await manager.execute(queryStr)
      } else if (manager.raw) {
        await manager.raw(queryStr)
      } else {
        throw new Error("Manager does not have query, execute, or raw methods")
      }
      console.log(`✅ Executed: ${queryStr.substring(0, 60)}...`)
    } catch (error: any) {
      // Ignore errors for "already exists" cases
      if (error?.message?.includes("already exists") || error?.message?.includes("duplicate") || error?.message?.includes("does not exist")) {
        console.log(`ℹ️  Skipped: ${queryStr.substring(0, 60)}...`)
      } else {
        console.error(`❌ Error executing query: ${queryStr}`)
        console.error(error)
        throw error
      }
    }
  }

  console.log("\n✅ FCM device token table created successfully!")
}


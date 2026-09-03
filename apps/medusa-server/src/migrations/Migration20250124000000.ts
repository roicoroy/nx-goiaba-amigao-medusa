import { Migration } from "@mikro-orm/migrations"

/**
 * Migration: Register order.created webhook subscription
 * 
 * This migration inserts a webhook subscription for order.created events
 * that points to the internal webhook receiver endpoint.
 * 
 * The webhook_subscriptions table is created by the @lambdacurry/medusa-webhooks plugin.
 * This migration assumes the plugin's migrations have already run.
 * 
 * IMPORTANT: Make sure to run the webhook plugin migrations first:
 *   yarn medusa db:migrate
 */
export class Migration20250124000000 extends Migration {
  async up(): Promise<void> {
    // Check if webhook_subscriptions table exists (created by plugin migrations)
    // If it doesn't exist, this migration will be skipped
    this.addSql(`
      DO $$
      BEGIN
        -- Only insert if table exists and webhook doesn't already exist
        IF EXISTS (
          SELECT 1 FROM information_schema.tables 
          WHERE table_name = 'webhook_subscriptions'
        ) THEN
          -- Insert webhook subscription if it doesn't already exist
          INSERT INTO webhook_subscriptions (event_name, url, is_active, created_at, updated_at)
          SELECT 
            'order.created',
            'http://localhost:9000/store/webhooks/order-created',
            true,
            NOW(),
            NOW()
          WHERE NOT EXISTS (
            SELECT 1 FROM webhook_subscriptions
            WHERE event_name = 'order.created'
              AND url = 'http://localhost:9000/store/webhooks/order-created'
          );
        END IF;
      END $$;
    `)

    // Note: For production, update the URL to your production server URL
    // You can modify this migration or create environment-specific migrations
  }

  async down(): Promise<void> {
    // Remove the webhook subscription
    this.addSql(`
      DELETE FROM webhook_subscriptions
      WHERE event_name = 'order.created'
        AND url = 'http://localhost:9000/store/webhooks/order-created';
    `)
  }
}


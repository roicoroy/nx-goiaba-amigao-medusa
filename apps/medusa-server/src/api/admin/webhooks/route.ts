import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { Client } from "pg";

/**
 * GET /admin/webhooks - List all webhook subscriptions
 * 
 * Authentication is handled by the middleware in middlewares.ts
 */
export const GET = async (req: MedusaRequest, res: MedusaResponse) => {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    await client.connect();

    // Query the webhook_subscriptions table (created by the plugin)
    const result = await client.query(`
      SELECT 
        id, event_name, url, is_active, 
        created_at, updated_at
      FROM webhook_subscriptions
      ORDER BY created_at DESC
    `);

    return res.status(200).json({
      success: true,
      webhooks: result.rows,
      count: result.rows.length,
    });
  } catch (error: any) {
    // If table doesn't exist, return empty array
    if (error.message?.includes("does not exist")) {
      return res.status(200).json({
        success: true,
        webhooks: [],
        count: 0,
        message: "Webhook subscriptions table not found. Run migrations first.",
      });
    }

    console.error("Error fetching webhooks:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch webhooks",
    });
  } finally {
    await client.end();
  }
};

/**
 * POST /admin/webhooks - Create a new webhook subscription
 * 
 * Request body:
 * {
 *   "event_name": "order.created",
 *   "url": "http://your-medusa-server/store/webhooks/order-created",
 *   "is_active": true
 * }
 */
export const POST = async (req: MedusaRequest, res: MedusaResponse) => {
  // Authentication is handled by the middleware in middlewares.ts
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    const { event_name, url, is_active = true } = req.body as {
      event_name?: string;
      url?: string;
      is_active?: boolean;
    };

    // Validate required fields
    if (!event_name || !url) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields: event_name and url are required",
      });
    }

    // Validate URL format
    try {
      new URL(url);
    } catch {
      return res.status(400).json({
        success: false,
        message: "Invalid URL format",
      });
    }

    // Validate event_name is in the configured subscriptions
    const allowedEvents = ["product.created", "product.updated", "order.created"];
    if (!allowedEvents.includes(event_name)) {
      return res.status(400).json({
        success: false,
        message: `Invalid event_name. Allowed events: ${allowedEvents.join(", ")}`,
      });
    }

    await client.connect();

    // Insert webhook subscription
    const result = await client.query(
      `
      INSERT INTO webhook_subscriptions (event_name, url, is_active, created_at, updated_at)
      VALUES ($1, $2, $3, NOW(), NOW())
      RETURNING id, event_name, url, is_active, created_at, updated_at
    `,
      [event_name, url, is_active]
    );

    return res.status(201).json({
      success: true,
      webhook: result.rows[0],
      message: "Webhook subscription created successfully",
    });
  } catch (error: any) {
    // Handle duplicate URL for same event
    if (error.message?.includes("duplicate") || error.code === "23505") {
      return res.status(409).json({
        success: false,
        message: "A webhook subscription for this event and URL already exists",
      });
    }

    // If table doesn't exist
    if (error.message?.includes("does not exist")) {
      return res.status(500).json({
        success: false,
        message: "Webhook subscriptions table not found. Please run: yarn medusa db:migrate",
      });
    }

    console.error("Error creating webhook:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to create webhook subscription",
    });
  } finally {
    await client.end();
  }
};


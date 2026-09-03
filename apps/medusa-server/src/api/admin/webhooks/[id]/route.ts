import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { Client } from "pg";

/**
 * PATCH /admin/webhooks/:id - Update a webhook subscription
 */
export const PATCH = async (req: MedusaRequest, res: MedusaResponse) => {
  // Authentication is handled by the middleware in middlewares.ts
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    const { id } = req.params;
    const { url, is_active } = req.body as {
      url?: string;
      is_active?: boolean;
    };

    if (!id) {
      return res.status(400).json({
        success: false,
        message: "Webhook ID is required",
      });
    }

    await client.connect();

    // Build update query dynamically
    const updates: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    if (url !== undefined) {
      // Validate URL format
      try {
        new URL(url);
      } catch {
        return res.status(400).json({
          success: false,
          message: "Invalid URL format",
        });
      }
      updates.push(`url = $${paramIndex++}`);
      values.push(url);
    }

    if (is_active !== undefined) {
      updates.push(`is_active = $${paramIndex++}`);
      values.push(is_active);
    }

    if (updates.length === 0) {
      return res.status(400).json({
        success: false,
        message: "No fields to update",
      });
    }

    updates.push(`updated_at = NOW()`);
    values.push(id);

    const result = await client.query(
      `
      UPDATE webhook_subscriptions
      SET ${updates.join(", ")}
      WHERE id = $${paramIndex}
      RETURNING id, event_name, url, is_active, created_at, updated_at
    `,
      values
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Webhook subscription not found",
      });
    }

    return res.status(200).json({
      success: true,
      webhook: result.rows[0],
      message: "Webhook subscription updated successfully",
    });
  } catch (error: any) {
    console.error("Error updating webhook:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to update webhook subscription",
    });
  } finally {
    await client.end();
  }
};

/**
 * DELETE /admin/webhooks/:id - Delete a webhook subscription
 */
export const DELETE = async (req: MedusaRequest, res: MedusaResponse) => {
  // Authentication is handled by the middleware in middlewares.ts
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: "Webhook ID is required",
      });
    }

    await client.connect();

    const result = await client.query(
      `
      DELETE FROM webhook_subscriptions
      WHERE id = $1
      RETURNING id, event_name, url
    `,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Webhook subscription not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Webhook subscription deleted successfully",
      deleted: result.rows[0],
    });
  } catch (error: any) {
    console.error("Error deleting webhook:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to delete webhook subscription",
    });
  } finally {
    await client.end();
  }
};


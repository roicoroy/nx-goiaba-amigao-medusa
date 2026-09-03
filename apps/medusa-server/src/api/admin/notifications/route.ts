import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { getNotifications, markAsRead } from "./storage";

/**
 * GET /admin/notifications
 * 
 * Endpoint for admin clients to poll for new order notifications.
 * Requires admin authentication.
 * 
 * Query parameters:
 * - unreadOnly or unread_only: "true" to get only unread notifications (default: "false")
 * - limit: Maximum number of notifications to return (default: 50)
 */
export async function GET(
  req: MedusaRequest,
  res: MedusaResponse
) {
  const logger = req.scope.resolve("logger");
  
  try {
    // Medusa v2 validates query params strictly and rejects unrecognized fields
    // Access raw query string from the request to bypass validation
    const rawUrl = (req as any).originalUrl || (req as any).url || "";
    const urlMatch = rawUrl.match(/\?([^#]*)/);
    const queryString = urlMatch ? urlMatch[1] : "";
    
    // Parse query string manually
    const params = new URLSearchParams(queryString);
    const unreadOnlyParam = params.get("unreadOnly") || params.get("unread_only") || "false";
    const limitParam = params.get("limit") || "50";
    
    const unreadOnlyBool = unreadOnlyParam === "true";
    const limitNum = parseInt(limitParam, 10);

    const notifications = getNotifications({
      unreadOnly: unreadOnlyBool,
      limit: limitNum,
    });

    res.status(200).json({
      success: true,
      notifications,
      count: notifications.length,
    });
  } catch (error) {
    logger.error("Error fetching notifications:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching notifications",
    });
  }
}

/**
 * PATCH /admin/notifications/:id/read
 * 
 * Mark a notification as read
 * Requires admin authentication.
 */
export async function PATCH(
  req: MedusaRequest,
  res: MedusaResponse
) {
  const logger = req.scope.resolve("logger");
  const { id } = req.params;

  try {
    const notification = markAsRead(id);
    
    if (!notification) {
      return res.status(404).json({
        success: false,
        message: "Notification not found",
      });
    }

    res.status(200).json({
      success: true,
      notification,
    });
  } catch (error) {
    logger.error("Error updating notification:", error);
    res.status(500).json({
      success: false,
      message: "Error updating notification",
    });
  }
}


import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";

// Import shared notification storage
// In production, replace this with a database service
import { createNotification } from "../../../admin/notifications/storage";

/**
 * POST /store/webhooks/order-created
 * 
 * This endpoint receives webhook notifications from the webhook plugin
 * when a new order is created. It stores notifications for the Angular app to poll.
 * 
 * Configure this URL in your webhook plugin settings:
 * http://your-medusa-server/store/webhooks/order-created
 */
export async function POST(
  req: MedusaRequest,
  res: MedusaResponse
) {
  const logger = req.scope.resolve("logger");
  const orderData = req.body as {
    event?: string;
    data?: any;
  };

  try {
    // Validate webhook payload
    if (!orderData || !orderData.data) {
      logger.warn("Invalid webhook payload received");
      return res.status(400).json({
        success: false,
        message: "Invalid webhook payload",
      });
    }

    const order = orderData.data;
    const eventName = orderData.event || "order.created";

    logger.info(`Webhook received: ${eventName} - Order ID: ${order.id}`);

    // Store notification for Angular app to poll and broadcast via WebSocket
    const notification = createNotification({
      type: eventName,
      orderId: order.id,
      orderData: order,
    }, logger);

    logger.info(`Notification stored: ${notification.id}`);

    res.status(200).json({
      success: true,
      message: "Webhook received successfully",
      orderId: order.id,
      notificationId: notification.id,
    });
  } catch (error) {
    logger.error("Error processing webhook:", error);
    res.status(500).json({
      success: false,
      message: "Error processing webhook",
    });
  }
}


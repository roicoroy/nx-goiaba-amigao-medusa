import {
  SubscriberArgs,
  SubscriberConfig,
} from "@medusajs/framework/subscribers";
import {
  fullWebhooksSubscriptionsWorkflow,
} from "@lambdacurry/medusa-webhooks/workflows";
import { createNotification } from "../api/admin/notifications/storage";

export const config: SubscriberConfig = {
  event: ["order.created", "order.placed", "order.completed"],
  context: {
    subscriberId: "order-created-webhook",
  },
};

export default async function handleOrderCreated({
  event: { name, data },
  container,
}: SubscriberArgs<{ id: string }>): Promise<void> {
  const logger = container.resolve("logger");

  logger.info(`[ORDER-CREATED-SUBSCRIBER] Event received: ${name} for order ${data.id}`);

  try {
    const query = container.resolve("query");

    // Fetch order data with all related fields
    const { data: orderResult } = await query.graph({
      entity: "order",
      fields: ["*"],
      filters: { id: data.id },
    });

    const order = orderResult[0];

    if (!order) {
      logger.error(`[ORDER-CREATED-SUBSCRIBER] Order not found: ${data.id}`);
      return;
    }

    logger.info(`[ORDER-CREATED-SUBSCRIBER] Order found: ${order.id}, calling webhook workflow...`);

    // Use the full workflow to get subscriptions and send webhooks
    const result = await fullWebhooksSubscriptionsWorkflow(container).run({
      input: {
        eventName: name,
        eventData: order,
      },
    });

    // Also create notification directly and broadcast via WebSocket
    // This ensures notifications are created even if webhook workflow fails
    try {
      const notification = createNotification({
        type: name,
        orderId: order.id,
        orderData: order,
      }, logger);
      
      logger.info(`[ORDER-CREATED-SUBSCRIBER] Notification created: ${notification.id} and broadcasted via WebSocket`);
    } catch (notifError: any) {
      logger.warn(`[ORDER-CREATED-SUBSCRIBER] Failed to create notification: ${notifError.message}`);
      logger.error(`[ORDER-CREATED-SUBSCRIBER] Notification error stack:`, notifError.stack);
    }

  } catch (error) {
    logger.error(`[ORDER-CREATED-SUBSCRIBER] Error processing webhook for order ${data.id}:`, error);
  }
}


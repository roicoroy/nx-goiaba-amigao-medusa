/**
 * Shared notification storage
 * 
 * In production, replace this in-memory storage with:
 * - Redis for distributed systems
 * - PostgreSQL/MongoDB for persistent storage
 * - A proper notification service
 */

import { getWebSocketService } from "../../../modules/websocket";

export interface Notification {
  id: string;
  type: string;
  orderId: string;
  orderData: any;
  createdAt: Date;
  read: boolean;
}

// In-memory storage (replace with database in production)
const notifications: Notification[] = [];

export function createNotification(data: {
  type: string;
  orderId: string;
  orderData: any;
}, logger?: any): Notification {
  const notification: Notification = {
    id: `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    type: data.type || "order.created",
    orderId: data.orderId,
    orderData: data.orderData,
    createdAt: new Date(),
    read: false,
  };

  notifications.push(notification);

  // Keep only last 1000 notifications (in production, use database)
  if (notifications.length > 1000) {
    notifications.shift();
  }

  // Broadcast notification via WebSocket if server is initialized
  try {
    const webSocketService = getWebSocketService(logger);
    if (webSocketService.isInitialized()) {
      webSocketService.broadcastNotification(notification);
      logger?.info(`📢 Notification broadcasted via WebSocket: ${notification.id} (Order: ${notification.orderId})`);
    } else {
      logger?.warn(`⚠️ WebSocket server not initialized, notification ${notification.id} not broadcasted`);
    }
  } catch (error: any) {
    // WebSocket not available, continue without broadcasting
    logger?.warn?.(`WebSocket service not available for broadcasting: ${error.message}`, error);
  }

  return notification;
}

export function getNotifications(options: {
  unreadOnly?: boolean;
  limit?: number;
} = {}): Notification[] {
  const { unreadOnly = false, limit = 50 } = options;

  let filteredNotifications = [...notifications];

  // Filter unread only if requested
  if (unreadOnly) {
    filteredNotifications = filteredNotifications.filter(n => !n.read);
  }

  // Sort by creation date (newest first) and limit
  return filteredNotifications
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
    .slice(0, limit);
}

export function markAsRead(notificationId: string): Notification | null {
  const notification = notifications.find(n => n.id === notificationId);
  
  if (notification) {
    notification.read = true;
    return notification;
  }

  return null;
}

export function getNotificationById(id: string): Notification | undefined {
  return notifications.find(n => n.id === id);
}


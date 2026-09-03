# Angular Webhook Integration Guide

This guide explains how to integrate your Angular application with Medusa webhooks to receive real-time order notifications.

## Architecture Overview

```
Medusa Server → Webhook Plugin → Webhook Receiver Endpoint → Notification Storage
                                                                    ↓
Angular App ← Polling/WebSocket ← Notifications API
```

## Backend Setup

### Why We Need to Register Webhooks

The `@lambdacurry/medusa-webhooks` plugin works like this:

1. **When an `order.created` event fires**, the subscriber (`order-created.ts`) calls `fullWebhooksSubscriptionsWorkflow`
2. **This workflow queries the `webhook_subscriptions` table** to find which URLs to notify
3. **It sends HTTP POST requests** to all registered URLs

**Without registration, the plugin doesn't know where to send webhooks.** The webhook subscription must be registered in the database before the plugin can deliver notifications to your endpoint.

### 1. Configure Webhook URL

You need to register the webhook URL in the database. There are three ways to do this:

#### Option A: Using the Admin API (Recommended)

Use the admin API endpoint to create a webhook subscription:

```bash
# Replace with your actual Medusa server URL and admin token
curl -X POST http://localhost:9000/admin/webhooks \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -d '{
    "event_name": "order.created",
    "url": "http://your-medusa-server/store/webhooks/order-created",
    "is_active": true
  }'
```

**For local development with ngrok:**
```bash
curl -X POST http://localhost:9000/admin/webhooks \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -d '{
    "event_name": "order.created",
    "url": "https://your-ngrok-url.ngrok.io/store/webhooks/order-created",
    "is_active": true
  }'
```

#### Option B: Database Migration (Recommended for Production)

Use a database migration to automatically register the webhook. This is the best approach for production deployments:

```bash
# The migration will automatically register the webhook
yarn medusa db:migrate
```

See `src/migrations/Migration20250124000000.ts` for the migration that registers the webhook subscription. This approach:
- ✅ No authentication required
- ✅ Version controlled
- ✅ Automatic setup in all environments
- ✅ Part of your standard deployment process

#### Option C: Direct Database Insert

If you prefer to insert directly into the database:

```sql
INSERT INTO webhook_subscriptions (event_name, url, is_active, created_at, updated_at)
VALUES (
  'order.created',
  'http://your-medusa-server/store/webhooks/order-created',
  true,
  NOW(),
  NOW()
);
```

#### Option D: Register from Angular App

You can also register webhooks programmatically from your Angular application using the admin API:

```typescript
// In your Angular service
registerWebhook(webhookUrl: string, adminToken: string): Observable<any> {
  return this.http.post(
    `${this.medusaApiUrl}/admin/webhooks`,
    {
      event_name: 'order.created',
      url: webhookUrl,
      is_active: true
    },
    {
      headers: {
        'Authorization': `Bearer ${adminToken}`,
        'Content-Type': 'application/json'
      }
    }
  );
}
```

**Note:** This requires an admin authentication token. For most use cases, the migration approach (Option B) is recommended. However, registering from Angular can be useful if you need to:
- Dynamically configure webhook URLs based on user preferences
- Allow admins to manage webhooks through your Angular admin interface
- Set up webhooks for different environments programmatically

See the `NotificationService` example below for a complete implementation.

#### Verify Webhook Registration

Check if your webhook is registered:

```bash
curl -X GET http://localhost:9000/admin/webhooks \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```

#### Update or Delete Webhooks

**Update a webhook:**
```bash
curl -X PATCH http://localhost:9000/admin/webhooks/WEBHOOK_ID \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -d '{
    "is_active": false
  }'
```

**Delete a webhook:**
```bash
curl -X DELETE http://localhost:9000/admin/webhooks/WEBHOOK_ID \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```

### 2. API Endpoints Available

**Admin Endpoints** (require admin authentication):
- `GET /admin/notifications` - Get notifications (for polling)
- `PATCH /admin/notifications/:id/read` - Mark notification as read
- `POST /admin/websocket/init` - Initialize WebSocket server
- `GET /admin/websocket/status` - Check WebSocket server status

**Store Endpoints** (for webhook receiver):
- `POST /store/webhooks/order-created` - Receive webhook notifications (public endpoint)

## Angular Implementation

### Option 1: Polling (Simple)

Use this approach for simple use cases where real-time updates aren't critical.

#### 1. Create Notification Service

```typescript
// src/app/services/notification.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, interval } from 'rxjs';
import { switchMap, startWith } from 'rxjs/operators';
import { environment } from '../../environments/environment';

export interface Notification {
  id: string;
  type: string;
  orderId: string;
  orderData: any;
  createdAt: string;
  read: boolean;
}

export interface NotificationsResponse {
  success: boolean;
  notifications: Notification[];
  count: number;
}

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  private apiUrl = `${environment.medusaApiUrl}/store/notifications`;

  constructor(private http: HttpClient) {}

  /**
   * Get all notifications
   */
  getNotifications(unreadOnly: boolean = false, limit: number = 50): Observable<NotificationsResponse> {
    const params: any = { limit: limit.toString() };
    if (unreadOnly) {
      params.unreadOnly = 'true';
    }
    return this.http.get<NotificationsResponse>(this.apiUrl, { params });
  }

  /**
   * Poll for new notifications every X seconds
   */
  pollNotifications(intervalSeconds: number = 5, unreadOnly: boolean = true): Observable<NotificationsResponse> {
    return interval(intervalSeconds * 1000).pipe(
      startWith(0), // Start immediately
      switchMap(() => this.getNotifications(unreadOnly))
    );
  }

  /**
   * Mark a notification as read
   */
  markAsRead(notificationId: string): Observable<any> {
    return this.http.patch(`${this.apiUrl}/${notificationId}/read`, {});
  }

  /**
   * Register a webhook subscription (requires admin token)
   * Use this if you want to register webhooks dynamically from your Angular app
   */
  registerWebhook(webhookUrl: string, adminToken: string): Observable<any> {
    const adminApiUrl = `${environment.medusaApiUrl}/admin/webhooks`;
    return this.http.post(
      adminApiUrl,
      {
        event_name: 'order.created',
        url: webhookUrl,
        is_active: true
      },
      {
        headers: {
          'Authorization': `Bearer ${adminToken}`,
          'Content-Type': 'application/json'
        }
      }
    );
  }

  /**
   * List all registered webhooks (requires admin token)
   */
  listWebhooks(adminToken: string): Observable<any> {
    const adminApiUrl = `${environment.medusaApiUrl}/admin/webhooks`;
    return this.http.get(adminApiUrl, {
      headers: {
        'Authorization': `Bearer ${adminToken}`
      }
    });
  }
}
```

#### 2. Create Notification Component

```typescript
// src/app/components/notification-list/notification-list.component.ts
import { Component, OnInit, OnDestroy } from '@angular/core';
import { NotificationService, Notification } from '../../services/notification.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-notification-list',
  template: `
    <div class="notifications-container">
      <h2>Order Notifications</h2>
      <div *ngIf="loading">Loading...</div>
      <div *ngIf="error" class="error">{{ error }}</div>
      
      <div *ngFor="let notification of notifications" class="notification-item">
        <div class="notification-header">
          <span class="notification-type">{{ notification.type }}</span>
          <span class="notification-time">{{ notification.createdAt | date:'short' }}</span>
          <button 
            *ngIf="!notification.read" 
            (click)="markAsRead(notification.id)"
            class="mark-read-btn">
            Mark as Read
          </button>
        </div>
        <div class="notification-body">
          <p><strong>Order ID:</strong> {{ notification.orderId }}</p>
          <p><strong>Total:</strong> {{ notification.orderData?.total | currency }}</p>
          <p><strong>Customer:</strong> {{ notification.orderData?.email }}</p>
        </div>
      </div>
      
      <div *ngIf="notifications.length === 0 && !loading">
        No new notifications
      </div>
    </div>
  `,
  styles: [`
    .notifications-container {
      padding: 20px;
    }
    .notification-item {
      border: 1px solid #ddd;
      border-radius: 4px;
      padding: 15px;
      margin-bottom: 10px;
      background: #f9f9f9;
    }
    .notification-item.unread {
      background: #e3f2fd;
      border-left: 4px solid #2196f3;
    }
    .notification-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 10px;
    }
    .mark-read-btn {
      padding: 5px 10px;
      background: #4caf50;
      color: white;
      border: none;
      border-radius: 4px;
      cursor: pointer;
    }
    .error {
      color: red;
      padding: 10px;
    }
  `]
})
export class NotificationListComponent implements OnInit, OnDestroy {
  notifications: Notification[] = [];
  loading = false;
  error: string | null = null;
  private subscription?: Subscription;

  constructor(private notificationService: NotificationService) {}

  ngOnInit() {
    // Start polling every 5 seconds for unread notifications
    this.subscription = this.notificationService
      .pollNotifications(5, true)
      .subscribe({
        next: (response) => {
          this.notifications = response.notifications;
          this.loading = false;
        },
        error: (err) => {
          this.error = 'Failed to load notifications';
          this.loading = false;
          console.error(err);
        }
      });
  }

  markAsRead(notificationId: string) {
    this.notificationService.markAsRead(notificationId).subscribe({
      next: () => {
        // Update local state
        const notification = this.notifications.find(n => n.id === notificationId);
        if (notification) {
          notification.read = true;
        }
      },
      error: (err) => {
        console.error('Failed to mark as read', err);
      }
    });
  }

  ngOnDestroy() {
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
  }
}
```

### Option 2: WebSocket (Real-time)

For real-time updates, you can use WebSockets with Socket.IO. The Medusa backend now includes Socket.IO WebSocket support.

#### Backend Setup

1. **Initialize WebSocket Server**: The WebSocket server needs to be initialized when the Medusa server starts. You can do this by calling:

```bash
# Initialize WebSocket server (call once after server starts)
curl -X POST http://localhost:9000/admin/websocket/init \
  -H "Authorization: Bearer $ADMIN_TOKEN"
```

Or you can add this to your server startup script.

2. **Check WebSocket Status**: 

```bash
curl http://localhost:9000/admin/websocket/status \
  -H "Authorization: Bearer $ADMIN_TOKEN"
```

#### Install Socket.IO Client in Angular

```bash
npm install socket.io-client
# or
yarn add socket.io-client
```

#### Angular WebSocket Service

```typescript
// src/app/services/websocket-notification.service.ts
import { Injectable } from '@angular/core';
import { Observable, Subject } from 'rxjs';
import { io, Socket } from 'socket.io-client';
import { environment } from '../../environments/environment';

export interface Notification {
  id: string;
  type: string;
  orderId: string;
  orderData: any;
  createdAt: string;
  read: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class WebSocketNotificationService {
  private socket: Socket | null = null;
  private notifications$ = new Subject<Notification>();
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 5000;

  constructor() {
    this.connect();
  }

  private connect() {
    const wsUrl = environment.medusaWsUrl || 'http://localhost:9000';
    
    this.socket = io(wsUrl, {
      path: '/socket.io',
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: this.reconnectDelay,
      reconnectionAttempts: this.maxReconnectAttempts,
    });

    this.socket.on('connect', () => {
      console.log('WebSocket connected:', this.socket?.id);
      this.reconnectAttempts = 0;
      
      // Authenticate if you have a user ID or token
      // Replace with your actual authentication method
      const userId = this.getUserId(); // Get from your auth service
      if (userId) {
        this.socket?.emit('authenticate', { userId });
      }
    });

    this.socket.on('authenticated', (data: { success: boolean; userId?: string }) => {
      if (data.success) {
        console.log('WebSocket authenticated:', data.userId);
      }
    });

    this.socket.on('notification', (message: { type: string; data: Notification; timestamp: string }) => {
      if (message.type === 'notification' && message.data) {
        this.notifications$.next(message.data);
      }
    });

    this.socket.on('disconnect', (reason) => {
      console.log('WebSocket disconnected:', reason);
      if (reason === 'io server disconnect') {
        // Server disconnected, reconnect manually
        this.socket?.connect();
      }
    });

    this.socket.on('connect_error', (error) => {
      console.error('WebSocket connection error:', error);
      this.reconnectAttempts++;
      if (this.reconnectAttempts >= this.maxReconnectAttempts) {
        console.error('Max reconnection attempts reached');
      }
    });

    // Handle ping/pong for connection health
    this.socket.on('pong', () => {
      // Connection is healthy
    });
  }

  /**
   * Get user ID from your authentication service
   * Replace this with your actual auth service implementation
   */
  private getUserId(): string | null {
    // Example: Get from localStorage, session, or auth service
    // return localStorage.getItem('userId');
    // or
    // return this.authService.getCurrentUser()?.id;
    return null; // Return null if not authenticated
  }

  getNotifications(): Observable<Notification> {
    return this.notifications$.asObservable();
  }

  /**
   * Manually authenticate with user ID or token
   */
  authenticate(userId: string, token?: string) {
    if (this.socket?.connected) {
      this.socket.emit('authenticate', { userId, token });
    }
  }

  /**
   * Send ping to check connection health
   */
  ping() {
    if (this.socket?.connected) {
      this.socket.emit('ping');
    }
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  isConnected(): boolean {
    return this.socket?.connected || false;
  }
}
```

#### Component Using WebSocket

```typescript
// src/app/components/realtime-notifications/realtime-notifications.component.ts
import { Component, OnInit, OnDestroy } from '@angular/core';
import { WebSocketNotificationService, Notification } from '../../services/websocket-notification.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-realtime-notifications',
  template: `
    <div class="notifications-container">
      <h2>Real-time Order Notifications</h2>
      <div *ngFor="let notification of notifications" class="notification-item">
        <div class="notification-header">
          <span class="badge">NEW</span>
          <span class="notification-time">{{ notification.createdAt | date:'short' }}</span>
        </div>
        <div class="notification-body">
          <p><strong>New Order:</strong> {{ notification.orderId }}</p>
          <p><strong>Total:</strong> {{ notification.orderData?.total | currency }}</p>
        </div>
      </div>
    </div>
  `
})
export class RealtimeNotificationsComponent implements OnInit, OnDestroy {
  notifications: Notification[] = [];
  private subscription?: Subscription;

  constructor(private wsService: WebSocketNotificationService) {}

  ngOnInit() {
    this.subscription = this.wsService.getNotifications().subscribe({
      next: (notification) => {
        // Add to beginning of array
        this.notifications.unshift(notification);
        // Keep only last 50
        if (this.notifications.length > 50) {
          this.notifications.pop();
        }
        
        // Show browser notification
        this.showBrowserNotification(notification);
      }
    });
  }

  private showBrowserNotification(notification: Notification) {
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification('New Order Created', {
        body: `Order ${notification.orderId} - ${notification.orderData?.total | currency}`,
        icon: '/assets/icon.png'
      });
    }
  }

  ngOnDestroy() {
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
  }
}
```

## Environment Configuration

Add to your `environment.ts`:

```typescript
export const environment = {
  production: false,
  medusaApiUrl: 'http://localhost:9000',
  medusaWsUrl: 'http://localhost:9000' // Socket.IO uses HTTP/HTTPS, not ws://
};
```

For production, use HTTPS:

```typescript
export const environment = {
  production: true,
  medusaApiUrl: 'https://your-medusa-server.com',
  medusaWsUrl: 'https://your-medusa-server.com' // Socket.IO will use WSS automatically
};
```

## Usage in Your App

### 1. Add HTTP Client Module

```typescript
// app.module.ts or app.config.ts
import { HttpClientModule } from '@angular/common/http';

@NgModule({
  imports: [HttpClientModule, ...]
})
```

### 2. Use in Component

```typescript
import { NotificationListComponent } from './components/notification-list/notification-list.component';

// In your template
<app-notification-list></app-notification-list>
```

## Testing

1. **Start your Medusa server**:
   ```bash
   yarn dev
   ```

2. **Initialize WebSocket server** (one-time setup):
   ```bash
   curl -X POST http://localhost:9000/admin/websocket/init \
  -H "Authorization: Bearer $ADMIN_TOKEN"
   ```

3. **Check WebSocket status**:
   ```bash
   curl http://localhost:9000/admin/websocket/status \
  -H "Authorization: Bearer $ADMIN_TOKEN"
   ```

4. **Start your Angular app** and connect to the WebSocket

5. **Create a test order** in Medusa

6. **Verify notification**: The Angular app should receive the notification in real-time via WebSocket

## WebSocket Server Initialization

The WebSocket server needs to be initialized after the Medusa server starts. You have two options:

### Option A: Manual Initialization (Development)

Call the initialization endpoint after starting your server:

```bash
curl -X POST http://localhost:9000/admin/websocket/init \
  -H "Authorization: Bearer $ADMIN_TOKEN"
```

### Option B: Automatic Initialization (Production)

Add a startup script or use a process manager that calls the initialization endpoint automatically when the server starts.

## Production Considerations

1. **Replace in-memory storage** with Redis or PostgreSQL for notifications
2. **WebSocket authentication**: Implement proper token validation in the WebSocket authentication handler
3. **Initialize WebSocket automatically**: Set up automatic WebSocket initialization on server startup
4. **Use HTTPS/WSS**: Socket.IO automatically uses WSS when connecting to HTTPS URLs
5. **Add error handling**: Implement reconnection logic and error handling in your Angular service
6. **Add notification persistence**: Store notifications in database for offline support
7. **Rate limiting**: Consider rate limiting for WebSocket connections
8. **Monitoring**: Monitor WebSocket connections and handle connection limits
9. **CORS configuration**: Ensure `ADMIN_CORS` environment variable includes your Angular app's domain


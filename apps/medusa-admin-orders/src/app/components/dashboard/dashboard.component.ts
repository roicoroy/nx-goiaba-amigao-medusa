import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { WebSocketNotificationService, Notification } from '../../services/websocket-notification.service';
import { NotificationService } from '../../services/notification.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit, OnDestroy {
  private wsService = inject(WebSocketNotificationService);
  private notifications = inject(NotificationService);

  recentOrders: Notification[] = [];
  connectionStatus: 'connected' | 'disconnected' | 'connecting' | 'error' = 'disconnected';
  private subscriptions: Subscription[] = [];

  async ngOnInit() {
    // Optionally connect to WebSocket for real-time notifications
    // Uncomment the following if you want to use WebSocket notifications
    /*
    this.wsService.connect();

    // Subscribe to connection status
    const statusSub = this.wsService.getNotifications().subscribe(() => {
      this.connectionStatus = this.wsService.isConnected() ? 'connected' : 'disconnected';
    });

    // Subscribe to order updates
    const orderSub = this.wsService.getNotifications().subscribe(notification => {
      console.log('📦 New order in dashboard:', notification);

      // Add to recent orders (newest first)
      this.recentOrders.unshift(notification);

      // Keep only last 10 orders
      if (this.recentOrders.length > 10) {
        this.recentOrders.pop();
      }

      // Show notifications
      this.notifications.showOrderNotification(notification);
      this.notifications.showToast(`New order: ${notification.orderId}`, 'success');
    });

    this.subscriptions.push(statusSub, orderSub);
    */
  }

  ngOnDestroy() {
    this.subscriptions.forEach(sub => sub.unsubscribe());
    if (this.wsService.isConnected()) {
      this.wsService.disconnect();
    }
  }

  reconnect() {
    if (!this.wsService.isConnected()) {
      this.wsService.connect();
    }
  }

  trackByOrderId(index: number, order: Notification): string {
    return order.orderId;
  }

  getStatusColor(): string {
    switch (this.connectionStatus) {
      case 'connected': return 'green';
      case 'connecting': return 'orange';
      case 'error': return 'red';
      default: return 'gray';
    }
  }

  getStatusText(): string {
    switch (this.connectionStatus) {
      case 'connected': return 'Connected';
      case 'connecting': return 'Connecting...';
      case 'error': return 'Connection Error';
      default: return 'Disconnected';
    }
  }
}

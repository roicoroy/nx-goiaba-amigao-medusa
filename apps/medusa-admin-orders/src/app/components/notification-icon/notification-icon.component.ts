import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { IonIcon, IonBadge, IonButton } from '@ionic/angular/standalone';
import { NotificationService, Notification } from '../../services/notification.service';
import { WebSocketNotificationService } from '../../services/websocket-notification.service';
import { Subscription, interval } from 'rxjs';

@Component({
  selector: 'app-notification-icon',
  standalone: true,
  imports: [CommonModule, IonIcon, IonBadge, IonButton],
  template: `
    <ion-button 
      fill="clear" 
      (click)="navigateToOrders()"
      class="notification-button">
      <ion-icon name="notifications-outline" slot="icon-only"></ion-icon>
      <ion-badge 
        *ngIf="unreadCount > 0" 
        color="danger"
        class="notification-badge">
        {{ unreadCount > 99 ? '99+' : unreadCount }}
      </ion-badge>
    </ion-button>
  `,
  styles: [`
    .notification-button {
      position: relative;
      --padding-start: 8px;
      --padding-end: 8px;
    }
    .notification-badge {
      position: absolute;
      top: 4px;
      right: 4px;
      font-size: 10px;
      min-width: 18px;
      height: 18px;
      line-height: 18px;
    }
  `]
})
export class NotificationIconComponent implements OnInit, OnDestroy {
  private notificationService = inject(NotificationService);
  private wsService = inject(WebSocketNotificationService);
  private router = inject(Router);
  
  unreadCount = 0;
  private wsSubscription?: Subscription;
  private connectionCheckSubscription?: Subscription;
  private isWebSocketSetup = false;

  ngOnInit() {
    // Get initial notification count via API (one-time call)
    this.loadInitialNotificationCount();
    
    // Check if WebSocket is already connected
    if (this.wsService.isConnected()) {
      this.setupWebSocket();
    } else {
      // WebSocket not connected yet - check periodically for connection
      this.waitForWebSocketConnection();
    }
  }

  /**
   * Periodically check if WebSocket becomes available and set it up
   */
  private waitForWebSocketConnection() {
    // Check every 2 seconds if WebSocket is connected
    this.connectionCheckSubscription = interval(2000).subscribe(() => {
      if (this.wsService.isConnected() && !this.isWebSocketSetup) {
        console.log('✅ WebSocket connection detected, setting up notifications...');
        this.setupWebSocket();
        // Stop checking once connected
        if (this.connectionCheckSubscription) {
          this.connectionCheckSubscription.unsubscribe();
          this.connectionCheckSubscription = undefined;
        }
      }
    });
  }

  /**
   * Load initial notification count via API
   */
  private loadInitialNotificationCount() {
    this.notificationService.getNotifications(true).subscribe({
      next: (response) => {
        this.unreadCount = response.count || response.notifications?.length || 0;
      },
      error: (err) => {
        console.warn('⚠️ Failed to load initial notification count:', err);
        // Don't show error to user, just keep count at 0
      }
    });
  }

  /**
   * Set up WebSocket connection for real-time notifications
   * Called automatically when WebSocket becomes available
   */
  private setupWebSocket() {
    if (this.isWebSocketSetup) {
      return; // Already set up
    }

    if (!this.wsService.isConnected()) {
      console.log('⚠️ WebSocket not connected, cannot set up notifications');
      return;
    }

    console.log('🔌 Setting up WebSocket notifications...');
    this.isWebSocketSetup = true;

    // Subscribe to real-time notifications
    this.wsSubscription = this.wsService.getNotifications().subscribe({
      next: (notification) => {
        if (!notification.read) {
          this.unreadCount++;
        }
        // Show browser notification
        this.showBrowserNotification(notification);
      },
      error: (err) => {
        console.error('❌ WebSocket notification error:', err);
        this.isWebSocketSetup = false; // Allow retry
      }
    });
  }

  private showBrowserNotification(notification: Notification) {
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification('New Order Created', {
        body: `Order ${notification.orderId}`,
        icon: '/assets/icon/favicon.png'
      });
    }
  }

  navigateToOrders() {
    this.router.navigate(['/orders']);
  }

  ngOnDestroy() {
    if (this.wsSubscription) {
      this.wsSubscription.unsubscribe();
    }
    if (this.connectionCheckSubscription) {
      this.connectionCheckSubscription.unsubscribe();
    }
    // Note: We don't disconnect WebSocket here as it might be used by other components
    // The WebSocket service manages its own lifecycle
  }
}


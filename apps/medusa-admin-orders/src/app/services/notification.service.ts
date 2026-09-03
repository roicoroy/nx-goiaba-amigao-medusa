import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, interval, of } from 'rxjs';
import { switchMap, startWith, catchError, map } from 'rxjs/operators';
import { ToastController } from '@ionic/angular';
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
  // Use /admin/notifications as per the guide (admin endpoints section)
  private apiUrl = `${environment.MEDUSA_API_BASE_PATH}/admin/notifications`;
  private toastController = inject(ToastController);

  constructor(private http: HttpClient) {}

  /**
   * Get all notifications
   * Note: The backend endpoint may not support unreadOnly parameter yet
   * If unreadOnly is requested, we'll filter on the client side
   */
  getNotifications(unreadOnly: boolean = false, limit: number = 50): Observable<NotificationsResponse> {
    // Don't send unreadOnly parameter - backend doesn't support it yet
    // We'll filter on the client side instead
    const params: any = { limit: limit.toString() };
    
    return this.http.get<NotificationsResponse>(this.apiUrl, { params }).pipe(
      // Filter on client side if unreadOnly is requested
      map((response) => {
        if (unreadOnly && response.notifications) {
          const unreadNotifications = response.notifications.filter(n => !n.read);
          return {
            ...response,
            notifications: unreadNotifications,
            count: unreadNotifications.length
          };
        }
        return response;
      }),
      catchError((error: HttpErrorResponse) => {
        // If 400 or 404, the endpoint might not be implemented yet
        console.warn('Notifications endpoint error:', error.status, error.error || error.message);
        // Return empty response to prevent app breakage
        return of({
          success: false,
          notifications: [],
          count: 0
        });
      })
    );
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
    const adminApiUrl = `${environment.MEDUSA_API_BASE_PATH}/admin/webhooks`;
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
    const adminApiUrl = `${environment.MEDUSA_API_BASE_PATH}/admin/webhooks`;
    return this.http.get(adminApiUrl, {
      headers: {
        'Authorization': `Bearer ${adminToken}`
      }
    });
  }

  /**
   * Initialize WebSocket server on the backend
   * @param adminToken Admin authentication token
   */
  initializeWebSocketServer(adminToken: string): Observable<{ success: boolean; message: string }> {
    const wsInitUrl = `${environment.MEDUSA_API_BASE_PATH}/admin/websocket/init`;
    return this.http.post<{ success: boolean; message: string }>(
      wsInitUrl,
      {},
      {
        headers: {
          'Authorization': `Bearer ${adminToken}`,
          'Content-Type': 'application/json'
        }
      }
    );
  }

  /**
   * Check WebSocket server status
   * @param adminToken Admin authentication token
   */
  getWebSocketStatus(adminToken: string): Observable<any> {
    const wsStatusUrl = `${environment.MEDUSA_API_BASE_PATH}/admin/websocket/status`;
    return this.http.get(wsStatusUrl, {
      headers: {
        'Authorization': `Bearer ${adminToken}`
      }
    });
  }

  /**
   * Show a toast notification
   * @param message The message to display
   * @param color The color theme (success, warning, danger, etc.)
   * @param duration Duration in milliseconds (default: 3000)
   */
  async showToast(message: string, color: string = 'primary', duration: number = 3000): Promise<void> {
    const toast = await this.toastController.create({
      message,
      duration,
      color,
      position: 'top',
      buttons: [
        {
          text: 'OK',
          role: 'cancel'
        }
      ]
    });
    await toast.present();
  }

  /**
   * Show a browser notification for a new order
   * @param order Order data to display
   */
  async showOrderNotification(order: any): Promise<void> {
    if ('Notification' in window && Notification.permission === 'granted') {
      const orderId = order.orderId || order.id || 'Unknown';
      const total = order.total ? `$${(order.total / 100).toFixed(2)}` : 'N/A';
      
      new Notification('New Order Created', {
        body: `Order ${orderId} - Total: ${total}`,
        icon: '/assets/icon/favicon.png',
        tag: `order-${orderId}`
      });
    } else if ('Notification' in window && Notification.permission === 'default') {
      // Request permission
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        this.showOrderNotification(order);
      }
    }
  }
}


import { Component, inject, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { IonicModule, RefresherCustomEvent } from '@ionic/angular';
import { Store } from '@ngxs/store';
import { Observable, Subscription } from 'rxjs';
import { AuthState } from '../../store/auth/auth.state';
import { Logout } from '../../store/auth/auth.actions';
import { DashboardStatsState } from '../../store/dashboard/states/stats/stats.state';
import { LoadDashboardStats, AddRealtimeOrder } from '../../store/dashboard/states/stats/stats.actions';
import { NotificationService } from '../../services/notification.service';
import { WebSocketNotificationService } from '../../services/websocket-notification.service';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.page.html',
  styleUrls: ['./dashboard.page.scss'],
  standalone: true,
  imports: [
    IonicModule,
    CommonModule,
    RouterLink
  ]
})
export class DashboardPage implements OnInit, OnDestroy {
  private store = inject(Store);
  private router = inject(Router);
  private notifications = inject(NotificationService);
  private wsService = inject(WebSocketNotificationService);

  user$: Observable<any>;
  orders$: Observable<any[]>;
  stats$: Observable<any>;
  loading$: Observable<boolean>;
  error$: Observable<string | null>;

  recentOrderEvents: any[] = [];
  connectionStatus: 'connected' | 'disconnected' | 'connecting' | 'error' = 'disconnected';
  private subscriptions: Subscription[] = [];

  constructor() {
    this.user$ = this.store.select(AuthState.getUser);
    this.orders$ = this.store.select(DashboardStatsState.getOrders);
    this.stats$ = this.store.select(DashboardStatsState.getStats);
    this.loading$ = this.store.select(DashboardStatsState.isLoading);
    this.error$ = this.store.select(DashboardStatsState.getError);
  }

  ngOnInit() {
    // Dispatch action to load dashboard data
    this.store.dispatch(new LoadDashboardStats());
    this.initializeWebSocket()

    // Optionally connect to WebSocket for real-time notifications
    // Uncomment the following lines if you want to use WebSocket instead of polling
    
    // this.wsService.connect();
    // const wsSub = this.wsService.getNotifications().subscribe(notification => {
    //   console.log('📦 Real-time notification received:', notification);

    //   // Add to recent order events (newest first)
    //   this.recentOrderEvents.unshift({
    //     orderId: notification.orderId,
    //     orderData: notification.orderData,
    //     timestamp: notification.createdAt
    //   });
    //   if (this.recentOrderEvents.length > 5) {
    //     this.recentOrderEvents.pop();
    //   }

    //   // Show notifications
    //   this.notifications.showOrderNotification(notification);
    //   this.notifications.showToast(`New order: ${notification.orderId}`, 'success');

    //   // Dispatch action to add order to state if needed
    //   // this.store.dispatch(new AddRealtimeOrder(notification));
    // });

    // Monitor connection status
    // this.connectionStatus = this.wsService.isConnected() ? 'connected' : 'disconnected';
    // this.subscriptions.push(wsSub);
    
  }

  ngOnDestroy() {
    this.subscriptions.forEach(sub => sub.unsubscribe());
    // Disconnect WebSocket if connected
    if (this.wsService.isConnected()) {
      this.wsService.disconnect();
    }
  }

  handleRefresh(event: RefresherCustomEvent) {
    this.store.dispatch(new LoadDashboardStats());
    // Complete the refresher after a short delay to allow state to update
    setTimeout(() => event.target.complete(), 500);
  }

  onLogout() {
    this.store.dispatch(new Logout());
    this.router.navigate(['/login']);
  }

  viewOrders() {
    this.router.navigate(['/orders']);
  }

  viewCustomers() {
    this.router.navigate(['/customers']);
  }

  getOrderStatusColor(status: string): string {
    switch (status) {
      case 'completed': return 'success';
      case 'pending': return 'warning';
      case 'canceled': return 'danger';
      default: return 'medium';
    }
  }

  getFulfillmentStatusColor(status: string): string {
    switch (status) {
      case 'fulfilled':
      case 'shipped':
      case 'delivered': return 'success';
      case 'partially_fulfilled':
      case 'partially_shipped': return 'warning';
      case 'not_fulfilled':
      case 'canceled': return 'danger';
      case 'requires_action': return 'tertiary';
      default: return 'medium';
    }
  }

  getPaymentStatusColor(status: string): string {
    switch (status) {
      case 'captured': return 'success';
      case 'authorized': return 'primary';
      case 'awaiting': return 'warning';
      case 'partially_refunded': return 'tertiary';
      case 'refunded': return 'medium';
      case 'canceled':
      case 'not_paid': return 'danger';
      case 'requires_action': return 'warning';
      default: return 'medium';
    }
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount / 100); // Medusa stores amounts in cents
  }

  formatDate(date: string): string {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }

  reconnectSSE() {
    // Reconnect WebSocket if using WebSocket notifications
    if (!this.wsService.isConnected()) {
      this.wsService.connect();
    }
  }

  getStatusColor(): string {
    switch (this.connectionStatus) {
      case 'connected': return 'success';
      case 'connecting': return 'warning';
      case 'error': return 'danger';
      default: return 'medium';
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

  trackByOrderId(index: number, order: any): string {
    return order.orderId || order.id || index.toString();
  }

  testNotification() {
    console.log('🧪 Testing notification system...');

    // Test 1: Simple alert
    alert('🧪 TEST ALERT: Notification system is working!');

    // Test 2: Create a fake order event
    const fakeOrder = {
      orderId: 'test-order-123',
      customerEmail: 'test@example.com',
      total: 2500, // $25.00
      timestamp: new Date().toISOString(),
      orderData: { test: true }
    };

    // Test 3: Add to recent events
    this.recentOrderEvents.unshift(fakeOrder);
    if (this.recentOrderEvents.length > 5) {
      this.recentOrderEvents.pop();
    }

    // Test 4: Show toast notification
    this.notifications.showToast('🧪 Test notification triggered!', 'success');

    console.log('🧪 Test completed - check UI for fake order');
  }

  testSSEConnection() {
    console.log('🔌 Testing WebSocket connection...');

    // Test the WebSocket connection
    const isConnected = this.wsService.isConnected();
    console.log('🔌 WebSocket Connected:', isConnected);

    // Show toast with connection status
    this.notifications.showToast(
      `WebSocket Status: ${isConnected ? 'Connected' : 'Disconnected'}`,
      isConnected ? 'success' : 'warning'
    );

    // Connect if not connected
    if (!isConnected) {
      console.log('🔄 Connecting to WebSocket...');
      this.wsService.connect();
      this.connectionStatus = 'connecting';
    }
  }

  async initializeWebSocket() {
    const token = this.store.selectSnapshot(AuthState.getToken);
    
    if (!token) {
      await this.notifications.showToast('Please log in first', 'warning');
      return;
    }

    try {
      console.log('🔌 Checking WebSocket server status...');
      this.connectionStatus = 'connecting';
      
      // First check if WebSocket server is already initialized
      this.notifications.getWebSocketStatus(token).subscribe({
        next: async (status) => {
          console.log('📊 WebSocket server status:', status);
          
          // If already initialized, just connect
          if (status.initialized || status.success) {
            console.log('✅ WebSocket server already initialized, connecting client...');
            await this.notifications.showToast('WebSocket server ready, connecting...', 'success');
            this.connectWebSocketClient();
          } else {
            // Initialize WebSocket server on backend
            console.log('🔌 Initializing WebSocket server...');
            this.notifications.initializeWebSocketServer(token).subscribe({
              next: async (response) => {
                console.log('✅ WebSocket server initialized:', response);
                await this.notifications.showToast(
                  response.message || 'WebSocket server initialized successfully',
                  'success'
                );
                
                // Wait a bit for server to be ready, then connect
                setTimeout(() => {
                  this.connectWebSocketClient();
                }, 500);
              },
              error: async (error) => {
                console.error('❌ Failed to initialize WebSocket server:', error);
                this.connectionStatus = 'error';
                await this.notifications.showToast(
                  `Failed to initialize: ${error.error?.message || error.message}`,
                  'danger'
                );
              }
            });
          }
        },
        error: async (error) => {
          // If status check fails, try to initialize anyway
          console.warn('⚠️ Could not check WebSocket status, attempting initialization...', error);
          this.notifications.initializeWebSocketServer(token).subscribe({
            next: async (response) => {
              console.log('✅ WebSocket server initialized:', response);
              await this.notifications.showToast(
                response.message || 'WebSocket server initialized successfully',
                'success'
              );
              setTimeout(() => {
                this.connectWebSocketClient();
              }, 500);
            },
            error: async (initError) => {
              console.error('❌ Failed to initialize WebSocket server:', initError);
              this.connectionStatus = 'error';
              await this.notifications.showToast(
                `Failed to initialize: ${initError.error?.message || initError.message}`,
                'danger'
              );
            }
          });
        }
      });
    } catch (error) {
      console.error('❌ Error initializing WebSocket:', error);
      this.connectionStatus = 'error';
      await this.notifications.showToast('Error initializing WebSocket', 'danger');
    }
  }

  private connectWebSocketClient() {
    // Now connect the frontend WebSocket client
    if (!this.wsService.isConnected()) {
      console.log('🔄 Connecting frontend WebSocket client...');
      this.wsService.connect();
      
      // Update connection status after a delay
      setTimeout(() => {
        const isConnected = this.wsService.isConnected();
        this.connectionStatus = isConnected ? 'connected' : 'error';
        if (isConnected) {
          this.notifications.showToast('WebSocket connected successfully!', 'success');
        } else {
          this.notifications.showToast('WebSocket connection failed. Check console for details.', 'warning');
        }
      }, 2000);
    } else {
      this.connectionStatus = 'connected';
      this.notifications.showToast('WebSocket already connected', 'success');
    }
  }
}

import { Component, inject, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { IonicModule, RefresherCustomEvent, InfiniteScrollCustomEvent } from '@ionic/angular';
import { WebSocketNotificationService } from '../../services/websocket-notification.service';
import { Store } from '@ngxs/store';
import { Observable, Subject, combineLatest } from 'rxjs';
import { takeUntil, debounceTime, distinctUntilChanged, map } from 'rxjs/operators';
import { OrdersState } from '../../store/orders/orders.state';
import { LoadOrders, SetOrdersFilter, ClearOrdersFilter, SetSelectedOrder, LoadMoreOrders, GoToPage } from '../../store/orders/orders.actions';
import { AuthState } from '../../store/auth/auth.state';
import { CheckAuthStatus } from '../../store/auth/auth.actions';
import { OrdersPaginationComponent } from '../../components/orders-pagination/orders-pagination.component';

@Component({
  selector: 'app-orders',
  templateUrl: './orders.page.html',
  styleUrls: ['./orders.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule, OrdersPaginationComponent]
})
export class OrdersPage implements OnInit, OnDestroy {
  private store = inject(Store);
  private wsService = inject(WebSocketNotificationService);
  private router = inject(Router);
  private destroy$ = new Subject<void>();

  orders$: Observable<any[]>;
  loading$: Observable<boolean>;
  error$: Observable<string | null>;
  pagination$: Observable<any>;
  isLoggedIn$: Observable<boolean>;
  returns$: Observable<Map<string, any[]>>;
  
  // Helper method to get returns count for an order
  getReturnsCount(orderId: string, returnsMap: Map<string, any[]>): number {
    return returnsMap.get(orderId)?.length || 0;
  }

  // Filter properties
  searchTerm = '';
  selectedStatus = '';
  selectedFulfillmentStatus = '';
  selectedPaymentStatus = '';
  dateFrom = '';
  dateTo = '';

  // UI state
  showFilters = false;

  // Status options
  statusOptions = [
    { value: '', label: 'All Statuses' },
    { value: 'pending', label: 'Pending' },
    { value: 'completed', label: 'Completed' },
    { value: 'canceled', label: 'Canceled' },
    { value: 'requires_action', label: 'Requires Action' }
  ];

  fulfillmentStatusOptions = [
    { value: '', label: 'All Fulfillment' },
    { value: 'not_fulfilled', label: 'Not Fulfilled' },
    { value: 'partially_fulfilled', label: 'Partially Fulfilled' },
    { value: 'fulfilled', label: 'Fulfilled' },
    { value: 'partially_shipped', label: 'Partially Shipped' },
    { value: 'shipped', label: 'Shipped' },
    { value: 'partially_returned', label: 'Partially Returned' },
    { value: 'returned', label: 'Returned' },
    { value: 'canceled', label: 'Canceled' },
    { value: 'requires_action', label: 'Requires Action' }
  ];

  paymentStatusOptions = [
    { value: '', label: 'All Payments' },
    { value: 'not_paid', label: 'Not Paid' },
    { value: 'awaiting', label: 'Awaiting' },
    { value: 'captured', label: 'Captured' },
    { value: 'partially_refunded', label: 'Partially Refunded' },
    { value: 'refunded', label: 'Refunded' },
    { value: 'canceled', label: 'Canceled' },
    { value: 'requires_action', label: 'Requires Action' }
  ];

  private searchSubject = new Subject<string>();

  constructor() {
    this.orders$ = this.store.select(OrdersState.getOrders);
    this.loading$ = this.store.select(OrdersState.isLoading);
    this.error$ = this.store.select(OrdersState.getError);
    this.pagination$ = this.store.select(OrdersState.getPagination);
    this.isLoggedIn$ = this.store.select(AuthState.isLoggedIn);
    this.returns$ = this.store.select(OrdersState.getReturns);

    // Setup search debouncing
    this.searchSubject.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      takeUntil(this.destroy$)
    ).subscribe(searchTerm => {
      this.applyFilters();
    });
  }

  ngOnInit() {
    // Check authentication status first
    this.isLoggedIn$.pipe(takeUntil(this.destroy$)).subscribe(isLoggedIn => {
      if (isLoggedIn) {
        this.loadOrders();
        // Optionally subscribe to WebSocket notifications for real-time updates
        // Uncomment the following if you want to use WebSocket notifications
        
        this.wsService.connect();
        this.wsService.getNotifications()
          .pipe(takeUntil(this.destroy$))
          .subscribe(notification => {
            console.log('🔔 Order notification received:', notification);
            // Reload orders to update the list
            this.store.dispatch(new LoadOrders());
          });
        
      } else {
        // If not logged in, check auth status (in case we have a token but state isn't initialized)
        this.store.dispatch(new CheckAuthStatus()).subscribe({
          next: () => {
            // After checking auth status, try loading orders again
            const stillLoggedIn = this.store.selectSnapshot(AuthState.isLoggedIn);
            if (stillLoggedIn) {
              this.loadOrders();
            } else {
              this.router.navigate(['/login']);
            }
          },
          error: () => {
            // Auth check failed, redirect to login
            this.router.navigate(['/login']);
          }
        });
      }
    });

    // Debug: Log the orders data to see what we're getting
    this.orders$.subscribe(orders => {
      if (orders && orders.length > 0) {

      }
    });

    // Handle authentication errors
    this.error$.pipe(takeUntil(this.destroy$)).subscribe(error => {
      if (error) {
        console.error('Orders loading error:', error);
        // If it's an authentication error, redirect to login
        if (error.includes('Unauthorized') || error.includes('401')) {
          this.router.navigate(['/login']);
        }
      }
    });
  }

  ngOnDestroy() {
    this.destroy$.next();
    // Unsubscribe from order events is handled by takeUntil
    this.destroy$.complete();
  }

  loadOrders() {
    this.store.dispatch(new LoadOrders());
  }

  async handleRefresh(event: RefresherCustomEvent) {
    this.loadOrders();
    event.target.complete();
  }

  async handleInfiniteScroll(event: InfiniteScrollCustomEvent) {
    // Load more orders using the LoadMoreOrders action
    this.store.dispatch(new LoadMoreOrders({
      params: this.getCurrentFilters()
    }));
    event.target.complete();
  }

  onPageChange(page: number): void {
    this.store.dispatch(new GoToPage({ page }));
  }

  onLoadMore(): void {
    this.store.dispatch(new LoadMoreOrders({
      params: this.getCurrentFilters()
    }));
  }

  onSearchChange(event: any) {
    this.searchTerm = event.detail.value;
    this.searchSubject.next(this.searchTerm);
  }

  onStatusChange() {
    this.applyFilters();
  }

  toggleFilters() {
    this.showFilters = !this.showFilters;
  }

  clearFilters() {
    this.searchTerm = '';
    this.selectedStatus = '';
    this.selectedFulfillmentStatus = '';
    this.selectedPaymentStatus = '';
    this.dateFrom = '';
    this.dateTo = '';
    this.store.dispatch(new ClearOrdersFilter());
  }

  applyFilters() {
    const filters = this.getCurrentFilters();
    this.store.dispatch(new SetOrdersFilter({ filter: filters }));
  }

  private getCurrentFilters() {
    const filters: any = {};

    if (this.searchTerm) {
      filters.q = this.searchTerm;
    }

    if (this.selectedStatus) {
      filters.status = this.selectedStatus;
    }

    if (this.selectedFulfillmentStatus) {
      filters.fulfillment_status = this.selectedFulfillmentStatus;
    }

    if (this.selectedPaymentStatus) {
      filters.payment_status = this.selectedPaymentStatus;
    }

    if (this.dateFrom) {
      filters.created_at = { ...filters.created_at, gte: this.dateFrom };
    }

    if (this.dateTo) {
      filters.created_at = { ...filters.created_at, lte: this.dateTo };
    }

    return filters;
  }

  viewOrder(order: any) {
    this.store.dispatch(new SetSelectedOrder({ orderId: order.id }));
    this.router.navigate(['/orders', order.id]);
  }

  getStatusColor(status: string): string {
    switch (status) {
      case 'completed': return 'success';
      case 'pending': return 'warning';
      case 'canceled': return 'danger';
      case 'requires_action': return 'tertiary';
      default: return 'medium';
    }
  }

  getFulfillmentStatusColor(status: string): string {
    switch (status) {
      case 'fulfilled':
      case 'shipped': return 'success';
      case 'partially_fulfilled':
      case 'partially_shipped': return 'warning';
      case 'not_fulfilled': return 'danger';
      case 'returned':
      case 'canceled': return 'medium';
      case 'requires_action': return 'tertiary';
      default: return 'medium';
    }
  }

  getPaymentStatusColor(status: string): string {
    switch (status) {
      case 'captured': return 'success';
      case 'awaiting':
      case 'not_paid': return 'warning';
      case 'refunded':
      case 'partially_refunded': return 'medium';
      case 'canceled': return 'danger';
      case 'requires_action': return 'tertiary';
      default: return 'medium';
    }
  }

  formatCurrency(amount: number, currencyCode = 'USD'): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currencyCode
    }).format(amount / 100); // Medusa stores amounts in cents
  }

  formatDate(date: string): string {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  getOrderDisplayId(order: any): string {
    return order.display_id || `#${order.id.slice(-8)}`;
  }

  getCustomerName(order: any): string {
    if (order.customer) {
      const fullName = `${order.customer.first_name || ''} ${order.customer.last_name || ''}`.trim();
      return fullName || order.customer.email || 'Customer';
    }
    return order.email || 'Guest';
  }

  // Quick Actions
  async quickFulfill(event: Event, order: any) {
    event.stopPropagation();
    // TODO: Implement quick fulfillment modal
    console.log('Quick fulfill order:', order.id);
  }

  async quickCapture(event: Event, order: any) {
    event.stopPropagation();
    // TODO: Implement quick payment capture
    console.log('Quick capture payment:', order.id);
  }

  async quickComplete(event: Event, order: any) {
    event.stopPropagation();
    // TODO: Implement quick order completion
    console.log('Quick complete order:', order.id);
  }

  trackByOrderId(index: number, order: any): string {
    return order.id;
  }
}

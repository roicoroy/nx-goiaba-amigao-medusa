import { Component, inject, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { IonicModule, AlertController, ModalController, ToastController } from '@ionic/angular';
import { FulfillmentModalComponent } from './modal/fulfillment-modal.component';
import { ReceiveItemsModalComponent } from './modal/receive-items-modal.component';
import { Store } from '@ngxs/store';
import { Order, OrderItem } from '../../shared/admin-interfaces';
import { Observable, Subject, forkJoin, of } from 'rxjs';
import { takeUntil, switchMap, tap, catchError } from 'rxjs/operators';
import { OrdersState } from '../../store/orders/orders.state';
import { AuthState } from '../../store/auth/auth.state';
import {
  LoadOrder,
  CreateShipment,
  MarkAsDelivered,
  CapturePayment,
  CompleteOrder,
  CancelOrder,
  RefundPayment
} from '../../store/orders/orders.actions';
import { MedusaAdminService } from '../../shared/api/medusa.service.admin';
import { OrderSummary, OrderActivity, UnfulfilledItem, ExtendedOrderItem } from './order-detail.interfaces';
import { OrderDetailHelpers } from './order-detail.helpers';
import { OrderChangesTimelineComponent } from '../../components/order-changes-timeline/order-changes-timeline.component';

@Component({
  selector: 'app-order-detail',
  templateUrl: './order-detail.page.html',
  styleUrls: ['./order-detail.page.scss'],
  standalone: true,
  imports: [
    IonicModule,
    CommonModule,
    FormsModule,
    OrderChangesTimelineComponent
  ]
})
export class OrderDetailPage implements OnInit, OnDestroy {
  private store = inject(Store);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private alertController = inject(AlertController);
  private modalController = inject(ModalController);
  private toastController = inject(ToastController);
  private medusaAdmin = inject(MedusaAdminService);
  private destroy$ = new Subject<void>();

  order$: Observable<Order | null>;
  loading$: Observable<boolean>;
  error$: Observable<string | null>;
  currentUser$: Observable<any>;

  orderId: string = '';
  selectedTab = 'overview';

  // Enhanced order details
  orderReservations: any[] = [];
  orderEdits: any[] = [];
  orderReturns: any[] = [];
  orderExchanges: any[] = [];
  orderClaims: any[] = [];
  regionInfo: any = null;
  storeInfo: any = null;
  loadingExtendedData = false;

  // New properties for Medusa Admin UI
  order: Order | null = null;
  orderChanges: any = null;
  orderActivity: OrderActivity[] = [];
  orderSummary: OrderSummary | null = null;
  unfulfilledItems: UnfulfilledItem[] = [];

  // Observable for order changes
  private orderChangesSubject = new Subject<any>();
  orderChanges$ = this.orderChangesSubject.asObservable();

  // UI State
  expandedSections = {
    shipping: false,
    metadata: false,
    json: false
  };

  constructor() {
    this.order$ = this.store.select(OrdersState.getSelectedOrder);
    this.loading$ = this.store.select(OrdersState.isLoading);
    this.error$ = this.store.select(OrdersState.getError);
    this.currentUser$ = this.store.select(AuthState.getUser);
  }

  ngOnInit() {
    this.route.params.pipe(takeUntil(this.destroy$)).subscribe(params => {
      this.orderId = params['id'];
      if (this.orderId) {
        this.store.dispatch(new LoadOrder({ id: this.orderId }));
      }
    });

    // Subscribe to error state to show error messages
    this.error$.pipe(takeUntil(this.destroy$)).subscribe(error => {
      if (error) {
        this.showToast(error, 'danger');
      }
    });

    // Load extended order data when order changes
    this.order$.pipe(
      takeUntil(this.destroy$),
      switchMap(order => {
        if (order && order.id) {
          this.order = order;
          this.processOrderData(order);
          console.log('📦 Loading extended order data for:', order.id);
          return this.loadExtendedOrderData(order);
        }
        return of(null);
      })
    ).subscribe({
      // next: () => {
      //   console.log('✅ Extended order data loaded');
      // },
      error: (err) => {
        console.error('❌ Error loading extended data:', err);
      }
    });
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Process order data to generate summaries and helpers
   */
  private processOrderData(order: Order) {
    this.orderSummary = OrderDetailHelpers.calculateOrderSummary(order);
    this.unfulfilledItems = OrderDetailHelpers.getUnfulfilledItems(order);
    const changes = this.orderChanges?.order_changes || [];
    this.orderActivity = OrderDetailHelpers.generateOrderActivity(order, changes);
  }

  /**
   * Load extended order data (reservations, edits, etc.)
   */
  loadExtendedOrderData(order: Order) {
    this.loadingExtendedData = true;

    // Collect line item IDs for reservation filtering
    const lineItemIds = order.items?.map(item => item.id) || [];

    // Use forkJoin to load all data in parallel, but catch errors individually
    // so one failure doesn't break everything
    return forkJoin({
      reservations: lineItemIds.length > 0 ? this.medusaAdmin.getReservations({ line_item_id: lineItemIds }).pipe(
        catchError(err => {
          // console.warn('⚠️ Failed to load reservations:', err);
          return of({ reservations: [] });
        })
      ) : of({ reservations: [] }),
      edits: of({ order_edits: [] }),
      returns: this.medusaAdmin.getReturns(order.id).pipe(
        catchError(err => {
          console.warn('⚠️ Failed to load returns:', err);
          return of({ returns: [] });
        })
      ),
      exchanges: this.medusaAdmin.getExchanges(order.id).pipe(
        catchError(err => {
          console.warn('⚠️ Failed to load exchanges:', err);
          return of({ exchanges: [] });
        })
      ),
      claims: this.medusaAdmin.getClaims(order.id).pipe(
        catchError(err => {
          console.warn('⚠️ Failed to load claims:', err);
          return of({ claims: [] });
        })
      ),
      changes: this.medusaAdmin.getOrderChanges(order.id).pipe(
        catchError(err => {
          console.warn('⚠️ Failed to load order changes:', err);
          return of({ order_changes: [] });
        })
      )
    }).pipe(
      tap((results: any) => {
        this.loadingExtendedData = false;

        // Update component state with results
        if (results.reservations) this.orderReservations = results.reservations.reservations || [];
        if (results.edits) this.orderEdits = results.edits.order_edits || [];
        if (results.returns) this.orderReturns = results.returns.returns || [];
        if (results.exchanges) this.orderExchanges = results.exchanges.exchanges || [];
        if (results.claims) this.orderClaims = results.claims.claims || [];
        if (results.changes) {
          this.orderChanges = results.changes;
          this.orderChangesSubject.next(this.orderChanges);
        }

        // console.log('📊 Extended Data Loaded:', {
        //   reservations: this.orderReservations.length,
        //   edits: this.orderEdits.length,
        //   returns: this.orderReturns.length,
        //   exchanges: this.orderExchanges.length,
        //   claims: this.orderClaims.length
        // });
      })
    );
  }

  // Helper methods for template
  getRelativeTime(date: string | Date): string {
    return OrderDetailHelpers.getRelativeTime(date);
  }

  getPaymentProvider(payment: any): string {
    return OrderDetailHelpers.getPaymentProvider(payment);
  }

  getMetadataCount(order: Order): number {
    return OrderDetailHelpers.getMetadataCount(order);
  }

  getJSONKeyCount(order: Order): number {
    return OrderDetailHelpers.getJSONKeyCount(order);
  }

  toggleSection(section: 'shipping' | 'metadata' | 'json') {
    this.expandedSections[section] = !this.expandedSections[section];
  }

  // Helper methods to determine which actions are available
  canCapturePayment(): boolean {
    if (!this.order) return false;

    // Don't show capture button if payment is already captured or completed
    if (this.order.payment_status === 'captured' ||
        this.order.payment_status === 'partially_refunded' ||
        this.order.payment_status === 'refunded') {
      return false;
    }

    // Check if there's any payment that can be captured
    if (this.order.payment_collections && this.order.payment_collections.length > 0) {
      for (const collection of this.order.payment_collections) {
        // Skip completed collections
        if (collection.status === 'completed' || collection.status === 'canceled') {
          continue;
        }

        if (collection.payments && collection.payments.length > 0) {
          const hasCapturablePayment = collection.payments.some((p: any) => {
            // Skip already captured payments
            if (p.captured_at) return false;

            // Check for Stripe payment intent that requires capture
            if (p.data?.status === 'requires_capture' || p.data?.amount_capturable > 0) {
              return true;
            }

            // Check for authorized but not captured payments
            if (!p.captured_at && p.data?.status === 'succeeded') {
              return false; // Already succeeded means captured
            }

            return false;
          });
          if (hasCapturablePayment) return true;
        }
      }
    }

    // Check payment status as fallback
    return this.order.payment_status === 'authorized' || this.order.payment_status === 'awaiting';
  }

  canCreateFulfillment(): boolean {
    return this.unfulfilledItems && this.unfulfilledItems.length > 0;
  }

  canMarkAsShipped(): boolean {
    if (!this.order || !this.order.fulfillments) return false;
    // Check if there are fulfillments that are not yet shipped
    return this.order.fulfillments.some((f: any) => !f.shipped_at && f.packed_at);
  }

  canMarkAsDelivered(): boolean {
    if (!this.order || !this.order.fulfillments) return false;
    // Check if there are fulfillments that are shipped but not delivered
    return this.order.fulfillments.some((f: any) => f.shipped_at && !f.delivered_at);
  }

  canCompleteOrder(): boolean {
    if (!this.order) return false;
    return this.order.status !== 'completed' && this.order.status !== 'canceled';
  }

  canCancelOrder(): boolean {
    if (!this.order) return false;
    return this.order.status !== 'canceled' && this.order.status !== 'completed';
  }

  canRefundPayment(): boolean {
    if (!this.order) return false;
    // Can refund if payment is captured and not fully refunded
    return this.order.payment_status === 'captured' ||
           this.order.payment_status === 'partially_refunded';
  }

  getShippableFulfillmentId(): string {
    if (!this.order || !this.order.fulfillments) return '';
    const fulfillment = this.order.fulfillments.find((f: any) => !f.shipped_at && f.packed_at);
    return fulfillment?.id || '';
  }

  getDeliverableFulfillmentId(): string {
    if (!this.order || !this.order.fulfillments) return '';
    const fulfillment = this.order.fulfillments.find((f: any) => f.shipped_at && !f.delivered_at);
    return fulfillment?.id || '';
  }

  // Action methods
  async capturePayment() {
    console.log('🔴 CAPTURE PAYMENT BUTTON CLICKED!');

    if (!this.order) {
      console.log('❌ No order found');
      return;
    }

    // Debug: Log the order payment data
    console.log('🔍 DEBUG: Order payment_status:', this.order.payment_status);
    console.log('🔍 DEBUG: Payment collections:', this.order.payment_collections);

    // Find the authorized payment to capture
    // In Medusa v2, payments are nested inside payment_collections
    let paymentId = '';
    let paymentAmount = 0;

    if (this.order.payment_collections && this.order.payment_collections.length > 0) {
      // Look through all payment collections
      for (const collection of this.order.payment_collections) {
        console.log('🔍 DEBUG: Checking collection:', collection.id, 'status:', collection.status);

        // Skip completed or canceled collections
        if (collection.status === 'completed' || collection.status === 'canceled') {
          console.log('⏭️ Skipping completed/canceled collection');
          continue;
        }

        // Check if collection has payments
        if (collection.payments && collection.payments.length > 0) {
          console.log('🔍 DEBUG: Collection has', collection.payments.length, 'payments');

          // Find a payment that is authorized but not yet captured
          for (const p of collection.payments) {
            console.log('🔍 DEBUG: Payment:', p['id']);
            console.log('  - captured_at:', p['captured_at']);
            console.log('  - data.status:', p.data?.['status']);
            console.log('  - data.amount_capturable:', p.data?.['amount_capturable']);
          }

          const authPayment = collection.payments.find((p: any) => {
            // Skip already captured payments
            if (p['captured_at']) {
              console.log('⏭️ Skipping captured payment:', p['id']);
              return false;
            }

            // Check the payment data for Stripe payment intent status
            const paymentStatus = p.data?.['status'];
            const amountCapturable = p.data?.['amount_capturable'];

            if (paymentStatus === 'requires_capture' || amountCapturable > 0) {
              console.log('✅ Found payment requiring capture:', p['id']);
              return true;
            }

            // Check for authorized payments (not succeeded, which means captured)
            if (paymentStatus && paymentStatus !== 'succeeded' && paymentStatus !== 'canceled') {
              console.log('✅ Found authorized payment:', p['id'], 'status:', paymentStatus);
              return true;
            }

            return false;
          });

          if (authPayment) {
            paymentId = authPayment.id;
            paymentAmount = authPayment.amount || collection.amount;
            console.log('✅ Selected payment for capture:', paymentId);
            break;
          }
        }
      }
    }

    // Fallback: If order payment_status is 'authorized', use the payment collection
    if (!paymentId && this.order.payment_status === 'authorized' &&
        this.order.payment_collections && this.order.payment_collections.length > 0) {
      const authCollection = this.order.payment_collections.find(
        (pc: any) => pc['status'] === 'authorized' || pc['status'] === 'awaiting'
      );

      if (authCollection) {
        // Check if there are individual payments in the collection
        if (authCollection['payments'] && authCollection['payments'].length > 0) {
          paymentId = authCollection['payments'][0]['id'];
          paymentAmount = authCollection['payments'][0]['amount'] || authCollection['amount'];
          console.log('✅ Using payment from authorized collection:', paymentId);
        } else {
          // No individual payments - use collection ID (Medusa v2 pattern)
          paymentId = authCollection['id'];
          paymentAmount = authCollection['amount'];
          console.log('✅ Using payment collection ID for capture:', paymentId);
        }
      }
    }

    if (!paymentId) {
      console.error('❌ No authorized payment found to capture');
      console.error('Payment collections:', this.order.payment_collections);
      this.showToast('No authorized payment found to capture', 'warning');
      return;
    }

    const alert = await this.alertController.create({
      header: 'Capture Payment',
      message: `Are you sure you want to capture the full amount of ${this.formatCurrency(this.order.total, this.order.currency_code)}?`,
      buttons: [
        { text: 'Cancel', role: 'cancel' },
        {
          text: 'Capture',
          handler: () => {
            this.store.dispatch(new CapturePayment({
              orderId: this.order!.id,
              paymentId: paymentId
            }));
          }
        }
      ]
    });
    await alert.present();
  }

  async openFulfillmentModal() {
    if (!this.order) return;

    const modal = await this.modalController.create({
      component: FulfillmentModalComponent,
      componentProps: {
        order: this.order,
        unfulfilledItems: this.unfulfilledItems
      }
    });

    await modal.present();
    const { data } = await modal.onWillDismiss();

    if (data) {
      // Handle fulfillment creation result if needed
      // The modal likely dispatches the action itself
    }
  }

  async markAsShipped(fulfillmentId: string) {
    const alert = await this.alertController.create({
      header: 'Create Shipment',
      inputs: [
        {
          name: 'trackingNumber',
          type: 'text',
          placeholder: 'Tracking Number'
        },
        {
          name: 'carrier',
          type: 'text',
          placeholder: 'Carrier (e.g., UPS, FedEx)'
        }
      ],
      buttons: [
        { text: 'Cancel', role: 'cancel' },
        {
          text: 'Create Shipment',
          handler: (data) => {
            // Allow creating shipment with or without tracking number
            const trackingNumbers = data.trackingNumber ? [data.trackingNumber] : [];
            this.store.dispatch(new CreateShipment({
              orderId: this.order!.id,
              fulfillmentId,
              trackingNumbers,
              carrier: data.carrier || 'manual'
            }));
            return true; // Close the alert
          }
        }
      ]
    });
    await alert.present();
  }

  markAsDelivered(fulfillmentId: string) {
    this.store.dispatch(new MarkAsDelivered({
      orderId: this.order!.id,
      fulfillmentId
    }));
  }

  async completeOrder() {
    if (!this.order) return;

    const alert = await this.alertController.create({
      header: 'Complete Order',
      message: 'Are you sure you want to complete this order? This action cannot be undone.',
      buttons: [
        { text: 'Cancel', role: 'cancel' },
        {
          text: 'Complete',
          handler: () => {
            this.store.dispatch(new CompleteOrder({ orderId: this.order!.id }));
          }
        }
      ]
    });
    await alert.present();
  }

  async cancelOrder() {
    if (!this.order) return;

    const alert = await this.alertController.create({
      header: 'Cancel Order',
      message: 'Are you sure you want to cancel this order? This action cannot be undone.',
      buttons: [
        { text: 'Back', role: 'cancel' },
        {
          text: 'Cancel Order',
          role: 'destructive',
          handler: () => {
            this.store.dispatch(new CancelOrder({ orderId: this.order!.id }));
          }
        }
      ]
    });
    await alert.present();
  }

  async refundPayment() {
    if (!this.order) return;

    // Find the captured payment
    let paymentId = '';
    let maxRefundAmount = 0;

    if (this.order.payment_collections && this.order.payment_collections.length > 0) {
      for (const collection of this.order.payment_collections) {
        if (collection.payments && collection.payments.length > 0) {
          const capturedPayment = collection.payments.find((p: any) => p.captured_at);
          if (capturedPayment) {
            paymentId = capturedPayment.id;
            maxRefundAmount = capturedPayment.amount || collection.captured_amount || 0;
            break;
          }
        }
      }
    }

    if (!paymentId) {
      this.showToast('No captured payment found to refund', 'warning');
      return;
    }

    const alert = await this.alertController.create({
      header: 'Refund Payment',
      message: `Maximum refundable amount: ${this.formatCurrency(maxRefundAmount, this.order.currency_code)}`,
      inputs: [
        {
          name: 'amount',
          type: 'number',
          placeholder: 'Refund amount (in cents)',
          value: maxRefundAmount,
          min: 1,
          max: maxRefundAmount
        },
        {
          name: 'reason',
          type: 'text',
          placeholder: 'Reason for refund (optional)'
        }
      ],
      buttons: [
        { text: 'Cancel', role: 'cancel' },
        {
          text: 'Refund',
          handler: (data) => {
            const amount = parseInt(data.amount);
            if (isNaN(amount) || amount <= 0 || amount > maxRefundAmount) {
              this.showToast('Invalid refund amount', 'danger');
              return false;
            }
            this.store.dispatch(new RefundPayment({
              orderId: this.order!.id,
              paymentId: paymentId,
              amount: amount,
              reason: data.reason
            }));
            return true;
          }
        }
      ]
    });
    await alert.present();
  }

  // Legacy helper methods needed for template
  getOrderDisplayId(order: Order): string {
    return `#${order.display_id}`;
  }

  getCustomerName(order: Order): string {
    if (order.customer) {
      return `${order.customer.first_name || ''} ${order.customer.last_name || ''}`.trim() || order.email || 'Unknown Customer';
    }
    return order.email || 'Unknown Customer';
  }

  formatDate(dateString: string): string {
    if (!dateString) return '';
    return new Date(dateString).toLocaleString();
  }

  formatCurrency(amount: number | undefined | null, currencyCode: string | undefined): string {
    if (amount === undefined || amount === null) return '';
    const code = currencyCode || 'USD';
    // Medusa amounts are in cents
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: code.toUpperCase()
    }).format(amount / 100);
  }

  getAbsoluteAmount(amount: number | undefined | null): number {
    if (amount === undefined || amount === null) return 0;
    return Math.abs(amount);
  }

  getStatusColor(status: string): string {
    switch (status) {
      case 'pending': return 'warning';
      case 'completed': return 'success';
      case 'archived': return 'medium';
      case 'canceled': return 'danger';
      case 'requires_action': return 'danger';
      default: return 'medium';
    }
  }

  getPaymentStatusColor(status: string): string {
    switch (status) {
      case 'captured': return 'success';
      case 'awaiting': return 'warning';
      case 'not_paid': return 'danger';
      case 'refunded': return 'medium';
      case 'partially_refunded': return 'warning';
      case 'canceled': return 'danger';
      case 'requires_action': return 'danger';
      default: return 'medium';
    }
  }

  getPaymentStatusText(status: string): string {
    return status ? status.replace(/_/g, ' ').toUpperCase() : '';
  }

  getFulfillmentStatusColor(status: string): string {
    switch (status) {
      case 'delivered': return 'success';
      case 'shipped': return 'success';
      case 'fulfilled': return 'success';
      case 'partially_shipped': return 'warning';
      case 'partially_fulfilled': return 'warning';
      case 'not_fulfilled': return 'danger';
      case 'returned': return 'medium';
      case 'partially_returned': return 'warning';
      case 'canceled': return 'danger';
      case 'requires_action': return 'danger';
      default: return 'medium';
    }
  }

  getFulfillmentStatusText(status: string): string {
    return status ? status.replace(/_/g, ' ').toUpperCase() : '';
  }

  getShippingAddressText(order: Order): string {
    if (!order.shipping_address) return 'No shipping address';
    const addr = order.shipping_address;
    return `${addr.address_1}, ${addr.city}, ${addr.province || ''} ${addr.postal_code}, ${addr.country_code.toUpperCase()}`;
  }

  // Helper to cast item to ExtendedOrderItem for template usage
  asExtendedItem(item: OrderItem): ExtendedOrderItem {
    return item as ExtendedOrderItem;
  }

  goBack() {
    this.router.navigate(['/orders']);
  }

  async showToast(message: string, color: string = 'success') {
    const toast = await this.toastController.create({
      message,
      duration: 2000,
      color,
      position: 'bottom'
    });
    await toast.present();
  }

  // DEBUG: Temporary method to dump payment data
  debugPaymentData() {
    console.log('=== PAYMENT DEBUG DATA ===');
    console.log('Order ID:', this.order?.id);
    console.log('Payment Status:', this.order?.payment_status);
    console.log('Payment Collections:', JSON.stringify(this.order?.payment_collections, null, 2));
    alert('Check console for payment data');
  }

  // Check if order has requested returns
  hasRequestedReturns(): boolean {
    if (!this.order || !this.orderReturns || this.orderReturns.length === 0) {
      return false;
    }
    return this.orderReturns.some((ret: any) => ret.status === 'requested');
  }

  // Receive items (mark return as received)
  async receiveItems() {
    if (!this.order) return;

    const requestedReturns = this.orderReturns.filter((ret: any) => ret.status === 'requested');
    
    if (requestedReturns.length === 0) {
      this.showToast('No requested returns found', 'warning');
      return;
    }

    const modal = await this.modalController.create({
      component: ReceiveItemsModalComponent,
      componentProps: {
        order: this.order,
        returns: requestedReturns,
        orderSummary: this.orderSummary
      }
    });

    await modal.present();

    const { data } = await modal.onWillDismiss();
    
    if (data?.success) {
      // Reload order data
      if (this.order) {
        this.loadExtendedOrderData(this.order).subscribe();
        this.store.dispatch(new LoadOrder({ id: this.order.id }));
      }
    }
  }

  // Refund outstanding amount (when negative)
  async refundOutstandingAmount() {
    if (!this.order || !this.orderSummary || this.orderSummary.outstandingAmount >= 0) {
      return;
    }

    const refundAmount = Math.abs(this.orderSummary.outstandingAmount);
    
    // Find the captured payment
    let paymentId = '';
    let maxRefundAmount = 0;

    if (this.order.payment_collections && this.order.payment_collections.length > 0) {
      for (const collection of this.order.payment_collections) {
        if (collection.payments && collection.payments.length > 0) {
          const capturedPayment = collection.payments.find((p: any) => p.captured_at);
          if (capturedPayment) {
            paymentId = capturedPayment.id;
            maxRefundAmount = capturedPayment.amount || collection.captured_amount || 0;
            break;
          }
        }
      }
    }

    if (!paymentId) {
      this.showToast('No captured payment found to refund', 'warning');
      return;
    }

    // Ensure refund amount doesn't exceed max refundable
    const actualRefundAmount = Math.min(refundAmount, maxRefundAmount);

    const alert = await this.alertController.create({
      header: 'Refund Payment',
      message: `Refund ${this.formatCurrency(actualRefundAmount, this.order.currency_code)}?`,
      inputs: [
        {
          name: 'reason',
          type: 'text',
          placeholder: 'Reason for refund (optional)'
        }
      ],
      buttons: [
        { text: 'Cancel', role: 'cancel' },
        {
          text: 'Refund',
          handler: (data) => {
            this.store.dispatch(new RefundPayment({
              orderId: this.order!.id,
              paymentId: paymentId,
              amount: actualRefundAmount,
              reason: data.reason
            }));
            this.showToast('Refund processed', 'success');
          }
        }
      ]
    });
    await alert.present();
  }
}

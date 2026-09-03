import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { Store } from '@ngxs/store';
import { Observable, Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { NgxsFormPluginModule } from '@ngxs/form-plugin';
import { ReturnReason, CreateReturnRequest } from 'src/app/shared/interfaces';
import { ReturnsActions } from 'src/app/store/returns/returns.actions';
import { ReturnsState } from 'src/app/store/returns/returns.state';
import { AlertService } from 'src/app/shared';
import { MedusaCurrency } from 'src/app/shared/pipes';
import { GoiabaHeaderComponent } from 'src/app/components/goiaba-components/goiaba-header/goiaba-header.component';

@Component({
  selector: 'app-create-return',
  templateUrl: './create-return.page.html',
  styleUrls: ['./create-return.page.scss'],
  standalone: true,
  imports: [CommonModule, IonicModule, ReactiveFormsModule, NgxsFormPluginModule, MedusaCurrency, GoiabaHeaderComponent]
})
export class CreateReturnPage implements OnInit, OnDestroy {
  returnForm: FormGroup;
  formPath = 'returns.createReturnForm';
  order$: Observable<any | null>;
  returnReasons$: Observable<ReturnReason[]>;
  loading$: Observable<boolean>;
  error$: Observable<string | null>;
  selectedItems$: Observable<{ [key: string]: any }>;
  availableShippingOptions$: Observable<any[]>;
  selectedItemsCount$: Observable<number>;
  totalRefundAmount$: Observable<number>;
  isFormValid$: Observable<boolean>;

  private destroy$ = new Subject<void>();

  constructor(
    private formBuilder: FormBuilder,
    private store: Store,
    private router: Router,
    private route: ActivatedRoute,
    private alertService: AlertService
  ) {
    this.returnForm = this.formBuilder.group({
      return_shipping: this.formBuilder.group({
        option_id: ['', Validators.required], // Required based on API response
        price: [0]
      })
    });

    // Use selectedOrder from returns state instead of completed order from cart state
    this.order$ = this.store.select(ReturnsState.getSelectedOrder);
    this.returnReasons$ = this.store.select(ReturnsState.getReturnReasons);
    this.loading$ = this.store.select(ReturnsState.getLoading);
    this.error$ = this.store.select(ReturnsState.getError);
    this.selectedItems$ = this.store.select(ReturnsState.getSelectedItems);
    this.availableShippingOptions$ = this.store.select(ReturnsState.getAvailableShippingOptions);
    this.selectedItemsCount$ = this.store.select(ReturnsState.getSelectedItemsCount);
    this.totalRefundAmount$ = this.store.select(ReturnsState.getTotalRefundAmount);
    this.isFormValid$ = this.store.select(ReturnsState.isFormValid);
  }

  ngOnInit() {
    this.store.dispatch(new ReturnsActions.GetReturnReasons());

    this.route.queryParams.pipe(takeUntil(this.destroy$)).subscribe(params => {
      const orderId = params['orderId'];
      if (!orderId || orderId === 'undefined') {
        // Order ID is required - redirect to customer orders page
        this.alertService.presentSimpleAlert('Please select an order to create a return');
        this.router.navigate(['/customer-orders']);
        return;
      }
      
      // Load order details for return creation
      this.store.dispatch(new ReturnsActions.GetOrderForReturn(orderId));
    });

    // Order initialization and shipping options loading are now handled in state
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // Helper methods that use state static methods
  getAvailableReturnQuantity(item: any): number {
    return ReturnsState.getAvailableReturnQuantity(item);
  }

  canReturnItem(item: any): boolean {
    return ReturnsState.canReturnItem(item);
  }

  getFulfilledQuantity(item: any): number {
    return ReturnsState.getFulfilledQuantity(item);
  }

  getReturnStatus(item: any): string {
    return ReturnsState.getReturnStatus(item);
  }

  getReturnStatusText(status: string): string {
    return ReturnsState.getReturnStatusText(status);
  }

  getReturnStatusColor(status: string): string {
    return ReturnsState.getReturnStatusColor(status);
  }

  toggleItemSelection(itemId: string) {
    const order: any = this.store.selectSnapshot(ReturnsState.getSelectedOrder);
    const item = order?.items?.find((i: any) => i.id === itemId);
    const selectedItems = this.store.selectSnapshot(ReturnsState.getSelectedItems);
    
    // Check if item can be returned before allowing selection
    if (item && !selectedItems[itemId]?.selected && !this.canReturnItem(item)) {
      const fulfilledQty = this.getFulfilledQuantity(item);
      const availableQty = this.getAvailableReturnQuantity(item);

      let message = 'This item cannot be returned.';
      if (fulfilledQty === 0) {
        message = 'This item cannot be returned because it was never fulfilled/shipped.';
      } else if (availableQty === 0) {
        message = 'This item cannot be returned. All fulfilled quantities have already been requested for return.';
      }

      this.alertService.presentSimpleAlert(message);
      return;
    }

    this.store.dispatch(new ReturnsActions.ToggleItemSelection(itemId));
  }

  updateItemQuantity(itemId: string, event: any) {
    const quantity = parseInt(event.detail.value);
    const order: any = this.store.selectSnapshot(ReturnsState.getSelectedOrder);
    const item = order?.items?.find((i: any) => i.id === itemId);
    const maxReturnableQty = this.getAvailableReturnQuantity(item);

    if (quantity > maxReturnableQty) {
      this.alertService.presentSimpleAlert(
        `You can only return up to ${maxReturnableQty} items for this product (based on fulfilled quantity).`
      );
    }

    this.store.dispatch(new ReturnsActions.UpdateItemQuantity({ itemId, quantity }));
  }

  updateItemReason(itemId: string, event: any) {
    const reasonId = event.detail.value;
    this.store.dispatch(new ReturnsActions.UpdateItemReason({ itemId, reason_id: reasonId }));
  }

  updateItemNote(itemId: string, event: any) {
    const note = event.detail.value;
    this.store.dispatch(new ReturnsActions.UpdateItemNote({ itemId, note }));
  }

  async submitReturn() {
    const order = this.store.selectSnapshot(ReturnsState.getSelectedOrder);
    const selectedItems = this.store.selectSnapshot(ReturnsState.getSelectedItems);
    const formValue = this.store.selectSnapshot(ReturnsState.getCreateReturnForm)?.model || this.returnForm.value;

    // Validate has selected items
    const hasSelectedItems = Object.values(selectedItems).some(item => item.selected && item.quantity > 0);
    if (!hasSelectedItems) {
      this.alertService.presentSimpleAlert('Please select at least one item to return');
      return;
    }

    if (!order || !order.id) {
      this.alertService.presentSimpleAlert('Order not found. Please select an order first.');
      this.router.navigate(['/customer-orders']);
      return;
    }

    // Build items array
    const items = Object.entries(selectedItems)
      .filter(([_, item]) => item.selected && item.quantity > 0)
      .map(([itemId, item]) => ({
        id: itemId,
        quantity: item.quantity,
        reason_id: item.reason_id,
        note: item.note || ''
      }));

    // Build return data
    const returnData: CreateReturnRequest = {
      order_id: order.id,
      items
    };

    // Add return_shipping if available
    if (formValue.return_shipping?.option_id) {
      returnData.return_shipping = formValue.return_shipping;
    }

    try {
      await this.store.dispatch(new ReturnsActions.CreateReturn(returnData)).toPromise();
      this.alertService.presentSimpleAlert('Return created successfully!');
      
      // Navigate back
      if (order?.id) {
        this.router.navigate(['/order-review'], {
          queryParams: { orderId: order.id, payment: false }
        });
      } else {
        this.router.navigate(['/customer-orders']);
      }
    } catch (error: any) {
      const errorMessage = error?.error?.message || 'Failed to create return. Please try again.';
      this.alertService.presentSimpleAlert(errorMessage);
    }
  }

  goBack() {
    // Navigate back to customer orders or order-review if we have order context
    const order: any = this.store.selectSnapshot(ReturnsState.getSelectedOrder);
    if (order?.id) {
      this.router.navigate(['/order-review'], {
        queryParams: { orderId: order.id, payment: false }
      });
    } else {
      this.router.navigate(['/customer-orders']);
    }
  }
}


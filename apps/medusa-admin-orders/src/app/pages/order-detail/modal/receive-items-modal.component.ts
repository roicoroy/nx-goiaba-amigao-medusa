import { Component, inject, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule, ModalController, ToastController } from '@ionic/angular';
import { Store } from '@ngxs/store';
import { MedusaAdminService } from '../../../shared/api/medusa.service.admin';
import { Order, Return, ReturnItem } from '../../../shared/admin-interfaces';
import { LoadOrder } from '../../../store/orders/orders.actions';
import { OrderSummary } from '../order-detail.interfaces';
import { OrderDetailHelpers } from '../order-detail.helpers';

interface ReceiveItem {
  returnId: string;
  returnItemId: string;
  orderItemId: string;
  title: string;
  subtitle: string;
  thumbnail: string | null;
  variantSku: string;
  requestedQuantity: number;
  receivedQuantity: number; // editable quantity
  maxQuantity: number;
  quantityError?: string;
}

@Component({
  selector: 'app-receive-items-modal',
  templateUrl: './receive-items-modal.component.html',
  styleUrls: ['./receive-items-modal.component.scss'],
  standalone: true,
  imports: [
    IonicModule,
    CommonModule,
    FormsModule
  ]
})
export class ReceiveItemsModalComponent implements OnInit {
  private store = inject(Store);
  private modalController = inject(ModalController);
  private medusaAdminService = inject(MedusaAdminService);
  private toastController = inject(ToastController);

  @Input() order!: Order;
  @Input() returns!: Return[];
  @Input() orderSummary!: OrderSummary | null;

  receiveItems: ReceiveItem[] = [];
  sendNotification: boolean = true;
  isLoading: boolean = false;

  ngOnInit() {
    this.initializeReceiveItems();
  }

  private initializeReceiveItems() {
    this.receiveItems = [];

    // Get all requested returns
    const requestedReturns = this.returns.filter(ret => ret.status === 'requested');

    requestedReturns.forEach(returnItem => {
      if (returnItem.items && returnItem.items.length > 0) {
        returnItem.items.forEach((item: ReturnItem) => {
          // Find the corresponding order item
          const orderItem = this.order.items?.find(oi => oi.id === item.item_id);
          
          if (orderItem) {
            // Use requested_quantity if available, otherwise use quantity
            const requestedQty = (typeof item.requested_quantity === 'number' && item.requested_quantity > 0)
              ? item.requested_quantity 
              : item.quantity;
            
            // Default received quantity to requested quantity
            const defaultReceivedQty = requestedQty;
            
            this.receiveItems.push({
              returnId: returnItem.id,
              returnItemId: item.return_id || returnItem.id,
              orderItemId: item.item_id,
              title: orderItem.title,
              subtitle: orderItem.subtitle || orderItem.variant_title || '',
              thumbnail: orderItem.thumbnail,
              variantSku: orderItem.variant_sku || '',
              requestedQuantity: requestedQty,
              receivedQuantity: defaultReceivedQty, // Default to requested quantity
              maxQuantity: requestedQty // Can't receive more than requested
            });
          }
        });
      }
    });
  }

  validateQuantities(): boolean {
    let isValid = true;
    
    this.receiveItems.forEach(item => {
      item.quantityError = undefined;
      
      if (item.receivedQuantity < 0) {
        item.quantityError = 'Quantity cannot be negative';
        isValid = false;
      } else if (item.receivedQuantity > item.maxQuantity) {
        item.quantityError = `Cannot receive more than ${item.maxQuantity}`;
        isValid = false;
      } else if (item.receivedQuantity === 0) {
        item.quantityError = 'Quantity must be greater than 0';
        isValid = false;
      }
    });

    return isValid;
  }

  formatCurrency(amount: number | undefined | null, currencyCode: string | undefined): string {
    if (amount === undefined || amount === null) return '';
    const code = currencyCode || 'USD';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: code.toUpperCase()
    }).format(amount / 100);
  }

  getOrderDisplayId(): string {
    return `#${this.order.display_id}`;
  }

  async onSave() {
    if (!this.validateQuantities()) {
      const toast = await this.toastController.create({
        message: 'Please fix quantity errors before saving',
        duration: 2000,
        color: 'danger',
        position: 'bottom'
      });
      await toast.present();
      return;
    }

    this.isLoading = true;

    try {
      // Group items by return ID
      const returnsToProcess = new Map<string, Array<{ item_id: string; quantity: number }>>();

      this.receiveItems.forEach(item => {
        if (!returnsToProcess.has(item.returnId)) {
          returnsToProcess.set(item.returnId, []);
        }
        // Use the order line item ID for the items array
        returnsToProcess.get(item.returnId)!.push({
          item_id: item.orderItemId,
          quantity: item.receivedQuantity
        });
      });

      // Process each return
      const promises = Array.from(returnsToProcess.entries()).map(([returnId, items]) => {
        return this.medusaAdminService.receiveReturn(returnId, {
          items: items,
          no_notification: !this.sendNotification
        }).toPromise();
      });

      await Promise.all(promises);

      // Reload order data
      this.store.dispatch(new LoadOrder({ id: this.order.id }));

      const toast = await this.toastController.create({
        message: 'Items received successfully',
        duration: 2000,
        color: 'success',
        position: 'bottom'
      });
      await toast.present();

      this.modalController.dismiss({ success: true });
    } catch (error: any) {
      const toast = await this.toastController.create({
        message: error.userMessage || 'Failed to receive items',
        duration: 3000,
        color: 'danger',
        position: 'bottom'
      });
      await toast.present();
    } finally {
      this.isLoading = false;
    }
  }

  onCancel() {
    this.modalController.dismiss();
  }
}


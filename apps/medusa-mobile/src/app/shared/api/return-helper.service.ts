import { Injectable } from '@angular/core';
import { ReturnStatus, OrderReturnItem, MedusaReturn } from '../interfaces';

@Injectable({
  providedIn: 'root'
})
export class ReturnHelperService {

  /**
   * Get human-readable status text for return status
   */
  getStatusText(status: ReturnStatus): string {
    switch (status) {
      case 'requested':
        return 'Return Requested';
      case 'received':
        return 'Items Received';
      case 'requires_action':
        return 'Action Required';
      case 'canceled':
        return 'Return Canceled';
      default:
        return status;
    }
  }

  /**
   * Get color for return status
   */
  getStatusColor(status: ReturnStatus): string {
    switch (status) {
      case 'requested':
        return 'warning';
      case 'received':
        return 'success';
      case 'requires_action':
        return 'danger';
      case 'canceled':
        return 'medium';
      default:
        return 'primary';
    }
  }

  /**
   * Calculate total return value
   */
  calculateReturnValue(returnItems: OrderReturnItem[]): number {
    return returnItems.reduce((total, item) => {
      if (item.item && item.item.unit_price) {
        return total + (item.item.unit_price * item.quantity);
      }
      return total;
    }, 0);
  }

  /**
   * Get return progress percentage
   */
  getReturnProgress(returnItem: MedusaReturn): number {
    const totalItems = returnItem.items.reduce((sum: number, item: OrderReturnItem) => sum + item.quantity, 0);
    const receivedItems = returnItem.items.reduce((sum: number, item: OrderReturnItem) => sum + (item.received_quantity || 0), 0);

    if (totalItems === 0) return 0;
    return Math.round((receivedItems / totalItems) * 100);
  }

  /**
   * Check if return can be canceled
   */
  canCancelReturn(returnItem: MedusaReturn): boolean {
    return returnItem.status === 'requested';
  }

  /**
   * Check if return is complete
   */
  isReturnComplete(returnItem: MedusaReturn): boolean {
    return returnItem.status === 'received';
  }

  /**
   * Get return timeline events
   */
  getReturnTimeline(returnItem: MedusaReturn): Array<{
    date: string;
    title: string;
    description: string;
    icon: string;
    color: string;
  }> {
    const timeline = [];

    if (returnItem.created_at) {
      timeline.push({
        date: returnItem.created_at.toString(),
        title: 'Return Created',
        description: 'Return request was initiated',
        icon: 'create-outline',
        color: 'primary'
      });
    }

    if (returnItem.requested_at) {
      timeline.push({
        date: returnItem.requested_at.toString(),
        title: 'Return Requested',
        description: 'Return request has been submitted for processing',
        icon: 'paper-plane-outline',
        color: 'warning'
      });
    }

    if (returnItem.received_at) {
      timeline.push({
        date: returnItem.received_at.toString(),
        title: 'Items Received',
        description: 'Returned items have been received and processed',
        icon: 'checkmark-circle-outline',
        color: 'success'
      });
    }

    if (returnItem.canceled_at) {
      timeline.push({
        date: returnItem.canceled_at.toString(),
        title: 'Return Canceled',
        description: 'Return request was canceled',
        icon: 'close-circle-outline',
        color: 'danger'
      });
    }

    return timeline.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }

  /**
   * Validate return request
   */
  validateReturnRequest(orderItems: any[], selectedItems: any): {
    isValid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    // Check if any items are selected
    const hasSelectedItems = Object.values(selectedItems).some((item: any) =>
      item.selected && item.quantity > 0
    );

    if (!hasSelectedItems) {
      errors.push('Please select at least one item to return');
    }

    // Validate quantities and reasons
    Object.entries(selectedItems).forEach(([itemId, item]: [string, any]) => {
      if (item.selected) {
        const orderItem = orderItems.find(oi => oi.id === itemId);

        if (!orderItem) {
          errors.push(`Order item not found: ${itemId}`);
          return;
        }

        if (item.quantity <= 0) {
          errors.push(`Invalid quantity for ${orderItem.title}`);
        }

        if (item.quantity > orderItem.quantity) {
          errors.push(`Return quantity cannot exceed ordered quantity for ${orderItem.title}`);
        }

        // Note: reason_id is optional in the API, but we'll use a default if not provided
        // Validation will allow missing reason_id, and the submit handler will use a default
      }
    });

    return {
      isValid: errors.length === 0,
      errors
    };
  }
}

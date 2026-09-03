import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { OrderChange, OrderChangeAction } from '../../pages/order-detail/order-detail.interfaces';

@Component({
  selector: 'app-order-changes-timeline',
  templateUrl: './order-changes-timeline.component.html',
  styleUrls: ['./order-changes-timeline.component.scss'],
  standalone: true,
  imports: [CommonModule, IonicModule]
})
export class OrderChangesTimelineComponent {
  @Input() orderChanges: OrderChange[] = [];

  getActionIcon(action: string): string {
    switch (action) {
      case 'FULFILL_ITEM':
        return 'cube-outline';
      case 'SHIP_ITEM':
        return 'airplane-outline';
      case 'DELIVER_ITEM':
        return 'checkmark-done-outline';
      case 'RETURN_ITEM':
        return 'return-down-back-outline';
      case 'CANCEL_ITEM':
        return 'close-circle-outline';
      case 'ADD_ITEM':
        return 'add-circle-outline';
      case 'REMOVE_ITEM':
        return 'remove-circle-outline';
      default:
        return 'ellipse-outline';
    }
  }

  getActionColor(action: string): string {
    switch (action) {
      case 'FULFILL_ITEM':
        return 'primary';
      case 'SHIP_ITEM':
        return 'tertiary';
      case 'DELIVER_ITEM':
        return 'success';
      case 'RETURN_ITEM':
        return 'warning';
      case 'CANCEL_ITEM':
        return 'danger';
      case 'ADD_ITEM':
        return 'success';
      case 'REMOVE_ITEM':
        return 'danger';
      default:
        return 'medium';
    }
  }

  getActionLabel(action: string): string {
    switch (action) {
      case 'FULFILL_ITEM':
        return 'Fulfilled';
      case 'SHIP_ITEM':
        return 'Shipped';
      case 'DELIVER_ITEM':
        return 'Delivered';
      case 'RETURN_ITEM':
        return 'Returned';
      case 'CANCEL_ITEM':
        return 'Canceled';
      case 'ADD_ITEM':
        return 'Item Added';
      case 'REMOVE_ITEM':
        return 'Item Removed';
      default:
        return action.replace(/_/g, ' ').toLowerCase();
    }
  }

  getStatusColor(status: string): string {
    switch (status) {
      case 'confirmed':
        return 'success';
      case 'pending':
        return 'warning';
      case 'requested':
        return 'tertiary';
      case 'declined':
        return 'danger';
      case 'canceled':
        return 'medium';
      default:
        return 'medium';
    }
  }

  getStatusLabel(status: string): string {
    return status.charAt(0).toUpperCase() + status.slice(1);
  }

  formatDate(dateString: string): string {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  getRelativeTime(dateString: string): string {
    if (!dateString) return '';
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    return this.formatDate(dateString);
  }

  getActionDetails(action: OrderChangeAction): string {
    const details: string[] = [];
    
    if (action.details.quantity) {
      details.push(`Quantity: ${action.details.quantity}`);
    }
    
    if (action.reference) {
      details.push(`Reference: ${action.reference}`);
    }
    
    return details.join(' • ');
  }
}


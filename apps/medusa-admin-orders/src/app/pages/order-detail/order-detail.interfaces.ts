import { Order, OrderItem } from '../../shared/admin-interfaces';

export interface OrderSummary {
    itemSubtotal: number;
    shippingSubtotal: number;
    taxTotal: number;
    orderTotal: number;
    discountTotal: number;
    totalAfterDiscount: number;
    paidTotal: number;
    outstandingAmount: number;
}

export interface OrderActivity {
    type: 'order_placed' | 'payment_authorized' | 'payment_captured' |
    'fulfillment_created' | 'shipment_created' | 'order_completed' |
    'order_cancelled' | 'item_fulfilled' | 'item_added' | 'item_removed' |
    'change_confirmed' | 'item_shipped' | 'item_delivered';
    message: string;
    timestamp: Date;
    amount?: number;
    status?: string;
}

// Extend OrderItem to include properties that might be present in the API response
// but missing from the strict interface
export interface ExtendedOrderItem extends OrderItem {
    variant?: {
        title?: string;
        sku?: string;
        product?: any;
    };
    fulfilled_quantity?: number;
    shipped_quantity?: number;
}

export interface UnfulfilledItem extends ExtendedOrderItem {
    requiresShipping: boolean;
    awaitingFulfillment: boolean;
}

// Order Changes Interfaces
export interface OrderChangeAction {
    id: string;
    order_id: string;
    return_id: string | null;
    claim_id: string | null;
    exchange_id: string | null;
    ordering: number;
    version: number;
    reference: string;
    reference_id: string;
    action: 'FULFILL_ITEM' | 'SHIP_ITEM' | 'DELIVER_ITEM' | 'RETURN_ITEM' | 'CANCEL_ITEM' | 'ADD_ITEM' | 'REMOVE_ITEM';
    details: {
        quantity?: number | string;
        reference_id?: string;
        [key: string]: any;
    };
    internal_note: string | null;
    applied: boolean;
    order_change_id: string;
    raw_amount: number | null;
    created_at: string;
    updated_at: string;
    deleted_at: string | null;
    amount: number | null;
}

export interface OrderChange {
    id: string;
    order_id: string;
    return_id: string | null;
    claim_id: string | null;
    exchange_id: string | null;
    version: number;
    change_type: string | null;
    description: string | null;
    status: 'pending' | 'requested' | 'declined' | 'confirmed' | 'canceled';
    internal_note: string | null;
    created_by: string | null;
    requested_by: string | null;
    requested_at: string | null;
    confirmed_by: string | null;
    confirmed_at: string | null;
    declined_by: string | null;
    declined_reason: string | null;
    metadata: Record<string, any> | null;
    declined_at: string | null;
    canceled_by: string | null;
    canceled_at: string | null;
    created_at: string;
    updated_at: string;
    actions: OrderChangeAction[];
}

export interface OrderChangesResponse {
    order_changes: OrderChange[];
}

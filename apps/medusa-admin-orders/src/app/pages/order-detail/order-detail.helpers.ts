import { Order, OrderItem, OrderStatus } from '../../shared/admin-interfaces';
import { OrderSummary, OrderActivity, UnfulfilledItem, ExtendedOrderItem } from './order-detail.interfaces';

export class OrderDetailHelpers {

    /**
     * Calculate comprehensive order summary
     */
    static calculateOrderSummary(order: Order): OrderSummary {
        const itemSubtotal = order.subtotal || 0;
        const shippingSubtotal = order.shipping_total || 0;
        const taxTotal = order.tax_total || 0;
        const discountTotal = order.discount_total || 0;
        const orderTotal = order.total || 0;
        const totalAfterDiscount = orderTotal; // In Medusa, total is usually after discount

        // Calculate paid total from payment collections
        let paidTotal = 0;
        if (order.payment_collections && order.payment_collections.length > 0) {
            paidTotal = order.payment_collections
                .filter((pc: any) => pc.status === 'captured')
                .reduce((sum: number, pc: any) => sum + (pc.amount || 0), 0);
        } else if (order.payment_status === 'captured') {
            // Fallback if payment_collections not available but status is captured
            paidTotal = order.total;
        }

        const outstandingAmount = Math.max(0, orderTotal - paidTotal);

        return {
            itemSubtotal,
            shippingSubtotal,
            taxTotal,
            orderTotal,
            discountTotal,
            totalAfterDiscount,
            paidTotal,
            outstandingAmount
        };
    }

    /**
     * Get unfulfilled items from order
     */
    static getUnfulfilledItems(order: Order): UnfulfilledItem[] {
        if (!order.items) return [];

        return (order.items as any[])
            .filter((item: any) => {
                // Check if item has unfulfilled quantity
                // Medusa v2 might nest this in 'detail' object
                const fulfilledQty = item.fulfilled_quantity || item.detail?.fulfilled_quantity || 0;
                const totalQty = item.quantity || 0;
                return fulfilledQty < totalQty;
            })
            .map((item: any) => ({
                ...item,
                requiresShipping: true,
                awaitingFulfillment: true
            }));
    }

    /**
     * Generate activity timeline from order
     */
    static generateOrderActivity(order: Order, orderChanges: any[] = []): OrderActivity[] {
        const activities: OrderActivity[] = [];

        // Order placed
        if (order.created_at) {
            activities.push({
                type: 'order_placed',
                message: 'Order placed',
                timestamp: new Date(order.created_at),
                amount: order.total
            });
        }

        // Payment authorized
        if (order.payment_status === 'authorized' || order.payment_status === 'captured') {
            // Find authorization time if possible, else use created_at
            activities.push({
                type: 'payment_authorized',
                message: 'Payment authorized',
                timestamp: new Date(order.created_at),
                amount: order.total,
                status: 'authorized'
            });
        }

        // Payment captured
        if (order.payment_status === 'captured') {
            activities.push({
                type: 'payment_captured',
                message: 'Payment captured',
                timestamp: new Date(order.updated_at || order.created_at), // Approximation
                amount: order.total,
                status: 'captured'
            });
        }

        // Fulfillments
        if (order.fulfillments && order.fulfillments.length > 0) {
            order.fulfillments.forEach((fulfillment: any) => {
                activities.push({
                    type: 'fulfillment_created',
                    message: 'Fulfillment created',
                    timestamp: new Date(fulfillment.created_at),
                    status: fulfillment.status
                });

                // Shipments
                if (fulfillment.shipments && fulfillment.shipments.length > 0) {
                    fulfillment.shipments.forEach((shipment: any) => {
                        activities.push({
                            type: 'shipment_created',
                            message: 'Shipment created',
                            timestamp: new Date(shipment.created_at)
                        });
                    });
                }
            });
        }

        // Order Changes (Edits, Fulfillments via changes, etc.)
        if (orderChanges && orderChanges.length > 0) {
            orderChanges.forEach(change => {
                // Process actions within the change
                if (change.actions && change.actions.length > 0) {
                    change.actions.forEach((action: any) => {
                        if (action.action === 'FULFILL_ITEM') {
                            activities.push({
                                type: 'item_fulfilled',
                                message: `Item fulfilled (Qty: ${action.details?.quantity || 1})`,
                                timestamp: new Date(action.created_at || change.created_at),
                                status: 'fulfilled'
                            });
                        } else if (action.action === 'SHIP_ITEM') {
                            activities.push({
                                type: 'item_shipped',
                                message: `Item shipped (Qty: ${action.details?.quantity || 1})`,
                                timestamp: new Date(action.created_at || change.created_at),
                                status: 'shipped'
                            });
                        } else if (action.action === 'DELIVER_ITEM') {
                            activities.push({
                                type: 'item_delivered',
                                message: `Item delivered (Qty: ${action.details?.quantity || 1})`,
                                timestamp: new Date(action.created_at || change.created_at),
                                status: 'delivered'
                            });
                        } else if (action.action === 'ITEM_ADD') {
                            activities.push({
                                type: 'item_added',
                                message: 'Item added to order',
                                timestamp: new Date(action.created_at || change.created_at),
                            });
                        } else if (action.action === 'ITEM_REMOVE') {
                            activities.push({
                                type: 'item_removed',
                                message: 'Item removed from order',
                                timestamp: new Date(action.created_at || change.created_at),
                            });
                        }
                    });
                }

                // General change status
                if (change.status === 'confirmed' && change.confirmed_at) {
                    activities.push({
                        type: 'change_confirmed',
                        message: 'Order change confirmed',
                        timestamp: new Date(change.confirmed_at),
                        status: 'confirmed'
                    });
                }
            });
        }

        // Order completed
        if (order.status === OrderStatus.COMPLETED) {
            activities.push({
                type: 'order_completed',
                message: 'Order completed',
                timestamp: new Date(order.updated_at || order.created_at),
                status: 'completed'
            });
        }

        // Order cancelled
        if (order.status === OrderStatus.CANCELED) {
            activities.push({
                type: 'order_cancelled',
                message: 'Order cancelled',
                timestamp: new Date(order.canceled_at || order.updated_at || order.created_at),
                status: 'cancelled'
            });
        }

        // Sort by timestamp (most recent first)
        return activities.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
    }

    /**
     * Get relative time string (e.g., "about 22 hours ago")
     */
    static getRelativeTime(dateString: string | Date): string {
        if (!dateString) return '';
        const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffSecs = Math.floor(diffMs / 1000);
        const diffMins = Math.floor(diffSecs / 60);
        const diffHours = Math.floor(diffMins / 60);
        const diffDays = Math.floor(diffHours / 24);

        if (diffSecs < 60) return 'just now';
        if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
        if (diffHours < 24) return `about ${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
        if (diffDays < 30) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;

        return date.toLocaleDateString();
    }

    /**
     * Get payment provider display name
     */
    static getPaymentProvider(payment: any): string {
        if (!payment || !payment.provider_id) return 'Unknown';
        return payment.provider_id.replace('pp_', '').replace('_', ' ');
    }

    /**
     * Check if payment can be captured
     */
    static canCapturePayment(order: Order): boolean {
        return order.payment_status === 'authorized' || order.payment_status === 'awaiting';
    }

    /**
     * Get metadata keys count
     */
    static getMetadataCount(order: Order): number {
        if (!order.metadata) return 0;
        return Object.keys(order.metadata).length;
    }

    /**
     * Get JSON keys count
     */
    static getJSONKeyCount(order: Order): number {
        if (!order) return 0;
        return Object.keys(order).length;
    }
}

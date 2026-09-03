import { Order, OrderFilters } from '../../shared/admin-interfaces';

// Orders List Actions
export class LoadOrders {
  static readonly type = '[Orders] Load Orders';
  constructor(readonly payload?: { params?: OrderFilters; append?: boolean }) { }
}

export class LoadOrdersSuccess {
  static readonly type = '[Orders] Load Orders Success';
  constructor(readonly payload: { orders: Order[]; count: number; offset: number; limit: number; append?: boolean }) { }
}

export class LoadOrdersFailure {
  static readonly type = '[Orders] Load Orders Failure';
  constructor(readonly payload: { error: string }) { }
}

// Pagination Actions
export class LoadMoreOrders {
  static readonly type = '[Orders] Load More Orders';
  constructor(readonly payload?: { params?: OrderFilters }) { }
}

export class GoToPage {
  static readonly type = '[Orders] Go To Page';
  constructor(readonly payload: { page: number; limit?: number }) { }
}

// Single Order Actions
export class LoadOrder {
  static readonly type = '[Orders] Load Order';
  constructor(readonly payload: { id: string }) { }
}

export class LoadOrderSuccess {
  static readonly type = '[Orders] Load Order Success';
  constructor(readonly payload: { order: Order }) { }
}

export class LoadOrderFailure {
  static readonly type = '[Orders] Load Order Failure';
  constructor(readonly payload: { error: string }) { }
}

// Order Fulfillment Actions
export class CreateFulfillment {
  static readonly type = '[Orders] Create Fulfillment';
  constructor(readonly payload: {
    orderId: string;
    location_id: string;
    shipping_option_id: string;
    no_notification: boolean;
    items: { id: string; quantity: number }[];
  }) { }
}

export class CreateFulfillmentSuccess {
  static readonly type = '[Orders] Create Fulfillment Success';
  constructor(readonly payload: { order: Order }) { }
}

export class CancelFulfillment {
  static readonly type = '[Orders] Cancel Fulfillment';
  constructor(readonly payload: { orderId: string; fulfillmentId: string }) { }
}

export class CreateShipment {
  static readonly type = '[Orders] Create Shipment';
  constructor(readonly payload: {
    orderId: string;
    fulfillmentId: string;
    trackingNumbers?: string[];
    carrier?: string;
  }) { }
}

export class MarkAsDelivered {
  static readonly type = '[Orders] Mark As Delivered';
  constructor(readonly payload: {
    orderId: string;
    fulfillmentId: string;
  }) { }
}

// Order Payment Actions
export class CapturePayment {
  static readonly type = '[Orders] Capture Payment';
  constructor(readonly payload: { orderId: string; paymentId: string; amount?: number }) { }
}

export class CapturePaymentSuccess {
  static readonly type = '[Orders] Capture Payment Success';
  constructor(readonly payload: { paymentId: string; captureData: any }) { }
}

export class CapturePaymentFailure {
  static readonly type = '[Orders] Capture Payment Failure';
  constructor(readonly payload: { error: string }) { }
}

export class RefundPayment {
  static readonly type = '[Orders] Refund Payment';
  constructor(readonly payload: { orderId: string; paymentId: string; amount: number; reason?: string }) { }
}

// Order Status Actions
export class CompleteOrder {
  static readonly type = '[Orders] Complete Order';
  constructor(readonly payload: { orderId: string }) { }
}

export class CancelOrder {
  static readonly type = '[Orders] Cancel Order';
  constructor(readonly payload: { orderId: string }) { }
}

export class ArchiveOrder {
  static readonly type = '[Orders] Archive Order';
  constructor(readonly payload: { orderId: string }) { }
}

// Additional Order Actions
export class UpdateOrder {
  static readonly type = '[Orders] Update Order';
  constructor(readonly payload: { orderId: string; data: any }) { }
}

export class UpdateOrderSuccess {
  static readonly type = '[Orders] Update Order Success';
  constructor(readonly payload: { order: Order }) { }
}

export class UpdateOrderFailure {
  static readonly type = '[Orders] Update Order Failure';
  constructor(readonly payload: { error: string }) { }
}

// Filter and Search Actions
export class SetOrdersFilter {
  static readonly type = '[Orders] Set Filter';
  constructor(readonly payload: { filter: OrderFilters }) { }
}

export class ClearOrdersFilter {
  static readonly type = '[Orders] Clear Filter';
}

// UI State Actions
export class SetSelectedOrder {
  static readonly type = '[Orders] Set Selected Order';
  constructor(readonly payload: { orderId: string | null }) { }
}

// Returns Actions
export class LoadReturns {
  static readonly type = '[Orders] Load Returns';
  constructor(readonly payload: { orderId?: string }) { }
}

export class LoadReturnsSuccess {
  static readonly type = '[Orders] Load Returns Success';
  constructor(readonly payload: { returns: any[]; orderId?: string }) { }
}

export class LoadReturnsFailure {
  static readonly type = '[Orders] Load Returns Failure';
  constructor(readonly payload: { error: string }) { }
}

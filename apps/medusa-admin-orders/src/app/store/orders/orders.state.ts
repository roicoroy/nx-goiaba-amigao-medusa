import { Injectable, inject } from '@angular/core';
import { Action, Selector, State, StateContext } from '@ngxs/store';
import { tap, catchError, switchMap } from 'rxjs/operators';
import { throwError } from 'rxjs';
import { MedusaAdminService } from '../../shared/api/medusa.service.admin';
import { Order, OrderFilters, OrderStatus, FulfillmentStatus, Return } from '../../shared/admin-interfaces';
import {
  LoadOrders, LoadOrdersSuccess, LoadOrdersFailure,
  LoadOrder, LoadOrderSuccess, LoadOrderFailure,
  CreateFulfillment, CreateFulfillmentSuccess,
  CreateShipment,
  MarkAsDelivered,
  CapturePayment, CapturePaymentSuccess, CapturePaymentFailure,
  CompleteOrder,
  CancelOrder,
  RefundPayment,
  UpdateOrder, UpdateOrderSuccess, UpdateOrderFailure,
  SetOrdersFilter, ClearOrdersFilter, SetSelectedOrder,
  LoadMoreOrders, GoToPage,
  LoadReturns, LoadReturnsSuccess, LoadReturnsFailure
} from './orders.actions';

export interface OrdersStateModel {
  orders: Order[];
  selectedOrder: Order | null;
  selectedOrderId: string | null;
  loading: boolean;
  error: string | null;
  filter: OrderFilters;
  pagination: {
    count: number;
    offset: number;
    limit: number;
  };
  returns: Map<string, Return[]>; // Map of orderId -> returns[]
  returnsLoading: boolean;
}

@State<OrdersStateModel>({
  name: 'orders',
  defaults: {
    orders: [],
    selectedOrder: null,
    selectedOrderId: null,
    loading: false,
    error: null,
    filter: {},
    pagination: {
      count: 0,
      offset: 0,
      limit: 15
    },
    returns: new Map<string, Return[]>(),
    returnsLoading: false
  }
})
@Injectable()
export class OrdersState {
  private medusaAdminService = inject(MedusaAdminService);

  @Selector()
  static getOrders(state: OrdersStateModel): Order[] {
    return state.orders;
  }

  @Selector()
  static getSelectedOrder(state: OrdersStateModel): Order | null {
    return state.selectedOrder;
  }

  @Selector()
  static isLoading(state: OrdersStateModel): boolean {
    return state.loading;
  }

  @Selector()
  static getError(state: OrdersStateModel): string | null {
    return state.error;
  }

  @Selector()
  static getFilter(state: OrdersStateModel): OrderFilters {
    return state.filter;
  }

  @Selector()
  static getPagination(state: OrdersStateModel) {
    return state.pagination;
  }

  @Selector()
  static getPendingOrders(state: OrdersStateModel): Order[] {
    return state.orders.filter(order =>
      order.status === OrderStatus.PENDING || order.fulfillment_status === FulfillmentStatus.NOT_FULFILLED
    );
  }

  @Selector()
  static getOrdersByStatus(state: OrdersStateModel) {
    return (status: OrderStatus) => state.orders.filter(order => order.status === status);
  }

  @Selector()
  static getReturns(state: OrdersStateModel) {
    return state.returns;
  }
  
  static getReturnsForOrder(state: OrdersStateModel, orderId: string): Return[] {
    return state.returns.get(orderId) || [];
  }

  @Selector()
  static getReturnsLoading(state: OrdersStateModel): boolean {
    return state.returnsLoading;
  }

  @Selector()
  static getOrderWithReturns(state: OrdersStateModel) {
    return (orderId: string) => {
      const order = state.orders.find(o => o.id === orderId);
      const returns = state.returns.get(orderId) || [];
      return { order, returns };
    };
  }

  // Load Orders Actions
  @Action(LoadOrders)
  loadOrders(ctx: StateContext<OrdersStateModel>, { payload }: LoadOrders) {
    ctx.patchState({ loading: true, error: null });

    const state = ctx.getState();
    // Get current pagination or use defaults
    const currentPagination = state.pagination;
    
    // Default parameters with essential fields for orders list
    const defaultParams: OrderFilters = {
      limit: currentPagination.limit || 15,
      offset: payload?.append ? currentPagination.offset : 0,
      fields: 'id,display_id,status,email,total,created_at,updated_at,payment_status,fulfillment_status,currency_code,*customer,*items,*fulfillments,*payment_collections.payments'
    };

    // Merge with existing filters and provided params
    const params = { 
      ...state.filter,
      ...defaultParams, 
      ...payload?.params 
    };

    return this.medusaAdminService.getOrders(params).pipe(
      tap((response: any) => {
        ctx.dispatch(new LoadOrdersSuccess({
          orders: response.orders || [],
          count: response.count || 0,
          offset: response.offset || 0,
          limit: response.limit || 15,
          append: payload?.append || false
        }));
      }),
      catchError((error) => {
        ctx.dispatch(new LoadOrdersFailure({ error: error.userMessage || 'Failed to load orders' }));
        return throwError(() => error);
      })
    );
  }

  @Action(LoadOrdersSuccess)
  loadOrdersSuccess(ctx: StateContext<OrdersStateModel>, { payload }: LoadOrdersSuccess) {
    const state = ctx.getState();
    
    // If append is true, append new orders to existing ones; otherwise replace
    const orders = payload.append 
      ? [...state.orders, ...payload.orders]
      : payload.orders;

    ctx.patchState({
      orders: orders,
      loading: false,
      error: null,
      pagination: {
        count: payload.count,
        offset: payload.offset,
        limit: payload.limit
      }
    });

    // Load returns for all loaded orders (without orderId to get all returns, then filter by order_id)
    // This is more efficient than loading returns for each order individually
    ctx.dispatch(new LoadReturns({}));
  }

  @Action(LoadOrdersFailure)
  loadOrdersFailure(ctx: StateContext<OrdersStateModel>, { payload }: LoadOrdersFailure) {
    ctx.patchState({
      loading: false,
      error: payload.error
    });
  }

  // Single Order Actions
  @Action(LoadOrder)
  loadOrder(ctx: StateContext<OrdersStateModel>, { payload }: LoadOrder) {
    ctx.patchState({ loading: true, error: null });

    return this.medusaAdminService.getOrder(payload.id).pipe(
      tap((response: any) => {
        ctx.dispatch(new LoadOrderSuccess({ order: response.order }));
      }),
      catchError((error) => {
        ctx.dispatch(new LoadOrderFailure({ error: error.userMessage || 'Failed to load order' }));
        return throwError(() => error);
      })
    );
  }

  @Action(LoadOrderSuccess)
  loadOrderSuccess(ctx: StateContext<OrdersStateModel>, { payload }: LoadOrderSuccess) {
    const state = ctx.getState();
    // Update selected order
    ctx.patchState({
      selectedOrder: payload.order,
      selectedOrderId: payload.order.id,
      loading: false,
      error: null
    });
    // If the order exists in the orders list, replace it to keep the list in sync
    if (state.orders && state.orders.length) {
      const updatedOrders = state.orders.map(o => o.id === payload.order.id ? payload.order : o);
      ctx.patchState({ orders: updatedOrders });
    }
  }

  @Action(LoadOrderFailure)
  loadOrderFailure(ctx: StateContext<OrdersStateModel>, { payload }: LoadOrderFailure) {
    ctx.patchState({
      loading: false,
      error: payload.error
    });
  }

  // Fulfillment Actions
  @Action(CreateFulfillment)
  createFulfillment(ctx: StateContext<OrdersStateModel>, { payload }: CreateFulfillment) {
    ctx.patchState({ loading: true, error: null });

    const data = {
      location_id: payload.location_id,
      shipping_option_id: payload.shipping_option_id,
      no_notification: payload.no_notification,
      items: payload.items
    };

    return this.medusaAdminService.createFulfillment(payload.orderId, data).pipe(
      tap((response: any) => {
        console.log('✅ Fulfillment creation response:', response);
        // The response IS the updated order object
        ctx.dispatch(new CreateFulfillmentSuccess({ order: response }));
      }),
      catchError((error) => {
        ctx.patchState({ loading: false, error: error.userMessage || 'Failed to create fulfillment' });
        return throwError(() => error);
      })
    );
  }

  @Action(CreateFulfillmentSuccess)
  createFulfillmentSuccess(ctx: StateContext<OrdersStateModel>, { payload }: CreateFulfillmentSuccess) {
    const state = ctx.getState();
    // Update the selected order with the new data
    ctx.patchState({
      selectedOrder: payload.order,
      selectedOrderId: payload.order.id,
      loading: false,
      error: null
    });
    // Also update the order in the orders list if it exists
    if (state.orders && state.orders.length) {
      const updatedOrders = state.orders.map(o => o.id === payload.order.id ? payload.order : o);
      ctx.patchState({ orders: updatedOrders });
    }
  }

  // Shipment Actions
  @Action(CreateShipment)
  createShipment(ctx: StateContext<OrdersStateModel>, { payload }: CreateShipment) {
    ctx.patchState({ loading: true, error: null });

    // Get the current order to extract fulfillment items
    const currentOrder = ctx.getState().selectedOrder;
    if (!currentOrder) {
      ctx.patchState({
        loading: false,
        error: 'Order not found'
      });
      return throwError(() => new Error('Order not found'));
    }

    // Find the fulfillment to get its items
    const fulfillment = currentOrder.fulfillments?.find(f => f.id === payload.fulfillmentId);
    if (!fulfillment) {
      ctx.patchState({
        loading: false,
        error: 'Fulfillment not found'
      });
      return throwError(() => new Error('Fulfillment not found'));
    }

    console.log('📦 Creating shipment for fulfillment:', fulfillment);
    console.log('📦 Fulfillment items:', fulfillment.items);

    // Prepare shipment data with required items and metadata fields
    // The API requires items array with id and quantity for each item
    let items = fulfillment.items?.map((item: any) => {
      console.log('📦 Mapping item:', item);
      return {
        id: item.line_item_id,  // Use the order line item ID (not item_id!)
        quantity: item.quantity
      };
    }) || [];

    console.log('📦 Mapped items for shipment:', JSON.stringify(items, null, 2));

    // In Medusa v2, shipment creation might not require items if the fulfillment already has them
    // Try without items first if none are found
    if (items.length === 0) {
      console.warn('⚠️ No items found in fulfillment, will try creating shipment without items array');
    }

    // If no items found in fulfillment, use order items as fallback
    if (items.length === 0) {
      console.log('⚠️ No items in fulfillment, using order items as fallback...');

      // Use all order items for the shipment
      items = currentOrder.items?.map((item: any) => ({
        id: item.id,
        quantity: item.quantity
      })) || [];

      if (items.length === 0) {
        ctx.patchState({
          loading: false,
          error: 'No items found in order'
        });
        return throwError(() => new Error('No items found in order'));
      }

      console.log('📦 Using order items for shipment:', JSON.stringify(items, null, 2));
    }

    const shipmentData: any = {
      items: items,
      metadata: {}
    };

    // Add labels with tracking numbers if provided
    if (payload.trackingNumbers && payload.trackingNumbers.length > 0) {
      shipmentData.labels = payload.trackingNumbers.map(trackingNumber => ({
        tracking_number: trackingNumber,
        tracking_url: '', // Optional - can be empty
        label_url: ''     // Optional - can be empty
      }));
    }

    // Add carrier to metadata if provided
    if (payload.carrier) {
      shipmentData.metadata.carrier = payload.carrier;
    }

    console.log('📦 Final shipment data being sent to API:', JSON.stringify(shipmentData, null, 2));

    return this.medusaAdminService.createShipment(payload.orderId, payload.fulfillmentId, shipmentData).pipe(
      tap(() => {
        ctx.patchState({ loading: false, error: null });
        // Reload the order to get updated fulfillment status
        const currentOrderId = ctx.getState().selectedOrderId;
        if (currentOrderId) {
          ctx.dispatch(new LoadOrder({ id: currentOrderId }));
        }
      }),
      catchError(error => {
        ctx.patchState({
          loading: false,
          error: error.userMessage || 'Failed to create shipment'
        });
        return throwError(() => error);
      })
    );
  }

  @Action(MarkAsDelivered)
  markAsDelivered(ctx: StateContext<OrdersStateModel>, { payload }: MarkAsDelivered) {
    ctx.patchState({ loading: true, error: null });

    return this.medusaAdminService.markAsDelivered(payload.orderId, payload.fulfillmentId).pipe(
      tap(() => {
        ctx.patchState({ loading: false, error: null });
        // Reload the order to get updated fulfillment status
        const currentOrderId = ctx.getState().selectedOrderId;
        if (currentOrderId) {
          ctx.dispatch(new LoadOrder({ id: currentOrderId }));
        }
      }),
      catchError(error => {
        ctx.patchState({
          loading: false,
          error: error.userMessage || 'Failed to mark as delivered'
        });
        return throwError(() => error);
      })
    );
  }

  // Payment Actions
  @Action(CapturePayment)
  capturePayment(ctx: StateContext<OrdersStateModel>, { payload }: CapturePayment) {
    ctx.patchState({ loading: true, error: null });

    const data = payload.amount ? { amount: payload.amount } : {};

    // Use paymentId for the correct store endpoint
    return this.medusaAdminService.capturePayment(payload.paymentId, data).pipe(
      tap((response: any) => {
        console.log('Payment capture response:', response);
        ctx.dispatch(new CapturePaymentSuccess({
          paymentId: payload.paymentId,
          captureData: response
        }));
        // Reload the order to get updated payment status
        ctx.dispatch(new LoadOrder({ id: payload.orderId }));
      }),
      catchError((error) => {
        ctx.dispatch(new CapturePaymentFailure({
          error: error.userMessage || 'Failed to capture payment'
        }));
        return throwError(() => error);
      })
    );
  }

  @Action(CapturePaymentSuccess)
  capturePaymentSuccess(ctx: StateContext<OrdersStateModel>) {
    ctx.patchState({ loading: false, error: null });
  }

  @Action(CapturePaymentFailure)
  capturePaymentFailure(ctx: StateContext<OrdersStateModel>, { payload }: CapturePaymentFailure) {
    ctx.patchState({ loading: false, error: payload.error });
  }

  // Order Status Actions
  @Action(CompleteOrder)
  completeOrder(ctx: StateContext<OrdersStateModel>, { payload }: CompleteOrder) {
    ctx.patchState({ loading: true, error: null });

    return this.medusaAdminService.completeOrder(payload.orderId).pipe(
      tap(() => {
        // Reload the order to get updated status
        ctx.dispatch(new LoadOrder({ id: payload.orderId }));
      }),
      catchError((error) => {
        ctx.patchState({ loading: false, error: error.userMessage || 'Failed to complete order' });
        return throwError(() => error);
      })
    );
  }

  @Action(CancelOrder)
  cancelOrder(ctx: StateContext<OrdersStateModel>, { payload }: CancelOrder) {
    ctx.patchState({ loading: true, error: null });

    return this.medusaAdminService.cancelOrder(payload.orderId).pipe(
      tap(() => {
        // Reload the order to get updated status
        ctx.dispatch(new LoadOrder({ id: payload.orderId }));
      }),
      catchError((error) => {
        ctx.patchState({ loading: false, error: error.userMessage || 'Failed to cancel order' });
        return throwError(() => error);
      })
    );
  }

  @Action(RefundPayment)
  refundPayment(ctx: StateContext<OrdersStateModel>, { payload }: RefundPayment) {
    ctx.patchState({ loading: true, error: null });

    // Only send amount - reason is not supported by the API
    const data = {
      amount: payload.amount
    };

    return this.medusaAdminService.refundPayment(payload.paymentId, data).pipe(
      tap(() => {
        // Reload the order to get updated payment status
        ctx.dispatch(new LoadOrder({ id: payload.orderId }));
      }),
      catchError((error) => {
        ctx.patchState({ loading: false, error: error.userMessage || 'Failed to refund payment' });
        return throwError(() => error);
      })
    );
  }

  @Action(UpdateOrder)
  updateOrder(ctx: StateContext<OrdersStateModel>, { payload }: UpdateOrder) {
    ctx.patchState({ loading: true, error: null });

    return this.medusaAdminService.updateOrder(payload.orderId, payload.data).pipe(
      tap((response: any) => {
        ctx.dispatch(new UpdateOrderSuccess({ order: response.order }));
      }),
      catchError((error) => {
        ctx.dispatch(new UpdateOrderFailure({ error: error.userMessage || 'Failed to update order' }));
        return throwError(() => error);
      })
    );
  }

  @Action(UpdateOrderSuccess)
  updateOrderSuccess(ctx: StateContext<OrdersStateModel>, { payload }: UpdateOrderSuccess) {
    ctx.patchState({
      selectedOrder: payload.order,
      loading: false,
      error: null
    });
  }

  @Action(UpdateOrderFailure)
  updateOrderFailure(ctx: StateContext<OrdersStateModel>, { payload }: UpdateOrderFailure) {
    ctx.patchState({
      loading: false,
      error: payload.error
    });
  }

  // Filter Actions
  @Action(SetOrdersFilter)
  setOrdersFilter(ctx: StateContext<OrdersStateModel>, { payload }: SetOrdersFilter) {
    const state = ctx.getState();
    ctx.patchState({ filter: payload.filter });
    // Reload orders with new filter (reset to first page)
    ctx.dispatch(new LoadOrders({ 
      params: { 
        ...payload.filter, 
        limit: state.pagination.limit || 15, 
        offset: 0 
      },
      append: false
    }));
  }

  @Action(ClearOrdersFilter)
  clearOrdersFilter(ctx: StateContext<OrdersStateModel>) {
    const state = ctx.getState();
    ctx.patchState({ filter: {} });
    ctx.dispatch(new LoadOrders({ 
      params: { 
        limit: state.pagination.limit || 15, 
        offset: 0 
      },
      append: false
    }));
  }

  @Action(SetSelectedOrder)
  setSelectedOrder(ctx: StateContext<OrdersStateModel>, { payload }: SetSelectedOrder) {
    ctx.patchState({ selectedOrderId: payload.orderId });
    if (payload.orderId) {
      ctx.dispatch(new LoadOrder({ id: payload.orderId }));
    } else {
      ctx.patchState({ selectedOrder: null });
    }
  }

  // Pagination Actions
  @Action(LoadMoreOrders)
  loadMoreOrders(ctx: StateContext<OrdersStateModel>, { payload }: LoadMoreOrders) {
    const state = ctx.getState();
    const pagination = state.pagination;
    
    // Calculate next offset
    const nextOffset = pagination.offset + pagination.limit;
    
    // Check if there are more orders to load
    if (nextOffset >= pagination.count) {
      // No more orders to load
      return;
    }

    // Load more orders with append flag
    ctx.dispatch(new LoadOrders({
      params: {
        ...state.filter,
        ...payload?.params,
        offset: nextOffset,
        limit: pagination.limit
      },
      append: true
    }));
  }

  @Action(GoToPage)
  goToPage(ctx: StateContext<OrdersStateModel>, { payload }: GoToPage) {
    const state = ctx.getState();
    const limit = payload.limit || state.pagination.limit || 15;
    const offset = (payload.page - 1) * limit;

    // Load orders for the specified page
    ctx.dispatch(new LoadOrders({
      params: {
        ...state.filter,
        offset: offset,
        limit: limit
      },
      append: false
    }));
  }

  // Returns Actions
  @Action(LoadReturns)
  loadReturns(ctx: StateContext<OrdersStateModel>, { payload }: LoadReturns) {
    ctx.patchState({ returnsLoading: true });

    return this.medusaAdminService.getReturns(payload.orderId).pipe(
      tap((response: any) => {
        ctx.dispatch(new LoadReturnsSuccess({
          returns: response.returns || [],
          orderId: payload.orderId
        }));
      }),
      catchError((error) => {
        ctx.dispatch(new LoadReturnsFailure({ error: error.userMessage || 'Failed to load returns' }));
        return throwError(() => error);
      })
    );
  }

  @Action(LoadReturnsSuccess)
  loadReturnsSuccess(ctx: StateContext<OrdersStateModel>, { payload }: LoadReturnsSuccess) {
    const state = ctx.getState();
    const returnsMap = new Map(state.returns);

    if (payload.orderId) {
      // Store returns for a specific order
      returnsMap.set(payload.orderId, payload.returns);
    } else {
      // Store returns for all orders (group by order_id)
      payload.returns.forEach((returnItem: Return) => {
        if (returnItem.order_id) {
          const existingReturns = returnsMap.get(returnItem.order_id) || [];
          // Avoid duplicates
          if (!existingReturns.find(r => r.id === returnItem.id)) {
            returnsMap.set(returnItem.order_id, [...existingReturns, returnItem]);
          }
        }
      });
    }

    ctx.patchState({
      returns: returnsMap,
      returnsLoading: false,
      error: null
    });
  }

  @Action(LoadReturnsFailure)
  loadReturnsFailure(ctx: StateContext<OrdersStateModel>, { payload }: LoadReturnsFailure) {
    ctx.patchState({
      returnsLoading: false,
      error: payload.error
    });
  }
}

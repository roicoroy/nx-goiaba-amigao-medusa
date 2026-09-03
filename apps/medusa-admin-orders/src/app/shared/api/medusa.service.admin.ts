import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import { BaseHttpService } from './base-http.service';
import { Order, OrdersResponse, OrderFilters, Customer, ReturnsResponse } from '../admin-interfaces';
import { OrderChangesResponse } from '../../pages/order-detail/order-detail.interfaces';
import { AdminUser } from '../admin-interfaces/user.interface';


@Injectable({
  providedIn: 'root'
})
export class MedusaAdminService extends BaseHttpService {
  protected baseUrl = environment.MEDUSA_API_BASE_PATH;

  // Admin Authentication Methods
  adminLogin(email: string, password: string): Observable<{ token: string }> {
    const body = { email, password };
    // Use admin authentication endpoint (Medusa v2 built-in admin auth)
    return this.post<{ token: string }>('/auth/user/emailpass', body, { withCredentials: true });
  }

  // Admin User Methods
  getCurrentUser(): Observable<AdminUser> {
    // Use admin user endpoint to get authenticated admin user
    return this.get<AdminUser>('/admin/users/me', { withCredentials: true });
  }

  logout(): Observable<any> {
    // Delete the session on the server
    return this.delete('/auth/session', { withCredentials: true });
  }

  // Admin User Management Methods
  createAdminUser(data: {
    email: string;
    password: string;
    first_name?: string;
    last_name?: string;
    role?: string;
    phone?: string;
  }): Observable<{ success: boolean; user: AdminUser; message: string }> {
    return this.post<{ success: boolean; user: AdminUser; message: string }>('/admin/users', data, { withCredentials: true });
  }

  getAdminUsers(): Observable<{ users: AdminUser[]; count: number; offset: number; limit: number }> {
    return this.get<{ users: AdminUser[]; count: number; offset: number; limit: number }>('/admin/users', { withCredentials: true });
  }

  getAdminUserById(id: string): Observable<{ user: AdminUser }> {
    return this.get<{ user: AdminUser }>(`/admin/users/${id}`, { withCredentials: true });
  }

  updateAdminUser(id: string, data: Partial<AdminUser>): Observable<{ success: boolean; user: AdminUser; message: string }> {
    return this.post<{ success: boolean; user: AdminUser; message: string }>(`/admin/users/${id}`, data, { withCredentials: true });
  }

  updateCurrentUser(data: {
    first_name?: string;
    last_name?: string;
    phone?: string;
    role?: string;
  }): Observable<{ success: boolean; user: AdminUser; message: string }> {
    return this.post<{ success: boolean; user: AdminUser; message: string }>('/admin/users/me', data, { withCredentials: true });
  }

  deleteAdminUser(id: string): Observable<{ success: boolean; message: string }> {
    return this.delete<{ success: boolean; message: string }>(`/admin/users/${id}`, { withCredentials: true });
  }

  // Orders Methods
  getOrders(params?: OrderFilters): Observable<OrdersResponse> {
    // Use admin orders endpoint for proper admin access
    // Build query string from params (offset, limit, filters, etc.)
    const queryString = params ? this.buildQueryString(params) : '';
    const endpoint = `/admin/orders${queryString ? `?${queryString}` : ''}`;
    return this.get<OrdersResponse>(endpoint, { withCredentials: true });
  }

  getOrder(id: string): Observable<{ order: Order }> {
    // Use fields with wildcards to ensure we get all necessary data including relations and their fields
    // Include payments within payment_collections to get individual payment IDs for capture
    const fields = 'id,status,display_id,created_at,updated_at,email,total,subtotal,tax_total,discount_total,shipping_total,paid_total,refundable_amount,refunded_total,gift_card_total,currency_code,payment_status,fulfillment_status,*items,*fulfillments,*payment_collections,*payment_collections.payments,*shipping_address,*billing_address,*region,*customer,*shipping_methods';
    const endpoint = `/admin/orders/${id}?fields=${fields}`;
    return this.get<{ order: Order }>(endpoint, { withCredentials: true });
  }

  getOrderPreview(id: string): Observable<any> {
    // Get order preview with transactions and updated totals
    return this.get(`/admin/orders/${id}/preview`, { withCredentials: true });
  }

  updateOrder(id: string, data: any): Observable<{ order: Order }> {
    return this.post<{ order: Order }>(`/admin/orders/${id}`, data, { withCredentials: true });
  }

  /**
   * Get order line items
   * @param orderId The ID of the order
   * @returns Observable with line items
   */
  getOrderLineItems(orderId: string): Observable<any> {
    return this.get(`/admin/orders/${orderId}/line-items`, { withCredentials: true });
  }

  /**
   * Get available shipping options for an order
   * @param orderId The ID of the order
   * @returns Observable with shipping options
   */
  getOrderShippingOptions(orderId: string): Observable<any> {
    return this.get(`/admin/orders/${orderId}/shipping-options`, { withCredentials: true });
  }

  // Order Fulfillment Methods
  /**
   * Create fulfillment for an order
   * @param orderId The ID of the order to create fulfillment for
   * @param data Fulfillment payload containing location_id, shipping_option_id, and items array
   * @returns Observable with the created fulfillment
   */
  createFulfillment(orderId: string, data: any): Observable<any> {
    return this.post(`/admin/orders/${orderId}/fulfillments`, data, { withCredentials: true });
  }

  getOrderForFulfillment(orderId: string): Observable<any> {
    // Get order with specific fields needed for fulfillment
    const queryParams = new URLSearchParams({
      fields: 'currency_code,*items,*items.variant,+items.variant.product.shipping_profile.id,*shipping_address,+shipping_methods.shipping_option_id'
    });

    return this.get(`/admin/orders/${orderId}?${queryParams.toString()}`, { withCredentials: true });
  }

  cancelFulfillment(orderId: string, fulfillmentId: string): Observable<any> {
    return this.post(`/admin/orders/${orderId}/fulfillments/${fulfillmentId}/cancel`, {}, { withCredentials: true });
  }

  createShipment(orderId: string, fulfillmentId: string, data: any): Observable<any> {
    return this.post(`/admin/orders/${orderId}/fulfillments/${fulfillmentId}/shipments`, data, { withCredentials: true });
  }

  markAsDelivered(orderId: string, fulfillmentId: string): Observable<any> {
    return this.post(`/admin/orders/${orderId}/fulfillments/${fulfillmentId}/mark-as-delivered`, {}, { withCredentials: true });
  }

  // Order Payment Methods
  capturePayment(paymentId: string, data: any = {}): Observable<any> {
    // Admin endpoint for capturing payment
    return this.post(`/admin/payments/${paymentId}/capture`, data, { withCredentials: true });
  }

  refundPayment(paymentId: string, data: any): Observable<any> {
    // Admin endpoint for payment refund
    return this.post(`/admin/payments/${paymentId}/refund`, data, { withCredentials: true });
  }

  /**
   * Get order changes/history
   * @param orderId The ID of the order
   * @returns Observable with order changes
   */
  getOrderChanges(orderId: string): Observable<OrderChangesResponse> {
    return this.get<OrderChangesResponse>(`/admin/orders/${orderId}/changes`, { withCredentials: true });
  }

  // Order Status Methods
  completeOrder(orderId: string): Observable<any> {
    return this.post(`/admin/orders/${orderId}/complete`, {}, { withCredentials: true });
  }

  cancelOrder(orderId: string): Observable<any> {
    return this.post(`/admin/orders/${orderId}/cancel`, {}, { withCredentials: true });
  }

  archiveOrder(orderId: string): Observable<any> {
    return this.post(`/admin/orders/${orderId}/archive`, {}, { withCredentials: true });
  }

  /**
   * Transfer order to a different customer or location
   * @param orderId The ID of the order
   * @param data Transfer data (customer_id, etc.)
   * @returns Observable with transfer result
   */
  transferOrder(orderId: string, data: any): Observable<any> {
    return this.post(`/admin/orders/${orderId}/transfer`, data, { withCredentials: true });
  }

  /**
   * Cancel order transfer
   * @param orderId The ID of the order
   * @returns Observable with cancellation result
   */
  cancelOrderTransfer(orderId: string): Observable<any> {
    return this.post(`/admin/orders/${orderId}/transfer/cancel`, {}, { withCredentials: true });
  }

  /**
   * Create credit line for an order
   * @param orderId The ID of the order
   * @param data Credit line data
   * @returns Observable with created credit line
   */
  createCreditLine(orderId: string, data: any): Observable<any> {
    return this.post(`/admin/orders/${orderId}/credit-lines`, data, { withCredentials: true });
  }

  // Order Claims Methods
  createClaim(orderId: string, data: any): Observable<any> {
    return this.post(`/admin/orders/${orderId}/claims`, data, { withCredentials: true });
  }

  getClaims(orderId?: string): Observable<any> {
    // Use top-level claims endpoint with optional order_id filter
    const queryString = orderId ? `?order_id=${orderId}` : '';
    return this.get(`/admin/claims${queryString}`, { withCredentials: true });
  }

  // Order Returns Methods
  createReturn(orderId: string, data: any): Observable<any> {
    return this.post(`/admin/orders/${orderId}/returns`, data, { withCredentials: true });
  }

  getReturns(orderId?: string, params?: { limit?: number; offset?: number }): Observable<ReturnsResponse> {
    // Use top-level returns endpoint with optional order_id filter
    const queryParams: any = {};
    if (orderId) {
      queryParams.order_id = orderId;
    }
    if (params?.limit) {
      queryParams.limit = params.limit;
    }
    if (params?.offset) {
      queryParams.offset = params.offset;
    }
    const queryString = Object.keys(queryParams).length > 0 ? this.buildQueryString(queryParams) : '';
    return this.get<ReturnsResponse>(`/admin/returns${queryString ? `?${queryString}` : ''}`, { withCredentials: true });
  }

  /**
   * Mark a return as received
   * @param returnId The ID of the return to mark as received
   * @param data Optional data including items and no_notification
   * @returns Observable with updated return
   */
  receiveReturn(returnId: string, data?: { items?: Array<{ id?: string; item_id?: string; quantity: number }>; no_notification?: boolean }): Observable<any> {
    return this.post(`/admin/returns/${returnId}/receive`, data || {}, { withCredentials: true });
  }

  // Order Exchanges Methods
  createExchange(orderId: string, data: any): Observable<any> {
    return this.post(`/admin/orders/${orderId}/exchanges`, data, { withCredentials: true });
  }

  getExchanges(orderId?: string): Observable<any> {
    // Use top-level exchanges endpoint with optional order_id filter
    const queryString = orderId ? `?order_id=${orderId}` : '';
    return this.get(`/admin/exchanges${queryString}`, { withCredentials: true });
  }

  // Stock Locations Methods
  /**
   * Get stock locations with pagination parameters
   * @param limit Maximum number of locations to return (default: 10)
   * @param offset Number of locations to skip (default: 0)
   * @returns Observable with stock locations array and pagination metadata
   */
  getStockLocations(limit: number = 10, offset: number = 0): Observable<{ stock_locations: any[]; count: number; offset: number; limit: number }> {
    const params = { limit, offset };
    const queryString = this.buildQueryString(params);
    const endpoint = `/admin/stock-locations?${queryString}`;
    return this.get<{ stock_locations: any[]; count: number; offset: number; limit: number }>(endpoint, { withCredentials: true });
  }

  // Shipping Options Methods
  /**
   * Get shipping options with optional stock location filter and fields parameter
   * @param params Optional parameters including stock_location_id, fields, limit, offset
   * @returns Observable with shipping options array and pagination metadata
   */
  getShippingOptions(params?: {
    stock_location_id?: string;
    fields?: string;
    limit?: number;
    offset?: number;
  }): Observable<{ shipping_options: any[]; count: number; offset: number; limit: number }> {
    const queryString = params ? this.buildQueryString(params) : '';
    const endpoint = `/admin/shipping-options${queryString ? `?${queryString}` : ''}`;
    return this.get<{ shipping_options: any[]; count: number; offset: number; limit: number }>(endpoint, { withCredentials: true });
  }

  // Customers Methods
  getCustomers(params?: any): Observable<{ customers: Customer[]; count: number; offset: number; limit: number }> {
    const queryString = params ? this.buildQueryString(params) : '';
    const endpoint = `/admin/customers${queryString ? `?${queryString}` : ''}`;
    return this.get<{ customers: Customer[]; count: number; offset: number; limit: number }>(endpoint, { withCredentials: true });
  }

  getCustomerById(customerId: string): Observable<{ customer: Customer }> {
    return this.get<{ customer: Customer }>(`/admin/customers/${customerId}`, { withCredentials: true });
  }

  /**
   * Get inventory reservations with flexible filtering
   * @param params Query parameters (e.g., { line_item_id: ['item_1', 'item_2'] })
   * @returns Observable with reservations data
   */
  getReservations(params: any = {}): Observable<{ reservations: any[], count: number, offset: number, limit: number }> {
    const queryString = this.buildQueryString(params);
    return this.get<{ reservations: any[], count: number, offset: number, limit: number }>(`/admin/reservations?${queryString}`, { withCredentials: true });
  }

  /**
   * Get a specific reservation by ID
   * @param reservationId The ID of the reservation
   * @returns Observable with reservation details
   */
  getReservationById(reservationId: string): Observable<{ reservation: any }> {
    return this.get<{ reservation: any }>(`/admin/reservations/${reservationId}`, { withCredentials: true });
  }

  /**
   * Create a new reservation
   * @param data Reservation data
   * @returns Observable with created reservation
   */
  createReservation(data: {
    location_id: string;
    inventory_item_id: string;
    quantity: number;
    line_item_id?: string;
    metadata?: Record<string, any>;
  }): Observable<{ reservation: any }> {
    return this.post<{ reservation: any }>('/admin/reservations', data, { withCredentials: true });
  }

  /**
   * Update a reservation
   * @param reservationId The ID of the reservation
   * @param data Update data
   * @returns Observable with updated reservation
   */
  updateReservation(reservationId: string, data: {
    quantity?: number;
    location_id?: string;
    metadata?: Record<string, any>;
  }): Observable<{ reservation: any }> {
    return this.post<{ reservation: any }>(`/admin/reservations/${reservationId}`, data, { withCredentials: true });
  }

  /**
   * Delete a reservation
   * @param reservationId The ID of the reservation
   * @returns Observable with deletion result
   */
  deleteReservation(reservationId: string): Observable<{ id: string; object: string; deleted: boolean }> {
    return this.delete<{ id: string; object: string; deleted: boolean }>(`/admin/reservations/${reservationId}`, { withCredentials: true });
  }

  // Regions Methods
  /**
   * Get all regions with optional filters
   * @param params Optional query parameters (limit, offset, etc.)
   * @returns Observable with regions array
   */
  getRegions(params?: {
    limit?: number;
    offset?: number;
    fields?: string;
  }): Observable<{ regions: any[]; count: number; offset: number; limit: number }> {
    const queryString = params ? this.buildQueryString(params) : '';
    const endpoint = `/admin/regions${queryString ? `?${queryString}` : ''}`;
    return this.get<{ regions: any[]; count: number; offset: number; limit: number }>(endpoint, { withCredentials: true });
  }

  getRegionById(regionId: string): Observable<{ region: any }> {
    return this.get<{ region: any }>(`/admin/regions/${regionId}`, { withCredentials: true });
  }

  // Stores Methods
  /**
   * Get store configuration
   * @returns Observable with store data
   */
  getStores(): Observable<{ stores: any[] }> {
    return this.get<{ stores: any[] }>('/admin/stores', { withCredentials: true });
  }

  getStoreById(storeId: string): Observable<{ store: any }> {
    return this.get<{ store: any }>(`/admin/stores/${storeId}`, { withCredentials: true });
  }

  // Payment Collections Methods
  /**
   * Get payment collections with optional filters
   * @param params Optional query parameters
   * @returns Observable with payment collections
   */
  getPaymentCollections(params?: {
    limit?: number;
    offset?: number;
    order_id?: string;
  }): Observable<{ payment_collections: any[]; count: number; offset: number; limit: number }> {
    const queryString = params ? this.buildQueryString(params) : '';
    const endpoint = `/admin/payment-collections${queryString ? `?${queryString}` : ''}`;
    return this.get<{ payment_collections: any[]; count: number; offset: number; limit: number }>(endpoint, { withCredentials: true });
  }

  getPaymentCollectionById(paymentCollectionId: string): Observable<{ payment_collection: any }> {
    return this.get<{ payment_collection: any }>(`/admin/payment-collections/${paymentCollectionId}`, { withCredentials: true });
  }

  // Fulfillments Methods
  /**
   * Get fulfillments with optional filters
   * @param params Optional query parameters
   * @returns Observable with fulfillments
   */
  getFulfillments(params?: {
    limit?: number;
    offset?: number;
    order_id?: string;
  }): Observable<{ fulfillments: any[]; count: number; offset: number; limit: number }> {
    const queryString = params ? this.buildQueryString(params) : '';
    const endpoint = `/admin/fulfillments${queryString ? `?${queryString}` : ''}`;
    return this.get<{ fulfillments: any[]; count: number; offset: number; limit: number }>(endpoint, { withCredentials: true });
  }

  getFulfillmentById(fulfillmentId: string): Observable<{ fulfillment: any }> {
    return this.get<{ fulfillment: any }>(`/admin/fulfillments/${fulfillmentId}`, { withCredentials: true });
  }

  // Products Methods
  /**
   * Get products with optional filters
   * @param params Optional query parameters
   * @returns Observable with products
   */
  getProducts(params?: {
    limit?: number;
    offset?: number;
    q?: string; // search query
    id?: string | string[]; // product IDs
    fields?: string;
  }): Observable<{ products: any[]; count: number; offset: number; limit: number }> {
    const queryString = params ? this.buildQueryString(params) : '';
    const endpoint = `/admin/products${queryString ? `?${queryString}` : ''}`;
    return this.get<{ products: any[]; count: number; offset: number; limit: number }>(endpoint, { withCredentials: true });
  }

  getProductById(productId: string): Observable<{ product: any }> {
    return this.get<{ product: any }>(`/admin/products/${productId}`, { withCredentials: true });
  }

  // Shipping Profiles Methods
  /**
   * Get shipping profiles
   * @param params Optional query parameters
   * @returns Observable with shipping profiles
   */
  getShippingProfiles(params?: {
    limit?: number;
    offset?: number;
  }): Observable<{ shipping_profiles: any[]; count: number; offset: number; limit: number }> {
    const queryString = params ? this.buildQueryString(params) : '';
    const endpoint = `/admin/shipping-profiles${queryString ? `?${queryString}` : ''}`;
    return this.get<{ shipping_profiles: any[]; count: number; offset: number; limit: number }>(endpoint, { withCredentials: true });
  }

  getShippingProfileById(shippingProfileId: string): Observable<{ shipping_profile: any }> {
    return this.get<{ shipping_profile: any }>(`/admin/shipping-profiles/${shippingProfileId}`, { withCredentials: true });
  }

  // Return Reasons Methods
  /**
   * Get return reasons
   * @returns Observable with return reasons
   */
  getReturnReasons(): Observable<{ return_reasons: any[] }> {
    return this.get<{ return_reasons: any[] }>('/admin/return-reasons', { withCredentials: true });
  }

  getReturnReasonById(returnReasonId: string): Observable<{ return_reason: any }> {
    return this.get<{ return_reason: any }>(`/admin/return-reasons/${returnReasonId}`, { withCredentials: true });
  }

  // Exchanges Methods (already have some in the file, adding get all)
  /**
   * Get all exchanges with optional filters
   * @param params Optional query parameters
   * @returns Observable with exchanges
   */
  getAllExchanges(params?: {
    limit?: number;
    offset?: number;
    order_id?: string;
  }): Observable<{ exchanges: any[]; count: number; offset: number; limit: number }> {
    const queryString = params ? this.buildQueryString(params) : '';
    const endpoint = `/admin/exchanges${queryString ? `?${queryString}` : ''}`;
    return this.get<{ exchanges: any[]; count: number; offset: number; limit: number }>(endpoint, { withCredentials: true });
  }

  getExchangeById(exchangeId: string): Observable<{ exchange: any }> {
    return this.get<{ exchange: any }>(`/admin/exchanges/${exchangeId}`, { withCredentials: true });
  }

  // Claims Methods (already have some in the file, adding get all)
  /**
   * Get all claims with optional filters
   * @param params Optional query parameters
   * @returns Observable with claims
   */
  getAllClaims(params?: {
    limit?: number;
    offset?: number;
    order_id?: string;
  }): Observable<{ claims: any[]; count: number; offset: number; limit: number }> {
    const queryString = params ? this.buildQueryString(params) : '';
    const endpoint = `/admin/claims${queryString ? `?${queryString}` : ''}`;
    return this.get<{ claims: any[]; count: number; offset: number; limit: number }>(endpoint, { withCredentials: true });
  }

  getClaimById(claimId: string): Observable<{ claim: any }> {
    return this.get<{ claim: any }>(`/admin/claims/${claimId}`, { withCredentials: true });
  }

  // Order Edits Methods
  /**
   * Request an order edit - allows modifying items in an order
   * @param orderId The ID of the order to edit
   * @param data Edit data including items to add/remove
   * @returns Observable with the created order edit
   */
  requestOrderEdit(orderId: string, data: {
    internal_note?: string;
  }): Observable<{ order_edit: any }> {
    return this.post<{ order_edit: any }>(`/admin/orders/${orderId}/edits`, data, { withCredentials: true });
  }

  /**
   * Get order edits for a specific order
   * @param orderId Optional order ID to filter by
   * @returns Observable with order edits
   */
  getOrderEdits(orderId?: string): Observable<{ order_edits: any[] }> {
    // Use top-level order-edits endpoint with optional order_id filter
    const queryString = orderId ? `?order_id=${orderId}` : '';
    return this.get<{ order_edits: any[] }>(`/admin/order-edits${queryString}`, { withCredentials: true });
  }

  /**
   * Get all order edits with optional filters
   * @param params Optional query parameters
   * @returns Observable with order edits
   */
  getAllOrderEdits(params?: {
    limit?: number;
    offset?: number;
    order_id?: string;
  }): Observable<{ order_edits: any[]; count: number; offset: number; limit: number }> {
    const queryString = params ? this.buildQueryString(params) : '';
    const endpoint = `/admin/order-edits${queryString ? `?${queryString}` : ''}`;
    return this.get<{ order_edits: any[]; count: number; offset: number; limit: number }>(endpoint, { withCredentials: true });
  }

  /**
   * Get a specific order edit by ID
   * @param orderEditId The ID of the order edit
   * @returns Observable with order edit details
   */
  getOrderEditById(orderEditId: string): Observable<{ order_edit: any }> {
    return this.get<{ order_edit: any }>(`/admin/order-edits/${orderEditId}`, { withCredentials: true });
  }

  /**
   * Update an order edit
   * @param orderEditId The ID of the order edit
   * @param data Update data
   * @returns Observable with updated order edit
   */
  updateOrderEdit(orderEditId: string, data: {
    internal_note?: string;
  }): Observable<{ order_edit: any }> {
    return this.post<{ order_edit: any }>(`/admin/order-edits/${orderEditId}`, data, { withCredentials: true });
  }

  /**
   * Add line item to order edit
   * @param orderEditId The ID of the order edit
   * @param data Line item data
   * @returns Observable with updated order edit
   */
  addLineItemToOrderEdit(orderEditId: string, data: {
    variant_id: string;
    quantity: number;
    metadata?: Record<string, any>;
  }): Observable<{ order_edit: any }> {
    return this.post<{ order_edit: any }>(`/admin/order-edits/${orderEditId}/items`, data, { withCredentials: true });
  }

  /**
   * Update line item in order edit
   * @param orderEditId The ID of the order edit
   * @param itemId The ID of the line item
   * @param data Update data
   * @returns Observable with updated order edit
   */
  updateOrderEditLineItem(orderEditId: string, itemId: string, data: {
    quantity: number;
  }): Observable<{ order_edit: any }> {
    return this.post<{ order_edit: any }>(`/admin/order-edits/${orderEditId}/items/${itemId}`, data, { withCredentials: true });
  }

  /**
   * Remove line item from order edit
   * @param orderEditId The ID of the order edit
   * @param itemId The ID of the line item to remove
   * @returns Observable with updated order edit
   */
  removeLineItemFromOrderEdit(orderEditId: string, itemId: string): Observable<{ order_edit: any }> {
    return this.delete<{ order_edit: any }>(`/admin/order-edits/${orderEditId}/items/${itemId}`, { withCredentials: true });
  }

  /**
   * Confirm an order edit (force confirm without customer approval)
   * @param orderEditId The ID of the order edit
   * @returns Observable with confirmed order edit
   */
  confirmOrderEdit(orderEditId: string): Observable<{ order_edit: any }> {
    return this.post<{ order_edit: any }>(`/admin/order-edits/${orderEditId}/confirm`, {}, { withCredentials: true });
  }

  /**
   * Cancel an order edit
   * @param orderEditId The ID of the order edit
   * @returns Observable with cancelled order edit
   */
  cancelOrderEdit(orderEditId: string): Observable<{ order_edit: any }> {
    return this.post<{ order_edit: any }>(`/admin/order-edits/${orderEditId}/cancel`, {}, { withCredentials: true });
  }

  /**
   * Request confirmation for an order edit (sends to customer)
   * @param orderEditId The ID of the order edit
   * @returns Observable with order edit
   */
  requestOrderEditConfirmation(orderEditId: string): Observable<{ order_edit: any }> {
    return this.post<{ order_edit: any }>(`/admin/order-edits/${orderEditId}/request`, {}, { withCredentials: true });
  }

  // Draft Orders Methods
  /**
   * Create a draft order
   * @param data Draft order data
   * @returns Observable with created draft order
   */
  createDraftOrder(data: {
    email: string;
    region_id: string;
    items: Array<{
      variant_id: string;
      quantity: number;
      metadata?: Record<string, any>;
    }>;
    shipping_methods?: Array<{
      option_id: string;
      price?: number;
    }>;
    discounts?: Array<{
      code: string;
    }>;
    customer_id?: string;
    billing_address?: any;
    shipping_address?: any;
    metadata?: Record<string, any>;
  }): Observable<{ draft_order: any }> {
    return this.post<{ draft_order: any }>('/admin/draft-orders', data, { withCredentials: true });
  }

  /**
   * List all draft orders
   * @param params Optional query parameters
   * @returns Observable with draft orders
   */
  getDraftOrders(params?: {
    limit?: number;
    offset?: number;
    q?: string;
  }): Observable<{ draft_orders: any[]; count: number; offset: number; limit: number }> {
    const queryString = params ? this.buildQueryString(params) : '';
    const endpoint = `/admin/draft-orders${queryString ? `?${queryString}` : ''}`;
    return this.get<{ draft_orders: any[]; count: number; offset: number; limit: number }>(endpoint, { withCredentials: true });
  }

  /**
   * Get a specific draft order by ID
   * @param draftOrderId The ID of the draft order
   * @returns Observable with draft order details
   */
  getDraftOrderById(draftOrderId: string): Observable<{ draft_order: any }> {
    return this.get<{ draft_order: any }>(`/admin/draft-orders/${draftOrderId}`, { withCredentials: true });
  }

  /**
   * Update a draft order
   * @param draftOrderId The ID of the draft order
   * @param data Update data
   * @returns Observable with updated draft order
   */
  updateDraftOrder(draftOrderId: string, data: {
    region_id?: string;
    email?: string;
    billing_address?: any;
    shipping_address?: any;
    discounts?: Array<{ code: string }>;
    customer_id?: string;
    no_notification_order?: boolean;
  }): Observable<{ draft_order: any }> {
    return this.post<{ draft_order: any }>(`/admin/draft-orders/${draftOrderId}`, data, { withCredentials: true });
  }

  /**
   * Delete a draft order
   * @param draftOrderId The ID of the draft order
   * @returns Observable with deletion result
   */
  deleteDraftOrder(draftOrderId: string): Observable<{ id: string; object: string; deleted: boolean }> {
    return this.delete<{ id: string; object: string; deleted: boolean }>(`/admin/draft-orders/${draftOrderId}`, { withCredentials: true });
  }

  /**
   * Add line item to draft order
   * @param draftOrderId The ID of the draft order
   * @param data Line item data
   * @returns Observable with updated draft order
   */
  addLineItemToDraftOrder(draftOrderId: string, data: {
    variant_id: string;
    quantity: number;
    metadata?: Record<string, any>;
  }): Observable<{ draft_order: any }> {
    return this.post<{ draft_order: any }>(`/admin/draft-orders/${draftOrderId}/line-items`, data, { withCredentials: true });
  }

  /**
   * Update line item in draft order
   * @param draftOrderId The ID of the draft order
   * @param itemId The ID of the line item
   * @param data Update data
   * @returns Observable with updated draft order
   */
  updateDraftOrderLineItem(draftOrderId: string, itemId: string, data: {
    quantity: number;
  }): Observable<{ draft_order: any }> {
    return this.post<{ draft_order: any }>(`/admin/draft-orders/${draftOrderId}/line-items/${itemId}`, data, { withCredentials: true });
  }

  /**
   * Remove line item from draft order
   * @param draftOrderId The ID of the draft order
   * @param itemId The ID of the line item to remove
   * @returns Observable with updated draft order
   */
  removeLineItemFromDraftOrder(draftOrderId: string, itemId: string): Observable<{ draft_order: any }> {
    return this.delete<{ draft_order: any }>(`/admin/draft-orders/${draftOrderId}/line-items/${itemId}`, { withCredentials: true });
  }

  /**
   * Register payment for draft order
   * @param draftOrderId The ID of the draft order
   * @returns Observable with updated draft order
   */
  registerDraftOrderPayment(draftOrderId: string): Observable<{ order: any }> {
    return this.post<{ order: any }>(`/admin/draft-orders/${draftOrderId}/pay`, {}, { withCredentials: true });
  }
}

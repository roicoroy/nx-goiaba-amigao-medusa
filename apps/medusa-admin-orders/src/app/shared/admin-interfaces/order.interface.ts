// Base interfaces for common structures
export interface RawValue {
  value: string;
  precision: number;
}

export interface OrderSummary {
  paid_total: number;
  raw_paid_total: RawValue;
  refunded_total: number;
  accounting_total: number;
  credit_line_total: number;
  transaction_total: number;
  pending_difference: number;
  raw_refunded_total: RawValue;
  current_order_total: number;
  original_order_total: number;
  raw_accounting_total: RawValue;
  raw_credit_line_total: RawValue;
  raw_transaction_total: RawValue;
  raw_pending_difference: RawValue;
  raw_current_order_total: RawValue;
  raw_original_order_total: RawValue;
}

export interface OrderItemDetail {
  id: string;
  version: number;
  metadata: any;
  order_id: string;
  raw_unit_price: RawValue | null;
  raw_compare_at_unit_price: RawValue | null;
  raw_quantity: RawValue;
  raw_fulfilled_quantity: RawValue;
  raw_delivered_quantity: RawValue;
  raw_shipped_quantity: RawValue;
  raw_return_requested_quantity: RawValue;
  raw_return_received_quantity: RawValue;
  raw_return_dismissed_quantity: RawValue;
  raw_written_off_quantity: RawValue;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  item_id: string;
  unit_price: number | null;
  compare_at_unit_price: number | null;
  quantity: number;
  fulfilled_quantity: number;
  delivered_quantity: number;
  shipped_quantity: number;
  return_requested_quantity: number;
  return_received_quantity: number;
  return_dismissed_quantity: number;
  written_off_quantity: number;
}

export interface OrderItemAdjustment {
  id: string;
  description: string | null;
  promotion_id: string;
  code: string;
  provider_id: string | null;
  is_tax_inclusive: boolean;
  item_id: string;
  raw_amount: RawValue;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  amount: number;
  subtotal: number;
  total: number;
  raw_subtotal: RawValue;
  raw_total: RawValue;
}

export interface OrderItem {
  id: string;
  title: string;
  subtitle: string;
  thumbnail: string | null;
  variant_id: string;
  product_id: string;
  product_title: string;
  product_description: string;
  product_subtitle: string | null;
  product_type: string | null;
  product_type_id: string | null;
  product_collection: string;
  product_handle: string;
  variant_sku: string;
  variant_barcode: string | null;
  variant_title: string;
  variant_option_values: any;
  requires_shipping: boolean;
  is_giftcard: boolean;
  is_discountable: boolean;
  is_tax_inclusive: boolean;
  is_custom_price: boolean;
  metadata: Record<string, any>;
  raw_compare_at_unit_price: RawValue | null;
  raw_unit_price: RawValue;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  tax_lines: any[];
  adjustments: OrderItemAdjustment[];
  compare_at_unit_price: number | null;
  unit_price: number;
  quantity: number;
  raw_quantity: RawValue;
  detail: OrderItemDetail;
  subtotal: number;
  total: number;
  original_subtotal: number;
  original_total: number;
  discount_subtotal: number;
  discount_tax_total: number;
  discount_total: number;
  tax_total: number;
  original_tax_total: number;
  refundable_total_per_unit: number;
  refundable_total: number;
  fulfilled_total: number;
  shipped_total: number;
  return_requested_total: number;
  return_received_total: number;
  return_dismissed_total: number;
  write_off_total: number;
  raw_subtotal: RawValue;
  raw_total: RawValue;
  raw_original_subtotal: RawValue;
  raw_original_total: RawValue;
  raw_discount_subtotal: RawValue;
  raw_discount_tax_total: RawValue;
  raw_discount_total: RawValue;
  raw_tax_total: RawValue;
  raw_original_tax_total: RawValue;
  raw_refundable_total_per_unit: RawValue;
  raw_refundable_total: RawValue;
  raw_fulfilled_total: RawValue;
  raw_shipped_total: RawValue;
  raw_return_requested_total: RawValue;
  raw_return_received_total: RawValue;
  raw_return_dismissed_total: RawValue;
  raw_write_off_total: RawValue;
}

// Order status enums
export enum OrderStatus {
  PENDING = 'pending',
  COMPLETED = 'completed',
  CANCELED = 'canceled',
  REQUIRES_ACTION = 'requires_action'
}

export enum PaymentStatus {
  NOT_PAID = 'not_paid',
  AWAITING = 'awaiting',
  CAPTURED = 'captured',
  PARTIALLY_REFUNDED = 'partially_refunded',
  REFUNDED = 'refunded',
  CANCELED = 'canceled',
  REQUIRES_ACTION = 'requires_action',
  AUTHORIZED = 'authorized'
}

export enum FulfillmentStatus {
  NOT_FULFILLED = 'not_fulfilled',
  PARTIALLY_FULFILLED = 'partially_fulfilled',
  FULFILLED = 'fulfilled',
  PARTIALLY_SHIPPED = 'partially_shipped',
  SHIPPED = 'shipped',
  PARTIALLY_RETURNED = 'partially_returned',
  RETURNED = 'returned',
  CANCELED = 'canceled',
  REQUIRES_ACTION = 'requires_action',
  DELIVERED = 'delivered'
}

// Main Order interface
export interface Order {
  id: string;
  display_id: number;
  status: OrderStatus;
  version: number;
  summary?: OrderSummary; // Optional - may not be present in all API responses
  total: number;
  metadata: Record<string, any> | null;
  created_at: string;
  updated_at: string;
  canceled_at?: string;
  items: OrderItem[];
  payment_status: PaymentStatus;
  fulfillment_status: FulfillmentStatus;

  // Optional fields that might be present in detailed order view
  customer?: Customer;
  email?: string;
  currency_code?: string;
  region_id?: string;
  sales_channel_id?: string;
  customer_id?: string;
  shipping_address?: Address;
  billing_address?: Address;
  shipping_methods?: ShippingMethod[];
  payments?: Payment[];
  payment_collections?: PaymentCollection[];
  fulfillments?: Fulfillment[];
  returns?: Return[];
  claims?: Claim[];
  exchanges?: Exchange[];
  discounts?: Discount[];
  gift_cards?: GiftCard[];
  promotions?: any[];
  credit_lines?: any[];
  sales_channel?: any;
  region?: any;

  // Calculated fields from API response
  subtotal?: number;
  tax_total?: number;
  shipping_total?: number;
  discount_total?: number;
  gift_card_total?: number;
  paid_total?: number;
  refunded_total?: number;
  item_subtotal?: number;
  item_total?: number;
  item_tax_total?: number;
  original_item_tax_total?: number;
  item_discount_total?: number;
  shipping_subtotal?: number;
  original_total?: number;
  original_tax_total?: number;
  discount_subtotal?: number;
  shipping_tax_total?: number;
  original_shipping_tax_total?: number;
  shipping_discount_total?: number;
  refundable_total?: number;
  credit_line_total?: number;
}

// Orders list response
export interface OrdersResponse {
  orders: Order[];
  count: number;
  offset: number;
  limit: number;
}

// Supporting interfaces
export interface Customer {
  id: string;
  email: string;
  first_name?: string;
  last_name?: string;
  phone?: string;
  company_name?: string;
  has_account: boolean;
  // Store staff fields
  is_store_staff?: boolean;
  staff_role?: string; // "staff", "manager", "supervisor"
  staff_since?: string; // ISO 8601 date
  created_at: string;
  updated_at: string;
  deleted_at?: string;
  metadata?: Record<string, any>;
}

export interface Address {
  id: string;
  customer_id?: string;
  company?: string;
  first_name?: string;
  last_name?: string;
  address_1: string;
  address_2?: string;
  city: string;
  country_code: string;
  province?: string;
  postal_code: string;
  phone?: string;
  created_at: string;
  updated_at: string;
  deleted_at?: string;
  metadata?: Record<string, any>;
}

export interface ShippingMethod {
  id: string;
  shipping_option_id: string;
  order_id: string;
  name: string;
  description?: string;
  amount: number;
  is_tax_inclusive: boolean;
  shipping_option: ShippingOption;
  tax_lines: TaxLine[];
  adjustments: any[];
  created_at: string;
  updated_at: string;
  deleted_at?: string;
}

export interface ShippingOption {
  id: string;
  name: string;
  region_id: string;
  profile_id: string;
  provider_id: string;
  price_type: string;
  amount?: number;
  is_return: boolean;
  admin_only: boolean;
  requirements: any[];
  data: Record<string, any>;
  created_at: string;
  updated_at: string;
  deleted_at?: string;
  metadata?: Record<string, any>;
}

export interface Payment {
  id: string;
  swap_id?: string;
  cart_id?: string;
  order_id?: string;
  amount: number;
  currency_code: string;
  amount_refunded?: number;
  provider_id: string;
  data: Record<string, any>;
  captured_at?: string;
  canceled_at?: string;
  created_at: string;
  updated_at: string;
  metadata?: Record<string, any>;
  payment_collection_id?: string;
  payment_session_id?: string;
  payment_session?: any;
  refunds?: any[];
  raw_amount?: RawValue;
  captures?: PaymentCapture[];
}

export interface PaymentCapture {
  id: string;
  amount: number;
  created_at?: string;
}

export interface PaymentCollection {
  id: string;
  currency_code: string;
  completed_at?: string;
  status: string;
  metadata?: Record<string, any>;
  raw_amount: RawValue;
  raw_authorized_amount: RawValue;
  raw_captured_amount: RawValue;
  raw_refunded_amount: RawValue;
  created_at: string;
  updated_at: string;
  deleted_at?: string;
  payments: Payment[];
  amount: number;
  authorized_amount: number;
  captured_amount: number;
  refunded_amount: number;
}

export interface Fulfillment {
  id: string;
  claim_order_id?: string;
  swap_id?: string;
  order_id?: string;
  provider_id: string;
  location_id?: string;
  shipped_at?: string;
  delivered_at?: string;
  canceled_at?: string;
  data: Record<string, any>;
  tracking_numbers: string[];
  tracking_links: TrackingLink[];
  items: FulfillmentItem[];
  created_at: string;
  updated_at: string;
  metadata?: Record<string, any>;
}

export interface FulfillmentItem {
  id: string;
  fulfillment_id: string;
  item_id?: string;  // Deprecated - use line_item_id instead
  line_item_id: string;  // The actual order line item ID
  quantity: number;
  title?: string;
  sku?: string;
  barcode?: string;
}

export interface TrackingLink {
  id: string;
  url: string;
  tracking_number: string;
  fulfillment_id: string;
  created_at: string;
  updated_at: string;
  deleted_at?: string;
  metadata?: Record<string, any>;
}

export interface TaxLine {
  id: string;
  rate: number;
  name: string;
  code?: string;
  created_at: string;
  updated_at: string;
  metadata?: Record<string, any>;
}

export interface Discount {
  id: string;
  code: string;
  is_dynamic: boolean;
  rule_id: string;
  is_disabled: boolean;
  parent_discount_id?: string;
  starts_at?: string;
  ends_at?: string;
  created_at: string;
  updated_at: string;
  deleted_at?: string;
  metadata?: Record<string, any>;
}

export interface GiftCard {
  id: string;
  code: string;
  value: number;
  balance: number;
  region_id: string;
  order_id?: string;
  is_disabled: boolean;
  ends_at?: string;
  created_at: string;
  updated_at: string;
  deleted_at?: string;
  metadata?: Record<string, any>;
}

export interface Return {
  id: string;
  order_id: string;
  display_id?: number;
  location_id?: string | null;
  order_version?: number;
  status: 'requested' | 'received' | 'canceled' | 'requires_action';
  items?: ReturnItem[];
  swap_id?: string;
  claim_order_id?: string;
  shipping_method?: ShippingMethod;
  shipping_data?: Record<string, any>;
  refund_amount: number | null;
  received_at?: string | null;
  created_at: string;
  updated_at: string;
  canceled_at?: string | null;
  requested_at?: string | null;
  created_by?: string | null;
  no_notification?: boolean | null;
  metadata?: Record<string, any> | null;
}

export interface ReturnsResponse {
  returns: Return[];
  count: number;
  offset: number;
  limit: number;
}

export interface ReturnItem {
  return_id: string;
  item_id: string;
  quantity: number;
  is_requested: boolean;
  requested_quantity?: number;
  received_quantity?: number;
  reason_id?: string;
  note?: string;
  metadata?: Record<string, any>;
}

export interface Claim {
  id: string;
  payment_status: string;
  fulfillment_status: string;
  type: string;
  order_id: string;
  shipping_address_id?: string;
  refund_amount?: number;
  canceled_at?: string;
  created_at: string;
  updated_at: string;
  deleted_at?: string;
  metadata?: Record<string, any>;
  additional_items: ClaimItem[];
  claim_items: ClaimItem[];
  fulfillments: Fulfillment[];
  return_order: Return;
  shipping_address?: Address;
  shipping_methods: ShippingMethod[];
}

export interface ClaimItem {
  id: string;
  images: ClaimImage[];
  claim_order_id: string;
  item_id: string;
  variant_id: string;
  reason: string;
  note?: string;
  quantity: number;
  tags: ClaimTag[];
  created_at: string;
  updated_at: string;
  deleted_at?: string;
  metadata?: Record<string, any>;
}

export interface ClaimImage {
  id: string;
  claim_item_id: string;
  url: string;
  created_at: string;
  updated_at: string;
  deleted_at?: string;
  metadata?: Record<string, any>;
}

export interface ClaimTag {
  id: string;
  value: string;
  created_at: string;
  updated_at: string;
  deleted_at?: string;
  metadata?: Record<string, any>;
}

export interface Exchange {
  id: string;
  order_id: string;
  return_id: string;
  cart_id?: string;
  difference_due?: number;
  payment_status: string;
  fulfillment_status: string;
  canceled_at?: string;
  created_at: string;
  updated_at: string;
  deleted_at?: string;
  metadata?: Record<string, any>;
}

// Filter interfaces for API requests
export interface OrderFilters {
  q?: string;
  id?: string | string[];
  status?: OrderStatus | OrderStatus[];
  fulfillment_status?: FulfillmentStatus | FulfillmentStatus[];
  payment_status?: PaymentStatus | PaymentStatus[];
  display_id?: number | number[];
  cart_id?: string | string[];
  customer_id?: string | string[];
  email?: string;
  region_id?: string | string[];
  currency_code?: string | string[];
  tax_rate?: string;
  sales_channel_id?: string | string[];
  created_at?: {
    lt?: string;
    gt?: string;
    lte?: string;
    gte?: string;
  };
  updated_at?: {
    lt?: string;
    gt?: string;
    lte?: string;
    gte?: string;
  };
  canceled_at?: {
    lt?: string;
    gt?: string;
    lte?: string;
    gte?: string;
  };
  limit?: number;
  offset?: number;
  expand?: string;
  fields?: string; // Fields to expand/include in response
  order?: string;
}

/**
 * Fulfillment Modal Interfaces
 *
 * These interfaces are used by the fulfillment modal component to manage
 * the creation of order fulfillments.
 */

/**
 * Stock Location interface matching Medusa Admin API response structure
 * Used for displaying available warehouse locations in the fulfillment modal
 */
export interface StockLocation {
  id: string;
  name: string;
  address: StockLocationAddress;
  metadata: any;
  created_at: string;
  updated_at: string;
  deleted_at?: string;
}

/**
 * Stock Location Address structure
 */
export interface StockLocationAddress {
  id: string;
  address_1: string;
  address_2?: string;
  city: string;
  country_code: string;
  province?: string;
  postal_code: string | null;
  phone?: string;
  created_at?: string;
  updated_at?: string;
  metadata?: any;
}

/**
 * Shipping Option interface with nested service zone and location data
 * Used for displaying available shipping methods in the fulfillment modal
 */
export interface ShippingOptionWithLocation {
  id: string;
  name: string;
  price_type: string;
  provider_id: string;
  service_zone_id: string;
  service_zone: ServiceZone;
  type: ShippingOptionType;
  prices: ShippingOptionPrice[];
  created_at: string;
  updated_at: string;
  deleted_at?: string;
  metadata?: any;
}

/**
 * Service Zone with fulfillment set and location data
 */
export interface ServiceZone {
  id: string;
  name: string;
  fulfillment_set: FulfillmentSet;
  created_at?: string;
  updated_at?: string;
  metadata?: any;
}

/**
 * Fulfillment Set with location reference
 */
export interface FulfillmentSet {
  id: string;
  name?: string;
  type?: string;
  location: FulfillmentSetLocation;
  created_at?: string;
  updated_at?: string;
  metadata?: any;
}

/**
 * Location reference within fulfillment set
 */
export interface FulfillmentSetLocation {
  id: string;
}

/**
 * Shipping Option Type details
 */
export interface ShippingOptionType {
  id: string;
  label: string;
  description: string;
  code: string;
}

/**
 * Shipping Option Price
 */
export interface ShippingOptionPrice {
  id: string;
  currency_code: string;
  amount: number;
  created_at?: string;
  updated_at?: string;
}

/**
 * Fulfillment Item for modal UI
 * Represents an order item with quantity controls for fulfillment
 */
export interface FulfillmentItemUI {
  id: string; // order line item id
  title: string;
  subtitle: string;
  thumbnail: string | null;
  variant_sku: string;
  quantity: number; // selected quantity to fulfill
  availableQuantity: number; // max available quantity
  inStockQuantity: number; // current stock quantity
}

/**
 * Create Fulfillment Payload for API request
 * Sent to POST /admin/orders/{order_id}/fulfillments
 */
export interface CreateFulfillmentPayload {
  location_id: string;
  shipping_option_id: string;
  items: FulfillmentItemPayload[];
  metadata?: Record<string, any>;
}

/**
 * Fulfillment Item for API payload
 */
export interface FulfillmentItemPayload {
  id: string; // order line item id
  quantity: number;
}

/**
 * Stock Locations API Response
 */
export interface StockLocationsResponse {
  stock_locations: StockLocation[];
  count: number;
  offset: number;
  limit: number;
}

/**
 * Shipping Options API Response
 */
export interface ShippingOptionsResponse {
  shipping_options: ShippingOptionWithLocation[];
  count: number;
  offset: number;
  limit: number;
}

# Admin Orders Management - Complete API Reference

This document provides a complete reference for all admin endpoints available in the `MedusaAdminService` for managing orders and related resources.

## Table of Contents
- [Primary Order Endpoints](#primary-order-endpoints)
- [Order Operations](#order-operations)
- [Supporting Resources](#supporting-resources)
- [Customer Management](#customer-management)
- [Product & Inventory](#product--inventory)
- [Shipping & Fulfillment](#shipping--fulfillment)
- [Returns, Exchanges & Claims](#returns-exchanges--claims)

---

## Primary Order Endpoints

### Get Order Details
```typescript
this.medusaAdminService.getOrder(orderId).subscribe(
  response => console.log('Order:', response.order)
);
```
**Endpoint:** `GET /admin/orders/{id}`

### Get Order Reservations
```typescript
this.medusaAdminService.getOrderReservations(orderId).subscribe(
  response => console.log('Reservations:', response.reservations)
);
```
**Endpoint:** `GET /admin/orders/{id}/reservations`

### List All Orders
```typescript
this.medusaAdminService.getOrders().subscribe(
  response => console.log('Orders:', response.orders)
);
```
**Endpoint:** `GET /admin/orders`

### Get Order Preview
```typescript
this.medusaAdminService.getOrderPreview(orderId).subscribe(
  preview => console.log('Order preview with updated totals:', preview)
);
```
**Endpoint:** `GET /admin/orders/{id}/preview`

---

## Order Operations

### Capture Payment
```typescript
this.medusaAdminService.capturePayment(orderId).subscribe(
  response => console.log('Payment captured:', response)
);
```
**Endpoint:** `POST /admin/orders/{id}/capture-payment`

### Refund Payment
```typescript
this.medusaAdminService.refundPayment(orderId, {
  amount: 1000, // in cents
  reason: 'Customer request'
}).subscribe(
  response => console.log('Refund processed:', response)
);
```
**Endpoint:** `POST /admin/orders/{id}/refund`

### Complete Order
```typescript
this.medusaAdminService.completeOrder(orderId).subscribe(
  response => console.log('Order completed:', response)
);
```
**Endpoint:** `POST /admin/orders/{id}/complete`

### Cancel Order
```typescript
this.medusaAdminService.cancelOrder(orderId).subscribe(
  response => console.log('Order cancelled:', response)
);
```
**Endpoint:** `POST /admin/orders/{id}/cancel`

### Archive Order
```typescript
this.medusaAdminService.archiveOrder(orderId).subscribe(
  response => console.log('Order archived:', response)
);
```
**Endpoint:** `POST /admin/orders/{id}/archive`

### Update Order
```typescript
this.medusaAdminService.updateOrder(orderId, {
  email: 'newemail@example.com',
  // other fields...
}).subscribe(
  response => console.log('Order updated:', response.order)
);
```
**Endpoint:** `POST /admin/orders/{id}`

---

## Supporting Resources

### Regions

#### List Regions
```typescript
this.medusaAdminService.getRegions({
  limit: 10,
  offset: 0
}).subscribe(
  response => console.log('Regions:', response.regions)
);
```
**Endpoint:** `GET /admin/regions`

#### Get Region by ID
```typescript
this.medusaAdminService.getRegionById(regionId).subscribe(
  response => console.log('Region:', response.region)
);
```
**Endpoint:** `GET /admin/regions/{id}`

### Stores

#### List Stores
```typescript
this.medusaAdminService.getStores().subscribe(
  response => console.log('Stores:', response.stores)
);
```
**Endpoint:** `GET /admin/stores`

#### Get Store by ID
```typescript
this.medusaAdminService.getStoreById(storeId).subscribe(
  response => console.log('Store:', response.store)
);
```
**Endpoint:** `GET /admin/stores/{id}`

### Payment Collections

#### List Payment Collections
```typescript
this.medusaAdminService.getPaymentCollections({
  order_id: orderId,
  limit: 10
}).subscribe(
  response => console.log('Payment collections:', response.payment_collections)
);
```
**Endpoint:** `GET /admin/payment-collections`

#### Get Payment Collection by ID
```typescript
this.medusaAdminService.getPaymentCollectionById(paymentCollectionId).subscribe(
  response => console.log('Payment collection:', response.payment_collection)
);
```
**Endpoint:** `GET /admin/payment-collections/{id}`

---

## Customer Management

### List Customers
```typescript
this.medusaAdminService.getCustomers({
  limit: 20,
  offset: 0
}).subscribe(
  response => console.log('Customers:', response.customers)
);
```
**Endpoint:** `GET /admin/customers`

### Get Customer by ID
```typescript
this.medusaAdminService.getCustomerById(customerId).subscribe(
  response => console.log('Customer:', response.customer)
);
```
**Endpoint:** `GET /admin/customers/{id}`

---

## Product & Inventory

### List Products
```typescript
this.medusaAdminService.getProducts({
  limit: 20,
  offset: 0,
  q: 'search term' // optional search
}).subscribe(
  response => console.log('Products:', response.products)
);
```
**Endpoint:** `GET /admin/products`

### Get Product by ID
```typescript
this.medusaAdminService.getProductById(productId).subscribe(
  response => console.log('Product:', response.product)
);
```
**Endpoint:** `GET /admin/products/{id}`

### Stock Locations

#### List Stock Locations
```typescript
this.medusaAdminService.getStockLocations(10, 0).subscribe(
  response => console.log('Stock locations:', response.stock_locations)
);
```
**Endpoint:** `GET /admin/stock-locations`

---

## Shipping & Fulfillment

### Shipping Options

#### List Shipping Options
```typescript
this.medusaAdminService.getShippingOptions({
  stock_location_id: 'loc_123',
  limit: 10
}).subscribe(
  response => console.log('Shipping options:', response.shipping_options)
);
```
**Endpoint:** `GET /admin/shipping-options`

### Shipping Profiles

#### List Shipping Profiles
```typescript
this.medusaAdminService.getShippingProfiles({
  limit: 10,
  offset: 0
}).subscribe(
  response => console.log('Shipping profiles:', response.shipping_profiles)
);
```
**Endpoint:** `GET /admin/shipping-profiles`

#### Get Shipping Profile by ID
```typescript
this.medusaAdminService.getShippingProfileById(shippingProfileId).subscribe(
  response => console.log('Shipping profile:', response.shipping_profile)
);
```
**Endpoint:** `GET /admin/shipping-profiles/{id}`

### Fulfillments

#### List Fulfillments
```typescript
this.medusaAdminService.getFulfillments({
  order_id: orderId,
  limit: 10
}).subscribe(
  response => console.log('Fulfillments:', response.fulfillments)
);
```
**Endpoint:** `GET /admin/fulfillments`

#### Get Fulfillment by ID
```typescript
this.medusaAdminService.getFulfillmentById(fulfillmentId).subscribe(
  response => console.log('Fulfillment:', response.fulfillment)
);
```
**Endpoint:** `GET /admin/fulfillments/{id}`

#### Create Fulfillment
```typescript
this.medusaAdminService.createFulfillment(orderId, {
  location_id: 'loc_123',
  items: [
    { id: 'item_123', quantity: 2 }
  ]
}).subscribe(
  response => console.log('Fulfillment created:', response)
);
```
**Endpoint:** `POST /admin/orders/{id}/fulfillment`

#### Get Order for Fulfillment
```typescript
this.medusaAdminService.getOrderForFulfillment(orderId).subscribe(
  order => console.log('Order with fulfillment data:', order)
);
```
**Endpoint:** `GET /admin/orders/{id}` (with specific fields)

#### Cancel Fulfillment
```typescript
this.medusaAdminService.cancelFulfillment(orderId, fulfillmentId).subscribe(
  response => console.log('Fulfillment cancelled:', response)
);
```
**Endpoint:** `POST /admin/orders/{id}/fulfillment/{fulfillmentId}/cancel`

#### Create Shipment
```typescript
this.medusaAdminService.createShipment(orderId, fulfillmentId, {
  tracking_numbers: ['TRACK123']
}).subscribe(
  response => console.log('Shipment created:', response)
);
```
**Endpoint:** `POST /admin/orders/{id}/fulfillment/{fulfillmentId}/shipments`

#### Mark as Delivered
```typescript
this.medusaAdminService.markAsDelivered(orderId, fulfillmentId).subscribe(
  response => console.log('Marked as delivered:', response)
);
```
**Endpoint:** `POST /admin/orders/{id}/fulfillment/{fulfillmentId}/mark-as-delivered`

---

## Returns, Exchanges & Claims

### Returns

#### Create Return
```typescript
this.medusaAdminService.createReturn(orderId, {
  items: [
    { item_id: 'item_123', quantity: 1, reason_id: 'reason_123' }
  ]
}).subscribe(
  response => console.log('Return created:', response)
);
```
**Endpoint:** `POST /admin/orders/{id}/returns`

#### Get Returns for Order
```typescript
this.medusaAdminService.getReturns(orderId).subscribe(
  response => console.log('Returns:', response)
);
```
**Endpoint:** `GET /admin/orders/{id}/returns`

#### List Return Reasons
```typescript
this.medusaAdminService.getReturnReasons().subscribe(
  response => console.log('Return reasons:', response.return_reasons)
);
```
**Endpoint:** `GET /admin/return-reasons`

#### Get Return Reason by ID
```typescript
this.medusaAdminService.getReturnReasonById(returnReasonId).subscribe(
  response => console.log('Return reason:', response.return_reason)
);
```
**Endpoint:** `GET /admin/return-reasons/{id}`

### Exchanges

#### Create Exchange
```typescript
this.medusaAdminService.createExchange(orderId, {
  return_items: [
    { item_id: 'item_123', quantity: 1 }
  ],
  additional_items: [
    { variant_id: 'variant_456', quantity: 1 }
  ]
}).subscribe(
  response => console.log('Exchange created:', response)
);
```
**Endpoint:** `POST /admin/orders/{id}/exchanges`

#### Get Exchanges for Order
```typescript
this.medusaAdminService.getExchanges(orderId).subscribe(
  response => console.log('Exchanges:', response)
);
```
**Endpoint:** `GET /admin/orders/{id}/exchanges`

#### List All Exchanges
```typescript
this.medusaAdminService.getAllExchanges({
  order_id: orderId,
  limit: 10
}).subscribe(
  response => console.log('All exchanges:', response.exchanges)
);
```
**Endpoint:** `GET /admin/exchanges`

#### Get Exchange by ID
```typescript
this.medusaAdminService.getExchangeById(exchangeId).subscribe(
  response => console.log('Exchange:', response.exchange)
);
```
**Endpoint:** `GET /admin/exchanges/{id}`

### Claims

#### Create Claim
```typescript
this.medusaAdminService.createClaim(orderId, {
  type: 'replace', // or 'refund'
  claim_items: [
    { item_id: 'item_123', quantity: 1, reason: 'damaged' }
  ]
}).subscribe(
  response => console.log('Claim created:', response)
);
```
**Endpoint:** `POST /admin/orders/{id}/claims`

#### Get Claims for Order
```typescript
this.medusaAdminService.getClaims(orderId).subscribe(
  response => console.log('Claims:', response)
);
```
**Endpoint:** `GET /admin/orders/{id}/claims`

#### List All Claims
```typescript
this.medusaAdminService.getAllClaims({
  order_id: orderId,
  limit: 10
}).subscribe(
  response => console.log('All claims:', response.claims)
);
```
**Endpoint:** `GET /admin/claims`

#### Get Claim by ID
```typescript
this.medusaAdminService.getClaimById(claimId).subscribe(
  response => console.log('Claim:', response.claim)
);
```
**Endpoint:** `GET /admin/claims/{id}`

---

## Typical Order Management Flow

### 1. Initial Page Load (Orders List)
```typescript
// Load orders
this.medusaAdminService.getOrders().subscribe(orders => {
  // Display orders list
});

// Load supporting data
forkJoin({
  regions: this.medusaAdminService.getRegions(),
  stores: this.medusaAdminService.getStores(),
  shippingOptions: this.medusaAdminService.getShippingOptions()
}).subscribe(data => {
  // Store supporting data for filters/display
});
```

### 2. Order Details Page Load
```typescript
const orderId = 'order_01K9M5N86E244M1GXWYSSRZN6A';

forkJoin({
  order: this.medusaAdminService.getOrder(orderId),
  reservations: this.medusaAdminService.getOrderReservations(orderId),
  paymentCollections: this.medusaAdminService.getPaymentCollections({ order_id: orderId }),
  fulfillments: this.medusaAdminService.getFulfillments({ order_id: orderId }),
  returns: this.medusaAdminService.getReturns(orderId),
  exchanges: this.medusaAdminService.getExchanges(orderId),
  claims: this.medusaAdminService.getClaims(orderId)
}).subscribe(data => {
  // Display complete order details
  console.log('Complete order data:', data);
});
```

### 3. Load Customer Details
```typescript
// After getting order, load customer details
this.medusaAdminService.getCustomerById(order.customer_id).subscribe(
  customer => console.log('Customer details:', customer)
);
```

### 4. Load Product Details for Line Items
```typescript
// Get product IDs from order line items
const productIds = order.items.map(item => item.product_id);

this.medusaAdminService.getProducts({ id: productIds }).subscribe(
  response => console.log('Products:', response.products)
);
```

---

## Notes

- All endpoints use `withCredentials: true` for proper session handling
- All endpoints require admin authentication
- Most list endpoints support pagination via `limit` and `offset` parameters
- Query parameters are automatically built using the `buildQueryString()` helper
- All methods return RxJS Observables for reactive programming

## Official Documentation

- **Medusa Admin API**: https://docs.medusajs.com/api/admin
- **Orders API**: https://docs.medusajs.com/api/admin#orders
- **Authentication**: https://docs.medusajs.com/resources/authentication

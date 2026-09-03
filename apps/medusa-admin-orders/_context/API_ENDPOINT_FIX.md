# API Endpoint Corrections

## 🐛 **Bug Fixed**

The extended order data endpoints were using **incorrect nested URLs** instead of the proper **top-level admin endpoints**.

### **What Was Wrong:**

```typescript
// ❌ INCORRECT (nested under orders)
GET /admin/orders/{orderId}/returns
GET /admin/orders/{orderId}/exchanges
GET /admin/orders/{orderId}/claims
GET /admin/orders/{orderId}/reservations
```

These endpoints **don't exist** in the Medusa API, which is why they were returning **401 Unauthorized** on the OPTIONS preflight.

### **What's Correct:**

```typescript
// ✅ CORRECT (top-level with optional filter)
GET /admin/returns?order_id={orderId}
GET /admin/exchanges?order_id={orderId}
GET /admin/claims?order_id={orderId}
GET /admin/reservations?order_id={orderId}
```

## 📋 **Changes Made**

### **1. getClaims()**
```typescript
// Before
getClaims(orderId: string): Observable<any> {
  return this.get(`/admin/orders/${orderId}/claims`, { withCredentials: true });
}

// After
getClaims(orderId?: string): Observable<any> {
  const queryString = orderId ? `?order_id=${orderId}` : '';
  return this.get(`/admin/claims${queryString}`, { withCredentials: true });
}
```

### **2. getReturns()**
```typescript
// Before
getReturns(orderId: string): Observable<any> {
  return this.get(`/admin/orders/${orderId}/returns`, { withCredentials: true });
}

// After
getReturns(orderId?: string): Observable<any> {
  const queryString = orderId ? `?order_id=${orderId}` : '';
  return this.get(`/admin/returns${queryString}`, { withCredentials: true });
}
```

### **3. getExchanges()**
```typescript
// Before
getExchanges(orderId: string): Observable<any> {
  return this.get(`/admin/orders/${orderId}/exchanges`, { withCredentials: true });
}

// After
getExchanges(orderId?: string): Observable<any> {
  const queryString = orderId ? `?order_id=${orderId}` : '';
  return this.get(`/admin/exchanges${queryString}`, { withCredentials: true });
}
```

### **4. getOrderReservations()**
```typescript
// Before
getOrderReservations(orderId: string): Observable<{ reservations: any[] }> {
  return this.get<{ reservations: any[] }>(`/admin/orders/${orderId}/reservations`, { withCredentials: true });
}

// After
getOrderReservations(orderId?: string): Observable<{ reservations: any[] }> {
  const queryString = orderId ? `?order_id=${orderId}` : '';
  return this.get<{ reservations: any[] }>(`/admin/reservations${queryString}`, { withCredentials: true });
}
```

## ✅ **Benefits**

1. **Correct API Endpoints** - Now using actual Medusa API routes
2. **Optional Filtering** - Can get all items or filter by order_id
3. **No More 401 Errors** - Endpoints actually exist
4. **Flexible Usage** - Can be used for order-specific or global queries

## 📚 **Medusa API Documentation**

According to the official Medusa Admin API docs:

- **Returns:** `GET /admin/returns` - [Documentation](https://docs.medusajs.com/api/admin#returns_getreturns)
- **Exchanges:** `GET /admin/exchanges` - [Documentation](https://docs.medusajs.com/api/admin#exchanges)
- **Claims:** `GET /admin/claims` - [Documentation](https://docs.medusajs.com/api/admin#claims)
- **Reservations:** `GET /admin/reservations` - [Documentation](https://docs.medusajs.com/api/admin#reservations)

All support optional `order_id` query parameter for filtering.

## 🎯 **Usage in OrderDetailPage**

The existing code in `order-detail.page.ts` will now work correctly:

```typescript
loadExtendedOrderData(order: Order): Observable<any> {
  return forkJoin({
    reservations: this.medusaAdmin.getOrderReservations(order.id), // ✅ Now correct
    edits: this.medusaAdmin.getOrderEdits(order.id),
    returns: this.medusaAdmin.getReturns(order.id),                // ✅ Now correct
    exchanges: this.medusaAdmin.getExchanges(order.id),            // ✅ Now correct
    claims: this.medusaAdmin.getClaims(order.id),                  // ✅ Now correct
    // ...
  });
}
```

## 🚀 **Expected Result**

After this fix:
- ✅ **OPTIONS requests** will succeed (200 OK)
- ✅ **GET requests** will return actual data
- ✅ **Extended order data** will load properly
- ✅ **UI sections** will display when data exists

## ⚠️ **Note on CORS**

While this fixes the **incorrect endpoints**, you may still need to configure CORS on your Medusa backend to allow requests from `http://localhost:8100`. See `BACKEND_CORS_FIX.md` for details.

---

## 📌 **Summary**

The issue was **NOT CORS** (at least not entirely) - it was **incorrect API endpoints**. The nested routes like `/admin/orders/{id}/returns` don't exist in Medusa v2. The correct approach is to use top-level endpoints with optional `order_id` query parameters.

This fix should resolve the 401 errors on OPTIONS requests! 🎉

# Quick Reference: Admin API Migration

## Authentication

### Login
```typescript
// Login with admin credentials
this.medusaAdminService.adminLogin(email, password).subscribe(
  response => {
    console.log('Token:', response.token);
  }
);
```

**Endpoint:** `POST /auth/user/emailpass`

### Get Current User
```typescript
// Get authenticated admin user profile
this.medusaAdminService.getCurrentUser().subscribe(
  user => {
    console.log('User:', user);
  }
);
```

**Endpoint:** `GET /admin/users/me`

### Logout
```typescript
// Logout and invalidate session
this.medusaAdminService.logout().subscribe(
  () => {
    console.log('Logged out successfully');
  }
);
```

**Endpoint:** `DELETE /auth/session`

## User Management

### Create Admin User
```typescript
this.medusaAdminService.createAdminUser({
  email: 'admin@example.com',
  password: 'securePassword123',
  first_name: 'John',
  last_name: 'Doe',
  role: 'admin', // admin, manager, warehouse-staff, driver
  phone: '+1234567890'
}).subscribe(response => {
  console.log('User created:', response.user);
});
```

**Endpoint:** `POST /admin/users`

### List Admin Users
```typescript
this.medusaAdminService.getAdminUsers().subscribe(
  response => {
    console.log('Users:', response.users);
    console.log('Total:', response.count);
  }
);
```

**Endpoint:** `GET /admin/users`

### Update Current User
```typescript
this.medusaAdminService.updateCurrentUser({
  first_name: 'Jane',
  phone: '+1987654321'
}).subscribe(response => {
  console.log('Profile updated:', response.user);
});
```

**Endpoint:** `POST /admin/users/me`

## Order Management

### List Orders
```typescript
this.medusaAdminService.getOrders().subscribe(
  response => {
    console.log('Orders:', response.orders);
  }
);
```

**Endpoint:** `GET /admin/orders`

### Get Order Details
```typescript
this.medusaAdminService.getOrder(orderId).subscribe(
  response => {
    console.log('Order:', response.order);
  }
);
```

**Endpoint:** `GET /admin/orders/{id}`

### Create Fulfillment
```typescript
this.medusaAdminService.createFulfillment(orderId, {
  location_id: 'loc_123',
  items: [
    { id: 'item_123', quantity: 2 }
  ]
}).subscribe(
  response => {
    console.log('Fulfillment created:', response);
  }
);
```

**Endpoint:** `POST /admin/orders/{id}/fulfillment`

### Capture Payment
```typescript
this.medusaAdminService.capturePayment(orderId).subscribe(
  response => {
    console.log('Payment captured:', response);
  }
);
```

**Endpoint:** `POST /admin/orders/{id}/capture-payment`

### Refund Payment
```typescript
this.medusaAdminService.refundPayment(orderId, {
  amount: 1000, // in cents
  reason: 'Customer request'
}).subscribe(
  response => {
    console.log('Refund processed:', response);
  }
);
```

**Endpoint:** `POST /admin/orders/{id}/refund`

## Key Changes from Old API

| Old Endpoint | New Endpoint | Notes |
|-------------|--------------|-------|
| `/auth/customer/emailpass` | `/auth/user/emailpass` | Admin authentication |
| `/store/customers/me` | `/admin/users/me` | Get current admin user |
| `/store/orders` | `/admin/orders` | List orders |
| `/store/orders/{id}` | `/admin/orders/{id}` | Get order details |
| `/admin/store-staff` | `/admin/users` | User management |
| `/store/stock-locations` | `/admin/stock-locations` | Stock locations |
| `/store/staff/shipping-options` | `/admin/shipping-options` | Shipping options |

## Important Notes

1. **Session Cookies**: All requests now use `withCredentials: true` to properly handle session cookies
2. **JWT Tokens**: Still used in the `Authorization: Bearer {token}` header
3. **Admin Key**: The `x-medusa-access-token` header is automatically added for `/admin/*` endpoints
4. **Error Handling**: 401 errors on `/admin/users/me` will trigger automatic logout
5. **Role-Based Access**: Ensure your admin user has the appropriate role for the operations you're performing

## Testing

Use the test script from the migration guide to verify all endpoints:

```bash
# Located at: admin-auth-migration-guide.md (lines 304-349)
# Or create a new test file based on the examples above
```

## Documentation

- **Medusa Admin API**: https://docs.medusajs.com/api/admin
- **Orders API**: https://docs.medusajs.com/api/admin#orders
- **Users API**: https://docs.medusajs.com/api/admin#users
- **Authentication**: https://docs.medusajs.com/resources/authentication

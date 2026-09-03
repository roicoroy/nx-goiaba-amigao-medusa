# Admin User Extensions

## Overview

This implementation extends Medusa's admin user model to support store staff and drivers. Instead of using customers with admin privileges (which creates auth complexity), we use admin users as the base and extend them with additional fields.

## Why Admin Users Instead of Customers?

### Previous Approach (Customer-based)
- ❌ Customers don't have native admin API access
- ❌ Required complex auth workarounds
- ❌ Fighting against the framework's design
- ❌ Security concerns with elevated customer privileges

### Current Approach (Admin User-based)
- ✅ Admin users naturally access admin APIs
- ✅ Clean authentication flow
- ✅ Better security model
- ✅ Easier to extend with custom fields
- ✅ Aligns with Medusa's architecture

## Extended Fields

The `user` table has been extended with:

| Field | Type | Description |
|-------|------|-------------|
| `avatar_url` | VARCHAR(500) | Cloudinary URL for user avatar |
| `phone` | VARCHAR(50) | Contact phone number |
| `role` | VARCHAR(50) | User role: `admin`, `manager`, `warehouse-staff`, `driver` |
| `metadata` | JSONB | Flexible additional data storage |

## API Endpoints

### User Creation

#### Create New User
```http
POST /admin/users
Authorization: Bearer {admin_token}
Content-Type: application/json

{
  "email": "newuser@example.com",
  "password": "SecurePass123!",
  "first_name": "John",
  "last_name": "Doe",
  "role": "warehouse-staff",
  "phone": "+1234567890",
  "metadata": {
    "warehouse_id": "wh_123"
  }
}
```

**Required Fields:**
- `email` - Valid email address (must be unique)
- `password` - Minimum 8 characters
- `first_name` - User's first name
- `last_name` - User's last name

**Optional Fields:**
- `role` - One of: `admin`, `manager`, `warehouse-staff`, `driver` (defaults to `admin`)
- `phone` - Contact phone number
- `metadata` - Additional custom data

**Permissions:** Only users with `admin` role can create new users.

Response (Success):
```json
{
  "success": true,
  "user": {
    "id": "user_456",
    "email": "newuser@example.com",
    "first_name": "John",
    "last_name": "Doe",
    "role": "warehouse-staff",
    "phone": "+1234567890",
    "created_at": "2024-11-20T..."
  },
  "message": "User created successfully"
}
```

Response (Error - Validation):
```json
{
  "success": false,
  "message": "Password too weak",
  "errors": {
    "password": "Password must be at least 8 characters long"
  }
}
```

Response (Error - Duplicate Email):
```json
{
  "success": false,
  "message": "Email already exists",
  "errors": {
    "email": "This email is already registered"
  }
}
```

### Profile Management

#### Get Current User Profile
```http
GET /admin/users/me
Authorization: Bearer {admin_token}
```

Response:
```json
{
  "success": true,
  "user": {
    "id": "user_123",
    "email": "staff@example.com",
    "first_name": "John",
    "last_name": "Doe",
    "avatar_url": "https://res.cloudinary.com/...",
    "phone": "+1234567890",
    "role": "warehouse-staff",
    "metadata": {},
    "created_at": "2024-01-01T00:00:00Z",
    "updated_at": "2024-01-01T00:00:00Z"
  }
}
```

#### Update Current User Profile
```http
PATCH /admin/users/me
Authorization: Bearer {admin_token}
Content-Type: application/json

{
  "first_name": "John",
  "last_name": "Doe",
  "phone": "+1234567890",
  "metadata": {
    "warehouse_id": "wh_123"
  }
}
```

### Avatar Management

#### Upload Avatar
```http
PUT /admin/users/me/avatar
Authorization: Bearer {admin_token}
Content-Type: multipart/form-data

avatar: [image file]
```

Response:
```json
{
  "success": true,
  "data": {
    "avatar_url": "https://res.cloudinary.com/...",
    "user_id": "user_123",
    "public_id": "admin_user_123"
  },
  "message": "Avatar uploaded successfully"
}
```

#### Get Avatar
```http
GET /admin/users/me/avatar
Authorization: Bearer {admin_token}
```

#### Delete Avatar
```http
DELETE /admin/users/me/avatar
Authorization: Bearer {admin_token}
```

## User Roles

### Role Types

1. **admin** - Full system access (default)
2. **manager** - Store/warehouse manager with elevated permissions
3. **warehouse-staff** - Staff member managing inventory and orders
4. **driver** - Delivery driver with order fulfillment access

### Role-Based Access Control

Implement role checks in your routes:

```typescript
const userRole = (req as any).auth_context?.role

if (userRole !== 'admin' && userRole !== 'manager') {
  return res.status(403).json({
    success: false,
    message: "Insufficient permissions"
  })
}
```

## Migration

Run the migration to add the new fields:

```bash
psql $DATABASE_URL -f migrations/extend-admin-user-fields.sql
```

## Next Steps

### Address Support
To add address support for admin users (for drivers/staff locations):

1. Create `admin_address` table or link to existing `address` table
2. Add relationship: `user.addresses[]`
3. Create endpoints: `/admin/users/me/addresses`

### Authentication Flow
Admin users authenticate using standard Medusa admin auth:

```typescript
// Login
POST /auth/user/emailpass
{
  "email": "staff@example.com",
  "password": "password"
}

// Returns JWT token for admin API access
```

## Environment Variables

Ensure these are set in `.env`:

```env
CLOUDINARY_NAME=your_cloud_name
CLOUDINARY_KEY=your_api_key
CLOUDINARY_SECRET=your_api_secret
CLOUDINARY_ROOT_FOLDER=medusa-store
```

## Benefits Summary

- **Simpler Auth**: Use native admin authentication
- **Better Security**: Proper permission model
- **Extensible**: Easy to add more fields
- **Maintainable**: Works with Medusa's design patterns
- **Scalable**: Can support multiple user types with roles

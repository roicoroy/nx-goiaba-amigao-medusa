# Admin Authentication Migration Guide

This guide explains how to migrate from custom store authentication to Medusa's built-in admin authentication system.

## Overview

Medusa v2 provides a robust admin authentication system that handles:
- User creation and management
- Password hashing with bcrypt
- Session management
- Role-based access control
- JWT tokens

## Authentication Flow

### 1. User Registration/Creation

**Endpoint:** `POST /admin/users`

```typescript
// Create a new admin user
const response = await fetch('/admin/users', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  credentials: 'include',
  body: JSON.stringify({
    email: 'user@example.com',
    password: 'securePassword123',
    first_name: 'John',
    last_name: 'Doe',
    role: 'admin', // admin, manager, warehouse-staff, driver
    phone: '+1234567890',
  })
})

const data = await response.json()
// Returns: { success: true, user: {...}, message: "User created successfully" }
```

**Implementation Details:**
- Passwords are hashed with bcrypt (10 salt rounds)
- Creates both User and AuthIdentity records
- Links auth identity to user via app_metadata
- Validates email format and password strength
- Checks for duplicate emails

### 2. User Login

**Endpoint:** `POST /auth/user/emailpass`

```typescript
// Login with email and password
const response = await fetch('/auth/user/emailpass', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  credentials: 'include',
  body: JSON.stringify({
    email: 'user@example.com',
    password: 'securePassword123',
  })
})

const data = await response.json()
// Returns: { token: "jwt_token_here" }
// Also sets session cookie automatically
```

**Session Management:**
- Session cookie is set automatically (httpOnly, secure)
- Cookie name: `connect.sid`
- JWT token is also returned for API calls
- Sessions persist across requests

### 3. Get Current User

**Endpoint:** `GET /admin/users/me`

```typescript
// Get authenticated user profile
const response = await fetch('/admin/users/me', {
  credentials: 'include', // Important: includes session cookie
})

const data = await response.json()
// Returns: { success: true, user: { id, email, first_name, last_name, phone, role, ... } }
```

### 4. Update User Profile

**Endpoint:** `PATCH /admin/users/me`

```typescript
// Update current user's profile
const response = await fetch('/admin/users/me', {
  method: 'PATCH',
  headers: {
    'Content-Type': 'application/json',
  },
  credentials: 'include',
  body: JSON.stringify({
    first_name: 'Jane',
    phone: '+1987654321',
    role: 'manager',
  })
})

const data = await response.json()
// Returns: { success: true, user: {...}, message: "Profile updated successfully" }
```

### 5. Logout

**Endpoint:** `DELETE /auth/session`

```typescript
// Logout and clear session
const response = await fetch('/auth/session', {
  method: 'DELETE',
  credentials: 'include',
})
```

## Authentication in API Routes

### Accessing Authenticated User

```typescript
import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  // Get authenticated user ID from auth context
  const userId = (req as any).auth_context?.actor_id

  if (!userId) {
    return res.status(401).json({
      success: false,
      message: "Authentication required",
    })
  }

  // Use userId to fetch user data or perform operations
  // ...
}
```

### Role-Based Access Control

Use the middleware from `src/api/middlewares/check-role.ts`:

```typescript
import { requireRole, requireMinimumRole } from "../../middlewares/check-role"

// Require specific role(s)
export const config = {
  routes: [
    {
      matcher: "/admin/sensitive-endpoint",
      method: "POST",
      middlewares: [requireRole("admin")], // Only admins
    },
  ],
}

// Or require minimum role level
export const config = {
  routes: [
    {
      matcher: "/admin/warehouse-operations",
      method: "GET",
      middlewares: [requireMinimumRole("warehouse-staff")], // warehouse-staff, manager, or admin
    },
  ],
}
```

**Role Hierarchy:**
- `admin`: 100 (highest)
- `manager`: 75
- `warehouse-staff`: 50
- `driver`: 25 (lowest)

## Extended User Fields

The user model has been extended with additional fields:

```typescript
interface ExtendedUser {
  id: string
  email: string
  first_name?: string | null
  last_name?: string | null
  avatar_url?: string | null
  phone?: string | null
  role?: string
  metadata?: Record<string, any> | null
  created_at: Date | string
  updated_at: Date | string
  deleted_at?: Date | string | null
}
```

### Querying Extended Fields

Since Medusa's ORM doesn't recognize custom fields, use direct database queries:

```typescript
import { Client } from "pg"

const client = new Client({
  connectionString: process.env.DATABASE_URL,
})

await client.connect()

const result = await client.query(
  `SELECT 
    id, email, first_name, last_name, 
    avatar_url, phone, role, metadata,
    created_at, updated_at, deleted_at
  FROM "user"
  WHERE id = $1 AND deleted_at IS NULL`,
  [userId]
)

const user = result.rows[0]
await client.end()
```

## Migration Steps

### Step 1: Update User Creation

**Old approach (custom store auth):**
```typescript
// Custom implementation with manual password hashing
const hashedPassword = await bcrypt.hash(password, 10)
// Store in custom table
```

**New approach (admin auth):**
```typescript
// Use POST /admin/users endpoint
// Handles everything automatically
```

### Step 2: Update Login Flow

**Old approach:**
```typescript
// POST /store/auth/login or custom endpoint
```

**New approach:**
```typescript
// POST /auth/user/emailpass
// Built-in Medusa authentication
```

### Step 3: Update Protected Routes

**Old approach:**
```typescript
// Custom middleware checking custom auth tokens
```

**New approach:**
```typescript
// Use requireRole() or requireMinimumRole() middleware
import { requireRole } from "./middlewares/check-role"

export const config = {
  routes: [
    {
      matcher: "/admin/endpoint",
      middlewares: [requireRole("admin")],
    },
  ],
}
```

### Step 4: Update Frontend Auth Calls

**Old approach:**
```typescript
// Custom auth endpoints
fetch('/store/auth/login', ...)
```

**New approach:**
```typescript
// Medusa admin auth endpoints
fetch('/auth/user/emailpass', ...)
fetch('/admin/users/me', ...)
```

## Testing Authentication

### Test Script

```bash
#!/bin/bash

BASE_URL="http://localhost:9000"

# 1. Create user
echo "Creating user..."
curl -X POST "${BASE_URL}/admin/users" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123",
    "first_name": "Test",
    "last_name": "User",
    "role": "admin"
  }' | jq .

# 2. Login
echo "Logging in..."
curl -X POST "${BASE_URL}/auth/user/emailpass" \
  -H "Content-Type: application/json" \
  -c cookies.txt \
  -d '{
    "email": "test@example.com",
    "password": "password123"
  }' | jq .

# 3. Get profile
echo "Getting profile..."
curl -X GET "${BASE_URL}/admin/users/me" \
  -b cookies.txt | jq .

# 4. Update profile
echo "Updating profile..."
curl -X PATCH "${BASE_URL}/admin/users/me" \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d '{
    "phone": "+1234567890"
  }' | jq .

# 5. Logout
echo "Logging out..."
curl -X DELETE "${BASE_URL}/auth/session" \
  -b cookies.txt
```

## Security Best Practices

1. **Always use HTTPS in production**
2. **Set secure cookie options** in `medusa-config.ts`:
   ```typescript
   http: {
     cookieSecret: process.env.COOKIE_SECRET,
     jwtSecret: process.env.JWT_SECRET,
   }
   ```
3. **Use strong passwords** (minimum 8 characters)
4. **Validate input** on all endpoints
5. **Use role-based access control** for sensitive operations
6. **Never expose password hashes** in API responses
7. **Set proper CORS policies**

## Common Issues

### Issue: "Unauthorized" on protected routes
**Solution:** Ensure `credentials: 'include'` is set in fetch requests

### Issue: Session not persisting
**Solution:** Check cookie settings and CORS configuration

### Issue: Extended fields not returned
**Solution:** Use direct database queries (see "Querying Extended Fields" section)

### Issue: Role check failing
**Solution:** Ensure user has the `role` field set in the database

## API Endpoints Summary

| Endpoint | Method | Purpose | Auth Required |
|----------|--------|---------|---------------|
| `/admin/users` | POST | Create user | No (or Admin) |
| `/admin/users` | GET | List users | Yes |
| `/admin/users/:id` | GET | Get user by ID | Yes |
| `/admin/users/me` | GET | Get current user | Yes |
| `/admin/users/me` | PATCH | Update current user | Yes |
| `/auth/user/emailpass` | POST | Login | No |
| `/auth/session` | DELETE | Logout | Yes |

## Additional Resources

- Medusa Authentication Docs: https://docs.medusajs.com/resources/authentication
- Role Middleware: `src/api/middlewares/check-role.ts`
- User Types: `src/types/user.ts`
- Example Widgets: `src/admin/widgets/`

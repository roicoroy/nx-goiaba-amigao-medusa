# Medusa API Token Authentication Guide

## 🔑 **What is API Token Authentication?**

Medusa v2 supports **API Token authentication** as an alternative to session-based JWT authentication. This is particularly useful for:

- **Admin applications** (like yours)
- **Server-to-server** communication
- **Avoiding CORS issues** with session cookies
- **Long-lived authentication** without session expiration

## 📋 **Current vs. API Token Authentication**

### **Current Setup (JWT Bearer Token):**
```typescript
// Login
POST /auth/user/emailpass
Body: { email, password }
Response: { token: "jwt_token_here" }

// Authenticated Request
GET /admin/orders
Headers: { Authorization: "Bearer jwt_token" }
```

### **API Token Setup:**
```typescript
// 1. Login first (to create API token)
POST /auth/user/emailpass
Body: { email, password }
Response: { token: "jwt_token_here" }

// 2. Create API Token (one-time, using JWT)
POST /admin/api-keys
Headers: { Authorization: "Bearer jwt_token" }
Body: { title: "Admin App Token", type: "secret" }
Response: { api_key: { token: "secret_api_token_here" } }

// 3. Use API Token for all requests (no more JWT needed)
GET /admin/orders
Headers: { Authorization: "Basic secret_api_token_here" }
```

## ✅ **Benefits of API Token Authentication**

1. **No CORS Issues** - API tokens don't rely on cookies
2. **Long-lived** - Tokens don't expire like sessions
3. **Simpler** - No need to refresh tokens
4. **Secure** - Can be revoked from admin panel
5. **Per-User** - Each user can have multiple API tokens

## 🔧 **Implementation Plan**

### **Step 1: Create API Token Management**

Add methods to `MedusaAdminService`:

```typescript
// Create an API token
createApiToken(title: string): Observable<any> {
  return this.post('/admin/api-keys', { 
    title, 
    type: 'secret' 
  }, { withCredentials: true });
}

// List user's API tokens
getApiTokens(): Observable<any> {
  return this.get('/admin/api-keys', { withCredentials: true });
}

// Delete an API token
deleteApiToken(id: string): Observable<any> {
  return this.delete(`/admin/api-keys/${id}`, { withCredentials: true });
}
```

### **Step 2: Update Auth State**

Store API token instead of (or alongside) JWT:

```typescript
export interface AuthStateModel {
  token: string | null;
  apiToken: string | null; // Add this
  user: AdminUser | null;
  isAuthenticated: boolean;
}
```

### **Step 3: Update Auth Interceptor**

Use API token for authentication:

```typescript
// In auth.interceptor.ts
const apiToken = this.store.selectSnapshot(AuthState.getApiToken);
const jwtToken = this.store.selectSnapshot(AuthState.getToken);

if (apiToken && !isInitialLogin) {
  // Use API token with Basic auth
  headers['Authorization'] = `Basic ${apiToken}`;
} else if (jwtToken && !isInitialLogin) {
  // Fallback to JWT Bearer token
  headers['Authorization'] = `Bearer ${jwtToken}`;
}
```

### **Step 4: Update Login Flow**

```typescript
// 1. Login with email/password to get JWT
login(email, password)
  .pipe(
    // 2. Use JWT to create API token
    switchMap(loginResponse => 
      this.medusaAdmin.createApiToken('Admin App Token')
    ),
    // 3. Store API token
    tap(apiKeyResponse => {
      const apiToken = apiKeyResponse.api_key.token;
      // Store apiToken in state
    })
  )
```

## 🚀 **Quick Implementation**

### **Option A: Hybrid Approach (Recommended)**

Keep JWT for initial login, then create and use API token:

**Pros:**
- ✅ Works with existing login flow
- ✅ API token for long-term access
- ✅ Can revoke tokens from admin

**Cons:**
- Slightly more complex initial setup

### **Option B: Pure API Token**

Manually create API token from Medusa Admin, hardcode in app:

**Pros:**
- ✅ Simplest implementation
- ✅ No login flow needed for development

**Cons:**
- ❌ Not suitable for production
- ❌ Single token for all users
- ❌ Security risk if token leaked

## 📝 **Manual API Token Creation (Quick Test)**

For **development/testing only**:

1. **Login to Medusa Admin** (http://localhost:7001)
2. **Create API Token:**
   ```bash
   curl -X POST 'http://localhost:9000/admin/api-keys' \
   -H 'Content-Type: application/json' \
   -H 'Authorization: Bearer YOUR_JWT_TOKEN' \
   --data '{
       "title": "Development Token",
       "type": "secret"
   }'
   ```
3. **Copy the token** from response
4. **Add to environment:**
   ```typescript
   // environment.ts
   export const environment = {
     MEDUSA_API_TOKEN: 'your_api_token_here'
   };
   ```
5. **Use in interceptor:**
   ```typescript
   if (environment.MEDUSA_API_TOKEN) {
     headers['Authorization'] = `Basic ${environment.MEDUSA_API_TOKEN}`;
   }
   ```

## ⚠️ **Important Notes**

1. **Security:** Never commit API tokens to version control
2. **Production:** Use proper user-based API token creation
3. **Revocation:** Tokens can be revoked from admin panel
4. **Base64:** Older Medusa versions required base64 encoding, v2 doesn't

## 🎯 **Recommendation**

For your use case, I recommend:

1. **Short-term (Development):** 
   - Manually create an API token
   - Hardcode in environment.ts (gitignored)
   - Test if it solves CORS issues

2. **Long-term (Production):**
   - Implement hybrid approach
   - Login flow creates API token
   - Store token securely
   - Use API token for all requests

Would you like me to implement either approach?

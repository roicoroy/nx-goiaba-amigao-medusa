# CORS Configuration Fix for Medusa Backend

## 🚨 **The Problem**

Your frontend is correctly sending requests with:
- ✅ `Authorization: Bearer {token}` header
- ✅ `x-medusa-access-token` header  
- ✅ `withCredentials: true`

But the **Medusa backend is rejecting the OPTIONS preflight request** with **401 Unauthorized**.

### **Network Request Analysis:**

```
Request: OPTIONS http://localhost:9000/admin/orders/{id}/exchanges
Status: 401 Unauthorized

Preflight Headers:
- access-control-request-headers: authorization,x-medusa-access-token
- access-control-request-method: GET
- origin: http://localhost:8100
```

**Why it fails:**
1. Browser sends OPTIONS preflight to ask "Can I send Authorization header?"
2. Medusa backend requires authentication even for OPTIONS
3. OPTIONS request has NO Authorization header (by design)
4. Backend returns 401
5. Browser blocks the actual GET request

## ✅ **The Solution**

You need to configure your **Medusa backend** to:
1. Allow CORS from `http://localhost:8100`
2. Allow OPTIONS requests **without authentication**
3. Return proper CORS headers

### **Step 1: Update `medusa-config.js`**

Location: `/path/to/your/medusa-backend/medusa-config.js`

```javascript
module.exports = {
  projectConfig: {
    // CORS Configuration
    admin_cors: process.env.ADMIN_CORS || "http://localhost:8100,http://localhost:7001,http://localhost:7000",
    store_cors: process.env.STORE_CORS || "http://localhost:8100,http://localhost:8000",
    
    // Database and other configs...
    database_url: process.env.DATABASE_URL,
    redis_url: process.env.REDIS_URL,
    
    // Session configuration
    session_options: {
      name: "medusa-admin-session",
      resave: true,
      rolling: true,
      saveUninitialized: true,
      secret: process.env.SESSION_SECRET || "supersecret",
      cookie: {
        sameSite: "lax",
        secure: false, // Set to true in production with HTTPS
        maxAge: 10 * 60 * 60 * 1000, // 10 hours
        httpOnly: true,
      },
    },
  },
  
  // ... rest of your config
};
```

### **Step 2: Update `.env` file**

Location: `/path/to/your/medusa-backend/.env`

```bash
# CORS Configuration
ADMIN_CORS=http://localhost:8100,http://localhost:7001,http://localhost:7000
STORE_CORS=http://localhost:8100,http://localhost:8000

# Session Secret
SESSION_SECRET=your-super-secret-session-key-here

# Other environment variables...
DATABASE_URL=postgres://...
REDIS_URL=redis://...
```

### **Step 3: Add CORS Middleware (If Needed)**

If the above doesn't work, you may need to add custom CORS middleware.

Create: `/path/to/your/medusa-backend/src/api/middlewares/cors.ts`

```typescript
import { MedusaRequest, MedusaResponse } from "@medusajs/medusa";

export default function corsMiddleware() {
  return (req: MedusaRequest, res: MedusaResponse, next: () => void) => {
    const allowedOrigins = [
      "http://localhost:8100",
      "http://localhost:7001",
      "http://localhost:7000",
    ];

    const origin = req.headers.origin;
    
    if (origin && allowedOrigins.includes(origin)) {
      res.setHeader("Access-Control-Allow-Origin", origin);
      res.setHeader("Access-Control-Allow-Credentials", "true");
      res.setHeader(
        "Access-Control-Allow-Headers",
        "Authorization, X-Medusa-Access-Token, Content-Type, Cookie"
      );
      res.setHeader(
        "Access-Control-Allow-Methods",
        "GET, POST, PUT, DELETE, OPTIONS, PATCH"
      );
    }

    // Handle preflight requests
    if (req.method === "OPTIONS") {
      res.status(200).end();
      return;
    }

    next();
  };
}
```

Then register it in: `/path/to/your/medusa-backend/src/api/middlewares.ts`

```typescript
import corsMiddleware from "./middlewares/cors";

export const config = {
  routes: [
    {
      matcher: "/admin/*",
      middlewares: [corsMiddleware()],
    },
    {
      matcher: "/store/*",
      middlewares: [corsMiddleware()],
    },
  ],
};
```

### **Step 4: Restart Medusa Backend**

```bash
cd /path/to/your/medusa-backend
npm run dev
```

## 🔍 **Verification**

After restarting, check the network tab:

### **Before Fix:**
```
OPTIONS /admin/orders/{id}/exchanges
Status: 401 Unauthorized
❌ No CORS headers
```

### **After Fix:**
```
OPTIONS /admin/orders/{id}/exchanges
Status: 200 OK
✅ Access-Control-Allow-Origin: http://localhost:8100
✅ Access-Control-Allow-Credentials: true
✅ Access-Control-Allow-Headers: authorization, x-medusa-access-token
```

## 🎯 **Quick Test**

Test if CORS is working:

```bash
# Test OPTIONS request
curl -X OPTIONS http://localhost:9000/admin/orders \
  -H "Origin: http://localhost:8100" \
  -H "Access-Control-Request-Method: GET" \
  -H "Access-Control-Request-Headers: authorization" \
  -v

# Should return 200 OK with CORS headers
```

## 📝 **Common Issues**

### **Issue 1: Still getting 401 on OPTIONS**
**Solution:** Make sure OPTIONS requests bypass authentication middleware

### **Issue 2: CORS headers not appearing**
**Solution:** Check that `admin_cors` includes `http://localhost:8100`

### **Issue 3: Credentials not working**
**Solution:** Ensure `Access-Control-Allow-Credentials: true` is set

## 🚀 **Alternative: Use Medusa Admin API Key**

If CORS continues to be problematic, consider using API Key authentication (see `API_TOKEN_AUTHENTICATION_GUIDE.md`).

## ⚠️ **Production Notes**

For production:
1. Update CORS origins to your production domains
2. Set `secure: true` for cookies (requires HTTPS)
3. Use strong `SESSION_SECRET`
4. Consider using API tokens instead of sessions

---

## 📌 **Summary**

The issue is **NOT in your frontend code** - it's correctly configured. The problem is that your **Medusa backend needs proper CORS configuration** to:

1. ✅ Allow requests from `http://localhost:8100`
2. ✅ Allow OPTIONS preflight requests without authentication
3. ✅ Return proper CORS headers including `Access-Control-Allow-Credentials`

Once you update the backend configuration and restart, all your API calls will work! 🎉

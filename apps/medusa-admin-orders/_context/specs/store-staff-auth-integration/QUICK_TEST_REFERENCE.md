# Quick Test Reference Card

## 🚀 Quick Start

```bash
# Terminal 1: Backend
cd /path/to/medusa-backend && npm run dev

# Terminal 2: Frontend  
npm start

# Browser
http://localhost:4200
```

## 📋 13 Tests Summary

| # | Test | Expected Result | Check Network Tab |
|---|------|----------------|-------------------|
| 1 | Login with store staff | ✅ Redirect to dashboard | `/auth/customer/emailpass` has `x-publishable-api-key`, NO Bearer |
| 2 | Login with regular customer | ❌ "Access denied" error | Same as above |
| 3 | Register new staff | ✅ Auto-login → dashboard | `/admin/store-staff` has `x-medusa-access-token` |
| 4 | Register duplicate email | ❌ "Email exists" error | - |
| 5 | Password mismatch | ❌ Validation error shown | - |
| 6 | Refresh after login | ✅ Stay logged in | - |
| 7 | Logout | ✅ Redirect to login, token cleared | `/auth/session` DELETE has Bearer + publishable |
| 8 | Access /dashboard logged out | ✅ Redirect to /login | - |
| 9 | Invalid token | ✅ Auto-logout on 401 | Any request returns 401 |
| 10 | Admin endpoints | ✅ Has admin key + Bearer | `/admin/*` has `x-medusa-access-token` + Bearer |
| 11 | Store endpoints | ✅ Has publishable + Bearer | `/store/*` has `x-publishable-api-key` + Bearer |
| 12 | Auth endpoints | ✅ Has publishable ± Bearer | `/auth/*` varies by endpoint |
| 13 | Initial login | ✅ NO Bearer token | `/auth/customer/emailpass` NO Bearer |

## 🔍 Header Verification Cheat Sheet

### Initial Login Request
```
POST /auth/customer/emailpass
✅ x-publishable-api-key: pk_...
❌ Authorization: Bearer (should NOT exist)
```

### After Login - Store Endpoints
```
GET /store/customers/me
✅ x-publishable-api-key: pk_...
✅ Authorization: Bearer eyJ...
```

### After Login - Admin Endpoints
```
GET /admin/orders
✅ x-medusa-access-token: sk_...
✅ Authorization: Bearer eyJ...
```

### Registration Request
```
POST /admin/store-staff
✅ x-medusa-access-token: sk_...
❌ Authorization: Bearer (no token yet)
```

## 🐛 Quick Troubleshooting

| Error | Solution |
|-------|----------|
| "Backend not running" | Start Medusa: `npm run dev` |
| "Invalid publishable key" | Check `environment.ts` |
| Headers not showing | Click "view source" in Network tab |
| Token not persisting | Check localStorage in DevTools |
| Can't create staff | Verify `MEDUSA_ADMIN_KEY` |

## 📍 Test Data Needed

- ✅ Store staff account: `cxcxc@yahoo.com.br` / `Rwbento123!` (from login page)
- ❌ Regular customer account (create via storefront)
- 🆕 New email for registration test

## 🎯 Critical Checks

1. **Initial login has NO Bearer token** ← Most important!
2. **Admin endpoints get admin key**
3. **Store endpoints get publishable key**
4. **401 triggers auto-logout**
5. **Session persists after refresh**

## ✅ Pass Criteria

All 13 tests must pass for task completion.

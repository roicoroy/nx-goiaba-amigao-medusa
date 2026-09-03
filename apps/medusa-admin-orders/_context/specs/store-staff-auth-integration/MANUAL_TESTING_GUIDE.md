# Manual Testing Guide - Store Staff Authentication Integration

## Prerequisites

Before starting the manual tests, ensure:

1. **Backend Server Running**: Your Medusa backend must be running on `http://localhost:9000`
   ```bash
   # In your Medusa backend directory
   npm run dev
   ```

2. **Frontend Server Running**: Start the Angular development server
   ```bash
   # In this directory
   npm start
   ```
   The app will be available at `http://localhost:4200`

3. **Test Data Ready**: You should have:
   - At least one store staff account (email/password)
   - At least one regular customer account (non-store-staff)
   - Access to create new accounts

## Testing Checklist

### ✅ Test 1: Complete Login Flow with Valid Store Staff Credentials

**Steps:**
1. Navigate to `http://localhost:4200/login`
2. Enter valid store staff email and password
3. Click "Login" button

**Expected Results:**
- ✅ Loading spinner appears during authentication
- ✅ No error messages displayed
- ✅ Redirected to `/dashboard` page
- ✅ User remains logged in

**Network Tab Verification:**
- Request to `/auth/customer/emailpass`:
  - ✅ Has `x-publishable-api-key` header
  - ✅ Does NOT have `Authorization: Bearer` header (initial login)
- Request to `/store/customers/me`:
  - ✅ Has `x-publishable-api-key` header
  - ✅ Has `Authorization: Bearer <token>` header

---

### ✅ Test 2: Login Rejection for Non-Store-Staff Customers

**Steps:**
1. Navigate to `http://localhost:4200/login`
2. Enter credentials for a regular customer (not store staff)
3. Click "Login" button

**Expected Results:**
- ✅ Error alert appears with message: "Access denied: Store staff privileges required"
- ✅ User is NOT logged in
- ✅ Remains on login page
- ✅ Token is NOT stored in localStorage

**How to Create Test Data:**
- Create a regular customer through your Medusa storefront
- Or use Medusa Admin to create a customer WITHOUT store staff privileges

---

### ✅ Test 3: Registration Flow (Create Account → Auto-Login → Dashboard)

**Steps:**
1. Navigate to `http://localhost:4200/register`
2. Fill in all required fields:
   - Email: `newstaff@example.com`
   - Password: `SecurePass123!`
   - Confirm Password: `SecurePass123!`
   - First Name: `John`
   - Last Name: `Doe`
   - Phone: `+1234567890` (optional)
3. Click "Register" button

**Expected Results:**
- ✅ Loading spinner appears during registration
- ✅ Account is created successfully
- ✅ User is automatically logged in
- ✅ Redirected to `/dashboard` page
- ✅ Token stored in localStorage

**Network Tab Verification:**
- Request to `/admin/store-staff` (registration):
  - ✅ Has `x-medusa-access-token` header (admin key)
  - ✅ Does NOT have `Authorization: Bearer` header
- Request to `/auth/customer/emailpass` (auto-login):
  - ✅ Has `x-publishable-api-key` header
  - ✅ Does NOT have `Authorization: Bearer` header
- Request to `/store/customers/me`:
  - ✅ Has `x-publishable-api-key` header
  - ✅ Has `Authorization: Bearer <token>` header

---

### ✅ Test 4: Registration with Duplicate Email

**Steps:**
1. Navigate to `http://localhost:4200/register`
2. Enter email that already exists in the system
3. Fill in other fields
4. Click "Register" button

**Expected Results:**
- ✅ Error message displayed: "Email already exists" or similar
- ✅ User remains on registration page
- ✅ User is NOT logged in
- ✅ Form data is preserved (except password fields)

---

### ✅ Test 5: Password Mismatch Validation on Registration Form

**Steps:**
1. Navigate to `http://localhost:4200/register`
2. Enter password: `SecurePass123!`
3. Enter confirm password: `DifferentPass456!`
4. Try to submit the form

**Expected Results:**
- ✅ Error message displayed: "Passwords do not match"
- ✅ Submit button may be disabled OR form shows validation error
- ✅ Cannot submit until passwords match

---

### ✅ Test 6: Session Persistence (Login → Refresh → Stay Logged In)

**Steps:**
1. Log in with valid store staff credentials
2. Navigate to `/dashboard` or any protected page
3. Press F5 or click browser refresh button
4. Wait for page to reload

**Expected Results:**
- ✅ User remains logged in after refresh
- ✅ Still on the same page (not redirected to login)
- ✅ User data is still available in the app
- ✅ Token still exists in localStorage

**Developer Tools Check:**
1. Open DevTools → Application → Local Storage
2. Look for key: `medusa_admin_token`
3. ✅ Token should be present

---

### ✅ Test 7: Logout Functionality

**Steps:**
1. Log in with valid credentials
2. Navigate to dashboard
3. Click logout button (in menu or header)

**Expected Results:**
- ✅ User is logged out
- ✅ Redirected to `/login` page
- ✅ Token removed from localStorage
- ✅ Cannot access protected routes without logging in again

**Network Tab Verification:**
- Request to `/auth/session` (DELETE):
  - ✅ Has `Authorization: Bearer <token>` header
  - ✅ Has `x-publishable-api-key` header

**Developer Tools Check:**
1. Open DevTools → Application → Local Storage
2. ✅ `medusa_admin_token` should be removed

---

### ✅ Test 8: Route Protection (Access Dashboard Without Login)

**Steps:**
1. Ensure you are logged out (clear localStorage if needed)
2. Manually navigate to `http://localhost:4200/dashboard` in address bar
3. Press Enter

**Expected Results:**
- ✅ Immediately redirected to `/login` page
- ✅ Cannot access dashboard without authentication
- ✅ Return URL may be preserved in query params: `/login?returnUrl=/dashboard`

**Additional Routes to Test:**
- `/orders` → should redirect to login
- `/drivers` → should redirect to login
- `/order-detail/:id` → should redirect to login

---

### ✅ Test 9: 401 Error Handling (Expired Token → Auto-Logout)

**Steps:**
1. Log in with valid credentials
2. Open DevTools → Application → Local Storage
3. Manually edit the `medusa_admin_token` value to an invalid token (e.g., `invalid_token_xyz`)
4. Try to navigate to a protected page or perform an action that requires authentication
5. OR wait for token to expire naturally (if short expiration is set)

**Expected Results:**
- ✅ 401 error is caught by the interceptor
- ✅ User is automatically logged out
- ✅ Redirected to `/login` page
- ✅ Token removed from localStorage
- ✅ Auth state is reset

**Network Tab Verification:**
- Any authenticated request with invalid token:
  - ✅ Returns 401 status
  - ✅ Triggers automatic logout

---

### ✅ Test 10: Admin Endpoints Receive Correct Headers

**Steps:**
1. Log in with valid store staff credentials
2. Navigate to a page that calls admin endpoints (e.g., `/orders`)
3. Open DevTools → Network tab
4. Filter for requests to `/admin/*`

**Expected Results for ALL `/admin/*` requests:**
- ✅ Has `x-medusa-access-token` header with value from environment
- ✅ Has `Authorization: Bearer <token>` header
- ✅ Does NOT have `x-publishable-api-key` header

**Example Endpoints to Check:**
- `GET /admin/orders`
- `GET /admin/orders/:id`
- `POST /admin/orders/:id/fulfillment`
- `POST /admin/store-staff` (during registration)

---

### ✅ Test 11: Store Endpoints Receive Correct Headers

**Steps:**
1. Log in with valid store staff credentials
2. Open DevTools → Network tab
3. Filter for requests to `/store/*`

**Expected Results for ALL `/store/*` requests:**
- ✅ Has `x-publishable-api-key` header with value from environment
- ✅ Has `Authorization: Bearer <token>` header (after login)
- ✅ Does NOT have `x-medusa-access-token` header

**Example Endpoints to Check:**
- `GET /store/customers/me`

---

### ✅ Test 12: Auth Endpoints Receive Correct Headers

**Steps:**
1. Open DevTools → Network tab
2. Perform login action
3. Check requests to `/auth/*`

**Expected Results:**

**For `/auth/customer/emailpass` (initial login):**
- ✅ Has `x-publishable-api-key` header
- ✅ Does NOT have `Authorization: Bearer` header (no token yet)
- ✅ Does NOT have `x-medusa-access-token` header

**For `/auth/session` (logout):**
- ✅ Has `x-publishable-api-key` header
- ✅ Has `Authorization: Bearer <token>` header
- ✅ Does NOT have `x-medusa-access-token` header

---

### ✅ Test 13: Initial Login Request Does NOT Have Bearer Token

**Steps:**
1. Ensure you are logged out
2. Open DevTools → Network tab
3. Enter credentials and click "Login"
4. Find the request to `/auth/customer/emailpass`
5. Click on the request and view "Headers" tab

**Expected Results:**
- ✅ Request has `x-publishable-api-key` header
- ✅ Request does NOT have `Authorization` header
- ✅ Request body contains email and password

---

## How to Check Headers in Browser DevTools

### Chrome/Edge:
1. Press F12 to open DevTools
2. Go to "Network" tab
3. Perform the action (login, navigate, etc.)
4. Click on the request in the list
5. Click "Headers" tab
6. Scroll to "Request Headers" section
7. Look for:
   - `Authorization: Bearer <token>`
   - `x-medusa-access-token: <admin_key>`
   - `x-publishable-api-key: <publishable_key>`

### Firefox:
1. Press F12 to open DevTools
2. Go to "Network" tab
3. Perform the action
4. Click on the request
5. Click "Headers" tab on the right
6. Check "Request Headers"

---

## Troubleshooting Common Issues

### Issue: "Backend server is not running" error
**Solution:** Start your Medusa backend server on port 9000

### Issue: "Configuration Error: Invalid or missing publishable API key"
**Solution:** Check `src/environments/environment.ts` has correct `MEDUSA_PUBLISHABLE_KEY`

### Issue: Headers not appearing in Network tab
**Solution:** 
- Make sure you're looking at "Request Headers" not "Response Headers"
- Some browsers hide custom headers by default - click "view source" or "raw"

### Issue: Token not persisting after refresh
**Solution:** 
- Check browser console for errors
- Verify localStorage is not disabled
- Check if `CheckAuthStatus` action is dispatched on app init

### Issue: Cannot create store staff account
**Solution:** 
- Verify `MEDUSA_ADMIN_KEY` is correct in environment.ts
- Check backend logs for errors
- Ensure store-staff plugin is installed and configured in backend

---

## Test Results Template

Copy this template to record your test results:

```
## Test Results - [Date]

### Test 1: Login Flow with Valid Store Staff
- [ ] PASS / [ ] FAIL
- Notes: 

### Test 2: Login Rejection for Non-Store-Staff
- [ ] PASS / [ ] FAIL
- Notes: 

### Test 3: Registration Flow
- [ ] PASS / [ ] FAIL
- Notes: 

### Test 4: Duplicate Email Registration
- [ ] PASS / [ ] FAIL
- Notes: 

### Test 5: Password Mismatch Validation
- [ ] PASS / [ ] FAIL
- Notes: 

### Test 6: Session Persistence
- [ ] PASS / [ ] FAIL
- Notes: 

### Test 7: Logout Functionality
- [ ] PASS / [ ] FAIL
- Notes: 

### Test 8: Route Protection
- [ ] PASS / [ ] FAIL
- Notes: 

### Test 9: 401 Error Handling
- [ ] PASS / [ ] FAIL
- Notes: 

### Test 10: Admin Endpoint Headers
- [ ] PASS / [ ] FAIL
- Notes: 

### Test 11: Store Endpoint Headers
- [ ] PASS / [ ] FAIL
- Notes: 

### Test 12: Auth Endpoint Headers
- [ ] PASS / [ ] FAIL
- Notes: 

### Test 13: Initial Login No Bearer Token
- [ ] PASS / [ ] FAIL
- Notes: 

## Overall Status
- Total Tests: 13
- Passed: __
- Failed: __
- Blocked: __

## Issues Found
1. 
2. 
3. 

## Next Steps
- 
```

---

## Quick Start Commands

```bash
# Terminal 1: Start Medusa Backend
cd /path/to/medusa-backend
npm run dev

# Terminal 2: Start Angular Frontend
cd /path/to/ion-medusa-admin-orders
npm start

# Open browser
open http://localhost:4200
```

---

## Environment Configuration Check

Before testing, verify your environment configuration:

**File: `src/environments/environment.ts`**

```typescript
export const environment = {
  production: false,
  MEDUSA_ADMIN_KEY: "sk_...", // Should be set
  MEDUSA_API_BASE_PATH: "http://localhost:9000", // Should match backend
  MEDUSA_PUBLISHABLE_KEY: "pk_..." // Should be set
};
```

All three keys must be properly configured for the tests to pass.

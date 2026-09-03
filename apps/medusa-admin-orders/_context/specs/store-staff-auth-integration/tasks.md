# Implementation Plan

- [x] 1. Create Base HTTP Service Infrastructure
  - Create abstract `BaseHttpService` class with protected HTTP methods (get, post, put, delete)
  - Implement centralized error handling method with user-friendly messages for different HTTP status codes
  - Implement query string builder supporting arrays and nested objects following Medusa API patterns
  - _Requirements: 16.1, 16.2, 16.3_

- [x] 2. Create and Update Store Staff TypeScript Interfaces
  - Create `store-staff.interface.ts` file with StoreStaff, CreateStaffData, UpdateStaffData, StoreStaffListResponse, StoreStaffResponse, and StoreStaffDeleteResponse interfaces
  - Update Customer interface in `order.interface.ts` to include is_store_staff, staff_role, and staff_since fields
  - Export store-staff interfaces in index.ts
  - _Requirements: 3.1, 3.4_

- [x] 3. Separate Admin and Store Services
- [x] 3.1 Rename MedusaService to MedusaStoreService
  - Rename the class from `MedusaService` to `MedusaStoreService` in `medusa.service.store.ts`
  - Keep only `/store/*` and `/auth/*` endpoint methods (login, getCustomerProfile, logout)
  - Remove all `/admin/*` endpoint methods (will be moved to admin service)
  - Update the service to use correct endpoint `/auth/customer/emailpass` for login
  - _Requirements: 10.2, 12.1, 12.2_

- [x] 3.2 Populate MedusaAdminService with admin methods
  - Move all `/admin/*` endpoint methods from MedusaStoreService to MedusaAdminService
  - Add createStoreStaff method for POST `/admin/store-staff`
  - Add getStoreStaff method for GET `/admin/store-staff`
  - Add getStoreStaffById method for GET `/admin/store-staff/:id`
  - Add updateStoreStaff method for POST `/admin/store-staff/:id`
  - Add deleteStoreStaff method for DELETE `/admin/store-staff/:id` with optional permanent parameter
  - Include all order management methods (getOrders, getOrder, createFulfillment, capturePayment, etc.)
  - _Requirements: 10.1, 10.3, 11.1, 11.2, 11.3, 11.4, 11.5_

- [x] 3.3 Update all service imports throughout the application
  - Find all imports of `MedusaService` and update to `MedusaStoreService` or `MedusaAdminService` as appropriate
  - Update components that use admin endpoints to inject `MedusaAdminService`
  - Update components that use store endpoints to inject `MedusaStoreService`
  - _Requirements: 10.1, 10.2_

- [x] 4. Update Auth Interceptor with Dual Header Strategy
- [x] 4.1 Implement endpoint detection logic
  - Add logic to detect if request URL contains `/admin/`, `/store/`, or `/auth/`
  - Add logic to detect if request is the initial login endpoint `/auth/customer/emailpass`
  - _Requirements: 5.1, 5.2, 5.3, 5.4, 15.1_

- [x] 4.2 Implement conditional header addition
  - Add `x-medusa-access-token` header with MEDUSA_ADMIN_KEY only for `/admin/*` endpoints
  - Add `x-publishable-api-key` header with MEDUSA_PUBLISHABLE_KEY only for `/store/*` and `/auth/*` endpoints
  - Add Bearer token to Authorization header for all authenticated requests except initial login
  - Ensure headers are not duplicated
  - _Requirements: 5.1, 5.2, 5.3, 15.2, 15.3, 15.4, 15.5_

- [x] 4.3 Implement 401 error handling
  - Catch 401 Unauthorized responses globally
  - Dispatch Logout action to clear auth state
  - Navigate to login page on 401 errors
  - _Requirements: 6.2_

- [x] 5. Update Auth State with Store Staff Support
- [x] 5.1 Update AuthenticationStateModel interface
  - Add isStoreStaff boolean field
  - Add staffRole string field for "staff", "manager", "supervisor"
  - Remove old privilege field if present
  - _Requirements: 3.1, 3.4_

- [x] 5.2 Update Login action
  - Inject MedusaStoreService instead of MedusaService
  - Call medusaStoreService.login() with email and password
  - Store returned JWT token in state and localStorage immediately
  - Call medusaStoreService.getCustomerProfile() to fetch customer data
  - Validate customer.is_store_staff === true
  - If not store staff, throw error "Access denied: Store staff privileges required"
  - Dispatch LoginSuccess with customer data and token
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 3.2, 3.3, 12.3, 12.4_

- [x] 5.3 Create Register action
  - Inject MedusaAdminService
  - Call medusaAdminService.createStoreStaff() with registration data
  - On success, automatically dispatch Login action with same credentials
  - Handle errors and dispatch LoginFailure if registration fails
  - _Requirements: 2.1, 2.2, 2.3, 2.5_

- [x] 5.4 Update LoginSuccess action
  - Store customer.is_store_staff in state.isStoreStaff
  - Store customer.staff_role in state.staffRole
  - Store customer id, email, first_name, last_name
  - Compute and store fullName from first_name and last_name
  - Set isLoggedIn to true
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_

- [x] 5.5 Update CheckAuthStatus action
  - Check localStorage for existing token on app initialization
  - If token exists, call medusaStoreService.getCustomerProfile() to validate
  - If valid and is_store_staff is true, restore session
  - If invalid or not store staff, clear token and reset state
  - _Requirements: 4.1, 4.2, 4.3, 4.4_

- [x] 5.6 Update Logout action
  - Call medusaStoreService.logout() to invalidate server session
  - Remove token from localStorage
  - Reset all auth state fields to default values
  - Navigate to login page
  - Handle network errors gracefully (still clear local data)
  - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5_

- [ ]* 6. Create Auth Guard for Route Protection
  - Create AuthGuard implementing CanActivate interface
  - Inject Store to check AuthState.isLoggedIn
  - Redirect unauthenticated users to login page with returnUrl query parameter
  - Allow navigation for authenticated users
  - _Requirements: 13.1, 13.2, 13.3, 13.4, 13.5_

- [x] 7. Update Login Page
- [x] 7.1 Update login form submission
  - Dispatch Login action from Auth State with email and password
  - Subscribe to loading$ observable to show loading indicator
  - Subscribe to error$ observable to display error messages
  - Handle "Access denied: Store staff privileges required" error specifically
  - Navigate to dashboard on successful login
  - _Requirements: 7.1, 7.2, 7.3, 7.4, 6.1, 6.5_

- [x] 7.2 Add auto-redirect for authenticated users
  - Check if user is already logged in on page init
  - If logged in, automatically redirect to dashboard or returnUrl
  - _Requirements: 7.5_

- [x] 7.3 Add link to registration page
  - Add "Don't have an account? Register" link that navigates to /register
  - _Requirements: 8.5_

- [x] 8. Wire Up Registration Page
- [x] 8.1 Create registration form with validation
  - Add form fields: email, password, confirmPassword, first_name, last_name, phone
  - Add email format validation
  - Add password minimum length validation (8 characters)
  - Add custom validator to check password and confirmPassword match
  - Display "Passwords do not match" error when they don't match
  - _Requirements: 8.1, 8.2, 2.4_

- [x] 8.2 Implement registration submission
  - Dispatch Register action from Auth State with form data (excluding confirmPassword)
  - Subscribe to loading$ observable to show loading indicator during registration
  - Subscribe to error$ observable to display registration errors
  - Handle "Email already exists" error specifically
  - Auto-login will happen via Register action, then navigate to dashboard
  - _Requirements: 8.3, 8.4, 2.1, 2.2, 2.3, 2.5_

- [x] 8.3 Add link back to login page
  - Add "Already have an account? Login" link that navigates to /login
  - _Requirements: 8.5_

- [ ]* 9. Apply Auth Guard to Protected Routes
  - Update app.routes.ts to add AuthGuard to dashboard route
  - Add AuthGuard to all admin routes (orders, drivers, etc.)
  - Ensure login and register routes remain unprotected
  - _Requirements: 13.1, 13.2_

- [x] 10. Update Environment Configuration
  - Verify MEDUSA_ADMIN_KEY is defined in environment.ts and environment.prod.ts
  - Verify MEDUSA_PUBLISHABLE_KEY is defined in both environment files
  - Verify MEDUSA_API_BASE_PATH points to correct backend URL
  - _Requirements: 5.1, 5.2_

- [ ]* 11. Verify Auth State Selectors
  - Verify isLoggedIn selector exists and works
  - Verify getUser selector returns user with isStoreStaff and staffRole
  - Verify isLoading selector for loading state
  - Verify getError selector for error messages
  - Test that components can subscribe to these selectors
  - _Requirements: 14.1, 14.2, 14.3, 14.4, 14.5_

- [x] 12. Manual Testing and Validation
  - Test complete login flow with valid store staff credentials
  - Test login rejection for non-store-staff customers (should show "Access denied" error)
  - Test registration flow: create account → auto-login → navigate to dashboard
  - Test registration with duplicate email (should show error)
  - Test password mismatch validation on registration form
  - Test session persistence: login → refresh browser → should stay logged in
  - Test logout functionality: logout → token cleared → redirected to login
  - Test route protection: try accessing /dashboard without login → redirected to /login
  - Test 401 error handling: simulate expired token → should auto-logout
  - Verify admin endpoints receive x-medusa-access-token header (check network tab)
  - Verify store endpoints receive x-publishable-api-key header (check network tab)
  - Verify Bearer token is added to authenticated requests (check network tab)
  - Verify initial login request does NOT have Bearer token (check network tab)
  - _Requirements: All_

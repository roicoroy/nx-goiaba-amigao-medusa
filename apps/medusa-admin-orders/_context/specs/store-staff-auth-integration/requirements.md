# Requirements Document

## Introduction

This document outlines the requirements for integrating the Store Staff API authentication system into the existing Ionic Angular orders admin application. The application needs to support both customer authentication (login/register) for store staff members and proper API service separation between admin and store endpoints. Store staff members are customers with elevated privileges (`is_store_staff: true` and `staff_role`) who can access admin order management features.

## Glossary

- **Store Staff**: Customers with elevated privileges marked by `is_store_staff: true` and a `staff_role` (e.g., "staff", "manager", "supervisor")
- **Auth System**: The authentication and authorization system managing user sessions and access control
- **Medusa Admin Service**: Angular service that handles HTTP communication with Medusa `/admin/*` endpoints
- **Medusa Store Service**: Angular service that handles HTTP communication with Medusa `/store/*` endpoints
- **Auth State**: NGXS state management for authentication data and user session
- **Auth Interceptor**: HTTP interceptor that adds authentication tokens and API keys to requests based on endpoint type
- **Login Flow**: The sequence of operations from user credential submission to authenticated session establishment
- **Register Flow**: The sequence of operations to create a new store staff account
- **Session Management**: The process of maintaining and validating user authentication state across app lifecycle
- **Token Storage**: Mechanism for persisting authentication tokens in browser storage
- **Admin Endpoints**: API endpoints prefixed with `/admin/` that require admin API key authentication
- **Store Endpoints**: API endpoints prefixed with `/store/` that require publishable API key authentication

## Requirements

### Requirement 1: Store Staff Login Authentication

**User Story:** As a store staff member, I want to log in with my email and password so that I can access the orders admin application

#### Acceptance Criteria

1. WHEN a store staff member submits valid email and password credentials, THE Auth System SHALL authenticate the user using the `/auth/customer/emailpass` endpoint with x-publishable-api-key header
2. WHEN authentication is successful, THE Auth System SHALL store the returned JWT token in both Auth State and localStorage
3. WHEN the token is stored, THE Auth System SHALL retrieve the authenticated customer data from `/store/customers/me` endpoint
4. WHEN customer data is retrieved, THE Auth System SHALL validate that the customer has `is_store_staff: true` in their profile
5. IF the customer does not have store staff privileges, THEN THE Auth System SHALL reject the login and display "Access denied: Store staff privileges required"

### Requirement 2: Store Staff Registration

**User Story:** As a new store staff member, I want to register an account so that I can access the orders admin application

#### Acceptance Criteria

1. WHEN a user submits registration details (email, password, first_name, last_name, phone), THE Auth System SHALL create a new store staff account using POST `/admin/store-staff` endpoint
2. WHEN registration is successful, THE Auth System SHALL automatically log in the new user using their credentials
3. WHEN registration fails due to duplicate email, THE Auth System SHALL display "Email already exists" error message
4. THE Registration Page SHALL validate that password meets minimum security requirements before submission
5. WHEN registration completes successfully, THE Auth System SHALL navigate the user to the dashboard

### Requirement 3: User Data Management

**User Story:** As the application, I want to store and manage authenticated user information so that I can display user details and control access throughout the app

#### Acceptance Criteria

1. WHEN a user successfully authenticates, THE Auth State SHALL store the user's id, first_name, last_name, email, is_store_staff, and staff_role
2. WHEN user data is stored, THE Auth State SHALL compute and store the full name from first_name and last_name
3. WHEN authentication succeeds, THE Auth State SHALL store the JWT token in both state and localStorage
4. WHEN the user's staff role is stored, THE Auth State SHALL include the staff_role value from the customer object
5. THE Auth State SHALL maintain an isLoggedIn boolean flag that reflects the current authentication status

### Requirement 4: Token Persistence and Session Recovery

**User Story:** As a store staff member, I want my login session to persist across browser refreshes so that I don't have to log in repeatedly

#### Acceptance Criteria

1. WHEN the application initializes, THE Auth System SHALL check localStorage for an existing authentication token
2. IF a token exists in localStorage, THEN THE Auth System SHALL attempt to validate it by fetching current user data
3. WHEN token validation succeeds, THE Auth System SHALL restore the user session with full user data
4. IF token validation fails, THEN THE Auth System SHALL clear the invalid token from localStorage and reset auth state
5. WHEN a user logs out, THE Auth System SHALL remove the token from both localStorage and state

### Requirement 5: HTTP Request Authentication with Dual API Key Strategy

**User Story:** As the application, I want to automatically include the correct authentication credentials based on endpoint type so that both admin and store endpoints work properly

#### Acceptance Criteria

1. WHEN an HTTP request is made to an endpoint containing `/admin/`, THE Auth Interceptor SHALL include the JWT token as Bearer token in Authorization header AND the MEDUSA_ADMIN_KEY in x-medusa-access-token header
2. WHEN an HTTP request is made to an endpoint containing `/store/`, THE Auth Interceptor SHALL include the JWT token as Bearer token in Authorization header AND the MEDUSA_PUBLISHABLE_KEY in x-publishable-api-key header
3. WHEN a request is made to the `/auth/customer/emailpass` endpoint, THE Auth Interceptor SHALL only include the x-publishable-api-key header without Bearer token
4. THE Auth Interceptor SHALL determine which API key to use based on the request URL path
5. THE Auth Interceptor SHALL NOT add both admin and publishable keys to the same request

### Requirement 6: Authentication Error Handling

**User Story:** As a store staff member, I want to receive clear error messages when authentication fails so that I can understand what went wrong

#### Acceptance Criteria

1. WHEN authentication fails due to invalid credentials, THE Auth System SHALL display a user-friendly error message
2. WHEN a 401 Unauthorized response is received, THE Auth Interceptor SHALL automatically log out the user and redirect to the login page
3. WHEN network connectivity fails during login, THE Auth System SHALL display a network error message
4. WHEN the backend server is not running, THE Auth System SHALL display a message indicating the server is unavailable
5. IF a user without store staff privileges attempts to log in, THEN THE Auth System SHALL display "Access denied: Store staff privileges required"

### Requirement 7: Login Page User Experience

**User Story:** As a store staff member, I want a responsive and intuitive login interface so that I can easily authenticate

#### Acceptance Criteria

1. THE Login Page SHALL display input fields for email and password with appropriate validation
2. WHEN form validation fails, THE Login Page SHALL display field-specific error messages
3. WHEN the login button is clicked, THE Login Page SHALL display a loading indicator while authentication is in progress
4. WHEN authentication succeeds, THE Login Page SHALL navigate the user to the dashboard page
5. IF the user is already authenticated when accessing the login page, THEN THE Login Page SHALL automatically redirect to the dashboard

### Requirement 8: Registration Page User Experience

**User Story:** As a new store staff member, I want a clear registration interface so that I can easily create my account

#### Acceptance Criteria

1. THE Registration Page SHALL display input fields for email, password, confirm password, first_name, last_name, and phone with appropriate validation
2. WHEN password and confirm password do not match, THE Registration Page SHALL display "Passwords do not match" error
3. WHEN the register button is clicked, THE Registration Page SHALL display a loading indicator while registration is in progress
4. WHEN registration succeeds, THE Registration Page SHALL automatically log in the user and navigate to the dashboard
5. THE Registration Page SHALL provide a link to navigate back to the login page for existing users

### Requirement 9: Logout Functionality

**User Story:** As a store staff member, I want to securely log out of the application so that my session is properly terminated

#### Acceptance Criteria

1. WHEN a user initiates logout, THE Auth System SHALL call the `/auth/session` DELETE endpoint to invalidate the server session
2. WHEN logout is initiated, THE Auth System SHALL remove the authentication token from localStorage
3. WHEN logout completes, THE Auth System SHALL reset all authentication state to default values
4. WHEN logout completes, THE Auth System SHALL navigate the user to the login page
5. WHEN logout fails due to network error, THE Auth System SHALL still clear local authentication data and redirect to login

### Requirement 10: Separate Admin and Store API Services

**User Story:** As a developer, I want separate services for admin and store endpoints so that API key management is clear and maintainable

#### Acceptance Criteria

1. THE System SHALL provide a MedusaAdminService class in `medusa.service.admin.ts` for all `/admin/*` endpoint operations
2. THE System SHALL provide a MedusaStoreService class in `medusa.service.store.ts` for all `/store/*` endpoint operations
3. THE MedusaAdminService SHALL include methods for admin operations like fetching orders, creating store staff, and managing fulfillments
4. THE MedusaStoreService SHALL include methods for customer authentication, fetching customer profile, and store-level operations
5. BOTH services SHALL extend the BaseHttpService to avoid code duplication

### Requirement 11: Store Staff Admin Service Methods

**User Story:** As a developer, I want admin service methods for store staff management so that I can create and manage staff accounts

#### Acceptance Criteria

1. THE MedusaAdminService SHALL provide a createStoreStaff method that posts to `/admin/store-staff` with email, password, first_name, last_name, and phone
2. THE MedusaAdminService SHALL provide a getStoreStaff method to fetch all store staff from `/admin/store-staff`
3. THE MedusaAdminService SHALL provide a getStoreStaffById method to fetch a single staff member from `/admin/store-staff/:id`
4. THE MedusaAdminService SHALL provide an updateStoreStaff method to update staff details via POST to `/admin/store-staff/:id`
5. THE MedusaAdminService SHALL provide a deleteStoreStaff method to remove staff status via DELETE to `/admin/store-staff/:id`

### Requirement 12: Store Customer Service Methods

**User Story:** As a developer, I want store service methods for customer operations so that I can authenticate and fetch customer data

#### Acceptance Criteria

1. THE MedusaStoreService SHALL provide a login method that posts to `/auth/customer/emailpass` with email and password
2. THE MedusaStoreService SHALL provide a getCustomerProfile method that fetches from `/store/customers/me`
3. THE MedusaStoreService SHALL return properly typed responses matching the Customer interface
4. THE MedusaStoreService SHALL handle authentication errors and return meaningful error messages
5. THE MedusaStoreService methods SHALL rely on the Auth Interceptor for adding x-publishable-api-key header

### Requirement 13: Route Protection

**User Story:** As the application, I want to protect routes from unauthorized access so that only authenticated store staff can access admin features

#### Acceptance Criteria

1. WHEN an unauthenticated user attempts to access a protected route, THE Route Guard SHALL redirect them to the login page
2. WHEN an authenticated user accesses a protected route, THE Route Guard SHALL allow navigation to proceed
3. THE Route Guard SHALL check authentication status from the Auth State before allowing route access
4. WHEN authentication status cannot be determined, THE Route Guard SHALL default to denying access
5. THE Route Guard SHALL preserve the intended destination URL for redirect after successful login

### Requirement 14: Authentication State Observability

**User Story:** As a developer, I want to observe authentication state changes so that UI components can react to login/logout events

#### Acceptance Criteria

1. THE Auth State SHALL expose an observable selector for isLoggedIn status
2. THE Auth State SHALL expose an observable selector for current user data
3. THE Auth State SHALL expose an observable selector for authentication loading state
4. THE Auth State SHALL expose an observable selector for authentication errors
5. WHEN authentication state changes, THE Auth State SHALL emit new values to all subscribed observers

### Requirement 15: Consistent Header Management Strategy

**User Story:** As a developer, I want consistent header management across all HTTP requests so that authentication and API keys are properly applied without duplication

#### Acceptance Criteria

1. THE Auth Interceptor SHALL be the single source of truth for adding authentication headers to all HTTP requests
2. THE Auth Interceptor SHALL add x-medusa-access-token header only for requests containing `/admin/` in the URL
3. THE Auth Interceptor SHALL add x-publishable-api-key header only for requests containing `/store/` or `/auth/` in the URL
4. THE MedusaAdminService and MedusaStoreService SHALL NOT manually add authentication headers since the interceptor handles them
5. THE Auth Interceptor SHALL add Bearer token to Authorization header for all authenticated requests except the initial `/auth/customer/emailpass` login

### Requirement 16: Shared HTTP Service Base Class

**User Story:** As a developer, I want to eliminate code duplication across API services so that the codebase is maintainable and consistent

#### Acceptance Criteria

1. THE System SHALL provide a base HTTP service class that contains common HTTP methods (get, post, put, delete)
2. THE Base HTTP Service SHALL provide a shared error handling method that all services can use
3. THE Base HTTP Service SHALL provide a shared query string builder method for Medusa API patterns
4. THE Medusa Service and Driver Service SHALL extend the base HTTP service class instead of duplicating code
5. THE Base HTTP Service SHALL NOT add authentication headers directly, delegating this responsibility to the Auth Interceptor

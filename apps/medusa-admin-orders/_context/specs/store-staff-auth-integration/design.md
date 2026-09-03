# Store Staff Authentication Integration - Design Document

## Overview

This design document outlines the architecture and implementation approach for integrating the Store Staff API authentication system into the existing Ionic Angular orders admin application. The design focuses on:

1. **Customer Authentication**: Store staff members authenticate as customers using `/auth/customer/emailpass`
2. **Registration Flow**: New staff members can register via `/admin/store-staff` endpoint
3. **Service Separation**: Clear separation between Admin API (`MedusaAdminService`) and Store API (`MedusaStoreService`)
4. **Interceptor-Based Headers**: All authentication headers managed by Auth Interceptor based on endpoint paths
5. **NGXS State Management**: Centralized auth state with staff validation

## Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         Ionic Angular App                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌──────────────┐      ┌──────────────┐      ┌──────────────┐  │
│  │  Login Page  │─────▶│  Auth State  │◀─────│ Route Guards │  │
│  └──────────────┘      │    (NGXS)    │      └──────────────┘  │
│                        └──────┬───────┘                          │
│                               │                                  │
│                               ▼                                  │
│  ┌────────────────────────────────────────────────────────┐    │
│  │              Auth Interceptor (HTTP)                    │    │
│  │  - Adds JWT Bearer tokens                              │    │
│  │  - Adds x-medusa-access-token for /admin/* endpoints   │    │
│  │  - Handles 401 errors                                  │    │
│  └────────────────────┬───────────────────────────────────┘    │
│                       │                                          │
│                       ▼                                          │
│  ┌────────────────────────────────────────────────────────┐    │
│  │           Base HTTP Service (Abstract)                  │    │
│  │  - Common HTTP methods (get, post, put, delete)        │    │
│  │  - Error handling                                      │    │
│  │  - Query string builder                                │    │
│  └────────────────────┬───────────────────────────────────┘    │
│                       │                                          │
│         ┌─────────────┼─────────────┬──────────────┐           │
│         ▼             ▼             ▼              ▼           │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐      │
│  │  Medusa  │  │  Driver  │  │   Store  │  │  Future  │      │
│  │ Service  │  │ Service  │  │   Staff  │  │ Services │      │
│  └──────────┘  └──────────┘  │ Service  │  └──────────┘      │
│                               └──────────┘                      │
└─────────────────────────────────────────────────────────────────┘
                               │
                               ▼
                    ┌──────────────────────┐
                    │   Medusa Backend     │
                    │   - Auth endpoints   │
                    │   - Admin API        │
                    │   - Store Staff API  │
                    └──────────────────────┘
```

### Login Authentication Flow

```
┌──────────┐                                                    ┌──────────┐
│  User    │                                                    │  Medusa  │
│          │                                                    │  Backend │
└────┬─────┘                                                    └────┬─────┘
     │                                                               │
     │ 1. Enter email/password on Login Page                        │
     ├──────────────────────────────────────────────────────────────▶
     │    POST /auth/customer/emailpass                             │
     │    Header: x-publishable-api-key                             │
     │                                                               │
     │ 2. Return JWT token                                          │
     ◀──────────────────────────────────────────────────────────────┤
     │    { token: "jwt_token_here" }                               │
     │                                                               │
     │ 3. Store token in Auth State + localStorage                  │
     │                                                               │
     │ 4. Get authenticated customer data                           │
     ├──────────────────────────────────────────────────────────────▶
     │    GET /store/customers/me                                   │
     │    Header: Authorization: Bearer jwt_token_here              │
     │    Header: x-publishable-api-key                             │
     │                                                               │
     │ 5. Return customer with staff fields                         │
     ◀──────────────────────────────────────────────────────────────┤
     │    { id, email, first_name, last_name,                       │
     │      is_store_staff: true, staff_role: "staff",              │
     │      metadata: { is_store_staff: true, privilege: "staff" }} │
     │                                                               │
     │ 6. Validate is_store_staff === true                          │
     │    (Client-side check in Auth State)                         │
     │                                                               │
     │ 7. If valid, navigate to dashboard                           │
     │    If invalid, show "Access denied" error                    │
     │                                                               │
```

### Registration Flow

```
┌──────────┐                                                    ┌──────────┐
│  User    │                                                    │  Medusa  │
│          │                                                    │  Backend │
└────┬─────┘                                                    └────┬─────┘
     │                                                               │
     │ 1. Enter registration details on Register Page               │
     │    (email, password, first_name, last_name, phone)           │
     ├──────────────────────────────────────────────────────────────▶
     │    POST /admin/store-staff                                   │
     │    Header: x-medusa-access-token (admin key)                 │
     │                                                               │
     │ 2. Create store staff customer                               │
     │    (Backend sets is_store_staff: true, staff_role: "staff")  │
     │                                                               │
     │ 3. Return created customer                                   │
     ◀──────────────────────────────────────────────────────────────┤
     │    { customer: { id, email, is_store_staff: true, ... }}     │
     │                                                               │
     │ 4. Auto-login with credentials                               │
     ├──────────────────────────────────────────────────────────────▶
     │    POST /auth/customer/emailpass                             │
     │                                                               │
     │ 5. Return JWT token                                          │
     ◀──────────────────────────────────────────────────────────────┤
     │                                                               │
     │ 6. Store token and navigate to dashboard                     │
     │                                                               │
```

## Components and Interfaces

### 1. Base HTTP Service (New)

**Purpose**: Provide reusable HTTP methods and utilities to eliminate code duplication

**Location**: `src/app/shared/api/base-http.service.ts`

**Class Structure**:
```typescript
@Injectable()
export abstract class BaseHttpService {
  protected abstract baseUrl: string;
  protected http = inject(HttpClient);

  // Protected HTTP methods
  protected get<T>(endpoint: string, options?: HttpOptions): Observable<T>
  protected post<T>(endpoint: string, body: any, options?: HttpOptions): Observable<T>
  protected put<T>(endpoint: string, body: any, options?: HttpOptions): Observable<T>
  protected delete<T>(endpoint: string, options?: HttpOptions): Observable<T>

  // Utility methods
  protected handleError(error: HttpErrorResponse): Observable<never>
  protected buildQueryString(params: Record<string, any>): string
}
```

**Key Features**:
- Abstract class that cannot be instantiated directly
- Protected methods accessible only to child classes
- Centralized error handling with user-friendly messages
- Query string builder supporting arrays and nested objects
- No header management (delegated to interceptor)

### 2. Enhanced Auth Interceptor (Single Source of Truth for Headers)

**Purpose**: Centralize ALL authentication header management based on endpoint paths

**Location**: `src/app/shared/interceptor/auth.interceptor.ts`

**Responsibilities**:
- Add JWT Bearer token to Authorization header for authenticated requests
- Add `x-medusa-access-token` header ONLY for `/admin/*` endpoints
- Add `x-publishable-api-key` header ONLY for `/store/*` and `/auth/*` endpoints
- Handle 401 errors by logging out and redirecting
- Skip Bearer token for initial `/auth/customer/emailpass` login

**Logic Flow**:
```typescript
intercept(request, next) {
  let modifiedRequest = request;
  const token = store.selectSnapshot(AuthState.getToken);
  const url = request.url;

  // Determine endpoint type
  const isAdminEndpoint = url.includes('/admin/');
  const isStoreEndpoint = url.includes('/store/') || url.includes('/auth/');
  const isInitialLogin = url.includes('/auth/customer/emailpass');

  // Add Bearer token for authenticated requests (except initial login)
  if (token && !isInitialLogin) {
    modifiedRequest = modifiedRequest.clone({
      setHeaders: { 'Authorization': `Bearer ${token}` }
    });
  }

  // Add admin API key for admin endpoints
  if (isAdminEndpoint && environment.MEDUSA_ADMIN_KEY) {
    modifiedRequest = modifiedRequest.clone({
      setHeaders: { 'x-medusa-access-token': environment.MEDUSA_ADMIN_KEY }
    });
  }

  // Add publishable key for store/auth endpoints
  if (isStoreEndpoint && environment.MEDUSA_PUBLISHABLE_KEY) {
    modifiedRequest = modifiedRequest.clone({
      setHeaders: { 'x-publishable-api-key': environment.MEDUSA_PUBLISHABLE_KEY }
    });
  }

  // Handle response and errors
  return next.handle(modifiedRequest).pipe(
    catchError((error) => {
      if (error.status === 401) {
        store.dispatch(new Logout());
        router.navigate(['/login']);
      }
      return throwError(() => error);
    })
  );
}
```

**Key Design Decision**: Services do NOT add headers manually. The interceptor is the single source of truth.

### 3. Updated Auth State

**Purpose**: Manage authentication state with store staff validation

**Location**: `src/app/store/auth/auth.state.ts`

**State Model**:
```typescript
interface AuthenticationStateModel {
  id: string;
  firstName: string;
  lastName: string;
  fullName: string;
  email: string;
  isStoreStaff: boolean;      // Store staff flag from customer.is_store_staff
  staffRole: string | null;   // Store staff role: "staff", "manager", "supervisor"
  isLoggedIn: boolean;
  token: string | null;
  loading: boolean;
  error: string | null;
}
```

**Key Actions**:
- `Login`: Authenticate user and validate store staff status
- `Register`: Create new store staff account and auto-login
- `LoginSuccess`: Store user data including staff role
- `LoginFailure`: Handle authentication errors
- `Logout`: Clear session and local storage
- `CheckAuthStatus`: Restore session from stored token

**Login Action with Store Staff Validation**:
```typescript
@Action(Login)
login(ctx: StateContext<AuthenticationStateModel>, { payload }: Login) {
  ctx.patchState({ loading: true, error: null });

  return this.medusaStoreService.login(payload.email, payload.password).pipe(
    switchMap((authResponse) => {
      // Store token immediately
      ctx.patchState({ token: authResponse.token });
      localStorage.setItem('auth_token', authResponse.token);
      
      // Fetch customer profile
      return this.medusaStoreService.getCustomerProfile();
    }),
    tap((customer) => {
      // Validate store staff privileges
      if (!customer.is_store_staff) {
        throw new Error('Access denied: Store staff privileges required');
      }

      ctx.dispatch(new LoginSuccess({ 
        customer, 
        token: ctx.getState().token 
      }));
    }),
    catchError((error) => {
      ctx.dispatch(new LoginFailure({ 
        error: error.userMessage || error.message || 'Login failed' 
      }));
      return throwError(() => error);
    })
  );
}
```

**Register Action**:
```typescript
@Action(Register)
register(ctx: StateContext<AuthenticationStateModel>, { payload }: Register) {
  ctx.patchState({ loading: true, error: null });

  return this.medusaAdminService.createStoreStaff(payload).pipe(
    switchMap((response) => {
      // Auto-login after successful registration
      return ctx.dispatch(new Login({ 
        email: payload.email, 
        password: payload.password 
      }));
    }),
    catchError((error) => {
      ctx.dispatch(new LoginFailure({ 
        error: error.userMessage || error.message || 'Registration failed' 
      }));
      return throwError(() => error);
    })
  );
}
```

### 4. Medusa Store Service (Customer/Store Endpoints)

**Purpose**: Handle all `/store/*` and `/auth/*` customer-related endpoints

**Location**: `src/app/shared/api/medusa.service.store.ts`

**Class Name**: `MedusaStoreService` (renamed from `MedusaService`)

**Key Methods**:
```typescript
@Injectable({ providedIn: 'root' })
export class MedusaStoreService extends BaseHttpService {
  protected baseUrl = environment.MEDUSA_API_BASE_PATH;

  // Authentication methods
  login(email: string, password: string): Observable<{ token: string }> {
    // Interceptor adds x-publishable-api-key header
    return this.post<{ token: string }>('/auth/customer/emailpass', { email, password });
  }

  getCustomerProfile(): Observable<Customer> {
    // Interceptor adds Bearer token + x-publishable-api-key
    return this.get<{ customer: Customer }>('/store/customers/me').pipe(
      map(response => response.customer)
    );
  }

  logout(): Observable<any> {
    return this.delete('/auth/session');
  }

  // Future: Avatar methods, customer profile updates, etc.
}
```

**Note**: No manual header management - all handled by Auth Interceptor

### 5. Medusa Admin Service (Admin Endpoints)

**Purpose**: Handle all `/admin/*` admin-related endpoints

**Location**: `src/app/shared/api/medusa.service.admin.ts`

**Class Name**: `MedusaAdminService`

**Key Methods**:
```typescript
@Injectable({ providedIn: 'root' })
export class MedusaAdminService extends BaseHttpService {
  protected baseUrl = environment.MEDUSA_API_BASE_PATH;

  // Store Staff Management
  createStoreStaff(data: CreateStaffData): Observable<StoreStaffResponse> {
    // Interceptor adds x-medusa-access-token header
    return this.post<StoreStaffResponse>('/admin/store-staff', data);
  }

  getStoreStaff(): Observable<StoreStaffListResponse> {
    return this.get<StoreStaffListResponse>('/admin/store-staff');
  }

  getStoreStaffById(id: string): Observable<StoreStaffResponse> {
    return this.get<StoreStaffResponse>(`/admin/store-staff/${id}`);
  }

  updateStoreStaff(id: string, data: UpdateStaffData): Observable<StoreStaffResponse> {
    return this.post<StoreStaffResponse>(`/admin/store-staff/${id}`, data);
  }

  deleteStoreStaff(id: string, permanent = false): Observable<StoreStaffDeleteResponse> {
    const query = permanent ? '?permanent=true' : '';
    return this.delete<StoreStaffDeleteResponse>(`/admin/store-staff/${id}${query}`);
  }

  // Orders methods (moved from store service)
  getOrders(params?: OrderFilters): Observable<OrdersResponse> {
    const queryString = this.buildQueryString(params || {});
    return this.get<OrdersResponse>(`/admin/orders${queryString ? `?${queryString}` : ''}`);
  }

  getOrder(id: string): Observable<{ order: Order }> {
    // ... comprehensive fields query
    return this.get<{ order: Order }>(`/admin/orders/${id}?${queryParams}`);
  }

  // Fulfillment, payment, stock location methods, etc.
  // ... (all existing admin methods from current MedusaService)
}
```

**Note**: No manual header management - all handled by Auth Interceptor

### 6. Refactored Driver Service

**Purpose**: Provide driver API methods without code duplication

**Location**: `src/app/shared/api/driver.service.ts`

**Changes**:
- Extend `BaseHttpService`
- Remove all duplicated code
- Keep only driver-specific methods
- No manual header management

### 7. Auth Guard (New)

**Purpose**: Protect routes from unauthorized access

**Location**: `src/app/shared/guards/auth.guard.ts`

**Implementation**:
```typescript
@Injectable({ providedIn: 'root' })
export class AuthGuard implements CanActivate {
  private store = inject(Store);
  private router = inject(Router);

  canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): boolean {
    const isLoggedIn = this.store.selectSnapshot(AuthState.isLoggedIn);

    if (!isLoggedIn) {
      // Store intended URL for redirect after login
      this.router.navigate(['/login'], {
        queryParams: { returnUrl: state.url }
      });
      return false;
    }

    return true;
  }
}
```

### 8. Updated Login Page

**Purpose**: Provide user interface for authentication

**Location**: `src/app/pages/login/login.page.ts`

**Enhancements**:
- Display store staff-specific error messages
- Handle privilege validation errors ("Access denied: Store staff privileges required")
- Show loading state during authentication
- Auto-redirect if already authenticated
- Support return URL after login
- Link to registration page for new users

### 9. New Registration Page

**Purpose**: Allow new store staff members to create accounts

**Location**: `src/app/pages/register/register.page.ts`

**Features**:
- Form fields: email, password, confirm password, first_name, last_name, phone
- Password match validation
- Loading state during registration
- Auto-login after successful registration
- Link back to login page for existing users
- Error handling for duplicate emails

**Implementation**:
```typescript
@Component({
  selector: 'app-register',
  templateUrl: './register.page.html'
})
export class RegisterPage {
  registerForm: FormGroup;
  loading$ = this.store.select(AuthState.isLoading);
  error$ = this.store.select(AuthState.getError);

  constructor(
    private store: Store,
    private router: Router,
    private fb: FormBuilder
  ) {
    this.registerForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(8)]],
      confirmPassword: ['', Validators.required],
      first_name: ['', Validators.required],
      last_name: ['', Validators.required],
      phone: ['']
    }, { validators: this.passwordMatchValidator });
  }

  onRegister() {
    if (this.registerForm.valid) {
      const { confirmPassword, ...data } = this.registerForm.value;
      this.store.dispatch(new Register(data)).subscribe({
        next: () => this.router.navigate(['/dashboard']),
        error: (err) => console.error('Registration failed', err)
      });
    }
  }

  passwordMatchValidator(form: FormGroup) {
    const password = form.get('password');
    const confirmPassword = form.get('confirmPassword');
    return password && confirmPassword && password.value === confirmPassword.value
      ? null
      : { passwordMismatch: true };
  }
}
```

## Data Models

### Store Staff Interfaces

**Location**: `src/app/shared/admin-interfaces/store-staff.interface.ts`

```typescript
export interface StoreStaff {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  phone?: string;
  metadata: {
    is_store_staff: boolean;
    privilege: 'management';
  };
  created_at: string;
  updated_at: string;
}

export interface CreateStaffData {
  email: string;
  password: string;
  first_name: string;
  last_name: string;
  phone?: string;
}

export interface StoreStaffListResponse {
  customers: StoreStaff[];
}

export interface StoreStaffResponse {
  customer: StoreStaff;
}

export interface StoreStaffDeleteResponse {
  removed?: boolean;
  deleted?: boolean;
  id: string;
  message: string;
}
```

### Updated Customer Interface

**Location**: `src/app/shared/admin-interfaces/order.interface.ts`

```typescript
export interface Customer {
  id: string;
  email: string;
  first_name?: string;
  last_name?: string;
  phone?: string;
  company_name?: string;
  has_account: boolean;
  // Store staff fields
  is_store_staff?: boolean;
  staff_role?: string; // "staff", "manager", "supervisor"
  staff_since?: string; // ISO 8601 date
  created_at: string;
  updated_at: string;
  deleted_at?: string;
  metadata?: Record<string, any>;
}

export interface AuthResponse {
  token: string;
}
```

## Error Handling

### Error Types and Messages

| Error Scenario | HTTP Status | User Message |
|---------------|-------------|--------------|
| Invalid credentials | 401 | "Invalid email or password" |
| Not store staff | 403 | "Access denied: Store staff privileges required" |
| Network error | 0 | "Backend server is not running. Please start the Medusa server" |
| Server error | 500 | "Server Error: Please try again later" |
| Session expired | 401 | Auto-logout and redirect to login |

### Error Handling Strategy

1. **Base HTTP Service**: Catches and transforms HTTP errors into user-friendly messages
2. **Auth State**: Handles authentication-specific errors and updates state
3. **Auth Interceptor**: Catches 401 errors globally and triggers logout
4. **Login Page**: Displays error messages to users with appropriate context

## Testing Strategy

Testing will be performed manually during development. Automated tests can be added in a future iteration if needed.

## Security Considerations

### Token Storage

- **JWT Token**: Stored in both NGXS state (memory) and localStorage (persistence)
- **Rationale**: localStorage allows session persistence across page refreshes
- **Risk Mitigation**: Tokens should have reasonable expiration times

### Header Management

- **Admin API Key**: Only added to `/admin/*` endpoints
- **JWT Token**: Added to all authenticated requests except initial login
- **Separation**: Interceptor handles all header logic, preventing accidental exposure

### Privilege Validation

- **Client-side**: Validate `is_store_staff` flag after authentication
- **Server-side**: Backend must also validate privileges for all admin endpoints
- **Defense in depth**: Both client and server validate access

### Session Management

- **Automatic logout**: On 401 errors, immediately clear session and redirect
- **Token validation**: On app initialization, validate stored token with backend
- **Clean logout**: Clear both memory and localStorage on logout

## Migration Strategy

### Phase 1: Update Interfaces and Base Infrastructure (COMPLETED)
1. ✅ `BaseHttpService` abstract class already exists
2. ✅ Create/Update Store Staff interfaces
3. ✅ Update Customer interface with staff fields

### Phase 2: Separate Admin and Store Services
1. Rename `MedusaService` to `MedusaStoreService` in `medusa.service.store.ts`
2. Move all `/admin/*` methods from `MedusaStoreService` to `MedusaAdminService`
3. Keep only `/store/*` and `/auth/*` methods in `MedusaStoreService`
4. Update all imports throughout the application

### Phase 3: Update Auth Interceptor
1. Update Auth Interceptor to detect `/admin/` vs `/store/` endpoints
2. Add `x-medusa-access-token` header only for `/admin/*` endpoints
3. Add `x-publishable-api-key` header only for `/store/*` and `/auth/*` endpoints
4. Add Bearer token for authenticated requests (except initial login)
5. Remove any manual header management from services

### Phase 4: Enhance Authentication State
1. Update Auth State model with `isStoreStaff` and `staffRole` fields
2. Update Login action to use `MedusaStoreService.login()`
3. Add Register action to create staff via `MedusaAdminService.createStoreStaff()`
4. Implement store staff validation in Login action
5. Update LoginSuccess to store staff fields
6. Ensure token persistence in localStorage

### Phase 5: Update UI Components
1. Update Login Page with enhanced error handling
2. Wire up Registration Page to Auth State
3. Add password match validation to registration form
4. Add loading indicators and error displays
5. Add navigation links between login and register pages

### Phase 6: Testing and Validation
1. Test login flow with valid store staff credentials
2. Test login rejection for non-store-staff customers
3. Test registration flow and auto-login
4. Test session persistence across browser refresh
5. Verify correct headers are added by interceptor
6. Test 401 error handling and automatic logout

## Performance Considerations

### HTTP Request Optimization

- **Interceptor efficiency**: Single pass through interceptor for all requests
- **Header caching**: Headers computed once per request
- **No redundant calls**: Eliminate duplicate header setting

### State Management

- **Selective updates**: Only update changed state properties
- **Observable efficiency**: Use NGXS selectors for efficient state observation
- **Memory management**: Clear state on logout to prevent memory leaks

### Token Validation

- **Lazy validation**: Only validate token on app initialization, not on every request
- **Cache user data**: Store user data in state to avoid repeated API calls
- **Efficient checks**: Use synchronous state checks for route guards

## Future Enhancements

1. **Refresh Token Support**: Implement token refresh before expiration
2. **Role-Based Access Control**: Support multiple privilege levels beyond "management"
3. **Multi-Factor Authentication**: Add 2FA support for enhanced security
4. **Session Timeout**: Implement automatic logout after inactivity
5. **Audit Logging**: Track authentication events for security monitoring
6. **Password Reset**: Add password reset flow for store staff
7. **Profile Management**: Allow store staff to update their profile information
8. **Activity Dashboard**: Show store staff activity and statistics

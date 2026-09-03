# Medusa JS SDK Integration Guide

## 🎯 **Why Use the Medusa JS SDK?**

The **`@medusajs/js-sdk`** is the official Medusa JavaScript SDK that provides:

✅ **Built-in CORS handling** - Properly configured for Medusa backend  
✅ **Automatic authentication** - Handles sessions and tokens  
✅ **Type-safe API** - Full TypeScript support  
✅ **Simplified API calls** - No manual endpoint construction  
✅ **Error handling** - Consistent error responses  
✅ **Cookie management** - Automatic session handling  

## 📦 **Installation**

```bash
npm install @medusajs/js-sdk
```

## 🔧 **Basic Setup**

### **Step 1: Create Medusa SDK Service**

Create: `src/app/shared/api/medusa-sdk.service.ts`

```typescript
import { Injectable } from '@angular/core';
import Medusa from '@medusajs/js-sdk';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class MedusaSdkService {
  private sdk: Medusa;

  constructor() {
    this.sdk = new Medusa({
      baseUrl: environment.MEDUSA_API_BASE_PATH,
      publishableKey: environment.MEDUSA_PUBLISHABLE_KEY,
      // SDK handles authentication and CORS automatically
    });
  }

  /**
   * Get the SDK instance for direct access
   */
  get client(): Medusa {
    return this.sdk;
  }

  /**
   * Admin authentication
   */
  async adminLogin(email: string, password: string) {
    return this.sdk.admin.auth.login({
      email,
      password
    });
  }

  /**
   * Get current admin user
   */
  async getCurrentUser() {
    return this.sdk.admin.users.retrieve('me');
  }

  /**
   * Logout
   */
  async logout() {
    return this.sdk.admin.auth.logout();
  }

  /**
   * Get orders
   */
  async getOrders(params?: any) {
    return this.sdk.admin.orders.list(params);
  }

  /**
   * Get single order
   */
  async getOrder(id: string) {
    return this.sdk.admin.orders.retrieve(id);
  }

  /**
   * Create fulfillment
   */
  async createFulfillment(orderId: string, data: any) {
    return this.sdk.admin.orders.createFulfillment(orderId, data);
  }

  /**
   * Capture payment
   */
  async capturePayment(orderId: string) {
    return this.sdk.admin.orders.capturePayment(orderId);
  }

  /**
   * Create refund
   */
  async createRefund(orderId: string, data: any) {
    return this.sdk.admin.orders.createRefund(orderId, data);
  }

  /**
   * Get customers
   */
  async getCustomers(params?: any) {
    return this.sdk.admin.customers.list(params);
  }

  /**
   * Get customer by ID
   */
  async getCustomer(id: string) {
    return this.sdk.admin.customers.retrieve(id);
  }

  /**
   * Get products
   */
  async getProducts(params?: any) {
    return this.sdk.admin.products.list(params);
  }

  /**
   * Get regions
   */
  async getRegions() {
    return this.sdk.admin.regions.list();
  }

  /**
   * Get stores
   */
  async getStores() {
    return this.sdk.admin.stores.list();
  }
}
```

## 🔄 **Migration from Current Service**

### **Before (Current Approach):**

```typescript
// Using custom HTTP service
this.medusaAdmin.getOrders().subscribe(
  response => console.log(response),
  error => console.error(error)
);
```

### **After (Using SDK):**

```typescript
// Using Medusa SDK (Promise-based)
try {
  const response = await this.medusaSdk.getOrders();
  console.log(response);
} catch (error) {
  console.error(error);
}

// Or convert to Observable
import { from } from 'rxjs';

from(this.medusaSdk.getOrders()).subscribe(
  response => console.log(response),
  error => console.error(error)
);
```

## 🎨 **Update Auth State to Use SDK**

Update: `src/app/store/auth/auth.state.ts`

```typescript
import { Injectable, inject } from '@angular/core';
import { State, Action, StateContext, Selector } from '@ngxs/store';
import { tap, catchError } from 'rxjs/operators';
import { throwError, from } from 'rxjs';
import { MedusaSdkService } from '../../shared/api/medusa-sdk.service';
import { Login, Logout, Register, CheckAuthStatus } from './auth.actions';

@State<AuthStateModel>({
  name: 'auth',
  defaults: {
    token: null,
    user: null,
    isAuthenticated: false
  }
})
@Injectable()
export class AuthState {
  private medusaSdk = inject(MedusaSdkService);

  @Action(Login)
  login(ctx: StateContext<AuthStateModel>, action: Login) {
    // Convert Promise to Observable
    return from(this.medusaSdk.adminLogin(action.email, action.password)).pipe(
      tap(response => {
        ctx.patchState({
          token: response.token,
          isAuthenticated: true
        });
        
        // Load user profile
        return from(this.medusaSdk.getCurrentUser()).pipe(
          tap(userResponse => {
            ctx.patchState({
              user: userResponse.user
            });
          })
        );
      }),
      catchError(error => {
        ctx.patchState({
          token: null,
          user: null,
          isAuthenticated: false
        });
        return throwError(() => error);
      })
    );
  }

  @Action(Logout)
  logout(ctx: StateContext<AuthStateModel>) {
    return from(this.medusaSdk.logout()).pipe(
      tap(() => {
        ctx.patchState({
          token: null,
          user: null,
          isAuthenticated: false
        });
      })
    );
  }
}
```

## 📋 **Update Order Detail Page**

Update: `src/app/pages/order-detail/order-detail.page.ts`

```typescript
import { MedusaSdkService } from '../../shared/api/medusa-sdk.service';
import { from } from 'rxjs';

export class OrderDetailPage implements OnInit {
  private medusaSdk = inject(MedusaSdkService);

  ngOnInit() {
    this.route.paramMap.pipe(
      switchMap(params => {
        const orderId = params.get('id');
        if (orderId) {
          // Convert SDK Promise to Observable
          return from(this.medusaSdk.getOrder(orderId));
        }
        return of(null);
      }),
      tap(response => {
        if (response) {
          this.order = response.order;
        }
      })
    ).subscribe();
  }

  async createFulfillment(data: any) {
    try {
      const response = await this.medusaSdk.createFulfillment(
        this.order.id,
        data
      );
      console.log('Fulfillment created:', response);
      // Reload order
      const orderResponse = await this.medusaSdk.getOrder(this.order.id);
      this.order = orderResponse.order;
    } catch (error) {
      console.error('Error creating fulfillment:', error);
    }
  }
}
```

## 🔑 **Authentication Flow with SDK**

The SDK handles authentication differently:

1. **Session-based (Default):**
   - SDK uses cookies automatically
   - No need to manually handle tokens
   - Works with `withCredentials: true`

2. **API Token (Alternative):**
   ```typescript
   const sdk = new Medusa({
     baseUrl: 'http://localhost:9000',
     apiKey: 'your-api-token-here'
   });
   ```

## ✅ **Benefits Over Current Approach**

| Feature | Current Approach | Medusa SDK |
|---------|-----------------|------------|
| **CORS Handling** | Manual configuration | ✅ Built-in |
| **Authentication** | Manual interceptor | ✅ Automatic |
| **Type Safety** | Custom interfaces | ✅ Full TypeScript |
| **API Updates** | Manual updates | ✅ Auto-updated |
| **Error Handling** | Custom | ✅ Consistent |
| **Cookie Management** | Manual | ✅ Automatic |

## 🚀 **Quick Migration Steps**

1. **Install SDK:**
   ```bash
   npm install @medusajs/js-sdk
   ```

2. **Create SDK Service:**
   - Create `medusa-sdk.service.ts`
   - Initialize with base URL

3. **Update Auth State:**
   - Replace `MedusaAdminService` with `MedusaSdkService`
   - Convert Promises to Observables with `from()`

4. **Update Components:**
   - Replace API calls with SDK methods
   - Use async/await or convert to Observables

5. **Test:**
   - Login flow
   - Order management
   - All CRUD operations

## ⚠️ **Important Notes**

1. **Promise vs Observable:**
   - SDK uses Promises
   - Convert to Observables with `from()` for NGXS/RxJS

2. **Error Handling:**
   - SDK throws errors
   - Use try/catch or catchError operator

3. **Authentication:**
   - SDK handles cookies automatically
   - No need for manual token management

4. **CORS:**
   - SDK is designed to work with Medusa CORS
   - Should solve your current CORS issues

## 🎯 **Recommendation**

**Try the SDK approach!** It should solve your CORS issues because:

1. ✅ Built specifically for Medusa backend
2. ✅ Handles authentication properly
3. ✅ Manages cookies and sessions correctly
4. ✅ Maintained by Medusa team
5. ✅ Type-safe and well-documented

Would you like me to implement this migration?

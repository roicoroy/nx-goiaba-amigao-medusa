import { Injectable, inject } from "@angular/core";
import { Action, Selector, State, StateContext, Store } from "@ngxs/store";
import { catchError, Observable, take, tap, throwError, switchMap, of } from "rxjs";
import { jwtDecode } from "jwt-decode";
import { MedusaCustomer, LoginPayload } from "src/app/shared/interfaces";
import { AuthActions } from "./auth.actions";
import { MedusaCartActions } from "../medusa-cart/medusa-cart.actions";
import { WishlistActions } from "../wishlist/wishlist.actions";
import { OrdersActions } from "../orders/orders.actions";
import { MedusaService } from "src/app/shared/api/medusa.service";
import { FCMActions } from "../fcm/fcm.actions";

export interface IAuthStateModel {
  isLoggedIn: boolean,
  shouldCreateCustomer: boolean,
  access_token: string,
  customer: MedusaCustomer | null,
  avatar: string | null,
  location: string | null,
}

@State<IAuthStateModel>({
  name: 'auth',
  defaults: {
    isLoggedIn: false,
    shouldCreateCustomer: false,
    access_token: '',
    customer: null,
    avatar: null,
    location: null,
  }
})
@Injectable()
export class AuthState {

  private medusaApi = inject(MedusaService);
  private store = inject(Store);

  @Selector()
  static getToken(state: IAuthStateModel): string {
    return state.access_token;
  }

  @Selector()
  static isLoggedIn(state: IAuthStateModel): boolean {
    return state.isLoggedIn;
  }

  @Selector()
  static getCustomer(state: IAuthStateModel): MedusaCustomer | null {
    return state.customer;
  }

  @Selector()
  static getAvatar(state: IAuthStateModel): string | null {
    return state.avatar;
  }

  @Selector()
  static shouldCreateCustomer(state: IAuthStateModel): boolean {
    return state.shouldCreateCustomer;
  }

  @Action(AuthActions.Register)
  register(ctx: StateContext<IAuthStateModel>, { registerPayload, medusaAddress }: AuthActions.Register): Observable<any> {
    // Registration flow:
    // 1. POST /auth/customer/emailpass/register - Create auth account, get token
    // 2. POST /store/customers - Create customer record (requires authentication)
    // 3. POST /auth/customer/emailpass - Login to get fresh token
    
    return this.medusaApi.registerEmailPassword(registerPayload).pipe(
      take(1),
      switchMap((authRes: any) => {
        // Step 1: Auth registration successful, extract token
        const registerToken: string | undefined = authRes.token || authRes.access_token;
        
        if (!registerToken) {
          return throwError(() => new Error('Registration failed: No token received'));
        }
        
        // TypeScript now knows registerToken is not undefined
        const token: string = registerToken;
        
        // Update state with token so subsequent requests are authenticated
        ctx.patchState({
          access_token: token,
          isLoggedIn: true,
        });
        
        // Step 2: Create customer using the token from registration
        const customerPayload = {
          first_name: registerPayload.first_name,
          last_name: registerPayload.last_name,
          email: registerPayload.email,
          phone: registerPayload.phone
        };
        
        return this.medusaApi.createMedusaCustomer(customerPayload).pipe(
          take(1),
          switchMap((customerRes: any) => {
            if (!customerRes.customer) {
              return throwError(() => new Error('Customer creation failed: No customer data received'));
            }
            
            // Step 3: Login to get a fresh token with actor_id
            if (!registerPayload.password) {
              // No password provided, just use customer from creation
              ctx.patchState({
                customer: customerRes.customer,
                isLoggedIn: true,
              });
              // Register FCM token with customer ID
              this.registerFCMToken(customerRes.customer.id);
              return of({ customer: customerRes.customer });
            }
            
            const loginPayload: LoginPayload = {
              email: registerPayload.email,
              password: registerPayload.password
            };
            
            return this.medusaApi.loginEmailPassword(loginPayload.email, loginPayload.password).pipe(
              take(1),
              switchMap((loginRes: any) => {
                const loginToken: string = loginRes.token || loginRes.access_token || token || '';
                
                // Update state with fresh token and customer data
                ctx.patchState({
                  access_token: loginToken,
                  customer: customerRes.customer,
                  isLoggedIn: true,
                });
                
                // Register FCM token with customer ID
                this.registerFCMToken(customerRes.customer.id);
                
                return of({ customer: customerRes.customer });
              }),
              catchError((loginError) => {
                // Login failed, but customer was created, continue with registration token
                console.warn('Login after customer creation failed, continuing with registration token:', loginError);
                ctx.patchState({
                  customer: customerRes.customer,
                  isLoggedIn: true,
                });
                // Register FCM token with customer ID
                this.registerFCMToken(customerRes.customer.id);
                return of({ customer: customerRes.customer });
              })
            );
          }),
          catchError((customerError) => {
            console.error('Error creating customer after registration:', customerError);
            return throwError(() => customerError);
          })
        );
      }),
      catchError(error => {
        console.error('Error during registration:', error);
        ctx.patchState({
          access_token: '',
          isLoggedIn: false,
        });
        return throwError(() => error);
      })
    );
  }

  @Action(AuthActions.Login)
  login(ctx: StateContext<IAuthStateModel>, { loginPayload }: AuthActions.Login): Observable<any> {
    return this.medusaApi.loginEmailPassword(loginPayload.email, loginPayload.password).pipe(
      take(1),
      switchMap((res: any) => {
        // If we got a token, we are logged in
        if (res.token || res.access_token) {
          const token = res.token || res.access_token;

          ctx.patchState({
            access_token: token,
            isLoggedIn: true,
          });

          // If the login response already includes the customer, use it
          if (res.customer) {
            ctx.patchState({
              customer: res.customer,
            });
            // Check for guest cart and transfer it after setting customer
            const cartState = this.store.selectSnapshot((state: any) => state.medusaCart);
            const guestCart = cartState?.medusaCart;
            
            if (guestCart && guestCart.id && !guestCart.customer_id) {
              console.log('Guest cart found, transferring to customer:', guestCart.id);
              this.store.dispatch(new MedusaCartActions.TransferCart(guestCart.id));
            }
            
            // Register FCM token with customer ID
            this.registerFCMToken(res.customer.id);
            
            return of(res);
          }

          // Otherwise, fetch the customer details
          return this.medusaApi.getMedusaCustomer().pipe(
            take(1),
            tap((customerRes: any) => {
              if (customerRes.customer) {
                ctx.patchState({
                  customer: customerRes.customer,
                });
              }
            }),
            switchMap((customerRes: any) => {
              // After customer is fetched, check for guest cart and transfer it
              const cartState = this.store.selectSnapshot((state: any) => state.medusaCart);
              const guestCart = cartState?.medusaCart;
              
              // Check if there's a guest cart (cart without customer_id) that needs to be transferred
              if (guestCart && guestCart.id && !guestCart.customer_id) {
                console.log('Guest cart found, transferring to customer:', guestCart.id);
                // Transfer the guest cart to the customer
                this.store.dispatch(new MedusaCartActions.TransferCart(guestCart.id));
              }
              
              // Register FCM token with customer ID
              if (customerRes?.customer?.id) {
                this.registerFCMToken(customerRes.customer.id);
              }
              
              return of(customerRes || res);
            }),
            catchError(customerError => {
              console.error('Error getting customer after login:', customerError);
              return of(res);
            })
          );
        }
        return of(res);
      }),
      catchError(error => {
        console.error('Error during login:', error);
        ctx.patchState({
          access_token: '',
          isLoggedIn: false,
          customer: null
        });
        return throwError(() => error);
      })
    );
  }

  @Action(AuthActions.GetSession)
  getSession(ctx: StateContext<IAuthStateModel>): Observable<any> {
    const currentState = ctx.getState();
    const previousCustomerId = currentState.customer?.id;
    
    return this.medusaApi.getMedusaSession().pipe(
      take(1),
      tap((res: any) => {
        if (res.customer) {
          // Extract avatar from customer metadata (e.g., Google profile picture)
          const avatarUrl = (res.customer.metadata as any)?.picture ||
            (res.customer.metadata as any)?.avatar_url ||
            '';

          const newCustomerId = res.customer.id;
          
          // Clear orders if customer has changed (new login or different user)
          if (previousCustomerId && previousCustomerId !== newCustomerId) {
            this.store.dispatch(new OrdersActions.ClearOrders());
          }

          ctx.patchState({
            isLoggedIn: true,
            customer: res.customer,
            avatar: avatarUrl,
            // We keep the token if we have one, or clear it if we're relying on cookies.
            // If this is a session check, we might not get a new token.
            // access_token: '',
          });
        }
      }),
      catchError(error => {
        console.log('Session check failed (user likely not logged in):', error);
        ctx.patchState({
          isLoggedIn: false,
          customer: null,
          access_token: '',
        });
        return of(null);
      })
    );
  }

  @Action(AuthActions.AddACustomerAddress)
  addaShippingAddress(ctx: StateContext<IAuthStateModel>, { address }: AuthActions.AddACustomerAddress): Observable<any> {
    const state = ctx.getState();
    return this.medusaApi.addAddress(address).pipe(
      take(1),
      tap((res: any) => {
        ctx.patchState({
          ...state,
          customer: res.customer,
        });
      })
    );
  }

  @Action(AuthActions.UpdateCustomerAddress)
  updateCustomerAddress(ctx: StateContext<IAuthStateModel>, { addressId, address }: AuthActions.UpdateCustomerAddress): Observable<any> {
    const state = ctx.getState();
    return this.medusaApi.updateAddress(addressId, address).pipe(
      take(1),
      tap((res: any) => {
        ctx.patchState({
          ...state,
          customer: res.customer,
        });
      })
    );
  }

  @Action(AuthActions.DeleteCustomerAddress)
  deleteCustomerAddress(ctx: StateContext<IAuthStateModel>, { addressId }: AuthActions.DeleteCustomerAddress): Observable<any> {
    return this.medusaApi.deleteAddress(addressId).pipe(
      take(1),
      tap((res: any) => {
        // Medusa API returns { parent: customer } for delete operations
        // Handle both response formats for backward compatibility
        const customer = res?.parent || res?.customer;
        if (customer) {
          ctx.patchState({
            customer: customer,
          });
        }
      }),
      catchError(error => {
        console.error('Error deleting address:', error);
        // Still try to refresh customer data on error
        return this.medusaApi.getMedusaCustomer().pipe(
          take(1),
          tap((customerRes: any) => {
            if (customerRes.customer) {
              ctx.patchState({
                customer: customerRes.customer,
              });
            }
          }),
          catchError(refreshError => {
            console.error('Error refreshing customer after address delete:', refreshError);
            return of(null);
          })
        );
      })
    );
  }

  @Action(AuthActions.SetDefaultCustomerBillingAddress)
  setDefaultCustomerBillingAddress(ctx: StateContext<IAuthStateModel>, { addressId, value }: AuthActions.SetDefaultCustomerBillingAddress): Observable<any> {
    const state = ctx.getState();
    const data = {
      is_default_billing: value,
    }
    return this.medusaApi.updateDefaultAddress(addressId, data).pipe(
      take(1),
      tap((res: any) => {
        ctx.patchState({
          ...state,
          customer: res.customer,
        });
      })
    );
  }

  @Action(AuthActions.SetDefaultCustomerShippingAddress)
  setDefaultCustomerShippingAddress(ctx: StateContext<IAuthStateModel>, { addressId, value }: AuthActions.SetDefaultCustomerShippingAddress): Observable<any> {
    const state = ctx.getState();
    const data = {
      is_default_shipping: value,
    }
    return this.medusaApi.updateDefaultAddress(addressId, data).pipe(
      take(1),
      tap((res: any) => {
        ctx.patchState({
          ...state,
          customer: res.customer,
        });
      })
    );
  }

  @Action(AuthActions.LoginWithGoogle)
  LoginWithGoogle(ctx: StateContext<IAuthStateModel>): Observable<any> {
    return this.medusaApi.medusaLoginWithGoogle().pipe(
      take(1),
      tap((res: any) => {
        // The actual redirection to Google's OAuth happens outside the app
        console.log('Redirecting to Google OAuth:', res);
        ctx.patchState({
          location: res.location
        });
      }),
      catchError(error => {
        console.error('Error during Google login initiation:', error);
        return throwError(() => error);
      })
    );
  }

  @Action(AuthActions.ValidateGoogleCallback)
  validateGoogleCallback(ctx: StateContext<IAuthStateModel>, { code, state }: AuthActions.ValidateGoogleCallback): Observable<any> {
    return this.medusaApi.validateGoogleLoginCallback(code, state).pipe(
      take(1),
      switchMap((res: any) => {
        if (res.token) {
          // Save the token to state
          ctx.patchState({
            access_token: res.token.toString(),
            isLoggedIn: true,
          });

          const shouldCreateCustomer = (jwtDecode(JSON.stringify(res.token)) as { actor_id: string }).actor_id === ""
          ctx.patchState({
            shouldCreateCustomer: shouldCreateCustomer,
          });

          if (!shouldCreateCustomer) {
            // Get customer data using the token
            return this.medusaApi.getMedusaCustomer().pipe(
              take(1),
              tap((customerRes: any) => {
                if (customerRes.customer) {
                  // Extract avatar from customer metadata (Google profile picture)
                  const avatarUrl = (customerRes.customer.metadata as any)?.picture ||
                    (customerRes.customer.metadata as any)?.avatar_url ||
                    '';

                  ctx.patchState({
                    customer: customerRes.customer,
                    avatar: avatarUrl,
                  });
                }
              }),
              switchMap((customerRes: any) => {
                // After customer is fetched, check for guest cart and transfer it
                const cartState = this.store.selectSnapshot((state: any) => state.medusaCart);
                const guestCart = cartState?.medusaCart;
                
                // Check if there's a guest cart (cart without customer_id) that needs to be transferred
                if (guestCart && guestCart.id && !guestCart.customer_id) {
                  console.log('Guest cart found during Google login, transferring to customer:', guestCart.id);
                  // Transfer the guest cart to the customer
                  this.store.dispatch(new MedusaCartActions.TransferCart(guestCart.id));
                }
                
                // Register FCM token with customer ID
                if (customerRes?.customer?.id) {
                  this.registerFCMToken(customerRes.customer.id);
                }
                
                return of(customerRes || res);
              }),
              catchError(error => {
                console.error('Error getting customer after Google login:', error);
                return of(res);
              })
            );
          }
        }
        return of(res);
      }),
      catchError(error => {
        console.error('Error validating Google callback:', error);
        return throwError(() => error);
      })
    );
  }

  @Action(AuthActions.CreateGoogleUser)
  CreateGoogleUser(ctx: StateContext<IAuthStateModel>, { registerPayload, medusaAddress }: AuthActions.CreateGoogleUser): Observable<any> {
    return this.medusaApi.createMedusaCustomer(registerPayload).pipe(
      take(1),
      tap((res: any) => {
        if (res.customer) {
          ctx.patchState({
            customer: res.customer,
          });
          this.store.dispatch(new AuthActions.AddACustomerAddress(medusaAddress));
        }
      }),
      catchError(error => {
        console.error('Error creating Google user:', error);
        ctx.patchState({
          access_token: '',
          isLoggedIn: false,
        });
        return throwError(() => error);
      })
    );
  }

  @Action(AuthActions.UpdateCustomerDetails)
  updateCustomerDetails(ctx: StateContext<IAuthStateModel>, { payload }: AuthActions.UpdateCustomerDetails): Observable<any> {
    const state = ctx.getState();
    return this.medusaApi.updateCustomeDetails(payload).pipe(
      take(1),
      tap((res: any) => {
        ctx.patchState({
          ...state,
          customer: res.customer,
        });
      }),
      catchError(error => {
        console.error('Error updating customer details:', error);
        return throwError(() => error);
      })
    );
  }

  @Action(AuthActions.AuthLogout)
  authLogout(ctx: StateContext<IAuthStateModel>) {
    // Clear wishlist when user logs out (wishlists are customer-specific)
    this.store.dispatch(new WishlistActions.ClearWishlist());
    
    // Clear orders when user logs out (orders are customer-specific)
    this.store.dispatch(new OrdersActions.ClearOrders());
    
    return ctx.patchState({
      isLoggedIn: false,
      access_token: '',
      customer: null,
      avatar: null
    });
  }

  @Action(AuthActions.GetAvatar)
  getAvatar(ctx: StateContext<IAuthStateModel>) {
    return this.medusaApi.getAvatar().pipe(
      take(1),
      tap((res: any) => {
        const state = ctx.getState();
        ctx.patchState({
          ...state,
          avatar: res.data?.avatar_url || '',
        });
      }),
      catchError(error => {
        console.error('Error getting avatar:', error);
        const state = ctx.getState();
        ctx.patchState({
          ...state,
          avatar: '',
        });
        return of(null);
      })
    );
  }

  @Action(AuthActions.UploadAvatar)
  uploadAvatar(ctx: StateContext<IAuthStateModel>, { file }: AuthActions.UploadAvatar) {
    return this.medusaApi.uploadAvatar(file).pipe(
      take(1),
      tap((res: any) => {
        const state = ctx.getState();
        ctx.patchState({
          ...state,
          avatar: res.data.avatar_url,
        });
      })
    );
  }

  @Action(AuthActions.DeleteAvatar)
  deleteAvatar(ctx: StateContext<IAuthStateModel>) {
    return this.medusaApi.deleteAvatar().pipe(
      take(1),
      tap((res: any) => {
        const state = ctx.getState();
        ctx.patchState({
          ...state,
          avatar: null,
        });
      })
    );
  }

  /**
   * Register FCM token with customer ID
   */
  private registerFCMToken(customerId: string): void {
    // Get current token from FCM state
    const fcmState = this.store.selectSnapshot((state: any) => state.fcm);
    const token = fcmState?.token;
    
    if (token) {
      this.store.dispatch(new FCMActions.RegisterToken(token, customerId));
    } else {
      // If no token yet, initialize FCM which will register with customer ID
      this.store.dispatch(new FCMActions.Initialize(customerId));
    }
  }

  /**
   * Unregister FCM token on logout
   */
  private unregisterFCMToken(): void {
    this.store.dispatch(new FCMActions.UnregisterToken());
  }
}

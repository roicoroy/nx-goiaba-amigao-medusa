import { Injectable, inject } from '@angular/core';
import { HttpHeaders } from '@angular/common/http';
import { Observable, throwError, of } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';
import { Store } from '@ngxs/store';
import { BoughtTogetherItem, CreateReturnRequest, DeleteProdRespoonse, ICustomerDetails, ICustomerLoginData, MedusaAddress, MedusaCartResponse, MedusaCategory, MedusaCollection, MedusaCollectionsResponse, MedusaCustomer, MedusaLocale, MedusaLocalesResponse, MedusaOrderResponse, MedusaOrdersListResponse, MedusaProduct, MedusaProductsCategoriesResponse, MedusaProductsResponse, MedusaRegionListResponse, ReturnReason, ReturnResponse, ProductReviewResponse, CreateReviewPayload, MedusaProductReview } from '../interfaces';
import { RegisterPayload } from '../interfaces/auth.interface';
import { environment } from 'src/environments/environment';
import { IShippingOptionsResponse, ICalculatedShippingPrice, ICalculateShippingPriceRequest } from '../interfaces/shipping.interface';
import { BaseHttpService } from './base-http.service';
import { LanguageState } from 'src/app/store/language/language.state';

/**
 * MedusaService
 * 
 * Handles all Medusa API interactions.
 * 
 * NOTE: Headers (publishable key, auth token, content-type) are automatically
 * added by MedusaInterceptor. Global error handling is done by ErrorInterceptor.
 * This service focuses on Medusa-specific business logic.
 */
@Injectable({
  providedIn: 'root'
})
export class MedusaService extends BaseHttpService {
  protected baseUrl = environment.MEDUSA_API_BASE_PATH;
  private store = inject(Store);

  medusaLoginWithGoogle(): Observable<any> {
    return this.post(`/auth/customer/google`, {});
  }

  validateGoogleLoginCallback(code: string, state: string): Observable<any> {
    return this.post(`/auth/customer/google/callback?code=${code}&state=${state}`, {});
  }

  medusaAuthenticate() {
    return this.post('/store/customers', {});
  }

  medusaExists(email: string) {
    return this.get(`/store/auth/${email}`);
  }

  registerEmailPassword(payloadRegister: RegisterPayload) {
    const registerReq: ICustomerLoginData = {
      email: payloadRegister.email,
      password: payloadRegister.password,
    };
    // Don't include auth token for registration request (we don't have one yet)
    return this.post(`/auth/customer/emailpass/register`, registerReq);
  }

  loginEmailPassword(email: string, password?: string) {
    const loginReq: ICustomerLoginData = {
      email: email,
      password,
    };
    // Don't include auth token for login request (we don't have one yet)
    return this.post(`/auth/customer/emailpass`, loginReq);
  }

  createMedusaCustomer(payloadRegister: RegisterPayload) {
    return this.post('/store/customers', payloadRegister);
  }

  getMedusaCustomer() {
    // const url = `/store/customers/me?fields=*addresses`;
    return this.get<any>(`/store/customers/me`);
  }

  getMedusaSession(): Observable<any> {
    // Use /store/customers/me to check if the user is authenticated and get their details
    return this.get<any>(`/store/customers/me`).pipe(
      map((response: any) => {
        return { customer: response.customer };
      })
    );
  }

  getMedusaToken(email: string, password: string): Observable<any> {
    return this.post<any>(`/store/auth/token`, {
      "email": email,
      "password": password,
    });
  }

  refreshMedusaToken(): Observable<any> {
    return this.post<any>(`/auth/token/refresh`, {});
  }

  getTokenGetLoggedinCustomer(email: string, password: string) {
    return this.post(`/store/customers/me`, { "email": email, "password": password });
  }

  shippingOptions(cartId: string) {
    return this.get(`/store/shipping-options?cart_id=${cartId}`);
  }

  addShippingMethod(cartId: string, option_id: string): Observable<MedusaCartResponse> {
    // Request body should only include option_id
    // from_location is handled automatically by Medusa on the backend:
    // - Medusa resolves it from the fulfillment set associated with the shipping option
    // - The stock location linked to that fulfillment set
    // - That location's address
    // The frontend should NOT send from_location in the request body
    const data = {
      option_id: option_id
    };
    
    return this.post<MedusaCartResponse>(`/store/carts/${cartId}/shipping-methods`, data);
  }

  cartsRetrieve(cartId: string): Observable<MedusaCartResponse> {
    return this.get<MedusaCartResponse>(`/store/carts/${cartId}`);
  }

  cartsCreate(region_id: string, currency_code = 'usd'): Observable<MedusaCartResponse> {
    const locale = this.store.selectSnapshot(LanguageState.getMedusaLocale);
    const createCart: any = {
      region_id,
      currency_code,
    };
    
    // Include locale if available
    if (locale) {
      createCart.locale = locale;
    }
    
    return this.post<MedusaCartResponse>(`/store/carts`, createCart);
  }

  AddCartLineItems(cartId: string, data: { variant_id: string, quantity: number }): Observable<MedusaCartResponse> {
    return this.post<MedusaCartResponse>(`/store/carts/${cartId}/line-items/`, data);
  }

  updateCartLineItems(cartId: string, lineId: string, data: any): Observable<MedusaCartResponse> {
    return this.post<MedusaCartResponse>(`/store/carts/${cartId}/line-items/${lineId}`, data);
  }

  cartsLineItemsDelete(cartId: string, lineId: string) {
    return this.delete<DeleteProdRespoonse>(`/store/carts/${cartId}/line-items/${lineId}`);
  }

  cartsUpdate(cartId: string, data: any): Observable<MedusaCartResponse> {
    return this.post<MedusaCartResponse>(`/store/carts/${cartId}`, data);
  }

  /**
   * Transfer cart to authenticated customer
   * POST /store/carts/{cartId}/customer
   * 
   * Associates a guest cart with the logged-in customer using transferCartCustomerWorkflow.
   * This is the Medusa v2 Storefront API endpoint that uses the transferCartCustomerWorkflow
   * to transfer cart ownership from a guest to an authenticated customer.
   * 
   * The customer ID is automatically extracted from the Authorization token (Bearer token)
   * in the request headers. The request body is optional and only used for additional_data.
   * 
   * @see https://docs.medusajs.com/resources/references/medusa-workflows/transferCartCustomerWorkflow
   * @see https://docs.medusajs.com/api/store#carts_postcartsidcustomer
   * 
   * @param cartId - The cart ID to transfer
   * @param additionalData - Optional additional data to pass through
   * @returns Observable with the updated cart response
   */
  transferCart(cartId: string, additionalData?: Record<string, unknown>): Observable<MedusaCartResponse> {
    // Body is optional - customer ID comes from Authorization token
    const body = additionalData ? { additional_data: additionalData } : {};
    return this.post<MedusaCartResponse>(`/store/carts/${cartId}/customer`, body);
  }

  initializePaymentSessions(cartId: string): Observable<MedusaCartResponse> {
    return this.post<MedusaCartResponse>(`/store/carts/${cartId}/payment-sessions`, {});
  }

  setPaymentSession(cartId: string, provider_id: string) {
    return this.post(`/store/carts/${cartId}/payment-session`, {
      provider_id
    });
  }

  refreshPaymentSession(cartId: string, provider_id: string): Observable<any> {
    return this.post(`/store/carts/${cartId}/payment-sessions/${provider_id}/refresh`, null);
  }

  updatePaymentSession(cartId: string, provider_id: string): Observable<any> {
    const data = {}
    return this.post(`/store/carts/${cartId}/payment-sessions/${provider_id}`, data);
  }

  productsRetrieve(regionId?: string, queryParams?: any) {
    let url = `/store/products`;

    const params = {
      ...(regionId && { region_id: regionId }),
      ...queryParams
    };

    const searchParams = this.buildQueryString(params);
    if (searchParams) {
      url += `?${searchParams}`;
    }

    return this.get<MedusaProductsResponse>(url);
  }

  regionsList() {
    return this.get<MedusaRegionListResponse>(`/store/regions`);
  }

  regionsRetrieve(regionId: string) {
    return this.get(`/store/regions/${regionId}`);
  }

  /**
   * Get store/warehouse locations
   * NOTE: This requires a custom endpoint to be created in your Medusa backend
   * Example: GET /store/locations or GET /store/warehouses
   * 
   * PREFERRED METHOD: Extract location from shipping options response
   * According to Medusa docs, shipping options include location via:
   * service_zone -> fulfillment_set -> location -> address
   * See: https://docs.medusajs.com/api/store
   * 
   * This method is only needed if you want to fetch locations separately
   * from a custom endpoint.
   */
  getStoreLocations(): Observable<any> {
    // Try common endpoint names - adjust based on your custom endpoint
    return this.get<any>(`/store/locations`).pipe(
      catchError(() => {
        // If endpoint doesn't exist, return empty array
        console.warn('Store locations endpoint not found. You may need to create a custom endpoint.');
        return of({ locations: [] });
      })
    );
  }

  /**
   * Get default warehouse/store location for a region
   * 
   * PREFERRED METHOD: Extract location from shipping options response
   * The shipping options already include the location address, so you should
   * extract it from there instead of using this method.
   * 
   * This is a helper method that tries to get the default location
   * from a custom endpoint (if you've created one).
   */
  getDefaultStoreLocation(regionId?: string): Observable<any> {
    // First, try to get from custom store locations endpoint
    return this.getStoreLocations().pipe(
      map((response) => {
        if (response.locations && response.locations.length > 0) {
          // Return the first location or find one matching the region
          const location = regionId 
            ? response.locations.find((loc: any) => loc.region_id === regionId)
            : response.locations[0];
          return location || response.locations[0];
        }
        return null;
      }),
      catchError(() => of(null))
    );
  }

  getShippingOptions() {
    return this.get(`/store/shipping-options`);
  }

  ListOptionsForCart(cartId: string) {
    // Request service_zone data with fulfillment_set and location to get from_location.address
    // According to Medusa docs, the location address is available via:
    // service_zone -> fulfillment_set (singular) -> location -> address
    // Note: In Medusa v2, service_zone belongs to fulfillment_set (singular), not fulfillment_sets (plural)
    const fields = [
      '*service_zone',
      '*service_zone.fulfillment_set',
      '*service_zone.fulfillment_set.location',
      '*service_zone.fulfillment_set.location.address'
    ].join(',');
    
    return this.get<IShippingOptionsResponse>(`/store/shipping-options?cart_id=${cartId}&fields=${fields}`);
  }

  /**
   * Calculate price for a shipping option
   * POST /store/shipping-options/{id}/calculate
   * 
   * This endpoint calculates the price for shipping options with price_type='calculated'.
   * Used by fulfillment providers (e.g., UPS, FedEx) that need to call external APIs
   * to determine shipping costs based on cart contents and destination.
   * 
   * @see https://docs.medusajs.com/api/store#shipping-options_postshippingoptionsidcalculate
   * @see https://docs.medusajs.com/resources/references/medusa-workflows/calculateShippingOptionsPricesWorkflow
   * 
   * @param optionId - The shipping option ID to calculate price for
   * @param cartId - The cart ID containing items and shipping address
   * @param data - Optional custom data for the fulfillment provider (e.g., carrier_code, service_type)
   * @returns Observable with calculated price information
   */
  calculateShippingOptionPrice(
    optionId: string, 
    cartId: string, 
    data?: Record<string, unknown>
  ): Observable<ICalculatedShippingPrice> {
    const payload: ICalculateShippingPriceRequest = {
      cart_id: cartId,
      shipping_options: [
        {
          id: optionId,
          ...(data && { data })
        }
      ]
    };
    
    return this.post<ICalculatedShippingPrice>(
      `/store/shipping-options/${optionId}/calculate`, 
      payload
    );
  }

  /**
   * List customer addresses with pagination
   * GET /store/customers/me/addresses
   */
  listAddresses(limit = 20, offset = 0): Observable<ListAddressesResponse> {
    const params = this.buildQueryString({ limit, offset });
    return this.get<ListAddressesResponse>(`/store/customers/me/addresses${params ? `?${params}` : ''}`);
  }

  /**
   * Add a new customer address
   * POST /store/customers/me/addresses
   */
  addAddress(payload: any): Observable<AddressResponse> {
    const data = {
      first_name: payload?.first_name,
      last_name: payload?.last_name,
      address_1: payload?.address_1,
      address_2: payload?.address_2,
      city: payload?.city,
      country_code: payload?.country_code,
      postal_code: payload?.postal_code,
      phone: payload?.phone,
      province: payload?.province,
      company: payload?.company,
    }
    return this.post<AddressResponse>(`/store/customers/me/addresses`, data);
  }

  /**
   * Update a customer address
   * POST /store/customers/me/addresses/:address_id
   */
  updateAddress(addressId: string, address: any): Observable<AddressResponse> {
    return this.post<AddressResponse>(`/store/customers/me/addresses/${addressId}`, address);
  }

  /**
   * Delete a customer address
   * DELETE /store/customers/me/addresses/:address_id
   */
  deleteAddress(addressId: string): Observable<DeleteAddressResponse> {
    return this.delete<DeleteAddressResponse>(`/store/customers/me/addresses/${addressId}`);
  }

  getCategories(queryParams?: any) {
    let url = `/store/product-categories`;

    // Build query params, including image fields when available
    const params = {
      // Request image fields when API supports them
      // fields: 'id,name,handle,description,metadata,image',
      ...queryParams
    };

    const searchParams = this.buildQueryString(params);
    if (searchParams) {
      url += `?${searchParams}`;
    }

    return this.get<MedusaProductsCategoriesResponse>(url);
  }

  AddPromotionstoCart(cartId: string, promo_code: string) {
    const promo_codes = {
      promo_codes: [
        promo_code
      ]
    };
    return this.post<any>(`/store/carts/${cartId}/promotions`, promo_codes);
  }

  RemovePromotionstoCart(cartId: string, promo_codes?: string[]) {
    // If no promo codes provided, use default "GOIABA"
    const codes = promo_codes || ["GOIABA"];
    const body = {
      promo_codes: codes
    };
    // DELETE with body - some APIs require body for DELETE
    return this.post<any>(`/store/carts/${cartId}/promotions`, body);
  }

  getCategory(categoryId: string, queryParams?: any) {
    const params = {
      "category_id": [categoryId],
      ...queryParams
    };

    const searchParams = this.buildQueryString(params);
    const url = `/store/products?${searchParams}`;
    return this.get<MedusaProductsResponse>(url);
  }

  getCategoryWithDetails(categoryId: string, includeChildren = false, includeImage = true) {
    const searchParams = new URLSearchParams();

    // Build fields array for the request
    const fields: string[] = ['id', 'name', 'handle', 'description', 'metadata'];
    
    // Add image field when API supports it
    if (includeImage) {
      fields.push('image');
    }

    if (includeChildren) {
      fields.push('category_children.id', 'category_children.name', 'category_children.handle');
      if (includeImage) {
        fields.push('category_children.image');
      }
      searchParams.append("include_descendants_tree", "true");
    }

    searchParams.append("fields", fields.join(','));

    const url = `/store/product-categories/${categoryId}?${searchParams.toString()}`;
    return this.get<{ product_category: MedusaCategory }>(url);
  }

  getCategoryHandle(handle: string) {
    return this.get<MedusaProduct[]>(`/store/product-categories?handle=${handle}`);
  }

  getCollections(queryParams?: any) {
    let url = `/store/collections`;

    const params = {
      ...queryParams
    };

    const searchParams = this.buildQueryString(params);
    if (searchParams) {
      url += `?${searchParams}`;
    }

    return this.get<MedusaCollectionsResponse>(url).pipe(
      tap({
        next: (response) => {
          // Collections received
        },
        error: (err) => {
          console.error('[MedusaService] getCollections - Request failed:', {
            url,
            message: err?.message || err,
            userMessage: err?.userMessage,
            status: err?.status
          });
        }
      })
    );
  }

  getCollectionById(collectionId: string, queryParams?: any) {
    const searchParams = new URLSearchParams();
    
    if (queryParams) {
      Object.keys(queryParams).forEach(key => {
        if (queryParams[key] !== undefined && queryParams[key] !== null) {
          searchParams.append(key, queryParams[key]);
        }
      });
    }

    const queryString = searchParams.toString();
    const url = `/store/collections/${collectionId}${queryString ? `?${queryString}` : ''}`;
    return this.get<{ collection: MedusaCollection }>(url);
  }

  getCollectionProducts(collectionId: string, queryParams?: any) {
    const params = {
      collection_id: [collectionId],
      ...queryParams
    };

    const searchParams = this.buildQueryString(params);
    const url = `/store/products?${searchParams}`;
    return this.get<MedusaProductsResponse>(url).pipe(
      tap({
        next: (response) => {
          // Products received
        },
        error: (err) => {
          console.error('[MedusaService] getCollectionProducts - Error:', {
            collectionId,
            message: err?.message || err,
            userMessage: err?.userMessage,
            status: err?.status
          });
        }
      })
    );
  }

  medusaProductsList(regionId: string, queryParams?: any) {
    const params = {
      // Request full product data with all fields and nested relations
      // According to Medusa docs: https://docs.medusajs.com/resources/storefront-development/products/price
      // Use *variants.calculated_price at the start for prices, then *variants.* for all variant fields
      // Use *images.*, *options.*, *collection.*, *categories.* for nested relations
      // fields: `*variants.calculated_price,*variants.*,*images.*,*options.*,*collection.*,*categories.*,handle,thumbnail,title,description`,
      fields: `*variants.calculated_price`, // Only request calculated_price, let everything else come by default
      region_id: regionId,
      ...queryParams
    };

    const searchParams = this.buildQueryString(params);
    const url = `/store/products/?${searchParams}`;
    return this.get<MedusaProductsResponse>(url);
  }

  showProductVariantPrice(productId: string, regionId: string) {
    // Request full product data
    // NOTE: The fields parameter with *images.* causes images to return as null
    // Without fields parameter, the API returns all data including images correctly
    // We can request *variants.calculated_price for pricing without breaking images
    const queryParams = new URLSearchParams({
      fields: `*variants.calculated_price`, // Only request calculated_price, let everything else come by default
      // fields: `*variants.calculated_price,*variants.*,*images.*,*options.*,*collection.*,*categories.*,handle,thumbnail,title,description`,

      region_id: regionId,
    });

    const url = `/store/products/${productId}?${queryParams.toString()}`;
    return this.get<MedusaCategory>(url);
  }

  retriveCompletedOrder(orderId: string) {
    return this.get<MedusaOrderResponse>(`/store/orders/${orderId}`);
  }

  retriveOrdersList() {
    return this.get<MedusaOrdersListResponse>(`/store/orders/`);
  }

  getProductsBoughtTogether(productId: string): Observable<BoughtTogetherItem[]> {
    return this.get<BoughtTogetherItem[]>(`/store/products-bought-together/${productId}`);
  }

  completeMedusaCart(cartId: string) {
    return this.post<any>(`/store/carts/${cartId}/complete`, null);
  }

  updateCustomeDetails(payload: ICustomerDetails) {
    return this.post<object>(`/store/customers/me`, payload);
  }

  getAvatar() {
    return this.get<any>(`/store/customers/me/avatar`);
  }

  uploadAvatar(file: File) {
    const formData = new FormData();
    formData.append('avatar', file);

    // Interceptors will handle headers (publishable key, auth token)
    // MedusaInterceptor correctly handles FormData by not setting Content-Type
    return this.put<any>(`/store/customers/me/avatar`, formData);
  }

  deleteAvatar() {
    return this.delete<any>(`/store/customers/me/avatar`);
  }

  medusaLogout() {
    return this.delete('/store/auth');
  }

  // FCM (Firebase Cloud Messaging) API methods
  registerFCMDevice(payload: any) {
    return this.post<any>(`/store/fcm/register`, payload);
  }

  unregisterFCMDevice(token: string) {
    return this.delete<any>(`/store/fcm/unregister?token=${encodeURIComponent(token)}`);
  }

  updateDefaultAddress(addressId: string, data: any) {
    return this.post(`/store/customers/me/addresses/${addressId}`, data);
  }

  getCutomerAddress(addressId: string) {
    return this.get(`/store/customers/me/addresses/${addressId}`);
  }

  // Returns API methods
  createReturn(returnData: CreateReturnRequest) {
    return this.post<ReturnResponse>(`/store/returns`, returnData);
  }

  getReturn(returnId: string) {
    // For Medusa Store API, we need to get the return through orders
    // First get all orders, then find the one with the specific return
    return this.get<any>('/store/orders').pipe(
      map((response: any): ReturnResponse => {
        if (response.orders) {
          for (const order of response.orders) {
            if (order.returns) {
              const foundReturn = order.returns.find((ret: any) => ret.id === returnId);
              if (foundReturn) {
                return { return: foundReturn };
              }
            }
          }
        }
        throw new Error(`Return with ID ${returnId} not found`);
      })
    );
  }

  getReturns(limit?: number, offset?: number) {
    // For Medusa Store API, we need to get customer orders and extract returns from them
    // There's no direct /store/returns GET endpoint for listing customer returns
    const params = new URLSearchParams();
    if (limit) params.append('limit', limit.toString());
    if (offset) params.append('offset', offset.toString());

    // Get customer orders which may contain returns
    const url = `/store/orders${params.toString() ? `?${params.toString()}` : ''}`;
    return this.get<any>(url).pipe(
      map((response: any) => {
        // Extract returns from orders and attach order data
        const returns: any[] = [];
        if (response.orders) {
          response.orders.forEach((order: any) => {
            if (order.returns && order.returns.length > 0) {
              order.returns.forEach((returnItem: any) => {
                // Attach order data to return for display purposes
                returnItem.order = {
                  id: order.id,
                  display_id: order.display_id,
                  created_at: order.created_at,
                  currency_code: order.currency_code,
                  status: order.status
                };
                returns.push(returnItem);
              });
            }
          });
        }

        // Return in ReturnsListResponse format
        return {
          returns,
          count: returns.length,
          offset: offset || 0,
          limit: limit || returns.length
        };
      }),
      catchError((error) => {
        console.warn('Failed to get returns from orders, returning empty list:', error);
        // Return empty list if backend is not accessible
        return of({
          returns: [],
          count: 0,
          offset: offset || 0,
          limit: limit || 0
        });
      })
    );
  }

  getReturnReasons() {
    return this.get<{ return_reasons: ReturnReason[] }>(`/store/return-reasons`).pipe(
      catchError((error) => {
        console.warn('Failed to get return reasons, providing default reasons:', error);
        // Return default return reasons if backend is not accessible
        return of({
          return_reasons: [
            {
              id: 'defective',
              value: 'defective',
              label: 'Defective/Damaged',
              description: 'The item received was defective, damaged, or not working properly',
              parent_return_reason_id: undefined,
              parent_return_reason: undefined,
              return_reason_children: undefined,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
              deleted_at: undefined
            },
            {
              id: 'wrong_item',
              value: 'wrong_item',
              label: 'Wrong Item Received',
              description: 'Received a different item than what was ordered',
              parent_return_reason_id: undefined,
              parent_return_reason: undefined,
              return_reason_children: undefined,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
              deleted_at: undefined
            },
            {
              id: 'size_fit',
              value: 'size_fit',
              label: 'Size/Fit Issues',
              description: 'Item does not fit properly or size is incorrect',
              parent_return_reason_id: undefined,
              parent_return_reason: undefined,
              return_reason_children: undefined,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
              deleted_at: undefined
            },
            {
              id: 'not_as_described',
              value: 'not_as_described',
              label: 'Not as Described',
              description: 'Item does not match the description or images shown',
              parent_return_reason_id: undefined,
              parent_return_reason: undefined,
              return_reason_children: undefined,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
              deleted_at: undefined
            },
            {
              id: 'quality_issues',
              value: 'quality_issues',
              label: 'Quality Issues',
              description: 'Poor quality or craftsmanship of the item',
              parent_return_reason_id: undefined,
              parent_return_reason: undefined,
              return_reason_children: undefined,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
              deleted_at: undefined
            },
            {
              id: 'changed_mind',
              value: 'changed_mind',
              label: 'Changed Mind',
              description: 'No longer want or need the item',
              parent_return_reason_id: undefined,
              parent_return_reason: undefined,
              return_reason_children: undefined,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
              deleted_at: undefined
            },
            {
              id: 'other',
              value: 'other',
              label: 'Other Reason',
              description: 'Other reason not listed above',
              parent_return_reason_id: undefined,
              parent_return_reason: undefined,
              return_reason_children: undefined,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
              deleted_at: undefined
            }
          ]
        });
      })
    );
  }

  // Order completion methods
  completeOrder(orderId: string) {
    return this.post<any>(`/admin/orders/${orderId}/complete`, {});
  }

  capturePayment(paymentCollectionId: string) {
    return this.post<any>(`/admin/payment-collections/${paymentCollectionId}/capture`, {});
  }

  updateOrderStatus(orderId: string, status: string) {
    return this.post<any>(`/admin/orders/${orderId}`, { status });
  }

  getOrderForReturn(orderId: string) {
    return this.get<any>(`/store/orders/${orderId}`).pipe(
      map((response: any) => response.order),
      catchError((error) => {
        console.error('Failed to get order for return:', error);
        return throwError(() => error);
      })
    );
  }

  getReturnShippingOptions(cartId?: string) {
    if (!cartId) {
      return throwError(() => new Error('Cart ID is required for return shipping options'));
    }

    // Request service_zone data with fulfillment_set and location to get from_location.address
    // According to Medusa docs, the location address is available via:
    // service_zone -> fulfillment_set (singular) -> location -> address
    // Note: In Medusa v2, service_zone belongs to fulfillment_set (singular), not fulfillment_sets (plural)
    // This is required for the server's prepareFulfillmentData function to work correctly
    const fields = [
      '*service_zone',
      '*service_zone.fulfillment_set',
      '*service_zone.fulfillment_set.location',
      '*service_zone.fulfillment_set.location.address'
    ].join(',');

    // Use the correct Medusa API endpoint with is_return=true parameter and include service_zone fields
    return this.get<any>(`/store/shipping-options?cart_id=${cartId}&is_return=true&fields=${fields}`).pipe(
      map((response: any) => {
        // console.log('Return shipping options response:', response);
        return {
          shipping_options: response.shipping_options || []
        };
      }),
      catchError((error) => {
        console.error('Failed to get return shipping options:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Fetch supported locales from Medusa
   * GET /store/locales
   * @returns Observable of MedusaLocalesResponse
   */
  getLocales(): Observable<MedusaLocalesResponse> {
    const url = `/store/locales`;

    console.log('[MedusaService] getLocales - Making request to:', url);

    return this.get<MedusaLocalesResponse>(url).pipe(
      tap({
        next: (response) => {
          console.log('[MedusaService] getLocales - Response received:', {
            localesCount: response.locales?.length || 0,
            locales: response.locales?.map(l => ({ code: l.code, name: l.name }))
          });
        },
        error: (error) => {
          console.error('[MedusaService] getLocales - Request failed:', {
            url,
            error: error?.message || error,
            status: error?.status,
          });
        }
      })
    );
  }

  /**
   * Get product reviews for a specific product
   * GET /store/product-reviews?product_id={id}&limit={limit}&offset={offset}
   */
  getProductReviews(productId: string, limit = 20, offset = 0): Observable<ProductReviewResponse> {
    const params = this.buildQueryString({ product_id: productId, limit, offset });
    return this.get<ProductReviewResponse>(`/store/product-reviews${params ? `?${params}` : ''}`);
  }

  /**
   * Submit a new product review
   * POST /store/product-reviews
   */
  submitProductReview(payload: CreateReviewPayload): Observable<{ reviews: MedusaProductReview[] }> {
    return this.post<{ reviews: MedusaProductReview[] }>(`/store/product-reviews`, payload);
  }
}

/**
 * Address API Response Interfaces
 */
export interface ListAddressesResponse {
  addresses: MedusaAddress[];
  count: number;
}

export interface AddressResponse {
  customer: MedusaCustomer;
}

export interface DeleteAddressResponse {
  parent: MedusaCustomer;
}

export interface product_category {
  "id": any;
  "name": any;
  "handle": any;
  "mpath": any;
  "is_internal": any;
  "is_active": any;
  "category_children": any;
  "parent_category_id": any;
  "created_at": any;
  "updated_at": any;
  "metadata": any
}

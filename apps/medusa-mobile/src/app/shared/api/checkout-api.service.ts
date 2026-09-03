import { Injectable } from '@angular/core';
import { BaseHttpService, HttpOptions } from './base-http.service';
import { environment } from 'src/environments/environment';
import { Observable } from 'rxjs';

/**
 * CheckoutApiService
 * 
 * Handles all checkout-related API operations including payment collections,
 * payment sessions, and payment providers.
 * 
 * Extends BaseHttpService to use unified HTTP methods with error handling.
 */
@Injectable({
  providedIn: 'root'
})
export class CheckoutApiService extends BaseHttpService {
  // Using MEDUSA_API_BASE_PATH for consistency (same value as MEDUSA_BACKEND_URL)
  protected baseUrl = environment.MEDUSA_API_BASE_PATH;

  /**
   * Create payment collection for a cart
   * POST /store/payment-collections
   */
  createPaymentCollection(cartId: string): Observable<any> {
    const options: HttpOptions = { withCredentials: true };
    return this.post<any>('/store/payment-collections', { cart_id: cartId }, options);
  }

  /**
   * Get payment providers for a region
   * GET /store/payment-providers?region_id={regionId}
   */
  getPaymentProviders(regionId: string): Observable<any> {
    const options: HttpOptions = { withCredentials: true };
    return this.get<any>(`/store/payment-providers?region_id=${regionId}`, options);
  }

  /**
   * Create payment session for a payment collection
   * POST /store/payment-collections/{paymentCollectionId}/payment-sessions
   */
  createPaymentSession(paymentCollectionId: string, providerId: string): Observable<any> {
    const options: HttpOptions = { withCredentials: true };
    return this.post<any>(
      `/store/payment-collections/${paymentCollectionId}/payment-sessions`,
      { provider_id: providerId },
      options
    );
  }

  /**
   * Get cart with updated payment collection
   * GET /store/carts/{cartId}
   */
  getCart(cartId: string): Observable<any> {
    const options: HttpOptions = { withCredentials: true };
    return this.get<any>(`/store/carts/${cartId}`, options);
  }
}


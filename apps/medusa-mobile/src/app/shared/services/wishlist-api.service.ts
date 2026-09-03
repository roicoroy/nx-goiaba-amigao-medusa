import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { environment } from 'src/environments/environment';
import {
  WishlistResponse,
  SharedWishlistResponse,
  WishlistShareRequest
} from '../interfaces/wishlist.model';

@Injectable({
  providedIn: 'root'
})
export class WishlistApiService {
  private http = inject(HttpClient);
  private baseUrl = environment.MEDUSA_API_BASE_PATH;

  /**
   * Get customer's wishlist
   * GET /store/customers/me/wishlists
   */
  getWishlist(): Observable<WishlistResponse> {
    return this.http.get<WishlistResponse>(`${this.baseUrl}/store/customers/me/wishlists`)
      .pipe(
        catchError(this.handleError)
      );
  }

  /**
   * @deprecated This endpoint doesn't support POST. Wishlists are auto-created when adding items.
   * Use addItem() instead - the backend will auto-create the wishlist if it doesn't exist.
   * POST /store/customers/me/wishlists/items
   */
  // createWishlist() method removed - backend auto-creates wishlists when adding items

  /**
   * Add item to wishlist
   * POST /store/customers/me/wishlists/items
   * 
   * @param productId - The product ID (required, but not sent to backend)
   * @param productVariantId - The product variant ID (required, sent as variant_id)
   * @param quantity - The quantity (optional, defaults to 1, but not sent to backend)
   * 
   * Note: Backend expects { variant_id } format, not { productId, productVariantId, quantity }
   */
  addItem(productId: string, productVariantId: string, quantity = 1): Observable<WishlistResponse> {
    // Backend expects { variant_id }, not { productId, productVariantId, quantity }
    const request = {
      variant_id: productVariantId
    };

    return this.http.post<WishlistResponse>(`${this.baseUrl}/store/customers/me/wishlists/items`, request)
      .pipe(
        catchError(this.handleError)
      );
  }

  /**
   * Remove item from wishlist
   * DELETE /store/customers/me/wishlists/items/:id
   */
  removeItem(itemId: string): Observable<WishlistResponse> {
    return this.http.delete<WishlistResponse>(`${this.baseUrl}/store/customers/me/wishlists/items/${itemId}`)
      .pipe(
        catchError(this.handleError)
      );
  }

  /**
   * Generate share token for wishlist
   * POST /store/customers/me/wishlists/share
   */
  generateShareToken(wishlistId: string): Observable<{ token: string }> {
    const request: WishlistShareRequest = {
      wishlist_id: wishlistId
    };

    return this.http.post<{ token: string }>(`${this.baseUrl}/store/customers/me/wishlists/share`, request)
      .pipe(
        catchError(this.handleError)
      );
  }

  /**
   * Get shared wishlist using token
   * GET /store/wishlist/:token
   */
  getSharedWishlist(token: string): Observable<SharedWishlistResponse> {
    return this.http.get<SharedWishlistResponse>(`${this.baseUrl}/store/wishlist/${token}`)
      .pipe(
        catchError(this.handleError)
      );
  }

  /**
   * Handle HTTP errors
   */
  private handleError = (error: any): Observable<never> => {
    let errorMessage = 'An error occurred while processing your wishlist request';
    let isAlreadyInWishlist = false;

    // 404 for wishlist is expected business logic (no wishlist exists yet) - don't log as error
    if (error.status === 404) {
      errorMessage = 'Wishlist not found';
      // Don't log 404 errors - they're expected when wishlist doesn't exist
    } else if (error.status === 401) {
      errorMessage = 'Please log in to manage your wishlist';
      // Only log non-expected errors
      if (!environment.production) {
        console.warn('Wishlist API Error (401):', error.error?.message || 'Unauthorized');
      }
    } else if (error.status === 409 || error.status === 400) {
      // Handle both 409 (Conflict) and 400 (Bad Request) for duplicate items
      const apiMessage = error.error?.message || 
                        error.error?.error?.message || 
                        error.message || 
                        '';
      
      console.error('400/409 Error Details:', {
        apiMessage,
        errorType: error.error?.type,
        errorCode: error.error?.code,
        fullError: error.error
      });
      
      // Check for "already in wishlist" messages (case-insensitive, various phrasings)
      const lowerMessage = apiMessage.toLowerCase();
      if (lowerMessage.includes('already in wishlist') || 
          lowerMessage.includes('variant is already') ||
          lowerMessage.includes('already exists') ||
          lowerMessage.includes('is already in') ||
          lowerMessage.includes('duplicate')) {
        errorMessage = 'This item is already in your wishlist';
        isAlreadyInWishlist = true;
        console.log('✅ Detected "already in wishlist" - treating as info, not error');
      } else {
        // For 400 errors, show the actual API message
        errorMessage = apiMessage || 'Invalid request. Please check the item details.';
        // Don't set isAlreadyInWishlist to true for generic 400 errors
        isAlreadyInWishlist = false;
      }
    } else if (error.error?.message) {
      errorMessage = error.error.message;
    }

    return throwError(() => ({ 
      ...error, 
      userMessage: errorMessage,
      isAlreadyInWishlist 
    }));
  };
}

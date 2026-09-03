import { Injectable, inject } from '@angular/core';
import { Store } from '@ngxs/store';
import { Observable, of, throwError } from 'rxjs';
import { catchError, map, tap, distinctUntilChanged, shareReplay } from 'rxjs/operators';
import { AlertService } from '../alert/alert.service';
import { WishlistActions } from '../../store/wishlist/wishlist.actions';
import { WishlistState } from '../../store/wishlist/wishlist.state';
import { WishlistApiService } from './wishlist-api.service';
import { AuthState } from 'src/app/store/auth/auth.state';
import { MedusaCartActions } from 'src/app/store/medusa-cart/medusa-cart.actions';
import { MedusaProduct } from '../interfaces';
import { WishlistItem } from '../interfaces/wishlist.model';

@Injectable({
  providedIn: 'root'
})
export class WishlistService {
  private store = inject(Store);
  private alertService = inject(AlertService);

  private wishlistApiService = inject(WishlistApiService);

  // Use NGXS state for wishlist items
  public wishlistItems$ = this.store.select(WishlistState.getItems);
  public loading$ = this.store.select(WishlistState.getLoading);
  public error$ = this.store.select(WishlistState.getError);

  // Track pending operations to prevent duplicates
  private pendingOperations = new Set<string>();

  /**
   * Get wishlist items from state
   */
  getWishlistItems(): Observable<WishlistItem[]> {
    return this.wishlistItems$;
  }

  /**
   * Load wishlist from Medusa API
   */
  loadWishlist(): Observable<any> {
    const isLoggedIn = this.store.selectSnapshot(AuthState.isLoggedIn);

    if (!isLoggedIn) {
      this.store.dispatch(new WishlistActions.ClearWishlist());
      return of(null);
    }

    return this.store.dispatch(new WishlistActions.LoadWishlist()).pipe(
      catchError((error) => {
        console.error('❌ Failed to load wishlist:', error);
        return of(null);
      })
    );
  }



  /**
   * Add product to wishlist using Medusa API
   */
  addToWishlist(product: MedusaProduct, variantId?: string): Observable<boolean> {
    const isLoggedIn = this.store.selectSnapshot(AuthState.isLoggedIn);

    if (!isLoggedIn) {
      this.alertService.presentSimpleAlert('Please log in to add items to your wishlist');
      return of(false);
    }

    // Get variant ID - filter out null values
    if (!variantId) {
      const validVariants = product.variants?.filter(v => v !== null && v?.id) || [];
      if (validVariants.length > 0 && validVariants[0]?.id) {
        variantId = validVariants[0].id;
      }
    }

    if (!variantId) {
      this.alertService.presentSimpleAlert('No variant available for this product');
      return of(false);
    }

    // Create operation key to prevent duplicates
    const operationKey = `${product.id}_${variantId}`;

    // Check if operation is already pending
    if (this.pendingOperations.has(operationKey)) {
      console.log('Wishlist operation already pending for:', operationKey);
      return of(false);
    }

    // Mark operation as pending
    this.pendingOperations.add(operationKey);

    // Check if already in wishlist
    const currentItems = this.store.selectSnapshot(WishlistState.getItems);
    const existingItem = currentItems.find(item =>
      item.product_variant_id === variantId
    );

    if (existingItem) {
      this.pendingOperations.delete(operationKey);
      this.alertService.presentSimpleAlert('Product is already in your wishlist');
      return of(false);
    }

    // Add to wishlist via NGXS
    return this.store.dispatch(new WishlistActions.AddToWishlist(variantId, product)).pipe(
      map(() => {
        this.pendingOperations.delete(operationKey);
        this.clearWishlistCache();
        this.alertService.presentSimpleAlert('Product added to wishlist successfully!');
        return true;
      }),
      catchError((error) => {
        this.pendingOperations.delete(operationKey);
        console.error('Failed to add to wishlist:', error);
        this.alertService.presentSimpleAlert('Failed to add product to wishlist');
        return of(false);
      })
    );
  }

  /**
   * Remove product from wishlist using Medusa API
   */
  removeFromWishlist(productId: string, productVariantId: string): Observable<boolean> {
    const isLoggedIn = this.store.selectSnapshot(AuthState.isLoggedIn);

    if (!isLoggedIn) {
      this.alertService.presentSimpleAlert('Please log in to manage your wishlist');
      return of(false);
    }

    // Create operation key to prevent duplicates
    const operationKey = `remove_${productId}_${productVariantId}`;

    // Check if operation is already pending
    if (this.pendingOperations.has(operationKey)) {
      console.log('Remove wishlist operation already pending for:', operationKey);
      return of(false);
    }

    // Mark operation as pending
    this.pendingOperations.add(operationKey);

    // Find the wishlist item ID
    const currentItems = this.store.selectSnapshot(WishlistState.getItems);
    const item = currentItems.find(item =>
      item.product_variant_id === productVariantId
    );

    if (!item) {
      this.pendingOperations.delete(operationKey);
      this.alertService.presentSimpleAlert('Product not found in wishlist');
      return of(false);
    }

    const itemId = item.id;

    if (!itemId) {
      this.pendingOperations.delete(operationKey);
      this.alertService.presentSimpleAlert('Invalid wishlist item');
      return of(false);
    }

    // Remove from wishlist via NGXS
    return this.store.dispatch(new WishlistActions.RemoveFromWishlist(itemId)).pipe(
      map(() => {
        this.pendingOperations.delete(operationKey);
        this.clearWishlistCache();
        this.alertService.presentSimpleAlert('Product removed from wishlist successfully!');
        return true;
      }),
      catchError((error) => {
        this.pendingOperations.delete(operationKey);
        console.error('Failed to remove from wishlist:', error);
        this.alertService.presentSimpleAlert('Failed to remove product from wishlist');
        return of(false);
      })
    );
  }

  // Cache for wishlist checks to prevent infinite loops
  private wishlistCache = new Map<string, Observable<boolean>>();

  /**
   * Check if product variant is in wishlist
   */
  isInWishlist(productId: string, productVariantId?: string): Observable<boolean> {
    // Create a cache key
    const cacheKey = `${productId}${productVariantId ? `-${productVariantId}` : ''}`;

    // Return cached observable if it exists
    if (this.wishlistCache.has(cacheKey)) {
      return this.wishlistCache.get(cacheKey)!;
    }

    // Create new observable using items instead of products
    const observable = this.wishlistItems$.pipe(
      map(items => {
        if (productVariantId) {
          // Check for specific product + variant combination
          return items.some(item => item.product_variant_id === productVariantId);
        } else {
          // Fallback: check if any variant of this product is in wishlist
          return items.some(item =>
            item.product_variant?.product?.id === productId ||
            item.product?.id === productId
          );
        }
      }),
      distinctUntilChanged(), // Only emit when the result actually changes
      shareReplay(1) // Share the same observable instance
    );

    // Cache the observable
    this.wishlistCache.set(cacheKey, observable);

    return observable;
  }

  /**
   * Clear the wishlist cache (call when wishlist changes)
   */
  private clearWishlistCache(): void {
    this.wishlistCache.clear();
  }

  /**
   * Add wishlist item to cart
   */
  addWishlistItemToCart(wishlistItem: WishlistItem | any): void {
    // Use product_variant directly if available
    if (!wishlistItem.product_variant_id) {
      this.alertService.presentSimpleAlert('Unable to add product to cart: missing variant information');
      return;
    }

    // Use product_variant object directly if available
    const variant = wishlistItem.product_variant || {
      id: wishlistItem.product_variant_id,
      title: 'Product Variant',
      product_id: wishlistItem.product_variant?.product_id || ''
    };

    // Dispatch the cart action
    this.store.dispatch(new MedusaCartActions.AddToMedusaCart(variant));
    this.alertService.presentSimpleAlert('Product added to cart successfully!');
  }

  /**
   * Clear wishlist
   */
  clearWishlist(): void {
    this.store.dispatch(new WishlistActions.ClearWishlist());
    this.pendingOperations.clear();
    this.clearWishlistCache();
  }

  /**
   * Clear pending operations (useful for cleanup)
   */
  clearPendingOperations(): void {
    this.pendingOperations.clear();
  }




  /**
   * Generate share token for wishlist
   */
  generateShareToken(): Observable<string> {
    const isLoggedIn = this.store.selectSnapshot(AuthState.isLoggedIn);

    if (!isLoggedIn) {
      this.alertService.presentSimpleAlert('Please log in to share your wishlist');
      return throwError(() => new Error('Not logged in'));
    }

    // Get current wishlist to find the ID
    const currentWishlist = this.store.selectSnapshot(WishlistState.getWishlist);

    if (!currentWishlist?.id) {
      this.alertService.presentSimpleAlert('No wishlist found to share');
      return throwError(() => new Error('No wishlist found'));
    }

    // Generate share token using the API service directly
    return this.wishlistApiService.generateShareToken(currentWishlist.id).pipe(
      map(response => response.token),
      catchError(error => {
        console.error('Failed to generate share token:', error);
        this.alertService.presentSimpleAlert('Failed to generate share link');
        return throwError(() => error);
      })
    );
  }

  /**
   * Load shared wishlist using token
   */
  loadSharedWishlist(token: string): Observable<WishlistItem[]> {
    return this.wishlistApiService.getSharedWishlist(token).pipe(
      map(response => response.wishlist.items || []),
      catchError(error => {
        console.error('Failed to load shared wishlist:', error);
        this.alertService.presentSimpleAlert('Failed to load shared wishlist');
        return of([]);
      })
    );
  }
}

import { Injectable, inject } from '@angular/core';
import { Action, Selector, State, StateContext, Store } from '@ngxs/store';
import { Observable, catchError, tap, throwError, of } from 'rxjs';
import { WishlistActions } from './wishlist.actions';
import { WishlistApiService } from '../../shared/services/wishlist-api.service';
import { Wishlist, WishlistItem } from '../../shared/interfaces/wishlist.model';
import { MedusaCartActions } from '../medusa-cart/medusa-cart.actions';
import { AuthState } from '../auth/auth.state';

export interface WishlistStateModel {
  wishlist: Wishlist | null;
  items: WishlistItem[];
  selectedItem: WishlistItem | null;
  shareToken: string | null;
  sharedWishlist: Wishlist | null;
  loading: boolean;
  error: string | null;
  lastUpdated: string | null;
}

@State<WishlistStateModel>({
  name: 'wishlist',
  defaults: {
    wishlist: null,
    items: [],
    selectedItem: null,
    shareToken: null,
    sharedWishlist: null,
    loading: false,
    error: null,
    lastUpdated: null
  }
})
@Injectable()
export class WishlistState {
  private wishlistService = inject(WishlistApiService);
  private store = inject(Store);

  // Core selectors
  @Selector()
  static getWishlist(state: WishlistStateModel): Wishlist | null {
    return state?.wishlist || null;
  }

  @Selector()
  static getItems(state: WishlistStateModel): WishlistItem[] {
    return state?.items || [];
  }


  @Selector()
  static getSelectedItem(state: WishlistStateModel): WishlistItem | null {
    return state?.selectedItem || null;
  }

  @Selector()
  static getShareToken(state: WishlistStateModel): string | null {
    return state?.shareToken || null;
  }

  @Selector()
  static getSharedWishlist(state: WishlistStateModel): Wishlist | null {
    return state?.sharedWishlist || null;
  }

  @Selector()
  static getLoading(state: WishlistStateModel): boolean {
    return state?.loading || false;
  }

  @Selector()
  static getError(state: WishlistStateModel): string | null {
    return state?.error || null;
  }

  @Selector()
  static getLastUpdated(state: WishlistStateModel): string | null {
    return state?.lastUpdated || null;
  }

  // Computed selectors
  @Selector()
  static getItemCount(state: WishlistStateModel): number {
    return state?.items?.length || 0;
  }

  @Selector()
  static getWishlistId(state: WishlistStateModel): string | null {
    return state?.wishlist?.id || null;
  }

  @Selector()
  static hasItems(state: WishlistStateModel): boolean {
    return (state?.items?.length || 0) > 0;
  }

  @Selector()
  static isEmpty(state: WishlistStateModel): boolean {
    return (state?.items?.length || 0) === 0;
  }

  // Item-specific selectors
  @Selector()
  static getItemById(state: WishlistStateModel) {
    return (itemId: string): WishlistItem | null => {
      return state?.items?.find(item => item.id === itemId) || null;
    };
  }

  @Selector()
  static getItemByVariantId(state: WishlistStateModel) {
    return (variantId: string): WishlistItem | null => {
      return state?.items?.find(item => item.product_variant_id === variantId) || null;
    };
  }

  @Selector()
  static isItemInWishlist(state: WishlistStateModel) {
    return (variantId: string): boolean => {
      return Array.isArray(state.items) && state.items.some(item => item.product_variant_id === variantId);
    };
  }

  // Product-specific selectors
  @Selector()
  static getProductsWithImages(state: WishlistStateModel): (WishlistItem & { images: any[]; title: string; description: string; handle: string; thumbnail: string })[] {
    return state?.items?.map(item => ({
      ...item,
      images: item.product_variant?.product?.images || [],
      title: item.product_variant?.product?.title || 'Product',
      description: item.product_variant?.product?.description || '',
      handle: item.product_variant?.product?.handle || '',
      thumbnail: item.product_variant?.product?.thumbnail || item.product_variant?.product?.images?.[0]?.url || ''
    })) || [];
  }

  // READ Operations
  @Action(WishlistActions.LoadWishlist)
  loadWishlist(ctx: StateContext<WishlistStateModel>): Observable<any> {
    // Check authentication first (business logic)
    const isLoggedIn = this.store.selectSnapshot(AuthState.isLoggedIn);
    if (!isLoggedIn) {
      ctx.patchState({ loading: false, error: null });
      return throwError(() => ({ 
        message: 'User not logged in',
        status: 401,
        userMessage: 'Please log in to view your wishlist.'
      }));
    }

    ctx.patchState({ loading: true, error: null });

    return this.wishlistService.getWishlist().pipe(
      tap((response: any) => {
        ctx.dispatch(new WishlistActions.LoadWishlistSuccess(response.wishlist || response));
      }),
      catchError((error: any) => {
        // 404 is business logic: empty wishlist is valid - backend auto-creates on first item
        if (error.status === 404) {
          ctx.patchState({
            wishlist: null,
            items: [],
            loading: false,
            error: null
          });
          return of(null);
        }

        // Use error.userMessage from WishlistApiService.handleError
        const errorMessage = error.userMessage || error.message || 'Failed to load wishlist';
        ctx.dispatch(new WishlistActions.LoadWishlistFailure(errorMessage));
        return throwError(() => error);
      })
    );
  }

  @Action(WishlistActions.LoadWishlistSuccess)
  loadWishlistSuccess(ctx: StateContext<WishlistStateModel>, { wishlist }: WishlistActions.LoadWishlistSuccess): void {
    const items = wishlist?.items || [];

    ctx.patchState({
      wishlist,
      items,
      loading: false,
      error: null,
      lastUpdated: new Date().toISOString()
    });
  }

  @Action(WishlistActions.LoadWishlistFailure)
  loadWishlistFailure(ctx: StateContext<WishlistStateModel>, { error }: WishlistActions.LoadWishlistFailure): void {
    ctx.patchState({
      loading: false,
      error
    });
  }

  @Action(WishlistActions.GetWishlistItem)
  getWishlistItem(ctx: StateContext<WishlistStateModel>, { itemId }: WishlistActions.GetWishlistItem): void {
    const state = ctx.getState();
    const item = state.items.find(i => i.id === itemId);

    if (item) {
      ctx.dispatch(new WishlistActions.GetWishlistItemSuccess(item));
    } else {
      ctx.dispatch(new WishlistActions.GetWishlistItemFailure('Item not found'));
    }
  }

  @Action(WishlistActions.GetWishlistItemSuccess)
  getWishlistItemSuccess(ctx: StateContext<WishlistStateModel>, { item }: WishlistActions.GetWishlistItemSuccess): void {
    ctx.patchState({
      selectedItem: item
    });
  }

  @Action(WishlistActions.GetWishlistItemFailure)
  getWishlistItemFailure(ctx: StateContext<WishlistStateModel>, { error }: WishlistActions.GetWishlistItemFailure): void {
    ctx.patchState({
      error,
      selectedItem: null
    });
  }

  // CREATE Operations
  // NOTE: Wishlists are auto-created by the backend when adding items via POST /store/customers/me/wishlists/items
  // There is no explicit create endpoint - POST /store/customers/me/wishlists doesn't exist
  // CreateWishlist action removed - use AddToWishlist instead

  @Action(WishlistActions.AddToWishlist)
  addToWishlist(ctx: StateContext<WishlistStateModel>, { variantId, product }: WishlistActions.AddToWishlist): Observable<any> {
    const state = ctx.getState();

    // 1. Validate authentication (business logic)
    const isLoggedIn = this.store.selectSnapshot(AuthState.isLoggedIn);
    if (!isLoggedIn) {
      const errorMessage = 'Please log in to add items to your wishlist.';
      ctx.patchState({ loading: false, error: null });
      ctx.dispatch(new WishlistActions.AddToWishlistFailure(errorMessage));
      return throwError(() => ({ 
        message: errorMessage,
        status: 401,
        userMessage: errorMessage
      }));
    }

    // 2. Check if item already exists in current state (business logic)
    const existingItem = state.items.find(item => item.product_variant_id === variantId);
    if (existingItem) {
      const errorMessage = 'Item already in wishlist';
      ctx.dispatch(new WishlistActions.AddToWishlistFailure(errorMessage));
      return throwError(() => ({ 
        message: errorMessage,
        isAlreadyInWishlist: true,
        userMessage: 'This item is already in your wishlist.'
      }));
    }

    // 3. Validate product data (business logic)
    ctx.patchState({ loading: true, error: null });
    if (!product?.id) {
      const errorMessage = 'Product ID is required to add item to wishlist';
      ctx.dispatch(new WishlistActions.AddToWishlistFailure(errorMessage));
      return throwError(() => ({ message: errorMessage }));
    }

    // 4. Add item - backend will auto-create wishlist if it doesn't exist
    // HTTP errors are handled by ErrorInterceptor and WishlistApiService.handleError
    return this.wishlistService.addItem(product.id, variantId).pipe(
      tap((response: any) => {
        ctx.dispatch(new WishlistActions.AddToWishlistSuccess(response.wishlist || response));
      }),
      catchError((error: any) => {
        // Use error.userMessage from WishlistApiService.handleError
        // If item is already in wishlist (detected by API service), refresh wishlist state
        if (error.isAlreadyInWishlist) {
          ctx.dispatch(new WishlistActions.LoadWishlist());
        }
        
        const errorMessage = error.userMessage || error.message || 'Failed to add item to wishlist';
        ctx.dispatch(new WishlistActions.AddToWishlistFailure(errorMessage));
        return throwError(() => error);
      })
    );
  }


  @Action(WishlistActions.AddToWishlistSuccess)
  addToWishlistSuccess(ctx: StateContext<WishlistStateModel>, { wishlist }: WishlistActions.AddToWishlistSuccess): void {
    const items = wishlist?.items || [];

    ctx.patchState({
      wishlist,
      items,
      loading: false,
      error: null,
      lastUpdated: new Date().toISOString()
    });
  }

  @Action(WishlistActions.AddToWishlistFailure)
  addToWishlistFailure(ctx: StateContext<WishlistStateModel>, { error }: WishlistActions.AddToWishlistFailure): void {
    ctx.patchState({
      loading: false,
      error
    });
  }

  // UPDATE Operations
  @Action(WishlistActions.UpdateWishlistItem)
  updateWishlistItem(ctx: StateContext<WishlistStateModel>, { itemId, updates }: WishlistActions.UpdateWishlistItem): void {
    const state = ctx.getState();
    const itemIndex = state.items.findIndex(item => item.id === itemId);

    if (itemIndex === -1) {
      ctx.dispatch(new WishlistActions.UpdateWishlistItemFailure('Item not found'));
      return;
    }

    const updatedItems = [...state.items];
    updatedItems[itemIndex] = { ...updatedItems[itemIndex], ...updates };

    const updatedWishlist = state.wishlist ? {
      ...state.wishlist,
      items: updatedItems
    } : null;

    ctx.patchState({
      wishlist: updatedWishlist,
      items: updatedItems,
      lastUpdated: new Date().toISOString()
    });

    ctx.dispatch(new WishlistActions.UpdateWishlistItemSuccess(updatedWishlist!));
  }

  @Action(WishlistActions.UpdateWishlistItemSuccess)
  updateWishlistItemSuccess(ctx: StateContext<WishlistStateModel>, { wishlist }: WishlistActions.UpdateWishlistItemSuccess): void {
    // Already handled in the main action
  }

  @Action(WishlistActions.UpdateWishlistItemFailure)
  updateWishlistItemFailure(ctx: StateContext<WishlistStateModel>, { error }: WishlistActions.UpdateWishlistItemFailure): void {
    ctx.patchState({ error });
  }

  // DELETE Operations
  @Action(WishlistActions.RemoveFromWishlist)
  removeFromWishlist(ctx: StateContext<WishlistStateModel>, { itemId }: WishlistActions.RemoveFromWishlist): Observable<any> {
    // Check authentication first (business logic)
    const isLoggedIn = this.store.selectSnapshot(AuthState.isLoggedIn);
    if (!isLoggedIn) {
      const errorMessage = 'Please log in to remove items from your wishlist.';
      ctx.dispatch(new WishlistActions.RemoveFromWishlistFailure(errorMessage));
      return throwError(() => ({ 
        message: errorMessage,
        status: 401,
        userMessage: errorMessage
      }));
    }

    ctx.patchState({ loading: true, error: null });

    return this.wishlistService.removeItem(itemId).pipe(
      tap((response: any) => {
        ctx.dispatch(new WishlistActions.RemoveFromWishlistSuccess(response.wishlist || response));
      }),
      catchError((error: any) => {
        // Use error.userMessage from WishlistApiService.handleError
        const errorMessage = error.userMessage || error.message || 'Failed to remove item from wishlist';
        ctx.dispatch(new WishlistActions.RemoveFromWishlistFailure(errorMessage));
        return throwError(() => error);
      })
    );
  }

  @Action(WishlistActions.RemoveFromWishlistSuccess)
  removeFromWishlistSuccess(ctx: StateContext<WishlistStateModel>, { wishlist }: WishlistActions.RemoveFromWishlistSuccess): void {
    const items = wishlist?.items || [];

    ctx.patchState({
      wishlist,
      items,
      loading: false,
      error: null,
      lastUpdated: new Date().toISOString()
    });
  }

  @Action(WishlistActions.RemoveFromWishlistFailure)
  removeFromWishlistFailure(ctx: StateContext<WishlistStateModel>, { error }: WishlistActions.RemoveFromWishlistFailure): void {
    ctx.patchState({
      loading: false,
      error
    });
  }

  @Action(WishlistActions.ClearWishlist)
  clearWishlist(ctx: StateContext<WishlistStateModel>): void {
    ctx.patchState({
      wishlist: null,
      items: [],
      selectedItem: null,
      shareToken: null,
      sharedWishlist: null,
      loading: false,
      error: null,
      lastUpdated: null
    });
    ctx.dispatch(new WishlistActions.ClearWishlistSuccess());
  }

  @Action(WishlistActions.ClearWishlistSuccess)
  clearWishlistSuccess(ctx: StateContext<WishlistStateModel>): void {
    // Already handled in main action
  }

  @Action(WishlistActions.ClearWishlistFailure)
  clearWishlistFailure(ctx: StateContext<WishlistStateModel>, { error }: WishlistActions.ClearWishlistFailure): void {
    ctx.patchState({ error });
  }

  // SHARE Operations
  @Action(WishlistActions.ShareWishlist)
  shareWishlist(ctx: StateContext<WishlistStateModel>, { wishlistId }: WishlistActions.ShareWishlist): Observable<any> {
    // Check authentication first (business logic)
    const isLoggedIn = this.store.selectSnapshot(AuthState.isLoggedIn);
    if (!isLoggedIn) {
      const errorMessage = 'Please log in to share your wishlist.';
      ctx.patchState({ loading: false, error: errorMessage });
      ctx.dispatch(new WishlistActions.ShareWishlistFailure(errorMessage));
      return throwError(() => ({ 
        message: errorMessage,
        status: 401,
        userMessage: errorMessage
      }));
    }

    ctx.patchState({ loading: true, error: null });

    return this.wishlistService.generateShareToken(wishlistId).pipe(
      tap((response: any) => {
        ctx.dispatch(new WishlistActions.ShareWishlistSuccess(response.token));
      }),
      catchError((error: any) => {
        // Use error.userMessage from WishlistApiService.handleError
        const errorMessage = error.userMessage || error.message || 'Failed to share wishlist';
        ctx.dispatch(new WishlistActions.ShareWishlistFailure(errorMessage));
        return throwError(() => error);
      })
    );
  }

  @Action(WishlistActions.ShareWishlistSuccess)
  shareWishlistSuccess(ctx: StateContext<WishlistStateModel>, { token }: WishlistActions.ShareWishlistSuccess): void {
    ctx.patchState({
      shareToken: token,
      loading: false,
      error: null
    });
  }

  @Action(WishlistActions.ShareWishlistFailure)
  shareWishlistFailure(ctx: StateContext<WishlistStateModel>, { error }: WishlistActions.ShareWishlistFailure): void {
    ctx.patchState({
      loading: false,
      error
    });
  }

  @Action(WishlistActions.LoadSharedWishlist)
  loadSharedWishlist(ctx: StateContext<WishlistStateModel>, { token }: WishlistActions.LoadSharedWishlist): Observable<any> {
    ctx.patchState({ loading: true, error: null });

    return this.wishlistService.getSharedWishlist(token).pipe(
      tap((response: any) => {
        ctx.dispatch(new WishlistActions.LoadSharedWishlistSuccess(response.wishlist, response.token || token));
      }),
      catchError((error: any) => {
        ctx.dispatch(new WishlistActions.LoadSharedWishlistFailure(
          error.userMessage || error.message || 'Failed to load shared wishlist'
        ));
        return throwError(() => error);
      })
    );
  }

  @Action(WishlistActions.LoadSharedWishlistSuccess)
  loadSharedWishlistSuccess(ctx: StateContext<WishlistStateModel>, { wishlist, token }: WishlistActions.LoadSharedWishlistSuccess): void {
    ctx.patchState({
      sharedWishlist: wishlist,
      shareToken: token,
      loading: false,
      error: null
    });
  }

  @Action(WishlistActions.LoadSharedWishlistFailure)
  loadSharedWishlistFailure(ctx: StateContext<WishlistStateModel>, { error }: WishlistActions.LoadSharedWishlistFailure): void {
    ctx.patchState({
      loading: false,
      error
    });
  }

  // UTILITY Operations
  @Action(WishlistActions.SetLoading)
  setLoading(ctx: StateContext<WishlistStateModel>, { loading }: WishlistActions.SetLoading): void {
    ctx.patchState({ loading });
  }

  @Action(WishlistActions.SetError)
  setError(ctx: StateContext<WishlistStateModel>, { error }: WishlistActions.SetError): void {
    ctx.patchState({ error });
  }

  @Action(WishlistActions.ClearError)
  clearError(ctx: StateContext<WishlistStateModel>): void {
    ctx.patchState({ error: null });
  }

  // CART Integration
  @Action(WishlistActions.AddWishlistItemToCart)
  addWishlistItemToCart(ctx: StateContext<WishlistStateModel>, { item, quantity = 1 }: WishlistActions.AddWishlistItemToCart): void {
    try {
      // Use product_variant directly if available, otherwise create minimal variant object
      if (!item.product_variant_id) {
        ctx.dispatch(new WishlistActions.AddWishlistItemToCartFailure('Invalid wishlist item: missing variant ID'));
        return;
      }

      // Use product_variant object directly if available
      // Cast to MedusaVariant since we may not have all required fields, but the action handler accepts it
      let variant: any;
      if (item.product_variant) {
        variant = item.product_variant;
      } else {
        variant = {
          id: item.product_variant_id,
          title: 'Product Variant',
          product_id: item.product?.id || ''
        };
      }

      // Dispatch the cart action to add the item
      ctx.dispatch(new MedusaCartActions.AddToMedusaCart(variant as any)).subscribe({
        next: () => {
          ctx.dispatch(new WishlistActions.AddWishlistItemToCartSuccess(item));
        },
        error: (error) => {
          ctx.dispatch(new WishlistActions.AddWishlistItemToCartFailure(
            error?.message || 'Failed to add item to cart'
          ));
        }
      });
    } catch (error: any) {
      ctx.dispatch(new WishlistActions.AddWishlistItemToCartFailure(
        error?.message || 'Failed to prepare item for cart'
      ));
    }
  }

  @Action(WishlistActions.AddWishlistItemToCartSuccess)
  addWishlistItemToCartSuccess(ctx: StateContext<WishlistStateModel>, { item }: WishlistActions.AddWishlistItemToCartSuccess): void {
    // Could update some state to track which items were added to cart
  }

  @Action(WishlistActions.AddWishlistItemToCartFailure)
  addWishlistItemToCartFailure(ctx: StateContext<WishlistStateModel>, { error }: WishlistActions.AddWishlistItemToCartFailure): void {
    ctx.patchState({ error });
  }

}

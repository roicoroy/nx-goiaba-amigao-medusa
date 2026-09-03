import { Injectable, inject } from '@angular/core';
import { Store } from '@ngxs/store';
import { WishlistService } from '../services/wishlist.service';
import { AppFacade } from '../../store/app.facade';
import { AuthState } from 'src/app/store/auth/auth.state';
import { ProductsActions } from 'src/app/store/products/products.actions';
import { CategoriesActions } from 'src/app/store/categories/categories.actions';
import { RegionsActions } from 'src/app/store/regions/regions.actions';
import { MedusaCartActions } from '../../store/medusa-cart/medusa-cart.actions';
import { FCMActions } from '../../store/fcm/fcm.actions';

@Injectable({
  providedIn: 'root'
})
export class MedusaStartService {
  private store = inject(Store);
  private wishlistService = inject(WishlistService);
  private appFacade = inject(AppFacade);

  /**
   * Initialize Medusa app - loads essential data on app startup
   * Order matters: Regions → Products/Categories → Cart → Wishlist → FCM
   */
  medusaInit(): void {
    // Initialize FCM (can work without user login)
    // this.store.dispatch(new FCMActions.Initialize());

    // Load regions first (required for products and cart)
    this.store.dispatch(new RegionsActions.GetCountries());

    // Load products and categories (GetProductsId will fallback to GetProducts if no region)
    this.store.dispatch(new ProductsActions.GetProductsId());
    this.store.dispatch(new CategoriesActions.GetCategories());

    // Restore cart from persisted state (NGXS storage)
    // Small delay to ensure state is hydrated from storage
    setTimeout(() => {
      this.store.dispatch(new MedusaCartActions.RestoreCart());
      
      // Set up automatic cart region synchronization after cart is restored
      // Auto-sync will handle initial sync and ongoing updates
      this.appFacade.setupAutoCartRegionSync();
    }, 500);

    // Load wishlist if user is logged in
    // const isLoggedIn = this.store.selectSnapshot(AuthState.isLoggedIn);
    // if (isLoggedIn) {
    //   this.wishlistService.loadWishlist();
    // }
  }
}

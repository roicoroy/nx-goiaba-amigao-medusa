import { Injectable, inject } from '@angular/core';
import { Store } from '@ngxs/store';
import { Observable, combineLatest } from 'rxjs';
import { map, take } from 'rxjs/operators';
import { ThemeState } from './theme/theme.state';
import { AuthState } from './auth/auth.state';
import { AuthActions } from './auth/auth.actions';
import { ProductsState } from './products/products.state';
import { CategoriesState } from './categories/categories.state';
import { RegionsState } from './regions/regions.state';
import { MedusaCartState } from './medusa-cart/medusa-cart.state';
import { MedusaCartActions } from './medusa-cart/medusa-cart.actions';
import { CheckoutState } from './checkout/checkout.state';
import { MedusaProduct, NewCountryListModel, MedusaCustomer, MedusaCategory, MedusaCart } from '../shared/interfaces';

export interface IAppFacadeState {
  isDarkMode: boolean,
  isLoggedIn: boolean,
  token: string;
  products: MedusaProduct[];
  defaultRegions: NewCountryListModel;
  customer: MedusaCustomer | null,
  avatar: any,
  region_list: NewCountryListModel[];
  productsCategories: MedusaCategory[];
  selectedCategory: any;
  selectedProduct: MedusaProduct
}

@Injectable({
  providedIn: 'root'
})
export class AppFacade {
  private store = inject(Store);

  isDarkMode$: Observable<boolean> = this.store.select(ThemeState.isDarkMode);

  isLoggedIn$: Observable<boolean> = this.store.select(AuthState.isLoggedIn);

  token$: Observable<string> = this.store.select(AuthState.getToken);

  avatar$: Observable<string | null> = this.store.select(AuthState.getAvatar);

  products$: Observable<MedusaProduct[]> = this.store.select(ProductsState.getProductList);

  productsCategories$: Observable<MedusaCategory[]> = this.store.select(CategoriesState.getCategories);

  selectedCategory$: Observable<any[]> = this.store.select(ProductsState.getSelectedCategory);

  defaultRegions$: Observable<NewCountryListModel> = this.store.select(RegionsState.getDefaultRegion);

  secret_key$: Observable<string> = this.store.select(CheckoutState.getSecretKey);

  customer$: Observable<MedusaCustomer | null> = this.store.select(AuthState.getCustomer);

  region_list$: Observable<NewCountryListModel[]> = this.store.select(RegionsState.getRegionList);

  selectedProduct$: Observable<MedusaProduct> = this.store.select(ProductsState.getSelectedProduct);

  cart$: Observable<MedusaCart | null> = this.store.select(MedusaCartState.getMedusaCart);

  cartLoading$: Observable<boolean> = this.store.select(MedusaCartState.getLoading);

  cartError$: Observable<string | null> = this.store.select(MedusaCartState.getError);

  readonly viewState$: Observable<IAppFacadeState>;
  //
  constructor() {
    this.viewState$ = combineLatest(
      [
        this.isDarkMode$,
        this.isLoggedIn$,
        this.token$,
        this.products$,
        this.defaultRegions$,
        this.customer$,
        this.avatar$,
        this.region_list$,
        this.productsCategories$,
        this.selectedCategory$,
        this.selectedProduct$
      ]
    ).pipe(
      map((
        [
          isDarkMode,
          isLoggedIn,
          token,
          products,
          defaultRegions,
          customer,
          avatar,
          region_list,
          productsCategories,
          selectedCategory,
          selectedProduct
        ]
      ) => ({
        isDarkMode,
        isLoggedIn,
        token,
        products,
        defaultRegions,
        customer,
        avatar,
        region_list,
        productsCategories,
        selectedCategory,
        selectedProduct
      }))
    );
  }

  // Avatar actions
  loadAvatar(): void {
    this.store.dispatch(new AuthActions.GetAvatar());
  }

  uploadAvatar(file: File): void {
    this.store.dispatch(new AuthActions.UploadAvatar(file));
  }

  deleteAvatar(): void {
    this.store.dispatch(new AuthActions.DeleteAvatar());
  }

  // Helper method for converting image path to file
  async convertImagePathToFile(imagePath: string, filename = 'avatar.jpg'): Promise<File> {
    try {
      let blob: Blob;

      if (imagePath.startsWith('data:')) {
        // Handle data URL (from file picker) - convert directly without fetch to avoid CSP violations
        const base64Data = imagePath.split(',')[1];
        const mimeMatch = imagePath.match(/data:([^;]+);base64/);
        const mimeType = mimeMatch ? mimeMatch[1] : 'image/jpeg';
        
        // Convert base64 to binary
        const binaryString = atob(base64Data);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }
        
        blob = new Blob([bytes], { type: mimeType });
      } else {
        // Handle regular URL (from camera/filesystem)
        const response = await fetch(imagePath);
        blob = await response.blob();
      }

      return new File([blob], filename, { type: blob.type || 'image/jpeg' });
    } catch (error) {
      console.error('Error converting image to file:', error);
      throw error;
    }
  }

  // Cart region synchronization methods
  syncCartWithRegion(): void {
    combineLatest([
      this.cart$,
      this.defaultRegions$
    ]).pipe(take(1)).subscribe(([cart, defaultRegion]) => {
      if (cart && defaultRegion && cart.region_id !== defaultRegion.region_id) {
        this.store.dispatch(new MedusaCartActions.UpdateCartRegion(defaultRegion.region_id));
      }
    });
  }

  checkCartRegionSync(): Observable<boolean> {
    return combineLatest([
      this.cart$,
      this.defaultRegions$
    ]).pipe(
      map(([cart, defaultRegion]) => {
        if (!cart || !defaultRegion) return true; // No sync needed if either is missing
        return cart.region_id === defaultRegion.region_id;
      })
    );
  }

  // Set up automatic cart region synchronization
  setupAutoCartRegionSync(): void {
    combineLatest([
      this.cart$,
      this.defaultRegions$
    ]).subscribe(([cart, defaultRegion]) => {
      if (cart && defaultRegion && cart.region_id !== defaultRegion.region_id) {
        // console.log('🔄 Auto-syncing cart region due to region change');
        this.store.dispatch(new MedusaCartActions.UpdateCartRegion(defaultRegion.region_id));
      }
    });
  }

  // Manual cart region sync for testing/debugging
  forceCartRegionSync(): void {
    // console.log('🔧 Force syncing cart region...');
    this.syncCartWithRegion();
  }
}

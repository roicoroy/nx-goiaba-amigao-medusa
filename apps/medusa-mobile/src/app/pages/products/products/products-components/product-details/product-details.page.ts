import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { Observable, Subject, takeUntil, take, of } from 'rxjs';
import { Store } from '@ngxs/store';
import { CommonModule } from '@angular/common';
import { IonContent, IonGrid, IonRow, IonCol } from '@ionic/angular/standalone';
import { RouterModule } from '@angular/router';
import { ActivatedRoute } from '@angular/router';
import { Location } from '@angular/common';
import { SharedModule } from 'src/app/shared';
import { MedusaProductDetailsWrapperComponent } from './medusa-product-details-wrapper/medusa-product-details-wrapper.component';
import { IAppFacadeState, AppFacade } from 'src/app/store/app.facade';
import { LoadingService } from 'src/app/shared/loading/loading.service';
import { GoiabaHeaderComponent } from 'src/app/components/goiaba-components';
import { finalize } from 'rxjs/operators';
import { WishlistService } from 'src/app/shared/services/wishlist.service';
import { MedusaProduct } from 'src/app/shared/interfaces';
import { AuthState } from 'src/app/store/auth/auth.state';
import { ProductsActions } from 'src/app/store/products/products.actions';
import { WishlistActions } from 'src/app/store/wishlist/wishlist.actions';
import { ImageModalService } from 'src/app/components/image-modal/image-modal.service';
import { BoughtTogetherComponent } from '../bought-together/bought-together.component';
import { ProductReviewsComponent } from '../product-reviews/product-reviews.component';


@Component({
  selector: 'app-product-details',
  templateUrl: './product-details.page.html',
  styleUrls: ['./product-details.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    IonContent,
    IonGrid,
    IonRow,
    IonCol,
    SharedModule,
    MedusaProductDetailsWrapperComponent,
    GoiabaHeaderComponent,
    BoughtTogetherComponent,
    ProductReviewsComponent
]
})
export class ProductDetailsPage implements OnDestroy, OnInit {

  private store = inject(Store);
  private _location = inject(Location);
  private activatedRoute = inject(ActivatedRoute);
  private wishlistService = inject(WishlistService);
  private imageModalService = inject(ImageModalService);

  private loading = inject(LoadingService);

  private readonly ngUnsubscribe = new Subject();
  private prodId!: string;

  activeImg!: string;

  selectedProd!: MedusaProduct;

  viewState$: Observable<IAppFacadeState>;
  private facade = inject(AppFacade);

  // Track wishlist operations to prevent double-clicks
  private isProcessingWishlist = false;

  // Wishlist state observables - track selected variant
  isInWishlist$: Observable<boolean> = of(false);
  private selectedVariantId: string | null = null;

  constructor() {
    this.viewState$ = this.facade.viewState$;
    this.viewState$
      .pipe(takeUntil(this.ngUnsubscribe))
      .subscribe((vs) => {
        this.selectedProd = vs.selectedProduct;
        // Filter out null values from images array (API can return [null])
        const validImages = this.selectedProd?.images?.filter(img => img !== null && img?.url) || [];
        if (validImages.length > 0 && validImages[0]?.url) {
          this.activeImg = validImages[0].url;
          this.handleImageActive(this.activeImg);
        }

        // Update wishlist state when product changes
        this.updateWishlistState();
      });
  }

  async ngOnInit() {
    await this.loading.presentLoading();

    // Get product ID from route parameter
    const routeParam = this.activatedRoute.snapshot.paramMap.get('id');

    if (routeParam) {
      // Check if route parameter looks like a handle (not a product ID format)
      // Product IDs in Medusa v2 have format: prod_xxxxxxxxxxxxx
      // If it doesn't match product ID format, it might be a handle - need to resolve it first
      const isProductId = /^prod_[a-zA-Z0-9]+$/i.test(routeParam);
      
      if (isProductId) {
        // Route format: /products/:id (with actual product ID)
        this.prodId = routeParam;
        this.store.dispatch(new ProductsActions.GetSingleProduct(this.prodId));
      } else {
        // Route parameter looks like a handle - resolve to product ID first
        // Handle-based queries return null arrays for images/options/categories
        // So we need to get the product ID first, then fetch full data
        this.store.dispatch(new ProductsActions.GetSingleProductByHandle(routeParam));
      }

      // Check for variant query parameter
      this.activatedRoute.queryParams
        .pipe(take(1))
        .subscribe((queryParams: any) => {
          const variantId = queryParams['variant'];
          if (variantId) {
            // TODO: Implement variant pre-selection if needed
          }
        });
    } else {
      // Legacy route format: /product-details?productId=...
      this.activatedRoute.queryParams
        .pipe(take(1))
        .subscribe((params: any) => {
          const queryProductId = params['productId'];
          if (queryProductId) {
            this.prodId = queryProductId;
            this.store.dispatch(new ProductsActions.GetSingleProduct(this.prodId));
          }
        });
    }

    this.loading.dismissLoading();
  }

  handleImageActive(url: string | any) {
    this.activeImg = '';
    this.activeImg = url;
  }

  getMainImageUrl(product: MedusaProduct | null | undefined): string {
    if (this.activeImg) {
      return this.activeImg;
    }
    if (product?.thumbnail) {
      return product.thumbnail;
    }
    // Filter out null values from images array (API can return [null])
    const validImages = product?.images?.filter(img => img !== null && img?.url) || [];
    if (validImages.length > 0 && validImages[0]?.url) {
      return validImages[0].url;
    }
    return '';
  }

  openImage(imageUrl: string) {
    if (imageUrl) {
      this.imageModalService.openImageModal(imageUrl);
    }
  }

  navigateBack() {
    this._location.back();
  }

  addToWishlist(variantId: string) {
    if (!this.selectedProd || this.isProcessingWishlist || !variantId) {
      return;
    }

    // Update selected variant
    this.selectedVariantId = variantId;

    // Check if user is logged in
    const isLoggedIn = this.store.selectSnapshot(AuthState.isLoggedIn);

    if (!isLoggedIn) {
      // Ionic alert will be shown by the state management
      return;
    }

    this.isProcessingWishlist = true;

    // Use the variant ID passed from the component (selected variant)
    // Use state management - it will handle wishlist creation if needed
    // Ionic alerts are handled by the state management
    this.store.dispatch(new WishlistActions.AddToWishlist(variantId, this.selectedProd))
      .pipe(
        takeUntil(this.ngUnsubscribe),
        finalize(() => {
          this.isProcessingWishlist = false;
          // Update wishlist state after operation completes
          this.updateWishlistState();
        })
      )
      .subscribe({
        next: () => {
          // Wishlist action dispatched successfully
        },
        error: () => {
          // The WishlistState will handle showing the appropriate Ionic alert.
        }
      });
  }

  private updateWishlistState(): void {
    if (this.selectedProd) {
      // Use selected variant if available, otherwise use first variant
      const variantId = this.selectedVariantId || this.selectedProd.variants?.[0]?.id;
      if (variantId) {
        this.isInWishlist$ = this.wishlistService.isInWishlist(this.selectedProd.id, variantId);
      } else {
        this.isInWishlist$ = of(false);
      }
    } else {
      this.isInWishlist$ = of(false);
    }
  }

  // Update selected variant when it changes
  onVariantSelected(variantId: string): void {
    this.selectedVariantId = variantId;
    this.updateWishlistState();
  }

  // Helper method to get valid images (filter out null values)
  getValidImages(product: MedusaProduct | null | undefined): any[] {
    if (!product) return [];
    
    // Start with valid images from the images array (filter out nulls)
    const validImages = product.images?.filter((img): img is NonNullable<typeof img> => img !== null && !!img?.url) || [];
    
    // If we have a thumbnail and it's not already in the images array, add it
    if (product.thumbnail) {
      const thumbnailInImages = validImages.some(img => img.url === product.thumbnail);
      if (!thumbnailInImages) {
        // Add thumbnail as the first image if it's not already in the array
        return [{ url: product.thumbnail, id: 'thumbnail' }, ...validImages];
      }
    }
    
    return validImages;
  }

  ngOnDestroy(): void {
    this.store.dispatch(new ProductsActions.clearSelectedProduct());
    this.ngUnsubscribe.next(null);
    this.ngUnsubscribe.complete();
  }
}

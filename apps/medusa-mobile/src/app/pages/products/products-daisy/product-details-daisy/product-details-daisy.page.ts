import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule, KeyValuePipe } from '@angular/common';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { Location } from '@angular/common';
import { IonContent, IonIcon, IonSpinner, IonText } from '@ionic/angular/standalone';
import { Observable, Subject, combineLatest, of } from 'rxjs';
import { takeUntil, take, map, startWith, finalize } from 'rxjs/operators';
import { Store } from '@ngxs/store';

import { MedusaProduct, MedusaProductVariant } from 'src/app/shared/interfaces';
import { WishlistService } from 'src/app/shared';
import { MedusaCurrency } from 'src/app/shared/pipes/medusa-currency/medusa-currency.pipe';
import { AppFacade, IAppFacadeState } from 'src/app/store/app.facade';
import { ProductsActions } from 'src/app/store/products/products.actions';
import { MedusaCartActions } from 'src/app/store/medusa-cart/medusa-cart.actions';
import { WishlistActions } from 'src/app/store/wishlist/wishlist.actions';
import { AuthState } from 'src/app/store/auth/auth.state';
import { GoiabaHeaderComponent } from 'src/app/components/goiaba-components/goiaba-header/goiaba-header.component';
import { GoiabaReviewComponent } from 'src/app/components/goiaba-components/goiaba-review/goiaba-review.component';
import { Product3DViewerComponent } from 'src/app/components/goiaba-components/product-3d-viewer/product-3d-viewer.component';
import { ImageModalService } from 'src/app/components/image-modal/image-modal.service';
import { LoadingService } from 'src/app/shared/loading/loading.service';

@Component({
  selector: 'app-product-details-daisy',
  templateUrl: './product-details-daisy.page.html',
  styleUrls: ['./product-details-daisy.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    IonContent,
    IonIcon,
    IonSpinner,
    GoiabaHeaderComponent,
    GoiabaReviewComponent,
    Product3DViewerComponent,
    MedusaCurrency,
    KeyValuePipe
  ]
})
export class ProductDetailsDaisyPage implements OnInit, OnDestroy {
  private readonly ngUnsubscribe = new Subject();

  // Services
  private facade = inject(AppFacade);
  private wishlistService = inject(WishlistService);
  private router = inject(Router);
  private store = inject(Store);
  private activatedRoute = inject(ActivatedRoute);
  private location = inject(Location);
  private imageModalService = inject(ImageModalService);
  private loadingService = inject(LoadingService);

  // View state
  viewState$: Observable<IAppFacadeState> = this.facade.viewState$;

  // Product data
  product: MedusaProduct | null = null;
  loading = true;
  error: string | null = null;

  // Computed properties to avoid method calls in template
  validImages: any[] = [];
  mainImageUrl = '';
  hasProductVariants = false;
  productPrice = 0;
  originalPrice = 0;
  currentPrice = 0;
  hasProductDiscount = false;

  // Image carousel state
  activeImageIndex = 0;

  // Variant selection
  selectedVariantId: string | null = null;

  // Wishlist state for variants
  variantsWithWishlistStatus$: Observable<Array<MedusaProductVariant & { isInWishlist: boolean }>> = of([]);

  // Track processing states
  private isProcessingWishlist = false;
  isAddingToCart = false;

  async ngOnInit() {
    await this.loadingService.presentLoading();

    // Get product ID from route parameter
    const routeParam = this.activatedRoute.snapshot.paramMap.get('id');

    if (routeParam) {
      // Check if route parameter looks like a product ID
      const isProductId = /^prod_[a-zA-Z0-9]+$/i.test(routeParam);

      if (isProductId) {
        this.store.dispatch(new ProductsActions.GetSingleProduct(routeParam));
      } else {
        // Route parameter looks like a handle
        this.store.dispatch(new ProductsActions.GetSingleProductByHandle(routeParam));
      }

      // Check for variant query parameter
      this.activatedRoute.queryParams
        .pipe(take(1))
        .subscribe((queryParams: any) => {
          const variantId = queryParams['variant'];
          if (variantId) {
            this.selectedVariantId = variantId;
          }
        });
    } else {
      // Legacy route format: /product-details?productId=...
      this.activatedRoute.queryParams
        .pipe(take(1))
        .subscribe((params: any) => {
          const queryProductId = params['productId'];
          if (queryProductId) {
            this.store.dispatch(new ProductsActions.GetSingleProduct(queryProductId));
          }
        });
    }

    // Subscribe to viewState$ to get product data
    this.viewState$
      .pipe(takeUntil(this.ngUnsubscribe))
      .subscribe((vs) => {
        if (vs.selectedProduct) {
          this.product = vs.selectedProduct;
          this.loading = false;
          this.error = null;

          // Update computed properties when product changes
          this.updateComputedProperties();

          // Initialize active image
          const validImages = this.getValidImages(this.product);
          if (validImages.length > 0) {
            this.activeImageIndex = 0;
          }

          // Update variant wishlist status
          this.updateVariantsWithWishlistStatus();

          // Set default selected variant if none selected
          if (!this.selectedVariantId && this.product.variants && this.product.variants.length > 0) {
            this.selectedVariantId = this.product.variants[0]?.id || null;
          }
        }
      });

    this.loadingService.dismissLoading();
  }

  ngOnDestroy(): void {
    this.store.dispatch(new ProductsActions.clearSelectedProduct());
    this.ngUnsubscribe.next(null);
    this.ngUnsubscribe.complete();
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

  // Get main image URL
  getMainImageUrl(): string {
    if (!this.product) return '';
    const validImages = this.getValidImages(this.product);
    if (validImages.length > 0 && validImages[this.activeImageIndex]?.url) {
      return validImages[this.activeImageIndex].url;
    }
    return '';
  }

  // Handle image selection
  onImageSelect(index: number): void {
    this.activeImageIndex = index;
  }

  // Open image in modal
  openImage(imageUrl: string): void {
    if (imageUrl) {
      this.imageModalService.openImageModal(imageUrl);
    }
  }

  // Check if product has variants
  hasVariants(): boolean {
    return !!(this.product?.variants && this.product.variants.length > 1);
  }

  // Get variants with wishlist status
  private updateVariantsWithWishlistStatus(): void {
    if (!this.product?.variants) {
      this.variantsWithWishlistStatus$ = of([]);
      return;
    }

    const validVariants = this.product.variants.filter((v): v is MedusaProductVariant => v !== null && !!v?.id);

    this.variantsWithWishlistStatus$ = combineLatest([
      this.wishlistService.wishlistItems$.pipe(startWith([])),
      of(validVariants)
    ]).pipe(
      map(([wishlistItems, variants]) => {
        return variants.map(variant => ({
          ...variant,
          isInWishlist: wishlistItems.some(item => item.product_variant_id === variant.id) || false
        }));
      })
    );
  }

  // Select variant
  selectVariant(variantId: string): void {
    this.selectedVariantId = variantId;
  }

  // Get variant title
  getVariantTitle(variant: MedusaProductVariant): string {
    if (!variant.title || variant.title === 'Default Variant') {
      return this.product?.title || 'Variant';
    }
    return variant.title;
  }

  // Get variant price
  getVariantPrice(variant: MedusaProductVariant): number {
    return variant.calculated_price?.calculated_amount || 0;
  }

  // Toggle variant wishlist
  toggleVariantWishlist(variant: MedusaProductVariant, event?: Event): void {
    if (event) {
      event.stopPropagation();
    }

    if (!this.product || this.isProcessingWishlist || !variant.id) {
      return;
    }

    // Check if user is logged in
    const isLoggedIn = this.store.selectSnapshot(AuthState.isLoggedIn);
    if (!isLoggedIn) {
      return;
    }

    this.isProcessingWishlist = true;

    // Check if already in wishlist
    this.wishlistService.isInWishlist(this.product.id, variant.id)
      .pipe(
        take(1),
        takeUntil(this.ngUnsubscribe)
      )
      .subscribe((inWishlist) => {
        if (inWishlist) {
          // Remove from wishlist
          this.wishlistService.removeFromWishlist(this.product!.id, variant.id)
            .pipe(
              takeUntil(this.ngUnsubscribe),
              finalize(() => {
                this.isProcessingWishlist = false;
                this.updateVariantsWithWishlistStatus();
              })
            )
            .subscribe();
        } else {
          // Add to wishlist
          this.store.dispatch(new WishlistActions.AddToWishlist(variant.id, this.product!))
            .pipe(
              takeUntil(this.ngUnsubscribe),
              finalize(() => {
                this.isProcessingWishlist = false;
                this.updateVariantsWithWishlistStatus();
              })
            )
            .subscribe();
        }
      });
  }

  // Add to cart
  addToCart(variant?: MedusaProductVariant): void {
    if (this.isAddingToCart) return;

    // Use provided variant or selected variant or first variant
    let variantToAdd: MedusaProductVariant | null = null;

    if (variant) {
      variantToAdd = variant;
    } else if (this.selectedVariantId && this.product?.variants) {
      const found = this.product.variants.find(v => v !== null && v?.id === this.selectedVariantId);
      variantToAdd = found || null;
    } else if (this.product?.variants && this.product.variants.length > 0) {
      const firstVariant = this.product.variants[0];
      variantToAdd = firstVariant || null;
    }

    if (!variantToAdd) {
      return;
    }

    this.isAddingToCart = true;
    this.store.dispatch(new MedusaCartActions.AddToMedusaCart(variantToAdd as any))
      .pipe(
        takeUntil(this.ngUnsubscribe),
        finalize(() => {
          this.isAddingToCart = false;
        })
      )
      .subscribe({
        next: () => {
          // do nothing
        },
        error: () => {
          this.isAddingToCart = false;
        }
      });
  }

  // Get product price (for single variant products)
  getProductPrice(): number {
    if (!this.product?.variants || this.product.variants.length === 0) return 0;
    const variant = this.product.variants[0];
    return variant?.calculated_price?.calculated_amount || 0;
  }

  // Check if product has discount
  hasDiscount(): boolean {
    if (!this.product?.variants || this.product.variants.length === 0) return false;
    const variant = this.product.variants[0];
    if (!variant) return false;
    const originalPrice = variant.calculated_price?.original_amount || 0;
    const calculatedPrice = variant.calculated_price?.calculated_amount || 0;
    return originalPrice > 0 && calculatedPrice < originalPrice;
  }

  // Get original price
  getOriginalPrice(): number {
    if (!this.product?.variants || this.product.variants.length === 0) return 0;
    const variant = this.product.variants[0];
    if (!variant) return 0;
    return variant.calculated_price?.original_amount || 0;
  }

  // Get current price
  getCurrentPrice(): number {
    if (!this.product?.variants || this.product.variants.length === 0) return 0;
    const variant = this.product.variants[0];
    return variant?.calculated_price?.calculated_amount || 0;
  }

  // Navigate back
  navigateBack(): void {
    this.location.back();
  }

  // Check if product has tags
  hasTag(tagValue: string): boolean {
    if (!this.product?.tags || !Array.isArray(this.product.tags)) return false;
    return this.product.tags.some(tag =>
      typeof tag === 'string' ? tag === tagValue : tag?.value === tagValue
    );
  }





  // Update computed properties when product changes
  private updateComputedProperties(): void {
    if (!this.product) {
      this.validImages = [];
      this.mainImageUrl = '';
      this.hasProductVariants = false;
      this.productPrice = 0;
      this.originalPrice = 0;
      this.currentPrice = 0;
      this.hasProductDiscount = false;
      return;
    }

    // Update valid images
    this.validImages = this.getValidImages(this.product);
    this.mainImageUrl = this.getMainImageUrl();

    // Update variants info
    this.hasProductVariants = !!(this.product.variants && this.product.variants.length > 1);

    // Update pricing info
    this.productPrice = this.getProductPrice();
    this.originalPrice = this.getOriginalPrice();
    this.currentPrice = this.getCurrentPrice();
    this.hasProductDiscount = this.hasDiscount();

    // Initialize active image
    if (this.validImages.length > 0) {
      this.activeImageIndex = 0;
    }

    // Update variant wishlist status
    this.updateVariantsWithWishlistStatus();

    // Set default selected variant if none selected
    if (!this.selectedVariantId && this.product.variants && this.product.variants.length > 0) {
      this.selectedVariantId = this.product.variants[0]?.id || null;
    }
  }

  // Helper method to check if value is an array (for template use)
  isArray(value: any): boolean {
    return Array.isArray(value);
  }
}

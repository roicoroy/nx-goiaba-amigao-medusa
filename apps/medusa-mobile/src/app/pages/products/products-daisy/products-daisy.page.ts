import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonContent, IonIcon, IonSpinner } from '@ionic/angular/standalone';
import { Observable, Subject, combineLatest, BehaviorSubject } from 'rxjs';
import { takeUntil, map, startWith } from 'rxjs/operators';
import { Router } from '@angular/router';
import { Store } from '@ngxs/store';

import { MedusaProduct, MedusaCategory } from 'src/app/shared/interfaces';
import { WishlistService } from 'src/app/shared';
import { MedusaCurrency } from 'src/app/shared/pipes/medusa-currency/medusa-currency.pipe';
import { AppFacade, IAppFacadeState } from 'src/app/store/app.facade';
import { ProductsActions } from 'src/app/store/products/products.actions';
import { CategoriesActions } from 'src/app/store/categories/categories.actions';
import { RegionsState } from 'src/app/store/regions/regions.state';
import { GoiabaHeaderComponent } from 'src/app/components/goiaba-components/goiaba-header/goiaba-header.component';

export interface ProductWithUI extends MedusaProduct {
  imageUrl: string;
  price: number;
  isInWishlist: boolean;
  hasHotBadge: boolean;
  hasTrendingBadge: boolean;
  hasOfferBadge: boolean;
  collectionName: string;
}

@Component({
  selector: 'app-products-daisy',
  templateUrl: './products-daisy.page.html',
  styleUrls: ['./products-daisy.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    IonContent,
    IonIcon,
    IonSpinner,
    GoiabaHeaderComponent,
    MedusaCurrency
  ]
})
export class ProductsDaisyPage implements OnInit, OnDestroy {
  private readonly ngUnsubscribe = new Subject();

  // Services
  private facade = inject(AppFacade);
  private wishlistService = inject(WishlistService);
  private router = inject(Router);
  private store = inject(Store);

  // View state
  viewState$: Observable<IAppFacadeState> = this.facade.viewState$;

  // Data observables
  products$: Observable<MedusaProduct[]> = this.facade.products$;
  selectedCategory$: Observable<MedusaProduct[]> = this.facade.selectedCategory$;
  categories$: Observable<MedusaCategory[]> = this.facade.productsCategories$;

  // Selected category
  selectedCategoryId$ = new BehaviorSubject<string>('all');

  // Loading and error states
  loading = true;
  error: string | null = null;

  // Observable that combines products with their UI-ready data
  productsWithUI$: Observable<ProductWithUI[]> =
    combineLatest([
      this.selectedCategoryId$,
      this.products$,
      this.selectedCategory$,
      this.wishlistService.wishlistItems$.pipe(startWith([]))
    ]).pipe(
      map(([categoryId, allProducts, categoryProducts, wishlistItems]) => {
        const productsToUse = categoryId === 'all' ? allProducts : categoryProducts;

        return productsToUse.map(product => ({
          ...product,
          imageUrl: this.getProductImageUrl(product),
          price: this.getProductPrice(product),
          isInWishlist: this.isProductInWishlist(product, wishlistItems),
          hasHotBadge: this.hasTag(product, 'hot'),
          hasTrendingBadge: this.hasTag(product, 'trending'),
          hasOfferBadge: this.hasTag(product, 'offer'),
          collectionName: product.collection?.title || 'Uncategorized'
        } as ProductWithUI));
      })
    );

  // Track which products are being processed to prevent double-clicks
  private processingWishlist = new Set<string>();

  ngOnInit(): void {
    // Load initial data
    this.store.dispatch(new CategoriesActions.GetCategories());
    this.store.dispatch(new ProductsActions.GetProducts());

    // Subscribe to viewState$ to track loading
    this.viewState$
      .pipe(takeUntil(this.ngUnsubscribe))
      .subscribe({
        next: (vs) => {
          // Update loading state
          if (vs.products && vs.products.length >= 0) {
            this.loading = false;
          }
          if (vs.productsCategories && vs.productsCategories.length >= 0) {
            this.loading = false;
          }
        },
        error: (err) => {
          this.error = 'Failed to load products';
          this.loading = false;
          console.error('Error loading products:', err);
        }
      });
  }

  ngOnDestroy(): void {
    this.ngUnsubscribe.next(null);
    this.ngUnsubscribe.complete();
    this.processingWishlist.clear();
  }

  // Category selection handler
  onCategorySelect(categoryId: string): void {
    this.selectedCategoryId$.next(categoryId);

    // If selecting a specific category, load its products
    if (categoryId !== 'all') {
      this.store.dispatch(new ProductsActions.GetCategory(categoryId));
    } else {
      // Load all products
      this.store.dispatch(new ProductsActions.GetProducts());
    }
  }

  // Navigate to product details
  navigateToProduct(product: ProductWithUI): void {
    const productId = product.id;
    if (!productId) {
      return;
    }

    const regionId = this.store.selectSnapshot(RegionsState.getDefaultRegion)?.region_id;
    const queryParams: any = {};
    if (regionId) {
      queryParams.region_id = regionId;
    }

    this.router.navigate(['/products/products-daisy', productId], { queryParams });
  }

  // Add/remove from wishlist
  addToWishlist(product: ProductWithUI, event: Event): void {
    event.stopPropagation();

    if (this.processingWishlist.has(product.id)) {
      return;
    }

    this.processingWishlist.add(product.id);

    const variantId = product.variants?.[0]?.id;
    if (!variantId) {
      this.processingWishlist.delete(product.id);
      return;
    }

    this.wishlistService.isInWishlist(product.id).pipe(
      takeUntil(this.ngUnsubscribe)
    ).subscribe(inWishlist => {
      if (inWishlist) {
        this.wishlistService.removeFromWishlist(product.id, variantId)
          .pipe(takeUntil(this.ngUnsubscribe))
          .subscribe({
            next: () => this.processingWishlist.delete(product.id),
            error: () => this.processingWishlist.delete(product.id)
          });
      } else {
        this.wishlistService.addToWishlist(product, variantId)
          .pipe(takeUntil(this.ngUnsubscribe))
          .subscribe({
            next: () => this.processingWishlist.delete(product.id),
            error: () => this.processingWishlist.delete(product.id)
          });
      }
    });
  }

  // Private helper methods - NOT called from template
  private hasTag(product: MedusaProduct, tagValue: string): boolean {
    if (!product.tags || !Array.isArray(product.tags)) return false;
    return product.tags.some(tag =>
      typeof tag === 'string' ? tag === tagValue : tag?.value === tagValue
    );
  }

  private getProductImageUrl(product: MedusaProduct): string {
    if (product.thumbnail) {
      return product.thumbnail;
    }
    const validImages = product.images?.filter(img => img !== null && img?.url) || [];
    if (validImages.length > 0 && validImages[0]?.url) {
      return validImages[0].url;
    }
    return 'assets/placeholder-product.png';
  }

  private getProductPrice(product: MedusaProduct): number {
    const variant = product.variants?.[0];
    if (!variant) return 0;
    return variant.calculated_price?.calculated_amount || 0;
  }

  private isProductInWishlist(product: MedusaProduct, wishlistItems: any[]): boolean {
    return product.variants?.some(variant =>
      variant !== null && variant?.id && wishlistItems.some(item => item.product_variant_id === variant.id)
    ) || false;
  }

  // Retry loading products
  retry(): void {
    this.loading = true;
    this.error = null;
    this.store.dispatch(new CategoriesActions.GetCategories());
    this.store.dispatch(new ProductsActions.GetProducts());
  }
}

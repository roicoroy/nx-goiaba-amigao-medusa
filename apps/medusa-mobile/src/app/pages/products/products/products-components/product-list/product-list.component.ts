import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonCard, IonCardContent, IonGrid, IonRow, IonCol, IonIcon, IonBadge, IonSegment, IonSegmentButton, IonLabel, IonItem, IonThumbnail } from '@ionic/angular/standalone';
import { Observable, Subject, combineLatest } from 'rxjs';
import { takeUntil, map, startWith } from 'rxjs/operators';
import { Component, inject, OnDestroy } from '@angular/core';
import { MedusaProduct } from 'src/app/shared/interfaces';
import { Store } from '@ngxs/store';
import { Router } from '@angular/router';
import { WishlistService } from 'src/app/shared';
import { MedusaCurrency } from 'src/app/shared/pipes';
import { AppFacade } from 'src/app/store/app.facade';
import { RegionsState } from 'src/app/store/regions/regions.state';
import { GoiabaIonButtonComponent } from 'src/app/components/goiaba-components';

@Component({
  selector: 'app-product-list',
  templateUrl: './product-list.component.html',
  styleUrls: ['./product-list.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    IonCard,
    IonCardContent,
    IonGrid,
    IonRow,
    IonCol,
    IonIcon,
    IonBadge,
    IonSegment,
    IonSegmentButton,
    IonLabel,
    IonItem,
    IonThumbnail,
    MedusaCurrency,
    GoiabaIonButtonComponent
  ]
})
export class ProductListComponent implements OnDestroy {
  products$: Observable<MedusaProduct[]> = inject(AppFacade).products$;
  private wishlistService = inject(WishlistService);
  private store = inject(Store);
  private router = inject(Router);
  private readonly ngUnsubscribe = new Subject();

  viewMode: 'grid' | 'list' = 'grid';

  // Track which products are being processed to prevent double-clicks
  private processingWishlist = new Set<string>();

  // Observable that combines products with their wishlist status
  productsWithWishlistStatus$: Observable<Array<MedusaProduct & { isInWishlist: boolean }>> =
    combineLatest([
      this.products$,
      this.wishlistService.wishlistItems$.pipe(startWith([]))
    ]).pipe(
      map(([products, wishlistItems]) =>
        products.map(product => ({
          ...product,
          // Check if any variant of this product is in the wishlist
          // Filter out null values from variants array
          isInWishlist: product.variants?.some(variant =>
            variant !== null && variant?.id && wishlistItems.some(item => item.product_variant_id === variant.id)
          ) || false
        }))
      )
    );

  detailsPage(product: MedusaProduct): void {
    const productId = product.id;
    if (!productId) {
      return;
    }

    // Product IDs in Medusa v2 have format: prod_xxxxxxxxxxxxx
    // The product-details page can handle both product IDs and handles
    const regionId = this.store.selectSnapshot(RegionsState.getDefaultRegion)?.region_id;
    const queryParams: any = {};
    if (regionId) {
      queryParams.region_id = regionId;
    }
    this.router.navigate(['/products', productId], { queryParams });
  }

  addToWishlist(product: MedusaProduct, event: Event): void {
    event.stopPropagation(); // Prevent triggering the details page navigation

    // Prevent double-clicks
    if (this.processingWishlist.has(product.id)) {
      return;
    }

    this.processingWishlist.add(product.id);

    // Get the first available variant ID
    const variantId = product.variants?.[0]?.id;
    if (!variantId) {
      this.processingWishlist.delete(product.id);
      return;
    }

    // Check if already in wishlist and toggle accordingly
    this.wishlistService.isInWishlist(product.id).pipe(
      takeUntil(this.ngUnsubscribe)
    ).subscribe(inWishlist => {
      if (inWishlist) {
        // Remove from wishlist
        this.wishlistService.removeFromWishlist(product.id, variantId)
          .pipe(takeUntil(this.ngUnsubscribe))
          .subscribe({
            next: (success) => {
              this.processingWishlist.delete(product.id);
            },
            error: () => {
              this.processingWishlist.delete(product.id);
            }
          });
      } else {
        // Add to wishlist
        this.wishlistService.addToWishlist(product, variantId)
          .pipe(takeUntil(this.ngUnsubscribe))
          .subscribe({
            next: () => {
              this.processingWishlist.delete(product.id);
            },
            error: () => {
              this.processingWishlist.delete(product.id);
            }
          });
      }
    });
  }

  onViewModeChange(event: any): void {
    this.viewMode = event.detail.value;
  }

  quickView(product: MedusaProduct, event: Event): void {
    event.stopPropagation(); // Prevent triggering the details page navigation
    // TODO: Implement quick view modal
  }

  // Helper method to check if product has a specific tag
  hasTag(product: MedusaProduct, tagValue: string): boolean {
    if (!product.tags || !Array.isArray(product.tags)) return false;
    return product.tags.some(tag =>
      typeof tag === 'string' ? tag === tagValue : tag?.value === tagValue
    );
  }

  // Helper method to get first valid image (filter out null values)
  getProductImageUrl(product: MedusaProduct): string {
    if (product.thumbnail) {
      return product.thumbnail;
    }
    // Filter out null values from images array (API can return [null])
    const validImages = product.images?.filter(img => img !== null && img?.url) || [];
    if (validImages.length > 0 && validImages[0]?.url) {
      return validImages[0].url;
    }
    return 'assets/placeholder-product.png';
  }

  // Helper method to get product price (simplified to match other components)
  getProductPrice(product: MedusaProduct): number {
    const variant = product.variants?.[0];
    if (!variant) return 0;
    return variant.calculated_price?.calculated_amount || 0;
  }

  ngOnDestroy(): void {
    this.ngUnsubscribe.next(null);
    this.ngUnsubscribe.complete();
    // Clear processing state
    this.processingWishlist.clear();
  }
}

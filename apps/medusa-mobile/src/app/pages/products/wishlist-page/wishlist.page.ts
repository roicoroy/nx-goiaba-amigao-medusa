import { CommonModule } from '@angular/common';
import { Component, inject, OnInit, OnDestroy, signal, computed, effect } from '@angular/core';
import { Router } from '@angular/router';
import { IonContent, IonButton, IonIcon, IonImg, IonSpinner, IonChip, IonLabel, IonCard, IonCardContent, ToastController } from "@ionic/angular/standalone";
import { GoiabaHeaderComponent } from 'src/app/components/goiaba-components/goiaba-header/goiaba-header.component';
import { Store } from '@ngxs/store';
import { Observable, Subject, takeUntil } from 'rxjs';
import { toSignal } from '@angular/core/rxjs-interop';
import { AuthState } from 'src/app/store/auth/auth.state';
import { MedusaProduct, WishlistItem } from 'src/app/shared/interfaces';
import { RegionsState } from 'src/app/store/regions/regions.state';
import { WishlistState } from 'src/app/store/wishlist/wishlist.state';
import { WishlistService } from 'src/app/shared/services/wishlist.service';

/**
 * Interface for wishlist item with pre-computed UI properties
 */
interface WishlistItemWithUI extends WishlistItem {
  displayImage: string;
  displayTitle: string;
  displayDescription: string;
  productId: string | null;
  variantId: string | null;
}

@Component({
  selector: 'app-wishlist-page',
  templateUrl: './wishlist.page.html',
  styleUrls: ['./wishlist.page.scss'],
  standalone: true,
  imports: [
    IonContent,
    IonButton,
    IonIcon,
    IonImg,
    IonSpinner,
    IonChip,
    IonLabel,
    IonCard,
    IonCardContent,
    GoiabaHeaderComponent,
    CommonModule
  ]
})
export class WishlistPage implements OnInit, OnDestroy {
  // NGXS State Observables converted to Signals
  wishlistProducts: any[] = [];
  loading$: Observable<boolean>;
  error$: Observable<string | null>;
  hasItems$: Observable<boolean>;
  isEmpty$: Observable<boolean>;
  isLoggedIn$: Observable<boolean>;

  // Signal for image errors
  private imageErrors = signal<Set<number>>(new Set());

  // Signal for wishlist products
  private wishlistProductsSignal = signal<any[]>([]);

  // Pre-computed wishlist items with UI data
  wishlistItemsWithUI = computed(() => {
    return this.wishlistProductsSignal().map((item) => this.prepareWishlistItemWithUI(item));
  });

  private store = inject(Store);
  private router = inject(Router);
  private toastController = inject(ToastController);
  private wishlistService = inject(WishlistService);
  private readonly ngUnsubscribe = new Subject<void>();

  constructor() {
    // Initialize NGXS state observables
    const wishlistProducts$ = this.store.select(WishlistState.getProductsWithImages);
    this.loading$ = this.store.select(WishlistState.getLoading);
    this.error$ = this.store.select(WishlistState.getError);
    this.hasItems$ = this.store.select(WishlistState.hasItems);
    this.isEmpty$ = this.store.select(WishlistState.isEmpty);
    this.isLoggedIn$ = this.store.select(AuthState.isLoggedIn);

    // Convert observable to signal
    const wishlistProductsSignal = toSignal(wishlistProducts$, { initialValue: [] });

    // Set up effect to sync signal to local property
    effect(() => {
      this.wishlistProductsSignal.set(wishlistProductsSignal());
      this.wishlistProducts = wishlistProductsSignal();
    });
  }

  ngOnInit(): void {
    // Load wishlist using service method
    this.wishlistService.loadWishlist().pipe(
      takeUntil(this.ngUnsubscribe)
    ).subscribe();
  }

  ngOnDestroy(): void {
    this.ngUnsubscribe.next();
    this.ngUnsubscribe.complete();
  }

  /**
   * Get product image for wishlist item
   */
  private getProductImage(item: any): string {
    const product = item.product || item.product_variant?.product;

    if (product?.images?.length > 0) {
      const validImages = product.images.filter((img: any) => img !== null && img?.url);
      if (validImages.length > 0) {
        return validImages[0].url;
      }
    }

    if (product?.thumbnail) {
      return product.thumbnail;
    }

    if (item.thumbnail) {
      return item.thumbnail;
    }

    return 'assets/shapes.svg';
  }

  /**
   * Get product title
   */
  private getProductTitleInternal(item: any): string {
    const product = item.product || item.product_variant?.product;
    return product?.title || item.title || 'Product';
  }

  /**
   * Get product description
   */
  private getProductDescriptionInternal(item: any): string {
    const product = item.product || item.product_variant?.product;
    const desc = product?.description || item.description;
    if (!desc) return 'No description available';
    return desc.length > 150 ? desc.substring(0, 150) + '...' : desc;
  }

  /**
   * Get product ID for navigation
   */
  private getProductIdInternal(item: any): string | null {
    const product = item.product || item.product_variant?.product;
    return product?.id || item.id || null;
  }

  /**
   * Get variant ID for navigation
   */
  private getVariantIdInternal(item: any): string | null {
    return item.product_variant_id || item.variant?.id || item.product_variant?.id || item.variant_id || null;
  }

  /**
   * Create pre-computed wishlist item with UI data
   */
  prepareWishlistItemWithUI(item: any): WishlistItemWithUI {
    return {
      ...item,
      displayImage: this.getProductImage(item),
      displayTitle: this.getProductTitleInternal(item),
      displayDescription: this.getProductDescriptionInternal(item),
      productId: this.getProductIdInternal(item),
      variantId: this.getVariantIdInternal(item)
    };
  }

  removeFromWishlistItem(item: WishlistItem | any): void {
    const itemId = item.id || item.wishlist_item_id;
    const productId = item.product?.id || item.product_variant?.product?.id || '';
    const variantId = item.product_variant_id || item.product_variant?.id || '';

    if (itemId && productId && variantId) {
      this.wishlistService.removeFromWishlist(productId, variantId).pipe(
        takeUntil(this.ngUnsubscribe)
      ).subscribe();
    } else {
      console.error('Unable to remove item: missing ID information', { itemId, productId, variantId });
    }
  }

  addToCart(wishlistItem: any): void {
    if (!wishlistItem) {
      return;
    }

    // Use service method to add to cart
    this.wishlistService.addWishlistItemToCart(wishlistItem);
    this.showAddToCartSuccess(wishlistItem);
  }

  private async showAddToCartSuccess(item: any): Promise<void> {
    const productName = this.getProductTitleInternal(item);
    const toast = await this.toastController.create({
      message: `${productName} added to cart!`,
      duration: 2000,
      position: 'bottom',
      color: 'success',
      buttons: [
        {
          text: 'View Cart',
          handler: () => {
            this.router.navigate(['/products/cart']);
          }
        },
        {
          text: 'Dismiss',
          role: 'cancel'
        }
      ]
    });
    await toast.present();
  }

  goToProductFromWishlistItem(item: WishlistItemWithUI): void {
    if (item.productId) {
      const regionId = this.store.selectSnapshot(RegionsState.getDefaultRegion)?.region_id;

      const queryParams: any = {};
      if (regionId) {
        queryParams.region_id = regionId;
      }
      if (item.variantId) {
        queryParams.variant = item.variantId;
      }

      this.router.navigate(['/products', item.productId], { queryParams });
    }
  }

  goToProducts(): void {
    this.router.navigate(['/products/products']);
  }

  goToLogin(): void {
    this.router.navigate(['/auth']);
  }

  /**
   * Handle image loading errors
   */
  handleImageError(index: number): void {
    const errors = new Set(this.imageErrors());
    errors.add(index);
    this.imageErrors.set(errors);
  }

  /**
   * TrackBy function for ngFor performance
   */
  trackByFn(index: number, item: any): any {
    return item.id || index;
  }
}

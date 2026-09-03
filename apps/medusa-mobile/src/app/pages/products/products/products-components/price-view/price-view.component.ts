import { CommonModule } from '@angular/common';
import { Component, Input, ViewChild, inject, OnInit, OnDestroy } from '@angular/core';
import { Store } from '@ngxs/store';
import { IonLabel, IonAccordion, IonItem, IonAccordionGroup } from '@ionic/angular/standalone';
import { Subject, Observable, combineLatest, of, startWith, map, takeUntil } from 'rxjs';
import { MedusaVariant, MedusaProduct } from 'src/app/shared/interfaces';
import { MedusaCartActions } from 'src/app/store/medusa-cart/medusa-cart.actions';
import { WishlistActions } from 'src/app/store/wishlist/wishlist.actions';
import { WishlistState } from 'src/app/store/wishlist/wishlist.state';
import { WishlistService } from 'src/app/shared';
import { ShortNumber, MedusaCurrency } from 'src/app/shared/pipes';
import { GoiabaIonButtonComponent } from 'src/app/components/goiaba-components';

@Component({
  selector: 'app-price-view',
  templateUrl: './price-view.component.html',
  styleUrls: ['./price-view.component.scss'],
  standalone: true,
  imports: [
    IonAccordionGroup,
    IonLabel,
    IonItem,
    CommonModule,
    ShortNumber,
    MedusaCurrency,
    IonAccordion,
    GoiabaIonButtonComponent
  ],
})
export class PriceViewComponent implements OnInit, OnDestroy {

  @ViewChild('accordionGroup', { static: true }) accordionGroup!: IonAccordionGroup;

  @Input() variants!: MedusaVariant[];
  @Input() product!: MedusaProduct; // Add product input for wishlist functionality
  @Input() isAccordion: boolean = false;

  private store = inject(Store);
  private wishlistService = inject(WishlistService);
  private readonly ngUnsubscribe = new Subject<void>();

  // Track wishlist operations to prevent double-clicks
  private processingWishlistVariants = new Set<string>();

  // Observable that combines variants with their wishlist status
  variantsWithWishlistStatus$!: Observable<Array<MedusaVariant & { isInWishlist: boolean }>>;

  ngOnInit() {
    // Load wishlist to ensure we have the latest data
    // this.wishlistService.loadWishlist();

    // Initialize the observable after inputs are set
    this.variantsWithWishlistStatus$ = combineLatest([
      of(this.variants || []),
      this.store.select(WishlistState.getItems).pipe(startWith([]))
    ]).pipe(
      map(([variants, wishlistItems]) =>
        variants.map(variant => ({
          ...variant,
          isInWishlist: wishlistItems.some(item => item.product_variant_id === variant.id)
        }))
      )
    );
  }

  toggleAccordion() {
    const nativeEl = this.accordionGroup;
    if (nativeEl?.value === 'pricesList') {
      nativeEl!.value = undefined;
    } else {
      nativeEl!.value = 'pricesList';
    }
  };

  addToCart(variant: MedusaVariant) {
    this.store.dispatch(new MedusaCartActions.AddToMedusaCart(variant));
    this.toggleAccordion();
  }

  toggleWishlist(variant: MedusaVariant) {
    if (!this.product || this.processingWishlistVariants.has(variant.id)) {
      return;
    }

    this.processingWishlistVariants.add(variant.id);

    // Get current wishlist state to check if item exists
    const currentWishlistItems = this.store.selectSnapshot(WishlistState.getItems);
    const existingItem = currentWishlistItems.find(item =>
      item.product_variant_id === variant.id
    );

    if (existingItem) {
      // Remove from wishlist using the wishlist item ID
      const wishlistItemId = existingItem.id;
      if (wishlistItemId) {
        this.store.dispatch(new WishlistActions.RemoveFromWishlist(wishlistItemId))
          .pipe(takeUntil(this.ngUnsubscribe))
          .subscribe({
            next: () => {
              this.processingWishlistVariants.delete(variant.id);
            },
            error: () => {
              this.processingWishlistVariants.delete(variant.id);
            }
          });
      } else {
        // Fallback to service method if no wishlist item ID
        this.wishlistService.removeFromWishlist(this.product.id, variant.id)
          .pipe(takeUntil(this.ngUnsubscribe))
          .subscribe({
            next: () => {
              this.processingWishlistVariants.delete(variant.id);
            },
            error: () => {
              this.processingWishlistVariants.delete(variant.id);
            }
          });
      }
    } else {
      // Add to wishlist using NGXS action
      this.store.dispatch(new WishlistActions.AddToWishlist(variant.id, this.product))
        .pipe(takeUntil(this.ngUnsubscribe))
        .subscribe({
          next: () => {
            this.processingWishlistVariants.delete(variant.id);
          },
          error: () => {
            this.processingWishlistVariants.delete(variant.id);
          }
        });
    }
  }

  addToWishlist(variant: MedusaVariant) {
    // Keep this method for backward compatibility, but use toggleWishlist
    this.toggleWishlist(variant);
  }

  getVariantPrice(variant: MedusaVariant): number {
    return variant.calculated_price?.calculated_amount || 0;
  }

  getVariantCurrency(variant: MedusaVariant): string {
    return variant.calculated_price?.currency_code || 'USD';
  }

  ngOnDestroy(): void {
    this.ngUnsubscribe.next();
    this.ngUnsubscribe.complete();
    // Clear processing state
    this.processingWishlistVariants.clear();
  }
}

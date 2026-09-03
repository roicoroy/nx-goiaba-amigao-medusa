import { CommonModule } from '@angular/common';
import { Component, Input, OnInit, OnChanges, SimpleChanges, Output, EventEmitter, inject, OnDestroy } from '@angular/core';
import {
  IonChip,
  IonIcon,
  IonSpinner,
  IonAccordionGroup,
  IonAccordion,
  IonItem,
  IonLabel
} from '@ionic/angular/standalone';
import { MedusaProduct, MedusaVariant } from 'src/app/shared/interfaces';
import { Store } from '@ngxs/store';
import { MedusaCartActions } from 'src/app/store/medusa-cart/medusa-cart.actions';
import { WishlistActions } from 'src/app/store/wishlist/wishlist.actions';
import { WishlistState } from 'src/app/store/wishlist/wishlist.state';
import { AuthState } from 'src/app/store/auth/auth.state';
import { Observable, Subject, combineLatest, of, startWith, map, takeUntil } from 'rxjs';
import { MedusaCurrency } from 'src/app/shared/pipes/medusa-currency/medusa-currency.pipe';
import { GoiabaIonButtonComponent } from 'src/app/components/goiaba-components';

@Component({
  selector: 'app-medusa-product-details-wrapper',
  templateUrl: './medusa-product-details-wrapper.component.html',
  styleUrls: ['./medusa-product-details-wrapper.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    IonChip,
    IonIcon,
    IonSpinner,
    IonAccordionGroup,
    IonAccordion,
    IonItem,
    IonLabel,
    MedusaCurrency,
    GoiabaIonButtonComponent
  ]
})
export class MedusaProductDetailsWrapperComponent implements OnInit, OnChanges, OnDestroy {

  @Input() medusaProduct: MedusaProduct | null = null;
  @Input() isInWishlist$: Observable<boolean> | null = null;
  @Output() addToWishlist = new EventEmitter<string>(); // Emit variant ID instead of void
  @Output() variantSelected = new EventEmitter<string>(); // Emit when variant is selected

  private store = inject(Store);
  private readonly ngUnsubscribe = new Subject<void>();
  private processingWishlistVariants = new Set<string>();
  selectedVariantId: string | null = null; // Track selected variant (public for template)

  // Check if user is logged in (for showing/hiding wishlist button)
  isLoggedIn$: Observable<boolean> = this.store.select(AuthState.isLoggedIn);

  textMore: boolean = false;

  // Observable that combines variants with their wishlist status
  // Using any[] to handle API response types (MedusaProductVariant from API)
  // Initialize with empty array to prevent template errors
  variantsWithWishlistStatus$: Observable<Array<any & { isInWishlist: boolean }>> = of([]);

  ngOnInit(): void {
    // Initialize variants when component loads
    this.initializeVariants();
  }

  ngOnChanges(changes: SimpleChanges): void {
    // React to changes in medusaProduct input
    if (changes['medusaProduct'] && !changes['medusaProduct'].firstChange) {
      // Reset selected variant when product changes
      this.selectedVariantId = null;
      // Re-initialize variants with new product data
      this.initializeVariants();
    }
  }

  private initializeVariants(): void {
    // Filter out null values from variants array (API can return [null])
    const validVariants = this.medusaProduct?.variants?.filter(v => v !== null && v?.id) || [];

    if (validVariants.length > 0) {
      // Set first variant as default selected if none selected
      if (!this.selectedVariantId && validVariants[0]?.id) {
        const firstVariantId = validVariants[0].id;
        this.selectedVariantId = firstVariantId;
        this.variantSelected.emit(firstVariantId);
      }

      // Create observable that combines variants with wishlist status
      this.variantsWithWishlistStatus$ = combineLatest([
        of(validVariants),
        this.store.select(WishlistState.getItems).pipe(startWith([]))
      ]).pipe(
        map(([variants, wishlistItems]) =>
          variants
            .filter((variant): variant is NonNullable<typeof variant> => variant !== null && variant?.id !== undefined) // Type guard to filter nulls
            .map(variant => ({
              ...variant,
              isInWishlist: wishlistItems.some(item => item.product_variant_id === variant.id)
            }))
        ),
        takeUntil(this.ngUnsubscribe)
      );
    } else {
      // No valid variants - set to empty array
      this.variantsWithWishlistStatus$ = of([]);
    }
  }

  ngOnDestroy(): void {
    this.ngUnsubscribe.next();
    this.ngUnsubscribe.complete();
    this.processingWishlistVariants.clear();
  }

  handleTextToggle(): void {
    this.textMore = !this.textMore;
  }

  // For future cart integration, inject a cart service or use Output events

  getShortDescription(): string {
    if (!this.medusaProduct?.description) {
      return '';
    }

    const desc = this.medusaProduct.description;
    if (this.textMore) return desc;
    return desc.length > 120 ? desc.slice(0, 120) + '...' : desc;
  }

  // Helper method to check if product has required data
  hasProductData(): boolean {
    return this.medusaProduct !== null && this.medusaProduct !== undefined;
  }

  // Helper method to check if product has specifications
  hasSpecifications(): boolean {
    if (!this.medusaProduct) return false;

    return !!(
      this.medusaProduct.weight ||
      this.medusaProduct.length ||
      this.medusaProduct.width ||
      this.medusaProduct.height ||
      this.medusaProduct.material ||
      this.medusaProduct.origin_country ||
      this.medusaProduct.hs_code ||
      this.medusaProduct.type ||
      this.medusaProduct.collection ||
      (this.medusaProduct.tags &&
        this.medusaProduct.tags.length > 0
      ));
  }

  // Helper method to check if product has multiple variants
  hasMultipleVariants(): boolean {
    return !!(this.medusaProduct?.variants && this.medusaProduct.variants.length > 1);
  }

  // Helper method to check if product has variants (filter out null values)
  hasVariants(): boolean {
    if (!this.medusaProduct) return false;
    const validVariants = this.medusaProduct.variants?.filter(v => v !== null && v?.id) || [];
    return validVariants.length > 0;
  }

  // Track by function for variant list to improve performance
  trackByVariantId(index: number, variant: any): string {
    return variant?.id || index.toString();
  }

  // Helper method to check if product has options
  hasProductOptions(): boolean {
    return !!(this.medusaProduct?.options && this.medusaProduct.options.length > 0);
  }

  // Helper method to check if accordion should be rendered
  // Note: Variants are now shown outside the accordion, so they're not included here
  hasAccordionContent(): boolean {
    return this.hasProductOptions() || this.hasSpecifications();
  }

  // Helper method to check if product has quick info to display
  hasQuickInfo(): boolean {
    if (!this.medusaProduct) return false;
    return !!(
      this.medusaProduct.weight ||
      this.medusaProduct.length ||
      this.medusaProduct.width ||
      this.medusaProduct.height ||
      this.medusaProduct.type ||
      this.medusaProduct.origin_country
    );
  }

  // Get origin country name from code
  getOriginCountryName(countryCode: string | null | undefined): string {
    if (!countryCode) return '';

    const countryNames: { [key: string]: string } = {
      'br': 'Brazil',
      'us': 'United States',
      'uk': 'United Kingdom',
      'gb': 'United Kingdom',
      'pt': 'Portugal',
      'es': 'Spain',
      'fr': 'France',
      'de': 'Germany',
      'it': 'Italy',
      'nl': 'Netherlands',
      'be': 'Belgium',
      'ch': 'Switzerland',
      'at': 'Austria',
      'pl': 'Poland',
      'cz': 'Czech Republic',
      'dk': 'Denmark',
      'se': 'Sweden',
      'no': 'Norway',
      'fi': 'Finland',
      'ie': 'Ireland',
      'gr': 'Greece',
      'au': 'Australia',
      'nz': 'New Zealand',
      'ca': 'Canada',
      'mx': 'Mexico',
      'ar': 'Argentina',
      'cl': 'Chile',
      'co': 'Colombia',
      'pe': 'Peru',
      'jp': 'Japan',
      'cn': 'China',
      'kr': 'South Korea',
      'in': 'India',
      'th': 'Thailand',
      'sg': 'Singapore',
      'my': 'Malaysia',
      'id': 'Indonesia',
      'ph': 'Philippines',
      'vn': 'Vietnam',
      'ae': 'United Arab Emirates',
      'sa': 'Saudi Arabia',
      'il': 'Israel',
      'tr': 'Turkey',
      'ru': 'Russia',
      'ua': 'Ukraine',
      'eg': 'Egypt',
      'ng': 'Nigeria',
      'ke': 'Kenya',
      'ma': 'Morocco',
      'tn': 'Tunisia',
      'dz': 'Algeria',
      'za': 'South Africa'
    };

    const code = countryCode.toLowerCase();
    return countryNames[code] || code.toUpperCase();
  }

  // Helper method to format dimensions
  getDimensions(): string {
    if (!this.medusaProduct) return '';

    const dimensions = [];
    if (this.medusaProduct.length) dimensions.push(`L: ${this.medusaProduct.length}cm`);
    if (this.medusaProduct.width) dimensions.push(`W: ${this.medusaProduct.width}cm`);
    if (this.medusaProduct.height) dimensions.push(`H: ${this.medusaProduct.height}cm`);

    return dimensions.join(' × ');
  }

  // Get the selected variant (or first variant as fallback)
  // Filter out null values from variants array
  getSelectedVariant(): MedusaVariant | null {
    const validVariants = (this.medusaProduct?.variants?.filter(v => v !== null && v?.id) || []) as MedusaVariant[];
    if (validVariants.length === 0) {
      return null;
    }
    // If a variant is selected, return it; otherwise return the first variant
    if (this.selectedVariantId) {
      const selected = validVariants.find(v => v.id === this.selectedVariantId);
      if (selected) return selected;
    }
    return validVariants[0] || null;
  }

  // Set the selected variant
  setSelectedVariant(variantId: string): void {
    this.selectedVariantId = variantId;
    this.variantSelected.emit(variantId);
  }

  // Get current price
  getCurrentPrice(): number {
    const variant = this.getSelectedVariant();
    return variant?.calculated_price?.calculated_amount || 0;
  }

  // Get original price
  getOriginalPrice(): number {
    const variant = this.getSelectedVariant();
    return variant?.calculated_price?.original_amount || 0;
  }

  // Check if there's a discount
  hasDiscount(): boolean {
    const original = this.getOriginalPrice();
    const current = this.getCurrentPrice();
    return original > current && original > 0;
  }

  // Get currency code
  getCurrencyCode(): string {
    const variant = this.getSelectedVariant();
    return variant?.calculated_price?.currency_code || 'EUR';
  }

  // Calculate unit price (per 100g or per unit)
  getUnitPrice(): string {
    const variant = this.getSelectedVariant();
    const price = this.getCurrentPrice();
    const currency = this.getCurrencyCode();

    // If product has weight, calculate per 100g
    if (this.medusaProduct?.weight) {
      const weightInGrams = this.medusaProduct.weight;
      const unitPrice = (price / weightInGrams) * 100;
      const currencySymbol = currency === 'EUR' ? '€' : currency === 'GBP' ? '£' : currency;
      return `${unitPrice.toFixed(1)}${currencySymbol}/100g`;
    }

    // If no weight, return empty string (unit price only shown when weight is available)
    return '';
  }

  // Get product weight/size info
  getProductSize(): string {
    if (this.medusaProduct?.weight) {
      return `${this.medusaProduct.weight}g`;
    }
    // Try to get from variant title or description
    const variant = this.getSelectedVariant();
    if (variant?.title) {
      return variant.title;
    }
    return '';
  }

  // Get full product title (ASDA-style: includes variant info)
  getFullProductTitle(): string {
    if (!this.medusaProduct?.title) return '';

    const variant = this.getSelectedVariant();
    const baseTitle = this.medusaProduct.title;

    // If variant has additional info in title, append it
    if (variant?.title && variant.title !== baseTitle) {
      // Check if variant title contains size/quantity info
      const variantInfo = variant.title.replace(baseTitle, '').trim();
      if (variantInfo) {
        return `${baseTitle} ${variantInfo}`;
      }
    }

    // Add weight if available
    if (this.medusaProduct.weight) {
      return `${baseTitle}, ${this.medusaProduct.weight}g`;
    }

    return baseTitle;
  }

  // Check if variant info is already in the title
  hasVariantInTitle(): boolean {
    const variant = this.getSelectedVariant();
    if (!variant?.title || !this.medusaProduct?.title) return false;
    return variant.title !== this.medusaProduct.title;
  }

  // Add to cart
  addToCart(): void {
    const variant = this.getSelectedVariant();
    if (variant) {
      this.store.dispatch(new MedusaCartActions.AddToMedusaCart(variant));
    }
  }

  // Handle wishlist toggle - use selected variant or first variant
  toggleWishlist(): void {
    const variant = this.getSelectedVariant();

    if (!variant?.id) {
      return;
    }

    // Check if item is already in wishlist
    const currentWishlistItems = this.store.selectSnapshot(WishlistState.getItems);
    const existingItem = currentWishlistItems.find(item =>
      item.product_variant_id === variant.id
    );

    if (existingItem) {
      // Remove from wishlist
      this.store.dispatch(new WishlistActions.RemoveFromWishlist(existingItem.id))
        .pipe(takeUntil(this.ngUnsubscribe))
        .subscribe({
          next: () => {
            // Successfully removed from wishlist
          },
          error: () => {
            // Error removing from wishlist
          }
        });
    } else {
      // Add to wishlist
      this.addToWishlist.emit(variant.id);
    }
  }

  // Add variant to cart
  addVariantToCart(variant: MedusaVariant): void {
    // Set this variant as selected when adding to cart
    this.setSelectedVariant(variant.id);
    this.store.dispatch(new MedusaCartActions.AddToMedusaCart(variant));
  }

  // Toggle wishlist for a specific variant
  toggleVariantWishlist(variant: MedusaVariant): void {
    if (!this.medusaProduct || this.processingWishlistVariants.has(variant.id)) {
      return;
    }

    this.processingWishlistVariants.add(variant.id);

    // Get current wishlist state
    const currentWishlistItems = this.store.selectSnapshot(WishlistState.getItems);
    const existingItem = currentWishlistItems.find(item =>
      item.product_variant_id === variant.id
    );

    if (existingItem) {
      // Remove from wishlist
      const wishlistItemId = existingItem.id;
      if (wishlistItemId) {
        this.store.dispatch(new WishlistActions.RemoveFromWishlist(wishlistItemId))
          .pipe(takeUntil(this.ngUnsubscribe))
          .subscribe({
            next: () => this.processingWishlistVariants.delete(variant.id),
            error: () => this.processingWishlistVariants.delete(variant.id)
          });
      }
    } else {
      // Add to wishlist
      this.store.dispatch(new WishlistActions.AddToWishlist(variant.id, this.medusaProduct))
        .pipe(takeUntil(this.ngUnsubscribe))
        .subscribe({
          next: () => this.processingWishlistVariants.delete(variant.id),
          error: () => this.processingWishlistVariants.delete(variant.id)
        });
    }
  }

  // Get variant price
  getVariantPrice(variant: MedusaVariant): number {
    return variant.calculated_price?.calculated_amount || 0;
  }

  // Get variant currency
  getVariantCurrency(variant: MedusaVariant): string {
    return variant.calculated_price?.currency_code || 'EUR';
  }

  // Get variant title (or fallback)
  getVariantTitle(variant: MedusaVariant): string {
    if (variant.title && variant.title !== this.medusaProduct?.title) {
      return variant.title.replace(this.medusaProduct?.title || '', '').trim() || variant.title;
    }
    return variant.title || 'Standard';
  }
}

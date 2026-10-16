import { Component, OnInit, OnDestroy, ViewChild, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardContent,
  IonButton,
  IonIcon,
  IonSpinner,
  IonText,
  IonItem,
  IonLabel,
  IonInput,
  IonToggle,
  IonRadioGroup,
  IonRadio,
  IonList,
  ModalController
} from '@ionic/angular/standalone';
import { Store } from '@ngxs/store';
import { Observable, lastValueFrom, take, takeUntil, Subject } from 'rxjs';
import { NavigationService } from '../../shared/navigation/navigation.service';
import { MedusaCustomer, MedusaAddress, MedusaCart } from '../../shared/interfaces';
import { MedusaCartActions } from '../../store/medusa-cart/medusa-cart.actions';
import { CheckoutFacade, ICheckoutFacadeState } from '../../store/checkout/checkout.facade';
import { CheckoutActions } from '../../store/checkout/checkout.actions';
import { CheckoutState } from '../../store/checkout/checkout.state';
import { MedusaCartState } from '../../store/medusa-cart/medusa-cart.state';
import { AddressFormComponent, AddressFormData } from '../../components/forms/address-form/address-form.component';
import { MedusaService } from '../../shared/api/medusa.service';
import { IShippingOptions, IPaymentProviders } from '../../shared/interfaces/shipping.interface';
import { CheckoutApiService } from 'src/app/shared/api/checkout-api.service';
import { AddressSummaryComponent } from './address-summary/address-summary.component';
import { CardPaymentModal } from './card-payment-modal/card-payment-modal';
import { CheckoutSectionComponent } from './checkout-section';
import { AddressSelectionModalComponent } from './address-selection-modal/address-selection-modal.component';
import { MedusaCurrency } from '../../shared/pipes/medusa-currency/medusa-currency.pipe';
import { TranslateModule } from '@ngx-translate/core';

/**
 * SmartCheckoutPage
 *
 * Main checkout page component that orchestrates the entire checkout flow.
 * Automatically detects user authentication state and renders the appropriate
 * checkout experience (logged-in with saved addresses vs guest with empty forms).
 *
 * This component follows the single-page checkout pattern where all steps
 * are visible on one scrollable page with progressive disclosure.
 */
export type CheckoutFlowType = 'logged-in' | 'guest';

@Component({
  selector: 'app-smart-checkout',
  templateUrl: './smart-checkout.page.html',
  styleUrls: ['./smart-checkout.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    TranslateModule,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonCard,
    IonCardHeader,
    IonCardTitle,
    IonCardContent,
    IonButton,
    IonIcon,
    IonSpinner,
    IonText,
    IonItem,
    IonLabel,
    IonInput,
    IonToggle,
    IonRadioGroup,
    IonRadio,
    IonList,
    CheckoutSectionComponent,
    AddressFormComponent,
    AddressSummaryComponent,
    MedusaCurrency
  ]
})
export class SmartCheckoutPage implements OnInit, OnDestroy {
  // Injected services
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private nav = inject(NavigationService);
  private store = inject(Store);
  private medusaService = inject(MedusaService);
  private modalCtrl = inject(ModalController);
  private checkoutFacade = inject(CheckoutFacade);

  // ViewChild for content scrolling
  @ViewChild(IonContent) content!: IonContent;

  // ViewState from facade
  viewState$: Observable<ICheckoutFacadeState> = this.checkoutFacade.viewState$;
  private ngUnsubscribe = new Subject<void>();

  // Signals for component state
  cartId = signal<string | null>(null);
  checkoutFlow = signal<CheckoutFlowType>('guest');
  isInitializing = signal<boolean>(true);
  initializationError = signal<string | null>(null);
  private hasInitialized = false;

  // Checkout form state signals
  guestEmail = signal<string>('');
  useSameAddressForBilling = signal<boolean>(true);

  // Address form data
  shippingAddressData = signal<AddressFormData | null>(null);
  billingAddressData = signal<AddressFormData | null>(null);
  isShippingFormValid = signal<boolean>(false);
  isBillingFormValid = signal<boolean>(false);

  // Saved addresses for logged-in users
  savedAddresses = signal<MedusaAddress[]>([]);
  selectedShippingAddress = signal<MedusaAddress | null>(null);
  selectedBillingAddress = signal<MedusaAddress | null>(null);

  // Shipping options
  shippingOptions = signal<IShippingOptions[]>([]);
  selectedShippingOption = signal<IShippingOptions | null>(null);
  isLoadingShippingOptions = signal<boolean>(false);
  shippingOptionsError = signal<string | null>(null);

  // Payment providers from CheckoutState
  paymentProviders = signal<IPaymentProviders[]>([]);
  selectedPaymentProvider = signal<string | null>(null);

  // Section completion state
  isEmailSectionComplete = signal<boolean>(false);
  isShippingAddressComplete = signal<boolean>(false);
  isBillingAddressComplete = signal<boolean>(false);
  isShippingMethodSelected = signal<boolean>(false);
  isPaymentMethodSelected = signal<boolean>(false);

  // Section error state
  hasEmailError = signal<boolean>(false);
  hasShippingAddressError = signal<boolean>(false);
  hasBillingAddressError = signal<boolean>(false);
  hasShippingMethodError = signal<boolean>(false);
  hasPaymentMethodError = signal<boolean>(false);

  // Checkout completion state
  isCompletingCheckout = signal<boolean>(false);
  checkoutError = signal<string | null>(null);

  // Computed signals
  isLoggedInFlow = computed(() => this.checkoutFlow() === 'logged-in');
  isGuestFlow = computed(() => this.checkoutFlow() === 'guest');
  isCheckoutReady = computed(() => {
    const emailValid = this.isLoggedInFlow() || this.isEmailSectionComplete();
    return emailValid &&
      this.isShippingAddressComplete() &&
      this.isBillingAddressComplete() &&
      this.isShippingMethodSelected() &&
      this.isPaymentMethodSelected();
  });

  // ViewState data (populated from facade)
  viewState: ICheckoutFacadeState | null = null;

  // Computed signals for template (derived from viewState)
  cartSubtotal = computed(() => this.viewState?.cartSubtotal || 0);
  cartShippingTotal = computed(() => this.viewState?.cartShippingTotal || 0);
  cartTaxTotal = computed(() => this.viewState?.cartTaxTotal || 0);
  cartTotal = computed(() => this.viewState?.cartTotal || 0);
  cartItems = computed(() => this.viewState?.cartItems || []);
  cartItemsCount = computed(() => this.viewState?.cartItemsCount || 0);

  /**
   * Component initialization lifecycle hook
   * Initializes checkout by detecting authentication state and loading cart data
   */
  ngOnInit(): void {
    // Subscribe to viewState from facade - react to state changes
    this.viewState$.pipe(takeUntil(this.ngUnsubscribe)).subscribe(state => {
      console.log('viewState', state);
      this.viewState = state;

      // Update payment providers signal from state
      this.paymentProviders.set(state.paymentProviders || []);

      // React to cart loading completion - use state instead of redundant queries
      if (this.isInitializing() && state.cart && state.cart.id === this.cartId() && !state.cartLoading) {
        this.isInitializing.set(false);
      }

      // Handle cart errors from state
      if (state.cartError && this.isInitializing()) {
        this.initializationError.set(state.cartError);
        this.isInitializing.set(false);
      }
    });

    // Subscribe to shipping options from CheckoutState
    this.store.select(CheckoutState.getShippingOptions)
      .pipe(takeUntil(this.ngUnsubscribe))
      .subscribe(options => {
        const opts = options || [];
        this.shippingOptions.set(opts);
        
        // Check if any options have calculation errors
        const hasErrors = opts.some(opt => opt.calculation_error);
        if (opts.length === 0 && !hasErrors) {
          this.shippingOptionsError.set('No shipping options available for your address');
        } else if (hasErrors) {
          this.shippingOptionsError.set('Some shipping prices could not be calculated');
        } else {
          this.shippingOptionsError.set(null);
        }
      });

    // Subscribe to calculating state
    this.store.select(CheckoutState.isCalculatingShippingPrices)
      .pipe(takeUntil(this.ngUnsubscribe))
      .subscribe(isCalculating => {
        this.isLoadingShippingOptions.set(isCalculating);
      });

    // Initialize checkout flow once
    this.initializeCheckout();
  }

  ngOnDestroy(): void {
    this.ngUnsubscribe.next();
    this.ngUnsubscribe.complete();
  }

  /**
   * Initialize checkout flow
   * - Extract cart ID from query parameters
   * - Detect user authentication state
   * - Determine appropriate checkout flow type
   * - Load cart data if cart ID is provided
   */
  private initializeCheckout(): void {
    // Prevent duplicate initialization
    if (this.hasInitialized) {
      return;
    }
    this.hasInitialized = true;

    // Extract cart ID from query parameters
    const cartIdParam = this.route.snapshot.queryParamMap.get('cartId');
    this.cartId.set(cartIdParam);

    // Detect authentication state and determine flow type
    this.detectAuthenticationState();

    // Load cart data if cart ID is provided
    if (cartIdParam) {
      this.loadCartData(cartIdParam);
    } else {
      // No cart ID provided - check if there's a cart in state
      const cart = this.checkoutFacade.getCartSnapshot();
      if (cart && !cart.completed_at) {
        this.cartId.set(cart.id);
        this.isInitializing.set(false);
      } else {
        this.initializationError.set('No cart found. Please add items to your cart first.');
        this.isInitializing.set(false);
      }
    }
  }

  /**
   * Detect user authentication state and determine checkout flow type
   */
  private detectAuthenticationState(): void {
    const isLoggedIn = this.checkoutFacade.getIsLoggedInSnapshot();
    const customer = this.checkoutFacade.getCustomerSnapshot();

    // Determine checkout flow based on authentication and customer data
    if (isLoggedIn && customer) {
      this.checkoutFlow.set('logged-in');
      // Load saved addresses for logged-in users
      this.loadSavedAddresses(customer);
    } else {
      this.checkoutFlow.set('guest');
    }
  }

  /**
   * Load saved addresses for logged-in customers
   * Pre-populate shipping and billing addresses with defaults
   */
  private loadSavedAddresses(customer: MedusaCustomer): void {
    // Get all saved addresses - try both shipping_addresses and addresses fields
    const addresses = customer.shipping_addresses || customer.addresses || [];
    this.savedAddresses.set(addresses);

    if (addresses.length === 0) {
      return;
    }

    // Find default shipping address or use first address
    const defaultShipping = addresses.find(addr => addr.is_default_shipping) || addresses[0];
    this.selectedShippingAddress.set(defaultShipping);

    // Convert to AddressFormData and update cart
    const shippingData = this.convertMedusaAddressToFormData(defaultShipping);
    this.shippingAddressData.set(shippingData);
    this.isShippingFormValid.set(true);
    this.isShippingAddressComplete.set(true);

    // Update cart with customer email and shipping address
    this.updateCartWithCustomerData(customer.email, shippingData, () => {
      // Load shipping options after shipping address is set
      this.loadShippingOptions();
    });

    // Find default billing address or use first address
    const defaultBilling = addresses.find(addr => addr.is_default_billing) || addresses[0];
    this.selectedBillingAddress.set(defaultBilling);

    // Convert to AddressFormData and update cart
    const billingData = this.convertMedusaAddressToFormData(defaultBilling);
    this.billingAddressData.set(billingData);
    this.isBillingFormValid.set(true);
    this.isBillingAddressComplete.set(true);
    this.updateCartBillingAddress(billingData);
  }

  /**
   * Convert MedusaAddress to AddressFormData format
   */
  private convertMedusaAddressToFormData(address: MedusaAddress): AddressFormData {
    return {
      first_name: address.first_name || '',
      last_name: address.last_name || '',
      address_1: address.address_1 || '',
      address_2: address.address_2 || '',
      city: address.city || '',
      postal_code: address.postal_code || '',
      country_code: address.country_code || '',
      phone: address.phone || '',
      company: address.company || ''
    };
  }

  /**
   * Load cart data from the backend
   * @param cartId - The cart ID to load
   */
  private loadCartData(cartId: string): void {
    // Use facade to refresh cart - state will update via viewState$ subscription
    this.checkoutFacade.refreshCartById(cartId);
    // Initialization completion is handled in viewState$ subscription when cart loads
  }



  /**
   * Navigate back to the previous page (typically the cart)
   */
  goBack(): void {
    this.nav.goBack();
  }

  /**
   * Navigate back to cart page
   */
  goToCart(): void {
    this.router.navigate(['/cart']);
  }

  /**
   * Handle guest email input change
   */
  onEmailChange(event: any): void {
    const email = event.detail.value || '';
    this.guestEmail.set(email);
    // Basic email validation
    const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    this.isEmailSectionComplete.set(emailValid);
    this.hasEmailError.set(!emailValid && email.length > 0);
  }

  /**
   * Handle same address toggle change
   */
  onSameAddressToggle(event: any): void {
    const useSame = event.detail.checked;
    this.useSameAddressForBilling.set(useSame);

    // If using same address, copy shipping to billing and mark as complete
    if (useSame && this.shippingAddressData() && this.isShippingFormValid()) {
      // Copy shipping address to billing
      this.billingAddressData.set(this.shippingAddressData());
      this.isBillingFormValid.set(true);
      this.isBillingAddressComplete.set(true);
      this.hasBillingAddressError.set(false);

      // For logged-in users, also copy the selected address reference
      if (this.isLoggedInFlow() && this.selectedShippingAddress()) {
        this.selectedBillingAddress.set(this.selectedShippingAddress());
      }

      // Update cart with billing address
      this.updateCartBillingAddress(this.shippingAddressData()!);
    } else {
      // Reset billing when toggle is off
      this.billingAddressData.set(null);
      this.isBillingFormValid.set(false);
      this.isBillingAddressComplete.set(false);

      // For logged-in users, reset to default billing address if available
      if (this.isLoggedInFlow()) {
        const addresses = this.savedAddresses();
        const defaultBilling = addresses.find(addr => addr.is_default_billing) || addresses[0];
        if (defaultBilling) {
          this.selectedBillingAddress.set(defaultBilling);
          const billingData = this.convertMedusaAddressToFormData(defaultBilling);
          this.billingAddressData.set(billingData);
          this.isBillingFormValid.set(true);
          this.isBillingAddressComplete.set(true);
          this.updateCartBillingAddress(billingData);
        } else {
          this.selectedBillingAddress.set(null);
        }
      }
    }
  }

  /**
   * Handle shipping address form data changes
   */
  onShippingAddressChange(data: AddressFormData): void {
    this.shippingAddressData.set(data);

    // If using same address for billing, update billing too
    if (this.useSameAddressForBilling() && this.isShippingFormValid()) {
      this.billingAddressData.set(data);
    }
  }

  /**
   * Handle shipping address form validity changes
   */
  onShippingAddressValidityChange(isValid: boolean): void {
    this.isShippingFormValid.set(isValid);

    if (isValid && this.shippingAddressData()) {
      // For guest users, ensure email is added to cart first
      if (this.isGuestFlow() && this.guestEmail()) {
        this.updateCartEmail(this.guestEmail(), () => {
          // Then update shipping address
          this.updateCartShippingAddress(this.shippingAddressData()!, () => {
            // If using same address, also update billing after shipping is complete
            if (this.useSameAddressForBilling()) {
              this.billingAddressData.set(this.shippingAddressData());
              this.isBillingFormValid.set(true);
              this.isBillingAddressComplete.set(true);
              this.updateCartBillingAddress(this.shippingAddressData()!);
            }

            // Load shipping options after shipping address is set
            this.loadShippingOptions();
          });
        });
      } else {
        // For logged-in users, directly update shipping address
        this.updateCartShippingAddress(this.shippingAddressData()!, () => {
          // If using same address, also update billing after shipping is complete
          if (this.useSameAddressForBilling()) {
            this.billingAddressData.set(this.shippingAddressData());
            this.isBillingFormValid.set(true);
            this.isBillingAddressComplete.set(true);
            this.updateCartBillingAddress(this.shippingAddressData()!);
          }

          // Load shipping options after shipping address is set
          this.loadShippingOptions();
        });
      }

      this.isShippingAddressComplete.set(true);
      this.hasShippingAddressError.set(false);
    } else {
      this.isShippingAddressComplete.set(false);
    }
  }

  /**
   * Handle billing address form data changes
   */
  onBillingAddressChange(data: AddressFormData): void {
    this.billingAddressData.set(data);
  }

  /**
   * Handle billing address form validity changes
   */
  onBillingAddressValidityChange(isValid: boolean): void {
    this.isBillingFormValid.set(isValid);

    if (isValid && this.billingAddressData()) {
      // Update cart with billing address
      this.updateCartBillingAddress(this.billingAddressData()!);
      this.isBillingAddressComplete.set(true);
      this.hasBillingAddressError.set(false);
    } else {
      this.isBillingAddressComplete.set(false);
    }
  }

  /**
   * Update cart with guest email
   */
  private updateCartEmail(email: string, onSuccess?: () => void): void {
    const cartId = this.cartId();
    if (!cartId) {
      return;
    }

    this.medusaService.cartsUpdate(cartId, {
      email: email
    }).subscribe({
      next: (response) => {
        // Update cart in store - state will update via viewState$ subscription
        if (response.cart) {
          this.store.dispatch(new MedusaCartActions.UpdateMedusaCartState(response.cart));
        }
        if (onSuccess) {
          onSuccess();
        }
      },
      error: (error) => {
        this.hasEmailError.set(true);
      }
    });
  }

  /**
   * Update cart with customer email and shipping address (for logged-in users)
   */
  private updateCartWithCustomerData(email: string, shippingAddress: AddressFormData, onSuccess?: () => void): void {
    const cartId = this.cartId();
    if (!cartId) {
      return;
    }

    // Remove email field from address as it's not part of the address object in Medusa
    const { email: addressEmail, ...addressWithoutEmail } = shippingAddress;

    this.medusaService.cartsUpdate(cartId, {
      email: email,
      shipping_address: addressWithoutEmail
    }).subscribe({
      next: (response) => {
        // Update cart in store - state will update via viewState$ subscription
        if (response.cart) {
          this.store.dispatch(new MedusaCartActions.UpdateMedusaCartState(response.cart));
        }
        if (onSuccess) {
          onSuccess();
        }
      },
      error: (error) => {
        this.hasShippingAddressError.set(true);
        this.isShippingAddressComplete.set(false);
      }
    });
  }

  /**
   * Update cart with shipping address
   */
  private updateCartShippingAddress(address: AddressFormData, onSuccess?: () => void): void {
    const cartId = this.cartId();
    if (!cartId) {
      return;
    }

    // Remove email field as it's not part of the address object in Medusa
    const { email, ...addressWithoutEmail } = address;

    this.medusaService.cartsUpdate(cartId, {
      shipping_address: addressWithoutEmail
    }).subscribe({
      next: (response) => {
        // Update cart in store - state will update via viewState$ subscription
        if (response.cart) {
          this.store.dispatch(new MedusaCartActions.UpdateMedusaCartState(response.cart));
        }
        if (onSuccess) {
          onSuccess();
        }
      },
      error: (error) => {
        this.hasShippingAddressError.set(true);
        this.isShippingAddressComplete.set(false);
      }
    });
  }

  /**
   * Update cart with billing address
   */
  private updateCartBillingAddress(address: AddressFormData): void {
    const cartId = this.cartId();
    if (!cartId) {
      return;
    }

    // Remove email field as it's not part of the address object in Medusa
    const { email, ...addressWithoutEmail } = address;

    this.medusaService.cartsUpdate(cartId, {
      billing_address: addressWithoutEmail
    }).subscribe({
      next: (response) => {
        // Update cart in store - state will update via viewState$ subscription
        if (response.cart) {
          this.store.dispatch(new MedusaCartActions.UpdateMedusaCartState(response.cart));
        }
      },
      error: (error) => {
        this.hasBillingAddressError.set(true);
        this.isBillingAddressComplete.set(false);
      }
    });
  }

  /**
   * Load shipping options for the cart
   * Dispatches action to NGXS state which handles loading and calculating prices
   */
  private loadShippingOptions(): void {
    const cartId = this.cartId();
    if (!cartId) {
      return;
    }

    this.shippingOptionsError.set(null);

    // Dispatch action - NGXS will handle loading and calculating prices
    this.store.dispatch(new CheckoutActions.GetShippingOptions(cartId)).subscribe({
      next: () => {
        // State updated, will be reflected via selector subscription
        // Loading state is managed by NGXS state
      },
      error: (error) => {
        this.shippingOptionsError.set('Failed to load shipping options. Please try again.');
        this.isLoadingShippingOptions.set(false);
      }
    });
  }

  /**
   * Handle shipping method selection
   */
  onShippingMethodSelect(event: any): void {
    const optionId = event.detail.value;

    // Find the selected option
    const selectedOption = this.shippingOptions().find(opt => opt.id === optionId);
    if (!selectedOption) {
      return;
    }

    this.selectedShippingOption.set(selectedOption);

    // Add shipping method to cart
    const cartId = this.cartId();
    if (!cartId) {
      return;
    }

    // Note: from_location is handled automatically by Medusa on the backend.
    // The frontend should NOT send from_location in the request body.
    // Medusa resolves it from:
    // - The fulfillment set associated with the shipping option
    // - The stock location linked to that fulfillment set
    // - That location's address
    // The request body should only include option_id.
    
    this.medusaService.addShippingMethod(cartId, optionId).subscribe({
      next: (response) => {
        // Update cart in store - state will update via viewState$ subscription
        if (response.cart) {
          this.store.dispatch(new MedusaCartActions.UpdateMedusaCartState(response.cart));

          // Initialize payment sessions after shipping method is added
          this.initializePaymentSessions(response.cart);
        }

        this.isShippingMethodSelected.set(true);
        this.hasShippingMethodError.set(false);
      },
      error: (error) => {
        this.hasShippingMethodError.set(true);
        this.isShippingMethodSelected.set(false);
      }
    });
  }

  /**
   * Initialize payment sessions for the cart
   * This should be called after shipping method is added
   * Uses CheckoutFacade to create payment collection and load providers
   */
  private initializePaymentSessions(cart: MedusaCart): void {
    const cartId = cart.id;
    const regionId = cart.region_id;

    if (!regionId) {
      return;
    }

    // Use facade to create payment collection and load payment providers
    // Payment providers will be available via viewState$ subscription
    this.checkoutFacade.createPaymentProviders(cartId, regionId);
  }


  /**
   * Get estimated delivery time for shipping option
   * This is a placeholder - in a real app, this would come from the shipping option metadata
   */
  getEstimatedDelivery(option: IShippingOptions): string {
    // Check if metadata contains delivery time
    if (option.metadata && option.metadata.estimated_delivery) {
      return option.metadata.estimated_delivery;
    }

    // Default estimates based on option name
    const name = option.name.toLowerCase();
    if (name.includes('express') || name.includes('expedited')) {
      return '2-3 business days';
    } else if (name.includes('overnight') || name.includes('next day')) {
      return 'Next business day';
    } else if (name.includes('standard') || name.includes('ground')) {
      return '5-7 business days';
    }

    return 'Varies';
  }

  /**
   * Get user-friendly payment provider name
   */
  getPaymentProviderName(providerId: string): string {
    const providerNames: { [key: string]: string } = {
      'stripe': 'Credit/Debit Card',
      'paypal': 'PayPal',
      'manual': 'Manual Payment',
      'pp_stripe_stripe': 'Credit/Debit Card (Stripe)'
    };

    return providerNames[providerId] || providerId.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  }

  /**
   * Get payment provider description
   */
  getPaymentProviderDescription(providerId: string): string {
    const descriptions: { [key: string]: string } = {
      'stripe': 'Pay securely with your credit or debit card',
      'paypal': 'Pay with your PayPal account',
      'manual': 'Pay via bank transfer or other manual methods',
      'pp_stripe_stripe': 'Secure payment processing via Stripe'
    };

    return descriptions[providerId] || 'Secure payment processing';
  }

  /**
   * Handle payment method selection
   * Sets the payment session for the selected provider using CheckoutActions
   */
  onPaymentMethodSelect(event: any): void {
    const providerId = event.detail.value;

    const cartId = this.cartId();
    if (!cartId) {
      this.hasPaymentMethodError.set(true);
      return;
    }

    // Set the selected provider immediately for UI feedback
    this.selectedPaymentProvider.set(providerId);

    // Use facade to set the payment session for this provider
    // Client secret will be available via viewState$ subscription
    this.checkoutFacade.setPaymentSession(providerId, cartId).subscribe({
      next: () => {
        this.isPaymentMethodSelected.set(true);
        this.hasPaymentMethodError.set(false);
      },
      error: (error: any) => {
        this.hasPaymentMethodError.set(true);
        this.isPaymentMethodSelected.set(false);
        this.selectedPaymentProvider.set(null);
      }
    });
  }

  /**
   * Validate all sections and scroll to first error if validation fails
   */
  private validateAllSections(): boolean {
    let isValid = true;
    let firstErrorSection: string | null = null;

    // Validate email section (guest only)
    if (this.isGuestFlow() && !this.isEmailSectionComplete()) {
      this.hasEmailError.set(true);
      isValid = false;
      if (!firstErrorSection) firstErrorSection = 'email';
    }

    // Validate shipping address
    if (!this.isShippingAddressComplete()) {
      this.hasShippingAddressError.set(true);
      isValid = false;
      if (!firstErrorSection) firstErrorSection = 'shipping';
    }

    // Validate billing address
    if (!this.isBillingAddressComplete()) {
      this.hasBillingAddressError.set(true);
      isValid = false;
      if (!firstErrorSection) firstErrorSection = 'billing';
    }

    // Validate shipping method
    if (!this.isShippingMethodSelected()) {
      this.hasShippingMethodError.set(true);
      isValid = false;
      if (!firstErrorSection) firstErrorSection = 'shipping-method';
    }

    // Validate payment method
    if (!this.isPaymentMethodSelected()) {
      this.hasPaymentMethodError.set(true);
      isValid = false;
      if (!firstErrorSection) firstErrorSection = 'payment';
    }

    // Scroll to first error if validation failed
    if (!isValid && firstErrorSection) {
      this.scrollToSection(firstErrorSection);
    }

    return isValid;
  }

  /**
   * Scroll to a specific section by ID
   */
  private scrollToSection(sectionId: string): void {
    // Use setTimeout to ensure DOM is updated before scrolling
    setTimeout(() => {
      const element = document.getElementById(`section-${sectionId}`);
      if (element && this.content) {
        const yOffset = element.offsetTop - 60; // Offset for header
        this.content.scrollToPoint(0, yOffset, 500);
      }
    }, 100);
  }

  /**
   * Complete the checkout process
   * - Validates all sections
   * - Gets payment client secret from CheckoutState
   * - Opens payment modal for Stripe payment
   * - Completes cart after successful payment
   * - Navigates to order confirmation page
   */
  async completeCheckout(): Promise<void> {
    // Prevent multiple simultaneous checkout attempts
    if (this.isCompletingCheckout()) {
      return;
    }

    // Validate all sections before proceeding
    if (!this.validateAllSections()) {
      this.checkoutError.set('Please complete all required sections before proceeding');
      return;
    }

    if (!this.isCheckoutReady()) {
      this.checkoutError.set('Please ensure all checkout sections are complete');
      return;
    }

    // Verify payment method is selected
    if (!this.isPaymentMethodSelected()) {
      this.checkoutError.set('Please select a payment method before completing checkout');
      this.hasPaymentMethodError.set(true);
      this.scrollToSection('payment');
      return;
    }

    try {
      this.isCompletingCheckout.set(true);
      this.checkoutError.set(null);

      const selectedProvider = this.selectedPaymentProvider();

      // Check if using system default provider (mock payment)
      const isSystemDefault = selectedProvider === 'pp_system_default';

      // Refresh cart to ensure we have latest data
      const cartId = this.cartId();
      if (cartId) {
        try {
          const refreshedCartResponse = await lastValueFrom(
            this.medusaService.cartsRetrieve(cartId)
          );
          if (refreshedCartResponse?.cart) {
            // Update state - will be reflected via viewState$ subscription
            this.store.dispatch(new MedusaCartActions.UpdateMedusaCartState(refreshedCartResponse.cart));
          }
        } catch (refreshError) {
          // Use existing cart state if refresh fails
        }
      }

      const cart = this.checkoutFacade.getCartSnapshot();

      // Ensure cart email is set for guest checkout before proceeding
      if (this.isGuestFlow() && this.guestEmail()) {
        const currentCart = this.checkoutFacade.getCartSnapshot();
        if (!currentCart?.email || currentCart.email !== this.guestEmail()) {
          try {
            await lastValueFrom(
              this.medusaService.cartsUpdate(this.cartId()!, {
                email: this.guestEmail()
              })
            );
            // Cart state will update via viewState$ subscription
          } catch (emailError) {
            throw new Error('Failed to update cart email. Please try again.');
          }
        }
      }

      if (isSystemDefault) {
        // For system default, directly complete the cart without payment modal
        await this.completeCartDirectly();
      } else {
        // For other providers, get the payment client secret and open payment modal
        const clientSecret = await this.getPaymentClientSecret();

        if (!clientSecret) {
          throw new Error('Payment session not initialized. Please select a payment method and wait a moment before trying again.');
        }

        // Open the payment modal with the client secret
        await this.openPaymentModal(clientSecret);
      }

    } catch (error: any) {
      let errorMessage = error.message || 'An error occurred during checkout. Please try again.';

      // Provide helpful context for specific errors
      if (errorMessage.toLowerCase().includes('seat') && errorMessage.toLowerCase().includes('ticket')) {
        errorMessage = 'You can only purchase one ticket per seat. Please review your cart and remove any duplicate seat selections.';
      } else if (errorMessage.includes('payment session')) {
        this.hasPaymentMethodError.set(true);
        this.scrollToSection('payment');
      }

      this.checkoutError.set(errorMessage);
      this.isCompletingCheckout.set(false);
    }
  }

  /**
   * Get payment client secret from CheckoutFacade
   * Returns the client secret needed for Stripe payment
   * Will retry a few times if secret key is not immediately available
   */
  private async getPaymentClientSecret(): Promise<string> {
    return new Promise((resolve, reject) => {
      let attempts = 0;
      const maxAttempts = 5;
      const retryDelay = 300; // milliseconds

      const tryGetSecret = () => {
        attempts++;
        const clientSecret = this.checkoutFacade.getClientSecretSnapshot();

        if (!clientSecret || clientSecret.length === 0) {
          if (attempts < maxAttempts) {
            setTimeout(tryGetSecret, retryDelay);
          } else {
            reject(new Error('No payment session found. Please select a payment method and wait a moment before completing checkout.'));
          }
        } else {
          resolve(clientSecret);
        }
      };

      tryGetSecret();
    });
  }

  private checkoutApi = inject(CheckoutApiService);

  /**
   * Complete cart directly for system default payment provider
   * This bypasses the payment modal since pp_system_default doesn't require external payment
   * 
   * IMPORTANT: Ensures a payment collection exists before completing the cart.
   * This is required by Medusa - the cart must have an initiated payment collection.
   */
  private async completeCartDirectly(): Promise<void> {
    const cartId = this.cartId();
    if (!cartId) {
      throw new Error('No cart ID available');
    }

    try {
      // Step 1: Ensure payment collection exists
      // Refresh cart to get latest data including payment_collection
      let cart = this.checkoutFacade.getCartSnapshot();

      // Try to refresh cart to get latest payment_collection data
      try {
        const refreshedCartResponse = await lastValueFrom(
          this.medusaService.cartsRetrieve(cartId)
        );
        if (refreshedCartResponse?.cart) {
          cart = refreshedCartResponse.cart;
          // Update state with refreshed cart - state will update via viewState$ subscription
          this.store.dispatch(new MedusaCartActions.UpdateMedusaCartState(cart));
        }
      } catch (refreshError) {
        // Use cached cart data if refresh fails
      }

      // Check if cart has a payment collection (using type assertion since it's not in the interface)
      const cartWithPayment = cart as any;
      const hasPaymentCollection = cartWithPayment?.payment_collection?.id != null;

      if (!hasPaymentCollection) {
        // Create payment collection
        const paymentCollectionResponse = await lastValueFrom(
          this.checkoutApi.createPaymentCollection(cartId)
        );

        const paymentCollectionId = paymentCollectionResponse?.payment_collection?.id;
        if (!paymentCollectionId) {
          throw new Error('Failed to create payment collection');
        }

        // Create payment session for pp_system_default
        await lastValueFrom(
          this.checkoutApi.createPaymentSession(paymentCollectionId, 'pp_system_default')
        );
      } else {
        // Check if payment session exists for pp_system_default
        const paymentSessions = cartWithPayment.payment_collection?.payment_sessions || [];
        const hasSystemDefaultSession = paymentSessions.some(
          (session: any) => session.provider_id === 'pp_system_default'
        );

        if (!hasSystemDefaultSession) {
          await lastValueFrom(
            this.checkoutApi.createPaymentSession(cartWithPayment.payment_collection.id, 'pp_system_default')
          );
        }
      }


      // Step 3: Use facade to complete cart
      await lastValueFrom(
        this.checkoutFacade.completeCart()
      );

      // Wait a bit for the action to complete and state to update
      await new Promise(resolve => setTimeout(resolve, 500));

      // Check if order was created successfully
      const orderId = this.store.selectSnapshot(MedusaCartState.getCompletedOrderId);
      const error = this.store.selectSnapshot(MedusaCartState.getError);

      if (error) {
        // Extract and throw the error message from state
        const errorMessage = error || 'Failed to complete order. Please try again.';
        throw new Error(errorMessage);
      }

      if (orderId) {
        this.isCompletingCheckout.set(false);
        // Navigate forward to order confirmation page
        // Use payment: true to show success message and "Continue Shopping" button
        await this.router.navigate(
          ['/order-review'],
          {
            queryParams: { orderId, payment: true },
            replaceUrl: false // Allow back navigation
          }
        );
      } else {
        throw new Error('Order completion failed - no order ID returned');
      }
    } catch (error: any) {
      this.isCompletingCheckout.set(false);
      throw error;
    }
  }

  /**
   * Open the payment modal for Stripe payment processing
   * The modal handles payment confirmation and cart completion
   */
  private async openPaymentModal(clientSecret: string): Promise<void> {
    try {
      const modal = await this.modalCtrl.create({
        component: CardPaymentModal,
        componentProps: {
          secret_key: clientSecret
        },
        backdropDismiss: false // Prevent accidental dismissal during payment
      });

      await modal.present();

      // Wait for modal to be dismissed
      await modal.onWillDismiss();

      // Reset checkout state after modal dismissal
      this.isCompletingCheckout.set(false);

    } catch (error: any) {
      this.isCompletingCheckout.set(false);
      throw new Error('Failed to open payment form: ' + error.message);
    }
  }

  /**
   * Open address selection modal for logged-in users
   */
  async onEditAddress(type: 'shipping' | 'billing'): Promise<void> {
    const addresses = this.savedAddresses();

    if (addresses.length === 0) {
      // Navigate to add address page
      this.nav.navigateToAddAddress();
      return;
    }

    // Get currently selected address ID
    const currentAddressId = type === 'shipping'
      ? this.selectedShippingAddress()?.id
      : this.selectedBillingAddress()?.id;

    // Open address selection modal
    const modal = await this.modalCtrl.create({
      component: AddressSelectionModalComponent,
      componentProps: {
        addresses: addresses,
        selectedAddressId: currentAddressId,
        addressType: type
      }
    });

    await modal.present();

    const { data, role } = await modal.onWillDismiss();

    if (role === 'selected' && data) {
      // Address was selected
      this.handleAddressSelection(data, type);
    } else if (role === 'add-new') {
      // Navigate to add new address page
      this.nav.navigateToAddAddress();
    }
  }

  /**
   * Handle address selection from modal
   */
  private handleAddressSelection(address: MedusaAddress, type: 'shipping' | 'billing'): void {
    // Convert MedusaAddress to AddressFormData format
    const addressData = this.convertMedusaAddressToFormData(address);

    if (type === 'shipping') {
      this.selectedShippingAddress.set(address);
      this.shippingAddressData.set(addressData);
      this.isShippingFormValid.set(true);
      this.isShippingAddressComplete.set(true);
      this.hasShippingAddressError.set(false);

      // Reset shipping method selection when address changes
      this.selectedShippingOption.set(null);
      this.isShippingMethodSelected.set(false);

      this.updateCartShippingAddress(addressData, () => {
        // Reload shipping options after address change
        this.loadShippingOptions();
      });

      // If using same address for billing, update billing too
      if (this.useSameAddressForBilling()) {
        this.selectedBillingAddress.set(address);
        this.billingAddressData.set(addressData);
        this.isBillingFormValid.set(true);
        this.isBillingAddressComplete.set(true);
        this.hasBillingAddressError.set(false);
        this.updateCartBillingAddress(addressData);
      }
    } else {
      this.selectedBillingAddress.set(address);
      this.billingAddressData.set(addressData);
      this.isBillingFormValid.set(true);
      this.isBillingAddressComplete.set(true);
      this.hasBillingAddressError.set(false);
      this.updateCartBillingAddress(addressData);
    }
  }



  /**
   * Get product image URL for cart item
   */
  getProductImageUrl(item: any): string {
    if (item.thumbnail) {
      return item.thumbnail;
    }
    if (item.variant?.product?.thumbnail) {
      return item.variant.product.thumbnail;
    }
    return 'assets/placeholder-product.png';
  }

  /**
   * Get product title for cart item
   */
  getProductTitle(item: any): string {
    return item.title || item.variant?.product?.title || 'Product';
  }

  /**
   * Get variant title for cart item
   */
  getVariantTitle(item: any): string {
    if (item.variant?.title && item.variant.title !== 'Default Variant') {
      return item.variant.title;
    }
    return '';
  }
}

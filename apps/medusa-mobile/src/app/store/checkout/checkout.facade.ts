import { Injectable, inject } from '@angular/core';
import { Store } from '@ngxs/store';
import { Observable, combineLatest } from 'rxjs';
import { map } from 'rxjs/operators';
import { AuthState } from '../auth/auth.state';
import { MedusaCartState } from '../medusa-cart/medusa-cart.state';
import { CheckoutState } from './checkout.state';
import { CheckoutActions } from './checkout.actions';
import { MedusaCartActions } from '../medusa-cart/medusa-cart.actions';
import { MedusaCustomer, MedusaCart, MedusaAddress } from '../../shared/interfaces';
import { IShippingOptions, IPaymentProviders } from '../../shared/interfaces/shipping.interface';

export interface ICheckoutFacadeState {
  // Auth state
  isLoggedIn: boolean;
  customer: MedusaCustomer | null;

  // Cart state
  cart: MedusaCart | null;
  cartId: string | null;
  cartLoading: boolean;
  cartError: string | null;

  // Checkout state
  paymentProviders: IPaymentProviders[];
  shippingOptions: IShippingOptions[];
  clientSecret: string;

  // Computed values
  cartSubtotal: number;
  cartShippingTotal: number;
  cartTaxTotal: number;
  cartTotal: number;
  cartItems: any[];
  cartItemsCount: number;
}

@Injectable({
  providedIn: 'root'
})
export class CheckoutFacade {
  private store = inject(Store);

  // Individual observables
  isLoggedIn$: Observable<boolean> = this.store.select(AuthState.isLoggedIn);
  customer$: Observable<MedusaCustomer | null> = this.store.select(AuthState.getCustomer);
  cart$: Observable<MedusaCart | null> = this.store.select(MedusaCartState.getMedusaCart);
  cartLoading$: Observable<boolean> = this.store.select(MedusaCartState.getLoading);
  cartError$: Observable<string | null> = this.store.select(MedusaCartState.getError);
  paymentProviders$: Observable<IPaymentProviders[]> = this.store.select(CheckoutState.getPaymentProviders);
  shippingOptions$: Observable<IShippingOptions[]> = this.store.select(CheckoutState.getShippingOptions);
  clientSecret$: Observable<string> = this.store.select(CheckoutState.getSecretKey);

  // Combined viewState
  readonly viewState$: Observable<ICheckoutFacadeState>;

  constructor() {
    this.viewState$ = combineLatest([
      this.isLoggedIn$,
      this.customer$,
      this.cart$,
      this.cartLoading$,
      this.cartError$,
      this.paymentProviders$,
      this.shippingOptions$,
      this.clientSecret$
    ]).pipe(
      map(([
        isLoggedIn,
        customer,
        cart,
        cartLoading,
        cartError,
        paymentProviders,
        shippingOptions,
        clientSecret
      ]) => ({
        isLoggedIn,
        customer,
        cart,
        cartId: cart?.id || null,
        cartLoading,
        cartError,
        paymentProviders,
        shippingOptions,
        clientSecret,
        cartSubtotal: cart?.subtotal || 0,
        cartShippingTotal: cart?.shipping_total || 0,
        cartTaxTotal: cart?.tax_total || 0,
        cartTotal: cart?.total || 0,
        cartItems: cart?.items || [],
        cartItemsCount: cart?.items?.length || 0
      }))
    );
  }

  // Actions
  refreshCartById(cartId: string): void {
    this.store.dispatch(new MedusaCartActions.RefreshCartById(cartId));
  }

  createPaymentProviders(cartId: string, regionId: string): void {
    this.store.dispatch(new CheckoutActions.CreatePaymentProviders(cartId, regionId));
  }

  setPaymentSession(providerId: string, cartId: string): Observable<any> {
    return this.store.dispatch(new CheckoutActions.SetPaymentSession(providerId, cartId));
  }

  completeCart(): Observable<any> {
    return this.store.dispatch(new MedusaCartActions.CompleteCart());
  }

  // Selectors (snapshot helpers)
  getCartSnapshot(): MedusaCart | null {
    return this.store.selectSnapshot(MedusaCartState.getMedusaCart);
  }

  getIsLoggedInSnapshot(): boolean {
    return this.store.selectSnapshot(AuthState.isLoggedIn);
  }

  getCustomerSnapshot(): MedusaCustomer | null {
    return this.store.selectSnapshot(AuthState.getCustomer);
  }

  getClientSecretSnapshot(): string {
    return this.store.selectSnapshot(CheckoutState.getSecretKey);
  }

  getPaymentProvidersSnapshot(): IPaymentProviders[] {
    return this.store.selectSnapshot(CheckoutState.getPaymentProviders);
  }
}


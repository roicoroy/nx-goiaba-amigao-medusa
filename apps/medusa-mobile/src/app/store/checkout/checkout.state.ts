import { Injectable, inject } from '@angular/core';
import { Action, Selector, State, StateContext, Store } from '@ngxs/store';
import { lastValueFrom, Observable, of, forkJoin, take, switchMap, catchError, map } from 'rxjs';
import { CheckoutActions } from './checkout.actions';
import { IShippingOptions, IPaymentProviders } from '../../shared/interfaces/shipping.interface';
import { CheckoutApiService } from '../../shared/api/checkout-api.service';
import { MedusaService } from 'src/app/shared/api/medusa.service';

export interface CheckoutStateModel {
  shipping_options: IShippingOptions[];
  provider_id: string;
  client_secret: string;
  payment_providers: IPaymentProviders[];
  isCalculatingShippingPrices: boolean;
}

@State({
  name: 'checkout',
  defaults: {
    shipping_options: [],
    provider_id: '',
    client_secret: '',
    payment_providers: [],
    isCalculatingShippingPrices: false
  }
})
@Injectable()
export class CheckoutState {

  private store = inject(Store);
  private medusaApi = inject(MedusaService);
  private checkoutApi = inject(CheckoutApiService);

  @Selector()
  static getShippingOptions(state: CheckoutStateModel): IShippingOptions[] {
    return state.shipping_options;
  }

  @Selector()
  static getPaymentProviders(state: CheckoutStateModel): IPaymentProviders[] {
    return state.payment_providers;
  }

  @Selector()
  static getSecretKey(state: CheckoutStateModel) {
    return state.client_secret;
  }

  @Selector()
  static isCalculatingShippingPrices(state: CheckoutStateModel): boolean {
    return state.isCalculatingShippingPrices;
  }

  @Action(CheckoutActions.GetShippingOptions)
  getShippingOptions(ctx: StateContext<CheckoutStateModel>, { cartId }: CheckoutActions.GetShippingOptions): Observable<any> | void {
    if (!cartId) {
      return;
    }

    // Set calculating state
    ctx.patchState({ isCalculatingShippingPrices: true });

    return this.medusaApi.ListOptionsForCart(cartId).pipe(
      take(1),
      switchMap((res: any) => {
        const options: IShippingOptions[] = res.shipping_options || [];
        
        // Separate flat and calculated pricing options
        const flatOptions = options.filter(opt => opt.price_type !== 'calculated');
        const calculatedOptions = options.filter(opt => opt.price_type === 'calculated');
        
        // If no calculated options, return flat options directly
        if (calculatedOptions.length === 0) {
          ctx.patchState({
            shipping_options: flatOptions,
            isCalculatingShippingPrices: false
          });
          return of(flatOptions);
        }
        
        // Calculate prices for calculated options using forkJoin
        const calculatedPriceRequests$ = calculatedOptions.map(option => 
          this.medusaApi.calculateShippingOptionPrice(option.id, cartId, option.data).pipe(
            map(calculatedPrice => ({
              ...option,
              calculated_amount: calculatedPrice.calculated_amount,
              is_calculated_price_tax_inclusive: calculatedPrice.is_calculated_price_tax_inclusive,
              amount: calculatedPrice.calculated_amount // Use calculated amount for display
            })),
            catchError(error => {
              console.error(`Failed to calculate price for option ${option.id}:`, error);
              // Return option with error flag
              return of({
                ...option,
                calculation_error: true
              });
            })
          )
        );
        
        // Wait for all calculations to complete
        return forkJoin(calculatedPriceRequests$).pipe(
          map(calculatedOptionsWithPrices => {
            // Combine flat options with calculated options
            const allOptions = [...flatOptions, ...calculatedOptionsWithPrices];
            ctx.patchState({
              shipping_options: allOptions,
              isCalculatingShippingPrices: false
            });
            return allOptions;
          }),
          catchError(_error => {
            console.error('Error calculating shipping prices:', _error);
            // Return flat options even if calculations fail
            ctx.patchState({
              shipping_options: flatOptions,
              isCalculatingShippingPrices: false
            });
            return of(flatOptions);
          })
        );
      }),
      catchError(error => {
        console.error('Error loading shipping options:', error);
        ctx.patchState({
          shipping_options: [],
          isCalculatingShippingPrices: false
        });
        return of([]);
      })
    );
  }

  @Action(CheckoutActions.AddShippingMethod)
  async addShippingMethod(ctx: StateContext<CheckoutStateModel>, { option_id }: CheckoutActions.AddShippingMethod) {
    try {
      // Get cart from MedusaCartState
      const cart = this.store.selectSnapshot((state: any) => state.medusaCart?.medusaCart);

      if (!cart?.id) {
        return;
      }

      // Note: from_location is handled automatically by Medusa on the backend.
      // The frontend should NOT send from_location in the request body.
      // Medusa resolves it from:
      // - The fulfillment set associated with the shipping option
      // - The stock location linked to that fulfillment set
      // - That location's address
      // The request body should only include option_id.

      // Add shipping method to cart via MedusaService (goes through interceptors)
      const response = await lastValueFrom(
        this.medusaApi.addShippingMethod(cart.id, option_id)
      );

      const { cart: updatedCart } = response;

      // Dispatch action to update cart state
      this.store.dispatch({ type: '[MedusaCart] Update Cart State', cart: updatedCart });

    } catch (error: any) {
      // Error handling is done at the component level
    }
  }

  @Action(CheckoutActions.CreatePaymentProviders)
  async createPaymentProviders(ctx: StateContext<CheckoutStateModel>, { cartId, regionId }: any) {
    try {
      if (!cartId) {
        return;
      }

      // Step 1: Create payment collection for the cart
      await lastValueFrom(
        this.checkoutApi.createPaymentCollection(cartId)
      );

      // Step 2: Get payment providers for the region
      if (!regionId) {
        return;
      }

      const { payment_providers } = await lastValueFrom(
        this.checkoutApi.getPaymentProviders(regionId)
      );

      ctx.patchState({
        payment_providers: payment_providers || []
      });
    } catch (error) {
      ctx.patchState({
        payment_providers: []
      });
    }
  }

  @Action(CheckoutActions.SetPaymentSession)
  async setPaymentSession(ctx: StateContext<CheckoutStateModel>, { payment_provider_id, cartId }: any) {
    try {
      // Clear any existing payment session first to ensure fresh payment intent
      ctx.patchState({
        client_secret: '',
        provider_id: ''
      });

      // Validate that we have a valid cart ID
      if (!cartId) {
        throw new Error('No valid cart ID provided. Please ensure you have items in your cart.');
      }

      // Step 1: Create payment collection
      const response = await lastValueFrom(
        this.checkoutApi.createPaymentCollection(cartId)
      );
      const paymentCollectionId = response.payment_collection.id;

      // Step 2: Create payment session for the selected provider
      await lastValueFrom(
        this.checkoutApi.createPaymentSession(paymentCollectionId, payment_provider_id)
      );

      // Step 3: Re-fetch cart to get updated payment collection
      const updatedCart = await lastValueFrom(
        this.checkoutApi.getCart(cartId)
      );

      // Step 4: Extract client secret from the correct payment session
      const paymentSessions = updatedCart.cart.payment_collection?.payment_sessions || [];
      const targetSession = paymentSessions.find((session: any) => session.provider_id === payment_provider_id);
      const isSystemDefault = payment_provider_id === 'pp_system_default';
      const clientSecret = targetSession?.data?.client_secret;

      if (!isSystemDefault && !clientSecret) {
        throw new Error('Failed to create payment session - no client secret received');
      }

      ctx.patchState({
        client_secret: clientSecret || '',
        provider_id: payment_provider_id
      });
    } catch (error) {
      // Clear state on error
      ctx.patchState({
        client_secret: '',
        provider_id: ''
      });
      throw error;
    }
  }

  @Action(CheckoutActions.UnSetSecretKey)
  unSetSecretKey(ctx: StateContext<CheckoutStateModel>): void {
    ctx.patchState({
      client_secret: '',
      provider_id: '', // Also clear provider to force fresh session creation
    });
  }


  @Action(CheckoutActions.LogOut)
  logOut(ctx: StateContext<CheckoutStateModel>) {
    ctx.patchState({
      shipping_options: [],
      provider_id: '',
      client_secret: '',
      payment_providers: [],
      isCalculatingShippingPrices: false
    });
  }
}

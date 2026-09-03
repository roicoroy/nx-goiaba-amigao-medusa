import { Injectable, inject } from '@angular/core';
import { Action, Selector, State, StateContext, Store } from '@ngxs/store';
import { Observable, catchError, lastValueFrom, take, throwError } from 'rxjs';
import { MedusaCartActions } from './medusa-cart.actions';
import { RegionsState } from '../regions/regions.state';
import { AuthState } from '../auth/auth.state';
import { MedusaCart, MedusaOrder, AddCartLineItemInput } from 'src/app/shared/interfaces';
import { MedusaService } from 'src/app/shared/api/medusa.service';

export interface MedusaCartStateModel {
  medusaCart: MedusaCart | null;
  completed_order_id: string;
  completedOrder: MedusaOrder | null;
  loading: boolean;
  error: string | null;
}

@State<MedusaCartStateModel>({
  name: 'medusaCart',
  defaults: {
    medusaCart: null,
    completed_order_id: '',
    completedOrder: null,
    loading: false,
    error: null
  }
})
@Injectable()
export class MedusaCartState {
  private medusaApi = inject(MedusaService);
  private store = inject(Store);

  @Selector()
  static getMedusaCart(state: MedusaCartStateModel): MedusaCart | null {
    return state?.medusaCart || null;
  }

  @Selector()
  static getCartId(state: MedusaCartStateModel): string | undefined {
    return state?.medusaCart?.id;
  }

  @Selector()
  static getCompletedOrderId(state: MedusaCartStateModel): string {
    return state?.completed_order_id || '';
  }

  @Selector()
  static getCompletedOrder(state: MedusaCartStateModel): MedusaOrder | null {
    return state?.completedOrder || null;
  }

  @Selector()
  static getLoading(state: MedusaCartStateModel): boolean {
    return state?.loading || false;
  }

  @Selector()
  static getError(state: MedusaCartStateModel): string | null {
    return state?.error || null;
  }

  @Selector()
  static getCartItemsCount(state: MedusaCartStateModel): number {
    return state?.medusaCart?.items?.length || 0;
  }

  @Action(MedusaCartActions.AddToMedusaCart)
  addToCart(ctx: StateContext<MedusaCartStateModel>, { variant }: MedusaCartActions.AddToMedusaCart) {
    try {
      ctx.patchState({ loading: true, error: null });
      const medusaCart = ctx.getState().medusaCart;
      const lineItem: AddCartLineItemInput = {
        variant_id: variant.id,
        quantity: 1,
      };

      // Check if current cart is completed and create new one if needed
      if (!medusaCart || medusaCart.completed_at) {
        // Check if user is logged in and might have an existing customer cart
        const isLoggedIn = this.store.selectSnapshot(AuthState.isLoggedIn);
        const customer = this.store.selectSnapshot(AuthState.getCustomer);
        
        // If logged in, Medusa will automatically return customer's existing cart or create new one
        // If not logged in, create guest cart
        const selectedCountry = this.store.selectSnapshot(RegionsState.getDefaultRegion);
        this.medusaApi.cartsCreate(selectedCountry?.region_id).pipe(
          catchError(error => {
            ctx.patchState({ loading: false, error: error.message });
            return throwError(() => error);
          })
        ).subscribe((res: any) => {
          if (res.cart) {
            ctx.patchState({
              medusaCart: res.cart,
              loading: false
            });
            this.store.dispatch(new MedusaCartActions.AddCartLineItems(res.cart.id, lineItem));
          } else {
            ctx.patchState({ loading: false, error: 'Failed to create cart' });
          }
        });
      } else {
        // Check if cart belongs to current customer (if logged in)
        const isLoggedIn = this.store.selectSnapshot(AuthState.isLoggedIn);
        const customer = this.store.selectSnapshot(AuthState.getCustomer);
        
        // If logged in and cart doesn't belong to customer, we might need to transfer it
        // But this should be rare - usually handled during login
        if (isLoggedIn && customer?.id && medusaCart.customer_id && medusaCart.customer_id !== customer.id) {
          const selectedCountry = this.store.selectSnapshot(RegionsState.getDefaultRegion);
          this.medusaApi.cartsCreate(selectedCountry?.region_id).pipe(
            catchError(error => {
              ctx.patchState({ loading: false, error: error.message });
              return throwError(() => error);
            })
          ).subscribe((res: any) => {
            if (res.cart) {
              ctx.patchState({
                medusaCart: res.cart,
                loading: false
              });
              this.store.dispatch(new MedusaCartActions.AddCartLineItems(res.cart.id, lineItem));
            } else {
              ctx.patchState({ loading: false, error: 'Failed to create cart' });
            }
          });
        } else {
          // Use existing cart
          this.store.dispatch(new MedusaCartActions.AddCartLineItems(medusaCart.id, lineItem));
          ctx.patchState({ loading: false });
        }
      }
    } catch (error: any) {
      ctx.patchState({ loading: false, error: error.message });
      console.error(error);
    }
  }

  @Action(MedusaCartActions.AddCartLineItems)
  addCartLineItems(ctx: StateContext<MedusaCartStateModel>, { cartId, items }: MedusaCartActions.AddCartLineItems) {
    // Validate quantity to prevent negative values
    if (items.quantity < 0) {
      console.error('Invalid quantity: Cannot add negative quantity to cart', items);
      ctx.patchState({
        loading: false,
        error: 'Invalid quantity: Cannot add negative quantity to cart'
      });
      return;
    }

    ctx.patchState({ loading: true, error: null });
    return this.medusaApi.AddCartLineItems(cartId, items).pipe(
      catchError(error => {
        console.error('Error adding cart line items:', error);

        // Check if the error is due to cart being completed
        if (error.message && error.message.includes('already completed')) {
          ctx.patchState({
            medusaCart: null,
            loading: false,
            error: 'Cart was completed. Creating a new cart...'
          });

          // Trigger creation of new cart with the same item
          setTimeout(() => {
            this.store.dispatch(new MedusaCartActions.AddToMedusaCart({ id: items.variant_id } as any));
          }, 100);

          return throwError(() => error);
        }

        ctx.patchState({ loading: false, error: error.message });
        return throwError(() => error);
      })
    ).subscribe((res: any) => {
      ctx.patchState({
        medusaCart: res?.cart,
        loading: false
      });
    });
  }

  @Action(MedusaCartActions.RefreshCart)
  refreshCart(ctx: StateContext<MedusaCartStateModel>) {
    try {
      ctx.patchState({ loading: true, error: null });
      const cartId = ctx.getState().medusaCart?.id;

      if (cartId != null) {
        this.medusaApi.cartsRetrieve(cartId).subscribe({
          next: (res: any) => {
            ctx.patchState({
              medusaCart: res.cart,
              loading: false
            });
          },
          error: (error) => {
            console.error('Error refreshing cart:', error);
            // Don't clear the cart on API errors - just set error state
            ctx.patchState({
              loading: false,
              error: error.message
            });
          }
        });
      } else {
        ctx.patchState({
          medusaCart: null,
          loading: false
        });
      }
    } catch (error: any) {
      console.error('Error in refreshCart:', error);
      // Don't clear the cart on exceptions - just set error state
      ctx.patchState({
        loading: false,
        error: error.message
      });
    }
  }

  @Action(MedusaCartActions.RefreshCartById)
  refreshCartById(ctx: StateContext<MedusaCartStateModel>, { cartId }: MedusaCartActions.RefreshCartById) {
    try {
      ctx.patchState({ loading: true, error: null });

      if (cartId) {
        this.medusaApi.cartsRetrieve(cartId).subscribe({
          next: (res: any) => {
            const cart = res.cart;

            // Check if the cart is completed
            if (cart && cart.completed_at) {
              ctx.patchState({
                medusaCart: null,
                loading: false,
                error: 'Cart has already been completed'
              });
            } else {
              ctx.patchState({
                medusaCart: cart,
                loading: false
              });
            }
          },
          error: (error) => {
            console.error('Error refreshing cart by ID:', error);

            // If cart not found or other error, clear the cart state
            if (error.status === 404) {
              ctx.patchState({
                medusaCart: null,
                loading: false,
                error: 'Cart not found'
              });
            } else {
              ctx.patchState({
                loading: false,
                error: error.message
              });
            }
          }
        });
      } else {
        console.error('RefreshCartById called without cart ID');
        ctx.patchState({
          loading: false,
          error: 'No cart ID provided'
        });
      }
    } catch (error: any) {
      console.error('Error in refreshCartById:', error);
      ctx.patchState({
        loading: false,
        error: error.message
      });
    }
  }

  @Action(MedusaCartActions.RetriveCompletedOrder)
  retrieveCompletedOrder(ctx: StateContext<MedusaCartStateModel>, { orderId }: MedusaCartActions.RetriveCompletedOrder) {
    ctx.patchState({ loading: true, error: null });
    this.medusaApi.retriveCompletedOrder(orderId).pipe(
      take(1),
      catchError(error => {
        ctx.patchState({ loading: false, error: error.message });
        return throwError(() => error);
      })
    ).subscribe((res: any) => {
      ctx.patchState({
        completedOrder: res.order,
        loading: false
      });
    });
  }

  @Action(MedusaCartActions.UpdateCartRegion)
  updateCartRegion(ctx: StateContext<MedusaCartStateModel>, { region_id }: MedusaCartActions.UpdateCartRegion) {
    const cartId = ctx.getState().medusaCart?.id;
    const data: any = { region_id };

    if (cartId) {
      ctx.patchState({ loading: true, error: null });
      this.medusaApi.cartsUpdate(cartId, data).pipe(
        catchError(error => {
          ctx.patchState({ loading: false, error: error.message });
          return throwError(() => error);
        })
      ).subscribe((res: any) => {
        if (res.cart) {
          ctx.patchState({
            medusaCart: res?.cart,
            loading: false
          });
        } else {
          ctx.patchState({ loading: false, error: 'Failed to update cart region' });
        }
      });
    } else {
      ctx.patchState({ loading: false, error: 'No cart available to update region' });
    }
  }

  @Action(MedusaCartActions.UpdateMedusaCart)
  updateMedusaCart(ctx: StateContext<MedusaCartStateModel>, { updateCartData }: MedusaCartActions.UpdateMedusaCart) {
    const cartId = ctx.getState().medusaCart?.id;
    
    if (!cartId) {
      ctx.patchState({ loading: false, error: 'No cart available to update' });
      return;
    }

    ctx.patchState({ loading: true, error: null });

    // Check if this is a line item update
    if (updateCartData.line_items && updateCartData.line_items.length > 0) {
      const lineItem = updateCartData.line_items[0];
      this.medusaApi.updateCartLineItems(cartId, lineItem.id, { quantity: lineItem.quantity }).pipe(
        catchError(error => {
          ctx.patchState({ loading: false, error: error.message });
          return throwError(() => error);
        })
      ).subscribe((res: any) => {
        if (res.cart) {
          ctx.patchState({
            medusaCart: res?.cart,
            loading: false
          });
        } else {
          ctx.patchState({ loading: false, error: 'Failed to update cart line item' });
        }
      });
    } else {
      // Handle general cart updates
      this.medusaApi.cartsUpdate(cartId, updateCartData).pipe(
        catchError(error => {
          ctx.patchState({ loading: false, error: error.message });
          return throwError(() => error);
        })
      ).subscribe((res: any) => {
        if (res.cart) {
          ctx.patchState({
            medusaCart: res?.cart,
            loading: false
          });
        } else {
          ctx.patchState({ loading: false, error: 'Failed to update cart' });
        }
      });
    }
  }

  @Action(MedusaCartActions.AddPromotionstoCart)
  addPromotionstoCart(ctx: StateContext<MedusaCartStateModel>, { promo_code }: MedusaCartActions.AddPromotionstoCart) {
    const cartId = ctx.getState().medusaCart?.id;
    ctx.patchState({ loading: true, error: null });

    this.medusaApi.AddPromotionstoCart(cartId!, promo_code).pipe(
      catchError(error => {
        ctx.patchState({ loading: false, error: error.message });
        return throwError(() => error);
      })
    ).subscribe((cart: any) => {
      ctx.patchState({
        medusaCart: cart?.cart,
        loading: false
      });
    });
  }

  @Action(MedusaCartActions.RemovePromotionsfromCart)
  async removePromotionsfromCart(ctx: StateContext<MedusaCartStateModel>, { promo_code }: MedusaCartActions.RemovePromotionsfromCart) {
    try {
      const cartId = ctx.getState().medusaCart?.id;
      if (!cartId) {
        ctx.patchState({ loading: false, error: 'No cart ID available' });
        return;
      }

      ctx.patchState({ loading: true, error: null });

      // Use MedusaService to remove promotions
      const response = await lastValueFrom(
        this.medusaApi.RemovePromotionstoCart(cartId, [promo_code])
      );

      const { cart } = response;
      ctx.patchState({
        medusaCart: cart,
        loading: false
      });
    } catch (error: any) {
      ctx.patchState({ loading: false, error: error.message || error.userMessage || 'Failed to remove promotion' });
    }
  }

  @Action(MedusaCartActions.IncreaseCartItem)
  increaseCartItem(ctx: StateContext<MedusaCartStateModel>, { cartItem }: MedusaCartActions.IncreaseCartItem): void {
    const cart = ctx.getState().medusaCart;
    const cartId = cart?.id;

    // Check if cart is completed
    if (cart && cart.completed_at) {
      ctx.patchState({
        medusaCart: null,
        loading: false,
        error: 'Cart was completed. Creating a new cart...'
      });

      // Create new cart and add item
      setTimeout(() => {
        this.store.dispatch(new MedusaCartActions.AddToMedusaCart({ id: cartItem.variant_id } as any));
      }, 100);
      return;
    }

    if (cartId != null) {
      ctx.patchState({ loading: true, error: null });
      const lineItemInput: AddCartLineItemInput = {
        variant_id: cartItem.variant_id,
        quantity: 1
      };
      this.medusaApi.AddCartLineItems(cartId, lineItemInput).pipe(
        catchError(error => {
          console.error('Error increasing cart item:', error);

          // Check if the error is due to cart being completed
          if (error.message && error.message.includes('already completed')) {
            ctx.patchState({
              medusaCart: null,
              loading: false,
              error: 'Cart was completed. Creating a new cart...'
            });

            // Create new cart and add item
            setTimeout(() => {
              this.store.dispatch(new MedusaCartActions.AddToMedusaCart({ id: cartItem.variant_id } as any));
            }, 100);

            return throwError(() => error);
          }

          ctx.patchState({ loading: false, error: error.message });
          return throwError(() => error);
        })
      ).subscribe((res: any) => {
        ctx.patchState({
          medusaCart: res.cart,
          loading: false
        });
      });
    }
  }

  @Action(MedusaCartActions.DecreaseCartItem)
  decreaseCartItem(ctx: StateContext<MedusaCartStateModel>, { cartItem }: MedusaCartActions.DecreaseCartItem): void {
    const cart = ctx.getState().medusaCart;

    // Check if cart is completed
    if (cart && cart.completed_at) {
      ctx.patchState({
        loading: false,
        error: 'Cannot modify completed cart'
      });
      return;
    }

    if (cart?.id != null) {
      const filteredItem: any = cart.items?.filter((item: any) => item.variant_id === cartItem.variant_id);
      if (filteredItem && filteredItem[0]) {
        const currentItem = filteredItem[0];
        const newQuantity = currentItem.quantity - 1;

        if (newQuantity >= 1) {
          // Update the item quantity using the proper API method
          ctx.patchState({ loading: true, error: null });
          this.medusaApi.updateCartLineItems(cart.id, currentItem.id, { quantity: newQuantity }).pipe(
            catchError(error => {
              console.error('Error decreasing cart item:', error);

              // Check if the error is due to cart being completed
              if (error.message && error.message.includes('already completed')) {
                ctx.patchState({
                  medusaCart: null,
                  loading: false,
                  error: 'Cart was completed'
                });
                return throwError(() => error);
              }

              ctx.patchState({ loading: false, error: error.message });
              return throwError(() => error);
            })
          ).subscribe((res: any) => {
            ctx.patchState({
              medusaCart: res.cart,
              loading: false
            });
          });
        } else {
          // If quantity would be 0 or less, delete the item
          this.store.dispatch(new MedusaCartActions.DeleteCartItem(currentItem.id));
        }
      }
    }
  }

  @Action(MedusaCartActions.DeleteCartItem)
  deleteProductMedusaFromCart(ctx: StateContext<MedusaCartStateModel>, { line_id }: MedusaCartActions.DeleteCartItem): void {
    const savedCart = ctx.getState().medusaCart;
    if (savedCart != null) {
      ctx.patchState({ loading: true, error: null });
      this.medusaApi.cartsLineItemsDelete(savedCart.id, line_id).pipe(
        catchError(error => {
          ctx.patchState({ loading: false, error: error.message });
          return throwError(() => error);
        })
      ).subscribe((res: any) => {
        ctx.patchState({
          medusaCart: res?.parent,
          loading: false
        });
      });
    } else {
      ctx.patchState({ loading: false, error: 'No cart available to delete item from' });
    }
  }

  @Action(MedusaCartActions.CompleteCart)
  async completeCart(ctx: StateContext<MedusaCartStateModel>) {
    try {
      const cartId = ctx.getState().medusaCart?.id;
      
      if (!cartId) {
        ctx.patchState({ loading: false, error: 'No cart available to complete' });
        return;
      }

      ctx.patchState({ loading: true, error: null });
      const res = await lastValueFrom(this.medusaApi.completeMedusaCart(cartId));
      ctx.patchState({
        medusaCart: null,
        completed_order_id: res.order.id,
        completedOrder: res.type === 'order' ? res?.order : null,
        loading: false
      });
    } catch (error: any) {
      console.error('Error completing cart:', error);
      ctx.patchState({ loading: false, error: error.message });
    }
  }

  @Action(MedusaCartActions.UpdateMedusaCartState)
  async updateMedusaCartState(ctx: StateContext<MedusaCartStateModel>, { cart }: MedusaCartActions.UpdateMedusaCartState) {
    return ctx.patchState({
      medusaCart: cart,
      error: null
    });
  }

  @Action(MedusaCartActions.ClearCart)
  clearCart(ctx: StateContext<MedusaCartStateModel>) {
    ctx.patchState({
      medusaCart: null,
      completedOrder: null,
      completed_order_id: '',
      loading: false,
      error: null
    });
  }

  @Action(MedusaCartActions.LogOut)
  logout(ctx: StateContext<MedusaCartStateModel>) {
    // Don't clear the cart on logout - keep it as guest cart
    // The cart will persist in NGXS storage and can be used when user logs back in
    // Medusa handles guest carts, so we just keep the cart state
    const currentCart = ctx.getState().medusaCart;
    
    // Cart remains in state as guest cart (customer_id will be null after logout)
    // NGXS storage will persist it automatically
    
    // Only clear completed order info, keep the cart
    ctx.patchState({
      completedOrder: null,
      completed_order_id: '',
      loading: false,
      error: null
    });
  }

  @Action(MedusaCartActions.CreateNewCart)
  createNewCart(ctx: StateContext<MedusaCartStateModel>, { regionId }: MedusaCartActions.CreateNewCart) {
    try {
      ctx.patchState({ loading: true, error: null });

      const selectedRegion = regionId || this.store.selectSnapshot(RegionsState.getDefaultRegion)?.region_id;

      if (!selectedRegion) {
        ctx.patchState({
          loading: false,
          error: 'No region available for cart creation'
        });
        return;
      }

      // Check if user is logged in - Medusa will handle customer association automatically
      const isLoggedIn = this.store.selectSnapshot(AuthState.isLoggedIn);
      const customer = this.store.selectSnapshot(AuthState.getCustomer);

      this.medusaApi.cartsCreate(selectedRegion).pipe(
        catchError(error => {
          ctx.patchState({ loading: false, error: error.message });
          return throwError(() => error);
        })
      ).subscribe((res: any) => {
        if (res.cart) {
          ctx.patchState({
            medusaCart: res.cart,
            completed_order_id: '', // Clear any previous order ID
            completedOrder: null,
            loading: false,
            error: null
          });
        } else {
          ctx.patchState({ loading: false, error: 'Failed to create new cart' });
        }
      });
    } catch (error: any) {
      ctx.patchState({ loading: false, error: error.message });
      console.error('Error creating new cart:', error);
    }
  }

  @Action(MedusaCartActions.TransferCart)
  transferCart(ctx: StateContext<MedusaCartStateModel>, { cartId }: MedusaCartActions.TransferCart) {
    ctx.patchState({ loading: true, error: null });

    // Verify user is logged in (customer ID comes from Authorization token)
    const isLoggedIn = this.store.selectSnapshot(AuthState.isLoggedIn);
    const token = this.store.selectSnapshot(AuthState.getToken);
    
    if (!isLoggedIn || !token) {
      const errorMessage = 'User must be authenticated to transfer cart';
      ctx.dispatch(new MedusaCartActions.TransferCartFailure(errorMessage));
      ctx.patchState({ loading: false, error: errorMessage });
      console.error('TransferCart: User must be logged in with valid token');
      return;
    }

    // Customer ID is extracted from the Authorization token by Medusa
    // Body is optional - only send if we have additional_data
    this.medusaApi.transferCart(cartId).pipe(
      take(1),
      catchError(error => {
        const errorMessage = error?.message || 'Failed to transfer cart to customer';
        ctx.dispatch(new MedusaCartActions.TransferCartFailure(errorMessage));
        return throwError(() => error);
      })
    ).subscribe((res: any) => {
      if (res.cart) {
        ctx.dispatch(new MedusaCartActions.TransferCartSuccess(res.cart));
      } else {
        ctx.patchState({ loading: false, error: 'Failed to transfer cart' });
      }
    });
  }

  @Action(MedusaCartActions.TransferCartSuccess)
  transferCartSuccess(ctx: StateContext<MedusaCartStateModel>, { cart }: MedusaCartActions.TransferCartSuccess): void {
    ctx.patchState({
      medusaCart: cart,
      loading: false,
      error: null
    });
  }

  @Action(MedusaCartActions.TransferCartFailure)
  transferCartFailure(ctx: StateContext<MedusaCartStateModel>, { error }: MedusaCartActions.TransferCartFailure): void {
    ctx.patchState({
      loading: false,
      error
    });
  }

  @Action(MedusaCartActions.RestoreCart)
  restoreCart(ctx: StateContext<MedusaCartStateModel>) {
    const cart = ctx.getState().medusaCart;
    
    // If no cart in state, nothing to restore
    if (!cart || !cart.id) {
      // No cart to restore - this is normal for new sessions
      ctx.patchState({ loading: false });
      return;
    }

    ctx.patchState({ loading: true, error: null });
    const isLoggedIn = this.store.selectSnapshot(AuthState.isLoggedIn);
    const customer = this.store.selectSnapshot(AuthState.getCustomer);

    // Validate cart by retrieving it from API
    this.medusaApi.cartsRetrieve(cart.id).pipe(
      take(1),
      catchError(error => {
        // If cart not found or invalid, clear it
        if (error.status === 404) {
          ctx.patchState({
            medusaCart: null,
            loading: false,
            error: null
          });
        } else {
          console.error('Error restoring cart:', error);
          ctx.patchState({
            loading: false,
            error: error.message
          });
        }
        return throwError(() => error);
      })
    ).subscribe((res: any) => {
      const restoredCart = res.cart;

      // Check if cart is completed
      if (restoredCart.completed_at) {
        ctx.patchState({
          medusaCart: null,
          loading: false,
          error: null
        });
        return;
      }

      // If user is logged in, verify cart belongs to customer
      if (isLoggedIn && customer?.id) {
        if (restoredCart.customer_id && restoredCart.customer_id !== customer.id) {
          ctx.patchState({
            medusaCart: null,
            loading: false,
            error: null
          });
          return;
        }
        
        // If cart is guest cart but user is logged in, transfer it
        if (!restoredCart.customer_id) {
          ctx.dispatch(new MedusaCartActions.TransferCart(restoredCart.id));
          return;
        }
      }

      // If user is not logged in but cart has customer_id, it's invalid
      if (!isLoggedIn && restoredCart.customer_id) {
        ctx.patchState({
          medusaCart: null,
          loading: false,
          error: null
        });
        return;
      }

      // Cart is valid, restore it
      ctx.patchState({
        medusaCart: restoredCart,
        loading: false,
        error: null
      });
    });
  }
}

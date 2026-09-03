import { Injectable } from '@angular/core';
import { Action, Selector, State, StateContext } from '@ngxs/store';
import { Observable } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { of } from 'rxjs';
import { ReturnsActions } from './returns.actions';
import { MedusaReturn, ReturnReason } from 'src/app/shared/interfaces';
import { MedusaService } from 'src/app/shared/api/medusa.service';

export interface SelectedItem {
  selected: boolean;
  quantity: number;
  reason_id?: string;
  note?: string;
}

export interface ReturnsStateModel {
  returns: MedusaReturn[];
  returnReasons: ReturnReason[];
  selectedReturn: MedusaReturn | null;
  selectedOrder: any | null;  // Order for creating returns
  selectedItems: { [key: string]: SelectedItem };
  availableShippingOptions: any[];
  loading: boolean;
  error: string | null;
  createReturnForm?: {
    model?: any;
    dirty?: boolean;
    status?: string;
    errors?: any;
  };
}

@State<ReturnsStateModel>({
  name: 'returns',
  defaults: {
    returns: [],
    returnReasons: [],
    selectedReturn: null,
    selectedOrder: null,
    selectedItems: {},
    availableShippingOptions: [],
    loading: false,
    error: null,
    createReturnForm: {
      model: {
        return_shipping: {
          option_id: '',
          price: 0
        },
        note: '',
        receive_now: false
      },
      dirty: false,
      status: '',
      errors: {}
    }
  }
})
@Injectable()
export class ReturnsState {
  constructor(private medusaService: MedusaService) { }

  @Selector()
  static getReturns(state: ReturnsStateModel): MedusaReturn[] {
    return state.returns;
  }

  @Selector()
  static getReturnReasons(state: ReturnsStateModel): ReturnReason[] {
    return state.returnReasons;
  }

  @Selector()
  static getSelectedReturn(state: ReturnsStateModel): MedusaReturn | null {
    return state.selectedReturn;
  }

  @Selector()
  static getSelectedOrder(state: ReturnsStateModel): any | null {
    return state.selectedOrder;
  }

  @Selector()
  static getLoading(state: ReturnsStateModel): boolean {
    return state.loading;
  }

  @Selector()
  static getError(state: ReturnsStateModel): string | null {
    return state.error;
  }

  @Selector()
  static getCreateReturnForm(state: ReturnsStateModel): any {
    return state.createReturnForm;
  }

  @Selector()
  static getSelectedItems(state: ReturnsStateModel): { [key: string]: SelectedItem } {
    return state.selectedItems;
  }

  @Selector()
  static getAvailableShippingOptions(state: ReturnsStateModel): any[] {
    return state.availableShippingOptions;
  }

  @Selector()
  static getSelectedItemsCount(state: ReturnsStateModel): number {
    return Object.values(state.selectedItems).filter(item => item.selected).length;
  }

  @Selector([ReturnsState.getSelectedOrder, ReturnsState.getSelectedItems])
  static getTotalRefundAmount(order: any | null, selectedItems: { [key: string]: SelectedItem }): number {
    if (!order || !order.items) return 0;
    
    let total = 0;
    order.items.forEach((item: any) => {
      if (selectedItems[item.id]?.selected && selectedItems[item.id]?.quantity > 0) {
        total += (item.unit_price * selectedItems[item.id].quantity);
      }
    });
    return total;
  }

  @Selector([ReturnsState.getSelectedItems, ReturnsState.getCreateReturnForm, ReturnsState.getAvailableShippingOptions])
  static isFormValid(selectedItems: { [key: string]: SelectedItem }, form: any, shippingOptions: any[]): boolean {
    const hasSelectedItems = Object.values(selectedItems).some(item =>
      item.selected && item.quantity > 0
    );
    
    if (!hasSelectedItems) {
      return false;
    }
    
    // Check if return_shipping option_id is provided (required field)
    const hasShippingOption = form?.model?.return_shipping?.option_id || false;
    
    // If shipping options are available, shipping option is required
    // If no shipping options available, we can proceed (will use fallback in submitReturn)
    if (shippingOptions.length > 0 && !hasShippingOption) {
      return false;
    }
    
    // Form is valid if we have selected items and (shipping option selected OR no shipping options available)
    return true;
  }

  // Helper methods for item validation (used by selectors and actions)
  static getFulfilledQuantity(item: any): number {
    return item?.detail?.fulfilled_quantity || item?.fulfilled_quantity || 0;
  }

  static getAvailableReturnQuantity(item: any): number {
    const fulfilledQuantity = ReturnsState.getFulfilledQuantity(item);
    const alreadyRequested = item?.detail?.return_requested_quantity || 0;
    const alreadyReceived = item?.detail?.return_received_quantity || 0;
    const dismissed = item?.detail?.return_dismissed_quantity || 0;

    const totalProcessed = alreadyRequested + alreadyReceived + dismissed;
    return Math.max(0, fulfilledQuantity - totalProcessed);
  }

  static canReturnItem(item: any): boolean {
    const availableQty = ReturnsState.getAvailableReturnQuantity(item);
    const fulfilledQty = ReturnsState.getFulfilledQuantity(item);
    return fulfilledQty > 0 && availableQty > 0;
  }

  static getReturnStatus(item: any): string {
    const requested = item?.detail?.return_requested_quantity || 0;
    const received = item?.detail?.return_received_quantity || 0;
    const dismissed = item?.detail?.return_dismissed_quantity || 0;

    if (dismissed > 0) return 'dismissed';
    if (received > 0 && received >= requested) return 'completed';
    if (requested > 0 && received < requested) return 'pending';

    if (!ReturnsState.canReturnItem(item)) {
      return 'cannot_return';
    }

    return 'none';
  }

  static getReturnStatusText(status: string): string {
    switch (status) {
      case 'completed': return 'Return Completed';
      case 'pending': return 'Return Pending';
      case 'dismissed': return 'Return Dismissed';
      case 'cannot_return': return 'Cannot Return';
      case 'none': return 'Available for Return';
      default: return 'Unknown';
    }
  }

  static getReturnStatusColor(status: string): string {
    switch (status) {
      case 'completed': return 'success';
      case 'pending': return 'warning';
      case 'dismissed': return 'danger';
      case 'cannot_return': return 'danger';
      case 'none': return 'success';
      default: return 'medium';
    }
  }

  static getDefaultReasonId(returnReasons: ReturnReason[]): string {
    return returnReasons && returnReasons.length > 0 ? returnReasons[0].id : '';
  }

  @Action(ReturnsActions.CreateReturn)
  createReturn(ctx: StateContext<ReturnsStateModel>, action: ReturnsActions.CreateReturn) {
    ctx.patchState({ loading: true, error: null });

    return this.medusaService.createReturn(action.payload).pipe(
      tap({
        next: (response: any) => {
          const state = ctx.getState();
          const createdReturn = response.return;
          const updatedReturns = [...state.returns, createdReturn];
          ctx.patchState({
            returns: updatedReturns,
            selectedReturn: createdReturn, // Store the newly created return for navigation
            loading: false
          });
        },
        error: (error) => {
          console.error('Error creating return:', error);
          ctx.patchState({
            loading: false,
            error: error.message || 'Failed to create return'
          });
        }
      })
    );
  }

  @Action(ReturnsActions.GetReturns)
  getReturns(ctx: StateContext<ReturnsStateModel>, action: ReturnsActions.GetReturns) {
    ctx.patchState({ loading: true, error: null });

    return this.medusaService.getReturns(action.payload?.limit, action.payload?.offset).pipe(
      tap({
        next: (response: any) => {
          // Handle the new response format where returns are extracted from orders
          const returns = response.returns || [];
          ctx.patchState({
            returns: returns,
            loading: false
          });
        },
        error: (error) => {
          console.error('Error getting returns:', error);

          // Provide more specific error messages
          let errorMessage = 'Failed to get returns';
          if (error.status === 0) {
            errorMessage = 'Cannot connect to server. Please check if Medusa backend is running.';
          } else if (error.status === 401) {
            errorMessage = 'Authentication required. Please log in.';
          } else if (error.status === 404) {
            errorMessage = 'Returns endpoint not found.';
          } else if (error.message) {
            errorMessage = error.message;
          }

          ctx.patchState({
            loading: false,
            error: errorMessage
          });
        }
      })
    );
  }

  @Action(ReturnsActions.GetReturn)
  getReturn(ctx: StateContext<ReturnsStateModel>, action: ReturnsActions.GetReturn) {
    ctx.patchState({ loading: true, error: null });

    return this.medusaService.getReturn(action.payload).pipe(
      tap({
        next: (response: any) => {
          ctx.patchState({
            selectedReturn: response.return,
            loading: false
          });
        },
        error: (error) => {
          console.error('Error getting return:', error);

          let errorMessage = 'Failed to get return details';
          if (error.status === 0) {
            errorMessage = 'Cannot connect to server. Please check if Medusa backend is running.';
          } else if (error.status === 404) {
            errorMessage = 'Return not found.';
          } else if (error.message) {
            errorMessage = error.message;
          }

          ctx.patchState({
            loading: false,
            error: errorMessage
          });
        }
      })
    );
  }

  @Action(ReturnsActions.GetReturnReasons)
  getReturnReasons(ctx: StateContext<ReturnsStateModel>) {
    ctx.patchState({ loading: true, error: null });

    return this.medusaService.getReturnReasons().pipe(
      tap({
        next: (response: any) => {
          ctx.patchState({
            returnReasons: response.return_reasons,
            loading: false
          });
        },
        error: (error) => {
          console.error('Error getting return reasons:', error);

          let errorMessage = 'Failed to get return reasons';
          if (error.status === 0) {
            errorMessage = 'Cannot connect to server. Using default return reasons.';
          } else if (error.message) {
            errorMessage = error.message;
          }

          ctx.patchState({
            loading: false,
            error: errorMessage
          });
        }
      })
    );
  }

  @Action(ReturnsActions.SetReturns)
  setReturns(ctx: StateContext<ReturnsStateModel>, action: ReturnsActions.SetReturns) {
    ctx.patchState({ returns: action.payload });
  }

  @Action(ReturnsActions.SetReturnReasons)
  setReturnReasons(ctx: StateContext<ReturnsStateModel>, action: ReturnsActions.SetReturnReasons) {
    ctx.patchState({ returnReasons: action.payload });
  }

  @Action(ReturnsActions.SetSelectedReturn)
  setSelectedReturn(ctx: StateContext<ReturnsStateModel>, action: ReturnsActions.SetSelectedReturn) {
    ctx.patchState({ selectedReturn: action.payload });
  }

  @Action(ReturnsActions.GetOrderForReturn)
  getOrderForReturn(ctx: StateContext<ReturnsStateModel>, action: ReturnsActions.GetOrderForReturn) {
    ctx.patchState({ loading: true, error: null });

    return this.medusaService.getOrderForReturn(action.payload).pipe(
      tap({
        next: (order: any) => {
          console.log('Order loaded for return:', order);
          // Initialize selected items when order is loaded
          const selectedItems: { [key: string]: SelectedItem } = {};
          if (order && order.items && Array.isArray(order.items)) {
            order.items.forEach((item: any) => {
              selectedItems[item.id] = {
                selected: false,
                quantity: 0,
                reason_id: '',
                note: ''
              };
            });
          }
          ctx.patchState({
            selectedOrder: order,
            selectedItems,
            loading: false
          });
          // Auto-load shipping options when order is loaded
          ctx.dispatch(new ReturnsActions.LoadReturnShippingOptions());
        },
        error: (error) => {
          console.error('Error getting order for return:', error);

          let errorMessage = 'Failed to load order details';
          if (error.status === 0) {
            errorMessage = 'Cannot connect to server. Please check if Medusa backend is running.';
          } else if (error.status === 404) {
            errorMessage = 'Order not found.';
          } else if (error.message) {
            errorMessage = error.message;
          }

          ctx.patchState({
            loading: false,
            error: errorMessage
          });
        }
      })
    );
  }



  @Action(ReturnsActions.InitializeSelectedItems)
  initializeSelectedItems(ctx: StateContext<ReturnsStateModel>, action: ReturnsActions.InitializeSelectedItems) {
    const selectedItems: { [key: string]: SelectedItem } = {};
    if (action.payload && Array.isArray(action.payload)) {
      action.payload.forEach((item: any) => {
        selectedItems[item.id] = {
          selected: false,
          quantity: 0,
          reason_id: '',
          note: ''
        };
      });
    }
    ctx.patchState({ selectedItems });
  }

  @Action(ReturnsActions.ToggleItemSelection)
  toggleItemSelection(ctx: StateContext<ReturnsStateModel>, action: ReturnsActions.ToggleItemSelection) {
    const state = ctx.getState();
    const selectedItems = { ...state.selectedItems };
    const item = selectedItems[action.payload];
    const order = state.selectedOrder;

    if (!item || !order) return;

    // Find the order item
    const orderItem = order.items?.find((i: any) => i.id === action.payload);
    if (!orderItem) return;

    // If trying to select, validate item can be returned
    if (!item.selected && !ReturnsState.canReturnItem(orderItem)) {
      // Don't toggle - validation error should be shown in component
      return;
    }

    const isSelecting = !item.selected;
    const availableQty = ReturnsState.getAvailableReturnQuantity(orderItem);
    
    selectedItems[action.payload] = {
      ...item,
      selected: !item.selected,
      quantity: isSelecting ? Math.min(1, availableQty) : 0,
      reason_id: isSelecting && !item.reason_id ? ReturnsState.getDefaultReasonId(state.returnReasons) : (isSelecting ? item.reason_id : ''),
      note: isSelecting ? item.note : ''
    };
    ctx.patchState({ selectedItems });
  }

  @Action(ReturnsActions.UpdateItemQuantity)
  updateItemQuantity(ctx: StateContext<ReturnsStateModel>, action: ReturnsActions.UpdateItemQuantity) {
    const state = ctx.getState();
    const selectedItems = { ...state.selectedItems };
    const item = selectedItems[action.payload.itemId];
    const order = state.selectedOrder;

    if (!item || !order) return;

    const orderItem = order.items?.find((i: any) => i.id === action.payload.itemId);
    if (!orderItem) return;

    const maxQty = ReturnsState.getAvailableReturnQuantity(orderItem);
    selectedItems[action.payload.itemId] = {
      ...item,
      quantity: Math.min(action.payload.quantity, maxQty)
    };
    ctx.patchState({ selectedItems });
  }

  @Action(ReturnsActions.UpdateItemReason)
  updateItemReason(ctx: StateContext<ReturnsStateModel>, action: ReturnsActions.UpdateItemReason) {
    const state = ctx.getState();
    const selectedItems = { ...state.selectedItems };
    const item = selectedItems[action.payload.itemId];

    if (item) {
      selectedItems[action.payload.itemId] = {
        ...item,
        reason_id: action.payload.reason_id
      };
      ctx.patchState({ selectedItems });
    }
  }

  @Action(ReturnsActions.UpdateItemNote)
  updateItemNote(ctx: StateContext<ReturnsStateModel>, action: ReturnsActions.UpdateItemNote) {
    const state = ctx.getState();
    const selectedItems = { ...state.selectedItems };
    const item = selectedItems[action.payload.itemId];

    if (item) {
      selectedItems[action.payload.itemId] = {
        ...item,
        note: action.payload.note
      };
      ctx.patchState({ selectedItems });
    }
  }

  @Action(ReturnsActions.SetReturnShippingOptions)
  setReturnShippingOptions(ctx: StateContext<ReturnsStateModel>, action: ReturnsActions.SetReturnShippingOptions) {
    ctx.patchState({ availableShippingOptions: action.payload });
  }

  @Action(ReturnsActions.LoadReturnShippingOptions)
  loadReturnShippingOptions(ctx: StateContext<ReturnsStateModel>, action: ReturnsActions.LoadReturnShippingOptions): Observable<any> | void {
    const state = ctx.getState();
    const order = state.selectedOrder;
    
    if (!order) {
      this.useHardcodedReturnOption(ctx);
      return;
    }

    const cartId = order?.cart_id || order?.cart?.id;
    if (cartId) {
      return this.medusaService.getReturnShippingOptions(cartId).pipe(
        tap({
          next: (response: any) => {
            const options = response.shipping_options || [];
            if (options.length > 0) {
              ctx.patchState({ availableShippingOptions: options });
              this.setDefaultShippingOption(ctx, options);
            } else {
              this.loadGeneralShippingOptions(ctx, order);
            }
          },
          error: () => this.loadGeneralShippingOptions(ctx, order)
        }),
        catchError(() => {
          this.loadGeneralShippingOptions(ctx, order);
          return of(null);
        })
      );
    } else {
      this.loadGeneralShippingOptions(ctx, order);
    }
  }

  private loadGeneralShippingOptions(ctx: StateContext<ReturnsStateModel>, order: any) {
    const orderRegionId = order?.region_id || order?.region?.id;
    
    if (orderRegionId) {
      this.loadShippingOptionsForRegion(ctx, orderRegionId);
    } else {
      this.loadShippingOptionsFromRegionsList(ctx);
    }
  }

  private loadShippingOptionsForRegion(ctx: StateContext<ReturnsStateModel>, regionId: string) {
    this.medusaService.cartsCreate(regionId).pipe(
      tap({
        next: (cartResponse: any) => {
          const tempCartId = cartResponse.cart?.id;
          if (tempCartId) {
            this.fetchReturnShippingOptions(ctx, tempCartId);
          } else {
            this.useHardcodedReturnOption(ctx);
          }
        },
        error: () => this.useHardcodedReturnOption(ctx)
      }),
      catchError(() => {
        this.useHardcodedReturnOption(ctx);
        return of(null);
      })
    ).subscribe();
  }

  private loadShippingOptionsFromRegionsList(ctx: StateContext<ReturnsStateModel>) {
    this.medusaService.regionsList().pipe(
      tap({
        next: (regionsResponse: any) => {
          const regions = regionsResponse.regions || [];
          if (regions.length > 0) {
            this.loadShippingOptionsForRegion(ctx, regions[0].id);
          } else {
            this.useHardcodedReturnOption(ctx);
          }
        },
        error: () => this.useHardcodedReturnOption(ctx)
      }),
      catchError(() => {
        this.useHardcodedReturnOption(ctx);
        return of(null);
      })
    ).subscribe();
  }

  private fetchReturnShippingOptions(ctx: StateContext<ReturnsStateModel>, cartId: string) {
    this.medusaService.getReturnShippingOptions(cartId).pipe(
      tap({
        next: (response: any) => {
          const options = response.shipping_options || [];
          if (options.length > 0) {
            ctx.patchState({ availableShippingOptions: options });
            this.setDefaultShippingOption(ctx, options);
          } else {
            this.useHardcodedReturnOption(ctx);
          }
        },
        error: () => this.useHardcodedReturnOption(ctx)
      }),
      catchError(() => {
        this.useHardcodedReturnOption(ctx);
        return of(null);
      })
    ).subscribe();
  }

  private useHardcodedReturnOption(ctx: StateContext<ReturnsStateModel>) {
    const hardcodedOptions = [{
      id: 'so_01K6QW0WFJC9XCHRPBR6X6FGJ6',
      name: 'Return Shipping',
      price: 0,
      is_return: true
    }];
    ctx.patchState({ availableShippingOptions: hardcodedOptions });
  }

  private setDefaultShippingOption(ctx: StateContext<ReturnsStateModel>, options: any[]) {
    const returnOptions = options.filter(option =>
      option.is_return === true ||
      option.id === 'so_01K6QW0WFJC9XCHRPBR6X6FGJ6' ||
      option.name?.toLowerCase().includes('return')
    );
    const optionToUse = returnOptions.length > 0 ? returnOptions[0] : options[0];
    // Note: Form update should be handled by component or form plugin
  }

  @Action(ReturnsActions.ClearReturns)
  clearReturns(ctx: StateContext<ReturnsStateModel>) {
    ctx.patchState({
      returns: [],
      returnReasons: [],
      selectedReturn: null,
      selectedOrder: null,
      selectedItems: {},
      availableShippingOptions: [],
      loading: false,
      error: null
    });
  }
}

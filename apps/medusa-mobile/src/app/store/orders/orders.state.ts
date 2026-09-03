import { Injectable, inject } from '@angular/core';
import { Action, Selector, State, StateContext } from '@ngxs/store';
import { Observable, catchError, take, throwError } from 'rxjs';
import { OrdersActions } from './orders.actions';
import { MedusaOrder } from 'src/app/shared/interfaces';
import { MedusaService } from 'src/app/shared/api/medusa.service';

export interface OrdersStateModel {
  orders: MedusaOrder[];
  selectedOrder: MedusaOrder | null;
  loading: boolean;
  error: string | null;
}

@State<OrdersStateModel>({
  name: 'orders',
  defaults: {
    orders: [],
    selectedOrder: null,
    loading: false,
    error: null
  }
})
@Injectable()
export class OrdersState {
  private medusaApi = inject(MedusaService);

  @Selector()
  static getOrders(state: OrdersStateModel): MedusaOrder[] {
    return state?.orders || [];
  }

  @Selector()
  static getSelectedOrder(state: OrdersStateModel): MedusaOrder | null {
    return state?.selectedOrder || null;
  }

  @Selector()
  static getLoading(state: OrdersStateModel): boolean {
    return state?.loading || false;
  }

  @Selector()
  static getError(state: OrdersStateModel): string | null {
    return state?.error || null;
  }

  @Action(OrdersActions.RetriveOrdersList)
  retriveOrdersList(ctx: StateContext<OrdersStateModel>) {
    ctx.patchState({ loading: true, error: null });
    this.medusaApi.retriveOrdersList().pipe(
      take(1),
      catchError(error => {
        ctx.patchState({ loading: false, error: error.message });
        return throwError(() => error);
      })
    ).subscribe((res: any) => {
      ctx.patchState({
        orders: res?.orders || [],
        loading: false
      });
    });
  }

  @Action(OrdersActions.RetriveOrderById)
  retriveOrderById(ctx: StateContext<OrdersStateModel>, { orderId }: OrdersActions.RetriveOrderById) {
    ctx.patchState({ loading: true, error: null });
    this.medusaApi.retriveCompletedOrder(orderId).pipe(
      take(1),
      catchError(error => {
        ctx.patchState({ loading: false, error: error.message });
        return throwError(() => error);
      })
    ).subscribe((res: any) => {
      const order = res?.order;
      ctx.patchState({
        selectedOrder: order || null,
        loading: false
      });
    });
  }

  @Action(OrdersActions.ClearOrders)
  clearOrders(ctx: StateContext<OrdersStateModel>) {
    ctx.patchState({
      orders: [],
      selectedOrder: null,
      error: null
    });
  }
}


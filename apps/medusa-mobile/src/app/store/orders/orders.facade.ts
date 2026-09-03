import { Injectable, inject } from '@angular/core';
import { Store } from '@ngxs/store';
import { Observable } from 'rxjs';
import { OrdersState } from './orders.state';
import { OrdersActions } from './orders.actions';
import { MedusaOrder } from '../../shared/interfaces';

export interface IOrdersFacadeState {
  orders: MedusaOrder[];
  selectedOrder: MedusaOrder | null;
  loading: boolean;
  error: string | null;
}

@Injectable({
  providedIn: 'root'
})
export class OrdersFacade {
  private store = inject(Store);

  // Individual observables
  orders$: Observable<MedusaOrder[]> = this.store.select(OrdersState.getOrders);
  selectedOrder$: Observable<MedusaOrder | null> = this.store.select(OrdersState.getSelectedOrder);
  loading$: Observable<boolean> = this.store.select(OrdersState.getLoading);
  error$: Observable<string | null> = this.store.select(OrdersState.getError);

  // Actions
  loadOrders(): void {
    this.store.dispatch(new OrdersActions.RetriveOrdersList());
  }

  loadOrderById(orderId: string): void {
    this.store.dispatch(new OrdersActions.RetriveOrderById(orderId));
  }

  clearOrders(): void {
    this.store.dispatch(new OrdersActions.ClearOrders());
  }

  // Selectors (snapshot helpers)
  getOrdersSnapshot(): MedusaOrder[] {
    return this.store.selectSnapshot(OrdersState.getOrders);
  }

  getSelectedOrderSnapshot(): MedusaOrder | null {
    return this.store.selectSnapshot(OrdersState.getSelectedOrder);
  }

  getLoadingSnapshot(): boolean {
    return this.store.selectSnapshot(OrdersState.getLoading);
  }

  getErrorSnapshot(): string | null {
    return this.store.selectSnapshot(OrdersState.getError);
  }
}


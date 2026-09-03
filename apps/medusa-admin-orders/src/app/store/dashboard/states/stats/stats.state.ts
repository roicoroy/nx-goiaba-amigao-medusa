import { Injectable, inject } from '@angular/core';
import { Action, Selector, State, StateContext } from '@ngxs/store';
import { tap, catchError } from 'rxjs/operators';
import { of } from 'rxjs';
import { MedusaAdminService } from '../../../../shared/api/medusa.service.admin';
import {
  LoadDashboardStats,
  LoadDashboardStatsSuccess,
  LoadDashboardStatsFailure,
  AddRealtimeOrder,
  ResetDashboardStats
} from './stats.actions';

export interface DashboardStatsModel {
  orders: any[];
  stats: {
    totalOrders: number;
    pendingOrders: number;
    totalCustomers: number;
    totalRevenue: number;
  };
  loading: boolean;
  error: string | null;
}

@State<DashboardStatsModel>({
  name: 'dashboardStats',
  defaults: {
    orders: [],
    stats: {
      totalOrders: 0,
      pendingOrders: 0,
      totalCustomers: 0,
      totalRevenue: 0
    },
    loading: false,
    error: null
  }
})
@Injectable()
export class DashboardStatsState {
  private medusaAdmin = inject(MedusaAdminService);

  @Selector()
  static getOrders(state: DashboardStatsModel) {
    return state.orders;
  }

  @Selector()
  static getStats(state: DashboardStatsModel) {
    return state.stats;
  }

  @Selector()
  static isLoading(state: DashboardStatsModel) {
    return state.loading;
  }

  @Selector()
  static getError(state: DashboardStatsModel) {
    return state.error;
  }

  @Action(LoadDashboardStats)
  loadDashboardStats(ctx: StateContext<DashboardStatsModel>) {
    ctx.patchState({ loading: true, error: null });

    return this.medusaAdmin.getOrders({
      limit: 10,
      offset: 0,
      order: '-created_at'
    }).pipe(
      tap((response: any) => {
        const orders = response?.orders || [];
        const stats = this.calculateStats(orders);

        ctx.dispatch(new LoadDashboardStatsSuccess({ orders, stats }));
      }),
      catchError((error) => {
        const errorMessage = error?.message || 'Failed to load dashboard data';
        ctx.dispatch(new LoadDashboardStatsFailure(errorMessage));
        return of(null);
      })
    );
  }

  @Action(LoadDashboardStatsSuccess)
  loadDashboardStatsSuccess(
    ctx: StateContext<DashboardStatsModel>,
    { payload }: LoadDashboardStatsSuccess
  ) {
    ctx.patchState({
      orders: payload.orders,
      stats: payload.stats,
      loading: false,
      error: null
    });
  }

  @Action(LoadDashboardStatsFailure)
  loadDashboardStatsFailure(
    ctx: StateContext<DashboardStatsModel>,
    { error }: LoadDashboardStatsFailure
  ) {
    ctx.patchState({
      loading: false,
      error
    });
  }

  @Action(AddRealtimeOrder)
  addRealtimeOrder(
    ctx: StateContext<DashboardStatsModel>,
    { order }: AddRealtimeOrder
  ) {
    const state = ctx.getState();
    const orders = [order, ...state.orders];
    const stats = this.calculateStats(orders);

    ctx.patchState({
      orders,
      stats
    });
  }

  @Action(ResetDashboardStats)
  resetDashboardStats(ctx: StateContext<DashboardStatsModel>) {
    ctx.setState({
      orders: [],
      stats: {
        totalOrders: 0,
        pendingOrders: 0,
        totalCustomers: 0,
        totalRevenue: 0
      },
      loading: false,
      error: null
    });
  }

  private calculateStats(orders: any[]) {
    const totalOrders = orders.length;
    const pendingOrders = orders.filter(order =>
      order.status === 'pending' ||
      order.fulfillment_status === 'not_fulfilled' ||
      order.fulfillment_status === 'partially_fulfilled' ||
      order.payment_status === 'awaiting' ||
      order.payment_status === 'requires_action'
    ).length;
    const totalCustomers = 0; // Not fetching customers for staff users
    const totalRevenue = orders
      .filter(order => order.status === 'completed' || order.payment_status === 'captured')
      .reduce((total, order) => total + (order.total || 0), 0);

    return {
      totalOrders,
      pendingOrders,
      totalCustomers,
      totalRevenue
    };
  }
}

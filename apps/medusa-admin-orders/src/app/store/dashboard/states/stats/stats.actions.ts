export class LoadDashboardStats {
  static readonly type = '[Dashboard] Load Stats';
}

export class LoadDashboardStatsSuccess {
  static readonly type = '[Dashboard] Load Stats Success';
  constructor(public payload: {
    orders: any[];
    stats: {
      totalOrders: number;
      pendingOrders: number;
      totalCustomers: number;
      totalRevenue: number;
    };
  }) {}
}

export class LoadDashboardStatsFailure {
  static readonly type = '[Dashboard] Load Stats Failure';
  constructor(public error: string) {}
}

export class AddRealtimeOrder {
  static readonly type = '[Dashboard] Add Realtime Order';
  constructor(public order: any) {}
}

export class ResetDashboardStats {
  static readonly type = '[Dashboard] Reset Stats';
}

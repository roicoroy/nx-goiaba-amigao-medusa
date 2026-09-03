export namespace OrdersActions {
  export class RetriveOrdersList {
    static readonly type = '[OrdersActions] Retrive Orders List';
  }

  export class RetriveOrderById {
    static readonly type = '[OrdersActions] Retrive Order By ID';
    constructor(public orderId: string) { }
  }

  export class ClearOrders {
    static readonly type = '[OrdersActions] Clear Orders';
  }
}


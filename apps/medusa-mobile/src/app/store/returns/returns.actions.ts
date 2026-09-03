export namespace ReturnsActions {
    export class CreateReturn {
        static readonly type = '[Returns] Create Return';
        constructor(public payload: {
            order_id: string;
            items: {
                id: string;           // Use id to match actual Medusa API
                quantity: number;
                reason_id?: string;
                note?: string;
            }[];
            return_shipping?: {
                option_id: string;
                price?: number;
            };
            note?: string;            // Top-level note only
            receive_now?: boolean;    // Add receive_now field
            no_notification?: boolean; // Add no_notification field
            refund?: number;          // Use refund instead of refund_amount
        }) {}
    }

    export class GetReturn {
        static readonly type = '[Returns] Get Return';
        constructor(public payload: string) {} // returnId
    }

    export class GetReturns {
        static readonly type = '[Returns] Get Returns';
        constructor(public payload?: { limit?: number; offset?: number }) {}
    }

    export class GetReturnReasons {
        static readonly type = '[Returns] Get Return Reasons';
    }

    export class SetReturns {
        static readonly type = '[Returns] Set Returns';
        constructor(public payload: any[]) {}
    }

    export class SetReturnReasons {
        static readonly type = '[Returns] Set Return Reasons';
        constructor(public payload: any[]) {}
    }

    export class SetSelectedReturn {
        static readonly type = '[Returns] Set Selected Return';
        constructor(public payload: any) {}
    }

    export class GetOrderForReturn {
        static readonly type = '[Returns] Get Order For Return';
        constructor(public payload: string) {} // orderId
    }

    export class InitializeSelectedItems {
        static readonly type = '[Returns] Initialize Selected Items';
        constructor(public payload: any[]) {} // order items
    }

    export class ToggleItemSelection {
        static readonly type = '[Returns] Toggle Item Selection';
        constructor(public payload: string) {} // itemId
    }

    export class UpdateItemQuantity {
        static readonly type = '[Returns] Update Item Quantity';
        constructor(public payload: { itemId: string; quantity: number }) {}
    }

    export class UpdateItemReason {
        static readonly type = '[Returns] Update Item Reason';
        constructor(public payload: { itemId: string; reason_id: string }) {}
    }

    export class UpdateItemNote {
        static readonly type = '[Returns] Update Item Note';
        constructor(public payload: { itemId: string; note: string }) {}
    }

    export class LoadReturnShippingOptions {
        static readonly type = '[Returns] Load Return Shipping Options';
        constructor(public payload?: string) {} // optional orderId
    }

    export class SetReturnShippingOptions {
        static readonly type = '[Returns] Set Return Shipping Options';
        constructor(public payload: any[]) {} // shipping options
    }

    export class ClearReturns {
        static readonly type = '[Returns] Clear Returns';
    }
}

import { MedusaVariant } from "../../shared/interfaces/medusa-variant.interface";
import { MedusaCart } from "../../shared/interfaces/medusa-cart.interface";
import { MedusaLineItem } from "../../shared/interfaces/medusa-line-items.interface";
import { AddCartLineItemInput } from "../../shared/interfaces/medusa-cart-input.interface";

export namespace MedusaCartActions {
    export class AddToMedusaCart {
        static readonly type = '[MedusaCartActions] Add To Medusa Cart';
        constructor(public variant: MedusaVariant) { }
    }

    export class AddCartLineItems {
        static readonly type = '[MedusaCartActions] Add Cart Line Items';
        constructor(public cartId: string, public items: AddCartLineItemInput) { }
    }

    export class RefreshCart {
        static readonly type = '[MedusaCartActions] Refresh Cart';
    }

    export class RefreshCartById {
        static readonly type = '[MedusaCartActions] Refresh Cart By ID';
        constructor(public cartId: string) { }
    }

    export class RetriveCompletedOrder {
        static readonly type = '[MedusaCartActions] Retrive Completed Order';
        constructor(public orderId: string) { }
    }

    export class UpdateCartRegion {
        static readonly type = '[MedusaCartActions] Update Cart Region';
        constructor(public region_id: string) { }
    }

    export class UpdateMedusaCart {
        static readonly type = '[MedusaCartActions] Update Medusa Cart';
        constructor(public updateCartData: any) { }
    }

    export class AddPromotionstoCart {
        static readonly type = '[MedusaCartActions] Add Promotions to Cart';
        constructor(public promo_code: string) { }
    }

    export class RemovePromotionsfromCart {
        static readonly type = '[MedusaCartActions] Remove Promotions from Cart';
        constructor(public promo_code: string) { }
    }

    export class IncreaseCartItem {
        static readonly type = '[MedusaCartActions] Increase Cart Item';
        constructor(public cartItem: any) { }
    }

    export class DecreaseCartItem {
        static readonly type = '[MedusaCartActions] Decrease Cart Item';
        constructor(public cartItem: any) { }
    }

    export class DeleteCartItem {
        static readonly type = '[MedusaCartActions] Delete Cart Item';
        constructor(public line_id: string) { }
    }

    export class CompleteCart {
        static readonly type = '[MedusaCartActions] Complete Cart';
    }

    export class UpdateMedusaCartState {
        static readonly type = '[MedusaCartActions] Update Medusa Cart State';
        constructor(public cart: MedusaCart) { }
    }

    export class ClearCart {
        static readonly type = '[MedusaCartActions] Clear Cart';
    }

    export class LogOut {
        static readonly type = '[MedusaCartActions] LogOut';
    }

    export class CreateNewCart {
        static readonly type = '[MedusaCartActions] Create New Cart';
        constructor(public regionId?: string) { }
    }

    export class TransferCart {
        static readonly type = '[MedusaCartActions] Transfer Cart';
        constructor(public cartId: string) { }
    }

    export class TransferCartSuccess {
        static readonly type = '[MedusaCartActions] Transfer Cart Success';
        constructor(public cart: MedusaCart) { }
    }

    export class TransferCartFailure {
        static readonly type = '[MedusaCartActions] Transfer Cart Failure';
        constructor(public error: string) { }
    }

    export class RestoreCart {
        static readonly type = '[MedusaCartActions] Restore Cart';
    }
}

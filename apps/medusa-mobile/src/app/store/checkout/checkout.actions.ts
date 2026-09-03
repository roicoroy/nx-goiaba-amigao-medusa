export namespace CheckoutActions {
    export class GetShippingOptions {
        static readonly type = '[CheckoutActions] Shipping Get Shipping Options';
        constructor(public cartId?: string) { }
    }
    export class AddShippingMethod {
        static readonly type = '[CheckoutActions] Shipping Add Shipping Method';
        constructor(public option_id: string) { }

    }
    export class ClearShippingOptions {
        static readonly type = '[CheckoutActions] Clear Shipping Options';
    }
    export class PopulatePaymentSession {
        static readonly type = '[CheckoutActions] Populate Payment Session';
        constructor(public option_id: string) { }
    }
    export class ClearPaymentSession {
        static readonly type = '[CheckoutActions] Clear Payment Session';
    }
    export class CreatePaymentProviders {
        static readonly type = '[CheckoutActions] Shipping Create Payment Providers';
        constructor(public cartId: string, public regionId: string) { }
    }
    export class SetPaymentSession {
        static readonly type = '[CheckoutActions] Shipping Set Payment Session';
        constructor(public payment_provider_id: string, public cartId: string) { }
    }
    export class RefreshPaymentSession {
        static readonly type = '[CheckoutActions] Refresh Payment Session';
        constructor(public cartId: string, public provider_id: string) { }
    }
    export class AddaShippingAddress {
        static readonly type = '[CheckoutActions] Add a Shipping Address';
        constructor(public payload: any) { }
    }
    export class UpdateCustomerAddress {
        static readonly type = '[CheckoutActions] Update Address for customer Actions';
        constructor(public addressId: string, public payload: any) { }
    }
    export class SecretKey {
        static readonly type = '[CheckoutActions] Secret Key';
        constructor(public secretKey: string | any) { }
    }
    export class UnSetSecretKey {
        static readonly type = '[CheckoutActions] UnSet Secret Key';
    }
    export class LogOut {
        static readonly type = '[CheckoutActions] Logout, clear medusa state';
    }
}

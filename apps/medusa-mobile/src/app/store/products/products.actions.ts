import { MedusaProduct } from "../../shared/interfaces/medusa-product.interface";
import { MedusaVariant } from "../../shared/interfaces/medusa-variant.interface";

export namespace ProductsActions {
    export class GetProducts {
        public static readonly type = '[ProductsState] GetProducts';
    }

    export class GetProductsId {
        public static readonly type = '[ProductsState] GetProducts ID';
    }
    export class GetSingleProduct {
        public static readonly type = '[ProductsState] Get Single Product';
        constructor(public readonly productId: string) { }
    }
    export class GetSingleProductByHandle {
        public static readonly type = '[ProductsState] Get Single Product By Handle';
        constructor(public readonly handle: string) { }
    }
    export class ProductsLogOut {
        public static readonly type = '[ProductsState] Clear Selected Variant';
    }
  export class GetCategory {
        public static readonly type = '[ProductsState] Get Category';
        constructor(public readonly categoryId: string) { }
    }
    export class addSelectedProduct {
        public static readonly type = '[ProductsState] Add Selected Product';
        constructor(public readonly payload: MedusaProduct, public readonly region_id: string) { }
    }
    export class clearSelectedProduct {
        public static readonly type = '[ProductsState] Clear Selected Products';
    }
    export class addSelectedVariant {
        public static readonly type = '[ProductsState] Add Selected  Variant';
        constructor(public readonly payload: MedusaVariant) { }
    }
    export class clearSelectedVariant {
        public static readonly type = '[ProductsState] Clear Selected Variant';
    }
}

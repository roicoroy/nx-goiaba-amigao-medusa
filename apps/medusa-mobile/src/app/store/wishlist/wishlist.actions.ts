import { MedusaProduct } from 'src/app/shared/interfaces';
import { Wishlist, WishlistItem } from '../../shared/interfaces/wishlist.model';

export namespace WishlistActions {
  // READ Operations
  export class LoadWishlist {
    static readonly type = '[Wishlist] Load Wishlist';
  }

  export class LoadWishlistSuccess {
    static readonly type = '[Wishlist] Load Wishlist Success';
    constructor(public wishlist: Wishlist) {}
  }

  export class LoadWishlistFailure {
    static readonly type = '[Wishlist] Load Wishlist Failure';
    constructor(public error: string) {}
  }

  export class GetWishlistItem {
    static readonly type = '[Wishlist] Get Wishlist Item';
    constructor(public itemId: string) {}
  }

  export class GetWishlistItemSuccess {
    static readonly type = '[Wishlist] Get Wishlist Item Success';
    constructor(public item: WishlistItem) {}
  }

  export class GetWishlistItemFailure {
    static readonly type = '[Wishlist] Get Wishlist Item Failure';
    constructor(public error: string) {}
  }

  // CREATE Operations
  export class CreateWishlist {
    static readonly type = '[Wishlist] Create Wishlist';
  }

  export class CreateWishlistSuccess {
    static readonly type = '[Wishlist] Create Wishlist Success';
    constructor(public wishlist: Wishlist) {}
  }

  export class CreateWishlistFailure {
    static readonly type = '[Wishlist] Create Wishlist Failure';
    constructor(public error: string) {}
  }

  export class AddToWishlist {
    static readonly type = '[Wishlist] Add To Wishlist';
    constructor(public variantId: string, public product?: MedusaProduct) {}
  }

  export class AddToWishlistSuccess {
    static readonly type = '[Wishlist] Add To Wishlist Success';
    constructor(public wishlist: Wishlist) {}
  }

  export class AddToWishlistFailure {
    static readonly type = '[Wishlist] Add To Wishlist Failure';
    constructor(public error: string) {}
  }

  // UPDATE Operations
  export class UpdateWishlistItem {
    static readonly type = '[Wishlist] Update Wishlist Item';
    constructor(public itemId: string, public updates: Partial<WishlistItem>) {}
  }

  export class UpdateWishlistItemSuccess {
    static readonly type = '[Wishlist] Update Wishlist Item Success';
    constructor(public wishlist: Wishlist) {}
  }

  export class UpdateWishlistItemFailure {
    static readonly type = '[Wishlist] Update Wishlist Item Failure';
    constructor(public error: string) {}
  }

  // DELETE Operations
  export class RemoveFromWishlist {
    static readonly type = '[Wishlist] Remove From Wishlist';
    constructor(public itemId: string) {}
  }

  export class RemoveFromWishlistSuccess {
    static readonly type = '[Wishlist] Remove From Wishlist Success';
    constructor(public wishlist: Wishlist) {}
  }

  export class RemoveFromWishlistFailure {
    static readonly type = '[Wishlist] Remove From Wishlist Failure';
    constructor(public error: string) {}
  }

  export class ClearWishlist {
    static readonly type = '[Wishlist] Clear Wishlist';
  }

  export class ClearWishlistSuccess {
    static readonly type = '[Wishlist] Clear Wishlist Success';
  }

  export class ClearWishlistFailure {
    static readonly type = '[Wishlist] Clear Wishlist Failure';
    constructor(public error: string) {}
  }

  // SHARE Operations
  export class ShareWishlist {
    static readonly type = '[Wishlist] Share Wishlist';
    constructor(public wishlistId: string) {}
  }

  export class ShareWishlistSuccess {
    static readonly type = '[Wishlist] Share Wishlist Success';
    constructor(public token: string) {}
  }

  export class ShareWishlistFailure {
    static readonly type = '[Wishlist] Share Wishlist Failure';
    constructor(public error: string) {}
  }

  export class LoadSharedWishlist {
    static readonly type = '[Wishlist] Load Shared Wishlist';
    constructor(public token: string) {}
  }

  export class LoadSharedWishlistSuccess {
    static readonly type = '[Wishlist] Load Shared Wishlist Success';
    constructor(public wishlist: Wishlist, public token: string) {}
  }

  export class LoadSharedWishlistFailure {
    static readonly type = '[Wishlist] Load Shared Wishlist Failure';
    constructor(public error: string) {}
  }

  // UTILITY Operations
  export class SetLoading {
    static readonly type = '[Wishlist] Set Loading';
    constructor(public loading: boolean) {}
  }

  export class SetError {
    static readonly type = '[Wishlist] Set Error';
    constructor(public error: string | null) {}
  }

  export class ClearError {
    static readonly type = '[Wishlist] Clear Error';
  }

  // CART Integration
  export class AddWishlistItemToCart {
    static readonly type = '[Wishlist] Add Wishlist Item To Cart';
    constructor(public item: WishlistItem, public quantity?: number) {}
  }

  export class AddWishlistItemToCartSuccess {
    static readonly type = '[Wishlist] Add Wishlist Item To Cart Success';
    constructor(public item: WishlistItem) {}
  }

  export class AddWishlistItemToCartFailure {
    static readonly type = '[Wishlist] Add Wishlist Item To Cart Failure';
    constructor(public error: string) {}
  }
}

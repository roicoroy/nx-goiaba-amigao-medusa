import { NgxsDevtoolsOptions } from '@ngxs/devtools-plugin';
import { NgxsLoggerPluginOptions } from '@ngxs/logger-plugin';
import { NgxsConfig } from '@ngxs/store';
import { KeyboardState } from './keyboard/keyboard.state';
import { LanguageState } from './language/language.state';
import { FormState } from './forms/form.state';
import { ThemeState } from './theme/theme.state';
import { WishlistState } from './wishlist/wishlist.state';
import { AuthState } from './auth/auth.state';
import { ProductsState } from './products/products.state';
import { RegionsState } from './regions/regions.state';
import { MedusaCartState } from './medusa-cart/medusa-cart.state';
import { CheckoutState } from './checkout/checkout.state';
import { ReturnsState } from './returns/returns.state';
import { CategoriesState } from './categories/categories.state';
import { CollectionsState } from './collections/collections.state';
import { OrdersState } from './orders/orders.state';
import { FCMState } from './fcm/fcm.state';
import { BoughtTogetherState } from './bought-together/bought-together.state';
import { ProductReviewsState } from './product-reviews/product-reviews.state';
import { ErrorState } from './errors/errors.state';
import { environment } from 'src/environments/environment';


export const STATES_MODULES = [
  ProductsState,
  CategoriesState,
  CollectionsState,
  RegionsState,
  AuthState,
  MedusaCartState,
  CheckoutState,
  ReturnsState,
  OrdersState,
  FCMState,
  BoughtTogetherState,
  ProductReviewsState,
  LanguageState,
  KeyboardState,
  FormState,
  ThemeState,
  WishlistState,
  ErrorState
];

export const STORAGE_MODULES = [
  'products',
  'categories',
  'collections',
  'regions',
  'auth',
  'medusaCart',
  'checkout',
  'returns',
  'orders',
  'fcm',
  'boughtTogether',
  'language',
  'keyboard',
  'form',
  'theme',
  'wishlist'
];

export const OPTIONS_CONFIG: Partial<NgxsConfig> = {
  developmentMode: !environment.production
};

export const DEVTOOLS_REDUX_CONFIG: NgxsDevtoolsOptions = {
  disabled: false
};

export const LOGGER_CONFIG: NgxsLoggerPluginOptions = {
  disabled: true
};

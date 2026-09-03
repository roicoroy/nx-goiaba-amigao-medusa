import { NgxsConfig } from '@ngxs/store';
import { NgxsDevtoolsOptions } from '@ngxs/devtools-plugin';
import { NgxsLoggerPluginOptions } from '@ngxs/logger-plugin';
import { NgxsStoragePluginOptions } from '@ngxs/storage-plugin';

import { AuthState } from './auth/auth.state';
import { OrdersState } from './orders/orders.state';
import { DashboardStates } from './dashboard';
import { LanguageState } from './language/language.state';

export const STATES_MODULES = [
  AuthState,
  OrdersState,
  ...DashboardStates,
  LanguageState
];

export const OPTIONS_CONFIG: Partial<NgxsConfig> = {
  /**
   * Run in development mode. This will add additional debugging features:
   * - Object.freeze on the state and actions to guarantee immutability
   * todo: you need set production mode
   * import { environment } from '@env';
   * developmentMode: !environment.production
   */
  developmentMode: true
};

export const DEVTOOLS_REDUX_CONFIG: NgxsDevtoolsOptions = {
  /**
   * Whether the dev tools is enabled or note. Useful for setting during production.
   * todo: you need set production mode
   * import { environment } from '@env';
   * disabled: environment.production
   */
  disabled: false
};

export const LOGGER_CONFIG: NgxsLoggerPluginOptions = {
  /**
   * Disable the logger. Useful for prod mode..
   * todo: you need set production mode
   * import { environment } from '@env';
   * disabled: environment.production
   */
  disabled: false
};

export const STORAGE_CONFIG: NgxsStoragePluginOptions = {
  /**
   * Key to use for the storage. Defaults to @@STATE
   */
  keys: ['authState']
  /**
   * Storage engine defaults to localStorage
   */
};

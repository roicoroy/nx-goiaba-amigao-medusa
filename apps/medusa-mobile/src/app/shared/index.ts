import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

@NgModule({
  imports: [
    CommonModule,
  ],
  exports: [
    CommonModule,
  ]
})
export class SharedModule { }
// Interfaces
export * from './interfaces/environment.interface';

// Services
export * from './services/auth-flow.service';
export * from './services/utils.service';
export * from './services/wishlist.service';
export * from './services/network-status.service';

// Core Services
export * from './loading/loading.service';
export * from './theme/theme.service';
export * from './language/language.service';
export * from './navigation/navigation.service';
export * from './alert/alert.service';

// Guards
export * from './guards/auth.guard';

// Interceptors
export * from './interceptor/auth.interceptor';
export * from './interceptor/medusa.interceptor';
export * from './errors/errors.interceptor';

// Constants
export * from './constants/app.constants';

// Utilities
export * from './utils';

// Validators
export * from './validators/password.validator';
export * from './validators/phone.validator';
export * from './validators/username.validator';
export * from './validators/checkbox-checked.validator';

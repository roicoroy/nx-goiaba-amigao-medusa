import { Routes } from '@angular/router';
import { AuthGuard } from './shared/guards/auth.guard';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'tabs',
    pathMatch: 'full',
  },
  {
    path: 'auth',
    loadComponent: () => import('./base/auth/auth.page').then(m => m.AuthPage),

  },
  {
    path: 'login',
    loadComponent: () => import('./base/auth/login/login.page').then(m => m.LoginPage),

  },
  {
    path: 'register',
    loadComponent: () => import('./base/auth/register/register.page').then(m => m.RegisterPage),
  },
  {
    path: 'auth/google/callback',
    loadComponent: () => import('./pages/social-login-callback/social-login-callback.page').then(m => m.SocialLoginCallbackPage)
  },
  {
    path: 'tabs',
    loadChildren: () => import('./pages/home/tabs/tabs.routes').then((m) => m.routes),
  },
  {
    path: 'smart-checkout',
    loadComponent: () => import('./pages/smart-checkout/smart-checkout.page').then((m) => m.SmartCheckoutPage),
  },
  {
    path: 'products',
    loadChildren: () => import('./pages/products/tabs/tabs.routes').then((m) => m.routes),
  },
  {
    path: 'products/products-daisy',
    loadComponent: () => import('./pages/products/products-daisy/products-daisy.page').then( m => m.ProductsDaisyPage)
  },
  {
    path: 'products/products-daisy/:id',
    loadComponent: () =>
      import('./pages/products/products-daisy/product-details-daisy/product-details-daisy.page').then((m) => m.ProductDetailsDaisyPage),
  },
  {
    path: 'product-details',
    loadComponent: () =>
      import('./pages/products/products/products-components/product-details/product-details.page').then(m => m.ProductDetailsPage)
  },
  {
    path: 'products/:id',
    loadComponent: () =>
      import('./pages/products/products/products-components/product-details/product-details.page').then((m) => m.ProductDetailsPage),
  },
  {
    path: 'category/:categoryId',
    loadComponent: () =>
      import('./pages/products/products/category-products/category-products.page').then((m) => m.CategoryProductsPage),
  },
  {
    path: 'customer',
    loadChildren: () => import('./pages/customer/tabs/tabs.routes').then((m) => m.routes),
    canActivate: [AuthGuard],
  },
  {
    path: 'add-address',
    loadComponent: () => import('./pages/customer/add-address/add-address.page').then((m) => m.AddAddressPage),
    canActivate: [AuthGuard],
  },
  {
    path: 'manage-address',
    loadComponent: () => import('./pages/customer/manage-address/manage-address.page').then((m) => m.ManageAddressPage),
    canActivate: [AuthGuard],
  },
  {
    path: 'orders',
    loadComponent: () =>
      import('./pages/customer/orders/order-review/order-review.page').then((m) => m.OrderReviewPage),
    canActivate: [AuthGuard],
  },
  {
    path: 'customer-orders',
    loadComponent: () => import('./pages/customer/orders/customer-orders/customer-orders.page').then((m) => m.CustomerOrdersPage),
    canActivate: [AuthGuard],
  },
  {
    path: 'order-review',
    loadComponent: () => import('./pages/customer/orders/order-review/order-review.page').then((m) => m.OrderReviewPage),
    canActivate: [AuthGuard],
  },
  {
    path: 'create-return',
    loadComponent: () => import('./pages/customer/returns/create-return/create-return.page').then((m) => m.CreateReturnPage),
    canActivate: [AuthGuard],
  },
  {
    path: 'order-completed',
    loadComponent: () => import('./pages/smart-checkout/order-completed/order-completed.page').then( m => m.OrderCompletedPage)
  },
  {
    path: 'products-daisy',
    loadComponent: () => import('./pages/products/products-daisy/products-daisy.page').then( m => m.ProductsDaisyPage)
  },
];

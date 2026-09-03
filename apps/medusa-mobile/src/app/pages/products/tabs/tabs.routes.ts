import { Routes } from '@angular/router';
import { TabsPage } from './tabs.page';
import { AuthGuard } from 'src/app/shared';

export const routes: Routes = [
  {
    path: '',
    component: TabsPage,
    children: [
      {
        path: 'products',
        loadComponent: () =>
          import('../products/products.page').then((m) => m.ProductsPage),
      },
      {
        path: 'products-daisy',
        loadComponent: () =>
          import('../products-daisy/products-daisy.page').then((m) => m.ProductsDaisyPage),
      },
      {
        path: 'wishlist',
        loadComponent: () =>
          import('../wishlist-page/wishlist.page').then((m) => m.WishlistPage),
        // canActivate: [AuthGuard],
      },
      {
        path: 'cart',
        loadComponent: () =>
          import('../cart/cart.page').then((m) => m.CartPage),
      },
      {
        path: '',
        redirectTo: 'products',
        pathMatch: 'full',
      },
    ],
  },
];

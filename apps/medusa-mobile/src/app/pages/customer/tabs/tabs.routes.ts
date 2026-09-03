import { Routes } from '@angular/router';
import { CustomerTabsPage } from './tabs.page';
import { AuthGuard } from 'src/app/shared';

export const routes: Routes = [
  {
    path: '',
    component: CustomerTabsPage,
    children: [
      {
        path: 'profile',
        loadComponent: () =>
          import('../medusa-profile/medusa-profile.page').then((m) => m.MedusaProfilePage),
      },
      {
        path: 'orders',
        loadComponent: () =>
          import('../orders/customer-orders/customer-orders.page').then((m) => m.CustomerOrdersPage),
        canActivate: [AuthGuard],
      },
      {
        path: '',
        redirectTo: 'profile',
        pathMatch: 'full',
      },
    ],
  },
];

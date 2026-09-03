import { Routes } from '@angular/router';
import { NewUITabsPage } from './tabs.page';

export const routes: Routes = [
  {
    path: '',
    component: NewUITabsPage,
    children: [
      {
        path: 'home',
        loadComponent: () =>
          import('../home-page/home.page').then((m) => m.HomePage),
      },
      {
        path: 'find-us',
        loadComponent: () =>
          import('../find-us/find-us.page').then((m) => m.FindUsPage),
      },
      {
        path: 'share',
        loadComponent: () =>
          import('../home-page/home.page').then((m) => m.HomePage),
      },
      {
        path: 'contact-us',
        loadComponent: () =>
          import('../contact-us/contact-us.page').then((m) => m.ContactUsPage),
      },
      {
        path: 'settings',
        loadComponent: () => import('../settings/settings.page').then(m => m.SettingsPage)
      },
      {
        path: '',
        redirectTo: 'home',
        pathMatch: 'full',
      },
    ],
  },
];

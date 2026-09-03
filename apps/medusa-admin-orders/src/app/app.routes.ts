import { Routes } from '@angular/router';
import { inject } from '@angular/core';
import { Store } from '@ngxs/store';
import { AuthState } from './store/auth/auth.state';
import { CheckAuthStatus } from './store/auth/auth.actions';

// Auth Guard
const authGuard = async () => {
  const store = inject(Store);

  // Check auth state (NGXS storage plugin will have restored it from localStorage)
  const isLoggedIn = store.selectSnapshot(AuthState.isLoggedIn);
  const token = store.selectSnapshot(AuthState.getToken);

  if (token && !isLoggedIn) {
    // We have a token but auth state isn't fully initialized, check auth status
    try {
      await store.dispatch(new CheckAuthStatus()).toPromise();
      return store.selectSnapshot(AuthState.isLoggedIn) ? true : '/login';
    } catch (error) {
      // Token is invalid, redirect to login
      return '/login';
    }
  }

  if (isLoggedIn) {
    return true;
  } else {
    // Redirect to login if not authenticated
    return '/login';
  }
};

// Login Guard (redirect to dashboard if already logged in)
const loginGuard = async () => {
  const store = inject(Store);
  const isLoggedIn = store.selectSnapshot(AuthState.isLoggedIn);
  const token = store.selectSnapshot(AuthState.getToken);

  // If we have a token but state says not logged in, verify the token
  if (token && !isLoggedIn) {
    try {
      await store.dispatch(new CheckAuthStatus()).toPromise();
      const stillLoggedIn = store.selectSnapshot(AuthState.isLoggedIn);
      if (stillLoggedIn) {
        return '/dashboard';
      }
    } catch (error) {
      // Token is invalid, allow access to login page
      return true;
    }
  }

  if (isLoggedIn) {
    return '/dashboard';
  } else {
    return true;
  }
};

export const routes: Routes = [
  {
    path: '',
    redirectTo: '/login',
    pathMatch: 'full',
  },
  {
    path: 'login',
    loadComponent: () =>
      import('./pages/login/login.page').then((m) => m.LoginPage),
    canActivate: [loginGuard]
  },
  {
    path: 'dashboard',
    loadComponent: () =>
      import('./pages/dashboard/dashboard.page').then((m) => m.DashboardPage),
    canActivate: [authGuard]
  },
  {
    path: 'orders',
    loadComponent: () =>
      import('./pages/orders/orders.page').then((m) => m.OrdersPage),
    canActivate: [authGuard]
  },
  {
    path: 'orders/:id',
    loadComponent: () =>
      import('./pages/order-detail/order-detail.page').then((m) => m.OrderDetailPage),
    canActivate: [authGuard]
  },
  {
    path: 'register',
    loadComponent: () => import('./pages/register/register.page').then( m => m.RegisterPage),
    canActivate: [loginGuard]
  },
  {
    path: 'folder/:id',
    loadComponent: () =>
      import('./folder/folder.page').then((m) => m.FolderPage),
  },
  {
    path: '**',
    redirectTo: '/login'
  }
];

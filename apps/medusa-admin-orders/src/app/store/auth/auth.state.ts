import { Injectable, inject } from '@angular/core';
import { Router } from '@angular/router';
import { Action, Selector, State, StateContext } from '@ngxs/store';
import { tap, catchError, switchMap } from 'rxjs/operators';
import { throwError, of } from 'rxjs';
import { MedusaStoreService } from '../../shared/api/medusa.service.store';
import { MedusaAdminService } from '../../shared/api/medusa.service.admin';
import { Login, LoginSuccess, LoginFailure, Logout, SetAuthData, CheckAuthStatus, Register } from './auth.actions';

export interface AuthenticationStateModel {
  id: string;
  firstName: string;
  lastName: string;
  fullName: string;
  email: string;
  isStoreStaff: boolean;
  staffRole: string | null; // "staff", "manager", "supervisor"
  isLoggedIn: boolean;
  token: string | null;
  loading: boolean;
  error: string | null;
}

@State<AuthenticationStateModel>({
  name: 'authState',
  defaults: {
    id: '',
    firstName: '',
    lastName: '',
    fullName: '',
    email: '',
    isStoreStaff: false,
    staffRole: null,
    isLoggedIn: false,
    token: null,
    loading: false,
    error: null
  }
})
@Injectable()
export class AuthState {
  private medusaStoreService = inject(MedusaStoreService);
  private medusaAdminService = inject(MedusaAdminService);
  private router = inject(Router);

  @Selector()
  static getAuthData(state: AuthenticationStateModel): AuthenticationStateModel {
    return { ...state };
  }

  @Selector()
  static isLoggedIn(state: AuthenticationStateModel): boolean {
    return state.isLoggedIn;
  }

  @Selector()
  static getUser(state: AuthenticationStateModel) {
    return {
      id: state.id,
      firstName: state.firstName,
      lastName: state.lastName,
      fullName: state.fullName,
      email: state.email,
      isStoreStaff: state.isStoreStaff,
      staffRole: state.staffRole
    };
  }

  @Selector()
  static getToken(state: AuthenticationStateModel): string | null {
    return state.token;
  }

  @Selector()
  static isLoading(state: AuthenticationStateModel): boolean {
    return state.loading;
  }

  @Selector()
  static getError(state: AuthenticationStateModel): string | null {
    return state.error;
  }

  @Action(Login)
  login(ctx: StateContext<AuthenticationStateModel>, { payload }: Login) {
    ctx.patchState({ loading: true, error: null });

    // Use admin login for admin users
    return this.medusaAdminService.adminLogin(payload.email, payload.password).pipe(
      switchMap((authResponse: any) => {
        // Store the token in state and localStorage immediately
        const token = authResponse.token;
        console.log('🔑 Admin login response - Token received:', token ? `${token.substring(0, 20)}...` : 'NO TOKEN');

        ctx.patchState({ token });
        console.log('💾 Token stored in state (NGXS storage plugin will persist it)');

        // Get the authenticated admin user data using the token
        return this.medusaAdminService.getCurrentUser().pipe(
          tap((user: any) => {
            console.log('👤 Admin user profile loaded, dispatching LoginSuccess');
            ctx.dispatch(new LoginSuccess({ user, token }));
          })
        );
      }),
      catchError((error) => {
        // Clear token on error (NGXS storage plugin will remove it)
        ctx.patchState({ token: null });
        ctx.dispatch(new LoginFailure({ error: error.userMessage || error.message || 'Login failed' }));
        return throwError(() => error);
      })
    );
  }

  @Action(Register)
  register(ctx: StateContext<AuthenticationStateModel>, { payload }: Register) {
    ctx.patchState({ loading: true, error: null });

    return this.medusaAdminService.createAdminUser(payload).pipe(
      switchMap((response) => {
        // Auto-login after successful registration
        return ctx.dispatch(new Login({
          email: payload.email,
          password: payload.password
        }));
      }),
      catchError((error) => {
        ctx.dispatch(new LoginFailure({
          error: error.userMessage || error.message || 'Registration failed'
        }));
        return throwError(() => error);
      })
    );
  }

  @Action(LoginSuccess)
  loginSuccess(ctx: StateContext<AuthenticationStateModel>, { payload }: LoginSuccess) {
    const { user, token } = payload;

    console.log('✅ LoginSuccess - Storing token:', token ? `${token.substring(0, 20)}...` : 'NO TOKEN');

    // Handle both admin user and customer data structures
    const firstName = user.first_name || user.firstName || '';
    const lastName = user.last_name || user.lastName || '';

    ctx.patchState({
      id: user.id,
      firstName,
      lastName,
      fullName: `${firstName} ${lastName}`.trim(),
      email: user.email,
      isStoreStaff: true, // Admin users are always staff
      staffRole: user.role || 'admin',
      isLoggedIn: true,
      token,
      loading: false,
      error: null
    });

    // Verify token is in state (NGXS storage plugin will persist it automatically)
    const storedToken = ctx.getState().token;
    console.log('🔍 Token in state after patch:', storedToken ? `${storedToken.substring(0, 20)}...` : 'NO TOKEN');
  }

  @Action(LoginFailure)
  loginFailure(ctx: StateContext<AuthenticationStateModel>, { payload }: LoginFailure) {
    ctx.patchState({
      loading: false,
      error: payload.error,
      isLoggedIn: false,
      token: null
    });
  }

  @Action(Logout)
  logout(ctx: StateContext<AuthenticationStateModel>) {
    // Call server logout endpoint to invalidate session
    return this.medusaAdminService.logout().pipe(
      catchError(() => {
        // Even if logout fails on server, we still want to clear local state
        return of(null);
      }),
      tap(() => {
        // Reset state to defaults (NGXS storage plugin will clear localStorage)
        ctx.setState({
          id: '',
          firstName: '',
          lastName: '',
          fullName: '',
          email: '',
          isStoreStaff: false,
          staffRole: null,
          isLoggedIn: false,
          token: null,
          loading: false,
          error: null
        });

        // Navigate to login page
        this.router.navigate(['/login']);
      })
    );
  }

  @Action(CheckAuthStatus)
  checkAuthStatus(ctx: StateContext<AuthenticationStateModel>) {
    // Get token from state (NGXS storage plugin will have restored it from localStorage)
    const token = ctx.getState().token;
    if (token) {
      ctx.patchState({ loading: true });

      return this.medusaAdminService.getCurrentUser().pipe(
        tap((user: any) => {
          const firstName = user.first_name || user.firstName || '';
          const lastName = user.last_name || user.lastName || '';

          ctx.patchState({
            id: user.id,
            firstName,
            lastName,
            fullName: `${firstName} ${lastName}`.trim(),
            email: user.email,
            isStoreStaff: true,
            staffRole: user.role || 'admin',
            isLoggedIn: true,
            loading: false,
            error: null
          });
        }),
        catchError((error) => {
          // Token is invalid, clear it (NGXS storage plugin will remove from localStorage)
          ctx.patchState({
            id: '',
            firstName: '',
            lastName: '',
            fullName: '',
            email: '',
            isStoreStaff: false,
            staffRole: null,
            isLoggedIn: false,
            token: null,
            loading: false,
            error: null
          });
          return throwError(() => error);
        })
      );
    }
    return ctx.getState();
  }

  @Action(SetAuthData)
  setAuthData(ctx: StateContext<AuthenticationStateModel>, { payload }: SetAuthData) {
    ctx.patchState(payload);
  }
}

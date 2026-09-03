import { Injectable, inject } from '@angular/core';
import { HttpHandler, HttpInterceptor, HttpRequest, HttpEvent, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { Store } from '@ngxs/store';
import { Router } from '@angular/router';
import { AuthState } from 'src/app/store/auth/auth.state';
import { Logout } from 'src/app/store/auth/auth.actions';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class AuthInterceptor implements HttpInterceptor {
  private store = inject(Store);
  private router = inject(Router);

  intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    let modifiedRequest = request;
    const url = request.url;
    const headers: { [key: string]: string } = {};

    // Subtask 4.1: Endpoint detection logic
    const isAdminEndpoint = url.includes('/admin/');
    const isStoreEndpoint = url.includes('/store/');
    const isAuthEndpoint = url.includes('/auth/');
    const isInitialLogin = url.includes('/auth/user/emailpass'); // Admin login endpoint
    const isAdminAuth = url.includes('/auth/user/');

    // Get JWT token from NGXS state
    const token = this.store.selectSnapshot(AuthState.getToken);

    // // Debug logging
    // if (isAdminEndpoint || isStoreEndpoint || isAuthEndpoint) {
    //   console.log('🔐 Auth Interceptor:', {
    //     url,
    //     token: token ? `${token.substring(0, 20)}...` : 'NO TOKEN',
    //     isAdminEndpoint,
    //     isStoreEndpoint,
    //     isAuthEndpoint,
    //     isInitialLogin
    //   });
    // }

    // Subtask 4.2: Conditional header addition

    // Add Bearer token to Authorization header for all authenticated requests except initial login
    if (token && !isInitialLogin) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    // Add x-medusa-access-token header with MEDUSA_ADMIN_KEY only for /admin/* endpoints
    if (isAdminEndpoint && environment.MEDUSA_ADMIN_KEY) {
      headers['x-medusa-access-token'] = environment.MEDUSA_ADMIN_KEY;
    }

    // Add x-publishable-api-key header with MEDUSA_PUBLISHABLE_KEY only for /store/* and customer /auth/* endpoints
    // Don't add it for admin auth endpoints (/auth/user/*)
    if ((isStoreEndpoint || (isAuthEndpoint && !isAdminAuth)) && environment.MEDUSA_PUBLISHABLE_KEY) {
      headers['x-publishable-api-key'] = environment.MEDUSA_PUBLISHABLE_KEY;
    }

    // Apply headers if any were added
    if (Object.keys(headers).length > 0) {
      modifiedRequest = request.clone({ setHeaders: headers });
    }

    // Subtask 4.3: Handle 401 Unauthorized errors globally
    return next.handle(modifiedRequest).pipe(
      catchError((error: HttpErrorResponse) => {
        // Catch 401 Unauthorized responses globally
        // BUT skip handling 401 on logout endpoint to prevent infinite loop
        const isLogoutEndpoint = url.includes('/auth/') && request.method === 'DELETE';

        if (error.status === 401 && !isLogoutEndpoint) {
          // Only logout if it's an authentication issue (token invalid/expired)
          // Don't logout for authorization issues (insufficient permissions)

          // If the error is from /admin/users/me, the token is invalid
          const isUserProfileEndpoint = url.includes('/users/me');

          // If it's the user profile endpoint failing, the token is definitely invalid
          // For other admin endpoints, it could be a permission issue, so don't auto-logout
          if (isUserProfileEndpoint) {
            // Token is invalid or expired - logout
            console.log('🔐 Token invalid/expired - logging out');
            this.store.dispatch(new Logout());
            this.router.navigate(['/login']);
          } else {
            // Could be a permission issue - don't logout, just let the error propagate
            console.log('🔐 401 error on endpoint - not auto-logging out (could be permission issue)');
          }
        }

        return throwError(() => error);
      })
    );
  }
}

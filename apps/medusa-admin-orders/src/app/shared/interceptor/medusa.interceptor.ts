
import { Injectable, inject } from '@angular/core';
import { HttpHandler, HttpInterceptor, HttpRequest, HttpEvent, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { Router } from '@angular/router';
import { environment } from 'src/environments/environment';
import { Store } from '@ngxs/store';
import { Logout } from 'src/app/store/auth/auth.actions';

@Injectable({
  providedIn: 'root'
})
export class MedusaInterceptor implements HttpInterceptor {
  private store = inject(Store);
  private router = inject(Router);
  private isLoggingOut = false;
  private recentlyLoggedIn = false;

  /**
   * Call this after successful login to prevent immediate 401 logout
   */
  setRecentlyLoggedIn() {
    this.recentlyLoggedIn = true;
    // Clear the flag after 2 seconds
    setTimeout(() => {
      this.recentlyLoggedIn = false;
    }, 2000);
  }

  intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    // Skip translation files
    if (request.url.startsWith('../assets/i18n/en.json')) {
      return next.handle(request);
    }

    // Check if this is a Medusa API request
    const isMedusaRequest = this.isMedusaApiRequest(request.url);

    if (isMedusaRequest) {
      return next.handle(this.medusaRequest(request)).pipe(
        catchError((error: HttpErrorResponse) => {
          // Handle 401 Unauthorized errors
          if (error.status === 401) {
            // Skip logout for auth-related endpoints to avoid infinite loops
            const isLoginEndpoint = request.url.includes('/auth/token') ||
                                    request.url.includes('/store/auth/token');
            const isLogoutEndpoint = request.url.includes('/auth/') && request.method === 'DELETE';
            const isProfileCheck = request.url.includes('/customer/me');

            const shouldSkipLogout = isLoginEndpoint || isLogoutEndpoint || isProfileCheck ||
                                     this.isLoggingOut || this.recentlyLoggedIn;

            if (!shouldSkipLogout) {
              console.log('🔒 Session expired (401), logging out...', request.url);
              this.isLoggingOut = true;
              // Dispatch logout action
              this.store.dispatch(new Logout()).subscribe({
                complete: () => {
                  // Reset flag after a delay to allow navigation to complete
                  setTimeout(() => {
                    this.isLoggingOut = false;
                  }, 1000);
                }
              });
            } else {
              console.log('⏭️ Skipping logout for auth endpoint:', request.url, request.method);
            }
          }
          return throwError(() => error);
        })
      );
    }

    return next.handle(request);
  }

  private isMedusaApiRequest(url: string): boolean {
    // Check for various patterns that indicate a Medusa API request
    return url.includes(environment.MEDUSA_BACKEND_URL) ||
      url.includes(environment.MEDUSA_API_BASE_PATH) ||
      url.includes('localhost:9000') ||
      url.includes('/store/') ||
      url.includes('/admin/') ||
      url.includes('/auth/');
  }

  private medusaRequest(request: HttpRequest<any>): HttpRequest<any> {
    // const token = this.store.selectSnapshot(AuthState.getToken);

    let headers = request.headers;

    // Set Content-Type for JSON requests, but NOT for FormData (file uploads)
    if (!headers.has('Content-Type') && !(request.body instanceof FormData)) {
      headers = headers.set('Content-Type', 'application/json;charset=UTF-8');
    }
    if (!headers.has('Accept')) {
      headers = headers.set('Accept', 'application/json');
    }

    // Always set the publishable key if available and not already set
    if (environment.MEDUSA_ADMIN_KEY && !headers.has('x-publishable-api-key')) {
      headers = headers.set('x-publishable-api-key', environment.MEDUSA_ADMIN_KEY);

    }

    // Add authorization token if available
    // if (token && !headers.has('Authorization')) {
    //   headers = headers.set('Authorization', `Bearer ${token}`);
    // }

    return request.clone({
      headers,
      withCredentials: true
    });
  }
}

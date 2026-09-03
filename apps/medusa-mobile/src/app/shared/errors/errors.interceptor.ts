import {
  HttpEvent,
  HttpHandler,
  HttpInterceptor,
  HttpRequest,
  HttpErrorResponse
} from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { Store } from '@ngxs/store';
import { GlobalErrorHandlerService } from './global-error-handler/global-error-handler.service';
import { AlertService } from '../alert/alert.service';
import { NavigationService } from '../navigation/navigation.service';
import { NetworkStatusService } from '../services/network-status.service';
import { AuthActions } from 'src/app/store/auth/auth.actions';
import { AuthState } from 'src/app/store/auth/auth.state';
import { ErrorActions } from 'src/app/store/errors/errors.actions';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ErrorInterceptor implements HttpInterceptor {
  private store = inject(Store);
  private globalErrors = inject(GlobalErrorHandlerService);
  private alert = inject(AlertService);
  private nav = inject(NavigationService);
  private networkStatus = inject(NetworkStatusService);

  // URLs that should not trigger automatic error handling
  private readonly skipErrorHandling = [
    '/auth/session',
    '/auth/token/refresh'
  ];

  // URLs that should show less intrusive error handling for network issues
  private readonly silentNetworkErrorUrls = [
    '/store/products',
    '/store/customers/me/wishlists',
    '/store/wishlist',
    '/store/return-reasons',
    '/store/returns'
  ];

  // URLs that need special error handling for server issues
  private readonly criticalErrorUrls = [
    '/store/carts'
  ];

  // URLs for endpoints that are optional and can fail gracefully (not yet implemented on backend)
  // Also includes endpoints where 404 is expected business logic (e.g., empty wishlist)
  private readonly optionalEndpoints = [
    '/store/products-bought-together',
    '/store/product-reviews',
    '/store/customers/me/wishlists',
    '/store/wishlist'
  ];

  intercept(
    request: HttpRequest<any>,
    next: HttpHandler
  ): Observable<HttpEvent<any>> {
    return next.handle(request).pipe(
      catchError((error: HttpErrorResponse) => {
        // Skip error handling for certain endpoints
        if (this.shouldSkipErrorHandling(request.url)) {
          return throwError(() => error);
        }

        this.handleHttpError(error);
        return throwError(() => error);
      })
    );
  }

  private shouldSkipErrorHandling(url: string): boolean {
    return this.skipErrorHandling.some(skipUrl => url.includes(skipUrl));
  }

  private isOptionalEndpoint(url: string): boolean {
    return this.optionalEndpoints.some(optionalUrl => url.includes(optionalUrl));
  }

  private handleHttpError(error: HttpErrorResponse): void {
    const isLoggedIn = this.store.selectSnapshot(AuthState.isLoggedIn);
    const url = error.url || '';
    const isCriticalError = this.criticalErrorUrls.some(criticalUrl => url.includes(criticalUrl));
    const isOptional = this.isOptionalEndpoint(url);

    // Log error to ErrorState (if enabled and meets threshold)
    this.logErrorToState(error);

    switch (error.status) {
      case 0:
        // Network connectivity issues - server offline, CORS, or connection refused
        this.handleNetworkError(error);
        break;

      case 400:
        this.globalErrors.handleError(error);
        // SECURITY: Only log sanitized messages in development
        if (!environment.production) {
          console.warn('Bad Request:', error.error?.message || 'Invalid request');
        }
        break;

      case 401:
        this.globalErrors.handleError(error);
        if (isLoggedIn) {
          // User was logged in but token expired
          this.store.dispatch(new AuthActions.AuthLogout());
          this.nav.navigateTo('welcome');
        }
        break;

      case 403:
        this.globalErrors.handleError(error);
        // SECURITY: Don't expose error details in production
        if (!environment.production) {
          console.warn('Forbidden: Access denied');
        }
        break;

      case 404:
        // For optional endpoints, skip global error handling (no alerts, no error dialogs)
        if (isOptional) {
          // Still log in development for debugging
          if (!environment.production) {
            console.warn('Optional endpoint not found (404):', url);
          }
        } else {
          this.globalErrors.handleError(error);
          // SECURITY: Don't expose resource paths in production
          if (!environment.production) {
            console.warn('Not Found: Resource not found');
          }
        }
        break;

      case 422:
        this.globalErrors.handleError(error);
        // SECURITY: Don't expose validation details in production
        if (!environment.production) {
          console.warn('Validation Error: Invalid data');
        }
        break;

      case 429:
        this.globalErrors.handleError(error);
        // SECURITY: Rate limiting info is safe to log
        if (!environment.production) {
          console.warn('Too Many Requests: Please slow down your requests');
        }
        break;

      case 500:
      case 502:
      case 503:
      case 504:
        if (isCriticalError) {
          this.handleCriticalServerError(error);
        } else {
          this.globalErrors.handleError(error);
        }
        // SECURITY: Don't expose server error details in production
        if (!environment.production) {
          console.error('Server Error: Server is experiencing issues');
        }
        break;

      default:
        this.globalErrors.handleError(error);
        // SECURITY: Don't log full error objects in production
        if (!environment.production) {
          console.error('Unknown Error occurred');
        }
        break;
    }
  }

  private handleNetworkError(error: HttpErrorResponse): void {
    const url = error.url || 'unknown endpoint';
    let userMessage = 'Unable to connect to the server';

    // Check if this is an optional endpoint (likely CORS issue from missing endpoint)
    const isOptional = this.isOptionalEndpoint(url);
    
    // Check if this should be a silent network error (less intrusive)
    const isSilentError = this.silentNetworkErrorUrls.some(silentUrl => url.includes(silentUrl));

    // Get user-friendly message using network status service
    userMessage = this.networkStatus.getNetworkErrorMessage(error);

    // For optional endpoints with status 0, treat as graceful failure (skip alert)
    // This handles CORS errors when backend doesn't send CORS headers for 404s
    if (isOptional) {
      // Still log in development for debugging
      if (!environment.production) {
        console.warn('Optional endpoint network error (likely CORS from missing endpoint):', {
          status: error.status,
          statusText: error.statusText,
          url: error.url,
          message: error.message
        });
      }
      // Skip alert for optional endpoints - treat as graceful failure
      return;
    }

    // Only show alert for non-silent errors or critical endpoints
    if (!isSilentError) {
      this.alert.presentSimpleAlert(userMessage);
    }

    // SECURITY: Only log detailed network errors in development
    if (!environment.production) {
      console.error('Network connectivity issue:', {
        status: error.status,
        statusText: error.statusText,
        url: error.url,
        message: error.message,
        isSilentError,
        isOnline: this.networkStatus.isOnline
      });
    }
  }

  private handleCriticalServerError(error: HttpErrorResponse): void {
    const url = error.url || 'unknown endpoint';
    let userMessage = 'Server is experiencing technical difficulties';

    // Provide specific messages for different critical operations
    if (url.includes('/store/carts')) {
      userMessage = 'Unable to create or update cart due to server issues. Please try again in a few moments.';
    } else if (url.includes('/store/orders')) {
      userMessage = 'Unable to process order due to server issues. Please try again later.';
    } else if (url.includes('/store/payment')) {
      userMessage = 'Payment processing is currently unavailable. Please try again later.';
    }

    // Show user-friendly error message for critical operations
    this.alert.presentSimpleAlert(userMessage);

    // SECURITY: Only log detailed errors in development, don't expose error details in production
    if (!environment.production) {
      console.error('Critical server error:', {
        status: error.status,
        statusText: error.statusText,
        // Don't log full URL or error details in production
        message: 'Server error occurred'
      });
    }
  }

  /**
   * Log HTTP error to ErrorState
   * Only logs errors that meet severity threshold and are not skipped
   */
  private logErrorToState(error: HttpErrorResponse): void {
    // Skip optional endpoints (404s are expected business logic)
    if (this.isOptionalEndpoint(error.url || '')) {
      return;
    }

    // Skip if error handling should be skipped
    if (this.shouldSkipErrorHandling(error.url || '')) {
      return;
    }

    // Determine severity based on status code
    const severity = this.getErrorSeverity(error.status);

    // Get sanitized error message
    const errorMessage = error.error?.message || error.message || 'HTTP Error';
    const userMessage = this.getUserFriendlyMessage(error);

    // Dispatch to ErrorState
    this.store.dispatch(new ErrorActions.LogError({
      type: 'http',
      severity,
      status: error.status,
      message: errorMessage,
      url: error.url || undefined,
      userMessage,
      timestamp: new Date().toISOString()
    }));
  }

  /**
   * Get error severity based on HTTP status code
   */
  private getErrorSeverity(status: number): 'low' | 'medium' | 'high' | 'critical' {
    if (status >= 500) {
      return 'critical';
    } else if (status === 401 || status === 403) {
      return 'high';
    } else if (status === 400 || status === 404 || status === 422) {
      return 'medium';
    } else if (status === 0) {
      return 'high'; // Network errors
    } else {
      return 'low';
    }
  }

  /**
   * Get user-friendly error message
   */
  private getUserFriendlyMessage(error: HttpErrorResponse): string {
    if (error.error?.message) {
      return error.error.message;
    }
    if (error.message) {
      return error.message;
    }
    return 'An error occurred';
  }
}

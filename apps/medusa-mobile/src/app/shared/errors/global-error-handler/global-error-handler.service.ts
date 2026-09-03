import { ErrorHandler, Injectable, Injector, inject } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { Store } from '@ngxs/store';
import { DialogService } from '../dialog/dialog.service';
import { ErrorActions } from 'src/app/store/errors/errors.actions';
import { environment } from 'src/environments/environment';

const LOGTAG = '[GlobalErrorHandlerService]';

@Injectable({
  providedIn: 'root',
})
export class GlobalErrorHandlerService implements ErrorHandler {
  private injector = inject(Injector);
  private store = inject(Store);

  public handleError(error: unknown): void {
    this.handle(error);
  }

  private async handle(error: unknown): Promise<void> {
    try {
      // console.error(error);
      const message = this.getMessageFromUnknownError(error);

      // Log error to ErrorState (only if enabled)
      this.logErrorToState(error, message);

      await this.showErrorAlert(message);
    } catch (errorHandlerError) {
      console.error(`${LOGTAG} Internal exception:`, errorHandlerError);
    }
  }

  /**
   * Log unhandled error to ErrorState
   * Only logs in development or if explicitly enabled
   * Skips HTTP errors (they're already logged by ErrorInterceptor)
   */
  private logErrorToState(error: unknown, message: string): void {
    // Skip HTTP errors - they're already logged by ErrorInterceptor
    if (error instanceof HttpErrorResponse) {
      return;
    }

    const errorLoggingConfig = environment.errorLogging || { enabled: !environment.production };
    
    // Only log if enabled
    if (!errorLoggingConfig.enabled) {
      return;
    }

    // Extract stack trace (limit in state will truncate if needed)
    let stack: string | undefined;
    if (error instanceof Error && error.stack) {
      stack = error.stack;
    } else if (error && typeof error === 'object' && 'stack' in error) {
      stack = String((error as any).stack);
    }

    // Determine severity (unhandled errors are typically high)
    const severity: 'low' | 'medium' | 'high' | 'critical' = 
      (error instanceof Error && error.name === 'TypeError') ? 'high' : 'critical';

    // Dispatch to ErrorState
    this.store.dispatch(new ErrorActions.LogError({
      type: 'global',
      severity,
      message,
      stack,
      timestamp: new Date().toISOString()
    }));
  }

  private getMessageFromUnknownError(error: any): string {
    let message = 'An unknown error has occurred....';
    if (error instanceof Object && 'rejection' in error) {
      error = (error as any).rejection;
    }
    if (error instanceof Error && error.message) {
      message = error.message;
    }
    if (error.status === 401 && error.name === "HttpErrorResponse") {
      message = error.error;
    }
    const myErr: any = error;
    if (myErr.error.message) {
      message = myErr.error.message;
    }
    return message;
  }

  private async showErrorAlert(message: string): Promise<void> {
    const dialogService: DialogService =
      this.injector.get<DialogService>(DialogService);
    await dialogService.showErrorAlert({ message });
  }
}

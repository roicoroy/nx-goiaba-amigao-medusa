import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, fromEvent, merge } from 'rxjs';
import { map, startWith } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class NetworkStatusService {
  private isOnlineSubject = new BehaviorSubject<boolean>(navigator.onLine);

  public readonly isOnline$: Observable<boolean> = merge(
    fromEvent(window, 'online').pipe(map(() => true)),
    fromEvent(window, 'offline').pipe(map(() => false))
  ).pipe(
    startWith(navigator.onLine)
  );

  constructor() {
    // Update the subject when network status changes
    this.isOnline$.subscribe(isOnline => {
      this.isOnlineSubject.next(isOnline);
    });
  }

  get isOnline(): boolean {
    return this.isOnlineSubject.value;
  }

  get isOffline(): boolean {
    return !this.isOnline;
  }

  /**
   * Check if an error is likely due to network connectivity issues
   */
  isNetworkError(error: any): boolean {
    return (
      error?.status === 0 ||
      error?.isNetworkError ||
      error?.name === 'NetworkError' ||
      (error?.message && error.message.includes('ERR_FAILED')) ||
      (error?.statusText === 'Unknown Error' && error?.status === 0)
    );
  }

  /**
   * Get a user-friendly message for network errors
   */
  getNetworkErrorMessage(error: any): string {
    if (this.isOffline) {
      return 'You appear to be offline. Please check your internet connection.';
    }

    if (error?.url?.includes('localhost') || error?.url?.includes('127.0.0.1')) {
      return 'Development server is not running. Please start the backend server.';
    }

    return 'Unable to connect to the server. Please check your connection and try again.';
  }
}

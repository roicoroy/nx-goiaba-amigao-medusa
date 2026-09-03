import { Injectable, inject } from '@angular/core';
import { Store } from '@ngxs/store';
import { Observable } from 'rxjs';
import { FCMState } from './fcm.state';
import { FCMActions } from './fcm.actions';

@Injectable({
  providedIn: 'root'
})
export class FCMFacade {
  private store = inject(Store);

  // Individual observables
  token$: Observable<string | null> = this.store.select(FCMState.getToken);
  isRegistered$: Observable<boolean> = this.store.select(FCMState.isRegistered);
  loading$: Observable<boolean> = this.store.select(FCMState.getLoading);
  error$: Observable<string | null> = this.store.select(FCMState.getError);

  // Actions
  initialize(customerId?: string): void {
    this.store.dispatch(new FCMActions.Initialize(customerId));
  }

  registerToken(token: string, customerId?: string): void {
    this.store.dispatch(new FCMActions.RegisterToken(token, customerId));
  }

  unregisterToken(token?: string): void {
    this.store.dispatch(new FCMActions.UnregisterToken(token));
  }

  clearFCM(): void {
    this.store.dispatch(new FCMActions.ClearFCM());
  }

  // Selectors (snapshot helpers)
  getTokenSnapshot(): string | null {
    return this.store.selectSnapshot(FCMState.getToken);
  }

  isRegisteredSnapshot(): boolean {
    return this.store.selectSnapshot(FCMState.isRegistered);
  }

  getLoadingSnapshot(): boolean {
    return this.store.selectSnapshot(FCMState.getLoading);
  }

  getErrorSnapshot(): string | null {
    return this.store.selectSnapshot(FCMState.getError);
  }
}


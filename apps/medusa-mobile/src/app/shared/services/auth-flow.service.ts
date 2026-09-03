import { Injectable, inject } from '@angular/core';
import { Router } from '@angular/router';
import { ModalController } from '@ionic/angular/standalone';
import { Store } from '@ngxs/store';
import { AuthState } from '../../store/auth/auth.state';
import { AuthActions } from '../../store/auth/auth.actions';
import { Observable } from 'rxjs';
// LoginComponent will be lazy loaded to avoid circular dependencies

@Injectable({
  providedIn: 'root'
})
export class AuthFlowService {
  private store = inject(Store);
  private router = inject(Router);
  
  /**
   * Force logout and redirect to home
   */
  forceLogout(): void {
    this.store.dispatch(new AuthActions.AuthLogout());
    this.router.navigate(['/products/products']);
  }

  /**
   * Check if user is authenticated
   * @returns boolean
   */
  isAuthenticated(): boolean {
    return this.store.selectSnapshot(AuthState.isLoggedIn);
  }

  /**
   * Get current authentication state as observable
   * @returns Observable<boolean>
   */
  getAuthState(): Observable<boolean> {
    return this.store.select(AuthState.isLoggedIn);
  }
}

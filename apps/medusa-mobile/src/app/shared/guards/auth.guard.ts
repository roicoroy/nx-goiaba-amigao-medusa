import { Injectable, inject } from '@angular/core';
import { CanActivate, Router, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { Observable, map } from 'rxjs';
import { Store } from '@ngxs/store';
import { AuthState } from 'src/app/store/auth/auth.state';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {
  private store = inject(Store);
  private router = inject(Router);

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Observable<boolean> {
    return this.store.select(AuthState.isLoggedIn).pipe(
      map(isLoggedIn => {
        if (isLoggedIn) {
          return true;
        } else {
          // Navigate to login page with return URL
          const returnUrl = state.url;
          this.router.navigate(['/login'], { 
            queryParams: { returnUrl: returnUrl } 
          });
          return false;
        }
      })
    );
  }
}

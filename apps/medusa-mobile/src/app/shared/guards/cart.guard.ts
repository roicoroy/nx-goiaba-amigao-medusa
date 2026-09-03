import { Injectable, inject } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { Store } from '@ngxs/store';
import { Observable, of } from 'rxjs';
import { MedusaCartState } from 'src/app/store/medusa-cart/medusa-cart.state';

@Injectable({
  providedIn: 'root'
})
export class CartGuard implements CanActivate {
  private store = inject(Store);
  private router = inject(Router);

  canActivate(): Observable<boolean> {
    return this.checkCart();
  }

  private checkCart(): Observable<boolean> {
    try {
      const cart = this.store.selectSnapshot(MedusaCartState.getMedusaCart);

      if (cart?.id) {
        console.log('Cart guard: Valid cart found', cart.id);
        return of(true);
      }

      console.warn('Cart guard: No cart found, attempting refresh...');

      // Try to refresh cart
      this.store.dispatch({ type: '[MedusaCart] Refresh Cart' });

      // Wait a moment for the refresh to complete
      return new Observable(observer => {
        setTimeout(() => {
          const refreshedCart = this.store.selectSnapshot(MedusaCartState.getMedusaCart);

          if (refreshedCart?.id) {
            console.log('Cart guard: Cart refreshed successfully');
            observer.next(true);
          } else {
            console.warn('Cart guard: No cart available after refresh, redirecting to cart');
            this.router.navigate(['/cart']);
            observer.next(false);
          }
          observer.complete();
        }, 1000);
      });

    } catch (error) {
      console.error('Cart guard: Error checking cart', error);
      this.router.navigate(['/cart']);
      return of(false);
    }
  }
}

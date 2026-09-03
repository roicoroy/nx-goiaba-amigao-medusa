import { Component, OnDestroy, inject, ChangeDetectionStrategy, signal, computed } from '@angular/core';
import { IonBadge, IonButton, IonIcon } from '@ionic/angular/standalone';
import { CommonModule } from '@angular/common';
import { Subject } from 'rxjs';
import { Store } from '@ngxs/store';
import { Router } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { MedusaCart } from '../../../shared/interfaces';
import { MedusaCartState } from '../../../store/medusa-cart/medusa-cart.state';

/**
 * Cart Button Component
 *
 * A modern cart button component that displays cart icon with item count badge.
 * Always visible, showing empty cart icon when cart is null.
 *
 * @example
 * ```html
 * <app-cart-button></app-cart-button>
 * ```
 */
@Component({
  selector: 'app-cart-button',
  templateUrl: './cart-button.component.html',
  styleUrls: ['./cart-button.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    IonBadge,
    IonIcon,
    IonButton
  ],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CartButtonComponent implements OnDestroy {
  private store = inject(Store);
  private router = inject(Router);
  private readonly ngUnsubscribe = new Subject<void>();

  /**
   * Signal of the current cart state
   */
  medusaCart = toSignal(this.store.select(MedusaCartState.getMedusaCart), { initialValue: null });

  /**
   * Computed signal for total item count (sum of all item quantities)
   */
  itemCount = computed(() => {
    const cart = this.medusaCart();
    if (!cart || !cart.items) {
      return 0;
    }

    return cart.items.reduce((sum: number, item: any) => {
      return sum + (item.quantity || 0);
    }, 0);
  });

  ngOnDestroy(): void {
    this.ngUnsubscribe.next();
    this.ngUnsubscribe.complete();
  }

  /**
   * Navigate to cart page
   */
  navigateToCart(): void {
    this.router.navigate(['/products/cart']);
  }
}

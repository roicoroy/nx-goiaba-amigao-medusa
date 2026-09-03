import { CommonModule } from '@angular/common';
import { Component, inject, OnInit, OnDestroy, signal, computed } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { IonIcon, IonSpinner } from '@ionic/angular/standalone';
import { Subject } from 'rxjs';
import { Store } from '@ngxs/store';
import { Router } from '@angular/router';
import { ModalController } from '@ionic/angular/standalone';
import { toSignal } from '@angular/core/rxjs-interop';

import { ShortNumber } from "src/app/shared/pipes/short-number/short-number.pipe";
import { MedusaCurrency } from "src/app/shared/pipes/medusa-currency/medusa-currency.pipe";
import { MedusaCart, MedusaLineItem } from 'src/app/shared/interfaces';
import { MedusaCartActions } from 'src/app/store/medusa-cart/medusa-cart.actions';
import { MedusaCartState } from 'src/app/store/medusa-cart/medusa-cart.state';
import { ApplyDiscountComponent } from '../../apply-discount/apply-discount.component';

@Component({
  selector: 'app-medusa-cart',
  templateUrl: './medusa-cart.component.html',
  styleUrls: ['./medusa-cart.component.scss'],
  standalone: true,
  imports: [
    IonIcon,
    IonSpinner,
    CommonModule,
    FormsModule,
    ShortNumber,
    MedusaCurrency,
    ApplyDiscountComponent
  ]
})
export class MedusaCartComponent implements OnInit, OnDestroy {

  private store = inject(Store);
  private router = inject(Router);
  private modalCtrl = inject(ModalController);
  private readonly ngUnsubscribe = new Subject<void>();

  medusaCart = toSignal(this.store.select(MedusaCartState.getMedusaCart), { initialValue: null });

  /**
   * Computed signal for cart empty state
   */
  isCartEmpty = computed(() => {
    const cart = this.medusaCart();
    return !cart || !cart.items || cart.items.length === 0;
  });

  loading = signal(false);
  error = signal<string | null>(null);

  ngOnInit() {
    this.refreshCart();
  }

  /**
   * Refresh cart data from the server
   */
  refreshCart() {
    this.loading.set(true);
    this.error.set(null);
    this.store.dispatch(new MedusaCartActions.RefreshCart());

    // Simulate refresh completion (in real app, would wait for store update)
    setTimeout(() => {
      this.loading.set(false);
    }, 500);
  }

  ngOnDestroy(): void {
    this.ngUnsubscribe.next();
    this.ngUnsubscribe.complete();
  }

  /**
   * Decrease item quantity in cart
   */
  decrementItem(item: MedusaLineItem) {
    if (item.quantity > 1) {
      this.store.dispatch(new MedusaCartActions.DecreaseCartItem(item));
    } else {
      this.delete(item);
    }
  }

  /**
   * Increase item quantity in cart
   */
  incrementItem(item: MedusaLineItem) {
    this.store.dispatch(new MedusaCartActions.IncreaseCartItem(item));
  }

  /**
   * Remove item from cart
   */
  delete(item: MedusaLineItem) {
    this.store.dispatch(new MedusaCartActions.DeleteCartItem(item.id));
  }

  /**
   * Clear entire cart
   */
  clearCart() {
    const currentCart = this.store.selectSnapshot((state: any) => state.medusaCart?.medusaCart);
    if (currentCart?.items) {
      currentCart.items.forEach((item: any) => {
        this.store.dispatch(new MedusaCartActions.DeleteCartItem(item.id));
      });
    }
  }

  /**
   * Proceed to checkout
   */
  async checkout() {
    const currentCart = this.store.selectSnapshot((state: any) => state.medusaCart?.medusaCart);

    console.log('Proceeding to checkout...', { cart: currentCart });

    // Navigate to smart checkout
    this.router.navigate(['/smart-checkout'], {
      queryParams: { cartId: currentCart?.id }
    });
  }

  /**
   * Continue shopping
   */
  continueShopping() {
    this.router.navigate(['/products/products']);
  }

  /**
   * Handle image loading errors
   */
  onImageError(event: any) {
    // Fallback to a default product image
    event.target.src = 'assets/img/product/product-1.jpg';
  }

}

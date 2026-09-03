import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { IonContent, ToastController } from '@ionic/angular/standalone';
import { Store } from '@ngxs/store';
import { MedusaCartComponent } from 'src/app/components/medusa-cart/medusa-cart/medusa-cart.component';
import { GoiabaHeaderComponent } from 'src/app/components/goiaba-components/goiaba-header/goiaba-header.component';
import { MedusaCartState } from 'src/app/store/medusa-cart/medusa-cart.state';

@Component({
  selector: 'app-cart',
  templateUrl: './cart.page.html',
  styleUrls: ['./cart.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    IonContent,
    MedusaCartComponent,
    GoiabaHeaderComponent
  ]
})
export class CartPage {

  constructor(
    private router: Router,
    private store: Store,
    private toastController: ToastController
  ) {}

  goToPhysicalCheckout() {
    const cart = this.store.selectSnapshot(MedusaCartState.getMedusaCart);
    const cartId = cart?.id || this.store.selectSnapshot(MedusaCartState.getCartId);

    if (!cartId) {
      this.showToast('Add items to cart first, then try checkout', 'warning');
      return;
    }

    // Check if cart is completed
    if (cart && cart.completed_at) {
      this.showToast('This cart has already been completed. Please add new items to start a new order.', 'warning');
      return;
    }

    this.router.navigate(['/smart-checkout'], {
      queryParams: { cartId }
    });
  }

  private async showToast(message: string, color: string = 'primary') {
    const toast = await this.toastController.create({
      message,
      duration: 3000,
      position: 'bottom',
      color,
      buttons: [{ text: 'OK', role: 'cancel' }]
    });
    await toast.present();
  }
}

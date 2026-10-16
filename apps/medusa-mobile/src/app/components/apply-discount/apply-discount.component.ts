import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonItem, IonLabel, IonInput, IonButton } from '@ionic/angular/standalone';
import { Store } from '@ngxs/store';
import { MedusaCartActions } from 'src/app/store/medusa-cart/medusa-cart.actions';

@Component({
  selector: 'app-apply-discount',
  templateUrl: './apply-discount.component.html',
  styleUrls: ['./apply-discount.component.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, IonItem, IonLabel, IonInput, IonButton]
})
export class ApplyDiscountComponent {
  private store = inject(Store);

  promoCode: string = '';

  applyDiscount() {
    if (this.promoCode.trim()) {
      this.store.dispatch(new MedusaCartActions.AddPromotionstoCart(this.promoCode.trim()));
      this.promoCode = '';
    }
  }
}

import { CommonModule } from '@angular/common';
import { AfterViewInit, Component, Input, inject } from '@angular/core';
import { MedusaVariant } from 'src/app/shared/interfaces/medusa-variant.interface';
import { Store } from '@ngxs/store';
import { IonButton, IonRow, IonCol } from '@ionic/angular/standalone';
import { MedusaCartActions } from 'src/app/store/medusa-cart/medusa-cart.actions';
import { MedusaCurrency } from 'src/app/shared/pipes/medusa-currency/medusa-currency.pipe';
import { ShortNumber } from 'src/app/shared/pipes/short-number/short-number.pipe';

@Component({
    selector: 'app-details-price-view',
    templateUrl: './details-price-view.component.html',
    standalone: true,
    imports: [
        IonCol,
        IonRow,
        IonButton,
        CommonModule,
        ShortNumber,
        MedusaCurrency
    ],
})
export class DetailsPriceViewComponent {

    @Input() variant!: MedusaVariant;

    @Input() productImage?: string;

    @Input() title?: string;

    private store = inject(Store);

    addToCart() {
        this.store.dispatch(new MedusaCartActions.AddToMedusaCart(this.variant));
    }
}

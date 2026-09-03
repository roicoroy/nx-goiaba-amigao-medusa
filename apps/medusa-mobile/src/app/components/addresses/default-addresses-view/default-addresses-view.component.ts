import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { IonGrid, IonCardContent, IonRow, IonCol, IonCard, IonCardHeader, IonCardTitle } from '@ionic/angular/standalone';
import { AddressViewComponent } from 'src/app/components/addresses/address-view/address-view.component';
import { MedusaAddress } from 'src/app/shared/interfaces';
import { MedusaCustomer } from 'src/app/shared/interfaces/customer-product.interface';

@Component({
    selector: 'app-default-addresses-view',
    templateUrl: './default-addresses-view.component.html',
    styleUrls: ['./default-addresses-view.component.scss'],
    standalone: true,
    imports: [
        IonCardTitle,
        IonCardHeader,
        IonCard,
        IonCol,
        IonRow,
        IonCardContent,
        IonGrid,
        CommonModule,
        AddressViewComponent
    ],
})
export class DefaultAddressesViewComponent {
    @Input() customer!: MedusaCustomer | null;

    get billingAddress(): MedusaAddress | undefined {
        if (!this.customer || !this.customer.addresses) {
            return undefined;
        }
        return this.customer.addresses.find(addr => addr.is_default_billing === true);
    }

    get shippingAddress(): MedusaAddress | undefined {
        if (!this.customer || !this.customer.addresses) {
            return undefined;
        }
        return this.customer.addresses.find(addr => addr.is_default_shipping === true);
    }

    get hasAddresses(): boolean {
        return !!(this.customer?.addresses && this.customer.addresses.length > 0);
    }
}

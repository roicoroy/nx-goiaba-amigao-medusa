import { CommonModule } from '@angular/common';
import { Component, Input, inject, OnChanges, SimpleChanges, OnInit } from '@angular/core';
import { Store } from '@ngxs/store';
import { IonIcon } from '@ionic/angular/standalone';
import { Router } from '@angular/router';
import { MedusaCustomer } from 'src/app/shared/interfaces/customer-product.interface';
import { AddressViewComponent } from 'src/app/components/addresses/address-view/address-view.component';
import { AuthActions } from 'src/app/store/auth/auth.actions';
import { NavigationService } from 'src/app/shared';

@Component({
    selector: 'app-default-addresses-list',
    templateUrl: './default-addresses-list.component.html',
    styleUrls: ['./default-addresses-list.component.scss'],
    standalone: true,
    imports: [
    IonIcon,
    CommonModule,
    AddressViewComponent,
],
})
export class DefaultAddressesListComponent implements OnChanges, OnInit {

    @Input() customer!: MedusaCustomer | null;

    // Local copy of addresses to maintain order
    localAddresses: any[] = [];

    private nav = inject(NavigationService);
    private store = inject(Store);

    ngOnInit(): void {
        // Initialize addresses on component init
        this.updateAddresses();
    }

    ngOnChanges(changes: SimpleChanges) {
        if (changes['customer']) {
            // Always update local addresses when customer changes
            this.updateAddresses();
        }
    }

    private updateAddresses(): void {
        if (this.customer?.addresses && Array.isArray(this.customer.addresses) && this.customer.addresses.length > 0) {
            // Update local addresses array
            this.localAddresses = [...this.customer.addresses];
            console.log('[DefaultAddressesList] Updated addresses:', this.localAddresses.length);
        } else {
            // Clear addresses if customer has none
            this.localAddresses = [];
            console.log('[DefaultAddressesList] No addresses found. Customer:', this.customer ? 'exists' : 'null');
        }
    }

    // TrackBy function to prevent list reordering
    trackByAddressId(index: number, address: any): any {
        return address.id || index;
    }

    // Set default billing address
    isDefaultBilling(currentValue: boolean | undefined, addressId: string) {
        if (!addressId) return;

        // Only dispatch if we're setting it as default (not unsetting)
        if (!currentValue) {
            // Immediately update local state for instant visual feedback
            this.updateLocalAddressBilling(addressId, true);

            // Then dispatch the action
            this.store.dispatch(new AuthActions.SetDefaultCustomerBillingAddress(addressId, true));
        }
    }

    // Set default shipping address
    isDefaultShipping(currentValue: boolean | undefined, addressId: string) {
        if (!addressId) return;

        // Only dispatch if we're setting it as default (not unsetting)
        if (!currentValue) {
            // Immediately update local state for instant visual feedback
            this.updateLocalAddressShipping(addressId, true);

            // Then dispatch the action
            this.store.dispatch(new AuthActions.SetDefaultCustomerShippingAddress(addressId, true));
        }
    }

    // Helper method to update local billing state
    private updateLocalAddressBilling(addressId: string, isDefault: boolean) {
        this.localAddresses = this.localAddresses.map(address => {
            if (address.id === addressId) {
                return { ...address, is_default_billing: isDefault };
            } else if (isDefault) {
                // Remove default from other addresses
                return { ...address, is_default_billing: false };
            }
            return address;
        });
    }

    // Helper method to update local shipping state
    private updateLocalAddressShipping(addressId: string, isDefault: boolean) {
        this.localAddresses = this.localAddresses.map(address => {
            if (address.id === addressId) {
                return { ...address, is_default_shipping: isDefault };
            } else if (isDefault) {
                // Remove default from other addresses
                return { ...address, is_default_shipping: false };
            }
            return address;
        });
    }
    //
    addNewAddress() {
        this.nav.navigateToAddAddress();
    }
    editAddress(address: any) {
        if (!address?.id) {
            console.error('Cannot edit address: missing address ID');
            return;
        }
        this.nav.navigateToManageAddress(address.id);
    }
    deleteAddress(addressId: string) {
        this.store.dispatch(new AuthActions.DeleteCustomerAddress(addressId));
    }
}

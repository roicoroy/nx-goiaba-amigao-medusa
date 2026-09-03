import { CommonModule } from '@angular/common';
import { AfterViewInit, Component, inject, Input } from '@angular/core';
import { IonModal, IonInput, IonButton, IonItem, IonCol } from '@ionic/angular/standalone';
import { MedusaCustomer } from 'src/app/shared/interfaces/customer-product.interface';
import { FormControl, FormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { Store } from '@ngxs/store';
import { AuthActions } from 'src/app/store/auth/auth.actions';
import { ICustomerDetails } from 'src/app/shared/interfaces';

@Component({
    selector: 'app-customer-details-form',
    templateUrl: './customer-details-form.component.html',
    standalone: true,
    imports: [
    IonInput,
    IonCol,
    IonButton,
    IonItem,
    FormsModule,
    ReactiveFormsModule,
    CommonModule
],
})
export class CustomerDetailsFormComponent implements AfterViewInit {
    @Input() customer!: MedusaCustomer | null;

    @Input() modal?: IonModal;

    customerDetailsForm!: FormGroup;

    private store = inject(Store);

    ngOnInit(): void {
        this.customerDetailsForm = new FormGroup({
            'first_name': new FormControl(null),
            'last_name': new FormControl(null),
            'phone': new FormControl(null),
            'company_name': new FormControl(null),
        });
    }

    ngAfterViewInit(): void {
        if (this.customer) {
            this.populateCustomerAddressForm(this.customer);
        }
    }

    submit() {
        console.log(this.customerDetailsForm)
        const payload: ICustomerDetails = {
            first_name: this.customerDetailsForm.value.first_name,
            last_name: this.customerDetailsForm.value.last_name,
            phone: this.customerDetailsForm.value.phone,
            company_name: this.customerDetailsForm.value.company_name,
        };
        this.store.dispatch(new AuthActions.UpdateCustomerDetails(payload));
        // this.modal.dismiss()
    }


    populateCustomerAddressForm(address: MedusaCustomer) {
        if (address != null) {
            this.customerDetailsForm.get('first_name')?.setValue(address?.first_name ? address?.first_name : null);
            this.customerDetailsForm.get('last_name')?.setValue(address?.last_name ? address?.last_name : null);
            this.customerDetailsForm.get('phone')?.setValue(address?.phone ? address?.phone : null);
            this.customerDetailsForm.get('company_name')?.setValue(address?.company_name ? address?.company_name : null);
        }
    }
}

import { Component, inject, OnDestroy, OnInit, AfterViewInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { IonHeader, IonToolbar, IonTitle, IonButtons, IonButton, IonContent, IonIcon, IonBackButton, IonSpinner } from '@ionic/angular/standalone';
import { Store } from '@ngxs/store';
import { Subject, takeUntil, filter, take } from 'rxjs';
import { ActivatedRoute, Router } from '@angular/router';
import { Location } from '@angular/common';
import { AddressFormComponent, AddressFormData } from 'src/app/components/forms';
import { NavigationService, AlertService } from 'src/app/shared';
import { MedusaAddress } from 'src/app/shared/interfaces';
import { AuthActions } from 'src/app/store/auth/auth.actions';
import { AuthState } from 'src/app/store/auth/auth.state';
import { finalize } from 'rxjs/operators';

@Component({
  selector: 'app-manage-address',
  templateUrl: './manage-address.page.html',
  styleUrls: ['./manage-address.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonButtons,
    IonButton,
    IonContent,
    IonIcon,
    IonBackButton,
    IonSpinner,
    AddressFormComponent
  ]
})
export class ManageAddressPage implements OnInit, OnDestroy {
  @ViewChild(AddressFormComponent) addressFormComponent!: AddressFormComponent;

  loading = false;
  loadingAddress = true;
  returnUrl: string | null = null;
  addressId: string | null = null;
  address: MedusaAddress | null = null;

  private store = inject(Store);
  private nav = inject(NavigationService);
  private alert = inject(AlertService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private location = inject(Location);
  private readonly ngUnsubscribe = new Subject();


  ngOnInit(): void {
    // Get addressId from route params
    this.route.queryParams.pipe(takeUntil(this.ngUnsubscribe)).subscribe(params => {
      this.addressId = params['addressId'] || null;
      this.returnUrl = params['returnUrl'] || null;
      
      if (this.addressId) {
        this.loadAddress();
      } else {
        this.alert.presentSimpleAlert('Address ID is required');
        this.navigateBack();
      }
    });
  }

  ngAfterViewInit(): void {
    // Once view is initialized, populate form if address is already loaded
    if (this.address && this.addressFormComponent) {
      this.populateForm();
    }
  }

  ngOnDestroy(): void {
    this.ngUnsubscribe.next(null);
    this.ngUnsubscribe.complete();
  }

  private loadAddress(): void {
    this.loadingAddress = true;
    
    // Get customer from state
    this.store.select(AuthState.getCustomer)
      .pipe(
        filter(customer => customer !== null && customer !== undefined),
        take(1),
        takeUntil(this.ngUnsubscribe)
      )
      .subscribe({
        next: (customer) => {
          if (customer?.addresses && this.addressId) {
            this.address = customer.addresses.find(addr => addr.id === this.addressId) || null;
            
            if (this.address) {
              // Form will be populated in ngAfterViewInit if view is ready,
              // otherwise it will be populated when view becomes ready
              if (this.addressFormComponent) {
                this.populateForm();
              }
              this.loadingAddress = false;
            } else {
              this.alert.presentSimpleAlert('Address not found');
              this.loadingAddress = false;
              this.navigateBack();
            }
          } else {
            // If customer not in state, try to load it
            this.store.dispatch(new AuthActions.GetSession())
              .pipe(takeUntil(this.ngUnsubscribe))
              .subscribe({
                next: () => {
                  // Retry loading address after session is loaded
                  this.loadAddress();
                },
                error: () => {
                  this.loadingAddress = false;
                  this.alert.presentSimpleAlert('Failed to load address');
                  this.navigateBack();
                }
              });
          }
        },
        error: (error) => {
          console.error('Error loading address:', error);
          this.loadingAddress = false;
          this.alert.presentSimpleAlert('Failed to load address');
          this.navigateBack();
        }
      });
  }

  onSubmit(): void {
    this.addressFormComponent.markAllAsTouched();

    if (this.addressFormComponent.isValid() && this.addressId) {
      this.loading = true;

      const addressData: MedusaAddress = this.addressFormComponent.getValue();

      // Subscribe to the action dispatch and wait for completion
      this.store.dispatch(new AuthActions.UpdateCustomerAddress(this.addressId, addressData))
        .pipe(
          takeUntil(this.ngUnsubscribe),
          finalize(() => {
            this.loading = false;
          })
        )
        .subscribe({
          next: () => {
            // Success - show alert and navigate
            this.showSuccessAndNavigate();
          },
          error: (error) => {
            console.error('Error updating address:', error);
            // Show error alert
            this.alert.presentSimpleAlert('Failed to update address. Please try again.');
          }
        });
    }
  }

  private async showSuccessAndNavigate(): Promise<void> {
    // Use the alert service's simple alert and then navigate
    await this.alert.presentSimpleAlert('Address Updated Successfully!');

    // Navigate after the alert is dismissed
    setTimeout(() => {
      this.navigateBack();
    }, 100);
  }

  private navigateBack(): void {
    if (this.returnUrl) {
      // Decode the returnUrl before navigating (it's encoded in query params)
      const decodedUrl = decodeURIComponent(this.returnUrl);
      this.router.navigateByUrl(decodedUrl);
    } else {
      // Use browser back navigation
      this.location.back();
    }
  }

  onCancel(): void {
    this.navigateBack();
  }

  private populateForm(): void {
    if (!this.address || !this.addressFormComponent) {
      return;
    }

    // Pre-populate form with address data
    const formData: Partial<AddressFormData> = {
      first_name: this.address.first_name || '',
      last_name: this.address.last_name || '',
      address_1: this.address.address_1 || '',
      address_2: this.address.address_2 || '',
      city: this.address.city || '',
      country_code: this.address.country_code || '',
      postal_code: this.address.postal_code || '',
      phone: this.address.phone || '',
      province: this.address.province || '',
      company: this.address.company || ''
    };

    this.addressFormComponent.writeValue(formData as AddressFormData);
  }
}


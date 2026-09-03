import { Component, inject, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { IonHeader, IonToolbar, IonTitle, IonButtons, IonButton, IonContent, IonIcon, IonBackButton } from '@ionic/angular/standalone';
import { Store } from '@ngxs/store';
import { Subject, takeUntil } from 'rxjs';
import { ActivatedRoute, Router } from '@angular/router';
import { Location } from '@angular/common';
import { AddressFormComponent } from 'src/app/components/forms';
import { NavigationService, AlertService } from 'src/app/shared';
import { MedusaAddress } from 'src/app/shared/interfaces';
import { AuthActions } from 'src/app/store/auth/auth.actions';
import { finalize } from 'rxjs/operators';

@Component({
  selector: 'app-add-address',
  templateUrl: './add-address.page.html',
  styleUrls: ['./add-address.page.scss'],
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
    AddressFormComponent
  ]
})
export class AddAddressPage implements OnInit, OnDestroy {
  @ViewChild(AddressFormComponent) addressFormComponent!: AddressFormComponent;

  loading = false;
  returnUrl: string | null = null;

  private store = inject(Store);
  private nav = inject(NavigationService);
  private alert = inject(AlertService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private location = inject(Location);
  private readonly ngUnsubscribe = new Subject();

  constructor() { }

  ngOnInit(): void {
    // Check for return URL in query parameters
    this.route.queryParams.pipe(takeUntil(this.ngUnsubscribe)).subscribe(params => {
      this.returnUrl = params['returnUrl'] || null;
    });
  }

  ngOnDestroy(): void {
    this.ngUnsubscribe.next(null);
    this.ngUnsubscribe.complete();
  }

  onSubmit(): void {
    this.addressFormComponent.markAllAsTouched();

    if (this.addressFormComponent.isValid()) {
      this.loading = true;

      const addressData: MedusaAddress = this.addressFormComponent.getValue();

      // Subscribe to the action dispatch and wait for completion
      this.store.dispatch(new AuthActions.AddACustomerAddress(addressData))
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
            console.error('Error adding address:', error);
            // Show error alert
            this.alert.presentSimpleAlert('Failed to add address. Please try again.');
          }
        });
    }
  }

  private async showSuccessAndNavigate(): Promise<void> {
    // Use the alert service's simple alert and then navigate
    await this.alert.presentSimpleAlert('Address Added Successfully!');

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
}

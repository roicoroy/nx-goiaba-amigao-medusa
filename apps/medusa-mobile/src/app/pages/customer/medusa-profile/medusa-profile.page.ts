import { Component, inject, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonContent, IonButton, IonIcon, IonSegment, IonSegmentButton, IonLabel, IonList, IonItem, IonChip, IonToggle, IonInput, IonCardContent, IonCard, IonSpinner, IonListHeader } from '@ionic/angular/standalone';
import { Observable, Subject, of } from 'rxjs';
import { Store } from '@ngxs/store';
import { takeUntil, take, catchError } from 'rxjs/operators';
import { ActivatedRoute } from '@angular/router';
import { CustomerDetailsFormComponent } from '../customer-address/customer-details-form/customer-details-form.component';
import { DefaultAddressesListComponent, DefaultAddressesViewComponent } from 'src/app/components/addresses';
import { ToastController } from '@ionic/angular';
import { AuthActions } from 'src/app/store/auth/auth.actions';
import { ImagePickerComponent } from 'src/app/components/image-picker/image-picker.component';
import { NavigationService } from 'src/app/shared/navigation/navigation.service';
import { IAppFacadeState, AppFacade } from 'src/app/store/app.facade';
import { FCMFacade } from 'src/app/store/fcm/fcm.facade';
import { GoiabaHeaderComponent } from 'src/app/components/goiaba-components/goiaba-header/goiaba-header.component';
// Using app facade instead of direct state imports

@Component({
  selector: 'app-medusa-profile',
  templateUrl: './medusa-profile.page.html',
  styleUrls: ['./medusa-profile.page.scss'],
  standalone: true,
  imports: [
    IonButton,
    IonIcon,
    IonContent,
    IonSegment,
    IonSegmentButton,
    IonLabel,
    IonList,
    IonItem,
    IonChip,
    IonToggle,
    IonInput,
    CommonModule,
    FormsModule,
    DefaultAddressesListComponent,
    DefaultAddressesViewComponent,
    CustomerDetailsFormComponent,
    ImagePickerComponent,
    IonCardContent,
    IonCard,
    IonSpinner,
    IonListHeader,
    GoiabaHeaderComponent]
})
export class MedusaProfilePage implements OnInit, OnDestroy {
  private readonly ngUnsubscribe = new Subject();

  public tabsList = [
    { id: 'nav-profile-tab', button: 'Profile' },
    { id: 'nav-information-tab', button: 'Information' },
    { id: 'nav-address-tab', button: 'Address' },
    { id: 'nav-notification-tab', button: 'Notification' },
    { id: 'nav-password-tab', button: 'Password' },
  ];

  selectedTab = 'nav-address-tab';

  private nav = inject(NavigationService);
  private route = inject(ActivatedRoute);
  viewState$: Observable<IAppFacadeState>;
  private facade = inject(AppFacade);
  private fcmFacade = inject(FCMFacade);
  private store = inject(Store);
  private toastController = inject(ToastController);

  // FCM observables
  fcmToken$ = this.fcmFacade.token$;
  fcmRegistered$ = this.fcmFacade.isRegistered$;
  fcmLoading$ = this.fcmFacade.loading$;
  fcmError$ = this.fcmFacade.error$;

  constructor() {
    // Add error handling to prevent UI lock if observable fails
    this.viewState$ = this.facade.viewState$.pipe(
      catchError((error) => {
        console.error('Error in viewState$:', error);
        // Return a default state to prevent UI lock
        return of({
          isDarkMode: false,
          isLoggedIn: false,
          token: '',
          products: [],
          defaultRegions: {} as any,
          customer: null,
          avatar: null,
          region_list: [],
          productsCategories: [],
          selectedCategory: [],
          selectedProduct: {} as any
        } as IAppFacadeState);
      })
    );
  }

  ngOnInit(): void {
    // Check for tab query parameter to set initial selected tab
    this.route.queryParams.pipe(takeUntil(this.ngUnsubscribe)).subscribe(params => {
      if (params['tab'] && this.tabsList.some(tab => tab.id === params['tab'])) {
        this.selectedTab = params['tab'];
      }
    });
  }

  ngOnDestroy(): void {
    this.ngUnsubscribe.next(null);
    this.ngUnsubscribe.complete();
  }

  onSegmentChange(event: any) {
    this.selectedTab = event.detail.value;
  }

  addNewAddress() {
    this.nav.navigateToAddAddress('/customer/profile');
  }

  openLogin() {
    // Navigate to login page or open login modal
    this.nav.navigateTo('auth');
  }


  logout() {
    this.store.dispatch(new AuthActions.AuthLogout());
  }


  // Manual refresh method
  refreshProfile() {
    // Refresh customer data (which includes avatar from metadata)
    this.viewState$.pipe(take(1)).subscribe(vs => {
      if (vs.isLoggedIn && vs.customer) {
        // Reload customer session (includes avatar from metadata)
        this.store.dispatch(new AuthActions.GetSession());
      }
    });
  }

  // Avatar methods using state management
  async onAvatarSelected(imagePath: string) {
    try {
      // Convert image to file using facade helper
      const file = await this.facade.convertImagePathToFile(imagePath, 'avatar.jpg');

      // Upload via facade (handles loading state automatically)
      this.facade.uploadAvatar(file);

      // Show success message
      await this.showToast('Avatar updated!', 'success');
    } catch (error) {
      await this.showToast('Failed to process image', 'danger');
    }
  }

  deleteAvatar() {
    try {
      // Delete via facade (handles loading state automatically)
      this.facade.deleteAvatar();

      // Show success message
      this.showToast('Avatar removed', 'success');
    } catch (error) {
      this.showToast('Failed to delete avatar', 'danger');
    }
  }



  // FCM Notification Toggle Handlers
  async onOrderUpdatesToggle(event: any) {
    const enabled = event.detail.checked;
    if (enabled) {
      // Re-register token if user enables notifications
      const token = this.fcmFacade.getTokenSnapshot();
      if (token) {
        const customer = this.store.selectSnapshot((state: any) => state.auth?.customer);
        if (customer?.id) {
          this.fcmFacade.registerToken(token, customer.id);
          await this.showToast('Order updates enabled', 'success');
        }
      } else {
        // Initialize FCM if no token
        const customer = this.store.selectSnapshot((state: any) => state.auth?.customer);
        this.fcmFacade.initialize(customer?.id);
        await this.showToast('Initializing push notifications...', 'success');
      }
    } else {
      await this.showToast('Order updates disabled', 'warning');
    }
  }

  async onPromotionsToggle(event: any) {
    const enabled = event.detail.checked;
    if (enabled) {
      await this.showToast('Promotion notifications enabled', 'success');
    } else {
      await this.showToast('Promotion notifications disabled', 'warning');
    }
  }

  async onNewArrivalsToggle(event: any) {
    const enabled = event.detail.checked;
    if (enabled) {
      await this.showToast('New arrivals notifications enabled', 'success');
    } else {
      await this.showToast('New arrivals notifications disabled', 'warning');
    }
  }

  // Helper method to show toast messages
  private async showToast(message: string, color: 'success' | 'warning' | 'danger' = 'success') {
    const toast = await this.toastController.create({
      message,
      duration: 3000,
      position: 'top',
      color,
      buttons: [
        {
          text: 'Dismiss',
          role: 'cancel'
        }
      ]
    });
    await toast.present();
  }
}

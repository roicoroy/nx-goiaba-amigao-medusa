import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { IonButton, IonButtons, IonLabel, IonPopover, IonIcon, IonItem, IonList, IonItemDivider, IonChip, IonAvatar, IonHeader, IonToolbar, IonTitle, IonContent, IonText, IonCard, IonCardHeader, IonCardTitle, IonCardContent, IonSpinner } from '@ionic/angular/standalone';
import { Observable, Subject, takeUntil } from 'rxjs';
import { AppFacade, IAppFacadeState } from 'src/app/store/app.facade';
import { Store } from '@ngxs/store';
import { MedusaService } from 'src/app/shared/api/medusa.service';
import { TranslateModule } from '@ngx-translate/core';
import { NavigationService } from 'src/app/shared/navigation/navigation.service';
import { AuthActions } from 'src/app/store/auth/auth.actions';
import { AuthState } from 'src/app/store/auth/auth.state';

@Component({
  selector: 'app-auth',
  templateUrl: './auth.page.html',
  styleUrls: ['./auth.page.scss'],
  standalone: true,
  imports: [
    IonButton,
    IonButtons,
    IonIcon,
    IonAvatar,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonCard,
    IonCardHeader,
    IonCardTitle,
    IonCardContent,
    IonSpinner,
    CommonModule,
    TranslateModule
  ]
})
export class AuthPage implements OnInit, OnDestroy {
  // Public observables for template
  public viewState$!: Observable<IAppFacadeState>;
  public isLoggedIn$: Observable<boolean>;
  public loading = false;
  public error: string | null = null;

  // Private services
  private readonly store = inject(Store);
  private readonly medusaApi = inject(MedusaService);
  private readonly facade = inject(AppFacade);
  private readonly navigationService = inject(NavigationService);
  private readonly router = inject(Router);
  private readonly ngUnsubscribe = new Subject();

  constructor() {
    this.isLoggedIn$ = this.store.select(AuthState.isLoggedIn);
  }

  ngOnInit(): void {
    this.viewState$ = this.facade.viewState$;
    // this.subscribeToAuthState();
  }

  /**
   * Subscribe to authentication state changes
   */
  private subscribeToAuthState(): void {
    this.isLoggedIn$
      .pipe(takeUntil(this.ngUnsubscribe))
      .subscribe(isLoggedIn => {
        if (isLoggedIn) {
          // User successfully logged in via Google, navigate to tabs home
          this.navigationService.navigateTo('/tabs/home');
        }
      });
  }

  /**
   * Navigate to login page
   */
  navigateToLogin(): void {
    this.navigationService.navigateTo('/login');
  }

  /**
   * Navigate to register page
   */
  navigateToRegister(): void {
    this.navigationService.navigateTo('/register');
  }

  /**
   * Handle Google login
   */
  loginWithGoogle(): void {
    this.loading = true;
    this.error = null;

    this.store.dispatch(new AuthActions.LoginWithGoogle())
      .pipe(takeUntil(this.ngUnsubscribe))
      .subscribe({
        next: (state: any) => {
          if (state.auth.location) {
            window.location.href = state.auth.location;
          } else if (state.auth.isLoggedIn) {
            this.navigationService.navigateTo('/tabs/home');
          } else if (state.auth.error) {
            this.error = state.auth.error;
            this.loading = false;
          }
        },
        error: (error) => {
          this.error = 'Google login failed. Please try again.';
          this.loading = false;
          console.error('Google login error:', error);
        }
      });
  }

  /**
   * Handles user logout
   */
  async handleLogout(): Promise<void> {
    try {
      await this.medusaApi.medusaLogout();
      this.store.dispatch(new AuthActions.AuthLogout());

      // Navigate to auth page after logout
      this.navigationService.navigateTo('/auth');
    } catch (error) {
      console.error('Error during logout:', error);
    }
  }

  /**
   * Navigate to user profile
   */
  navigateToProfile(): void {
    this.router.navigate(['/customer/profile']);
  }

  back(): void {
    this.router.navigate(['/tabs/home']);
  }

  /**
   * Navigate to user orders
   */
  navigateToOrders(): void {
    this.router.navigate(['/customer/orders']);
  }

  /**
   * Navigate to user addresses
   */
  navigateToAddresses(): void {
    this.navigationService.navigateToProfileAddressTab();
  }

  ngOnDestroy(): void {
    this.ngUnsubscribe.next(null);
    this.ngUnsubscribe.complete();
  }
}

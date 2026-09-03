import { Component, Input, OnInit, OnDestroy, inject, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { Observable } from 'rxjs';
import { Store } from '@ngxs/store';
import { IonHeader, IonToolbar, IonTitle, IonButtons, IonIcon, IonButton, MenuController } from '@ionic/angular/standalone';
import { TranslateModule } from '@ngx-translate/core';
import { GoiabaIonButtonComponent } from '../goiaba-ion-button/goiaba-ion-button.component';
import { GoiabaAvatarComponent } from '../goiaba-avatar/goiaba-avatar.component';
import { Goiaba3DLogoComponent } from '../goiaba-3d-logo/goiaba-3d-logo';
import { CartButtonComponent } from 'src/app/components/medusa-cart/cart-button/cart-button.component';
import { AuthState } from 'src/app/store/auth/auth.state';
import { AuthActions } from 'src/app/store/auth/auth.actions';
import { MedusaCustomer } from 'src/app/shared/interfaces';
import { AlertService } from 'src/app/shared/alert/alert.service';

/**
 * Goiaba Header Component
 *
 * A standardized, reusable header component that displays title and customer avatar.
 * Connects to NGXS AuthState to display real customer data.
 *
 * @example
 * ```html
 * <app-goiaba-header titleKey="contact_us"></app-goiaba-header>
 * ```
 */
@Component({
  selector: 'app-goiaba-header',
  templateUrl: './goiaba-header.component.html',
  styleUrls: ['./goiaba-header.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonButtons,
    IonButton,
    TranslateModule,
    GoiabaIonButtonComponent,
    Goiaba3DLogoComponent,
    GoiabaAvatarComponent,
    CartButtonComponent
  ],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class GoiabaHeaderComponent implements OnInit, OnDestroy {
  /**
   * Translation key for the header title
   * The component will handle translation automatically
   * If not provided, uses ng-content for custom title content
   * @example titleKey="contact_us"
   */
  @Input() titleKey?: string;

  /**
   * Whether to show menu button
   * @default false
   */
  @Input() showMenuButton = false;

  /**
   * Whether to show back button
   * @default false
   */
  @Input() showBackButton = false;

  /**
   * Whether to show customer avatar
   * @default true
   */
  @Input() showAvatar = true;

  /**
   * Whether to show cart icon
   * @default true
   */
  @Input() showCart = true;

  /**
   * Custom CSS classes for the header
   */
  @Input() customClass?: string;

  /**
   * Custom CSS classes for the toolbar
   */
  @Input() toolbarClass?: string;

  /**
   * Event emitted when back button is clicked
   */
  @Input() backButtonClick?: () => void;

  private store = inject(Store);
  private router = inject(Router);
  private alertService = inject(AlertService);
  private menuController = inject(MenuController);

  // Observables from NGXS state
  isLoggedIn$: Observable<boolean> = this.store.select(AuthState.isLoggedIn);
  customer$: Observable<MedusaCustomer | null> = this.store.select(AuthState.getCustomer);
  avatar$: Observable<string | null> = this.store.select(AuthState.getAvatar);

  ngOnInit(): void {
    // Component initialization if needed
  }

  ngOnDestroy(): void {
    // Cleanup if needed
  }


  /**
   * Toggle menu
   */
  async toggleMenu(): Promise<void> {
    const isOpen = await this.menuController.isOpen();
    console.log('[GoiabaHeader] Toggling menu:', { isCurrentlyOpen: isOpen });

    await this.menuController.toggle();

    const isOpenAfter = await this.menuController.isOpen();
    console.log('[GoiabaHeader] Menu toggled:', { isNowOpen: isOpenAfter });
  }

  /**
   * Handle back button click
   */
  onBackClick(): void {
    if (this.backButtonClick) {
      this.backButtonClick();
    } else {
      // Default behavior: go back in history
      window.history.back();
    }
  }

  /**
   * Navigate to login page
   */
  navigateToLogin(): void {
    this.router.navigate(['/login']);
  }

  /**
   * Handle avatar click - navigate to login if logged out, show logout confirmation if logged in
   */
  async onAvatarClick(): Promise<void> {
    const isLoggedIn = this.store.selectSnapshot(AuthState.isLoggedIn);
    if (isLoggedIn) {
      await this.confirmLogout();
    } else {
      this.navigateToLogin();
    }
  }

  /**
   * Show logout confirmation alert
   */
  async confirmLogout(): Promise<void> {
    await this.alertService.presentAlert({
      header: 'Confirm Logout',
      message: 'Are you sure you want to log out?',
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel'
        },
        {
          text: 'Logout',
          role: 'destructive',
          handler: () => {
            this.logout();
          }
        }
      ]
    });
  }

  /**
   * Logout user
   */
  logout(): void {
    this.store.dispatch(new AuthActions.AuthLogout());
    this.router.navigate(['/tabs/home']);
  }

}


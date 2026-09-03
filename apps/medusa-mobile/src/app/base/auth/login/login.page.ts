import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { IonInput, IonContent, IonHeader, IonToolbar, IonButtons, IonButton, IonIcon, IonItem, IonSpinner, IonTitle, IonBackButton, IonCard, IonCardHeader, IonCardTitle, IonCardContent } from '@ionic/angular/standalone';
import { Store } from '@ngxs/store';
import { Observable, Subject, takeUntil } from 'rxjs';
import { LoginPayload } from 'src/app/shared/interfaces/auth.interface';
import { IAppFacadeState, AppFacade } from 'src/app/store/app.facade';
import { AuthActions } from 'src/app/store/auth/auth.actions';
import { AuthState } from 'src/app/store/auth/auth.state';
import { NavigationService } from 'src/app/shared/navigation/navigation.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
  standalone: true,
  imports: [
    IonInput,
    IonItem,
    IonButtons,
    IonButton,
    IonIcon,
    IonContent,
    IonHeader,
    IonToolbar,
    IonSpinner,
    IonTitle,
    IonBackButton,
    IonCard,
    IonCardHeader,
    IonCardTitle,
    IonCardContent,
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    TranslateModule
  ]
})
export class LoginPage implements OnInit, OnDestroy {
  // Public properties
  public loginForm!: FormGroup;
  public loading = false;
  public error: string | null = null;
  public isLoggedIn$: Observable<boolean>;
  public viewState$: Observable<IAppFacadeState>;

  // Private services
  private readonly facade = inject(AppFacade);
  private readonly store = inject(Store);
  private readonly navigationService = inject(NavigationService);
  private readonly ngUnsubscribe = new Subject();

  constructor() {
    this.viewState$ = this.facade.viewState$;
    this.isLoggedIn$ = this.store.select(AuthState.isLoggedIn);
  }

  ngOnInit(): void {
    this.initForm();
    this.subscribeToAuthState();
  }

  /**
   * Initialize the login form
   */
  private initForm(): void {
    this.loginForm = new FormGroup({
      'email': new FormControl('test01@email.com', Validators.compose([
        Validators.required,
        Validators.pattern('^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+.[a-zA-Z0-9-.]+$')
      ])),
      'password': new FormControl('Rwbento123!', Validators.compose([
        Validators.minLength(5),
        Validators.required
      ]))
    });
  }

  /**
   * Subscribe to authentication state changes
   */
  private subscribeToAuthState(): void {
    this.isLoggedIn$
      .pipe(takeUntil(this.ngUnsubscribe))
      .subscribe(isLoggedIn => {
        if (isLoggedIn) {
          this.navigationService.navigateTo('/tabs/home');
        }
      });
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
   * Handle login form submission
   */
  async doLogin(): Promise<void> {
    if (this.loginForm.invalid) {
      this.markFormGroupTouched();
      return;
    }

    this.loading = true;
    this.error = null;

    try {
      const loginPayload: LoginPayload = {
        email: this.loginForm.value.email,
        password: this.loginForm.value.password,
      };

      this.store.dispatch(new AuthActions.Login(loginPayload))
        .pipe(takeUntil(this.ngUnsubscribe))
        .subscribe({
          next: (state: any) => {
            if (state.auth.isLoggedIn) {
              this.navigationService.navigateTo('/tabs/home');
            } else if (state.auth.error) {
              this.error = state.auth.error;
            }
            this.loading = false;
          },
          error: (error) => {
            this.error = 'Login failed. Please check your credentials and try again.';
            this.loading = false;
            console.error('Login error:', error);
          }
        });
    } catch (error) {
      this.error = 'An unexpected error occurred.';
      this.loading = false;
      console.error('Login error:', error);
    }
  }

  /**
   * Mark all form controls as touched for validation display
   */
  private markFormGroupTouched(): void {
    Object.keys(this.loginForm.controls).forEach(key => {
      const control = this.loginForm.get(key);
      control?.markAsTouched();
    });
  }

  forgotPassword(): void {
    // TODO: Implement forgot password logic
    console.log('Forgot password clicked');
  }

  navigateToRegister(): void {
    this.navigationService.navigateTo('/register');
  }

  ngOnDestroy(): void {
    this.ngUnsubscribe.next(null);
    this.ngUnsubscribe.complete();
  }
}

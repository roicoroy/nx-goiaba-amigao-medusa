import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { IonInput, IonItem, IonButton, IonSpinner, IonContent, IonHeader, IonToolbar, IonIcon, IonButtons, IonBackButton, IonTitle, IonText, IonCard, IonCardHeader, IonCardTitle, IonCardContent } from '@ionic/angular/standalone';
import { Store } from '@ngxs/store';
import { Observable, Subscription, takeUntil, Subject } from 'rxjs';
import { KeypadModule } from 'src/app/shared/native/keyboard/keypad.module';
import { PasswordValidator } from 'src/app/shared/validators/password.validator';
import { AppFacade, IAppFacadeState } from 'src/app/store/app.facade';
import { TranslateModule } from '@ngx-translate/core';
import { RegisterPayload } from 'src/app/shared/interfaces/auth.interface';
import { AuthActions } from '../../../store/auth/auth.actions';
import { AuthState } from '../../../store/auth/auth.state';
import { NavigationService } from 'src/app/shared/navigation/navigation.service';

@Component({
  selector: 'app-register',
  templateUrl: './register.page.html',
  styleUrls: ['./register.page.scss'],
  standalone: true,
  imports: [
    IonInput,
    IonItem,
    IonButton,
    IonIcon,
    IonSpinner,
    IonContent,
    IonHeader,
    IonToolbar,
    IonButtons,
    IonBackButton,
    IonTitle,
    IonCard,
    IonCardHeader,
    IonCardTitle,
    IonCardContent,
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    KeypadModule,
    TranslateModule,
  ]
})
export class RegisterPage implements OnInit, OnDestroy {
  // Public properties
  public viewState$!: Observable<IAppFacadeState>;
  public registerForm!: FormGroup;
  public loading = false;
  public error: string | null = null;
  public submitted = false;
  public isLoggedIn$: Observable<boolean>;

  // Private services
  private readonly store = inject(Store);
  private readonly facade = inject(AppFacade);
  private readonly fb = inject(FormBuilder);
  private readonly navigationService = inject(NavigationService);
  private readonly ngUnsubscribe = new Subject();

  constructor() {
    this.isLoggedIn$ = this.store.select(AuthState.isLoggedIn);
  }

  ngOnInit(): void {
    this.viewState$ = this.facade.viewState$;
    this.initForms();
    this.subscribeToAuthState();
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
   * Initialize the registration forms
   */
  private initForms(): void {
    this.registerForm = this.fb.group({
      firstName: ['fd', Validators.required],
      lastName: ['vcv', Validators.required],
      email: ['test01@email.com', Validators.compose([
        Validators.required,
        Validators.pattern('^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+.[a-zA-Z0-9-.]+$')
      ])],
      password: ['Rwbento123!', Validators.compose([
        Validators.minLength(5),
        Validators.required
      ])],
      confirmPassword: ['Rwbento123!', Validators.required]
    }, {
      validators: [PasswordValidator.areNotEqual]
    });
  }

  /**
   * Handle form submission
   */
  async register(): Promise<void> {
    if (this.registerForm.invalid) {
      this.markFormsTouched();
      return;
    }

    this.loading = true;
    this.error = null;

    try {
      const registerPayload: RegisterPayload = {
        first_name: this.registerForm.value.firstName,
        last_name: this.registerForm.value.lastName,
        email: this.registerForm.value.email,
        password: this.registerForm.value.password
      };

      this.store.dispatch(new AuthActions.Register(registerPayload, {} as any))
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
            this.error = 'Registration failed. Please try again.';
            this.loading = false;
            console.error('Registration error:', error);
          }
        });
    } catch (error) {
      this.error = 'An unexpected error occurred.';
      this.loading = false;
      console.error('Registration error:', error);
    }
  }

  /**
   * Mark all form controls as touched for validation display
   */
  private markFormsTouched(): void {
    Object.keys(this.registerForm.controls).forEach(key => {
      const control = this.registerForm.get(key);
      control?.markAsTouched();
    });
  }

  navigateToLogin(): void {
    this.navigationService.navigateTo('/login');
  }

  /**
   * Reset the forms
   */
  onReset(): void {
    this.registerForm.reset();
    this.submitted = false;
  }

  ngOnDestroy(): void {
    this.ngUnsubscribe.next(null);
    this.ngUnsubscribe.complete();
  }
}

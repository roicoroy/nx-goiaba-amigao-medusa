import { Component, inject, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, ActivatedRoute, RouterLink } from '@angular/router';
import { IonicModule, LoadingController, AlertController } from '@ionic/angular';
import { Store } from '@ngxs/store';
import { Observable, Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { Login } from '../../store/auth/auth.actions';
import { AuthState } from '../../store/auth/auth.state';

@Component({
  selector: 'app-login',
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule, ReactiveFormsModule, RouterLink]
})
export class LoginPage implements OnInit, OnDestroy {
  private store = inject(Store);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private formBuilder = inject(FormBuilder);
  private loadingController = inject(LoadingController);
  private alertController = inject(AlertController);
  private destroy$ = new Subject<void>();

  loginForm!: FormGroup;
  isLoading$: Observable<boolean>;
  error$: Observable<string | null>;
  returnUrl: string = '/dashboard';
  errorMessage: string | null = null;
  isAuthenticating: boolean = false;

  constructor() {
    this.isLoading$ = this.store.select(AuthState.isLoading);
    this.error$ = this.store.select(AuthState.getError);
  }

  ngOnInit() {
    this.loginForm = this.formBuilder.group({
      email: ['roicoroy@yahoo.com.br', [Validators.required, Validators.email]],
      password: ['Rwbento123!', [Validators.required, Validators.minLength(6)]]
    });

    // Get return URL from query parameters or default to dashboard
    this.returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/dashboard';

    // Check if user is already logged in and auto-redirect
    const isLoggedIn = this.store.selectSnapshot(AuthState.isLoggedIn);
    if (isLoggedIn) {
      this.router.navigate([this.returnUrl]);
    }

    // Subscribe to error state changes to display error messages
    this.error$.pipe(takeUntil(this.destroy$)).subscribe(error => {
      this.errorMessage = error;
    });
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  async onSubmit() {
    if (this.loginForm.valid) {
      // Clear any previous error messages
      this.errorMessage = null;
      this.isAuthenticating = true;

      const loading = await this.loadingController.create({
        message: 'Logging in...',
        spinner: 'crescent'
      });
      await loading.present();

      const { email, password } = this.loginForm.value;

      this.store.dispatch(new Login({ email, password })).subscribe({
        next: async () => {
          // Verify token is in state before navigating
          const token = this.store.selectSnapshot(AuthState.getToken);
          console.log('🚀 Login complete, token in state:', token ? `${token.substring(0, 20)}...` : 'NO TOKEN');

          await loading.dismiss();
          this.isAuthenticating = false;

          // Use setTimeout to ensure navigation happens after loading dismissal
          setTimeout(() => {
            this.router.navigate([this.returnUrl]);
          }, 50);
        },
        error: async (error) => {
          loading.dismiss();
          this.isAuthenticating = false;

          // Determine user-friendly error message
          const errorMsg = this.getErrorMessage(error);
          this.errorMessage = errorMsg;

          // Display error alert with appropriate message
          const alert = await this.alertController.create({
            header: 'Login Failed',
            message: errorMsg,
            buttons: ['OK'],
            cssClass: 'login-error-alert'
          });
          await alert.present();
        }
      });
    } else {
      // Mark all fields as touched to show validation errors
      Object.keys(this.loginForm.controls).forEach(key => {
        this.loginForm.get(key)?.markAsTouched();
      });
    }
  }

  /**
   * Get user-friendly error message based on error type
   */
  private getErrorMessage(error: any): string {
    // Check for publishable key error
    if (error?.error?.message?.includes('publishable key') ||
      error?.error?.type === 'not_allowed') {
      return 'Configuration Error: Invalid or missing publishable API key. Please check your environment configuration.';
    }

    // Check for store staff privilege error
    if (error?.message?.includes('Store staff privileges required') ||
      error?.message?.includes('Access denied')) {
      return 'Access denied: Store staff privileges required. Please contact your administrator.';
    }

    // Check for network errors (backend not running)
    if (error?.status === 0 || error?.status === undefined) {
      return 'Backend server is not running. Please start the Medusa server and try again.';
    }

    // Check for 401 Unauthorized (invalid credentials)
    if (error?.status === 401) {
      return 'Invalid email or password. Please check your credentials and try again.';
    }

    // Check for 403 Forbidden
    if (error?.status === 403) {
      return 'Access forbidden. You do not have permission to access this application.';
    }

    // Check for 400 Bad Request with specific message
    if (error?.status === 400 && error?.error?.message) {
      return error.error.message;
    }

    // Check for 500 Server Error
    if (error?.status === 500) {
      return 'Server Error: Please try again later or contact support.';
    }

    // Check for timeout errors
    if (error?.name === 'TimeoutError') {
      return 'Request timed out. Please check your network connection and try again.';
    }

    // Check if error has userMessage property (from base HTTP service)
    if (error?.userMessage) {
      return error.userMessage;
    }

    // Check if error has message property
    if (error?.message) {
      return error.message;
    }

    // Default error message
    return 'Login failed. Please try again or contact support.';
  }

  /**
   * Get validation error message for form fields
   */
  getFieldErrorMessage(fieldName: string): string {
    const field = this.loginForm.get(fieldName);
    if (field?.errors && field.touched) {
      if (field.errors['required']) {
        return `${fieldName.charAt(0).toUpperCase() + fieldName.slice(1)} is required`;
      }
      if (field.errors['email']) {
        return 'Please enter a valid email address';
      }
      if (field.errors['minlength']) {
        return `${fieldName.charAt(0).toUpperCase() + fieldName.slice(1)} must be at least ${field.errors['minlength'].requiredLength} characters`;
      }
    }
    return '';
  }
}

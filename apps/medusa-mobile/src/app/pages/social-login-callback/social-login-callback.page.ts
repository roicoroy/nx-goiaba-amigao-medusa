import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonIcon, IonContent, IonHeader, IonTitle, IonToolbar, IonSpinner, IonText } from '@ionic/angular/standalone';
import { ActivatedRoute, Router } from '@angular/router';
import { Store } from '@ngxs/store';
import { AuthActions } from 'src/app/store/auth/auth.actions';
import { AuthState } from 'src/app/store/auth/auth.state';
import { take } from 'rxjs/operators';


@Component({
  selector: 'app-social-login-callback',
  templateUrl: './social-login-callback.page.html',
  styleUrls: ['./social-login-callback.page.scss'],
  standalone: true,
  imports: [IonIcon, IonContent, IonSpinner, IonText, CommonModule, FormsModule]
})
export class SocialLoginCallbackPage implements OnInit {

  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private store = inject(Store);

  isProcessing = true;
  error: string | null = null;

  ngOnInit() {
    this.validateCallback();
  }

  /**
   * Main callback validation function following Medusa's OAuth flow
   */
  private async validateCallback() {
    try {
      // Extract query parameters
      const params = await this.getQueryParams();

      if (!params.code || !params.state) {
        throw new Error('Missing required OAuth parameters');
      }

      // Step 1: Send callback to Medusa to get token and fetch customer if exists
      const result = await this.sendCallback(params.code, params.state);
      const token = result.token;
      const customerAlreadyFetched = result.customerFetched;

      // Step 2: Decode token to check if customer exists
      const decodedToken = this.decodeJWT(token);
      const shouldCreateCustomer = !decodedToken.actor_id || decodedToken.actor_id === '';

      if (shouldCreateCustomer) {
        // Step 3: Create customer using email from token metadata
        const email = decodedToken.user_metadata?.email as string;
        if (!email) {
          throw new Error('No email found in OAuth token');
        }

        await this.createCustomer(email, decodedToken);

        // Step 4: Fetch customer data after creation (GetSession will use the token)
        await this.fetchAndSetCustomer();
      }

      // Step 5: Wait a bit to ensure state is fully propagated and token is available in interceptor
      await new Promise(resolve => setTimeout(resolve, 200));

      // Step 6: Verify customer is in state before navigation
      const customer = this.store.selectSnapshot(AuthState.getCustomer);
      if (!customer && !shouldCreateCustomer) {
        // If customer wasn't fetched, try one more time
        await this.fetchAndSetCustomer();
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      // Step 7: Redirect to tabs home
      this.isProcessing = false;
      this.router.navigate(['/tabs/home']);

    } catch (error: any) {
      console.error('OAuth callback validation failed:', error);
      this.error = error.message || 'Authentication failed. Please try again.';
      this.isProcessing = false;
      setTimeout(() => this.router.navigate(['/auth']), 3000);
    }
  }

  /**
   * Get query parameters from the URL
   */
  private async getQueryParams(): Promise<{ code: string; state: string }> {
    return new Promise((resolve) => {
      this.route.queryParams.pipe(take(1)).subscribe((params: any) => {
        resolve({
          code: params['code'] || '',
          state: params['state'] || ''
        });
      });
    });
  }

  /**
   * Send callback to Medusa to validate OAuth and get token
   */
  private async sendCallback(code: string, state: string): Promise<{ token: string; customerFetched: boolean }> {
    return new Promise((resolve, reject) => {
      this.store.dispatch(new AuthActions.ValidateGoogleCallback(code, state))
        .pipe(take(1))
        .subscribe({
          next: (result: any) => {
            const token = result?.auth?.access_token;
            const customer = result?.auth?.customer;
            if (!token) {
              reject(new Error('No token received from Medusa'));
              return;
            }
            // Check if customer was already fetched (when shouldCreateCustomer is false)
            resolve({ 
              token, 
              customerFetched: !!customer 
            });
          },
          error: (error) => {
            reject(error);
          }
        });
    });
  }

  /**
   * Decode JWT token to extract user information
   */
  private decodeJWT(token: string): any {
    try {
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split('')
          .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      );
      return JSON.parse(jsonPayload);
    } catch (error) {
      console.error('Failed to decode JWT:', error);
      throw new Error('Invalid token format');
    }
  }

  /**
   * Create a new customer in Medusa
   */
  private async createCustomer(email: string, decodedToken: any): Promise<void> {
    return new Promise((resolve, reject) => {
      const registerPayload = {
        email,
        first_name: decodedToken.user_metadata?.given_name || '',
        last_name: decodedToken.user_metadata?.family_name || '',
      };

      // Create a dummy address for Google users
      const medusaAddress = {
        first_name: registerPayload.first_name,
        last_name: registerPayload.last_name,
        address_1: '',
        city: '',
        country_code: 'us',
        postal_code: '',
        phone: '',
      };

      this.store.dispatch(new AuthActions.CreateGoogleUser(registerPayload, medusaAddress))
        .pipe(take(1))
        .subscribe({
          next: () => {
            resolve();
          },
          error: (error) => {
            console.error('Failed to create customer:', error);
            reject(error);
          }
        });
    });
  }


  /**
   * Fetch customer data and update the auth state
   */
  private async fetchAndSetCustomer(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.store.dispatch(new AuthActions.GetSession())
        .pipe(take(1))
        .subscribe({
          next: () => {
            resolve();
          },
          error: (error) => {
            console.error('Failed to fetch customer:', error);
            reject(error);
          }
        });
    });
  }

}

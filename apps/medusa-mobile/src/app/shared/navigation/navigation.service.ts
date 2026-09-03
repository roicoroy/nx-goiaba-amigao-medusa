import { Injectable, inject } from '@angular/core';
import { Router } from '@angular/router';

@Injectable({
  providedIn: 'root'
})
export class NavigationService {
  private router = inject(Router);

  navigateTo(path: string | any[], extras: any = {}) {
    return this.router.navigate(Array.isArray(path) ? path : [path], extras);
  }

  navigateByUrl(url: string, extras: any = {}) {
    return this.router.navigateByUrl(url, extras);
  }

  // Example: navigation with animation or custom logic
  navigateFlip(path: string, extras: any = {}) {
    // Add animation logic here if needed
    return this.navigateTo(path, extras);
  }

  // Example: navigation with params
  navigateWithParams(path: string, params: any) {
    return this.router.navigate([path], { queryParams: params });
  }

  // Go back
  goBack() {
    window.history.back();
  }

  // Navigate to add address page
  navigateToAddAddress(returnUrl?: string): void {
    const url = returnUrl || this.router.url;
    this.router.navigate(['/add-address'], {
      queryParams: { returnUrl: encodeURIComponent(url) }
    });
  }

  // Navigate to manage address page
  navigateToManageAddress(addressId: string, returnUrl?: string): void {
    const url = returnUrl || this.router.url;
    this.router.navigate(['/manage-address'], {
      queryParams: {
        addressId: addressId,
        returnUrl: encodeURIComponent(url)
      }
    });
  }

  // Navigate to profile page with address tab selected
  navigateToProfileAddressTab(): void {
    this.router.navigate(['/customer/profile'], {
      queryParams: { tab: 'nav-address-tab' }
    });
  }
}

import { Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonCard, IonCardHeader, IonCardTitle, IonCardContent, IonButton, IonIcon, IonText, IonBadge } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { createOutline, checkmarkCircle, locationOutline } from 'ionicons/icons';
import { MedusaAddress } from 'src/app/shared/interfaces/medusa-address.interface';

@Component({
  selector: 'app-address-summary',
  templateUrl: './address-summary.component.html',
  styleUrls: ['./address-summary.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    IonCard,
    IonCardHeader,
    IonCardTitle,
    IonCardContent,
    IonButton,
    IonIcon,
    IonText,
    IonBadge
  ]
})
export class AddressSummaryComponent {
  // Inputs using modern Angular syntax
  address = input.required<MedusaAddress>();
  addressType = input.required<'shipping' | 'billing'>();
  isSelected = input<boolean>(false);
  showSelectButton = input<boolean>(false);

  // Outputs using modern Angular syntax
  edit = output<void>();
  select = output<void>();

  constructor() {
    // Register icons
    addIcons({ createOutline, checkmarkCircle, locationOutline });
  }

  /**
   * Get the full name from the address
   */
  getFullName(): string {
    const addr = this.address();
    const firstName = addr.first_name || '';
    const lastName = addr.last_name || '';
    return `${firstName} ${lastName}`.trim() || 'No name provided';
  }

  /**
   * Get the country name from the address
   */
  getCountryName(): string {
    const addr = this.address();
    if (addr.country?.display_name) {
      return addr.country.display_name;
    }
    return addr.country_code?.toUpperCase() || '';
  }

  /**
   * Get formatted address lines
   */
  getAddressLines(): string[] {
    const addr = this.address();
    const lines: string[] = [];

    if (addr.address_1) {
      lines.push(addr.address_1);
    }

    if (addr.address_2) {
      lines.push(addr.address_2);
    }

    const cityLine = [addr.city, addr.province, addr.postal_code]
      .filter(part => part && part.trim())
      .join(', ');

    if (cityLine) {
      lines.push(cityLine);
    }

    const countryName = this.getCountryName();
    if (countryName) {
      lines.push(countryName);
    }

    return lines;
  }

  /**
   * Check if this is a default address
   */
  isDefaultAddress(): boolean {
    const addr = this.address();
    const type = this.addressType();

    if (type === 'shipping') {
      return addr.is_default_shipping || false;
    } else {
      return addr.is_default_billing || false;
    }
  }

  /**
   * Handle edit button click
   */
  onEdit(): void {
    this.edit.emit();
  }

  /**
   * Handle select button click
   */
  onSelect(): void {
    this.select.emit();
  }

  /**
   * Get the phone number formatted
   */
  getPhone(): string {
    return this.address().phone || '';
  }

  /**
   * Get the company name if available
   */
  getCompany(): string {
    return this.address().company || '';
  }
}

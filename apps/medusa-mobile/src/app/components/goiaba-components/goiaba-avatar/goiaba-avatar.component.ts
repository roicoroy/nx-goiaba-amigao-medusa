import { Component, Input, Output, EventEmitter, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonAvatar, IonIcon } from '@ionic/angular/standalone';
import { MedusaCustomer } from 'src/app/shared/interfaces';

/**
 * Goiaba Avatar Component
 * 
 * A reusable avatar component that displays user avatar or login icon
 * based on authentication state. Displays avatar image with initials fallback
 * when logged in, or login icon when logged out.
 * 
 * @example
 * ```html
 * <app-goiaba-avatar
 *   [avatarUrl]="avatar$ | async"
 *   [customer]="customer$ | async"
 *   [isLoggedIn]="isLoggedIn$ | async"
 *   (avatarClick)="onAvatarClick()">
 * </app-goiaba-avatar>
 * ```
 */
@Component({
  selector: 'app-goiaba-avatar',
  templateUrl: './goiaba-avatar.component.html',
  styleUrls: ['./goiaba-avatar.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    IonAvatar,
    IonIcon
  ],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class GoiabaAvatarComponent {
  /**
   * Avatar image URL from state
   */
  @Input() avatarUrl?: string | null;

  /**
   * Customer data for initials fallback
   */
  @Input() customer?: MedusaCustomer | null;

  /**
   * Login state
   */
  @Input() isLoggedIn?: boolean | null;

  /**
   * Avatar size CSS class
   * @default 'w-10 h-10'
   */
  @Input() size= 'w-10 h-10';

  /**
   * Event emitted when avatar is clicked
   */
  @Output() avatarClick = new EventEmitter<void>();

  /**
   * Handle avatar click
   */
  onAvatarClick(): void {
    this.avatarClick.emit();
  }

  /**
   * Get customer initials for avatar fallback
   */
  getCustomerInitials(customer: MedusaCustomer | null | undefined): string {
    if (!customer) {
      return '?';
    }

    if (customer.first_name && customer.last_name) {
      return `${customer.first_name[0]}${customer.last_name[0]}`.toUpperCase();
    }

    if (customer.first_name) {
      return customer.first_name[0].toUpperCase();
    }

    if (customer.email) {
      return customer.email[0].toUpperCase();
    }

    return '?';
  }
}

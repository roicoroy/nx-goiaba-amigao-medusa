import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { IonButton, IonIcon } from '@ionic/angular/standalone';

/**
 * Goiaba Promotional Banner Component
 *
 * A reusable full-width promotional banner component inspired by McDonald's design.
 * Features bold typography, large icons, and prominent call-to-action buttons.
 *
 * @example
 * ```html
 * <app-goiaba-promo-banner
 *   title="Daily offers"
 *   subtitle="on everything you love"
 *   iconName="gift-outline"
 *   backgroundColor="yellow-400"
 *   buttonText="Find Out More"
 *   [buttonAction]="navigateToProducts">
 * </app-goiaba-promo-banner>
 * ```
 */
@Component({
  selector: 'app-goiaba-promo-banner',
  templateUrl: './goiaba-promo-banner.component.html',
  styleUrls: ['./goiaba-promo-banner.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    IonButton,
    IonIcon
  ]
})
export class GoiabaPromoBannerComponent {
  /**
   * Main headline text
   */
  @Input() title!: string;

  /**
   * Subheading text
   */
  @Input() subtitle!: string;

  /**
   * Ionic icon name (e.g., 'gift-outline', 'star-outline')
   */
  @Input() iconName!: string;

  /**
   * Background color class (e.g., 'yellow-400', 'goiaba-primary', 'bg-goiaba-secondary')
   * Can include 'border-2' or other border classes for white backgrounds
   * @default 'yellow-400'
   */
  @Input() backgroundColor = 'yellow-400';

  /**
   * Border class (optional, for white backgrounds with borders)
   */
  @Input() borderClass?: string;

  /**
   * CTA button text
   * @default 'Find Out More'
   */
  @Input() buttonText = 'Find Out More';

  /**
   * Optional route for navigation (takes precedence over buttonAction)
   */
  @Input() buttonRoute?: string;

  /**
   * Optional click handler function
   */
  @Input() buttonAction?: () => void;

  /**
   * Text color class
   * @default 'neutral-900'
   */
  @Input() textColor = 'neutral-900';

  /**
   * Handle button click
   */
  handleButtonClick(): void {
    if (this.buttonAction) {
      this.buttonAction();
    }
  }

  /**
   * Get background color class with bg- prefix if not already present
   */
  getBackgroundColorClass(): string {
    let bgClass = this.backgroundColor;
    if (!bgClass.startsWith('bg-')) {
      bgClass = `bg-${bgClass}`;
    }
    if (this.borderClass) {
      return `${bgClass} ${this.borderClass}`;
    }
    return bgClass;
  }

  /**
   * Get text color class with text- prefix if not already present
   */
  getTextColorClass(): string {
    if (this.textColor.startsWith('text-')) {
      return this.textColor;
    }
    return `text-${this.textColor}`;
  }
}


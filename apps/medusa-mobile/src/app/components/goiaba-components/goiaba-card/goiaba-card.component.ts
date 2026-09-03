import { Component, Input, Output, EventEmitter, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonCard, IonCardHeader, IonCardTitle, IonCardSubtitle, IonCardContent } from '@ionic/angular/standalone';

export type CardVariant = 'default' | 'elevated' | 'outlined' | 'flat' | 'bordered';
export type CardPadding = 'none' | 'small' | 'default' | 'large';

/**
 * Goiaba Card Component
 * 
 * A standardized, reusable card component with Tailwind CSS styling.
 * Provides consistent card styling across the application with support
 * for variants, hover effects, and click interactions.
 * 
 * @example
 * ```html
 * <app-goiaba-card variant="elevated" (cardClick)="handleClick()">
 *   <div>Card content</div>
 * </app-goiaba-card>
 * ```
 */
@Component({
  selector: 'app-goiaba-card',
  templateUrl: './goiaba-card.component.html',
  styleUrls: ['./goiaba-card.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    IonCard,
    IonCardHeader,
    IonCardTitle,
    IonCardSubtitle,
    IonCardContent
  ],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class GoiabaCardComponent {
  /**
   * Card variant style
   * @default 'default'
   */
  @Input() variant: CardVariant = 'default';

  /**
   * Card padding size
   * @default 'default'
   */
  @Input() padding: CardPadding = 'default';

  /**
   * Enable hover effects
   * @default true
   */
  @Input() hover = true;

  /**
   * Make card clickable (adds cursor pointer)
   * @default false
   */
  @Input() clickable = false;

  /**
   * Custom CSS classes to apply to the card
   */
  @Input() customClass = '';

  /**
   * Card title (optional, renders in header if provided)
   */
  @Input() title?: string;

  /**
   * Card subtitle (optional, renders in header if provided)
   */
  @Input() subtitle?: string;

  /**
   * Show card header section
   * @default false
   */
  @Input() showHeader = false;

  /**
   * Border radius override
   */
  @Input() borderRadius = 'rounded-xl';

  /**
   * Shadow override
   */
  @Input() shadow = '';

  /**
   * Background color override
   */
  @Input() backgroundColor = 'bg-theme-surface';

  /**
   * Border color override (for outlined variant)
   */
  @Input() borderColor = 'border-neutral-200';

  /**
   * Header background color override
   */
  @Input() headerBackgroundColor = '';

  /**
   * Header text color override
   */
  @Input() headerTextColor = '';

  /**
   * Event emitted when card is clicked
   */
  @Output() cardClick = new EventEmitter<MouseEvent>();

  /**
   * Get the base card classes
   */
  getCardClasses(): string {
    const classes: string[] = [];

    // Base classes
    classes.push(this.backgroundColor);
    classes.push(this.borderRadius);
    classes.push('overflow-hidden');
    classes.push('transition-all');
    classes.push('duration-300');

    // Variant-specific classes
    switch (this.variant) {
      case 'elevated':
        classes.push(this.shadow || 'shadow-md');
        if (this.hover) {
          classes.push('hover:shadow-lg');
        }
        break;
      case 'outlined':
        classes.push('border');
        classes.push(this.borderColor);
        classes.push(this.shadow || 'shadow-sm');
        break;
      case 'flat':
        classes.push('shadow-none');
        break;
      case 'bordered':
        classes.push('border');
        classes.push(this.borderColor);
        classes.push('border-2');
        break;
      case 'default':
      default:
        classes.push(this.shadow || 'shadow-md');
        if (this.hover) {
          classes.push('hover:shadow-lg');
        }
        break;
    }

    // Hover effects
    if (this.hover && this.variant !== 'flat') {
      classes.push('transform');
      classes.push('hover:-translate-y-1');
    }

    // Clickable state
    if (this.clickable) {
      classes.push('cursor-pointer');
    }

    // Custom classes
    if (this.customClass) {
      classes.push(this.customClass);
    }

    return classes.filter(Boolean).join(' ');
  }

  /**
   * Get padding classes
   */
  getPaddingClasses(): string {
    switch (this.padding) {
      case 'none':
        return 'p-0';
      case 'small':
        return 'p-2';
      case 'large':
        return 'p-6';
      case 'default':
      default:
        return 'p-4';
    }
  }

  /**
   * Get header classes
   */
  getHeaderClasses(): string {
    const classes: string[] = [];
    classes.push(this.getPaddingClasses());
    
    if (this.headerBackgroundColor) {
      classes.push(this.headerBackgroundColor);
    }
    if (this.headerBackgroundColor) {
      classes.push('border-b');
      classes.push('border-theme-primary');
    }
    
    return classes.filter(Boolean).join(' ');
  }

  /**
   * Get header title classes
   */
  getHeaderTitleClasses(): string {
    const classes: string[] = ['font-semibold', 'text-2xl', 'text-center', 'm-0'];
    
    if (this.headerTextColor) {
      classes.push(this.headerTextColor);
    } else {
      classes.push('text-theme-primary');
    }
    
    return classes.filter(Boolean).join(' ');
  }

  /**
   * Get header subtitle classes
   */
  getHeaderSubtitleClasses(): string {
    const classes: string[] = ['text-sm', 'text-center', 'mt-2', 'm-0'];
    
    if (this.headerTextColor) {
      classes.push(this.headerTextColor);
      classes.push('opacity-90');
    } else {
      classes.push('text-theme-secondary');
    }
    
    return classes.filter(Boolean).join(' ');
  }

  /**
   * Handle card click
   */
  handleClick(event: MouseEvent): void {
    if (this.clickable) {
      this.cardClick.emit(event);
    }
  }
}


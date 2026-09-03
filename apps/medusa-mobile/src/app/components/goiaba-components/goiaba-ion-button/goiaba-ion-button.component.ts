import { Component, Input, Output, EventEmitter, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonButton, IonIcon, IonSpinner } from '@ionic/angular/standalone';

export type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'outline' | 'clear';
export type ButtonSize = 'small' | 'default' | 'large';
export type ButtonExpand = 'full' | 'block' | undefined;

/**
 * Goiaba Ion Button Component
 * 
 * A standardized, reusable button component that eliminates conflicts between
 * Ionic fill properties and Tailwind classes. Always uses fill="clear" and
 * styles exclusively with Tailwind utilities.
 * 
 * @example
 * ```html
 * <app-goiaba-ion-button variant="primary" (buttonClick)="handleClick()">
 *   Click Me
 * </app-goiaba-ion-button>
 * ```
 */
@Component({
  selector: 'app-goiaba-ion-button',
  templateUrl: './goiaba-ion-button.component.html',
  styleUrls: ['./goiaba-ion-button.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    IonButton,
    IonIcon,
    IonSpinner
  ],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class GoiabaIonButtonComponent {
  /**
   * Button variant style
   * @default 'primary'
   */
  @Input() variant: ButtonVariant = 'primary';

  /**
   * Button size
   * @default 'default'
   */
  @Input() size: ButtonSize = 'default';

  /**
   * Button expand behavior (full width or block)
   */
  @Input() expand?: ButtonExpand;

  /**
   * Whether the button is disabled
   * @default false
   */
  @Input() disabled = false;

  /**
   * Whether the button is in loading state
   * @default false
   */
  @Input() loading = false;

  /**
   * Icon name to display at the start of the button
   */
  @Input() iconStart?: string;

  /**
   * Icon name to display at the end of the button
   */
  @Input() iconEnd?: string;

  /**
   * Whether this is an icon-only button
   * @default false
   */
  @Input() iconOnly = false;

  /**
   * Additional custom classes to apply to the button
   * Useful for overriding default styles when needed
   */
  @Input() customClass?: string;

  /**
   * Border width (0, 1, 2, 4, 8)
   * Overrides variant default border
   * @example [borderWidth]="2" for border-2
   */
  @Input() borderWidth?: 0 | 1 | 2 | 4 | 8;

  /**
   * Border color (Tailwind color class)
   * Overrides variant default border color
   * @example borderColor="border-goiaba-primary" or "border-error-500"
   */
  @Input() borderColor?: string;

  /**
   * Border radius override
   * @example borderRadius="rounded-full" or "rounded-xl"
   */
  @Input() borderRadius?: string;

  /**
   * Event emitted when button is clicked
   */
  @Output() buttonClick = new EventEmitter<MouseEvent>();


  /**
   * Handle button click event
   */
  handleClick(event: MouseEvent): void {
    if (!this.disabled && !this.loading) {
      this.buttonClick.emit(event);
    }
  }
}


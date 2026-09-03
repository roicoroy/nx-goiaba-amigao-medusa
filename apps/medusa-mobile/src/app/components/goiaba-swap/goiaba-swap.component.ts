import { Component, Input, Output, EventEmitter, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonIcon } from '@ionic/angular/standalone';

/**
 * Goiaba Swap Component
 * 
 * A reusable swap component using daisyUI's swap pattern.
 * Swaps between two elements (icons, labels, etc.) based on checked state.
 * 
 * @example
 * ```html
 * <!-- Theme toggle -->
 * <app-goiaba-swap
 *   [checked]="isDarkMode$ | async"
 *   onIcon="moon"
 *   offIcon="sunny"
 *   (swapChange)="onThemeToggle($event)">
 * </app-goiaba-swap>
 * 
 * <!-- Password visibility -->
 * <app-goiaba-swap
 *   [checked]="showPassword"
 *   onIcon="eye-off-outline"
 *   offIcon="eye-outline"
 *   (swapChange)="showPassword = $event">
 * </app-goiaba-swap>
 * ```
 */
@Component({
  selector: 'app-goiaba-swap',
  templateUrl: './goiaba-swap.component.html',
  styleUrls: ['./goiaba-swap.component.scss'],
  standalone: true,
  imports: [CommonModule, IonIcon],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class GoiabaSwapComponent {
  /**
   * Whether the swap is checked (on state)
   */
  @Input() checked: boolean = false;

  /**
   * Icon name to show when checked (on state)
   */
  @Input() onIcon: string = 'checkmark';

  /**
   * Icon name to show when unchecked (off state)
   */
  @Input() offIcon: string = 'close';

  /**
   * Optional label to show when checked (on state)
   */
  @Input() onLabel?: string;

  /**
   * Optional label to show when unchecked (off state)
   */
  @Input() offLabel?: string;

  /**
   * Size of the swap component
   * Options: 'xs', 'sm', 'md', 'lg'
   */
  @Input() size: 'xs' | 'sm' | 'md' | 'lg' = 'md';

  /**
   * Whether to show only icons (no labels)
   */
  @Input() iconOnly: boolean = false;

  /**
   * Event emitted when swap state changes
   * Emits the new checked state (boolean)
   */
  @Output() swapChange = new EventEmitter<boolean>();

  /**
   * Handle checkbox change event
   */
  onCheckboxChange(event: Event): void {
    const target = event.target as HTMLInputElement;
    this.checked = target.checked;
    this.swapChange.emit(this.checked);
  }

  /**
   * Get size class for swap container
   * daisyUI doesn't have built-in size variants, so we use custom sizing
   */
  get sizeClass(): string {
    const sizeMap = {
      'xs': 'w-8 h-8',
      'sm': 'w-10 h-10',
      'md': 'w-12 h-12',
      'lg': 'w-14 h-14'
    };
    return sizeMap[this.size] || 'w-12 h-12';
  }

  /**
   * Get icon size class based on component size
   */
  get iconSizeClass(): string {
    const sizeMap = {
      'xs': 'text-base',
      'sm': 'text-lg',
      'md': 'text-xl',
      'lg': 'text-2xl'
    };
    return sizeMap[this.size] || 'text-xl';
  }
}

import { Component, Input, Output, EventEmitter, forwardRef, ChangeDetectionStrategy, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ControlValueAccessor, NG_VALUE_ACCESSOR, FormsModule, FormControl, AbstractControl } from '@angular/forms';
import { IonItem, IonLabel, IonInput, IonIcon } from '@ionic/angular/standalone';
import { Subject, takeUntil } from 'rxjs';
import { ValidationState } from 'src/app/shared/interfaces/validation.interface';
import { getValidationState, getValidationErrorMessage, shouldShowErrors } from 'src/app/shared/validators/validation-utils';

export type InputVariant = 'default' | 'outline' | 'filled';
export type InputSize = 'small' | 'default' | 'large';
export type LabelPosition = 'floating' | 'stacked' | 'fixed';

/**
 * Goiaba Ion Input Component
 *
 * A standardized, reusable input component that uses Ionic's ion-input
 * with Tailwind CSS styling and custom properties.
 *
 * @example
 * ```html
 * <app-goiaba-ion-input
 *   label="Email"
 *   type="email"
 *   placeholder="Enter your email"
 *   [(ngModel)]="email"
 *   [error]="hasError"
 *   errorMessage="Invalid email">
 * </app-goiaba-ion-input>
 * ```
 */
@Component({
  selector: 'app-goiaba-ion-input',
  templateUrl: './goiaba-ion-input.component.html',
  styleUrls: ['./goiaba-ion-input.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    IonItem,
    IonLabel,
    IonInput,
    IonIcon
  ],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => GoiabaIonInputComponent),
      multi: true
    }
  ],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class GoiabaIonInputComponent implements ControlValueAccessor, OnInit, OnDestroy {
  /**
   * Input variant style
   * @default 'default'
   */
  @Input() variant: InputVariant = 'default';

  /**
   * Input size
   * @default 'default'
   */
  @Input() size: InputSize = 'default';

  /**
   * Label text
   */
  @Input() label?: string;

  /**
   * Label position
   * @default 'floating'
   */
  @Input() labelPosition: LabelPosition = 'floating';

  /**
   * Input type (text, email, password, number, tel, url, etc.)
   * @default 'text'
   */
  @Input() type: string = 'text';

  /**
   * Placeholder text
   */
  @Input() placeholder?: string;

  /**
   * Whether the input is disabled
   * @default false
   */
  @Input() disabled: boolean = false;

  /**
   * Whether the input is readonly
   * @default false
   */
  @Input() readonly: boolean = false;

  /**
   * Whether to show clear button
   * @default false
   */
  @Input() clearInput: boolean = false;

  /**
   * Whether the input has an error state
   * @default false
   */
  @Input() error: boolean = false;

  /**
   * Error message to display
   */
  @Input() errorMessage?: string;

  /**
   * Whether the input has a success state
   * @default false
   */
  @Input() success: boolean = false;

  /**
   * Optional FormControl binding for automatic validation
   * When provided, component will read validation state from FormControl
   */
  @Input() formControl?: FormControl;

  /**
   * Whether to show validation errors
   * @default true
   */
  @Input() showErrors: boolean = true;

  /**
   * Icon name to display at the start
   */
  @Input() iconStart?: string;

  /**
   * Icon name to display at the end
   */
  @Input() iconEnd?: string;

  /**
   * Additional custom classes for the container (ion-item)
   */
  @Input() customClass?: string;

  /**
   * Additional custom classes for the input element
   */
  @Input() inputClass?: string;

  /**
   * Input value
   */
  @Input() value?: string | number;

  /**
   * Event emitted when input value changes
   */
  @Output() valueChange = new EventEmitter<string | number>();

  /**
   * Event emitted when input is focused
   */
  @Output() ionFocus = new EventEmitter<any>();

  /**
   * Event emitted when input loses focus
   */
  @Output() ionBlur = new EventEmitter<any>();

  /**
   * Event emitted when validation state changes
   * Useful for NGXS Forms integration
   */
  @Output() validationStateChange = new EventEmitter<ValidationState>();

  /**
   * Event emitted when error message changes
   */
  @Output() errorChange = new EventEmitter<string | null>();

  // ControlValueAccessor implementation
  private onChange = (value: any) => {};
  private onTouched = () => {};
  private readonly ngUnsubscribe = new Subject<void>();
  private currentValidationState: ValidationState | null = null;
  private internalControl: FormControl | null = null;

  constructor(private cdr: ChangeDetectorRef) {}

  ngOnInit(): void {
    // If formControl is provided, subscribe to its validation state
    if (this.formControl) {
      this.setupFormControlSubscription();
    }
  }

  ngOnDestroy(): void {
    this.ngUnsubscribe.next();
    this.ngUnsubscribe.complete();
  }

  /**
   * Setup subscription to FormControl validation state changes
   */
  private setupFormControlSubscription(): void {
    if (!this.formControl) {
      return;
    }

    // Subscribe to status changes (valid, invalid, pending)
    this.formControl.statusChanges
      .pipe(takeUntil(this.ngUnsubscribe))
      .subscribe(() => {
        this.updateValidationState();
      });

    // Subscribe to value changes
    this.formControl.valueChanges
      .pipe(takeUntil(this.ngUnsubscribe))
      .subscribe(() => {
        this.updateValidationState();
      });

    // Initial validation state
    this.updateValidationState();
  }

  /**
   * Update validation state from FormControl or manual error state
   */
  private updateValidationState(): void {
    let validationState: ValidationState;

    if (this.formControl) {
      // Get validation state from FormControl
      validationState = getValidationState(this.formControl, this.label);
    } else {
      // Use manual error state
      validationState = {
        isValid: !this.error,
        isInvalid: this.error,
        isDirty: false,
        isTouched: false,
        isPending: false,
        errors: this.error ? { manual: true } : null,
        errorMessage: this.error ? this.errorMessage || null : null
      };
    }

    // Only emit if state changed
    if (!this.currentValidationState ||
        JSON.stringify(this.currentValidationState) !== JSON.stringify(validationState)) {
      this.currentValidationState = validationState;
      this.validationStateChange.emit(validationState);
      this.errorChange.emit(validationState.errorMessage);
      this.cdr.markForCheck();
    }
  }

  /**
   * Get current validation state
   */
  getValidationState(): ValidationState {
    if (this.formControl) {
      return getValidationState(this.formControl, this.label);
    }

    return {
      isValid: !this.error,
      isInvalid: this.error,
      isDirty: false,
      isTouched: false,
      isPending: false,
      errors: this.error ? { manual: true } : null,
      errorMessage: this.error ? this.errorMessage || null : null
    };
  }

  /**
   * Check if errors should be displayed (computed property)
   */
  get shouldDisplayErrors(): boolean {
    if (!this.showErrors) {
      return false;
    }

    if (this.formControl) {
      return shouldShowErrors(this.formControl);
    }

    return this.error && !!this.errorMessage;
  }

  /**
   * Get error message to display (computed property)
   */
  get displayErrorMessage(): string | null {
    if (this.formControl && shouldShowErrors(this.formControl)) {
      return getValidationErrorMessage(this.formControl, this.label);
    }

    if (this.error && this.errorMessage) {
      return this.errorMessage;
    }

    return null;
  }

  /**
   * Check if input is in error state (computed property)
   */
  get isInErrorState(): boolean {
    if (this.formControl) {
      return this.formControl.invalid && (this.formControl.dirty || this.formControl.touched);
    }
    return this.error;
  }

  /**
   * Check if input is in success state (computed property)
   */
  get isInSuccessState(): boolean {
    if (this.formControl) {
      return this.formControl.valid && (this.formControl.dirty || this.formControl.touched) && !this.formControl.pending;
    }
    return this.success && !this.error;
  }

  /**
   * Get container classes (ion-item) (computed property)
   */
  get containerClasses(): string {
    const baseClasses = 'rounded-lg shadow-sm transition-all duration-200';
    const variantClasses = this.getVariantClasses();
    const sizeClasses = this.getSizeClasses();
    const stateClasses = this.getStateClasses();
    const customClasses = this.customClass || '';

    return `${baseClasses} ${variantClasses} ${sizeClasses} ${stateClasses} ${customClasses}`.trim();
  }

  /**
   * Get input element classes (computed property)
   */
  get inputClasses(): string {
    const baseClasses = 'text-neutral-900 placeholder:text-neutral-500';
    const customClasses = this.inputClass || '';

    return `${baseClasses} ${customClasses}`.trim();
  }

  /**
   * Get icon color based on state (computed property)
   */
  get iconColor(): string {
    return this.isInErrorState ? 'text-error-500' : this.isInSuccessState ? 'text-success-500' : 'text-neutral-500';
  }

  /**
   * Get variant-specific classes
   */
  private getVariantClasses(): string {
    switch (this.variant) {
      case 'outline':
        return 'bg-transparent border-2 border-neutral-300 focus-within:border-goiaba-primary focus-within:ring-2 focus-within:ring-goiaba-primary/20';

      case 'filled':
        return 'bg-neutral-100 border border-transparent focus-within:border-goiaba-primary focus-within:ring-2 focus-within:ring-goiaba-primary/20';

      case 'default':
      default:
        return 'bg-neutral-50 border border-neutral-200 focus-within:border-goiaba-primary focus-within:ring-2 focus-within:ring-goiaba-primary/20';
    }
  }

  /**
   * Get size-specific classes
   */
  private getSizeClasses(): string {
    switch (this.size) {
      case 'small':
        return 'py-2 px-3';

      case 'large':
        return 'py-4 px-5';

      case 'default':
      default:
        return 'py-3 px-4';
    }
  }

  /**
   * Get state-specific classes (error, success, disabled)
   */
  private getStateClasses(): string {
    let classes = '';

    // Use FormControl validation state if available, otherwise use manual error/success
    const hasError = this.isInErrorState;
    const hasSuccess = this.isInSuccessState;

    if (hasError) {
      classes += 'border-error-500 ring-2 ring-error-500/20 ';
    } else if (hasSuccess) {
      classes += 'border-success-500 ring-2 ring-success-500/20 ';
    }

    if (this.disabled) {
      classes += 'opacity-50 cursor-not-allowed bg-neutral-100 ';
    }

    return classes.trim();
  }

  /**
   * Handle input value change
   * Ionic's ionInput event emits a CustomEvent with detail.value
   */
  onInputChange(event: any): void {
    // Handle Ionic's CustomEvent structure
    const inputValue = event.detail?.value ?? event.target?.value ?? '';
    const newValue = this.type === 'number' ? parseFloat(inputValue) || 0 : inputValue;

    this.value = newValue;
    this.onChange(newValue);
    this.valueChange.emit(newValue);

    // Update validation state after value change
    if (this.formControl) {
      // FormControl will handle validation, but we need to trigger update
      setTimeout(() => this.updateValidationState(), 0);
    }
  }

  /**
   * Handle input focus
   * Ionic's ionFocus event emits IonInputCustomEvent<FocusEvent>
   */
  onFocus(event: any): void {
    // Extract the actual FocusEvent from the custom event if available
    const focusEvent = event.detail?.event || event;
    this.ionFocus.emit(focusEvent);
  }

  /**
   * Handle input blur
   * Ionic's ionBlur event emits IonInputCustomEvent<FocusEvent>
   */
  onBlur(event: any): void {
    this.onTouched();

    // Mark FormControl as touched if available
    if (this.formControl) {
      this.formControl.markAsTouched();
      this.updateValidationState();
    }

    // Extract the actual FocusEvent from the custom event if available
    const blurEvent = event.detail?.event || event;
    this.ionBlur.emit(blurEvent);
  }

  // ControlValueAccessor methods
  writeValue(value: any): void {
    this.value = value;
    // Update validation state when value is written
    if (this.formControl) {
      setTimeout(() => this.updateValidationState(), 0);
    }
  }

  registerOnChange(fn: any): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: any): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled = isDisabled;
    if (this.formControl) {
      if (isDisabled) {
        this.formControl.disable({ emitEvent: false });
      } else {
        this.formControl.enable({ emitEvent: false });
      }
    }
  }
}


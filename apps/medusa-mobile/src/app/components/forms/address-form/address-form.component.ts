import { Component, Input, Output, EventEmitter, OnInit, OnDestroy, inject, forwardRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { IonItem, IonLabel, IonInput, IonSelect, IonSelectOption, IonText } from '@ionic/angular/standalone';
import { Store } from '@ngxs/store';
import { Observable, Subject, takeUntil } from 'rxjs';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { NewCountryListModel } from 'src/app/shared/interfaces';
import { RegionsActions } from 'src/app/store/regions/regions.actions';
import { RegionsState } from 'src/app/store/regions/regions.state';

export interface AddressFormData {
  first_name: string;
  last_name: string;
  address_1: string;
  address_2?: string;
  city: string;
  country_code: string;
  postal_code: string;
  phone: string;
  province?: string;
  company?: string;
  email?: string;
}

@Component({
  selector: 'app-address-form',
  templateUrl: './address-form.component.html',
  styleUrls: ['./address-form.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    TranslateModule,
    IonItem,
    IonLabel,
    IonInput,
    IonSelect,
    IonSelectOption
],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => AddressFormComponent),
      multi: true
    }
  ]
})
export class AddressFormComponent implements OnInit, OnDestroy, ControlValueAccessor {
  @Input() addressType: 'billing' | 'shipping' | 'general' = 'general';
  @Input() showEmail = false;
  @Input() showCompany = false;
  @Input() required = true;
  @Input() initialData?: Partial<AddressFormData>;
  @Input() disabled = false;

  @Output() formValid = new EventEmitter<boolean>();
  @Output() formData = new EventEmitter<AddressFormData>();
  @Output() validationErrors = new EventEmitter<Map<string, string>>();

  addressForm!: FormGroup;
  regionList$: Observable<NewCountryListModel[]>;
  currentRegion$: Observable<NewCountryListModel>;

  private store = inject(Store);
  private fb = inject(FormBuilder);
  private translate = inject(TranslateService);
  private readonly ngUnsubscribe = new Subject<void>();

  // ControlValueAccessor implementation
  private onChange = (value: AddressFormData) => { /* empty */ };
  private onTouched = () => { /* empty */ };

  constructor() {
    this.regionList$ = this.store.select(RegionsState.getRegionList);
    this.currentRegion$ = this.store.select(RegionsState.getDefaultRegion);
  }

  ngOnInit(): void {
    this.initializeForm();
    this.setupFormSubscriptions();
    this.loadRegions();
  }

  ngOnDestroy(): void {
    this.ngUnsubscribe.next();
    this.ngUnsubscribe.complete();
  }

  private initializeForm(): void {
    const validators = this.required ? [Validators.required] : [];
    const nameValidators = this.required ? [Validators.required, Validators.minLength(2)] : [Validators.minLength(2)];
    const emailValidators = this.required ? [Validators.required, Validators.email] : [Validators.email];
    const phoneValidators = this.required
      ? [Validators.required, Validators.pattern(/^[\d\s\-\+\(\)]+$/)]
      : [Validators.pattern(/^[\d\s\-\+\(\)]+$/)];
    const postalCodeValidators = this.required
      ? [Validators.required, Validators.pattern(/^[A-Za-z0-9\s\-]{3,10}$/)]
      : [Validators.pattern(/^[A-Za-z0-9\s\-]{3,10}$/)];

    this.addressForm = this.fb.group({
      first_name: ['', nameValidators],
      last_name: ['', nameValidators],
      address_1: ['', validators],
      address_2: [''],
      city: ['', validators],
      country_code: ['', validators],
      postal_code: ['', postalCodeValidators],
      phone: ['', phoneValidators],
      province: [''],
      company: [''],
      email: ['', this.showEmail ? emailValidators : []]
    });

    // Set initial data if provided
    if (this.initialData) {
      this.addressForm.patchValue(this.initialData);
    }

    // Set disabled state
    if (this.disabled) {
      this.addressForm.disable();
    }
  }

  private setupFormSubscriptions(): void {
    // Subscribe to form value changes
    this.addressForm.valueChanges
      .pipe(takeUntil(this.ngUnsubscribe))
      .subscribe(value => {
        this.formData.emit(value);
        this.onChange(value);
      });

    // Subscribe to form validity changes
    this.addressForm.statusChanges
      .pipe(takeUntil(this.ngUnsubscribe))
      .subscribe(status => {
        const isValid = status === 'VALID';
        this.formValid.emit(isValid);

        // Emit validation errors if form is invalid
        if (!isValid) {
          this.emitValidationErrors();
        }
      });

    // Subscribe to current region changes
    this.currentRegion$
      .pipe(takeUntil(this.ngUnsubscribe))
      .subscribe(region => {
        if (region?.country && !this.addressForm.get('country_code')?.value) {
          this.addressForm.patchValue({ country_code: region.country });
        }
      });
  }

  private loadRegions(): void {
    // Load regions if not already loaded
    const regionList = this.store.selectSnapshot(RegionsState.getRegionList) as NewCountryListModel[];
    if (!regionList || regionList.length === 0) {
      this.store.dispatch(new RegionsActions.GetCountries());
    }
  }

  onCountryChange(event: any): void {
    const selectedCountry = event.detail.value;
    if (selectedCountry) {
      this.store.dispatch(new RegionsActions.SetSelectedCountry(selectedCountry));
    }
  }

  // ControlValueAccessor methods
  writeValue(value: AddressFormData | null): void {
    if (value) {
      this.addressForm.patchValue(value);
    }
  }

  registerOnChange(fn: (value: AddressFormData) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    if (isDisabled) {
      this.addressForm.disable();
    } else {
      this.addressForm.enable();
    }
  }

  // Validation helpers
  isFieldInvalid(fieldName: string): boolean {
    const field = this.addressForm.get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched));
  }

  getFieldError(fieldName: string): string {
    const field = this.addressForm.get(fieldName);
    if (field?.errors) {
      if (field.errors['required']) {
        const fieldLabel = this.getFieldLabel(fieldName);
        return this.translate.instant('errors.field_required', { field: fieldLabel });
      }
      if (field.errors['email']) {
        return this.translate.instant('errors.email_invalid');
      }
      if (field.errors['minlength']) {
        const fieldLabel = this.getFieldLabel(fieldName);
        const minLength = field.errors['minlength'].requiredLength;
        return this.translate.instant('errors.min_length', { field: fieldLabel, min: minLength });
      }
      if (field.errors['pattern']) {
        if (fieldName === 'phone') {
          return this.translate.instant('errors.phone_invalid');
        }
        if (fieldName === 'postal_code') {
          return this.translate.instant('errors.postal_code_invalid');
        }
        const fieldLabel = this.getFieldLabel(fieldName);
        return this.translate.instant('errors.format_invalid', { field: fieldLabel });
      }
    }
    return '';
  }

  private getFieldLabel(fieldName: string): string {
    const translationKeys: { [key: string]: string } = {
      first_name: 'address.first_name',
      last_name: 'address.last_name',
      address_1: 'address.address_line_1',
      address_2: 'address.address_line_2',
      city: 'address.city',
      country_code: 'address.country',
      postal_code: 'address.postal_code',
      phone: 'phone',
      company: 'address.company',
      email: 'delivery.email'
    };
    const key = translationKeys[fieldName] || fieldName;
    return this.translate.instant(key);
  }

  // Public methods for parent components
  markAllAsTouched(): void {
    this.addressForm.markAllAsTouched();
    this.onTouched();
  }

  reset(): void {
    this.addressForm.reset();
    if (this.initialData) {
      this.addressForm.patchValue(this.initialData);
    }
  }

  isValid(): boolean {
    return this.addressForm.valid;
  }

  getValue(): AddressFormData {
    return this.addressForm.value;
  }

  getFormattedAddress(): string {
    const value = this.getValue();
    const parts = [
      `${value.first_name} ${value.last_name}`.trim(),
      value.address_1,
      value.address_2,
      `${value.city}, ${value.postal_code}`.trim(),
      value.country_code?.toUpperCase()
    ].filter(part => part && part.trim());

    return parts.join('\n');
  }

  /**
   * Emit validation errors for all invalid fields
   */
  private emitValidationErrors(): void {
    const errors = new Map<string, string>();

    Object.keys(this.addressForm.controls).forEach(fieldName => {
      if (this.isFieldInvalid(fieldName)) {
        const errorMessage = this.getFieldError(fieldName);
        if (errorMessage) {
          errors.set(fieldName, errorMessage);
        }
      }
    });

    this.validationErrors.emit(errors);
  }

  /**
   * Get all validation errors as a map
   */
  getValidationErrors(): Map<string, string> {
    const errors = new Map<string, string>();

    Object.keys(this.addressForm.controls).forEach(fieldName => {
      const field = this.addressForm.get(fieldName);
      if (field && field.invalid && (field.dirty || field.touched)) {
        const errorMessage = this.getFieldError(fieldName);
        if (errorMessage) {
          errors.set(fieldName, errorMessage);
        }
      }
    });

    return errors;
  }
}

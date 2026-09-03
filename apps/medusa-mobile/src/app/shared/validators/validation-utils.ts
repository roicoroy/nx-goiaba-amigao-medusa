import { AbstractControl, ValidationErrors } from '@angular/forms';
import { ValidationState } from '../interfaces/validation.interface';

/**
 * Validation Utilities
 * 
 * Helper functions for extracting and formatting validation errors
 * from Angular form controls.
 */

/**
 * Get the first validation error key from a control
 */
export function getFirstError(control: AbstractControl | null): string | null {
  if (!control || !control.errors) {
    return null;
  }

  const errorKeys = Object.keys(control.errors);
  return errorKeys.length > 0 ? errorKeys[0] : null;
}

/**
 * Format an error message based on error key and value
 */
export function formatErrorMessage(
  errorKey: string,
  errorValue: any,
  fieldName?: string
): string {
  const displayName = fieldName || 'This field';

  switch (errorKey) {
    case 'required':
      return `${displayName} is required`;

    case 'email':
      return 'Please enter a valid email address';

    case 'pattern':
      return `${displayName} format is invalid`;

    case 'minlength':
      const minLength = errorValue?.requiredLength || errorValue?.min || 0;
      return `${displayName} must be at least ${minLength} character${minLength !== 1 ? 's' : ''}`;

    case 'maxlength':
      const maxLength = errorValue?.requiredLength || errorValue?.max || 0;
      return `${displayName} must not exceed ${maxLength} character${maxLength !== 1 ? 's' : ''}`;

    case 'min':
      const min = errorValue?.min || errorValue || 0;
      return `${displayName} must be at least ${min}`;

    case 'max':
      const max = errorValue?.max || errorValue || 0;
      return `${displayName} must not exceed ${max}`;

    case 'areNotEqual':
      return 'Passwords do not match';

    case 'usernameNotAvailable':
      return 'This username is not available';

    case 'invalidCountryPhone':
      return 'Please enter a valid phone number for the selected country';

    default:
      // For custom validators, try to extract a message from the error value
      if (typeof errorValue === 'string') {
        return errorValue;
      }
      if (errorValue?.message) {
        return errorValue.message;
      }
      return `${displayName} is invalid`;
  }
}

/**
 * Get validation error message from a control
 */
export function getValidationErrorMessage(
  control: AbstractControl | null,
  fieldName?: string
): string | null {
  if (!control || !control.errors) {
    return null;
  }

  const errorKey = getFirstError(control);
  if (!errorKey) {
    return null;
  }

  const errorValue = control.errors[errorKey];
  return formatErrorMessage(errorKey, errorValue, fieldName);
}

/**
 * Extract validation state from an AbstractControl
 */
export function getValidationState(
  control: AbstractControl | null,
  fieldName?: string
): ValidationState {
  if (!control) {
    return {
      isValid: true,
      isInvalid: false,
      isDirty: false,
      isTouched: false,
      isPending: false,
      errors: null,
      errorMessage: null
    };
  }

  const isValid = control.valid;
  const isInvalid = control.invalid;
  const isDirty = control.dirty;
  const isTouched = control.touched;
  const isPending = control.pending || false;
  const errors = control.errors;
  const errorMessage = isInvalid && (isDirty || isTouched)
    ? getValidationErrorMessage(control, fieldName)
    : null;

  return {
    isValid,
    isInvalid,
    isDirty,
    isTouched,
    isPending,
    errors,
    errorMessage
  };
}

/**
 * Check if a control should show validation errors
 * (only show if invalid and (dirty or touched))
 */
export function shouldShowErrors(control: AbstractControl | null): boolean {
  if (!control) {
    return false;
  }

  return control.invalid && (control.dirty || control.touched);
}


import { FormControl, FormGroup } from '@angular/forms';

export class PasswordValidator {

  // If our validation fails, we return an object with a key for the error name and a value of true.
  // Otherwise, if the validation passes, we simply return null because there is no error.

  static areNotEqual(formGroup: FormGroup) {
    const password = formGroup.get('password');
    const confirmPassword = formGroup.get('confirmPassword');

    if (!password || !confirmPassword) {
      return null; // Don't validate if controls don't exist
    }

    // If passwords don't match, return error
    if (password.value !== confirmPassword.value) {
      return {
        areNotEqual: true
      };
    }

    // Passwords match, validation passes
    return null;
  }
}

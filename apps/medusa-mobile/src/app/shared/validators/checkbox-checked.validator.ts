import { ValidatorFn, FormArray, AbstractControl, ValidationErrors } from '@angular/forms';

export class CheckboxCheckedValidator {

  static minSelectedCheckboxes(min: number): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      if (!(control instanceof FormArray)) {
        return null;
      }

      const totalSelected = control.controls
        // get a list of checkbox values (boolean)
        .map(ctrl => ctrl.value)
        // total up the number of checked checkboxes
        .reduce((prev, next) => next ? prev + next : prev, 0);

      // if the total is not greater than the minimum, return the error message
      return totalSelected >= min ? null : { required: true };
    };
  }
}

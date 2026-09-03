import { State, Action, StateContext } from '@ngxs/store';
import { Injectable } from '@angular/core';

export interface FormModel {
  customerAddressForm: {
    model: {
    };
    dirty: boolean;
    status: string;
    errors: any;
  };
  cusAddressForm: {
    model: {
    };
    dirty: boolean;
    status: string;
    errors: any;
  };
  form: {
    model: {
    };
    dirty: boolean;
    status: string;
    errors: any;
  };
}
@State<FormModel>({
  name: 'form',
  defaults: {
    customerAddressForm: {
      model: {
      },
      dirty: false,
      status: '',
      errors: {}
    },
    form: {
      model: {
      },
      dirty: false,
      status: '',
      errors: {}
    },
    cusAddressForm: {
      model: {
      },
      dirty: false,
      status: '',
      errors: {}
    },
  }
})
@Injectable()
export class FormState {}
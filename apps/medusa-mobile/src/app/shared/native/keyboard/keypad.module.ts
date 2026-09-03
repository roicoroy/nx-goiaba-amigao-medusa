import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { KeyPadDirective } from './keypad.directive';

@NgModule({
  imports: [
    CommonModule,
    KeyPadDirective
  ],
  declarations: [
  ],
  exports:[
    KeyPadDirective,
  ]
})
export class KeypadModule { }

import { Component, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonCard, IonCardHeader, IonCardTitle, IonCardContent, IonIcon } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { checkmarkCircle, alertCircle } from 'ionicons/icons';

@Component({
  selector: 'app-checkout-section',
  templateUrl: './checkout-section.component.html',
  styleUrls: ['./checkout-section.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    IonCard,
    IonCardHeader,
    IonCardTitle,
    IonCardContent,
    IonIcon
  ]
})
export class CheckoutSectionComponent {
  // Inputs using modern Angular syntax
  title = input.required<string>();
  icon = input.required<string>();
  isCompleted = input<boolean>(false);
  hasError = input<boolean>(false);

  constructor() {
    // Register status icons
    addIcons({ checkmarkCircle, alertCircle });
  }
}

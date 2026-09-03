import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { IonItem, IonLabel, IonText, IonButton, IonIcon } from '@ionic/angular/standalone';
import { MedusaAddress } from 'src/app/shared/interfaces/medusa-address.interface';

@Component({
  selector: 'app-address-view',
  templateUrl: './address-view.component.html',
  styleUrls: ['./address-view.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    IonItem,
    IonLabel,
    IonText,
    IonButton,
    IonIcon
  ]
})
export class AddressViewComponent {
  @Input() address!: MedusaAddress;
  @Input() showActions: boolean = true;
  @Input() isDefaultBilling: boolean = false;
  @Input() isDefaultShipping: boolean = false;

  onEdit() {
    // Edit functionality handled by parent component
  }

  onDelete() {
    // Delete functionality handled by parent component
  }
}

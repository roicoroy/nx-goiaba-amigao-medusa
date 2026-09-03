import { Component, inject, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonButtons,
  IonButton,
  IonContent,
  IonList,
  IonIcon,
  ModalController
} from '@ionic/angular/standalone';
import { MedusaAddress } from 'src/app/shared/interfaces/medusa-address.interface';
import { AddressViewComponent } from 'src/app/components/addresses/address-view/address-view.component';

@Component({
  selector: 'app-address-selection-modal',
  templateUrl: './address-selection-modal.component.html',
  styleUrls: ['./address-selection-modal.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonButtons,
    IonButton,
    IonContent,
    IonList,
    IonIcon,
    AddressViewComponent
  ]
})
export class AddressSelectionModalComponent {
  @Input() addresses: MedusaAddress[] = [];
  @Input() selectedAddressId: string | null = null;
  @Input() addressType: 'shipping' | 'billing' = 'shipping';

  private modalCtrl = inject(ModalController);

  /**
   * Select an address and close the modal
   */
  selectAddress(address: MedusaAddress): void {
    this.modalCtrl.dismiss(address, 'selected');
  }

  /**
   * Navigate to add new address
   */
  addNewAddress(): void {
    this.modalCtrl.dismiss(null, 'add-new');
  }

  /**
   * Close modal without selection
   */
  cancel(): void {
    this.modalCtrl.dismiss(null, 'cancel');
  }

  /**
   * Check if address is selected
   */
  isSelected(address: MedusaAddress): boolean {
    return address.id === this.selectedAddressId;
  }
}

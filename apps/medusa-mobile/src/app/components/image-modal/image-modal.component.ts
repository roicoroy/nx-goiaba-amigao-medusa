import { Component, Input, inject } from '@angular/core';
import { ModalController, IonHeader, IonToolbar, IonButtons, IonButton, IonIcon, IonContent } from '@ionic/angular/standalone';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-image-modal',
  templateUrl: './image-modal.component.html',
  styleUrls: ['./image-modal.component.scss'],
  standalone: true,
  imports: [CommonModule, IonToolbar, IonButtons, IonButton, IonIcon, IonContent]
})
export class ImageModalComponent {
  @Input() imageUrl!: string;

  private modalController = inject(ModalController);

  constructor() { }

  closeModal() {
    this.modalController.dismiss();
  }

}

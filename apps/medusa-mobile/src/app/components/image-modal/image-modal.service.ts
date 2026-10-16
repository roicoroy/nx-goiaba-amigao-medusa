import { Injectable, inject } from '@angular/core';
import { ModalController } from '@ionic/angular/standalone';
import { ImageModalComponent } from 'src/app/components/image-modal/image-modal.component';

@Injectable({
  providedIn: 'root'
})
export class ImageModalService {

  private modalController = inject(ModalController);

  constructor() { }

  async openImageModal(imageUrl: string) {
    const modal = await this.modalController.create({
      component: ImageModalComponent,
      componentProps: {
        imageUrl: imageUrl
      },
      cssClass: 'image-lightbox-modal',
      backdropDismiss: true,
      showBackdrop: true,
      animated: true,
      mode: 'ios' // Use iOS style for smoother animations
    });
    return await modal.present();
  }
}

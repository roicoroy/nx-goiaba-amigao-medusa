import { Injectable, inject } from '@angular/core';
import { Router } from '@angular/router';
import { AlertController } from '@ionic/angular/standalone';

@Injectable({
  providedIn: 'root'
})
export class AlertService {

  private alertController = inject(AlertController);

  private router = inject(Router);

  async presentSimpleAlert(
    message: string,
  ) {
    const alertButtons = [
      {
        text: 'OK',
        role: 'confirm',
        htmlAttributes: {
          'aria-label': 'confirm',
        },
      },
    ];
    const alert = await this.alertController.create({
      message,
      buttons: alertButtons,
    });

    await alert.present();
  }

  async presentSimpleAlertNavigate(
    message: string,
    navigateTo: string,
  ) {
    const alertButtons = [
      {
        text: 'OK',
        role: 'confirm',
        htmlAttributes: {
          'aria-label': 'confirm',
        },
        handler: () => {
          this.router.navigateByUrl(navigateTo);
        },
      },
    ];
    const alert = await this.alertController.create({
      message,
      buttons: alertButtons,
    });

    await alert.present();
  }

  async presentAlert(options: {
    header?: string;
    message: string;
    buttons: Array<{
      text: string;
      role?: string;
      handler?: () => void;
    }>;
  }) {
    const alert = await this.alertController.create({
      header: options.header,
      message: options.message,
      buttons: options.buttons.map(button => ({
        text: button.text,
        role: button.role,
        handler: button.handler
      }))
    });

    await alert.present();
  }

}

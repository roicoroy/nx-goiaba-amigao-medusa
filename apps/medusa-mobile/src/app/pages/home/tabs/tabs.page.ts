import { Component, EnvironmentInjector, inject } from '@angular/core';
import { IonTabs, IonTabBar, IonTabButton, IonIcon, IonLabel } from '@ionic/angular/standalone';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-tabs',
  templateUrl: 'tabs.page.html',
  styleUrls: ['tabs.page.scss'],
  imports: [IonTabs, IonTabBar, IonTabButton, IonIcon, IonLabel, CommonModule],
})
export class NewUITabsPage {
  public environmentInjector = inject(EnvironmentInjector);

  constructor() {
    // Cart functionality will be implemented when MedusaCartState is available
  }

  getItemCount(): number {
    // Temporarily return 0 until cart state is implemented
    return 0;
  }
}


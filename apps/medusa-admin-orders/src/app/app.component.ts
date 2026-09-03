
import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { IonApp, IonSplitPane, IonMenu, IonContent, IonList, IonListHeader, IonNote, IonMenuToggle, IonItem, IonIcon, IonLabel, IonRouterOutlet, IonRouterLink } from '@ionic/angular/standalone';
import { Store } from '@ngxs/store';
import { Observable } from 'rxjs';
import { filter } from 'rxjs/operators';
import { IconsService } from './shared/icons/icons.service';
import { LanguageService } from './shared/language/language.service';
import { AuthState } from './store/auth/auth.state';
import { CheckAuthStatus } from './store/auth/auth.actions';
import { NotificationIconComponent } from './components/notification-icon/notification-icon.component';


@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  styleUrls: ['app.component.scss'],
  imports: [CommonModule, RouterLink, RouterLinkActive, IonApp, IonSplitPane, IonMenu, IonContent, IonList, IonListHeader, IonNote, IonMenuToggle, IonItem, IonIcon, IonLabel, IonRouterLink, IonRouterOutlet, NotificationIconComponent],
})
export class AppComponent implements OnInit {
  public appPages = [
    { title: 'Dashboard', url: '/dashboard', icon: 'speedometer' },
    { title: 'Orders', url: '/orders', icon: 'receipt' },
    // { title: 'Drivers', url: '/drivers', icon: 'home' },
    // { title: 'SSE Test', url: '/sse-test', icon: 'radio' },
  ];

  private icons = inject(IconsService);
  private language = inject(LanguageService);
  private store = inject(Store);

  isLoggedIn$: Observable<boolean>;

  constructor() {
    this.isLoggedIn$ = this.store.select(AuthState.isLoggedIn);
  }

  async ngOnInit(): Promise<void> {
    await this.initializeApp();
  }

  async initializeApp() {
    try {
      this.icons.initIcons();
      this.language.initTranslate();

      // Check if user is already authenticated
      this.store.dispatch(new CheckAuthStatus());
    } catch (err) {
      console.log('This is normal in a browser', err);
    }
  }

  private async requestNotificationPermission(): Promise<void> {
    if ('Notification' in window && Notification.permission === 'default') {
      try {
        const permission = await Notification.requestPermission();
        console.log(`🔔 Notification permission: ${permission}`);
      } catch (error) {
        console.log('🔔 Notification permission request failed:', error);
      }
    }
  }
}

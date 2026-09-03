import { Component, ViewChild, signal, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute, NavigationEnd, RouterLink } from '@angular/router';
import { filter, map } from 'rxjs/operators';
import { Subscription, Observable } from 'rxjs';
import { IonApp, IonRouterOutlet, IonMenu, IonMenuToggle, IonHeader, IonToolbar, IonTitle, IonContent, IonIcon } from '@ionic/angular/standalone';
import { Store } from '@ngxs/store';
import { LanguageService } from './shared';
import { IconsService } from './shared/icons/icons.service';
import { MedusaStartService } from './shared/start/medusa-start.service';
import { ThemeService } from './shared/theme/theme.service';
import { AuthState } from './store/auth/auth.state';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  styleUrls: ['app.component.scss'],
  imports: [
    CommonModule,
    RouterLink,
    IonApp,
    IonRouterOutlet,
    IonMenu,
    IonMenuToggle,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonIcon
  ],
})
export class AppComponent implements OnInit {
  @ViewChild(IonRouterOutlet, { static: true }) routerOutlet!: IonRouterOutlet;

  private icons = inject(IconsService);
  private startService = inject(MedusaStartService);
  private language = inject(LanguageService);
  private themeService = inject(ThemeService);
  private store = inject(Store);

  // Observable for conditional menu rendering
  isLoggedIn$: Observable<boolean> = this.store.select(AuthState.isLoggedIn);

  async ngOnInit(): Promise<void> {
    this.startService.medusaInit();
    await this.initializeApp();
  }

  async initializeApp() {
    try {
      this.icons.initIcons();
      this.language.initTranslate();
      // ThemeService initializes automatically in constructor
      // No need to call themeInit() anymore
    } catch (err) {
      console.log('This is normal in a browser', err);
    }
  }
}

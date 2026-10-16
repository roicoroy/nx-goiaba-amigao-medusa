import { bootstrapApplication } from '@angular/platform-browser';
import { RouteReuseStrategy, provideRouter, withPreloading, PreloadAllModules } from '@angular/router';
import { IonicRouteStrategy, provideIonicAngular } from '@ionic/angular/standalone';
import { LocationStrategy, PathLocationStrategy, IMAGE_CONFIG } from '@angular/common';
import { routes } from './app/app.routes';
import { AppComponent } from './app/app.component';
import { provideHttpClient, withInterceptorsFromDi, HTTP_INTERCEPTORS } from '@angular/common/http';
import { importProvidersFrom } from '@angular/core';
import { NgxStripeModule } from 'ngx-stripe';
import { SharedModule } from './app/shared';
import { provideStore } from '@ngxs/store';
import { withNgxsLoggerPlugin } from '@ngxs/logger-plugin';
import { withNgxsStoragePlugin } from '@ngxs/storage-plugin';
import { withNgxsFormPlugin } from '@ngxs/form-plugin';
import { withNgxsRouterPlugin } from '@ngxs/router-plugin';
import { STATES_MODULES, OPTIONS_CONFIG, STORAGE_MODULES, LOGGER_CONFIG } from './app/store/store.config';

import { provideAnimations } from '@angular/platform-browser/animations';
import { provideTranslateService } from '@ngx-translate/core';
import { provideTranslateHttpLoader } from '@ngx-translate/http-loader';
import { ErrorInterceptor } from './app/shared/errors/errors.interceptor';
import { MedusaInterceptor } from './app/shared/interceptor/medusa.interceptor';
import { AuthInterceptor } from './app/shared/interceptor/auth.interceptor';
import { register } from 'swiper/element/bundle';
import { environment } from './environments/environment';
import { IconsService } from './app/shared/icons/icons.service';
// import { defineCustomElements } from '@ionic/pwa-elements/loader';
import { ThemeService } from './app/shared/theme/theme.service';

register();

// Temporarily disabled - was causing NGXS injection context issues
// defineCustomElements(window);

bootstrapApplication(AppComponent, {
  providers: [
    // Provide LocationStrategy explicitly to ensure standalone injection context is available for Ionic and Angular location helpers
    { provide: LocationStrategy, useClass: PathLocationStrategy },
    { provide: RouteReuseStrategy, useClass: IonicRouteStrategy },
    provideRouter(routes, withPreloading(PreloadAllModules)),
    provideIonicAngular({
      mode: "md",
      _forceStatusbarPadding: true,
      swipeBackEnabled: true,
    }),
    // NGXS Store - using functional API for Angular 21 standalone compatibility
    // Temporarily disabling devtools to test if it's causing injection issues
    provideStore(
      STATES_MODULES,
      OPTIONS_CONFIG,
      // withNgxsReduxDevtoolsPlugin(DEVTOOLS_REDUX_CONFIG),
      withNgxsLoggerPlugin(LOGGER_CONFIG),
      withNgxsStoragePlugin({
        keys: STORAGE_MODULES,
      }),
      withNgxsFormPlugin(),
      withNgxsRouterPlugin()
    ),
    {
      // https://angular.io/guide/image-directive
      provide: IMAGE_CONFIG,
      useValue: {
        disableImageSizeWarning: true,
        disableImageLazyLoadWarning: true
      }
    },
    { provide: HTTP_INTERCEPTORS, useClass: MedusaInterceptor, multi: true },
    { provide: HTTP_INTERCEPTORS, useClass: ErrorInterceptor, multi: true },
    { provide: HTTP_INTERCEPTORS, useClass: AuthInterceptor, multi: true },
    provideAnimations(),
    provideHttpClient(
      withInterceptorsFromDi(),
    ),
    importProvidersFrom(
      SharedModule,
      NgxStripeModule.forRoot(environment.STRIPE_PUBLISHABLE_KEY),
    ),
    ...provideTranslateHttpLoader({
      prefix: './assets/i18n/',
      suffix: '.json',
    }),
    provideTranslateService({
      fallbackLang: 'en',
    })
  ],
});

import { Component, CUSTOM_ELEMENTS_SCHEMA, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import {
  IonContent,
  IonIcon} from '@ionic/angular/standalone';
import { Observable, Subject } from 'rxjs';
import { Store } from '@ngxs/store';
import { MedusaCategory } from 'src/app/shared/interfaces';
import { NavigationService } from 'src/app/shared';
import { AppFacade } from 'src/app/store/app.facade';
import { CategoriesActions } from 'src/app/store/categories/categories.actions';
import { GoiabaHeaderComponent, GoiabaFooterComponent, GoiabaPromoBannerComponent } from 'src/app/components/goiaba-components';
import { GoiabaHeroComponent } from './goiaba-hero/goiaba-hero.component';

@Component({
  selector: 'app-home',
  templateUrl: './home.page.html',
  styleUrls: ['./home.page.scss'],
  standalone: true,
  imports: [
    IonContent,
    CommonModule,
    IonIcon,
    FormsModule,
    GoiabaHeaderComponent,
    GoiabaFooterComponent,
    GoiabaPromoBannerComponent,
    GoiabaHeroComponent,
    TranslateModule
  ],
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class HomePage implements OnDestroy {
  viewState$: Observable<any>;

  private readonly ngUnsubscribe = new Subject();
  private store = inject(Store);
  private facade = inject(AppFacade);
  private router = inject(Router);
  private readonly navigationService = inject(NavigationService);

  constructor() {
    this.viewState$ = this.facade.viewState$;
  }

  scrollToContact(): void {
    const contactElement = document.getElementById('contact');
    if (contactElement) {
      contactElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

  ngOnDestroy(): void {
    this.ngUnsubscribe.next(null);
    this.ngUnsubscribe.complete();
  }

  navigateToProducts() {
    this.router.navigate(['/products/products-daisy']);
  }

  onCategoryClick(category: MedusaCategory) {
    this.store.dispatch(new CategoriesActions.SetSelectedCategory(category));
    this.router.navigate(['/category', category.id]);
  }

  navigateToAuth(): void {
    this.navigationService.navigateTo('/auth');
  }

  navigateToProfile(): void {
    this.router.navigate(['/customer/profile']);
  }
}

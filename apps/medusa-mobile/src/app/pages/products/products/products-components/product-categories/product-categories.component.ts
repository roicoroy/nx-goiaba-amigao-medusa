import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Store } from '@ngxs/store';
import { Observable, Subject, takeUntil } from 'rxjs';
import { Router } from '@angular/router';
import { NavigationService } from 'src/app/shared/navigation/navigation.service';
import {
  IonToolbar,
  IonSegment,
  IonSegmentButton,
  IonLabel,
  IonSpinner,
  IonIcon
} from '@ionic/angular/standalone';
import { MedusaProduct, MedusaCategory } from 'src/app/shared/interfaces';
import { ProductsActions } from 'src/app/store/products/products.actions';
import { CategoriesActions } from 'src/app/store/categories/categories.actions';
import { AppFacade, IAppFacadeState } from 'src/app/store/app.facade';
import { GoiabaIonButtonComponent, GoiabaCardComponent } from 'src/app/components/goiaba-components';

@Component({
  selector: 'app-product-categories',
  templateUrl: './product-categories.component.html',
  styleUrls: ['./product-categories.component.scss'],
  standalone: true,
  imports: [
    IonToolbar,
    IonSegment,
    IonSegmentButton,
    IonLabel,
    IonSpinner,
    IonIcon,
    CommonModule,
    GoiabaIonButtonComponent,
    GoiabaCardComponent
  ]
})
export class ProductCategoriesComponent implements OnInit, OnDestroy {
  viewState$: Observable<IAppFacadeState>;

  productsList: MedusaProduct[] = [];
  allProductsList: MedusaProduct[] = [];
  productCategories: MedusaCategory[] = [];
  type: string | null = null;

  // Loading and error states
  loading = true;
  categoriesLoading = true;
  productsLoading = true;
  error: string | null = null;

  // Current selected category for detailed view
  selectedCategoryDetails: MedusaCategory | null = null;

  private navigationService = inject(NavigationService);
  private router = inject(Router);
  private store = inject(Store);
  private facade = inject(AppFacade);
  private readonly ngUnsubscribe = new Subject();

  constructor() {
    this.viewState$ = this.facade.viewState$;
  }

  ngOnInit() {
    this.type = 'all';
    this.initializeData();
  }

  private initializeData() {
    this.loading = true;
    this.error = null;

    // Dispatch actions to load data
    this.store.dispatch(new CategoriesActions.GetCategories());
    this.store.dispatch(new ProductsActions.GetProducts());

    // Subscribe to viewState$ for all data
    this.viewState$
      .pipe(takeUntil(this.ngUnsubscribe))
      .subscribe({
        next: (vs) => {
          // Update categories
          if (vs.productsCategories) {
            this.productCategories = vs.productsCategories;
            this.categoriesLoading = false;
          }

          // Update selected category products
          if (vs.selectedCategory) {
            this.productsList = vs.selectedCategory;
            this.productsLoading = false;
          }

          // Update all products
          if (vs.products) {
            this.allProductsList = vs.products;
            this.productsLoading = false;
          }

          this.updateLoadingState();
        },
        error: () => {
          this.error = 'Failed to load data';
          this.categoriesLoading = false;
          this.productsLoading = false;
          this.updateLoadingState();
        }
      });
  }

  private updateLoadingState() {
    this.loading = this.categoriesLoading || this.productsLoading;
  }

  navigateSegment(category?: MedusaCategory) {
    if (category) {
      this.type = category.id;
      this.selectedCategoryDetails = category;
      this.productsLoading = true;
      this.error = null;

      this.store.dispatch(new ProductsActions.GetCategory(category.id));
    }
  }

  all() {
    this.type = 'all';
    this.selectedCategoryDetails = null;
    this.error = null;
  }

  retry() {
    this.initializeData();
  }

  refreshCategory() {
    if (this.selectedCategoryDetails) {
      this.navigateSegment(this.selectedCategoryDetails);
    } else {
      this.all();
    }
  }



  homePage() {
    this.navigationService.navigateFlip('/tabs/home');
  }

  detailsPage(product: MedusaProduct) {
    if (product.id) {
      const regionId = this.store.selectSnapshot((state: any) => state.regions?.defaultRegion?.region_id);
      const queryParams: any = {};
      if (regionId) {
        queryParams.region_id = regionId;
      }
      this.router.navigate(['/products', product.id], { queryParams });
    }
  }

  segmentChanged(ev: any) {
    this.type = ev.target.value;
  }

  ngOnDestroy(): void {
    this.ngUnsubscribe.next(null);
    this.ngUnsubscribe.complete();
  }

}

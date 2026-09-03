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
import { MedusaProduct, MedusaCollection } from 'src/app/shared/interfaces';
import { CollectionsFacade, ICollectionsFacadeState } from 'src/app/store/collections/collections.facade';
import { RegionsState } from 'src/app/store/regions/regions.state';
import { GoiabaIonButtonComponent, GoiabaCardComponent } from 'src/app/components/goiaba-components';

@Component({
  selector: 'app-product-collection',
  templateUrl: './product-collection.component.html',
  styleUrls: ['./product-collection.component.scss'],
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
export class ProductCollectionComponent implements OnInit, OnDestroy {
  viewState$: Observable<ICollectionsFacadeState>;

  productsList: MedusaProduct[] = [];
  type: string | null = null;

  // Loading and error states
  loading = true;
  error: string | null = null;

  // Current selected collection for detailed view
  selectedCollectionDetails: MedusaCollection | null = null;

  private navigationService = inject(NavigationService);
  private router = inject(Router);
  private store = inject(Store);
  private facade = inject(CollectionsFacade);
  private readonly ngUnsubscribe = new Subject();

  constructor() {
    this.viewState$ = this.facade.viewState$;
  }

  ngOnInit() {
    this.type = null;
    this.initializeData();
  }

  private initializeData() {
    this.loading = true;
    this.error = null;

    // Dispatch action to load collections
    this.facade.loadCollections();

    // Subscribe to viewState$ for all data
    this.viewState$
      .pipe(takeUntil(this.ngUnsubscribe))
      .subscribe({
        next: (vs) => {
          // Update selected collection products from the state
          if (vs.selectedCollectionProducts && vs.selectedCollectionProducts.length > 0) {
            this.productsList = vs.selectedCollectionProducts;
          } else {
            this.productsList = [];
          }

          // Update selected collection details
          if (vs.selectedCollection) {
            this.selectedCollectionDetails = vs.selectedCollection;
          }

          // Update loading and error states
          this.loading = vs.loading;
          this.error = vs.error;

          if (vs.collections && vs.collections.length > 0) {
            // Auto-select first collection if none is selected
            if (!this.type && !this.selectedCollectionDetails) {
              const firstCollection = vs.collections[0];
              this.navigateSegment(firstCollection);
            }
          }
        },
        error: (err) => {
          console.error('[ProductCollectionComponent] viewState$ - Error:', err);
          this.error = 'Failed to load data';
          this.loading = false;
        }
      });
  }

  navigateSegment(collection?: MedusaCollection) {
    if (collection) {
      this.type = collection.id;
      this.error = null;
      this.loading = true;

      // Load products for this collection
      this.facade.loadCollectionProducts(collection.id);
      this.selectedCollectionDetails = collection;
    }
  }

  retry() {
    this.initializeData();
  }

  refreshCollection() {
    if (this.selectedCollectionDetails) {
      this.navigateSegment(this.selectedCollectionDetails);
    }
  }

  detailsPage(product: MedusaProduct) {
    if (product.id) {
      const regionId = this.store.selectSnapshot(RegionsState.getDefaultRegion)?.region_id;
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

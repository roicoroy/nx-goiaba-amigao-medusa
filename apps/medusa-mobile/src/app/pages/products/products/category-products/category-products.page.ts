import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { 
  IonHeader, 
  IonToolbar, 
  IonTitle, 
  IonButtons, 
  IonBackButton,
  IonContent,
  IonSpinner,
  IonButton,
  IonIcon,
  IonCard,
  IonCardContent,
  IonGrid,
  IonRow,
  IonCol,
  IonImg
} from '@ionic/angular/standalone';
import { CommonModule } from '@angular/common';
import { Observable, Subject, BehaviorSubject } from 'rxjs';
import { takeUntil, tap } from 'rxjs/operators';
import { Store } from '@ngxs/store';
import { MedusaService } from 'src/app/shared/api/medusa.service';
import { MedusaProduct, MedusaProductsResponse } from 'src/app/shared/interfaces';
import { CategoriesActions } from 'src/app/store/categories/categories.actions';
import { CategoriesState } from 'src/app/store/categories/categories.state';
import { MedusaCategory } from 'src/app/shared/interfaces/medusa-categories.interface';
// Footer component removed - not found
import { RegionsState } from 'src/app/store/regions/regions.state';

@Component({
  selector: 'app-category-products',
  templateUrl: './category-products.page.html',
  styleUrls: ['./category-products.page.scss'],
  standalone: true,
  imports: [
    IonHeader,
    IonToolbar,
    IonTitle,
    IonButtons,
    IonBackButton,
    IonContent,
    IonSpinner,
    IonButton,
    IonIcon,
    IonCard,
    IonCardContent,
    IonGrid,
    IonRow,
    IonCol,
    IonImg,
    CommonModule,
  ]
})
export class CategoryProductsPage implements OnInit, OnDestroy {
  private readonly ngUnsubscribe = new Subject();
  
  categoryId$ = new BehaviorSubject<string | null>(null);
  category$: Observable<MedusaCategory | null>;
  products$: Observable<MedusaProduct[]>;
  
  private categorySubject = new BehaviorSubject<MedusaCategory | null>(null);
  private productsSubject = new BehaviorSubject<MedusaProduct[]>([]);
  
  loading = true;
  loadingMore = false;
  error: string | null = null;
  hasMorePages = false;
  
  private limit = 20;
  private currentPage = 1;
  private totalCount = 0;
  
  private store = inject(Store);
  private medusaApi: MedusaService = inject(MedusaService);
  private activatedRoute = inject(ActivatedRoute);
  private router = inject(Router);

  constructor() {
    this.category$ = this.categorySubject.asObservable();
    this.products$ = this.productsSubject.asObservable();
  }

  ngOnInit() {
    // Get categoryId from route params
    this.activatedRoute.paramMap
      .pipe(takeUntil(this.ngUnsubscribe))
      .subscribe(params => {
        const categoryId = params.get('categoryId');
        if (categoryId) {
          this.categoryId$.next(categoryId);
          this.loadCategoryDetails(categoryId);
          this.loadProducts(categoryId, 1);
        } else {
          this.error = 'Category ID not found';
          this.loading = false;
        }
      });
  }

  ngOnDestroy(): void {
    this.ngUnsubscribe.next(null);
    this.ngUnsubscribe.complete();
  }

  loadCategoryDetails(categoryId: string) {
    // Try to get category from state first
    const categories = this.store.selectSnapshot(CategoriesState.getCategories);
    const selectedCategory = this.store.selectSnapshot(CategoriesState.getSelectedCategory);
    
    // Check if it's the selected category or find in list
    let category: MedusaCategory | null = null;
    if (selectedCategory && selectedCategory.id === categoryId) {
      category = selectedCategory;
    } else {
      category = categories.find(c => c.id === categoryId) || null;
    }
    
    if (category) {
      this.categorySubject.next(category);
    } else {
      // If not in state, fetch it with details
      this.store.dispatch(new CategoriesActions.GetCategoryWithDetails(categoryId, false));
      
      // Subscribe to selected category to get it when loaded
      this.store.select(CategoriesState.getSelectedCategory)
        .pipe(
          takeUntil(this.ngUnsubscribe),
          tap(cat => {
            if (cat && cat.id === categoryId) {
              this.categorySubject.next(cat);
            }
          })
        )
        .subscribe();
    }
  }

  loadProducts(categoryId: string, page: number = 1) {
    if (page === 1) {
      this.loading = true;
      this.productsSubject.next([]);
    } else {
      this.loadingMore = true;
    }
    
    this.error = null;
    const offset = (page - 1) * this.limit;

    this.medusaApi.getCategory(categoryId, {
      limit: this.limit,
      offset: offset
    })
      .pipe(takeUntil(this.ngUnsubscribe))
      .subscribe({
        next: (response: MedusaProductsResponse) => {
          const newProducts = response.products || [];
          const currentProducts = this.productsSubject.value;
          
          // Append new products (avoid duplicates)
          const allProducts = page === 1 
            ? newProducts 
            : [...currentProducts, ...newProducts.filter(p => !currentProducts.some(cp => cp.id === p.id))];
          
          this.productsSubject.next(allProducts);
          this.totalCount = response.count || 0;
          this.hasMorePages = this.totalCount > (offset + newProducts.length);
          this.currentPage = page;
          
          this.loading = false;
          this.loadingMore = false;
        },
        error: (error: any) => {
          console.error('Error loading category products:', error);
          this.error = error?.userMessage || 'Failed to load products';
          this.loading = false;
          this.loadingMore = false;
        }
      });
  }

  loadMore() {
    const categoryId = this.categoryId$.value;
    if (categoryId && this.hasMorePages && !this.loadingMore) {
      this.loadProducts(categoryId, this.currentPage + 1);
    }
  }

  onProductClick(product: MedusaProduct) {
    if (product.id) {
      const regionId = this.store.selectSnapshot(RegionsState.getDefaultRegion)?.region_id;
      const queryParams: any = {};
      if (regionId) {
        queryParams.region_id = regionId;
      }
      this.router.navigate(['/products', product.id], { queryParams });
    }
  }

  getProductImage(product: MedusaProduct): string {
    if (product.thumbnail) {
      return product.thumbnail;
    }
    // Filter out null values from images array (API can return [null])
    const validImages = product.images?.filter(img => img !== null && img?.url) || [];
    if (validImages.length > 0 && validImages[0]?.url) {
      return validImages[0].url;
    }
    return 'assets/placeholder-product.png';
  }

  getProductPrice(product: MedusaProduct): string {
    // Filter out null values from variants array
    const validVariants = product.variants?.filter(v => v !== null && v?.id) || [];
    if (validVariants.length > 0) {
      const variant = validVariants[0];
      if (variant?.prices && variant.prices.length > 0) {
        const price = variant.prices[0];
        return `$${(price.amount / 100).toFixed(2)}`;
      }
    }
    return 'Price not available';
  }
}


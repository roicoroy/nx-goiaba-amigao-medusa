import { Injectable, inject } from '@angular/core';
import { Store } from '@ngxs/store';
import { Observable, combineLatest } from 'rxjs';
import { map } from 'rxjs/operators';
import { ProductReviewsState } from './product-reviews.state';
import { ProductReviewsActions } from './product-reviews.actions';
import { MedusaProductReview, ReviewStats, CreateReviewPayload } from '../../shared/interfaces';

export interface IProductReviewsFacadeState {
  reviews: MedusaProductReview[];
  stats: ReviewStats | null;
  loading: boolean;
  error: string | null;
  currentProductId: string | null;
}

@Injectable({
  providedIn: 'root'
})
export class ProductReviewsFacade {
  private store = inject(Store);

  // Individual observables
  reviews$: Observable<MedusaProductReview[]> = this.store.select(ProductReviewsState.getReviews);
  stats$: Observable<ReviewStats | null> = this.store.select(ProductReviewsState.getReviewStats);
  loading$: Observable<boolean> = this.store.select(ProductReviewsState.getLoading);
  error$: Observable<string | null> = this.store.select(ProductReviewsState.getError);
  currentProductId$: Observable<string | null> = this.store.select(ProductReviewsState.getCurrentProductId);

  // Combined viewState
  readonly viewState$: Observable<IProductReviewsFacadeState>;

  constructor() {
    this.viewState$ = combineLatest([
      this.reviews$,
      this.stats$,
      this.loading$,
      this.error$,
      this.currentProductId$
    ]).pipe(
      map(([reviews, stats, loading, error, currentProductId]) => ({
        reviews,
        stats,
        loading,
        error,
        currentProductId
      }))
    );
  }

  // Actions
  loadReviews(productId: string, limit?: number, offset?: number): void {
    this.store.dispatch(new ProductReviewsActions.GetProductReviews(productId, limit, offset));
  }

  submitReview(payload: CreateReviewPayload): void {
    this.store.dispatch(new ProductReviewsActions.SubmitProductReview(payload));
  }

  clearReviews(): void {
    this.store.dispatch(new ProductReviewsActions.ClearProductReviews());
  }

  // Selectors (snapshot helpers)
  getReviewsSnapshot(): MedusaProductReview[] {
    return this.store.selectSnapshot(ProductReviewsState.getReviews);
  }

  getStatsSnapshot(): ReviewStats | null {
    return this.store.selectSnapshot(ProductReviewsState.getReviewStats);
  }

  getLoadingSnapshot(): boolean {
    return this.store.selectSnapshot(ProductReviewsState.getLoading);
  }

  getErrorSnapshot(): string | null {
    return this.store.selectSnapshot(ProductReviewsState.getError);
  }

  getCurrentProductIdSnapshot(): string | null {
    return this.store.selectSnapshot(ProductReviewsState.getCurrentProductId);
  }
}


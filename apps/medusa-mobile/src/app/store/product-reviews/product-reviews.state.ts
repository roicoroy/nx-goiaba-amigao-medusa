import { Injectable, inject } from '@angular/core';
import { Action, Selector, State, StateContext } from '@ngxs/store';
import { catchError, take, throwError, switchMap, tap, of } from 'rxjs';
import { ProductReviewsActions } from './product-reviews.actions';
import { MedusaProductReview, ProductReviewResponse, ReviewStats } from 'src/app/shared/interfaces';
import { MedusaService } from 'src/app/shared/api/medusa.service';
import { HttpErrorResponse } from '@angular/common/http';

export interface ProductReviewsStateModel {
  reviews: MedusaProductReview[];
  stats: ReviewStats | null;
  loading: boolean;
  error: string | null;
  currentProductId: string | null;
}

@State<ProductReviewsStateModel>({
  name: 'productReviews',
  defaults: {
    reviews: [],
    stats: null,
    loading: false,
    error: null,
    currentProductId: null
  }
})
@Injectable()
export class ProductReviewsState {
  private medusaApi = inject(MedusaService);

  @Selector()
  static getReviews(state: ProductReviewsStateModel): MedusaProductReview[] {
    return state?.reviews || [];
  }

  @Selector()
  static getReviewStats(state: ProductReviewsStateModel): ReviewStats | null {
    return state?.stats || null;
  }

  @Selector()
  static getLoading(state: ProductReviewsStateModel): boolean {
    return state?.loading || false;
  }

  @Selector()
  static getError(state: ProductReviewsStateModel): string | null {
    return state?.error || null;
  }

  @Selector()
  static getCurrentProductId(state: ProductReviewsStateModel): string | null {
    return state?.currentProductId || null;
  }

  @Action(ProductReviewsActions.GetProductReviews)
  getProductReviews(
    ctx: StateContext<ProductReviewsStateModel>,
    { productId, limit, offset }: ProductReviewsActions.GetProductReviews
  ) {
    ctx.patchState({
      loading: true,
      error: null,
      currentProductId: productId
    });

    return this.medusaApi.getProductReviews(productId, limit, offset).pipe(
      take(1),
      catchError(error => {
        // Check if this is a 404 or status 0 error (missing endpoint or CORS issue)
        const isMissingEndpoint =
          (error instanceof HttpErrorResponse && (error.status === 404 || error.status === 0)) ||
          (error.status === 404 || error.status === 0);

        if (isMissingEndpoint) {
          // For missing endpoint errors, set state with empty reviews (graceful failure)
          ctx.patchState({
            reviews: [],
            stats: null,
            loading: false,
            error: null
          });
          // Return empty response to complete the stream gracefully
          return of({ product_reviews: [], reviews: [], count: 0 } as ProductReviewResponse);
        } else {
          // For other errors (500, 401, etc.), keep existing error handling
          ctx.patchState({
            loading: false,
            error: error.message || error.userMessage || 'Failed to load product reviews'
          });
          return throwError(() => error);
        }
      })
    ).subscribe((response: ProductReviewResponse) => {
      // Handle both product_reviews and reviews response formats
      const reviews = response.product_reviews || response.reviews || [];

      // Calculate statistics from reviews
      const stats = this.calculateStats(reviews);

      ctx.patchState({
        reviews,
        stats,
        loading: false
      });
    });
  }

  @Action(ProductReviewsActions.SubmitProductReview)
  submitProductReview(
    ctx: StateContext<ProductReviewsStateModel>,
    { payload }: ProductReviewsActions.SubmitProductReview
  ) {
    ctx.patchState({ loading: true, error: null });

    return this.medusaApi.submitProductReview(payload).pipe(
      take(1),
      switchMap((response) => {
        // After successful submission, refresh reviews for the product
        // Extract product_id from the first review in the payload
        const productId = payload.reviews[0]?.product_id;
        if (!productId) {
          ctx.patchState({
            loading: false,
            error: 'Product ID is missing from payload'
          });
          return throwError(() => new Error('Product ID is missing'));
        }
        return this.medusaApi.getProductReviews(productId).pipe(
          take(1),
          tap((refreshResponse: ProductReviewResponse) => {
            // Handle both product_reviews and reviews response formats
            const reviews = refreshResponse.product_reviews || refreshResponse.reviews || [];
            const stats = this.calculateStats(reviews);

            ctx.patchState({
              reviews,
              stats,
              loading: false,
              error: null
            });
          }),
          catchError(error => {
            // Extract user-friendly error message
            let errorMessage = 'Review submitted but failed to refresh reviews';

            if (error.userMessage) {
              errorMessage = error.userMessage;
            } else if (error?.error?.message) {
              errorMessage = error.error.message;
            } else if (error.message) {
              errorMessage = error.message;
            }

            ctx.patchState({
              loading: false,
              error: errorMessage
            });
            return throwError(() => error);
          })
        );
      }),
      catchError(error => {
        // Extract user-friendly error message
        // The error may come from handleError (with userMessage) or directly from HTTP
        let errorMessage = 'Failed to submit review';

        if (error.userMessage) {
          // Error was processed by handleError in BaseHttpService
          errorMessage = error.userMessage;
        } else if (error?.error?.error === 'DUPLICATE_REVIEW') {
          // Direct HTTP error with duplicate review
          errorMessage = error.error.message || 'You have already submitted a review for this item.';
        } else if (error?.error?.message) {
          // Server-provided error message
          errorMessage = error.error.message;
        } else if (error.message) {
          // Generic error message
          errorMessage = error.message;
        }

        ctx.patchState({
          loading: false,
          error: errorMessage
        });
        return throwError(() => error);
      })
    );
  }

  @Action(ProductReviewsActions.ClearProductReviews)
  clearProductReviews(ctx: StateContext<ProductReviewsStateModel>) {
    ctx.patchState({
      reviews: [],
      stats: null,
      loading: false,
      error: null,
      currentProductId: null
    });
  }

  /**
   * Calculate review statistics from reviews array
   */
  private calculateStats(reviews: MedusaProductReview[]): ReviewStats {
    if (!reviews || reviews.length === 0) {
      return {
        average_rating: 0,
        total_reviews: 0,
        rating_distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
      };
    }

    // Filter only approved/published reviews for statistics
    const approvedReviews = reviews.filter(
      review => review.status === 'approved' || review.status === 'published' || !review.status
    );

    if (approvedReviews.length === 0) {
      return {
        average_rating: 0,
        total_reviews: 0,
        rating_distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
      };
    }

    const totalRating = approvedReviews.reduce((sum, review) => sum + review.rating, 0);
    const averageRating = totalRating / approvedReviews.length;

    const ratingDistribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    approvedReviews.forEach(review => {
      const rating = Math.round(review.rating);
      if (rating >= 1 && rating <= 5) {
        ratingDistribution[rating as keyof typeof ratingDistribution]++;
      }
    });

    return {
      average_rating: Math.round(averageRating * 10) / 10, // Round to 1 decimal
      total_reviews: approvedReviews.length,
      rating_distribution: ratingDistribution
    };
  }
}


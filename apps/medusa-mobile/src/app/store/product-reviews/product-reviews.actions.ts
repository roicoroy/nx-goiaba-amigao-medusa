import { CreateReviewPayload } from 'src/app/shared/interfaces';

/**
 * Product Reviews Actions
 * 
 * Actions for managing product reviews state
 */
export namespace ProductReviewsActions {
  /**
   * Fetch reviews for a specific product
   */
  export class GetProductReviews {
    static readonly type = '[ProductReviewsState] Get Product Reviews';
    constructor(
      public productId: string,
      public limit?: number,
      public offset?: number
    ) { }
  }

  /**
   * Submit a new product review
   */
  export class SubmitProductReview {
    static readonly type = '[ProductReviewsState] Submit Product Review';
    constructor(public payload: CreateReviewPayload) { }
  }

  /**
   * Clear product reviews state
   */
  export class ClearProductReviews {
    static readonly type = '[ProductReviewsState] Clear Product Reviews';
  }
}


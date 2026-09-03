import type { HttpTypes } from '@medusajs/framework/types';

export type ProductReviewStatus = 'pending' | 'approved' | 'flagged';

export interface AdminProductReview {
  id: string;
  product_id: string;
  variant_id?: string | null;
  customer_id?: string | null;
  order_id?: string | null;
  order_line_item_id?: string | null;
  rating: number;
  title?: string | null;
  content?: string | null;
  name?: string | null;
  approved_by?: string | null;
  status: ProductReviewStatus;
  verified: boolean;
  created_at: Date | string;
  updated_at: Date | string;
  deleted_at?: Date | string | null;

  // Relations
  product?: HttpTypes.AdminProduct;
  customer?: HttpTypes.AdminCustomer;
  order?: HttpTypes.AdminOrder;
  images?: AdminProductReviewImage[];
  response?: AdminProductReviewResponse | null;
}

export interface AdminProductReviewImage {
  id: string;
  url: string;
  type: string;
  product_review_id: string;
  created_at: Date | string;
  updated_at: Date | string;
  deleted_at?: Date | string | null;
}

export interface AdminProductReviewResponse {
  id: string;
  product_review_id: string;
  content: string;
  responded_by?: string | null;
  created_at: Date | string;
  updated_at: Date | string;
  deleted_at?: Date | string | null;
}

export interface AdminListProductReviewsQuery {
  product_id?: string | string[];
  customer_id?: string | string[];
  order_id?: string | string[];
  rating?: number | number[];
  status?: string | string[];
  limit?: number;
  offset?: number;
  order?: string;
  fields?: string;
}

export interface AdminListProductReviewsResponse {
  product_reviews: AdminProductReview[];
  count: number;
  offset: number;
  limit: number;
}

export interface AdminCreateProductReviewResponseDTO {
  content: string;
}

export interface AdminUpdateProductReviewResponseDTO {
  content: string;
}

export interface RefreshStatsRequest {
  product_ids?: string[];
}

export interface RefreshStatsResponse {
  message: string;
  refreshed: number;
  product_ids: string[];
}

// SDK interface for backward compatibility
export interface ProductReviewSDK {
  admin: {
    productReviews: {
      list(query?: AdminListProductReviewsQuery): Promise<AdminListProductReviewsResponse>;
      retrieve(id: string): Promise<{ product_review: AdminProductReview }>;
      update(id: string, data: AdminUpdateProductReviewRequest): Promise<{ product_review: AdminProductReview }>;
      updateStatus(id: string, status: string): Promise<{ product_review: AdminProductReview }>;
      updateVerified(id: string, verified: boolean): Promise<{ product_review: AdminProductReview }>;
      delete(id: string): Promise<void>;
      createResponse(reviewId: string, body: AdminCreateProductReviewResponseDTO): Promise<{ product_review_response: AdminProductReviewResponse }>;
      updateResponse(reviewId: string, body: AdminUpdateProductReviewResponseDTO): Promise<{ product_review_response: AdminProductReviewResponse }>;
      deleteResponse(reviewId: string): Promise<{ product_review: AdminProductReview }>;
    };
    productReviewStats: {
      refresh(body?: RefreshStatsRequest): Promise<RefreshStatsResponse>;
    };
  };
}

export interface AdminUpdateProductReviewRequest {
  status?: ProductReviewStatus;
  response?: {
    content: string;
  };
}

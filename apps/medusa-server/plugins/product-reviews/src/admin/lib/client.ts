import Medusa from '@medusajs/js-sdk';
import type {
  AdminCreateProductReviewResponseDTO,
  AdminListProductReviewsQuery,
  AdminListProductReviewsResponse,
  AdminProductReview,
  AdminProductReviewResponse,
  AdminUpdateProductReviewResponseDTO,
  ProductReviewSDK,
  RefreshStatsRequest,
  RefreshStatsResponse,
} from '../../types/admin';

declare const __BACKEND_URL__: string | undefined;

export const backendUrl = __BACKEND_URL__ ?? 'http://localhost:9000';

// Official Medusa SDK for all operations
export const medusaClient = new Medusa({
  baseUrl: backendUrl,
  auth: {
    type: 'session',
  },
});

// Product review client wrapper
export const productReviewClient: ProductReviewSDK = {
  admin: {
    productReviews: {
      async list(query: AdminListProductReviewsQuery): Promise<AdminListProductReviewsResponse> {
        return medusaClient.client.fetch('/admin/product-reviews', {
          method: 'GET',
          query,
        });
      },

      async retrieve(id: string): Promise<{ product_review: AdminProductReview }> {
        return medusaClient.client.fetch(`/admin/product-reviews/${id}`, {
          method: 'GET',
        });
      },

      async update(id: string, data: any): Promise<{ product_review: AdminProductReview }> {
        return medusaClient.client.fetch(`/admin/product-reviews/${id}`, {
          method: 'PUT',
          body: data,
        });
      },

      async updateStatus(id: string, status: string): Promise<{ product_review: AdminProductReview }> {
        return medusaClient.client.fetch(`/admin/product-reviews/${id}/status`, {
          method: 'PUT',
          body: { status },
        });
      },

      async updateVerified(id: string, verified: boolean): Promise<{ product_review: AdminProductReview }> {
        return medusaClient.client.fetch(`/admin/product-reviews/${id}/verified`, {
          method: 'PUT',
          body: { verified },
        });
      },

      async delete(id: string): Promise<void> {
        return medusaClient.client.fetch(`/admin/product-reviews/${id}`, {
          method: 'DELETE',
        });
      },

      async createResponse(reviewId: string, data: AdminCreateProductReviewResponseDTO): Promise<{ product_review_response: AdminProductReviewResponse }> {
        return medusaClient.client.fetch(`/admin/product-reviews/${reviewId}/response`, {
          method: 'POST',
          body: data,
        });
      },

      async updateResponse(reviewId: string, data: AdminUpdateProductReviewResponseDTO): Promise<{ product_review_response: AdminProductReviewResponse }> {
        return medusaClient.client.fetch(`/admin/product-reviews/${reviewId}/response`, {
          method: 'PUT',
          body: data,
        });
      },

      async deleteResponse(reviewId: string): Promise<{ product_review: AdminProductReview }> {
        return medusaClient.client.fetch(`/admin/product-reviews/${reviewId}/response`, {
          method: 'DELETE',
        });
      },
    },
    
    productReviewStats: {
      async refresh(body?: RefreshStatsRequest): Promise<RefreshStatsResponse> {
        return medusaClient.client.fetch('/admin/product-review-stats', {
          method: 'POST',
          body,
        });
      },
    },
  },
};

// Export for backward compatibility
export const sdk = productReviewClient;

// Export medusa client for other operations
export const medusa = medusaClient;
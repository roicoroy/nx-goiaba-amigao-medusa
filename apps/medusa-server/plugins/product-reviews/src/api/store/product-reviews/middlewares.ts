import { MedusaNextFunction, MedusaRequest, MedusaResponse, type MiddlewareRoute, validateAndTransformBody, validateAndTransformQuery } from '@medusajs/framework';
import { createFindParams, createOperatorMap } from '@medusajs/medusa/api/utils/validators';
import { QueryConfig } from '@medusajs/types';
import { z } from 'zod';
import { ProductReview } from '../../../modules/product-review/types/common';

const reviewStatuses = z.enum(['pending', 'approved', 'flagged'])

export const listStoreProductReviewsQuerySchema = createFindParams({
  offset: 0,
  limit: 50,
}).merge(
  z.object({
    id: z.union([z.string(), z.array(z.string())]).optional(),
    status: z.union([reviewStatuses, z.array(reviewStatuses)]).optional(),
    product_id: z.union([z.string(), z.array(z.string())]).optional(),
    order_id: z.union([z.string(), z.array(z.string())]).optional(),
    rating: z.union([z.number().max(5).min(1), z.array(z.number().max(5).min(1))]).optional(),
    created_at: createOperatorMap().optional(),
    updated_at: createOperatorMap().optional(),
  }),
);

export const listStoreProductReviewsRandomQuerySchema = createFindParams({
  offset: 0,
  limit: 50,
}).merge(
  z.object({
    id: z.union([z.string(), z.array(z.string())]).optional(),
    status: z.union([reviewStatuses, z.array(reviewStatuses)]).optional(),
    product_id: z.union([z.string(), z.array(z.string())]).optional(),
    order_id: z.union([z.string(), z.array(z.string())]).optional(),
    rating: z.union([z.number().max(5).min(1), z.array(z.number().max(5).min(1))]).optional(),
    created_at: createOperatorMap().optional(),
    updated_at: createOperatorMap().optional(),
    withImages: z.coerce.number().min(0).max(10).optional(),
    total: z.coerce.number().min(1).max(20).optional(),
  }),
);

export const upsertProductReviewsSchema = z.object({
  reviews: z.array(
    z.object({
      order_id: z.string(),
      order_line_item_id: z.string(),
      rating: z.number().max(5).min(1),
      title: z.string(),
      content: z.string(),
      images: z.array(z.object({ url: z.string() })),
    }),
  ),
});



export type UpsertProductReviewsSchema = z.infer<typeof upsertProductReviewsSchema>;

export const defaultStoreProductReviewFields = [
  'id',
  'status',
  'product_id',
  'variant_id',  // Added to include variant_id by default
  'name',
  'rating',
  'content',
  'created_at',
  'updated_at',
  'response.*',
  'images.*'
  // Removed variant relation fields - link not working yet
];

export const allowedStoreProductReviewFields = [
  'id',
  'status',
  'product_id',
  'variant_id',  // Allow variant_id in queries
  'name',
  'rating',
  'content',
  'created_at',
  'updated_at',
  'response',
  'images',
  'product.*'
  // Note: variant.* removed as relation isn't set up yet - using variant_sku enrichment instead
];

export const defaultStoreReviewsQueryConfig: QueryConfig<ProductReview> = {
  allowed: [...allowedStoreProductReviewFields],
  defaults: [...defaultStoreProductReviewFields],
  defaultLimit: 50,
  isList: true,
};

// Middleware to prevent duplicate reviews
export async function preventDuplicateReviews(
  req: MedusaRequest,
  res: MedusaResponse,
  next: MedusaNextFunction
) {
  // Only check for POST requests to create reviews
  if (req.method !== "POST") {
    return next()
  }

  const { reviews } = req.body as {
    reviews?: Array<{
      order_id?: string
      order_line_item_id?: string
    }>
  }

  if (!reviews || reviews.length === 0) {
    return next()
  }

  try {
    const query = req.scope.resolve("query")

    // Check each review for duplicates
    for (const review of reviews) {
      if (review.order_line_item_id && review.order_id) {
        const { data: existingReviews } = await query.graph({
          entity: "product_review",
          filters: {
            order_line_item_id: review.order_line_item_id,
            order_id: review.order_id,
          },
          fields: ["id"],
        })

        if (existingReviews && existingReviews.length > 0) {
          return res.status(409).json({
            error: "DUPLICATE_REVIEW",
            message: "You have already submitted a review for this item",
            order_line_item_id: review.order_line_item_id,
          })
        }
      }
    }

    next()
  } catch (error) {
    console.error("Error checking for duplicate reviews:", error)
    // Continue with the request even if the check fails
    next()
  }
}

export const storeProductReviewRoutesMiddlewares: MiddlewareRoute[] = [
  {
    matcher: '/store/product-reviews',
    method: 'GET',
    middlewares: [validateAndTransformQuery(listStoreProductReviewsQuerySchema, defaultStoreReviewsQueryConfig)],
  },
  {
    matcher: '/store/product-reviews',
    method: 'POST',
    middlewares: [
      preventDuplicateReviews,
      validateAndTransformBody(upsertProductReviewsSchema)
    ],
  },
  {
    matcher: '/store/product-reviews/random',
    method: 'GET',
    middlewares: [validateAndTransformQuery(listStoreProductReviewsRandomQuerySchema, defaultStoreReviewsQueryConfig)],
  },
];

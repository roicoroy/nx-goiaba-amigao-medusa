import type { AuthenticatedMedusaRequest, MedusaResponse } from '@medusajs/framework';
import { ContainerRegistrationKeys } from '@medusajs/framework/utils';
import { z } from 'zod';

const BulkImportSchema = z.object({
  reviews: z.array(
    z.object({
      product_id: z.string(),
      variant_id: z.string().optional(),
      name: z.string().optional(),
      email: z.string().optional(),
      rating: z.number().min(1).max(5),
      content: z.string().optional(),
      status: z.enum(['pending', 'approved', 'flagged']).default('approved'),
      created_at: z.string().optional(), // ISO date string
    })
  ),
});

export type BulkImportReviewsSchema = z.infer<typeof BulkImportSchema>;

export const POST = async (req: AuthenticatedMedusaRequest<BulkImportReviewsSchema>, res: MedusaResponse) => {
  const productReviewService = req.scope.resolve('product_review') as any;
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY);

  // Validate request body
  const validatedBody = BulkImportSchema.parse(req.body);
  const { reviews } = validatedBody;

  const createdReviews: any[] = [];
  const errors: any[] = [];

  // Process each review
  for (const review of reviews) {
    try {
      // Create review with custom date if provided
      const reviewData: any = {
        product_id: review.product_id,
        variant_id: review.variant_id,
        name: review.name,
        email: review.email,
        rating: review.rating,
        content: review.content,
        status: review.status || 'approved',
      };

      // If custom date is provided, we'll need to update it after creation
      const createdReview = await productReviewService.createProductReview(reviewData);

      // Update created_at if provided
      if (review.created_at && createdReview) {
        await productReviewService.updateProductReview(
          {
            id: createdReview.id,
            created_at: new Date(review.created_at),
            updated_at: new Date(review.created_at)
          }
        );
      }

      createdReviews.push(createdReview);
    } catch (error) {
      errors.push({
        review: review,
        error: error.message
      });
    }
  }

  // Refresh stats for affected products
  const productIds = [...new Set(reviews.map(r => r.product_id))];
  if (productIds.length > 0) {
    try {
      await productReviewService.refreshProductReviewStats(productIds);
    } catch (error) {
      console.error('Failed to refresh product review stats:', error);
    }
  }

  // Fetch created reviews with all fields
  const { data: product_reviews } = await query.graph({
    entity: 'product_review',
    fields: ['*'],
    filters: {
      id: createdReviews.map(r => r.id),
    }
  });

  res.status(200).json({
    product_reviews,
    imported: createdReviews.length,
    errors: errors.length > 0 ? errors : undefined
  });
};
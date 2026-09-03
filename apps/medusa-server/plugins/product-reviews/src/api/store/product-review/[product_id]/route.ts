import type { MedusaRequest, MedusaResponse } from '@medusajs/framework/http';
import { ContainerRegistrationKeys, MedusaError } from '@medusajs/framework/utils';
import { z, ZodSchema } from 'zod';

// Schema for review media
export type ProductReviewMediaInput = {
  key: string;
  type: string;
};

export const productReviewMediaInputSchema = z.object({
  key: z.string(),
  type: z.string(),
}) as ZodSchema<ProductReviewMediaInput>;

// Schema for anonymous review input (without product_id since it's in URL)
export type AnonymousReviewInput = {
  title: string;
  full_name: string;
  email: string;
  rating: number;
  content: string;
  media: ProductReviewMediaInput[];
};

export const anonymousReviewInputSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  full_name: z.string().min(1, 'Full name is required'),
  email: z.string().email('Valid email is required'),
  rating: z.number().min(1).max(5, 'Rating must be between 1 and 5'),
  content: z.string().min(1, 'Content is required'),
  media: z.array(productReviewMediaInputSchema).default([]),
}) as ZodSchema<AnonymousReviewInput>;

// GET - List reviews for a product
export const GET = async (req: MedusaRequest, res: MedusaResponse) => {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY);
  const product_id = req.params.product_id;

  if (!product_id) {
    throw new MedusaError(MedusaError.Types.INVALID_DATA, 'product_id is required');
  }

  const { data: product_reviews, metadata = { count: 0, skip: 0, take: 0 } } = await query.graph({
    entity: 'product_review',
    fields: [
      'id',
      'status',
      'product_id',
      'name',
      'rating',
      'title',
      'content',
      'created_at',
      'updated_at',
      'verified',
      'response.*',
      'images.*',
    ],
    filters: {
      product_id,
      status: 'approved', // Only show approved reviews to customers
    },
  });

  res.status(200).json({
    reviews: product_reviews,
    count: metadata.count,
  });
};

// POST - Create or update an anonymous review for a product
export const POST = async (req: MedusaRequest, res: MedusaResponse) => {
  const product_id = req.params.product_id;

  if (!product_id) {
    throw new MedusaError(MedusaError.Types.INVALID_DATA, 'product_id is required');
  }

  // Validate input
  const result = anonymousReviewInputSchema.safeParse(req.body);
  if (!result.success) {
    throw new MedusaError(MedusaError.Types.INVALID_DATA, result.error.message);
  }

  const { title, full_name, email, rating, content, media } = result.data;

  // Use the upsert workflow
  const { upsertProductReviewWorkflow } = await import('../../../../workflows/upsert-product-review.js');

  try {
    const { result: review } = await upsertProductReviewWorkflow(req.scope).run({
      input: {
        product_id,
        title,
        full_name,
        email,
        rating,
        content,
        media,
      },
    });

    res.status(201).json({
      review,
      message: review 
        ? 'Review submitted successfully and is pending approval'
        : 'Review updated successfully',
    });
  } catch (error) {
    console.error('Error upserting review:', error);
    throw new MedusaError(
      MedusaError.Types.DB_ERROR,
      'Failed to submit review. Please try again.'
    );
  }
};


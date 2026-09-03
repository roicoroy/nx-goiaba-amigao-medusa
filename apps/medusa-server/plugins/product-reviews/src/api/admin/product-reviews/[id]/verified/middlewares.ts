import { type MiddlewareRoute, validateAndTransformBody } from '@medusajs/framework';
import { z } from 'zod';

export const updateProductReviewVerifiedSchema = z.object({
  verified: z.boolean(),
});

export type UpdateProductReviewVerifiedSchema = z.infer<typeof updateProductReviewVerifiedSchema>;

export const adminProductReviewVerifiedRoutesMiddlewares: MiddlewareRoute[] = [
  {
    matcher: '/admin/product-reviews/:id/verified',
    method: 'PUT',
    middlewares: [validateAndTransformBody(updateProductReviewVerifiedSchema)],
  },
];

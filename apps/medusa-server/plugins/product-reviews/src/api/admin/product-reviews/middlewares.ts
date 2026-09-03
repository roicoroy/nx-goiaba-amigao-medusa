import { type MiddlewareRoute, validateAndTransformQuery } from '@medusajs/framework';
import { createFindParams, createOperatorMap } from '@medusajs/medusa/api/utils/validators';
import { z } from 'zod';

const statuses = z.enum(['pending', 'approved', 'flagged'] as const);
export const listAdminProductReviewsQuerySchema = createFindParams({
  offset: 0,
  limit: 50,
}).merge(
  z.object({
    q: z.string().optional(),
    id: z.union([z.string(), z.array(z.string())]).optional(),
    status: z.union([statuses, z.array(statuses)]).optional(),
    product_id: z.union([z.string(), z.array(z.string())]).optional(),
    order_id: z.union([z.string(), z.array(z.string())]).optional(),
    rating: z.union([
      z.coerce.number().max(5).min(1),
      z.array(z.coerce.number().max(5).min(1))
    ]).optional(),
    created_at: createOperatorMap().optional(),
    created_at_gte: z.string().optional(),
    created_at_lte: z.string().optional(),
    updated_at: createOperatorMap().optional(),
  }),
);

export const defaultAdminProductReviewFields = [
  'id',
  'status',
  'product_id',
  'rating',
  'name',
  'email',
  'content',
  'order_id',
  'verified',
  'created_at',
  'updated_at',
  'response.*',
  'images.*',
  'product.*',
  'order.*',
];

export const defaultProductReviewsQueryConfig = {
  defaults: [...defaultAdminProductReviewFields],
  defaultLimit: 50,
  isList: true,
};

export const adminProductReviewRoutesMiddlewares: MiddlewareRoute[] = [
  {
    matcher: '/admin/product-reviews',
    method: 'GET',
    middlewares: [validateAndTransformQuery(listAdminProductReviewsQuerySchema, defaultProductReviewsQueryConfig)],
  },
];

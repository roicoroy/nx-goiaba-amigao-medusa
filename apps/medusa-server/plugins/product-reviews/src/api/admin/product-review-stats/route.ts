import type { AuthenticatedMedusaRequest, MedusaResponse } from '@medusajs/framework';
import type { RemoteQueryObjectConfig } from '@medusajs/framework/types';
import { remoteQueryObjectFromString } from '@medusajs/framework/utils';
import { refreshProductReviewStatsWorkflow } from '../../../workflows/refresh-product-review-stats';

export const GET = async (req: AuthenticatedMedusaRequest, res: MedusaResponse) => {
  const remoteQuery = req.scope.resolve('remoteQuery');

  const queryObject = remoteQueryObjectFromString({
    entryPoint: 'product_review_stats',
    variables: {
      filters: req.filterableFields,
      ...req.remoteQueryConfig.pagination,
    },
    fields: req.remoteQueryConfig.fields as RemoteQueryObjectConfig<'product_review_stats'>['fields'],
  });

  const { rows: product_review_stats, metadata } = await remoteQuery(queryObject);

  res.status(200).json({ product_review_stats, count: metadata.count, offset: metadata.skip, limit: metadata.take });
};

/**
 * POST /admin/product-review-stats/refresh
 * Refresh review statistics for all products or specific products
 * 
 * Body (optional):
 * {
 *   "product_ids": ["prod_123", "prod_456"] // If not provided, refreshes all products with reviews
 * }
 */
export const POST = async (
  req: AuthenticatedMedusaRequest<{ product_ids?: string[] }>,
  res: MedusaResponse
) => {
  const query = req.scope.resolve('query');
  const { product_ids } = req.validatedBody || {};

  try {
    let productIds: string[] = [];

    if (product_ids && product_ids.length > 0) {
      // Use provided product IDs
      productIds = product_ids;
    } else {
      // Get all products that have reviews
      const { data: reviews } = await query.graph({
        entity: 'product_review',
        fields: ['product_id'],
      });

      // Get unique product IDs
      productIds = [...new Set(reviews.map((r: any) => r.product_id).filter(Boolean))];
    }

    if (productIds.length === 0) {
      return res.status(200).json({
        message: 'No products with reviews found',
        refreshed: 0,
      });
    }

    // Run the workflow to refresh stats
    await refreshProductReviewStatsWorkflow(req.scope).run({
      input: { productIds },
    });

    res.status(200).json({
      message: `Successfully refreshed review stats for ${productIds.length} products`,
      refreshed: productIds.length,
      product_ids: productIds,
    });
  } catch (error) {
    console.error('Error refreshing product review stats:', error);
    res.status(500).json({
      message: 'Failed to refresh product review stats',
      error: error.message,
    });
  }
};

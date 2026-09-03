import type { AuthenticatedMedusaRequest, MedusaResponse } from '@medusajs/framework';
import { ContainerRegistrationKeys, Modules } from '@medusajs/framework/utils';
import { upsertProductReviewsWorkflow } from '../../../workflows/upsert-product-reviews';
import { defaultStoreProductReviewFields, UpsertProductReviewsSchema } from './middlewares';

export const GET = async (req: AuthenticatedMedusaRequest, res: MedusaResponse) => {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY);
  const productModule = req.scope.resolve(Modules.PRODUCT) as any;

  // Get the reviews
  const { data: product_reviews, metadata = { count: 0, skip: 0, take: 0 } } = await query.graph({
    entity: 'product_review',
    ...req.queryConfig,
    filters: {
      ...req.filterableFields,
      // Only return approved reviews by default unless status is explicitly provided
      status: req.filterableFields?.status || 'approved',
    },
  });

  // Enrich with variant SKU if variant_id exists
  if (product_reviews && product_reviews.length > 0) {
    const variantIds = [...new Set(product_reviews
      .filter((r: any) => r.variant_id)
      .map((r: any) => r.variant_id)
    )];

    if (variantIds.length > 0) {
      try {
        const variants = await productModule.listProductVariants(
          { id: variantIds },
          { select: ['id', 'sku'] }
        );

        // Check if the response has a data property or is the array itself
        const variantList = variants.data || variants;

        if (Array.isArray(variantList)) {
          const variantMap = new Map(variantList.map((v: any) => [v.id, v.sku]));

          // Add variant_sku to each review
          product_reviews.forEach((review: any) => {
            if (review.variant_id) {
              const sku = variantMap.get(review.variant_id);
              review.variant_sku = sku || null;
            }
          });
        }
      } catch (error) {
        console.error('Error fetching variant SKUs:', error);
      }
    }
  }

  res.status(200).json({ product_reviews, count: metadata.count, offset: metadata.skip, limit: metadata.take });
};

export const POST = async (req: AuthenticatedMedusaRequest<UpsertProductReviewsSchema>, res: MedusaResponse) => {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY);
  const { reviews } = req.validatedBody;

  const { result } = await upsertProductReviewsWorkflow(req.scope).run({ input: { reviews } });

  const createdReviewIds = result.creates.map((review) => review.id);
  const updatedReviewIds = result.updates.map((review) => review.id);


  
  const { data: product_reviews } = await query.graph({
    entity: 'product_review',
    fields: [...defaultStoreProductReviewFields],
    filters: {
      id: [...createdReviewIds, ...updatedReviewIds],
    }
  });

  res.status(200).json({ product_reviews });
};

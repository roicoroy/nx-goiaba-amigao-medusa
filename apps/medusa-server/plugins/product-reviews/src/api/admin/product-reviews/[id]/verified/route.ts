import type { AuthenticatedMedusaRequest, MedusaResponse } from '@medusajs/framework';
import type { UpdateProductReviewVerifiedSchema } from './middlewares';
import { updateProductReviewsWorkflow } from '../../../../../workflows/update-product-reviews';

export const PUT = async (
  req: AuthenticatedMedusaRequest<UpdateProductReviewVerifiedSchema>,
  res: MedusaResponse
) => {
  const review_id = req.params.id;
  const { verified } = req.validatedBody;

  const result = await updateProductReviewsWorkflow(req.scope).run({
    input: {
      productReviews: [{
        id: review_id,
        verified
      }]
    }
  });

  res.status(200).json({ product_review: result.result[0] });
};

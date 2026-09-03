import type { MedusaRequest, MedusaResponse } from "@medusajs/framework";
import { MedusaError } from "@medusajs/framework/utils";
import { PRODUCT_REVIEW_MODULE } from "../../../../modules/product-review";
import type ProductReviewService from "../../../../modules/product-review/service";

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const { order_id, order_line_item_id } = req.query;

  if (!order_id || !order_line_item_id) {
    throw new MedusaError(
      MedusaError.Types.INVALID_DATA,
      "order_id and order_line_item_id are required"
    );
  }

  const productReviewService = req.scope.resolve<ProductReviewService>(
    PRODUCT_REVIEW_MODULE
  );

  try {
    const reviews = await productReviewService.listProductReviews({
      order_id: order_id as string,
      order_line_item_id: order_line_item_id as string,
    });

    const exists = reviews.length > 0;

    res.json({ exists, review: exists ? reviews[0] : null });
  } catch (error) {
    console.error("Error checking existing review:", error);
    throw new MedusaError(
      MedusaError.Types.UNEXPECTED_STATE,
      "Failed to check existing review"
    );
  }
}

// Add CORS headers
export const AUTHENTICATE = false;
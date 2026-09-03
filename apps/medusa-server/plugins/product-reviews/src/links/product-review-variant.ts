import { defineLink } from '@medusajs/framework/utils';
import ProductReviewModule from '../modules/product-review';
import ProductModule from '@medusajs/medusa/product';

export default defineLink(
  {
    linkable: ProductReviewModule.linkable.productReview,
    field: 'variant_id',
  },
  {
    linkable: ProductModule.linkable.productVariant,
    field: 'id',
  }
);
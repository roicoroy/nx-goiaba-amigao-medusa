// src/links/product-reviews.ts
import { defineLink } from '@medusajs/framework/utils';
import ProductModule from '@medusajs/medusa/product';
import ProductReviewModule from '../modules/product-review';

export default defineLink(
  {
    linkable: ProductModule.linkable.product,
    field: 'id',
    isList: true,
  },
  {
    linkable: {
      ...ProductReviewModule.linkable.productReview.id, // or the module's service name
      alias: "reviews", // Custom alias to avoid conflict
      primaryKey: "product_id",
    },
  },
  {
    readOnly: true,
  },
);
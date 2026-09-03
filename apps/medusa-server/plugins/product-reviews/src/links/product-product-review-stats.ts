// src/links/product-reviews.ts
import { defineLink } from '@medusajs/framework/utils';
import ProductModule from '@medusajs/medusa/product';
import ProductReviewModule from '../modules/product-review';

export default defineLink(
  {
    linkable: ProductModule.linkable.product,
    field: 'id',
    isList: false,
  },
  {
    linkable: {
      ...ProductReviewModule.linkable.productReviewStats.id, // or the module's service name
      alias: "reviewStats",
      primaryKey: "product_id",
    },
  },
  {
    readOnly: true,
  },
);
import { Module } from '@medusajs/framework/utils';
import Service from './service';
import validateLoader from './loaders/validate';
export const PRODUCT_REVIEW_MODULE = 'productReview';

export default Module(PRODUCT_REVIEW_MODULE, {
  service: Service,
  loaders: [validateLoader],
});



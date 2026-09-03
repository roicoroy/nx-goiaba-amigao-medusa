// Admin extensions - Widget exports with config
import OrderDetailsProductReviews, { config as orderDetailsConfig } from './widgets/order-details-product-reviews';
import ProductDetailsProductReviews, { config as productDetailsConfig } from './widgets/product-details-product-reviews';

// Route exports
import ProductReviewsPage, { config as productReviewsConfig } from './routes/product-reviews/page';

// Combine all widgets
export const widgets = [
  {
    Component: OrderDetailsProductReviews,
    config: orderDetailsConfig
  },
  {
    Component: ProductDetailsProductReviews,
    config: productDetailsConfig
  }
];

// Combine all routes
export const routes = [
  {
    Component: ProductReviewsPage,
    config: productReviewsConfig
  }
];

// Default export for admin extensions
const adminExtensions = {
  widgets,
  routes
};

export default adminExtensions;
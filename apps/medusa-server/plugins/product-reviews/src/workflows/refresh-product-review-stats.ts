import { type WorkflowData, WorkflowResponse, createWorkflow } from '@medusajs/framework/workflows-sdk';
import { createMissingProductReviewStatsStep } from './steps/create-missing-product-review-stats';
import { recalculateProductReviewStatsStep } from './steps/recalculate-product-review-stats';

export const refreshProductReviewStatsWorkflow = createWorkflow(
  'refresh-product-review-stats-workflow',
  (input: WorkflowData<{ productIds: string[] }>) => {
    createMissingProductReviewStatsStep(input.productIds);

    recalculateProductReviewStatsStep(input.productIds);

    return new WorkflowResponse({});
  },
);

import { transform } from "@medusajs/framework/workflows-sdk";
import { useQueryGraphStep } from "@medusajs/medusa/core-flows";
import {
  type WorkflowData,
  WorkflowResponse,
  createWorkflow,
  when,
} from "@medusajs/workflows-sdk";
import type { ProductReview } from "../modules/product-review/types/common";
import { createProductReviewsWorkflow } from "./create-product-reviews";
import { updateProductReviewsWorkflow } from "./update-product-reviews";

export type UpsertProductReviewWorkflowInput = {
  product_id: string;
  title: string;
  full_name: string;
  email: string;
  rating: number;
  content: string;
  media: { key: string; type: string }[];
};

export const upsertProductReviewWorkflow = createWorkflow(
  "upsert-product-review-workflow",
  (input: WorkflowData<UpsertProductReviewWorkflowInput>) => {
    // Check if a review already exists for this email + product combination
    const { data: existingReviews } = useQueryGraphStep({
      entity: "product_review",
      fields: ["id", "status", "verified"],
      filters: {
        product_id: input.product_id,
        email: input.email,
      },
    }) as { data: ProductReview[] };

    // Transform media array from { key, type } to { url } format
    const reviewData = transform({ existingReviews, input }, (values) => {
      const images = values.input.media.map((m) => ({ url: m.key ,type: m.type}));
      const existingReview = values.existingReviews?.[0];

      if (existingReview) {
        // Update existing review
        return {
          action: "update" as const,
          data: {
            id: existingReview.id,
            title: values.input.title,
            rating: values.input.rating,
            content: values.input.content,
            status: "pending" as const, // Anonymous reviews start as pending
            images: images,
          },
        };
      } else {
        // Create new review
        return {
          action: "create" as const,
          data: {
            product_id: values.input.product_id,
            name: values.input.full_name,
            email: values.input.email,
            title: values.input.title,
            rating: values.input.rating,
            content: values.input.content,
            status: "pending" as const, // Anonymous reviews start as pending
            verified: false,
            images: images,
          },
        };
      }
    });

    const createData = transform({ reviewData }, ({ reviewData }) => {
      if (reviewData.action === "create") {
        return [reviewData.data];
      }
      return [];
    });

    const updateData = transform({ reviewData }, ({ reviewData }) => {
      if (reviewData.action === "update") {
        return [reviewData.data];
      }
      return [];
    });

    const createResult = when(reviewData, ({ action }) => action === "create").then(
      () =>
        createProductReviewsWorkflow.runAsStep({
          input: { productReviews: createData },
        })
    );

    const updateResult = when(reviewData, ({ action }) => action === "update").then(
      () =>
        updateProductReviewsWorkflow.runAsStep({
          input: { productReviews: updateData },
        })
    );

    const result = transform(
      { createResult, updateResult, reviewData },
      ({ createResult, updateResult, reviewData }) => {
        if (reviewData.action === "create") {
          return createResult?.[0];
        }
        return updateResult?.[0];
      }
    );

    return new WorkflowResponse(result as WorkflowData<ProductReview>);
  }
);


import { transform } from "@medusajs/framework/workflows-sdk";
import { WorkflowResponse } from "@medusajs/framework/workflows-sdk";
import { createWorkflow } from "@medusajs/framework/workflows-sdk";
import { useQueryGraphStep } from "@medusajs/medusa/core-flows";

import {
  GetWebhooksSubscriptionsInput,
  GetWebhooksSubscriptionsOutput,
} from "../types/workflow";
import { WebhookModel } from "../common";

export const getWebhooksSubscriptionsWorkflow = createWorkflow<
  GetWebhooksSubscriptionsInput,
  GetWebhooksSubscriptionsOutput,
  [{ eventName: string; eventData: Record<string, unknown> }]
>(
  "get-webhooks-subscriptions-workflow",
  (
    input
  ): WorkflowResponse<
    GetWebhooksSubscriptionsOutput,
    [{ eventName: string; eventData: Record<string, unknown> }]
  > => {
    const subscriptionsResult = useQueryGraphStep({
      entity: "webhooks",
      filters: {
        event_type: input.eventName,
        active: true,
      },
      fields: ["*"],
    });

    // Transform the query result to WebhookModel[] type
    const results = transform({ subscriptionsResult }, ({ subscriptionsResult }) => {
      // Extract data and cast to WebhookModel[] to handle type compatibility
      return (subscriptionsResult.data as unknown as WebhookModel[]) || [];
    });

    return new WorkflowResponse({ results });
  }
);

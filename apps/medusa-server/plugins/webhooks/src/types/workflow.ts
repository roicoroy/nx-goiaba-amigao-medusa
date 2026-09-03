import { WorkflowResponse } from "@medusajs/framework/workflows-sdk";
import { WebhookSendResponse } from "../modules/webhooks/service";
import { WebhookModel } from "../common";

export type GetWebhooksSubscriptionsInput = {
  eventName: string;
  eventData: Record<string, unknown>;
};

export type GetWebhooksSubscriptionsOutput = {
  results: WebhookModel[];
};

export type GetWebhooksSubscriptionsWorkflow = {
  input: GetWebhooksSubscriptionsInput;
  output: GetWebhooksSubscriptionsOutput;
};

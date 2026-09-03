import {
  SubscriberArgs,
  SubscriberConfig,
} from "@medusajs/framework/subscribers";
import {
  getWebhooksSubscriptionsWorkflow,
  sendWebhooksEventsWorkflow,
  fullWebhooksSubscriptionsWorkflow,
} from "@lambdacurry/medusa-webhooks/workflows";

export const config: SubscriberConfig = {
  event: ["product.created", "product.updated"],
  context: {
    subscriberId: "product-added",
  },
};

export default async function handleProductAdded({
  event: { name },
  container,
}: SubscriberArgs<{ id: string }>): Promise<void> {
  const query = container.resolve("query");
  const logger = container.resolve("logger");

  // Fetch product data
  const { data: productResult } = await query.graph({
    entity: "product",
    fields: ["*"],
  });

  const product = productResult[0];

  if (!product) {
    logger.error("Product not found");
    return;
  }

  // Option 1: Use the full workflow (recommended for most cases)
  const fullResult = await fullWebhooksSubscriptionsWorkflow(container).run({
    input: {
      eventName: name,
      eventData: product,
    },
  });

  // Option 2: Use separate workflows for more control
  const webhooksResult = await getWebhooksSubscriptionsWorkflow(
    container
  ).run({
    input: {
      eventName: name,
      eventData: product,
    },
  });

  const sendResult = await sendWebhooksEventsWorkflow(container).run({
    input: {
      webhooks: webhooksResult.result?.results || webhooksResult.result || [],
      eventData: product,
    },
  });

  console.log(fullResult);
  // or
  console.log(sendResult);
}
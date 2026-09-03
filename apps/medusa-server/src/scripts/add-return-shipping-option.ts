import { ExecArgs } from "@medusajs/framework/types";
import {
  ContainerRegistrationKeys,
  Modules,
} from "@medusajs/framework/utils";
import { createShippingOptionsWorkflow } from "@medusajs/medusa/core-flows";

/**
 * Data Migration Script: Add Return Shipping Option
 * 
 * This script adds a return shipping option if it doesn't already exist.
 * This fixes the "Cannot read properties of undefined (reading 'service_zone')" error
 * when creating returns.
 * 
 * Run with: yarn medusa exec ./src/scripts/add-return-shipping-option.ts
 */
export default async function addReturnShippingOption({ container }: ExecArgs) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER);
  const query = container.resolve(ContainerRegistrationKeys.QUERY);
  const fulfillmentModuleService = container.resolve(Modules.FULFILLMENT);

  logger.info("Checking for return shipping option...");

  // Check if return shipping option already exists
  const { data: existingReturnShippingOptions } = await query.graph({
    entity: "shipping_option",
    fields: ["id", "name", "type"],
    filters: {
      type: {
        code: "return",
      },
    },
  });

  if (existingReturnShippingOptions && existingReturnShippingOptions.length > 0) {
    logger.info("✅ Return shipping option already exists, skipping creation.");
    return;
  }

  logger.info("Return shipping option not found, creating it...");

  // Get the fulfillment set
  const fulfillmentSets = await fulfillmentModuleService.listFulfillmentSets({
    name: "European Warehouse delivery",
  });

  if (!fulfillmentSets || fulfillmentSets.length === 0) {
    logger.error("❌ Fulfillment set 'European Warehouse delivery' not found!");
    logger.info("Please run the seed script first to create the fulfillment set.");
    return;
  }

  const fulfillmentSet = fulfillmentSets[0];

  // Ensure service zones are loaded
  if (!fulfillmentSet.service_zones || fulfillmentSet.service_zones.length === 0) {
    const { data: fulfillmentSetWithZones } = await query.graph({
      entity: "fulfillment_set",
      fields: ["*", "service_zones.*"],
      filters: {
        id: fulfillmentSet.id,
      },
    });
    if (fulfillmentSetWithZones && fulfillmentSetWithZones.length > 0) {
      Object.assign(fulfillmentSet, fulfillmentSetWithZones[0]);
    }
  }

  if (!fulfillmentSet.service_zones || fulfillmentSet.service_zones.length === 0) {
    logger.error("❌ No service zones found in fulfillment set!");
    return;
  }

  // Get shipping profile
  const shippingProfiles = await fulfillmentModuleService.listShippingProfiles({
    type: "default",
  });

  if (!shippingProfiles || shippingProfiles.length === 0) {
    logger.error("❌ No default shipping profile found!");
    logger.info("Please run the seed script first to create the shipping profile.");
    return;
  }

  const shippingProfile = shippingProfiles[0];

  // Get region
  const { data: regions } = await query.graph({
    entity: "region",
    fields: ["id", "name"],
    filters: {
      name: "Europe",
    },
  });

  if (!regions || regions.length === 0) {
    logger.error("❌ Region 'Europe' not found!");
    logger.info("Please run the seed script first to create the region.");
    return;
  }

  const region = regions[0];

  // Create return shipping option
  try {
    await createShippingOptionsWorkflow(container).run({
      input: [
        {
          name: "Return Shipping",
          price_type: "flat",
          provider_id: "manual_manual",
          service_zone_id: fulfillmentSet.service_zones[0].id,
          shipping_profile_id: shippingProfile.id,
          type: {
            label: "Return",
            description: "Return shipping option.",
            code: "return",
          },
          prices: [
            {
              currency_code: "usd",
              amount: 0,
            },
            {
              currency_code: "eur",
              amount: 0,
            },
            {
              region_id: region.id,
              amount: 0,
            },
          ],
          rules: [
            {
              attribute: "enabled_in_store",
              value: "true",
              operator: "eq",
            },
            {
              attribute: "is_return",
              value: "true",
              operator: "eq",
            },
          ],
        },
      ],
    });

    logger.info("✅ Return shipping option created successfully!");
  } catch (error: any) {
    logger.error("❌ Error creating return shipping option:", error.message);
    throw error;
  }
}


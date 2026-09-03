import { createWorkflow, WorkflowResponse } from "@medusajs/framework/workflows-sdk"
import { useQueryGraphStep } from "@medusajs/medusa/core-flows"
import { validateWishlistSalesChannelStep } from "./steps/validate-wishlist-sales-channel"
import { createWishlistItemStep } from "./steps/create-wishlist-item"
import { validateVariantWishlistStep } from "./steps/validate-variant-wishlist"
import { getOrCreateWishlistStep } from "./steps/get-or-create-wishlist"

type CreateWishlistItemWorkflowInput = {
  variant_id: string
  customer_id: string
  sales_channel_id: string
}

export const createWishlistItemWorkflow = createWorkflow(
  "create-wishlist-item",
  (input: CreateWishlistItemWorkflowInput) => {
    // Get or create wishlist for the customer
    const wishlist = getOrCreateWishlistStep({
      customer_id: input.customer_id,
      sales_channel_id: input.sales_channel_id
    })

    validateWishlistSalesChannelStep({
      wishlist: wishlist,
      sales_channel_id: input.sales_channel_id
    })

    validateVariantWishlistStep({
      variant_id: input.variant_id,
      sales_channel_id: input.sales_channel_id,
      wishlist: wishlist
    })

    createWishlistItemStep({
      product_variant_id: input.variant_id,
      wishlist_id: wishlist.id
    })

    // refetch wishlist
    const { data: updatedWishlists } = useQueryGraphStep({
      entity: "wishlist",
      fields: ["*", "items.*", "items.product_variant.*"],
      filters: {
        id: wishlist.id
      },
    }).config({ name: "refetch-wishlist" })

    return new WorkflowResponse({
      wishlist: updatedWishlists[0] as any,
    })
  }
)
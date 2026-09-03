import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { WISHLIST_MODULE } from "../../modules/wishlist"
import WishlistModuleService from "../../modules/wishlist/service"

type GetOrCreateWishlistStepInput = {
  customer_id: string
  sales_channel_id: string
}

export const getOrCreateWishlistStep = createStep(
  "get-or-create-wishlist",
  async (input: GetOrCreateWishlistStepInput, { container }) => {
    const query: any = container.resolve(ContainerRegistrationKeys.QUERY)
    const wishlistModuleService: WishlistModuleService = 
      container.resolve(WISHLIST_MODULE)

    // Try to get existing wishlist
    const { data: wishlists } = await query.graph({
      entity: "wishlist",
      fields: ["*", "items.*"],
      filters: {
        customer_id: input.customer_id,
        sales_channel_id: input.sales_channel_id,
      },
    })

    if (wishlists?.length > 0) {
      return new StepResponse(wishlists[0], wishlists[0].id)
    }

    // Create new wishlist if it doesn't exist
    const wishlist = await wishlistModuleService.createWishlists({
      customer_id: input.customer_id,
      sales_channel_id: input.sales_channel_id,
    })

    // Fetch the created wishlist with items
    const { data: createdWishlists } = await query.graph({
      entity: "wishlist",
      fields: ["*", "items.*"],
      filters: {
        id: wishlist.id,
      },
    })

    return new StepResponse(createdWishlists[0] || wishlist, wishlist.id)
  },
  async (id, { container }) => {
    if (!id) {
      return
    }
    const wishlistModuleService: WishlistModuleService = 
      container.resolve(WISHLIST_MODULE)

    await wishlistModuleService.deleteWishlists(id)
  }
)


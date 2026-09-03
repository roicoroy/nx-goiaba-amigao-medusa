import { MedusaResponse, MedusaStoreRequest } from "@medusajs/framework";
import { MedusaError } from "@medusajs/framework/utils";
import { decode, JwtPayload } from "jsonwebtoken"

export async function GET(
  req: MedusaStoreRequest,
  res: MedusaResponse
) {
  if (!req.publishable_key_context?.sales_channel_ids.length) {
    throw new MedusaError(
      MedusaError.Types.INVALID_DATA,
      "At least one sales channel ID is required to be associated with the publishable API key in the request header."
    )
  }

  const decodedToken = decode(req.params.token) as JwtPayload

  if (!decodedToken.wishlist_id) {
    throw new MedusaError(
      MedusaError.Types.INVALID_DATA,
      "Invalid token"
    )
  }

  const query = req.scope.resolve("query")

  // First get the wishlist with basic product info
  const { data } = await query.graph({
    entity: "wishlist",
    fields: [
      "*",
      "items.*",
      "items.product_variant.*"
    ],
    filters: {
      id: decodedToken.wishlist_id
    }
  })

  if (!data.length) {
    throw new MedusaError(
      MedusaError.Types.NOT_FOUND,
      "No wishlist found"
    )
  }

  const wishlist = data[0]

  if (wishlist.sales_channel_id !== req.publishable_key_context.sales_channel_ids[0]) {
    throw new MedusaError(
      MedusaError.Types.INVALID_DATA,
      "Wishlist does not belong to the request's sales channel"
    )
  }

  // If there are items, fetch the full product details
  if (wishlist.items?.length > 0) {
    const productIds = wishlist.items
      .filter(item => item && item.product_variant && item.product_variant.product_id)
      .map(item => item!.product_variant!.product_id!)

    console.log("Shared product IDs to fetch:", productIds)

    // Fetch full product details including images
    const { data: products } = await query.graph({
      entity: "product",
      fields: [
        "*",
        "images.*"
      ],
      filters: {
        id: productIds as string[]
      }
    })

    console.log("Shared products fetched:", products.length)
    console.log("Shared products with images:", JSON.stringify(products, null, 2))

    // Map products to wishlist items
    const productsMap = products.reduce((acc, product) => {
      acc[product.id] = product
      return acc
    }, {})

    console.log("Shared products map keys:", Object.keys(productsMap))

    // Enhance wishlist items with full product data
    wishlist.items = wishlist.items.map(item => {
      if (!item || !item.product_variant || !item.product_variant.product_id) {
        return item
      }
      
      const fullProduct = productsMap[item.product_variant.product_id]
      console.log(`Shared mapping product ${item.product_variant.product_id}:`, fullProduct ? "found" : "not found")

      return {
        ...item,
        product_variant: {
          ...item.product_variant,
          product: fullProduct || { id: item.product_variant.product_id }
        }
      }
    }) as any
  }

  res.json({
    wishlist
  })
}
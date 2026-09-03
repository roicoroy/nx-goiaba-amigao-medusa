import { AuthenticatedMedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { createWishlistWorkflow } from "../../../../../workflows/create-wishlist";
import { MedusaError } from "@medusajs/framework/utils";

export async function POST(
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) {
  if (!req.publishable_key_context?.sales_channel_ids.length) {
    throw new MedusaError(
      MedusaError.Types.INVALID_DATA,
      "At least one sales channel ID is required to be associated with the publishable API key in the request header."
    )
  }
  const { result } = await createWishlistWorkflow(req.scope)
    .run({
      input: {
        customer_id: req.auth_context.actor_id,
        sales_channel_id: req.publishable_key_context?.sales_channel_ids[0]
      }
    })

  res.json({
    wishlist: result.wishlist
  })
}

export async function GET(
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) {
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
      customer_id: req.auth_context.actor_id
    }
  })

  if (!data.length) {
    throw new MedusaError(
      MedusaError.Types.NOT_FOUND,
      "No wishlist found for customer"
    )
  }

  const wishlist = data[0]

  // If there are items, fetch the full product details using a different approach
  if (wishlist.items?.length > 0) {
    const productIds = [...new Set(wishlist.items
      .filter(item => item && item.product_variant && item.product_variant.product_id)
      .map(item => item!.product_variant!.product_id!))]

    try {
      // Fetch full product details including images
      const { data: products } = await query.graph({
        entity: "product",
        fields: [
          "id",
          "title",
          "subtitle",
          "description",
          "handle",
          "thumbnail",
          "is_giftcard",
          "discountable",
          "collection_id",
          "type_id",
          "weight",
          "length",
          "height",
          "width",
          "hs_code",
          "origin_country",
          "mid_code",
          "material",
          "created_at",
          "updated_at",
          "images.id",
          "images.url",
          "images.metadata",
          "images.rank",
          "images.product_id",
          "images.created_at",
          "images.updated_at",
          "images.deleted_at"
        ],
        filters: { id: productIds as string[] }
      })



      // Map products to wishlist items
      const productsMap = products.reduce((acc, product) => {
        acc[product.id] = product
        return acc
      }, {})

      // Enhance wishlist items with full product data
      wishlist.items = wishlist.items.map(item => {
        if (!item || !item.product_variant || !item.product_variant.product_id) {
          console.warn("Wishlist item missing product_variant or product_id:", item)
          return item
        }

        const fullProduct = productsMap[item.product_variant.product_id]

        return {
          ...item,
          product_variant: {
            ...item.product_variant,
            product: fullProduct || { id: item.product_variant.product_id }
          }
        }
      }) as any
    } catch (error) {
      console.error("Error fetching products:", error)
      // Fallback: try the graph query approach
      try {
        const { data: products } = await query.graph({
          entity: "product",
          fields: ["*", "images.*"],
          filters: { id: productIds as string[] }
        })

        console.log("Fallback products:", products.length)

        const productsMap = products.reduce((acc, product) => {
          acc[product.id] = product
          return acc
        }, {})

        wishlist.items = wishlist.items.map(item => {
          if (!item || !item.product_variant || !item.product_variant.product_id) {
            console.warn("Fallback: Wishlist item missing product_variant or product_id:", item)
            return item
          }

          return {
            ...item,
            product_variant: {
              ...item.product_variant,
              product: productsMap[item.product_variant.product_id] || { id: item.product_variant.product_id }
            }
          }
        }) as any
      } catch (fallbackError) {
        console.error("Fallback also failed:", fallbackError)
      }
    }
  }

  return res.json({
    wishlist
  })
}
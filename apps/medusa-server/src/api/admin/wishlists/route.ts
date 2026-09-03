import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"

// GET /admin/wishlists - Get all customer wishlists (not admin wishlists)
export async function GET(req: MedusaRequest, res: MedusaResponse) {
  try {
    const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
    const { limit = 50, offset = 0 } = req.query

    // Query all customers with their wishlists (no filters = all customers)
    // This returns wishlists created by customers, not the logged-in admin
    const { data: customers } = await query.graph({
      entity: "customer",
      fields: [
        "id",
        "email",
        "first_name",
        "last_name",
        "wishlist.id",
        "wishlist.created_at",
        "wishlist.updated_at",
        "wishlist.items.id",
        "wishlist.items.product_id",
        "wishlist.items.product_variant_id",
        "wishlist.items.quantity",
      ],
      // No filters - this gets ALL customers, not just the admin
      pagination: {
        take: Number(limit),
        skip: Number(offset),
      },
    })

    // Filter customers who have wishlists and format the data
    // This ensures we only show wishlists created by customers
    const wishlists = customers
      .filter((customer: any) => customer.wishlist)
      .map((customer: any) => {
        const wishlist = customer.wishlist
        const items = wishlist.items || []
        
        return {
          id: wishlist.id,
          customer_id: customer.id,
          customer_email: customer.email || "N/A",
          customer_name: customer.first_name || customer.last_name 
            ? `${customer.first_name || ""} ${customer.last_name || ""}`.trim()
            : "N/A",
          items_count: items.length,
          created_at: wishlist.created_at,
          updated_at: wishlist.updated_at,
          items: items.map((item: any) => ({
            id: item.id,
            product_id: item.product_id,
            product_variant_id: item.product_variant_id,
            quantity: item.quantity,
          })),
        }
      })

    res.json({
      success: true,
      data: {
        wishlists,
        count: wishlists.length,
      },
    })
  } catch (error: any) {
    console.error("Error fetching wishlists:", error)
    res.status(500).json({
      success: false,
      error: error.message || "Failed to fetch wishlists",
    })
  }
}


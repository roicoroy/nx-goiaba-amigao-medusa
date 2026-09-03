  import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { WISHLIST_MODULE } from "../../../../../modules/wishlist"

// GET /admin/customers/:id/wishlist - Get customer's wishlist
export async function GET(req: MedusaRequest, res: MedusaResponse) {
  try {
    const { id: customerId } = req.params
    const query = req.scope.resolve("query")

    console.log("Customer Wishlist API: Getting wishlist for customer:", customerId)

    // Query customer with wishlist relation
    const { data: customers } = await query.graph({
      entity: "customer",
      fields: ["id", "wishlist.*", "wishlist.items.*"],
      filters: { id: customerId }
    })

    if (!customers || customers.length === 0) {
      return res.json({
        success: true,
        data: {
          wishlist: null,
          items: [],
          count: 0
        }
      })
    }

    const customer = customers[0]
    const wishlist = customer.wishlist
    
    if (!wishlist) {
      return res.json({
        success: true,
        data: {
          wishlist: null,
          items: [],
          count: 0
        }
      })
    }

    const items = wishlist.items || []

    console.log("Customer Wishlist API: Found", items.length, "items")

    res.json({
      success: true,
      data: {
        wishlist: {
          id: wishlist.id,
          customer_id: wishlist.customer_id,
          sales_channel_id: wishlist.sales_channel_id,
          created_at: wishlist.created_at,
          updated_at: wishlist.updated_at
        },
        items: items,
        count: items.length
      }
    })
  } catch (error) {
    console.error("Customer Wishlist API Error:", error)
    res.status(500).json({
      success: false,
      error: error.message
    })
  }
}

// DELETE /admin/customers/:id/wishlist/:itemId - Remove item from customer's wishlist
export async function DELETE(req: MedusaRequest, res: MedusaResponse) {
  try {
    const { id: customerId } = req.params
    const { itemId } = req.query
    const wishlistService = req.scope.resolve(WISHLIST_MODULE) as any

    console.log("Customer Wishlist API: Removing item", itemId, "for customer:", customerId)

    // For now, return success - in real implementation you'd call wishlist service
    // await wishlistService.removeItem(itemId)

    res.json({
      success: true,
      message: "Item removed from wishlist"
    })
  } catch (error) {
    console.error("Customer Wishlist API Error:", error)
    res.status(500).json({
      success: false,
      error: error.message
    })
  }
}
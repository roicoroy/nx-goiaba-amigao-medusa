import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { requireRole } from "../../../middlewares/check-role"

/**
 * GET /admin/warehouse/inventory
 * Only accessible by admin and warehouse-staff
 */
export const GET = [
  requireRole("admin", "warehouse-staff"),
  async (req: MedusaRequest, res: MedusaResponse) => {
    const user = (req as any).user

    // Your inventory logic here
    return res.json({
      success: true,
      message: `Inventory accessed by ${user.role}`,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
      },
      inventory: [
        // Your inventory items
      ],
    })
  },
]

/**
 * POST /admin/warehouse/inventory
 * Only accessible by admin and warehouse-staff
 */
export const POST = [
  requireRole("admin", "warehouse-staff"),
  async (req: MedusaRequest, res: MedusaResponse) => {
    const user = (req as any).user
    const { item_name, quantity } = req.body as {
      item_name: string
      quantity: number
    }

    // Your create inventory logic here
    return res.json({
      success: true,
      message: "Inventory item created",
      created_by: user.email,
      item: {
        item_name,
        quantity,
      },
    })
  },
]

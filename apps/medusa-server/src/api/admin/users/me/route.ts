import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { Modules } from "@medusajs/framework/utils"
import { Client } from "pg"

// GET /admin/users/me - Get current admin user profile
export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
  })

  try {
    const userId = 
      (req as any).auth_context?.actor_id || 
      (req as any).user?.id ||
      (req as any).auth?.actor_id

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      })
    }

    await client.connect()

    // Check which extended columns exist
    const columnCheck = await client.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'user' 
      AND column_name IN ('avatar_url', 'phone', 'role', 'metadata')
    `)
    
    const existingColumns = columnCheck.rows.map(row => row.column_name)
    
    // Build SELECT clause with only existing columns
    const baseColumns = ['id', 'email', 'first_name', 'last_name', 'created_at', 'updated_at', 'deleted_at']
    const extendedColumns = ['avatar_url', 'phone', 'role', 'metadata'].filter(col => existingColumns.includes(col))
    const allColumns = [...baseColumns, ...extendedColumns].join(', ')

    // Query user with available fields
    const result = await client.query(
      `SELECT ${allColumns}
      FROM "user"
      WHERE id = $1 AND deleted_at IS NULL`,
      [userId]
    )

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      })
    }

    return res.status(200).json({
      success: true,
      user: result.rows[0],
    })
  } catch (error: any) {
    console.error("Error fetching user profile:", error)
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch user profile",
    })
  } finally {
    await client.end()
  }
}

// PATCH /admin/users/me - Update current admin user profile
export async function PATCH(req: MedusaRequest, res: MedusaResponse) {
  try {
    const userId = 
      (req as any).auth_context?.actor_id || 
      (req as any).user?.id ||
      (req as any).auth?.actor_id

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      })
    }

    const { first_name, last_name, phone, avatar_url, metadata, role } = req.body as {
      first_name?: string
      last_name?: string
      phone?: string
      avatar_url?: string
      metadata?: Record<string, any>
      role?: string
    }

    // Build update object with only provided fields
    const updateData: any = { id: userId }
    if (first_name !== undefined) updateData.first_name = first_name
    if (last_name !== undefined) updateData.last_name = last_name
    if (phone !== undefined) updateData.phone = phone
    if (avatar_url !== undefined) updateData.avatar_url = avatar_url
    if (metadata !== undefined) updateData.metadata = metadata
    if (role !== undefined) updateData.role = role

    if (Object.keys(updateData).length === 1) {
      return res.status(400).json({
        success: false,
        message: "No fields to update",
      })
    }

    const userModuleService = req.scope.resolve(Modules.USER)

    // Update user - updateUsers expects an array
    await userModuleService.updateUsers([updateData])

    // Fetch updated user with all fields
    const fetchClient = new Client({
      connectionString: process.env.DATABASE_URL,
    })
    
    await fetchClient.connect()
    
    // Check which extended columns exist
    const columnCheck = await fetchClient.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'user' 
      AND column_name IN ('avatar_url', 'phone', 'role', 'metadata')
    `)
    
    const existingColumns = columnCheck.rows.map(row => row.column_name)
    const baseColumns = ['id', 'email', 'first_name', 'last_name', 'created_at', 'updated_at', 'deleted_at']
    const extendedColumns = ['avatar_url', 'phone', 'role', 'metadata'].filter(col => existingColumns.includes(col))
    const allColumns = [...baseColumns, ...extendedColumns].join(', ')
    
    const result = await fetchClient.query(
      `SELECT ${allColumns}
      FROM "user"
      WHERE id = $1 AND deleted_at IS NULL`,
      [userId]
    )
    
    await fetchClient.end()

    const updatedUser = result.rows[0]

    return res.status(200).json({
      success: true,
      user: updatedUser,
      message: "Profile updated successfully",
    })
  } catch (error: any) {
    console.error("Error updating user profile:", error)
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to update user profile",
    })
  }
}

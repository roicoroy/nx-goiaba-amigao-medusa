import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { Modules } from "@medusajs/framework/utils"
import { Client } from "pg"

/**
 * GET /admin/users/:id - Get a specific user with extended fields
 */
export const GET = async (req: MedusaRequest, res: MedusaResponse) => {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
  })

  try {
    const userId = req.params.id

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: "User ID is required",
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
    console.error("Error fetching user:", error)
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch user",
    })
  } finally {
    await client.end()
  }
}

/**
 * PATCH /admin/users/:id - Update a specific user's extended fields
 */
export const PATCH = async (req: MedusaRequest, res: MedusaResponse) => {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
  })

  try {
    const userId = req.params.id
    const { phone, role } = req.body as { phone?: string; role?: string }

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: "User ID is required",
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

    // Build update query dynamically based on provided fields and existing columns
    const updates: string[] = []
    const values: any[] = []
    let paramCount = 1

    if (phone !== undefined && existingColumns.includes('phone')) {
      updates.push(`phone = $${paramCount}`)
      values.push(phone)
      paramCount++
    }

    if (role !== undefined && existingColumns.includes('role')) {
      updates.push(`role = $${paramCount}`)
      values.push(role)
      paramCount++
    }

    if (updates.length === 0) {
      return res.status(400).json({
        success: false,
        message: "No fields to update or columns don't exist",
      })
    }

    // Add updated_at
    updates.push(`updated_at = NOW()`)
    values.push(userId)

    // Build RETURNING clause with only existing columns
    const baseColumns = ['id', 'email', 'first_name', 'last_name', 'created_at', 'updated_at']
    const extendedColumns = ['avatar_url', 'phone', 'role', 'metadata'].filter(col => existingColumns.includes(col))
    const returningColumns = [...baseColumns, ...extendedColumns].join(', ')

    const query = `
      UPDATE "user"
      SET ${updates.join(", ")}
      WHERE id = $${paramCount} AND deleted_at IS NULL
      RETURNING ${returningColumns}
    `

    const result = await client.query(query, values)

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      })
    }

    return res.status(200).json({
      success: true,
      user: result.rows[0],
      message: "User updated successfully",
    })
  } catch (error: any) {
    console.error("Error updating user:", error)
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to update user",
    })
  } finally {
    await client.end()
  }
}

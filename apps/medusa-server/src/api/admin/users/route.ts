import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { Modules } from "@medusajs/framework/utils"
import { isValidRole } from "../../../utils/roles"
import bcrypt from "bcrypt"
import { Client } from "pg"

/**
 * GET /admin/users - List all users with extended fields
 */
export const GET = async (req: MedusaRequest, res: MedusaResponse) => {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
  })

  try {
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

    const result = await client.query(`
      SELECT ${allColumns}
      FROM "user"
      WHERE deleted_at IS NULL
      ORDER BY created_at DESC
    `)

    return res.status(200).json({
      success: true,
      users: result.rows,
      count: result.rows.length,
    })
  } catch (error: any) {
    console.error("Error fetching users:", error)
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch users",
    })
  } finally {
    await client.end()
  }
}

/**
 * POST /admin/users - Create a new admin user with role
 * Only admins can create users
 */
export const POST = async (req: MedusaRequest, res: MedusaResponse) => {
    try {
      const {
        email,
        password,
        first_name,
        last_name,
        role = "admin",
        phone,
        metadata,
      } = req.body as {
        email: string
        password: string
        first_name: string
        last_name: string
        role?: string
        phone?: string
        metadata?: Record<string, any>
      }

      // Validate required fields
      if (!email || !password || !first_name || !last_name) {
        return res.status(400).json({
          success: false,
          message: "Missing required fields",
          errors: {
            email: !email ? "Email is required" : undefined,
            password: !password ? "Password is required" : undefined,
            first_name: !first_name ? "First name is required" : undefined,
            last_name: !last_name ? "Last name is required" : undefined,
          },
        })
      }

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(email)) {
        return res.status(400).json({
          success: false,
          message: "Invalid email format",
          errors: {
            email: "Please provide a valid email address",
          },
        })
      }

      // Validate password strength
      if (password.length < 8) {
        return res.status(400).json({
          success: false,
          message: "Password too weak",
          errors: {
            password: "Password must be at least 8 characters long",
          },
        })
      }

      // Validate role
      if (!isValidRole(role)) {
        return res.status(400).json({
          success: false,
          message: "Invalid role",
          errors: {
            role: `Role must be one of: admin, manager, warehouse-staff, driver`,
          },
        })
      }

      // Hash password with bcrypt (10 salt rounds as per design spec)
      const saltRounds = 10
      const hashedPassword = await bcrypt.hash(password, saltRounds)

      const authModuleService = req.scope.resolve(Modules.AUTH)
      const userModuleService = req.scope.resolve(Modules.USER)

      // Check if email already exists
      try {
        const existingUsers = await userModuleService.listUsers({
          email: email.toLowerCase().trim(),
        })

        if (existingUsers && existingUsers.length > 0) {
          return res.status(409).json({
            success: false,
            message: "Email already exists",
            errors: {
              email: "This email is already registered",
            },
          })
        }
      } catch (error) {
        // If error checking existing users, continue (might be first user)
        console.log("Could not check existing users:", error)
      }

      // Step 1: Create user in user module with basic fields
      const [createdUser] = await userModuleService.createUsers([
        {
          email: email.toLowerCase().trim(),
          first_name,
          last_name,
        },
      ])

      // Step 1.5: Update user with extended fields (role, phone, metadata)
      // These fields are added via migration but not in the base Medusa types
      const updateData: any = {
        id: createdUser.id,
        role,
        phone: phone || null,
        metadata: metadata || {},
      }
      await userModuleService.updateUsers([updateData])

      // Step 2: Register auth identity with hashed password
      // Password is already hashed with bcrypt above
      try {
        const authResult = await authModuleService.register("emailpass", {
          body: {
            email: email.toLowerCase().trim(),
            password: hashedPassword,
          },
        } as any)

        if (!authResult.authIdentity) {
          // Rollback: delete the user if auth creation fails
          await userModuleService.deleteUsers([createdUser.id])
          throw new Error("Failed to create auth identity")
        }

        // Step 3: Link auth identity to user
        await authModuleService.updateAuthIdentities([
          {
            id: authResult.authIdentity.id,
            app_metadata: {
              user_id: createdUser.id,
            },
          },
        ])
      } catch (authError: any) {
        // Rollback: delete the user if auth setup fails
        try {
          await userModuleService.deleteUsers([createdUser.id])
        } catch (rollbackError) {
          console.error("Failed to rollback user creation:", rollbackError)
        }

        console.error("Auth creation error:", authError)
        return res.status(500).json({
          success: false,
          message: "Failed to create user authentication",
          error: authError.message,
        })
      }

      // Fetch the updated user to ensure we return all fields including role and phone
      const [updatedUser] = await userModuleService.listUsers({
        id: createdUser.id,
      })

      // Return success response with complete user data
      return res.status(201).json({
        success: true,
        user: {
          id: updatedUser.id,
          email: updatedUser.email,
          first_name: updatedUser.first_name,
          last_name: updatedUser.last_name,
          role: (updatedUser as any).role || role,
          phone: (updatedUser as any).phone || phone,
          created_at: updatedUser.created_at,
        },
        message: "User created successfully",
      })
    } catch (error: any) {
      console.error("Error creating user:", error)
      return res.status(500).json({
        success: false,
        message: error.message || "Failed to create user",
      })
    }
  }

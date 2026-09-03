import {
  MedusaRequest,
  MedusaResponse,
  MedusaNextFunction,
} from "@medusajs/framework/http"
import { Modules } from "@medusajs/framework/utils"

/**
 * Middleware to check if user has one of the required roles
 * Usage: requireRole('admin', 'manager')
 */
export function requireRole(...allowedRoles: string[]) {
  return async (
    req: MedusaRequest,
    res: MedusaResponse,
    next: MedusaNextFunction
  ) => {
    // Allow OPTIONS requests (CORS preflight) to pass through
    if (req.method === "OPTIONS") {
      return next()
    }

    try {
      const userId = (req as any).auth_context?.actor_id

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: "Authentication required",
        })
      }

      const userModuleService = req.scope.resolve(Modules.USER)

      const user = await userModuleService.retrieveUser(userId) as any

      if (!user) {
        return res.status(404).json({
          success: false,
          message: "User not found",
        })
      }

      // Check if user has one of the allowed roles
      if (!user.role || !allowedRoles.includes(user.role)) {
        return res.status(403).json({
          success: false,
          message: "Insufficient permissions",
          required_roles: allowedRoles,
          your_role: user.role,
        })
      }

      // Attach user info to request for use in handlers
      ;(req as any).user = user

      next()
    } catch (error: any) {
      console.error("Role check error:", error)
      return res.status(500).json({
        success: false,
        message: "Failed to verify permissions",
      })
    }
  }
}

/**
 * Role hierarchy levels
 * Higher number = more permissions
 */
const ROLE_LEVELS = {
  admin: 100,
  manager: 75,
  "warehouse-staff": 50,
  driver: 25,
}

/**
 * Check if user's role has sufficient level
 * Usage: requireMinimumRole('warehouse-staff')
 * This allows warehouse-staff, manager, and admin
 */
export function requireMinimumRole(minimumRole: string) {
  return async (
    req: MedusaRequest,
    res: MedusaResponse,
    next: MedusaNextFunction
  ) => {
    // Allow OPTIONS requests (CORS preflight) to pass through
    if (req.method === "OPTIONS") {
      return next()
    }

    try {
      const userId = (req as any).auth_context?.actor_id

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: "Authentication required",
        })
      }

      const userModuleService = req.scope.resolve(Modules.USER)

      const user = await userModuleService.retrieveUser(userId) as any

      if (!user) {
        return res.status(404).json({
          success: false,
          message: "User not found",
        })
      }

      const userLevel = ROLE_LEVELS[user.role || ""] || 0
      const requiredLevel = ROLE_LEVELS[minimumRole] || 0

      if (userLevel < requiredLevel) {
        return res.status(403).json({
          success: false,
          message: "Insufficient permissions",
          minimum_role: minimumRole,
          your_role: user.role,
        })
      }

      ;(req as any).user = user

      next()
    } catch (error: any) {
      console.error("Role check error:", error)
      return res.status(500).json({
        success: false,
        message: "Failed to verify permissions",
      })
    }
  }
}

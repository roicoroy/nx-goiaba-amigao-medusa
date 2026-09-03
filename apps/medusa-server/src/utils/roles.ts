/**
 * Role definitions and utilities
 */

export const ROLES = {
  ADMIN: "admin",
  MANAGER: "manager",
  WAREHOUSE_STAFF: "warehouse-staff",
  DRIVER: "driver",
} as const

export type UserRole = (typeof ROLES)[keyof typeof ROLES]

/**
 * Role hierarchy - higher number = more permissions
 */
export const ROLE_LEVELS: Record<string, number> = {
  [ROLES.ADMIN]: 100,
  [ROLES.MANAGER]: 75,
  [ROLES.WAREHOUSE_STAFF]: 50,
  [ROLES.DRIVER]: 25,
}

/**
 * Check if a user's role has sufficient level
 */
export function hasMinimumRole(
  userRole: string,
  minimumRole: string
): boolean {
  const userLevel = ROLE_LEVELS[userRole] || 0
  const requiredLevel = ROLE_LEVELS[minimumRole] || 0
  return userLevel >= requiredLevel
}

/**
 * Check if user has one of the specified roles
 */
export function hasRole(userRole: string, allowedRoles: string[]): boolean {
  return allowedRoles.includes(userRole)
}

/**
 * Get role display name
 */
export function getRoleDisplayName(role: string): string {
  const displayNames: Record<string, string> = {
    [ROLES.ADMIN]: "Administrator",
    [ROLES.MANAGER]: "Manager",
    [ROLES.WAREHOUSE_STAFF]: "Warehouse Staff",
    [ROLES.DRIVER]: "Delivery Driver",
  }
  return displayNames[role] || role
}

/**
 * Get permissions for a role
 */
export function getRolePermissions(role: string): string[] {
  const permissions: Record<string, string[]> = {
    [ROLES.ADMIN]: [
      "manage_users",
      "manage_orders",
      "manage_inventory",
      "manage_deliveries",
      "view_reports",
      "manage_settings",
    ],
    [ROLES.MANAGER]: [
      "manage_orders",
      "manage_inventory",
      "manage_deliveries",
      "view_reports",
      "assign_drivers",
    ],
    [ROLES.WAREHOUSE_STAFF]: [
      "view_orders",
      "manage_inventory",
      "update_order_status",
    ],
    [ROLES.DRIVER]: [
      "view_assigned_deliveries",
      "update_delivery_status",
      "view_delivery_details",
    ],
  }
  return permissions[role] || []
}

/**
 * Check if role has specific permission
 */
export function hasPermission(role: string, permission: string): boolean {
  const permissions = getRolePermissions(role)
  return permissions.includes(permission)
}

/**
 * Validate if a role is valid
 */
export function isValidRole(role: string): boolean {
  return Object.values(ROLES).includes(role as UserRole)
}

/**
 * Get all available roles
 */
export function getAllRoles(): UserRole[] {
  return Object.values(ROLES)
}

import { doc, updateDoc, arrayUnion, arrayRemove, serverTimestamp } from "firebase/firestore"
import { db } from "@/lib/firebase"

export type RoleType = "admin" | "sales" | "logistics" | "cms"

export interface Permission {
  module: string
  actions: string[]
}

export interface Role {
  id: RoleType
  name: string
  description: string
  color: string
  permissions: Permission[]
}

// Hardcoded roles with their permissions
const ROLES: Role[] = [
  {
    id: "admin",
    name: "Admin",
    description: "Full system access and user management",
    color: "#dc2626",
    permissions: [
      { module: "admin", actions: ["read", "write", "delete"] },
      { module: "sales", actions: ["read", "write", "delete"] },
      { module: "logistics", actions: ["read", "write", "delete"] },
      { module: "cms", actions: ["read", "write", "delete"] },
      { module: "user-management", actions: ["read", "write", "delete"] },
      { module: "system-settings", actions: ["read", "write"] },
    ],
  },
  {
    id: "sales",
    name: "Sales",
    description: "Sales operations and client management",
    color: "#059669",
    permissions: [
      { module: "sales", actions: ["read", "write"] },
      { module: "clients", actions: ["read", "write"] },
      { module: "proposals", actions: ["read", "write"] },
      { module: "quotations", actions: ["read", "write"] },
      { module: "bookings", actions: ["read", "write"] },
    ],
  },
  {
    id: "logistics",
    name: "Logistics",
    description: "Site management and logistics operations",
    color: "#2563eb",
    permissions: [
      { module: "logistics", actions: ["read", "write"] },
      { module: "sites", actions: ["read", "write"] },
      { module: "assignments", actions: ["read", "write"] },
      { module: "reports", actions: ["read", "write"] },
      { module: "alerts", actions: ["read", "write"] },
    ],
  },
  {
    id: "cms",
    name: "Content/CMS",
    description: "Content creation and media management",
    color: "#7c3aed",
    permissions: [
      { module: "cms", actions: ["read", "write"] },
      { module: "content", actions: ["read", "write"] },
      { module: "media", actions: ["read", "write"] },
      { module: "planner", actions: ["read", "write"] },
    ],
  },
]

// Get all available roles
export function getAllRoles(): Role[] {
  return ROLES
}

// Get a specific role by ID
export function getRole(roleId: RoleType): Role | undefined {
  return ROLES.find((role) => role.id === roleId)
}

// Check if a role has permission for a specific module and action
export function hasPermission(roleId: RoleType, module: string, action = "read"): boolean {
  const role = getRole(roleId)
  if (!role) return false

  const permission = role.permissions.find((p) => p.module === module)
  return permission ? permission.actions.includes(action) : false
}

// Check if user has multiple roles and any of them has the required permission
export function hasAnyRolePermission(userRoles: RoleType[], module: string, action = "read"): boolean {
  return userRoles.some((roleId) => hasPermission(roleId, module, action))
}

// Get all permissions for a role
export function getRolePermissions(roleId: RoleType): Permission[] {
  const role = getRole(roleId)
  return role ? role.permissions : []
}

// Get all modules a role has access to
export function getRoleModules(roleId: RoleType): string[] {
  const permissions = getRolePermissions(roleId)
  return permissions.map((p) => p.module)
}

// Assign a role to a user (updates Firestore)
export async function assignRoleToUser(userId: string, roleId: RoleType, assignedBy: string): Promise<void> {
  try {
    const userDocRef = doc(db, "iboard_users", userId)

    // Update user document with the new role
    await updateDoc(userDocRef, {
      roles: arrayUnion(roleId),
      updated: serverTimestamp(),
      role_updated_by: assignedBy,
      role_updated_at: serverTimestamp(),
    })

    console.log(`Role ${roleId} assigned to user ${userId}`)
  } catch (error) {
    console.error("Error assigning role to user:", error)
    throw error
  }
}

// Remove a role from a user
export async function removeRoleFromUser(userId: string, roleId: RoleType, removedBy: string): Promise<void> {
  try {
    const userDocRef = doc(db, "iboard_users", userId)

    await updateDoc(userDocRef, {
      roles: arrayRemove(roleId),
      updated: serverTimestamp(),
      role_updated_by: removedBy,
      role_updated_at: serverTimestamp(),
    })

    console.log(`Role ${roleId} removed from user ${userId}`)
  } catch (error) {
    console.error("Error removing role from user:", error)
    throw error
  }
}

// Get user's effective permissions (combination of all their roles)
export function getUserEffectivePermissions(userRoles: RoleType[]): Permission[] {
  const allPermissions: Permission[] = []
  const moduleMap = new Map<string, Set<string>>()

  userRoles.forEach((roleId) => {
    const rolePermissions = getRolePermissions(roleId)
    rolePermissions.forEach((permission) => {
      if (!moduleMap.has(permission.module)) {
        moduleMap.set(permission.module, new Set())
      }
      permission.actions.forEach((action) => {
        moduleMap.get(permission.module)?.add(action)
      })
    })
  })

  moduleMap.forEach((actions, module) => {
    allPermissions.push({
      module,
      actions: Array.from(actions),
    })
  })

  return allPermissions
}

// Check if user can access a specific route/module
export function canAccessModule(userRoles: RoleType[], module: string): boolean {
  return hasAnyRolePermission(userRoles, module, "read")
}

// Get role color for UI display
export function getRoleColor(roleId: RoleType): string {
  const role = getRole(roleId)
  return role ? role.color : "#6b7280"
}

// Get role display name
export function getRoleName(roleId: RoleType): string {
  const role = getRole(roleId)
  return role ? role.name : roleId
}

import { db } from "@/lib/firebase"
import { collection, doc, getDocs, query, where, setDoc, deleteDoc } from "firebase/firestore"

// Hardcoded role definitions
export type RoleType = "admin" | "sales" | "logistics" | "cms"

export interface HardcodedRole {
  id: RoleType
  name: string
  description: string
  permissions: Permission[]
  color: string
}

export interface Permission {
  module: string
  actions: ("view" | "create" | "edit" | "delete")[]
  description: string
}

export interface UserRole {
  userId: string
  roleId: RoleType
  assignedAt: number
  assignedBy?: string
}

// Hardcoded roles with their permissions
export const HARDCODED_ROLES: Record<RoleType, HardcodedRole> = {
  admin: {
    id: "admin",
    name: "Administrator",
    description: "Full system access with all administrative privileges",
    color: "purple",
    permissions: [
      {
        module: "admin",
        actions: ["view", "create", "edit", "delete"],
        description: "Full admin panel access",
      },
      {
        module: "sales",
        actions: ["view", "create", "edit", "delete"],
        description: "Full sales module access",
      },
      {
        module: "logistics",
        actions: ["view", "create", "edit", "delete"],
        description: "Full logistics module access",
      },
      {
        module: "cms",
        actions: ["view", "create", "edit", "delete"],
        description: "Full CMS module access",
      },
      {
        module: "user-management",
        actions: ["view", "create", "edit", "delete"],
        description: "User and role management",
      },
      {
        module: "system-settings",
        actions: ["view", "create", "edit", "delete"],
        description: "System configuration and settings",
      },
    ],
  },
  sales: {
    id: "sales",
    name: "Sales Team",
    description: "Access to sales module and client management",
    color: "green",
    permissions: [
      {
        module: "sales",
        actions: ["view", "create", "edit", "delete"],
        description: "Full sales module access",
      },
      {
        module: "clients",
        actions: ["view", "create", "edit"],
        description: "Client management (no delete)",
      },
      {
        module: "proposals",
        actions: ["view", "create", "edit"],
        description: "Proposal management",
      },
      {
        module: "quotations",
        actions: ["view", "create", "edit"],
        description: "Quotation management",
      },
      {
        module: "bookings",
        actions: ["view", "create", "edit"],
        description: "Booking management",
      },
      {
        module: "products",
        actions: ["view"],
        description: "Product catalog viewing",
      },
      {
        module: "chat",
        actions: ["view", "create"],
        description: "Customer chat access",
      },
    ],
  },
  logistics: {
    id: "logistics",
    name: "Logistics Team",
    description: "Access to logistics operations and site management",
    color: "blue",
    permissions: [
      {
        module: "logistics",
        actions: ["view", "create", "edit", "delete"],
        description: "Full logistics module access",
      },
      {
        module: "sites",
        actions: ["view", "create", "edit"],
        description: "Site management",
      },
      {
        module: "assignments",
        actions: ["view", "create", "edit", "delete"],
        description: "Service assignment management",
      },
      {
        module: "reports",
        actions: ["view", "create", "edit"],
        description: "Report management",
      },
      {
        module: "alerts",
        actions: ["view", "create", "edit"],
        description: "Alert management",
      },
      {
        module: "planner",
        actions: ["view", "create", "edit"],
        description: "Logistics planning",
      },
      {
        module: "weather",
        actions: ["view"],
        description: "Weather data access",
      },
    ],
  },
  cms: {
    id: "cms",
    name: "Content Management",
    description: "Access to content creation and management",
    color: "orange",
    permissions: [
      {
        module: "cms",
        actions: ["view", "create", "edit", "delete"],
        description: "Full CMS module access",
      },
      {
        module: "content",
        actions: ["view", "create", "edit", "delete"],
        description: "Content creation and editing",
      },
      {
        module: "orders",
        actions: ["view", "create", "edit"],
        description: "Content order management",
      },
      {
        module: "planner",
        actions: ["view", "create", "edit"],
        description: "Content planning",
      },
      {
        module: "media",
        actions: ["view", "create", "edit", "delete"],
        description: "Media asset management",
      },
    ],
  },
}

// Get all available roles
export function getAllRoles(): HardcodedRole[] {
  return Object.values(HARDCODED_ROLES)
}

// Get role by ID
export function getRoleById(roleId: RoleType): HardcodedRole | null {
  return HARDCODED_ROLES[roleId] || null
}

// Get user roles from Firestore
export async function getUserRoles(userId: string): Promise<RoleType[]> {
  try {
    const userRolesCollection = collection(db, "user_roles")
    const userRolesQuery = query(userRolesCollection, where("userId", "==", userId))
    const userRolesSnapshot = await getDocs(userRolesQuery)

    const roles: RoleType[] = []
    userRolesSnapshot.forEach((doc) => {
      const data = doc.data()
      if (data.roleId && HARDCODED_ROLES[data.roleId as RoleType]) {
        roles.push(data.roleId as RoleType)
      }
    })

    return roles
  } catch (error) {
    console.error("Error getting user roles:", error)
    return []
  }
}

// Assign role to user
export async function assignRoleToUser(userId: string, roleId: RoleType, assignedBy?: string): Promise<void> {
  try {
    // Check if role exists
    if (!HARDCODED_ROLES[roleId]) {
      throw new Error(`Role ${roleId} does not exist`)
    }

    // Check if user already has this role
    const existingRoles = await getUserRoles(userId)
    if (existingRoles.includes(roleId)) {
      console.log(`User ${userId} already has role ${roleId}`)
      return
    }

    // Create a unique document ID
    const docId = `${userId}_${roleId}`

    const userRoleData: UserRole = {
      userId,
      roleId,
      assignedAt: Date.now(),
      ...(assignedBy && { assignedBy }),
    }

    await setDoc(doc(db, "user_roles", docId), userRoleData)
    console.log(`Role ${roleId} assigned to user ${userId}`)
  } catch (error) {
    console.error("Error assigning role to user:", error)
    throw new Error("Failed to assign role to user")
  }
}

// Remove role from user
export async function removeRoleFromUser(userId: string, roleId: RoleType): Promise<void> {
  try {
    const docId = `${userId}_${roleId}`
    await deleteDoc(doc(db, "user_roles", docId))
    console.log(`Role ${roleId} removed from user ${userId}`)
  } catch (error) {
    console.error("Error removing role from user:", error)
    throw new Error("Failed to remove role from user")
  }
}

// Check if user has permission
export async function hasPermission(
  userId: string,
  module: string,
  action: "view" | "create" | "edit" | "delete",
): Promise<boolean> {
  try {
    const userRoles = await getUserRoles(userId)

    if (userRoles.length === 0) {
      return false
    }

    // Check each role for the permission
    for (const roleId of userRoles) {
      const role = HARDCODED_ROLES[roleId]
      if (!role) continue

      // Check if role has permission for this module and action
      const permission = role.permissions.find((p) => p.module === module)
      if (permission && permission.actions.includes(action)) {
        return true
      }
    }

    return false
  } catch (error) {
    console.error("Error checking permission:", error)
    return false
  }
}

// Check if user has any of the specified roles
export async function hasRole(userId: string, roles: RoleType[]): Promise<boolean> {
  try {
    const userRoles = await getUserRoles(userId)
    return roles.some((role) => userRoles.includes(role))
  } catch (error) {
    console.error("Error checking user role:", error)
    return false
  }
}

// Check if user is admin
export async function isAdmin(userId: string): Promise<boolean> {
  return hasRole(userId, ["admin"])
}

// Get users with specific role
export async function getUsersWithRole(roleId: RoleType): Promise<string[]> {
  try {
    const userRolesCollection = collection(db, "user_roles")
    const roleQuery = query(userRolesCollection, where("roleId", "==", roleId))
    const roleSnapshot = await getDocs(roleQuery)

    const userIds: string[] = []
    roleSnapshot.forEach((doc) => {
      userIds.push(doc.data().userId)
    })

    return userIds
  } catch (error) {
    console.error("Error getting users with role:", error)
    return []
  }
}

// Get all user role assignments (for admin purposes)
export async function getAllUserRoleAssignments(): Promise<UserRole[]> {
  try {
    const userRolesCollection = collection(db, "user_roles")
    const snapshot = await getDocs(userRolesCollection)

    const assignments: UserRole[] = []
    snapshot.forEach((doc) => {
      assignments.push(doc.data() as UserRole)
    })

    return assignments
  } catch (error) {
    console.error("Error getting all user role assignments:", error)
    return []
  }
}

// Get user's effective permissions (combined from all roles)
export async function getUserPermissions(userId: string): Promise<Permission[]> {
  try {
    const userRoles = await getUserRoles(userId)
    const allPermissions: Permission[] = []
    const permissionMap = new Map<string, Permission>()

    // Collect all permissions from user's roles
    for (const roleId of userRoles) {
      const role = HARDCODED_ROLES[roleId]
      if (role) {
        for (const permission of role.permissions) {
          const key = permission.module
          const existing = permissionMap.get(key)

          if (!existing) {
            permissionMap.set(key, { ...permission })
          } else {
            // Merge actions (union of all actions)
            const mergedActions = Array.from(new Set([...existing.actions, ...permission.actions]))
            permissionMap.set(key, {
              ...existing,
              actions: mergedActions as ("view" | "create" | "edit" | "delete")[],
            })
          }
        }
      }
    }

    return Array.from(permissionMap.values())
  } catch (error) {
    console.error("Error getting user permissions:", error)
    return []
  }
}

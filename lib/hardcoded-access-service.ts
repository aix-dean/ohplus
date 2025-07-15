import { db } from "@/lib/firebase"
import { collection, doc, getDocs, query, where, setDoc, deleteDoc, serverTimestamp } from "firebase/firestore"

// Hardcoded role definitions
export type RoleType = "admin" | "sales" | "logistics" | "cms"

export interface Role {
  id: RoleType
  name: string
  description: string
  color: string
  permissions: string[]
}

export interface UserRole {
  uid: string
  role: RoleType
  assigned_by: string
  assigned_at: any
  updated_at: any
}

// Hardcoded roles with their permissions
export const HARDCODED_ROLES: Record<RoleType, Role> = {
  admin: {
    id: "admin",
    name: "Admin",
    description: "Full system access and user management",
    color: "red",
    permissions: [
      "admin.dashboard",
      "admin.users",
      "admin.access",
      "admin.subscriptions",
      "admin.invitations",
      "admin.documents",
      "admin.inventory",
      "admin.products",
      "sales.*",
      "logistics.*",
      "cms.*",
    ],
  },
  sales: {
    id: "sales",
    name: "Sales",
    description: "Client management, proposals, and quotations",
    color: "blue",
    permissions: [
      "sales.dashboard",
      "sales.clients",
      "sales.proposals",
      "sales.quotations",
      "sales.bookings",
      "sales.products",
      "sales.campaigns",
      "sales.chat",
      "sales.planner",
    ],
  },
  logistics: {
    id: "logistics",
    name: "Logistics",
    description: "Site management, assignments, and reports",
    color: "green",
    permissions: [
      "logistics.dashboard",
      "logistics.sites",
      "logistics.assignments",
      "logistics.reports",
      "logistics.alerts",
      "logistics.planner",
      "logistics.bulletin",
    ],
  },
  cms: {
    id: "cms",
    name: "CMS",
    description: "Content creation and media management",
    color: "purple",
    permissions: ["cms.dashboard", "cms.content", "cms.media", "cms.planner", "cms.orders", "cms.sites"],
  },
}

// Get all available roles
export function getAllRoles(): Role[] {
  return Object.values(HARDCODED_ROLES)
}

// Get role by ID
export function getRoleById(roleId: RoleType): Role | null {
  return HARDCODED_ROLES[roleId] || null
}

// Get user roles from Firestore
export async function getUserRoles(userId: string): Promise<RoleType[]> {
  try {
    const userRolesCollection = collection(db, "user_roles")
    const userRolesQuery = query(userRolesCollection, where("uid", "==", userId))
    const userRolesSnapshot = await getDocs(userRolesQuery)

    const roles: RoleType[] = []
    userRolesSnapshot.forEach((doc) => {
      const data = doc.data()
      if (data.role && HARDCODED_ROLES[data.role as RoleType]) {
        roles.push(data.role as RoleType)
      }
    })

    return roles
  } catch (error) {
    console.error("Error getting user roles:", error)
    return []
  }
}

// Assign role to user
export async function assignRoleToUser(uid: string, roleId: RoleType, assignedBy: string): Promise<void> {
  try {
    const userRoleRef = doc(db, "user_roles", uid)
    await setDoc(
      userRoleRef,
      {
        uid,
        role: roleId,
        assigned_by: assignedBy,
        assigned_at: serverTimestamp(),
        updated_at: serverTimestamp(),
      },
      { merge: true },
    )

    console.log(`Role ${roleId} assigned to user ${uid}`)
  } catch (error) {
    console.error("Error assigning role:", error)
    throw error
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
export async function hasPermission(userId: string, module: string, action: string): Promise<boolean> {
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
      const permission = role.permissions.find((p) => p === `${module}.${action}` || p === `${module}.*`)
      if (permission) {
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
    const roleQuery = query(userRolesCollection, where("role", "==", roleId))
    const roleSnapshot = await getDocs(roleQuery)

    const userIds: string[] = []
    roleSnapshot.forEach((doc) => {
      userIds.push(doc.data().uid)
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
export async function getUserPermissions(userId: string): Promise<string[]> {
  try {
    const userRoles = await getUserRoles(userId)
    const allPermissions: string[] = []

    // Collect all permissions from user's roles
    for (const roleId of userRoles) {
      const role = HARDCODED_ROLES[roleId]
      if (role) {
        allPermissions.push(...role.permissions)
      }
    }

    // Remove duplicates
    return Array.from(new Set(allPermissions))
  } catch (error) {
    console.error("Error getting user permissions:", error)
    return []
  }
}

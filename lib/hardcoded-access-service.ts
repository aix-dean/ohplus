import { doc, setDoc, collection, query, where, getDocs, deleteDoc, serverTimestamp } from "firebase/firestore"
import { db } from "@/lib/firebase"

// Define role types
export type RoleType = "admin" | "sales" | "logistics" | "cms" | "user"

// Define permission types
export type PermissionType =
  | "admin.all"
  | "sales.view"
  | "sales.create"
  | "sales.edit"
  | "sales.delete"
  | "logistics.view"
  | "logistics.create"
  | "logistics.edit"
  | "logistics.delete"
  | "cms.view"
  | "cms.create"
  | "cms.edit"
  | "cms.delete"
  | "user.view"

// Define role-permission mappings
const ROLE_PERMISSIONS: Record<RoleType, PermissionType[]> = {
  admin: ["admin.all"],
  sales: ["sales.view", "sales.create", "sales.edit", "sales.delete", "user.view"],
  logistics: ["logistics.view", "logistics.create", "logistics.edit", "logistics.delete", "user.view"],
  cms: ["cms.view", "cms.create", "cms.edit", "cms.delete", "user.view"],
  user: ["user.view"],
}

// Define role hierarchy (higher number = higher priority)
const ROLE_HIERARCHY: Record<RoleType, number> = {
  admin: 100,
  sales: 50,
  logistics: 50,
  cms: 50,
  user: 10,
}

// User role interface
interface UserRole {
  userId: string
  roleId: RoleType
  assignedAt: Date
  assignedBy?: string
  system: string
}

// Permission check interface
interface PermissionCheck {
  userId: string
  permission: PermissionType
  hasPermission: boolean
  grantedBy: RoleType[]
}

/**
 * Assign a role to a user
 */
export async function assignRoleToUser(userId: string, roleId: RoleType, assignedBy?: string): Promise<void> {
  try {
    console.log(`Assigning role ${roleId} to user ${userId}`)

    const userRoleId = `${userId}_${roleId}`
    const userRoleRef = doc(db, "user_roles", userRoleId)

    const userRoleData: any = {
      userId,
      roleId,
      assignedAt: serverTimestamp(),
      system: "ohplus",
    }

    // Only include assignedBy if it has a value
    if (assignedBy) {
      userRoleData.assignedBy = assignedBy
    }

    await setDoc(userRoleRef, userRoleData)

    console.log(`Role ${roleId} successfully assigned to user ${userId}`)
  } catch (error) {
    console.error("Error assigning role to user:", error)
    throw error
  }
}

/**
 * Remove a role from a user
 */
export async function removeRoleFromUser(userId: string, roleId: RoleType): Promise<void> {
  try {
    console.log(`Removing role ${roleId} from user ${userId}`)

    const userRoleId = `${userId}_${roleId}`
    const userRoleRef = doc(db, "user_roles", userRoleId)

    await deleteDoc(userRoleRef)

    console.log(`Role ${roleId} successfully removed from user ${userId}`)
  } catch (error) {
    console.error("Error removing role from user:", error)
    throw error
  }
}

/**
 * Get all roles for a user
 */
export async function getUserRoles(userId: string): Promise<RoleType[]> {
  try {
    console.log(`Getting roles for user ${userId}`)

    const userRolesQuery = query(collection(db, "user_roles"), where("userId", "==", userId))
    const userRolesSnapshot = await getDocs(userRolesQuery)

    const roles: RoleType[] = []
    userRolesSnapshot.forEach((doc) => {
      const data = doc.data()
      roles.push(data.roleId as RoleType)
    })

    console.log(`User ${userId} has roles:`, roles)
    return roles
  } catch (error) {
    console.error("Error getting user roles:", error)
    return []
  }
}

/**
 * Get all permissions for a user based on their roles
 */
export async function getUserPermissions(userId: string): Promise<PermissionType[]> {
  try {
    const userRoles = await getUserRoles(userId)
    const permissions = new Set<PermissionType>()

    userRoles.forEach((role) => {
      const rolePermissions = ROLE_PERMISSIONS[role] || []
      rolePermissions.forEach((permission) => permissions.add(permission))
    })

    return Array.from(permissions)
  } catch (error) {
    console.error("Error getting user permissions:", error)
    return []
  }
}

/**
 * Check if a user has a specific permission
 */
export async function checkUserPermission(userId: string, permission: PermissionType): Promise<PermissionCheck> {
  try {
    const userRoles = await getUserRoles(userId)
    const grantedBy: RoleType[] = []

    // Check if user has admin.all permission (grants everything)
    const hasAdminAll = userRoles.some((role) => ROLE_PERMISSIONS[role]?.includes("admin.all"))
    if (hasAdminAll) {
      return {
        userId,
        permission,
        hasPermission: true,
        grantedBy: ["admin"],
      }
    }

    // Check specific permission
    userRoles.forEach((role) => {
      const rolePermissions = ROLE_PERMISSIONS[role] || []
      if (rolePermissions.includes(permission)) {
        grantedBy.push(role)
      }
    })

    return {
      userId,
      permission,
      hasPermission: grantedBy.length > 0,
      grantedBy,
    }
  } catch (error) {
    console.error("Error checking user permission:", error)
    return {
      userId,
      permission,
      hasPermission: false,
      grantedBy: [],
    }
  }
}

/**
 * Check if a user has a specific role
 */
export async function checkUserRole(userId: string, roleId: RoleType): Promise<boolean> {
  try {
    const userRoles = await getUserRoles(userId)
    return userRoles.includes(roleId)
  } catch (error) {
    console.error("Error checking user role:", error)
    return false
  }
}

/**
 * Get the highest role for a user (based on hierarchy)
 */
export async function getUserHighestRole(userId: string): Promise<RoleType | null> {
  try {
    const userRoles = await getUserRoles(userId)
    if (userRoles.length === 0) return null

    let highestRole: RoleType = userRoles[0]
    let highestPriority = ROLE_HIERARCHY[highestRole] || 0

    userRoles.forEach((role) => {
      const priority = ROLE_HIERARCHY[role] || 0
      if (priority > highestPriority) {
        highestRole = role
        highestPriority = priority
      }
    })

    return highestRole
  } catch (error) {
    console.error("Error getting user highest role:", error)
    return null
  }
}

/**
 * Get all users with a specific role
 */
export async function getUsersWithRole(roleId: RoleType): Promise<string[]> {
  try {
    console.log(`Getting users with role ${roleId}`)

    const userRolesQuery = query(collection(db, "user_roles"), where("roleId", "==", roleId))
    const userRolesSnapshot = await getDocs(userRolesQuery)

    const userIds: string[] = []
    userRolesSnapshot.forEach((doc) => {
      const data = doc.data()
      userIds.push(data.userId)
    })

    console.log(`Found ${userIds.length} users with role ${roleId}`)
    return userIds
  } catch (error) {
    console.error("Error getting users with role:", error)
    return []
  }
}

/**
 * Get all available roles
 */
export function getAllRoles(): RoleType[] {
  return Object.keys(ROLE_PERMISSIONS) as RoleType[]
}

/**
 * Get all available permissions
 */
export function getAllPermissions(): PermissionType[] {
  const permissions = new Set<PermissionType>()
  Object.values(ROLE_PERMISSIONS).forEach((rolePermissions) => {
    rolePermissions.forEach((permission) => permissions.add(permission))
  })
  return Array.from(permissions)
}

/**
 * Get permissions for a specific role
 */
export function getRolePermissions(roleId: RoleType): PermissionType[] {
  return ROLE_PERMISSIONS[roleId] || []
}

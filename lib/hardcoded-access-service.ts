import { doc, setDoc, collection, query, where, getDocs, deleteDoc } from "firebase/firestore"
import { db, serverTimestamp } from "@/lib/firebase"

// Define role types
export type RoleType = "admin" | "sales" | "logistics" | "cms" | "user"

// Define permission types
export type PermissionType =
  | "admin.full_access"
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
  | "user.basic"

// Role definitions with permissions
const ROLE_PERMISSIONS: Record<RoleType, PermissionType[]> = {
  admin: [
    "admin.full_access",
    "sales.view",
    "sales.create",
    "sales.edit",
    "sales.delete",
    "logistics.view",
    "logistics.create",
    "logistics.edit",
    "logistics.delete",
    "cms.view",
    "cms.create",
    "cms.edit",
    "cms.delete",
    "user.basic",
  ],
  sales: ["sales.view", "sales.create", "sales.edit", "sales.delete", "user.basic"],
  logistics: ["logistics.view", "logistics.create", "logistics.edit", "logistics.delete", "user.basic"],
  cms: ["cms.view", "cms.create", "cms.edit", "cms.delete", "user.basic"],
  user: ["user.basic"],
}

// User role interface
interface UserRole {
  userId: string
  roleId: RoleType
  permissions: PermissionType[]
  assignedAt: any // serverTimestamp
  assignedBy?: string
  isActive: boolean
}

// Assign role to user
export async function assignRoleToUser(userId: string, roleId: RoleType, assignedBy?: string): Promise<void> {
  try {
    console.log(`Assigning role ${roleId} to user ${userId}`)

    const permissions = ROLE_PERMISSIONS[roleId] || []
    const userRoleId = `${userId}_${roleId}`

    const userRole: UserRole = {
      userId,
      roleId,
      permissions,
      assignedAt: serverTimestamp(),
      isActive: true,
      ...(assignedBy && { assignedBy }),
    }

    const userRoleRef = doc(db, "user_roles", userRoleId)
    await setDoc(userRoleRef, userRole)

    console.log(`Role ${roleId} successfully assigned to user ${userId}`)
  } catch (error) {
    console.error("Error assigning role to user:", error)
    throw error
  }
}

// Remove role from user
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

// Get user roles
export async function getUserRoles(userId: string): Promise<UserRole[]> {
  try {
    console.log(`Fetching roles for user ${userId}`)

    const userRolesQuery = query(
      collection(db, "user_roles"),
      where("userId", "==", userId),
      where("isActive", "==", true),
    )

    const querySnapshot = await getDocs(userRolesQuery)
    const roles: UserRole[] = []

    querySnapshot.forEach((doc) => {
      const data = doc.data() as UserRole
      roles.push(data)
    })

    console.log(`Found ${roles.length} roles for user ${userId}`)
    return roles
  } catch (error) {
    console.error("Error fetching user roles:", error)
    throw error
  }
}

// Get user permissions
export async function getUserPermissions(userId: string): Promise<PermissionType[]> {
  try {
    const roles = await getUserRoles(userId)
    const allPermissions = new Set<PermissionType>()

    roles.forEach((role) => {
      role.permissions.forEach((permission) => {
        allPermissions.add(permission)
      })
    })

    return Array.from(allPermissions)
  } catch (error) {
    console.error("Error fetching user permissions:", error)
    throw error
  }
}

// Check if user has permission
export async function userHasPermission(userId: string, permission: PermissionType): Promise<boolean> {
  try {
    const permissions = await getUserPermissions(userId)
    return permissions.includes(permission) || permissions.includes("admin.full_access")
  } catch (error) {
    console.error("Error checking user permission:", error)
    return false
  }
}

// Check if user has role
export async function userHasRole(userId: string, roleId: RoleType): Promise<boolean> {
  try {
    const roles = await getUserRoles(userId)
    return roles.some((role) => role.roleId === roleId)
  } catch (error) {
    console.error("Error checking user role:", error)
    return false
  }
}

// Get all available roles
export function getAllRoles(): RoleType[] {
  return Object.keys(ROLE_PERMISSIONS) as RoleType[]
}

// Get permissions for a role
export function getRolePermissions(roleId: RoleType): PermissionType[] {
  return ROLE_PERMISSIONS[roleId] || []
}

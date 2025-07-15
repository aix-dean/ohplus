import { doc, setDoc, updateDoc, serverTimestamp, collection, query, where, getDocs } from "firebase/firestore"
import { db } from "@/lib/firebase"

export type RoleType = "admin" | "sales" | "logistics" | "cms"

export interface HardcodedRole {
  id: RoleType
  name: string
  description: string
  permissions: string[]
}

export interface Permission {
  id: string
  name: string
  description: string
  category: string
}

export interface UserRole {
  userId: string
  roleId: string
  assignedBy: string
  assignedAt: Date
  isActive: boolean
}

// Hardcoded permissions
const PERMISSIONS: Permission[] = [
  // Admin permissions
  {
    id: "admin.users.create",
    name: "Create Users",
    description: "Can create new user accounts",
    category: "User Management",
  },
  { id: "admin.users.read", name: "View Users", description: "Can view user information", category: "User Management" },
  {
    id: "admin.users.update",
    name: "Update Users",
    description: "Can modify user information",
    category: "User Management",
  },
  {
    id: "admin.users.delete",
    name: "Delete Users",
    description: "Can delete user accounts",
    category: "User Management",
  },

  // Sales permissions
  {
    id: "sales.proposals.create",
    name: "Create Proposals",
    description: "Can create new proposals",
    category: "Sales",
  },
  { id: "sales.proposals.read", name: "View Proposals", description: "Can view proposals", category: "Sales" },
  { id: "sales.proposals.update", name: "Update Proposals", description: "Can modify proposals", category: "Sales" },
  { id: "sales.quotations.create", name: "Create Quotations", description: "Can create quotations", category: "Sales" },
  {
    id: "sales.clients.manage",
    name: "Manage Clients",
    description: "Can manage client information",
    category: "Sales",
  },

  // Logistics permissions
  { id: "logistics.sites.read", name: "View Sites", description: "Can view site information", category: "Logistics" },
  {
    id: "logistics.sites.update",
    name: "Update Sites",
    description: "Can modify site information",
    category: "Logistics",
  },
  {
    id: "logistics.reports.create",
    name: "Create Reports",
    description: "Can create logistics reports",
    category: "Logistics",
  },
  {
    id: "logistics.assignments.manage",
    name: "Manage Assignments",
    description: "Can manage service assignments",
    category: "Logistics",
  },

  // CMS permissions
  { id: "cms.content.create", name: "Create Content", description: "Can create new content", category: "CMS" },
  { id: "cms.content.read", name: "View Content", description: "Can view content", category: "CMS" },
  { id: "cms.content.update", name: "Update Content", description: "Can modify content", category: "CMS" },
  { id: "cms.content.delete", name: "Delete Content", description: "Can delete content", category: "CMS" },
]

// Hardcoded roles
const ROLES: HardcodedRole[] = [
  {
    id: "admin",
    name: "Administrator",
    description: "Full system access with all permissions",
    permissions: PERMISSIONS.map((p) => p.id),
  },
  {
    id: "sales",
    name: "Sales",
    description: "Access to sales modules including proposals, quotations, and client management",
    permissions: [
      "admin.users.read",
      "sales.proposals.create",
      "sales.proposals.read",
      "sales.proposals.update",
      "sales.quotations.create",
      "sales.clients.manage",
    ],
  },
  {
    id: "logistics",
    name: "Logistics",
    description: "Access to logistics modules including sites, reports, and assignments",
    permissions: [
      "admin.users.read",
      "logistics.sites.read",
      "logistics.sites.update",
      "logistics.reports.create",
      "logistics.assignments.manage",
    ],
  },
  {
    id: "cms",
    name: "Content",
    description: "Access to content management system",
    permissions: [
      "admin.users.read",
      "cms.content.create",
      "cms.content.read",
      "cms.content.update",
      "cms.content.delete",
    ],
  },
]

export class HardcodedAccessService {
  // Permission methods
  async getAllPermissions(): Promise<Permission[]> {
    return PERMISSIONS
  }

  async getPermissionById(id: string): Promise<Permission | null> {
    return PERMISSIONS.find((p) => p.id === id) || null
  }

  async getPermissionsByCategory(category: string): Promise<Permission[]> {
    return PERMISSIONS.filter((p) => p.category === category)
  }

  // Role methods
  async getAllRoles(): Promise<HardcodedRole[]> {
    return ROLES
  }

  async getRoleById(id: RoleType): Promise<HardcodedRole | null> {
    return ROLES.find((r) => r.id === id) || null
  }

  // User role assignment methods
  async assignRoleToUser(userId: string, roleId: RoleType, assignedBy = "system"): Promise<void> {
    const userRole: UserRole = {
      userId,
      roleId,
      assignedBy,
      assignedAt: new Date(),
      isActive: true,
    }

    // Save to Firestore
    const userRoleDocRef = doc(db, "user_roles", `${userId}_${roleId}`)
    await setDoc(userRoleDocRef, {
      ...userRole,
      assignedAt: serverTimestamp(),
      createdAt: serverTimestamp(),
    })

    // Update user document with role
    const userDocRef = doc(db, "iboard_users", userId)
    await updateDoc(userDocRef, {
      role: roleId,
      updatedAt: serverTimestamp(),
    })
  }

  async removeRoleFromUser(userId: string, roleId: string): Promise<void> {
    const userRoleDocRef = doc(db, "user_roles", `${userId}_${roleId}`)
    await updateDoc(userRoleDocRef, {
      isActive: false,
      removedAt: serverTimestamp(),
    })

    // Update user document to remove role
    const userDocRef = doc(db, "iboard_users", userId)
    await updateDoc(userDocRef, {
      role: "user", // Default role
      updatedAt: serverTimestamp(),
    })
  }

  async getUserRoles(userId: string): Promise<RoleType[]> {
    const userRolesQuery = query(
      collection(db, "user_roles"),
      where("userId", "==", userId),
      where("isActive", "==", true),
    )

    const snapshot = await getDocs(userRolesQuery)
    return snapshot.docs.map((doc) => doc.data().roleId as RoleType)
  }

  async getUserPermissions(userId: string): Promise<string[]> {
    const userRoles = await this.getUserRoles(userId)
    const permissions = new Set<string>()

    for (const roleId of userRoles) {
      const role = await this.getRoleById(roleId)
      if (role) {
        role.permissions.forEach((permission) => permissions.add(permission))
      }
    }

    return Array.from(permissions)
  }

  async hasPermission(userId: string, permission: string): Promise<boolean> {
    const userPermissions = await this.getUserPermissions(userId)
    return userPermissions.includes(permission)
  }

  async hasRole(userId: string, roleId: RoleType): Promise<boolean> {
    const userRoles = await this.getUserRoles(userId)
    return userRoles.includes(roleId)
  }

  // Utility methods
  async getRolePermissions(roleId: RoleType): Promise<Permission[]> {
    const role = await this.getRoleById(roleId)
    if (!role) return []

    return PERMISSIONS.filter((p) => role.permissions.includes(p.id))
  }

  async getPermissionCategories(): Promise<string[]> {
    const categories = new Set(PERMISSIONS.map((p) => p.category))
    return Array.from(categories)
  }
}

// Export singleton instance
export const accessService = new HardcodedAccessService()

// Convenience functions
export const getAllRoles = () => ROLES

export const assignRoleToUser = (userId: string, roleId: RoleType, assignedBy = "system") =>
  accessService.assignRoleToUser(userId, roleId, assignedBy)

export const removeRoleFromUser = (userId: string, roleId: string) => accessService.removeRoleFromUser(userId, roleId)

export const getUserRoles = (userId: string) => accessService.getUserRoles(userId)

export const getUserPermissions = (userId: string) => accessService.getUserPermissions(userId)

export const hasPermission = (userId: string, permission: string) => accessService.hasPermission(userId, permission)

export const hasRole = (userId: string, roleId: string) => accessService.hasRole(userId, roleId as RoleType)

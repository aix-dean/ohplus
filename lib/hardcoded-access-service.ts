import { doc, setDoc, updateDoc, serverTimestamp, collection, query, where, getDocs } from "firebase/firestore"
import { db } from "@/lib/firebase"

export type RoleType = "admin" | "manager" | "user" | "viewer"

export interface Permission {
  id: string
  name: string
  description: string
  category: string
}

export interface Role {
  id: string
  name: string
  description: string
  permissions: string[]
  isSystem: boolean
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

  // Role management
  { id: "admin.roles.create", name: "Create Roles", description: "Can create new roles", category: "Role Management" },
  { id: "admin.roles.read", name: "View Roles", description: "Can view role information", category: "Role Management" },
  {
    id: "admin.roles.update",
    name: "Update Roles",
    description: "Can modify role permissions",
    category: "Role Management",
  },
  { id: "admin.roles.delete", name: "Delete Roles", description: "Can delete roles", category: "Role Management" },

  // System settings
  {
    id: "admin.system.settings",
    name: "System Settings",
    description: "Can modify system settings",
    category: "System",
  },
  { id: "admin.system.logs", name: "View System Logs", description: "Can view system logs", category: "System" },

  // Content management
  { id: "content.create", name: "Create Content", description: "Can create new content", category: "Content" },
  { id: "content.read", name: "View Content", description: "Can view content", category: "Content" },
  { id: "content.update", name: "Update Content", description: "Can modify content", category: "Content" },
  { id: "content.delete", name: "Delete Content", description: "Can delete content", category: "Content" },

  // Analytics
  { id: "analytics.view", name: "View Analytics", description: "Can view analytics data", category: "Analytics" },
  { id: "analytics.export", name: "Export Analytics", description: "Can export analytics data", category: "Analytics" },
]

// Hardcoded roles
const ROLES: Role[] = [
  {
    id: "admin",
    name: "Administrator",
    description: "Full system access with all permissions",
    permissions: PERMISSIONS.map((p) => p.id),
    isSystem: true,
  },
  {
    id: "manager",
    name: "Manager",
    description: "Management access with content and user permissions",
    permissions: [
      "admin.users.read",
      "admin.users.update",
      "admin.roles.read",
      "content.create",
      "content.read",
      "content.update",
      "content.delete",
      "analytics.view",
      "analytics.export",
    ],
    isSystem: true,
  },
  {
    id: "user",
    name: "User",
    description: "Standard user access with content permissions",
    permissions: ["content.create", "content.read", "content.update", "analytics.view"],
    isSystem: true,
  },
  {
    id: "viewer",
    name: "Viewer",
    description: "Read-only access to content and analytics",
    permissions: ["content.read", "analytics.view"],
    isSystem: true,
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
  async getAllRoles(): Promise<Role[]> {
    return ROLES
  }

  async getRoleById(id: string): Promise<Role | null> {
    return ROLES.find((r) => r.id === id) || null
  }

  async createCustomRole(role: Omit<Role, "id" | "isSystem">): Promise<Role> {
    const newRole: Role = {
      ...role,
      id: `custom_${Date.now()}`,
      isSystem: false,
    }

    // Save to Firestore
    const roleDocRef = doc(db, "custom_roles", newRole.id)
    await setDoc(roleDocRef, {
      ...newRole,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    })

    return newRole
  }

  async updateCustomRole(roleId: string, updates: Partial<Role>): Promise<void> {
    const roleDocRef = doc(db, "custom_roles", roleId)
    await updateDoc(roleDocRef, {
      ...updates,
      updatedAt: serverTimestamp(),
    })
  }

  async deleteCustomRole(roleId: string): Promise<void> {
    const roleDocRef = doc(db, "custom_roles", roleId)
    await updateDoc(roleDocRef, {
      isActive: false,
      deletedAt: serverTimestamp(),
    })
  }

  // User role assignment methods
  async assignRoleToUser(userId: string, roleId: string, assignedBy = "system"): Promise<void> {
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

  async getUserRoles(userId: string): Promise<UserRole[]> {
    const userRolesQuery = query(
      collection(db, "user_roles"),
      where("userId", "==", userId),
      where("isActive", "==", true),
    )

    const snapshot = await getDocs(userRolesQuery)
    return snapshot.docs.map((doc) => ({
      ...doc.data(),
      assignedAt: doc.data().assignedAt?.toDate() || new Date(),
    })) as UserRole[]
  }

  async getUserPermissions(userId: string): Promise<string[]> {
    const userRoles = await this.getUserRoles(userId)
    const permissions = new Set<string>()

    for (const userRole of userRoles) {
      const role = await this.getRoleById(userRole.roleId)
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

  async hasRole(userId: string, roleId: string): Promise<boolean> {
    const userRoles = await this.getUserRoles(userId)
    return userRoles.some((ur) => ur.roleId === roleId)
  }

  // Utility methods
  async getRolePermissions(roleId: string): Promise<Permission[]> {
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
export const assignRoleToUser = (userId: string, roleId: RoleType, assignedBy = "system") =>
  accessService.assignRoleToUser(userId, roleId, assignedBy)

export const removeRoleFromUser = (userId: string, roleId: string) => accessService.removeRoleFromUser(userId, roleId)

export const getUserPermissions = (userId: string) => accessService.getUserPermissions(userId)

export const hasPermission = (userId: string, permission: string) => accessService.hasPermission(userId, permission)

export const hasRole = (userId: string, roleId: string) => accessService.hasRole(userId, roleId)

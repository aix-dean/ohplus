import { db } from "@/lib/firebase"
import { collection, doc, getDoc, getDocs, query, where, addDoc, deleteDoc, updateDoc } from "firebase/firestore"
import type { Role as ImportedRole, Permission as ImportedPermission } from "@/lib/types/access-management"

// Define types for permissions and roles
export type Permission = ImportedPermission & {
  createdAt?: number
  updatedAt?: number
}

export type Role = ImportedRole & {
  isAdmin?: boolean
  permissions?: string[] // Array of permission IDs
  createdAt?: number
  updatedAt?: number
}

export type UserRole = {
  userId: string
  roleId: string
  assignedAt?: number
}

// Update the User type to match iboard_users collection
export type User = {
  id: string
  email: string
  display_name?: string
  displayName?: string // For compatibility with both naming conventions
  first_name?: string
  middle_name?: string
  last_name?: string
  license_key?: string
  photo_url?: string
  photoURL?: string // For compatibility with both naming conventions
  phone_number?: string
  location?: string
  gender?: string
  type?: string
  active?: boolean
  onboarding?: boolean
  department?: string
  lastLogin?: any
  created?: any
  updated?: any
  role?: string // Single role field for simplicity
}

// Permission Management
export async function getPermissions(): Promise<Permission[]> {
  try {
    const permissionsSnapshot = await getDocs(collection(db, "permissions"))
    return permissionsSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }) as Permission)
  } catch (error) {
    console.error("Error getting permissions:", error)
    throw new Error("Failed to get permissions")
  }
}

export async function createPermission(permission: Omit<Permission, "id">): Promise<string> {
  try {
    const timestamp = Date.now()
    const permissionWithTimestamp = {
      ...permission,
      createdAt: timestamp,
      updatedAt: timestamp,
    }

    const docRef = await addDoc(collection(db, "permissions"), permissionWithTimestamp)
    return docRef.id
  } catch (error) {
    console.error("Error creating permission:", error)
    throw new Error("Failed to create permission")
  }
}

export async function updatePermission(
  permissionId: string,
  permission: Partial<Omit<Permission, "id">>,
): Promise<void> {
  try {
    const permissionRef = doc(db, "permissions", permissionId)
    await updateDoc(permissionRef, {
      ...permission,
      updatedAt: Date.now(),
    })
  } catch (error) {
    console.error("Error updating permission:", error)
    throw new Error("Failed to update permission")
  }
}

export async function deletePermission(permissionId: string): Promise<void> {
  try {
    const permissionRef = doc(db, "permissions", permissionId)
    await deleteDoc(permissionRef)
  } catch (error) {
    console.error("Error deleting permission:", error)
    throw new Error("Failed to delete permission")
  }
}

// Role Management
export const accessManagementService = {
  // User Roles
  async getUserRoles(uid: string): Promise<string[]> {
    try {
      const userDocRef = doc(db, "iboard_users", uid)
      const userDocSnap = await getDoc(userDocRef)
      if (userDocSnap.exists()) {
        const userData = userDocSnap.data()
        // Assuming 'role' is a single string field in user document
        // If you have multiple roles, you might store them as an array
        return userData.role ? [userData.role] : []
      }
      return []
    } catch (error) {
      console.error("Error fetching user roles:", error)
      throw error
    }
  },

  async assignUserRole(uid: string, roleName: string): Promise<void> {
    try {
      const userDocRef = doc(db, "iboard_users", uid)
      await updateDoc(userDocRef, { role: roleName })
    } catch (error) {
      console.error("Error assigning user role:", error)
      throw error
    }
  },

  // Permissions
  async hasPermission(
    uid: string,
    permissionName: string,
    module: string,
    action: "view" | "create" | "edit" | "delete",
  ): Promise<boolean> {
    try {
      const userRoles = await this.getUserRoles(uid)
      if (userRoles.length === 0) return false

      // Fetch all roles that the user has
      const rolesRef = collection(db, "roles")
      const q = query(rolesRef, where("name", "in", userRoles))
      const querySnapshot = await getDocs(q)

      let userPermissions: string[] = []
      querySnapshot.forEach((docSnap) => {
        const roleData = docSnap.data() as Role
        userPermissions = [...userPermissions, ...roleData.permissions]
      })

      // Check if the user has the specific permission
      const requiredPermission = `${module}:${action}:${permissionName}`
      return userPermissions.includes(requiredPermission)
    } catch (error) {
      console.error("Error checking permission:", error)
      throw error
    }
  },

  async getRolePermissions(roleId: string): Promise<string[]> {
    try {
      const roleDocRef = doc(db, "roles", roleId)
      const roleDocSnap = await getDoc(roleDocRef)
      if (roleDocSnap.exists()) {
        const roleData = roleDocSnap.data() as Role
        return roleData.permissions || []
      }
      return []
    } catch (error) {
      console.error("Error fetching role permissions:", error)
      throw error
    }
  },

  async updateRolePermissions(roleId: string, permissions: string[]): Promise<void> {
    try {
      const roleDocRef = doc(db, "roles", roleId)
      await updateDoc(roleDocRef, { permissions })
    } catch (error) {
      console.error("Error updating role permissions:", error)
      throw error
    }
  },

  // Roles Management
  async createRole(role: Omit<Role, "id">): Promise<Role> {
    try {
      const docRef = await addDoc(collection(db, "roles"), role)
      return { id: docRef.id, ...role }
    } catch (error) {
      console.error("Error creating role:", error)
      throw error
    }
  },

  async getRole(id: string): Promise<Role | null> {
    try {
      const docRef = doc(db, "roles", id)
      const docSnap = await getDoc(docRef)
      if (docSnap.exists()) {
        return { id: docSnap.id, ...docSnap.data() } as Role
      }
      return null
    } catch (error) {
      console.error("Error getting role:", error)
      throw error
    }
  },

  async getAllRoles(): Promise<Role[]> {
    try {
      const rolesCollection = collection(db, "roles")
      const querySnapshot = await getDocs(rolesCollection)
      return querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }) as Role)
    } catch (error) {
      console.error("Error getting all roles:", error)
      throw error
    }
  },

  async updateRole(id: string, updates: Partial<Role>): Promise<void> {
    try {
      const docRef = doc(db, "roles", id)
      await updateDoc(docRef, updates)
    } catch (error) {
      console.error("Error updating role:", error)
      throw error
    }
  },

  async deleteRole(id: string): Promise<void> {
    try {
      await deleteDoc(doc(db, "roles", id))
    } catch (error) {
      console.error("Error deleting role:", error)
      throw error
    }
  },
}

// User Management
export async function getUsers(licenseKey?: string): Promise<User[]> {
  try {
    const usersCollection = collection(db, "iboard_users")
    let usersQuery

    // If license key is provided, filter users by license key
    if (licenseKey) {
      usersQuery = query(usersCollection, where("license_key", "==", licenseKey))
    } else {
      usersQuery = usersCollection
    }

    const usersSnapshot = await getDocs(usersQuery)
    return usersSnapshot.docs.map(
      (doc) =>
        ({
          id: doc.id,
          ...doc.data(),
          // Ensure these fields are properly typed
          email: doc.data().email || "",
          displayName: doc.data().display_name || "",
          photoURL: doc.data().photo_url || "",
        }) as User,
    )
  } catch (error) {
    console.error("Error getting users:", error)
    throw new Error("Failed to get users")
  }
}

// User Role Management
export async function assignRoleToUser(userId: string, roleId: string): Promise<void> {
  try {
    // Check if the user already has this role
    const userRolesCollection = collection(db, "user_roles")
    const userRolesQuery = query(userRolesCollection, where("userId", "==", userId), where("roleId", "==", roleId))
    const userRolesSnapshot = await getDocs(userRolesQuery)

    if (userRolesSnapshot.empty) {
      // User doesn't have this role yet, so assign it
      await addDoc(userRolesCollection, {
        userId,
        roleId,
        assignedAt: Date.now(),
      })
    }
  } catch (error) {
    console.error("Error assigning role to user:", error)
    throw new Error("Failed to assign role to user")
  }
}

export async function removeRoleFromUser(userId: string, roleId: string): Promise<void> {
  try {
    const userRolesCollection = collection(db, "user_roles")
    const userRolesQuery = query(userRolesCollection, where("userId", "==", userId), where("roleId", "==", roleId))
    const userRolesSnapshot = await getDocs(userRolesQuery)

    userRolesSnapshot.forEach(async (docSnapshot) => {
      await deleteDoc(doc(userRolesCollection, docSnapshot.id))
    })
  } catch (error) {
    console.error("Error removing role from user:", error)
    throw new Error("Failed to remove role from user")
  }
}

// Initialize default permissions
export async function initializeDefaultPermissions(): Promise<void> {
  try {
    // Check if permissions already exist
    const existingPermissions = await getPermissions()
    if (existingPermissions.length > 0) {
      console.log("Permissions already initialized, skipping...")
      return
    }

    // Define default permissions
    const defaultPermissions: Omit<Permission, "id">[] = [
      // Sales module permissions
      {
        name: "View Sales Dashboard",
        description: "Allow viewing the sales dashboard",
        module: "sales",
        action: "view",
      },
      {
        name: "Create Sales Order",
        description: "Allow creating new sales orders",
        module: "sales",
        action: "create",
      },
      {
        name: "Edit Sales Order",
        description: "Allow editing existing sales orders",
        module: "sales",
        action: "edit",
      },
      {
        name: "Delete Sales Order",
        description: "Allow deleting sales orders",
        module: "sales",
        action: "delete",
      },

      // Logistics module permissions
      {
        name: "View Logistics Dashboard",
        description: "Allow viewing the logistics dashboard",
        module: "logistics",
        action: "view",
      },
      {
        name: "Create Logistics Task",
        description: "Allow creating new logistics tasks",
        module: "logistics",
        action: "create",
      },
      {
        name: "Edit Logistics Task",
        description: "Allow editing existing logistics tasks",
        module: "logistics",
        action: "edit",
      },
      {
        name: "Delete Logistics Task",
        description: "Allow deleting logistics tasks",
        module: "logistics",
        action: "delete",
      },

      // CMS module permissions
      {
        name: "View CMS Dashboard",
        description: "Allow viewing the CMS dashboard",
        module: "cms",
        action: "view",
      },
      {
        name: "Create CMS Content",
        description: "Allow creating new CMS content",
        module: "cms",
        action: "create",
      },
      {
        name: "Edit CMS Content",
        description: "Allow editing existing CMS content",
        module: "cms",
        action: "edit",
      },
      {
        name: "Delete CMS Content",
        description: "Allow deleting CMS content",
        module: "cms",
        action: "delete",
      },

      // Admin module permissions
      {
        name: "View Admin Dashboard",
        description: "Allow viewing the admin dashboard",
        module: "admin",
        action: "view",
      },
      {
        name: "Manage Users",
        description: "Allow managing users",
        module: "admin",
        action: "edit",
      },
      {
        name: "Manage Roles",
        description: "Allow managing roles",
        module: "admin",
        action: "edit",
      },
      {
        name: "Manage Permissions",
        description: "Allow managing permissions",
        module: "admin",
        action: "edit",
      },
    ]

    // Create all permissions
    for (const permission of defaultPermissions) {
      await createPermission(permission)
    }

    console.log("Default permissions initialized successfully")
  } catch (error) {
    console.error("Error initializing default permissions:", error)
    throw new Error("Failed to initialize default permissions")
  }
}

// Initialize admin role
export async function initializeAdminRole(): Promise<string> {
  try {
    // Check if admin role already exists
    const existingRoles = await accessManagementService.getAllRoles()
    const adminRole = existingRoles.find((role) => role.name === "Administrator")

    if (adminRole) {
      console.log("Admin role already exists, skipping...")
      return adminRole.id
    }

    // Create admin role
    const adminRoleId = await accessManagementService.createRole({
      name: "Administrator",
      description: "Full access to all system features",
      isAdmin: true,
      permissions: [],
    })

    // Get all permissions and assign them to the admin role
    const permissions = await getPermissions()
    for (const permission of permissions) {
      await accessManagementService.updateRolePermissions(adminRoleId, [
        ...(permission.permissions || []),
        permission.id,
      ])
    }

    console.log("Admin role initialized successfully")
    return adminRoleId
  } catch (error) {
    console.error("Error initializing admin role:", error)
    throw new Error("Failed to initialize admin role")
  }
}

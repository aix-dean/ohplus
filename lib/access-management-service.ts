import { db } from "@/lib/firebase"
import { collection, doc, getDoc, getDocs, query, where, addDoc, deleteDoc, updateDoc } from "firebase/firestore"

// Define types for permissions and roles
export type Permission = {
  id: string
  name: string
  description: string
  module: "sales" | "logistics" | "cms" | "admin"
  action: "view" | "create" | "edit" | "delete"
  createdAt?: number
  updatedAt?: number
}

export type Role = {
  id: string
  name: string
  description: string
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
export async function getRoles(): Promise<Role[]> {
  try {
    const rolesSnapshot = await getDocs(collection(db, "roles"))
    return rolesSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }) as Role)
  } catch (error) {
    console.error("Error getting roles:", error)
    throw new Error("Failed to get roles")
  }
}

export async function createRole(role: Omit<Role, "id" | "createdAt" | "updatedAt">): Promise<string> {
  try {
    const timestamp = Date.now()
    const roleWithTimestamp = {
      ...role,
      permissions: role.permissions || [],
      createdAt: timestamp,
      updatedAt: timestamp,
    }

    const docRef = await addDoc(collection(db, "roles"), roleWithTimestamp)
    return docRef.id
  } catch (error) {
    console.error("Error creating role:", error)
    throw new Error("Failed to create role")
  }
}

export async function updateRole(
  roleId: string,
  role: Partial<Omit<Role, "id" | "createdAt" | "updatedAt">>,
): Promise<void> {
  try {
    const roleRef = doc(db, "roles", roleId)
    await updateDoc(roleRef, {
      ...role,
      updatedAt: Date.now(),
    })
  } catch (error) {
    console.error("Error updating role:", error)
    throw new Error("Failed to update role")
  }
}

export async function deleteRole(roleId: string): Promise<void> {
  try {
    const roleRef = doc(db, "roles", roleId)
    await deleteDoc(roleRef)
  } catch (error) {
    console.error("Error deleting role:", error)
    throw new Error("Failed to delete role")
  }
}

// Role Permission Management
export async function getRolePermissions(roleId: string): Promise<string[]> {
  try {
    const roleDoc = await getDoc(doc(db, "roles", roleId))
    if (roleDoc.exists()) {
      const role = roleDoc.data() as Role
      return role.permissions || []
    }
    return []
  } catch (error) {
    console.error("Error getting role permissions:", error)
    return []
  }
}

export async function assignPermissionToRole(roleId: string, permissionId: string): Promise<void> {
  try {
    const roleRef = doc(db, "roles", roleId)
    const roleDoc = await getDoc(roleRef)
    if (roleDoc.exists()) {
      const role = roleDoc.data() as Role
      const permissions = role.permissions || []
      if (!permissions.includes(permissionId)) {
        await updateDoc(roleRef, {
          permissions: [...permissions, permissionId],
          updatedAt: Date.now(),
        })
      }
    }
  } catch (error) {
    console.error("Error assigning permission to role:", error)
    throw new Error("Failed to assign permission to role")
  }
}

export async function removePermissionFromRole(roleId: string, permissionId: string): Promise<void> {
  try {
    const roleRef = doc(db, "roles", roleId)
    const roleDoc = await getDoc(roleRef)
    if (roleDoc.exists()) {
      const role = roleDoc.data() as Role
      const permissions = role.permissions || []
      const updatedPermissions = permissions.filter((id) => id !== permissionId)
      await updateDoc(roleRef, {
        permissions: updatedPermissions,
        updatedAt: Date.now(),
      })
    }
  } catch (error) {
    console.error("Error removing permission from role:", error)
    throw new Error("Failed to remove permission from role")
  }
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
export async function getUserRoles(userId: string): Promise<string[]> {
  try {
    const userRolesCollection = collection(db, "user_roles")
    const userRolesQuery = query(userRolesCollection, where("userId", "==", userId))
    const userRolesSnapshot = await getDocs(userRolesQuery)

    const roleIds: string[] = []
    userRolesSnapshot.forEach((doc) => {
      roleIds.push(doc.data().roleId)
    })

    return roleIds
  } catch (error) {
    console.error("Error getting user roles:", error)
    throw new Error("Failed to get user roles")
  }
}

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
    const existingRoles = await getRoles()
    const adminRole = existingRoles.find((role) => role.name === "Administrator")

    if (adminRole) {
      console.log("Admin role already exists, skipping...")
      return adminRole.id
    }

    // Create admin role
    const adminRoleId = await createRole({
      name: "Administrator",
      description: "Full access to all system features",
      isAdmin: true,
    })

    // Get all permissions and assign them to the admin role
    const permissions = await getPermissions()
    for (const permission of permissions) {
      await assignPermissionToRole(adminRoleId, permission.id)
    }

    console.log("Admin role initialized successfully")
    return adminRoleId
  } catch (error) {
    console.error("Error initializing admin role:", error)
    throw new Error("Failed to initialize admin role")
  }
}

// Check if user has permission
export async function hasPermission(
  userId: string,
  module: "sales" | "logistics" | "cms" | "admin",
  action: "view" | "create" | "edit" | "delete",
): Promise<boolean> {
  try {
    // Get user roles
    const userRoles = await getUserRoles(userId)

    if (userRoles.length === 0) {
      return false // User has no roles
    }

    // Check each role
    for (const roleId of userRoles) {
      const roleDoc = await getDoc(doc(db, "roles", roleId))

      if (!roleDoc.exists()) {
        continue // Role doesn't exist
      }

      const role = roleDoc.data() as Role

      // Admin roles have all permissions
      if (role.isAdmin) {
        return true
      }

      // Check role permissions
      const rolePermissions = await getRolePermissions(roleId)

      if (rolePermissions.length === 0) {
        continue // Role has no permissions
      }

      // Get all permissions that match the module and action
      const permissionsQuery = query(
        collection(db, "permissions"),
        where("module", "==", module),
        where("action", "==", action),
      )

      const permissionsSnapshot = await getDocs(permissionsQuery)

      for (const permissionDoc of permissionsSnapshot.docs) {
        if (rolePermissions.includes(permissionDoc.id)) {
          return true // User has the permission through this role
        }
      }
    }

    return false // User doesn't have the permission
  } catch (error) {
    console.error("Error checking permission:", error)
    return false // Assume no permission on error
  }
}

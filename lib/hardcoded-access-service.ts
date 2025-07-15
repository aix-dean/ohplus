import { doc, setDoc, serverTimestamp, collection, query, where, getDocs, deleteDoc } from "firebase/firestore"
import { db } from "@/lib/firebase"

// Define the available roles
export type RoleType = "admin" | "sales" | "logistics" | "cms"

export interface Role {
  id: RoleType
  name: string
  description: string
  color: string
  permissions: string[]
}

// Hardcoded roles with their permissions
export const ROLES: Record<RoleType, Role> = {
  admin: {
    id: "admin",
    name: "Admin",
    description: "Full system access and user management",
    color: "#dc2626", // red-600
    permissions: [
      "admin.dashboard",
      "admin.users",
      "admin.roles",
      "admin.subscriptions",
      "admin.inventory",
      "admin.documents",
      "admin.invitations",
      "sales.*",
      "logistics.*",
      "cms.*",
    ],
  },
  sales: {
    id: "sales",
    name: "Sales",
    description: "Client management, proposals, and quotations",
    color: "#2563eb", // blue-600
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
    color: "#059669", // emerald-600
    permissions: [
      "logistics.dashboard",
      "logistics.sites",
      "logistics.assignments",
      "logistics.reports",
      "logistics.alerts",
      "logistics.bulletin",
      "logistics.planner",
    ],
  },
  cms: {
    id: "cms",
    name: "Content/CMS",
    description: "Content creation and media management",
    color: "#7c3aed", // violet-600
    permissions: ["cms.dashboard", "cms.content", "cms.media", "cms.orders", "cms.planner", "cms.sites"],
  },
}

// Get all roles
export function getAllRoles(): Role[] {
  return Object.values(ROLES)
}

// Get role by ID
export function getRoleById(roleId: RoleType): Role | null {
  return ROLES[roleId] || null
}

// Check if user has permission
export function hasPermission(userRoles: RoleType[], permission: string): boolean {
  for (const roleId of userRoles) {
    const role = ROLES[roleId]
    if (role) {
      // Check for exact match or wildcard match
      if (
        role.permissions.includes(permission) ||
        role.permissions.some((p) => p.endsWith(".*") && permission.startsWith(p.slice(0, -1)))
      ) {
        return true
      }
    }
  }
  return false
}

// Assign role to user
export async function assignRoleToUser(userId: string, roleId: RoleType, assignedBy: string): Promise<void> {
  const roleAssignmentRef = doc(db, "user_roles", `${userId}_${roleId}`)

  await setDoc(roleAssignmentRef, {
    userId,
    roleId,
    assignedAt: serverTimestamp(),
    assignedBy,
  })
}

// Remove role from user
export async function removeRoleFromUser(userId: string, roleId: RoleType): Promise<void> {
  const roleAssignmentRef = doc(db, "user_roles", `${userId}_${roleId}`)
  await deleteDoc(roleAssignmentRef)
}

// Get user roles
export async function getUserRoles(userId: string): Promise<RoleType[]> {
  const rolesQuery = query(collection(db, "user_roles"), where("userId", "==", userId))
  const rolesSnapshot = await getDocs(rolesQuery)

  return rolesSnapshot.docs.map((doc) => doc.data().roleId as RoleType)
}

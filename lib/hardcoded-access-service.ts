import { db } from "@/lib/firebase"
import { collection, doc, getDocs, query, where, setDoc, serverTimestamp } from "firebase/firestore"

export type RoleType = "admin" | "sales" | "logistics" | "cms"

export interface Role {
  id: RoleType
  name: string
  description: string
  color: string
}

export const HARDCODED_ROLES: Record<RoleType, Role> = {
  admin: {
    id: "admin",
    name: "Admin",
    description: "Full system access and user management",
    color: "red",
  },
  sales: {
    id: "sales",
    name: "Sales",
    description: "Client management, proposals, and quotations",
    color: "blue",
  },
  logistics: {
    id: "logistics",
    name: "Logistics",
    description: "Site management, assignments, and reports",
    color: "green",
  },
  cms: {
    id: "cms",
    name: "CMS",
    description: "Content creation and media management",
    color: "purple",
  },
}

export function getAllRoles(): Role[] {
  return Object.values(HARDCODED_ROLES)
}

export function getRoleById(roleId: RoleType): Role | null {
  return HARDCODED_ROLES[roleId] || null
}

export async function assignRoleToUser(uid: string, roleId: RoleType, assignedBy: string): Promise<void> {
  try {
    const userRoleRef = doc(db, "user_roles", uid)
    await setDoc(userRoleRef, {
      uid,
      role: roleId,
      assigned_by: assignedBy,
      assigned_at: serverTimestamp(),
    })
    console.log(`Role ${roleId} assigned to user ${uid}`)
  } catch (error) {
    console.error("Error assigning role:", error)
    throw error
  }
}

export async function getUserRoles(userId: string): Promise<RoleType[]> {
  try {
    const userRoleRef = doc(db, "user_roles", userId)
    const userRoleDoc = await getDocs(query(collection(db, "user_roles"), where("uid", "==", userId)))

    const roles: RoleType[] = []
    userRoleDoc.forEach((doc) => {
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

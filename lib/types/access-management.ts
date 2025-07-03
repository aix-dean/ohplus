export interface User {
  id: string
  email: string
  displayName: string
  photoURL?: string
  role?: string
}

export interface Role {
  id: string
  name: string
  description?: string
  permissions: string[] // e.g., ["inventory:view", "inventory:create"]
  createdAt: number
  updatedAt: number
}

export interface Permission {
  id: string
  name: string // e.g., "view_inventory"
  module: string // e.g., "inventory"
  action: "view" | "create" | "edit" | "delete"
  description?: string
}

export interface UserRole {
  userId: string
  roleId: string
  assignedAt: number
}

export interface RolePermission {
  roleId: string
  permissionId: string
  assignedAt: number
}

export interface Department {
  id: string
  name: string
  description: string
}

export const DEPARTMENTS = [
  { id: "sales", name: "Sales", description: "Sales department" },
  { id: "logistics", name: "Logistics", description: "Logistics department" },
  { id: "cms", name: "CMS", description: "Content Management System" },
  { id: "admin", name: "Admin", description: "Administration" },
]

export const PERMISSION_ACTIONS = [
  { id: "view", name: "View" },
  { id: "create", name: "Create" },
  { id: "edit", name: "Edit" },
  { id: "delete", name: "Delete" },
]

export type RoleType = "admin" | "sales" | "logistics" | "cms"

export interface Permission {
  module: string
  actions: string[]
}

export interface Role {
  id: RoleType
  name: string
  description: string
  color: string
  permissions: Permission[]
}

const HARDCODED_ROLES: Role[] = [
  {
    id: "admin",
    name: "Admin",
    description: "Full system access with administrative privileges",
    color: "red",
    permissions: [
      { module: "User Management", actions: ["create", "read", "update", "delete"] },
      { module: "Access Management", actions: ["create", "read", "update", "delete"] },
      { module: "System Settings", actions: ["create", "read", "update", "delete"] },
      { module: "Sales", actions: ["create", "read", "update", "delete"] },
      { module: "Logistics", actions: ["create", "read", "update", "delete"] },
      { module: "CMS", actions: ["create", "read", "update", "delete"] },
      { module: "Analytics", actions: ["read"] },
      { module: "Subscriptions", actions: ["create", "read", "update", "delete"] },
    ],
  },
  {
    id: "sales",
    name: "Sales",
    description: "Access to sales operations, client management, and proposals",
    color: "blue",
    permissions: [
      { module: "Clients", actions: ["create", "read", "update", "delete"] },
      { module: "Proposals", actions: ["create", "read", "update", "delete"] },
      { module: "Quotations", actions: ["create", "read", "update", "delete"] },
      { module: "Cost Estimates", actions: ["create", "read", "update", "delete"] },
      { module: "Job Orders", actions: ["create", "read", "update", "delete"] },
      { module: "Bookings", actions: ["create", "read", "update", "delete"] },
      { module: "Products", actions: ["create", "read", "update", "delete"] },
      { module: "Project Campaigns", actions: ["create", "read", "update", "delete"] },
      { module: "Sales Chat", actions: ["create", "read", "update"] },
      { module: "Sales Dashboard", actions: ["read"] },
      { module: "Sales Planner", actions: ["create", "read", "update"] },
    ],
  },
  {
    id: "logistics",
    name: "Logistics",
    description: "Access to logistics operations, site management, and field reports",
    color: "green",
    permissions: [
      { module: "Sites", actions: ["create", "read", "update", "delete"] },
      { module: "Service Assignments", actions: ["create", "read", "update", "delete"] },
      { module: "Service Reports", actions: ["create", "read", "update", "delete"] },
      { module: "Bulletin Board", actions: ["create", "read", "update", "delete"] },
      { module: "Alerts", actions: ["create", "read", "update", "delete"] },
      { module: "Logistics Dashboard", actions: ["read"] },
      { module: "Logistics Planner", actions: ["create", "read", "update"] },
      { module: "Weather Forecast", actions: ["read"] },
    ],
  },
  {
    id: "cms",
    name: "CMS",
    description: "Access to content management, media, and campaign planning",
    color: "purple",
    permissions: [
      { module: "Content", actions: ["create", "read", "update", "delete"] },
      { module: "Media Management", actions: ["create", "read", "update", "delete"] },
      { module: "Campaign Planning", actions: ["create", "read", "update", "delete"] },
      { module: "CMS Dashboard", actions: ["read"] },
      { module: "Content Planner", actions: ["create", "read", "update"] },
      { module: "Site Content", actions: ["create", "read", "update", "delete"] },
      { module: "Orders", actions: ["read", "update"] },
    ],
  },
]

export function getAllRoles(): Role[] {
  return HARDCODED_ROLES
}

export function getRoleById(roleId: RoleType): Role | undefined {
  return HARDCODED_ROLES.find((role) => role.id === roleId)
}

export function getRolePermissions(roleId: RoleType): Permission[] {
  const role = getRoleById(roleId)
  return role ? role.permissions : []
}

export function hasPermission(userRoles: RoleType[], module: string, action: string): boolean {
  return userRoles.some((roleId) => {
    const permissions = getRolePermissions(roleId)
    return permissions.some((permission) => permission.module === module && permission.actions.includes(action))
  })
}

export function hasModuleAccess(userRoles: RoleType[], module: string): boolean {
  return userRoles.some((roleId) => {
    const permissions = getRolePermissions(roleId)
    return permissions.some((permission) => permission.module === module)
  })
}

export function getUserAccessibleModules(userRoles: RoleType[]): string[] {
  const modules = new Set<string>()
  userRoles.forEach((roleId) => {
    const permissions = getRolePermissions(roleId)
    permissions.forEach((permission) => {
      modules.add(permission.module)
    })
  })
  return Array.from(modules)
}

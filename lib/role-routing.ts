export function getDashboardRouteByRole(role: string | null | undefined): string {
  // Ensure role is a string and handle null/undefined cases
  const roleString = typeof role === "string" ? role.toLowerCase() : ""

  switch (roleString) {
    case "admin":
      return "/admin/dashboard"
    case "sales":
      return "/sales/dashboard"
    case "logistics":
      return "/logistics/dashboard"
    case "cms":
      return "/cms/dashboard"
    default:
      return "/admin/dashboard" // Default fallback
  }
}

export function getDefaultRouteByRole(role: string | null | undefined): string {
  // This can be used for other redirects throughout the app
  return getDashboardRouteByRole(role)
}

export function canAccessAdminRoutes(role: string | null | undefined): boolean {
  const roleString = typeof role === "string" ? role.toLowerCase() : ""
  return roleString === "admin"
}

export function canAccessSalesRoutes(role: string | null | undefined): boolean {
  const roleString = typeof role === "string" ? role.toLowerCase() : ""
  return roleString === "admin" || roleString === "sales"
}

export function canAccessLogisticsRoutes(role: string | null | undefined): boolean {
  const roleString = typeof role === "string" ? role.toLowerCase() : ""
  return roleString === "admin" || roleString === "logistics"
}

export function canAccessCMSRoutes(role: string | null | undefined): boolean {
  const roleString = typeof role === "string" ? role.toLowerCase() : ""
  return roleString === "admin" || roleString === "cms"
}

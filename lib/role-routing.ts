export function getDashboardRouteByRole(role: string | null): string {
  switch (role?.toLowerCase()) {
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

export function getDefaultRouteByRole(role: string | null): string {
  // This can be used for other redirects throughout the app
  return getDashboardRouteByRole(role)
}

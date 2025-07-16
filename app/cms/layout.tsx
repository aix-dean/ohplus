import type React from "react"
import RouteProtection from "@/components/auth/RouteProtection"

export default function CMSLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <RouteProtection requiredRoles={["admin", "cms"]}>{children}</RouteProtection>
}

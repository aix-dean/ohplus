import type { ReactNode } from "react"
import RouteProtection from "@/components/auth/RouteProtection"

export default function LogisticsLayout({
  children,
}: {
  children: ReactNode
}) {
  return <RouteProtection requiredRoles={["admin", "logistics"]}>{children}</RouteProtection>
}

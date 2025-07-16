import type { ReactNode } from "react"
import RouteProtection from "@/components/auth/RouteProtection"

interface LogisticsLayoutProps {
  children: ReactNode
}

export default function LogisticsLayout({ children }: LogisticsLayoutProps) {
  return <RouteProtection requiredRoles={["admin", "logistics"]}>{children}</RouteProtection>
}

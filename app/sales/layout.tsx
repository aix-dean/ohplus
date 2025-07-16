import type React from "react"
import { RouteProtection } from "@/components/RouteProtection"

export default function SalesLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <RouteProtection requiredRoles={["admin", "sales"]}>{children}</RouteProtection>
}

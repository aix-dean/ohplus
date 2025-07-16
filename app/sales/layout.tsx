import type React from "react"
import { RouteProtection } from "@/components/route-protection"
import { SalesChatWidget } from "@/components/SalesChatWidget"

export default function SalesLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <RouteProtection requiredRoles={["admin", "sales"]}>
      <div className="w-full">
        {children}
        <SalesChatWidget />
      </div>
    </RouteProtection>
  )
}

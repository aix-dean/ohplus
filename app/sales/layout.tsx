import type React from "react"
import { SalesChatWidget } from "@/components/sales-chat/sales-chat-widget"
import { RoleGuard } from "@/components/role-guard"

export default function SalesLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <RoleGuard allowedRoles={["sales", "admin"]}>
      <div className="w-full">
        {children}
        <SalesChatWidget />
      </div>
    </RoleGuard>
  )
}

import type React from "react"
import { RoleGuard } from "@/components/role-guard"

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <RoleGuard allowedRoles={["admin"]}>{children}</RoleGuard>
}

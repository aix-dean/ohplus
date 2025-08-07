import { RouteProtection } from "@/components/route-protection"

export default function FinanceLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <RouteProtection allowedRoles={["admin", "finance", "manager"]}>
      {children}
    </RouteProtection>
  )
}

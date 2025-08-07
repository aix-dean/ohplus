"use client"

import { useAuth } from "@/contexts/auth-context"
import { RouteProtection } from "@/components/route-protection"

export default function ITLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    )
  }

  return (
    <RouteProtection requiredRoles={["it_admin", "system_admin", "super_admin"]}>
      <div className="min-h-screen bg-gray-50">
        {children}
      </div>
    </RouteProtection>
  )
}

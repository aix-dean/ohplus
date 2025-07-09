"use client"

import type React from "react"
import { useRouteProtection } from "@/hooks/use-route-protection"

export default function LogisticsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { hasAccess, loading } = useRouteProtection("/logistics")

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (!hasAccess) {
    return null
  }

  return <>{children}</>
}

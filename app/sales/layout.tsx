"use client"

import type React from "react"
import { SalesChatWidget } from "@/components/sales-chat/sales-chat-widget"
import { useRouteProtection } from "@/hooks/use-route-protection"

export default function SalesLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { hasAccess, loading } = useRouteProtection("/sales")

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

  return (
    <div className="w-full">
      {children}
      <SalesChatWidget />
    </div>
  )
}

"use client"

import type React from "react"
import { RouteProtection } from "@/components/route-protection"

export default function LogisticsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <RouteProtection requiredRoles={["admin", "logistics"]}>{children}</RouteProtection>
}

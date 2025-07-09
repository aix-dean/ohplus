"use client"

import type React from "react"

import { RoleGuard } from "@/components/role-guard"
import { SideNavigation } from "@/components/side-navigation"
import { TopNavigation } from "@/components/top-navigation"

export default function SalesLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <RoleGuard allowedRoles={["admin", "sales"]}>
      <div className="flex h-screen bg-gray-100">
        <SideNavigation />
        <div className="flex-1 flex flex-col overflow-hidden">
          <TopNavigation />
          <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-100">
            <div className="container mx-auto px-6 py-8">{children}</div>
          </main>
        </div>
      </div>
    </RoleGuard>
  )
}

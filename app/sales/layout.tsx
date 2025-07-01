"use client"

import type React from "react"

import { SideNavigation } from "@/components/side-navigation"
import { TopNavigation } from "@/components/top-navigation"
import { SalesChatWidget } from "@/components/sales-chat/sales-chat-widget"
import { SalesBreadcrumbHeader } from "@/components/sales-breadcrumb-header" // New import

export default function SalesLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen w-full">
      <SideNavigation currentSection="sales" />
      <div className="flex flex-1 flex-col">
        <TopNavigation /> {/* Global top navigation */}
        <SalesBreadcrumbHeader /> {/* Sales-specific header/breadcrumb */}
        <main className="flex-1 overflow-auto">{children}</main>
      </div>
      <SalesChatWidget />
    </div>
  )
}

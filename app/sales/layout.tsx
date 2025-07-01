import type React from "react"
import { SalesBreadcrumbHeader } from "@/components/sales-breadcrumb-header"
import { FixedHeader } from "@/components/fixed-header"
import { SideNavigation } from "@/components/side-navigation"

export default function SalesLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen w-full flex-col bg-muted/40">
      <SideNavigation />
      <div className="flex flex-col sm:gap-4 sm:py-4 sm:pl-14">
        <FixedHeader />
        <SalesBreadcrumbHeader /> {/* Include the new breadcrumb header here */}
        {children}
      </div>
    </div>
  )
}

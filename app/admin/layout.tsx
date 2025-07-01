import type React from "react"
import { FixedHeader } from "@/components/fixed-header"
import { SideNavigation } from "@/components/side-navigation"

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen w-full flex-col bg-muted/40">
      <div className="flex flex-col sm:gap-4 sm:py-4 sm:pl-14">
        <FixedHeader onMenuClick={() => {}} />
        <div className="flex flex-1">
          <SideNavigation />
          <main className="flex-1 overflow-auto">{children}</main>
        </div>
      </div>
    </div>
  )
}

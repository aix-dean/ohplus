import type React from "react"
import { FixedHeader } from "@/components/fixed-header"
import { SideNavigation } from "@/components/side-navigation"

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex min-h-screen w-full flex-col">
      <FixedHeader onMenuClick={() => {}} /> {/* onMenuClick is a placeholder */}
      <div className="flex flex-1">
        <SideNavigation />
        <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-6">{children}</main>
      </div>
    </div>
  )
}

import type React from "react"
import { SideNavigation } from "@/components/side-navigation"
import { TopNavigation } from "@/components/top-navigation"

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen w-full flex-col">
      <TopNavigation />
      <div className="flex flex-1">
        <SideNavigation />
        <main className="flex flex-1 flex-col overflow-hidden">{children}</main>
      </div>
    </div>
  )
}

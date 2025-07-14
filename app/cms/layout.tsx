import type React from "react"
import { SideNavigation } from "@/components/side-navigation"

export default function CMSLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex h-screen bg-gray-50">
      <SideNavigation />
      <div className="flex-1 flex flex-col overflow-hidden">{children}</div>
    </div>
  )
}

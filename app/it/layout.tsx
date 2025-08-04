import type React from "react"
import { SideNavigation } from "@/components/side-navigation"

export default function ITLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex h-screen bg-gray-100">
      <SideNavigation />
      <main className="flex-1 overflow-y-auto">{children}</main>
    </div>
  )
}

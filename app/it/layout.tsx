import type React from "react"
import { SideNavigation } from "@/components/side-navigation"

export default function ITLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex h-[calc(100vh-64px)]">
      <SideNavigation />
      <main className="flex-1 overflow-y-auto">{children}</main>
    </div>
  )
}

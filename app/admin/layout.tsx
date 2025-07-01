import type React from "react"
import { FixedHeader } from "@/components/fixed-header"
import { SideNavigation } from "@/components/side-navigation"
import { Toaster } from "@/components/ui/toaster"
import { useIsAdmin } from "@/hooks/use-is-admin"
import { redirect } from "next/navigation"

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const isAdmin = useIsAdmin()

  if (!isAdmin) {
    redirect("/")
  }

  return (
    <div className="flex min-h-screen w-full">
      <SideNavigation />
      <div className="flex flex-1 flex-col">
        <FixedHeader /> {/* This is the global fixed header */}
        <main className="flex-1 overflow-auto">{children}</main>
      </div>
      <Toaster />
    </div>
  )
}

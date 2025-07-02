import type React from "react"
import { AuthProvider } from "@/contexts/auth-context"
import { FixedHeader } from "@/components/fixed-header"
import { SideNavigation } from "@/components/side-navigation"

export default function CMSLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <div className="flex min-h-screen w-full flex-col bg-muted/40">
        <SideNavigation />
        <div className="flex flex-col sm:gap-4 sm:py-4 sm:pl-14">
          <FixedHeader />
          {children}
        </div>
      </div>
    </AuthProvider>
  )
}

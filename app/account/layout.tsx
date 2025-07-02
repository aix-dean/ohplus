import type React from "react"
// Removed FixedHeader and TopNavigation imports as they will no longer be used in this layout
// import { FixedHeader } from "@/components/fixed-header"
// import { TopNavigation } from "@/components/top-navigation"
// Removed SideNavigation import as it will no longer be used in this layout
// import { SideNavigation } from "@/components/side-navigation"

export default function AccountLayout({ children }: { children: React.ReactNode }) {
  return (
    // The account page will now take full width without the fixed header or side navigation
    <div className="flex min-h-screen w-full flex-col">
      {/* Removed FixedHeader component */}
      {/* Removed SideNavigation component, main content will now span full width */}
      <main className="flex flex-1 flex-col">{children}</main>
    </div>
  )
}

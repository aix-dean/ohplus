import type React from "react"
import { FixedHeader } from "@/components/fixed-header" // Re-import FixedHeader

export default function AccountLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen w-full flex-col">
      <FixedHeader onMenuClick={() => {}} /> {/* Re-add FixedHeader */}
      <main className="flex flex-1 flex-col">{children}</main>
    </div>
  )
}

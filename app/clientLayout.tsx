"use client"

import type { ReactNode } from "react"
import { usePathname } from "next/navigation"

export default function ClientLayout({
  children,
}: {
  children: ReactNode
}) {
  const pathname = usePathname()

  // Skip the layout for login and register pages
  if (pathname === "/login" || pathname === "/register" || pathname === "/forgot-password") {
    return <>{children}</>
  }

  // For logistics routes, the layout is handled by the logistics layout
  if (pathname?.startsWith("/logistics")) {
    return <>{children}</>
  }

  // For other sections, you can add their specific layouts here
  // For now, return a basic layout for non-logistics routes
  return <div className="min-h-screen bg-gray-50">{children}</div>
}

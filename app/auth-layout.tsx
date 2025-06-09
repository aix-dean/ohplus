"use client"

import type React from "react"

import { usePathname } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import ClientLayout from "./clientLayout"

// List of public routes that don't require authentication
const publicRoutes = ["/login", "/register", "/forgot-password"]

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const { user, loading } = useAuth()

  // Check if the current path is a public route
  const isPublicRoute = publicRoutes.includes(pathname)

  // Check if it's a public proposal view - this should be accessible without auth
  const isPublicProposal = pathname?.startsWith("/proposals/view/")

  // If it's a public proposal, render without navigation and without auth check
  if (isPublicProposal) {
    return <div className="min-h-screen bg-gray-50">{children}</div>
  }

  // If it's a public route, render the children directly without the ClientLayout
  if (isPublicRoute) {
    return <>{children}</>
  }

  // For protected routes, show loading state while checking authentication
  if (loading) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-t-2 border-gray-900"></div>
      </div>
    )
  }

  // For protected routes, wrap with ClientLayout
  return <ClientLayout>{children}</ClientLayout>
}

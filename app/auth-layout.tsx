"use client"

import type React from "react"
import { AuthProvider } from "@/contexts/auth-context"
import { usePathname } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import ClientLayout from "./clientLayout"

interface AuthLayoutProps {
  children: React.ReactNode
}

const RedirectToLogin = () => {
  // Directly use the relative path for internal navigation
  window.location.href = "/login"
  return null
}

const publicRoutes = [
  "/login",
  "/register",
  "/forgot-password",
  "/register/select-subscription",
  "/onboarding", // New public route for the multi-step onboarding
]

const AuthLayout = ({ children }: AuthLayoutProps) => {
  const { user, userData, loading } = useAuth() // Get userData here
  const pathname = usePathname()

  const isPublicRoute = publicRoutes.includes(pathname) || pathname?.startsWith("/onboarding") // Handle dynamic onboarding path
  const isPublicProposal = pathname?.startsWith("/proposals/view/")

  // If it's a public proposal view, render without navigation and without auth check
  if (isPublicProposal) {
    return <div className="min-h-screen bg-gray-50">{children}</div>
  }

  // If it's a public route (login, register, select-subscription, onboarding), render directly
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

  // If user is not logged in and trying to access a protected route, redirect to login
  if (!user) {
    return <RedirectToLogin />
  }

  // User is logged in. Now, check onboarding status.
  // If userData is loaded, and onboarding is true, and they are NOT on an allowed onboarding-related public route, redirect them.
  if (user && userData && userData.onboarding) {
    // If they are logged in, onboarding is true, and they are trying to access a non-onboarding protected route
    // Redirect them to the first step of the onboarding flow (select-subscription)
    if (pathname !== "/register/select-subscription" && !pathname.startsWith("/onboarding")) {
      window.location.href = "/register/select-subscription"
      return null // Prevent rendering anything else
    }
  }

  // If all checks pass (user is logged in, onboarding complete or on an allowed onboarding page), render ClientLayout
  return <ClientLayout>{children}</ClientLayout>
}

export default function AuthLayoutWrapper({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <AuthLayout>{children}</AuthLayout>
    </AuthProvider>
  )
}

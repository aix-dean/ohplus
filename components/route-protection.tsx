"use client"

import type React from "react"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import type { RoleType } from "@/lib/hardcoded-access-service"

interface RouteProtectionProps {
  children: React.ReactNode
  requiredRoles: RoleType | RoleType[]
  redirectTo?: string
}

export function RouteProtection({ children, requiredRoles, redirectTo = "/unauthorized" }: RouteProtectionProps) {
  const { user, userData, loading, hasRole, isAdmin } = useAuth()
  const router = useRouter()
  const [authorized, setAuthorized] = useState(false)

  useEffect(() => {
    // Wait until auth state is loaded
    if (loading) return

    // If not logged in, redirect to login
    if (!user) {
      router.push("/login")
      return
    }

    // If user data is not loaded yet, wait
    if (!userData) return

    // Admin users have unrestricted access to all pages
    if (isAdmin()) {
      setAuthorized(true)
      return
    }

    // For non-admin users, check if they have required role(s)
    if (!hasRole(requiredRoles)) {
      router.push(redirectTo)
      return
    }

    // User is authorized
    setAuthorized(true)
  }, [user, userData, loading, hasRole, isAdmin, requiredRoles, router, redirectTo])

  // Show loading state while checking authorization
  if (loading || !authorized) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-t-2 border-gray-900"></div>
      </div>
    )
  }

  // Render children if authorized
  return <>{children}</>
}

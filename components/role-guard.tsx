"use client"

import type React from "react"

import { useAuth } from "@/contexts/auth-context"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { getDashboardRouteByRole } from "@/lib/role-routing"

interface RoleGuardProps {
  children: React.ReactNode
  allowedRoles: string[]
  redirectTo?: string
}

export function RoleGuard({ children, allowedRoles, redirectTo }: RoleGuardProps) {
  const { user, userData, loading } = useAuth()
  const router = useRouter()
  const [isAuthorized, setIsAuthorized] = useState(false)

  useEffect(() => {
    if (loading) return

    if (!user) {
      router.push("/login")
      return
    }

    if (!userData) {
      // Wait for userData to load
      return
    }

    const userRole = userData.role?.toLowerCase()
    const hasAccess = allowedRoles.some((role) => role.toLowerCase() === userRole)

    if (!hasAccess) {
      // Redirect to appropriate dashboard or specified route
      const redirectRoute = redirectTo || getDashboardRouteByRole(userData.role)
      router.push(redirectRoute)
      return
    }

    setIsAuthorized(true)
  }, [user, userData, loading, allowedRoles, redirectTo, router])

  if (loading || !isAuthorized) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  return <>{children}</>
}

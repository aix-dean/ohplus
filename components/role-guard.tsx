"use client"

import type React from "react"

import { useAuth } from "@/contexts/auth-context"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { getDashboardRouteByRole } from "@/lib/role-routing"

interface RoleGuardProps {
  children: React.ReactNode
  allowedRoles: string[]
  fallbackRoute?: string
}

export function RoleGuard({ children, allowedRoles, fallbackRoute }: RoleGuardProps) {
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

    const userRole = userData.role?.toLowerCase() || ""
    const hasAccess = allowedRoles.some((role) => role.toLowerCase() === userRole)

    if (!hasAccess) {
      const redirectRoute = fallbackRoute || getDashboardRouteByRole(userData.role)
      router.push(redirectRoute)
      return
    }

    setIsAuthorized(true)
  }, [user, userData, loading, allowedRoles, fallbackRoute, router])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!user) {
    return null // Will redirect to login
  }

  if (!isAuthorized) {
    return null // Will redirect to appropriate dashboard
  }

  return <>{children}</>
}

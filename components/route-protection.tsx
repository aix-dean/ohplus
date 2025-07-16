"use client"

import type React from "react"

import { useAuth } from "@/contexts/auth-context"
import { useRouter } from "next/navigation"
import { useEffect } from "react"
import type { RoleType } from "@/lib/hardcoded-access-service"

interface RouteProtectionProps {
  children: React.ReactNode
  requiredRoles: RoleType | RoleType[]
}

export function RouteProtection({ children, requiredRoles }: RouteProtectionProps) {
  const { user, userData, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login")
      return
    }

    if (!loading && user && userData) {
      const userRoles = userData.roles || []
      const requiredRolesArray = Array.isArray(requiredRoles) ? requiredRoles : [requiredRoles]

      // Admin users can access all sections
      const hasAdminAccess = userRoles.includes("admin")
      const hasRequiredRole = requiredRolesArray.some((role) => userRoles.includes(role))

      if (!hasAdminAccess && !hasRequiredRole) {
        router.push("/unauthorized")
      }
    }
  }, [user, userData, loading, router, requiredRoles])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  return <>{children}</>
}

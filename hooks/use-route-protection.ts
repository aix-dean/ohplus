"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/contexts/auth-context"
import { canUserAccessRoute } from "@/lib/access-management-service"
import { useRouter } from "next/navigation"

export function useRouteProtection(requiredRoute: string) {
  const { user, loading: authLoading } = useAuth()
  const [hasAccess, setHasAccess] = useState<boolean>(false)
  const [loading, setLoading] = useState<boolean>(true)
  const router = useRouter()

  useEffect(() => {
    async function checkAccess() {
      if (authLoading) return

      if (!user) {
        setHasAccess(false)
        setLoading(false)
        router.push("/login")
        return
      }

      try {
        const canAccess = await canUserAccessRoute(user.uid, requiredRoute)
        setHasAccess(canAccess)

        if (!canAccess) {
          // Redirect to appropriate dashboard based on user's role
          router.push("/dashboard")
        }
      } catch (error) {
        console.error("Error checking route access:", error)
        setHasAccess(false)
        router.push("/dashboard")
      } finally {
        setLoading(false)
      }
    }

    checkAccess()
  }, [user, authLoading, requiredRoute, router])

  return { hasAccess, loading }
}

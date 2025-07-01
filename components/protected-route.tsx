"use client"

import type React from "react"
import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { useSubscriptionGuard } from "@/hooks/use-subscription-guard" // Import the hook

interface ProtectedRouteProps {
  children: React.ReactNode
  module?: string
  action?: string
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, module, action }) => {
  const { user, loading: authLoading } = useAuth()
  const { isLoading: subscriptionLoading, isSubscriptionActive } = useSubscriptionGuard() // Get subscription status

  const router = useRouter()

  useEffect(() => {
    if (!authLoading && !subscriptionLoading) {
      if (!user) {
        // User is not authenticated, redirect to login
        router.push("/login")
      } else if (!isSubscriptionActive) {
        // User is authenticated but subscription is not active, redirect to subscription page
        router.push("/settings/subscription")
      }
    }
  }, [user, authLoading, subscriptionLoading, isSubscriptionActive, router])

  if (authLoading || subscriptionLoading) {
    return <div>Loading...</div> // Show loading while checking auth and subscription
  }

  if (!user || !isSubscriptionActive) {
    // If not authenticated or subscription not active, return null (redirection handled by useEffect)
    return null
  }

  // If authenticated and subscription is active, render children
  return <>{children}</>
}

export default ProtectedRoute

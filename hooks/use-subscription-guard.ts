"use client"

import { useEffect, useState } from "react"
import { useAuth } from "@/contexts/auth-context"
import { subscriptionService } from "@/lib/subscription-service"

interface SubscriptionGuardResult {
  isLoading: boolean
  isSubscriptionActive: boolean
  isSubscriptionExpired: boolean
  daysRemaining: number
  canCreateProducts: boolean
  currentProductCount: number
  maxProducts: number | null
  subscriptionData: any
}

export function useSubscriptionGuard(): SubscriptionGuardResult {
  const { userData, subscriptionData, loading: authLoading } = useAuth()
  const [isLoading, setIsLoading] = useState(true)
  const [isSubscriptionActive, setIsSubscriptionActive] = useState(false)
  const [isSubscriptionExpired, setIsSubscriptionExpired] = useState(true)
  const [daysRemaining, setDaysRemaining] = useState(0)
  const [canCreateProducts, setCanCreateProducts] = useState(false)
  const [currentProductCount, setCurrentProductCount] = useState(0)

  useEffect(() => {
    const checkSubscription = async () => {
      if (authLoading || !userData?.license_key || !subscriptionData) {
        setIsLoading(false)
        return
      }

      try {
        // Check if subscription is active
        const isActive = await subscriptionService.isSubscriptionActive(userData.license_key)
        setIsSubscriptionActive(isActive)

        // Check if subscription is expired
        const isExpired = await subscriptionService.isSubscriptionExpired(userData.license_key)
        setIsSubscriptionExpired(isExpired)

        // Get days remaining
        const days = await subscriptionService.getDaysRemaining(userData.license_key)
        setDaysRemaining(days)

        // Check if user can create products (subscription active and within limits)
        const canCreate = isActive && !isExpired
        setCanCreateProducts(canCreate)

        // Note: currentProductCount would need to be fetched from firebase-service
        // For now, we'll use 0 as placeholder
        setCurrentProductCount(0)
      } catch (error) {
        console.error("Error checking subscription:", error)
        setIsSubscriptionActive(false)
        setIsSubscriptionExpired(true)
        setDaysRemaining(0)
        setCanCreateProducts(false)
      } finally {
        setIsLoading(false)
      }
    }

    checkSubscription()
  }, [authLoading, userData, subscriptionData])

  return {
    isLoading,
    isSubscriptionActive,
    isSubscriptionExpired,
    daysRemaining,
    canCreateProducts,
    currentProductCount,
    maxProducts: subscriptionData?.maxProducts || null,
    subscriptionData,
  }
}

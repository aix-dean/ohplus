"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/contexts/auth-context"
import { getUserProductsCount } from "@/lib/firebase-service"
import { Timestamp } from "firebase/firestore"

/**
 * Custom hook to check if the user can perform actions based on their subscription limits.
 * Currently checks for product creation limits.
 */
export function useSubscriptionGuard() {
  const { user, projectData, loading: authLoading, userData } = useAuth()
  const [canCreateProduct, setCanCreateProduct] = useState(false)
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState<string | null>(null)

  useEffect(() => {
    async function checkSubscriptionLimits() {
      if (authLoading) {
        setLoading(true)
        return
      }

      if (!user || !projectData || !userData) {
        setCanCreateProduct(false)
        setMessage("Authentication or project data not available.")
        setLoading(false)
        return
      }

      const { max_products, subscription_end_date } = projectData

      // Check time-based validity first
      let isSubscriptionActive = true
      let timeBasedMessage: string | null = null

      if (subscription_end_date instanceof Timestamp) {
        const endDate = subscription_end_date.toDate()
        const now = new Date()
        if (now > endDate) {
          isSubscriptionActive = false
          timeBasedMessage = "Your subscription has expired. Please renew to continue using all features."
        }
      } else if (subscription_end_date === undefined) {
        // If subscription_end_date is not set, assume it's active for now, but log a warning
        console.warn("subscription_end_date is undefined for project:", projectData.id)
      }

      if (!isSubscriptionActive) {
        setCanCreateProduct(false)
        setMessage(timeBasedMessage)
        setLoading(false)
        return
      }

      // If subscription is active, then check product limits
      if (max_products === null) {
        setCanCreateProduct(true)
        setMessage(null)
        setLoading(false)
        return
      }

      try {
        // Get the current count of non-deleted products for the user
        const currentProductsCount = await getUserProductsCount(user.uid, { deleted: false })

        if (currentProductsCount < max_products) {
          setCanCreateProduct(true)
          setMessage(null)
        } else {
          setCanCreateProduct(false)
          setMessage(
            `You have reached your product upload limit of ${max_products} sites. Please upgrade your subscription to add more sites.`,
          )
        }
      } catch (error) {
        console.error("Error checking subscription limits:", error)
        setCanCreateProduct(false)
        setMessage("Failed to check subscription limits. Please try again.")
      } finally {
        setLoading(false)
      }
    }

    checkSubscriptionLimits()
  }, [user, projectData, authLoading, userData])

  return { canCreateProduct, loading, message }
}

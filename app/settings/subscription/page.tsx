"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { CheckCircle2, XCircle, Loader2 } from 'lucide-react'
import { useAuth } from "@/contexts/auth-context"
import { useToast } from "@/hooks/use-toast"
import { getSubscriptionPlans, subscriptionService } from "@/lib/subscription-service"
import { type SubscriptionPlan, type SubscriptionPlanType } from "@/lib/types/subscription"

export default function SubscriptionSettingsPage() {
  const { user, userData, subscriptionData, refreshSubscriptionData } = useAuth()
  const { toast } = useToast()
  const [availablePlans, setAvailablePlans] = useState<SubscriptionPlan[]>([])
  const [loadingPlans, setLoadingPlans] = useState(true)
  const [isUpdatingSubscription, setIsUpdatingSubscription] = useState(false)

  useEffect(() => {
    // Fetch available plans (these are static for now, but could be dynamic)
    setAvailablePlans(getSubscriptionPlans())
    setLoadingPlans(false)
  }, [])

  const handleSelectPlan = useCallback(
    async (planId: string) => {
      if (!user || !userData?.license_key) {
        toast({
          title: "Authentication Required",
          description: "Please log in to manage your subscription.",
          variant: "destructive",
        })
        return
      }

      setIsUpdatingSubscription(true)
      try {
        const selectedPlan = availablePlans.find((plan) => plan.id === planId)
        if (!selectedPlan) {
          toast({
            title: "Error",
            description: "Selected plan not found.",
            variant: "destructive",
          })
          return
        }

        const newPlanType: SubscriptionPlanType = selectedPlan.id as SubscriptionPlanType
        const billingCycle = "monthly" // Assuming monthly for simplicity, could be selected by user

        if (subscriptionData) {
          // Update existing subscription
          await subscriptionService.updateSubscription(userData.license_key, {
            planType: newPlanType,
            billingCycle: billingCycle,
            status: "active", // Set to active upon selection
          })
          toast({
            title: "Subscription Updated",
            description: `Your plan has been updated to ${selectedPlan.name}.`,
          })
        } else {
          // Create new subscription if none exists
          await subscriptionService.createSubscription(
            userData.license_key,
            newPlanType,
            billingCycle,
            user.uid,
          )
          toast({
            title: "Subscription Activated",
            description: `Welcome to the ${selectedPlan.name}!`,
          })
        }

        await refreshSubscriptionData() // Refresh the context after update/creation
      } catch (error) {
        console.error("Failed to select plan:", error)
        toast({
          title: "Error",
          description: `Failed to update subscription: ${error instanceof Error ? error.message : String(error)}`,
          variant: "destructive",
        })
      } finally {
        setIsUpdatingSubscription(false)
      }
    },
    [user, userData, subscriptionData, availablePlans, refreshSubscriptionData, toast],
  )

  const isCurrentPlan = useCallback(
    (planId: string) => {
      return subscriptionData?.planType === planId
    },
    [subscriptionData],
  )

  if (loadingPlans) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4">
        <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
        <span className="ml-2 text-gray-600">Loading plans...</span>
      </div>
    )
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-start bg-gray-50 p-4 sm:p-6 lg:p-8 pt-8">
      <Card className="w-full max-w-4xl shadow-lg">
        <CardHeader className="pb-6 text-center">
          <CardTitle className="text-4xl font-extrabold text-gray-900">Choose Your Plan</CardTitle>
          <CardDescription className="text-lg text-gray-600 mt-2">
            Select the perfect plan that fits your business needs.
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {availablePlans.map((plan) => (
              <Card
                key={plan.id}
                className={`flex flex-col p-6 border-2 ${
                  isCurrentPlan(plan.id) ? "border-blue-500 shadow-md" : "border-gray-200"
                } transition-all duration-200 hover:shadow-lg`}
              >
                <CardHeader className="p-0 pb-4">
                  <div className="flex justify-between items-center">
                    <CardTitle className="text-2xl font-bold text-gray-800">{plan.name}</CardTitle>
                    {isCurrentPlan(plan.id) && (
                      <span className="inline-flex items-center rounded-full bg-blue-100 px-3 py-1 text-sm font-medium text-blue-700">
                        <CheckCircle2 className="h-4 w-4 mr-1" /> Current Plan
                      </span>
                    )}
                  </div>
                  <CardDescription className="text-gray-500 mt-1">
                    {plan.price === 0 ? "Free" : `₱${plan.price.toFixed(2)} / month`}
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-0 flex-grow">
                  <ul className="space-y-2 text-gray-700">
                    {plan.features.map((feature, index) => (
                      <li key={index} className="flex items-center">
                        <CheckCircle2 className="h-4 w-4 text-green-500 mr-2 flex-shrink-0" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
                <div className="pt-6">
                  {!isCurrentPlan(plan.id) ? (
                    <Button
                      className="w-full"
                      onClick={() => handleSelectPlan(plan.id)}
                      disabled={isUpdatingSubscription || !user || !userData?.license_key}
                    >
                      {isUpdatingSubscription && (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      )}
                      Select Plan
                    </Button>
                  ) : (
                    <Button className="w-full" variant="outline" disabled>
                      Manage Plan
                    </Button>
                  )}
                </div>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>
    </main>
  )
}

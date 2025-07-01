"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { useAuth } from "@/contexts/auth-context"
import { getSubscriptionPlans, subscriptionService } from "@/lib/subscription-service"
import type { BillingCycle, SubscriptionPlanType } from "@/lib/types/subscription"
import { CheckCircle, Loader2 } from "lucide-react"
import { useRouter } from "next/navigation"
import { useEffect, useState, useCallback } from "react"
import { useToast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"
import { PromoBanner } from "@/components/promo-banner" // Import the new component

export default function SubscriptionPage() {
  const { user, userData, subscriptionData, loading, refreshSubscriptionData } = useAuth()
  const { toast } = useToast()
  const router = useRouter()
  const [isUpdating, setIsUpdating] = useState(false)
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null)

  const plans = getSubscriptionPlans()

  // Define a fixed promo end date for the "GRAPHIC EXPO '25 PROMO"
  // This date is set to be 2 days, 14 hours, 30 seconds from the current time
  // for demonstration purposes, to match the screenshot.
  const promoEndDate = new Date()
  promoEndDate.setDate(promoEndDate.getDate() + 2)
  promoEndDate.setHours(promoEndDate.getHours() + 14)
  promoEndDate.setMinutes(promoEndDate.getMinutes() + 30)
  promoEndDate.setSeconds(promoEndDate.getSeconds() + 0)

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login")
    }
  }, [loading, user, router])

  const handleUpgrade = useCallback(
    async (planId: string) => {
      if (!user || !userData?.license_key) {
        toast({
          title: "Authentication Required",
          description: "Please log in to manage your subscription.",
          variant: "destructive",
        })
        return
      }

      setIsUpdating(true)
      setSelectedPlanId(planId)

      try {
        const selectedPlan = plans.find((plan) => plan.id === planId)
        if (!selectedPlan) {
          toast({
            title: "Error",
            description: "Selected plan not found.",
            variant: "destructive",
          })
          return
        }

        if (selectedPlan.id === "enterprise") {
          toast({
            title: "Enterprise Plan",
            description: "Please contact us directly for Enterprise plan inquiries.",
            variant: "default",
          })
          return // Do not proceed with Firebase update for Enterprise
        }

        const newPlanType: SubscriptionPlanType = selectedPlan.id as SubscriptionPlanType
        const billingCycle: BillingCycle = selectedPlan.billingCycle === "N/A" ? "monthly" : selectedPlan.billingCycle // Default to monthly if N/A

        let success = false
        if (subscriptionData) {
          try {
            await subscriptionService.updateSubscription(userData.license_key, {
              planType: newPlanType,
              billingCycle: billingCycle,
              status: "active",
              startDate: new Date(),
              trialEndDate: null,
            })
            success = true
            toast({
              title: "Subscription Updated",
              description: `Your plan has been updated to ${selectedPlan.name}.`,
            })
          } catch (updateError: any) {
            console.warn("Failed to update subscription, attempting to create instead:", updateError)
            await subscriptionService.createSubscription(userData.license_key, newPlanType, billingCycle, user.uid)
            success = true
            toast({
              title: "Subscription Activated",
              description: `Welcome to the ${selectedPlan.name}! (New subscription created)`,
            })
          }
        } else {
          await subscriptionService.createSubscription(userData.license_key, newPlanType, billingCycle, user.uid)
          success = true
          toast({
            title: "Subscription Activated",
            description: `Welcome to the ${selectedPlan.name}!`,
          })
        }

        if (success) {
          await refreshSubscriptionData()
        }
      } catch (error: any) {
        console.error("Failed to select plan:", error)
        toast({
          title: "Error",
          description: `Failed to update subscription: ${error instanceof Error ? error.message : String(error)}`,
          variant: "destructive",
        })
      } finally {
        setIsUpdating(false)
        setSelectedPlanId(null)
      }
    },
    [user, userData, subscriptionData, plans, refreshSubscriptionData, toast],
  )

  const isCurrentPlan = useCallback(
    (planId: string) => {
      return subscriptionData?.planType === planId
    },
    [subscriptionData],
  )

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    )
  }

  const currentPlan = subscriptionData?.planType || "N/A"

  return (
    <main className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        {/* Render the PromoBanner component */}
        <PromoBanner promoEndDate={promoEndDate} />

        {/* Moved "Your Current Subscription" section here */}
        <Separator className="my-12" />

        <Card className="mx-auto max-w-2xl rounded-xl shadow-sm">
          <CardHeader className="border-b p-6">
            <CardTitle className="text-xl font-bold text-gray-900">Your Current Subscription</CardTitle>
            <CardDescription className="mt-2 text-gray-600">Details of your active plan and usage.</CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-1">
                <p className="text-sm font-medium text-gray-700">Plan Type</p>
                <p className="text-lg font-semibold capitalize text-gray-900">{subscriptionData?.planType || "N/A"}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium text-gray-700">Status</p>
                <p className="text-lg font-semibold capitalize text-gray-900">{subscriptionData?.status || "N/A"}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium text-gray-700">Max Products</p>
                <p className="text-lg font-semibold text-gray-900">
                  {subscriptionData?.maxProducts === 99999 ? "Unlimited" : subscriptionData?.maxProducts || "N/A"}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium text-gray-700">Trial End Date</p>
                <p className="text-lg font-semibold text-gray-900">
                  {subscriptionData?.trialEndDate
                    ? new Date(subscriptionData.trialEndDate).toLocaleDateString()
                    : "N/A"}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium text-gray-700">Days Remaining (Trial)</p>
                <p className="text-lg font-semibold text-gray-900">
                  {subscriptionData ? subscriptionService.getDaysRemaining(subscriptionData) : "N/A"}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">Choose Your Plan</h1>
          <p className="mt-3 text-lg text-gray-600">Select the perfect plan that fits your business needs.</p>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
          {plans
            .filter((plan) => plan.id !== "trial" && plan.id !== "graphic-expo-event")
            .map((plan) => (
              <Card
                key={plan.id}
                className={cn(
                  "flex flex-col rounded-xl border-2 shadow-sm transition-all duration-200",
                  currentPlan === plan.id
                    ? "border-primary ring-2 ring-primary/50"
                    : "border-gray-200 hover:border-primary/50",
                )}
              >
                <CardHeader className="border-b p-6">
                  <CardTitle className="text-2xl font-bold capitalize text-gray-900">{plan.name}</CardTitle>
                  <CardDescription className="mt-2 text-gray-600 min-h-[40px]">{plan.description}</CardDescription>
                  <div className="mt-4">
                    {plan.price === 0 && plan.id === "enterprise" ? (
                      <span className="text-3xl font-bold text-gray-900">Contact Us</span>
                    ) : (
                      <span className="text-3xl font-bold text-gray-900">
                        Php {plan.price.toLocaleString()}
                        {plan.billingCycle !== "N/A" && (
                          <span className="text-base font-medium text-gray-500">
                            /{plan.billingCycle === "monthly" ? "month" : "year"}
                          </span>
                        )}
                      </span>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="flex flex-1 flex-col justify-between p-6">
                  <ul className="mb-6 space-y-3 text-sm text-gray-700">
                    {plan.features.map((feature, index) => (
                      <li key={index} className="flex items-center">
                        <CheckCircle className="mr-2 h-4 w-4 flex-shrink-0 text-green-500" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                  {currentPlan === plan.id ? (
                    <Button disabled className="w-full bg-gray-200 text-gray-700 cursor-not-allowed">
                      Current Plan
                    </Button>
                  ) : (
                    <Button
                      onClick={() => handleUpgrade(plan.id)}
                      disabled={isUpdating && selectedPlanId === plan.id}
                      className="w-full bg-primary text-white hover:bg-primary/90"
                    >
                      {isUpdating && selectedPlanId === plan.id ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        plan.buttonText
                      )}
                    </Button>
                  )}
                </CardContent>
              </Card>
            ))}
        </div>
      </div>
    </main>
  )
}

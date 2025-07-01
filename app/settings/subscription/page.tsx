"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { useAuth } from "@/contexts/auth-context"
import { getSubscriptionPlans, subscriptionService } from "@/lib/subscription-service"
import type { SubscriptionPlanType } from "@/lib/types/subscription"
import { CheckCircle, Loader2 } from "lucide-react"
import { useRouter } from "next/navigation"
import { useEffect, useState, useCallback } from "react"
import { toast } from "@/components/ui/use-toast"
import { cn } from "@/lib/utils"

export default function SubscriptionPage() {
  const { user, userData, subscriptionData, loading, refreshSubscriptionData } = useAuth()
  const router = useRouter()
  const [isUpdating, setIsUpdating] = useState(false)
  const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlanType | null>(null)

  const plans = getSubscriptionPlans()

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login")
    }
  }, [loading, user, router])

  const handleUpgrade = useCallback(
    async (planType: SubscriptionPlanType) => {
      if (!user || !userData?.license_key) {
        toast({
          title: "Error",
          description: "User not authenticated or license key missing.",
          variant: "destructive",
        })
        return
      }

      setIsUpdating(true)
      setSelectedPlan(planType)

      try {
        const selectedPlanData = plans.find((plan) => plan.id === planType)
        if (!selectedPlanData) {
          toast({
            title: "Error",
            description: "Selected plan not found.",
            variant: "destructive",
          })
          return
        }

        // Always try to get the latest subscription from the database before deciding
        const existingSubscription = await subscriptionService.getSubscriptionByLicenseKey(userData.license_key)

        if (existingSubscription) {
          // Update existing subscription
          await subscriptionService.updateSubscription(userData.license_key, {
            planType: planType,
            status: "active",
            billingCycle: "monthly", // Default to monthly for upgrades, can be made dynamic
            startDate: new Date(), // Reset start date on upgrade
            trialEndDate: null, // Clear trial end date if upgrading from trial
          })
          toast({
            title: "Success",
            description: `Successfully upgraded to ${planType} plan!`,
          })
        } else {
          // Create new subscription if none exists
          await subscriptionService.createSubscription(
            userData.license_key,
            planType,
            "monthly", // Default billing cycle
            user.uid,
          )
          toast({
            title: "Success",
            description: `Successfully subscribed to ${planType} plan!`,
          })
        }

        await refreshSubscriptionData() // Refresh the context data
      } catch (error: any) {
        console.error("Failed to upgrade/subscribe:", error)
        toast({
          title: "Action Failed",
          description: error.message || "Failed to update/create subscription. Please try again.",
          variant: "destructive",
        })
      } finally {
        setIsUpdating(false)
        setSelectedPlan(null)
      }
    },
    [user, userData, plans, refreshSubscriptionData, toast],
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
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">Choose Your Plan</h1>
          <p className="mt-3 text-lg text-gray-600">Select the perfect plan that fits your business needs.</p>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {plans.map((plan) => (
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
                <CardDescription className="mt-2 text-gray-600">
                  {plan.price === 0 ? (
                    <span className="text-3xl font-bold text-gray-900">Free</span>
                  ) : (
                    <span className="text-3xl font-bold text-gray-900">${plan.price}</span>
                  )}
                  {plan.id !== "trial" && plan.id !== "graphic-expo-event" && (
                    <span className="text-base font-medium text-gray-500">/month</span>
                  )}
                </CardDescription>
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
                    onClick={() => handleUpgrade(plan.id as SubscriptionPlanType)}
                    disabled={isUpdating && selectedPlan === plan.id}
                    className="w-full bg-primary text-white hover:bg-primary/90"
                  >
                    {isUpdating && selectedPlan === plan.id ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      "Upgrade Now"
                    )}
                  </Button>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

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
      </div>
    </main>
  )
}

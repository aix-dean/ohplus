"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useAuth } from "@/contexts/auth-context"
import { getSubscriptionPlans, subscriptionService } from "@/lib/subscription-service"
import type { BillingCycle, SubscriptionPlanType } from "@/lib/types/subscription"
import { CheckCircle, Loader2 } from "lucide-react"
import { useRouter } from "next/navigation"
import { useEffect, useState, useCallback } from "react"
import { useToast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"
import { PromoBanner } from "@/components/promo-banner"
import { Separator } from "@/components/ui/separator" // Re-import Separator

export default function SubscriptionPage() {
  const { user, userData, subscriptionData, loading, refreshSubscriptionData } = useAuth()
  const { toast } = useToast()
  const router = useRouter()
  const [isUpdating, setIsUpdating] = useState(false)
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null)

  const plans = getSubscriptionPlans()

  // Set promoEndDate to July 19, 2025, 11:59 PM PH time (UTC+8) in one line
  const promoEndDate = new Date(2025, 6, 19, 23, 59, 0)

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
          return
        }

        const newPlanType: SubscriptionPlanType = selectedPlan.id as SubscriptionPlanType
        const billingCycle: BillingCycle = selectedPlan.billingCycle === "N/A" ? "monthly" : selectedPlan.billingCycle

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

  const currentPlan = subscriptionData?.planType || "None"
  const currentSubscriptionPlanDetails = plans.find((p) => p.id === subscriptionData?.planType)

  return (
    <main className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        {subscriptionData && (
          <div className="mb-8">
            <h2 className="text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl mb-6">
              Current Plan:{" "}
              <span
                className={cn("font-bold", subscriptionData.status === "trialing" ? "text-green-600" : "text-primary")}
              >
                {currentSubscriptionPlanDetails?.name || subscriptionData.planType}
                {subscriptionData.status === "trialing" && " Trial Plan"}
              </span>
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Plan Card */}
              <Card className="flex flex-col rounded-xl border-2 shadow-sm">
                <CardHeader className="bg-[#6B46C1] text-white p-4 rounded-t-xl">
                  <CardTitle className="text-xl font-bold">Plan</CardTitle>
                </CardHeader>
                <CardContent className="flex flex-1 flex-col justify-between p-6">
                  <div>
                    <h3 className="text-lg font-semibold capitalize">
                      {currentSubscriptionPlanDetails?.name || subscriptionData.planType}
                    </h3>
                    {currentSubscriptionPlanDetails?.price !== 0 && (
                      <p className="text-gray-700">
                        Php {currentSubscriptionPlanDetails?.price.toLocaleString()}
                        {currentSubscriptionPlanDetails?.billingCycle !== "N/A" && (
                          <span className="text-sm font-medium text-gray-500">
                            /{currentSubscriptionPlanDetails?.billingCycle === "monthly" ? "month" : "year"}
                          </span>
                        )}
                      </p>
                    )}
                    <ul className="mt-4 space-y-2 text-sm text-gray-700">
                      {(currentSubscriptionPlanDetails?.features || []).map((feature, index) => (
                        <li key={index} className="flex items-center">
                          <CheckCircle className="mr-2 h-4 w-4 flex-shrink-0 text-green-500" />
                          {feature}
                        </li>
                      ))}
                    </ul>
                  </div>
                </CardContent>
              </Card>

              {/* Cycle Card */}
              <Card className="flex flex-col rounded-xl border-2 shadow-sm">
                <CardHeader className="bg-[#6B46C1] text-white p-4 rounded-t-xl">
                  <CardTitle className="text-xl font-bold">Cycle</CardTitle>
                </CardHeader>
                <CardContent className="flex flex-1 flex-col justify-between p-6">
                  <div>
                    <p className="text-gray-700">
                      <span className="font-bold">Start:</span>{" "}
                      {subscriptionData.startDate
                        ? subscriptionData.startDate.toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })
                        : "N/A"}
                    </p>
                    <p className="text-gray-700">
                      <span className="font-bold">End:</span>{" "}
                      {subscriptionData.endDate
                        ? subscriptionData.endDate.toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })
                        : "N/A"}
                    </p>
                  </div>
                  <Button variant="outline" className="mt-4 self-end bg-transparent">
                    Extend
                  </Button>
                </CardContent>
              </Card>

              {/* Users Card */}
              <Card className="flex flex-col rounded-xl border-2 shadow-sm">
                <CardHeader className="bg-[#6B46C1] text-white p-4 rounded-t-xl">
                  <CardTitle className="text-xl font-bold">Users</CardTitle>
                </CardHeader>
                <CardContent className="flex flex-1 flex-col justify-between p-6">
                  <div>
                    <p className="text-lg font-bold text-gray-900">23 users</p> {/* Hardcoded as per screenshot */}
                    <p className="text-sm text-gray-600">(Max of {subscriptionData.maxProducts} users)</p>
                  </div>
                  <Button variant="outline" className="mt-4 self-end bg-transparent">
                    Expand
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        )}
        <Separator className="my-8" />

        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">Choose Your Plan</h1>
          <p className="mt-3 text-lg text-gray-600">Select the perfect plan that fits your business needs.</p>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
          {plans
            .filter((plan) => plan.id !== "trial" && plan.id !== "graphic-expo-event")
            .map((plan) => (
              <>
                {plan.id === "solo" && (
                  <div className="col-span-full flex justify-center">
                    <div className="w-[280px]">
                      <PromoBanner promoEndDate={promoEndDate} />
                    </div>
                  </div>
                )}
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
              </>
            ))}
        </div>
      </div>
    </main>
  )
}

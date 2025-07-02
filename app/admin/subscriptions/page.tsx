"use client"

import { useState, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useAuth } from "@/contexts/auth-context"
import { getSubscriptionPlans, subscriptionService } from "@/lib/subscription-service"
\
\
{
  BillingCycle, SubscriptionPlanType
  \
}
from
;("@/lib/types/subscription")
import { CheckCircle, Loader2 } from "lucide-react"
import { useRouter } from "next/navigation"
import { useToast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"
import { PromoBanner } from "@/components/promo-banner"

// Move promoEndDate outside the component to ensure it's a stable reference
const promoEndDate = new Date(2025, 6, 19, 23, 59, 0) // July 19, 2025, 11:59 PM PH time (UTC+8)

export default function SubscriptionPage()
\
{
  \
  const \{ user, userData, subscriptionData, loading, refreshSubscriptionData \} = useAuth()
  \
  const \{ toast \} = useToast()
  const router = useRouter()
  const [isUpdating, setIsUpdating] = useState(false)
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null)
  \
  const [timeLeft, setTimeLeft] = useState<\
  days: number
  hours: number
  minutes: number
  seconds: number
  \
  \
  | null>(null)

  const plans = getSubscriptionPlans()
  \
  useEffect(() => \
  if (!loading && !user)
  \
  router.push("/login")
  \
  \
  \
  , [loading, user, router])

  useEffect(() => \
  {
    \
    const calculateTimeLeft = () => \
    {
      const now = new Date().getTime()
      const difference = promoEndDate.getTime() - now

      if (difference <= 0)
      \
      \
        setTimeLeft(\
      days: 0, hours
      : 0, minutes: 0, seconds: 0 \
      )
      return
      \

      const days = Math.floor(difference / (1000 * 60 * 60 * 24))
      const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
      const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60))
      const seconds = Math.floor((difference % (1000 * 60)) / 1000)
      \
      setTimeLeft(\
      days, hours, minutes, seconds
      \
      )
    \
    }

    calculateTimeLeft()
    const timer = setInterval(calculateTimeLeft, 1000)

    return () => clearInterval(timer)
    \
  \
  }
  , [])

  const handleUpgrade = useCallback(\
    async (planId: string) => \{\
      if (!user || !userData?.license_key) \{\
        toast(\{\
          title: "Authentication Required\",\
          description: \"Please log in to manage your subscription.\",\
          variant: \"destructive\",\
        \})\
        return\
      \}
\
      setIsUpdating(true)\
      setSelectedPlanId(planId)
\
  try
  \
  {
    const selectedPlan = plans.find((plan) => plan.id === planId)
    if (!selectedPlan)
    \
    \
          toast(\
    title: "Error",\
    description: "Selected plan not found.", variant
    : "destructive",
          \
    )
    return
    \

    if (selectedPlan.id === "enterprise")
    \
    toast(\{
            title: "Enterprise Plan",
            description: "Please contact us directly for Enterprise plan inquiries.",
            variant: "default",
          \})
    return
    \

    const newPlanType: SubscriptionPlanType = selectedPlan.id as SubscriptionPlanType
    const billingCycle: BillingCycle = selectedPlan.billingCycle === "N/A" ? "monthly" : selectedPlan.billingCycle

    // Always create a new subscription document
    await subscriptionService.createSubscription(
      userData.license_key,
      newPlanType,
      billingCycle,
      user.uid,
      new Date(), // Start date is now
      null, // Let the service calculate end date
      "active", // New subscription is active
      null, // Let the service calculate max products
      null, // No trial for new paid plans
    )

    toast(\{
          title: "Subscription Activated",
          description: `Welcome to the $\{selectedPlan.name\}! Your new subscription has been created.`,
        \})

    await refreshSubscriptionData()
    \
  }
  catch (error: any) \
  console.error("Failed to select plan:", error)
  toast(\{
          title: "Error",
          description: `Failed to activate subscription: $\{error instanceof Error ? error.message : String(error)\}`,
          variant: "destructive",
        \})
  \
  finally \
  setIsUpdating(false)
  setSelectedPlanId(null)
  \
  \
}
,
    [user, userData, plans, refreshSubscriptionData, toast],
  )

const isCurrentPlan = useCallback(
    (planId: string) => \{
      return subscriptionData?.planType === planId
    \},
    [subscriptionData],
  )

if (loading)
\
{
  return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    )
  \
}

const currentPlan = subscriptionData?.planType || "None"
const currentPlanDetails = plans.find((plan) => plan.id === currentPlan)

const formatDate = (date: Date | null) => \
{
  if (!date) return "N/A"
  return new Date(date).toLocaleDateString("en-US", \{
      year: "numeric",
      month: "short",
      day: "numeric",
    \})
  \
}

return (
    <main className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        \{/* Current Plan Details Section */\}
        \{subscriptionData && (
          <div className="mb-12">
            <h2 className="text-xl font-bold tracking-tight text-gray-900 sm:text-2xl mb-6">
              Current Plan:\{" "\}
              <span
                className=\{cn(
                  "font-extrabold text-xl sm:text-2xl",
                  subscriptionData.status === "active" && "text-green-600",
                  subscriptionData.status === "trialing" && "text-blue-600",
                  (subscriptionData.status === "inactive" ||
                    subscriptionData.status === "expired" ||
                    subscriptionData.status === "cancelled") &&
                    "text-red-600",
                )\}
              >
                \{currentPlanDetails?.name || "No Active Plan"\}
              </span>
            </h2>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
              \{/* Plan Card */\}
              <Card className="flex flex-col rounded-xl border-2 shadow-sm">
                <CardHeader className="bg-purple-700 text-white p-4 rounded-t-xl">
                  <CardTitle className="text-lg font-bold">Plan</CardTitle>
                </CardHeader>
                <CardContent className="flex flex-1 flex-col justify-between p-6">
                  <div>
                    <h3 className="text-lg font-semibold capitalize text-gray-900">
                      \{currentPlanDetails?.name || "N/A"\}
                    </h3>
                    \{currentPlanDetails?.price !== 0 && currentPlanDetails?.billingCycle !== "N/A" && (
                      <p className="text-base text-gray-700 mt-1">
                        Php \{currentPlanDetails?.price.toLocaleString()\}\{" "\}
                        <span className="text-sm font-medium text-gray-500">
                          /\{currentPlanDetails?.billingCycle === "monthly" ? "month" : "year"\}
                        </span>
                      </p>
                    )\}
                    <ul className="mt-4 space-y-2 text-xs text-gray-700">
                      \{currentPlanDetails?.features.map((feature, index) => (
                        <li key=\{index\} className="flex items-center">
                          <CheckCircle className="mr-2 h-3.5 w-3.5 flex-shrink-0 text-green-500" />
                          \{feature\}
                        </li>
                      ))\}
                    </ul>
                  </div>
                </CardContent>
              </Card>

              \{/* Cycle Card */\}
              <Card className="flex flex-col rounded-xl border-2 shadow-sm">
                <CardHeader className="bg-purple-700 text-white p-4 rounded-t-xl">
                  <CardTitle className="text-lg font-bold">Cycle</CardTitle>
                </CardHeader>
                <CardContent className="flex flex-1 flex-col justify-between p-6">
                  <div>
                    <p className="text-base font-semibold text-gray-900">
                      Start: \{formatDate(subscriptionData.startDate)\}
                    </p>
                    <p className="text-base font-semibold text-gray-900">End: \{formatDate(subscriptionData.endDate)\}</p>
                  </div>
                  <Button variant="outline" className="mt-4 w-full bg-transparent text-sm">
                    Extend
                  </Button>
                </CardContent>
              </Card>

              \{/* Users Card (Placeholder Data) */\}
              <Card className="flex flex-col rounded-xl border-2 shadow-sm">
                <CardHeader className="bg-purple-700 text-white p-4 rounded-t-xl">
                  <CardTitle className="text-lg font-bold">Users</CardTitle>
                </CardHeader>
                <CardContent className="flex flex-1 flex-col justify-between p-6">
                  <div>
                    <p className="text-base font-semibold text-gray-900">23 users</p>
                    <p className="text-xs text-gray-600">(Max of 30 users)</p>
                  </div>
                  <Button variant="outline" className="mt-4 w-full bg-transparent text-sm">
                    Expand
                  </Button>
                </CardContent>
              </Card>

              \{/* Inventory Card (Placeholder Data) */\}
              <Card className="flex flex-col rounded-xl border-2 shadow-sm">
                <CardHeader className="bg-purple-700 text-white p-4 rounded-t-xl">
                  <CardTitle className="text-lg font-bold">Inventory</CardTitle>
                </CardHeader>
                <CardContent className="flex flex-1 flex-col justify-between p-6">
                  <div>
                    <p className="text-base font-semibold text-gray-900">100 static sites</p>
                    <p className="text-base font-semibold text-gray-900">15 dynamic sites</p>
                    <p className="text-base font-semibold text-gray-900">3 developments</p>
                    <p className="text-xs text-gray-600">(Max of \{subscriptionData.maxProducts\} sites)</p>
                  </div>
                  <Button variant="outline" className="mt-4 w-full bg-transparent text-sm">
                    Expand
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        )\}

        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">Choose Your Plan</h1>
          <p className="mt-3 text-lg text-gray-600">Select the perfect plan that fits your business needs.</p>
        </div>

        \{/* Promo Banner */\}
        \{timeLeft && (timeLeft.days > 0 || timeLeft.hours > 0 || timeLeft.minutes > 0 || timeLeft.seconds > 0) && (
          <div className="mb-8 flex flex-col items-center">
            <PromoBanner className="w-full max-w-2xl bg-gradient-to-r from-green-500 to-green-600 text-white" />
            <p className="mt-4 text-lg font-semibold text-gray-700 whitespace-nowrap">
              \{timeLeft.days\} days : \{timeLeft.hours.toString().padStart(2, "0")\} hours :\{" "\}
              \{timeLeft.minutes.toString().padStart(2, "0")\} minutes : \{timeLeft.seconds.toString().padStart(2, "0")\}\{" "\}
              seconds left
            </p>
          </div>
        )\}

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
          \{plans
            .filter((plan) => plan.id !== "trial" && plan.id !== "graphic-expo-event")
            .map((plan) => (
              <Card
                key=\{plan.id\}
                className=\{cn(
                  "flex flex-col rounded-xl border-2 shadow-sm transition-all duration-200",
                  currentPlan === plan.id
                    ? "border-primary ring-2 ring-primary/50"
                    : "border-gray-200 hover:border-primary/50",
                )\}
              >
                <CardHeader className="border-b p-6">
                  <CardTitle className="text-2xl font-bold capitalize text-gray-900">\{plan.name\}</CardTitle>
                  <CardDescription className="mt-2 text-gray-600 min-h-[40px]">\{plan.description\}</CardDescription>
                  <div className="mt-4">
                    \{plan.price === 0 && plan.id === "enterprise" ? (
                      <span className="text-3xl font-bold text-gray-900">Contact Us</span>
                    ) : (
                      <span className="text-3xl font-bold text-gray-900">
                        Php \{plan.price.toLocaleString()\}
                        \{plan.billingCycle !== "N/A" && (
                          <span className="text-base font-medium text-gray-500">
                            /\{plan.billingCycle === "monthly" ? "month" : "year"\}
                          </span>
                        )\}
                      </span>
                    )\}
                  </div>
                </CardHeader>
                <CardContent className="flex flex-1 flex-col justify-between p-6">
                  <ul className="mb-6 space-y-3 text-sm text-gray-700">
                    \{plan.features.map((feature, index) => (
                      <li key=\{index\} className="flex items-center">
                        <CheckCircle className="mr-2 h-4 w-4 flex-shrink-0 text-green-500" />
                        \{feature\}
                      </li>
                    ))\}
                  </ul>
                  \{currentPlan === plan.id ? (
                    <Button disabled className="w-full bg-gray-200 text-gray-700 cursor-not-allowed">
                      Current Plan
                    </Button>
                  ) : (
                    <Button
                      onClick=\{() => handleUpgrade(plan.id)\}
                      disabled=\{isUpdating && selectedPlanId === plan.id\}
                      className="w-full bg-primary text-white hover:bg-primary/90"
                    >
                      \{isUpdating && selectedPlanId === plan.id ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        plan.buttonText
                      )\}
                    </Button>
                  )\}
                </CardContent>
              </Card>
            ))\}
        </div>
      </div>
    </main>
  )
\}

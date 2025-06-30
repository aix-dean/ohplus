"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { CheckCircle } from "lucide-react"
import { useAuth } from "@/contexts/auth-context"
import { useToast } from "@/hooks/use-toast"
import { getUserProductsCount } from "@/lib/firebase-service"
import { subscriptionService } from "@/lib/subscription-service" // Import subscriptionService
import type { SubscriptionPlanType, BillingCycle } from "@/lib/types/subscription"

interface SubscriptionPlan {
  name: string
  price: string
  description: string
  features: string[]
  maxProducts: number | null
  type: SubscriptionPlanType
  billingCycle: BillingCycle
}

const subscriptionPlans: SubscriptionPlan[] = [
  {
    name: "Basic",
    price: "$3/month",
    description: "Ideal for small businesses and startups.",
    features: ["Up to 3 product uploads", "Basic analytics", "Email support"],
    maxProducts: 3,
    type: "Basic",
    billingCycle: "monthly",
  },
  {
    name: "Premium",
    price: "$10/month",
    description: "Perfect for growing businesses needing more capacity.",
    features: ["Up to 10 product uploads", "Advanced analytics", "Priority email support", "Custom branding"],
    maxProducts: 10,
    type: "Premium",
    billingCycle: "monthly",
  },
  {
    name: "Enterprise",
    price: "Contact Us",
    description: "Tailored solutions for large enterprises with extensive needs.",
    features: ["Unlimited product uploads", "Dedicated account manager", "API access", "24/7 phone support"],
    maxProducts: null,
    type: "Enterprise",
    billingCycle: "monthly",
  },
]

export default function SubscriptionPage() {
  const { user, userData, subscriptionData, loading: authLoading, updateSubscriptionData } = useAuth()
  const { toast } = useToast()
  const [currentProductsCount, setCurrentProductsCount] = useState<number | null>(null)
  const [loadingCount, setLoadingCount] = useState(true)

  useEffect(() => {
    const fetchProductCount = async () => {
      if (user?.uid) {
        setLoadingCount(true)
        try {
          const count = await getUserProductsCount(user.uid, { active: true, deleted: false })
          setCurrentProductsCount(count)
        } catch (error) {
          console.error("Error fetching current product count:", error)
          toast({
            title: "Error",
            description: "Failed to load current product count.",
            variant: "destructive",
          })
          setCurrentProductsCount(0)
        } finally {
          setLoadingCount(false)
        }
      }
    }
    fetchProductCount()
  }, [user?.uid, toast])

  const handleUpgradeSubscription = async (plan: SubscriptionPlan) => {
    console.log("Attempting to change subscription to:", plan.name)
    console.log("Current subscriptionData:", subscriptionData)

    try {
      if (!user?.uid || !userData?.license_key) {
        toast({
          title: "Error",
          description: "User or license key not available to manage subscription.",
          variant: "destructive",
        })
        return
      }

      if (!subscriptionData) {
        // No existing subscription, create a new one
        console.log("Creating new subscription...")
        await subscriptionService.createSubscription(
          userData.license_key,
          plan.type,
          plan.billingCycle,
          user.uid,
          new Date(), // startDate
          null, // endDate (will be calculated by service)
          "active", // status
          plan.maxProducts, // maxProducts
          null, // maxUsers (not in model, but keeping for consistency if needed elsewhere)
          plan.features, // features (not in model, but keeping for consistency if needed elsewhere)
          null, // trialEndDate (will be calculated by service)
        )
      } else {
        // Existing subscription, update it
        console.log("Updating existing subscription...")
        await updateSubscriptionData({
          planType: plan.type,
          billingCycle: plan.billingCycle,
          startDate: new Date(), // Update start date on plan change
          status: "active", // Assume changing plan makes it active
          maxProducts: plan.maxProducts, // Pass maxProducts from the selected plan
          // maxUsers and features are not directly updated here as they are derived from planType in service
        })
      }

      toast({
        title: "Subscription Updated",
        description: `Your subscription has been updated to ${plan.name}.`,
      })
      console.log("Subscription change successful for plan:", plan.name)
    } catch (error) {
      console.error("Error changing subscription:", error)
      toast({
        title: "Error",
        description: "Failed to update subscription. Please try again.",
        variant: "destructive",
      })
    }
  }

  const currentPlan = subscriptionPlans.find((plan) => plan.type === subscriptionData?.planType)

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8 text-center">Subscription Plans</h1>

      <div className="mb-8">
        <Card className="p-6 text-center">
          <CardTitle className="text-2xl font-semibold mb-2">Your Current Plan</CardTitle>
          {authLoading || !subscriptionData ? (
            <p className="text-gray-500 dark:text-gray-400">Loading your plan details...</p>
          ) : (
            <>
              <p className="text-lg font-medium text-primary">{currentPlan?.name || subscriptionData.planType}</p>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                {loadingCount
                  ? "Loading product count..."
                  : currentPlan?.maxProducts === null
                    ? `Currently using ${currentProductsCount} products (Unlimited)`
                    : `Currently using ${currentProductsCount} of ${currentPlan?.maxProducts} products`}
              </p>
            </>
          )}
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {subscriptionPlans.map((plan) => (
          <Card
            key={plan.name}
            className={`flex flex-col p-6 border-2 ${
              currentPlan?.type === plan.type ? "border-primary" : "border-gray-200 dark:border-gray-700"
            }`}
          >
            <CardHeader className="pb-4">
              <CardTitle className="text-2xl font-bold">{plan.name}</CardTitle>
              <p className="text-3xl font-extrabold mt-2">{plan.price}</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">{plan.description}</p>
            </CardHeader>
            <CardContent className="flex-grow">
              <ul className="space-y-2 text-sm">
                {plan.features.map((feature, index) => (
                  <li key={index} className="flex items-center">
                    <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                    {feature}
                  </li>
                ))}
              </ul>
            </CardContent>
            <div className="mt-6">
              {subscriptionData?.planType === plan.type ? (
                <Button disabled className="w-full">
                  Current Plan
                </Button>
              ) : (
                <Button
                  className="w-full"
                  onClick={() => handleUpgradeSubscription(plan)}
                  disabled={
                    authLoading ||
                    loadingCount ||
                    (plan.maxProducts !== null &&
                      currentProductsCount !== null &&
                      currentProductsCount > plan.maxProducts)
                  }
                >
                  {plan.maxProducts !== null && currentProductsCount !== null && currentProductsCount > plan.maxProducts
                    ? `Cannot Downgrade (Too many products)`
                    : `Choose ${plan.name}`}
                </Button>
              )}
            </div>
          </Card>
        ))}
      </div>
    </div>
  )
}

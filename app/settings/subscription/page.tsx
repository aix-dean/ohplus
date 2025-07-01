"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { CheckIcon } from "lucide-react"
import { getSubscriptionPlans, subscriptionService } from "@/lib/subscription-service"
import type { Subscription, SubscriptionPlan, SubscriptionPlanType } from "@/lib/types/subscription"
import { useToast } from "@/hooks/use-toast" // Corrected import path
import { useAuth } from "@/contexts/auth-context"
import { Badge } from "@/components/ui/badge"

export default function SubscriptionSettingsPage() {
  const { userData, loading: authLoading } = useAuth()
  const [availablePlans, setAvailablePlans] = useState<SubscriptionPlan[]>([])
  const [currentSubscription, setCurrentSubscription] = useState<Subscription | null>(null)
  const [pageLoading, setPageLoading] = useState(true)
  const { toast } = useToast()

  useEffect(() => {
    const fetchSubscriptionData = async () => {
      if (authLoading) return

      setPageLoading(true)
      const plans = getSubscriptionPlans()
      setAvailablePlans(plans)

      if (userData?.license_key) {
        try {
          const sub = await subscriptionService.getSubscriptionByLicenseKey(userData.license_key)
          setCurrentSubscription(sub)
        } catch (error) {
          console.error("Failed to fetch current subscription:", error)
          toast({
            title: "Error",
            description: "Failed to load your current subscription details.",
            variant: "destructive",
          })
        }
      } else {
        setCurrentSubscription(null) // No license key, no current subscription
      }
      setPageLoading(false)
    }

    fetchSubscriptionData()
  }, [userData, authLoading, toast]) // toast is now a stable reference

  const handleSelectPlan = async (plan: SubscriptionPlan) => {
    if (!userData?.license_key || !userData.uid) {
      toast({
        title: "Error",
        description: "User data or license key not found. Please log in again.",
        variant: "destructive",
      })
      return
    }

    setPageLoading(true)
    try {
      // Simulate updating the subscription
      await subscriptionService.updateSubscription(userData.license_key, {
        planType: plan.name.replace(" Plan", "") as SubscriptionPlanType, // Convert "Basic Plan" to "Basic"
        status: "active", // Assuming selecting a plan makes it active
        // You might need to adjust billingCycle, startDate, endDate based on your logic
      })

      // Re-fetch the updated subscription to reflect changes
      const updatedSub = await subscriptionService.getSubscriptionByLicenseKey(userData.license_key)
      setCurrentSubscription(updatedSub)

      toast({
        title: "Subscription Updated!",
        description: `You have successfully changed to the ${plan.name}.`,
      })
    } catch (error) {
      console.error("Failed to update subscription:", error)
      toast({
        title: "Error",
        description: "Failed to update your subscription. Please try again.",
        variant: "destructive",
      })
    } finally {
      setPageLoading(false)
    }
  }

  if (pageLoading) {
    return (
      <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-6">
        <div className="flex items-center">
          <h1 className="font-semibold text-lg md:text-2xl">Subscription Settings</h1>
        </div>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <Card className="h-[250px] animate-pulse bg-gray-100 dark:bg-gray-800" />
          <Card className="h-[250px] animate-pulse bg-gray-100 dark:bg-gray-800" />
          <Card className="h-[250px] animate-pulse bg-gray-100 dark:bg-gray-800" />
        </div>
      </main>
    )
  }

  return (
    <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-6">
      <div className="flex items-center">
        <h1 className="font-semibold text-lg md:text-2xl">Subscription Settings</h1>
      </div>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {availablePlans.map((plan) => {
          const isCurrent = currentSubscription?.planType === plan.name.replace(" Plan", "")
          return (
            <Card key={plan.id} className={isCurrent ? "border-primary ring-2 ring-primary" : ""}>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  {plan.name}
                  {isCurrent && <Badge className="bg-primary text-primary-foreground">Current Plan</Badge>}
                </CardTitle>
                <CardDescription>{plan.price === 0 ? "Free" : `$${plan.price.toFixed(2)} / month`}</CardDescription>
              </CardHeader>
              <CardContent className="grid gap-2">
                {plan.features.map((feature, index) => (
                  <div key={index} className="flex items-center gap-2 text-sm">
                    <CheckIcon className="h-4 w-4 text-green-500" />
                    <span>{feature}</span>
                  </div>
                ))}
              </CardContent>
              <CardFooter>
                <Button className="w-full" onClick={() => handleSelectPlan(plan)} disabled={isCurrent || pageLoading}>
                  {isCurrent ? "Current Plan" : "Select Plan"}
                </Button>
              </CardFooter>
            </Card>
          )
        })}
      </div>
    </main>
  )
}

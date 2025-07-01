"use client"

import { cn } from "@/lib/utils"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useAuth } from "@/contexts/auth-context"
import { subscriptionService } from "@/lib/subscription-service"
import { toast } from "@/components/ui/use-toast"
import { Loader2 } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

interface Plan {
  id: string
  name: string
  price: string
  features: string[]
  isCurrent?: boolean
}

export default function SubscriptionPage() {
  const { userData, subscriptionData, refreshSubscriptionData, isAuthenticated } = useAuth()
  const [loading, setLoading] = useState(false)
  const [plans, setPlans] = useState<Plan[]>([])

  const fetchPlans = useCallback(async () => {
    setLoading(true)
    try {
      const allPlans = await subscriptionService.getAllSubscriptionPlans()
      const filteredPlans = allPlans
        .filter((plan) => plan.id !== "trial" && plan.id !== "graphic-expo-event")
        .map((plan) => ({
          id: plan.id,
          name: plan.name,
          price: plan.price,
          features: plan.features,
          isCurrent: subscriptionData?.plan_id === plan.id,
        }))
      setPlans(filteredPlans)
    } catch (error) {
      console.error("Error fetching plans:", error)
      toast({
        title: "Error",
        description: "Failed to load subscription plans.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }, [subscriptionData])

  useEffect(() => {
    fetchPlans()
  }, [fetchPlans])

  const handleUpgrade = async (planId: string) => {
    if (!isAuthenticated || !userData?.license_key) {
      toast({
        title: "Authentication Required",
        description: "Please log in to manage your subscription.",
        variant: "destructive",
      })
      return
    }

    if (planId === "enterprise") {
      toast({
        title: "Contact Us",
        description: "Please contact our sales team for Enterprise plans.",
        // You might want to open a contact form or redirect to a contact page here
      })
      return
    }

    setLoading(true)
    try {
      let success = false
      // Attempt to update existing subscription
      if (subscriptionData?.id) {
        try {
          await subscriptionService.updateSubscription(subscriptionData.id, planId, "monthly")
          success = true
        } catch (updateError) {
          console.warn("Failed to update subscription, attempting to create:", updateError)
          // If update fails, try creating a new one (e.g., if the existing one is invalid or expired)
          await subscriptionService.createSubscription(userData.license_key, planId, "monthly", userData.uid)
          success = true
        }
      } else {
        // If no existing subscription, create a new one
        await subscriptionService.createSubscription(userData.license_key, planId, "monthly", userData.uid)
        success = true
      }

      if (success) {
        await refreshSubscriptionData() // Refresh subscription data after successful operation
        toast({
          title: "Subscription Updated",
          description: `You have successfully upgraded to the ${planId} plan!`,
        })
      }
    } catch (error: any) {
      console.error("Subscription operation failed:", error)
      toast({
        title: "Upgrade Failed",
        description: error.message || "An error occurred during the subscription process.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold mb-6">Manage Your Subscription</h1>

      {loading && (
        <div className="flex justify-center items-center h-32">
          <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
        </div>
      )}

      {!loading && (
        <>
          {subscriptionData && (
            <Card className="mb-8 border-blue-500 shadow-lg">
              <CardHeader>
                <CardTitle className="text-blue-600">Current Plan</CardTitle>
                <CardDescription>
                  You are currently on the <span className="font-semibold">{subscriptionData.plan_name}</span> plan.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">
                  {subscriptionData.price === "0" ? "Free" : `$${subscriptionData.price}/${subscriptionData.interval}`}
                </p>
                <p className="text-sm text-gray-500 mt-2">
                  License Key: <Badge variant="secondary">{userData?.license_key || "N/A"}</Badge>
                </p>
              </CardContent>
            </Card>
          )}

          <h2 className="text-2xl font-semibold mb-4">Available Plans</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {plans.map((plan) => (
              <Card key={plan.id} className={cn(plan.isCurrent && "border-blue-500 shadow-lg")}>
                <CardHeader>
                  <CardTitle className="capitalize">{plan.name}</CardTitle>
                  <CardDescription>
                    {plan.id === "enterprise" ? "Custom pricing" : `$${plan.price}/month`}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="mb-4 space-y-2 text-sm text-gray-600">
                    {plan.features.map((feature, index) => (
                      <li key={index} className="flex items-center">
                        <svg
                          className="mr-2 h-4 w-4 text-green-500"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                        </svg>
                        {feature}
                      </li>
                    ))}
                  </ul>
                  {plan.id === "enterprise" ? (
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button className="w-full">Contact Sales</Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Contact Sales for Enterprise Plan</DialogTitle>
                          <DialogDescription>
                            Please reach out to our sales team to discuss your Enterprise plan needs. You can email us
                            at sales@example.com or call us at (123) 456-7890.
                          </DialogDescription>
                        </DialogHeader>
                      </DialogContent>
                    </Dialog>
                  ) : (
                    <Button
                      className="w-full"
                      onClick={() => handleUpgrade(plan.id)}
                      disabled={plan.isCurrent || loading}
                    >
                      {plan.isCurrent ? "Current Plan" : "Upgrade"}
                    </Button>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </>
      )}
    </div>
  )
}

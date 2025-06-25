"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { CheckCircle, XCircle } from "lucide-react"
import { useAuth } from "@/contexts/auth-context"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { cn } from "@/lib/utils"

interface SubscriptionPlan {
  name: string
  monthlyPrice: string
  yearlyPrice: string
  description: string
  features: string[]
  maxProducts: number | null // null for unlimited
  type: string // Corresponds to projectData.type
  isPopular?: boolean
  isPromo?: boolean // Added for special promotions
}

const subscriptionPlans: SubscriptionPlan[] = [
  {
    name: "Graphic Expo Event",
    monthlyPrice: "Free",
    yearlyPrice: "Free",
    description: "Special offer for Graphic Expo attendees.",
    features: ["Up to 5 sites", "Basic analytics", "Email support", "Exclusive event access"],
    maxProducts: 5,
    type: "GraphicExpo",
    isPromo: true, // Highlight this as a promo
  },
  {
    name: "Basic",
    monthlyPrice: "$10",
    yearlyPrice: "$8", // Example: $8/site/month if paid yearly
    description: "Ideal for small businesses and startups.",
    features: ["Up to 3 sites", "Basic analytics", "Email support"],
    maxProducts: 3,
    type: "Basic",
  },
  {
    name: "Premium",
    monthlyPrice: "$25",
    yearlyPrice: "$20", // Example: $20/site/month if paid yearly
    description: "Perfect for growing businesses needing more capacity.",
    features: ["Up to 10 sites", "Advanced analytics", "Priority email support", "Custom branding"],
    maxProducts: 10,
    type: "Premium",
    isPopular: true,
  },
  {
    name: "Enterprise",
    monthlyPrice: "Contact Us",
    yearlyPrice: "Contact Us",
    description: "Tailored solutions for large enterprises with extensive needs.",
    features: ["Unlimited sites", "Dedicated account manager", "24/7 phone support"], // 'API access' removed
    maxProducts: null, // Unlimited
    type: "Enterprise",
  },
]

export default function SelectSubscriptionPage() {
  const router = useRouter()
  const { user, userData, projectData, loading, updateProjectData } = useAuth()
  const [isSuccessDialogOpen, setIsSuccessDialogOpen] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [billingCycle, setBillingCycle] = useState<"monthly" | "yearly">("monthly")

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.push("/login")
      } else if (userData && projectData) {
        if (!userData.onboarding) {
          router.push("/sales/dashboard")
        } else if (projectData.type !== "Trial") {
          router.push("/onboarding?step=1")
        }
      }
    }
  }, [user, userData, projectData, loading, router])

  const handleSelectPlan = async (planType: string) => {
    setErrorMessage(null)
    if (!projectData) {
      setErrorMessage("Project data not loaded. Please try again.")
      return
    }

    try {
      await updateProjectData({ type: planType })
      setIsSuccessDialogOpen(true)
    } catch (error: any) {
      console.error("Error updating subscription:", error)
      setErrorMessage("Failed to update subscription. Please try again.")
    }
  }

  const handleSuccessDialogClose = () => {
    setIsSuccessDialogOpen(false)
    router.push("/onboarding?step=0")
  }

  const isButtonsDisabled = loading || !projectData

  return (
    <div className="flex min-h-screen flex-col items-center bg-gray-100 px-4 py-8 dark:bg-gray-950">
      <div className="w-full max-w-6xl">
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-gray-50 sm:text-4xl">
            Choose Your Plan
          </h1>
          <p className="mt-4 text-base leading-8 text-gray-600 dark:text-gray-400">
            Select the perfect plan for your business.
          </p>
        </div>
        <div className="flex justify-center mb-6">
          <ToggleGroup
            type="single"
            value={billingCycle}
            onValueChange={(value: "monthly" | "yearly") => {
              if (value) setBillingCycle(value)
            }}
            className="bg-gray-200 dark:bg-gray-800 rounded-full p-1"
          >
            <ToggleGroupItem
              value="monthly"
              aria-label="Toggle monthly billing"
              className={cn(
                "px-6 py-2 rounded-full text-sm font-medium transition-colors",
                billingCycle === "monthly"
                  ? "bg-blue-600 text-white shadow-sm"
                  : "text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-700",
              )}
            >
              Monthly
            </ToggleGroupItem>
            <ToggleGroupItem
              value="yearly"
              aria-label="Toggle yearly billing"
              className={cn(
                "px-6 py-2 rounded-full text-sm font-medium transition-colors",
                billingCycle === "yearly"
                  ? "bg-blue-600 text-white shadow-sm"
                  : "text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-700",
              )}
            >
              Yearly
            </ToggleGroupItem>
          </ToggleGroup>
        </div>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {subscriptionPlans.map((plan) => (
            <Card
              key={plan.type}
              className={cn(
                "relative flex flex-col items-center justify-between p-6 rounded-xl shadow-lg transition-all duration-300 hover:shadow-xl",
                plan.isPopular && "border-2 border-blue-600",
                plan.isPromo && "border-2 border-green-500",
              )}
            >
              {plan.isPopular && (
                <div className="absolute top-0 right-0 -mt-2 -mr-2 bg-blue-600 text-white text-xs font-semibold px-3 py-1 rounded-bl-lg rounded-tr-lg transform rotate-6 translate-x-1 translate-y-1">
                  Most Popular
                </div>
              )}
              {plan.isPromo && (
                <div className="absolute top-0 right-0 -mt-2 -mr-2 bg-green-500 text-white text-xs font-semibold px-3 py-1 rounded-bl-lg rounded-tr-lg transform rotate-6 translate-x-1 translate-y-1">
                  Special Promo!
                </div>
              )}
              <CardHeader className="text-center p-0 mb-4">
                <CardTitle className="text-2xl font-bold text-gray-900 dark:text-gray-50">{plan.name}</CardTitle>
                <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">{plan.description}</p>
              </CardHeader>
              <CardContent className="flex flex-col items-center p-0">
                <div className="text-3xl font-extrabold text-gray-900 dark:text-gray-50">
                  {plan.type === "Enterprise" || plan.type === "GraphicExpo"
                    ? plan.monthlyPrice
                    : `${billingCycle === "monthly" ? plan.monthlyPrice : plan.yearlyPrice}`}
                  <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    {plan.type === "Enterprise" || plan.type === "GraphicExpo" ? "" : "/ site / month"}
                  </span>
                </div>
                <ul className="my-6 space-y-3 text-left text-sm text-gray-700 dark:text-gray-300">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="flex items-center">
                      <CheckCircle className="mr-3 h-4 w-4 text-blue-600 flex-shrink-0" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
                <Button
                  onClick={() => handleSelectPlan(plan.type)}
                  className={cn(
                    "mt-auto w-full py-2 text-base font-semibold rounded-lg transition-colors duration-200",
                    plan.isPopular
                      ? "bg-blue-600 hover:bg-blue-700 text-white"
                      : plan.isPromo
                        ? "bg-green-500 hover:bg-green-600 text-white"
                        : "bg-gray-200 hover:bg-gray-300 text-gray-800 dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-gray-50",
                  )}
                  disabled={isButtonsDisabled || projectData?.type === plan.type}
                >
                  {projectData?.type === plan.type
                    ? "Current Plan"
                    : plan.isPromo
                      ? "Select Promo"
                      : `Select ${plan.name}`}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
        {errorMessage && (
          <div className="mt-8 text-center text-red-500">
            <XCircle className="mr-2 inline-block h-4 w-4" />
            {errorMessage}
          </div>
        )}
      </div>
      <Dialog open={isSuccessDialogOpen} onOpenChange={setIsSuccessDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Subscription Updated!</DialogTitle>
            <DialogDescription>Your subscription plan has been successfully updated.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button onClick={handleSuccessDialogClose}>Continue to Onboarding</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

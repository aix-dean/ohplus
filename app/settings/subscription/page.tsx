"use client"

import { useState } from "react"
import { Check, CreditCard, Info, Zap } from "lucide-react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/contexts/auth-context"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"

// Define subscription plan types
interface SubscriptionFeature {
  name: string
  included: boolean
}

interface SubscriptionPlan {
  id: string
  name: string
  description: string
  price: number
  billingPeriod: "monthly" | "yearly"
  features: SubscriptionFeature[]
  recommended?: boolean
  maxBillboards?: number
  maxCampaigns?: number
}

export default function SubscriptionPage() {
  const { userData, projectData, updateProjectData } = useAuth()
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null)
  const [billingPeriod, setBillingPeriod] = useState<"monthly" | "yearly">("monthly")
  const [paymentMethod, setPaymentMethod] = useState<string>("credit-card")
  const [processing, setProcessing] = useState(false)
  const [success, setSuccess] = useState("")
  const [error, setError] = useState("")

  // Current subscription type from project data
  const currentSubscription = projectData?.type || "Trial"

  // Define subscription plans
  const subscriptionPlans: SubscriptionPlan[] = [
    {
      id: "starter",
      name: "Starter",
      description: "Perfect for small businesses getting started with outdoor advertising",
      price: billingPeriod === "monthly" ? 49 : 470,
      billingPeriod,
      maxBillboards: 10,
      maxCampaigns: 5,
      features: [
        { name: "Up to 10 billboard listings", included: true },
        { name: "Basic analytics", included: true },
        { name: "Email support", included: true },
        { name: "Campaign scheduling", included: true },
        { name: "Advanced analytics", included: false },
        { name: "Priority support", included: false },
        { name: "Custom branding", included: false },
      ],
    },
    {
      id: "professional",
      name: "Professional",
      description: "For growing businesses with multiple advertising needs",
      price: billingPeriod === "monthly" ? 99 : 950,
      billingPeriod,
      recommended: true,
      maxBillboards: 50,
      maxCampaigns: 20,
      features: [
        { name: "Up to 50 billboard listings", included: true },
        { name: "Basic analytics", included: true },
        { name: "Email support", included: true },
        { name: "Campaign scheduling", included: true },
        { name: "Advanced analytics", included: true },
        { name: "Priority support", included: true },
        { name: "Custom branding", included: false },
      ],
    },
    {
      id: "enterprise",
      name: "Enterprise",
      description: "For large organizations with extensive advertising networks",
      price: billingPeriod === "monthly" ? 299 : 2870,
      billingPeriod,
      maxBillboards: 500,
      maxCampaigns: 100,
      features: [
        { name: "Unlimited billboard listings", included: true },
        { name: "Basic analytics", included: true },
        { name: "Email support", included: true },
        { name: "Campaign scheduling", included: true },
        { name: "Advanced analytics", included: true },
        { name: "Priority support", included: true },
        { name: "Custom branding", included: true },
      ],
    },
  ]

  // Handle plan selection
  const handleSelectPlan = (planId: string) => {
    setSelectedPlan(planId)
  }

  // Handle subscription upgrade
  const handleUpgradeSubscription = async () => {
    if (!selectedPlan) {
      setError("Please select a subscription plan")
      return
    }

    setProcessing(true)
    setError("")

    try {
      // In a real application, you would integrate with a payment processor here
      // For this example, we'll simulate a successful upgrade
      await new Promise((resolve) => setTimeout(resolve, 1500))

      // Update project data with new subscription type
      if (projectData && updateProjectData) {
        await updateProjectData({
          type: selectedPlan.charAt(0).toUpperCase() + selectedPlan.slice(1),
        })
      }

      setSuccess("Subscription upgraded successfully!")
      setProcessing(false)
    } catch (error) {
      console.error("Error upgrading subscription:", error)
      setError("Failed to upgrade subscription. Please try again.")
      setProcessing(false)
    }
  }

  return (
    <div className="container max-w-6xl py-8 px-4">
      <div className="flex flex-col gap-6">
        <div>
          <h1 className="text-2xl font-bold mb-2">Subscription Management</h1>
          <p className="text-gray-500">Manage your subscription plan and billing details</p>
        </div>

        {success && (
          <Alert className="bg-green-50 text-green-800 border-green-200">
            <AlertDescription>{success}</AlertDescription>
          </Alert>
        )}

        {error && (
          <Alert className="bg-red-50 text-red-800 border-red-200">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Current Subscription</CardTitle>
            <CardDescription>Your account is currently on the {currentSubscription} plan</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2 mb-4">
              <Badge variant={currentSubscription === "Trial" ? "outline" : "default"}>{currentSubscription}</Badge>
              {currentSubscription === "Trial" && (
                <span className="text-sm text-amber-600">
                  <Info className="inline h-4 w-4 mr-1" />
                  Your trial period will end soon
                </span>
              )}
            </div>
            <p className="text-sm text-gray-500">
              To access more features and increase your limits, upgrade your subscription below.
            </p>
          </CardContent>
        </Card>

        <div className="flex justify-center mb-6">
          <div className="inline-flex items-center rounded-full border p-1 bg-gray-50">
            <Button
              variant={billingPeriod === "monthly" ? "default" : "ghost"}
              size="sm"
              className="rounded-full"
              onClick={() => setBillingPeriod("monthly")}
            >
              Monthly
            </Button>
            <Button
              variant={billingPeriod === "yearly" ? "default" : "ghost"}
              size="sm"
              className="rounded-full"
              onClick={() => setBillingPeriod("yearly")}
            >
              Yearly
              <Badge variant="outline" className="ml-2 bg-green-50 text-green-700 border-green-200">
                Save 20%
              </Badge>
            </Button>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {subscriptionPlans.map((plan) => (
            <Card
              key={plan.id}
              className={`relative ${
                plan.recommended ? "border-primary shadow-md" : ""
              } ${selectedPlan === plan.id ? "ring-2 ring-primary" : ""}`}
            >
              {plan.recommended && (
                <div className="absolute -top-3 left-0 right-0 flex justify-center">
                  <Badge className="bg-primary">Recommended</Badge>
                </div>
              )}
              <CardHeader>
                <CardTitle>{plan.name}</CardTitle>
                <CardDescription>{plan.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="mb-4">
                  <span className="text-3xl font-bold">${plan.price}</span>
                  <span className="text-gray-500">/{plan.billingPeriod === "monthly" ? "mo" : "yr"}</span>
                </div>

                <div className="space-y-2 mb-6">
                  <div className="flex items-center gap-2">
                    <Zap className="h-4 w-4 text-primary" />
                    <span className="text-sm">Up to {plan.maxBillboards} billboards</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Zap className="h-4 w-4 text-primary" />
                    <span className="text-sm">Up to {plan.maxCampaigns} campaigns</span>
                  </div>
                </div>

                <Separator className="my-4" />

                <ul className="space-y-2">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <Check className={`h-4 w-4 mt-1 ${feature.included ? "text-green-500" : "text-gray-300"}`} />
                      <span className={`text-sm ${feature.included ? "text-gray-700" : "text-gray-400"}`}>
                        {feature.name}
                      </span>
                    </li>
                  ))}
                </ul>
              </CardContent>
              <CardFooter>
                <Button
                  variant={currentSubscription === plan.name ? "outline" : "default"}
                  className="w-full"
                  disabled={currentSubscription === plan.name}
                  onClick={() => handleSelectPlan(plan.id)}
                >
                  {currentSubscription === plan.name
                    ? "Current Plan"
                    : selectedPlan === plan.id
                      ? "Selected"
                      : "Select Plan"}
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>

        {selectedPlan && (
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Payment Method</CardTitle>
              <CardDescription>Select how you want to pay for your subscription</CardDescription>
            </CardHeader>
            <CardContent>
              <RadioGroup value={paymentMethod} onValueChange={setPaymentMethod} className="space-y-4">
                <div className="flex items-center space-x-2 border rounded-md p-4">
                  <RadioGroupItem value="credit-card" id="credit-card" />
                  <Label htmlFor="credit-card" className="flex items-center gap-2 cursor-pointer">
                    <CreditCard className="h-5 w-5" />
                    Credit or Debit Card
                  </Label>
                </div>
                <div className="flex items-center space-x-2 border rounded-md p-4">
                  <RadioGroupItem value="paypal" id="paypal" disabled />
                  <Label htmlFor="paypal" className="flex items-center gap-2 cursor-pointer text-gray-400">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M7.076 21.337H2.47a.641.641 0 0 1-.633-.74L4.944 3.384a.64.64 0 0 1 .632-.537h6.012c2.658 0 4.53.625 5.225 1.85.584 1.025.663 2.108.236 3.576-.831 2.865-2.863 4.36-6.06 4.36h-2.99a.64.64 0 0 0-.633.538l-1.28 7.629a.64.64 0 0 1-.633.537h-1.23" />
                      <path d="M22.8 6.908c.236 1.54.029 2.598-.615 3.993-.854 1.847-2.388 3.31-4.38 4.085-1.7.664-3.721.95-5.946.86h-.76a.454.454 0 0 0-.448.38l-.922 5.832a.453.453 0 0 1-.448.38h-3.3a.452.452 0 0 1-.447-.521L6.73 20.49l.284-1.79 1.01-6.383.096-.612a.454.454 0 0 1 .448-.38h2.99c5.826 0 9.293-2.356 10.345-7.417Z" />
                    </svg>
                    PayPal (Coming Soon)
                  </Label>
                </div>
              </RadioGroup>
            </CardContent>
            <CardFooter>
              <Button onClick={handleUpgradeSubscription} disabled={processing} className="w-full">
                {processing ? "Processing..." : "Upgrade Subscription"}
              </Button>
            </CardFooter>
          </Card>
        )}
      </div>
    </div>
  )
}

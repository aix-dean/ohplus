"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { CheckCircle, Loader2 } from "lucide-react"
import { Separator } from "@/components/ui/separator"
import { cn } from "@/lib/utils"
import { PromoBanner } from "@/components/promo-banner"
import { useAuth } from "@/contexts/auth-context"

export default function SubscriptionsPage() {
  const { subscriptionData, loading: authLoading } = useAuth()
  const [loading, setLoading] = useState(true)
  const [currentPlan, setCurrentPlan] = useState<any>(null) // Replace 'any' with actual type if available

  useEffect(() => {
    if (!authLoading) {
      // Simulate fetching current plan details
      // In a real app, you would fetch this from your backend/database
      if (subscriptionData) {
        setCurrentPlan({
          planType: subscriptionData.planType,
          price: subscriptionData.price,
          billingCycle: subscriptionData.billingCycle,
          features: [
            "Manage up to 5 sites", // Example feature
            "FREE Listing to OOH Marketplaces",
            "FREE 1-Day onboarding training",
            "ERP + Programmatic CMS",
          ],
          startDate: subscriptionData.startDate,
          endDate: subscriptionData.endDate,
          maxUsers: subscriptionData.maxUsers,
          currentUsers: subscriptionData.currentUsers,
        })
      } else {
        setCurrentPlan(null)
      }
      setLoading(false)
    }
  }, [authLoading, subscriptionData])

  const promoEndDate = new Date(2025, 6, 19, 23, 59, 0) // July 19, 2025, 11:59 PM PH time

  if (authLoading || loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <main className="flex-1 p-4 md:p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Subscription Management</h1>
        <p className="text-gray-600">Manage your current plan and explore available options.</p>
      </div>

      <PromoBanner promoEndDate={promoEndDate} />

      {currentPlan && (
        <div className="mb-8 rounded-xl bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-xl font-bold text-gray-800">
            Current Plan:{" "}
            <span className={cn("font-semibold", currentPlan.planType === "trial" ? "text-green-600" : "text-primary")}>
              {currentPlan.planType.toUpperCase()} Plan
            </span>
          </h2>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            {/* Plan Details Card */}
            <Card className="rounded-lg border border-gray-200 shadow-sm">
              <CardHeader className="bg-primary rounded-t-lg px-4 py-3">
                <CardTitle className="text-lg font-semibold text-white">Plan</CardTitle>
              </CardHeader>
              <CardContent className="p-4">
                <h3 className="text-xl font-bold text-gray-900 capitalize">{currentPlan.planType}</h3>
                <p className="text-gray-600">
                  Php {currentPlan.price} /{currentPlan.billingCycle}
                </p>
                <ul className="mt-4 space-y-2 text-sm text-gray-700">
                  {currentPlan.features.map((feature: string, index: number) => (
                    <li key={index} className="flex items-center">
                      <CheckCircle className="mr-2 h-4 w-4 text-green-500" />
                      {feature}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            {/* Cycle Details Card */}
            <Card className="rounded-lg border border-gray-200 shadow-sm">
              <CardHeader className="bg-primary rounded-t-lg px-4 py-3">
                <CardTitle className="text-lg font-semibold text-white">Cycle</CardTitle>
              </CardHeader>
              <CardContent className="p-4">
                <div className="space-y-2 text-gray-700">
                  <p>
                    <span className="font-semibold">Start:</span>{" "}
                    {currentPlan.startDate ? new Date(currentPlan.startDate).toLocaleDateString() : "N/A"}
                  </p>
                  <p>
                    <span className="font-semibold">End:</span>{" "}
                    {currentPlan.endDate ? new Date(currentPlan.endDate).toLocaleDateString() : "N/A"}
                  </p>
                </div>
                <Button variant="outline" className="mt-4 w-full bg-transparent">
                  Extend
                </Button>
              </CardContent>
            </Card>

            {/* Users Details Card */}
            <Card className="rounded-lg border border-gray-200 shadow-sm">
              <CardHeader className="bg-primary rounded-t-lg px-4 py-3">
                <CardTitle className="text-lg font-semibold text-white">Users</CardTitle>
              </CardHeader>
              <CardContent className="p-4">
                <p className="text-xl font-bold text-gray-900">{currentPlan.currentUsers || 0} users</p>
                <p className="text-sm text-gray-600">(Max of {currentPlan.maxUsers || "Unlimited"} users)</p>
                <Button variant="outline" className="mt-4 w-full bg-transparent">
                  Expand
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      <Separator className="my-8" />

      <h2 className="mb-6 text-xl font-bold text-gray-800">Available Plans</h2>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
        {/* Solo Plan */}
        <Card className="rounded-xl border border-gray-200 shadow-sm">
          <CardHeader className="border-b px-5 py-4">
            <CardTitle className="text-xl font-bold text-gray-900">Solo Plan</CardTitle>
            <CardDescription className="text-sm text-gray-600">
              Ideal for first time users and media owners with 1-3 OOH sites.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-5">
            <div className="mb-4">
              <span className="text-3xl font-bold text-gray-900">Php 1,500</span>
              <span className="text-base text-gray-600">/month</span>
            </div>
            <ul className="space-y-2 text-sm text-gray-700">
              <li className="flex items-center">
                <CheckCircle className="mr-2 h-4 w-4 text-green-500" />
                Manage up to 3 sites
              </li>
              <li className="flex items-center">
                <CheckCircle className="mr-2 h-4 w-4 text-green-500" />
                FREE Listing to OOH Marketplaces
              </li>
              <li className="flex items-center">
                <CheckCircle className="mr-2 h-4 w-4 text-green-500" />
                FREE 1-Day onboarding training
              </li>
              <li className="flex items-center">
                <CheckCircle className="mr-2 h-4 w-4 text-green-500" />
                Basic ERP Access
              </li>
            </ul>
            <Button className="mt-6 w-full">Choose Plan</Button>
          </CardContent>
        </Card>

        {/* Family Plan */}
        <Card className="rounded-xl border border-gray-200 shadow-sm">
          <CardHeader className="border-b px-5 py-4">
            <CardTitle className="text-xl font-bold text-gray-900">Family Plan</CardTitle>
            <CardDescription className="text-sm text-gray-600">
              Ideal for media owners with around 5 OOH sites.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-5">
            <div className="mb-4">
              <span className="text-3xl font-bold text-gray-900">Php 2,100</span>
              <span className="text-base text-gray-600">/month</span>
            </div>
            <ul className="space-y-2 text-sm text-gray-700">
              <li className="flex items-center">
                <CheckCircle className="mr-2 h-4 w-4 text-green-500" />
                Manage up to 5 sites
              </li>
              <li className="flex items-center">
                <CheckCircle className="mr-2 h-4 w-4 text-green-500" />
                FREE Listing to OOH Marketplaces
              </li>
              <li className="flex items-center">
                <CheckCircle className="mr-2 h-4 w-4 text-green-500" />
                FREE 1-Day onboarding training
              </li>
              <li className="flex items-center">
                <CheckCircle className="mr-2 h-4 w-4 text-green-500" />
                ERP + Programmatic CMS
              </li>
            </ul>
            <Button className="mt-6 w-full">Choose Plan</Button>
          </CardContent>
        </Card>

        {/* Membership Plan */}
        <Card className="rounded-xl border border-gray-200 shadow-sm">
          <CardHeader className="border-b px-5 py-4">
            <CardTitle className="text-xl font-bold text-gray-900">Membership</CardTitle>
            <CardDescription className="text-sm text-gray-600">
              Access exclusive perks and features from OH!Plus.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-5">
            <div className="mb-4">
              <span className="text-3xl font-bold text-gray-900">Php 30,000</span>
              <span className="text-base text-gray-600">/year</span>
            </div>
            <ul className="space-y-2 text-sm text-gray-700">
              <li className="flex items-center">
                <CheckCircle className="mr-2 h-4 w-4 text-green-500" />
                Manage up to 8 sites
              </li>
              <li className="flex items-center">
                <CheckCircle className="mr-2 h-4 w-4 text-green-500" />
                FREE Listing to OOH Marketplaces
              </li>
              <li className="flex items-center">
                <CheckCircle className="mr-2 h-4 w-4 text-green-500" />
                FREE 1-Day onboarding training
              </li>
              <li className="flex items-center">
                <CheckCircle className="mr-2 h-4 w-4 text-green-500" />
                ERP + Programmatic CMS
              </li>
              <li className="flex items-center">
                <CheckCircle className="mr-2 h-4 w-4 text-green-500" />
                Priority Support
              </li>
            </ul>
            <Button className="mt-6 w-full">Choose Plan</Button>
          </CardContent>
        </Card>

        {/* Enterprise Plan */}
        <Card className="rounded-xl border border-gray-200 shadow-sm">
          <CardHeader className="border-b px-5 py-4">
            <CardTitle className="text-xl font-bold text-gray-900">Enterprise</CardTitle>
            <CardDescription className="text-sm text-gray-600">
              Tailored for large companies with extensive needs.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-5">
            <div className="mb-4">
              <span className="text-3xl font-bold text-gray-900">Contact Us</span>
            </div>
            <ul className="space-y-2 text-sm text-gray-700">
              <li className="flex items-center">
                <CheckCircle className="mr-2 h-4 w-4 text-green-500" />
                Flexible Pricing
              </li>
              <li className="flex items-center">
                <CheckCircle className="mr-2 h-4 w-4 text-green-500" />
                Flexible Payment Terms
              </li>
              <li className="flex items-center">
                <CheckCircle className="mr-2 h-4 w-4 text-green-500" />
                Embassy Privileges
              </li>
              <li className="flex items-center">
                <CheckCircle className="mr-2 h-4 w-4 text-green-500" />
                Priority Assistance
              </li>
              <li className="flex items-center">
                <CheckCircle className="mr-2 h-4 w-4 text-green-500" />
                Full-Access
              </li>
            </ul>
            <Button className="mt-6 w-full">Contact Sales</Button>
          </CardContent>
        </Card>
      </div>
    </main>
  )
}

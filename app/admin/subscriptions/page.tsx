"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { CheckCircle, Loader2, CreditCard } from "lucide-react"
import { useAuth } from "@/contexts/auth-context"
import { subscriptionService } from "@/lib/subscription-service"
import { cn } from "@/lib/utils"
import { PromoBanner } from "@/components/promo-banner"

export default function SubscriptionsPage() {
  const { userData, subscriptionData, loading: authLoading, refreshSubscriptionData } = useAuth()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Set the promo end date to July 19, 2025, 11:59 PM PH time
  const promoEndDate = new Date(2025, 6, 19, 23, 59, 0) // Month is 0-indexed (July is 6)

  useEffect(() => {
    if (!authLoading) {
      setLoading(false)
      if (!userData) {
        setError("User data not available. Please log in.")
      }
    }
  }, [userData, authLoading])

  if (loading || authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Error</CardTitle>
            <CardDescription>{error}</CardDescription>
          </CardHeader>
        </Card>
      </div>
    )
  }

  const features = {
    solo: [
      "Manage up to 3 sites",
      "FREE Listing to OOH Marketplaces",
      "FREE 1-Day onboarding training",
      "Basic CMS Features",
    ],
    family: [
      "Manage up to 5 sites",
      "FREE Listing to OOH Marketplaces",
      "FREE 1-Day onboarding training",
      "ERP + Programmatic CMS",
    ],
    membership: [
      "Manage up to 8 sites",
      "FREE Listing to OOH Marketplaces",
      "FREE 1-Day onboarding training",
      "ERP + Programmatic CMS",
      "Priority Support",
    ],
    enterprise: [
      "Flexible Pricing",
      "Flexible Payment Terms",
      "Embassy Privileges",
      "Priority Assistance",
      "Full-Access to all features",
      "Dedicated Account Manager",
      "Custom Integrations",
    ],
  }

  const getPlanFeatures = (planType: string | undefined) => {
    switch (planType) {
      case "solo":
        return features.solo
      case "family":
        return features.family
      case "membership":
        return features.membership
      case "enterprise":
        return features.enterprise
      default:
        return []
    }
  }

  const currentPlanFeatures = getPlanFeatures(subscriptionData?.planType)

  return (
    <main className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6">
      <div className="flex items-center">
        <h1 className="text-lg font-semibold md:text-2xl">Subscription Plans</h1>
      </div>

      <PromoBanner promoEndDate={promoEndDate} />

      {/* Current Plan Section */}
      {subscriptionData && (
        <Card className="mb-6 rounded-xl shadow-sm">
          <CardHeader className="border-b px-5 py-3">
            <CardTitle className="flex items-center gap-2 text-lg font-bold text-gray-800">
              <CreditCard className="h-5 w-5 text-primary" />
              Your Current Plan
            </CardTitle>
            <CardDescription className="text-xs text-gray-600">Details of your active subscription.</CardDescription>
          </CardHeader>
          <CardContent className="p-5">
            <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
              {/* Plan Details */}
              <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
                <h3 className="mb-2 text-base font-semibold text-gray-900">Plan</h3>
                <div className="flex items-center gap-2">
                  <p className="text-xl font-bold capitalize text-gray-900">{subscriptionData.planType || "N/A"}</p>
                  {subscriptionData.billingCycle && subscriptionData.planType !== "enterprise" && (
                    <span className="text-sm text-gray-600">
                      Php {subscriptionData.price || "N/A"} /{subscriptionData.billingCycle}
                    </span>
                  )}
                  {subscriptionData.status && (
                    <Badge
                      variant="outline"
                      className={cn(
                        "px-3 py-1 text-xs font-medium",
                        subscriptionData.status === "active" && "border-green-200 bg-green-100 text-green-800",
                        subscriptionData.status === "trialing" && "border-blue-200 bg-blue-100 text-blue-800",
                        subscriptionData.status === "expired" && "border-red-200 bg-red-100 text-red-800",
                        subscriptionData.status === "cancelled" && "border-gray-200 bg-gray-100 text-gray-800",
                      )}
                    >
                      {subscriptionData.status.charAt(0).toUpperCase() + subscriptionData.status.slice(1)}
                    </Badge>
                  )}
                </div>
                <ul className="mt-3 space-y-1 text-sm text-gray-700">
                  {currentPlanFeatures.map((feature, index) => (
                    <li key={index} className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      {feature}
                    </li>
                  ))}
                </ul>
                {subscriptionData.planType !== "enterprise" && (
                  <Button className="mt-4 w-full bg-transparent" variant="outline">
                    Upgrade Plan
                  </Button>
                )}
              </div>

              {/* Cycle Details */}
              <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
                <h3 className="mb-2 text-base font-semibold text-gray-900">Cycle</h3>
                <div className="space-y-1 text-sm text-gray-700">
                  <p>
                    <span className="font-medium">Start:</span>{" "}
                    {subscriptionData.startDate ? new Date(subscriptionData.startDate).toLocaleDateString() : "N/A"}
                  </p>
                  <p>
                    <span className="font-medium">End:</span>{" "}
                    {subscriptionData.endDate ? new Date(subscriptionData.endDate).toLocaleDateString() : "N/A"}
                  </p>
                  {subscriptionData.trialEndDate && subscriptionData.status === "trialing" && (
                    <p>
                      <span className="font-medium">Trial Ends:</span>{" "}
                      {new Date(subscriptionData.trialEndDate).toLocaleDateString()} (
                      {subscriptionService.getDaysRemaining(subscriptionData)} days remaining)
                    </p>
                  )}
                </div>
                <Button className="mt-4 w-full bg-transparent" variant="outline">
                  Extend
                </Button>
              </div>

              {/* Usage Details */}
              <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
                <h3 className="mb-2 text-base font-semibold text-gray-900">Usage</h3>
                <div className="space-y-1 text-sm text-gray-700">
                  <p>
                    <span className="font-medium">Products:</span>{" "}
                    {subscriptionData.currentProductsCount !== null ? subscriptionData.currentProductsCount : "N/A"} /{" "}
                    {subscriptionData.maxProducts === 99999 ? "Unlimited" : subscriptionData.maxProducts || "N/A"}
                  </p>
                  <p>
                    <span className="font-medium">Users:</span>{" "}
                    {subscriptionData.currentUsersCount !== null ? subscriptionData.currentUsersCount : "N/A"} /{" "}
                    {subscriptionData.maxUsers === 99999 ? "Unlimited" : subscriptionData.maxUsers || "N/A"}
                  </p>
                </div>
                <Button className="mt-4 w-full bg-transparent" variant="outline">
                  Expand
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {/* Solo Plan */}
        <Card className="flex flex-col rounded-xl shadow-sm">
          <CardHeader className="border-b px-5 py-3">
            <CardTitle className="text-lg font-bold text-gray-800">Solo Plan</CardTitle>
            <CardDescription className="text-xs text-gray-600">
              Ideal for first time users and media owners with 1-3 OOH sites.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-1 flex-col justify-between p-5">
            <div>
              <p className="text-3xl font-bold text-gray-900">
                Php 1,500<span className="text-base font-medium text-gray-600">/month</span>
              </p>
              <ul className="mt-4 space-y-2 text-sm text-gray-700">
                {features.solo.map((feature, index) => (
                  <li key={index} className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    {feature}
                  </li>
                ))}
              </ul>
            </div>
            <Button className="mt-6 w-full">Choose Plan</Button>
          </CardContent>
        </Card>

        {/* Family Plan */}
        <Card className="flex flex-col rounded-xl shadow-sm">
          <CardHeader className="border-b px-5 py-3">
            <CardTitle className="text-lg font-bold text-gray-800">Family Plan</CardTitle>
            <CardDescription className="text-xs text-gray-600">
              Ideal for media owners with around 5 OOH sites.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-1 flex-col justify-between p-5">
            <div>
              <p className="text-3xl font-bold text-gray-900">
                Php 2,100<span className="text-base font-medium text-gray-600">/month</span>
              </p>
              <ul className="mt-4 space-y-2 text-sm text-gray-700">
                {features.family.map((feature, index) => (
                  <li key={index} className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    {feature}
                  </li>
                ))}
              </ul>
            </div>
            <Button className="mt-6 w-full">Choose Plan</Button>
          </CardContent>
        </Card>

        {/* Membership Plan */}
        <Card className="flex flex-col rounded-xl shadow-sm">
          <CardHeader className="border-b px-5 py-3">
            <CardTitle className="text-lg font-bold text-gray-800">Membership</CardTitle>
            <CardDescription className="text-xs text-gray-600">
              Access exclusive perks and features from OH!Plus.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-1 flex-col justify-between p-5">
            <div>
              <p className="text-3xl font-bold text-gray-900">
                Php 30,000<span className="text-base font-medium text-gray-600">/year</span>
              </p>
              <ul className="mt-4 space-y-2 text-sm text-gray-700">
                {features.membership.map((feature, index) => (
                  <li key={index} className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    {feature}
                  </li>
                ))}
              </ul>
            </div>
            <Button className="mt-6 w-full">Choose Plan</Button>
          </CardContent>
        </Card>

        {/* Enterprise Plan */}
        <Card className="flex flex-col rounded-xl shadow-sm">
          <CardHeader className="border-b px-5 py-3">
            <CardTitle className="text-lg font-bold text-gray-800">Enterprise</CardTitle>
            <CardDescription className="text-xs text-gray-600">
              Tailored for large companies with extensive needs.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-1 flex-col justify-between p-5">
            <div>
              <h3 className="text-3xl font-bold text-gray-900">Contact Us</h3>
              <ul className="mt-4 space-y-2 text-sm text-gray-700">
                {features.enterprise.map((feature, index) => (
                  <li key={index} className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    {feature}
                  </li>
                ))}
              </ul>
            </div>
            <Button className="mt-6 w-full">Contact Sales</Button>
          </CardContent>
        </Card>
      </div>
    </main>
  )
}

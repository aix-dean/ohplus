"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { CreditCard, Info, CheckCircle, XCircle, ArrowRight } from "lucide-react"
import { cn } from "@/lib/utils"
import { useAuth } from "@/contexts/auth-context"
import { subscriptionService } from "@/lib/subscription-service"
import { Loader2 } from "lucide-react"

export default function SubscriptionsPage() {
  const { subscriptionData, userData, loading: authLoading } = useAuth()
  const [promoEndDate, setPromoEndDate] = useState<Date | null>(null)
  const [timeLeft, setTimeLeft] = useState<{
    days: number
    hours: number
    minutes: number
    seconds: number
  } | null>(null)

  useEffect(() => {
    // Set the promo end date to July 19, 2025, 11:59 PM PH time
    setPromoEndDate(new Date(2025, 6, 19, 23, 59, 0))
  }, [])

  useEffect(() => {
    if (!promoEndDate) return

    const calculateTimeLeft = () => {
      const now = new Date().getTime()
      const difference = promoEndDate.getTime() - now

      if (difference <= 0) {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 })
        return
      }

      const days = Math.floor(difference / (1000 * 60 * 60 * 24))
      const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
      const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60))
      const seconds = Math.floor((difference % (1000 * 60)) / 1000)

      setTimeLeft({ days, hours, minutes, seconds })
    }

    calculateTimeLeft()
    const timer = setInterval(calculateTimeLeft, 1000)

    return () => clearInterval(timer)
  }, [promoEndDate])

  const maxProducts = subscriptionData?.maxProducts
  const currentProductsCount = userData?.products || 0 // Assuming products count is available in userData
  const isLimitReached = maxProducts !== null && currentProductsCount >= maxProducts
  const isTrial = subscriptionData?.status === "trialing"
  const daysRemaining = subscriptionData ? subscriptionService.getDaysRemaining(subscriptionData) : 0

  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="flex flex-1 flex-col p-4 md:p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Subscription Management</h1>
        <p className="text-gray-600">Manage user subscriptions and plans.</p>
      </div>

      {/* Current Plan Section */}
      {subscriptionData && (
        <Card className="mb-6 rounded-xl shadow-sm">
          <CardHeader className="border-b px-5 py-3">
            <CardTitle className="flex items-center gap-2 text-lg font-bold text-gray-800">
              <CreditCard className="h-5 w-5 text-primary" />
              Current Plan:{" "}
              <span
                className={cn(
                  "font-semibold",
                  subscriptionData.status === "active" && "text-green-600",
                  subscriptionData.status === "trialing" && "text-blue-600",
                  subscriptionData.status === "expired" && "text-red-600",
                  subscriptionData.status === "cancelled" && "text-gray-600",
                )}
              >
                {subscriptionData.planType.toUpperCase()} {subscriptionData.status === "trialing" && "Trial"} Plan
              </span>
            </CardTitle>
            <CardDescription className="text-xs text-gray-600">
              Details of the currently active subscription.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-5">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              {/* Plan Details */}
              <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
                <h3 className="mb-2 text-base font-semibold text-gray-800">Plan</h3>
                <p className="text-xl font-bold text-gray-900 capitalize">{subscriptionData.planType}</p>
                <p className="text-sm text-gray-600">
                  Php {subscriptionData.price?.toLocaleString() || "N/A"} /{subscriptionData.billingCycle || "N/A"}
                </p>
                <ul className="mt-3 space-y-1 text-sm text-gray-700">
                  {subscriptionData.planType === "solo" && (
                    <>
                      <li className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-500" /> Manage up to 3 sites
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-500" /> FREE Listing to OOH Marketplaces
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-500" /> FREE 1-Day onboarding training
                      </li>
                    </>
                  )}
                  {subscriptionData.planType === "family" && (
                    <>
                      <li className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-500" /> Manage up to 5 sites
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-500" /> FREE Listing to OOH Marketplaces
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-500" /> FREE 1-Day onboarding training
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-500" /> ERP + Programmatic CMS
                      </li>
                    </>
                  )}
                  {subscriptionData.planType === "membership" && (
                    <>
                      <li className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-500" /> Manage up to 8 sites
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-500" /> FREE Listing to OOH Marketplaces
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-500" /> FREE 1-Day onboarding training
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-500" /> ERP + Programmatic CMS
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-500" /> Priority Support
                      </li>
                    </>
                  )}
                  {subscriptionData.planType === "enterprise" && (
                    <>
                      <li className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-500" /> Flexible Pricing
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-500" /> Flexible Payment Terms
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-500" /> Embassy Privileges
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-500" /> Priority Assistance
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-500" /> Full-Access
                      </li>
                    </>
                  )}
                </ul>
              </div>

              {/* Cycle Details */}
              <div className="relative rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
                <h3 className="mb-2 text-base font-semibold text-gray-800">Cycle</h3>
                <p className="text-sm text-gray-700">
                  <span className="font-bold">Start:</span>{" "}
                  {subscriptionData.startDate ? new Date(subscriptionData.startDate).toLocaleDateString() : "N/A"}
                </p>
                <p className="text-sm text-gray-700">
                  <span className="font-bold">End:</span>{" "}
                  {subscriptionData.endDate ? new Date(subscriptionData.endDate).toLocaleDateString() : "N/A"}
                </p>
                {isTrial && (
                  <p className="mt-2 text-sm text-blue-600">
                    Trial ends: {new Date(subscriptionData.trialEndDate!).toLocaleDateString()} ({daysRemaining} days
                    remaining)
                  </p>
                )}
                <Button variant="outline" size="sm" className="absolute bottom-4 right-4 bg-transparent">
                  Extend
                </Button>
              </div>

              {/* Users/Products */}
              <div className="relative rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
                <h3 className="mb-2 text-base font-semibold text-gray-800">Users / Products</h3>
                <p className="text-xl font-bold text-gray-900">{currentProductsCount} products</p>
                <p className="text-sm text-gray-600">
                  (Max of {maxProducts === 99999 ? "Unlimited" : maxProducts} products)
                </p>
                {maxProducts !== null && (
                  <Progress
                    value={(currentProductsCount / maxProducts) * 100}
                    className="mt-3 h-2 rounded-full bg-gray-200 [&>*]:bg-primary"
                  />
                )}
                {isLimitReached && (
                  <p className="mt-2 flex items-center gap-1.5 text-sm text-red-600">
                    <Info className="h-4 w-4" />
                    Product limit reached.
                  </p>
                )}
                <Button variant="outline" size="sm" className="absolute bottom-4 right-4 bg-transparent">
                  Expand
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Promo Banner */}
      <Card className="mb-6 rounded-xl bg-gradient-to-r from-primary to-purple-600 p-6 text-white shadow-sm">
        <CardContent className="flex flex-col items-center justify-between gap-4 p-0 md:flex-row">
          <div className="flex items-center gap-4">
            <div className="relative flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-full bg-white text-primary">
              <span className="absolute -top-2 -right-2 flex h-6 w-6 items-center justify-center rounded-full bg-red-500 text-xs font-bold text-white">
                '25
              </span>
              <span className="text-lg font-bold">EXPO</span>
            </div>
            <div>
              <h2 className="text-2xl font-bold">90 DAYS FREE TRIAL</h2>
              <p className="text-sm text-gray-200">Limited time offer for new sign-ups!</p>
            </div>
          </div>
          <div className="flex flex-col items-center gap-2">
            {timeLeft && (
              <p className="text-lg font-semibold whitespace-nowrap">
                {timeLeft.days} days : {timeLeft.hours} hours : {timeLeft.minutes} minutes : {timeLeft.seconds} seconds
                left
              </p>
            )}
            <Button variant="secondary" className="bg-white text-primary hover:bg-gray-100">
              GET NOW <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Pricing Plans Section */}
      <div className="mb-6 text-center">
        <h2 className="text-3xl font-bold text-gray-900">Choose Your Plan</h2>
        <p className="mt-2 text-gray-600">Select the perfect plan that fits your business needs.</p>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
        {/* Solo Plan */}
        <Card className="rounded-xl shadow-sm">
          <CardHeader className="border-b px-5 py-3">
            <CardTitle className="text-xl font-bold text-gray-800">Solo Plan</CardTitle>
            <CardDescription className="text-xs text-gray-600">
              Ideal for first time users and media owners with 1-3 OOH sites.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-5">
            <div className="mb-4">
              <span className="text-3xl font-bold text-gray-900">Php 1,500</span>
              <span className="text-base text-gray-600">/month</span>
            </div>
            <ul className="space-y-2 text-sm text-gray-700">
              <li className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500" /> Manage up to 3 sites
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500" /> FREE Listing to OOH Marketplaces
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500" /> FREE 1-Day onboarding training
              </li>
              <li className="flex items-center gap-2">
                <XCircle className="h-4 w-4 text-red-500" /> ERP + Programmatic CMS
              </li>
              <li className="flex items-center gap-2">
                <XCircle className="h-4 w-4 text-red-500" /> Priority Support
              </li>
            </ul>
            <Button className="mt-6 w-full">Choose Plan</Button>
          </CardContent>
        </Card>

        {/* Family Plan */}
        <Card className="rounded-xl shadow-sm">
          <CardHeader className="border-b px-5 py-3">
            <CardTitle className="text-xl font-bold text-gray-800">Family Plan</CardTitle>
            <CardDescription className="text-xs text-gray-600">
              Ideal for media owners with around 5 OOH sites.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-5">
            <div className="mb-4">
              <span className="text-3xl font-bold text-gray-900">Php 2,100</span>
              <span className="text-base text-gray-600">/month</span>
            </div>
            <ul className="space-y-2 text-sm text-gray-700">
              <li className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500" /> Manage up to 5 sites
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500" /> FREE Listing to OOH Marketplaces
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500" /> FREE 1-Day onboarding training
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500" /> ERP + Programmatic CMS
              </li>
              <li className="flex items-center gap-2">
                <XCircle className="h-4 w-4 text-red-500" /> Priority Support
              </li>
            </ul>
            <Button className="mt-6 w-full">Choose Plan</Button>
          </CardContent>
        </Card>

        {/* Membership Plan */}
        <Card className="rounded-xl shadow-sm">
          <CardHeader className="border-b px-5 py-3">
            <CardTitle className="text-xl font-bold text-gray-800">Membership</CardTitle>
            <CardDescription className="text-xs text-gray-600">
              Access exclusive perks and features from OH!Plus.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-5">
            <div className="mb-4">
              <span className="text-3xl font-bold text-gray-900">Php 30,000</span>
              <span className="text-base text-gray-600">/year</span>
            </div>
            <ul className="space-y-2 text-sm text-gray-700">
              <li className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500" /> Manage up to 8 sites
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500" /> FREE Listing to OOH Marketplaces
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500" /> FREE 1-Day onboarding training
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500" /> ERP + Programmatic CMS
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500" /> Priority Support
              </li>
            </ul>
            <Button className="mt-6 w-full">Choose Plan</Button>
          </CardContent>
        </Card>

        {/* Enterprise Plan */}
        <Card className="rounded-xl shadow-sm">
          <CardHeader className="border-b px-5 py-3">
            <CardTitle className="text-xl font-bold text-gray-800">Enterprise</CardTitle>
            <CardDescription className="text-xs text-gray-600">
              Tailored for large companies with extensive needs.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-5">
            <div className="mb-4">
              <span className="text-3xl font-bold text-gray-900">Contact Us</span>
            </div>
            <ul className="space-y-2 text-sm text-gray-700">
              <li className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500" /> Flexible Pricing
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500" /> Flexible Payment Terms
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500" /> Embassy Privileges
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500" /> Priority Assistance
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500" /> Full-Access
              </li>
            </ul>
            <Button className="mt-6 w-full">Contact Sales</Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

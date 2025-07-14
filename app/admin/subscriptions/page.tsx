"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Loader2, Users, Package, CreditCard, Calendar, Crown, Zap, Building2, Sparkles } from "lucide-react"
import { getUserSubscription } from "@/lib/subscription-service"
import type { SubscriptionData } from "@/lib/types/subscription"
import { collection, query, where, getCountFromServer } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { getUserProductsCount } from "@/lib/firebase-service"

export default function AdminSubscriptionsPage() {
  const router = useRouter()
  const { user, userData } = useAuth()
  const [subscriptionData, setSubscriptionData] = useState<SubscriptionData | null>(null)
  const [loading, setLoading] = useState(true)
  const [currentUserCount, setCurrentUserCount] = useState<number>(0)
  const [loadingUserCount, setLoadingUserCount] = useState(true)
  const [currentInventoryCount, setCurrentInventoryCount] = useState<number>(0)
  const [loadingInventoryCount, setLoadingInventoryCount] = useState(true)

  useEffect(() => {
    const fetchSubscriptionData = async () => {
      if (!userData?.license_key) {
        setLoading(false)
        return
      }

      try {
        const subscription = await getUserSubscription(userData.license_key)
        setSubscriptionData(subscription)
      } catch (error) {
        console.error("Error fetching subscription:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchSubscriptionData()
  }, [userData?.license_key])

  // Fetch actual user count
  useEffect(() => {
    const fetchUserCount = async () => {
      if (!userData?.license_key) {
        setLoadingUserCount(false)
        return
      }

      try {
        const usersRef = collection(db, "iboard_users")
        const q = query(usersRef, where("license_key", "==", userData.license_key))
        const countSnapshot = await getCountFromServer(q)
        setCurrentUserCount(countSnapshot.data().count)
      } catch (error) {
        console.error("Error fetching user count:", error)
        setCurrentUserCount(0)
      } finally {
        setLoadingUserCount(false)
      }
    }

    fetchUserCount()
  }, [userData?.license_key])

  // Fetch actual inventory count
  useEffect(() => {
    const fetchInventoryCount = async () => {
      if (!userData?.company_id) {
        setLoadingInventoryCount(false)
        return
      }

      try {
        const count = await getUserProductsCount(userData.company_id, { active: true })
        setCurrentInventoryCount(count)
      } catch (error) {
        console.error("Error fetching inventory count:", error)
        setCurrentInventoryCount(0)
      } finally {
        setLoadingInventoryCount(false)
      }
    }

    fetchInventoryCount()
  }, [userData?.company_id])

  const getPlanIcon = (planType: string) => {
    switch (planType?.toLowerCase()) {
      case "solo":
        return <Users className="h-5 w-5" />
      case "family":
        return <Building2 className="h-5 w-5" />
      case "membership":
        return <Crown className="h-5 w-5" />
      case "enterprise":
        return <Sparkles className="h-5 w-5" />
      default:
        return <Zap className="h-5 w-5" />
    }
  }

  const getPlanColor = (planType: string) => {
    switch (planType?.toLowerCase()) {
      case "solo":
        return "bg-blue-500"
      case "family":
        return "bg-green-500"
      case "membership":
        return "bg-purple-500"
      case "enterprise":
        return "bg-gradient-to-r from-yellow-400 to-orange-500"
      default:
        return "bg-gray-500"
    }
  }

  const formatDate = (timestamp: any) => {
    if (!timestamp) return "N/A"

    let date: Date
    if (timestamp.toDate) {
      date = timestamp.toDate()
    } else if (timestamp instanceof Date) {
      date = timestamp
    } else {
      date = new Date(timestamp)
    }

    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    })
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    )
  }

  if (!subscriptionData) {
    return (
      <div className="flex-1 p-4 md:p-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Subscription</h1>
          <p className="text-gray-600 mt-2">Manage your subscription and billing</p>
        </div>

        <div className="max-w-2xl mx-auto text-center py-12">
          <div className="mb-6">
            <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
              <CreditCard className="h-8 w-8 text-gray-400" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">No Active Subscription</h2>
            <p className="text-gray-600">
              You don't have an active subscription. Choose a plan to get started with all the features.
            </p>
          </div>

          <Button
            onClick={() => router.push("/admin/subscriptions/choose-plan")}
            className="bg-blue-600 hover:bg-blue-700"
          >
            Choose a Plan
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 p-4 md:p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Subscription</h1>
        <p className="text-gray-600 mt-2">Manage your subscription and billing</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mb-8">
        {/* Current Plan Card */}
        <Card className="relative overflow-hidden">
          <div className={`absolute top-0 left-0 right-0 h-1 ${getPlanColor(subscriptionData.planType)}`} />
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg font-semibold flex items-center gap-2">
                {getPlanIcon(subscriptionData.planType)}
                Current Plan
              </CardTitle>
              <Badge
                variant={subscriptionData.status === "active" ? "default" : "secondary"}
                className={subscriptionData.status === "active" ? "bg-green-500" : ""}
              >
                {subscriptionData.status}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="text-2xl font-bold capitalize">{subscriptionData.planType} Plan</div>
              <div className="text-sm text-gray-600">
                ₱{subscriptionData.amount?.toLocaleString()} / {subscriptionData.billingCycle}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Users Card */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <Users className="h-5 w-5" />
              Users
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="text-2xl font-bold">
                {loadingUserCount ? <Loader2 className="h-6 w-6 animate-spin" /> : `${currentUserCount} users`}
              </div>
              <div className="text-sm text-gray-600">
                {subscriptionData.maxUsers === -1 ? "Unlimited users" : `Max ${subscriptionData.maxUsers} users`}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Inventory Card */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <Package className="h-5 w-5" />
              Inventory
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="text-2xl font-bold">
                {loadingInventoryCount ? (
                  <Loader2 className="h-6 w-6 animate-spin" />
                ) : (
                  `${currentInventoryCount} sites`
                )}
              </div>
              <div className="text-sm text-gray-600">
                {subscriptionData.maxProducts === -1 ? "Unlimited sites" : `Max ${subscriptionData.maxProducts} sites`}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Subscription Details */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Subscription Details
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="text-sm font-medium text-gray-500">License Key</label>
              <div className="mt-1 font-mono text-sm bg-gray-50 p-2 rounded border">{subscriptionData.licenseKey}</div>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">Status</label>
              <div className="mt-1">
                <Badge
                  variant={subscriptionData.status === "active" ? "default" : "secondary"}
                  className={subscriptionData.status === "active" ? "bg-green-500" : ""}
                >
                  {subscriptionData.status}
                </Badge>
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">Start Date</label>
              <div className="mt-1 text-sm">{formatDate(subscriptionData.startDate)}</div>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">End Date</label>
              <div className="mt-1 text-sm">{formatDate(subscriptionData.endDate)}</div>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">Billing Cycle</label>
              <div className="mt-1 text-sm capitalize">{subscriptionData.billingCycle}</div>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">Amount</label>
              <div className="mt-1 text-sm">₱{subscriptionData.amount?.toLocaleString()}</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex gap-4">
        <Button onClick={() => router.push("/admin/subscriptions/choose-plan")} variant="outline">
          Change Plan
        </Button>
        <Button variant="outline" disabled>
          Billing History
        </Button>
      </div>
    </div>
  )
}

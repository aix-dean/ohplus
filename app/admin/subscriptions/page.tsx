"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Loader2, Users, Package, CreditCard, Calendar, Crown, CheckCircle, XCircle } from "lucide-react"
import { getSubscriptionByLicenseKey } from "@/lib/subscription-service"
import type { Subscription } from "@/lib/types/subscription"
import { collection, query, where, getCountFromServer } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { getUserProductsCount } from "@/lib/firebase-service"

export default function AdminSubscriptionsPage() {
  const router = useRouter()
  const { userData, loading: authLoading } = useAuth()
  const [subscription, setSubscription] = useState<Subscription | null>(null)
  const [loading, setLoading] = useState(true)
  const [currentUserCount, setCurrentUserCount] = useState<number>(0)
  const [loadingUserCount, setLoadingUserCount] = useState(true)
  const [currentInventoryCount, setCurrentInventoryCount] = useState<number>(0)
  const [loadingInventoryCount, setLoadingInventoryCount] = useState(true)

  // Fetch subscription data
  useEffect(() => {
    const fetchSubscription = async () => {
      if (!userData?.license_key) {
        setLoading(false)
        return
      }

      try {
        const subscriptionData = await getSubscriptionByLicenseKey(userData.license_key)
        setSubscription(subscriptionData)
      } catch (error) {
        console.error("Error fetching subscription:", error)
      } finally {
        setLoading(false)
      }
    }

    if (!authLoading && userData) {
      fetchSubscription()
    }
  }, [userData, authLoading])

  // Fetch current user count
  useEffect(() => {
    const fetchUserCount = async () => {
      if (!userData?.license_key) {
        setLoadingUserCount(false)
        return
      }

      try {
        const usersRef = collection(db, "iboard_users")
        const q = query(usersRef, where("license_key", "==", userData.license_key))
        const snapshot = await getCountFromServer(q)
        setCurrentUserCount(snapshot.data().count)
      } catch (error) {
        console.error("Error fetching user count:", error)
        setCurrentUserCount(0)
      } finally {
        setLoadingUserCount(false)
      }
    }

    if (userData?.license_key) {
      fetchUserCount()
    }
  }, [userData?.license_key])

  // Fetch current inventory count
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

    if (userData?.company_id) {
      fetchInventoryCount()
    }
  }, [userData?.company_id])

  if (authLoading || loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  if (!userData?.license_key) {
    return (
      <div className="flex-1 p-4 md:p-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Subscription</h1>
          <p className="text-gray-600 mt-2">Manage your subscription and billing</p>
        </div>

        <Card className="max-w-md mx-auto">
          <CardContent className="p-6 text-center">
            <div className="mb-4">
              <CreditCard className="h-12 w-12 mx-auto text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold mb-2">No Active Subscription</h3>
            <p className="text-gray-600 mb-4">You don't have an active subscription. Choose a plan to get started.</p>
            <Button onClick={() => router.push("/admin/subscriptions/choose-plan")}>Choose Plan</Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!subscription) {
    return (
      <div className="flex-1 p-4 md:p-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Subscription</h1>
          <p className="text-gray-600 mt-2">Manage your subscription and billing</p>
        </div>

        <Card className="max-w-md mx-auto">
          <CardContent className="p-6 text-center">
            <div className="mb-4">
              <XCircle className="h-12 w-12 mx-auto text-red-400" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Subscription Not Found</h3>
            <p className="text-gray-600 mb-4">We couldn't find your subscription details. Please contact support.</p>
            <Button variant="outline" onClick={() => router.push("/help")}>
              Contact Support
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    })
  }

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "active":
        return "bg-green-100 text-green-800"
      case "inactive":
      case "cancelled":
        return "bg-red-100 text-red-800"
      case "trial":
        return "bg-blue-100 text-blue-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getPlanIcon = (planType: string) => {
    switch (planType.toLowerCase()) {
      case "enterprise":
        return <Crown className="h-5 w-5" />
      default:
        return <CreditCard className="h-5 w-5" />
    }
  }

  return (
    <div className="flex-1 p-4 md:p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Subscription</h1>
        <p className="text-gray-600 mt-2">Manage your subscription and billing</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* Current Plan Card */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Current Plan</CardTitle>
            {getPlanIcon(subscription.planType)}
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold capitalize">{subscription.planType}</div>
            <div className="flex items-center gap-2 mt-2">
              <Badge className={getStatusColor(subscription.status)}>{subscription.status}</Badge>
              {subscription.status === "active" && <CheckCircle className="h-4 w-4 text-green-600" />}
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              {subscription.billingCycle === "monthly" ? "Billed Monthly" : "Billed Annually"}
            </p>
          </CardContent>
        </Card>

        {/* Users Card */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {loadingUserCount ? (
                <Loader2 className="h-6 w-6 animate-spin" />
              ) : (
                `${currentUserCount}${subscription.maxUsers === -1 ? "" : ` / ${subscription.maxUsers}`}`
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              {subscription.maxUsers === -1 ? "Unlimited users" : `Max ${subscription.maxUsers} users`}
            </p>
          </CardContent>
        </Card>

        {/* Inventory Card */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Inventory</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {loadingInventoryCount ? (
                <Loader2 className="h-6 w-6 animate-spin" />
              ) : (
                `${currentInventoryCount}${subscription.maxProducts === -1 ? "" : ` / ${subscription.maxProducts}`}`
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              {subscription.maxProducts === -1 ? "Unlimited sites" : `Max ${subscription.maxProducts} sites`}
            </p>
          </CardContent>
        </Card>

        {/* Billing Card */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Billing</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₱{subscription.price.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              {subscription.billingCycle === "monthly" ? "per month" : "per year"}
            </p>
            {subscription.nextBillingDate && (
              <p className="text-xs text-muted-foreground mt-1">
                Next billing: {formatDate(subscription.nextBillingDate)}
              </p>
            )}
          </CardContent>
        </Card>

        {/* Subscription Details Card */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Subscription Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium text-gray-500">License Key</p>
                <p className="text-sm font-mono bg-gray-100 p-2 rounded">{subscription.licenseKey}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Start Date</p>
                <p className="text-sm">{formatDate(subscription.startDate)}</p>
              </div>
              {subscription.endDate && (
                <div>
                  <p className="text-sm font-medium text-gray-500">End Date</p>
                  <p className="text-sm">{formatDate(subscription.endDate)}</p>
                </div>
              )}
              <div>
                <p className="text-sm font-medium text-gray-500">Features</p>
                <div className="flex flex-wrap gap-1 mt-1">
                  {subscription.features.map((feature, index) => (
                    <Badge key={index} variant="secondary" className="text-xs">
                      {feature}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex gap-2 pt-4">
              <Button onClick={() => router.push("/admin/subscriptions/choose-plan")}>Upgrade Plan</Button>
              <Button variant="outline">Manage Billing</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

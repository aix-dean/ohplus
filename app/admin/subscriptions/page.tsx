"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Loader2, Users, Package, CreditCard, Calendar, CheckCircle, XCircle, AlertCircle } from "lucide-react"
import { getSubscriptionByLicenseKey, type SubscriptionData } from "@/lib/subscription-service"
import { collection, query, where, getDocs } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { getUserProductsCount } from "@/lib/firebase-service"

export default function AdminSubscriptionsPage() {
  const router = useRouter()
  const { userData } = useAuth()
  const [subscriptionData, setSubscriptionData] = useState<SubscriptionData | null>(null)
  const [loading, setLoading] = useState(true)
  const [currentUserCount, setCurrentUserCount] = useState<number>(0)
  const [loadingUserCount, setLoadingUserCount] = useState(true)
  const [currentProductCount, setCurrentProductCount] = useState<number>(0)
  const [loadingProductCount, setLoadingProductCount] = useState(true)

  useEffect(() => {
    const fetchSubscriptionData = async () => {
      if (!userData?.license_key) {
        setLoading(false)
        return
      }

      try {
        const subscription = await getSubscriptionByLicenseKey(userData.license_key)
        setSubscriptionData(subscription)
      } catch (error) {
        console.error("Error fetching subscription:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchSubscriptionData()
  }, [userData?.license_key])

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
        const querySnapshot = await getDocs(q)
        setCurrentUserCount(querySnapshot.size)
      } catch (error) {
        console.error("Error fetching user count:", error)
      } finally {
        setLoadingUserCount(false)
      }
    }

    fetchUserCount()
  }, [userData?.license_key])

  // Fetch current product count
  useEffect(() => {
    const fetchProductCount = async () => {
      if (!userData?.company_id) {
        setLoadingProductCount(false)
        return
      }

      try {
        const count = await getUserProductsCount(userData.company_id, { active: true })
        setCurrentProductCount(count)
      } catch (error) {
        console.error("Error fetching product count:", error)
      } finally {
        setLoadingProductCount(false)
      }
    }

    fetchProductCount()
  }, [userData?.company_id])

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "active":
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case "inactive":
        return <XCircle className="h-4 w-4 text-red-500" />
      case "trial":
        return <AlertCircle className="h-4 w-4 text-yellow-500" />
      default:
        return <XCircle className="h-4 w-4 text-gray-500" />
    }
  }

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case "active":
        return "default"
      case "inactive":
        return "destructive"
      case "trial":
        return "secondary"
      default:
        return "outline"
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
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
        </div>
        <div className="text-center py-12">
          <h2 className="text-xl font-semibold text-gray-700 mb-4">No Active Subscription</h2>
          <p className="text-gray-500 mb-6">You don't have an active subscription. Choose a plan to get started.</p>
          <Button onClick={() => router.push("/admin/subscriptions/choose-plan")}>Choose Plan</Button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 p-4 md:p-6">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Subscription</h1>
        <Button onClick={() => router.push("/admin/subscriptions/choose-plan")}>Manage Plan</Button>
      </div>

      {/* Subscription Overview */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
        {/* Current Plan */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Current Plan</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold capitalize">{subscriptionData.plan}</div>
            <div className="flex items-center mt-2">
              {getStatusIcon(subscriptionData.status)}
              <Badge variant={getStatusBadgeVariant(subscriptionData.status)} className="ml-2 capitalize">
                {subscriptionData.status}
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Users */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loadingUserCount ? (
              <div className="flex items-center">
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                <span className="text-sm text-muted-foreground">Loading...</span>
              </div>
            ) : (
              <>
                <div className="text-2xl font-bold">
                  {currentUserCount} / {subscriptionData.maxUsers === -1 ? "∞" : subscriptionData.maxUsers}
                </div>
                <p className="text-xs text-muted-foreground">
                  {subscriptionData.maxUsers === -1
                    ? "Unlimited users"
                    : `${subscriptionData.maxUsers - currentUserCount} remaining`}
                </p>
              </>
            )}
          </CardContent>
        </Card>

        {/* Inventory */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Inventory</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loadingProductCount ? (
              <div className="flex items-center">
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                <span className="text-sm text-muted-foreground">Loading...</span>
              </div>
            ) : (
              <>
                <div className="text-2xl font-bold">
                  {currentProductCount} / {subscriptionData.maxProducts === -1 ? "∞" : subscriptionData.maxProducts}
                </div>
                <p className="text-xs text-muted-foreground">
                  {subscriptionData.maxProducts === -1
                    ? "Unlimited sites"
                    : `${subscriptionData.maxProducts - currentProductCount} remaining`}
                </p>
              </>
            )}
          </CardContent>
        </Card>

        {/* Next Billing */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Next Billing</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {subscriptionData.endDate ? formatDate(subscriptionData.endDate) : "N/A"}
            </div>
            <p className="text-xs text-muted-foreground">
              {subscriptionData.plan === "trial" ? "Trial expires" : "Renewal date"}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Subscription Details */}
      <Card>
        <CardHeader>
          <CardTitle>Subscription Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <h3 className="font-semibold text-sm text-gray-600 mb-2">Plan Information</h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm">Plan:</span>
                  <span className="text-sm font-medium capitalize">{subscriptionData.plan}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Status:</span>
                  <Badge variant={getStatusBadgeVariant(subscriptionData.status)} className="capitalize">
                    {subscriptionData.status}
                  </Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">License Key:</span>
                  <span className="text-sm font-mono">{subscriptionData.licenseKey}</span>
                </div>
              </div>
            </div>

            <div>
              <h3 className="font-semibold text-sm text-gray-600 mb-2">Usage Limits</h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm">Max Users:</span>
                  <span className="text-sm font-medium">
                    {subscriptionData.maxUsers === -1 ? "Unlimited" : subscriptionData.maxUsers}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Max Sites:</span>
                  <span className="text-sm font-medium">
                    {subscriptionData.maxProducts === -1 ? "Unlimited" : subscriptionData.maxProducts}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Current Users:</span>
                  <span className="text-sm font-medium">{currentUserCount}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Current Sites:</span>
                  <span className="text-sm font-medium">{currentProductCount}</span>
                </div>
              </div>
            </div>
          </div>

          {subscriptionData.features && subscriptionData.features.length > 0 && (
            <div>
              <h3 className="font-semibold text-sm text-gray-600 mb-2">Features</h3>
              <div className="grid gap-2 md:grid-cols-2">
                {subscriptionData.features.map((feature, index) => (
                  <div key={index} className="flex items-center space-x-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span className="text-sm">{feature}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="pt-4 border-t">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm text-gray-600">
                  {subscriptionData.plan === "trial" ? "Trial started:" : "Subscription started:"}
                </p>
                <p className="text-sm font-medium">
                  {subscriptionData.startDate ? formatDate(subscriptionData.startDate) : "N/A"}
                </p>
              </div>
              {subscriptionData.endDate && (
                <div className="text-right">
                  <p className="text-sm text-gray-600">
                    {subscriptionData.plan === "trial" ? "Trial ends:" : "Next billing:"}
                  </p>
                  <p className="text-sm font-medium">{formatDate(subscriptionData.endDate)}</p>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

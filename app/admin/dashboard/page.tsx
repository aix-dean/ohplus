"use client"

import { useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { useTour } from "@/contexts/tour-context"
import { createOnboardingTourSteps } from "@/lib/tour-steps"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Loader2, TrendingUp, Users, DollarSign, BarChart3 } from "lucide-react"

export default function AdminDashboardPage() {
  const { user, userData, subscriptionData, loading } = useAuth()
  const { startTour } = useTour()
  const router = useRouter()
  const searchParams = useSearchParams()
  const [hasStartedTour, setHasStartedTour] = useState(false)

  // Check if user just registered
  const justRegistered = searchParams?.get("registered") === "true"

  useEffect(() => {
    if (justRegistered && !hasStartedTour && !loading && user) {
      // Start the onboarding tour for new users
      const tourSteps = createOnboardingTourSteps(router)
      startTour(tourSteps)
      setHasStartedTour(true)

      // Clean up the URL parameter
      const url = new URL(window.location.href)
      url.searchParams.delete("registered")
      window.history.replaceState({}, "", url.toString())
    }
  }, [justRegistered, hasStartedTour, loading, user, startTour, router])

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  return (
    <div className="flex-1 p-4 md:p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">
          {userData?.first_name ? `${userData.first_name}'s Dashboard` : "Dashboard"}
        </h1>
        <p className="text-gray-600 mt-1">Welcome to your advertising management dashboard</p>
      </div>

      {/* Quick Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₱0</div>
            <p className="text-xs text-muted-foreground">No metrics yet.</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Sites</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
            <p className="text-xs text-muted-foreground">No metrics yet.</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Clients</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
            <p className="text-xs text-muted-foreground">No metrics yet.</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Campaign Performance</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0%</div>
            <p className="text-xs text-muted-foreground">No metrics yet.</p>
          </CardContent>
        </Card>
      </div>

      {/* Welcome Message for New Users */}
      {justRegistered && (
        <Card className="mb-6 border-blue-200 bg-blue-50">
          <CardHeader>
            <CardTitle className="text-blue-800">🎉 Welcome to OOH Operator!</CardTitle>
            <CardDescription className="text-blue-600">
              You're all set up! Let's get your first billboard site added to start managing your advertising inventory.
            </CardDescription>
          </CardHeader>
        </Card>
      )}

      {/* Subscription Status */}
      {subscriptionData && (
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Subscription Status</CardTitle>
              <Badge variant={subscriptionData.status === "active" ? "default" : "secondary"}>
                {subscriptionData.status}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600">
              Plan: <span className="font-semibold">{subscriptionData.planName}</span>
            </p>
            <p className="text-sm text-gray-600">
              Sites: <span className="font-semibold">0 / {subscriptionData.maxProducts}</span>
            </p>
          </CardContent>
        </Card>
      )}

      {/* Quick Actions */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card
          className="cursor-pointer hover:shadow-md transition-shadow"
          onClick={() => router.push("/admin/inventory")}
        >
          <CardHeader>
            <CardTitle className="text-lg">Manage Inventory</CardTitle>
            <CardDescription>Add and manage your billboard sites</CardDescription>
          </CardHeader>
        </Card>
        <Card
          className="cursor-pointer hover:shadow-md transition-shadow"
          onClick={() => router.push("/sales/dashboard")}
        >
          <CardHeader>
            <CardTitle className="text-lg">Sales Dashboard</CardTitle>
            <CardDescription>Track your sales and bookings</CardDescription>
          </CardHeader>
        </Card>
        <Card
          className="cursor-pointer hover:shadow-md transition-shadow"
          onClick={() => router.push("/logistics/dashboard")}
        >
          <CardHeader>
            <CardTitle className="text-lg">Logistics</CardTitle>
            <CardDescription>Manage service assignments and alerts</CardDescription>
          </CardHeader>
        </Card>
      </div>
    </div>
  )
}

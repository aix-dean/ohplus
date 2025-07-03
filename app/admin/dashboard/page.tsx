"use client"

import { useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { useTour } from "@/contexts/tour-context"
import { onboardingTourSteps } from "@/lib/tour-steps"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Loader2, TrendingUp, Users, DollarSign, Building2 } from "lucide-react"
import { ResponsiveCardGrid } from "@/components/responsive-card-grid"

// Mock data for recent activities
const recentActivities = [
  {
    id: "1",
    type: "booking",
    title: "New booking confirmed",
    description: "EDSA Billboard Site A - McDonald's Campaign",
    time: "2 hours ago",
    status: "success",
  },
  {
    id: "2",
    type: "maintenance",
    title: "Maintenance scheduled",
    description: "BGC Digital Display - Routine inspection",
    time: "4 hours ago",
    status: "warning",
  },
  {
    id: "3",
    type: "proposal",
    title: "New proposal submitted",
    description: "Ayala Avenue Campaign - Coca-Cola",
    time: "6 hours ago",
    status: "info",
  },
]

// Mock data for upcoming events
const upcomingEvents = [
  {
    id: "1",
    title: "Site Inspection",
    location: "EDSA Billboard Site A",
    date: "2024-01-25",
    time: "10:00 AM",
    type: "maintenance",
  },
  {
    id: "2",
    title: "Client Meeting",
    location: "Makati Office",
    date: "2024-01-26",
    time: "2:00 PM",
    type: "meeting",
  },
  {
    id: "3",
    title: "Campaign Launch",
    location: "BGC Digital Display",
    date: "2024-01-28",
    time: "9:00 AM",
    type: "campaign",
  },
]

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
      const tourSteps = onboardingTourSteps(router)
      startTour(tourSteps)
      setHasStartedTour(true)

      // Clean up the URL parameter
      const url = new URL(window.location.href)
      url.searchParams.delete("registered")
      window.history.replaceState({}, "", url.toString())
    }
  }, [justRegistered, hasStartedTour, loading, user, startTour, router, searchParams]) // Added searchParams to dependency array

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
        <p className="text-gray-600 mt-1">Overview of your outdoor advertising operations</p>
      </div>

      {/* Quick Stats */}
      <ResponsiveCardGrid>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₱2.4M</div>
            <p className="text-xs text-muted-foreground">+12.5% from last month</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Sites</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">24</div>
            <p className="text-xs text-muted-foreground">+2 new sites this month</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Occupancy Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">87%</div>
            <p className="text-xs text-muted-foreground">+5% from last month</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Clients</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">156</div>
            <p className="text-xs text-muted-foreground">+8 new clients this month</p>
          </CardContent>
        </Card>
      </ResponsiveCardGrid>

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

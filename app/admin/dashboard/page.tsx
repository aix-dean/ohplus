"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Loader2, Users, Package, FileText, Calendar, TrendingUp, MessageCircle } from "lucide-react"
import { useAuth } from "@/contexts/auth-context"
import { useTour } from "@/contexts/tour-context" // Import useTour

export default function AdminDashboardPage() {
  const { user, userData, loading: authLoading } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()
  const { startTour, tourActive } = useTour() // Use tour hook

  // State for dashboard data (mocked for now)
  const [dashboardData, setDashboardData] = useState({
    totalUsers: 1234,
    activeProducts: 567,
    pendingDocuments: 89,
    upcomingEvents: 12,
    salesPerformance: "Up 15%",
    unreadMessages: 5,
  })
  const [loadingData, setLoadingData] = useState(false)

  useEffect(() => {
    // Check if the user just registered and start the tour
    if (searchParams.get("registered") === "true" && !tourActive) {
      startTour()
    }

    // Simulate data fetching
    setLoadingData(true)
    const timer = setTimeout(() => {
      setDashboardData({
        totalUsers: 1250,
        activeProducts: 580,
        pendingDocuments: 75,
        upcomingEvents: 15,
        salesPerformance: "Up 18%",
        unreadMessages: 3,
      })
      setLoadingData(false)
    }, 1500) // Simulate network request

    return () => clearTimeout(timer)
  }, [searchParams, startTour, tourActive])

  if (authLoading || loadingData) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="flex-1 p-4 md:p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
        <p className="text-gray-600">Welcome, {userData?.first_name || user?.email}!</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-gray-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dashboardData.totalUsers}</div>
            <p className="text-xs text-gray-500">+20.1% from last month</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Products</CardTitle>
            <Package className="h-4 w-4 text-gray-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dashboardData.activeProducts}</div>
            <p className="text-xs text-gray-500">+5 new this week</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Documents</CardTitle>
            <FileText className="h-4 w-4 text-gray-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dashboardData.pendingDocuments}</div>
            <p className="text-xs text-gray-500">Requires your attention</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Upcoming Events</CardTitle>
            <Calendar className="h-4 w-4 text-gray-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dashboardData.upcomingEvents}</div>
            <p className="text-xs text-gray-500">Next event in 3 days</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Sales Performance</CardTitle>
            <TrendingUp className="h-4 w-4 text-gray-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dashboardData.salesPerformance}</div>
            <p className="text-xs text-gray-500">Compared to last month</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Unread Messages</CardTitle>
            <MessageCircle className="h-4 w-4 text-gray-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dashboardData.unreadMessages}</div>
            <p className="text-xs text-gray-500">From clients and team</p>
          </CardContent>
        </Card>
      </div>

      <div className="mt-8">
        <h2 className="mb-4 text-2xl font-bold text-gray-900">Quick Actions</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Button className="w-full" onClick={() => router.push("/admin/products/create")}>
            Add New Product
          </Button>
          <Button
            className="w-full bg-transparent"
            variant="outline"
            onClick={() => router.push("/sales/proposals/create")}
          >
            Create New Proposal
          </Button>
          <Button
            className="w-full bg-transparent"
            variant="outline"
            onClick={() => router.push("/logistics/assignments")}
          >
            View Service Assignments
          </Button>
        </div>
      </div>
    </div>
  )
}

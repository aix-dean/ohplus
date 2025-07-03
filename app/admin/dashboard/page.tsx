"use client"

import React from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Building2,
  DollarSign,
  TrendingUp,
  Users,
  Calendar,
  MapPin,
  Activity,
  AlertTriangle,
  CheckCircle,
  Clock,
  Search,
  Filter,
  Plus,
} from "lucide-react"
import { ResponsiveCardGrid } from "@/components/responsive-card-grid"
import { useTour } from "@/contexts/tour-context"
import { onboardingTourSteps } from "@/lib/tour-steps"

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

export default function AdminDashboard() {
  const { startTour } = useTour()

  React.useEffect(() => {
    // Check if user just registered (you can implement this logic based on your auth system)
    const isNewUser = localStorage.getItem("justRegistered")
    if (isNewUser) {
      localStorage.removeItem("justRegistered")
      // Start tour after a short delay to ensure page is fully loaded
      setTimeout(() => {
        startTour(onboardingTourSteps)
      }, 1000)
    }
  }, [startTour])

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Admin Dashboard</h1>
          <p className="text-muted-foreground">Overview of your outdoor advertising operations</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Filter className="mr-2 h-4 w-4" />
            Filter
          </Button>
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Quick Add
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
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

      {/* Main Content Tabs */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="sites">Sites</TabsTrigger>
          <TabsTrigger value="bookings">Bookings</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            {/* Recent Activities */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Activities</CardTitle>
                <CardDescription>Latest updates from your advertising operations</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {recentActivities.map((activity) => (
                  <div key={activity.id} className="flex items-start space-x-3">
                    <div className="flex-shrink-0">
                      {activity.status === "success" && <CheckCircle className="h-5 w-5 text-green-500" />}
                      {activity.status === "warning" && <AlertTriangle className="h-5 w-5 text-yellow-500" />}
                      {activity.status === "info" && <Activity className="h-5 w-5 text-blue-500" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900">{activity.title}</p>
                      <p className="text-sm text-gray-500">{activity.description}</p>
                      <p className="text-xs text-gray-400 mt-1">{activity.time}</p>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Upcoming Events */}
            <Card>
              <CardHeader>
                <CardTitle>Upcoming Events</CardTitle>
                <CardDescription>Your scheduled activities and appointments</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {upcomingEvents.map((event) => (
                  <div key={event.id} className="flex items-start space-x-3">
                    <div className="flex-shrink-0">
                      <Calendar className="h-5 w-5 text-blue-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900">{event.title}</p>
                      <div className="flex items-center text-sm text-gray-500">
                        <MapPin className="h-3 w-3 mr-1" />
                        {event.location}
                      </div>
                      <div className="flex items-center text-xs text-gray-400 mt-1">
                        <Clock className="h-3 w-3 mr-1" />
                        {event.date} at {event.time}
                      </div>
                    </div>
                    <Badge variant="outline" className="text-xs">
                      {event.type}
                    </Badge>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="sites" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Site Management</CardTitle>
              <CardDescription>Quick overview of your advertising sites</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center space-x-2 mb-4">
                <div className="relative flex-1">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input placeholder="Search sites..." className="pl-8" />
                </div>
                <Button variant="outline">
                  <Filter className="h-4 w-4" />
                </Button>
              </div>
              <div className="text-sm text-muted-foreground">Site management features will be displayed here</div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="bookings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Booking Overview</CardTitle>
              <CardDescription>Current and upcoming bookings</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-sm text-muted-foreground">Booking management features will be displayed here</div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Performance Analytics</CardTitle>
              <CardDescription>Insights and metrics for your advertising operations</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-sm text-muted-foreground">Analytics dashboard will be displayed here</div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

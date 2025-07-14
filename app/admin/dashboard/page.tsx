"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import {
  Users,
  TrendingUp,
  DollarSign,
  Package,
  Settings,
  BarChart3,
  Truck,
  Palette,
  Database,
  Zap,
  Plus,
  ChevronRight,
  Activity,
} from "lucide-react"
import { cn } from "@/lib/utils"

interface Department {
  id: string
  name: string
  description: string
  icon: React.ComponentType<{ className?: string }>
  color: string
  bgColor: string
  route: string
  stats: {
    total: number
    active: number
    pending: number
  }
  isAvailable?: boolean
}

interface Widget {
  id: string
  title: string
  value: string | number
  change: string
  icon: React.ComponentType<{ className?: string }>
  color: string
}

export default function AdminDashboard() {
  const { user, userData } = useAuth()
  const router = useRouter()
  const [departments, setDepartments] = useState<Department[]>([])
  const [widgets, setWidgets] = useState<Widget[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Mock data for departments
    const mockDepartments: Department[] = [
      {
        id: "sales",
        name: "Sales",
        description: "Manage sales operations, leads, and revenue",
        icon: DollarSign,
        color: "text-green-600",
        bgColor: "bg-green-50",
        route: "/sales",
        stats: { total: 150, active: 120, pending: 30 },
        isAvailable: true,
      },
      {
        id: "logistics",
        name: "Logistics",
        description: "Handle inventory, shipping, and supply chain",
        icon: Truck,
        color: "text-blue-600",
        bgColor: "bg-blue-50",
        route: "/logistics",
        stats: { total: 85, active: 70, pending: 15 },
        isAvailable: true,
      },
      {
        id: "creatives",
        name: "Creatives/Contents",
        description: "Create and manage marketing content",
        icon: Palette,
        color: "text-purple-600",
        bgColor: "bg-purple-50",
        route: "/cms",
        stats: { total: 45, active: 40, pending: 5 },
        isAvailable: true,
      },
      {
        id: "hr",
        name: "Human Resources",
        description: "Employee management and recruitment",
        icon: Users,
        color: "text-orange-600",
        bgColor: "bg-orange-50",
        route: "/hr",
        stats: { total: 25, active: 20, pending: 5 },
        isAvailable: false,
      },
      {
        id: "finance",
        name: "Finance",
        description: "Financial planning and accounting",
        icon: BarChart3,
        color: "text-indigo-600",
        bgColor: "bg-indigo-50",
        route: "/finance",
        stats: { total: 35, active: 30, pending: 5 },
        isAvailable: false,
      },
      {
        id: "operations",
        name: "Operations",
        description: "Daily operations and process management",
        icon: Settings,
        color: "text-gray-600",
        bgColor: "bg-gray-50",
        route: "/operations",
        stats: { total: 60, active: 50, pending: 10 },
        isAvailable: false,
      },
      {
        id: "it",
        name: "IT Support",
        description: "Technical support and infrastructure",
        icon: Database,
        color: "text-cyan-600",
        bgColor: "bg-cyan-50",
        route: "/it",
        stats: { total: 20, active: 18, pending: 2 },
        isAvailable: false,
      },
      {
        id: "marketing",
        name: "Marketing",
        description: "Brand promotion and customer acquisition",
        icon: Zap,
        color: "text-pink-600",
        bgColor: "bg-pink-50",
        route: "/marketing",
        stats: { total: 40, active: 35, pending: 5 },
        isAvailable: false,
      },
    ]

    // Mock data for widgets
    const mockWidgets: Widget[] = [
      {
        id: "total-users",
        title: "Total Users",
        value: 1234,
        change: "+12%",
        icon: Users,
        color: "text-blue-600",
      },
      {
        id: "revenue",
        title: "Monthly Revenue",
        value: "$45,678",
        change: "+8%",
        icon: DollarSign,
        color: "text-green-600",
      },
      {
        id: "orders",
        title: "Active Orders",
        value: 89,
        change: "+23%",
        icon: Package,
        color: "text-purple-600",
      },
      {
        id: "growth",
        title: "Growth Rate",
        value: "15.3%",
        change: "+2.1%",
        icon: TrendingUp,
        color: "text-orange-600",
      },
    ]

    setDepartments(mockDepartments)
    setWidgets(mockWidgets)
    setLoading(false)
  }, [])

  const handleDepartmentClick = (department: Department) => {
    if (department.isAvailable) {
      router.push(department.route)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="text-gray-600 mt-1">
            Welcome back, {userData?.first_name || "Admin"}! Here's what's happening across your organization.
          </p>
        </div>
        <Button className="bg-blue-600 hover:bg-blue-700">
          <Settings className="mr-2 h-4 w-4" />
          Settings
        </Button>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {widgets.map((widget) => (
          <Card key={widget.id} className="hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">{widget.title}</p>
                  <p className="text-2xl font-bold text-gray-900">{widget.value}</p>
                  <p className={cn("text-sm", widget.color)}>{widget.change} from last month</p>
                </div>
                <widget.icon className={cn("h-8 w-8", widget.color)} />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Departments Grid */}
      <div>
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Departments</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {departments.map((department) => (
            <Card
              key={department.id}
              className={cn(
                "hover:shadow-lg transition-all duration-200 border-2",
                department.isAvailable
                  ? "cursor-pointer hover:border-blue-200"
                  : "cursor-not-allowed opacity-60 grayscale",
              )}
              onClick={() => handleDepartmentClick(department)}
            >
              <CardHeader className={cn("pb-3", department.isAvailable ? department.bgColor : "bg-gray-100")}>
                <div className="flex items-center justify-between">
                  <department.icon
                    className={cn("h-8 w-8", department.isAvailable ? department.color : "text-gray-400")}
                  />
                  {department.isAvailable && <ChevronRight className="h-5 w-5 text-gray-400" />}
                </div>
                <CardTitle className={cn("text-lg", department.isAvailable ? "text-gray-900" : "text-gray-500")}>
                  {department.name}
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-3">
                <p className={cn("text-sm mb-4", department.isAvailable ? "text-gray-600" : "text-gray-400")}>
                  {department.description}
                </p>

                {/* Stats */}
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className={cn("text-sm", department.isAvailable ? "text-gray-600" : "text-gray-400")}>
                      Active
                    </span>
                    <Badge
                      variant="secondary"
                      className={cn(
                        department.isAvailable ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-500",
                      )}
                    >
                      {department.stats.active}
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className={cn("text-sm", department.isAvailable ? "text-gray-600" : "text-gray-400")}>
                      Pending
                    </span>
                    <Badge
                      variant="secondary"
                      className={cn(
                        department.isAvailable ? "bg-yellow-100 text-yellow-800" : "bg-gray-100 text-gray-500",
                      )}
                    >
                      {department.stats.pending}
                    </Badge>
                  </div>
                  <Progress value={(department.stats.active / department.stats.total) * 100} className="h-2" />
                </div>

                {/* Action Button */}
                <div className="mt-4 pt-3 border-t">
                  <Button
                    variant="ghost"
                    size="sm"
                    className={cn(
                      "w-full",
                      department.isAvailable
                        ? "text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                        : "text-gray-400 cursor-not-allowed",
                    )}
                    disabled={!department.isAvailable}
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Add Widget
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Activity className="mr-2 h-5 w-5" />
            Recent Activity
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[
              { action: "New user registered", time: "2 minutes ago", type: "user" },
              { action: "Sales report generated", time: "15 minutes ago", type: "report" },
              { action: "Inventory updated", time: "1 hour ago", type: "inventory" },
              { action: "New order received", time: "2 hours ago", type: "order" },
            ].map((activity, index) => (
              <div key={index} className="flex items-center justify-between py-2 border-b last:border-b-0">
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <span className="text-sm text-gray-900">{activity.action}</span>
                </div>
                <span className="text-xs text-gray-500">{activity.time}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

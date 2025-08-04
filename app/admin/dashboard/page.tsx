"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import Link from "next/link"
import {
  Users,
  FileText,
  Package,
  BarChart3,
  TrendingUp,
  AlertTriangle,
  Monitor,
  Shield,
  Settings,
  Database,
  Activity,
} from "lucide-react"

export default function AdminDashboard() {
  const systemStats = [
    { title: "Total Users", value: "1,234", change: "+12%", icon: Users, color: "text-blue-600" },
    { title: "Active Projects", value: "89", change: "+5%", icon: FileText, color: "text-green-600" },
    { title: "Inventory Items", value: "2,456", change: "-2%", icon: Package, color: "text-purple-600" },
    { title: "System Health", value: "98.5%", change: "+0.5%", icon: Activity, color: "text-orange-600" },
  ]

  const recentActivities = [
    { action: "New user registered", user: "John Doe", time: "2 minutes ago", type: "user" },
    { action: "System backup completed", user: "System", time: "1 hour ago", type: "system" },
    { action: "Inventory updated", user: "Jane Smith", time: "3 hours ago", type: "inventory" },
    { action: "Security scan completed", user: "Security Bot", time: "6 hours ago", type: "security" },
  ]

  const departmentLinks = [
    {
      title: "Sales Department",
      description: "Manage sales operations and customer relations",
      href: "/sales/dashboard",
      icon: BarChart3,
      color: "bg-blue-50 text-blue-600 border-blue-200",
    },
    {
      title: "Logistics Department",
      description: "Oversee logistics and service assignments",
      href: "/logistics/dashboard",
      icon: Package,
      color: "bg-green-50 text-green-600 border-green-200",
    },
    {
      title: "CMS Department",
      description: "Content management and digital displays",
      href: "/cms/dashboard",
      icon: Monitor,
      color: "bg-purple-50 text-purple-600 border-purple-200",
    },
    {
      title: "IT Department",
      description: "IT infrastructure and system management",
      href: "/it",
      icon: Settings,
      color: "bg-orange-50 text-orange-600 border-orange-200",
    },
    {
      title: "Business Operations",
      description: "Business analytics and financial oversight",
      href: "/business/dashboard",
      icon: TrendingUp,
      color: "bg-indigo-50 text-indigo-600 border-indigo-200",
    },
  ]

  const systemAlerts = [
    { message: "Server maintenance scheduled for tonight", type: "info", time: "1 hour ago" },
    { message: "High CPU usage detected on web server", type: "warning", time: "3 hours ago" },
    { message: "Backup completed successfully", type: "success", time: "6 hours ago" },
  ]

  const getActivityIcon = (type: string) => {
    switch (type) {
      case "user":
        return <Users className="h-4 w-4" />
      case "system":
        return <Settings className="h-4 w-4" />
      case "inventory":
        return <Package className="h-4 w-4" />
      case "security":
        return <Shield className="h-4 w-4" />
      default:
        return <Activity className="h-4 w-4" />
    }
  }

  const getAlertColor = (type: string) => {
    switch (type) {
      case "success":
        return "text-green-600 bg-green-50 border-green-200"
      case "warning":
        return "text-yellow-600 bg-yellow-50 border-yellow-200"
      case "error":
        return "text-red-600 bg-red-50 border-red-200"
      default:
        return "text-blue-600 bg-blue-50 border-blue-200"
    }
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="text-gray-600 mt-1">System overview and management center</p>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline" size="sm">
            <Database className="h-4 w-4 mr-2" />
            System Status
          </Button>
          <Button size="sm">
            <Settings className="h-4 w-4 mr-2" />
            Settings
          </Button>
        </div>
      </div>

      {/* System Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {systemStats.map((stat) => {
          const Icon = stat.icon
          return (
            <Card key={stat.title}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
                <Icon className={`h-4 w-4 ${stat.color}`} />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
                <p className="text-xs text-muted-foreground">
                  <span className={stat.change.startsWith("+") ? "text-green-600" : "text-red-600"}>{stat.change}</span>{" "}
                  from last month
                </p>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Department Links */}
      <Card>
        <CardHeader>
          <CardTitle>Department Access</CardTitle>
          <CardDescription>Quick access to different department dashboards</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {departmentLinks.map((dept) => {
              const Icon = dept.icon
              return (
                <Link key={dept.title} href={dept.href}>
                  <Card className={`cursor-pointer transition-all hover:shadow-md border-2 ${dept.color}`}>
                    <CardHeader className="pb-3">
                      <div className="flex items-center space-x-3">
                        <Icon className="h-6 w-6" />
                        <CardTitle className="text-lg">{dept.title}</CardTitle>
                      </div>
                      <CardDescription className="text-sm">{dept.description}</CardDescription>
                    </CardHeader>
                  </Card>
                </Link>
              )
            })}
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Activities */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Activity className="h-5 w-5 mr-2" />
              Recent Activities
            </CardTitle>
            <CardDescription>Latest system activities and user actions</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentActivities.map((activity, index) => (
                <div key={index} className="flex items-center space-x-3 p-3 border rounded-lg">
                  <div className="flex-shrink-0">{getActivityIcon(activity.type)}</div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">{activity.action}</p>
                    <p className="text-xs text-gray-500">by {activity.user}</p>
                  </div>
                  <div className="text-xs text-gray-400">{activity.time}</div>
                </div>
              ))}
            </div>
            <Button variant="outline" className="w-full mt-4 bg-transparent">
              View All Activities
            </Button>
          </CardContent>
        </Card>

        {/* System Alerts */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <AlertTriangle className="h-5 w-5 mr-2" />
              System Alerts
            </CardTitle>
            <CardDescription>Important system notifications and alerts</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {systemAlerts.map((alert, index) => (
                <div key={index} className={`p-3 border rounded-lg ${getAlertColor(alert.type)}`}>
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium">{alert.message}</p>
                    <span className="text-xs">{alert.time}</span>
                  </div>
                </div>
              ))}
            </div>
            <Button variant="outline" className="w-full mt-4 bg-transparent">
              View All Alerts
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* System Performance */}
      <Card>
        <CardHeader>
          <CardTitle>System Performance</CardTitle>
          <CardDescription>Real-time system resource usage and performance metrics</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Server Load</span>
                <span>45%</span>
              </div>
              <Progress value={45} className="h-2" />
              <p className="text-xs text-gray-500">Normal load</p>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Memory Usage</span>
                <span>68%</span>
              </div>
              <Progress value={68} className="h-2" />
              <p className="text-xs text-gray-500">Moderate usage</p>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Storage Usage</span>
                <span>82%</span>
              </div>
              <Progress value={82} className="h-2" />
              <p className="text-xs text-yellow-600">High usage - consider cleanup</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

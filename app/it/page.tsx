"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import {
  Monitor,
  Server,
  Wifi,
  Shield,
  HardDrive,
  AlertTriangle,
  CheckCircle,
  Clock,
  Users,
  Settings,
  Database,
  Activity,
} from "lucide-react"
import { RouteProtection } from "@/components/route-protection"

export default function ITDashboard() {
  // Mock data for IT dashboard
  const systemStatus = [
    { name: "Web Server", status: "online", uptime: "99.9%", icon: Server },
    { name: "Database", status: "online", uptime: "99.8%", icon: Database },
    { name: "Network", status: "warning", uptime: "98.5%", icon: Wifi },
    { name: "Security", status: "online", uptime: "100%", icon: Shield },
  ]

  const supportTickets = [
    { id: "IT-001", title: "Email server down", priority: "high", status: "open", assignee: "John Doe" },
    { id: "IT-002", title: "Printer not working", priority: "medium", status: "in-progress", assignee: "Jane Smith" },
    {
      id: "IT-003",
      title: "Software installation request",
      priority: "low",
      status: "pending",
      assignee: "Mike Johnson",
    },
    {
      id: "IT-004",
      title: "Network connectivity issue",
      priority: "high",
      status: "resolved",
      assignee: "Sarah Wilson",
    },
  ]

  const maintenanceTasks = [
    { task: "Server backup verification", scheduled: "Today 2:00 PM", status: "pending" },
    { task: "Security patch deployment", scheduled: "Tomorrow 10:00 AM", status: "scheduled" },
    { task: "Network equipment upgrade", scheduled: "Friday 6:00 PM", status: "scheduled" },
  ]

  const getStatusColor = (status: string) => {
    switch (status) {
      case "online":
        return "text-green-600"
      case "warning":
        return "text-yellow-600"
      case "offline":
        return "text-red-600"
      default:
        return "text-gray-600"
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "online":
        return <CheckCircle className="h-4 w-4 text-green-600" />
      case "warning":
        return <AlertTriangle className="h-4 w-4 text-yellow-600" />
      case "offline":
        return <AlertTriangle className="h-4 w-4 text-red-600" />
      default:
        return <Clock className="h-4 w-4 text-gray-600" />
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "destructive"
      case "medium":
        return "default"
      case "low":
        return "secondary"
      default:
        return "outline"
    }
  }

  return (
    <RouteProtection requiredRoles="it">
      <div className="flex-1 p-4 md:p-6">
        <div className="flex flex-col gap-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <h1 className="text-xl md:text-2xl font-bold">IT Dashboard</h1>
            <div className="flex gap-2">
              <Button variant="outline" size="sm">
                <Settings className="h-4 w-4 mr-2" />
                System Settings
              </Button>
              <Button size="sm">
                <AlertTriangle className="h-4 w-4 mr-2" />
                Create Ticket
              </Button>
            </div>
          </div>

          {/* System Status Overview */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {systemStatus.map((system) => {
              const Icon = system.icon
              return (
                <Card key={system.name}>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">{system.name}</CardTitle>
                    <Icon className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center space-x-2">
                      {getStatusIcon(system.status)}
                      <span className={`text-sm font-medium ${getStatusColor(system.status)}`}>
                        {system.status.charAt(0).toUpperCase() + system.status.slice(1)}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">Uptime: {system.uptime}</p>
                  </CardContent>
                </Card>
              )
            })}
          </div>

          {/* Main Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Support Tickets */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5" />
                  Recent Support Tickets
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {supportTickets.map((ticket) => (
                    <div key={ticket.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium text-sm">{ticket.id}</span>
                          <Badge variant={getPriorityColor(ticket.priority)} className="text-xs">
                            {ticket.priority}
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-600">{ticket.title}</p>
                        <p className="text-xs text-muted-foreground">Assigned to: {ticket.assignee}</p>
                      </div>
                      <Badge variant="outline" className="text-xs">
                        {ticket.status}
                      </Badge>
                    </div>
                  ))}
                </div>
                <Button variant="outline" className="w-full mt-4 bg-transparent">
                  View All Tickets
                </Button>
              </CardContent>
            </Card>

            {/* Maintenance Schedule */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Scheduled Maintenance
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {maintenanceTasks.map((task, index) => (
                    <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex-1">
                        <p className="font-medium text-sm">{task.task}</p>
                        <p className="text-xs text-muted-foreground">{task.scheduled}</p>
                      </div>
                      <Badge variant={task.status === "pending" ? "default" : "secondary"} className="text-xs">
                        {task.status}
                      </Badge>
                    </div>
                  ))}
                </div>
                <Button variant="outline" className="w-full mt-4 bg-transparent">
                  Schedule Maintenance
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Button variant="outline" className="h-20 flex flex-col gap-2 bg-transparent">
                  <Monitor className="h-6 w-6" />
                  <span className="text-xs">System Monitor</span>
                </Button>
                <Button variant="outline" className="h-20 flex flex-col gap-2 bg-transparent">
                  <Users className="h-6 w-6" />
                  <span className="text-xs">User Management</span>
                </Button>
                <Button variant="outline" className="h-20 flex flex-col gap-2 bg-transparent">
                  <HardDrive className="h-6 w-6" />
                  <span className="text-xs">Backup Status</span>
                </Button>
                <Button variant="outline" className="h-20 flex flex-col gap-2 bg-transparent">
                  <Activity className="h-6 w-6" />
                  <span className="text-xs">Performance</span>
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Resource Usage */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">CPU Usage</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Current</span>
                    <span>45%</span>
                  </div>
                  <Progress value={45} className="h-2" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Memory Usage</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Current</span>
                    <span>68%</span>
                  </div>
                  <Progress value={68} className="h-2" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Storage Usage</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Current</span>
                    <span>82%</span>
                  </div>
                  <Progress value={82} className="h-2" />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </RouteProtection>
  )
}

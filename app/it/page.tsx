"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import {
  Monitor,
  Server,
  Shield,
  HardDrive,
  Wifi,
  AlertTriangle,
  CheckCircle,
  Clock,
  Users,
  Settings,
  RefreshCw,
  Plus,
} from "lucide-react"

export default function ITDashboard() {
  const systemStatus = [
    { name: "Web Server", status: "online", uptime: "99.9%", icon: Server },
    { name: "Database", status: "online", uptime: "99.8%", icon: HardDrive },
    { name: "Network", status: "warning", uptime: "98.5%", icon: Wifi },
    { name: "Security", status: "online", uptime: "100%", icon: Shield },
  ]

  const supportTickets = [
    { id: "IT-001", title: "Email server not responding", priority: "high", status: "open", assignee: "John Doe" },
    {
      id: "IT-002",
      title: "Printer connectivity issues",
      priority: "medium",
      status: "in-progress",
      assignee: "Jane Smith",
    },
    { id: "IT-003", title: "Software license renewal", priority: "low", status: "pending", assignee: "Mike Johnson" },
    {
      id: "IT-004",
      title: "Network speed optimization",
      priority: "medium",
      status: "resolved",
      assignee: "Sarah Wilson",
    },
  ]

  const maintenanceTasks = [
    { task: "Server backup verification", scheduled: "Today 2:00 PM", status: "pending" },
    { task: "Security patch deployment", scheduled: "Tomorrow 1:00 AM", status: "scheduled" },
    { task: "Network equipment inspection", scheduled: "Friday 10:00 AM", status: "scheduled" },
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
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">IT Dashboard</h1>
          <p className="text-gray-600 mt-1">Monitor and manage IT infrastructure</p>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button size="sm">
            <Plus className="h-4 w-4 mr-2" />
            New Ticket
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Support Tickets */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <AlertTriangle className="h-5 w-5 mr-2" />
              Recent Support Tickets
            </CardTitle>
            <CardDescription>Latest IT support requests and their status</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {supportTickets.map((ticket) => (
                <div key={ticket.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2">
                      <span className="font-medium text-sm">{ticket.id}</span>
                      <Badge variant={getPriorityColor(ticket.priority)} className="text-xs">
                        {ticket.priority}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-600 mt-1">{ticket.title}</p>
                    <p className="text-xs text-gray-500">Assigned to: {ticket.assignee}</p>
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
            <CardTitle className="flex items-center">
              <Clock className="h-5 w-5 mr-2" />
              Scheduled Maintenance
            </CardTitle>
            <CardDescription>Upcoming maintenance tasks and system updates</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {maintenanceTasks.map((task, index) => (
                <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex-1">
                    <p className="font-medium text-sm">{task.task}</p>
                    <p className="text-xs text-gray-500 mt-1">{task.scheduled}</p>
                  </div>
                  <Badge variant={task.status === "pending" ? "default" : "secondary"} className="text-xs">
                    {task.status}
                  </Badge>
                </div>
              ))}
            </div>
            <Button variant="outline" className="w-full mt-4 bg-transparent">
              View Schedule
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>Common IT management tasks and tools</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Button variant="outline" className="h-20 flex flex-col bg-transparent">
              <Monitor className="h-6 w-6 mb-2" />
              <span className="text-sm">System Monitor</span>
            </Button>
            <Button variant="outline" className="h-20 flex flex-col bg-transparent">
              <Users className="h-6 w-6 mb-2" />
              <span className="text-sm">User Management</span>
            </Button>
            <Button variant="outline" className="h-20 flex flex-col bg-transparent">
              <Shield className="h-6 w-6 mb-2" />
              <span className="text-sm">Security Center</span>
            </Button>
            <Button variant="outline" className="h-20 flex flex-col bg-transparent">
              <Settings className="h-6 w-6 mb-2" />
              <span className="text-sm">System Config</span>
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
  )
}

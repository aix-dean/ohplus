"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Server,
  Shield,
  Database,
  Wifi,
  HardDrive,
  Monitor,
  Smartphone,
  AlertTriangle,
  CheckCircle,
  Clock,
} from "lucide-react"

export default function ITPage() {
  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">IT Department</h2>
      </div>

      {/* System Status Overview */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Server Status</CardTitle>
            <Server className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <span className="text-2xl font-bold">Online</span>
            </div>
            <p className="text-xs text-muted-foreground">All systems operational</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Network</CardTitle>
            <Wifi className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <span className="text-2xl font-bold">Stable</span>
            </div>
            <p className="text-xs text-muted-foreground">99.9% uptime</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Security</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-2">
              <AlertTriangle className="h-4 w-4 text-yellow-500" />
              <span className="text-2xl font-bold">Alert</span>
            </div>
            <p className="text-xs text-muted-foreground">2 pending updates</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Storage</CardTitle>
            <HardDrive className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <span className="text-2xl font-bold">78%</span>
            </div>
            <p className="text-xs text-muted-foreground">Used capacity</p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Tickets */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Recent Support Tickets</CardTitle>
            <CardDescription>Latest IT support requests</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center space-x-4">
              <Monitor className="h-8 w-8 text-blue-500" />
              <div className="flex-1 space-y-1">
                <p className="text-sm font-medium">Display not working - Sales Dept</p>
                <p className="text-xs text-muted-foreground">Reported 2 hours ago</p>
              </div>
              <Badge variant="destructive">High</Badge>
            </div>
            <div className="flex items-center space-x-4">
              <Wifi className="h-8 w-8 text-green-500" />
              <div className="flex-1 space-y-1">
                <p className="text-sm font-medium">WiFi connectivity issues</p>
                <p className="text-xs text-muted-foreground">Reported 4 hours ago</p>
              </div>
              <Badge variant="secondary">Medium</Badge>
            </div>
            <div className="flex items-center space-x-4">
              <Smartphone className="h-8 w-8 text-yellow-500" />
              <div className="flex-1 space-y-1">
                <p className="text-sm font-medium">Mobile app login issues</p>
                <p className="text-xs text-muted-foreground">Reported 6 hours ago</p>
              </div>
              <Badge variant="outline">Low</Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>System Maintenance</CardTitle>
            <CardDescription>Scheduled maintenance tasks</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center space-x-4">
              <Clock className="h-8 w-8 text-blue-500" />
              <div className="flex-1 space-y-1">
                <p className="text-sm font-medium">Database backup</p>
                <p className="text-xs text-muted-foreground">Scheduled for tonight 2:00 AM</p>
              </div>
              <Badge>Scheduled</Badge>
            </div>
            <div className="flex items-center space-x-4">
              <Server className="h-8 w-8 text-green-500" />
              <div className="flex-1 space-y-1">
                <p className="text-sm font-medium">Server updates</p>
                <p className="text-xs text-muted-foreground">This weekend</p>
              </div>
              <Badge variant="secondary">Planned</Badge>
            </div>
            <div className="flex items-center space-x-4">
              <Shield className="h-8 w-8 text-red-500" />
              <div className="flex-1 space-y-1">
                <p className="text-sm font-medium">Security patches</p>
                <p className="text-xs text-muted-foreground">Next week</p>
              </div>
              <Badge variant="destructive">Critical</Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>Common IT management tasks</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-2 md:grid-cols-2 lg:grid-cols-4">
            <Button variant="outline" className="justify-start bg-transparent">
              <Server className="mr-2 h-4 w-4" />
              Server Management
            </Button>
            <Button variant="outline" className="justify-start bg-transparent">
              <Database className="mr-2 h-4 w-4" />
              Database Admin
            </Button>
            <Button variant="outline" className="justify-start bg-transparent">
              <Shield className="mr-2 h-4 w-4" />
              Security Center
            </Button>
            <Button variant="outline" className="justify-start bg-transparent">
              <Monitor className="mr-2 h-4 w-4" />
              Device Management
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

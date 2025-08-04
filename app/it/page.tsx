"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import {
  Server,
  Shield,
  Database,
  Wifi,
  HardDrive,
  Monitor,
  AlertTriangle,
  CheckCircle,
  Clock,
  Users,
  Settings,
  Activity,
} from "lucide-react"

export default function ITDepartmentPage() {
  return (
    <div className="flex-1 space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">IT Department</h1>
          <p className="text-muted-foreground">System monitoring, infrastructure management, and technical support</p>
        </div>
        <div className="flex items-center space-x-2">
          <Badge variant="outline" className="text-green-600 border-green-600">
            <CheckCircle className="w-3 h-3 mr-1" />
            All Systems Operational
          </Badge>
        </div>
      </div>

      {/* System Status Overview */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Server Status</CardTitle>
            <Server className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">98.9%</div>
            <p className="text-xs text-muted-foreground">Uptime this month</p>
            <Progress value={98.9} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Security</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">Secure</div>
            <p className="text-xs text-muted-foreground">No threats detected</p>
            <div className="flex items-center mt-2">
              <CheckCircle className="w-3 h-3 text-green-600 mr-1" />
              <span className="text-xs">Last scan: 2 hours ago</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Storage</CardTitle>
            <HardDrive className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">67%</div>
            <p className="text-xs text-muted-foreground">Used of 10TB total</p>
            <Progress value={67} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Network</CardTitle>
            <Wifi className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">Stable</div>
            <p className="text-xs text-muted-foreground">Average latency: 12ms</p>
            <div className="flex items-center mt-2">
              <Activity className="w-3 h-3 text-green-600 mr-1" />
              <span className="text-xs">Bandwidth: 85% available</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Active Tickets */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <AlertTriangle className="w-5 h-5 mr-2" />
              Active Support Tickets
            </CardTitle>
            <CardDescription>Current IT support requests</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                <div>
                  <p className="font-medium">Email server slow response</p>
                  <p className="text-sm text-muted-foreground">Sales Department - High Priority</p>
                </div>
              </div>
              <Badge variant="destructive">High</Badge>
            </div>

            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                <div>
                  <p className="font-medium">Printer connectivity issues</p>
                  <p className="text-sm text-muted-foreground">Logistics - Medium Priority</p>
                </div>
              </div>
              <Badge variant="secondary">Medium</Badge>
            </div>

            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <div>
                  <p className="font-medium">Software license renewal</p>
                  <p className="text-sm text-muted-foreground">Admin - Low Priority</p>
                </div>
              </div>
              <Badge variant="outline">Low</Badge>
            </div>

            <Button className="w-full bg-transparent" variant="outline">
              View All Tickets
            </Button>
          </CardContent>
        </Card>

        {/* System Maintenance */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Settings className="w-5 h-5 mr-2" />
              Scheduled Maintenance
            </CardTitle>
            <CardDescription>Upcoming system maintenance windows</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex items-center space-x-3">
                <Clock className="w-4 h-4 text-blue-500" />
                <div>
                  <p className="font-medium">Database backup optimization</p>
                  <p className="text-sm text-muted-foreground">Tonight, 2:00 AM - 4:00 AM</p>
                </div>
              </div>
              <Badge variant="outline">Scheduled</Badge>
            </div>

            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex items-center space-x-3">
                <Clock className="w-4 h-4 text-orange-500" />
                <div>
                  <p className="font-medium">Security patches deployment</p>
                  <p className="text-sm text-muted-foreground">This weekend, Sunday 6:00 AM</p>
                </div>
              </div>
              <Badge variant="secondary">Upcoming</Badge>
            </div>

            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex items-center space-x-3">
                <Clock className="w-4 h-4 text-green-500" />
                <div>
                  <p className="font-medium">Network infrastructure upgrade</p>
                  <p className="text-sm text-muted-foreground">Next month, planned downtime</p>
                </div>
              </div>
              <Badge variant="outline">Planned</Badge>
            </div>

            <Button className="w-full bg-transparent" variant="outline">
              Schedule Maintenance
            </Button>
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
          <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-6">
            <Button variant="outline" className="flex flex-col items-center p-4 h-auto bg-transparent">
              <Users className="w-6 h-6 mb-2" />
              <span className="text-sm">User Management</span>
            </Button>

            <Button variant="outline" className="flex flex-col items-center p-4 h-auto bg-transparent">
              <Database className="w-6 h-6 mb-2" />
              <span className="text-sm">Database Admin</span>
            </Button>

            <Button variant="outline" className="flex flex-col items-center p-4 h-auto bg-transparent">
              <Monitor className="w-6 h-6 mb-2" />
              <span className="text-sm">System Monitor</span>
            </Button>

            <Button variant="outline" className="flex flex-col items-center p-4 h-auto bg-transparent">
              <Shield className="w-6 h-6 mb-2" />
              <span className="text-sm">Security Center</span>
            </Button>

            <Button variant="outline" className="flex flex-col items-center p-4 h-auto bg-transparent">
              <HardDrive className="w-6 h-6 mb-2" />
              <span className="text-sm">Backup Manager</span>
            </Button>

            <Button variant="outline" className="flex flex-col items-center p-4 h-auto bg-transparent">
              <Settings className="w-6 h-6 mb-2" />
              <span className="text-sm">System Config</span>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
          <CardDescription>Latest system events and changes</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center space-x-3 text-sm">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span className="text-muted-foreground">2 hours ago</span>
              <span>Security scan completed successfully</span>
            </div>

            <div className="flex items-center space-x-3 text-sm">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              <span className="text-muted-foreground">4 hours ago</span>
              <span>Database backup completed</span>
            </div>

            <div className="flex items-center space-x-3 text-sm">
              <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
              <span className="text-muted-foreground">6 hours ago</span>
              <span>New user account created for John Doe</span>
            </div>

            <div className="flex items-center space-x-3 text-sm">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span className="text-muted-foreground">8 hours ago</span>
              <span>System update applied to web servers</span>
            </div>

            <div className="flex items-center space-x-3 text-sm">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              <span className="text-muted-foreground">Yesterday</span>
              <span>Network performance optimization completed</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

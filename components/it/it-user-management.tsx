"use client"

import { useState, useEffect } from "react"
import { UserManagement } from "@/components/access-management/user-management"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Users, Shield, Settings, Activity, AlertTriangle, CheckCircle, Clock } from 'lucide-react'

export function ITUserManagement() {
  const [activeTab, setActiveTab] = useState("users")

  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="users" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Users
          </TabsTrigger>
          <TabsTrigger value="roles" className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            Roles
          </TabsTrigger>
          <TabsTrigger value="permissions" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Permissions
          </TabsTrigger>
          <TabsTrigger value="activity" className="flex items-center gap-2">
            <Activity className="h-4 w-4" />
            Activity
          </TabsTrigger>
        </TabsList>

        <TabsContent value="users" className="space-y-4">
          <UserManagement />
        </TabsContent>

        <TabsContent value="roles" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>IT System Roles</CardTitle>
              <CardDescription>
                Manage roles and their associated permissions for IT systems
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[
                  { name: "IT Administrator", users: 3, permissions: 25, status: "active" },
                  { name: "Network Admin", users: 2, permissions: 15, status: "active" },
                  { name: "Security Officer", users: 1, permissions: 12, status: "active" },
                  { name: "Help Desk", users: 5, permissions: 8, status: "active" },
                  { name: "System Operator", users: 4, permissions: 10, status: "active" },
                ].map((role, index) => (
                  <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-4">
                      <Shield className="h-8 w-8 text-blue-500" />
                      <div>
                        <h3 className="font-medium">{role.name}</h3>
                        <p className="text-sm text-muted-foreground">
                          {role.users} users • {role.permissions} permissions
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge variant="outline" className="text-green-600">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        {role.status}
                      </Badge>
                      <Button variant="outline" size="sm">
                        Edit
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="permissions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>System Permissions</CardTitle>
              <CardDescription>
                Configure granular permissions for IT system access
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                {[
                  { category: "Server Management", permissions: ["View Servers", "Restart Services", "Update Systems", "Access Logs"] },
                  { category: "Network Administration", permissions: ["Configure Network", "Monitor Traffic", "Manage Firewall", "VPN Access"] },
                  { category: "Security Operations", permissions: ["Security Monitoring", "Incident Response", "Access Control", "Audit Logs"] },
                  { category: "User Support", permissions: ["Create Tickets", "Assign Tasks", "View Reports", "User Communication"] },
                ].map((group, index) => (
                  <Card key={index}>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base">{group.category}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {group.permissions.map((permission, permIndex) => (
                          <div key={permIndex} className="flex items-center justify-between">
                            <span className="text-sm">{permission}</span>
                            <Badge variant="secondary" className="text-xs">
                              Active
                            </Badge>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="activity" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>
                Monitor user management activities and system access
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[
                  { action: "User role updated", user: "john.doe@company.com", time: "2 minutes ago", type: "update" },
                  { action: "New user created", user: "jane.smith@company.com", time: "15 minutes ago", type: "create" },
                  { action: "Permission granted", user: "mike.wilson@company.com", time: "1 hour ago", type: "permission" },
                  { action: "User deactivated", user: "old.user@company.com", time: "2 hours ago", type: "deactivate" },
                  { action: "Role permissions modified", user: "System", time: "3 hours ago", type: "system" },
                ].map((activity, index) => (
                  <div key={index} className="flex items-center space-x-4 p-3 border rounded-lg">
                    <div className={`p-2 rounded-full ${
                      activity.type === 'create' ? 'bg-green-100 text-green-600' :
                      activity.type === 'update' ? 'bg-blue-100 text-blue-600' :
                      activity.type === 'permission' ? 'bg-purple-100 text-purple-600' :
                      activity.type === 'deactivate' ? 'bg-red-100 text-red-600' :
                      'bg-gray-100 text-gray-600'
                    }`}>
                      {activity.type === 'create' && <Users className="h-4 w-4" />}
                      {activity.type === 'update' && <Settings className="h-4 w-4" />}
                      {activity.type === 'permission' && <Shield className="h-4 w-4" />}
                      {activity.type === 'deactivate' && <AlertTriangle className="h-4 w-4" />}
                      {activity.type === 'system' && <Activity className="h-4 w-4" />}
                    </div>
                    <div className="flex-1">
                      <p className="font-medium">{activity.action}</p>
                      <p className="text-sm text-muted-foreground">{activity.user}</p>
                    </div>
                    <div className="flex items-center text-sm text-muted-foreground">
                      <Clock className="h-4 w-4 mr-1" />
                      {activity.time}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

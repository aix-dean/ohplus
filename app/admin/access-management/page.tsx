"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Shield, Users, Key, Info } from "lucide-react"
import { getAllRoles, type HardcodedRole } from "@/lib/hardcoded-access-service"
import { useRouter } from "next/navigation"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"

export default function AccessManagementPage() {
  const router = useRouter()
  const [roles] = useState<HardcodedRole[]>(getAllRoles())
  const [selectedRole, setSelectedRole] = useState<HardcodedRole | null>(null)
  const [isRoleDetailsOpen, setIsRoleDetailsOpen] = useState(false)

  const getRoleColorClass = (roleId: string) => {
    const colorClasses = {
      admin: "border-purple-200 bg-purple-50",
      sales: "border-green-200 bg-green-50",
      logistics: "border-blue-200 bg-blue-50",
      cms: "border-orange-200 bg-orange-50",
    }
    return colorClasses[roleId as keyof typeof colorClasses] || "border-gray-200 bg-gray-50"
  }

  const getRoleBadgeClass = (roleId: string) => {
    const badgeClasses = {
      admin: "bg-purple-100 text-purple-800 hover:bg-purple-100",
      sales: "bg-green-100 text-green-800 hover:bg-green-100",
      logistics: "bg-blue-100 text-blue-800 hover:bg-blue-100",
      cms: "bg-orange-100 text-orange-800 hover:bg-orange-100",
    }
    return badgeClasses[roleId as keyof typeof badgeClasses] || "bg-gray-100 text-gray-800 hover:bg-gray-100"
  }

  const handleViewRoleDetails = (role: HardcodedRole) => {
    setSelectedRole(role)
    setIsRoleDetailsOpen(true)
  }

  return (
    <div className="container mx-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Access Management</h1>
          <p className="text-muted-foreground">Manage roles and permissions for your organization.</p>
        </div>
        <Button
          variant="outline"
          className="gap-2 bg-transparent"
          onClick={() => router.push("/admin/user-management")}
        >
          <Users className="h-4 w-4" />
          Manage Users
        </Button>
      </div>

      <Tabs defaultValue="roles" className="space-y-6">
        <TabsList>
          <TabsTrigger value="roles" className="gap-2">
            <Shield className="h-4 w-4" />
            Roles
          </TabsTrigger>
          <TabsTrigger value="overview" className="gap-2">
            <Info className="h-4 w-4" />
            Overview
          </TabsTrigger>
        </TabsList>

        <TabsContent value="roles" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {roles.map((role) => (
              <Card key={role.id} className={`${getRoleColorClass(role.id)} border-2`}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{role.name}</CardTitle>
                    <Badge className={getRoleBadgeClass(role.id)}>{role.id.toUpperCase()}</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">{role.description}</p>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <div className="text-sm font-medium mb-2">Permissions</div>
                    <div className="text-2xl font-bold text-primary">{role.permissions.length}</div>
                    <div className="text-xs text-muted-foreground">modules accessible</div>
                  </div>

                  <div className="space-y-2">
                    <div className="text-sm font-medium">Key Modules:</div>
                    <div className="flex flex-wrap gap-1">
                      {role.permissions.slice(0, 3).map((permission, index) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          {permission.module}
                        </Badge>
                      ))}
                      {role.permissions.length > 3 && (
                        <Badge variant="outline" className="text-xs">
                          +{role.permissions.length - 3} more
                        </Badge>
                      )}
                    </div>
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full bg-transparent"
                    onClick={() => handleViewRoleDetails(role)}
                  >
                    View Details
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Roles</CardTitle>
                <Shield className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{roles.length}</div>
                <p className="text-xs text-muted-foreground">Hardcoded system roles</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Admin Role</CardTitle>
                <Key className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-purple-600">1</div>
                <p className="text-xs text-muted-foreground">Full system access</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Department Roles</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">3</div>
                <p className="text-xs text-muted-foreground">Sales, Logistics, CMS</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">System Type</CardTitle>
                <Info className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">Hardcoded</div>
                <p className="text-xs text-muted-foreground">No database dependency</p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Role Hierarchy</CardTitle>
              <p className="text-sm text-muted-foreground">Understanding the role structure in your organization</p>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center gap-4 p-4 border rounded-lg bg-purple-50 border-purple-200">
                  <Badge className="bg-purple-100 text-purple-800">ADMIN</Badge>
                  <div className="flex-1">
                    <div className="font-medium">Administrator</div>
                    <div className="text-sm text-muted-foreground">
                      Full system access • Can manage all users and settings
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="flex items-center gap-4 p-4 border rounded-lg bg-green-50 border-green-200">
                    <Badge className="bg-green-100 text-green-800">SALES</Badge>
                    <div className="flex-1">
                      <div className="font-medium">Sales Team</div>
                      <div className="text-sm text-muted-foreground">Client management • Proposals • Quotations</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 p-4 border rounded-lg bg-blue-50 border-blue-200">
                    <Badge className="bg-blue-100 text-blue-800">LOGISTICS</Badge>
                    <div className="flex-1">
                      <div className="font-medium">Logistics Team</div>
                      <div className="text-sm text-muted-foreground">Site management • Assignments • Reports</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 p-4 border rounded-lg bg-orange-50 border-orange-200">
                    <Badge className="bg-orange-100 text-orange-800">CMS</Badge>
                    <div className="flex-1">
                      <div className="font-medium">Content Team</div>
                      <div className="text-sm text-muted-foreground">Content creation • Media • Planning</div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Role Details Dialog */}
      <Dialog open={isRoleDetailsOpen} onOpenChange={setIsRoleDetailsOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {selectedRole?.name}
              {selectedRole && (
                <Badge className={getRoleBadgeClass(selectedRole.id)}>{selectedRole.id.toUpperCase()}</Badge>
              )}
            </DialogTitle>
            <DialogDescription>{selectedRole?.description}</DialogDescription>
          </DialogHeader>

          {selectedRole && (
            <div className="space-y-6 py-4">
              <div>
                <h3 className="text-lg font-medium mb-4">Permissions & Access</h3>
                <div className="space-y-4">
                  {selectedRole.permissions.map((permission, index) => (
                    <div key={index} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div className="font-medium capitalize">{permission.module}</div>
                        <div className="flex gap-1">
                          {permission.actions.map((action) => (
                            <Badge key={action} variant="outline" className="text-xs">
                              {action}
                            </Badge>
                          ))}
                        </div>
                      </div>
                      <div className="text-sm text-muted-foreground">{permission.description}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

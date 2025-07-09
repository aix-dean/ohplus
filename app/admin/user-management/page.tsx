"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Edit, UserPlus, Loader2 } from "lucide-react"
import { getUsers, getUserRoles, getRoles, type User, type Role } from "@/lib/access-management-service"
import AddUserInvitationDialog from "@/components/add-user-invitation-dialog"
import EditUserRoleDialog from "@/components/edit-user-role-dialog"
import { toast } from "sonner"

interface UserWithRole extends User {
  roleNames: string[]
}

export default function UserManagementPage() {
  const [users, setUsers] = useState<UserWithRole[]>([])
  const [roles, setRoles] = useState<Role[]>([])
  const [loading, setLoading] = useState(true)
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false)
  const [editRoleDialogOpen, setEditRoleDialogOpen] = useState(false)
  const [selectedUser, setSelectedUser] = useState<User | null>(null)

  const fetchData = async () => {
    setLoading(true)
    try {
      // Fetch users and roles
      const [usersData, rolesData] = await Promise.all([getUsers(), getRoles()])

      setRoles(rolesData)

      // Get role names for each user
      const usersWithRoles = await Promise.all(
        usersData.map(async (user) => {
          try {
            const userRoleIds = await getUserRoles(user.id)
            const roleNames = userRoleIds
              .map((roleId) => rolesData.find((role) => role.id === roleId)?.name)
              .filter(Boolean) as string[]

            return {
              ...user,
              roleNames: roleNames.length > 0 ? roleNames : ["No Role"],
            }
          } catch (error) {
            console.error(`Error fetching roles for user ${user.id}:`, error)
            return {
              ...user,
              roleNames: ["Error loading roles"],
            }
          }
        }),
      )

      setUsers(usersWithRoles)
    } catch (error) {
      console.error("Error fetching data:", error)
      toast.error("Failed to load users and roles")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const handleEditRole = (user: User) => {
    setSelectedUser(user)
    setEditRoleDialogOpen(true)
  }

  const handleRoleUpdateSuccess = () => {
    fetchData() // Refresh the data
    toast.success("User role updated successfully")
  }

  const formatDate = (date: any) => {
    if (!date) return "Never"

    try {
      // Handle Firestore timestamp
      if (date.toDate) {
        return date.toDate().toLocaleDateString()
      }
      // Handle regular Date object
      if (date instanceof Date) {
        return date.toLocaleDateString()
      }
      // Handle timestamp number
      if (typeof date === "number") {
        return new Date(date).toLocaleDateString()
      }
      return "Invalid Date"
    } catch (error) {
      return "Invalid Date"
    }
  }

  const getStatusBadge = (user: UserWithRole) => {
    if (user.active === false) {
      return <Badge variant="destructive">Inactive</Badge>
    }
    if (user.roleNames.includes("No Role")) {
      return <Badge variant="secondary">No Role</Badge>
    }
    return <Badge variant="default">Active</Badge>
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin" />
          <p className="text-gray-600">Loading users...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>User Management</CardTitle>
              <CardDescription>Manage user accounts, roles, and permissions</CardDescription>
            </div>
            <Button onClick={() => setInviteDialogOpen(true)}>
              <UserPlus className="mr-2 h-4 w-4" />
              Invite User
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Last Login</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8">
                      No users found
                    </TableCell>
                  </TableRow>
                ) : (
                  users.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell>
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                            {user.displayName?.[0] || user.email[0].toUpperCase()}
                          </div>
                          <div>
                            <div className="font-medium">{user.displayName || user.display_name || "No Name"}</div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {user.roleNames.map((roleName, index) => (
                            <Badge key={index} variant="outline">
                              {roleName}
                            </Badge>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell>{getStatusBadge(user)}</TableCell>
                      <TableCell>{formatDate(user.lastLogin)}</TableCell>
                      <TableCell>{formatDate(user.created)}</TableCell>
                      <TableCell>
                        <Button variant="ghost" size="sm" onClick={() => handleEditRole(user)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <AddUserInvitationDialog open={inviteDialogOpen} onOpenChange={setInviteDialogOpen} onSuccess={fetchData} />

      <EditUserRoleDialog
        open={editRoleDialogOpen}
        onOpenChange={setEditRoleDialogOpen}
        user={selectedUser}
        onSuccess={handleRoleUpdateSuccess}
      />
    </div>
  )
}

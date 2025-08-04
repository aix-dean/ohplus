"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { UserPlus, Settings, Mail, Shield } from "lucide-react"
import { useAuth } from "@/contexts/auth-context"
import { collection, query, where, onSnapshot } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { ResponsiveTable } from "@/components/responsive-table"
import { useRouter } from "next/navigation"
import { CompanyRegistrationDialog } from "@/components/company-registration-dialog"
import { AddUserDialog } from "@/components/add-user-dialog"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { toast } from "@/components/ui/use-toast"
import {
  getAllRoles,
  getUserRoles,
  assignRoleToUser,
  removeRoleFromUser,
  type RoleType,
  type HardcodedRole,
} from "@/lib/hardcoded-access-service"

interface User {
  id: string
  email: string
  displayName: string
  role: string
  status: string
  lastLogin: Date | null
  created: Date
}

export default function UserManagementPage() {
  const { userData, refreshUserData } = useAuth()
  const [users, setUsers] = useState<User[]>([])
  const [roles] = useState<HardcodedRole[]>(getAllRoles())
  const [loading, setLoading] = useState(true)
  const [isCompanyRegistrationDialogOpen, setIsCompanyRegistrationDialogOpen] = useState(false)
  const [isAddUserDialogOpen, setIsAddUserDialogOpen] = useState(false)
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [isEditRolesDialogOpen, setIsEditRolesDialogOpen] = useState(false)
  const [selectedRoles, setSelectedRoles] = useState<Record<RoleType, boolean>>({
    admin: false,
    sales: false,
    logistics: false,
    cms: false,
  })
  const [roleDialogLoading, setRoleDialogLoading] = useState(false)

  const router = useRouter()

  useEffect(() => {
    if (!userData?.company_id) {
      setLoading(false)
      return
    }

    const q = query(collection(db, "iboard_users"), where("company_id", "==", userData.company_id))

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const usersData = snapshot.docs.map((doc) => {
        const data = doc.data()
        return {
          id: doc.id,
          email: data.email || "",
          displayName:
            data.first_name && data.last_name
              ? `${data.first_name} ${data.last_name}`
              : data.display_name || data.displayName || "Unknown User",
          role: String(data.role || "user"),
          status: data.active === false ? "inactive" : "active",
          lastLogin: data.lastLogin?.toDate() || null,
          created: data.created?.toDate() || new Date(),
        }
      })
      setUsers(usersData)
      setLoading(false)
    })

    return () => unsubscribe()
  }, [userData?.company_id])

  const handleActionWithCompanyCheck = (actionCallback: () => void) => {
    if (!userData?.company_id) {
      setIsCompanyRegistrationDialogOpen(true)
    } else {
      actionCallback()
    }
  }

  const getStatusBadge = (status: string) => {
    const statusStr = String(status || "unknown")

    switch (statusStr) {
      case "active":
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Active</Badge>
      case "inactive":
        return <Badge className="bg-red-100 text-red-800 hover:bg-red-100">Inactive</Badge>
      default:
        return <Badge variant="secondary">{statusStr}</Badge>
    }
  }

  const getRoleBadge = (roleId: RoleType) => {
    const role = roles.find((r) => r.id === roleId)
    if (!role) return null

    const colorClasses = {
      admin: "bg-purple-100 text-purple-800 hover:bg-purple-100",
      sales: "bg-green-100 text-green-800 hover:bg-green-100",
      logistics: "bg-blue-100 text-blue-800 hover:bg-blue-100",
      cms: "bg-orange-100 text-orange-800 hover:bg-orange-100",
    }

    return <Badge className={colorClasses[roleId]}>{role.name}</Badge>
  }

  const handleEditRoles = async (user: User) => {
    handleActionWithCompanyCheck(async () => {
      setSelectedUser(user)
      setRoleDialogLoading(true)

      try {
        // Get user's current roles
        const userRoles = await getUserRoles(user.id)

        // Initialize selected roles based on user's current roles
        const initialSelectedRoles: Record<RoleType, boolean> = {
          admin: userRoles.includes("admin"),
          sales: userRoles.includes("sales"),
          logistics: userRoles.includes("logistics"),
          cms: userRoles.includes("cms"),
        }

        setSelectedRoles(initialSelectedRoles)
        setIsEditRolesDialogOpen(true)
      } catch (error) {
        console.error("Error loading user roles:", error)
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to load user roles. Please try again.",
        })
      } finally {
        setRoleDialogLoading(false)
      }
    })
  }

  const handleSaveRoles = async () => {
    if (!selectedUser) return

    setRoleDialogLoading(true)

    try {
      // Get current user roles
      const currentRoles = await getUserRoles(selectedUser.id)

      // Determine roles to add and remove
      const rolesToAdd = (Object.entries(selectedRoles) as [RoleType, boolean][])
        .filter(([roleId, isSelected]) => isSelected && !currentRoles.includes(roleId))
        .map(([roleId]) => roleId)

      const rolesToRemove = (Object.entries(selectedRoles) as [RoleType, boolean][])
        .filter(([roleId, isSelected]) => !isSelected && currentRoles.includes(roleId))
        .map(([roleId]) => roleId)

      // Add new roles
      for (const roleId of rolesToAdd) {
        await assignRoleToUser(selectedUser.id, roleId, userData?.uid)
      }

      // Remove roles
      for (const roleId of rolesToRemove) {
        await removeRoleFromUser(selectedUser.id, roleId)
      }

      toast({
        title: "Success",
        description: "User roles updated successfully.",
      })

      setIsEditRolesDialogOpen(false)
    } catch (error) {
      console.error("Error saving user roles:", error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update user roles. Please try again.",
      })
    } finally {
      setRoleDialogLoading(false)
    }
  }

  const handleAddUser = () => {
    handleActionWithCompanyCheck(() => {
      setIsAddUserDialogOpen(true)
    })
  }

  const columns = [
    {
      key: "user",
      label: "User",
      render: (user: User) => (
        <div>
          <div className="font-medium">{user.displayName}</div>
          <div className="text-sm text-muted-foreground">{user.email}</div>
        </div>
      ),
    },
    {
      key: "roles",
      label: "Roles",
      render: (user: User) => <UserRolesBadges userId={user.id} />,
    },
    {
      key: "status",
      label: "Status",
      render: (user: User) => getStatusBadge(user.status),
    },
    {
      key: "lastLogin",
      label: "Last Login",
      render: (user: User) => (
        <span className="text-sm">{user.lastLogin ? user.lastLogin.toLocaleDateString() : "Never"}</span>
      ),
    },
    {
      key: "created",
      label: "Joined",
      render: (user: User) => <span className="text-sm">{user.created.toLocaleDateString()}</span>,
    },
    {
      key: "actions",
      label: "Actions",
      render: (user: User) => (
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => handleEditRoles(user)}>
            <Settings className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ]

  // Component to display user roles
  function UserRolesBadges({ userId }: { userId: string }) {
    const [userRoles, setUserRoles] = useState<RoleType[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
      async function loadUserRoles() {
        try {
          const roles = await getUserRoles(userId)
          setUserRoles(roles)
        } catch (error) {
          console.error("Error loading user roles:", error)
        } finally {
          setLoading(false)
        }
      }

      loadUserRoles()
    }, [userId])

    if (loading) {
      return <div className="animate-pulse bg-gray-200 h-5 w-16 rounded"></div>
    }

    if (userRoles.length === 0) {
      return <span className="text-muted-foreground text-sm">No roles</span>
    }

    return <div className="flex flex-wrap gap-1">{userRoles.map((roleId) => getRoleBadge(roleId))}</div>
  }

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold">User Management</h1>
            <p className="text-muted-foreground">Manage users and their permissions.</p>
          </div>
        </div>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-center h-32">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">User Management ({users.length})</h1>
          <p className="text-muted-foreground">Manage users and their roles.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            className="gap-2 bg-transparent"
            onClick={() => handleActionWithCompanyCheck(() => router.push("/admin/access-management"))}
          >
            <Shield className="h-4 w-4" />
            Roles & Access
          </Button>
          <Button
            variant="outline"
            className="gap-2 bg-transparent"
            onClick={() => handleActionWithCompanyCheck(() => router.push("/admin/invitation-codes"))}
          >
            <Mail className="h-4 w-4" />
            Generate Codes
          </Button>
          <Button className="gap-2" onClick={handleAddUser}>
            <UserPlus className="h-4 w-4" />
            Add User
          </Button>
        </div>
      </div>

      <Card>
        <CardContent>
          <ResponsiveTable data={users} columns={columns} keyField="id" />
        </CardContent>
      </Card>

      <CompanyRegistrationDialog
        isOpen={isCompanyRegistrationDialogOpen}
        onClose={() => setIsCompanyRegistrationDialogOpen(false)}
        onSuccess={() => {
          setIsCompanyRegistrationDialogOpen(false)
          refreshUserData()
        }}
      />

      <AddUserDialog
        open={isAddUserDialogOpen}
        onOpenChange={setIsAddUserDialogOpen}
        onSuccess={() => {
          console.log("User invitation sent successfully")
        }}
      />

      <Dialog open={isEditRolesDialogOpen} onOpenChange={setIsEditRolesDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit User Roles</DialogTitle>
            <DialogDescription>
              {selectedUser && (
                <span>
                  Manage roles for <strong>{selectedUser.displayName || selectedUser.email}</strong>
                </span>
              )}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {roleDialogLoading ? (
              <div className="flex items-center justify-center py-4">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                <span className="ml-2">Loading roles...</span>
              </div>
            ) : (
              <div className="space-y-3">
                {roles.map((role) => (
                  <div key={role.id} className="flex items-start space-x-3 p-3 border rounded-lg">
                    <Checkbox
                      id={`role-${role.id}`}
                      checked={selectedRoles[role.id] || false}
                      onCheckedChange={(checked) =>
                        setSelectedRoles((prev) => ({ ...prev, [role.id]: checked === true }))
                      }
                    />
                    <div className="flex-1">
                      <Label htmlFor={`role-${role.id}`} className="flex items-center gap-2 cursor-pointer">
                        <span className="font-medium">{role.name}</span>
                        {getRoleBadge(role.id)}
                      </Label>
                      <div className="text-sm text-muted-foreground mt-1">{role.description}</div>
                      <div className="text-xs text-muted-foreground mt-2">
                        <strong>Permissions:</strong> {role.permissions.length} modules
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <DialogFooter className="sm:justify-end">
            <Button variant="outline" onClick={() => setIsEditRolesDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveRoles} disabled={roleDialogLoading}>
              {roleDialogLoading ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

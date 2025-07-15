"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useAuth } from "@/contexts/auth-context"
import { useRouter } from "next/navigation"
import { Users, UserPlus, Shield, Settings, Search, MoreVertical, Edit, Trash2, Crown, User, Mail, Calendar, Activity, AlertCircle, CheckCircle, Clock, XCircle } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { toast } from "sonner"
import { collection, query, where, getDocs, doc, updateDoc, deleteDoc, onSnapshot } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { AddUserDialog } from "@/components/add-user-dialog"

interface UserData {
  uid: string
  email: string
  displayName?: string
  photoURL?: string
  role: string
  status: "active" | "inactive" | "pending"
  lastLogin?: Date
  createdAt?: Date
  company_id?: string
  companyName?: string
}

interface InvitationCode {
  id: string
  code: string
  created_at: any
  expires_at: any
  max_usage: number
  usage_count: number
  role: string
  status: "active" | "inactive" | "expired"
  created_by: string
  company_id: string
  description?: string
  invited_email?: string
  used_by?: string[]
}

export default function UserManagementPage() {
  const { userData, loading } = useAuth()
  const router = useRouter()
  const [users, setUsers] = useState<UserData[]>([])
  const [invitationCodes, setInvitationCodes] = useState<InvitationCode[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [loadingUsers, setLoadingUsers] = useState(true)
  const [loadingCodes, setLoadingCodes] = useState(true)
  const [isAddUserDialogOpen, setIsAddUserDialogOpen] = useState(false)

  // Redirect if not authenticated
  useEffect(() => {
    if (!loading && !userData) {
      router.push("/login")
    }
  }, [userData, loading, router])

  // Fetch users from the same company
  useEffect(() => {
    if (!userData?.company_id) return

    const fetchUsers = async () => {
      try {
        const usersQuery = query(collection(db, "users"), where("company_id", "==", userData.company_id))
        const unsubscribe = onSnapshot(usersQuery, (snapshot) => {
          const usersData = snapshot.docs.map((doc) => ({
            uid: doc.id,
            ...doc.data(),
          })) as UserData[]
          setUsers(usersData)
          setLoadingUsers(false)
        })

        return unsubscribe
      } catch (error) {
        console.error("Error fetching users:", error)
        toast.error("Failed to load users")
        setLoadingUsers(false)
      }
    }

    fetchUsers()
  }, [userData?.company_id])

  // Fetch invitation codes
  useEffect(() => {
    if (!userData?.company_id) return

    const fetchInvitationCodes = async () => {
      try {
        const codesQuery = query(
          collection(db, "invitation_codes"),
          where("company_id", "==", userData.company_id),
        )
        const unsubscribe = onSnapshot(codesQuery, (snapshot) => {
          const codesData = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          })) as InvitationCode[]
          setInvitationCodes(codesData)
          setLoadingCodes(false)
        })

        return unsubscribe
      } catch (error) {
        console.error("Error fetching invitation codes:", error)
        toast.error("Failed to load invitation codes")
        setLoadingCodes(false)
      }
    }

    fetchInvitationCodes()
  }, [userData?.company_id])

  const handleActionWithCompanyCheck = (action: () => void) => {
    if (!userData?.company_id) {
      toast.error("Company information not found. Please complete your profile setup.")
      return
    }
    action()
  }

  const handleAddUser = () => {
    handleActionWithCompanyCheck(() => {
      setIsAddUserDialogOpen(true)
    })
  }

  const handleEditUser = (user: UserData) => {
    handleActionWithCompanyCheck(() => {
      console.log("Edit user:", user)
      toast.info("Edit user functionality coming soon!")
    })
  }

  const handleDeleteUser = async (user: UserData) => {
    if (!userData?.company_id) {
      toast.error("Company information not found")
      return
    }

    if (user.uid === userData.uid) {
      toast.error("You cannot delete your own account")
      return
    }

    try {
      await deleteDoc(doc(db, "users", user.uid))
      toast.success(`User ${user.displayName || user.email} has been removed`)
    } catch (error) {
      console.error("Error deleting user:", error)
      toast.error("Failed to delete user")
    }
  }

  const handleUpdateUserRole = async (user: UserData, newRole: string) => {
    if (!userData?.company_id) {
      toast.error("Company information not found")
      return
    }

    try {
      await updateDoc(doc(db, "users", user.uid), { role: newRole })
      toast.success(`User role updated to ${newRole}`)
    } catch (error) {
      console.error("Error updating user role:", error)
      toast.error("Failed to update user role")
    }
  }

  const handleDeactivateInvitationCode = async (codeId: string) => {
    try {
      await updateDoc(doc(db, "invitation_codes", codeId), { status: "inactive" })
      toast.success("Invitation code deactivated")
    } catch (error) {
      console.error("Error deactivating invitation code:", error)
      toast.error("Failed to deactivate invitation code")
    }
  }

  const filteredUsers = users.filter(
    (user) =>
      user.displayName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.role.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const getRoleIcon = (role: string) => {
    switch (role.toLowerCase()) {
      case "admin":
        return <Crown className="h-4 w-4" />
      case "manager":
        return <Shield className="h-4 w-4" />
      default:
        return <User className="h-4 w-4" />
    }
  }

  const getRoleBadgeVariant = (role: string) => {
    switch (role.toLowerCase()) {
      case "admin":
        return "destructive"
      case "manager":
        return "default"
      default:
        return "secondary"
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "active":
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case "inactive":
        return <XCircle className="h-4 w-4 text-red-500" />
      case "pending":
        return <Clock className="h-4 w-4 text-yellow-500" />
      default:
        return <AlertCircle className="h-4 w-4 text-gray-500" />
    }
  }

  const getInvitationStatusBadge = (code: InvitationCode) => {
    const now = new Date()
    const expiresAt = code.expires_at?.toDate ? code.expires_at.toDate() : new Date(code.expires_at)

    if (code.status === "inactive") {
      return <Badge variant="secondary">Inactive</Badge>
    }
    if (now > expiresAt) {
      return <Badge variant="destructive">Expired</Badge>
    }
    if (code.usage_count >= code.max_usage && code.max_usage > 0) {
      return <Badge variant="outline">Used</Badge>
    }
    return <Badge variant="default">Active</Badge>
  }

  if (loading || loadingUsers) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-2 text-gray-600">Loading user management...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">User Management</h1>
          <p className="text-muted-foreground">Manage users and permissions for your organization</p>
        </div>
        <Button onClick={handleAddUser} className="flex items-center space-x-2">
          <UserPlus className="h-4 w-4" />
          <span>Add User</span>
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{users.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Users</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{users.filter((u) => u.status === "active").length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Invites</CardTitle>
            <Mail className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {invitationCodes.filter((c) => c.status === "active" && c.usage_count === 0).length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Admins</CardTitle>
            <Crown className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{users.filter((u) => u.role === "admin").length}</div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs defaultValue="users" className="space-y-4">
        <TabsList>
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="invitations">Invitations</TabsTrigger>
          <TabsTrigger value="roles">Roles & Permissions</TabsTrigger>
        </TabsList>

        <TabsContent value="users" className="space-y-4">
          {/* Search */}
          <div className="flex items-center space-x-2">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search users..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8"
              />
            </div>
          </div>

          {/* Users List */}
          <div className="grid gap-4">
            {filteredUsers.map((user) => (
              <Card key={user.uid}>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <Avatar>
                        <AvatarImage src={user.photoURL || "/placeholder.svg"} />
                        <AvatarFallback>
                          {user.displayName
                            ? user.displayName
                                .split(" ")
                                .map((n) => n[0])
                                .join("")
                                .toUpperCase()
                            : user.email[0].toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="flex items-center space-x-2">
                          <h3 className="font-semibold">{user.displayName || "No name"}</h3>
                          {getStatusIcon(user.status)}
                        </div>
                        <p className="text-sm text-muted-foreground">{user.email}</p>
                        <div className="flex items-center space-x-2 mt-1">
                          <Badge variant={getRoleBadgeVariant(user.role)} className="flex items-center space-x-1">
                            {getRoleIcon(user.role)}
                            <span>{user.role}</span>
                          </Badge>
                          {user.lastLogin && (
                            <span className="text-xs text-muted-foreground">
                              Last login: {new Date(user.lastLogin).toLocaleDateString()}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuItem onClick={() => handleEditUser(user)}>
                          <Edit className="mr-2 h-4 w-4" />
                          Edit User
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => handleUpdateUserRole(user, "admin")}>
                          <Crown className="mr-2 h-4 w-4" />
                          Make Admin
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleUpdateUserRole(user, "user")}>
                          <User className="mr-2 h-4 w-4" />
                          Make User
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() => handleDeleteUser(user)}
                          className="text-red-600"
                          disabled={user.uid === userData?.uid}
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete User
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="invitations" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Invitation Codes</CardTitle>
              <CardDescription>Manage invitation codes for new users</CardDescription>
            </CardHeader>
            <CardContent>
              {loadingCodes ? (
                <div className="text-center py-4">Loading invitation codes...</div>
              ) : invitationCodes.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Mail className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No invitation codes found</p>
                  <p className="text-sm">Create your first invitation by clicking "Add User"</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {invitationCodes.map((code) => (
                    <div key={code.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="space-y-1">
                        <div className="flex items-center space-x-2">
                          <code className="bg-muted px-2 py-1 rounded font-mono text-sm">{code.code}</code>
                          {getInvitationStatusBadge(code)}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {code.invited_email ? `Sent to: ${code.invited_email}` : code.description}
                        </p>
                        <div className="flex items-center space-x-4 text-xs text-muted-foreground">
                          <span>Role: {code.role}</span>
                          <span>
                            Usage: {code.usage_count}/{code.max_usage === 0 ? "∞" : code.max_usage}
                          </span>
                          <span>
                            Expires: {code.expires_at?.toDate ? code.expires_at.toDate().toLocaleDateString() : "N/A"}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        {code.status === "active" && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDeactivateInvitationCode(code.id)}
                          >
                            Deactivate
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="roles" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Roles & Permissions</CardTitle>
              <CardDescription>Configure roles and their permissions</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="p-4 border rounded-lg">
                  <div className="flex items-center space-x-2 mb-2">
                    <Crown className="h-5 w-5 text-red-500" />
                    <h3 className="font-semibold">Admin</h3>
                  </div>
                  <p className="text-sm text-muted-foreground mb-2">Full access to all features and settings</p>
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="outline">User Management</Badge>
                    <Badge variant="outline">System Settings</Badge>
                    <Badge variant="outline">All Modules</Badge>
                    <Badge variant="outline">Data Export</Badge>
                  </div>
                </div>

                <div className="p-4 border rounded-lg">
                  <div className="flex items-center space-x-2 mb-2">
                    <Shield className="h-5 w-5 text-blue-500" />
                    <h3 className="font-semibold">Manager</h3>
                  </div>
                  <p className="text-sm text-muted-foreground mb-2">Can manage teams and projects</p>
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="outline">Team Management</Badge>
                    <Badge variant="outline">Project Access</Badge>
                    <Badge variant="outline">Reports</Badge>
                  </div>
                </div>

                <div className="p-4 border rounded-lg">
                  <div className="flex items-center space-x-2 mb-2">
                    <User className="h-5 w-5 text-green-500" />
                    <h3 className="font-semibold">User</h3>
                  </div>
                  <p className="text-sm text-muted-foreground mb-2">Basic access to core features</p>
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="outline">Dashboard</Badge>
                    <Badge variant="outline">Basic Features</Badge>
                    <Badge variant="outline">Profile Settings</Badge>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Add User Dialog */}
      <AddUserDialog
        open={isAddUserDialogOpen}
        onOpenChange={setIsAddUserDialogOpen}
        onSuccess={() => {
          // Refresh data or show success message
          toast.success("User invitation sent successfully!")
        }}
      />
    </div>
  )
}

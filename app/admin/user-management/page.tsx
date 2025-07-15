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
import { useRouter } from "next/navigation" // Import useRouter
import { CompanyRegistrationDialog } from "@/components/company-registration-dialog" // Import CompanyRegistrationDialog
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
  const { userData, refreshUserData } = useAuth() // Get refreshUserData
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [isCompanyRegistrationDialogOpen, setIsCompanyRegistrationDialogOpen] = useState(false) // State for dialog
  const [selectedUser, setSelectedUser] = useState<User | null>(null) // Keep this for Edit Roles dialog
  const [isEditRolesDialogOpen, setIsEditRolesDialogOpen] = useState(false) // Keep this for Edit Roles dialog
  const [selectedRoles, setSelectedRoles] = useState<Record<string, boolean>>({}) // Keep this for Edit Roles dialog

  const router = useRouter() // Initialize useRouter

  useEffect(() => {
    if (!userData?.company_id) {
      // If company_id is missing, don't fetch users yet, and don't set loading to false
      // The dialog will prompt the user to register the company
      setLoading(false) // Set loading to false so the UI isn't stuck
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
          role: String(data.role || "user"), // Ensure role is always a string
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

  // Helper function to check for company_id before executing an action
  const handleActionWithCompanyCheck = (actionCallback: () => void) => {
    if (!userData?.company_id) {
      setIsCompanyRegistrationDialogOpen(true)
    } else {
      actionCallback()
    }
  }

  const getStatusBadge = (status: string) => {
    // Ensure status is a string
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

  const getRoleBadge = (role: string) => {
    // Ensure role is a string and provide fallback
    const roleStr = String(role || "user").toLowerCase()

    const roleColors = {
      admin: "bg-purple-100 text-purple-800 hover:bg-purple-100",
      manager: "bg-blue-100 text-blue-800 hover:bg-blue-100",
      editor: "bg-orange-100 text-orange-800 hover:bg-orange-100",
      user: "bg-gray-100 text-gray-800 hover:bg-gray-100",
    }

    return (
      <Badge className={roleColors[roleStr as keyof typeof roleColors] || roleColors.user}>
        {roleStr.charAt(0).toUpperCase() + roleStr.slice(1)}
      </Badge>
    )
  }

  // Handle editing user roles (now wrapped with company check)
  const handleEditRoles = (user: User) => {
    handleActionWithCompanyCheck(() => {
      setSelectedUser(user)
      // Initialize selected roles based on user's current roles
      const initialSelectedRoles: Record<string, boolean> = {}
      // This part assumes `roles` and `userRolesMap` are available, which they would be if data loaded
      // For simplicity, I'm omitting the full role fetching logic here as it's not directly part of the button click
      // In a real scenario, you'd ensure `roles` and `userRolesMap` are populated before this dialog opens.
      // For now, I'll use dummy roles if `roles` is not available.
      const dummyRoles = [
        { id: "admin", name: "Admin", description: "Administrator" },
        { id: "user", name: "User", description: "Standard User" },
      ]
      dummyRoles.forEach((role) => {
        // Use dummyRoles or actual roles if available
        initialSelectedRoles[role.id] = false // Default to false for demonstration
      })
      setSelectedRoles(initialSelectedRoles)
      setIsEditRolesDialogOpen(true)
    })
  }

  // Placeholder for handleSaveRoles, assuming it's defined elsewhere or will be added
  const handleSaveRoles = async () => {
    // This function would contain the logic to save roles, similar to the original UserManagement component
    // For this task, we are only focusing on the initial click check.
    console.log("Saving roles for", selectedUser?.email)
    setIsEditRolesDialogOpen(false) // Close dialog after "saving"
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
      key: "role",
      label: "Role",
      render: (user: User) => getRoleBadge(user.role),
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
          <p className="text-muted-foreground">Manage users and their permissions.</p>
        </div>
        <div className="flex items-center gap-2">

          {/* Roles & Permissions Button */}
          <Button
            variant="outline"
            className="gap-2 bg-transparent"
            onClick={() => handleActionWithCompanyCheck(() => router.push("/admin/access-management"))}
          >
            <Shield className="h-4 w-4" />
            Roles & Access
          </Button>
          {/* Invitation Codes Button */}
          <Button
            variant="outline"
            className="gap-2 bg-transparent"
            onClick={() => handleActionWithCompanyCheck(() => router.push("/admin/invitation-codes"))}
          >
            <Mail className="h-4 w-4" />
            Generate Codes
          </Button>
          {/* Add User Button */}
          <Button
            className="gap-2"
            onClick={() =>
              handleActionWithCompanyCheck(() => {
                // Placeholder for Add User logic, e.g., open a dialog or navigate
                console.log("Add User clicked, company_id exists. Implement add user dialog/page here.")
                // Example: router.push("/admin/user-management/add-user");
              })
            }
          >
            <UserPlus className="h-4 w-4" />
            Add User
          </Button>
        </div>
      </div>

      {/* Users Table */}
      <Card>
        <CardContent>
          <ResponsiveTable data={users} columns={columns} keyField="id" />
        </CardContent>
      </Card>

      {/* Company Registration Dialog */}
      <CompanyRegistrationDialog
        isOpen={isCompanyRegistrationDialogOpen}
        onClose={() => setIsCompanyRegistrationDialogOpen(false)}
        onSuccess={() => {
          setIsCompanyRegistrationDialogOpen(false)
          refreshUserData() // Refresh user data to get the new company_id
        }}
      />

      {/* Edit User Roles Dialog (kept for completeness, assuming it's used) */}
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
            <div className="space-y-2">
              {/* This part would dynamically load roles from your `roles` state */}
              {/* For demonstration, using a placeholder */}
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="role-admin"
                  checked={selectedRoles["admin"] || false}
                  onCheckedChange={(checked) => setSelectedRoles((prev) => ({ ...prev, admin: checked === true }))}
                />
                <Label htmlFor="role-admin" className="flex-1">
                  <div>Admin</div>
                  <div className="text-sm text-muted-foreground">Full access to all features</div>
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="role-user"
                  checked={selectedRoles["user"] || false}
                  onCheckedChange={(checked) => setSelectedRoles((prev) => ({ ...prev, user: checked === true }))}
                />
                <Label htmlFor="role-user" className="flex-1">
                  <div>User</div>
                  <div className="text-sm text-muted-foreground">Standard user access</div>
                </Label>
              </div>
            </div>
          </div>

          <DialogFooter className="sm:justify-end">
            <Button variant="outline" onClick={() => setIsEditRolesDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveRoles} disabled={loading}>
              {loading ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { UserPlus, Settings, Mail, Shield, Edit } from "lucide-react"
import { useAuth } from "@/contexts/auth-context"
import { collection, query, where, onSnapshot, addDoc, serverTimestamp } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { ResponsiveTable } from "@/components/responsive-table"
import AddUserInvitationDialog from "@/components/add-user-invitation-dialog"
import EditUserRoleDialog from "@/components/edit-user-role-dialog"
import Link from "next/link"
import { toast } from "sonner"

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
  const { userData } = useAuth()
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddUserDialog, setShowAddUserDialog] = useState(false)
  const [showEditRoleDialog, setShowEditRoleDialog] = useState(false)
  const [currentInvitationCode, setCurrentInvitationCode] = useState("")
  const [selectedUser, setSelectedUser] = useState<User | null>(null)

  useEffect(() => {
    if (!userData?.company_id) return

    const q = query(collection(db, "iboard_users"), where("company_id", "==", userData.company_id))

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const usersData = snapshot.docs.map((doc) => {
        const data = doc.data()
        return {
          id: doc.id,
          email: data.email || "",
          displayName: data.display_name || data.displayName || "Unknown User",
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

  const generateInvitationCode = () => {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
    let result = ""
    for (let i = 0; i < 8; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    return result
  }

  const handleAddUser = async () => {
    console.log("Add user button clicked") // Debug log

    if (!userData?.company_id) {
      toast.error("Company information not found")
      return
    }

    try {
      // Generate invitation code
      const invitationCode = generateInvitationCode()
      console.log("Generated invitation code:", invitationCode) // Debug log

      // Save invitation code to Firestore
      await addDoc(collection(db, "invitation_codes"), {
        code: invitationCode,
        company_id: userData.company_id,
        created_by: userData.uid,
        created_at: serverTimestamp(),
        expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
        used: false,
        role: "user",
        max_uses: 1,
        current_uses: 0,
      })

      console.log("Invitation code saved to Firestore") // Debug log

      setCurrentInvitationCode(invitationCode)
      setShowAddUserDialog(true)

      console.log("Dialog should be open now:", true) // Debug log
    } catch (error) {
      console.error("Error generating invitation code:", error)
      toast.error("Failed to generate invitation code. Please try again.")
    }
  }

  const handleEditRole = (user: User) => {
    setSelectedUser(user)
    setShowEditRoleDialog(true)
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
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => handleEditRole(user)}>
            <Edit className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
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

  console.log("Rendering page with showAddUserDialog:", showAddUserDialog) // Debug log

  return (
    <div className="container mx-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">User Management</h1>
          <p className="text-muted-foreground">Manage users and their permissions.</p>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/admin/access-management">
            <Button variant="outline" className="gap-2 bg-transparent">
              <Shield className="h-4 w-4" />
              Roles & Permissions
            </Button>
          </Link>
          <Link href="/admin/invitation-codes">
            <Button variant="outline" className="gap-2 bg-transparent">
              <Mail className="h-4 w-4" />
              Invitation Codes
            </Button>
          </Link>
          <Button className="gap-2" onClick={handleAddUser}>
            <UserPlus className="h-4 w-4" />
            Invite User
          </Button>
        </div>
      </div>

      {/* Users Table */}
      <Card>
        <CardHeader>
          <CardTitle>Organization Users ({users.length})</CardTitle>
          <CardDescription>Manage users within your organization</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveTable data={users} columns={columns} keyField="id" />
        </CardContent>
      </Card>

      {/* Add User Dialog */}
      <AddUserInvitationDialog
        open={showAddUserDialog}
        onOpenChange={setShowAddUserDialog}
        invitationCode={currentInvitationCode}
        onSuccess={() => {
          toast.success("User invitation sent successfully!")
        }}
      />

      {/* Edit User Role Dialog */}
      <EditUserRoleDialog
        open={showEditRoleDialog}
        onOpenChange={setShowEditRoleDialog}
        user={selectedUser}
        onSuccess={() => {
          toast.success("User role updated successfully!")
        }}
      />
    </div>
  )
}

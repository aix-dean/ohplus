"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { ResponsiveTable } from "@/components/responsive-table"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useAuth } from "@/contexts/auth-context"
import { getUsers } from "@/lib/access-management-service"
import type { User } from "@/lib/access-management-service"
import { Shield, Users } from "lucide-react"
import Link from "next/link"

function getRoleBadge(role: string) {
  const roleStr = String(role || "user").toLowerCase()

  switch (roleStr) {
    case "admin":
      return <Badge variant="destructive">Admin</Badge>
    case "manager":
      return <Badge variant="default">Manager</Badge>
    case "editor":
      return <Badge variant="secondary">Editor</Badge>
    default:
      return <Badge variant="outline">User</Badge>
  }
}

function getStatusBadge(status: boolean | string) {
  const statusStr = String(status || "unknown").toLowerCase()

  if (statusStr === "true" || statusStr === "active") {
    return <Badge variant="default">Active</Badge>
  } else if (statusStr === "false" || statusStr === "inactive") {
    return <Badge variant="secondary">Inactive</Badge>
  }
  return <Badge variant="outline">Unknown</Badge>
}

export default function UserManagementPage() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const { userData } = useAuth()

  useEffect(() => {
    async function fetchUsers() {
      try {
        setLoading(true)
        const fetchedUsers = await getUsers(userData?.license_key)
        setUsers(fetchedUsers)
      } catch (error) {
        console.error("Error fetching users:", error)
      } finally {
        setLoading(false)
      }
    }

    if (userData?.license_key) {
      fetchUsers()
    }
  }, [userData?.license_key])

  const columns = [
    {
      key: "user",
      label: "User",
      render: (user: User) => (
        <div className="flex items-center space-x-3">
          <Avatar className="h-8 w-8">
            <AvatarImage src={user.photo_url || user.photoURL} alt={user.display_name || user.displayName} />
            <AvatarFallback>
              {(user.display_name || user.displayName || user.email)
                .split(" ")
                .map((n) => n[0])
                .join("")
                .toUpperCase()
                .slice(0, 2)}
            </AvatarFallback>
          </Avatar>
          <div>
            <div className="font-medium">{user.display_name || user.displayName || "No Name"}</div>
            <div className="text-sm text-muted-foreground">{user.email}</div>
          </div>
        </div>
      ),
    },
    {
      key: "department",
      label: "Department",
      render: (user: User) => user.department || "Not Assigned",
    },
    {
      key: "role",
      label: "Role",
      render: (user: User) => getRoleBadge(String(user.type || "user")),
    },
    {
      key: "status",
      label: "Status",
      render: (user: User) => getStatusBadge(user.active),
    },
    {
      key: "lastLogin",
      label: "Last Login",
      render: (user: User) => {
        if (!user.lastLogin) return "Never"
        try {
          const date = user.lastLogin.toDate ? user.lastLogin.toDate() : new Date(user.lastLogin)
          return date.toLocaleDateString()
        } catch {
          return "Invalid Date"
        }
      },
    },
  ]

  const tableData = users.map((user) => ({
    ...user,
    role: String(user.type || "user"),
  }))

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex justify-center items-center h-64">
          <div className="h-8 w-8 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
          <span className="ml-2">Loading users...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Users className="h-6 w-6" />
            User Management
          </h1>
          <p className="text-muted-foreground">Manage users and their access permissions.</p>
        </div>
        <Link href="/admin/access-management">
          <Button variant="outline" className="flex items-center gap-2 bg-transparent">
            <Shield className="h-4 w-4" />
            Roles & Permissions
          </Button>
        </Link>
      </div>

      <ResponsiveTable
        data={tableData}
        columns={columns}
        keyField="id"
        searchable={true}
        searchPlaceholder="Search users..."
      />
    </div>
  )
}

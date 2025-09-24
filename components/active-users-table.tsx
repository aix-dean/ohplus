"use client"

import React, { useState, useEffect, useMemo, useCallback } from "react"
import { ResponsiveTable } from "@/components/responsive-table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useAuth } from "@/contexts/auth-context"
import { Search, MoreHorizontal, User, Clock, Shield, LogOut } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { useDebounce } from "@/hooks/use-debounce"

interface ActiveUser {
  id: string
  uid: string
  email: string
  displayName: string
  firstName?: string
  lastName?: string
  department?: string
  roles: string[]
  lastActivity: string
  photoURL?: string
  phoneNumber?: string
}

interface ActiveUsersTableProps {
  companyId: string
}

export function ActiveUsersTable({ companyId }: ActiveUsersTableProps) {
  const { userData } = useAuth()
  const { toast } = useToast()

  const [activeUsers, setActiveUsers] = useState<ActiveUser[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedUser, setSelectedUser] = useState<ActiveUser | null>(null)
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false)
  const [isForceLogoutLoading, setIsForceLogoutLoading] = useState(false)

  const debouncedSearchTerm = useDebounce(searchTerm, 300)

  // Fetch active users with real-time updates
  useEffect(() => {
    if (!companyId || !userData?.uid) return

    setLoading(true)
    setError(null)

    const fetchActiveUsers = async () => {
      try {
        const response = await fetch(
          `/api/admin/active-users?companyId=${companyId}&userId=${userData.uid}`
        )

        if (!response.ok) {
          throw new Error("Failed to fetch active users")
        }

        const data = await response.json()
        setActiveUsers(data.activeUsers || [])
      } catch (err) {
        console.error("Error fetching active users:", err)
        setError("Failed to load active users")
      } finally {
        setLoading(false)
      }
    }

    fetchActiveUsers()

    // Set up polling for real-time updates (fallback for environments without WebSocket)
    const interval = setInterval(fetchActiveUsers, 30000) // Poll every 30 seconds

    return () => clearInterval(interval)
  }, [companyId, userData?.uid])

  // Filter users based on search term
  const filteredUsers = useMemo(() => {
    if (!debouncedSearchTerm) return activeUsers

    const searchLower = debouncedSearchTerm.toLowerCase()
    return activeUsers.filter(user =>
      user.displayName?.toLowerCase().includes(searchLower) ||
      user.email.toLowerCase().includes(searchLower) ||
      user.department?.toLowerCase().includes(searchLower)
    )
  }, [activeUsers, debouncedSearchTerm])

  // Handle viewing user details
  const handleViewDetails = useCallback((user: ActiveUser) => {
    setSelectedUser(user)
    setIsDetailsModalOpen(true)
  }, [])

  // Handle force logout
  const handleForceLogout = useCallback(async (user: ActiveUser) => {
    if (!userData?.uid) return

    setIsForceLogoutLoading(true)
    try {
      const response = await fetch(
        `/api/admin/force-logout?companyId=${companyId}&userId=${userData.uid}&targetUserId=${user.uid}`,
        { method: "POST" }
      )

      if (!response.ok) {
        throw new Error("Failed to force logout")
      }

      toast({
        title: "Success",
        description: `${user.displayName} has been logged out`,
      })

      // Remove user from active users list
      setActiveUsers(prev => prev.filter(u => u.uid !== user.uid))
    } catch (err) {
      console.error("Error forcing logout:", err)
      toast({
        title: "Error",
        description: "Failed to force logout user",
        variant: "destructive",
      })
    } finally {
      setIsForceLogoutLoading(false)
    }
  }, [companyId, userData?.uid, toast])

  // Table columns configuration
  const columns = useMemo(() => [
    {
      header: "User",
      accessorKey: "displayName" as keyof ActiveUser,
      cell: (user: ActiveUser) => (
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
            <User className="w-4 h-4" />
          </div>
          <div>
            <div className="font-medium">{user.displayName}</div>
            <div className="text-sm text-muted-foreground">{user.email}</div>
          </div>
        </div>
      ),
    },
    {
      header: "Department",
      accessorKey: "department" as keyof ActiveUser,
      cell: (user: ActiveUser) => (
        <Badge variant="outline">{user.department || "No Department"}</Badge>
      ),
      hideOnMobile: true,
    },
    {
      header: "Role",
      accessorKey: "roles" as keyof ActiveUser,
      cell: (user: ActiveUser) => (
        <div className="flex flex-wrap gap-1">
          {user.roles?.length > 0 ? (
            user.roles.slice(0, 2).map(role => (
              <Badge key={role} variant="secondary" className="text-xs">
                {role}
              </Badge>
            ))
          ) : (
            <span className="text-muted-foreground text-sm">No roles</span>
          )}
          {user.roles?.length > 2 && (
            <Badge variant="secondary" className="text-xs">
              +{user.roles.length - 2}
            </Badge>
          )}
        </div>
      ),
      hideOnMobile: true,
    },
    {
      header: "Last Activity",
      accessorKey: "lastActivity" as keyof ActiveUser,
      cell: (user: ActiveUser) => {
        const lastActivity = new Date(user.lastActivity)
        const now = new Date()
        const diffMinutes = Math.floor((now.getTime() - lastActivity.getTime()) / (1000 * 60))

        let timeString
        if (diffMinutes < 1) {
          timeString = "Just now"
        } else if (diffMinutes < 60) {
          timeString = `${diffMinutes}m ago`
        } else {
          timeString = lastActivity.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }

        return (
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm">{timeString}</span>
          </div>
        )
      },
    },
    {
      header: "Actions",
      cell: (user: ActiveUser) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm">
              <MoreHorizontal className="w-4 h-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => handleViewDetails(user)}>
              <User className="w-4 h-4 mr-2" />
              View Details
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => handleForceLogout(user)}
              disabled={isForceLogoutLoading}
              className="text-destructive"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Force Logout
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ], [handleViewDetails, handleForceLogout, isForceLogoutLoading])

  // Empty state component
  const emptyState = (
    <div className="text-center py-8">
      <User className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
      <h3 className="text-lg font-medium mb-2">No Active Users</h3>
      <p className="text-muted-foreground">
        There are currently no users active in the system.
      </p>
    </div>
  )

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <User className="w-5 h-5" />
            Active Users ({filteredUsers.length})
          </CardTitle>
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search users..."
              className="pl-8 w-64"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {error ? (
          <div className="text-center py-8">
            <p className="text-destructive mb-4">{error}</p>
            <Button onClick={() => window.location.reload()}>
              Try Again
            </Button>
          </div>
        ) : (
          <ResponsiveTable
            data={filteredUsers}
            columns={columns}
            keyField="uid"
            isLoading={loading}
            emptyState={emptyState}
          />
        )}
      </CardContent>

      {/* User Details Modal */}
      <Dialog open={isDetailsModalOpen} onOpenChange={setIsDetailsModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>User Details</DialogTitle>
            <DialogDescription>
              Detailed information about {selectedUser?.displayName}
            </DialogDescription>
          </DialogHeader>

          {selectedUser && (
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <User className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-medium">{selectedUser.displayName}</h3>
                  <p className="text-sm text-muted-foreground">{selectedUser.email}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <label className="font-medium">Department</label>
                  <p className="text-muted-foreground">
                    {selectedUser.department || "Not assigned"}
                  </p>
                </div>
                <div>
                  <label className="font-medium">Phone</label>
                  <p className="text-muted-foreground">
                    {selectedUser.phoneNumber || "Not provided"}
                  </p>
                </div>
              </div>

              <div>
                <label className="font-medium">Roles</label>
                <div className="flex flex-wrap gap-1 mt-1">
                  {selectedUser.roles?.length > 0 ? (
                    selectedUser.roles.map(role => (
                      <Badge key={role} variant="secondary">
                        <Shield className="w-3 h-3 mr-1" />
                        {role}
                      </Badge>
                    ))
                  ) : (
                    <span className="text-muted-foreground">No roles assigned</span>
                  )}
                </div>
              </div>

              <div>
                <label className="font-medium">Last Activity</label>
                <p className="text-muted-foreground">
                  {new Date(selectedUser.lastActivity).toLocaleString()}
                </p>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              variant="destructive"
              onClick={() => {
                if (selectedUser) {
                  handleForceLogout(selectedUser)
                  setIsDetailsModalOpen(false)
                }
              }}
              disabled={isForceLogoutLoading}
            >
              <LogOut className="w-4 h-4 mr-2" />
              Force Logout
            </Button>
            <Button onClick={() => setIsDetailsModalOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  )
}
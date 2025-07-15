"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Users, Shield, AlertCircle } from "lucide-react"
import { useAuth } from "@/contexts/auth-context"
import {
  getAllRoles,
  getUserRoles,
  assignRoleToUser,
  removeRoleFromUser,
  type RoleType,
  type HardcodedRole,
} from "@/lib/hardcoded-access-service"

interface RoleAssignmentDialogProps {
  userId: string
  userName: string
  onSuccess?: () => void
  trigger?: React.ReactNode
}

export function RoleAssignmentDialog({ userId, userName, onSuccess, trigger }: RoleAssignmentDialogProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [userRoles, setUserRoles] = useState<RoleType[]>([])
  const [selectedRoles, setSelectedRoles] = useState<RoleType[]>([])
  const [initializing, setInitializing] = useState(true)

  const { userData } = useAuth()
  const allRoles = getAllRoles()

  // Load user's current roles
  useEffect(() => {
    const loadUserRoles = async () => {
      if (!open || !userId) return

      setInitializing(true)
      try {
        const roles = await getUserRoles(userId)
        setUserRoles(roles)
        setSelectedRoles([...roles])
      } catch (error) {
        console.error("Error loading user roles:", error)
      } finally {
        setInitializing(false)
      }
    }

    loadUserRoles()
  }, [open, userId])

  const handleRoleToggle = (roleId: RoleType, checked: boolean) => {
    if (checked) {
      setSelectedRoles((prev) => [...prev, roleId])
    } else {
      setSelectedRoles((prev) => prev.filter((id) => id !== roleId))
    }
  }

  const handleSave = async () => {
    if (!userData) return

    setLoading(true)
    try {
      // Find roles to add and remove
      const rolesToAdd = selectedRoles.filter((role) => !userRoles.includes(role))
      const rolesToRemove = userRoles.filter((role) => !selectedRoles.includes(role))

      // Add new roles
      for (const roleId of rolesToAdd) {
        await assignRoleToUser(userId, roleId, userData.uid)
      }

      // Remove old roles
      for (const roleId of rolesToRemove) {
        await removeRoleFromUser(userId, roleId)
      }

      setUserRoles([...selectedRoles])
      onSuccess?.()
      setOpen(false)
    } catch (error) {
      console.error("Error updating user roles:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    setOpen(false)
    setSelectedRoles([...userRoles]) // Reset to original roles
  }

  const hasChanges = JSON.stringify(selectedRoles.sort()) !== JSON.stringify(userRoles.sort())

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm">
            <Shield className="h-4 w-4 mr-2" />
            Manage Roles
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Manage Roles for {userName}
          </DialogTitle>
          <DialogDescription>
            Assign or remove roles to control what this user can access and do in the system.
          </DialogDescription>
        </DialogHeader>

        {initializing ? (
          <div className="flex items-center justify-center py-8">
            <div className="text-sm text-muted-foreground">Loading user roles...</div>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Current Roles */}
            {userRoles.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Current Roles</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {userRoles.map((roleId) => {
                      const role = allRoles.find((r) => r.id === roleId)
                      return role ? (
                        <Badge key={roleId} style={{ backgroundColor: role.color, color: "white" }}>
                          {role.name}
                        </Badge>
                      ) : null
                    })}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Role Selection */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Available Roles</CardTitle>
                <CardDescription>Select the roles you want to assign to this user.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {allRoles.map((role: HardcodedRole) => (
                  <div key={role.id} className="flex items-start space-x-3">
                    <Checkbox
                      id={role.id}
                      checked={selectedRoles.includes(role.id)}
                      onCheckedChange={(checked) => handleRoleToggle(role.id, checked as boolean)}
                    />
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center gap-2">
                        <Badge style={{ backgroundColor: role.color, color: "white" }} className="text-xs">
                          {role.name}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">{role.description}</p>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {role.permissions.slice(0, 3).map((permission, index) => (
                          <Badge key={index} variant="secondary" className="text-xs">
                            {permission.module}
                          </Badge>
                        ))}
                        {role.permissions.length > 3 && (
                          <Badge variant="secondary" className="text-xs">
                            +{role.permissions.length - 3} more
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Warning for no roles */}
            {selectedRoles.length === 0 && (
              <Card className="border-yellow-200 bg-yellow-50">
                <CardContent className="pt-4">
                  <div className="flex items-center gap-2 text-yellow-800">
                    <AlertCircle className="h-4 w-4" />
                    <span className="text-sm font-medium">No roles selected</span>
                  </div>
                  <p className="text-sm text-yellow-700 mt-1">
                    This user will have very limited access to the system without any assigned roles.
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={loading || !hasChanges || initializing}>
            {loading ? "Saving..." : "Save Changes"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

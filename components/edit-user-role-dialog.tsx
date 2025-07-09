"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
import { assignRoleToUser, getRoles, type Role, type User } from "@/lib/access-management-service"

interface EditUserRoleDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  user: User | null
  onSuccess?: () => void
}

export default function EditUserRoleDialog({ open, onOpenChange, user, onSuccess }: EditUserRoleDialogProps) {
  const [selectedRole, setSelectedRole] = useState<string>("")
  const [roles, setRoles] = useState<Role[]>([])
  const [loadingRoles, setLoadingRoles] = useState(false)
  const [saving, setSaving] = useState(false)

  const fetchRoles = async () => {
    setLoadingRoles(true)
    try {
      const fetchedRoles = await getRoles()
      setRoles(fetchedRoles)
    } catch (error) {
      console.error("Error fetching roles:", error)
      toast.error("Failed to load roles")
    } finally {
      setLoadingRoles(false)
    }
  }

  useEffect(() => {
    if (open) {
      fetchRoles()
      setSelectedRole("")
    }
  }, [open])

  const handleSave = async () => {
    if (!user || !selectedRole) {
      toast.error("Please select a role")
      return
    }

    setSaving(true)
    try {
      await assignRoleToUser(user.id, selectedRole)
      toast.success("User role updated successfully")
      onSuccess?.()
      onOpenChange(false)
    } catch (error) {
      console.error("Error updating user role:", error)
      toast.error("Failed to update user role")
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Edit User Role</DialogTitle>
          <DialogDescription>
            Change the role for {user?.email}. This will determine what parts of the system they can access.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="role" className="text-right">
              Role
            </Label>
            <div className="col-span-3">
              <Select value={selectedRole} onValueChange={setSelectedRole}>
                <SelectTrigger>
                  <SelectValue placeholder={loadingRoles ? "Loading roles..." : "Select a role"} />
                </SelectTrigger>
                <SelectContent>
                  {loadingRoles ? (
                    <SelectItem value="loading" disabled>
                      Loading roles...
                    </SelectItem>
                  ) : (
                    roles.map((role) => (
                      <SelectItem key={role.id} value={role.id}>
                        {role.name} - {role.description}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={saving || !selectedRole || loadingRoles}>
            {saving ? "Saving..." : "Save Changes"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

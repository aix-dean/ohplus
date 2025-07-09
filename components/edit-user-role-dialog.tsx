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
import { doc, updateDoc } from "firebase/firestore"
import { db } from "@/lib/firebase"
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

interface EditUserRoleDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  user: User | null
  onSuccess: () => void
}

const AVAILABLE_ROLES = [
  { value: "user", label: "User" },
  { value: "admin", label: "Admin" },
  { value: "manager", label: "Manager" },
  { value: "editor", label: "Editor" },
]

export default function EditUserRoleDialog({ open, onOpenChange, user, onSuccess }: EditUserRoleDialogProps) {
  const [selectedRole, setSelectedRole] = useState("")
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (user) {
      setSelectedRole(user.role)
    }
  }, [user])

  const handleSave = async () => {
    if (!user || !selectedRole) return

    setLoading(true)
    try {
      // Update user role in Firestore
      const userRef = doc(db, "iboard_users", user.id)
      await updateDoc(userRef, {
        role: selectedRole,
        updated: new Date(),
      })

      toast.success("User role updated successfully!")
      onSuccess()
      onOpenChange(false)
    } catch (error) {
      console.error("Error updating user role:", error)
      toast.error("Failed to update user role. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit User Role</DialogTitle>
          <DialogDescription>
            {user && (
              <span>
                Change the role for <strong>{user.displayName || user.email}</strong>
              </span>
            )}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="role">Role</Label>
            <Select value={selectedRole} onValueChange={setSelectedRole}>
              <SelectTrigger>
                <SelectValue placeholder="Select a role" />
              </SelectTrigger>
              <SelectContent>
                {AVAILABLE_ROLES.map((role) => (
                  <SelectItem key={role.value} value={role.value}>
                    {role.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter className="sm:justify-end">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={loading || !selectedRole}>
            {loading ? "Saving..." : "Save Changes"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Shield, Users, Clock, AlertCircle } from "lucide-react"
import { useAuth } from "@/contexts/auth-context"
import { collection, addDoc, serverTimestamp } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { toast } from "sonner"

interface GenerateInvitationCodeDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

const ROLES = [
  { value: "admin", label: "Admin", description: "Full system access" },
  { value: "manager", label: "Manager", description: "Team management access" },
  { value: "user", label: "User", description: "Standard user access" },
  { value: "viewer", label: "Viewer", description: "Read-only access" },
]

const PERMISSIONS = [
  { id: "read", label: "Read", description: "View data and content" },
  { id: "write", label: "Write", description: "Create and edit content" },
  { id: "delete", label: "Delete", description: "Remove content" },
  { id: "manage_users", label: "Manage Users", description: "Add/remove users" },
  { id: "manage_settings", label: "Manage Settings", description: "System configuration" },
]

export function GenerateInvitationCodeDialog({ open, onOpenChange }: GenerateInvitationCodeDialogProps) {
  const { userData } = useAuth()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    role: "",
    maxUsage: "1",
    validityDays: "7",
    description: "",
    permissions: [] as string[],
  })

  const generateRandomCode = () => {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
    let result = ""
    for (let i = 0; i < 8; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    return result.slice(0, 4) + "-" + result.slice(4)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      if (!userData?.company_id) {
        toast.error("No company associated with your account")
        setLoading(false)
        return
      }

      if (!formData.role) {
        toast.error("Please select a role")
        setLoading(false)
        return
      }

      const expiresAt = new Date()
      expiresAt.setDate(expiresAt.getDate() + Number.parseInt(formData.validityDays))

      const codeData = {
        code: generateRandomCode(),
        company_id: userData.company_id,
        role: formData.role,
        max_usage: Number.parseInt(formData.maxUsage) || 0,
        usage_count: 0,
        expires_at: expiresAt,
        status: "active",
        permissions: formData.permissions,
        description: formData.description,
        created_at: serverTimestamp(),
        created_by: userData.uid,
        used_by: [],
      }

      await addDoc(collection(db, "invitation_codes"), codeData)

      toast.success("Invitation code generated successfully!")
      onOpenChange(false)

      // Reset form
      setFormData({
        role: "",
        maxUsage: "1",
        validityDays: "7",
        description: "",
        permissions: [],
      })
    } catch (error) {
      console.error("Error generating invitation code:", error)
      toast.error("Failed to generate invitation code")
    } finally {
      setLoading(false)
    }
  }

  const handlePermissionChange = (permissionId: string, checked: boolean) => {
    setFormData((prev) => ({
      ...prev,
      permissions: checked ? [...prev.permissions, permissionId] : prev.permissions.filter((p) => p !== permissionId),
    }))
  }

  const selectedRole = ROLES.find((role) => role.value === formData.role)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Generate Invitation Code
          </DialogTitle>
          <DialogDescription>
            Create a new invitation code for user registration with specific role and permissions.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Role Selection */}
          <div className="space-y-2">
            <Label htmlFor="role" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Role *
            </Label>
            <Select value={formData.role} onValueChange={(value) => setFormData({ ...formData, role: value })}>
              <SelectTrigger>
                <SelectValue placeholder="Select a role" />
              </SelectTrigger>
              <SelectContent>
                {ROLES.map((role) => (
                  <SelectItem key={role.value} value={role.value}>
                    <div className="flex flex-col">
                      <span className="font-medium">{role.label}</span>
                      <span className="text-xs text-muted-foreground">{role.description}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selectedRole && (
              <Card className="mt-2">
                <CardContent className="pt-4">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">{selectedRole.label}</Badge>
                    <span className="text-sm text-muted-foreground">{selectedRole.description}</span>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Usage Limit */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="maxUsage">Usage Limit</Label>
              <Select
                value={formData.maxUsage}
                onValueChange={(value) => setFormData({ ...formData, maxUsage: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">1 use</SelectItem>
                  <SelectItem value="5">5 uses</SelectItem>
                  <SelectItem value="10">10 uses</SelectItem>
                  <SelectItem value="0">Unlimited</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="validityDays" className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Valid for (days)
              </Label>
              <Select
                value={formData.validityDays}
                onValueChange={(value) => setFormData({ ...formData, validityDays: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">1 day</SelectItem>
                  <SelectItem value="7">7 days</SelectItem>
                  <SelectItem value="30">30 days</SelectItem>
                  <SelectItem value="90">90 days</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Permissions */}
          <div className="space-y-3">
            <Label className="text-base font-medium">Permissions</Label>
            <div className="grid grid-cols-1 gap-3">
              {PERMISSIONS.map((permission) => (
                <div key={permission.id} className="flex items-start space-x-3">
                  <Checkbox
                    id={permission.id}
                    checked={formData.permissions.includes(permission.id)}
                    onCheckedChange={(checked) => handlePermissionChange(permission.id, checked as boolean)}
                  />
                  <div className="grid gap-1.5 leading-none">
                    <Label
                      htmlFor={permission.id}
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                      {permission.label}
                    </Label>
                    <p className="text-xs text-muted-foreground">{permission.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description (Optional)</Label>
            <Textarea
              id="description"
              placeholder="Add a note about this invitation code..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
            />
          </div>

          {/* Preview */}
          {formData.role && (
            <Card className="bg-muted/50">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <AlertCircle className="h-4 w-4" />
                  Code Preview
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-muted-foreground">Role:</span>
                  <Badge variant="outline">{formData.role}</Badge>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-muted-foreground">Usage:</span>
                  <span>{formData.maxUsage === "0" ? "Unlimited" : `${formData.maxUsage} use(s)`}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-muted-foreground">Valid for:</span>
                  <span>{formData.validityDays} day(s)</span>
                </div>
                {formData.permissions.length > 0 && (
                  <div className="flex items-start gap-2 text-sm">
                    <span className="text-muted-foreground">Permissions:</span>
                    <div className="flex flex-wrap gap-1">
                      {formData.permissions.map((permId) => {
                        const perm = PERMISSIONS.find((p) => p.id === permId)
                        return (
                          <Badge key={permId} variant="secondary" className="text-xs">
                            {perm?.label}
                          </Badge>
                        )
                      })}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading || !formData.role}>
              {loading ? "Generating..." : "Generate Code"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

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
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import { useAuth } from "@/contexts/auth-context"
import { collection, addDoc, Timestamp } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { Loader2, Info } from "lucide-react"

interface GenerateInvitationCodeDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

const PREDEFINED_ROLES = [
  { value: "user", label: "User", description: "Basic access to the platform" },
  { value: "editor", label: "Editor", description: "Can create and edit content" },
  { value: "manager", label: "Manager", description: "Can manage teams and projects" },
  { value: "admin", label: "Admin", description: "Full administrative access" },
]

const AVAILABLE_PERMISSIONS = [
  { id: "read_proposals", label: "Read Proposals", description: "View proposal documents" },
  { id: "write_proposals", label: "Write Proposals", description: "Create and edit proposals" },
  { id: "read_clients", label: "Read Clients", description: "View client information" },
  { id: "write_clients", label: "Write Clients", description: "Create and edit client data" },
  { id: "read_inventory", label: "Read Inventory", description: "View inventory items" },
  { id: "write_inventory", label: "Write Inventory", description: "Manage inventory items" },
  { id: "read_analytics", label: "Read Analytics", description: "View reports and analytics" },
  { id: "admin_access", label: "Admin Access", description: "Administrative functions" },
]

export function GenerateInvitationCodeDialog({ open, onOpenChange }: GenerateInvitationCodeDialogProps) {
  const { userData } = useAuth()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    count: 1,
    validityDays: 30,
    usageLimit: 0, // 0 means unlimited
    role: "",
    customRole: "",
    permissions: [] as string[],
    description: "",
  })

  const generateRandomCode = () => {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
    let result = ""
    for (let i = 0; i < 8; i++) {
      if (i === 4) result += "-"
      result += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    return result
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!userData?.companyId) return

    setLoading(true)

    try {
      const finalRole = formData.role === "custom" ? formData.customRole : formData.role

      if (!finalRole) {
        toast.error("Please select or enter a role")
        return
      }

      if (formData.count < 1 || formData.count > 100) {
        toast.error("Number of codes must be between 1 and 100")
        return
      }

      if (formData.validityDays < 1 || formData.validityDays > 365) {
        toast.error("Validity period must be between 1 and 365 days")
        return
      }

      if (formData.usageLimit < 0 || formData.usageLimit > 1000) {
        toast.error("Usage limit must be between 0 and 1000 (0 = unlimited)")
        return
      }

      const expiresAt = new Date()
      expiresAt.setDate(expiresAt.getDate() + formData.validityDays)

      const codes = []
      for (let i = 0; i < formData.count; i++) {
        const codeData = {
          code: generateRandomCode(),
          createdAt: Timestamp.now(),
          expiresAt: Timestamp.fromDate(expiresAt),
          usageLimit: formData.usageLimit,
          usageCount: 0,
          role: finalRole,
          permissions: formData.permissions,
          status: "active",
          createdBy: userData.uid,
          companyId: userData.companyId,
          description: formData.description || null,
          usedBy: [],
        }
        codes.push(codeData)
      }

      // Add all codes to Firestore
      const promises = codes.map((codeData) => addDoc(collection(db, "invitationCodes"), codeData))

      await Promise.all(promises)

      toast.success(`Successfully generated ${formData.count} invitation code${formData.count > 1 ? "s" : ""}`)

      // Reset form
      setFormData({
        count: 1,
        validityDays: 30,
        usageLimit: 0,
        role: "",
        customRole: "",
        permissions: [],
        description: "",
      })

      onOpenChange(false)
    } catch (error) {
      console.error("Error generating codes:", error)
      toast.error("Failed to generate invitation codes")
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

  const selectedRoleData = PREDEFINED_ROLES.find((r) => r.value === formData.role)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Generate Invitation Codes</DialogTitle>
          <DialogDescription>
            Create invitation codes for user registration with specific roles and permissions
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Basic Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="count">Number of Codes</Label>
                  <Input
                    id="count"
                    type="number"
                    min="1"
                    max="100"
                    value={formData.count}
                    onChange={(e) => setFormData((prev) => ({ ...prev, count: Number.parseInt(e.target.value) || 1 }))}
                    required
                  />
                  <p className="text-xs text-muted-foreground">Generate 1-100 codes at once</p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="validity">Validity (Days)</Label>
                  <Input
                    id="validity"
                    type="number"
                    min="1"
                    max="365"
                    value={formData.validityDays}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, validityDays: Number.parseInt(e.target.value) || 30 }))
                    }
                    required
                  />
                  <p className="text-xs text-muted-foreground">How long codes remain valid</p>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="usageLimit">Usage Limit</Label>
                <Input
                  id="usageLimit"
                  type="number"
                  min="0"
                  max="1000"
                  value={formData.usageLimit}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, usageLimit: Number.parseInt(e.target.value) || 0 }))
                  }
                  placeholder="0 for unlimited"
                />
                <p className="text-xs text-muted-foreground">
                  Maximum number of times each code can be used (0 = unlimited)
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Role Selection */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Role Assignment</CardTitle>
              <CardDescription>Select the role for users who register with these codes</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="role">Role</Label>
                <Select
                  value={formData.role}
                  onValueChange={(value) => setFormData((prev) => ({ ...prev, role: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a role" />
                  </SelectTrigger>
                  <SelectContent>
                    {PREDEFINED_ROLES.map((role) => (
                      <SelectItem key={role.value} value={role.value}>
                        <div>
                          <div className="font-medium">{role.label}</div>
                          <div className="text-xs text-muted-foreground">{role.description}</div>
                        </div>
                      </SelectItem>
                    ))}
                    <SelectItem value="custom">
                      <div>
                        <div className="font-medium">Custom Role</div>
                        <div className="text-xs text-muted-foreground">Define a custom role</div>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {formData.role === "custom" && (
                <div className="space-y-2">
                  <Label htmlFor="customRole">Custom Role Name</Label>
                  <Input
                    id="customRole"
                    value={formData.customRole}
                    onChange={(e) => setFormData((prev) => ({ ...prev, customRole: e.target.value }))}
                    placeholder="Enter custom role name"
                    required
                  />
                </div>
              )}

              {selectedRoleData && (
                <div className="p-3 bg-muted rounded-lg">
                  <div className="flex items-center space-x-2">
                    <Info className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">Selected Role: {selectedRoleData.label}</span>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">{selectedRoleData.description}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Permissions */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Permissions</CardTitle>
              <CardDescription>Select specific permissions for this role</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {AVAILABLE_PERMISSIONS.map((permission) => (
                  <div key={permission.id} className="flex items-start space-x-3">
                    <Checkbox
                      id={permission.id}
                      checked={formData.permissions.includes(permission.id)}
                      onCheckedChange={(checked) => handlePermissionChange(permission.id, checked as boolean)}
                    />
                    <div className="space-y-1">
                      <Label htmlFor={permission.id} className="text-sm font-medium cursor-pointer">
                        {permission.label}
                      </Label>
                      <p className="text-xs text-muted-foreground">{permission.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Description */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Additional Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Label htmlFor="description">Description (Optional)</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
                  placeholder="Add a description for these codes..."
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>

          {/* Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium">Codes to generate:</span>
                  <Badge variant="secondary" className="ml-2">
                    {formData.count}
                  </Badge>
                </div>
                <div>
                  <span className="font-medium">Valid for:</span>
                  <Badge variant="secondary" className="ml-2">
                    {formData.validityDays} days
                  </Badge>
                </div>
                <div>
                  <span className="font-medium">Usage limit:</span>
                  <Badge variant="secondary" className="ml-2">
                    {formData.usageLimit === 0 ? "Unlimited" : formData.usageLimit}
                  </Badge>
                </div>
                <div>
                  <span className="font-medium">Role:</span>
                  <Badge variant="outline" className="ml-2">
                    {formData.role === "custom" ? formData.customRole : formData.role}
                  </Badge>
                </div>
              </div>

              {formData.permissions.length > 0 && (
                <div>
                  <span className="font-medium text-sm">Permissions:</span>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {formData.permissions.map((permId) => {
                      const perm = AVAILABLE_PERMISSIONS.find((p) => p.id === permId)
                      return (
                        <Badge key={permId} variant="outline" className="text-xs">
                          {perm?.label}
                        </Badge>
                      )
                    })}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </form>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button type="submit" onClick={handleSubmit} disabled={loading}>
            {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Generate {formData.count} Code{formData.count > 1 ? "s" : ""}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

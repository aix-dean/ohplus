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
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { toast } from "sonner"
import { useAuth } from "@/contexts/auth-context"
import { collection, addDoc, serverTimestamp } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { subscriptionService } from "@/lib/subscription-service"
import { Loader2, Info, AlertTriangle, Users } from "lucide-react"

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
  const { userData, subscriptionData } = useAuth()
  const [loading, setLoading] = useState(false)
  const [userLimitInfo, setUserLimitInfo] = useState<{
    canInvite: boolean
    currentUsers: number
    maxUsers: number
  } | null>(null)
  const [formData, setFormData] = useState({
    validityDays: 30,
    maxUsage: 1, // Default to 1 for single user invitation
    role: "",
    customRole: "",
    permissions: [] as string[],
    description: "",
  })

  // Check user limits when dialog opens
  useEffect(() => {
    const checkUserLimits = async () => {
      if (open && userData?.license_key) {
        try {
          const limitInfo = await subscriptionService.checkUserLimit(userData.license_key)
          setUserLimitInfo(limitInfo)
        } catch (error) {
          console.error("Error checking user limits:", error)
          setUserLimitInfo({ canInvite: false, currentUsers: 0, maxUsers: 0 })
        }
      }
    }

    checkUserLimits()
  }, [open, userData?.license_key])

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
    if (!userData?.company_id || !userData?.license_key) {
      toast.error("Company information not found")
      return
    }

    // Check user limits before generating code
    if (!userLimitInfo?.canInvite) {
      toast.error("User limit reached for your subscription plan")
      return
    }

    setLoading(true)

    try {
      const finalRole = formData.role === "custom" ? formData.customRole : formData.role

      if (!finalRole) {
        toast.error("Please select or enter a role")
        setLoading(false)
        return
      }

      if (formData.validityDays < 1 || formData.validityDays > 365) {
        toast.error("Validity period must be between 1 and 365 days")
        setLoading(false)
        return
      }

      if (formData.maxUsage < 1 || formData.maxUsage > 100) {
        toast.error("Usage limit must be between 1 and 100")
        setLoading(false)
        return
      }

      // Check if the max usage would exceed the remaining user slots
      const remainingSlots = userLimitInfo.maxUsers === -1 ? 999 : userLimitInfo.maxUsers - userLimitInfo.currentUsers
      if (formData.maxUsage > remainingSlots) {
        toast.error(`Usage limit cannot exceed remaining user slots (${remainingSlots})`)
        setLoading(false)
        return
      }

      const expiresAt = new Date()
      expiresAt.setDate(expiresAt.getDate() + formData.validityDays)

      const codeData = {
        code: generateRandomCode(),
        created_at: serverTimestamp(),
        expires_at: expiresAt,
        max_usage: formData.maxUsage,
        usage_count: 0,
        role: finalRole,
        permissions: formData.permissions,
        status: "active",
        created_by: userData.uid,
        company_id: userData.company_id,
        license_key: userData.license_key, // Add license key to track subscription limits
        description: formData.description || null,
        used_by: [],
      }

      await addDoc(collection(db, "invitation_codes"), codeData)

      toast.success("Successfully generated invitation code")

      // Reset form
      setFormData({
        validityDays: 30,
        maxUsage: 1,
        role: "",
        customRole: "",
        permissions: [],
        description: "",
      })

      // Refresh user limit info
      const updatedLimitInfo = await subscriptionService.checkUserLimit(userData.license_key)
      setUserLimitInfo(updatedLimitInfo)

      onOpenChange(false)
    } catch (error) {
      console.error("Error generating code:", error)
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

  const selectedRoleData = PREDEFINED_ROLES.find((r) => r.value === formData.role)

  // Don't render if user limits haven't been loaded yet
  if (open && !userLimitInfo) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-md">
          <div className="flex items-center justify-center py-8">
            <div className="text-center">
              <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
              <p className="text-muted-foreground">Checking subscription limits...</p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Generate Invitation Code</DialogTitle>
          <DialogDescription>
            Create an invitation code for user registration with specific role and permissions
          </DialogDescription>
        </DialogHeader>

        {/* User Limit Information */}
        {userLimitInfo && (
          <Card className="border-l-4 border-l-blue-500">
            <CardContent className="pt-4">
              <div className="flex items-center space-x-2 mb-2">
                <Users className="h-4 w-4 text-blue-500" />
                <span className="font-medium text-sm">User Limit Status</span>
              </div>
              <div className="text-sm text-muted-foreground">
                <p>
                  Current Users: <span className="font-medium">{userLimitInfo.currentUsers}</span> /{" "}
                  <span className="font-medium">
                    {userLimitInfo.maxUsers === -1 ? "Unlimited" : userLimitInfo.maxUsers}
                  </span>
                </p>
                {userLimitInfo.maxUsers !== -1 && (
                  <p>
                    Remaining Slots:{" "}
                    <span className="font-medium">{userLimitInfo.maxUsers - userLimitInfo.currentUsers}</span>
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Warning if user limit reached */}
        {userLimitInfo && !userLimitInfo.canInvite && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              You have reached the user limit for your subscription plan. Please upgrade your plan to invite more users.
            </AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Basic Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
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
                    disabled={!userLimitInfo?.canInvite}
                  />
                  <p className="text-xs text-muted-foreground">How long the code remains valid</p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="maxUsage">Usage Limit</Label>
                  <Input
                    id="maxUsage"
                    type="number"
                    min="1"
                    max={
                      userLimitInfo?.maxUsers === -1
                        ? 100
                        : Math.min(100, userLimitInfo?.maxUsers - userLimitInfo?.currentUsers || 1)
                    }
                    value={formData.maxUsage}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, maxUsage: Number.parseInt(e.target.value) || 1 }))
                    }
                    placeholder="Number of users who can use this code"
                    required
                    disabled={!userLimitInfo?.canInvite}
                  />
                  <p className="text-xs text-muted-foreground">Maximum number of users who can use this code</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Role Selection */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Role Assignment</CardTitle>
              <CardDescription>Select the role for users who register with this code</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="role">Role</Label>
                <Select
                  value={formData.role}
                  onValueChange={(value) => setFormData((prev) => ({ ...prev, role: value }))}
                  disabled={!userLimitInfo?.canInvite}
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
                    disabled={!userLimitInfo?.canInvite}
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
                      disabled={!userLimitInfo?.canInvite}
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
                  placeholder="Add a description for this code..."
                  rows={3}
                  disabled={!userLimitInfo?.canInvite}
                />
              </div>
            </CardContent>
          </Card>

          {/* Summary */}
          <Card className="bg-green-50">
            <CardHeader>
              <CardTitle className="text-lg">Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium">Valid for:</span>
                  <Badge variant="secondary" className="ml-2">
                    {formData.validityDays} days
                  </Badge>
                </div>
                <div>
                  <span className="font-medium">Usage limit:</span>
                  <Badge variant="secondary" className="ml-2">
                    {formData.maxUsage} {formData.maxUsage === 1 ? "user" : "users"}
                  </Badge>
                </div>
                <div className="col-span-2">
                  <span className="font-medium">Role:</span>
                  <Badge variant="outline" className="ml-2">
                    {formData.role === "custom" ? formData.customRole || "Custom" : formData.role || "Not selected"}
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
          <Button type="submit" onClick={handleSubmit} disabled={loading || !userLimitInfo?.canInvite}>
            {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Generate Code
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

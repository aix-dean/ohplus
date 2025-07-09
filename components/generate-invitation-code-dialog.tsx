"use client"

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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { AlertCircle, Plus } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface GenerateInvitationCodeDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onGenerate: (params: {
    count: number
    validityDays: number
    maxUsage: number | null
    role: string
    permissions: string[]
  }) => void
}

const AVAILABLE_PERMISSIONS = [
  { id: "read_proposals", label: "Read Proposals", description: "View proposals and estimates" },
  { id: "write_proposals", label: "Write Proposals", description: "Create and edit proposals" },
  { id: "read_clients", label: "Read Clients", description: "View client information" },
  { id: "write_clients", label: "Write Clients", description: "Create and edit clients" },
  { id: "read_inventory", label: "Read Inventory", description: "View inventory items" },
  { id: "write_inventory", label: "Write Inventory", description: "Manage inventory" },
  { id: "read_analytics", label: "Read Analytics", description: "View reports and analytics" },
  { id: "admin_access", label: "Admin Access", description: "Full administrative access" },
]

const ROLE_PRESETS = {
  user: {
    label: "User",
    description: "Basic user with limited permissions",
    permissions: ["read_proposals", "read_clients"],
  },
  editor: {
    label: "Editor",
    description: "Can create and edit content",
    permissions: ["read_proposals", "write_proposals", "read_clients", "write_clients"],
  },
  manager: {
    label: "Manager",
    description: "Full access except admin functions",
    permissions: [
      "read_proposals",
      "write_proposals",
      "read_clients",
      "write_clients",
      "read_inventory",
      "write_inventory",
      "read_analytics",
    ],
  },
  admin: {
    label: "Admin",
    description: "Full administrative access",
    permissions: AVAILABLE_PERMISSIONS.map((p) => p.id),
  },
  custom: {
    label: "Custom",
    description: "Custom role with selected permissions",
    permissions: [],
  },
}

export function GenerateInvitationCodeDialog({ open, onOpenChange, onGenerate }: GenerateInvitationCodeDialogProps) {
  const [count, setCount] = useState(1)
  const [validityDays, setValidityDays] = useState(30)
  const [maxUsage, setMaxUsage] = useState<number | null>(1)
  const [unlimitedUsage, setUnlimitedUsage] = useState(false)
  const [selectedRole, setSelectedRole] = useState<keyof typeof ROLE_PRESETS>("user")
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>(ROLE_PRESETS.user.permissions)
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (count < 1 || count > 100) {
      newErrors.count = "Count must be between 1 and 100"
    }

    if (validityDays < 1 || validityDays > 365) {
      newErrors.validityDays = "Validity must be between 1 and 365 days"
    }

    if (!unlimitedUsage && (maxUsage === null || maxUsage < 1 || maxUsage > 1000)) {
      newErrors.maxUsage = "Max usage must be between 1 and 1000"
    }

    if (selectedPermissions.length === 0) {
      newErrors.permissions = "At least one permission must be selected"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleRoleChange = (role: keyof typeof ROLE_PRESETS) => {
    setSelectedRole(role)
    if (role !== "custom") {
      setSelectedPermissions(ROLE_PRESETS[role].permissions)
    }
  }

  const handlePermissionChange = (permissionId: string, checked: boolean) => {
    if (checked) {
      setSelectedPermissions((prev) => [...prev, permissionId])
    } else {
      setSelectedPermissions((prev) => prev.filter((id) => id !== permissionId))
    }
    // Switch to custom role if permissions are manually changed
    if (selectedRole !== "custom") {
      setSelectedRole("custom")
    }
  }

  const handleGenerate = async () => {
    if (!validateForm()) return

    setLoading(true)
    try {
      await onGenerate({
        count,
        validityDays,
        maxUsage: unlimitedUsage ? null : maxUsage,
        role: selectedRole,
        permissions: selectedPermissions,
      })
      // Reset form
      setCount(1)
      setValidityDays(30)
      setMaxUsage(1)
      setUnlimitedUsage(false)
      setSelectedRole("user")
      setSelectedPermissions(ROLE_PRESETS.user.permissions)
      setErrors({})
    } catch (error) {
      console.error("Error generating codes:", error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            Generate Invitation Codes
          </DialogTitle>
          <DialogDescription>
            Create invitation codes with specific parameters and permissions for new users.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Basic Parameters */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Basic Parameters</CardTitle>
              <CardDescription>Configure the basic settings for your invitation codes</CardDescription>
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
                    value={count}
                    onChange={(e) => setCount(Number.parseInt(e.target.value) || 1)}
                    className={errors.count ? "border-red-500" : ""}
                  />
                  {errors.count && <p className="text-sm text-red-500">{errors.count}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="validity">Validity (Days)</Label>
                  <Input
                    id="validity"
                    type="number"
                    min="1"
                    max="365"
                    value={validityDays}
                    onChange={(e) => setValidityDays(Number.parseInt(e.target.value) || 30)}
                    className={errors.validityDays ? "border-red-500" : ""}
                  />
                  {errors.validityDays && <p className="text-sm text-red-500">{errors.validityDays}</p>}
                </div>
              </div>

              <div className="space-y-2">
                <Label>Usage Limit</Label>
                <div className="flex items-center space-x-2">
                  <Checkbox id="unlimited" checked={unlimitedUsage} onCheckedChange={setUnlimitedUsage} />
                  <Label htmlFor="unlimited">Unlimited usage</Label>
                </div>
                {!unlimitedUsage && (
                  <Input
                    type="number"
                    min="1"
                    max="1000"
                    value={maxUsage || ""}
                    onChange={(e) => setMaxUsage(Number.parseInt(e.target.value) || null)}
                    placeholder="Max number of uses"
                    className={errors.maxUsage ? "border-red-500" : ""}
                  />
                )}
                {errors.maxUsage && <p className="text-sm text-red-500">{errors.maxUsage}</p>}
              </div>
            </CardContent>
          </Card>

          {/* Role Selection */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Role & Permissions</CardTitle>
              <CardDescription>Select a role preset or customize permissions</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Role Preset</Label>
                <Select value={selectedRole} onValueChange={handleRoleChange}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(ROLE_PRESETS).map(([key, preset]) => (
                      <SelectItem key={key} value={key}>
                        <div>
                          <div className="font-medium">{preset.label}</div>
                          <div className="text-sm text-muted-foreground">{preset.description}</div>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label>Permissions</Label>
                  <Badge variant="outline">{selectedPermissions.length} selected</Badge>
                </div>

                {errors.permissions && (
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{errors.permissions}</AlertDescription>
                  </Alert>
                )}

                <div className="grid grid-cols-1 gap-3 max-h-48 overflow-y-auto border rounded-lg p-3">
                  {AVAILABLE_PERMISSIONS.map((permission) => (
                    <div key={permission.id} className="flex items-start space-x-2">
                      <Checkbox
                        id={permission.id}
                        checked={selectedPermissions.includes(permission.id)}
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
            </CardContent>
          </Card>

          {/* Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Codes to generate:</span>
                  <span className="font-medium">{count}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Valid for:</span>
                  <span className="font-medium">{validityDays} days</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Usage limit:</span>
                  <span className="font-medium">{unlimitedUsage ? "Unlimited" : `${maxUsage} use(s)`}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Role:</span>
                  <span className="font-medium capitalize">{selectedRole}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Permissions:</span>
                  <span className="font-medium">{selectedPermissions.length} selected</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleGenerate} disabled={loading}>
            {loading ? "Generating..." : `Generate ${count} Code${count > 1 ? "s" : ""}`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

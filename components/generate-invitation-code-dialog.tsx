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
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { CalendarDays, Users, FileText, Copy, Check } from "lucide-react"
import { useAuth } from "@/contexts/auth-context"
import { collection, addDoc, serverTimestamp } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { getAllRoles, type RoleType } from "@/lib/hardcoded-access-service"

interface GenerateInvitationCodeDialogProps {
  onSuccess?: () => void
}

export function GenerateInvitationCodeDialog({ onSuccess }: GenerateInvitationCodeDialogProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [validityDays, setValidityDays] = useState("30")
  const [usageLimit, setUsageLimit] = useState("10")
  const [selectedRole, setSelectedRole] = useState<RoleType | "">("")
  const [description, setDescription] = useState("")
  const [generatedCode, setGeneratedCode] = useState("")
  const [copied, setCopied] = useState(false)

  const { userData } = useAuth()
  const roles = getAllRoles()

  const generateRandomCode = () => {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
    let result = ""
    for (let i = 0; i < 8; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    return result
  }

  const handleGenerate = async () => {
    if (!userData || !selectedRole) return

    setLoading(true)
    try {
      const code = generateRandomCode()
      const expiryDate = new Date()
      expiryDate.setDate(expiryDate.getDate() + Number.parseInt(validityDays))

      const invitationData = {
        code,
        created_by: userData.uid,
        created_by_name: `${userData.first_name} ${userData.last_name}`,
        company_id: userData.company_id,
        license_key: userData.license_key,
        role_id: selectedRole, // Store the role ID for automatic assignment
        description: description || `Invitation for ${roles.find((r) => r.id === selectedRole)?.name} role`,
        validity_days: Number.parseInt(validityDays),
        usage_limit: Number.parseInt(usageLimit),
        expiry_date: expiryDate,
        used: false,
        used_count: 0,
        used_by: [],
        created: serverTimestamp(),
      }

      await addDoc(collection(db, "invitation_codes"), invitationData)
      setGeneratedCode(code)
      onSuccess?.()
    } catch (error) {
      console.error("Error generating invitation code:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(generatedCode)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      console.error("Failed to copy:", error)
    }
  }

  const handleClose = () => {
    setOpen(false)
    setGeneratedCode("")
    setSelectedRole("")
    setDescription("")
    setValidityDays("30")
    setUsageLimit("10")
    setCopied(false)
  }

  const selectedRoleData = selectedRole ? roles.find((r) => r.id === selectedRole) : null

  if (generatedCode) {
    return (
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogTrigger asChild>
          <Button>Generate Invitation Code</Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Invitation Code Generated</DialogTitle>
            <DialogDescription>
              Your invitation code has been successfully generated and is ready to share.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <div className="grid flex-1 gap-2">
                <Label htmlFor="code" className="sr-only">
                  Invitation Code
                </Label>
                <Input
                  id="code"
                  value={generatedCode}
                  readOnly
                  className="font-mono text-lg text-center tracking-wider"
                />
              </div>
              <Button type="button" size="sm" className="px-3" onClick={handleCopy}>
                <span className="sr-only">Copy</span>
                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>
            {selectedRoleData && (
              <div className="text-sm text-muted-foreground">
                <p>
                  <strong>Role:</strong> {selectedRoleData.name}
                </p>
                <p>
                  <strong>Valid for:</strong> {validityDays} days
                </p>
                <p>
                  <strong>Usage limit:</strong> {usageLimit} users
                </p>
              </div>
            )}
          </div>
          <DialogFooter className="sm:justify-start">
            <Button type="button" variant="secondary" onClick={handleClose}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>Generate Invitation Code</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Generate Invitation Code</DialogTitle>
          <DialogDescription>
            Create a new invitation code to invite users to join your organization with a specific role.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Basic Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <CalendarDays className="h-5 w-5" />
                Basic Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="validity">Validity (days)</Label>
                  <Input
                    id="validity"
                    type="number"
                    value={validityDays}
                    onChange={(e) => setValidityDays(e.target.value)}
                    min="1"
                    max="365"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="usage">Usage Limit</Label>
                  <Input
                    id="usage"
                    type="number"
                    value={usageLimit}
                    onChange={(e) => setUsageLimit(e.target.value)}
                    min="1"
                    max="1000"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Role Assignment */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Users className="h-5 w-5" />
                Role Assignment
              </CardTitle>
              <CardDescription>
                Select the role that will be automatically assigned to users who register with this invitation code.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="role">Select Role</Label>
                <Select value={selectedRole} onValueChange={(value: RoleType) => setSelectedRole(value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a role for invited users" />
                  </SelectTrigger>
                  <SelectContent>
                    {roles.map((role) => (
                      <SelectItem key={role.id} value={role.id}>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" style={{ borderColor: role.color }}>
                            {role.name}
                          </Badge>
                          <span className="text-sm text-muted-foreground">{role.description}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {selectedRoleData && (
                <div className="p-3 bg-muted rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge style={{ backgroundColor: selectedRoleData.color, color: "white" }}>
                      {selectedRoleData.name}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">{selectedRoleData.description}</p>
                  <div className="mt-2">
                    <p className="text-xs font-medium text-muted-foreground mb-1">Module Access:</p>
                    <div className="flex flex-wrap gap-1">
                      {selectedRoleData.permissions.map((permission, index) => (
                        <Badge key={index} variant="secondary" className="text-xs">
                          {permission.module}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Description */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <FileText className="h-5 w-5" />
                Description
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Label htmlFor="description">Description (Optional)</Label>
                <Textarea
                  id="description"
                  placeholder="Add a description for this invitation code..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>

          {/* Summary */}
          {selectedRole && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Role:</span>
                    <Badge style={{ backgroundColor: selectedRoleData?.color, color: "white" }}>
                      {selectedRoleData?.name}
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Valid for:</span>
                    <span>{validityDays} days</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Usage limit:</span>
                    <span>{usageLimit} users</span>
                  </div>
                  {description && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Description:</span>
                      <span className="text-right max-w-[200px] truncate">{description}</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        <Separator />

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleGenerate} disabled={loading || !selectedRole}>
            {loading ? "Generating..." : "Generate Code"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

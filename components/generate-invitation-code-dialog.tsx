"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Calendar, Users, Clock, FileText, Copy, Check } from "lucide-react"
import { useAuth } from "@/contexts/auth-context"
import { collection, addDoc, serverTimestamp } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { generateInvitationCode } from "@/lib/utils"
import { getAllRoles, type RoleType } from "@/lib/hardcoded-access-service"

interface GenerateInvitationCodeDialogProps {
  isOpen: boolean
  onClose: () => void
  onSuccess?: (code: string) => void
}

export function GenerateInvitationCodeDialog({ isOpen, onClose, onSuccess }: GenerateInvitationCodeDialogProps) {
  const { userData } = useAuth()
  const [isGenerating, setIsGenerating] = useState(false)
  const [generatedCode, setGeneratedCode] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  // Form state
  const [validityDays, setValidityDays] = useState("30")
  const [maxUses, setMaxUses] = useState("10")
  const [selectedRole, setSelectedRole] = useState<RoleType | "">("")
  const [description, setDescription] = useState("")

  const roles = getAllRoles()

  const handleGenerate = async () => {
    if (!userData?.license_key || !selectedRole) return

    setIsGenerating(true)
    try {
      const code = generateInvitationCode()
      const expiresAt = new Date()
      expiresAt.setDate(expiresAt.getDate() + Number.parseInt(validityDays))

      const invitationData = {
        code,
        license_key: userData.license_key,
        company_id: userData.company_id || null,
        role_id: selectedRole, // Save the selected role
        description: description || `Invitation code for ${roles.find((r) => r.id === selectedRole)?.name} role`,
        expires_at: expiresAt,
        max_uses: Number.parseInt(maxUses),
        used_count: 0,
        used: false,
        used_by: [],
        created_by: userData.uid,
        created_by_name: `${userData.first_name} ${userData.last_name}`,
        created: serverTimestamp(),
      }

      await addDoc(collection(db, "invitation_codes"), invitationData)
      setGeneratedCode(code)
      onSuccess?.(code)
    } catch (error) {
      console.error("Error generating invitation code:", error)
    } finally {
      setIsGenerating(false)
    }
  }

  const handleCopy = async () => {
    if (generatedCode) {
      await navigator.clipboard.writeText(generatedCode)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const handleClose = () => {
    setGeneratedCode(null)
    setValidityDays("30")
    setMaxUses("10")
    setSelectedRole("")
    setDescription("")
    setCopied(false)
    onClose()
  }

  const selectedRoleData = roles.find((r) => r.id === selectedRole)

  if (generatedCode) {
    return (
      <Dialog open={isOpen} onOpenChange={handleClose}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Check className="h-5 w-5 text-green-600" />
              Invitation Code Generated
            </DialogTitle>
            <DialogDescription>
              Your invitation code has been successfully generated and is ready to share.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <Card>
              <CardContent className="pt-6">
                <div className="text-center space-y-4">
                  <div className="bg-gray-50 p-4 rounded-lg border-2 border-dashed border-gray-300">
                    <code className="text-2xl font-mono font-bold text-blue-600">{generatedCode}</code>
                  </div>
                  <Button onClick={handleCopy} variant="outline" className="w-full bg-transparent">
                    {copied ? (
                      <>
                        <Check className="h-4 w-4 mr-2" />
                        Copied!
                      </>
                    ) : (
                      <>
                        <Copy className="h-4 w-4 mr-2" />
                        Copy Code
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>

            <div className="text-sm text-gray-600 space-y-2">
              <p>
                <strong>Role:</strong> {selectedRoleData?.name}
              </p>
              <p>
                <strong>Valid for:</strong> {validityDays} days
              </p>
              <p>
                <strong>Max uses:</strong> {maxUses}
              </p>
              {description && (
                <p>
                  <strong>Description:</strong> {description}
                </p>
              )}
            </div>

            <div className="flex justify-end">
              <Button onClick={handleClose}>Done</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Generate Invitation Code</DialogTitle>
          <DialogDescription>
            Create an invitation code that allows new users to join your organization with a specific role.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Basic Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Basic Settings
              </CardTitle>
              <CardDescription>Configure the validity and usage limits for this invitation code.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="validity">Valid for (days)</Label>
                  <Input
                    id="validity"
                    type="number"
                    min="1"
                    max="365"
                    value={validityDays}
                    onChange={(e) => setValidityDays(e.target.value)}
                    placeholder="30"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="maxUses">Maximum uses</Label>
                  <Input
                    id="maxUses"
                    type="number"
                    min="1"
                    max="1000"
                    value={maxUses}
                    onChange={(e) => setMaxUses(e.target.value)}
                    placeholder="10"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Role Assignment */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Users className="h-5 w-5" />
                Role Assignment
              </CardTitle>
              <CardDescription>
                Select the role that will be assigned to users who register with this code.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="role">Assign Role</Label>
                <Select value={selectedRole} onValueChange={(value: RoleType) => setSelectedRole(value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a role to assign" />
                  </SelectTrigger>
                  <SelectContent>
                    {roles.map((role) => (
                      <SelectItem key={role.id} value={role.id}>
                        <div className="flex items-center gap-2">
                          <Badge
                            variant="secondary"
                            style={{ backgroundColor: `var(--${role.color}-100)`, color: `var(--${role.color}-800)` }}
                          >
                            {role.name}
                          </Badge>
                          <span className="text-sm text-gray-600">{role.description}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {selectedRoleData && (
                <div className="p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge
                      style={{
                        backgroundColor: `var(--${selectedRoleData.color}-100)`,
                        color: `var(--${selectedRoleData.color}-800)`,
                      }}
                    >
                      {selectedRoleData.name}
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-600">{selectedRoleData.description}</p>
                  <div className="mt-2">
                    <p className="text-xs font-medium text-gray-700 mb-1">Access to modules:</p>
                    <div className="flex flex-wrap gap-1">
                      {selectedRoleData.permissions.map((permission, index) => (
                        <Badge key={index} variant="outline" className="text-xs">
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
              <CardTitle className="text-lg flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Description
              </CardTitle>
              <CardDescription>Add an optional description for this invitation code.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Label htmlFor="description">Description (optional)</Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="e.g., Invitation for new sales team members"
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>

          {/* Summary */}
          {selectedRole && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Summary
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Role:</span>
                    <Badge
                      style={{
                        backgroundColor: `var(--${selectedRoleData?.color}-100)`,
                        color: `var(--${selectedRoleData?.color}-800)`,
                      }}
                    >
                      {selectedRoleData?.name}
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Valid for:</span>
                    <span>{validityDays} days</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Maximum uses:</span>
                    <span>{maxUses}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Expires on:</span>
                    <span>
                      {new Date(Date.now() + Number.parseInt(validityDays) * 24 * 60 * 60 * 1000).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        <Separator />

        <div className="flex justify-end space-x-2">
          <Button variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          <Button onClick={handleGenerate} disabled={isGenerating || !selectedRole}>
            {isGenerating ? "Generating..." : "Generate Code"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

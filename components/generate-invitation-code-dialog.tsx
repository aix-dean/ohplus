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
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Copy, Check, Calendar, Users, Shield, FileText } from "lucide-react"
import { collection, addDoc, serverTimestamp } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { useAuth } from "@/contexts/auth-context"
import { getAllRoles, type RoleType } from "@/lib/hardcoded-access-service"

interface GenerateInvitationCodeDialogProps {
  isOpen: boolean
  onClose: () => void
  onSuccess?: (code: string) => void
}

export function GenerateInvitationCodeDialog({ isOpen, onClose, onSuccess }: GenerateInvitationCodeDialogProps) {
  const { userData } = useAuth()
  const [isGenerating, setIsGenerating] = useState(false)
  const [generatedCode, setGeneratedCode] = useState("")
  const [copied, setCopied] = useState(false)

  // Form state
  const [validityDays, setValidityDays] = useState("30")
  const [maxUses, setMaxUses] = useState("10")
  const [selectedRole, setSelectedRole] = useState<RoleType | "">("")
  const [description, setDescription] = useState("")

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
    if (!selectedRole) {
      alert("Please select a role for the invitation code")
      return
    }

    setIsGenerating(true)
    try {
      const code = generateRandomCode()
      const expiresAt = new Date()
      expiresAt.setDate(expiresAt.getDate() + Number.parseInt(validityDays))

      const invitationData = {
        code,
        role: selectedRole,
        description: description || `Invitation for ${roles.find((r) => r.id === selectedRole)?.name} role`,
        max_uses: Number.parseInt(maxUses),
        used_count: 0,
        used: false,
        expires_at: expiresAt,
        created_by: userData?.uid,
        created_by_name: `${userData?.first_name || ""} ${userData?.last_name || ""}`.trim(),
        license_key: userData?.license_key,
        company_id: userData?.company_id,
        created: serverTimestamp(),
      }

      await addDoc(collection(db, "invitation_codes"), invitationData)
      setGeneratedCode(code)
      onSuccess?.(code)
    } catch (error) {
      console.error("Error generating invitation code:", error)
      alert("Failed to generate invitation code. Please try again.")
    } finally {
      setIsGenerating(false)
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
    setGeneratedCode("")
    setValidityDays("30")
    setMaxUses("10")
    setSelectedRole("")
    setDescription("")
    setCopied(false)
    onClose()
  }

  const selectedRoleData = selectedRole ? roles.find((r) => r.id === selectedRole) : null

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Generate Invitation Code
          </DialogTitle>
          <DialogDescription>
            Create an invitation code for new team members to join your organization with a specific role.
          </DialogDescription>
        </DialogHeader>

        {!generatedCode ? (
          <div className="space-y-6">
            {/* Basic Settings */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Calendar className="h-4 w-4" />
                  Basic Settings
                </CardTitle>
                <CardDescription>Configure the invitation code validity and usage limits</CardDescription>
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
                      max="100"
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
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Users className="h-4 w-4" />
                  Role Assignment
                </CardTitle>
                <CardDescription>
                  Select the role that will be assigned to users who register with this code
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="role">Role</Label>
                  <Select value={selectedRole} onValueChange={(value) => setSelectedRole(value as RoleType)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a role" />
                    </SelectTrigger>
                    <SelectContent>
                      {roles.map((role) => (
                        <SelectItem key={role.id} value={role.id}>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" style={{ borderColor: role.color, color: role.color }}>
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
                    <p className="text-sm text-muted-foreground mb-2">{selectedRoleData.description}</p>
                    <div className="text-xs text-muted-foreground">
                      <strong>Modules:</strong> {selectedRoleData.permissions.map((p) => p.module).join(", ")}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Description */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <FileText className="h-4 w-4" />
                  Description
                </CardTitle>
                <CardDescription>Optional description for this invitation code</CardDescription>
              </CardHeader>
              <CardContent>
                <Textarea
                  placeholder="e.g., Invitation for new sales team members"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                />
              </CardContent>
            </Card>

            {/* Summary */}
            {selectedRole && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
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
                    <span className="text-muted-foreground">Max uses:</span>
                    <span>{maxUses} times</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Expires on:</span>
                    <span>
                      {new Date(Date.now() + Number.parseInt(validityDays) * 24 * 60 * 60 * 1000).toLocaleDateString()}
                    </span>
                  </div>
                </CardContent>
              </Card>
            )}

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={handleClose}>
                Cancel
              </Button>
              <Button onClick={handleGenerate} disabled={isGenerating || !selectedRole}>
                {isGenerating ? "Generating..." : "Generate Code"}
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            <Alert>
              <Check className="h-4 w-4" />
              <AlertDescription>Invitation code generated successfully!</AlertDescription>
            </Alert>

            <Card>
              <CardHeader>
                <CardTitle>Your Invitation Code</CardTitle>
                <CardDescription>Share this code with the people you want to invite</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2 p-4 bg-muted rounded-lg">
                  <code className="flex-1 text-2xl font-mono font-bold tracking-wider">{generatedCode}</code>
                  <Button size="sm" variant="outline" onClick={handleCopy}>
                    {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Code Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
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
                  <span className="text-muted-foreground">Max uses:</span>
                  <span>{maxUses} times</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Expires on:</span>
                  <span>
                    {new Date(Date.now() + Number.parseInt(validityDays) * 24 * 60 * 60 * 1000).toLocaleDateString()}
                  </span>
                </div>
                {description && (
                  <div className="pt-2">
                    <span className="text-muted-foreground">Description:</span>
                    <p className="mt-1 text-sm">{description}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            <div className="flex justify-end">
              <Button onClick={handleClose}>Done</Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}

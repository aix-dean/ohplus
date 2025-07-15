"use client"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Copy, Check, Calendar, Users, Shield, FileText } from "lucide-react"
import { collection, addDoc, serverTimestamp } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { useAuth } from "@/contexts/auth-context"
import { getAllRoles, type RoleType } from "@/lib/hardcoded-access-service"

interface GenerateInvitationCodeDialogProps {
  isOpen: boolean
  onClose: () => void
  onCodeGenerated: (code: string) => void
}

export function GenerateInvitationCodeDialog({ isOpen, onClose, onCodeGenerated }: GenerateInvitationCodeDialogProps) {
  const { userData } = useAuth()
  const [isGenerating, setIsGenerating] = useState(false)
  const [generatedCode, setGeneratedCode] = useState("")
  const [isCopied, setIsCopied] = useState(false)

  // Form states
  const [validityDays, setValidityDays] = useState("30")
  const [maxUses, setMaxUses] = useState("10")
  const [selectedRole, setSelectedRole] = useState<RoleType | "">("")
  const [description, setDescription] = useState("")

  const roles = getAllRoles()

  const generateRandomCode = () => {
    const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
    let result = ""
    for (let i = 0; i < 8; i++) {
      result += characters.charAt(Math.floor(Math.random() * characters.length))
    }
    return result
  }

  const handleGenerate = async () => {
    if (!userData) return

    setIsGenerating(true)
    try {
      const code = generateRandomCode()
      const expiresAt = new Date()
      expiresAt.setDate(expiresAt.getDate() + Number.parseInt(validityDays))

      const invitationData = {
        code,
        created_by: userData.uid,
        created_by_name: `${userData.first_name} ${userData.last_name}`,
        license_key: userData.license_key,
        company_id: userData.company_id,
        role: selectedRole || null, // Store the selected role
        expires_at: expiresAt,
        max_uses: Number.parseInt(maxUses),
        used_count: 0,
        used: false,
        description:
          description ||
          `Invitation code for ${selectedRole ? roles.find((r) => r.id === selectedRole)?.name : "team members"}`,
        created: serverTimestamp(),
      }

      await addDoc(collection(db, "invitation_codes"), invitationData)

      setGeneratedCode(code)
      onCodeGenerated(code)
    } catch (error) {
      console.error("Error generating invitation code:", error)
    } finally {
      setIsGenerating(false)
    }
  }

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(generatedCode)
      setIsCopied(true)
      setTimeout(() => setIsCopied(false), 2000)
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
    setIsCopied(false)
    onClose()
  }

  const selectedRoleData = selectedRole ? roles.find((r) => r.id === selectedRole) : null

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Generate Invitation Code
          </DialogTitle>
          <DialogDescription>
            Create an invitation code for new team members to join your organization.
          </DialogDescription>
        </DialogHeader>

        {!generatedCode ? (
          <div className="space-y-6">
            {/* Basic Settings */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Basic Settings
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="validity">Valid for (days)</Label>
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
                    <Label htmlFor="maxUses">Maximum uses</Label>
                    <Input
                      id="maxUses"
                      type="number"
                      value={maxUses}
                      onChange={(e) => setMaxUses(e.target.value)}
                      min="1"
                      max="100"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Role Assignment */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Role Assignment
                </CardTitle>
                <CardDescription>
                  Select the role that will be automatically assigned to users who register with this code.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="role">Assign Role</Label>
                  <Select value={selectedRole} onValueChange={(value) => setSelectedRole(value as RoleType)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a role to assign" />
                    </SelectTrigger>
                    <SelectContent>
                      {roles.map((role) => (
                        <SelectItem key={role.id} value={role.id}>
                          <div className="flex items-center gap-2">
                            <Badge
                              variant="outline"
                              className={`w-3 h-3 rounded-full p-0 bg-${role.color}-500 border-${role.color}-500`}
                            />
                            {role.name}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {selectedRoleData && (
                  <div className="p-3 bg-muted rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge
                        variant="outline"
                        className={`bg-${selectedRoleData.color}-100 text-${selectedRoleData.color}-800 border-${selectedRoleData.color}-300`}
                      >
                        {selectedRoleData.name}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">{selectedRoleData.description}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Description */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Description
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <Label htmlFor="description">Description (optional)</Label>
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
            {(validityDays || maxUses || selectedRole) && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="text-sm space-y-1">
                    <p>
                      <strong>Valid for:</strong> {validityDays} days
                    </p>
                    <p>
                      <strong>Maximum uses:</strong> {maxUses}
                    </p>
                    {selectedRoleData && (
                      <p className="flex items-center gap-2">
                        <strong>Assigned role:</strong>
                        <Badge
                          variant="outline"
                          className={`bg-${selectedRoleData.color}-100 text-${selectedRoleData.color}-800 border-${selectedRoleData.color}-300`}
                        >
                          {selectedRoleData.name}
                        </Badge>
                      </p>
                    )}
                    {description && (
                      <p>
                        <strong>Description:</strong> {description}
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        ) : (
          <div className="space-y-6">
            <Card>
              <CardHeader className="text-center">
                <CardTitle className="text-xl text-green-600">Code Generated Successfully!</CardTitle>
                <CardDescription>
                  Share this code with team members to invite them to your organization.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-center p-6 bg-gray-50 rounded-lg">
                  <div className="text-center">
                    <div className="text-3xl font-mono font-bold tracking-wider text-gray-900 mb-2">
                      {generatedCode}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleCopy}
                      className="flex items-center gap-2 bg-transparent"
                    >
                      {isCopied ? (
                        <>
                          <Check className="h-4 w-4" />
                          Copied!
                        </>
                      ) : (
                        <>
                          <Copy className="h-4 w-4" />
                          Copy Code
                        </>
                      )}
                    </Button>
                  </div>
                </div>

                <Separator />

                <div className="space-y-2 text-sm">
                  <p>
                    <strong>Valid for:</strong> {validityDays} days
                  </p>
                  <p>
                    <strong>Maximum uses:</strong> {maxUses}
                  </p>
                  {selectedRoleData && (
                    <p className="flex items-center gap-2">
                      <strong>Assigned role:</strong>
                      <Badge
                        variant="outline"
                        className={`bg-${selectedRoleData.color}-100 text-${selectedRoleData.color}-800 border-${selectedRoleData.color}-300`}
                      >
                        {selectedRoleData.name}
                      </Badge>
                    </p>
                  )}
                  {description && (
                    <p>
                      <strong>Description:</strong> {description}
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        <DialogFooter>
          {!generatedCode ? (
            <>
              <Button variant="outline" onClick={handleClose}>
                Cancel
              </Button>
              <Button onClick={handleGenerate} disabled={isGenerating || !selectedRole}>
                {isGenerating ? "Generating..." : "Generate Code"}
              </Button>
            </>
          ) : (
            <Button onClick={handleClose}>Close</Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

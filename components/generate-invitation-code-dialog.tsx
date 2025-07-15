"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Copy, Plus, Users, Calendar, Shield } from "lucide-react"
import { toast } from "sonner"
import { generateInvitationCode } from "@/lib/utils"
import { useAuth } from "@/contexts/auth-context"
import { collection, addDoc, serverTimestamp } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { getAllRoles, type RoleType } from "@/lib/hardcoded-access-service"

interface GenerateInvitationCodeDialogProps {
  onCodeGenerated?: () => void
}

export function GenerateInvitationCodeDialog({ onCodeGenerated }: GenerateInvitationCodeDialogProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [generatedCode, setGeneratedCode] = useState<string | null>(null)

  // Form state
  const [validityDays, setValidityDays] = useState("30")
  const [usageLimit, setUsageLimit] = useState("1")
  const [selectedRole, setSelectedRole] = useState<RoleType | "">("")
  const [description, setDescription] = useState("")

  const { userData } = useAuth()
  const roles = getAllRoles()

  const handleGenerateCode = async () => {
    if (!userData?.license_key || !userData?.company_id) {
      toast.error("Missing license key or company information")
      return
    }

    if (!selectedRole) {
      toast.error("Please select a role for this invitation")
      return
    }

    setLoading(true)
    try {
      const code = generateInvitationCode()
      const expiryDate = new Date()
      expiryDate.setDate(expiryDate.getDate() + Number.parseInt(validityDays))

      const invitationData = {
        code,
        license_key: userData.license_key,
        company_id: userData.company_id,
        role_id: selectedRole,
        description: description || `Invitation for ${selectedRole} role`,
        created_by: userData.uid,
        created_at: serverTimestamp(),
        expires_at: expiryDate,
        usage_limit: Number.parseInt(usageLimit),
        used_count: 0,
        used: false,
        active: true,
      }

      await addDoc(collection(db, "invitation_codes"), invitationData)

      setGeneratedCode(code)
      toast.success("Invitation code generated successfully!")
      onCodeGenerated?.()
    } catch (error) {
      console.error("Error generating invitation code:", error)
      toast.error("Failed to generate invitation code")
    } finally {
      setLoading(false)
    }
  }

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      toast.success("Copied to clipboard!")
    } catch (error) {
      toast.error("Failed to copy to clipboard")
    }
  }

  const handleClose = () => {
    setOpen(false)
    setGeneratedCode(null)
    setValidityDays("30")
    setUsageLimit("1")
    setSelectedRole("")
    setDescription("")
  }

  const selectedRoleData = selectedRole ? roles.find((role) => role.id === selectedRole) : null

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <Plus className="h-4 w-4" />
          Generate Code
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Generate Invitation Code</DialogTitle>
          <DialogDescription>
            Create a new invitation code to invite users to your organization with a specific role.
          </DialogDescription>
        </DialogHeader>

        {!generatedCode ? (
          <div className="space-y-6">
            {/* Basic Settings */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Calendar className="h-5 w-5" />
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
                      min="1"
                      max="365"
                      value={validityDays}
                      onChange={(e) => setValidityDays(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="usage">Usage Limit</Label>
                    <Input
                      id="usage"
                      type="number"
                      min="1"
                      max="100"
                      value={usageLimit}
                      onChange={(e) => setUsageLimit(e.target.value)}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Role Assignment */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Shield className="h-5 w-5" />
                  Role Assignment
                </CardTitle>
                <CardDescription>
                  Select the role that will be automatically assigned to users who register with this code.
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
                            <div className={`w-3 h-3 rounded-full bg-${role.color}-500`} />
                            <span>{role.name}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {selectedRoleData && (
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge className={`bg-${selectedRoleData.color}-100 text-${selectedRoleData.color}-800`}>
                        {selectedRoleData.name}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-600">{selectedRoleData.description}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Description */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Users className="h-5 w-5" />
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
            <Card>
              <CardHeader>
                <CardTitle>Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Validity:</span>
                    <span>{validityDays} days</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Usage Limit:</span>
                    <span>
                      {usageLimit} use{Number.parseInt(usageLimit) > 1 ? "s" : ""}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Assigned Role:</span>
                    <span>{selectedRoleData ? selectedRoleData.name : "None selected"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Description:</span>
                    <span className="text-right max-w-[200px] truncate">{description || "No description"}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={handleClose}>
                Cancel
              </Button>
              <Button onClick={handleGenerateCode} disabled={loading || !selectedRole}>
                {loading ? "Generating..." : "Generate Code"}
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-center text-green-600">Code Generated Successfully!</CardTitle>
                <CardDescription className="text-center">
                  Share this code with users you want to invite to your organization.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-center p-6 bg-gray-50 rounded-lg">
                  <div className="text-center">
                    <div className="text-3xl font-mono font-bold text-gray-900 mb-2">{generatedCode}</div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => copyToClipboard(generatedCode)}
                      className="gap-2"
                    >
                      <Copy className="h-4 w-4" />
                      Copy Code
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <h4 className="font-medium">Registration URL:</h4>
                  <div className="p-3 bg-gray-50 rounded border">
                    <code className="text-sm break-all">
                      {typeof window !== "undefined" ? window.location.origin : ""}/register?orgCode={generatedCode}
                    </code>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() =>
                        copyToClipboard(
                          `${typeof window !== "undefined" ? window.location.origin : ""}/register?orgCode=${generatedCode}`,
                        )
                      }
                      className="ml-2 h-6 w-6 p-0"
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                  </div>
                </div>

                {selectedRoleData && (
                  <div className="p-3 bg-blue-50 rounded-lg">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-medium text-blue-800">Assigned Role:</span>
                      <Badge className={`bg-${selectedRoleData.color}-100 text-${selectedRoleData.color}-800`}>
                        {selectedRoleData.name}
                      </Badge>
                    </div>
                    <p className="text-xs text-blue-600">
                      Users who register with this code will automatically be assigned the {selectedRoleData.name} role.
                    </p>
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

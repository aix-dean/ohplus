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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Copy, Plus, Calendar, Users, FileText } from "lucide-react"
import { useAuth } from "@/contexts/auth-context"
import { addDoc, collection, serverTimestamp } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { generateInvitationCode } from "@/lib/utils"
import { toast } from "@/hooks/use-toast"
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
  const [generatedCode, setGeneratedCode] = useState<string | null>(null)

  const { userData } = useAuth()
  const roles = getAllRoles()

  const handleGenerate = async () => {
    if (!userData?.license_key) {
      toast({
        title: "Error",
        description: "License key not found. Please contact support.",
        variant: "destructive",
      })
      return
    }

    if (!selectedRole) {
      toast({
        title: "Error",
        description: "Please select a role for the invitation code.",
        variant: "destructive",
      })
      return
    }

    setLoading(true)
    try {
      const code = generateInvitationCode()
      const expiresAt = new Date()
      expiresAt.setDate(expiresAt.getDate() + Number.parseInt(validityDays))

      const invitationData = {
        code,
        license_key: userData.license_key,
        company_id: userData.company_id || null,
        role: selectedRole, // Save the selected role
        description: description || `Invitation for ${roles.find((r) => r.id === selectedRole)?.name} role`,
        validity_days: Number.parseInt(validityDays),
        usage_limit: Number.parseInt(usageLimit),
        expires_at: expiresAt,
        used: false,
        used_count: 0,
        used_by: [],
        created_by: userData.uid,
        created_at: serverTimestamp(),
      }

      await addDoc(collection(db, "invitation_codes"), invitationData)

      setGeneratedCode(code)
      toast({
        title: "Success",
        description: "Invitation code generated successfully!",
      })

      if (onSuccess) {
        onSuccess()
      }
    } catch (error) {
      console.error("Error generating invitation code:", error)
      toast({
        title: "Error",
        description: "Failed to generate invitation code. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleCopyCode = () => {
    if (generatedCode) {
      const inviteUrl = `${window.location.origin}/register?orgCode=${generatedCode}`
      navigator.clipboard.writeText(inviteUrl)
      toast({
        title: "Copied!",
        description: "Invitation link copied to clipboard.",
      })
    }
  }

  const handleClose = () => {
    setOpen(false)
    setGeneratedCode(null)
    setSelectedRole("")
    setDescription("")
    setValidityDays("30")
    setUsageLimit("10")
  }

  const selectedRoleData = selectedRole ? roles.find((r) => r.id === selectedRole) : null

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Generate Code
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Generate Invitation Code</DialogTitle>
          <DialogDescription>Create a new invitation code to invite users to join your organization.</DialogDescription>
        </DialogHeader>

        {!generatedCode ? (
          <div className="space-y-6">
            {/* Basic Settings */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="validity">
                  <Calendar className="inline mr-1 h-4 w-4" />
                  Validity (Days)
                </Label>
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
                <Label htmlFor="usage">
                  <Users className="inline mr-1 h-4 w-4" />
                  Usage Limit
                </Label>
                <Input
                  id="usage"
                  type="number"
                  value={usageLimit}
                  onChange={(e) => setUsageLimit(e.target.value)}
                  min="1"
                  max="100"
                />
              </div>
            </div>

            {/* Role Assignment */}
            <div className="space-y-2">
              <Label htmlFor="role">
                <Users className="inline mr-1 h-4 w-4" />
                Assign Role
              </Label>
              <Select value={selectedRole} onValueChange={(value: RoleType) => setSelectedRole(value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a role to assign" />
                </SelectTrigger>
                <SelectContent>
                  {roles.map((role) => (
                    <SelectItem key={role.id} value={role.id}>
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: role.color }} />
                        <span>{role.name}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {selectedRoleData && <p className="text-sm text-muted-foreground">{selectedRoleData.description}</p>}
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description">
                <FileText className="inline mr-1 h-4 w-4" />
                Description (Optional)
              </Label>
              <Textarea
                id="description"
                placeholder="Brief description of this invitation..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
              />
            </div>

            {/* Summary */}
            {selectedRole && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Invitation Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Role:</span>
                    <Badge style={{ backgroundColor: selectedRoleData?.color, color: "white" }}>
                      {selectedRoleData?.name}
                    </Badge>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Valid for:</span>
                    <span>{validityDays} days</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Usage limit:</span>
                    <span>{usageLimit} users</span>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-green-600">Invitation Code Generated!</CardTitle>
                <CardDescription>Share this link with users you want to invite to your organization.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Invitation Code</Label>
                  <div className="flex gap-2">
                    <Input value={generatedCode} readOnly className="font-mono" />
                    <Button size="sm" onClick={handleCopyCode}>
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Invitation Link</Label>
                  <div className="flex gap-2">
                    <Input
                      value={`${window.location.origin}/register?orgCode=${generatedCode}`}
                      readOnly
                      className="font-mono text-xs"
                    />
                    <Button size="sm" onClick={handleCopyCode}>
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                {selectedRoleData && (
                  <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
                    <Users className="h-4 w-4" />
                    <span className="text-sm">Users will be assigned the</span>
                    <Badge style={{ backgroundColor: selectedRoleData.color, color: "white" }}>
                      {selectedRoleData.name}
                    </Badge>
                    <span className="text-sm">role upon registration</span>
                  </div>
                )}
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
              <Button onClick={handleGenerate} disabled={loading || !selectedRole}>
                {loading ? "Generating..." : "Generate Code"}
              </Button>
            </>
          ) : (
            <Button onClick={handleClose}>Done</Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import { useAuth } from "@/contexts/auth-context"
import { collection, addDoc, serverTimestamp } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { Loader2, UserPlus, Send } from "lucide-react"
import { getAllRoles, type HardcodedRole } from "@/lib/hardcoded-access-service"

interface AddUserDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
}

export function AddUserDialog({ open, onOpenChange, onSuccess }: AddUserDialogProps) {
  const { userData } = useAuth()
  const [loading, setLoading] = useState(false)
  const [roles] = useState<HardcodedRole[]>(getAllRoles())
  const [formData, setFormData] = useState({
    recipientEmail: "",
    recipientName: "",
    role: "admin", // Change default to admin since that's one of the hardcoded roles
    subject: `Invitation to join ${userData?.companyName || "our organization"}`,
    message: `You've been invited to join our organization. Use the invitation code below to register your account and start collaborating with our team.`,
    validityDays: 30,
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
    if (!userData?.company_id) {
      toast.error("Company information not found")
      return
    }

    if (!formData.recipientEmail) {
      toast.error("Please enter an email address")
      return
    }

    setLoading(true)

    try {
      // Generate invitation code
      const invitationCode = generateRandomCode()
      const expiresAt = new Date()
      expiresAt.setDate(expiresAt.getDate() + formData.validityDays)

      const codeData = {
        code: invitationCode,
        created_at: serverTimestamp(),
        expires_at: expiresAt,
        max_usage: 1, // Single use for direct invitations
        usage_count: 0,
        role: formData.role,
        permissions: [], // Can be extended based on role
        status: "active",
        created_by: userData.uid,
        company_id: userData.company_id,
        description: `Direct invitation for ${formData.recipientEmail}`,
        used_by: [],
        invited_email: formData.recipientEmail, // Track who this was sent to
      }

      // Save invitation code to Firestore
      await addDoc(collection(db, "invitation_codes"), codeData)

      // Send invitation email
      const registrationUrl = `${process.env.NEXT_PUBLIC_APP_URL}/register?code=${invitationCode}`

      const response = await fetch("/api/invitations/send-email", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          recipientEmail: formData.recipientEmail,
          recipientName: formData.recipientName,
          subject: formData.subject,
          message: formData.message,
          invitationCode: invitationCode,
          registrationUrl,
          senderName: userData?.displayName || userData?.email,
          companyName: userData?.companyName || "OH Plus",
          role: formData.role,
          expiresAt: expiresAt.toLocaleDateString(),
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to send email")
      }

      toast.success(`Invitation sent successfully to ${formData.recipientEmail}`)

      // Reset form
      setFormData({
        recipientEmail: "",
        recipientName: "",
        role: "admin",
        subject: `Invitation to join ${userData?.companyName || "our organization"}`,
        message: `You've been invited to join our organization. Use the invitation code below to register your account and start collaborating with our team.`,
        validityDays: 30,
      })

      onSuccess?.()
      onOpenChange(false)
    } catch (error) {
      console.error("Error sending invitation:", error)
      toast.error("Failed to send invitation. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const selectedRoleData = roles.find((r) => r.id === formData.role)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <UserPlus className="h-5 w-5" />
            <span>Add New User</span>
          </DialogTitle>
          <DialogDescription>
            Send an invitation email to a new user with a registration link and access code
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* User Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">User Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="recipientEmail">Email Address *</Label>
                <Input
                  id="recipientEmail"
                  type="email"
                  value={formData.recipientEmail}
                  onChange={(e) => setFormData((prev) => ({ ...prev, recipientEmail: e.target.value }))}
                  placeholder="user@example.com"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="recipientName">Full Name</Label>
                <Input
                  id="recipientName"
                  type="text"
                  value={formData.recipientName}
                  onChange={(e) => setFormData((prev) => ({ ...prev, recipientName: e.target.value }))}
                  placeholder="John Doe"
                />
                <p className="text-xs text-muted-foreground">Optional - used for personalization</p>
              </div>

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
                    {roles.map((role) => (
                      <SelectItem key={role.id} value={role.id}>
                        <div>
                          <div className="font-medium">{role.name}</div>
                          <div className="text-xs text-muted-foreground">{role.description}</div>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {selectedRoleData && (
                  <div className="p-3 bg-muted rounded-lg">
                    <div className="flex items-center space-x-2">
                      <Badge variant="outline">{selectedRoleData.name}</Badge>
                      <span className="text-sm text-muted-foreground">{selectedRoleData.description}</span>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Email Content */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Invitation Email</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="subject">Subject Line</Label>
                <Input
                  id="subject"
                  type="text"
                  value={formData.subject}
                  onChange={(e) => setFormData((prev) => ({ ...prev, subject: e.target.value }))}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="message">Personal Message</Label>
                <Textarea
                  id="message"
                  value={formData.message}
                  onChange={(e) => setFormData((prev) => ({ ...prev, message: e.target.value }))}
                  placeholder="Add a personal message to the invitation..."
                  rows={4}
                />
                <p className="text-xs text-muted-foreground">
                  This message will be included in the email along with the invitation code and registration
                  instructions
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="validity">Code Validity (Days)</Label>
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
                <p className="text-xs text-muted-foreground">How long the invitation code remains valid</p>
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
                  <span className="font-medium">Email:</span>
                  <span className="ml-2">{formData.recipientEmail || "Not specified"}</span>
                </div>
                <div>
                  <span className="font-medium">Role:</span>
                  <Badge variant="outline" className="ml-2">
                    {selectedRoleData?.name || formData.role}
                  </Badge>
                </div>
                <div>
                  <span className="font-medium">Valid for:</span>
                  <Badge variant="secondary" className="ml-2">
                    {formData.validityDays} days
                  </Badge>
                </div>
                <div>
                  <span className="font-medium">Usage:</span>
                  <Badge variant="secondary" className="ml-2">
                    Single use
                  </Badge>
                </div>
              </div>

              <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                <p className="text-sm text-blue-800">
                  <strong>📧 What happens next:</strong>
                  <br />
                  1. An invitation code will be generated automatically
                  <br />
                  2. An email will be sent to {formData.recipientEmail || "the recipient"} with the registration link
                  <br />
                  3. They can click the link to register with the pre-filled invitation code
                  <br />
                  4. Once registered, they'll have {selectedRoleData?.name || formData.role} access to your organization
                </p>
              </div>
            </CardContent>
          </Card>
        </form>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button type="submit" onClick={handleSubmit} disabled={loading}>
            {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            <Send className="h-4 w-4 mr-2" />
            Send Invitation
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { toast } from "sonner"
import { useAuth } from "@/contexts/auth-context"
import { Loader2, Send, User } from "lucide-react"

interface AddUserInvitationDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  invitationCode: string
  onSuccess?: () => void
}

export default function AddUserInvitationDialog({
  open,
  onOpenChange,
  invitationCode,
  onSuccess,
}: AddUserInvitationDialogProps) {
  const { userData } = useAuth()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    recipientEmail: "",
    recipientName: "",
    subject: `Invitation to join ${userData?.companyName || "our organization"}`,
    message: `You've been invited to join our team! Please use the invitation code below to create your account and get started.`,
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.recipientEmail) {
      toast.error("Please enter the recipient's email address")
      return
    }

    setLoading(true)

    try {
      const registrationUrl = `${window.location.origin}/register?code=${invitationCode}`

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
          role: "user",
          expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString(), // 30 days from now
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
        subject: `Invitation to join ${userData?.companyName || "our organization"}`,
        message: `You've been invited to join our team! Please use the invitation code below to create your account and get started.`,
      })

      onOpenChange(false)
      onSuccess?.()
    } catch (error) {
      console.error("Error sending email:", error)
      toast.error("Failed to send invitation email. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <User className="h-5 w-5" />
            <span>Invite New User</span>
          </DialogTitle>
          <DialogDescription>Send an invitation email to add a new user to your organization</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Invitation Code Display */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Generated Invitation Code</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="bg-muted p-3 rounded-md text-center">
                <code className="text-lg font-mono font-bold">{invitationCode}</code>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                This code will be automatically included in the invitation email
              </p>
            </CardContent>
          </Card>

          {/* Recipient Information */}
          <div className="space-y-4">
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
              <Label htmlFor="recipientName">Full Name (Optional)</Label>
              <Input
                id="recipientName"
                type="text"
                value={formData.recipientName}
                onChange={(e) => setFormData((prev) => ({ ...prev, recipientName: e.target.value }))}
                placeholder="John Doe"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="subject">Email Subject</Label>
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
                placeholder="Add a personal message..."
                rows={3}
              />
            </div>
          </div>

          {/* Email Preview */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Email Preview</CardTitle>
              <CardDescription className="text-xs">Preview of what the recipient will see</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="border rounded-md p-3 bg-muted/30 space-y-2 text-sm">
                <div className="border-b pb-2 mb-2">
                  <div className="font-medium">{formData.subject}</div>
                  <div className="text-xs text-muted-foreground">
                    To: {formData.recipientEmail || "recipient@example.com"}
                  </div>
                </div>

                <p>Hello {formData.recipientName || "there"},</p>
                <p>{formData.message}</p>

                <div className="bg-white p-2 rounded border">
                  <p className="font-medium text-xs">Your invitation code:</p>
                  <code className="font-mono bg-gray-100 px-1 py-0.5 rounded text-sm">{invitationCode}</code>
                </div>

                <p className="text-xs">Click the registration link in the email to get started!</p>
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

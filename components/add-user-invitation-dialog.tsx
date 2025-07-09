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
import { Card, CardContent } from "@/components/ui/card"
import { Copy, Mail, Loader2 } from "lucide-react"
import { toast } from "sonner"

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
  const [email, setEmail] = useState("")
  const [name, setName] = useState("")
  const [subject, setSubject] = useState("You're invited to join our team")
  const [message, setMessage] = useState(
    "You've been invited to join our team. Click the link below to create your account and get started.",
  )
  const [isLoading, setIsLoading] = useState(false)

  const registrationLink = `${process.env.NEXT_PUBLIC_APP_URL}/register?code=${invitationCode}`

  const handleCopyCode = () => {
    navigator.clipboard.writeText(invitationCode)
    toast.success("Invitation code copied to clipboard!")
  }

  const handleCopyLink = () => {
    navigator.clipboard.writeText(registrationLink)
    toast.success("Registration link copied to clipboard!")
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email.trim()) {
      toast.error("Please enter an email address")
      return
    }

    setIsLoading(true)

    try {
      const response = await fetch("/api/invitations/send-email", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: email.trim(),
          name: name.trim() || "Team Member",
          subject,
          message,
          invitationCode,
          registrationLink,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to send invitation")
      }

      toast.success("Invitation sent successfully!")
      onSuccess?.()
      onOpenChange(false)

      // Reset form
      setEmail("")
      setName("")
      setSubject("You're invited to join our team")
      setMessage("You've been invited to join our team. Click the link below to create your account and get started.")
    } catch (error) {
      console.error("Error sending invitation:", error)
      toast.error(error instanceof Error ? error.message : "Failed to send invitation")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Send User Invitation
          </DialogTitle>
          <DialogDescription>
            Send an invitation email with the registration link to add a new user to your organization.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Invitation Code Display */}
          <Card>
            <CardContent className="p-4">
              <div className="space-y-3">
                <div>
                  <Label className="text-sm font-medium">Generated Invitation Code</Label>
                  <div className="flex items-center gap-2 mt-1">
                    <code className="flex-1 px-3 py-2 bg-muted rounded-md font-mono text-sm">{invitationCode}</code>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleCopyCode}
                      className="shrink-0 bg-transparent"
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <div>
                  <Label className="text-sm font-medium">Registration Link</Label>
                  <div className="flex items-center gap-2 mt-1">
                    <code className="flex-1 px-3 py-2 bg-muted rounded-md text-xs break-all">{registrationLink}</code>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleCopyLink}
                      className="shrink-0 bg-transparent"
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Email Form */}
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="email">Email Address *</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="user@example.com"
                  required
                />
              </div>
              <div>
                <Label htmlFor="name">Recipient Name</Label>
                <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="John Doe" />
              </div>
            </div>

            <div>
              <Label htmlFor="subject">Email Subject</Label>
              <Input
                id="subject"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="You're invited to join our team"
              />
            </div>

            <div>
              <Label htmlFor="message">Custom Message</Label>
              <Textarea
                id="message"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Add a personal message..."
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Mail className="h-4 w-4 mr-2" />
                  Send Invitation
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

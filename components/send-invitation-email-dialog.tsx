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
import { toast } from "@/components/ui/use-toast"
import { Mail, Send } from "lucide-react"
import { useAuth } from "@/contexts/auth-context"

interface SendInvitationEmailDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  organizationCode: string
}

export function SendInvitationEmailDialog({ open, onOpenChange, organizationCode }: SendInvitationEmailDialogProps) {
  const { userData } = useAuth()
  const [email, setEmail] = useState("")
  const [senderName, setSenderName] = useState(userData?.display_name || "")
  const [companyName, setCompanyName] = useState("")
  const [sending, setSending] = useState(false)

  const handleSendInvitation = async () => {
    if (!email.trim()) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Please enter an email address.",
      })
      return
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Please enter a valid email address.",
      })
      return
    }

    try {
      setSending(true)

      const response = await fetch("/api/invitations/send-email", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: email.trim(),
          organizationCode,
          senderName: senderName.trim(),
          companyName: companyName.trim(),
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to send invitation")
      }

      toast({
        title: "Invitation Sent!",
        description: `Invitation email has been sent to ${email}`,
      })

      // Reset form and close dialog
      setEmail("")
      setSenderName(userData?.display_name || "")
      setCompanyName("")
      onOpenChange(false)
    } catch (error) {
      console.error("Error sending invitation:", error)
      toast({
        variant: "destructive",
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to send invitation email",
      })
    } finally {
      setSending(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Send Invitation Email
          </DialogTitle>
          <DialogDescription>
            Send an invitation email with the organization code <strong>{organizationCode}</strong> to invite someone to
            join your organization.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email Address *</Label>
            <Input
              id="email"
              type="email"
              placeholder="Enter recipient's email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={sending}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="senderName">Your Name</Label>
            <Input
              id="senderName"
              type="text"
              placeholder="Your name (optional)"
              value={senderName}
              onChange={(e) => setSenderName(e.target.value)}
              disabled={sending}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="companyName">Company/Organization Name</Label>
            <Input
              id="companyName"
              type="text"
              placeholder="Your company name (optional)"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              disabled={sending}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={sending}>
            Cancel
          </Button>
          <Button onClick={handleSendInvitation} disabled={sending}>
            {sending ? (
              <>
                <div className="h-4 w-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2"></div>
                Sending...
              </>
            ) : (
              <>
                <Send className="h-4 w-4 mr-2" />
                Send Invitation
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

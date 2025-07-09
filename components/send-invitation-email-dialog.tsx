"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Mail, Send } from "lucide-react"
import { toast } from "@/components/ui/use-toast"

interface SendInvitationEmailDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  organizationCode: string
}

export function SendInvitationEmailDialog({ open, onOpenChange, organizationCode }: SendInvitationEmailDialogProps) {
  const [email, setEmail] = useState("")
  const [senderName, setSenderName] = useState("")
  const [companyName, setCompanyName] = useState("")
  const [sending, setSending] = useState(false)

  const handleSendInvitation = async () => {
    if (!email || !email.includes("@")) {
      toast({
        variant: "destructive",
        title: "Invalid Email",
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
          email,
          senderName,
          companyName,
          organizationCode,
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || "Failed to send invitation")
      }

      toast({
        title: "Invitation Sent!",
        description: `Organization invitation has been sent to ${email}`,
      })

      // Reset form and close dialog
      setEmail("")
      setSenderName("")
      setCompanyName("")
      onOpenChange(false)
    } catch (error) {
      console.error("Error sending invitation:", error)
      toast({
        variant: "destructive",
        title: "Failed to Send",
        description: error instanceof Error ? error.message : "Failed to send invitation email.",
      })
    } finally {
      setSending(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Send Invitation Email
          </DialogTitle>
          <DialogDescription>
            Send an invitation email with the organization code: <strong>{organizationCode}</strong>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Recipient Email *</Label>
            <Input
              id="email"
              type="email"
              placeholder="colleague@company.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="senderName">Your Name</Label>
            <Input
              id="senderName"
              placeholder="John Doe"
              value={senderName}
              onChange={(e) => setSenderName(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="companyName">Company Name</Label>
            <Input
              id="companyName"
              placeholder="Acme Corporation"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
            />
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={() => onOpenChange(false)} disabled={sending}>
              Cancel
            </Button>
            <Button onClick={handleSendInvitation} disabled={sending || !email}>
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
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

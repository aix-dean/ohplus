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
  code: string
}

export function SendInvitationEmailDialog({ open, onOpenChange, code }: SendInvitationEmailDialogProps) {
  const { userData } = useAuth()
  const [recipientEmail, setRecipientEmail] = useState("")
  const [sending, setSending] = useState(false)

  const handleSendInvitation = async () => {
    if (!recipientEmail.trim()) {
      toast({
        variant: "destructive",
        title: "Email Required",
        description: "Please enter a recipient email address.",
      })
      return
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(recipientEmail)) {
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
          code,
          recipientEmail: recipientEmail.trim(),
          senderName: userData?.display_name || `${userData?.first_name} ${userData?.last_name}`,
          companyName: "OH Plus Organization", // You can make this dynamic based on company data
        }),
      })

      const result = await response.json()

      if (result.success) {
        toast({
          title: "Invitation Sent!",
          description: `Invitation email has been sent to ${recipientEmail}`,
        })
        setRecipientEmail("")
        onOpenChange(false)
      } else {
        toast({
          variant: "destructive",
          title: "Failed to Send Invitation",
          description: result.error || "An error occurred while sending the invitation.",
        })
      }
    } catch (error) {
      console.error("Error sending invitation:", error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to send invitation. Please try again.",
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
            Send an invitation email with the registration code <span className="font-mono font-semibold">{code}</span>{" "}
            to a new team member.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="recipient-email">Recipient Email Address</Label>
            <Input
              id="recipient-email"
              type="email"
              placeholder="colleague@company.com"
              value={recipientEmail}
              onChange={(e) => setRecipientEmail(e.target.value)}
              disabled={sending}
            />
          </div>
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={sending}>
            Cancel
          </Button>
          <Button onClick={handleSendInvitation} disabled={sending || !recipientEmail.trim()}>
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

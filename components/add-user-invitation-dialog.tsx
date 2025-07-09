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
import { toast } from "sonner"

interface AddUserInvitationDialogProps {
  isOpen: boolean
  onClose: () => void
  invitationCode: string
}

export default function AddUserInvitationDialog({ isOpen, onClose, invitationCode }: AddUserInvitationDialogProps) {
  const [email, setEmail] = useState("")
  const [name, setName] = useState("")
  const [subject, setSubject] = useState("Invitation to join OH Plus")
  const [message, setMessage] = useState(
    "You have been invited to join our team at OH Plus. Please use the invitation code below to register your account.",
  )
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!email) {
      toast.error("Please enter an email address")
      return
    }

    setIsLoading(true)

    try {
      const registrationUrl = `${process.env.NEXT_PUBLIC_APP_URL}/register?code=${invitationCode}`

      const response = await fetch("/api/invitations/send-email", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          recipientEmail: email,
          recipientName: name,
          subject,
          message,
          invitationCode,
          registrationUrl,
          senderName: "OH Plus Team",
          companyName: "OH Plus",
          role: "User",
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString(),
        }),
      })

      const result = await response.json()

      if (response.ok) {
        toast.success("Invitation sent successfully!")
        onClose()
        // Reset form
        setEmail("")
        setName("")
        setSubject("Invitation to join OH Plus")
        setMessage(
          "You have been invited to join our team at OH Plus. Please use the invitation code below to register your account.",
        )
      } else {
        toast.error(result.error || "Failed to send invitation")
      }
    } catch (error) {
      console.error("Error sending invitation:", error)
      toast.error("Failed to send invitation")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Send User Invitation</DialogTitle>
          <DialogDescription>
            Send an invitation email with the registration link and invitation code.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="invitation-code">Invitation Code</Label>
            <Input id="invitation-code" value={invitationCode} readOnly className="bg-gray-50 font-mono" />
          </div>

          <div className="space-y-2">
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

          <div className="space-y-2">
            <Label htmlFor="name">Recipient Name (Optional)</Label>
            <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="John Doe" />
          </div>

          <div className="space-y-2">
            <Label htmlFor="subject">Email Subject</Label>
            <Input
              id="subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Invitation to join OH Plus"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="message">Message</Label>
            <Textarea
              id="message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Enter your invitation message..."
              rows={3}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Sending..." : "Send Invitation"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Mail } from "lucide-react"
import { toast } from "@/components/ui/use-toast"
import { useAuth } from "@/contexts/auth-context"

interface SendInvitationEmailDialogProps {
  code: string
  trigger?: React.ReactNode
}

export function SendInvitationEmailDialog({ code, trigger }: SendInvitationEmailDialogProps) {
  const [email, setEmail] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [open, setOpen] = useState(false)
  const { userData } = useAuth()

  const handleSendEmail = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (!email.trim()) {
      setError("Please enter an email address")
      return
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      setError("Please enter a valid email address")
      return
    }

    setLoading(true)
    try {
      const response = await fetch("/api/invitations/send-email", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: email.trim(),
          code,
          senderName: userData?.display_name || `${userData?.first_name} ${userData?.last_name}`,
          companyName: userData?.company_id || "OH Plus",
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to send email")
      }

      toast({
        title: "Invitation Sent!",
        description: `Organization invitation has been sent to ${email}`,
      })

      setOpen(false)
      setEmail("")
    } catch (error: any) {
      console.error("Error sending email:", error)
      setError(error.message || "Failed to send invitation email")
    } finally {
      setLoading(false)
    }
  }

  const defaultTrigger = (
    <Button variant="outline" size="sm" className="flex items-center gap-1 bg-transparent">
      <Mail className="h-3 w-3" />
      Email
    </Button>
  )

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger || defaultTrigger}</DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Send Invitation Email</DialogTitle>
          <DialogDescription>
            Send an invitation email with the organization code{" "}
            <code className="bg-gray-100 px-1 py-0.5 rounded text-sm font-mono">{code}</code>
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSendEmail} className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <Label htmlFor="email">Recipient Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="Enter email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading}
            />
          </div>

          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              className="flex-1"
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading || !email.trim()} className="flex-1">
              {loading ? (
                <>
                  <div className="h-4 w-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2"></div>
                  Sending...
                </>
              ) : (
                <>
                  <Mail className="h-4 w-4 mr-2" />
                  Send Invitation
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

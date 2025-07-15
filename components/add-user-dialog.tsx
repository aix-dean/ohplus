"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Card, CardContent } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Copy, Mail, User, RefreshCw } from "lucide-react"
import { toast } from "@/components/ui/use-toast"
import { useAuth } from "@/contexts/auth-context"

interface AddUserDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
}

export function AddUserDialog({ open, onOpenChange, onSuccess }: AddUserDialogProps) {
  const { userData } = useAuth()
  const [loading, setLoading] = useState(false)
  const [step, setStep] = useState<"form" | "preview" | "sent">("form")

  // Form data
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    role: "user",
  })

  // Email content
  const [emailContent, setEmailContent] = useState({
    subject: "You're invited to join our team!",
    message: `Hi there!

You've been invited to join our team. Please use the registration code below to create your account and get started.

We're excited to have you on board!

Best regards,
The Team`,
  })

  // Generated invitation code
  const [invitationCode, setInvitationCode] = useState("")

  const generateInvitationCode = () => {
    const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
    let result = ""
    for (let i = 0; i < 8; i++) {
      if (i === 4) result += "-"
      result += characters.charAt(Math.floor(Math.random() * characters.length))
    }
    setInvitationCode(result)
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleEmailContentChange = (field: string, value: string) => {
    setEmailContent((prev) => ({ ...prev, [field]: value }))
  }

  const handleNext = () => {
    if (!formData.firstName || !formData.lastName || !formData.email) {
      toast({
        variant: "destructive",
        title: "Missing Information",
        description: "Please fill in all required fields.",
      })
      return
    }

    // Generate invitation code if not already generated
    if (!invitationCode) {
      generateInvitationCode()
    }

    setStep("preview")
  }

  const handleSendInvitation = async () => {
    setLoading(true)

    try {
      // Construct the registration URL using environment variable
      const registrationUrl = `${process.env.NEXT_PUBLIC_APP_URL}/register?code=${invitationCode}`

      // Prepare email data
      const emailData = {
        to: formData.email,
        subject: emailContent.subject,
        firstName: formData.firstName,
        lastName: formData.lastName,
        message: emailContent.message,
        invitationCode,
        registrationUrl,
        senderName: userData?.displayName || userData?.display_name || "Team Member",
        companyName: userData?.company_name || "Our Company",
      }

      // Send the invitation email
      const response = await fetch("/api/invitations/send-email", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(emailData),
      })

      if (!response.ok) {
        throw new Error("Failed to send invitation")
      }

      setStep("sent")
      onSuccess?.()

      toast({
        title: "Invitation Sent!",
        description: `Invitation email has been sent to ${formData.email}`,
      })
    } catch (error) {
      console.error("Error sending invitation:", error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to send invitation. Please try again.",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    setStep("form")
    setFormData({
      firstName: "",
      lastName: "",
      email: "",
      role: "user",
    })
    setEmailContent({
      subject: "You're invited to join our team!",
      message: `Hi there!

You've been invited to join our team. Please use the registration code below to create your account and get started.

We're excited to have you on board!

Best regards,
The Team`,
    })
    setInvitationCode("")
    onOpenChange(false)
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    toast({
      title: "Copied!",
      description: "Text copied to clipboard",
    })
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            {step === "form" && "Add New User"}
            {step === "preview" && "Review Invitation"}
            {step === "sent" && "Invitation Sent"}
          </DialogTitle>
          <DialogDescription>
            {step === "form" && "Enter user details and customize the invitation email"}
            {step === "preview" && "Review the invitation details before sending"}
            {step === "sent" && "The invitation has been sent successfully"}
          </DialogDescription>
        </DialogHeader>

        {step === "form" && (
          <div className="space-y-6">
            {/* User Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">User Information</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName">First Name *</Label>
                  <Input
                    id="firstName"
                    value={formData.firstName}
                    onChange={(e) => handleInputChange("firstName", e.target.value)}
                    placeholder="John"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Last Name *</Label>
                  <Input
                    id="lastName"
                    value={formData.lastName}
                    onChange={(e) => handleInputChange("lastName", e.target.value)}
                    placeholder="Doe"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email Address *</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange("email", e.target.value)}
                  placeholder="john.doe@example.com"
                />
              </div>
            </div>

            <Separator />

            {/* Email Content */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Email Content</h3>
              <div className="space-y-2">
                <Label htmlFor="subject">Subject Line</Label>
                <Input
                  id="subject"
                  value={emailContent.subject}
                  onChange={(e) => handleEmailContentChange("subject", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="message">Message</Label>
                <Textarea
                  id="message"
                  value={emailContent.message}
                  onChange={(e) => handleEmailContentChange("message", e.target.value)}
                  rows={6}
                  placeholder="Enter your invitation message..."
                />
              </div>
            </div>

            <Separator />

            {/* Invitation Code */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium">Registration Code</h3>
                <Button variant="outline" size="sm" onClick={generateInvitationCode} className="gap-2 bg-transparent">
                  <RefreshCw className="h-4 w-4" />
                  Generate New
                </Button>
              </div>
              <div className="flex items-center gap-2">
                <Input
                  value={invitationCode}
                  readOnly
                  placeholder="Click 'Generate New' to create a code"
                  className="font-mono"
                />
                {invitationCode && (
                  <Button variant="outline" size="sm" onClick={() => copyToClipboard(invitationCode)}>
                    <Copy className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
          </div>
        )}

        {step === "preview" && (
          <div className="space-y-6">
            {/* User Details */}
            <Card>
              <CardContent className="pt-6">
                <h3 className="font-medium mb-4">User Details</h3>
                <div className="space-y-2 text-sm">
                  <div>
                    <strong>Name:</strong> {formData.firstName} {formData.lastName}
                  </div>
                  <div>
                    <strong>Email:</strong> {formData.email}
                  </div>
                  <div>
                    <strong>Role:</strong> {formData.role}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Email Preview */}
            <Card>
              <CardContent className="pt-6">
                <h3 className="font-medium mb-4">Email Preview</h3>
                <div className="space-y-4 text-sm">
                  <div>
                    <strong>Subject:</strong> {emailContent.subject}
                  </div>
                  <div className="border rounded p-4 bg-gray-50">
                    <div className="whitespace-pre-wrap">{emailContent.message}</div>
                    <div className="mt-4 p-3 bg-blue-50 rounded border-l-4 border-blue-400">
                      <div>
                        <strong>Registration Code:</strong>{" "}
                        <code className="font-mono bg-white px-2 py-1 rounded">{invitationCode}</code>
                      </div>
                      <div className="mt-2">
                        <strong>Registration Link:</strong>
                      </div>
                      <div className="text-blue-600 break-all">
                        {process.env.NEXT_PUBLIC_APP_URL}/register?code={invitationCode}
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {step === "sent" && (
          <div className="text-center space-y-4 py-8">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
              <Mail className="h-8 w-8 text-green-600" />
            </div>
            <div>
              <h3 className="text-lg font-medium">Invitation Sent Successfully!</h3>
              <p className="text-muted-foreground mt-2">
                An invitation email has been sent to <strong>{formData.email}</strong>
              </p>
            </div>
            <Card>
              <CardContent className="pt-6">
                <div className="space-y-2 text-sm">
                  <div>
                    <strong>Registration Code:</strong>
                  </div>
                  <div className="flex items-center gap-2">
                    <code className="font-mono bg-gray-100 px-3 py-2 rounded flex-1">{invitationCode}</code>
                    <Button variant="outline" size="sm" onClick={() => copyToClipboard(invitationCode)}>
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="mt-4">
                    <strong>Registration URL:</strong>
                    <div className="flex items-center gap-2 mt-1">
                      <Input
                        value={`${process.env.NEXT_PUBLIC_APP_URL}/register?code=${invitationCode}`}
                        readOnly
                        className="text-xs"
                      />
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          copyToClipboard(`${process.env.NEXT_PUBLIC_APP_URL}/register?code=${invitationCode}`)
                        }
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        <DialogFooter>
          {step === "form" && (
            <>
              <Button variant="outline" onClick={handleClose}>
                Cancel
              </Button>
              <Button onClick={handleNext}>Next</Button>
            </>
          )}
          {step === "preview" && (
            <>
              <Button variant="outline" onClick={() => setStep("form")}>
                Back
              </Button>
              <Button onClick={handleSendInvitation} disabled={loading}>
                {loading ? "Sending..." : "Send Invitation"}
              </Button>
            </>
          )}
          {step === "sent" && <Button onClick={handleClose}>Done</Button>}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

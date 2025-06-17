"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Copy, Mail, PhoneIcon as Whatsapp, MessageSquare, Phone, Loader2, ArrowLeft } from "lucide-react"
import Image from "next/image"
import { useToast } from "@/hooks/use-toast"
import { sendProposalEmail, updateProposalStatus } from "@/lib/proposal-service"
import type { Proposal } from "@/lib/types/proposal"

interface SendProposalDialogProps {
  isOpen: boolean
  onClose: () => void
  proposal: Proposal
  onProposalSent: (proposalId: string, newStatus: Proposal["status"]) => void
}

// Helper function to generate QR code URL
const generateQRCodeUrl = (proposalId: string) => {
  const proposalViewUrl = `${process.env.NEXT_PUBLIC_APP_URL}/proposals/view/${proposalId}`
  return `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(proposalViewUrl)}`
}

export function SendProposalDialog({ isOpen, onClose, proposal, onProposalSent }: SendProposalDialogProps) {
  const { toast } = useToast()
  const [emailComposeMode, setEmailComposeMode] = useState(false)
  const [emailSubject, setEmailSubject] = useState(
    `Secure Proposal: ${proposal.title || "Custom Advertising Solution"} - OH Plus`,
  )
  const [emailBody, setEmailBody] =
    useState(`Dear ${proposal.client?.contactPerson || proposal.client?.company || "Valued Client"},

We are excited to present you with a customized advertising proposal tailored to your specific needs. Our team has carefully crafted this proposal to help you achieve your marketing objectives.

You can view the full proposal online here: ${process.env.NEXT_PUBLIC_APP_URL}/proposals/view/${proposal.id}

Your secure access code is: ${proposal.password || "SECURE123"}

We believe this proposal offers excellent value and aligns perfectly with your advertising goals. Our team is ready to discuss any questions you may have and work with you to bring this campaign to life.

Thank you for considering OH Plus as your advertising partner. We look forward to creating something amazing together!

Best regards,
The OH Plus Team`)
  const [isSending, setIsSending] = useState(false)
  const [sendingStep, setSendingStep] = useState("")

  useEffect(() => {
    if (isOpen) {
      // Reset state when dialog opens
      setEmailComposeMode(false)
      setEmailSubject(`Secure Proposal: ${proposal.title || "Custom Advertising Solution"} - OH Plus`)
      setEmailBody(`Dear ${proposal.client?.contactPerson || proposal.client?.company || "Valued Client"},

We are excited to present you with a customized advertising proposal tailored to your specific needs. Our team has carefully crafted this proposal to help you achieve your marketing objectives.

You can view the full proposal online here: ${process.env.NEXT_PUBLIC_APP_URL}/proposals/view/${proposal.id}

Your secure access code is: ${proposal.password || "SECURE123"}

We believe this proposal offers excellent value and aligns perfectly with your advertising goals. Our team is ready to discuss any questions you may have and work with you to bring this campaign to life.

Thank you for considering OH Plus as your advertising partner. We look forward to creating something amazing together!

Best regards,
The OH Plus Team`)
      setIsSending(false)
      setSendingStep("")
    }
  }, [isOpen, proposal])

  const proposalViewUrl = `${process.env.NEXT_PUBLIC_APP_URL}/proposals/view/${proposal.id}`

  const handleCopyLink = () => {
    navigator.clipboard.writeText(proposalViewUrl)
    toast({
      title: "Link Copied!",
      description: "The proposal link has been copied to your clipboard.",
    })
  }

  const handleSendEmail = async () => {
    if (!proposal.client?.email) {
      toast({
        title: "Client Email Missing",
        description: "The client email address is not available for this proposal.",
        variant: "destructive",
      })
      return
    }

    setIsSending(true)
    try {
      setSendingStep("Preparing email...")
      await new Promise((resolve) => setTimeout(resolve, 500))

      setSendingStep("Sending email to client...")
      await sendProposalEmail(proposal, proposal.client.email, emailSubject, emailBody)

      setSendingStep("Updating proposal status...")
      await updateProposalStatus(proposal.id, "sent")
      onProposalSent(proposal.id, "sent") // Notify parent component

      toast({
        title: "Proposal sent successfully!",
        description: `Your proposal has been sent to ${proposal.client.email}.`,
      })
      onClose()
    } catch (error) {
      console.error("Error sending proposal email:", error)
      toast({
        title: "Error",
        description: "Failed to send proposal email. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSending(false)
      setSendingStep("")
    }
  }

  const handleWhatsapp = () => {
    const message = `Hello ${proposal.client?.contactPerson || proposal.client?.company || "Valued Client"}, here is your proposal from OH Plus: ${proposalViewUrl}. Your access code is: ${proposal.password || "SECURE123"}`
    const whatsappUrl = `https://wa.me/${proposal.client?.phone}?text=${encodeURIComponent(message)}`
    window.open(whatsappUrl, "_blank")
    toast({
      title: "Opening WhatsApp",
      description: "Please send the pre-filled message to the client.",
    })
  }

  const handleViber = () => {
    const message = `Hello ${proposal.client?.contactPerson || proposal.client?.company || "Valued Client"}, here is your proposal from OH Plus: ${proposalViewUrl}. Your access code is: ${proposal.password || "SECURE123"}`
    // Viber does not have a direct web intent for pre-filled messages like WhatsApp.
    // This will typically just open the Viber app.
    const viberUrl = `viber://chat?number=${proposal.client?.phone}&text=${encodeURIComponent(message)}`
    window.open(viberUrl, "_blank")
    toast({
      title: "Opening Viber",
      description: "You may need to manually paste the proposal link and access code.",
    })
  }

  const handleMessenger = () => {
    // Messenger requires a Facebook Page ID or User ID for direct chat links.
    // For a generic link, it's often just the m.me link to a page.
    // For this example, we'll just show a toast.
    toast({
      title: "Messenger Integration",
      description:
        "Direct Messenger integration requires specific setup (e.g., Facebook Page ID). Please share the link manually.",
    })
    navigator.clipboard.writeText(proposalViewUrl)
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl">
        {" "}
        {/* Increased max-width to 2xl */}
        <DialogHeader>
          <DialogTitle>{emailComposeMode ? "Compose Email" : "Send Proposal"}</DialogTitle>
          {!emailComposeMode && (
            <DialogDescription>Share the proposal with your client through their preferred channel.</DialogDescription>
          )}
        </DialogHeader>
        {!emailComposeMode ? (
          <div className="grid gap-4 py-4">
            <Card className="flex items-center p-4 gap-4">
              <div className="relative w-20 h-20 flex-shrink-0 rounded-md overflow-hidden">
                <Image
                  src={proposal.products?.[0]?.media?.[0]?.url || "/placeholder.svg?height=80&width=80&query=billboard"}
                  alt="Proposal thumbnail"
                  layout="fill"
                  objectFit="cover"
                />
              </div>
              <div className="flex-1 flex flex-col gap-1 min-w-0">
                <p className="text-sm text-gray-500">{proposal.id}</p>
                <h4 className="font-semibold text-base line-clamp-2">{proposal.title}</h4>
              </div>
            </Card>

            <div className="flex items-center justify-between text-sm text-blue-600 w-full">
              {" "}
              {/* Added w-full */}
              <div className="flex-grow min-w-0 pr-2">
                <a
                  href={proposalViewUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="truncate hover:underline block"
                >
                  {proposalViewUrl}
                </a>
              </div>
              <Button variant="ghost" size="sm" onClick={handleCopyLink} className="flex-shrink-0">
                <Copy className="h-4 w-4 mr-1" /> Copy Link
              </Button>
            </div>

            <Separator />

            <div className="grid grid-cols-4 gap-4 text-center">
              <Button
                variant="ghost"
                className="flex flex-col h-auto py-3 w-full"
                onClick={() => setEmailComposeMode(true)}
              >
                {" "}
                {/* Added w-full */}
                <Mail className="h-6 w-6 mb-1 text-blue-500 mx-auto" /> {/* Added mx-auto for icon centering */}
                <span className="text-xs">Email</span>
              </Button>
              <Button variant="ghost" className="flex flex-col h-auto py-3 w-full" onClick={handleWhatsapp}>
                {" "}
                {/* Added w-full */}
                <Whatsapp className="h-6 w-6 mb-1 text-green-500 mx-auto" /> {/* Added mx-auto for icon centering */}
                <span className="text-xs">Whatsapp</span>
              </Button>
              <Button variant="ghost" className="flex flex-col h-auto py-3 w-full" onClick={handleViber}>
                {" "}
                {/* Added w-full */}
                <Phone className="h-6 w-6 mb-1 text-purple-500 mx-auto" />{" "}
                {/* Using Phone for Viber as no specific icon, added mx-auto */}
                <span className="text-xs">Viber</span>
              </Button>
              <Button variant="ghost" className="flex flex-col h-auto py-3 w-full" onClick={handleMessenger}>
                {" "}
                {/* Added w-full */}
                <MessageSquare className="h-6 w-6 mb-1 text-blue-700 mx-auto" />{" "}
                {/* Added mx-auto for icon centering */}
                <span className="text-xs">Messenger</span>
              </Button>
            </div>
          </div>
        ) : (
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="to-email">To</Label>
              <Input id="to-email" value={proposal.client?.email || ""} readOnly />
            </div>
            <div className="space-y-2">
              <Label htmlFor="subject">Subject</Label>
              <Input id="subject" value={emailSubject} onChange={(e) => setEmailSubject(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="message">Message</Label>
              <Textarea id="message" value={emailBody} onChange={(e) => setEmailBody(e.target.value)} rows={8} />
            </div>
            <div className="flex justify-between mt-4">
              <Button variant="outline" onClick={() => setEmailComposeMode(false)} disabled={isSending}>
                <ArrowLeft className="h-4 w-4 mr-2" /> Back
              </Button>
              <Button onClick={handleSendEmail} disabled={isSending}>
                {isSending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    <div className="flex flex-col items-start">
                      <span className="text-xs">Sending...</span>
                      {sendingStep && <span className="text-xs opacity-80">{sendingStep}</span>}
                    </div>
                  </>
                ) : (
                  "Send Email"
                )}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}

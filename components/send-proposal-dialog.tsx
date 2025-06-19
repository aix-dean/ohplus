"use client"

import { useState, useEffect } from "react"
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
import { CheckCircle, Loader2, XCircle } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import type { Proposal } from "@/lib/types/proposal"
import { updateProposalStatus } from "@/lib/proposal-service"
import { useRouter } from "next/navigation" // Import useRouter

interface SendProposalDialogProps {
  isOpen: boolean
  onClose: () => void
  proposal: Proposal
  onProposalSent: (proposalId: string, newStatus: Proposal["status"]) => void
}

export function SendProposalDialog({ isOpen, onClose, proposal, onProposalSent }: SendProposalDialogProps) {
  const { toast } = useToast()
  const router = useRouter() // Initialize useRouter
  const [isSending, setIsSending] = useState(false)
  const [subject, setSubject] = useState("")
  const [body, setBody] = useState("")
  const [ccEmail, setCcEmail] = useState("") // New state for CC email
  const [currentUserEmail, setCurrentUserEmail] = useState("") // New state for current user's email

  useEffect(() => {
    if (isOpen) {
      // Set default subject and body when dialog opens
      setSubject(`Proposal: ${proposal.title || "Custom Advertising Solution"} - OH Plus`)
      setBody(
        `
Dear ${proposal.client?.contactPerson || proposal.client?.company || "Valued Client"},

We are excited to present you with a customized advertising proposal tailored to your specific needs. Our team has carefully crafted this proposal to help you achieve your marketing objectives.

Please find the complete proposal document attached to this email for your convenience, or view it online here: ${process.env.NEXT_PUBLIC_APP_URL}/proposals/view/${proposal.id}

We believe this proposal offers excellent value and aligns perfectly with your advertising goals. Our team is ready to discuss any questions you may have and work with you to bring this campaign to life.

Thank you for considering OH Plus as your advertising partner. We look forward to creating something amazing together!

Best regards,
The OH Plus Team
      `.trim(),
      )
      // In a real app, you'd fetch the current user's email from an auth context or session
      setCurrentUserEmail("sales@ohplus.com") // Placeholder
    }
  }, [isOpen, proposal])

  const handleSendProposal = async () => {
    setIsSending(true)
    try {
      const response = await fetch("/api/proposals/send-email", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          proposal,
          clientEmail: proposal.client.email,
          subject,
          body,
          currentUserEmail,
          ccEmail, // Include CC email
        }),
      })

      const result = await response.json()

      if (response.ok && result.success) {
        await updateProposalStatus(proposal.id, "sent")
        onProposalSent(proposal.id, "sent")
        toast({
          title: "Proposal Sent!",
          description: "The proposal has been successfully sent to the client.",
          icon: <CheckCircle className="h-5 w-5 text-green-500" />,
        })
        router.push("/sales/dashboard") // Redirect to dashboard
        onClose()
      } else {
        throw new Error(result.error || "Failed to send email")
      }
    } catch (error: any) {
      console.error("Error sending proposal:", error)
      toast({
        title: "Failed to Send Proposal",
        description: error.message || "An unexpected error occurred.",
        icon: <XCircle className="h-5 w-5 text-red-500" />,
        variant: "destructive",
      })
    } finally {
      setIsSending(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Send Proposal</DialogTitle>
          <DialogDescription>
            Review the email details before sending the proposal to{" "}
            <span className="font-semibold text-gray-900">{proposal.client.email}</span>.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="to" className="text-right">
              To
            </Label>
            <Input id="to" value={proposal.client.email} readOnly className="col-span-3" />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="cc" className="text-right">
              CC
            </Label>
            <Input
              id="cc"
              value={ccEmail}
              onChange={(e) => setCcEmail(e.target.value)}
              placeholder="Optional: comma-separated emails"
              className="col-span-3"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="from" className="text-right">
              From
            </Label>
            <Input id="from" value="OH Plus <noreply@resend.dev>" readOnly className="col-span-3" />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="replyTo" className="text-right">
              Reply-To
            </Label>
            <Input
              id="replyTo"
              value={currentUserEmail}
              onChange={(e) => setCurrentUserEmail(e.target.value)}
              placeholder="Your email"
              className="col-span-3"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="subject" className="text-right">
              Subject
            </Label>
            <Input id="subject" value={subject} onChange={(e) => setSubject(e.target.value)} className="col-span-3" />
          </div>
          <div className="grid grid-cols-4 items-start gap-4">
            <Label htmlFor="body" className="text-right pt-2">
              Body
            </Label>
            <Textarea
              id="body"
              value={body}
              onChange={(e) => setBody(e.target.value)}
              className="col-span-3 min-h-[150px]"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isSending}>
            Cancel
          </Button>
          <Button onClick={handleSendProposal} disabled={isSending}>
            {isSending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Sending...
              </>
            ) : (
              "Send Proposal"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

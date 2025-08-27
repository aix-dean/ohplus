"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent } from "@/components/ui/card"
import { ArrowLeft, Paperclip, X, Copy, Edit, Trash2 } from "lucide-react"
import { useRouter } from "next/navigation"
import { useToast } from "@/hooks/use-toast"
import type { Proposal } from "@/lib/types/proposal"

interface ComposeEmailPageProps {
  params: {
    id: string
  }
}

export default function ComposeEmailPage({ params }: ComposeEmailPageProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [proposal, setProposal] = useState<Proposal | null>(null)
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)

  const [emailData, setEmailData] = useState({
    to: "",
    cc: "",
    subject: "",
    message: `Hi AAA,

I hope you're doing well!

Please find attached the quotation for your upcoming billboard campaign. The proposal includes the site details and pricing details based on our recent discussion.

If you have any questions or would like to explore other options, feel free to reach out to us. I'll be happy to assist you further. Looking forward to your feedback!

Best regards,
Sales Executive
Sales Executive
OH PLUS
+639XXXXXXXXX`,
  })

  const [attachments, setAttachments] = useState([
    { name: `OH_OH_PROP${params.id}_Proposal_Page_1.pdf`, size: "2.1 MB", type: "proposal" },
    { name: `OH_OH_PROP${params.id}_VIEW_Proposal_Page_2.pdf`, size: "1.8 MB", type: "proposal" },
  ])

  const [templates] = useState([
    { id: 1, name: "Standard", type: "standard" },
    { id: 2, name: "Proposal Template 4", type: "template" },
    { id: 3, name: "Proposal Template 3", type: "template" },
    { id: 4, name: "Proposal Template 2", type: "template" },
    { id: 5, name: "Proposal Template 1", type: "template" },
  ])

  useEffect(() => {
    const fetchProposal = async () => {
      try {
        const mockProposal: Proposal = {
          id: params.id,
          code: "AIX",
          title: "Proposal for AIX - 8/27/2025",
          client: {
            name: "AAA Company",
            email: "j.king@aix.ph",
            phone: "+639XXXXXXXXX",
          },
          status: "draft",
          createdAt: new Date(),
          updatedAt: new Date(),
        }

        setProposal(mockProposal)
        setEmailData((prev) => ({
          ...prev,
          to: mockProposal.client.email,
          cc: "akoymababaix.com",
          subject: `Proposal: Proposal for ${mockProposal.code} | Kalayaan Flyover Site D - ${mockProposal.code} - OH Plus`,
        }))

        await generateProposalPDFs(mockProposal)
      } catch (error) {
        console.error("Error fetching proposal:", error)
        toast({
          title: "Error",
          description: "Failed to load proposal data",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }

    fetchProposal()
  }, [params.id, toast])

  const generateProposalPDFs = async (proposalData: Proposal) => {
    try {
      const proposalPDFs = [
        {
          name: `OH_OH_PROP${proposalData.id}_${proposalData.code}_Proposal_Main.pdf`,
          size: "2.3 MB",
          type: "proposal",
          url: `https://ohplus.ph/api/proposals/${proposalData.id}/pdf?type=main`,
        },
        {
          name: `OH_OH_PROP${proposalData.id}_${proposalData.code}_Proposal_Details.pdf`,
          size: "1.9 MB",
          type: "proposal",
          url: `https://ohplus.ph/api/proposals/${proposalData.id}/pdf?type=details`,
        },
      ]

      setAttachments(proposalPDFs)
    } catch (error) {
      console.error("Error generating proposal PDFs:", error)
      toast({
        title: "Warning",
        description: "Could not generate proposal PDFs. Using default attachments.",
        variant: "destructive",
      })
    }
  }

  const handleBack = () => {
    router.back()
  }

  const handleSendEmail = async () => {
    if (!emailData.to.trim()) {
      toast({
        title: "Validation Error",
        description: "Please enter a recipient email address.",
        variant: "destructive",
      })
      return
    }

    if (!emailData.subject.trim()) {
      toast({
        title: "Validation Error",
        description: "Please enter an email subject.",
        variant: "destructive",
      })
      return
    }

    setSending(true)

    try {
      const formData = new FormData()

      const toEmails = emailData.to
        .split(",")
        .map((email) => email.trim())
        .filter((email) => email)
      const ccEmails = emailData.cc
        ? emailData.cc
            .split(",")
            .map((email) => email.trim())
            .filter((email) => email)
        : []

      formData.append("to", JSON.stringify(toEmails))
      if (ccEmails.length > 0) {
        formData.append("cc", JSON.stringify(ccEmails))
      }
      formData.append("subject", emailData.subject)
      formData.append("body", emailData.message)

      for (let i = 0; i < attachments.length; i++) {
        const attachment = attachments[i]
        try {
          const pdfContent = `Proposal PDF: ${attachment.name}`
          const blob = new Blob([pdfContent], { type: "application/pdf" })
          const file = new File([blob], attachment.name, { type: "application/pdf" })
          formData.append(`attachment_${i}`, file)
        } catch (error) {
          console.error(`Error processing attachment ${attachment.name}:`, error)
        }
      }

      const response = await fetch("/api/send-email", {
        method: "POST",
        body: formData,
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || "Failed to send email")
      }

      toast({
        title: "Email sent!",
        description: "Your proposal has been sent successfully.",
      })

      router.back()
    } catch (error) {
      console.error("Email sending error:", error)
      toast({
        title: "Failed to send",
        description: error instanceof Error ? error.message : "Could not send the email. Please try again.",
        variant: "destructive",
      })
    } finally {
      setSending(false)
    }
  }

  const handleTemplateAction = (templateId: number, action: "copy" | "edit" | "delete") => {
    const template = templates.find((t) => t.id === templateId)
    if (!template) return

    switch (action) {
      case "copy":
        toast({
          title: "Template copied",
          description: `${template.name} has been copied to your clipboard.`,
        })
        break
      case "edit":
        toast({
          title: "Edit template",
          description: `Opening ${template.name} for editing.`,
        })
        break
      case "delete":
        toast({
          title: "Template deleted",
          description: `${template.name} has been deleted.`,
        })
        break
    }
  }

  const handleAddTemplate = () => {
    toast({
      title: "Add template",
      description: "Opening template creation dialog.",
    })
  }

  const handleRemoveAttachment = (index: number) => {
    setAttachments((prev) => prev.filter((_, i) => i !== index))
    toast({
      title: "Attachment removed",
      description: "The attachment has been removed from the email.",
    })
  }

  const handleAddAttachment = () => {
    toast({
      title: "Add attachment",
      description: "Opening file picker to add additional attachments.",
    })
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto p-6">
        <div className="flex items-center space-x-4 mb-6">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleBack}
            className="flex items-center space-x-2 text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back</span>
          </Button>
          <h1 className="text-xl font-semibold text-gray-900">Compose Email</h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="lg:col-span-3">
            <Card>
              <CardContent className="p-6">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">To:</label>
                    <Input
                      value={emailData.to}
                      onChange={(e) => setEmailData((prev) => ({ ...prev, to: e.target.value }))}
                      placeholder="Enter recipient email"
                      className="w-full"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Cc:</label>
                    <Input
                      value={emailData.cc}
                      onChange={(e) => setEmailData((prev) => ({ ...prev, cc: e.target.value }))}
                      placeholder="Enter CC email"
                      className="w-full"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Subject:</label>
                    <Input
                      value={emailData.subject}
                      onChange={(e) => setEmailData((prev) => ({ ...prev, subject: e.target.value }))}
                      placeholder="Enter email subject"
                      className="w-full"
                    />
                  </div>

                  <div>
                    <Textarea
                      value={emailData.message}
                      onChange={(e) => setEmailData((prev) => ({ ...prev, message: e.target.value }))}
                      placeholder="Enter your message"
                      className="w-full min-h-[200px] resize-none"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Attachments:</label>
                    <div className="space-y-2">
                      {attachments.map((attachment, index) => (
                        <div key={index} className="flex items-center justify-between bg-gray-50 p-3 rounded-lg">
                          <div className="flex items-center space-x-2">
                            <Paperclip className="h-4 w-4 text-gray-500" />
                            <span className="text-sm text-gray-700">{attachment.name}</span>
                            <span className="text-xs text-gray-500">({attachment.size})</span>
                          </div>
                          <Button variant="ghost" size="sm" onClick={() => handleRemoveAttachment(index)}>
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-blue-600 bg-transparent"
                        onClick={handleAddAttachment}
                      >
                        + Add Attachment
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="lg:col-span-1">
            <Card>
              <CardContent className="p-4">
                <h3 className="font-medium text-gray-900 mb-4">Templates:</h3>
                <div className="space-y-2">
                  {templates.map((template) => (
                    <div key={template.id} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                      <span className="text-sm text-gray-700">{template.name}</span>
                      <div className="flex items-center space-x-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleTemplateAction(template.id, "copy")}
                          className="h-6 w-6 p-0"
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleTemplateAction(template.id, "edit")}
                          className="h-6 w-6 p-0"
                        >
                          <Edit className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleTemplateAction(template.id, "delete")}
                          className="h-6 w-6 p-0"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
                <Button onClick={handleAddTemplate} className="w-full mt-4 bg-blue-600 hover:bg-blue-700 text-white">
                  +Add Template
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>

        <div className="flex justify-end mt-6">
          <Button
            onClick={handleSendEmail}
            disabled={sending}
            className="bg-blue-600 hover:bg-blue-700 text-white px-8"
          >
            {sending ? "Sending..." : "Send Email"}
          </Button>
        </div>
      </div>
    </div>
  )
}

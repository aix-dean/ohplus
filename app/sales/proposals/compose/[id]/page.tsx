"use client"

import type React from "react"
import { db } from "@/lib/firebase"
import { collection, addDoc, serverTimestamp, query, where, orderBy, getDocs, doc, updateDoc } from "firebase/firestore"
import { useAuth } from "@/contexts/auth-context"
import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent } from "@/components/ui/card"
import { ArrowLeft, Paperclip, X, Copy, Edit, Trash2, Upload, Plus } from "lucide-react"
import { useRouter } from "next/navigation"
import { useToast } from "@/hooks/use-toast"
import type { Proposal } from "@/lib/types/proposal"
import { getProposalById } from "@/lib/proposal-service"
import { emailService, type EmailTemplate } from "@/lib/email-service"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"

interface ComposeEmailPageProps {
  params: {
    id: string
  }
}

interface Attachment {
  name: string
  size: string
  type: string
  file?: File
  url?: string
}

interface ProposalEmailTemplate extends EmailTemplate {
  template_type: "proposal" | "quotation" | "CE" | "report"
}

export default function ComposeEmailPage({ params }: ComposeEmailPageProps) {
  const router = useRouter()
  const { toast } = useToast()
  const { user } = useAuth()
  const [proposal, setProposal] = useState<Proposal | null>(null)
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

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

  const [attachments, setAttachments] = useState<Attachment[]>([])

  const [templates, setTemplates] = useState<ProposalEmailTemplate[]>([])
  const [templatesLoading, setTemplatesLoading] = useState(true)

  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [editingTemplate, setEditingTemplate] = useState<ProposalEmailTemplate | null>(null)
  const [editTemplateData, setEditTemplateData] = useState({
    name: "",
    subject: "",
    body: "",
  })

  const fetchProposalTemplates = async () => {
    if (!user?.uid) return

    try {
      setTemplatesLoading(true)

      const templatesRef = collection(db, "email_templates")
      const q = query(
        templatesRef,
        where("userId", "==", user.uid),
        where("template_type", "==", "proposal"),
        orderBy("created", "desc"),
      )

      const querySnapshot = await getDocs(q)
      const proposalTemplates: ProposalEmailTemplate[] = []

      querySnapshot.forEach((doc) => {
        const data = doc.data()
        proposalTemplates.push({
          id: doc.id,
          name: data.name,
          subject: data.subject,
          body: data.body,
          userId: data.userId,
          created: data.created,
          template_type: data.template_type || "proposal",
        })
      })

      if (proposalTemplates.length === 0) {
        await createDefaultProposalTemplates()
        const newQuerySnapshot = await getDocs(q)
        newQuerySnapshot.forEach((doc) => {
          const data = doc.data()
          proposalTemplates.push({
            id: doc.id,
            name: data.name,
            subject: data.subject,
            body: data.body,
            userId: data.userId,
            created: data.created,
            template_type: data.template_type || "proposal",
          })
        })
      }

      setTemplates(proposalTemplates)
    } catch (error) {
      console.error("Error fetching proposal templates:", error)
      toast({
        title: "Error",
        description: "Failed to load email templates",
        variant: "destructive",
      })
    } finally {
      setTemplatesLoading(false)
    }
  }

  const createDefaultProposalTemplates = async () => {
    if (!user?.uid) return

    const defaultProposalTemplates = [
      {
        name: "Standard Proposal",
        subject: "Proposal: [Project Name] - [Company Name]",
        body: `Dear [Client Name],

I hope this email finds you well.

Please find attached our detailed proposal for your upcoming project. We've carefully reviewed your requirements and prepared a comprehensive solution that aligns with your objectives.

The proposal includes:
- Detailed project scope and deliverables
- Timeline and milestones
- Pricing and payment terms
- Our team's qualifications and experience

We're excited about the opportunity to work with you and are confident that our approach will deliver exceptional results for your project.

Please review the attached proposal and feel free to reach out if you have any questions or would like to discuss any aspects in detail.

Looking forward to your feedback!

Best regards,
[Your Name]
[Your Position]
OH PLUS
[Contact Information]`,
        userId: user.uid,
        template_type: "proposal" as const,
      },
      {
        name: "Follow-up Proposal",
        subject: "Follow-up: Proposal for [Project Name]",
        body: `Dear [Client Name],

I wanted to follow up on the proposal we sent for [Project Name].

I hope you've had a chance to review the attached proposal. We're very interested in working with you on this project and believe our solution offers excellent value for your investment.

If you have any questions about our approach, timeline, or pricing, I'd be happy to schedule a call to discuss them in detail.

We're also flexible and open to adjusting our proposal based on your feedback or any changes in your requirements.

Please let me know your thoughts or if you need any additional information.

Best regards,
[Your Name]
[Your Position]
OH PLUS
[Contact Information]`,
        userId: user.uid,
        template_type: "proposal" as const,
      },
    ]

    try {
      for (const template of defaultProposalTemplates) {
        await addDoc(collection(db, "email_templates"), {
          ...template,
          created: serverTimestamp(),
        })
      }
    } catch (error) {
      console.error("Error creating default proposal templates:", error)
    }
  }

  useEffect(() => {
    const fetchProposal = async () => {
      try {
        const proposalData = await getProposalById(params.id)

        if (!proposalData) {
          throw new Error("Proposal not found")
        }

        setProposal(proposalData)
        setEmailData((prev) => ({
          ...prev,
          to: proposalData.client.email,
          cc: "",
          subject: `Proposal: ${proposalData.title} - ${proposalData.client.company} - OH Plus`,
        }))

        await generateProposalPDFs(proposalData)
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

  useEffect(() => {
    if (user?.uid) {
      fetchProposalTemplates()
    }
  }, [user?.uid])

  const generateProposalPDFs = async (proposalData: Proposal) => {
    try {
      const response = await fetch(`/api/proposals/generate-pdf`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ proposal: proposalData }),
      })

      if (response.ok) {
        const pdfBlob = await response.blob()
        const fileName = `OH_PLUS_PROPOSAL_${proposalData.proposalNumber || proposalData.code}.pdf`
        const pdfFile = new File([pdfBlob], fileName, {
          type: "application/pdf",
        })

        const proposalPDFs: Attachment[] = [
          {
            name: fileName,
            size: formatFileSize(pdfBlob.size),
            type: "proposal",
            file: pdfFile,
          },
        ]

        setAttachments(proposalPDFs)
      } else {
        throw new Error("Failed to generate PDF")
      }
    } catch (error) {
      console.error("Error generating proposal PDFs:", error)
      const fallbackFileName = `OH_PLUS_PROPOSAL_${proposalData.proposalNumber || proposalData.code}.pdf`
      const fallbackPDFs: Attachment[] = [
        {
          name: fallbackFileName,
          size: "2.3 MB",
          type: "proposal",
          url: `https://ohplus.ph/api/proposals/${proposalData.id}/pdf`,
        },
      ]
      setAttachments(fallbackPDFs)

      toast({
        title: "Warning",
        description: "Could not generate proposal PDF. Using fallback attachment.",
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
          if (attachment.file) {
            formData.append(`attachment_${i}`, attachment.file)
          } else if (attachment.url && attachment.type === "proposal") {
            const pdfResponse = await fetch(attachment.url)
            if (pdfResponse.ok) {
              const pdfBlob = await pdfResponse.blob()
              const pdfFile = new File([pdfBlob], attachment.name, { type: "application/pdf" })
              formData.append(`attachment_${i}`, pdfFile)
            }
          }
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

      try {
        const emailRecord = {
          body: emailData.message,
          created: serverTimestamp(),
          from: user?.email || "noreply@ohplus.ph",
          proposalId: params.id,
          sentAt: serverTimestamp(),
          status: "sent",
          subject: emailData.subject,
          to: toEmails,
          cc: ccEmails.length > 0 ? ccEmails : null,
          updated: serverTimestamp(),
          userId: user?.uid || null,
          email_type: "proposal",
          attachments: attachments.map((att) => ({
            fileName: att.name,
            fileSize: att.file?.size || 0,
            fileType: att.file?.type || "application/pdf",
            fileUrl: att.url || null,
          })),
        }

        await addDoc(collection(db, "emails"), emailRecord)
        console.log("Email record saved successfully")
      } catch (emailRecordError) {
        console.error("Error saving email record:", emailRecordError)
      }

      router.push("/sales/proposals?success=proposal-sent")
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

  const handleTemplateAction = (templateId: string, action: "copy" | "edit" | "delete") => {
    const template = templates.find((t) => t.id === templateId)
    if (!template) return

    switch (action) {
      case "copy":
        setEmailData((prev) => ({
          ...prev,
          subject: template.subject,
          message: template.body,
        }))
        toast({
          title: "Template applied",
          description: `${template.name} has been applied to your email.`,
        })
        break
      case "edit":
        setEditingTemplate(template)
        setEditTemplateData({
          name: template.name,
          subject: template.subject,
          body: template.body,
        })
        setEditDialogOpen(true)
        break
      case "delete":
        handleDeleteTemplate(templateId)
        break
    }
  }

  const handleDeleteTemplate = async (templateId: string) => {
    try {
      await emailService.deleteEmailTemplate(templateId)
      await fetchProposalTemplates()
      toast({
        title: "Template deleted",
        description: "The template has been deleted successfully.",
      })
    } catch (error) {
      console.error("Error deleting template:", error)
      toast({
        title: "Error",
        description: "Failed to delete template",
        variant: "destructive",
      })
    }
  }

  const handleAddTemplate = async () => {
    if (!user?.uid) {
      toast({
        title: "Error",
        description: "You must be logged in to create templates",
        variant: "destructive",
      })
      return
    }

    try {
      const templateName = `Proposal Template ${templates.length + 1}`
      const newTemplate = {
        name: templateName,
        subject: "New Proposal Template",
        body: "Enter your proposal template content here...",
        userId: user.uid,
        template_type: "proposal" as const,
      }

      await addDoc(collection(db, "email_templates"), {
        ...newTemplate,
        created: serverTimestamp(),
      })

      await fetchProposalTemplates()

      toast({
        title: "Template created",
        description: `${templateName} has been created successfully.`,
      })
    } catch (error) {
      console.error("Error creating template:", error)
      toast({
        title: "Error",
        description: "Failed to create template",
        variant: "destructive",
      })
    }
  }

  const handleUpdateTemplate = async () => {
    if (!editingTemplate?.id || !user?.uid) {
      toast({
        title: "Error",
        description: "Unable to update template",
        variant: "destructive",
      })
      return
    }

    try {
      const templateRef = doc(db, "email_templates", editingTemplate.id)
      await updateDoc(templateRef, {
        name: editTemplateData.name,
        subject: editTemplateData.subject,
        body: editTemplateData.body,
        updated: serverTimestamp(),
      })

      await fetchProposalTemplates()
      setEditDialogOpen(false)
      setEditingTemplate(null)

      toast({
        title: "Template updated",
        description: "The template has been updated successfully.",
      })
    } catch (error) {
      console.error("Error updating template:", error)
      toast({
        title: "Error",
        description: "Failed to update template",
        variant: "destructive",
      })
    }
  }

  const handleRemoveAttachment = (index: number) => {
    setAttachments((prev) => prev.filter((_, i) => i !== index))
    toast({
      title: "Attachment removed",
      description: "The attachment has been removed from the email.",
    })
  }

  const handleAddAttachment = () => {
    fileInputRef.current?.click()
  }

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (!files) return

    Array.from(files).forEach((file) => {
      if (file.size > 10 * 1024 * 1024) {
        toast({
          title: "File too large",
          description: `${file.name} is larger than 10MB. Please choose a smaller file.`,
          variant: "destructive",
        })
        return
      }

      const newAttachment: Attachment = {
        name: file.name,
        size: formatFileSize(file.size),
        type: "user-upload",
        file: file,
      }

      setAttachments((prev) => [...prev, newAttachment])
    })

    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }

    toast({
      title: "Files added",
      description: `${files.length} file(s) have been added to your email.`,
    })
  }

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return "0 Bytes"
    const k = 1024
    const sizes = ["Bytes", "KB", "MB", "GB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
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
                            {attachment.type === "user-upload" && (
                              <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">Uploaded</span>
                            )}
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
                        <Upload className="h-4 w-4 mr-2" />
                        Add Attachment
                      </Button>
                      <input
                        ref={fileInputRef}
                        type="file"
                        multiple
                        className="hidden"
                        onChange={handleFileSelect}
                        accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png,.gif"
                      />
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
                {templatesLoading ? (
                  <div className="text-center py-4">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="text-sm text-gray-500 mt-2">Loading templates...</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {templates.map((template) => (
                      <div key={template.id} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                        <span className="text-sm text-gray-700">{template.name}</span>
                        <div className="flex items-center space-x-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleTemplateAction(template.id!, "copy")}
                            className="h-6 w-6 p-0"
                            title="Apply template"
                          >
                            <Copy className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleTemplateAction(template.id!, "edit")}
                            className="h-6 w-6 p-0"
                            title="Edit template"
                          >
                            <Edit className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleTemplateAction(template.id!, "delete")}
                            className="h-6 w-6 p-0"
                            title="Delete template"
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                <Button onClick={handleAddTemplate} className="w-full mt-4 bg-blue-600 hover:bg-blue-700 text-white">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Template
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

      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Template</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Template Name:</label>
              <Input
                value={editTemplateData.name}
                onChange={(e) => setEditTemplateData((prev) => ({ ...prev, name: e.target.value }))}
                placeholder="Enter template name"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Subject:</label>
              <Input
                value={editTemplateData.subject}
                onChange={(e) => setEditTemplateData((prev) => ({ ...prev, subject: e.target.value }))}
                placeholder="Enter email subject"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Body:</label>
              <Textarea
                value={editTemplateData.body}
                onChange={(e) => setEditTemplateData((prev) => ({ ...prev, body: e.target.value }))}
                placeholder="Enter email body"
                className="min-h-[200px] resize-none"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpdateTemplate} className="bg-blue-600 hover:bg-blue-700 text-white">
              Update Template
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

"use client"

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { ArrowLeft, Paperclip, Edit, Trash2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { getCostEstimate, getCostEstimatesByPageId } from "@/lib/cost-estimate-service"
import { generateCostEstimatePDF } from "@/lib/cost-estimate-pdf-service"
import { useAuth } from "@/contexts/auth-context"
import type { CostEstimate } from "@/lib/types/cost-estimate"
import { emailService, type EmailTemplate } from "@/lib/email-service"

export default function ComposeEmailPage() {
  const router = useRouter()
  const params = useParams()
  const { toast } = useToast()
  const { user, userData } = useAuth()

  const [costEstimate, setCostEstimate] = useState<CostEstimate | null>(null)
  const [relatedCostEstimates, setRelatedCostEstimates] = useState<CostEstimate[]>([])
  const [templates, setTemplates] = useState<EmailTemplate[]>([])
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [downloadingPDF, setDownloadingPDF] = useState<number | null>(null)

  const [showAddTemplateDialog, setShowAddTemplateDialog] = useState(false)
  const [showEditTemplateDialog, setShowEditTemplateDialog] = useState(false)
  const [editingTemplate, setEditingTemplate] = useState<EmailTemplate | null>(null)
  const [newTemplateName, setNewTemplateName] = useState("")
  const [newTemplateSubject, setNewTemplateSubject] = useState("")
  const [newTemplateBody, setNewTemplateBody] = useState("")
  const [savingTemplate, setSavingTemplate] = useState(false)

  const [toEmail, setToEmail] = useState("")
  const [ccEmail, setCcEmail] = useState("")
  const [subject, setSubject] = useState("")
  const [body, setBody] = useState("")
  const [attachments, setAttachments] = useState<string[]>([])

  useEffect(() => {
    const fetchData = async () => {
      try {
        console.log("[v0] fetchData called with userData:", userData)
        console.log("[v0] userData.company_id:", userData?.company_id)

        const id = params.id as string
        const estimate = await getCostEstimate(id)
        setCostEstimate(estimate)

        if (estimate?.page_id) {
          const related = await getCostEstimatesByPageId(estimate.page_id)
          setRelatedCostEstimates(related)

          const attachmentNames = related.map(
            (est, index) =>
              `QU-SU-${est.costEstimateNumber}_${est.client?.company || "Client"}_Cost_Estimate_Page_${est.page_number || index + 1}.pdf`,
          )
          setAttachments(attachmentNames)
        } else {
          setRelatedCostEstimates([estimate])
          setAttachments([
            `QU-SU-${estimate.costEstimateNumber}_${estimate.client?.company || "Client"}_Cost_Estimate.pdf`,
          ])
        }

        setToEmail(estimate.client?.email || "")
        setCcEmail(user?.email || "")
        setSubject(`Cost Estimate: ${estimate.title || "Custom Cost Estimate"} - OH Plus`)
        setBody(`Hi ${estimate.client?.contactPerson || estimate.client?.company || "Valued Client"},

I hope you're doing well!

Please find attached the quotation for your upcoming billboard campaign. The proposal includes the site location, duration, and pricing details based on our recent discussion.

If you have any questions or would like to explore other options, feel free to reach out. I'll be happy to assist you further. Looking forward to your feedback!

Best regards,
${user?.displayName || "Sales Executive"}
Sales Executive
OH Plus
${userData?.phone_number || ""}
${user?.email || ""}`)

        const companyId = userData?.company_id || estimate?.company_id
        console.log("[v0] Final companyId being used:", companyId)

        if (companyId) {
          try {
            console.log("[v0] Using company_id:", companyId)
            const userTemplates = await emailService.getEmailTemplates(companyId)
            if (userTemplates.length === 0) {
              await emailService.createDefaultTemplates(companyId)
              const newTemplates = await emailService.getEmailTemplates(companyId)
              setTemplates(newTemplates)
            } else {
              setTemplates(userTemplates)
            }
          } catch (error) {
            console.error("Error fetching templates:", error)
            setTemplates([])
          }
        } else {
          console.error("Company ID not found in user data or cost estimate")
          console.log("[v0] userData:", userData)
          console.log("[v0] estimate company_id:", estimate?.company_id)

          console.warn("No company_id available, continuing without templates")
          setTemplates([])
        }
      } catch (error) {
        console.error("Error fetching cost estimate:", error)
        toast({
          title: "Error",
          description: "Failed to load cost estimate data",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }

    if (userData !== null && userData !== undefined) {
      console.log("[v0] userData is available, calling fetchData")
      fetchData()
    } else {
      console.log("[v0] userData not yet available:", userData)
    }
  }, [params.id, user, userData, toast])

  const applyTemplate = (template: EmailTemplate) => {
    const replacements = {
      "{title}": costEstimate?.title || "Custom Cost Estimate",
      "{clientName}": costEstimate?.client?.contactPerson || costEstimate?.client?.company || "Valued Client",
      "{userName}": user?.displayName || "Sales Executive",
      "{companyName}": "OH Plus",
      "{userContact}": user?.phoneNumber || "",
      "{userEmail}": user?.email || "",
    }

    let newSubject = template.subject
    let newBody = template.body

    Object.entries(replacements).forEach(([placeholder, value]) => {
      newSubject = newSubject.replace(new RegExp(placeholder, "g"), value)
      newBody = newBody.replace(new RegExp(placeholder, "g"), value)
    })

    setSubject(newSubject)
    setBody(newBody)
  }

  const handleAddTemplate = async () => {
    if (!newTemplateName.trim() || !newTemplateSubject.trim() || !newTemplateBody.trim()) {
      toast({
        title: "Missing Information",
        description: "Please fill in all template fields",
        variant: "destructive",
      })
      return
    }

    const companyId = userData?.company_id || costEstimate?.company_id

    if (!companyId) {
      toast({
        title: "Error",
        description: "Company ID not found. Cannot create template.",
        variant: "destructive",
      })
      return
    }

    setSavingTemplate(true)
    try {
      const newTemplate = await emailService.createEmailTemplate({
        name: newTemplateName.trim(),
        subject: newTemplateSubject.trim(),
        body: newTemplateBody.trim(),
        company_id: companyId,
        deleted: false,
      })

      setTemplates((prev) => [...prev, newTemplate])
      setShowAddTemplateDialog(false)
      setNewTemplateName("")
      setNewTemplateSubject("")
      setNewTemplateBody("")

      toast({
        title: "Template Added",
        description: "Email template has been created successfully",
      })
    } catch (error) {
      console.error("Error creating template:", error)
      toast({
        title: "Error",
        description: "Failed to create template. Please try again.",
        variant: "destructive",
      })
    } finally {
      setSavingTemplate(false)
    }
  }

  const handleDeleteTemplate = async (templateId: string) => {
    try {
      await emailService.softDeleteEmailTemplate(templateId)
      setTemplates((prev) => prev.filter((template) => template.id !== templateId))
      toast({
        title: "Template Deleted",
        description: "Email template has been deleted successfully",
      })
    } catch (error) {
      console.error("Error deleting template:", error)
      toast({
        title: "Error",
        description: "Failed to delete template. Please try again.",
        variant: "destructive",
      })
    }
  }

  const handleEditTemplate = (template: EmailTemplate) => {
    setEditingTemplate(template)
    setNewTemplateName(template.name)
    setNewTemplateSubject(template.subject)
    setNewTemplateBody(template.body)
    setShowEditTemplateDialog(true)
  }

  const handleSaveEditedTemplate = async () => {
    if (!editingTemplate || !newTemplateName.trim() || !newTemplateSubject.trim() || !newTemplateBody.trim()) {
      toast({
        title: "Missing Information",
        description: "Please fill in all template fields",
        variant: "destructive",
      })
      return
    }

    setSavingTemplate(true)
    try {
      const updatedTemplate = await emailService.updateEmailTemplate(editingTemplate.id, {
        name: newTemplateName.trim(),
        subject: newTemplateSubject.trim(),
        body: newTemplateBody.trim(),
      })

      setTemplates((prev) => prev.map((template) => (template.id === editingTemplate.id ? updatedTemplate : template)))

      setShowEditTemplateDialog(false)
      setEditingTemplate(null)
      setNewTemplateName("")
      setNewTemplateSubject("")
      setNewTemplateBody("")

      toast({
        title: "Template Updated",
        description: "Email template has been updated successfully",
      })
    } catch (error) {
      console.error("Error updating template:", error)
      toast({
        title: "Error",
        description: "Failed to update template. Please try again.",
        variant: "destructive",
      })
    } finally {
      setSavingTemplate(false)
    }
  }

  const removeAttachment = (index: number) => {
    setAttachments((prev) => prev.filter((_, i) => i !== index))
  }

  const handleSendEmail = async () => {
    if (!costEstimate || !toEmail) {
      toast({
        title: "Missing Information",
        description: "Please ensure all required fields are filled",
        variant: "destructive",
      })
      return
    }

    setSending(true)
    try {
      const response = await fetch("/api/cost-estimates/send-email", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          costEstimate: costEstimate,
          relatedCostEstimates: relatedCostEstimates,
          clientEmail: toEmail,
          client: costEstimate.client,
          currentUserEmail: user?.email,
          ccEmail: ccEmail,
          subject: subject,
          body: body,
          attachments: attachments,
        }),
      })

      const result = await response.json()
      if (!response.ok || !result.success) {
        throw new Error(result.error || "Failed to send email")
      }

      toast({
        title: "Email Sent",
        description: "Cost estimate has been sent successfully",
      })

      // Use router.push instead of router.back() for better navigation
      router.push(`/sales/cost-estimates/${params.id}`)
    } catch (error) {
      console.error("Error sending email:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to send email. Please try again.",
        variant: "destructive",
      })
    } finally {
      setSending(false)
    }
  }

  const handleDownloadAttachment = async (attachment: string, index: number) => {
    if (!costEstimate || !relatedCostEstimates[index]) return

    const targetEstimate = relatedCostEstimates[index]
    const userDataForPDF = user
      ? {
          first_name: user.displayName?.split(" ")[0] || "",
          last_name: user.displayName?.split(" ").slice(1).join(" ") || "",
          email: user.email || "",
        }
      : undefined

    setDownloadingPDF(index)
    try {
      await generateCostEstimatePDF(targetEstimate, undefined, false, userDataForPDF)
      toast({
        title: "PDF Downloaded",
        description: `${attachment} has been downloaded successfully.`,
      })
    } catch (error) {
      console.error("Error downloading PDF:", error)
      toast({
        title: "Error",
        description: "Failed to download PDF. Please try again.",
        variant: "destructive",
      })
    } finally {
      setDownloadingPDF(null)
    }
  }

  if (loading || userData === null) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b px-6 py-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => router.back()} className="flex items-center gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
          <h1 className="text-xl font-semibold">Compose Email</h1>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Email Form */}
          <div className="lg:col-span-2 bg-white rounded-lg shadow-sm border p-6">
            <div className="space-y-4">
              {/* To Field */}
              <div className="flex items-center gap-4">
                <Label className="w-12 text-sm font-medium">To:</Label>
                <div className="flex-1">
                  <Input
                    value={toEmail}
                    onChange={(e) => setToEmail(e.target.value)}
                    placeholder="recipient@example.com"
                  />
                </div>
              </div>

              {/* CC Field */}
              <div className="flex items-center gap-4">
                <Label className="w-12 text-sm font-medium">Cc:</Label>
                <div className="flex-1">
                  <Input value={ccEmail} onChange={(e) => setCcEmail(e.target.value)} placeholder="cc@example.com" />
                </div>
              </div>

              {/* Subject Field */}
              <div className="flex items-center gap-4">
                <Label className="w-12 text-sm font-medium">Subject:</Label>
                <div className="flex-1">
                  <Input value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="Email subject" />
                </div>
              </div>

              {/* Body Field */}
              <div className="space-y-2">
                <div className="relative">
                  <Textarea
                    value={body}
                    onChange={(e) => setBody(e.target.value)}
                    placeholder="Email body..."
                    className="min-h-[300px] border-2 border-purple-300 focus:border-purple-500"
                  />
                </div>
              </div>

              {/* Attachments */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">Attachments:</Label>
                <div className="space-y-2">
                  {attachments.map((attachment, index) => (
                    <div key={index} className="flex items-center gap-2 p-2 bg-gray-50 rounded border">
                      <Paperclip className="h-4 w-4 text-gray-500" />
                      <button
                        className="flex-1 text-sm text-left text-blue-600 hover:text-blue-800 hover:underline"
                        onClick={() => handleDownloadAttachment(attachment, index)}
                        disabled={downloadingPDF === index}
                      >
                        {downloadingPDF === index ? "Downloading..." : attachment}
                      </button>
                      <Button variant="ghost" size="sm" onClick={() => removeAttachment(index)} className="h-6 w-6 p-0">
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                  <Button variant="link" className="text-blue-500 text-sm p-0 h-auto">
                    +Add Attachment
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* Templates Sidebar */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h3 className="font-medium mb-4">Templates:</h3>
            <div className="space-y-3">
              {templates.map((template) => (
                <div
                  key={template.id}
                  className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50"
                >
                  <button
                    className="text-sm text-left flex-1 hover:text-blue-600"
                    onClick={() => applyTemplate(template)}
                  >
                    {template.name}
                  </button>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEditTemplate(template)}
                      className="h-6 w-6 p-0"
                    >
                      <Edit className="h-3 w-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteTemplate(template.id)}
                      className="h-6 w-6 p-0"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              ))}
              <Button
                className="w-full bg-blue-500 hover:bg-blue-600 text-white"
                onClick={() => setShowAddTemplateDialog(true)}
              >
                +Add Template
              </Button>
            </div>
          </div>
        </div>

        {/* Send Button */}
        <div className="flex justify-end mt-6">
          <Button
            onClick={handleSendEmail}
            disabled={sending || !toEmail || !subject}
            className="bg-blue-500 hover:bg-blue-600 text-white px-8 py-2"
          >
            {sending ? "Sending..." : "Send Email"}
          </Button>
        </div>
      </div>

      {/* Add Template Dialog */}
      <Dialog open={showAddTemplateDialog} onOpenChange={setShowAddTemplateDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Add Email Template</DialogTitle>
            <DialogDescription>
              Create a new email template that can be reused for future cost estimates.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="template-name">Template Name</Label>
              <Input
                id="template-name"
                value={newTemplateName}
                onChange={(e) => setNewTemplateName(e.target.value)}
                placeholder="e.g., Standard Quotation"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="template-subject">Subject</Label>
              <Input
                id="template-subject"
                value={newTemplateSubject}
                onChange={(e) => setNewTemplateSubject(e.target.value)}
                placeholder="e.g., Cost Estimate: {title} - {companyName}"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="template-body">Body</Label>
              <Textarea
                id="template-body"
                value={newTemplateBody}
                onChange={(e) => setNewTemplateBody(e.target.value)}
                placeholder="Hi {clientName},&#10;&#10;Please find attached..."
                className="min-h-[200px]"
              />
            </div>
            <div className="text-sm text-gray-500">
              <p className="font-medium mb-1">Available placeholders:</p>
              <p>{"{clientName}, {title}, {userName}, {companyName}, {userContact}, {userEmail}"}</p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddTemplateDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddTemplate} disabled={savingTemplate}>
              {savingTemplate ? "Saving..." : "Save Template"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Template Dialog */}
      <Dialog open={showEditTemplateDialog} onOpenChange={setShowEditTemplateDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Edit Email Template</DialogTitle>
            <DialogDescription>Update the email template details.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-template-name">Template Name</Label>
              <Input
                id="edit-template-name"
                value={newTemplateName}
                onChange={(e) => setNewTemplateName(e.target.value)}
                placeholder="e.g., Standard Quotation"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-template-subject">Subject</Label>
              <Input
                id="edit-template-subject"
                value={newTemplateSubject}
                onChange={(e) => setNewTemplateSubject(e.target.value)}
                placeholder="e.g., Cost Estimate: {title} - {companyName}"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-template-body">Body</Label>
              <Textarea
                id="edit-template-body"
                value={newTemplateBody}
                onChange={(e) => setNewTemplateBody(e.target.value)}
                placeholder="Hi {clientName},&#10;&#10;Please find attached..."
                className="min-h-[200px]"
              />
            </div>
            <div className="text-sm text-gray-500">
              <p className="font-medium mb-1">Available placeholders:</p>
              <p>{"{clientName}, {title}, {userName}, {companyName}, {userContact}, {userEmail}"}</p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditTemplateDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveEditedTemplate} disabled={savingTemplate}>
              {savingTemplate ? "Updating..." : "Update Template"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

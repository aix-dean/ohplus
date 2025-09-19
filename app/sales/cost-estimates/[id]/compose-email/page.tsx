"use client"

import type React from "react"

import { useState, useEffect, useRef, useCallback } from "react"
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
import { generateCostEstimateEmailPDF } from "@/lib/cost-estimate-pdf-service"
import { useAuth } from "@/contexts/auth-context"
import type { CostEstimate } from "@/lib/types/cost-estimate"
import { emailService, type EmailTemplate } from "@/lib/email-service"
import { ProposalSentSuccessDialog } from "@/components/proposal-sent-success-dialog"

export default function ComposeEmailPage() {
  const router = useRouter()
  const params = useParams()
  const { toast } = useToast()
  const { user, userData } = useAuth()

  const dataFetched = useRef(false)
  const userDataRef = useRef(userData)
  const [isInitialized, setIsInitialized] = useState(false)

  const [costEstimate, setCostEstimate] = useState<CostEstimate | null>(null)
  const [relatedCostEstimates, setRelatedCostEstimates] = useState<CostEstimate[]>([])
  const [templates, setTemplates] = useState<EmailTemplate[]>([])
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [downloadingPDF, setDownloadingPDF] = useState<number | null>(null)
  const [preGeneratedPDF, setPreGeneratedPDF] = useState<string | null>(null)
  const [preGeneratedPDFs, setPreGeneratedPDFs] = useState<Array<{ filename: string; content: string }>>([]) // Add state for storing all pre-generated PDFs
  const [pdfGenerating, setPdfGenerating] = useState(false)

  const [showAddTemplateDialog, setShowAddTemplateDialog] = useState(false)
  const [showEditTemplateDialog, setShowEditTemplateDialog] = useState(false)
  const [editingTemplate, setEditingTemplate] = useState<EmailTemplate | null>(null)
  const [newTemplateName, setNewTemplateName] = useState("")
  const [newTemplateSubject, setNewTemplateSubject] = useState("")
  const [newTemplateBody, setNewTemplateBody] = useState("")
  const [savingTemplate, setSavingTemplate] = useState(false)

  const [toEmail, setToEmail] = useState("")
  const [ccEmail, setCcEmail] = useState("")
  const [replyToEmail, setReplyToEmail] = useState("")
  const [subject, setSubject] = useState("")
  const [body, setBody] = useState("")
  const [pdfAttachments, setPdfAttachments] = useState<string[]>([])
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([])
  const [showSuccessDialog, setShowSuccessDialog] = useState(false)

  useEffect(() => {
    userDataRef.current = userData
  }, [userData])

  const preGenerateAllPDFs = useCallback(
    async (mainEstimate: CostEstimate, relatedEstimates: CostEstimate[]) => {
      if (!mainEstimate) return

      setPdfGenerating(true)
      try {
        console.log("[v0] Pre-generating all PDFs for email attachments...")
        const currentUserData = userDataRef.current
        const userDataForPDF = currentUserData
          ? {
              first_name: currentUserData.first_name || user?.displayName?.split(" ")[0] || "",
              last_name: currentUserData.last_name || user?.displayName?.split(" ").slice(1).join(" ") || "",
              email: currentUserData.email || user?.email || "",
              company_id: currentUserData.company_id || undefined,
            }
          : undefined

        const allPDFs: Array<{ filename: string; content: string }> = []

        // Generate PDF for main estimate
        try {
          const mainPdfBase64 = await generateCostEstimateEmailPDF(mainEstimate, userDataForPDF)
          if (typeof mainPdfBase64 === "string") {
            const mainFilename = `QU-SU-${mainEstimate.costEstimateNumber}_${mainEstimate.client?.company || "Client"}_Cost_Estimate.pdf`
            allPDFs.push({
              filename: mainFilename,
              content: mainPdfBase64,
            })
            setPreGeneratedPDF(mainPdfBase64) // Keep for backward compatibility
            console.log("[v0] Main PDF pre-generated successfully")
          }
        } catch (error) {
          console.error("[v0] Error generating main PDF:", error)
        }

        const uniqueRelatedEstimates = relatedEstimates.filter((estimate) => estimate.id !== mainEstimate.id)

        // Generate PDFs for unique related estimates only
        for (let i = 0; i < uniqueRelatedEstimates.length; i++) {
          const estimate = uniqueRelatedEstimates[i]
          try {
            console.log(`[v0] Generating PDF ${i + 1}/${uniqueRelatedEstimates.length} for estimate:`, estimate.id)
            const pdfBase64 = await generateCostEstimateEmailPDF(estimate, userDataForPDF)
            if (typeof pdfBase64 === "string") {
              const filename = `QU-SU-${estimate.costEstimateNumber}_${estimate.client?.company || "Client"}_Cost_Estimate_Page_${estimate.page_number || i + 2}.pdf`
              allPDFs.push({
                filename,
                content: pdfBase64,
              })
              console.log(`[v0] PDF ${i + 1} generated successfully:`, filename)
            }
          } catch (error) {
            console.error(`[v0] Error generating PDF for estimate ${estimate.id}:`, error)
            // Continue with other PDFs even if one fails
          }
        }

        setPreGeneratedPDFs(allPDFs)
        console.log(`[v0] All PDFs pre-generated successfully. Total: ${allPDFs.length}`)

        if (allPDFs.length === 0) {
          toast({
            title: "PDF Generation Warning",
            description: "No PDFs could be generated. Email will be sent without PDF attachments.",
            variant: "destructive",
          })
        }
      } catch (error) {
        console.error("[v0] Error pre-generating PDFs:", error)
        toast({
          title: "PDF Generation Warning",
          description: "Some PDFs could not be generated. Email may be sent with fewer attachments.",
          variant: "destructive",
        })
      } finally {
        setPdfGenerating(false)
      }
    },
    [user, toast],
  )

  const fetchData = useCallback(async () => {
    if (dataFetched.current) return

    const currentUserData = userDataRef.current
    if (!currentUserData) return

    try {
      console.log("[v0] fetchData called with userData:", currentUserData)
      console.log("[v0] userData.company_id:", currentUserData?.company_id)

      const id = params.id as string
      const estimate = await getCostEstimate(id)
      setCostEstimate(estimate)

      let related: CostEstimate[] = []
      if (estimate?.page_id) {
        related = await getCostEstimatesByPageId(estimate.page_id)
        setRelatedCostEstimates(related)

        const uniqueRelated = related.filter((est) => est.id !== estimate.id)
        const attachmentNames = [
          `QU-SU-${estimate.costEstimateNumber}_${estimate.client?.company || "Client"}_Cost_Estimate.pdf`,
          ...uniqueRelated.map(
            (est, index) =>
              `QU-SU-${est.costEstimateNumber}_${est.client?.company || "Client"}_Cost_Estimate_Page_${est.page_number || index + 2}.pdf`,
          ),
        ]
        setPdfAttachments(attachmentNames)
      } else {
        related = []
        setRelatedCostEstimates([estimate])
        setPdfAttachments([
          `QU-SU-${estimate.costEstimateNumber}_${estimate.client?.company || "Client"}_Cost_Estimate.pdf`,
        ])
      }

      await preGenerateAllPDFs(estimate, related)

      setToEmail(estimate.client?.email || "")
      setCcEmail("")
      setReplyToEmail(user?.email || "")
      setSubject(`${estimate?.title || "Custom Cost Estimate"}`)
      setBody(`Hi ${estimate?.client?.contactPerson || estimate?.client?.company || "Valued Client"},

I hope you're doing well!

Please find attached the quotation for your upcoming billboard campaign. The cost estimate includes the site location, duration, and pricing details based on our recent discussion.

If you have any questions or would like to explore other options, feel free to reach out. I'll be happy to assist you further. Looking forward to your feedback!

Best regards,
${user?.displayName || "Sales Executive"}
Sales Executive
OH Plus
${currentUserData?.phone_number || ""}
${user?.email || ""}`)

      const companyId = currentUserData?.company_id || estimate?.company_id
      console.log("[v0] Final companyId being used:", companyId)

      if (companyId) {
        try {
          console.log("[v0] Using company_id:", companyId)
          const userTemplates = await emailService.getEmailTemplates(companyId)
          console.log("[v0] Fetched user templates:", userTemplates)
          setTemplates(userTemplates)
          
        } catch (error) {
          console.error("Error fetching templates:", error)
          setTemplates([])
        }
      } else {
        console.error("Company ID not found in user data or cost estimate")
        console.log("[v0] userData:", currentUserData)
        console.log("[v0] estimate company_id:", estimate?.company_id)

        console.warn("No company_id available, continuing without templates")
        setTemplates([])
      }

      dataFetched.current = true
      setIsInitialized(true)
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
  }, [params.id, user, toast, preGenerateAllPDFs])

  useEffect(() => {
    if (userData && !isInitialized && !dataFetched.current) {
      console.log("[v0] userData is available, calling fetchData")
      fetchData()
    } else if (userData === null) {
      setLoading(false)
    }
  }, [userData, isInitialized, fetchData])

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

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (files) {
      const newFiles = Array.from(files)
      setUploadedFiles((prev) => [...prev, ...newFiles])

      toast({
        title: "Files Added",
        description: `${newFiles.length} file(s) added to attachments`,
      })
    }

    event.target.value = ""
  }

  const removePdfAttachment = (index: number) => {
    setPdfAttachments((prev) => prev.filter((_, i) => i !== index))
  }

  const removeUploadedFile = (index: number) => {
    setUploadedFiles((prev) => prev.filter((_, i) => i !== index))
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
      console.log("[v0] Starting email send process...")
      console.log("[v0] Uploaded files count:", uploadedFiles.length)
      console.log("[v0] Pre-generated PDFs available:", preGeneratedPDFs.length)

      const uploadedFilesData =
        uploadedFiles.length > 0
          ? await Promise.all(
              uploadedFiles.map(async (file) => {
                const base64 = await new Promise<string>((resolve) => {
                  const reader = new FileReader()
                  reader.onload = () => {
                    const result = reader.result as string
                    resolve(result.split(",")[1])
                  }
                  reader.readAsDataURL(file)
                })

                return {
                  filename: file.name,
                  content: base64,
                  type: file.type,
                }
              }),
            )
          : []

      console.log("[v0] Processed uploaded files:", uploadedFilesData.length)

      const allAttachments = [...preGeneratedPDFs.map((pdf) => pdf.filename), ...uploadedFiles.map((f) => f.name)]

      const requestBody = {
        costEstimate: costEstimate,
        clientEmail: toEmail,
        client: costEstimate.client,
        currentUserEmail: user?.email,
        ccEmail: ccEmail,
        replyToEmail: replyToEmail,
        subject: subject,
        body: body,
        attachments: allAttachments,
        preGeneratedPDFs: preGeneratedPDFs, // Send all pre-generated PDFs
        uploadedFiles: uploadedFilesData,
        userData: userData, // Send userData for PDF generation fallback
      }

      console.log("[v0] Sending request with body:", {
        hasCostEstimate: !!requestBody.costEstimate,
        clientEmail: requestBody.clientEmail,
        uploadedFilesCount: uploadedFilesData.length,
        preGeneratedPDFsCount: preGeneratedPDFs.length,
        totalAttachments: allAttachments.length,
      })

      const response = await fetch("/api/cost-estimates/send-email", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      })

      console.log("[v0] Response status:", response.status)

      const result = await response.json()
      console.log("[v0] Response result:", result)

      if (!response.ok || !result.success) {
        throw new Error(result.error || "Failed to send email")
      }

      console.log("[v0] Email sent successfully!")
      setShowSuccessDialog(true)
    } catch (error) {
      console.error("[v0] Error sending email:", error)
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
    if (preGeneratedPDFs[index]) {
      // Update attachment viewing to use pre-generated PDFs
      try {
        const pdfData = preGeneratedPDFs[index]

        // Create blob URL and open in new tab
        const byteCharacters = atob(pdfData.content)
        const byteNumbers = new Array(byteCharacters.length)
        for (let i = 0; i < byteCharacters.length; i++) {
          byteNumbers[i] = byteCharacters.charCodeAt(i)
        }
        const byteArray = new Uint8Array(byteNumbers)
        const blob = new Blob([byteArray], { type: "application/pdf" })
        const url = URL.createObjectURL(blob)

        // Open PDF in new tab
        window.open(url, "_blank")

        // Clean up the URL after a short delay
        setTimeout(() => URL.revokeObjectURL(url), 1000)

        toast({
          title: "PDF Opened",
          description: `${attachment} has been opened in a new tab.`,
        })
      } catch (error) {
        console.error("Error opening PDF:", error)
        toast({
          title: "Error",
          description: "Failed to open PDF. Please try again.",
          variant: "destructive",
        })
      }
    }
  }

  const handleViewUploadedFile = (file: File) => {
    const url = URL.createObjectURL(file)
    window.open(url, "_blank")

    // Clean up the URL after a short delay
    setTimeout(() => URL.revokeObjectURL(url), 1000)

    toast({
      title: "File Opened",
      description: `${file.name} has been opened in a new tab.`,
    })
  }

  const handleSuccessDialogClose = () => {
    setShowSuccessDialog(false)
    router.push('/sales/cost-estimates')
  }

  if (loading || userData === undefined) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center space-y-4">
          <div className="text-lg">Loading...</div>
          {pdfGenerating && <div className="text-sm text-gray-600">Preparing PDF for email attachment...</div>}
        </div>
      </div>
    )
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
          {pdfGenerating && (
            <div className="text-sm text-blue-600 bg-blue-50 px-3 py-1 rounded-full">
              Preparing {relatedCostEstimates.length} PDF(s)...
            </div>
          )}
          {preGeneratedPDFs.length > 0 && !pdfGenerating && (
            <div className="text-sm text-green-600 bg-green-50 px-3 py-1 rounded-full">
              {preGeneratedPDFs.length} PDF(s) Ready
            </div>
          )}
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

              {/* Reply-To Field */}
              <div className="flex items-center gap-4">
                <Label className="w-12 text-sm font-medium">Reply-To:</Label>
                <div className="flex-1">
                  <Input
                    value={replyToEmail}
                    onChange={(e) => setReplyToEmail(e.target.value)}
                    placeholder="reply-to@example.com"
                  />
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
                  {preGeneratedPDFs.map((pdf, index) => (
                    <div
                      key={`pdf-${index}`}
                      className="flex items-center gap-2 p-2 bg-green-50 rounded border border-green-200"
                    >
                      <Paperclip className="h-4 w-4 text-green-600" />
                      <button
                        className="flex-1 text-sm text-left text-green-800 hover:text-green-900 hover:underline"
                        onClick={() => handleDownloadAttachment(pdf.filename, index)}
                        disabled={downloadingPDF === index}
                      >
                        {downloadingPDF === index ? "Opening..." : pdf.filename}
                      </button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setPreGeneratedPDFs((prev) => prev.filter((_, i) => i !== index))
                          setPdfAttachments((prev) => prev.filter((_, i) => i !== index))
                        }}
                        className="h-6 w-6 p-0"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}

                  {uploadedFiles.map((file, index) => (
                    <div key={`upload-${index}`} className="flex items-center gap-2 p-2 bg-gray-50 rounded border">
                      <Paperclip className="h-4 w-4 text-gray-500" />
                      <button
                        className="flex-1 text-sm text-left text-gray-700 hover:text-blue-600 hover:underline"
                        onClick={() => handleViewUploadedFile(file)}
                      >
                        {file.name}
                      </button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeUploadedFile(index)}
                        className="h-6 w-6 p-0"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}

                  <div className="flex items-center gap-2">
                    <input
                      type="file"
                      id="file-upload"
                      multiple
                      className="hidden"
                      onChange={handleFileUpload}
                      accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.txt"
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => document.getElementById("file-upload")?.click()}
                      className="text-blue-500 border-blue-200 hover:bg-blue-50"
                    >
                      <Paperclip className="h-4 w-4 mr-2" />
                      Add Attachment
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Templates Sidebar */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h3 className="font-medium mb-4">Templates:</h3>
            <div className="max-h-96 overflow-y-auto space-y-3">
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
            </div>
            <div className="mt-4 pt-4 border-t">
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
            disabled={sending || !toEmail || !subject || pdfGenerating}
            className="bg-blue-500 hover:bg-blue-600 text-white px-8 py-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {sending ? (
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Sending Email...
              </div>
            ) : pdfGenerating ? (
              `Preparing ${relatedCostEstimates.length} PDF(s)...`
            ) : (
              "Send Email"
            )}
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

      {/* Success Dialog */}
      <ProposalSentSuccessDialog
        isOpen={showSuccessDialog}
        onDismissAndNavigate={handleSuccessDialogClose}
      />
    </div>
  )
}

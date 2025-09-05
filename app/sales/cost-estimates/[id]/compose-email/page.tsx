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
              company_id: currentUserData.company_id,
            }
          : undefined

        const allPDFs: Array<{ filename: string; content: string }> = []

        // Generate PDF for main estimate
        try {
          const mainPdfBase64 = await generateCostEstimateEmailPDF(mainEstimate, true, userDataForPDF)
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
            const pdfBase64 = await generateCostEstimateEmailPDF(estimate, true, userDataForPDF)
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
${currentUserData?.phone_number || ""}
${user?.email || ""}`)

      const companyId = currentUserData?.company_id || estimate?.company_id
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
        subject: subject,
        body: body,
        attachments: allAttachments,
        preGeneratedPDFs: preGeneratedPDFs, // Send all pre-generated PDFs
        uploadedFiles: uploadedFilesData,
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

      console.log("[DEBUG] Email sent successfully! Showing success dialog.");
      setShowSuccessDialog(true);
    } catch (error) {
      console.error("[DEBUG] Error during email send process:", error);
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
    setShowSuccessDialog(false);
    console.log("[DEBUG] handleSuccessDialogClose called.");
    if (costEstimate?.proposalId) {
      const redirectPath = `/sales/proposals`;
      console.log("[DEBUG] Redirecting to:", redirectPath);
      router.push(redirectPath);
    } else {
      console.error("[DEBUG] costEstimate.proposal_id is missing. Cannot redirect to proposals tab.");
      router.push(`/sales/cost-estimates/${params.id}`); // Fallback to original redirect
    }
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
                      onClick={() => template.id && handleDeleteTemplate(template.id)}
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
            disabled={sending || !toEmail || !subject || pdfGenerating}
            className="bg-blue-500 hover:bg-blue-600 text-white px-8 py-2"
          >
            {sending
              ? "Sending..."
              : pdfGenerating
                ? `Preparing ${relatedCostEstimates.length} PDF(s)...`
                : "Send Email"}
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
                placeholder="e.g., Cost Estimate: title - companyName"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="template-body">Body</Label>
              <Textarea
                id="template-body"
                value={newTemplateBody}
                onChange={(e) => setNewTemplateBody(e.target.value)}
                placeholder="Message goes here..."
                className="min-h-[200px]"
              />
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
      <Dialog open={showSuccessDialog} onOpenChange={(open) => {
        console.log("[DEBUG] Success Dialog onOpenChange called. Open state:", open);
        if (!open) {
          handleSuccessDialogClose();
        }
        setShowSuccessDialog(open);
      }}>
        <DialogContent className="sm:max-w-[400px] text-center">
          <div className="flex flex-col items-center justify-center space-y-4 pb-4">
                  <svg xmlns="http://www.w3.org/2000/svg" version="1.1" className="w-16 h-16 text-white" fill="currentColor" viewBox="0 0 1500 1500">
                    <path d="M0 0 C1.06605469 0.00580078 2.13210938 0.01160156 3.23046875 0.01757812 C11.44101252 0.14667473 11.44101252 0.14667473 15.625 2.4375 C17.80285362 2.90195773 19.99261904 3.31164772 22.1875 3.6875 C42.19306361 7.47233636 60.43193151 14.96408282 76.625 27.4375 C77.46417969 28.07429688 78.30335938 28.71109375 79.16796875 29.3671875 C96.79058796 43.07070683 108.91502376 60.81392133 114.625 82.4375 C114.83253906 83.159375 115.04007813 83.88125 115.25390625 84.625 C120.33915345 105.1082335 115.10715847 126.69279212 104.75 144.625 C101.73467493 149.44483308 98.52067198 154.28077784 94.625 158.4375 C93.965 158.4375 93.305 158.4375 92.625 158.4375 C92.295 159.4275 91.965 160.4175 91.625 161.4375 C90.965 161.4375 90.305 161.4375 89.625 161.4375 C89.295 162.4275 88.965 163.4175 88.625 164.4375 C86.67972302 166.14218465 84.75360862 167.70586483 82.6875 169.25 C82.09702881 169.69504883 81.50655762 170.14009766 80.89819336 170.59863281 C67.68188939 180.43352279 53.51787735 186.24010142 37.625 190.4375 C36.54089844 190.78296875 35.45679688 191.1284375 34.33984375 191.484375 C25.15927083 193.83985323 15.75006948 193.56093401 6.33203125 193.5 C4.97303952 193.49558254 3.6140457 193.49176917 2.25505066 193.48852539 C-2.0174968 193.47720353 -6.28998775 193.45794782 -10.5625 193.4375 C-15.52998283 193.4137902 -20.49743374 193.39345109 -25.4649601 193.38156128 C-27.43850585 193.37513661 -29.41202853 193.36256184 -31.38554382 193.34985352 C-39.91213638 193.3265472 -46.9601252 193.38086093 -54.75 197.1875 C-55.78898438 197.67734375 -56.82796875 198.1671875 -57.8984375 198.671875 C-60.56819697 200.22436452 -60.56819697 200.22436452 -61.3125 202.984375 C-61.5842099 205.55451464 -61.5842099 205.55451464 -60 207.9375 C-54.47550582 213.19892303 -47.53111317 216.0429012 -40.375 218.4375 C-39.4675 218.77523437 -38.56 219.11296875 -37.625 219.4609375 C-33.95163251 220.56471379 -30.36107929 221.00689843 -26.5625 221.375 C10.48423245 225.44527394 47.98997539 237.81678715 72.3984375 267.6015625 C73.625 269.4375 73.625 269.4375 73.625 271.4375 C74.285 271.4375 74.945 271.4375 75.625 271.4375 C79.625 278.1875 79.625 278.1875 79.625 280.4375 C80.285 280.4375 80.945 280.4375 81.625 280.4375 C87.3667553 292.97497664 91.97039289 304.4861859 92.625 318.4375 C92.686875 319.60152344 92.686875 319.60152344 92.75 320.7890625 C93.13211578 335.07063988 90.14348427 347.38749947 84.625 360.4375 C83.965 360.4375 83.305 360.4375 82.625 360.4375 C82.521875 361.159375 82.41875 361.88125 82.3125 362.625 C81.55706053 365.71543421 80.46968685 367.85493841 78.625 370.4375 C77.965 370.4375 77.305 370.4375 76.625 370.4375 C76.3878125 371.15292969 76.150625 371.86835938 75.90625 372.60546875 C74.41679731 375.89770411 72.55705153 378.08500847 70.125 380.75 C69.3309375 381.63300781 68.536875 382.51601563 67.71875 383.42578125 C65.625 385.4375 65.625 385.4375 63.625 385.4375 C63.625 386.0975 63.625 386.7575 63.625 387.4375 C62.27978516 388.67431641 62.27978516 388.67431641 60.4140625 390.0390625 C59.74632812 390.52890625 59.07859375 391.01875 58.390625 391.5234375 C57.68421875 392.03132813 56.9778125 392.53921875 56.25 393.0625 C55.55132813 393.578125 54.85265625 394.09375 54.1328125 394.625 C48.88810351 398.4375 48.88810351 398.4375 46.625 398.4375 C46.625 399.0975 46.625 399.7575 46.625 400.4375 C47.18058594 400.68371094 47.73617187 400.92992187 48.30859375 401.18359375 C51.06844588 402.67754406 53.27816859 404.48808408 55.6875 406.5 C56.65042969 407.30050781 57.61335937 408.10101563 58.60546875 408.92578125 C60.10013672 410.16908203 60.10013672 410.16908203 61.625 411.4375 C64.45377133 413.72640124 67.28401565 416.01342306 70.1171875 418.296875 C72.625 420.4375 72.625 420.4375 75.2578125 423.078125 C77.58714184 425.55272989 77.58714184 425.55272989 80.625 427.4375 C80.625 428.0975 80.625 428.7575 80.625 429.4375 C81.15996094 429.65277344 81.69492187 429.86804688 82.24609375 430.08984375 C85.49421189 431.92991068 88.00973993 434.43548546 90.6875 437 C95.82471908 441.85185877 101.0981229 446.35094522 106.67578125 450.6953125 C107.31902344 451.27023437 107.96226562 451.84515625 108.625 452.4375 C108.625 453.0975 108.625 453.7575 108.625 454.4375 C109.615 454.7675 110.605 455.0975 111.625 455.4375 C111.625 456.0975 111.625 456.7575 111.625 457.4375 C112.17671875 457.66050781 112.7284375 457.88351562 113.296875 458.11328125 C116.3555676 459.85304097 118.4323812 462.09514482 120.875 464.625 C123.91451665 467.76554105 126.95447378 470.75546825 130.27612305 473.59521484 C134.78977183 477.52677598 139.02834418 481.69656708 143.25390625 485.93359375 C144.4439048 487.12215721 144.4439048 487.12215721 145.65794373 488.33473206 C147.32389081 490.00000283 148.98859256 491.66652029 150.65209961 493.33422852 C153.18036134 495.86784622 155.71391661 498.39608167 158.24804688 500.92382812 C159.8753207 502.55176283 161.50228425 504.18000775 163.12890625 505.80859375 C163.87701065 506.55467392 164.62511505 507.30075409 165.39588928 508.06944275 C169.47048947 512.16202093 173.37780132 516.34123117 177.13342285 520.72917175 C179.86754201 523.86060414 182.90354001 526.68104251 185.90234375 529.5546875 C187.625 531.4375 187.625 531.4375 187.625 533.4375 C188.615 533.7675 189.605 534.0975 190.625 534.4375 C192.1328125 535.93359375 192.1328125 535.93359375 193.75 537.875 C196.45600275 541.06421753 199.19565115 544.20908597 202 547.3125 C202.74894531 548.14523437 203.49789062 548.97796875 204.26953125 549.8359375 C205.90380754 551.64095907 207.54774744 553.43725974 209.19921875 555.2265625 C210.43091797 556.56847656 210.43091797 556.56847656 211.6875 557.9375 C212.44160156 558.7521875 213.19570313 559.566875 213.97265625 560.40625 C215.625 562.4375 215.625 562.4375 215.625 564.4375 C216.285 564.4375 216.945 564.4375 217.625 564.4375 C221.625 568.90808824 221.625 568.90808824 221.625 571.4375 C222.615 571.7675 223.605 572.0975 224.625 572.4375 C226.5 574.484375 226.5 574.484375 228.625 577.1875 C229.42164063 578.18652344 230.21828125 579.18554688 231.0390625 580.21484375 C231.67183105 581.00930908 231.67183105 581.00930908 232.31738281 581.81982422 C234.4911396 584.50901625 236.75040247 587.12426913 239 589.75 C243.33823374 594.83993051 247.5128698 600.03969847 251.6159668 605.32055664 C255.31942681 610.08176505 259.15029675 614.71963766 263.04296875 619.328125 C264.625 621.4375 264.625 621.4375 264.625 623.4375 C270.53255606 621.19521595 276.42939246 618.93834863 282.2734375 616.53515625 C292.86475106 612.19359127 303.48754352 608.41692692 314.44580078 605.11254883 C316.74879066 604.39915347 319.03225059 603.63864311 321.31640625 602.8671875 C325.51792235 601.45363159 329.75611079 600.29392308 334.046875 599.18359375 C336.61570685 598.49158446 336.61570685 598.49158446 338.95703125 597.47265625 C342.41519478 596.13090905 345.96146953 595.29345525 349.5625 594.4375 C353.29871278 593.544437 356.98321535 592.6519846 360.62890625 591.43359375 C364.24651163 590.23086967 367.91355919 589.35306353 371.625 588.5 C372.36540527 588.32815186 373.10581055 588.15630371 373.86865234 587.97924805 C392.02010808 583.79030104 392.02010808 583.79030104 398.4609375 582.91796875 C401.48086779 582.77927689 401.48086779 582.77927689 402.625 581.4375 C406.24145645 580.88857357 409.86829174 580.4708148 413.5 580.03515625 C416.39200589 579.65472991 419.20056206 579.11501668 422.04296875 578.4609375 C426.6481721 577.40133754 431.25915353 576.65524479 435.9375 576 C436.83210938 575.87439697 437.72671875 575.74879395 438.6484375 575.61938477 C450.94388555 573.93712491 463.27334012 572.62765166 475.625 571.4375 C477.19797852 571.27652832 477.19797852 571.27652832 478.80273438 571.11230469 C517.54071355 567.25320809 557.15762454 568.50774398 595.89453125 571.68359375 C596.64175949 571.74407898 597.38898773 571.80456421 598.15885925 571.86688232 C601.16027142 572.13072813 603.75369925 572.48039975 606.625 573.4375 C608.12123579 573.61580608 609.62238383 573.75467424 611.125 573.8671875 C627.38120057 575.17855468 641.78068945 576.603897 653.5 589.3125 C656.78146286 593.36514598 659.37352807 597.74060912 661.625 602.4375 C662.17027344 603.53191406 662.17027344 603.53191406 662.7265625 604.6484375 C665.48970698 613.22619907 665.13815635 624.29860551 661.36108398 632.47680664 C655.43845591 643.84768894 646.8670001 652.20844542 634.625 656.4375 C629.13749634 658.13142442 624.82724727 658.46364611 619.14892578 657.74902344 C616.52141631 657.42471486 613.89469801 657.17304601 611.2578125 656.9375 C609.90042969 656.81375 609.90042969 656.81375 608.515625 656.6875 C606.64862628 656.51873175 604.78143186 656.35211658 602.9140625 656.1875 C602.016875 656.105 601.1196875 656.0225 600.1953125 655.9375 C599.38852051 655.8653125 598.58172852 655.793125 597.75048828 655.71875 C595.625 655.4375 595.625 655.4375 592.625 654.4375 C589.81242251 654.21285559 587.01629761 654.0369636 584.19921875 653.90234375 C583.35334702 653.85918533 582.50747528 653.81602692 581.63597107 653.77156067 C578.86174613 653.63300972 576.08724403 653.50271756 573.3125 653.375 C572.35929871 653.33080933 571.40609741 653.28661865 570.42401123 653.24108887 C545.85656293 652.12117877 521.50300469 652.28931385 496.9375 653.375 C495.94727844 653.41838501 494.95705688 653.46177002 493.93682861 653.50646973 C491.12033444 653.63259104 488.30429029 653.7658564 485.48828125 653.90234375 C484.21080269 653.96025337 484.21080269 653.96025337 482.90751648 654.01933289 C479.61178983 654.18702901 476.77166724 654.38861092 473.625 655.4375 C471.95053148 655.63976358 470.27100302 655.80163649 468.58984375 655.9375 C467.12901367 656.06125 467.12901367 656.06125 465.63867188 656.1875 C463.58400998 656.35448205 461.52932234 656.52114753 459.47460938 656.6875 C458.01571289 656.81125 458.01571289 656.81125 456.52734375 656.9375 C455.63523193 657.0096875 454.74312012 657.081875 453.82397461 657.15625 C451.58580744 657.31954351 451.58580744 657.31954351 449.625 658.4375 C445.96277909 658.87949218 442.30091773 659.25176644 438.62890625 659.59960938 C433.45247014 660.12755435 428.65321522 661.09875087 423.625 662.4375 C421.96250514 662.77148334 420.29597564 663.0864269 418.625 663.375 C417.69558594 663.54 416.76617188 663.705 415.80859375 663.875 C414.75800781 664.060625 413.70742187 664.24625 412.625 664.4375 C402.04119725 666.33246367 391.60876011 668.43402875 381.26171875 671.40234375 C376.24539578 672.83019078 371.19645825 674.1268577 366.1484375 675.4375 C362.78777862 676.32038731 362.78777862 676.32038731 360.30371094 677.38769531 C357.32150351 678.5564423 354.33316343 679.39493953 351.2421875 680.234375 C343.61691018 682.3811624 336.19402072 684.97771891 328.75 687.6875 C327.46499679 688.15146576 326.17984098 688.61500908 324.89453125 689.078125 C321.8031722 690.19380345 318.71338904 691.31363208 315.625 692.4375 C315.96644043 692.9543335 316.30788086 693.47116699 316.65966797 694.00366211 C323.45617997 704.31455143 330.08001393 714.67708506 336.2578125 725.37109375 C337.88081632 728.17982592 339.54394428 730.95876227 341.2421875 733.72265625 C341.66338867 734.41061279 342.08458984 735.09856934 342.51855469 735.80737305 C343.31869646 737.11022087 344.1237713 738.41005646 344.93457031 739.70629883 C347.625 744.10486984 347.625 744.10486984 347.625 747.4375 C348.285 747.4375 348.945 747.4375 349.625 747.4375 C355.46797355 758.9765567 361.08305547 770.61458184 366.60693359 782.30957031 C367.28782401 783.73274559 368.00499315 785.13910152 368.75634766 786.52636719 C369.625 788.4375 369.625 788.4375 369.625 791.4375 C370.285 791.4375 370.945 791.4375 371.625 791.4375 C371.955 793.7475 372.285 796.0575 372.625 798.4375 C373.285 798.4375 373.945 798.4375 374.625 798.4375 C375.29967562 800.18442795 375.96444156 801.93518525 376.625 803.6875 C376.99625 804.66203125 377.3675 805.6365625 377.75 806.640625 C378.625 809.4375 378.625 809.4375 378.625 813.4375 C379.285 813.4375 379.945 813.4375 380.625 813.4375 C381.9013072 817.51914222 383.17000803 821.60311258 384.4375 825.6875 C384.97213867 827.39679688 384.97213867 827.39679688 385.51757812 829.140625 C390.94736191 846.6753396 395.00475524 864.06274901 395.625 882.4375 C395.66625 883.39140625 395.7075 884.3453125 395.75 885.328125 C396.03062793 897.04434112 394.8187399 908.83920418 389.625 919.4375 C389.32722656 920.11941406 389.02945312 920.80132813 388.72265625 921.50390625 C383.93005315 932.01472248 375.10965925 941.68009725 366.625 949.4375 C365.965 949.4375 365.305 949.4375 364.625 949.4375 C364.625 950.0975 364.625 950.7575 364.625 951.4375 C357.95082 956.21164317 350.64433847 959.34337244 342.9765625 962.125 C339.39635173 963.52704058 336.04341227 965.17902628 332.625 966.9375 C327.07517237 969.78641152 321.49006773 972.09489332 315.64453125 974.2578125 C312.01231036 975.67686904 308.60783917 977.39622405 305.1484375 979.1875 C301.50043991 980.99455763 297.74732172 982.51052146 293.97265625 984.03125 C291.2039925 985.19428262 288.47631144 986.4072175 285.74609375 987.65625 C277.71699233 991.32529863 269.61517671 994.82775279 261.52246094 998.35351562 C251.16688867 1002.8668635 240.84866812 1007.44313331 230.625 1012.25 C225.2002511 1014.76563861 219.71118576 1017.0859741 214.1875 1019.375 C207.24501128 1022.25386076 200.57365293 1025.41878096 193.88671875 1028.8515625 C189.62983761 1030.92137536 185.26293454 1032.55491135 180.828125 1034.19921875 C176.48208577 1035.87933392 172.29681687 1037.8495021 168.08203125 1039.83203125 C163.62659012 1041.90116832 159.12776463 1043.86235979 154.61987305 1045.81396484 C150.86742767 1047.44257785 147.13548395 1049.11015041 143.4140625 1050.80859375 C136.28894318 1054.05704448 129.11398716 1057.19017679 121.94140625 1060.33203125 C115.98589289 1062.94539002 110.05137733 1065.59860086 104.13476562 1068.29882812 C100.64700912 1069.88121104 97.13843544 1071.41320955 93.625 1072.9375 C88.23433372 1075.28545718 82.86944761 1077.68065838 77.5234375 1080.12890625 C73.256069 1082.05554836 68.95950484 1083.91427821 64.66577148 1085.78125 C60.47756532 1087.60861512 56.32441724 1089.49589304 52.1875 1091.4375 C47.16135854 1093.7817824 42.0755008 1095.9176335 36.9375 1098 C31.49653876 1100.20540615 26.22309861 1102.5529353 21.0078125 1105.2578125 C17.40768313 1107.04017163 13.69736814 1108.53064665 9.97265625 1110.03125 C6.15868656 1111.63338429 2.40465789 1113.34909483 -1.35766602 1115.06835938 C-7.56390384 1117.88449189 -13.81606375 1120.59757332 -20.05859375 1123.33203125 C-28.87888753 1127.20249391 -37.65811459 1131.15157802 -46.375 1135.25 C-52.68357159 1138.17091381 -59.07890765 1140.86128295 -65.49267578 1143.54174805 C-71.50855315 1146.05995199 -77.46300391 1148.68335311 -83.375 1151.4375 C-97.22271063 1157.87010454 -111.15715339 1164.08297437 -125.203125 1170.0703125 C-130.76517968 1172.46774986 -136.2661132 1174.99754097 -141.76171875 1177.54296875 C-148.08644773 1180.4521455 -154.47264846 1183.20473445 -160.875 1185.9375 C-169.05994793 1189.43198038 -177.19527739 1193.00246736 -185.25 1196.7890625 C-192.59433183 1200.22253763 -200.01311843 1203.41586448 -207.49267578 1206.54174805 C-213.50862281 1209.05998115 -219.46209182 1211.68524544 -225.375 1214.4375 C-227.54151007 1215.43783922 -229.70818484 1216.43782181 -231.875 1217.4375 C-236.39237908 1219.52160148 -236.39237908 1219.52160148 -240.90625 1221.61328125 C-248.10139357 1224.92623501 -255.38673128 1228.02173732 -262.67138672 1231.13110352 C-268.94706209 1233.81385642 -275.18271586 1236.5669047 -281.375 1239.4375 C-288.48752488 1242.73469696 -295.6652582 1245.86010977 -302.875 1248.9375 C-311.05994793 1252.43198038 -319.19527739 1256.00246736 -327.25 1259.7890625 C-333.71382939 1262.81090274 -340.22153999 1265.64369362 -346.8125 1268.375 C-353.75770466 1271.25498698 -360.43146002 1274.42150844 -367.12109375 1277.85546875 C-371.32938803 1279.90151819 -375.64636469 1281.50586011 -380.03125 1283.12890625 C-384.3544469 1284.82081158 -388.51881663 1286.78468133 -392.7097168 1288.77685547 C-398.00582926 1291.28816082 -403.36166961 1293.61100041 -408.765625 1295.8828125 C-411.6321395 1297.11752329 -414.47122275 1298.38843719 -417.30859375 1299.6875 C-421.83718212 1301.7547817 -426.3896601 1303.76240247 -430.95703125 1305.7421875 C-431.62489655 1306.03215607 -432.29276184 1306.32212463 -432.98086548 1306.62088013 C-435.73667562 1307.81706834 -438.49266199 1309.01279819 -441.2512207 1310.20263672 C-449.71999932 1313.8581233 -458.04170978 1317.67698092 -466.24072266 1321.90649414 C-470.45081277 1323.96300412 -474.78257434 1325.57178481 -479.171875 1327.19921875 C-483.51791423 1328.87933392 -487.70318313 1330.8495021 -491.91796875 1332.83203125 C-495.75436988 1334.61368194 -499.62078375 1336.31425772 -503.5 1338 C-510.62219163 1341.09909759 -517.7054256 1344.27523402 -524.75390625 1347.5390625 C-531.08098469 1350.45011267 -537.46997115 1353.20359167 -543.875 1355.9375 C-552.05994793 1359.43198038 -560.19527739 1363.00246736 -568.25 1366.7890625 C-575.59433183 1370.22253763 -583.01311843 1373.41586448 -590.49267578 1376.54174805 C-597.57212572 1379.50515599 -604.55016479 1382.65162189 -611.50390625 1385.8984375 C-617.8717316 1388.86056641 -624.27029816 1391.67442857 -630.76953125 1394.3359375 C-632.89873821 1395.23614194 -634.94922747 1396.1873721 -637 1397.25 C-639.375 1398.4375 -639.375 1398.4375 -641.375 1398.4375 C-641.375 1399.0975 -641.375 1399.7575 -641.375 1400.4375 C-645.77070794 1400.5247253 -650.16619271 1400.57796869 -654.5625 1400.625 C-656.43131836 1400.66270508 -656.43131836 1400.66270508 -658.33789062 1400.70117188 C-659.53994141 1400.71083984 -660.74199219 1400.72050781 -661.98046875 1400.73046875 C-663.08543701 1400.7461792 -664.19040527 1400.76188965 -665.32885742 1400.77807617 C-668.76043889 1400.39440573 -670.55870121 1399.37798927 -673.375 1397.4375 C-675.07193826 1396.64189499 -676.78095139 1395.87163156 -678.5 1395.125 C-684.30259865 1392.53554101 -689.84034406 1389.55275122 -695.375 1386.4375 C-695.375 1385.7775 -695.375 1385.1175 -695.375 1384.4375 C-696.10589844 1384.17839844 -696.83679688 1383.91929688 -697.58984375 1383.65234375 C-708.43982923 1378.91974139 -719.74984226 1367.04856434 -727.16015625 1357.8984375 C-728.49373517 1356.23604331 -728.49373517 1356.23604331 -730.75 1354.1875 C-744.375 1339.91369048 -744.375 1339.91369048 -744.375 1333.4375 C-745.035 1333.4375 -745.695 1333.4375 -746.375 1333.4375 C-755.01535421 1317.4528447 -758.88733855 1302.45608234 -755.375 1284.4375 C-754.715 1284.4375 -754.055 1284.4375 -753.375 1284.4375 C-753.29507813 1283.62925781 -753.21515625 1282.82101562 -753.1328125 1281.98828125 C-752.16748359 1277.46516796 -750.30377752 1273.74560426 -748.25 1269.625 C-743.90525867 1260.7054656 -740.04448007 1251.65249658 -736.375 1242.4375 C-735.715 1242.4375 -735.055 1242.4375 -734.375 1242.4375 C-734.27832031 1241.59832031 -734.18164062 1240.75914063 -734.08203125 1239.89453125 C-733.28260182 1235.98571886 -731.80898392 1232.67654725 -730.0625 1229.125 C-729.42265542 1227.78931227 -728.78332953 1226.45337594 -728.14453125 1225.1171875 C-727.83725098 1224.48006836 -727.5299707 1223.84294922 -727.21337891 1223.18652344 C-724.1697212 1216.8368543 -721.48030362 1210.33618691 -718.81640625 1203.8203125 C-717.1847878 1199.99109413 -715.4569849 1196.21144823 -713.72827148 1192.42529297 C-711.47562254 1187.45182774 -709.30003178 1182.44528276 -707.125 1177.4375 C-706.67898438 1176.41527344 -706.23296875 1175.39304687 -705.7734375 1174.33984375 C-705.34804688 1173.36144531 -704.92265625 1172.38304687 -704.484375 1171.375 C-704.10249023 1170.49714844 -703.72060547 1169.61929687 -703.32714844 1168.71484375 C-702.60365264 1166.98439021 -701.96812019 1165.21686058 -701.375 1163.4375 C-700.715 1163.4375 -700.055 1163.4375 -699.375 1163.4375 C-699.271875 1162.58285156 -699.16875 1161.72820312 -699.0625 1160.84765625 C-698.3119206 1157.12461186 -697.04922821 1154.28158934 -695.375 1150.875 C-692.32250506 1144.55047585 -689.49413011 1138.151591 -686.75 1131.6875 C-683.71678521 1124.55941363 -680.63874575 1117.46376993 -677.375 1110.4375 C-675.86399594 1107.16433303 -674.35352016 1103.89092381 -672.84375 1100.6171875 C-671.93108916 1098.64137388 -671.01504746 1096.66711377 -670.09375 1094.6953125 C-667.66120571 1089.44039311 -665.43384381 1084.13586726 -663.3125 1078.75 C-661.55406674 1074.28755567 -659.71443893 1069.94306912 -657.4921875 1065.69140625 C-654.53744478 1059.73026447 -652.01881597 1053.54193193 -649.375 1047.4375 C-645.1553002 1037.71532989 -640.84357076 1028.04867175 -636.375 1018.4375 C-632.5562675 1010.16748423 -628.94129024 1001.8191872 -625.375 993.4375 C-622.12396837 985.79675054 -618.84613729 978.17940476 -615.35546875 970.64453125 C-614.28830789 968.33769155 -614.28830789 968.33769155 -613.375 965.4375 C-612.715 965.4375 -612.055 965.4375 -611.375 965.4375 C-611.313125 964.674375 -611.25125 963.91125 -611.1875 963.125 C-610.26870083 958.95506531 -608.70938223 955.53686691 -606.89453125 951.6875 C-605.17376887 948.00710335 -603.55237577 944.29019373 -601.9375 940.5625 C-599.81386584 935.67630775 -597.63881665 930.82343868 -595.375 926 C-592.69587099 920.2559474 -590.29831501 914.4207892 -587.92114258 908.54785156 C-585.95422714 903.72970518 -583.77568737 899.08458754 -581.375 894.46484375 C-580.09457674 891.86898565 -579.17897333 889.21486242 -578.375 886.4375 C-577.715 886.4375 -577.055 886.4375 -576.375 886.4375 C-576.313125 885.674375 -576.25125 884.91125 -576.1875 884.125 C-575.26870083 879.95506531 -573.70938223 876.53686691 -571.89453125 872.6875 C-570.17376887 869.00710335 -568.55237577 865.29019373 -566.9375 861.5625 C-564.81386584 856.67630775 -562.63881665 851.82343868 -560.375 847 C-556.76804314 839.25966554 -553.57832289 831.35103435 -550.375 823.4375 C-549.715 823.4375 -549.055 823.4375 -548.375 823.4375 C-548.27574219 822.59058594 -548.17648437 821.74367188 -548.07421875 820.87109375 C-547.30323125 817.08507132 -545.89440326 813.92791693 -544.1875 810.5 C-541.66230916 805.27836375 -539.34928235 800.03192873 -537.25 794.625 C-535.26593979 789.54092725 -533.0790255 784.64439915 -530.578125 779.79296875 C-526.69660199 772.19375324 -523.44075575 764.29480056 -520.125 756.4375 C-519.59459106 755.18078491 -519.59459106 755.18078491 -519.0534668 753.89868164 C-518.7212915 753.1071167 -518.38911621 752.31555176 -518.046875 751.5 C-517.7487793 750.78972656 -517.45068359 750.07945312 -517.14355469 749.34765625 C-516.49419447 747.73374445 -515.92512544 746.08787632 -515.375 744.4375 C-514.715 744.4375 -514.055 744.4375 -513.375 744.4375 C-513.27445313 743.58929687 -513.17390625 742.74109375 -513.0703125 741.8671875 C-512.29520167 738.04388803 -510.95996347 735.06677491 -509.25 731.5625 C-508.61029715 730.23127572 -507.97233118 728.89921566 -507.3359375 727.56640625 C-507.00948242 726.88465332 -506.68302734 726.20290039 -506.34667969 725.50048828 C-504.79009007 722.19566861 -503.32907355 718.85092425 -501.875 715.5 C-501.58890869 714.84128906 -501.30281738 714.18257812 -501.00805664 713.50390625 C-500.42603814 712.16276864 -499.84441527 710.82145927 -499.26318359 709.47998047 C-498.3549441 707.39137915 -497.43849062 705.30656149 -496.51953125 703.22265625 C-493.34169344 696.01098889 -490.2200628 688.78871816 -487.375 681.4375 C-486.715 681.4375 -486.055 681.4375 -485.375 681.4375 C-485.27832031 680.59832031 -485.18164062 679.75914062 -485.08203125 678.89453125 C-484.28260182 674.98571886 -482.80898392 671.67654725 -481.0625 668.125 C-480.42265542 666.78931227 -479.78332953 665.45337594 -479.14453125 664.1171875 C-478.83725098 663.48006836 -478.5299707 662.84294922 -478.21337891 662.18652344 C-475.1697212 655.8368543 -472.48030362 649.33618691 -469.81640625 642.8203125 C-466.93073528 636.04797899 -463.80882569 629.37960493 -460.734375 622.69140625 C-460.08855469 621.2827832 -460.08855469 621.2827832 -459.4296875 619.84570312 C-458.54682215 617.9200522 -457.66132953 615.99560399 -456.7734375 614.07226562 C-456.34804688 613.14220703 -455.92265625 612.21214844 -455.484375 611.25390625 C-454.91154785 610.00782593 -454.91154785 610.00782593 -454.32714844 608.73657227 C-453.45955815 606.6416754 -452.85431699 604.6494144 -452.375 602.4375 C-451.715 602.4375 -451.055 602.4375 -450.375 602.4375 C-450.271875 601.58285156 -450.16875 600.72820313 -450.0625 599.84765625 C-449.3119206 596.12461186 -448.04922821 593.28158934 -446.375 589.875 C-443.32251341 583.55049314 -440.49375987 577.15173861 -437.75 570.6875 C-435.00005503 564.21598599 -432.22037389 557.77236481 -429.25 551.3984375 C-428.27340749 549.29571392 -428.27340749 549.29571392 -427.375 546.4375 C-426.715 546.4375 -426.055 546.4375 -425.375 546.4375 C-425.2821875 545.2928125 -425.2821875 545.2928125 -425.1875 544.125 C-424.2678719 539.95130323 -422.70537068 536.52950844 -420.890625 532.67578125 C-419.19802754 529.059381 -417.59269872 525.41116741 -416 521.75 C-415.70544922 521.07509521 -415.41089844 520.40019043 -415.10742188 519.70483398 C-414.19581766 517.61606914 -413.28526836 515.52684731 -412.375 513.4375 C-408.88510762 505.42711803 -405.390476 497.42180731 -401.75390625 489.4765625 C-399.58093679 484.68741168 -397.45595495 479.87700336 -395.32543945 475.06884766 C-393.45214667 470.84560179 -391.55658137 466.63451632 -389.625 462.4375 C-387.36867591 457.50418123 -385.33827994 452.49376844 -383.375 447.4375 C-382.715 447.4375 -382.055 447.4375 -381.375 447.4375 C-381.313125 446.674375 -381.25125 445.91125 -381.1875 445.125 C-380.46652916 441.85290159 -379.55936864 439.46230282 -378.15234375 436.45703125 C-375.39094576 430.48645437 -372.74554218 424.47102376 -370.125 418.4375 C-369.67898438 417.41527344 -369.23296875 416.39304687 -368.7734375 415.33984375 C-368.34804688 414.36144531 -367.92265625 413.38304687 -367.484375 412.375 C-366.91154785 411.05822266 -366.91154785 411.05822266 -366.32714844 409.71484375 C-365.60365264 407.98439021 -364.96812019 406.21686058 -364.375 404.4375 C-363.715 404.4375 -363.055 404.4375 -362.375 404.4375 C-362.22611328 403.16712891 -362.22611328 403.16712891 -362.07421875 401.87109375 C-361.30323125 398.08507132 -359.89440326 394.92791693 -358.1875 391.5 C-355.66231809 386.27838221 -353.34908062 381.03199445 -351.25 375.625 C-349.32539727 370.6883311 -347.18788945 365.96520914 -344.7421875 361.265625 C-341.62078357 354.80877801 -339.0521382 348.08791248 -336.375 341.4375 C-335.715 341.4375 -335.055 341.4375 -334.375 341.4375 C-334.2925 340.65375 -334.21 339.87 -334.125 339.0625 C-333.13134931 334.259855 -331.28786482 329.93940511 -329.375 325.4375 C-328.715 325.4375 -328.055 325.4375 -327.375 325.4375 C-327.27445312 324.58929688 -327.17390625 323.74109375 -327.0703125 322.8671875 C-326.29520167 319.04388803 -324.95996347 316.06677491 -323.25 312.5625 C-321.29652544 308.52974751 -319.37287254 304.50630342 -317.671875 300.359375 C-312.0461303 286.66198136 -305.09326542 275.86747422 -293.375 266.4375 C-292.58738281 265.78910156 -291.79976563 265.14070313 -290.98828125 264.47265625 C-284.53560462 259.29079539 -278.06725584 255.57138201 -270.375 252.4375 C-269.62992188 252.10363281 -268.88484375 251.76976562 -268.1171875 251.42578125 C-249.91020451 244.86400533 -225.73030461 248.02720634 -207.375 252.4375 C-206.56659668 252.6236084 -205.75819336 252.8097168 -204.92529297 253.00146484 C-187.60376475 256.99973512 -187.60376475 256.99973512 -179.8515625 260.41015625 C-176.60761625 261.75583111 -173.27857064 262.80228167 -169.9375 263.875 C-163.51652329 265.96379971 -157.46019601 268.52243604 -151.375 271.4375 C-149.54346302 272.27477405 -147.71010449 273.10807424 -145.875 273.9375 C-144.96363281 274.35257812 -144.05226563 274.76765625 -143.11328125 275.1953125 C-141.32150645 276.00812903 -139.52731338 276.81564085 -137.73046875 277.6171875 C-125.85115406 282.93939877 -114.4000322 288.88933643 -103.09765625 295.328125 C-100.13130028 297.01722752 -97.13867389 298.64648025 -94.125 300.25 C-86.18573285 304.55543339 -78.49706344 309.30440726 -70.77636719 313.98632812 C-68.58858522 315.30842817 -66.39374546 316.6175928 -64.1953125 317.921875 C-63.00505059 318.6351535 -61.81493412 319.34867479 -60.625 320.0625 C-59.08585938 320.97902344 -59.08585938 320.97902344 -57.515625 321.9140625 C-56.80921875 322.41679687 -56.1028125 322.91953125 -55.375 323.4375 C-55.375 324.0975 -55.375 324.7575 -55.375 325.4375 C-54.78203125 325.55222656 -54.1890625 325.66695313 -53.578125 325.78515625 C-50.65824749 326.64972991 -48.86350836 328.26262302 -46.546875 330.18359375 C-39.38341114 334.31933457 -31.06670604 333.77202588 -23.0625 333.75 C-21.90298828 333.76611328 -20.74347656 333.78222656 -19.54882812 333.79882812 C-8.5096196 333.80503341 0.60299894 331.97780449 9.625 325.4375 C9.55378028 322.44627165 9.25501084 320.22597982 7.3515625 317.84375 C2.69839724 313.56196413 -2.44553994 311.43801692 -8.375 309.4375 C-9.09945312 309.17195313 -9.82390625 308.90640625 -10.5703125 308.6328125 C-17.69619385 306.22441358 -25.0821752 305.2997644 -32.4921875 304.18359375 C-56.56006602 300.5502607 -80.96854023 294.35635695 -101.375 280.4375 C-101.375 279.7775 -101.375 279.1175 -101.375 278.4375 C-102.07238281 278.21835937 -102.76976562 277.99921875 -103.48828125 277.7734375 C-107.08791215 276.10757313 -109.71110219 273.75574733 -112.5625 271.0625 C-113.12912354 270.53156738 -113.69574707 270.00063477 -114.27954102 269.45361328 C-127.34381596 256.98642586 -139.13814278 241.5791748 -142.015625 223.3359375 C-142.19113354 221.4336171 -142.19113354 221.4336171 -143.375 220.4375 C-144.2395694 214.92739221 -144.53063225 209.56996377 -144.5 204 C-144.50386719 203.30068359 -144.50773438 202.60136719 -144.51171875 201.88085938 C-144.49601623 193.33083713 -143.46227592 185.60311816 -140.6875 177.5 C-140.4205835 176.71439697 -140.15366699 175.92879395 -139.87866211 175.11938477 C-137.74096325 169.05012705 -135.15572994 163.67162612 -131.375 158.4375 C-130.84132813 157.69628906 -130.30765625 156.95507812 -129.7578125 156.19140625 C-125.35638414 150.33973768 -120.61806228 144.55242227 -115.375 139.4375 C-114.715 139.4375 -114.055 139.4375 -113.375 139.4375 C-113.375 138.7775 -113.375 138.1175 -113.375 137.4375 C-110.21158361 134.87506668 -106.75068525 132.71014444 -103.375 130.4375 C-102.64539063 129.90382812 -101.91578125 129.37015625 -101.1640625 128.8203125 C-95.01302026 124.40711119 -88.45701676 122.00018577 -81.375 119.4375 C-79.68490411 118.73538302 -77.99717044 118.02753697 -76.3125 117.3125 C-66.73191806 113.49979845 -57.05361943 111.94034138 -46.8125 111.25 C-45.76642578 111.16814453 -44.72035156 111.08628906 -43.64257812 111.00195312 C-33.92695463 110.28428758 -24.33969603 110.28624164 -14.625 110.9375 C7.71188991 112.44625291 7.71188991 112.44625291 28.8828125 106.2421875 C30.625 105.4375 30.625 105.4375 32.625 105.4375 C33.5613921 102.13804409 33.5613921 102.13804409 33.625 98.4375 C31.28420243 96.08102999 31.28420243 96.08102999 28.625 94.4375 C28.625 93.7775 28.625 93.1175 28.625 92.4375 C27.89410156 92.14746094 27.16320312 91.85742188 26.41015625 91.55859375 C24.72373799 90.87976901 23.04231941 90.18806827 21.37109375 89.47265625 C12.60537581 85.77948575 3.86939344 83.66756485 -5.5625 82.5 C-11.46284483 81.70809453 -16.19119102 80.34162243 -21.375 77.4375 C-22.52548828 76.79361328 -22.52548828 76.79361328 -23.69921875 76.13671875 C-27.74564547 73.74275948 -27.74564547 73.74275948 -29.375 72.4375 C-29.375 71.7775 -29.375 71.1175 -29.375 70.4375 C-30.365 70.1075 -31.355 69.7775 -32.375 69.4375 C-34.34765625 66.92578125 -34.34765625 66.92578125 -36.4375 63.75 C-37.47583984 62.19732422 -37.47583984 62.19732422 -38.53515625 60.61328125 C-42.21951062 54.25366319 -42.73925691 48.81749749 -42.75 41.625 C-42.77449219 40.77357422 -42.79898438 39.92214844 -42.82421875 39.04492188 C-42.85338466 32.662448 -41.38427333 28.03372974 -38.375 22.4375 C-37.92898438 21.59058594 -37.48296875 20.74367188 -37.0234375 19.87109375 C-28.50063285 6.51172817 -15.63940707 -0.4929603 0 0 Z " fill="#DD2E44" transform="translate(798.375,49.5625)"/>
                    <path d="M0 0 C4.05232874 1.35077625 4.36828133 3.01697749 6.375 6.75 C21.6722182 34.51610181 40.09617946 60.59820311 59 86 C59.69875244 86.94190186 59.69875244 86.94190186 60.41162109 87.90283203 C67.91671006 98.01198636 75.59444691 107.98034493 83.35546875 117.89404297 C84.86868622 119.83184194 86.37345871 121.77580492 87.875 123.72265625 C93.16723858 130.56012954 98.6671061 137.16311465 104.36645508 143.66552734 C108.07950374 147.90758114 111.6260803 152.24940704 115.11328125 156.6796875 C117.84975089 160.04503526 120.782305 163.22028137 123.70703125 166.421875 C126.10080409 169.1133402 128.36708285 171.88139583 130.625 174.6875 C133.67530048 178.45801031 136.81787301 181.94341232 140.3046875 185.30859375 C142.81946 187.81757184 145.11283079 190.50564345 147.421875 193.203125 C148.96173266 195.01783037 148.96173266 195.01783037 150.69140625 196.5703125 C152 198 152 198 152.1875 200.625 C150.68351577 204.89948149 148.31772136 207.31339435 145.2421875 210.5859375 C143.05807964 212.93746826 141.05219449 215.35791661 139.0625 217.875 C135.51193667 222.36174702 131.9065677 226.79934569 128.27734375 231.22265625 C126.78699798 233.04021344 125.29988506 234.86042748 123.81640625 236.68359375 C120.2566796 241.05552185 116.67079886 245.399493 113.01123047 249.68798828 C108.72680115 254.70887463 104.55157794 259.78897193 100.5 265 C96.01162437 270.77282525 91.35114711 276.37149999 86.60546875 281.93359375 C83.52012551 285.55248413 80.51455086 289.2343756 77.51171875 292.921875 C74.3538982 296.79180128 71.17703445 300.64584428 68 304.5 C61.66280724 312.19168803 55.33357697 319.88948378 49.0546875 327.62890625 C42.81406572 335.3210575 36.54659935 342.98950643 30.24267578 350.62988281 C25.11919846 356.84422018 20.03868611 363.0927795 14.96484375 369.34765625 C11.68879869 373.38591314 8.39798631 377.4119567 5.1015625 381.43359375 C3.67683835 383.17345205 2.25505291 384.91572016 0.8359375 386.66015625 C-3.18071937 391.59227025 -7.24636507 396.47431274 -11.375 401.3125 C-15.17588274 405.77083273 -18.84606118 410.30905097 -22.4375 414.9375 C-26.72971668 420.46907303 -31.21004852 425.8033846 -35.79394531 431.09472656 C-39.0888154 434.90745442 -42.24238684 438.79450673 -45.30078125 442.80078125 C-48.76390967 447.28294516 -52.40231765 451.62575216 -56 456 C-57.47945367 457.81226574 -58.95862127 459.62476505 -60.4375 461.4375 C-63.55577721 465.25293104 -66.70668618 469.03855273 -69.875 472.8125 C-73.48055607 477.12579273 -76.98442572 481.50159001 -80.4375 485.9375 C-84.46195354 491.10663343 -88.61709929 496.13534 -92.87915039 501.10961914 C-96.1542402 504.95075954 -99.28538704 508.88373816 -102.375 512.875 C-106.8290935 518.61877427 -111.50930081 524.12735146 -116.29541016 529.59619141 C-120.99011316 534.9641712 -125.51683315 540.45415657 -130 546 C-131.49885816 547.83426698 -132.99887277 549.66758952 -134.5 551.5 C-135.24765625 552.41394531 -135.9953125 553.32789063 -136.765625 554.26953125 C-138.21297051 556.03822795 -139.66085301 557.80648543 -141.109375 559.57421875 C-145.58581045 565.03906421 -150.047064 570.51600645 -154.5 576 C-158.95524623 581.48683872 -163.41791421 586.96735533 -167.8984375 592.43359375 C-169.32316165 594.17345205 -170.74494709 595.91572016 -172.1640625 597.66015625 C-175.730385 602.03929784 -179.32197302 606.39122249 -182.98803711 610.68701172 C-187.20450663 615.62861603 -191.3224386 620.62346408 -195.3125 625.75 C-203.50794949 636.27642844 -212.02958883 646.53916446 -220.6875 656.6875 C-224.8885002 661.61188671 -228.90418339 666.65975754 -232.87573242 671.77026367 C-236.42359258 676.3164913 -240.11623036 680.718581 -243.8684082 685.09667969 C-247.25235831 689.06502609 -250.48960298 693.13074076 -253.6875 697.25 C-257.3569065 701.97600475 -261.15532657 706.50581509 -265.1796875 710.9375 C-267.62489857 713.70803958 -269.84897035 716.62507489 -272.09375 719.55859375 C-274.71228679 722.91225255 -277.44403583 726.1669711 -280.17626953 729.42822266 C-283.63253723 733.554199 -287.04656658 737.71259936 -290.44921875 741.8828125 C-293.0265594 745.03767031 -295.62028823 748.17892844 -298.21313477 751.32104492 C-303.23530764 757.40798475 -308.2364785 763.50706658 -313.1484375 769.68359375 C-315.97629414 773.22139752 -318.84987449 776.72130002 -321.72265625 780.22265625 C-323.21300202 782.04021344 -324.70011494 783.86042748 -326.18359375 785.68359375 C-329.74339278 790.05561074 -333.32931488 794.3996969 -336.98901367 798.68823242 C-341.77856969 804.30121749 -346.40785988 810.01020715 -350.94042969 815.83251953 C-354.72744498 820.68589994 -358.63919998 825.41768449 -362.59765625 830.1328125 C-366.44128466 834.72016738 -370.2168291 839.36277994 -374 844 C-375.49971592 845.83356573 -376.99971683 847.66689838 -378.5 849.5 C-379.61375 850.86125 -379.61375 850.86125 -380.75 852.25 C-423.5 904.5 -423.5 904.5 -425.7265625 907.20703125 C-427.32326556 909.16861662 -428.89971448 911.14677893 -430.4609375 913.13671875 C-431.25757813 914.14347656 -432.05421875 915.15023437 -432.875 916.1875 C-433.59429687 917.10917969 -434.31359375 918.03085938 -435.0546875 918.98046875 C-435.69664062 919.64691406 -436.33859375 920.31335937 -437 921 C-437.99 921 -438.98 921 -440 921 C-440 920.34 -440 919.68 -440 919 C-440.88429688 919.07863281 -441.76859375 919.15726563 -442.6796875 919.23828125 C-446.77240223 918.94456878 -448.06280623 917.86106673 -451.125 915.1875 C-452.06988281 914.36894531 -453.01476562 913.55039063 -453.98828125 912.70703125 C-454.9931624 911.80577331 -455.99704361 910.9033994 -457 910 C-458.05598478 909.06640081 -459.11197441 908.13280712 -460.16796875 907.19921875 C-465.00948726 902.87496607 -469.69022184 898.5172913 -473.78515625 893.4609375 C-475.11873517 891.79854331 -475.11873517 891.79854331 -477.375 889.75 C-491 875.47619048 -491 875.47619048 -491 869 C-491.66 869 -492.32 869 -493 869 C-501.64035421 853.0153447 -505.51233855 838.01858234 -502 820 C-501.34 820 -500.68 820 -500 820 C-499.92910156 819.21367188 -499.85820312 818.42734375 -499.78515625 817.6171875 C-498.72515969 812.73382025 -496.63383689 808.59166981 -494.4375 804.125 C-494.01275391 803.24585938 -493.58800781 802.36671875 -493.15039062 801.4609375 C-492.10703441 799.30388644 -491.05678116 797.15049712 -490 795 C-489.01 795 -488.02 795 -487 795 C-487 794.01 -487 793.02 -487 792 C-486.34 792 -485.68 792 -485 792 C-484.77957031 791.360625 -484.55914062 790.72125 -484.33203125 790.0625 C-482.48293298 785.81120075 -480.09398037 781.95648836 -477.6875 778 C-477.15406982 777.11699219 -476.62063965 776.23398438 -476.07104492 775.32421875 C-471.83152257 768.32414914 -467.52668112 761.36503654 -463.20532227 754.4152832 C-458.62451325 747.03849207 -454.12018041 739.61658179 -449.625 732.1875 C-443.60813452 722.24438915 -437.49959326 712.36444716 -431.31738281 702.52294922 C-426.92672937 695.5197046 -422.64436338 688.4586144 -418.41235352 681.35864258 C-414.34472628 674.54432913 -410.17747316 667.7952258 -405.98901367 661.0546875 C-402.01989611 654.66179348 -398.09322831 648.24429655 -394.1875 641.8125 C-388.41248547 632.30395439 -382.59318124 622.82335972 -376.75732422 613.35205078 C-372.92932685 607.13842235 -369.11191031 600.91864536 -365.3125 594.6875 C-361.46509513 588.37856025 -357.58327477 582.09167489 -353.6875 575.8125 C-346.72331209 564.58310906 -339.85771917 553.29462187 -333 542 C-325.72156458 530.01246103 -318.42432919 518.03827364 -311.03271484 506.12011719 C-300.30659961 488.82534577 -289.65808341 471.48305735 -279.0859375 454.09375 C-278.57643555 453.2584375 -278.06693359 452.423125 -277.54199219 451.5625 C-276.45754383 449.76035149 -275.39212424 447.94668262 -274.34082031 446.125 C-273.80811523 445.2071875 -273.27541016 444.289375 -272.7265625 443.34375 C-272.25041504 442.51037109 -271.77426758 441.67699219 -271.28369141 440.81835938 C-270.86007324 440.21830078 -270.43645508 439.61824219 -270 439 C-269.34 439 -268.68 439 -268 439 C-268.00902344 438.07960938 -268.01804687 437.15921875 -268.02734375 436.2109375 C-267.69204031 421.89493864 -262.01513545 410.33705052 -252 400 C-247.87147469 396.35067852 -243.58304319 393.05536213 -239 390 C-237.70664997 387.97352301 -237.70664997 387.97352301 -236.5 385.5 C-233.81719116 380.42441572 -230.94167548 375.51385538 -227.9375 370.625 C-227.46586426 369.85720215 -226.99422852 369.0894043 -226.50830078 368.29833984 C-224.01258306 364.24579722 -221.50510227 360.20057341 -218.99609375 356.15625 C-217.95570535 354.47918144 -216.91534131 352.80209777 -215.875 351.125 C-215.34189209 350.26600098 -214.80878418 349.40700195 -214.25952148 348.52197266 C-209.62642046 341.04277559 -205.05852275 333.5247474 -200.5 326 C-192.8896649 313.43916033 -185.18762734 300.93741391 -177.42480469 288.47021484 C-171.06918759 278.26099217 -164.79014419 268.01305824 -158.625 257.6875 C-152.39404152 247.25381619 -146.00535909 236.9273572 -139.53515625 226.640625 C-133.23415421 216.61164782 -127.07243944 206.49743693 -120.93255615 196.3692627 C-119.8359638 194.5606163 -118.73863567 192.75241811 -117.64111328 190.94433594 C-114.19612358 185.26885949 -110.75294191 179.59229731 -107.3125 173.9140625 C-101.50386858 164.33762597 -95.64116748 154.79952445 -89.6875 145.3125 C-82.01143957 133.0791233 -74.52153328 120.73668866 -67.04589844 108.38037109 C-59.70322284 96.24830829 -52.35968425 84.11845258 -44.81323242 72.11181641 C-41.28198872 66.48089506 -37.82508002 60.80593359 -34.375 55.125 C-24.68880425 39.17746587 -14.93005061 23.27356351 -5.0625 7.4375 C-4.65547852 6.78273682 -4.24845703 6.12797363 -3.82910156 5.45336914 C-1.11979694 1.11979694 -1.11979694 1.11979694 0 0 Z " fill="#E9586D" transform="translate(545,514)"/>
                    <path d="M0 0 C2.05777317 0.00537086 4.11532903 0.00001783 6.1730957 -0.00634766 C35.10717067 -0.02532855 60.89393792 9.91200798 81.74536133 30.13037109 C96.12016752 44.96701845 104.9050673 64.29552173 104.80786133 85.08544922 C104.78723633 86.19339844 104.76661133 87.30134766 104.74536133 88.44287109 C104.74020508 89.57015625 104.73504883 90.69744141 104.72973633 91.85888672 C104.65573859 99.72577127 104.21400135 106.68988261 101.49536133 114.13037109 C101.25172852 114.89865234 101.0080957 115.66693359 100.75708008 116.45849609 C96.65977865 128.80454973 89.91271942 139.28909162 81.49536133 149.13037109 C80.53697664 150.33866369 79.57863517 151.54699058 78.62036133 152.75537109 C77.91911133 153.53912109 77.21786133 154.32287109 76.49536133 155.13037109 C75.83536133 155.13037109 75.17536133 155.13037109 74.49536133 155.13037109 C74.16536133 156.12037109 73.83536133 157.11037109 73.49536133 158.13037109 C72.83536133 158.13037109 72.17536133 158.13037109 71.49536133 158.13037109 C71.49536133 158.79037109 71.49536133 159.45037109 71.49536133 160.13037109 C69.21810483 161.96657791 66.93802635 163.68677048 64.55786133 165.38037109 C63.86273437 165.87907715 63.16760742 166.3777832 62.45141602 166.89160156 C61.07334562 167.87708587 59.69302454 168.85943165 58.31030273 169.83837891 C56.91493133 170.83169414 55.53551067 171.84744546 54.16333008 172.87255859 C39.74040978 183.27116101 21.72529658 189.18100423 4.76489258 193.88818359 C-6.46483498 197.25255541 -21.56337723 203.29899446 -27.50463867 214.13037109 C-28.50948522 217.35119813 -28.50948522 217.35119813 -27.50463867 220.13037109 C-22.12886242 224.71559201 -14.98541192 224.31180733 -8.25463867 224.31787109 C-7.20469727 224.33624023 -7.20469727 224.33624023 -6.13354492 224.35498047 C-0.38579545 224.3706847 4.90381689 223.39863236 10.49536133 222.13037109 C12.09202637 221.77857788 12.09202637 221.77857788 13.72094727 221.41967773 C18.43641695 220.37710329 23.14749678 219.3153357 27.85864258 218.25341797 C29.01235352 217.99496094 30.16606445 217.73650391 31.35473633 217.47021484 C32.9088623 217.12011353 32.9088623 217.12011353 34.49438477 216.76293945 C40.20775899 215.55863156 45.66905742 214.95361554 51.50708008 214.89208984 C52.26911743 214.88238663 53.03115479 214.87268341 53.81628418 214.86268616 C56.27186363 214.83782131 58.7271687 214.82517142 61.18286133 214.81787109 C62.01661285 214.81525269 62.85036438 214.81263428 63.7093811 214.80993652 C76.05797479 214.80576807 87.64293269 215.35437613 99.49536133 219.13037109 C100.41317383 219.41912109 101.33098633 219.70787109 102.27661133 220.00537109 C104.77186195 220.91273496 107.10461887 221.97496669 109.49536133 223.13037109 C110.07318359 223.39301758 110.65100586 223.65566406 111.24633789 223.92626953 C121.21473926 228.45736106 130.39933883 233.672049 138.49536133 241.13037109 C138.49536133 241.79037109 138.49536133 242.45037109 138.49536133 243.13037109 C139.48536133 243.46037109 140.47536133 243.79037109 141.49536133 244.13037109 C158.14744205 261.62151015 165.97854958 282.2076223 165.49536133 306.13037109 C165.33642793 309.4955559 165.07398388 312.84019374 164.74536133 316.19287109 C164.67172363 316.9538208 164.59808594 317.71477051 164.5222168 318.4987793 C163.50366318 327.19075412 160.43693204 334.72444907 156.43286133 342.44287109 C156.0815918 343.131875 155.73032227 343.82087891 155.3684082 344.53076172 C154.70212029 345.83688756 154.0335095 347.14183231 153.36206055 348.4453125 C152.39123395 350.33281819 151.43871728 352.22899563 150.49536133 354.13037109 C149.83536133 354.13037109 149.17536133 354.13037109 148.49536133 354.13037109 C148.20145508 355.14164063 148.20145508 355.14164063 147.90161133 356.17333984 C145.94886994 360.27952103 143.11359671 363.17135397 139.99536133 366.44287109 C139.37113281 367.10424072 138.7469043 367.76561035 138.10375977 368.44702148 C133.30082088 373.45859649 128.35141643 378.34329414 122.49536133 382.13037109 C121.83536133 382.13037109 121.17536133 382.13037109 120.49536133 382.13037109 C120.49536133 382.79037109 120.49536133 383.45037109 120.49536133 384.13037109 C118.56819233 385.62377215 116.67078338 386.94827192 114.62036133 388.25537109 C113.9997583 388.65208008 113.37915527 389.04878906 112.73974609 389.45751953 C105.05480311 394.21554112 96.83822105 397.70439844 88.49536133 401.13037109 C87.36098633 401.60345703 86.22661133 402.07654297 85.05786133 402.56396484 C79.85520026 404.6515326 74.64685551 406.40206241 69.24975586 407.89624023 C55.10865118 411.82607496 40.9821407 417.40020204 32.49536133 430.13037109 C32.32822563 432.75568633 32.32822563 432.75568633 32.49536133 435.13037109 C45.96165085 441.4512825 62.94258987 440.30920147 76.98364258 436.07958984 C87.94595895 433.11647207 98.13042241 435.00373443 108.05786133 439.88037109 C118.01571548 445.988777 125.39047772 454.77339683 128.49536133 466.13037109 C128.91336047 469.28922616 128.97307714 472.38443848 128.93286133 475.56787109 C128.92150146 476.82736572 128.92150146 476.82736572 128.90991211 478.11230469 C128.74617784 484.24696182 127.92048764 488.93949644 124.49536133 494.13037109 C123.84180664 495.25958984 123.84180664 495.25958984 123.17504883 496.41162109 C115.48883853 509.01196584 104.04616171 514.5722304 90.12817383 517.94677734 C78.67666176 520.49566229 67.74235785 521.31694555 56.05908203 521.31567383 C53.82996192 521.31784952 51.60134677 521.33602988 49.37231445 521.35498047 C26.32267632 521.44506054 8.26778892 515.54961194 -11.50463867 504.13037109 C-12.47401367 503.59412109 -13.44338867 503.05787109 -14.44213867 502.50537109 C-15.46307617 501.82474609 -15.46307617 501.82474609 -16.50463867 501.13037109 C-16.50463867 500.47037109 -16.50463867 499.81037109 -16.50463867 499.13037109 C-17.08213867 498.86224609 -17.65963867 498.59412109 -18.25463867 498.31787109 C-20.5601391 497.1010792 -22.5252006 495.8270323 -24.50463867 494.13037109 C-24.50463867 493.47037109 -24.50463867 492.81037109 -24.50463867 492.13037109 C-25.49463867 491.80037109 -26.48463867 491.47037109 -27.50463867 491.13037109 C-36.64244441 481.64812479 -43.76649107 469.72931301 -47.50463867 457.13037109 C-47.71733398 456.42267578 -47.9300293 455.71498047 -48.14916992 454.98583984 C-50.75188125 445.4924971 -50.74507208 435.90799632 -50.50463867 426.13037109 C-50.48788086 425.35951172 -50.47112305 424.58865234 -50.45385742 423.79443359 C-49.32064401 406.89336505 -40.3912309 390.38362063 -30.50463867 377.13037109 C-29.60704608 375.83992634 -28.7110359 374.5483784 -27.81713867 373.25537109 C-25.85230792 370.6001944 -24.00302518 368.28415257 -21.50463867 366.13037109 C-20.84463867 366.13037109 -20.18463867 366.13037109 -19.50463867 366.13037109 C-19.50463867 365.47037109 -19.50463867 364.81037109 -19.50463867 364.13037109 C-2.93950023 348.66747571 -2.93950023 348.66747571 5.49536133 347.13037109 C5.49536133 346.47037109 5.49536133 345.81037109 5.49536133 345.13037109 C9.66596126 343.15997042 13.83821746 341.19333136 18.01489258 339.23583984 C20.60285355 338.02291952 23.18298914 336.79849803 25.75708008 335.55615234 C30.59795164 333.25656571 35.08446204 331.59761155 40.34301758 330.57177734 C54.70807356 327.62576768 72.8437748 320.34437561 81.49536133 308.13037109 C82.55330465 306.16040766 83.57372595 304.16767034 84.49536133 302.13037109 C83.83536133 302.13037109 83.17536133 302.13037109 82.49536133 302.13037109 C82.49536133 301.47037109 82.49536133 300.81037109 82.49536133 300.13037109 C64.82607545 294.60254981 48.20348736 297.47790473 30.84301758 302.50537109 C28.6777274 303.08182106 26.59005889 303.46837989 24.37036133 303.75537109 C21.60333094 303.81916456 21.60333094 303.81916456 20.49536133 305.13037109 C14.57809698 306.18254665 8.57801645 306.27915245 2.58520508 306.26318359 C1.77346329 306.26414032 0.9617215 306.26509705 0.12538147 306.26608276 C-1.57624388 306.26675791 -3.27787191 306.26495051 -4.97949219 306.26074219 C-7.5641057 306.25537739 -10.14854603 306.26071354 -12.7331543 306.26708984 C-14.39786822 306.26642908 -16.06258203 306.26514795 -17.72729492 306.26318359 C-18.48897476 306.26520782 -19.2506546 306.26723206 -20.03541565 306.26931763 C-27.17511481 306.23853607 -33.73838847 305.58497545 -40.50463867 303.13037109 C-41.47401367 302.85837891 -42.44338867 302.58638672 -43.44213867 302.30615234 C-66.34042601 295.85140553 -87.75319592 281.03351599 -99.75463867 260.19287109 C-102.83643091 254.68302251 -105.40914149 249.08424403 -107.50463867 243.13037109 C-108.09245117 241.61443359 -108.09245117 241.61443359 -108.69213867 240.06787109 C-110.67420934 232.90192328 -110.66355516 225.45601311 -110.62963867 218.06787109 C-110.63350586 217.22160156 -110.63737305 216.37533203 -110.64135742 215.50341797 C-110.6293325 207.70525809 -109.81173371 200.62842996 -107.50463867 193.13037109 C-107.1632794 191.79906995 -106.82537912 190.46678961 -106.50463867 189.13037109 C-105.84463867 189.13037109 -105.18463867 189.13037109 -104.50463867 189.13037109 C-104.41182617 188.11330078 -104.31901367 187.09623047 -104.22338867 186.04833984 C-101.16244856 169.36288912 -84.6193768 151.81239253 -71.50463867 142.13037109 C-70.84463867 142.13037109 -70.18463867 142.13037109 -69.50463867 142.13037109 C-69.50463867 141.47037109 -69.50463867 140.81037109 -69.50463867 140.13037109 C-67.2454654 138.42846056 -64.99572951 136.85853553 -62.62963867 135.31787109 C-61.94289063 134.86645752 -61.25614258 134.41504395 -60.54858398 133.94995117 C-55.37210567 130.5930062 -50.1286496 127.67500555 -44.50463867 125.13037109 C-43.63581055 124.71271484 -42.76698242 124.29505859 -41.87182617 123.86474609 C-36.10988789 121.13972685 -30.30683328 118.94912545 -24.23120117 117.02490234 C-22.47539686 116.44885766 -20.73614355 115.81813213 -19.02416992 115.12255859 C-16.24285166 114.02727977 -13.44623856 113.24524319 -10.56713867 112.44287109 C1.16305025 108.87455029 15.40933583 103.36611047 21.49536133 92.13037109 C22.27751721 89.40212069 22.27751721 89.40212069 22.49536133 87.13037109 C10.88686259 79.63321566 -4.51093241 81.73347382 -17.50463867 84.13037109 C-18.64545898 84.47583984 -19.7862793 84.82130859 -20.96166992 85.17724609 C-32.1874334 88.19718688 -44.41818273 86.88447961 -54.50463867 81.13037109 C-65.62536659 73.14507063 -71.5730003 63.41383986 -74.50463867 50.13037109 C-75.88833771 40.39783629 -72.59029524 30.69033964 -67.36791992 22.55224609 C-58.19454547 10.62878244 -47.57376309 6.81318085 -33.49682617 3.60205078 C-32.18415847 3.2912574 -30.87636232 2.95899409 -29.57495117 2.60400391 C-19.84507361 -0.03849798 -10.02381586 -0.03110386 0 0 Z " fill="#76B254" transform="translate(1293.504638671875,922.86962890625)"/>
                    <path d="M0 0 C1.09119141 0.00974854 2.18238281 0.01949707 3.30664062 0.02954102 C19.63594147 0.38562793 31.74811001 5.32749441 45.75 13.4375 C45.75 14.0975 45.75 14.7575 45.75 15.4375 C47.73 15.9325 47.73 15.9325 49.75 16.4375 C49.75 17.0975 49.75 17.7575 49.75 18.4375 C50.32105469 18.685 50.89210937 18.9325 51.48046875 19.1875 C64.27765907 26.23586644 73.28696081 43.12290499 77.5 56.5625 C77.93208761 58.18346774 78.34937555 59.80847079 78.75 61.4375 C79.05744141 62.53191406 79.05744141 62.53191406 79.37109375 63.6484375 C83.63169705 80.86715151 80.83031204 99.87174553 72.75 115.4375 C71.9787932 116.9998157 71.20792316 118.56229771 70.4375 120.125 C69.880625 121.218125 69.32375 122.31125 68.75 123.4375 C68.09 123.4375 67.43 123.4375 66.75 123.4375 C66.4921875 124.16324219 66.234375 124.88898438 65.96875 125.63671875 C62.10127216 134.52448033 54.45533133 140.90706058 46.75 146.4375 C46.11578125 146.89769531 45.4815625 147.35789062 44.828125 147.83203125 C27.04272052 159.80297657 5.22932433 163.2002588 -15.7265625 159.81640625 C-31.52650185 156.62211212 -46.30953804 148.1984966 -57.25 136.4375 C-58.37148438 135.25414062 -58.37148438 135.25414062 -59.515625 134.046875 C-60.74539062 132.72429687 -60.74539062 132.72429687 -62 131.375 C-63.16789062 130.12009766 -63.16789062 130.12009766 -64.359375 128.83984375 C-66.14621248 126.56937878 -66.85970441 125.25413315 -67.25 122.4375 C-67.91 122.4375 -68.57 122.4375 -69.25 122.4375 C-77.11863111 108.64711558 -80.6776073 95.25819091 -80.75 79.375 C-80.75942627 77.80552612 -80.75942627 77.80552612 -80.76904297 76.2043457 C-80.66228173 69.72559679 -79.60116518 64.44908627 -77.25 58.4375 C-76.78260547 56.98204546 -76.32321542 55.52397477 -75.875 54.0625 C-74.08977521 48.66863901 -71.6760879 43.56776492 -69.25 38.4375 C-68.59 38.4375 -67.93 38.4375 -67.25 38.4375 C-67.023125 37.756875 -66.79625 37.07625 -66.5625 36.375 C-61.5136792 25.0752582 -49.19413565 14.90956782 -38.25 9.4375 C-37.26 9.4375 -36.27 9.4375 -35.25 9.4375 C-35.25 8.7775 -35.25 8.1175 -35.25 7.4375 C-33.66996142 6.8247685 -32.08567705 6.22298838 -30.5 5.625 C-29.61828125 5.28855469 -28.7365625 4.95210937 -27.828125 4.60546875 C-18.47881311 1.55367371 -9.85178313 -0.09947402 0 0 Z " fill="#9265CC" transform="translate(118.25,658.5625)"/>
                    <path d="M0 0 C14.0088565 13.50174857 23.71904253 30.87122231 24.46484375 50.68359375 C24.50480469 51.72902344 24.54476563 52.77445312 24.5859375 53.8515625 C24.96618156 74.00449742 19.73838355 92.46498759 7.46484375 108.68359375 C6.80484375 108.68359375 6.14484375 108.68359375 5.46484375 108.68359375 C5.23796875 109.24046875 5.01109375 109.79734375 4.77734375 110.37109375 C3.08934339 113.34518963 0.99807858 115.4036824 -1.53515625 117.68359375 C-2.19515625 117.68359375 -2.85515625 117.68359375 -3.53515625 117.68359375 C-3.86515625 118.67359375 -4.19515625 119.66359375 -4.53515625 120.68359375 C-8.01289247 123.3043164 -11.79933204 125.45097058 -15.53515625 127.68359375 C-16.28539062 128.15410156 -17.035625 128.62460937 -17.80859375 129.109375 C-24.01819404 132.83744357 -30.57837415 134.78469851 -37.53515625 136.68359375 C-38.26089844 136.91175781 -38.98664063 137.13992188 -39.734375 137.375 C-50.10235786 140.28781247 -63.30610702 139.9119107 -73.53515625 136.68359375 C-75.08976562 136.24660156 -75.08976562 136.24660156 -76.67578125 135.80078125 C-90.47366023 131.80002639 -102.49671348 125.1445299 -112.53515625 114.68359375 C-113.13199219 114.1215625 -113.72882813 113.55953125 -114.34375 112.98046875 C-118.89022346 108.66295438 -122.27235058 104.02190636 -125.53515625 98.68359375 C-125.97859375 97.99652344 -126.42203125 97.30945313 -126.87890625 96.6015625 C-138.05069061 78.24305101 -138.1980023 55.95352844 -133.53515625 35.68359375 C-128.42498993 16.45258138 -115.20427747 -0.38051576 -98.09765625 -10.37890625 C-96.91033472 -11.02506763 -95.72282332 -11.6708802 -94.53515625 -12.31640625 C-93.83519531 -12.72890625 -93.13523437 -13.14140625 -92.4140625 -13.56640625 C-62.81410648 -30.80312241 -24.33450118 -22.23475993 0 0 Z " fill="#FFCC4C" transform="translate(1200.53515625,128.31640625)"/>
                    <path d="M0 0 C3.81515834 3.03133126 7.5811717 6.29607694 10.6875 10.0625 C10.6875 10.7225 10.6875 11.3825 10.6875 12.0625 C11.3475 12.0625 12.0075 12.0625 12.6875 12.0625 C13.1825 14.0425 13.1825 14.0425 13.6875 16.0625 C14.3475 16.0625 15.0075 16.0625 15.6875 16.0625 C16.36417998 17.30710783 17.02844719 18.55846896 17.6875 19.8125 C18.244375 20.85664062 18.244375 20.85664062 18.8125 21.921875 C19.6875 24.0625 19.6875 24.0625 19.6875 28.0625 C20.3475 28.0625 21.0075 28.0625 21.6875 28.0625 C26.72088848 45.5595171 26.04465227 61.8809346 17.41796875 78.17578125 C12.71469427 86.02164996 6.83959922 92.40465274 -0.3125 98.0625 C-0.87582031 98.52398438 -1.43914062 98.98546875 -2.01953125 99.4609375 C-6.6932101 103.07291413 -11.76981401 105.10944915 -17.3125 107.0625 C-18.9521875 107.6503125 -18.9521875 107.6503125 -20.625 108.25 C-38.16934248 112.11570258 -53.75438786 109.47447279 -68.9765625 100.234375 C-76.65513659 95.23520967 -83.48625792 88.93036088 -88.3125 81.0625 C-88.3125 80.0725 -88.3125 79.0825 -88.3125 78.0625 C-88.9725 78.0625 -89.6325 78.0625 -90.3125 78.0625 C-90.8075 75.0925 -90.8075 75.0925 -91.3125 72.0625 C-91.9725 72.0625 -92.6325 72.0625 -93.3125 72.0625 C-93.44527344 71.42441406 -93.57804688 70.78632812 -93.71484375 70.12890625 C-93.89144531 69.30261719 -94.06804688 68.47632813 -94.25 67.625 C-94.42402344 66.80128906 -94.59804688 65.97757813 -94.77734375 65.12890625 C-95.12002994 63.08588796 -95.12002994 63.08588796 -96.3125 62.0625 C-98.36227713 44.61661913 -96.7694516 28.73509399 -86.4375 14.0625 C-77.11118022 2.28559714 -66.77527841 -5.49599861 -52.3125 -9.9375 C-50.4871875 -10.55625 -50.4871875 -10.55625 -48.625 -11.1875 C-31.5395589 -15.08171758 -13.96622352 -10.06429209 0 0 Z " fill="#5B913A" transform="translate(1003.3125,1222.9375)"/>
                    <path d="M0 0 C0.68578125 0.43441406 1.3715625 0.86882812 2.078125 1.31640625 C6.41951761 4.17606269 10.04615255 7.70447826 13 12 C13 12.66 13 13.32 13 14 C13.66 14 14.32 14 15 14 C25.44910919 27.49427815 27.205184 44.0964681 25.25 60.5 C24.51345666 65.9975807 23.3152122 70.94862793 21 76 C20.34 76 19.68 76 19 76 C18.90976563 76.72445312 18.81953125 77.44890625 18.7265625 78.1953125 C17.38424449 83.37694868 13.45553598 87.03391637 10 91 C9.43925781 91.64582031 8.87851563 92.29164063 8.30078125 92.95703125 C1.76588034 99.9666223 -6.75703159 105.40347707 -16 108 C-16.97710938 108.27714844 -17.95421875 108.55429687 -18.9609375 108.83984375 C-34.97429796 112.96680244 -50.33762807 111.27449154 -64.6875 103 C-70.79418682 99.32594166 -75.64873108 95.6566496 -80 90 C-80.72509766 89.27876953 -80.72509766 89.27876953 -81.46484375 88.54296875 C-91.70289506 78.2528154 -95.25574945 63.77222099 -95.25 49.6875 C-95.19378334 35.09771399 -91.04028706 22.64511554 -82 11 C-80.36687651 9.62578633 -78.70224783 8.28759772 -77 7 C-76.175 6.175 -75.35 5.35 -74.5 4.5 C-54.40638495 -15.59361505 -22.50742233 -15.41269138 0 0 Z " fill="#FFCC4D" transform="translate(1357,314)"/>
                    <path d="M0 0 C1.14597656 0.55945313 2.29195312 1.11890625 3.47265625 1.6953125 C14.53743279 7.39894313 24.31333321 15.69601601 30 27 C30 27.99 30 28.98 30 30 C30.66 30 31.32 30 32 30 C38.3836515 47.33977896 39.21756002 66.24320899 31.42578125 83.34375 C29.33059794 87.2471052 26.83324104 90.60966101 24 94 C23.401875 94.845625 22.80375 95.69125 22.1875 96.5625 C18.90300013 100.22237129 15.08454904 103.26382526 11 106 C10.34 106 9.68 106 9 106 C9 106.66 9 107.32 9 108 C-8.79757014 116.16722851 -24.45467806 120.45802878 -44 114 C-52.71685404 110.56174657 -60.31298369 105.58664834 -67 99 C-67.33 98.01 -67.66 97.02 -68 96 C-68.66 96 -69.32 96 -70 96 C-71.69140625 93.98828125 -71.69140625 93.98828125 -73.5625 91.3125 C-74.18253906 90.44238281 -74.80257813 89.57226562 -75.44140625 88.67578125 C-76.98342898 86.028449 -77.60350598 84.01444086 -78 81 C-78.66 81 -79.32 81 -80 81 C-80.48720213 79.64870353 -80.96428184 78.29375684 -81.4375 76.9375 C-81.70433594 76.18339844 -81.97117187 75.42929687 -82.24609375 74.65234375 C-84.00109738 68.47800455 -84.1570294 62.36317389 -84.125 56 C-84.12886719 55.23171875 -84.13273437 54.4634375 -84.13671875 53.671875 C-84.11467421 40.70968371 -80.26492268 30.74657737 -72.8125 20.25 C-72.37236572 19.62923584 -71.93223145 19.00847168 -71.47875977 18.36889648 C-70.37545313 16.86950934 -69.19382591 15.42836516 -68 14 C-67.34 14 -66.68 14 -66 14 C-66 13.34 -66 12.68 -66 12 C-63.93241145 10.26745134 -61.88086315 8.684574 -59.6875 7.125 C-59.05392578 6.67318359 -58.42035156 6.22136719 -57.76757812 5.75585938 C-52.46392679 2.09394132 -47.1965536 -0.21849084 -41 -2 C-39.70449219 -2.52980469 -39.70449219 -2.52980469 -38.3828125 -3.0703125 C-26.59997979 -6.30855059 -10.90003373 -5.47320842 0 0 Z " fill="#FFCC4C" transform="translate(371.76171875,908.84765625)"/>
                    <path d="M0 0 C0.66 0 1.32 0 2 0 C0.34292168 5.64913063 -1.47762012 10.26300637 -5 15 C-6 12 -6 12 -4.78515625 9.08203125 C-4.21667969 8.00308594 -3.64820313 6.92414063 -3.0625 5.8125 C-2.49660156 4.72582031 -1.93070313 3.63914062 -1.34765625 2.51953125 C-0.90292969 1.68808594 -0.45820312 0.85664062 0 0 Z M-7 15 C-5.63381852 18.69470464 -6.43462211 20.57274316 -7.9375 24.125 C-12.03506672 35.81805626 -11.12520225 48.03355771 -6.77734375 59.49609375 C-6 62 -6 62 -7 65 C-7.728438 63.36968639 -8.44833925 61.7351921 -9.1328125 60.0859375 C-9.681536 58.76603503 -10.25669146 57.45655412 -10.8671875 56.1640625 C-14.73267196 46.85008566 -13.92611663 34.73931556 -12 25 C-11.34 25 -10.68 25 -10 25 C-9.87625 24.0925 -9.7525 23.185 -9.625 22.25 C-9.07890323 19.41029677 -8.42736197 17.47409409 -7 15 Z " fill="#E6485D" transform="translate(55,1309)"/>
                    <path d="M0 0 C0.66 0 1.32 0 2 0 C0.34292168 5.64913063 -1.47762012 10.26300637 -5 15 C-6 12 -6 12 -4.78515625 9.08203125 C-4.21667969 8.00308594 -3.64820313 6.92414063 -3.0625 5.8125 C-2.49660156 4.72582031 -1.93070313 3.63914062 -1.34765625 2.51953125 C-0.90292969 1.68808594 -0.45820312 0.85664062 0 0 Z M-7 15 C-5.875 18.75 -5.875 18.75 -7 21 C-7.66 21 -8.32 21 -9 21 C-8.34 19.02 -7.68 17.04 -7 15 Z " fill="#E93142" transform="translate(55,1309)"/>
                    <path d="M0 0 C0.66 0.33 1.32 0.66 2 1 C-2 5 -6 9 -10 13 C-10.66 12.67 -11.32 12.34 -12 12 C-8.32167983 7.47384007 -4.58913637 3.60575001 0 0 Z " fill="#F9B74B" transform="translate(300,908)"/>
                    <path d="M0 0 C1.25955231 3.77865693 0.48087189 5.03411786 -0.9375 8.6875 C-1.31777344 9.68136719 -1.69804688 10.67523438 -2.08984375 11.69921875 C-2.39019531 12.45847656 -2.69054687 13.21773438 -3 14 C-3.66 12.68 -4.32 11.36 -5 10 C-4.34 10 -3.68 10 -3 10 C-3.33 9.01 -3.66 8.02 -4 7 C-3.01 6.67 -2.02 6.34 -1 6 C-1.020625 5.195625 -1.04125 4.39125 -1.0625 3.5625 C-1 1 -1 1 0 0 Z " fill="#A11939" transform="translate(639,436)"/>
                    <path d="M0 0 C0 3.59857954 -0.95830515 5.09451118 -3 8 C-3.66 8 -4.32 8 -5 8 C-5 8.66 -5 9.32 -5 10 C-5.99 10.33 -6.98 10.66 -8 11 C-6.52670958 5.99081256 -3.72484762 3.48192278 0 0 Z " fill="#A87ABE" transform="translate(654,418)"/>
                    <path d="M0 0 C0.66 0 1.32 0 2 0 C0.83621763 3.49134712 0.10501256 4.15377632 -3 6 C-6.25 6.6875 -6.25 6.6875 -9 7 C-8.67 6.34 -8.34 5.68 -8 5 C-7.401875 4.87625 -6.80375 4.7525 -6.1875 4.625 C-3.30783348 3.80223814 -2.0529616 2.12139365 0 0 Z " fill="#A874B6" transform="translate(768,566)"/>
                    <path d="M0 0 C0.99 0.33 1.98 0.66 3 1 C1.8125 2.5 1.8125 2.5 0 4 C-2.6875 4.1875 -2.6875 4.1875 -5 4 C-3.36587557 2.29159719 -2.13093906 1.06546953 0 0 Z " fill="#A87DC3" transform="translate(984,713)"/>
                    <path d="M0 0 C0.66 0.99 1.32 1.98 2 3 C-2.43076923 5.09230769 -2.43076923 5.09230769 -5.3125 4.625 C-5.869375 4.41875 -6.42625 4.2125 -7 4 C-4.69 3.34 -2.38 2.68 0 2 C0 1.34 0 0.68 0 0 Z " fill="#A76BAA" transform="translate(1063,673)"/>
                    <path d="M0 0 C0.66 0.33 1.32 0.66 2 1 C0.35 2.32 -1.3 3.64 -3 5 C-4.32 4.34 -5.64 3.68 -7 3 C-4.69631264 1.93347808 -2.35981813 0.93578995 0 0 Z " fill="#A877BA" transform="translate(692,392)"/>
                  </svg>
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Congratulations!</h2>
              <p className="text-gray-600">You have successfully sent a cost estimate!</p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

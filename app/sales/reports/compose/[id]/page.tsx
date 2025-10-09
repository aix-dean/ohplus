"use client"

import type React from "react"

import { useState, useEffect, useRef, useCallback } from "react"
import { useRouter, useParams } from "next/navigation"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { ArrowLeft, Paperclip, Edit, Trash2, Upload, X, Plus, Download } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import type { ReportData } from "@/lib/report-service"
import { getReportById } from "@/lib/report-service"
import { getClientById, type Client } from "@/lib/client-service"
import { useAuth } from "@/contexts/auth-context"
import { emailService, type EmailTemplate } from "@/lib/email-service"
import { db } from "@/lib/firebase"
import { collection, addDoc, serverTimestamp, query, where, orderBy, getDocs, updateDoc } from "firebase/firestore"
import { generateReportPDF } from "@/lib/report-pdf-service"

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

interface ReportEmailTemplate extends EmailTemplate {
  template_type: "proposal" | "quotation" | "CE" | "report"
}

export default function ComposeEmailPage({ params }: ComposeEmailPageProps) {
  const router = useRouter()
  const { toast } = useToast()
  const { user, userData } = useAuth()
  const [report, setReport] = useState<ReportData | null>(null)
  const [client, setClient] = useState<Client | null>(null)
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [toEmail, setToEmail] = useState("")
  const [ccEmail, setCcEmail] = useState("")
  const [replyToEmail, setReplyToEmail] = useState("")
  const [subject, setSubject] = useState("")
  const [body, setBody] = useState("")
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([])
  const [reportPdfFile, setReportPdfFile] = useState<File | null>(null)
  const [companyName, setCompanyName] = useState<string>("Company")

  const [showAddTemplateDialog, setShowAddTemplateDialog] = useState(false)
  const [showEditTemplateDialog, setShowEditTemplateDialog] = useState(false)
  const [editingTemplate, setEditingTemplate] = useState<EmailTemplate | null>(null)
  const [newTemplateName, setNewTemplateName] = useState("")
  const [newTemplateSubject, setNewTemplateSubject] = useState("")
  const [newTemplateBody, setNewTemplateBody] = useState("")
  const [savingTemplate, setSavingTemplate] = useState(false)

  const [templates, setTemplates] = useState<EmailTemplate[]>([])
  const [templatesLoading, setTemplatesLoading] = useState(true)

  const fetchReportTemplates = useCallback(async () => {
    if (!userData?.company_id) return

    try {
      setTemplatesLoading(true)

      const userTemplates = await emailService.getEmailTemplates(userData.company_id, "report")
      if (userTemplates.length === 0) {
        // Create default templates with proper userId
        const defaultTemplates = [
          {
            name: "Standard Report",
            subject: "Report: {title} - {companyName}",
            body: `Hi {clientName},

I hope you're doing well!

Please find attached the report for your project. The report includes the site details and project status based on our recent work.

If you have any questions or would like to discuss the findings, feel free to reach out to us. I'll be happy to assist you further.

Best regards,
{userName}
Sales Executive
{companyName}
{userContact}
{userEmail}`,
            userId: user?.uid || "",
            company_id: userData.company_id,
            template_type: "report",
            deleted: false,
          },
          {
            name: "Follow-up Report",
            subject: "Follow-up: Report for {title}",
            body: `Dear {clientName},

I wanted to follow up on the report we sent for {title}.

I hope you've had a chance to review the attached report. We're very interested in your feedback and are available to discuss the findings in detail.

If you have any questions about our assessment, recommendations, or next steps, I'd be happy to schedule a call to discuss them in detail.

We're also available to provide additional support or clarification as needed.

Please let me know your thoughts or if you need any additional information.

Best regards,
{userName}
Sales Executive
{companyName}
{userContact}
{userEmail}`,
            userId: user?.uid || "",
            company_id: userData.company_id,
            template_type: "report",
            deleted: false,
          },
        ]

        for (const template of defaultTemplates) {
          await emailService.createEmailTemplate(template)
        }

        const newTemplates = await emailService.getEmailTemplates(userData.company_id, "report")
        setTemplates(newTemplates)
      } else {
        setTemplates(userTemplates)
      }
    } catch (error) {
      console.error("Error fetching report templates:", error)
      toast({
        title: "Error",
        description: "Failed to load email templates",
        variant: "destructive",
      })
    } finally {
      setTemplatesLoading(false)
    }
  }, [userData?.company_id, toast])


  useEffect(() => {
    const fetchReport = async () => {
      try {
        const reportData = await getReportById(params.id)

        if (!reportData) {
          throw new Error("Report not found")
        }

        setReport(reportData)
        console.log("Loaded report data:", reportData)
        console.log("Report client_email:", reportData.client_email)
        console.log("Report clientId:", reportData.clientId)

        // Check for 'to' query parameter first
        const urlParams = new URLSearchParams(window.location.search)
        const toParam = urlParams.get('to')
        console.log("Query param 'to':", toParam)

        // Use client_email from report if available, otherwise fetch client data
        if (reportData.client_email) {
          console.log("Using client_email from report:", reportData.client_email)
          const finalToEmail = toParam || reportData.client_email
          const finalReplyToEmail = user?.email || ""
          console.log("Setting toEmail:", finalToEmail)
          console.log("Setting replyToEmail:", finalReplyToEmail)
          setToEmail(finalToEmail)
          setCcEmail("")
          setReplyToEmail(finalReplyToEmail)
          setSubject(`Report: ${reportData.siteName} - ${reportData.client} - OH Plus`)
        } else if (reportData.clientId) {
          // Fallback to fetching client data if client_email is not in report
          const clientData = await getClientById(reportData.clientId)
          if (clientData) {
            setClient(clientData)
            setToEmail(toParam || clientData.email)
            setCcEmail("")
            setReplyToEmail(user?.email || "")
            setSubject(`Report: ${reportData.siteName} - ${clientData.company} - OH Plus`)
          }
        }

      } catch (error) {
        console.error("Error fetching report:", error)
        toast({
          title: "Error",
          description: "Failed to load report data",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }

    fetchReport()
  }, [params.id, toast, user?.email])

  // Set reply-to email to current user's email
  useEffect(() => {
    if (user?.email) {
      setReplyToEmail(user.email)
    }
  }, [user?.email])

  useEffect(() => {
    if (user?.uid) {
      fetchReportTemplates()
    }
  }, [user?.uid])

  // Set subject and body when report and company name are available
  useEffect(() => {
    if (report && companyName && userData) {
      setSubject(`Report: ${report.siteName || "Site"} - ${companyName}`)
      setBody(`Hi ${client?.name || "Valued Client"},

I hope you're doing well!

Please find attached the report for your project. The report includes the site details and project status based on our recent work.

If you have any questions or would like to discuss the findings, feel free to reach out to us. I'll be happy to assist you further.

Best regards,
${user?.displayName || "Sales Executive"}
Sales Executive
${companyName}
${userData?.phone_number || ""}
${user?.email || ""}`)
    }
  }, [report, companyName, userData, user?.displayName, user?.email, client?.name])

  // Set company name from report data
  useEffect(() => {
    if (report) {
      // Use company_name from report if available, otherwise fallback to Company
      const companyNameFromReport = (report as any).company_name || (report as any).companyName || "Company"
      setCompanyName(companyNameFromReport)
      console.log("[v0] Company name set from report:", companyNameFromReport)
    }
  }, [report])

  // Check for pre-generated PDF from sessionStorage
  useEffect(() => {
    const checkForPdf = () => {
      try {
        const pdfDataString = sessionStorage.getItem('report-pdf')
        if (pdfDataString) {
          const pdfData = JSON.parse(pdfDataString)
          const binaryString = atob(pdfData.data)
          const bytes = new Uint8Array(binaryString.length)
          for (let i = 0; i < binaryString.length; i++) {
            bytes[i] = binaryString.charCodeAt(i)
          }
          const pdfBlob = new Blob([bytes], { type: pdfData.type })
          const pdfFile = new File([pdfBlob], pdfData.name, { type: pdfData.type })

          setReportPdfFile(pdfFile)
          // Clear the sessionStorage after using it
          sessionStorage.removeItem('report-pdf')
          console.log("PDF loaded from sessionStorage for compose page")
        } else {
          // No PDF found, show error and redirect
          toast({
            title: "Error",
            description: "PDF not found. Please try sending the report again.",
            variant: "destructive",
          })
          setTimeout(() => {
            router.push(`/sales/reports/${params.id}`)
          }, 2000)
        }
      } catch (error) {
        console.error("Error loading PDF from sessionStorage:", error)
        toast({
          title: "Error",
          description: "Failed to load PDF. Please try sending the report again.",
          variant: "destructive",
        })
        setTimeout(() => {
          router.push(`/sales/reports/${params.id}`)
        }, 2000)
      }
    }

    if (!loading) {
      checkForPdf()
    }
  }, [loading, params.id, toast, router])



  const handleBack = () => {
    router.back()
  }

  const handleSendEmail = async () => {
    if (!toEmail.trim()) {
      toast({
        title: "Validation Error",
        description: "Please enter a recipient email address.",
        variant: "destructive",
      })
      return
    }

    if (!subject.trim()) {
      toast({
        title: "Validation Error",
        description: "Please enter an email subject.",
        variant: "destructive",
      })
      return
    }

    if (!body.trim()) {
      toast({
        title: "Validation Error",
        description: "Please enter an email body.",
        variant: "destructive",
      })
      return
    }

    setSending(true)

    try {
      const formData = new FormData()

      const toEmails = toEmail
        .split(",")
        .map((email) => email.trim())
        .filter((email) => email)
      const ccEmails = ccEmail
        ? ccEmail
            .split(",")
            .map((email) => email.trim())
            .filter((email) => email)
        : []

      formData.append("to", JSON.stringify(toEmails))
      if (ccEmails.length > 0) {
        formData.append("cc", JSON.stringify(ccEmails))
      }
      formData.append("subject", subject)
      formData.append("body", body)
      if (userData?.phone_number) {
        formData.append("currentUserPhoneNumber", userData.phone_number)
      }

      // Add company and user data for proper email formatting
      if (userData?.company_id) {
        formData.append("companyId", userData.company_id)
      }
      if (companyName) {
        formData.append("companyName", companyName)
      }
      // Always send userDisplayName with fallback
      formData.append("userDisplayName", user?.displayName || "Sales Executive")
      if (replyToEmail.trim()) {
        formData.append("replyTo", replyToEmail.trim())
      }

      // Add the pre-generated PDF as the first attachment
      if (reportPdfFile) {
        formData.append("attachment_0", reportPdfFile)
      }

      // Add any additional uploaded files
      for (let i = 0; i < uploadedFiles.length; i++) {
        const file = uploadedFiles[i]
        formData.append(`attachment_${i + 1}`, file)
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
          body: body,
          created: serverTimestamp(),
          from: user?.email || "noreply@ohplus.ph",
          reportId: params.id,
          sentAt: serverTimestamp(),
          status: "sent",
          subject: subject,
          to: toEmails,
          cc: ccEmails.length > 0 ? ccEmails : null,
          updated: serverTimestamp(),
          userId: user?.uid || null,
          email_type: "report",
          attachments: [
            ...(reportPdfFile ? [{
              fileName: reportPdfFile.name,
              fileSize: reportPdfFile.size,
              fileType: reportPdfFile.type,
              fileUrl: null,
            }] : []),
            ...uploadedFiles.map((file) => ({
              fileName: file.name,
              fileSize: file.size,
              fileType: file.type,
              fileUrl: null,
            })),
          ],
        }

        await addDoc(collection(db, "emails"), emailRecord)
        console.log("Email record saved successfully")
      } catch (emailRecordError) {
        console.error("Error saving email record:", emailRecordError)
      }

      // Navigate to reports page and show success dialog there
      sessionStorage.setItem('lastSentEmailReportId', params.id)
      router.push('/sales/reports')
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


  const applyTemplate = (template: EmailTemplate) => {
    setSubject(template.subject)
    setBody(template.body)
    toast({
      title: "Template applied",
      description: `${template.name} has been applied to your email.`,
    })
  }

  const handleEditTemplate = (template: EmailTemplate) => {
    setEditingTemplate(template)
    setNewTemplateName(template.name)
    setNewTemplateSubject(template.subject)
    setNewTemplateBody(template.body)
    setShowEditTemplateDialog(true)
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


  const handleAddTemplate = async () => {
    if (!newTemplateName.trim() || !newTemplateSubject.trim() || !newTemplateBody.trim()) {
      toast({
        title: "Missing Information",
        description: "Please fill in all template fields",
        variant: "destructive",
      })
      return
    }

    const companyId = userData?.company_id

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
      await emailService.createEmailTemplate({
        name: newTemplateName.trim(),
        subject: newTemplateSubject.trim(),
        body: newTemplateBody.trim(),
        userId: user?.uid || "",
        company_id: companyId,
        template_type: "report",
        deleted: false,
      })

      // Refetch templates to get the updated list
      const updatedTemplates = await emailService.getEmailTemplates(companyId)
      setTemplates(updatedTemplates)
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
      const updatedTemplate = await emailService.updateEmailTemplate(editingTemplate.id!, {
        name: newTemplateName.trim(),
        subject: newTemplateSubject.trim(),
        body: newTemplateBody.trim(),
        template_type: "report",
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


  const removeUploadedFile = (index: number) => {
    setUploadedFiles((prev) => prev.filter((_, i) => i !== index))
  }

  const handleAddAttachment = () => {
    fileInputRef.current?.click()
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

                  {/* Reply To Field */}
                  <div className="flex items-center gap-4">
                    <Label className="w-12 text-sm font-medium">Reply to:</Label>
                    <div className="flex-1">
                      <Input
                        value={replyToEmail}
                        onChange={(e) => setReplyToEmail(e.target.value)}
                        placeholder="reply@example.com"
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
                      {/* Report PDF */}
                      {reportPdfFile && (
                        <div className="flex items-center gap-2 p-2 bg-blue-50 rounded border border-blue-200">
                          <Paperclip className="h-4 w-4 text-blue-500" />
                          <span className="flex-1 text-sm text-gray-700 font-medium">{reportPdfFile.name}</span>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              const url = URL.createObjectURL(reportPdfFile)
                              const link = document.createElement('a')
                              link.href = url
                              link.download = reportPdfFile.name
                              document.body.appendChild(link)
                              link.click()
                              document.body.removeChild(link)
                              URL.revokeObjectURL(url)
                            }}
                            className="h-6 w-6 p-0 text-blue-600 hover:text-blue-700 hover:bg-blue-100"
                          >
                            <Download className="h-3 w-3" />
                          </Button>
                        </div>
                      )}

                      {/* User uploaded files */}
                      {uploadedFiles.map((file, index) => (
                        <div key={`upload-${index}`} className="flex items-center gap-2 p-2 bg-gray-50 rounded border">
                          <Paperclip className="h-4 w-4 text-gray-500" />
                          <span className="flex-1 text-sm text-gray-700">{file.name}</span>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeUploadedFile(index)}
                            className="h-6 w-6 p-0"
                          >
                            <X className="h-3 w-3" />
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
                          <Upload className="h-4 w-4 mr-2" />
                          Add Attachment
                        </Button>
                      </div>
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
                            onClick={() => handleDeleteTemplate(template.id!)}
                            className="h-6 w-6 p-0"
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
                placeholder="e.g., Quotation: {title} - {companyName}"
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

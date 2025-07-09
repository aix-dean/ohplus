"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { ArrowLeft, Paperclip, Send, Plus, Smile, X } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/contexts/auth-context"
import { emailService, type EmailTemplate, type Email, type EmailAttachment } from "@/lib/email-service"
import { getReports, type ReportData } from "@/lib/report-service"
import { getProductById, type Product } from "@/lib/firebase-service"
import { generateReportPDF } from "@/lib/pdf-service"

export default function ComposeEmailPage() {
  const params = useParams()
  const router = useRouter()
  const searchParams = useSearchParams()
  const { toast } = useToast()
  const { user } = useAuth()

  const reportId = params.id as string
  const [report, setReport] = useState<ReportData | null>(null)
  const [product, setProduct] = useState<Product | null>(null)

  // Email form state
  const [to, setTo] = useState("")
  const [cc, setCc] = useState("")
  const [subject, setSubject] = useState("")
  const [body, setBody] = useState("")
  const [attachments, setAttachments] = useState<EmailAttachment[]>([])

  // Templates state
  const [templates, setTemplates] = useState<EmailTemplate[]>([])
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null)

  // UI state
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [generatingPDF, setGeneratingPDF] = useState(false)

  useEffect(() => {
    if (reportId && user) {
      fetchData()
    }
  }, [reportId, user])

  const fetchData = async () => {
    try {
      // Fetch report data
      const reports = await getReports()
      const foundReport = reports.find((r) => r.id === reportId)

      if (foundReport) {
        setReport(foundReport)

        // Fetch product data
        if (foundReport.siteId) {
          try {
            const productData = await getProductById(foundReport.siteId)
            setProduct(productData)
          } catch (error) {
            console.log("Product not found, continuing without product data")
          }
        }

        // Set default subject
        setSubject(`${getReportTypeDisplay(foundReport.reportType)} - ${foundReport.siteName}`)

        // Auto-generate and attach PDF
        await generateAndAttachPDF(foundReport)
      }

      // Fetch email templates
      if (user?.uid) {
        const userTemplates = await emailService.getEmailTemplates(user.uid)
        if (userTemplates.length === 0) {
          // Create default templates if none exist
          await emailService.createDefaultTemplates(user.uid)
          const newTemplates = await emailService.getEmailTemplates(user.uid)
          setTemplates(newTemplates)
        } else {
          setTemplates(userTemplates)
        }
      }
    } catch (error) {
      console.error("Error fetching data:", error)
      toast({
        title: "Error",
        description: "Failed to load email compose data.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const generateAndAttachPDF = async (reportData: ReportData) => {
    if (!reportData) return

    setGeneratingPDF(true)
    try {
      // Generate PDF blob
      const pdfBlob = (await generateReportPDF(reportData, product, true)) as Blob

      if (pdfBlob) {
        // Create attachment
        const fileName = `${reportData.siteId}_${getReportTypeDisplay(reportData.reportType).replace(/\s+/g, "_")}_${reportData.siteName.replace(/\s+/g, "_")}.pdf`

        // Convert blob to URL for preview (in real implementation, upload to storage)
        const fileUrl = URL.createObjectURL(pdfBlob)

        const attachment: EmailAttachment = {
          fileName,
          fileUrl,
          fileSize: pdfBlob.size,
          fileType: "application/pdf",
        }

        setAttachments([attachment])
      }
    } catch (error) {
      console.error("Error generating PDF:", error)
      toast({
        title: "Warning",
        description: "Failed to auto-attach PDF. You can add it manually.",
        variant: "destructive",
      })
    } finally {
      setGeneratingPDF(false)
    }
  }

  const getReportTypeDisplay = (type: string) => {
    return type
      .split("-")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ")
  }

  const handleTemplateSelect = (template: EmailTemplate) => {
    setSelectedTemplate(template.id || null)
    setSubject(template.subject)
    setBody(template.body)
  }

  const handleSendEmail = async () => {
    if (!user?.uid || !to.trim() || !subject.trim() || !body.trim()) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields (To, Subject, Body).",
        variant: "destructive",
      })
      return
    }

    setSending(true)
    try {
      // Parse email addresses
      const toEmails = to
        .split(",")
        .map((email) => email.trim())
        .filter((email) => email)
      const ccEmails = cc
        ? cc
            .split(",")
            .map((email) => email.trim())
            .filter((email) => email)
        : []

      // Create email record - only include defined values
      const emailData: Omit<Email, "id" | "created"> = {
        from: user.email || "noreply@ohplus.aix.ph",
        to: toEmails,
        subject,
        body,
        status: "draft",
        userId: user.uid,
      }

      // Add optional fields only if they have values
      if (ccEmails.length > 0) {
        emailData.cc = ccEmails
      }
      if (attachments.length > 0) {
        emailData.attachments = attachments
      }
      if (selectedTemplate) {
        emailData.templateId = selectedTemplate
      }
      if (reportId) {
        emailData.reportId = reportId
      }

      // Create email record in compose_emails collection
      const emailId = await emailService.createEmail(emailData)

      // Send email via API route
      const response = await fetch("/api/emails/send", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ emailId }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.details || result.error || "Failed to send email")
      }

      toast({
        title: "Email Sent!",
        description: "Your email has been sent successfully.",
      })

      // Navigate back to report
      router.push(`/logistics/reports/${reportId}`)
    } catch (error) {
      console.error("Error sending email:", error)
      toast({
        title: "Send Failed",
        description: error instanceof Error ? error.message : "Failed to send email. Please try again.",
        variant: "destructive",
      })
    } finally {
      setSending(false)
    }
  }

  const removeAttachment = (index: number) => {
    setAttachments((prev) => prev.filter((_, i) => i !== index))
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading compose email...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white px-6 py-4 flex items-center justify-between shadow-sm border-b">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="lg"
            onClick={() => router.back()}
            className="text-black rounded-full p-3 hover:bg-gray-100"
          >
            <ArrowLeft className="h-6 w-6" />
          </Button>
          <h1 className="text-xl font-semibold">Compose Email</h1>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Email Compose Form */}
          <div className="lg:col-span-2 space-y-4">
            <Card>
              <CardContent className="p-6 space-y-4">
                {/* To Field */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    To: <span className="text-red-500">*</span>
                  </label>
                  <Input
                    value={to}
                    onChange={(e) => setTo(e.target.value)}
                    placeholder="recipient@example.com, another@example.com"
                    className="w-full"
                  />
                </div>

                {/* CC Field */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Cc:</label>
                  <Input
                    value={cc}
                    onChange={(e) => setCc(e.target.value)}
                    placeholder="cc@example.com"
                    className="w-full"
                  />
                </div>

                {/* Subject Field */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Subject: <span className="text-red-500">*</span>
                  </label>
                  <Input
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    placeholder="Email subject"
                    className="w-full"
                  />
                </div>

                {/* Body Field */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Message: <span className="text-red-500">*</span>
                  </label>
                  <Textarea
                    value={body}
                    onChange={(e) => setBody(e.target.value)}
                    placeholder="Type your message here..."
                    className="w-full min-h-[300px] resize-none"
                  />
                </div>

                {/* Attachments */}
                {attachments.length > 0 && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Attachments:</label>
                    <div className="space-y-2">
                      {attachments.map((attachment, index) => (
                        <div key={index} className="flex items-center gap-2 p-2 bg-gray-50 rounded border">
                          <Paperclip className="h-4 w-4 text-gray-500" />
                          <span className="text-sm text-blue-600 flex-1">{attachment.fileName}</span>
                          <span className="text-xs text-gray-500">
                            {(attachment.fileSize / 1024 / 1024).toFixed(2)} MB
                          </span>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeAttachment(index)}
                            className="h-6 w-6 p-0 text-red-500 hover:text-red-700"
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex items-center justify-between pt-4">
                  <Button variant="outline" className="flex items-center gap-2 bg-transparent" disabled={generatingPDF}>
                    <Paperclip className="h-4 w-4" />
                    {generatingPDF ? "Generating PDF..." : "+Add Attachment"}
                  </Button>

                  <Button
                    onClick={handleSendEmail}
                    disabled={sending || !to.trim() || !subject.trim() || !body.trim()}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 flex items-center gap-2"
                  >
                    <Send className="h-4 w-4" />
                    {sending ? "Sending..." : "Send Email"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Templates Sidebar */}
          <div className="space-y-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold">Templates:</h3>
                </div>

                <div className="space-y-2">
                  {templates.map((template, index) => (
                    <div key={template.id} className="flex items-center gap-2">
                      <Button
                        variant={selectedTemplate === template.id ? "default" : "outline"}
                        size="sm"
                        onClick={() => handleTemplateSelect(template)}
                        className="flex-1 justify-start text-left"
                      >
                        {template.name}
                      </Button>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0 rounded-full bg-yellow-100 text-yellow-600"
                        >
                          <Smile className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0 rounded-full bg-blue-100 text-blue-600"
                        >
                          <Smile className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0 rounded-full bg-green-100 text-green-600"
                        >
                          <Smile className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  ))}

                  <Separator className="my-3" />

                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full flex items-center gap-2 text-blue-600 border-blue-200 hover:bg-blue-50 bg-transparent"
                  >
                    <Plus className="h-4 w-4" />
                    +Add Template
                    <div className="ml-auto">
                      <div className="h-5 w-5 rounded-full bg-yellow-100 flex items-center justify-center">
                        <Smile className="h-3 w-3 text-yellow-600" />
                      </div>
                    </div>
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Report Info */}
            {report && (
              <Card>
                <CardContent className="p-4">
                  <h3 className="font-semibold mb-2">Report Details</h3>
                  <div className="space-y-2 text-sm">
                    <div>
                      <span className="font-medium">Type:</span> {getReportTypeDisplay(report.reportType)}
                    </div>
                    <div>
                      <span className="font-medium">Site:</span> {report.siteName}
                    </div>
                    <div>
                      <span className="font-medium">Date:</span> {new Date(report.date).toLocaleDateString()}
                    </div>
                    <div>
                      <span className="font-medium">Status:</span>{" "}
                      <Badge className="bg-green-100 text-green-800 text-xs">
                        {report.completionPercentage || 100}% Complete
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

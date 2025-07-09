"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { toast } from "sonner"
import { ArrowLeft, Send, FileText, Mail, AlertCircle, CheckCircle, Loader2 } from "lucide-react"
import { getReports, type ReportData } from "@/lib/report-service"
import { emailService, type Email, type EmailTemplate } from "@/lib/email-service"
import { generateReportPDFAsBase64 } from "@/lib/pdf-service"
import { useAuth } from "@/contexts/auth-context"

export default function ComposeEmailPage() {
  const params = useParams()
  const router = useRouter()
  const { user } = useAuth()
  const reportId = params.id as string

  // State
  const [report, setReport] = useState<ReportData | null>(null)
  const [templates, setTemplates] = useState<EmailTemplate[]>([])
  const [selectedTemplate, setSelectedTemplate] = useState<string>("")
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [pdfGenerating, setPdfGenerating] = useState(false)
  const [pdfGenerated, setPdfGenerated] = useState(false)
  const [pdfData, setPdfData] = useState<string>("")

  // Form state
  const [formData, setFormData] = useState({
    to: "",
    cc: "",
    subject: "",
    body: "",
  })

  // Load report and templates
  useEffect(() => {
    if (typeof window !== "undefined" && user) {
      loadData()
    }
  }, [reportId, user])

  const loadData = async () => {
    try {
      setLoading(true)

      // Load report
      const reports = await getReports()
      const reportData = reports.find((r) => r.id === reportId)

      if (!reportData) {
        toast.error("Report not found")
        router.push("/logistics/reports")
        return
      }
      setReport(reportData)

      // Load email templates (only on client side)
      if (user?.uid) {
        try {
          const templatesData = await emailService.getEmailTemplates(user.uid)
          setTemplates(templatesData)

          // Create default templates if none exist
          if (templatesData.length === 0) {
            await emailService.createDefaultTemplates(user.uid)
            const newTemplates = await emailService.getEmailTemplates(user.uid)
            setTemplates(newTemplates)
          }
        } catch (error) {
          console.error("Error loading templates:", error)
          // Continue without templates if there's an error
        }
      }

      // Set default form data
      setFormData({
        to: "",
        cc: "",
        subject: `Report: ${reportData.siteName}`,
        body: `Hi,

Please find attached the logistics report for your review.

Report Details:
- Site: ${reportData.siteName}
- Type: ${reportData.reportType}
- Date: ${reportData.date ? new Date(reportData.date).toLocaleDateString() : "N/A"}
- Status: ${reportData.status || "N/A"}

Please let me know if you have any questions.

Best regards,
OOH Operator Team`,
      })

      // Generate PDF
      await generatePDF(reportData)
    } catch (error) {
      console.error("Error loading data:", error)
      toast.error("Failed to load report data")
    } finally {
      setLoading(false)
    }
  }

  const generatePDF = async (reportData: ReportData) => {
    try {
      setPdfGenerating(true)
      console.log("Generating PDF for report:", reportData.siteName)

      const pdfBase64 = await generateReportPDFAsBase64(reportData)
      setPdfData(`data:application/pdf;base64,${pdfBase64}`)
      setPdfGenerated(true)

      console.log("PDF generated successfully")
      toast.success("PDF report generated successfully")
    } catch (error) {
      console.error("Error generating PDF:", error)
      toast.error("Failed to generate PDF report")
    } finally {
      setPdfGenerating(false)
    }
  }

  const handleTemplateSelect = (templateId: string) => {
    const template = templates.find((t) => t.id === templateId)
    if (template) {
      setSelectedTemplate(templateId)
      setFormData((prev) => ({
        ...prev,
        subject: template.subject,
        body: template.body,
      }))
      toast.success("Template applied")
    }
  }

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }

  const validateForm = (): boolean => {
    if (!formData.to.trim()) {
      toast.error("Please enter recipient email address")
      return false
    }

    const toEmails = formData.to.split(",").map((email) => email.trim())
    for (const email of toEmails) {
      if (!validateEmail(email)) {
        toast.error(`Invalid email address: ${email}`)
        return false
      }
    }

    if (formData.cc.trim()) {
      const ccEmails = formData.cc.split(",").map((email) => email.trim())
      for (const email of ccEmails) {
        if (!validateEmail(email)) {
          toast.error(`Invalid CC email address: ${email}`)
          return false
        }
      }
    }

    if (!formData.subject.trim()) {
      toast.error("Please enter email subject")
      return false
    }

    if (!formData.body.trim()) {
      toast.error("Please enter email body")
      return false
    }

    return true
  }

  const handleSendEmail = async () => {
    if (!validateForm() || !user?.uid) return

    try {
      setSending(true)
      console.log("Starting email send process...")

      // Prepare email data
      const emailData: Omit<Email, "id" | "created"> = {
        from: "noreply@oohoperator.com",
        to: formData.to.split(",").map((email) => email.trim()),
        cc: formData.cc.trim() ? formData.cc.split(",").map((email) => email.trim()) : undefined,
        subject: formData.subject,
        body: formData.body,
        attachments:
          pdfGenerated && report
            ? [
                {
                  fileName: `report-${report.siteName.replace(/[^a-zA-Z0-9]/g, "-")}.pdf`,
                  fileUrl: pdfData,
                  fileSize: Math.round((pdfData.length * 3) / 4), // Approximate size from base64
                  fileType: "application/pdf",
                },
              ]
            : undefined,
        reportId: reportId,
        status: "draft",
        userId: user.uid,
      }

      console.log("Creating email record...")

      // Create email record
      const emailId = await emailService.createEmail(emailData)

      console.log("Email record created with ID:", emailId)

      // Send email
      await emailService.sendEmail(emailId)

      console.log("Email sent successfully!")

      toast.success("Email sent successfully!")

      // Redirect back to report
      router.push(`/logistics/reports/${reportId}`)
    } catch (error) {
      console.error("Error sending email:", error)
      toast.error(error instanceof Error ? error.message : "Failed to send email")
    } finally {
      setSending(false)
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
            <p className="text-muted-foreground">Loading report data...</p>
          </div>
        </div>
      </div>
    )
  }

  if (!report) {
    return (
      <div className="container mx-auto p-6">
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>Report not found</AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Button variant="ghost" size="sm" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Compose Email</h1>
          <p className="text-muted-foreground">Send report via email</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Email Form */}
        <div className="lg:col-span-2 space-y-6">
          {/* Template Selection */}
          {templates.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Mail className="h-5 w-5" />
                  Email Template
                </CardTitle>
                <CardDescription>Choose a template to get started quickly</CardDescription>
              </CardHeader>
              <CardContent>
                <Select value={selectedTemplate} onValueChange={handleTemplateSelect}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a template..." />
                  </SelectTrigger>
                  <SelectContent>
                    {templates.map((template) => (
                      <SelectItem key={template.id} value={template.id!}>
                        {template.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </CardContent>
            </Card>
          )}

          {/* Email Form */}
          <Card>
            <CardHeader>
              <CardTitle>Email Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* To Field */}
              <div className="space-y-2">
                <Label htmlFor="to">To *</Label>
                <Input
                  id="to"
                  type="email"
                  placeholder="recipient@example.com, another@example.com"
                  value={formData.to}
                  onChange={(e) => setFormData((prev) => ({ ...prev, to: e.target.value }))}
                />
                <p className="text-sm text-muted-foreground">Separate multiple emails with commas</p>
              </div>

              {/* CC Field */}
              <div className="space-y-2">
                <Label htmlFor="cc">CC</Label>
                <Input
                  id="cc"
                  type="email"
                  placeholder="cc@example.com"
                  value={formData.cc}
                  onChange={(e) => setFormData((prev) => ({ ...prev, cc: e.target.value }))}
                />
              </div>

              {/* Subject Field */}
              <div className="space-y-2">
                <Label htmlFor="subject">Subject *</Label>
                <Input
                  id="subject"
                  placeholder="Email subject"
                  value={formData.subject}
                  onChange={(e) => setFormData((prev) => ({ ...prev, subject: e.target.value }))}
                />
              </div>

              {/* Body Field */}
              <div className="space-y-2">
                <Label htmlFor="body">Message *</Label>
                <Textarea
                  id="body"
                  placeholder="Email message"
                  rows={12}
                  value={formData.body}
                  onChange={(e) => setFormData((prev) => ({ ...prev, body: e.target.value }))}
                />
              </div>
            </CardContent>
          </Card>

          {/* Send Button */}
          <div className="flex justify-end">
            <Button onClick={handleSendEmail} disabled={sending || !pdfGenerated} size="lg">
              {sending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Send Email
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Report Info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Report Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <p className="font-medium">{report.siteName}</p>
                <p className="text-sm text-muted-foreground">ID: {report.id}</p>
              </div>
              <Separator />
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm">Type:</span>
                  <Badge variant="secondary">{report.reportType}</Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Status:</span>
                  <Badge variant="secondary">{report.status || "N/A"}</Badge>
                </div>
                {report.assignedTo && (
                  <div className="flex justify-between">
                    <span className="text-sm">Assigned:</span>
                    <span className="text-sm text-muted-foreground">{report.assignedTo}</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* PDF Status */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <FileText className="h-5 w-5" />
                PDF Attachment
              </CardTitle>
            </CardHeader>
            <CardContent>
              {pdfGenerating ? (
                <div className="flex items-center gap-2 text-sm">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Generating PDF...
                </div>
              ) : pdfGenerated ? (
                <div className="flex items-center gap-2 text-sm text-green-600">
                  <CheckCircle className="h-4 w-4" />
                  PDF ready for attachment
                </div>
              ) : (
                <div className="flex items-center gap-2 text-sm text-red-600">
                  <AlertCircle className="h-4 w-4" />
                  PDF generation failed
                </div>
              )}
              <p className="text-xs text-muted-foreground mt-2">
                The report will be automatically attached as a PDF file
              </p>
            </CardContent>
          </Card>

          {/* Email Setup Notice */}
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="text-sm">
              <strong>Email Setup:</strong> Configure EMAIL_USER and EMAIL_PASS environment variables for real email
              sending. Without these, emails will be simulated.
            </AlertDescription>
          </Alert>
        </div>
      </div>
    </div>
  )
}

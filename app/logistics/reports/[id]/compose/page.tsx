"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { ArrowLeft, Paperclip, Send, Plus, Smile, X, AlertCircle, CheckCircle, Mail, FileText } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/contexts/auth-context"
import { emailService, type EmailTemplate, type Email, type EmailAttachment } from "@/lib/email-service"
import { getReports, type ReportData } from "@/lib/report-service"
import { getProductById, type Product } from "@/lib/firebase-service"
import { generateReportPDFFromId } from "@/lib/pdf-service"

export default function ComposeEmailPage() {
  const params = useParams()
  const router = useRouter()
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
  const [emailSent, setEmailSent] = useState(false)
  const [debugInfo, setDebugInfo] = useState<string[]>([])

  const addDebugInfo = (info: string) => {
    const timestamp = new Date().toLocaleTimeString()
    setDebugInfo((prev) => [...prev, `${timestamp}: ${info}`])
    console.log(`[Email Debug] ${timestamp}: ${info}`)
  }

  useEffect(() => {
    if (reportId && user) {
      fetchData()
    }
  }, [reportId, user])

  const fetchData = async () => {
    try {
      addDebugInfo("Loading report data...")

      // Fetch report data
      const reports = await getReports()
      const foundReport = reports.find((r) => r.id === reportId)

      if (foundReport) {
        setReport(foundReport)
        addDebugInfo(`Report found: ${foundReport.siteName}`)

        // Fetch product data
        if (foundReport.siteId) {
          try {
            const productData = await getProductById(foundReport.siteId)
            setProduct(productData)
            addDebugInfo(`Product found: ${productData?.name || "Unknown"}`)
          } catch (error) {
            addDebugInfo("Product not found, continuing without product data")
          }
        }

        // Set default subject
        setSubject(`${getReportTypeDisplay(foundReport.reportType)} - ${foundReport.siteName}`)

        // Set default body
        setBody(`Hi [Customer's Name],

I hope you're doing well.

Attached is the ${getReportTypeDisplay(foundReport.reportType).toLowerCase()} for ${foundReport.siteName}. We've prepared a comprehensive analysis based on your requirements and current project status.

Please feel free to review and let me know if you have any questions or would like to explore additional options. I'm happy to assist.

Looking forward to your feedback!

Best regards,
[Your Full Name]
[Your Position]
[Company Name]
[Contact Info]`)

        // Auto-generate and attach PDF
        await generateAndAttachPDF(foundReport)
      } else {
        addDebugInfo("Report not found!")
        toast({
          title: "Error",
          description: "Report not found.",
          variant: "destructive",
        })
      }

      // Fetch email templates
      if (user?.uid) {
        addDebugInfo("Loading email templates...")
        const userTemplates = await emailService.getEmailTemplates(user.uid)
        if (userTemplates.length === 0) {
          addDebugInfo("No templates found, creating defaults...")
          await emailService.createDefaultTemplates(user.uid)
          const newTemplates = await emailService.getEmailTemplates(user.uid)
          setTemplates(newTemplates)
          addDebugInfo(`Created ${newTemplates.length} default templates`)
        } else {
          setTemplates(userTemplates)
          addDebugInfo(`Loaded ${userTemplates.length} existing templates`)
        }
      }
    } catch (error) {
      console.error("Error fetching data:", error)
      addDebugInfo(`Error: ${error instanceof Error ? error.message : "Unknown error"}`)
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
      addDebugInfo("Generating PDF attachment...")

      // Generate PDF blob
      const pdfBlob = await generateReportPDFFromId(reportData.id)

      if (pdfBlob) {
        // Convert blob to base64 for Resend
        const arrayBuffer = await pdfBlob.arrayBuffer()
        const base64 = Buffer.from(arrayBuffer).toString("base64")

        // Create attachment
        const fileName = `${reportData.siteId}_${getReportTypeDisplay(reportData.reportType).replace(/\s+/g, "_")}_${reportData.siteName.replace(/\s+/g, "_")}.pdf`

        const attachment: EmailAttachment = {
          fileName,
          content: base64,
          contentType: "application/pdf",
          fileSize: pdfBlob.size,
        }

        setAttachments([attachment])
        addDebugInfo(`PDF generated successfully: ${(pdfBlob.size / 1024).toFixed(1)}KB`)
      }
    } catch (error) {
      console.error("Error generating PDF:", error)
      addDebugInfo(`PDF generation failed: ${error instanceof Error ? error.message : "Unknown error"}`)
      toast({
        title: "Warning",
        description: "Failed to auto-attach PDF. You can continue without it.",
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
    addDebugInfo(`Applied template: ${template.name}`)
  }

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
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

    // Validate email addresses
    const toEmails = to
      .split(",")
      .map((email) => email.trim())
      .filter((email) => email)

    const invalidToEmails = toEmails.filter((email) => !validateEmail(email))
    if (invalidToEmails.length > 0) {
      toast({
        title: "Invalid Email",
        description: `Invalid email addresses: ${invalidToEmails.join(", ")}`,
        variant: "destructive",
      })
      return
    }

    const ccEmails = cc
      ? cc
          .split(",")
          .map((email) => email.trim())
          .filter((email) => email)
      : []

    const invalidCcEmails = ccEmails.filter((email) => !validateEmail(email))
    if (invalidCcEmails.length > 0) {
      toast({
        title: "Invalid CC Email",
        description: `Invalid CC email addresses: ${invalidCcEmails.join(", ")}`,
        variant: "destructive",
      })
      return
    }

    setSending(true)
    addDebugInfo("Starting email send process...")

    try {
      // Create email record
      const emailData: Omit<Email, "id" | "created"> = {
        from: "OOH Operator <noreply@yourdomain.com>",
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

      addDebugInfo("Creating email record in database...")
      const emailId = await emailService.createEmail(emailData)
      addDebugInfo(`Email record created with ID: ${emailId}`)

      // Verify email was created
      const createdEmail = await emailService.getEmailById(emailId)
      if (!createdEmail) {
        throw new Error("Failed to verify email creation")
      }
      addDebugInfo("Email record verified in database")

      // Send email using our service
      addDebugInfo("Sending email via Resend API...")
      await emailService.sendEmail(emailId)
      addDebugInfo("Email sent successfully!")

      setEmailSent(true)
      toast({
        title: "Email Sent!",
        description: `Your email has been sent successfully to ${toEmails.join(", ")}`,
      })

      // Navigate back after a delay
      setTimeout(() => {
        router.push(`/logistics/reports/${reportId}`)
      }, 3000)
    } catch (error) {
      console.error("Error sending email:", error)
      const errorMessage = error instanceof Error ? error.message : "Failed to send email. Please try again."
      addDebugInfo(`Send error: ${errorMessage}`)

      toast({
        title: "Send Failed",
        description: errorMessage,
        variant: "destructive",
      })
    } finally {
      setSending(false)
    }
  }

  const removeAttachment = (index: number) => {
    setAttachments((prev) => prev.filter((_, i) => i !== index))
    addDebugInfo("Attachment removed")
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading compose email...</div>
      </div>
    )
  }

  if (emailSent) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="w-full max-w-md">
          <CardContent className="p-8 text-center">
            <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-green-700 mb-2">Email Sent!</h2>
            <p className="text-gray-600 mb-4">Your email has been sent successfully via Resend.</p>
            <p className="text-sm text-gray-500 mb-6">Redirecting back to report in a few seconds...</p>
            <Button onClick={() => router.push(`/logistics/reports/${reportId}`)}>Back to Report</Button>
          </CardContent>
        </Card>
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
          <div>
            <h1 className="text-xl font-semibold">Compose Email</h1>
            <p className="text-sm text-gray-500">Send report via Resend</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Mail className="h-5 w-5 text-blue-600" />
          <span className="text-sm font-medium text-blue-600">Powered by Resend</span>
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
                  <p className="text-xs text-gray-500 mt-1">Separate multiple emails with commas</p>
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
                        <div
                          key={index}
                          className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg border border-blue-200"
                        >
                          <FileText className="h-5 w-5 text-blue-600" />
                          <div className="flex-1">
                            <span className="text-sm font-medium text-blue-900">{attachment.fileName}</span>
                            <div className="text-xs text-blue-700">
                              {(attachment.fileSize / 1024 / 1024).toFixed(2)} MB • PDF Document
                            </div>
                          </div>
                          <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                            Ready
                          </Badge>
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

          {/* Sidebar */}
          <div className="space-y-4">
            {/* Templates */}
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold">Email Templates</h3>
                </div>

                <div className="space-y-2">
                  {templates.map((template) => (
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
                    Add Template
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

            {/* Debug Info */}
            {debugInfo.length > 0 && (
              <Card>
                <CardContent className="p-4">
                  <h3 className="font-semibold mb-2">Debug Log</h3>
                  <div className="space-y-1 max-h-40 overflow-y-auto">
                    {debugInfo.slice(-10).map((info, index) => (
                      <div key={index} className="text-xs text-gray-600 font-mono">
                        {info}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Resend Configuration */}
            <Card className="border-blue-200 bg-blue-50">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Mail className="h-4 w-4 text-blue-600" />
                  <h3 className="font-semibold text-blue-900">Resend Configuration</h3>
                </div>
                <div className="text-sm text-blue-800">
                  {process.env.RESEND_API_KEY ? (
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span>Resend API configured - emails will be sent</span>
                    </div>
                  ) : (
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <AlertCircle className="h-4 w-4 text-orange-600" />
                        <span>Demo mode - emails will be logged only</span>
                      </div>
                      <p className="text-xs">
                        Configure <code>RESEND_API_KEY</code> environment variable to send real emails.
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}

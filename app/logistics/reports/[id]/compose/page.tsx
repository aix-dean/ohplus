"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { ArrowLeft, Send, FileText, AlertCircle, Loader2, Mail } from "lucide-react"
import { emailService, type EmailTemplate } from "@/lib/email-service"
import { generateReportPDFBase64, type ReportData } from "@/lib/pdf-service"
import { doc, getDoc } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { toast } from "@/hooks/use-toast"

export default function ComposeEmailPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const [reportData, setReportData] = useState<ReportData | null>(null)
  const [templates, setTemplates] = useState<EmailTemplate[]>([])
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)

  // Form state
  const [formData, setFormData] = useState({
    to: "",
    cc: "",
    subject: "",
    body: "",
    selectedTemplate: "",
  })

  const [errors, setErrors] = useState<Record<string, string>>({})
  const [pdfGenerated, setPdfGenerated] = useState(false)
  const [debugInfo, setDebugInfo] = useState<any[]>([])

  // Load report data and templates
  useEffect(() => {
    async function loadData() {
      try {
        setDebugInfo((prev) => [...prev, { time: new Date().toLocaleTimeString(), message: "Loading report data..." }])

        // Load report data
        const reportDoc = await getDoc(doc(db, "reports", params.id))
        if (reportDoc.exists()) {
          const data = { id: reportDoc.id, ...reportDoc.data() } as ReportData
          setReportData(data)
          setDebugInfo((prev) => [
            ...prev,
            { time: new Date().toLocaleTimeString(), message: "Report data loaded successfully" },
          ])

          // Set default subject
          setFormData((prev) => ({
            ...prev,
            subject: `Report: ${data.title || data.id}`,
          }))
        } else {
          setDebugInfo((prev) => [
            ...prev,
            { time: new Date().toLocaleTimeString(), message: "Report not found", error: true },
          ])
        }

        // Load email templates (using a dummy user ID for now)
        const userTemplates = await emailService.getEmailTemplates("demo-user")
        setTemplates(userTemplates)
        setDebugInfo((prev) => [
          ...prev,
          { time: new Date().toLocaleTimeString(), message: `Loaded ${userTemplates.length} email templates` },
        ])

        // Create default templates if none exist
        if (userTemplates.length === 0) {
          await emailService.createDefaultTemplates("demo-user")
          const newTemplates = await emailService.getEmailTemplates("demo-user")
          setTemplates(newTemplates)
          setDebugInfo((prev) => [
            ...prev,
            { time: new Date().toLocaleTimeString(), message: `Created ${newTemplates.length} default templates` },
          ])
        }
      } catch (error) {
        console.error("Error loading data:", error)
        setDebugInfo((prev) => [
          ...prev,
          {
            time: new Date().toLocaleTimeString(),
            message: `Error: ${error instanceof Error ? error.message : "Unknown error"}`,
            error: true,
          },
        ])
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [params.id])

  // Generate PDF when report data is loaded
  useEffect(() => {
    if (reportData && !pdfGenerated) {
      try {
        generateReportPDFBase64(reportData)
        setPdfGenerated(true)
        setDebugInfo((prev) => [
          ...prev,
          { time: new Date().toLocaleTimeString(), message: "PDF generated successfully" },
        ])
      } catch (error) {
        console.error("PDF generation error:", error)
        setDebugInfo((prev) => [
          ...prev,
          { time: new Date().toLocaleTimeString(), message: `PDF generation failed: ${error}`, error: true },
        ])
      }
    }
  }, [reportData, pdfGenerated])

  // Form handlers
  const handleTemplateSelect = (templateId: string) => {
    const template = templates.find((t) => t.id === templateId)
    if (template) {
      setFormData((prev) => ({
        ...prev,
        selectedTemplate: templateId,
        subject: template.subject,
        body: template.body,
      }))
      setDebugInfo((prev) => [
        ...prev,
        { time: new Date().toLocaleTimeString(), message: `Applied template: ${template.name}` },
      ])
    }
  }

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email.trim())
  }

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}

    // Validate TO field
    if (!formData.to.trim()) {
      newErrors.to = "Recipient email is required"
    } else {
      const toEmails = formData.to.split(",").map((email) => email.trim())
      for (const email of toEmails) {
        if (!validateEmail(email)) {
          newErrors.to = `Invalid email address: ${email}`
          break
        }
      }
    }

    // Validate CC field if provided
    if (formData.cc.trim()) {
      const ccEmails = formData.cc.split(",").map((email) => email.trim())
      for (const email of ccEmails) {
        if (!validateEmail(email)) {
          newErrors.cc = `Invalid CC email address: ${email}`
          break
        }
      }
    }

    // Validate other fields
    if (!formData.subject.trim()) {
      newErrors.subject = "Subject is required"
    }

    if (!formData.body.trim()) {
      newErrors.body = "Message body is required"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSend = async () => {
    if (!validateForm() || !reportData) return

    setSending(true)
    setDebugInfo((prev) => [
      ...prev,
      { time: new Date().toLocaleTimeString(), message: "Starting email send process..." },
    ])

    try {
      // Generate PDF attachment
      const pdfContent = await generateReportPDFBase64(reportData)
      const pdfAttachment = {
        fileName: `report_${reportData.id}.pdf`,
        content: pdfContent,
        contentType: "application/pdf",
        fileSize: pdfContent.length,
      }

      setDebugInfo((prev) => [...prev, { time: new Date().toLocaleTimeString(), message: "PDF attachment prepared" }])

      // Prepare email data
      const emailData = {
        from: "noreply@oohoperator.com",
        to: formData.to.split(",").map((email) => email.trim()),
        cc: formData.cc ? formData.cc.split(",").map((email) => email.trim()) : undefined,
        subject: formData.subject,
        body: formData.body,
        attachments: [pdfAttachment],
        reportId: reportData.id,
        status: "draft" as const,
        userId: "demo-user",
      }

      setDebugInfo((prev) => [...prev, { time: new Date().toLocaleTimeString(), message: "Creating email record..." }])

      // Create email record
      const emailId = await emailService.createEmail(emailData)
      setDebugInfo((prev) => [
        ...prev,
        { time: new Date().toLocaleTimeString(), message: `Email record created: ${emailId}` },
      ])

      // Send email
      setDebugInfo((prev) => [...prev, { time: new Date().toLocaleTimeString(), message: "Sending email..." }])
      await emailService.sendEmail(emailId)

      setDebugInfo((prev) => [...prev, { time: new Date().toLocaleTimeString(), message: "Email sent successfully!" }])

      toast({
        title: "Email Sent",
        description: "Your email has been sent successfully!",
      })

      // Redirect back to report
      setTimeout(() => {
        router.push(`/logistics/reports/${params.id}`)
      }, 2000)
    } catch (error) {
      console.error("Error sending email:", error)
      setDebugInfo((prev) => [
        ...prev,
        {
          time: new Date().toLocaleTimeString(),
          message: `Send failed: ${error instanceof Error ? error.message : "Unknown error"}`,
          error: true,
        },
      ])

      toast({
        title: "Send Failed",
        description: error instanceof Error ? error.message : "Failed to send email",
        variant: "destructive",
      })
    } finally {
      setSending(false)
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin" />
          <span className="ml-2">Loading...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Button variant="ghost" size="sm" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />
          Back
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Compose Email</h1>
          <p className="text-muted-foreground">Send report via email</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Email Form */}
        <div className="lg:col-span-2 space-y-6">
          {/* Email Template Selection */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="h-5 w-5" />
                Email Template
              </CardTitle>
              <CardDescription>Choose a template to get started quickly</CardDescription>
            </CardHeader>
            <CardContent>
              <Select value={formData.selectedTemplate} onValueChange={handleTemplateSelect}>
                <SelectTrigger>
                  <SelectValue placeholder="Select an email template..." />
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
                  className={errors.to ? "border-red-500" : ""}
                />
                {errors.to && <p className="text-sm text-red-500">{errors.to}</p>}
                <p className="text-xs text-muted-foreground">Separate multiple emails with commas</p>
              </div>

              {/* CC Field */}
              <div className="space-y-2">
                <Label htmlFor="cc">CC (Optional)</Label>
                <Input
                  id="cc"
                  type="email"
                  placeholder="cc@example.com"
                  value={formData.cc}
                  onChange={(e) => setFormData((prev) => ({ ...prev, cc: e.target.value }))}
                  className={errors.cc ? "border-red-500" : ""}
                />
                {errors.cc && <p className="text-sm text-red-500">{errors.cc}</p>}
              </div>

              {/* Subject Field */}
              <div className="space-y-2">
                <Label htmlFor="subject">Subject *</Label>
                <Input
                  id="subject"
                  placeholder="Email subject"
                  value={formData.subject}
                  onChange={(e) => setFormData((prev) => ({ ...prev, subject: e.target.value }))}
                  className={errors.subject ? "border-red-500" : ""}
                />
                {errors.subject && <p className="text-sm text-red-500">{errors.subject}</p>}
              </div>

              {/* Message Body */}
              <div className="space-y-2">
                <Label htmlFor="body">Message *</Label>
                <Textarea
                  id="body"
                  placeholder="Type your message here..."
                  rows={8}
                  value={formData.body}
                  onChange={(e) => setFormData((prev) => ({ ...prev, body: e.target.value }))}
                  className={errors.body ? "border-red-500" : ""}
                />
                {errors.body && <p className="text-sm text-red-500">{errors.body}</p>}
              </div>

              {/* Attachments */}
              <div className="space-y-2">
                <Label>Attachments</Label>
                <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
                  <FileText className="h-4 w-4" />
                  <span className="text-sm">report_{reportData?.id}.pdf</span>
                  <Badge variant={pdfGenerated ? "default" : "secondary"}>
                    {pdfGenerated ? "Ready" : "Generating..."}
                  </Badge>
                </div>
              </div>

              {/* Send Button */}
              <Separator />
              <div className="flex justify-end">
                <Button onClick={handleSend} disabled={sending || !pdfGenerated} size="lg">
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
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Report Info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Report Info</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div>
                <Label className="text-xs text-muted-foreground">Report ID</Label>
                <p className="text-sm font-mono">{reportData?.id}</p>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Title</Label>
                <p className="text-sm">{reportData?.title || "Untitled"}</p>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Status</Label>
                <Badge variant="outline">{reportData?.status}</Badge>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Created By</Label>
                <p className="text-sm">{reportData?.createdBy}</p>
              </div>
            </CardContent>
          </Card>

          {/* SMTP Configuration */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <AlertCircle className="h-4 w-4" />
                SMTP Status
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription className="text-sm">
                  To send real emails, configure these environment variables:
                  <br />• SMTP_HOST
                  <br />• SMTP_USER
                  <br />• SMTP_PASS
                  <br />
                  <br />
                  Currently running in demo mode.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>

          {/* Debug Info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Debug Log</CardTitle>
            </CardHeader>
            <CardContent className="space-y-1 max-h-60 overflow-y-auto">
              {debugInfo.map((info, index) => (
                <div
                  key={index}
                  className={`text-xs p-2 rounded ${info.error ? "bg-red-50 text-red-700" : "bg-gray-50"}`}
                >
                  <span className="font-mono text-muted-foreground">{info.time}</span>
                  <br />
                  <span>{info.message}</span>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

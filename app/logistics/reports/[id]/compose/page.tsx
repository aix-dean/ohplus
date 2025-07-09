"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, Send, Paperclip, Plus, Smile } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import { emailService, type EmailTemplate } from "@/lib/email-service"
import { pdfService } from "@/lib/pdf-service"

interface ComposeEmailPageProps {
  params: {
    id: string
  }
}

export default function ComposeEmailPage({ params }: ComposeEmailPageProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [isSending, setIsSending] = useState(false)
  const [templates, setTemplates] = useState<EmailTemplate[]>([])
  const [selectedTemplate, setSelectedTemplate] = useState<EmailTemplate | null>(null)
  const [pdfAttachment, setPdfAttachment] = useState<{
    fileName: string
    fileUrl: string
    fileSize: number
  } | null>(null)

  // Form state
  const [formData, setFormData] = useState({
    to: "",
    cc: "",
    subject: "Report Ready for Review",
    body: `Hi [Customer's Name],

I hope you're doing well.

Attached is the report you requested. We've prepared a comprehensive analysis based on your requirements and current project status.

Please feel free to review and let me know if you have any questions or would like to explore additional options. I'm happy to assist.

Looking forward to your feedback!

Best regards,
[Your Full Name]
[Your Position]
[Company Name]
[Contact Info]`,
  })

  // Debug state
  const [debugInfo, setDebugInfo] = useState<string[]>([])

  const addDebugInfo = (info: string) => {
    setDebugInfo((prev) => [...prev, `${new Date().toLocaleTimeString()}: ${info}`])
  }

  useEffect(() => {
    loadTemplates()
    generatePDFAttachment()
  }, [])

  const loadTemplates = async () => {
    try {
      addDebugInfo("Loading email templates...")
      const userTemplates = await emailService.getEmailTemplates("current-user")

      if (userTemplates.length === 0) {
        addDebugInfo("No templates found, creating default templates...")
        await emailService.createDefaultTemplates("current-user")
        const newTemplates = await emailService.getEmailTemplates("current-user")
        setTemplates(newTemplates)
        addDebugInfo(`Created ${newTemplates.length} default templates`)
      } else {
        setTemplates(userTemplates)
        addDebugInfo(`Loaded ${userTemplates.length} templates`)
      }
    } catch (error) {
      console.error("Error loading templates:", error)
      addDebugInfo(`Error loading templates: ${error}`)
    }
  }

  const generatePDFAttachment = async () => {
    try {
      addDebugInfo("Generating PDF attachment...")
      const pdfBlob = await pdfService.generateReportPDFFromId(params.id)
      const fileName = `Report_${params.id}_${new Date().toISOString().split("T")[0]}.pdf`
      const fileUrl = URL.createObjectURL(pdfBlob)

      setPdfAttachment({
        fileName,
        fileUrl,
        fileSize: pdfBlob.size,
      })

      addDebugInfo(`PDF generated: ${fileName} (${Math.round(pdfBlob.size / 1024)}KB)`)
    } catch (error) {
      console.error("Error generating PDF:", error)
      addDebugInfo(`Error generating PDF: ${error}`)
      toast.error("Failed to generate PDF attachment")
    }
  }

  const handleTemplateSelect = (template: EmailTemplate) => {
    setSelectedTemplate(template)
    setFormData((prev) => ({
      ...prev,
      subject: template.subject,
      body: template.body,
    }))
    addDebugInfo(`Applied template: ${template.name}`)
  }

  const handleSendEmail = async () => {
    try {
      setIsSending(true)
      addDebugInfo("Starting email send process...")

      // Validate form
      if (!formData.to.trim()) {
        toast.error("Please enter recipient email address")
        return
      }

      if (!formData.subject.trim()) {
        toast.error("Please enter email subject")
        return
      }

      if (!formData.body.trim()) {
        toast.error("Please enter email body")
        return
      }

      // Parse email addresses
      const toEmails = formData.to
        .split(",")
        .map((email) => email.trim())
        .filter(Boolean)
      const ccEmails = formData.cc
        ? formData.cc
            .split(",")
            .map((email) => email.trim())
            .filter(Boolean)
        : []

      addDebugInfo(`Recipients: ${toEmails.join(", ")}`)
      if (ccEmails.length > 0) {
        addDebugInfo(`CC: ${ccEmails.join(", ")}`)
      }

      // Create email record
      addDebugInfo("Creating email record in database...")
      const emailId = await emailService.createEmail({
        from: "dean.aisyndicate.ph@gmail.com",
        to: toEmails,
        cc: ccEmails.length > 0 ? ccEmails : undefined,
        subject: formData.subject,
        body: formData.body,
        attachments: pdfAttachment
          ? [
              {
                fileName: pdfAttachment.fileName,
                fileUrl: pdfAttachment.fileUrl,
                fileSize: pdfAttachment.fileSize,
                fileType: "application/pdf",
              },
            ]
          : undefined,
        reportId: params.id,
        templateId: selectedTemplate?.id,
        status: "draft",
        userId: "current-user",
      })

      addDebugInfo(`Email record created with ID: ${emailId}`)

      // Verify email was created
      const createdEmail = await emailService.getEmailById(emailId)
      if (!createdEmail) {
        throw new Error("Failed to verify email creation")
      }
      addDebugInfo("Email record verified in database")

      // Send email
      addDebugInfo("Sending email via API...")
      await emailService.sendEmail(emailId)

      addDebugInfo("Email sent successfully!")
      toast.success("Email sent successfully!")

      // Navigate back after a short delay
      setTimeout(() => {
        router.back()
      }, 2000)
    } catch (error) {
      console.error("Error sending email:", error)
      const errorMessage = error instanceof Error ? error.message : "Unknown error"
      addDebugInfo(`Error: ${errorMessage}`)
      toast.error(`Failed to send email: ${errorMessage}`)
    } finally {
      setIsSending(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Button variant="ghost" size="sm" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-2xl font-bold">Compose Email</h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Compose Area */}
          <div className="lg:col-span-2 space-y-4">
            {/* Email Form */}
            <Card>
              <CardContent className="p-6 space-y-4">
                {/* To Field */}
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">To:</label>
                  <Input
                    type="email"
                    placeholder="recipient@example.com"
                    value={formData.to}
                    onChange={(e) => setFormData((prev) => ({ ...prev, to: e.target.value }))}
                  />
                </div>

                {/* CC Field */}
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">Cc:</label>
                  <Input
                    type="email"
                    placeholder="cc@example.com (optional)"
                    value={formData.cc}
                    onChange={(e) => setFormData((prev) => ({ ...prev, cc: e.target.value }))}
                  />
                </div>

                {/* Subject Field */}
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">Subject:</label>
                  <Input
                    type="text"
                    placeholder="Email subject"
                    value={formData.subject}
                    onChange={(e) => setFormData((prev) => ({ ...prev, subject: e.target.value }))}
                  />
                </div>

                {/* Body Field */}
                <div>
                  <Textarea
                    placeholder="Compose your email..."
                    value={formData.body}
                    onChange={(e) => setFormData((prev) => ({ ...prev, body: e.target.value }))}
                    rows={12}
                    className="resize-none"
                  />
                </div>

                {/* Attachment */}
                {pdfAttachment && (
                  <div className="flex items-center gap-2 p-3 bg-blue-50 rounded-lg border">
                    <Paperclip className="h-4 w-4 text-blue-600" />
                    <span className="text-sm font-medium text-blue-900">{pdfAttachment.fileName}</span>
                    <Badge variant="secondary" className="text-xs">
                      {Math.round(pdfAttachment.fileSize / 1024)}KB
                    </Badge>
                  </div>
                )}

                {/* Send Button */}
                <div className="flex justify-end pt-4">
                  <Button onClick={handleSendEmail} disabled={isSending} className="bg-blue-600 hover:bg-blue-700">
                    {isSending ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
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
          <div className="space-y-4">
            {/* Templates */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Templates:</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {templates.map((template) => (
                  <div
                    key={template.id}
                    className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                      selectedTemplate?.id === template.id
                        ? "bg-blue-50 border-blue-200"
                        : "bg-gray-50 border-gray-200 hover:bg-gray-100"
                    }`}
                    onClick={() => handleTemplateSelect(template)}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-sm">{template.name}</span>
                      <div className="flex gap-1">
                        <Smile className="h-4 w-4 text-yellow-500" />
                      </div>
                    </div>
                  </div>
                ))}

                <Button variant="outline" size="sm" className="w-full mt-2 bg-transparent">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Template
                </Button>
              </CardContent>
            </Card>

            {/* Debug Info */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Debug Info</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-1 max-h-60 overflow-y-auto">
                  {debugInfo.map((info, index) => (
                    <div key={index} className="text-xs text-gray-600 font-mono">
                      {info}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Domain Notice */}
            <Card className="border-yellow-200 bg-yellow-50">
              <CardContent className="p-4">
                <div className="text-sm text-yellow-800">
                  <strong>Note:</strong> Emails are sent from dean.aisyndicate.ph@gmail.com. To send from a custom
                  domain, verify it at resend.com/domains.
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}

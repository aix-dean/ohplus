"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { toast } from "sonner"
import { ArrowLeft, Mail, AlertCircle, Loader2 } from "lucide-react"
import { getReports, type ReportData } from "@/lib/report-service"
import { emailService, type Email, type EmailTemplate } from "@/lib/email-service"
import { generateReportPDFAsBase64 } from "@/lib/pdf-service"
import { getProductById, type Product } from "@/lib/firebase-service"

export default function ComposeEmailPage() {
  const params = useParams()
  const router = useRouter()
  const reportId = params.id as string

  // State
  const [report, setReport] = useState<ReportData | null>(null)
  const [product, setProduct] = useState<Product | null>(null)
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
    loadData()
  }, [reportId])

  const loadData = async () => {
    try {
      setLoading(true)

      // Check if we're on the client side
      if (typeof window === "undefined") {
        console.log("Running on server side, skipping Firebase operations")
        return
      }

      console.log("Loading report data for ID:", reportId)

      // Load report
      const reports = await getReports()
      const reportData = reports.find((r) => r.id === reportId)

      if (!reportData) {
        toast.error("Report not found")
        router.push("/logistics/reports")
        return
      }

      console.log("Report found:", reportData)
      setReport(reportData)

      // Try to load product data if available
      if (reportData.siteId) {
        try {
          const productData = await getProductById(reportData.siteId)
          if (productData) {
            setProduct(productData)
            console.log("Product data loaded:", productData.name)
          }
        } catch (error) {
          console.log("Could not load product data:", error)
          // Continue without product data
        }
      }

      // Load email templates
      try {
        const templatesData = await emailService.getEmailTemplates("current-user-id") // Replace with actual user ID
        if (templatesData.length === 0) {
          console.log("No templates found, creating defaults...")
          await emailService.createDefaultTemplates("current-user-id")
          const newTemplates = await emailService.getEmailTemplates("current-user-id")
          setTemplates(newTemplates)
        } else {
          setTemplates(templatesData)
        }
        console.log("Templates loaded:", templatesData.length)
      } catch (error) {
        console.error("Error loading templates:", error)
        // Continue without templates
      }

      // Set default form data
      const reportType = reportData.reportType || "Report"
      const siteName = reportData.siteName || reportData.title || "Site"

      setFormData({
        to: "",
        cc: "",
        subject: `${reportType} - ${siteName}`,
        body: `Hi [Client Name],

I hope this email finds you well.

Please find attached the ${reportType.toLowerCase()} for ${siteName}. The report has been carefully prepared and contains comprehensive information about the current status.

Report Details:
- Type: ${reportType}
- Site: ${siteName}
- Status: ${reportData.status || "Completed"}
- Date: ${reportData.date ? new Date(reportData.date).toLocaleDateString() : new Date().toLocaleDateString()}

Please review the attached document and let me know if you have any questions or need any clarification.

Thank you for your continued trust in our services.

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
      console.log("Generating PDF for report:", reportData.id)

      const pdfBase64 = await generateReportPDFAsBase64(reportData)
      setPdfData(pdfBase64)
      setPdfGenerated(true)

      console.log("PDF generated successfully")
      toast.success("PDF report generated successfully")
    } catch (error) {
      console.error("Error generating PDF:", error)
      toast.error("Failed to generate PDF report")
      // Continue without PDF
      setPdfGenerated(false)
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
    if (!validateForm()) return

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
        attachments: pdfGenerated && pdfData
          ? [
              {
                fileName: `report-${report?.title?.replace(/[^a-zA-Z0-9]/g, "-") || "logistics-report"}.pdf`,
                fileUrl: pdfData,
                fileSize: Math.round((pdfData.length * 3) / 4), // Approximate size from base64
                fileType: "application/pdf",
              },
            ]
          : undefined,
        reportId: reportId,
        status: "draft",
        userId: "current-user-id", // Replace with actual user ID
      }

      console.log("Creating email record...")

      // Create email record
      const emailId = await emailService.createEmail(emailData)
      console.log("Email record created with ID:", emailId)

      // Send email
      console.log("Sending email...")
      await emailService.sendEmail(emailId)

      console.log("Email sent successfully!")
      toast.success("Email sent successfully!")

      // Redirect back to report
      setTimeout(() => {
        router.push(`/logistics/reports/${reportId}`)
      }, 2000)
    } catch (error) {
      console.error("Error sending email:", error)
      const errorMessage = error instanceof Error ? error.message : "Failed to send email"
      toast.error(errorMessage)
    } finally {
      setSending(false)
    }
  }

  // Show loading state
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

  // Show error if report not found
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
                <CardDescription>Choose a template to get\

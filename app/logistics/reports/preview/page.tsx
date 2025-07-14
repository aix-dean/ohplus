"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { ReportPostSuccessDialog } from "@/components/report-post-success-dialog"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"
import { ArrowLeft, FileText, ImageIcon, Video, File, X, Download, ZoomIn, Send, Save } from "lucide-react"
import { createReport, type ReportData } from "@/lib/report-service"
import { generateReportPDF } from "@/lib/pdf-service"
import { useAuth } from "@/contexts/auth-context"
import { SendReportDialog } from "@/components/send-report-dialog"
import { getUserById, type User } from "@/lib/firebase-service"
import { useToast } from "@/hooks/use-toast"

export default function ReportPreviewPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const reportId = searchParams.get("reportId") || "temp-report-id" // Placeholder or actual ID
  const [report, setReport] = useState<ReportData | null>(null)
  const [product, setProduct] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [fullScreenAttachment, setFullScreenAttachment] = useState<any>(null)
  const [isFullScreenOpen, setIsFullScreenOpen] = useState(false)
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false)
  const [isSendDialogOpen, setIsSendDialogOpen] = useState(false)
  const [isPosting, setIsPosting] = useState(false)
  const [reportContent, setReportContent] = useState("")
  const [showSuccessDialog, setShowSuccessDialog] = useState(false)
  const [postedReportId, setPostedReportId] = useState("")
  const { user } = useAuth()
  const [userData, setUserData] = useState<User | null>(null)
  const { toast } = useToast()

  useEffect(() => {
    loadPreviewData()
  }, [])

  const loadPreviewData = async () => {
    try {
      const reportDataStr = sessionStorage.getItem("previewReportData")
      const productDataStr = sessionStorage.getItem("previewProductData")

      if (!reportDataStr || !productDataStr) {
        toast({
          title: "Error",
          description: "No preview data found. Please generate a report first.",
          variant: "destructive",
        })
        router.push("/logistics/dashboard")
        return
      }

      const reportData = JSON.parse(reportDataStr)
      const productData = JSON.parse(productDataStr)

      setReport(reportData)
      setProduct(productData)

      // Fetch user data for company logo
      if (reportData.sellerId) {
        const userInfo = await getUserById(reportData.sellerId)
        setUserData(userInfo)
      }
    } catch (error) {
      console.error("Error loading preview data:", error)
      toast({
        title: "Error",
        description: "Failed to load preview data",
        variant: "destructive",
      })
      router.push("/logistics/dashboard")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    // In a real application, you would fetch the report content based on reportId
    // For now, we'll use a placeholder or content passed via state/params
    setReportContent(`
      ## Site Performance Report - Q2 2024

      **Site Name:** Main Street Billboard
      **Location:** 123 Main St, Anytown, USA
      **Reporting Period:** April 1, 2024 - June 30, 2024

      ### Executive Summary
      The Main Street Billboard performed exceptionally well in Q2 2024, exceeding impression targets by 15%. Key campaigns for "Local Coffee Shop" and "City Marathon" saw significant engagement. Display health remained optimal with 99.8% uptime.

      ### Key Metrics
      - **Total Impressions:** 1,500,000 (Target: 1,300,000)
      - **Average Daily Impressions:** 16,483
      - **Peak Impressions Day:** June 15, 2024 (25,000 impressions)
      - **Display Uptime:** 99.8%
      - **Content Compliance:** 100%

      ### Campaign Performance
      - **Local Coffee Shop (April):** Achieved 500,000 impressions, leading to a 20% increase in foot traffic reported by the client.
      - **City Marathon (May):** Generated 650,000 impressions, contributing to a 30% increase in race registrations.
      - **Summer Sale (June):** Ongoing, with 350,000 impressions so far.

      ### Display Health & Maintenance
      - No major technical issues reported.
      - Minor pixel calibration performed on May 10, 2024.
      - Regular cleaning and inspection conducted.

      ### Recommendations
      - Explore dynamic content scheduling for peak hours to maximize engagement.
      - Propose a follow-up campaign for the "Local Coffee Shop" given its success.
      - Consider adding interactive elements if technology allows.

      ---
      *Report generated on: ${new Date().toLocaleDateString()}*
    `)
  }, [reportId])

  const handlePostReport = async () => {
    if (!report || !user) {
      toast({
        title: "Error",
        description: "Missing report data or user authentication",
        variant: "destructive",
      })
      return
    }

    setIsPosting(true)
    try {
      console.log("Starting to post report...", report)

      // Prepare the report data for Firestore
      const reportToPost: ReportData = {
        siteId: report.siteId,
        siteName: report.siteName,
        siteCode: report.siteCode || "",
        companyId: report.companyId,
        sellerId: report.sellerId,
        client: report.client,
        clientId: report.clientId,
        bookingDates: {
          start: report.bookingDates.start,
          end: report.bookingDates.end,
        },
        breakdate: report.breakdate,
        sales: report.sales,
        reportType: report.reportType,
        date: report.date,
        attachments: report.attachments || [],
        status: "posted", // Change from draft/preview to posted
        createdBy: report.createdBy,
        createdByName: report.createdByName,
        location: report.location || "",
        category: report.category,
        subcategory: report.subcategory,
        priority: report.priority,
        completionPercentage: report.completionPercentage || 0,
        tags: report.tags || [],
        assignedTo: report.assignedTo || "",
        // Installation report specific fields
        installationStatus: report.installationStatus || "",
        installationTimeline: report.installationTimeline || "",
        delayReason: report.delayReason || "",
        delayDays: report.delayDays || "",
      }

      console.log("Report data prepared for posting:", reportToPost)

      // Create the report in Firestore
      const newReportId = await createReport(reportToPost)

      console.log("Report created successfully with ID:", newReportId)

      // Simulate PDF generation and upload
      const pdfBlob = await generateReportPDF(report, product, false)
      // In a real app, you'd upload pdfBlob to storage and get a URL
      console.log("Generated PDF:", pdfBlob)

      toast({
        title: "Report Posted!",
        description: "Your report has been successfully posted.",
      })

      // Store success state in sessionStorage before redirecting
      sessionStorage.setItem("reportPostedSuccess", "true")
      sessionStorage.setItem("postedReportId", newReportId)

      setPostedReportId(newReportId)
      setShowSuccessDialog(true)

      // Redirect to dashboard after a short delay or after dialog is closed
      // router.push('/logistics/dashboard')
    } catch (error) {
      console.error("Error posting report to Firestore:", error)
      toast({
        title: "Error",
        description: `Failed to post report: ${error instanceof Error ? error.message : "Unknown error"}`,
        variant: "destructive",
      })
    } finally {
      setIsPosting(false)
    }
  }

  const handleViewReport = (id: string) => {
    router.push(`/logistics/reports/${id}`)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    })
  }

  const getReportTypeDisplay = (type: string) => {
    return type
      .split("-")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ")
  }

  const getFileIcon = (fileName: string) => {
    if (!fileName) return <File className="h-12 w-12 text-gray-400" />

    const extension = fileName.toLowerCase().split(".").pop()

    switch (extension) {
      case "pdf":
        return <FileText className="h-12 w-12 text-red-500" />
      case "doc":
      case "docx":
        return <FileText className="h-12 w-12 text-blue-500" />
      case "jpg":
      case "jpeg":
      case "png":
      case "gif":
      case "webp":
        return <ImageIcon className="h-12 w-12 text-green-500" />
      case "mp4":
      case "avi":
      case "mov":
      case "wmv":
        return <Video className="h-12 w-12 text-purple-500" />
      default:
        return <File className="h-12 w-12 text-gray-500" />
    }
  }

  const isImageFile = (fileName: string) => {
    if (!fileName) return false
    const extension = fileName.toLowerCase().split(".").pop()
    return ["jpg", "jpeg", "png", "gif", "webp"].includes(extension || "")
  }

  const isVideoFile = (fileName: string) => {
    if (!fileName) return false
    const extension = fileName.toLowerCase().split(".").pop()
    return ["mp4", "avi", "mov", "wmv"].includes(extension || "")
  }

  const isPdfFile = (fileName: string) => {
    if (!fileName) return false
    const extension = fileName.toLowerCase().split(".").pop()
    return extension === "pdf"
  }

  const openFullScreen = (attachment: any) => {
    setFullScreenAttachment(attachment)
    setIsFullScreenOpen(true)
  }

  const closeFullScreen = () => {
    setIsFullScreenOpen(false)
    setFullScreenAttachment(null)
  }

  const downloadFile = (fileUrl: string, fileName: string) => {
    const link = document.createElement("a")
    link.href = fileUrl
    link.download = fileName
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const handleDownloadPDF = async () => {
    if (!report || !product) return

    setIsGeneratingPDF(true)
    try {
      await generateReportPDF(report, product, false)
    } catch (error) {
      console.error("Error generating PDF:", error)
      toast({
        title: "Error",
        description: "Failed to generate PDF. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsGeneratingPDF(false)
    }
  }

  const handleSendReport = () => {
    setIsSendDialogOpen(true)
  }

  const handleSendOption = (option: "email" | "whatsapp" | "viber" | "messenger") => {
    setIsSendDialogOpen(false)

    if (option === "email") {
      // Handle email sending logic here
      console.log("Send via email")
    } else {
      console.log(`Send via ${option}`)
    }
  }

  const handleBack = () => {
    // Clear preview data when going back
    sessionStorage.removeItem("previewReportData")
    sessionStorage.removeItem("previewProductData")
    router.back()
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading report preview...</div>
      </div>
    )
  }

  if (!report) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Report preview not found</div>
      </div>
    )
  }

  return (
    <div className="flex flex-col min-h-screen bg-gray-100 p-4 md:p-8">
      {/* Top Navigation Bar */}
      <div className="bg-white px-4 py-3 flex items-center shadow-sm border-b">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleBack}
            className="text-gray-600 hover:text-gray-800 hover:bg-gray-100 p-2"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="bg-cyan-400 text-white px-3 py-1 rounded text-sm font-medium">
            {product?.content_type || "Lilo & Stitch"}
          </div>
          <div className="bg-orange-500 text-white px-3 py-1 rounded text-sm font-medium">PREVIEW</div>
        </div>

        {/* Action Buttons */}
        <div className="ml-auto flex items-center gap-2">
          <Button
            onClick={handlePostReport}
            disabled={isPosting}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded text-sm flex items-center gap-2"
          >
            <Save className="h-4 w-4" />
            {isPosting ? "Posting..." : "Post Report"}
          </Button>
          <Button
            onClick={handleSendReport}
            className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded text-sm flex items-center gap-2"
          >
            <Send className="h-4 w-4" />
            Send
          </Button>
          <Button
            onClick={handleDownloadPDF}
            disabled={isGeneratingPDF}
            className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded text-sm flex items-center gap-2"
          >
            <Download className="h-4 w-4" />
            {isGeneratingPDF ? "Generating..." : "Download"}
          </Button>
        </div>
      </div>

      {/* Angular Blue Header */}
      <div className="w-full relative bg-white">
        <div className="relative h-16 overflow-hidden">
          {/* Main blue section */}
          <div className="absolute inset-0 bg-blue-900"></div>
          {/* Angular cyan section pointing right */}
          <div
            className="absolute top-0 right-0 h-full bg-cyan-400"
            style={{
              width: "40%",
              clipPath: "polygon(25% 0%, 100% 0%, 100% 100%, 0% 100%)",
            }}
          ></div>
          {/* Content overlay */}
          <div className="relative z-10 h-full flex items-center px-6">
            <div className="text-white text-lg font-semibold">Logistics</div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto p-6 space-y-6">
        {/* Report Header with Badge and Logo */}
        <div className="flex justify-between items-center">
          <div className="flex flex-col">
            <div className="bg-cyan-400 text-white px-6 py-3 rounded-lg text-base font-medium inline-block">
              {getReportTypeDisplay(report.reportType)}
            </div>
            <p className="text-gray-600 text-sm mt-2">as of {formatDate(report.date)}</p>
          </div>
          <div className="flex-shrink-0">
            {userData?.company_logo ? (
              <div
                className="bg-white rounded-lg px-4 py-2 flex items-center justify-center shadow-sm"
                style={{ width: "160px", height: "160px" }}
              >
                <img
                  src={userData.company_logo || "/placeholder.svg"}
                  alt={`${userData.company || "Company"} Logo`}
                  className="max-h-full max-w-full object-contain"
                  onError={(e) => {
                    // Fallback to OH+ logo if company logo fails to load
                    const target = e.target as HTMLImageElement
                    target.src = "/ohplus-new-logo.png"
                  }}
                />
              </div>
            ) : (
              <div
                className="bg-white rounded-lg px-4 py-2 flex items-center justify-center shadow-sm"
                style={{ width: "160px", height: "160px" }}
              >
                <img src="/ohplus-new-logo.png" alt="OH+ Logo" className="max-h-full max-w-full object-contain" />
              </div>
            )}
          </div>
        </div>

        {/* Project Information */}
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-gray-800">Project Information</CardTitle>
            <CardDescription className="text-gray-600">Review the generated report before posting.</CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            <div className="prose max-w-none p-4 border rounded-lg bg-white shadow-sm overflow-auto h-[60vh]">
              {/* Render markdown content here. For a real app, use a markdown renderer. */}
              <h2 className="text-2xl font-bold mb-2">Site Performance Report - Q2 2024</h2>
              <p className="text-gray-700">
                <strong>Site Name:</strong> Main Street Billboard
                <br />
                <strong>Location:</strong> 123 Main St, Anytown, USA
                <br />
                <strong>Reporting Period:</strong> April 1, 2024 - June 30, 2024
              </p>
              <h3 className="text-xl font-semibold mt-6 mb-2">Executive Summary</h3>
              <p className="text-gray-700">
                The Main Street Billboard performed exceptionally well in Q2 2024, exceeding impression targets by 15%.
                Key campaigns for "Local Coffee Shop" and "City Marathon" saw significant engagement. Display health
                remained optimal with 99.8% uptime.
              </p>
              <h3 className="text-xl font-semibold mt-6 mb-2">Key Metrics</h3>
              <ul className="list-disc list-inside text-gray-700">
                <li>
                  <strong>Total Impressions:</strong> 1,500,000 (Target: 1,300,000)
                </li>
                <li>
                  <strong>Average Daily Impressions:</strong> 16,483
                </li>
                <li>
                  <strong>Peak Impressions Day:</strong> June 15, 2024 (25,000 impressions)
                </li>
                <li>
                  <strong>Display Uptime:</strong> 99.8%
                </li>
                <li>
                  <strong>Content Compliance:</strong> 100%
                </li>
              </ul>
              <h3 className="text-xl font-semibold mt-6 mb-2">Campaign Performance</h3>
              <ul className="list-disc list-inside text-gray-700">
                <li>
                  <strong>Local Coffee Shop (April):</strong> Achieved 500,000 impressions, leading to a 20% increase in
                  foot traffic reported by the client.
                </li>
                <li>
                  <strong>City Marathon (May):</strong> Generated 650,000 impressions, contributing to a 30% increase in
                  race registrations.
                </li>
                <li>
                  <strong>Summer Sale (June):</strong> Ongoing, with 350,000 impressions so far.
                </li>
              </ul>
              <h3 className="text-xl font-semibold mt-6 mb-2">Display Health & Maintenance</h3>
              <ul className="list-disc list-inside text-gray-700">
                <li>No major technical issues reported.</li>
                <li>Minor pixel calibration performed on May 10, 2024.</li>
                <li>Regular cleaning and inspection conducted.</li>
              </ul>
              <h3 className="text-xl font-semibold mt-6 mb-2">Recommendations</h3>
              <ul className="list-disc list-inside text-gray-700">
                <li>Explore dynamic content scheduling for peak hours to maximize engagement.</li>
                <li>Propose a follow-up campaign for the "Local Coffee Shop" given its success.</li>
                <li>Consider adding interactive elements if technology allows.</li>
              </ul>
              <Separator className="my-6" />
              <p className="text-sm text-gray-500">
                <em>Report generated on: {new Date().toLocaleDateString()}</em>
              </p>
            </div>
            <div className="flex justify-end gap-4">
              <Button variant="outline" onClick={() => router.back()}>
                Back
              </Button>
              <Button onClick={handlePostReport} disabled={isPosting}>
                {isPosting ? "Posting..." : "Post Report"}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Project Status */}
        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <h2 className="text-xl font-bold text-gray-900">Project Status</h2>
            <div className="bg-green-500 text-white px-3 py-1 rounded text-sm font-medium">
              {report.completionPercentage || 100}%
            </div>
          </div>

          {/* Installation Report Specific Status */}
          {report.reportType === "installation-report" && (
            <div className="bg-blue-50 p-4 rounded-lg space-y-2">
              {report.installationStatus && (
                <div className="flex items-center gap-2">
                  <span className="font-medium text-gray-700">Installation Progress:</span>
                  <span className="text-gray-900">{report.installationStatus}%</span>
                  <div className="flex-1 bg-gray-200 rounded-full h-2 ml-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full"
                      style={{ width: `${report.installationStatus}%` }}
                    ></div>
                  </div>
                </div>
              )}
              {report.installationTimeline && (
                <div className="flex items-center gap-2">
                  <span className="font-medium text-gray-700">Timeline:</span>
                  <span
                    className={`px-2 py-1 rounded text-sm ${
                      report.installationTimeline === "delayed"
                        ? "bg-red-100 text-red-800"
                        : "bg-green-100 text-green-800"
                    }`}
                  >
                    {report.installationTimeline === "delayed" ? "Delayed" : "On Time"}
                  </span>
                </div>
              )}
              {report.delayReason && (
                <div className="flex items-start gap-2">
                  <span className="font-medium text-gray-700">Delay Reason:</span>
                  <span className="text-gray-900">{report.delayReason}</span>
                </div>
              )}
              {report.delayDays && (
                <div className="flex items-center gap-2">
                  <span className="font-medium text-gray-700">Delay Duration:</span>
                  <span className="text-gray-900">{report.delayDays} days</span>
                </div>
              )}
            </div>
          )}

          {/* Attachments/Photos */}
          {report.attachments && report.attachments.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {report.attachments.slice(0, 2).map((attachment, index) => (
                <div key={index} className="space-y-2">
                  <div
                    className="bg-gray-200 rounded-lg h-64 flex flex-col items-center justify-center p-4 overflow-hidden cursor-pointer hover:bg-gray-300 transition-colors relative group"
                    onClick={() => attachment.fileUrl && openFullScreen(attachment)}
                  >
                    {attachment.fileUrl ? (
                      <div className="w-full h-full flex flex-col items-center justify-center relative">
                        {/* Zoom overlay */}
                        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-200 flex items-center justify-center">
                          <ZoomIn className="h-8 w-8 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
                        </div>

                        {isImageFile(attachment.fileName || "") ? (
                          <img
                            src={attachment.fileUrl || "/placeholder.svg"}
                            alt={attachment.fileName || `Attachment ${index + 1}`}
                            className="max-w-full max-h-full object-contain rounded"
                            onError={(e) => {
                              // Fallback to icon if image fails to load
                              const target = e.target as HTMLImageElement
                              target.style.display = "none"
                              const parent = target.parentElement
                              if (parent) {
                                parent.innerHTML = `
                                  <div class="text-center space-y-2">
                                    <div class="flex justify-center">${getFileIcon(attachment.fileName || "").type}</div>
                                    <p class="text-sm text-gray-700 font-medium break-all">${attachment.fileName || "Unknown file"}</p>
                                  </div>
                                `
                              }
                            }}
                          />
                        ) : isVideoFile(attachment.fileName || "") ? (
                          <video
                            src={attachment.fileUrl}
                            controls
                            className="max-w-full max-h-full object-contain rounded"
                            onError={(e) => {
                              // Fallback to icon if video fails to load
                              const target = e.target as HTMLVideoElement
                              target.style.display = "none"
                              const parent = target.parentElement
                              if (parent) {
                                parent.innerHTML = `
                                  <div class="text-center space-y-2">
                                    <div class="flex justify-center">${getFileIcon(attachment.fileName || "").type}</div>
                                    <p class="text-sm text-gray-700 font-medium break-all">${attachment.fileName || "Unknown file"}</p>
                                  </div>
                                `
                              }
                            }}
                          />
                        ) : (
                          <div className="text-center space-y-2">
                            {getFileIcon(attachment.fileName || "")}
                            <p className="text-sm text-gray-700 font-medium break-all">{attachment.fileName}</p>
                            <a
                              href={attachment.fileUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs text-blue-600 hover:text-blue-800 underline"
                              onClick={(e) => e.stopPropagation()}
                            >
                              Open File
                            </a>
                          </div>
                        )}
                        {attachment.note && (
                          <p className="text-xs text-gray-500 italic mt-2 text-center">"{attachment.note}"</p>
                        )}
                      </div>
                    ) : attachment.fileName ? (
                      <div className="text-center space-y-2">
                        {getFileIcon(attachment.fileName)}
                        <p className="text-sm text-gray-700 font-medium break-all">{attachment.fileName}</p>
                        {attachment.note && <p className="text-xs text-gray-500 italic">"{attachment.note}"</p>}
                      </div>
                    ) : (
                      <div className="text-center space-y-2">
                        <ImageIcon className="h-12 w-12 text-gray-400" />
                        <p className="text-sm text-gray-600">Project Photo {index + 1}</p>
                      </div>
                    )}
                  </div>
                  <div className="text-sm text-gray-600 space-y-1">
                    <div>
                      <span className="font-semibold">Date:</span> {formatDate(report.date)}
                    </div>
                    <div>
                      <span className="font-semibold">Time:</span>{" "}
                      {new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}
                    </div>
                    <div>
                      <span className="font-semibold">Location:</span> {report.location || "N/A"}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-between items-end pt-8 border-t">
          <div>
            <h3 className="font-semibold mb-2">Prepared by:</h3>
            <div className="text-sm text-gray-600">
              <div>{report.createdByName}</div>
              <div>LOGISTICS</div>
              <div>
                {formatDate(
                  report.created && typeof report.created.toDate === "function"
                    ? report.created.toDate().toISOString().split("T")[0]
                    : report.date,
                )}
              </div>
            </div>
          </div>
          <div className="text-right text-sm text-gray-500 italic">
            "All data are based on the latest available records as of{" "}
            {formatDate(new Date().toISOString().split("T")[0])}."
          </div>
        </div>
      </div>

      {/* Angular Footer */}
      <div className="w-full relative bg-white mt-8">
        <div className="relative h-16 overflow-hidden">
          {/* Cyan section on left */}
          <div className="absolute inset-0 bg-cyan-400"></div>
          {/* Angular dark blue section pointing left */}
          <div
            className="absolute top-0 right-0 h-full bg-blue-900"
            style={{
              width: "75%",
              clipPath: "polygon(25% 0%, 100% 0%, 100% 100%, 0% 100%)",
            }}
          ></div>
          {/* Content overlay */}
          <div className="relative z-10 h-full flex items-center justify-between px-8">
            <div className="flex items-center gap-6">
              <div className="text-white text-lg font-semibold">{""}</div>
              <div className="text-white text-sm">{""}</div>
            </div>
            <div className="text-white text-right flex items-center gap-2">
              <div className="text-sm font-medium">Smart. Seamless. Scalable</div>
              <div className="text-2xl font-bold flex items-center">
                OH!
                <div className="ml-1 text-cyan-400">
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M10 2v16M2 10h16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                  </svg>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Send Report Dialog */}
      {report && (
        <SendReportDialog
          isOpen={isSendDialogOpen}
          onClose={() => setIsSendDialogOpen(false)}
          report={report}
          onSelectOption={handleSendOption}
        />
      )}

      {/* Full Screen Preview Dialog */}
      <Dialog open={isFullScreenOpen} onOpenChange={setIsFullScreenOpen}>
        <DialogContent className="max-w-[90vw] max-h-[90vh] w-full h-full p-0 bg-black border-2 border-gray-800">
          <div className="relative w-full h-full flex flex-col">
            {/* Header with controls */}
            <div className="absolute top-0 left-0 right-0 z-10 bg-black bg-opacity-90 p-4 flex justify-between items-center border-b border-gray-700">
              <DialogTitle className="text-white text-lg font-medium truncate pr-4">
                {fullScreenAttachment?.fileName || "File Preview"}
              </DialogTitle>
              <div className="flex items-center gap-2 flex-shrink-0">
                {fullScreenAttachment?.fileUrl && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => downloadFile(fullScreenAttachment.fileUrl, fullScreenAttachment.fileName || "file")}
                    className="text-white hover:bg-white hover:bg-opacity-20"
                  >
                    <Download className="h-4 w-4" />
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={closeFullScreen}
                  className="text-white hover:bg-white hover:bg-opacity-20"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Scrollable Content Container */}
            <div className="flex-1 overflow-auto pt-16 pb-16">
              <div className="min-h-full flex items-center justify-center p-6">
                {fullScreenAttachment?.fileUrl ? (
                  <div className="w-full max-w-full flex items-center justify-center">
                    {isImageFile(fullScreenAttachment.fileName || "") ? (
                      <img
                        src={fullScreenAttachment.fileUrl || "/placeholder.svg"}
                        alt={fullScreenAttachment.fileName || "Full screen preview"}
                        className="max-w-full max-h-[calc(90vh-8rem)] object-contain rounded shadow-lg"
                        style={{ maxWidth: "calc(90vw - 3rem)" }}
                      />
                    ) : isVideoFile(fullScreenAttachment.fileName || "") ? (
                      <video
                        src={fullScreenAttachment.fileUrl}
                        controls
                        className="max-w-full max-h-[calc(90vh-8rem)] object-contain rounded shadow-lg"
                        style={{ maxWidth: "calc(90vw - 3rem)" }}
                        autoPlay
                      />
                    ) : isPdfFile(fullScreenAttachment.fileName || "") ? (
                      <div className="w-full h-[calc(90vh-8rem)] max-w-[calc(90vw-3rem)]">
                        <iframe
                          src={fullScreenAttachment.fileUrl}
                          className="w-full h-full border-0 rounded shadow-lg"
                          title={fullScreenAttachment.fileName || "PDF Preview"}
                        />
                      </div>
                    ) : (
                      <div className="text-center text-white space-y-4 p-8">
                        <div className="flex justify-center">{getFileIcon(fullScreenAttachment.fileName || "")}</div>
                        <div>
                          <p className="text-lg font-medium break-all">{fullScreenAttachment.fileName}</p>
                          <p className="text-sm text-gray-300 mt-2">Preview not available for this file type</p>
                          <Button
                            variant="outline"
                            className="mt-4 bg-transparent border-white text-white hover:bg-white hover:text-black"
                            onClick={() =>
                              downloadFile(fullScreenAttachment.fileUrl, fullScreenAttachment.fileName || "file")
                            }
                          >
                            <Download className="h-4 w-4 mr-2" />
                            Download File
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center text-white p-8">
                    <p>File not available</p>
                  </div>
                )}
              </div>
            </div>

            {/* Footer with file info */}
            {fullScreenAttachment?.note && (
              <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-90 p-4 border-t border-gray-700">
                <p className="text-white text-sm italic text-center">"{fullScreenAttachment.note}"</p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Report Post Success Dialog */}
      <ReportPostSuccessDialog
        open={showSuccessDialog}
        onOpenChange={(open) => {
          setShowSuccessDialog(open)
          if (!open) {
            router.push("/logistics/dashboard") // Redirect after dialog closes
          }
        }}
        reportId={postedReportId}
        onViewReport={handleViewReport}
      />
    </div>
  )
}

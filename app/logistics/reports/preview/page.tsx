"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"
import {
  ArrowLeft,
  FileText,
  ImageIcon,
  Video,
  File,
  X,
  Download,
  ZoomIn,
  Send,
  ExternalLink,
  Edit,
} from "lucide-react"
import { postReport, type ReportData } from "@/lib/report-service"
import type { Product } from "@/lib/firebase-service"
import { generateReportPDF } from "@/lib/pdf-service"
import { useAuth } from "@/contexts/auth-context"
import { SendReportDialog } from "@/components/send-report-dialog"
import { useToast } from "@/hooks/use-toast"
import { collection, query, where, getDocs } from "firebase/firestore"
import { db } from "@/lib/firebase"

export default function ReportPreviewPage() {
  const router = useRouter()
  const [report, setReport] = useState<ReportData | null>(null)
  const [product, setProduct] = useState<Product | null>(null)
  const [loading, setLoading] = useState(true)
  const [posting, setPosting] = useState(false)
  const [fullScreenAttachment, setFullScreenAttachment] = useState<any>(null)
  const [isFullScreenOpen, setIsFullScreenOpen] = useState(false)
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false)
  const [isSendDialogOpen, setIsSendDialogOpen] = useState(false)
  const [imageLoadErrors, setImageLoadErrors] = useState<Set<string>>(new Set())
  const [preparedByName, setPreparedByName] = useState<string>("")
  const { user } = useAuth()
  const { toast } = useToast()
  const [companyLogo, setCompanyLogo] = useState<string>("/ohplus-new-logo.png")

  useEffect(() => {
    loadPreviewData()
  }, [])

  useEffect(() => {
    if (user?.uid) {
      fetchPreparedByName()
    }
  }, [user?.uid])

  const fetchPreparedByName = async () => {
    if (!user?.uid) return

    try {
      const companiesRef = collection(db, "companies")
      const q = query(companiesRef, where("created_by", "==", user.uid))
      const querySnapshot = await getDocs(q)

      if (!querySnapshot.empty) {
        const companyDoc = querySnapshot.docs[0]
        const companyData = companyDoc.data()

        // Try to get the name from various possible fields
        const name =
          companyData.contact_person ||
          companyData.company_name ||
          companyData.name ||
          user.displayName ||
          user.email?.split("@")[0] ||
          "User"

        setPreparedByName(name)

        // Set company logo - fallback to OH+ logo if photo_url is empty or unset
        const logoUrl =
          companyData.photo_url && companyData.photo_url.trim() !== "" ? companyData.photo_url : "/ohplus-new-logo.png"
        setCompanyLogo(logoUrl)
      } else {
        // Fallback to user display name or email
        setPreparedByName(user.displayName || user.email?.split("@")[0] || "User")
        setCompanyLogo("/ohplus-new-logo.png")
      }
    } catch (error) {
      console.error("Error fetching prepared by name:", error)
      // Fallback to user display name or email
      setPreparedByName(user.displayName || user.email?.split("@")[0] || "User")
      setCompanyLogo("/ohplus-new-logo.png")
    }
  }

  const loadPreviewData = () => {
    try {
      const reportDataString = sessionStorage.getItem("previewReportData")
      const productDataString = sessionStorage.getItem("previewProductData")

      if (reportDataString && productDataString) {
        const reportData = JSON.parse(reportDataString)
        const productData = JSON.parse(productDataString)

        console.log("Loaded preview report data:", reportData)
        console.log("Preview report attachments:", reportData.attachments)

        setReport(reportData)
        setProduct(productData)
      } else {
        console.error("No preview data found in session storage")
        toast({
          title: "Error",
          description: "No preview data found",
          variant: "destructive",
        })
        router.push("/logistics/dashboard")
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

  const handlePostReport = async () => {
    if (!report) {
      toast({
        title: "Error",
        description: "No report data available",
        variant: "destructive",
      })
      return
    }

    setPosting(true)
    try {
      console.log("Posting report with attachments:", report.attachments)

      // Remove the isPreview flag and set proper timestamps
      const finalReportData: ReportData = {
        ...report,
        status: "posted",
        // Remove preview-specific fields
        id: undefined,
        created: undefined,
        updated: undefined,
      }

      // Ensure attachments are properly formatted
      if (finalReportData.attachments) {
        finalReportData.attachments = finalReportData.attachments
          .filter((attachment: any) => attachment && attachment.fileUrl && attachment.fileName)
          .map((attachment: any) => ({
            note: attachment.note || "",
            fileName: attachment.fileName,
            fileType: attachment.fileType || "unknown",
            fileUrl: attachment.fileUrl,
          }))
      }

      console.log("Final report data being posted:", finalReportData)
      console.log("Final attachments data:", finalReportData.attachments)

      const reportId = await postReport(finalReportData)

      // Store the posted report ID for success dialog
      sessionStorage.setItem("lastPostedReportId", reportId)

      // Clear preview data
      sessionStorage.removeItem("previewReportData")
      sessionStorage.removeItem("previewProductData")

      toast({
        title: "Success",
        description: "Report posted successfully!",
      })

      // Navigate to service reports page
      router.push("/logistics/service-reports")
    } catch (error) {
      console.error("Error posting report:", error)
      toast({
        title: "Error",
        description: "Failed to post report. Please try again.",
        variant: "destructive",
      })
    } finally {
      setPosting(false)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "2-digit",
      month: "2-digit",
      day: "2-digit",
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
    link.target = "_blank"
    link.rel = "noopener noreferrer"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const openInNewTab = (fileUrl: string) => {
    window.open(fileUrl, "_blank", "noopener,noreferrer")
  }

  const handleImageError = (fileUrl: string, fileName: string) => {
    console.error("Image failed to load:", fileUrl)
    setImageLoadErrors((prev) => new Set(prev).add(fileUrl))
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
    router.back()
  }

  const handleEdit = () => {
    // Navigate back to the report creation/editing page
    router.back()
  }

  // Helper function to calculate installation duration
  const calculateInstallationDuration = (startDate: string, endDate: string) => {
    const start = new Date(startDate)
    const end = new Date(endDate)
    const diffTime = Math.abs(end.getTime() - start.getTime())
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays
  }

  // Helper function to get site location
  const getSiteLocation = (product: Product | null) => {
    if (!product) return "N/A"
    return product.specs_rental?.location || product.light?.location || "N/A"
  }

  // Helper function to get site size
  const getSiteSize = (product: Product | null) => {
    if (!product) return "N/A"

    const specs = product.specs_rental
    if (specs?.height && specs?.width) {
      const panels = specs.panels || "N/A"
      return `${specs.height} (H) x ${specs.width} (W) x ${panels} Panels`
    }

    return product.specs_rental?.size || product.light?.size || "N/A"
  }

  // Helper function to get material specs
  const getMaterialSpecs = (product: Product | null) => {
    if (!product) return "N/A"
    return product.specs_rental?.material || "Stickers"
  }

  // Helper function to get illumination info
  const getIllumination = (product: Product | null) => {
    if (!product) return "N/A"
    return product.specs_rental?.illumination || "LR 2097 (200 Watts x 40)"
  }

  // Helper function to get gondola info
  const getGondola = (product: Product | null) => {
    if (!product) return "N/A"
    return product.specs_rental?.gondola ? "YES" : "NO"
  }

  // Helper function to get technology info
  const getTechnology = (product: Product | null) => {
    if (!product) return "N/A"
    return product.specs_rental?.technology || "Clear Tapes"
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
        <div className="text-lg">No report data available</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
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
            {product?.content_type || "Preview"}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="ml-auto flex items-center gap-2">
          <Button
            onClick={handleSendReport}
            className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded text-sm flex items-center gap-2"
          >
            <Send className="h-4 w-4" />
            Send
          </Button>
        </div>
      </div>

      {/* Angular Blue Header */}
      <div className="w-full relative bg-white">
        <div className="relative h-16 overflow-hidden">
          <div className="absolute inset-0 bg-blue-900"></div>
          <div
            className="absolute top-0 right-0 h-full bg-cyan-400"
            style={{
              width: "40%",
              clipPath: "polygon(25% 0%, 100% 0%, 100% 100%, 0% 100%)",
            }}
          ></div>
          <div className="relative z-10 h-full flex items-center px-6">
            <div className="text-white text-lg font-semibold">Logistics</div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto p-6 space-y-6">
        {/* Report Header */}
        <div className="flex justify-between items-center">
          <div className="flex flex-col">
            <div className="bg-cyan-400 text-white px-6 py-3 rounded-lg text-base font-medium inline-block">
              {getReportTypeDisplay(report.reportType)}
            </div>
            <p className="text-gray-600 text-sm mt-2">as of {formatDate(report.date)}</p>
          </div>
          <div className="flex-shrink-0">
            <div
              className="bg-white rounded-lg px-4 py-2 flex items-center justify-center shadow-sm"
              style={{ width: "160px", height: "160px" }}
            >
              <img
                src={companyLogo || "/placeholder.svg"}
                alt="Company Logo"
                className="max-h-full max-w-full object-contain"
              />
            </div>
          </div>
        </div>

        {/* Project Information */}
        <Card className="shadow-sm">
          <CardContent className="p-6">
            <h2 className="text-xl font-bold mb-4 text-gray-900">Project Information</h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Left Column */}
              <div className="space-y-2">
                <div className="grid grid-cols-[auto_1fr] gap-4 items-start">
                  <span className="font-bold text-gray-700 whitespace-nowrap">Site ID:</span>
                  <span className="text-gray-900">{getSiteLocation(product)}</span>
                </div>
                <div className="grid grid-cols-[auto_1fr] gap-4 items-start">
                  <span className="font-bold text-gray-700 whitespace-nowrap">Job Order:</span>
                  <span className="text-gray-900">{report.id?.slice(-4).toUpperCase() || "7733"}</span>
                </div>
                <div className="grid grid-cols-[auto_1fr] gap-4 items-start">
                  <span className="font-bold text-gray-700 whitespace-nowrap">Job Order Date:</span>
                  <span className="text-gray-900">{formatDate(report.date)}</span>
                </div>
                <div className="grid grid-cols-[auto_1fr] gap-4 items-start">
                  <span className="font-bold text-gray-700 whitespace-nowrap">Site:</span>
                  <span className="text-gray-900">{report.siteName}</span>
                </div>
                <div className="grid grid-cols-[auto_1fr] gap-4 items-start">
                  <span className="font-bold text-gray-700 whitespace-nowrap">Size:</span>
                  <span className="text-gray-900">{getSiteSize(product)}</span>
                </div>
                <div className="grid grid-cols-[auto_1fr] gap-4 items-start">
                  <span className="font-bold text-gray-700 whitespace-nowrap">Start Date:</span>
                  <span className="text-gray-900">{formatDate(report.bookingDates.start)}</span>
                </div>
                <div className="grid grid-cols-[auto_1fr] gap-4 items-start">
                  <span className="font-bold text-gray-700 whitespace-nowrap">End Date:</span>
                  <span className="text-gray-900">{formatDate(report.bookingDates.end)}</span>
                </div>
                <div className="grid grid-cols-[auto_1fr] gap-4 items-start">
                  <span className="font-bold text-gray-700 whitespace-nowrap">Installation Duration:</span>
                  <span className="text-gray-900">
                    {calculateInstallationDuration(report.bookingDates.start, report.bookingDates.end)} days
                  </span>
                </div>
              </div>

              {/* Right Column */}
              <div className="space-y-2">
                <div className="grid grid-cols-[auto_1fr] gap-4 items-start">
                  <span className="font-bold text-gray-700 whitespace-nowrap">Content:</span>
                  <span className="text-gray-900">{product?.content_type || "Static"}</span>
                </div>
                <div className="grid grid-cols-[auto_1fr] gap-4 items-start">
                  <span className="font-bold text-gray-700 whitespace-nowrap">Material Specs:</span>
                  <span className="text-gray-900">{getMaterialSpecs(product)}</span>
                </div>
                <div className="grid grid-cols-[auto_1fr] gap-4 items-start">
                  <span className="font-bold text-gray-700 whitespace-nowrap">Crew:</span>
                  <span className="text-gray-900">Team {report.assignedTo || "4"}</span>
                </div>
                <div className="grid grid-cols-[auto_1fr] gap-4 items-start">
                  <span className="font-bold text-gray-700 whitespace-nowrap">Illumination:</span>
                  <span className="text-gray-900">{getIllumination(product)}</span>
                </div>
                <div className="grid grid-cols-[auto_1fr] gap-4 items-start">
                  <span className="font-bold text-gray-700 whitespace-nowrap">Gondola:</span>
                  <span className="text-gray-900">{getGondola(product)}</span>
                </div>
                <div className="grid grid-cols-[auto_1fr] gap-4 items-start">
                  <span className="font-bold text-gray-700 whitespace-nowrap">Technology:</span>
                  <span className="text-gray-900">{getTechnology(product)}</span>
                </div>
                <div className="grid grid-cols-[auto_1fr] gap-4 items-start">
                  <span className="font-bold text-gray-700 whitespace-nowrap">Sales:</span>
                  <span className="text-gray-900">{report.sales}</span>
                </div>
              </div>
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

          {/* Attachments/Photos */}
          {report.attachments && report.attachments.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {report.attachments.slice(0, 2).map((attachment, index) => (
                <div key={index} className="space-y-2">
                  <div
                    className="bg-gray-200 rounded-lg h-64 flex flex-col items-center justify-center p-4 overflow-hidden cursor-pointer hover:bg-gray-300 transition-colors relative group"
                    onClick={() => attachment.fileUrl && openFullScreen(attachment)}
                  >
                    <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-200 flex items-center justify-center z-10">
                      <ZoomIn className="h-8 w-8 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
                    </div>

                    {attachment.fileUrl && isImageFile(attachment.fileName) ? (
                      <img
                        src={attachment.fileUrl || "/placeholder.svg"}
                        alt={attachment.fileName}
                        className="max-w-full max-h-full object-contain rounded"
                        onError={(e) => handleImageError(attachment.fileUrl, attachment.fileName)}
                      />
                    ) : (
                      <div className="text-center space-y-2">
                        {getFileIcon(attachment.fileName)}
                        <p className="text-sm text-gray-700 font-medium break-all">{attachment.fileName}</p>
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
                      <span className="font-semibold">Location:</span> {getSiteLocation(product)}
                    </div>
                    {attachment.fileName && (
                      <div>
                        <span className="font-semibold">File:</span> {attachment.fileName}
                      </div>
                    )}
                    {attachment.note && (
                      <div>
                        <span className="font-semibold">Note:</span> {attachment.note}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Debug info for attachments */}
          {process.env.NODE_ENV === "development" && report.attachments && (
            <div className="mt-4 p-4 bg-gray-100 rounded text-xs">
              <h4 className="font-bold mb-2">Debug - Attachments Data:</h4>
              <pre className="whitespace-pre-wrap">{JSON.stringify(report.attachments, null, 2)}</pre>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-between items-end pt-8 border-t">
          <div>
            <h3 className="font-semibold mb-2">Prepared by:</h3>
            <div className="text-sm text-gray-600">
              <div>{preparedByName || "Loading..."}</div>
              <div>LOGISTICS</div>
              <div>{formatDate(report.date)}</div>
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
          <div className="absolute inset-0 bg-cyan-400"></div>
          <div
            className="absolute top-0 right-0 h-full bg-blue-900"
            style={{
              width: "75%",
              clipPath: "polygon(25% 0%, 100% 0%, 100% 100%, 0% 100%)",
            }}
          ></div>
          <div className="relative z-10 h-full flex items-center justify-between px-8">
            <div className="flex items-center gap-6">
              <div className="text-white text-lg font-semibold">{""}</div>
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

      {/* Left Side Floating Buttons */}
      <div className="fixed left-8 top-32 z-50 flex flex-col gap-6">
        {/* Edit Button */}
        <div className="flex flex-col items-center">
          <Button
            onClick={handleEdit}
            className="bg-white hover:bg-gray-50 text-gray-600 border border-gray-300 p-4 rounded-lg shadow-lg hover:shadow-xl transition-all duration-200"
            size="sm"
          >
            <Edit className="h-6 w-6" />
          </Button>
          <span className="text-xs text-gray-600 mt-2 font-medium">Edit</span>
        </div>

        {/* Download Button */}
        <div className="flex flex-col items-center">
          <Button
            onClick={handleDownloadPDF}
            disabled={isGeneratingPDF}
            className="bg-white hover:bg-gray-50 text-gray-600 border border-gray-300 p-4 rounded-lg shadow-lg hover:shadow-xl transition-all duration-200"
            size="sm"
          >
            <Download className="h-6 w-6" />
          </Button>
          <span className="text-xs text-gray-600 mt-2 font-medium">{isGeneratingPDF ? "..." : "Download"}</span>
        </div>
      </div>

      {/* Floating Post Report Button */}
      <div className="fixed bottom-8 right-8 z-50">
        <Button
          onClick={handlePostReport}
          disabled={posting}
          className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg text-base font-semibold shadow-lg hover:shadow-xl transition-all duration-200 flex items-center gap-2"
        >
          {posting ? "Posting..." : "Post Report"}
        </Button>
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
            <div className="absolute top-0 left-0 right-0 z-10 bg-black bg-opacity-90 p-4 flex justify-between items-center border-b border-gray-700">
              <DialogTitle className="text-white text-lg font-medium truncate pr-4">
                {fullScreenAttachment?.fileName || "File Preview"}
              </DialogTitle>
              <div className="flex items-center gap-2 flex-shrink-0">
                {fullScreenAttachment?.fileUrl && (
                  <>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => openInNewTab(fullScreenAttachment.fileUrl)}
                      className="text-white hover:bg-white hover:bg-opacity-20"
                    >
                      <ExternalLink className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() =>
                        downloadFile(fullScreenAttachment.fileUrl, fullScreenAttachment.fileName || "file")
                      }
                      className="text-white hover:bg-white hover:bg-opacity-20"
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                  </>
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
                    ) : (
                      <div className="text-center text-white space-y-4 p-8">
                        <div className="flex justify-center">{getFileIcon(fullScreenAttachment.fileName || "")}</div>
                        <div>
                          <p className="text-lg font-medium break-all">{fullScreenAttachment.fileName}</p>
                          <p className="text-sm text-gray-300 mt-2">Preview not available for this file type</p>
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

            {fullScreenAttachment?.note && (
              <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-90 p-4 border-t border-gray-700">
                <p className="text-white text-sm italic text-center">"{fullScreenAttachment.note}"</p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

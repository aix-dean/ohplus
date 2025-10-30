"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"
import { ArrowLeft, FileText, ImageIcon, Video, File, X, Download, ZoomIn, Send, ExternalLink, Eye } from "lucide-react"
import { getReportsLegacy as getReports, type ReportData } from "@/lib/report-service"
import { getProductById, type Product } from "@/lib/firebase-service"
import { generateReportPDF } from "@/lib/pdf-service"
import { useAuth } from "@/contexts/auth-context"
import { SendReportDialog } from "@/components/send-report-dialog"
import { getUserById, type User } from "@/lib/firebase-service"
import { doc, getDoc } from "firebase/firestore"
import { db } from "@/lib/firebase"

export default function ReportPreviewPage() {
  const params = useParams()
  const router = useRouter()
  const reportId = params.id as string
  const [report, setReport] = useState<ReportData | null>(null)
  const [product, setProduct] = useState<Product | null>(null)
  const [loading, setLoading] = useState(true)
  const [fullScreenAttachment, setFullScreenAttachment] = useState<any>(null)
  const [isFullScreenOpen, setIsFullScreenOpen] = useState(false)
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false)
  const [isSendDialogOpen, setIsSendDialogOpen] = useState(false)
  const [isPDFViewerOpen, setIsPDFViewerOpen] = useState(false)
  const { user } = useAuth()
  const [userData, setUserData] = useState<User | null>(null)

  useEffect(() => {
    if (reportId) {
      fetchReportData()
    }
  }, [reportId])

  const fetchReportData = async () => {
    try {
      // Get all reports and find the one with matching ID
      const reports = await getReports()
      const foundReport = reports.find((r) => r.id === reportId)

      if (foundReport) {
        console.log("Found report:", foundReport)
        console.log("Report attachments:", foundReport.attachments)
        setReport(foundReport)

        // Fetch product data for additional details
        if (foundReport.siteId) {
          const productData = await getProductById(foundReport.siteId)
          setProduct(productData)
        }

        // Fetch user data for company logo
        if (foundReport.sellerId) {
          const userInfo = await getUserById(foundReport.sellerId)
          setUserData(userInfo)
        }
      }
    } catch (error) {
      console.error("Error fetching report data:", error)
    } finally {
      setLoading(false)
    }
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
    link.target = "_blank"
    link.rel = "noopener noreferrer"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const openInNewTab = (fileUrl: string) => {
    window.open(fileUrl, "_blank", "noopener,noreferrer")
  }

  // Improved image URL handling with better Firebase Storage support
  const getImageUrl = (originalUrl: string) => {
    if (!originalUrl) return "/placeholder.svg"

    // If it's already a Firebase Storage URL with token, use it directly
    if (originalUrl.includes("firebasestorage.googleapis.com") && originalUrl.includes("token=")) {
      return originalUrl
    }

    // If it's a Firebase Storage URL without token, try to use it directly first
    if (originalUrl.includes("firebasestorage.googleapis.com")) {
      return originalUrl
    }

    // For other URLs, return as is
    return originalUrl
  }

  const handleDownloadPDF = async () => {
    if (!report || !product) return

    setIsGeneratingPDF(true)
    try {
      // Fetch company data for the report creator
      let companyData = null
      if (report.sellerId) {
        try {
          const userDoc = await getUserById(report.sellerId)
          if (userDoc?.company_id) {
            const companyDoc = await getDoc(doc(db, "companies", userDoc.company_id))
            if (companyDoc.exists()) {
              companyData = { id: companyDoc.id, ...companyDoc.data() }
            }
          }
        } catch (error) {
          console.warn("Could not fetch company data:", error)
        }
      }

      await generateReportPDF(report, product, userData, companyData, false)
    } catch (error) {
      console.error("Error generating PDF:", error)
      alert("Failed to generate PDF. Please try again.")
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

  const handleViewPDF = () => {
    setIsPDFViewerOpen(true)
  }

  const handleBack = () => {
    router.back()
  }

  // Simplified image component with better error handling
  const ImageDisplay = ({ attachment, index }: { attachment: any; index: number }) => {
    const [imageError, setImageError] = useState(false)
    const [isLoading, setIsLoading] = useState(true)

    const handleImageLoadError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
      console.error(`Image load failed for:`, attachment.fileUrl)
      setImageError(true)
      setIsLoading(false)
    }

    const handleImageLoadSuccess = () => {
      console.log(`Image loaded successfully:`, attachment.fileUrl)
      setImageError(false)
      setIsLoading(false)
    }

    // If no fileUrl or image failed to load, show fallback
    if (!attachment.fileUrl || imageError) {
      return (
        <div className="text-center space-y-2">
          <div className="flex justify-center">
            <svg className="h-12 w-12 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"
              />
            </svg>
          </div>
          <p className="text-sm text-gray-700 font-medium break-all">{attachment.fileName || "Unknown file"}</p>
          <p className="text-xs text-red-500">Failed to load image</p>
          <div className="flex gap-2 justify-center">
            <Button
              variant="outline"
              size="sm"
              onClick={(e) => {
                e.stopPropagation()
                if (attachment.fileUrl) {
                  openInNewTab(attachment.fileUrl)
                }
              }}
              className="text-xs"
            >
              <ExternalLink className="h-3 w-3 mr-1" />
              Open
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={(e) => {
                e.stopPropagation()
                if (attachment.fileUrl) {
                  downloadFile(attachment.fileUrl, attachment.fileName || "file")
                }
              }}
              className="text-xs"
            >
              <Download className="h-3 w-3 mr-1" />
              Download
            </Button>
          </div>
        </div>
      )
    }

    if (isImageFile(attachment.fileName || "")) {
      return (
        <div className="w-full h-full relative flex items-center justify-center">
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-100 rounded">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
            </div>
          )}
          <img
            src={getImageUrl(attachment.fileUrl) || "/placeholder.svg"}
            alt={attachment.fileName || `Attachment ${index + 1}`}
            className="max-w-full max-h-full object-contain rounded"
            onError={handleImageLoadError}
            onLoad={handleImageLoadSuccess}
            style={{ display: isLoading ? "none" : "block" }}
          />
          {attachment.note && !isLoading && (
            <p className="absolute bottom-2 left-2 right-2 text-xs text-white bg-black bg-opacity-50 p-1 rounded text-center">
              "{attachment.note}"
            </p>
          )}
        </div>
      )
    }

    if (isVideoFile(attachment.fileName || "")) {
      return (
        <div className="w-full h-full relative">
          <video
            src={attachment.fileUrl}
            controls
            className="max-w-full max-h-full object-contain rounded"
            onError={() => {
              console.error("Video load failed:", attachment.fileUrl)
              setImageError(true)
            }}
          />
          {attachment.note && (
            <p className="absolute bottom-2 left-2 right-2 text-xs text-white bg-black bg-opacity-50 p-1 rounded text-center">
              "{attachment.note}"
            </p>
          )}
        </div>
      )
    }

    // For other file types
    return (
      <div className="text-center space-y-2">
        {getFileIcon(attachment.fileName || "")}
        <p className="text-sm text-gray-700 font-medium break-all">{attachment.fileName}</p>
        <div className="flex gap-2 justify-center">
          <Button
            variant="outline"
            size="sm"
            onClick={(e) => {
              e.stopPropagation()
              openInNewTab(attachment.fileUrl)
            }}
            className="text-xs"
          >
            <ExternalLink className="h-3 w-3 mr-1" />
            Open
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={(e) => {
              e.stopPropagation()
              downloadFile(attachment.fileUrl, attachment.fileName || "file")
            }}
            className="text-xs"
          >
            <Download className="h-3 w-3 mr-1" />
            Download
          </Button>
        </div>
        {attachment.note && <p className="text-xs text-gray-500 italic mt-2 text-center">"{attachment.note}"</p>}
      </div>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading report...</div>
      </div>
    )
  }

  if (!report) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Report not found</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-gray-100">
      {/* Modern Header */}
      <div className="bg-white/80 backdrop-blur-sm border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleBack}
                className="text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-full p-2"
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-gradient-to-r from-cyan-400 to-blue-500 rounded-lg flex items-center justify-center">
                  <FileText className="h-4 w-4 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-semibold text-gray-900">Installation Report</h1>
                  <p className="text-sm text-gray-500">as of {formatDate(report.date)}</p>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-3">
              {report.logistics_report && (
                <Button
                  onClick={handleViewPDF}
                  className="bg-purple-500 hover:bg-purple-600 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 shadow-sm"
                >
                  <Eye className="h-4 w-4" />
                  View PDF
                </Button>
              )}
              <Button
                onClick={handleSendReport}
                className="bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 shadow-sm"
              >
                <Send className="h-4 w-4" />
                Send Report
              </Button>
              <Button
                onClick={handleDownloadPDF}
                disabled={isGeneratingPDF}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 shadow-sm"
              >
                <Download className="h-4 w-4" />
                {isGeneratingPDF ? "Generating..." : "Download PDF"}
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8 space-y-8">
        {/* Company Logo Section */}
        <div className="flex justify-center">
          <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
            {userData?.company_logo ? (
              <img
                src={userData.company_logo || "/placeholder.svg"}
                alt={`${userData.company || "Company"} Logo`}
                className="h-24 w-auto object-contain"
                onError={(e) => {
                  // Fallback to OH+ logo if company logo fails to load
                  const target = e.target as HTMLImageElement
                  target.src = "/ohplus-new-logo.png"
                }}
              />
            ) : (
              <img src="/ohplus-new-logo.png" alt="OH+ Logo" className="h-24 w-auto object-contain" />
            )}
          </div>
        </div>

        {/* Project Information */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
          <div className="bg-gradient-to-r from-blue-600 to-cyan-500 px-6 py-4">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Project Information
            </h2>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="space-y-4">
                <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                  <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    Site Details
                  </h3>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center py-1">
                      <span className="text-gray-600 font-medium">Site ID:</span>
                      <span className="text-gray-900 font-semibold">
                        {report.site.id} {product?.light?.location || product?.specs_rental?.location || ""}
                      </span>
                    </div>
                    <div className="flex justify-between items-center py-1">
                      <span className="text-gray-600 font-medium">Job Order:</span>
                      <span className="text-gray-900 font-semibold">{report.id?.slice(-4).toUpperCase() || "N/A"}</span>
                    </div>
                    <div className="flex justify-between items-center py-1">
                      <span className="text-gray-600 font-medium">Site:</span>
                      <span className="text-gray-900 font-semibold">{report.site.name}</span>
                    </div>
                    <div className="flex justify-between items-center py-1">
                      <span className="text-gray-600 font-medium">Size:</span>
                      <span className="text-gray-900 font-semibold">{product?.specs_rental?.size || product?.light?.size || "N/A"}</span>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                  <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    Schedule
                  </h3>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center py-1">
                      <span className="text-gray-600 font-medium">Start Date:</span>
                      <span className="text-gray-900 font-semibold">{formatDate(report.bookingDates.start.toDate().toISOString().split('T')[0])}</span>
                    </div>
                    <div className="flex justify-between items-center py-1">
                      <span className="text-gray-600 font-medium">End Date:</span>
                      <span className="text-gray-900 font-semibold">{formatDate(report.bookingDates.end.toDate().toISOString().split('T')[0])}</span>
                    </div>
                    <div className="flex justify-between items-center py-1">
                      <span className="text-gray-600 font-medium">Duration:</span>
                      <span className="text-gray-900 font-semibold">
                        {Math.ceil(
                          (report.bookingDates.end.toDate().getTime() - report.bookingDates.start.toDate().getTime()) /
                            (1000 * 60 * 60 * 24),
                        )} days
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                  <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                    Technical Specs
                  </h3>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center py-1">
                      <span className="text-gray-600 font-medium">Content:</span>
                      <span className="text-gray-900 font-semibold">{product?.content_type || "N/A"}</span>
                    </div>
                    <div className="flex justify-between items-center py-1">
                      <span className="text-gray-600 font-medium">Material:</span>
                      <span className="text-gray-900 font-semibold">{product?.specs_rental?.material || "N/A"}</span>
                    </div>
                    <div className="flex justify-between items-center py-1">
                      <span className="text-gray-600 font-medium">Illumination:</span>
                      <span className="text-gray-900 font-semibold">{product?.light?.illumination_status || "N/A"}</span>
                    </div>
                    <div className="flex justify-between items-center py-1">
                      <span className="text-gray-600 font-medium">Technology:</span>
                      <span className="text-gray-900 font-semibold">{product?.specs_rental?.technology || "N/A"}</span>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                  <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                    Team & Operations
                  </h3>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center py-1">
                      <span className="text-gray-600 font-medium">Crew:</span>
                      <span className="text-gray-900 font-semibold">Team {report.assignedTo || "A"}</span>
                    </div>
                    <div className="flex justify-between items-center py-1">
                      <span className="text-gray-600 font-medium">Gondola:</span>
                      <span className="text-gray-900 font-semibold">{product?.specs_rental?.gondola ? "YES" : "NO"}</span>
                    </div>
                    <div className="flex justify-between items-center py-1">
                      <span className="text-gray-600 font-medium">Sales:</span>
                      <span className="text-gray-900 font-semibold">{report.sales}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Project Status & Attachments */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
          <div className="bg-gradient-to-r from-emerald-500 to-teal-500 px-6 py-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <ImageIcon className="h-5 w-5" />
                Project Status & Media
              </h2>
              <div className="bg-white/20 backdrop-blur-sm text-white px-3 py-1 rounded-full text-sm font-medium">
                {report.completionPercentage || 100}% Complete
              </div>
            </div>
          </div>

          <div className="p-6">
            {report.attachments && report.attachments.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {report.attachments.map((attachment, index) => (
                  <div key={index} className="group">
                    <div
                      className="bg-gray-50 rounded-xl h-48 flex flex-col items-center justify-center p-4 overflow-hidden cursor-pointer hover:bg-gray-100 transition-all duration-200 relative border border-gray-200 hover:border-gray-300 hover:shadow-md"
                      onClick={() => attachment.fileUrl && openFullScreen(attachment)}
                    >
                      {/* Zoom overlay */}
                      <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-10 transition-all duration-200 flex items-center justify-center z-10 rounded-xl">
                        <ZoomIn className="h-6 w-6 text-gray-600 opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
                      </div>

                      <ImageDisplay attachment={attachment} index={index} />
                    </div>
                    <div className="mt-3 text-xs text-gray-600 space-y-1 bg-white rounded-lg p-3 border border-gray-100">
                      <div className="flex justify-between">
                        <span className="font-medium text-gray-500">Date:</span>
                        <span className="text-gray-900">
                          {report.created && typeof report.created.toDate === "function"
                            ? formatDate(report.created.toDate().toISOString().split("T")[0])
                            : "N/A"}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="font-medium text-gray-500">Time:</span>
                        <span className="text-gray-900">
                          {new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="font-medium text-gray-500">Location:</span>
                        <span className="text-gray-900">{report.site.location || "N/A"}</span>
                      </div>
                      {attachment.fileName && (
                        <div className="flex justify-between">
                          <span className="font-medium text-gray-500">File:</span>
                          <span className="text-gray-900 truncate ml-2">{attachment.fileName}</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <ImageIcon className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 text-lg font-medium">No attachments available</p>
                <p className="text-gray-400 text-sm">Media files will appear here when uploaded</p>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
            <div className="flex-1">
              <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                Report Information
              </h3>
              <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-gray-600">Report ID:</span>
                  <span className="text-sm font-semibold text-gray-900">{report.report_id || report.id}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-gray-600">Created:</span>
                  <span className="text-sm font-semibold text-gray-900">
                    {report.created && typeof report.created.toDate === "function"
                      ? formatDate(report.created.toDate().toISOString().split("T")[0])
                      : "N/A"}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-gray-600">Status:</span>
                  <span className="text-sm font-semibold text-emerald-600 capitalize">{report.status || "Completed"}</span>
                </div>
              </div>
            </div>

            <div className="flex-1 text-center md:text-right">
              <div className="bg-gradient-to-r from-blue-50 to-cyan-50 rounded-lg p-4 border border-blue-100">
                <p className="text-sm text-gray-600 italic leading-relaxed">
                  "All data are based on the latest available records as of{" "}
                  <span className="font-medium text-gray-900">
                    {formatDate(new Date().toISOString().split("T")[0])}.
                  </span>
                  "
                </p>
              </div>
            </div>
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

      {/* PDF Viewer Dialog */}
      <Dialog open={isPDFViewerOpen} onOpenChange={setIsPDFViewerOpen}>
        <DialogContent className="max-w-[90vw] max-h-[90vh] w-full h-full p-0">
          <div className="relative w-full h-full flex flex-col">
            {/* Header */}
            <div className="absolute top-0 left-0 right-0 z-10 bg-white border-b p-4 flex justify-between items-center">
              <DialogTitle className="text-lg font-medium truncate pr-4">
                Logistics Report PDF
              </DialogTitle>
              <div className="flex items-center gap-2 flex-shrink-0">
                {report.logistics_report && (
                  <>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => openInNewTab(report.logistics_report!)}
                      className="hover:bg-gray-100"
                    >
                      <ExternalLink className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => downloadFile(report.logistics_report!, "logistics_report.pdf")}
                      className="hover:bg-gray-100"
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                  </>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsPDFViewerOpen(false)}
                  className="hover:bg-gray-100"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* PDF Content */}
            <div className="flex-1 pt-16">
              {report.logistics_report ? (
                <iframe
                  src={`${report.logistics_report}#zoom=110`}
                  className="w-full h-full border-0 bg-white"
                  title="Logistics Report PDF"
                  onLoad={() => console.log('PDF iframe loaded successfully')}
                  onError={() => console.log('PDF iframe failed to load')}
                />
              ) : (
                <div className="flex flex-col items-center justify-center h-full space-y-4 p-6">
                  <div className="text-center">
                    <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <h3 className="mt-2 text-lg font-medium text-gray-900">PDF Not Available</h3>
                    <p className="mt-1 text-sm text-gray-500">
                      No logistics report PDF is configured for this report.
                      {report.report_id && ` (Report ID: ${report.report_id})`}
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-gray-400">
                      PDF will be available when the logistics report is generated.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

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

            {/* Scrollable Content Container */}
            <div className="flex-1 overflow-auto pt-16 pb-16">
              <div className="min-h-full flex items-center justify-center p-6">
                {fullScreenAttachment?.fileUrl ? (
                  <div className="w-full max-w-full flex items-center justify-center">
                    {isImageFile(fullScreenAttachment.fileName || "") ? (
                      <img
                        src={getImageUrl(fullScreenAttachment.fileUrl) || "/placeholder.svg"}
                        alt={fullScreenAttachment.fileName || "Full screen preview"}
                        className="max-w-full max-h-[calc(90vh-8rem)] object-contain rounded shadow-lg"
                        style={{ maxWidth: "calc(90vw - 3rem)" }}
                        onError={() => console.error("Full screen image failed to load:", fullScreenAttachment.fileUrl)}
                        onLoad={() =>
                          console.log("Full screen image loaded successfully:", fullScreenAttachment.fileUrl)
                        }
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
                          <div className="flex gap-2 justify-center mt-4">
                            <Button
                              variant="outline"
                              className="bg-transparent border-white text-white hover:bg-white hover:text-black"
                              onClick={() => openInNewTab(fullScreenAttachment.fileUrl)}
                            >
                              <ExternalLink className="h-4 w-4 mr-2" />
                              Open in New Tab
                            </Button>
                            <Button
                              variant="outline"
                              className="bg-transparent border-white text-white hover:bg-white hover:text-black"
                              onClick={() =>
                                downloadFile(fullScreenAttachment.fileUrl, fullScreenAttachment.fileName || "file")
                              }
                            >
                              <Download className="h-4 w-4 mr-2" />
                              Download File
                            </Button>
                          </div>
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
    </div>
  )
}

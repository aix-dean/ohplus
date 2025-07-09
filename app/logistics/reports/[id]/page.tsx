"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ArrowLeft, FileText, ImageIcon, Video, File } from "lucide-react"
import { getReports, type ReportData } from "@/lib/report-service"
import { getProductById, type Product } from "@/lib/firebase-service"
import { useAuth } from "@/contexts/auth-context"

export default function ReportPreviewPage() {
  const params = useParams()
  const router = useRouter()
  const reportId = params.id as string
  const [report, setReport] = useState<ReportData | null>(null)
  const [product, setProduct] = useState<Product | null>(null)
  const [loading, setLoading] = useState(true)
  const { user } = useAuth()

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
        setReport(foundReport)

        // Fetch product data for additional details
        if (foundReport.siteId) {
          const productData = await getProductById(foundReport.siteId)
          setProduct(productData)
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

  const handleBack = () => {
    router.back()
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
    <div className="min-h-screen bg-gray-50">
      {/* Back Button and Content Title Section */}
      <div className="bg-white px-6 py-4 flex items-center gap-4 shadow-sm">
        <Button
          variant="ghost"
          size="lg"
          onClick={handleBack}
          className="text-black rounded-full p-3 hover:bg-gray-100"
        >
          <ArrowLeft className="h-6 w-6" />
        </Button>
        <Badge className="bg-cyan-400 text-white px-4 py-2 rounded-full font-medium text-lg">
          {product?.content_type || "Content"}
        </Badge>
      </div>

      {/* Header */}
      <div className="w-full">
        <img src="/logistics-header.png" alt="Logistics Header" className="w-full h-auto object-cover" />
      </div>

      <div className="max-w-6xl mx-auto p-6 space-y-6">
        {/* Report Title */}
        <div className="flex justify-between items-center">
          <div>
            <Badge className="bg-cyan-400 text-white text-lg px-4 py-2 rounded-full">
              {getReportTypeDisplay(report.reportType)}
            </Badge>
            <p className="text-gray-600 mt-2 italic">as of {formatDate(report.date)}</p>
          </div>
          <div className="flex-shrink-0">
            <img src="/gts-logo.png" alt="GTS Incorporated Logo" className="h-24 w-auto" />
          </div>
        </div>

        {/* Project Information */}
        <Card>
          <CardContent className="p-6">
            <h2 className="text-2xl font-bold mb-6">Project Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <div>
                  <span className="font-semibold">Site ID:</span> {report.siteId}{" "}
                  {product?.light?.location || product?.specs_rental?.location || ""}
                </div>
                <div>
                  <span className="font-semibold">Job Order:</span> {report.id?.slice(-4).toUpperCase() || "N/A"}
                </div>
                <div>
                  <span className="font-semibold">Job Order Date:</span>{" "}
                  {formatDate(report.created?.toDate().toISOString().split("T")[0] || report.date)}
                </div>
                <div>
                  <span className="font-semibold">Site:</span> {report.siteName}
                </div>
                <div>
                  <span className="font-semibold">Size:</span>{" "}
                  {product?.specs_rental?.size || product?.light?.size || "N/A"}
                </div>
                <div>
                  <span className="font-semibold">Start Date:</span> {formatDate(report.bookingDates.start)}
                </div>
                <div>
                  <span className="font-semibold">End Date:</span> {formatDate(report.bookingDates.end)}
                </div>
                <div>
                  <span className="font-semibold">Installation Duration:</span>{" "}
                  {Math.ceil(
                    (new Date(report.bookingDates.end).getTime() - new Date(report.bookingDates.start).getTime()) /
                      (1000 * 60 * 60 * 24),
                  )}{" "}
                  days
                </div>
              </div>
              <div className="space-y-3">
                <div>
                  <span className="font-semibold">Content:</span> {product?.content_type || "N/A"}
                </div>
                <div>
                  <span className="font-semibold">Material Specs:</span> {product?.specs_rental?.material || "N/A"}
                </div>
                <div>
                  <span className="font-semibold">Crew:</span> Team {report.assignedTo || "A"}
                </div>
                <div>
                  <span className="font-semibold">Illumination:</span> {product?.light?.illumination || "N/A"}
                </div>
                <div>
                  <span className="font-semibold">Gondola:</span> {product?.specs_rental?.gondola ? "YES" : "NO"}
                </div>
                <div>
                  <span className="font-semibold">Technology:</span> {product?.specs_rental?.technology || "N/A"}
                </div>
                <div>
                  <span className="font-semibold">Sales:</span> {report.sales}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Project Status */}
        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <h2 className="text-2xl font-bold">Project Status</h2>
            <Badge className="bg-green-500 text-white px-3 py-1 rounded">{report.completionPercentage || 100}%</Badge>
          </div>

          {/* Attachments/Photos */}
          {report.attachments && report.attachments.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {report.attachments.slice(0, 2).map((attachment, index) => (
                <div key={index} className="space-y-2">
                  <div className="bg-gray-200 rounded-lg h-64 flex flex-col items-center justify-center p-4 overflow-hidden">
                    {attachment.fileUrl ? (
                      <div className="w-full h-full flex flex-col items-center justify-center">
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
                                    ${getFileIcon(attachment.fileName || "").props.children}
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
                                    ${getFileIcon(attachment.fileName || "").props.children}
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
              <div>{formatDate(report.created?.toDate().toISOString().split("T")[0] || report.date)}</div>
            </div>
          </div>
          <div className="text-right text-sm text-gray-500 italic">
            "All data are based on the latest available records as of{" "}
            {formatDate(new Date().toISOString().split("T")[0])}."
          </div>
        </div>
      </div>

      {/* Bottom Branding */}
      <div className="w-full mt-8">
        <img src="/logistics-footer.png" alt="Logistics Footer" className="w-full h-auto object-cover" />
      </div>
    </div>
  )
}

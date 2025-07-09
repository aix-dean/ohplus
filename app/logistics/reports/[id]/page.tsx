"use client"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"
import { Download, Send, ArrowLeft, FileText, ImageIcon, Video, File, X, ZoomIn } from "lucide-react"
import Link from "next/link"
import { useToast } from "@/hooks/use-toast"
import { SendReportDialog } from "@/components/send-report-dialog"
import { generateReportPDF } from "@/lib/pdf-service"
import { getReportById, type ReportData } from "@/lib/report-service"
import { getProductById } from "@/lib/firebase-service"

export default function ReportDetailPage() {
  const params = useParams()
  const { toast } = useToast()
  const [report, setReport] = useState<ReportData | null>(null)
  const [product, setProduct] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [sendDialogOpen, setSendDialogOpen] = useState(false)
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false)
  const [fullScreenAttachment, setFullScreenAttachment] = useState<any>(null)
  const [isFullScreenOpen, setIsFullScreenOpen] = useState(false)

  useEffect(() => {
    const fetchReportData = async () => {
      try {
        if (params.id) {
          const reportData = await getReportById(params.id as string)
          if (reportData) {
            setReport(reportData)

            // Fetch product data if available
            if (reportData.siteId) {
              const productData = await getProductById(reportData.siteId)
              setProduct(productData)
            }
          }
        }
      } catch (error) {
        console.error("Error fetching report:", error)
        toast({
          title: "Error",
          description: "Failed to load report data.",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }

    fetchReportData()
  }, [params.id, toast])

  const handleDownloadPDF = async () => {
    if (!report) return

    setIsGeneratingPDF(true)
    try {
      await generateReportPDF(report, product, true)
      toast({
        title: "PDF Downloaded",
        description: "The report has been downloaded successfully.",
      })
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

  const handleSendOption = (option: "email" | "whatsapp" | "viber" | "messenger") => {
    setSendDialogOpen(false)

    if (option === "email") {
      // Placeholder for email functionality
      toast({
        title: "Email Feature",
        description: "Email functionality will be implemented soon.",
      })
    } else {
      toast({
        title: "Not Implemented",
        description: `Sharing via ${option} is not yet implemented.`,
        variant: "destructive",
      })
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

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "completed":
        return "bg-green-100 text-green-800"
      case "in-progress":
        return "bg-yellow-100 text-yellow-800"
      case "pending":
        return "bg-orange-100 text-orange-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
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

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
          <div className="h-32 bg-gray-200 rounded"></div>
        </div>
      </div>
    )
  }

  if (!report) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center py-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Report Not Found</h2>
          <p className="text-gray-600 mb-6">The requested report could not be found.</p>
          <Link href="/logistics/reports">
            <Button>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Reports
            </Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white px-6 py-4 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-4">
          <Link href="/logistics/reports">
            <Button variant="ghost" size="lg" className="text-black rounded-full p-3 hover:bg-gray-100">
              <ArrowLeft className="h-6 w-6" />
            </Button>
          </Link>
          <Badge className="bg-cyan-400 text-white px-4 py-2 rounded-full font-medium text-lg">
            {product?.content_type || "Content"}
          </Badge>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-3">
          <Button
            onClick={() => setSendDialogOpen(true)}
            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center gap-2"
          >
            <Send className="h-4 w-4" />
            Send
          </Button>
          <Button
            onClick={handleDownloadPDF}
            disabled={isGeneratingPDF}
            className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg flex items-center gap-2"
          >
            <Download className="h-4 w-4" />
            {isGeneratingPDF ? "Generating PDF..." : "Download PDF"}
          </Button>
        </div>
      </div>

      {/* Header Image */}
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
                  {formatDate(report.created?.toDate?.()?.toISOString()?.split("T")[0] || report.date)}
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
                          />
                        ) : isVideoFile(attachment.fileName || "") ? (
                          <video src={attachment.fileUrl} className="max-w-full max-h-full object-contain rounded" />
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
              <div>{formatDate(report.created?.toDate?.()?.toISOString()?.split("T")[0] || report.date)}</div>
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

      {/* Send Report Dialog */}
      {report && (
        <SendReportDialog
          isOpen={sendDialogOpen}
          onClose={() => setSendDialogOpen(false)}
          report={report}
          product={product}
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
    </div>
  )
}

"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { ArrowLeft, Download, Calendar, MapPin, Clock, FileText, ImageIcon } from "lucide-react"
import { toast } from "sonner"
import { getReportById, type ReportData } from "@/lib/report-service"
import { generateReportPDF } from "@/lib/pdf-service"

export default function ReportDetailsPage() {
  const params = useParams()
  const router = useRouter()
  const [report, setReport] = useState<ReportData | null>(null)
  const [product, setProduct] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [downloadingPDF, setDownloadingPDF] = useState(false)

  useEffect(() => {
    const fetchReport = async () => {
      try {
        const reportData = await getReportById(params.id as string)
        setReport(reportData.report)
        setProduct(reportData.product)
      } catch (error) {
        console.error("Error fetching report:", error)
        toast.error("Failed to load report")
      } finally {
        setLoading(false)
      }
    }

    if (params.id) {
      fetchReport()
    }
  }, [params.id])

  const handleDownloadPDF = async () => {
    if (!report || !product) {
      toast.error("Report data not available")
      return
    }

    setDownloadingPDF(true)
    try {
      await generateReportPDF(report, product, false)
      toast.success("PDF downloaded successfully")
    } catch (error) {
      console.error("Error generating PDF:", error)
      toast.error("Failed to generate PDF")
    } finally {
      setDownloadingPDF(false)
    }
  }

  const getReportTypeDisplay = (type: string) => {
    return type
      .split("-")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ")
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    })
  }

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
          <div className="h-32 bg-gray-200 rounded"></div>
        </div>
      </div>
    )
  }

  if (!report) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Report Not Found</h1>
          <p className="text-gray-600 mb-4">The requested report could not be found.</p>
          <Button onClick={() => router.back()}>Go Back</Button>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="sm" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{getReportTypeDisplay(report.reportType)}</h1>
            <p className="text-sm text-gray-600">Report ID: {report.id}</p>
          </div>
        </div>
        <Button onClick={handleDownloadPDF} disabled={downloadingPDF} className="bg-red-600 hover:bg-red-700">
          <Download className="h-4 w-4 mr-2" />
          {downloadingPDF ? "Generating PDF..." : "Download PDF"}
        </Button>
      </div>

      {/* Report Status Badge */}
      <div className="mb-6">
        <Badge variant="secondary" className="bg-cyan-100 text-cyan-800">
          {getReportTypeDisplay(report.reportType)}
        </Badge>
        <p className="text-sm text-gray-600 mt-1">as of {formatDate(report.date)}</p>
      </div>

      {/* Project Information */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Project Information
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium text-gray-600">Site ID</label>
                <p className="text-sm">
                  {report.siteId} {product?.light?.location || product?.specs_rental?.location || ""}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">Job Order</label>
                <p className="text-sm">{report.id?.slice(-4).toUpperCase() || "N/A"}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">Job Order Date</label>
                <p className="text-sm">{formatDate(report.created || report.date)}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">Site</label>
                <p className="text-sm">{report.siteName}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">Size</label>
                <p className="text-sm">{product?.specs_rental?.size || product?.light?.size || "N/A"}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">Start Date</label>
                <p className="text-sm">{formatDate(report.bookingDates.start)}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">End Date</label>
                <p className="text-sm">{formatDate(report.bookingDates.end)}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">Installation Duration</label>
                <p className="text-sm">
                  {Math.ceil(
                    (new Date(report.bookingDates.end).getTime() - new Date(report.bookingDates.start).getTime()) /
                      (1000 * 60 * 60 * 24),
                  )}{" "}
                  days
                </p>
              </div>
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium text-gray-600">Content</label>
                <p className="text-sm">{product?.content_type || "N/A"}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">Material Specs</label>
                <p className="text-sm">{product?.specs_rental?.material || "N/A"}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">Crew</label>
                <p className="text-sm">Team {report.assignedTo || "A"}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">Illumination</label>
                <p className="text-sm">{product?.light?.illumination || "N/A"}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">Gondola</label>
                <p className="text-sm">{product?.specs_rental?.gondola ? "YES" : "NO"}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">Technology</label>
                <p className="text-sm">{product?.specs_rental?.technology || "N/A"}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">Sales</label>
                <p className="text-sm">{report.sales}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Project Status */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Project Status
            <Badge variant="default" className="bg-green-500 ml-2">
              {report.completionPercentage || 100}%
            </Badge>
          </CardTitle>
        </CardHeader>
      </Card>

      {/* Attachments */}
      {report.attachments && report.attachments.length > 0 && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ImageIcon className="h-5 w-5" />
              Attachments ({report.attachments.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {report.attachments.slice(0, 2).map((attachment, index) => (
                <div key={index} className="border rounded-lg p-4">
                  {attachment.fileUrl &&
                  attachment.fileName &&
                  ["jpg", "jpeg", "png", "gif", "webp"].includes(
                    attachment.fileName.toLowerCase().split(".").pop() || "",
                  ) ? (
                    <img
                      src={attachment.fileUrl || "/placeholder.svg"}
                      alt={attachment.fileName}
                      className="w-full h-48 object-cover rounded mb-3"
                    />
                  ) : (
                    <div className="w-full h-48 bg-gray-100 rounded mb-3 flex items-center justify-center">
                      <FileText className="h-12 w-12 text-gray-400" />
                    </div>
                  )}
                  <div className="space-y-1">
                    <p className="text-sm font-medium">{attachment.fileName}</p>
                    <div className="flex items-center gap-4 text-xs text-gray-600">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {formatDate(report.date)}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {new Date().toLocaleTimeString("en-US", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>
                    {report.location && (
                      <p className="text-xs text-gray-600 flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        {report.location}
                      </p>
                    )}
                    {attachment.note && <p className="text-xs text-gray-700 mt-2">{attachment.note}</p>}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Footer Information */}
      <Card>
        <CardContent className="pt-6">
          <Separator className="mb-4" />
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium">Prepared by:</p>
              <p className="text-sm">{report.createdByName}</p>
              <p className="text-sm text-gray-600">LOGISTICS</p>
              <p className="text-sm text-gray-600">{formatDate(report.created || report.date)}</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-gray-500 italic max-w-xs">
                "All data are based on the latest available records as of{" "}
                {formatDate(new Date().toISOString().split("T")[0])}."
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

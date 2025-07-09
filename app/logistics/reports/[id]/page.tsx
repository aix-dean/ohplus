"use client"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { CalendarDays, MapPin, User, Clock, Download, Send, ArrowLeft } from "lucide-react"
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

  useEffect(() => {
    const fetchReportData = async () => {
      try {
        if (params.id) {
          const reportData = await getReportById(params.id as string)
          if (reportData) {
            setReport(reportData)

            // Fetch product data if available
            if (reportData.productId) {
              const productData = await getProductById(reportData.productId)
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
    <div className="container mx-auto p-6 max-w-4xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Link href="/logistics/reports">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{getReportTypeDisplay(report.reportType)} Report</h1>
            <p className="text-gray-600">Report ID: {report.id}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            onClick={handleDownloadPDF}
            disabled={isGeneratingPDF}
            variant="outline"
            className="flex items-center gap-2 bg-transparent"
          >
            <Download className="h-4 w-4" />
            {isGeneratingPDF ? "Generating..." : "Download PDF"}
          </Button>

          <Button
            onClick={() => setSendDialogOpen(true)}
            className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white"
          >
            <Send className="h-4 w-4" />
            Send
          </Button>
        </div>
      </div>

      {/* Report Overview */}
      <Card className="mb-6">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Report Overview</CardTitle>
            <Badge className={getStatusColor(report.status || "completed")}>{report.status || "Completed"}</Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center gap-2">
              <CalendarDays className="h-4 w-4 text-gray-500" />
              <span className="text-sm text-gray-600">Created:</span>
              <span className="text-sm font-medium">{formatDate(report.date)}</span>
            </div>

            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-gray-500" />
              <span className="text-sm text-gray-600">Site:</span>
              <span className="text-sm font-medium">{report.siteName}</span>
            </div>

            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-gray-500" />
              <span className="text-sm text-gray-600">Created by:</span>
              <span className="text-sm font-medium">{report.createdByName}</span>
            </div>

            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-gray-500" />
              <span className="text-sm text-gray-600">Duration:</span>
              <span className="text-sm font-medium">
                {Math.ceil(
                  (new Date(report.bookingDates.end).getTime() - new Date(report.bookingDates.start).getTime()) /
                    (1000 * 60 * 60 * 24),
                )}{" "}
                days
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Project Information */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-lg">Project Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <div>
                <span className="text-sm font-medium text-gray-600">Site ID:</span>
                <p className="text-sm">{report.siteId}</p>
              </div>

              <div>
                <span className="text-sm font-medium text-gray-600">Job Order:</span>
                <p className="text-sm">{report.id?.slice(-4).toUpperCase() || "N/A"}</p>
              </div>

              <div>
                <span className="text-sm font-medium text-gray-600">Start Date:</span>
                <p className="text-sm">{formatDate(report.bookingDates.start)}</p>
              </div>

              <div>
                <span className="text-sm font-medium text-gray-600">End Date:</span>
                <p className="text-sm">{formatDate(report.bookingDates.end)}</p>
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <span className="text-sm font-medium text-gray-600">Assigned To:</span>
                <p className="text-sm">Team {report.assignedTo || "A"}</p>
              </div>

              <div>
                <span className="text-sm font-medium text-gray-600">Sales:</span>
                <p className="text-sm">{report.sales}</p>
              </div>

              {product && (
                <>
                  <div>
                    <span className="text-sm font-medium text-gray-600">Size:</span>
                    <p className="text-sm">{product.specs_rental?.size || product.light?.size || "N/A"}</p>
                  </div>

                  <div>
                    <span className="text-sm font-medium text-gray-600">Technology:</span>
                    <p className="text-sm">{product.specs_rental?.technology || "N/A"}</p>
                  </div>
                </>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Project Status */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-lg">Project Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Completion</span>
                <span className="text-sm font-medium">{report.completionPercentage || 100}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-green-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${report.completionPercentage || 100}%` }}
                ></div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Attachments */}
      {report.attachments && report.attachments.length > 0 && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-lg">Attachments</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {report.attachments.slice(0, 4).map((attachment, index) => (
                <div key={index} className="border rounded-lg p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                      <span className="text-blue-600 text-xs font-bold">
                        {attachment.fileName?.split(".").pop()?.toUpperCase() || "FILE"}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{attachment.fileName}</p>
                      {attachment.note && <p className="text-xs text-gray-500 truncate">{attachment.note}</p>}
                    </div>
                  </div>
                </div>
              ))}
            </div>
            {report.attachments.length > 4 && (
              <p className="text-sm text-gray-500 mt-4">+{report.attachments.length - 4} more attachments</p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Notes */}
      {report.notes && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Notes</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-700 whitespace-pre-wrap">{report.notes}</p>
          </CardContent>
        </Card>
      )}

      {/* Send Report Dialog */}
      <SendReportDialog
        isOpen={sendDialogOpen}
        onClose={() => setSendDialogOpen(false)}
        report={report}
        product={product}
        onSelectOption={handleSendOption}
      />
    </div>
  )
}

"use client"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Download, Send, ArrowLeft } from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import { getReportById, type ReportData } from "@/lib/report-service"
import { generateReportPDF } from "@/lib/pdf-service"
import { SendReportDialog } from "@/components/send-report-dialog"

export default function ReportPage() {
  const params = useParams()
  const reportId = params.id as string
  const [report, setReport] = useState<ReportData | null>(null)
  const [loading, setLoading] = useState(true)
  const [sendDialogOpen, setSendDialogOpen] = useState(false)

  useEffect(() => {
    const fetchReport = async () => {
      try {
        const reportData = await getReportById(reportId)
        setReport(reportData)
      } catch (error) {
        console.error("Error fetching report:", error)
      } finally {
        setLoading(false)
      }
    }

    if (reportId) {
      fetchReport()
    }
  }, [reportId])

  const handleDownloadPDF = async () => {
    if (!report) return

    try {
      await generateReportPDF(report, report.product)
    } catch (error) {
      console.error("Error generating PDF:", error)
    }
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
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="space-y-4">
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            <div className="h-4 bg-gray-200 rounded w-5/6"></div>
          </div>
        </div>
      </div>
    )
  }

  if (!report) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Report Not Found</h1>
          <p className="text-gray-600 mb-6">The requested report could not be found.</p>
          <Link href="/logistics/reports">
            <Button>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Reports
            </Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header with angular design */}
      <div className="relative">
        <div className="bg-blue-900 h-16 w-full"></div>
        <div
          className="absolute top-0 right-0 bg-cyan-400 h-16"
          style={{
            width: "35%",
            clipPath: "polygon(15% 0%, 100% 0%, 100% 100%, 0% 100%)",
          }}
        ></div>
        <div className="absolute top-0 left-0 flex items-center h-16 px-6">
          <h1 className="text-white text-lg font-bold">Logistics</h1>
        </div>
      </div>

      <div className="container mx-auto p-6 max-w-4xl">
        {/* Report Header */}
        <div className="flex justify-between items-start mb-6">
          <div>
            <Badge className="bg-cyan-400 text-white mb-2">Installation Report</Badge>
            <p className="text-sm text-gray-600">as of {formatDate(report.date)}</p>
          </div>

          {/* Company Logo - Small and clean */}
          <div className="bg-white border border-gray-200 p-2 rounded">
            <Image src="/ohplus-new-logo.png" alt="OH! Logo" width={40} height={40} className="object-contain" />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 mb-6">
          <Button onClick={handleDownloadPDF} className="flex items-center gap-2">
            <Download className="w-4 h-4" />
            Download PDF
          </Button>
          <Button variant="outline" onClick={() => setSendDialogOpen(true)} className="flex items-center gap-2">
            <Send className="w-4 h-4" />
            Send Report
          </Button>
        </div>

        {/* Project Information */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Project Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="border border-gray-300 p-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div className="space-y-2">
                  <div>
                    <strong>Site ID:</strong> {report.siteId}{" "}
                    {report.product?.light?.location || report.product?.specs_rental?.location || ""}
                  </div>
                  <div>
                    <strong>Job Order:</strong> {report.id?.slice(-4).toUpperCase() || "N/A"}
                  </div>
                  <div>
                    <strong>Job Order Date:</strong>{" "}
                    {formatDate(
                      report.created && typeof report.created.toDate === "function"
                        ? report.created.toDate().toISOString().split("T")[0]
                        : report.date,
                    )}
                  </div>
                  <div>
                    <strong>Site:</strong> {report.siteName}
                  </div>
                  <div>
                    <strong>Size:</strong> {report.product?.specs_rental?.size || report.product?.light?.size || "N/A"}
                  </div>
                  <div>
                    <strong>Start Date:</strong> {formatDate(report.bookingDates.start)}
                  </div>
                  <div>
                    <strong>End Date:</strong> {formatDate(report.bookingDates.end)}
                  </div>
                  <div>
                    <strong>Installation Duration:</strong>{" "}
                    {Math.ceil(
                      (new Date(report.bookingDates.end).getTime() - new Date(report.bookingDates.start).getTime()) /
                        (1000 * 60 * 60 * 24),
                    )}{" "}
                    days
                  </div>
                </div>
                <div className="space-y-2">
                  <div>
                    <strong>Content:</strong> {report.product?.content_type || "N/A"}
                  </div>
                  <div>
                    <strong>Material Specs:</strong> {report.product?.specs_rental?.material || "N/A"}
                  </div>
                  <div>
                    <strong>Crew:</strong> Team {report.assignedTo || "A"}
                  </div>
                  <div>
                    <strong>Illumination:</strong> {report.product?.light?.illumination || "N/A"}
                  </div>
                  <div>
                    <strong>Gondola:</strong> {report.product?.specs_rental?.gondola ? "YES" : "NO"}
                  </div>
                  <div>
                    <strong>Technology:</strong> {report.product?.specs_rental?.technology || "N/A"}
                  </div>
                  <div>
                    <strong>Sales:</strong> {report.sales}
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Project Status */}
        <Card className="mb-6">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Project Status</CardTitle>
            <Badge className="bg-green-500 text-white">{report.completionPercentage || 100}%</Badge>
          </CardHeader>
        </Card>

        {/* Attachments */}
        {report.attachments && report.attachments.length > 0 && (
          <Card className="mb-6">
            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {report.attachments.slice(0, 2).map((attachment, index) => (
                  <div key={index} className="space-y-3">
                    <div className="border border-gray-200 h-48 flex items-center justify-center bg-gray-50">
                      {attachment.fileUrl && attachment.fileName ? (
                        attachment.fileName.toLowerCase().match(/\.(jpg|jpeg|png|gif|webp)$/) ? (
                          <Image
                            src={attachment.fileUrl || "/placeholder.svg"}
                            alt={`Project photo ${index + 1}`}
                            width={300}
                            height={200}
                            className="object-cover w-full h-full"
                          />
                        ) : (
                          <div className="text-center text-gray-500">
                            <p className="text-sm">{attachment.fileName}</p>
                          </div>
                        )
                      ) : (
                        <div className="text-center text-gray-400">
                          <p className="text-sm">Project Photo {index + 1}</p>
                        </div>
                      )}
                    </div>
                    <div className="text-xs text-gray-600 space-y-1">
                      <div>
                        <strong>Date:</strong> {formatDate(report.date)}
                      </div>
                      <div>
                        <strong>Time:</strong>{" "}
                        {new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}
                      </div>
                      <div>
                        <strong>Location:</strong> {report.location || "N/A"}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Footer */}
        <Card>
          <CardContent className="p-6">
            <div className="border-t pt-4">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-bold text-sm mb-2">Prepared by:</h3>
                  <div className="text-sm space-y-1">
                    <div className="text-blue-600">{report.createdByName || "aixymbiosig@aix.com"}</div>
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
                <div className="text-xs text-gray-500 italic max-w-xs text-right">
                  "All data are based on the latest available records as of{" "}
                  {formatDate(new Date().toISOString().split("T")[0])}."
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Angular Footer */}
        <div className="relative mt-8">
          <div className="bg-blue-900 h-12 w-full"></div>
          <div
            className="absolute top-0 left-0 bg-cyan-400 h-12"
            style={{
              width: "30%",
              clipPath: "polygon(0% 0%, 85% 0%, 100% 100%, 0% 100%)",
            }}
          ></div>
          <div className="absolute top-0 right-0 flex items-center h-12 px-6">
            <div className="text-white text-right">
              <div className="text-sm">Smart. Seamless. Scalable</div>
              <div className="text-lg font-bold">
                OH!<span className="text-cyan-400">+</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <SendReportDialog open={sendDialogOpen} onOpenChange={setSendDialogOpen} report={report} />
    </div>
  )
}

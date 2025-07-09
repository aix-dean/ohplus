"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { ArrowLeft, Download, Send, Calendar, MapPin, User, FileText, Clock, CheckCircle } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { SendReportDialog } from "@/components/send-report-dialog"
import { reportService, type ReportData } from "@/lib/report-service"

export default function ReportDetailsPage() {
  const params = useParams()
  const router = useRouter()
  const { toast } = useToast()
  const [report, setReport] = useState<ReportData | null>(null)
  const [loading, setLoading] = useState(true)
  const [sendDialogOpen, setSendDialogOpen] = useState(false)

  useEffect(() => {
    const fetchReport = async () => {
      try {
        const reportData = await reportService.getReport(params.id as string)
        setReport(reportData)
      } catch (error) {
        console.error("Error fetching report:", error)
        toast({
          title: "Error",
          description: "Failed to load report details.",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }

    if (params.id) {
      fetchReport()
    }
  }, [params.id, toast])

  const handleDownloadPDF = async () => {
    if (!report) return

    try {
      toast({
        title: "Generating PDF...",
        description: "Please wait while we prepare your report.",
      })

      // Simulate PDF generation
      await new Promise((resolve) => setTimeout(resolve, 2000))

      toast({
        title: "PDF Ready!",
        description: "Your report has been downloaded successfully.",
      })
    } catch (error) {
      console.error("Error generating PDF:", error)
      toast({
        title: "Error",
        description: "Failed to generate PDF. Please try again.",
        variant: "destructive",
      })
    }
  }

  const handleSendOption = (option: "email" | "whatsapp" | "viber" | "messenger") => {
    setSendDialogOpen(false)

    if (option === "email") {
      // Handle email sending
      toast({
        title: "Email Prepared",
        description: "Opening email client with report attached.",
      })
    } else {
      toast({
        title: "Feature Coming Soon",
        description: `Sharing via ${option} will be available soon.`,
      })
    }
  }

  const getReportTypeDisplay = (type: string) => {
    return type
      .split("-")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ")
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-100 text-green-800"
      case "in-progress":
        return "bg-yellow-100 text-yellow-800"
      case "pending":
        return "bg-gray-100 text-gray-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="animate-pulse space-y-6">
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
        <div className="text-center py-12">
          <h2 className="text-2xl font-semibold text-gray-900 mb-2">Report Not Found</h2>
          <p className="text-gray-600 mb-4">The requested report could not be found.</p>
          <Button onClick={() => router.back()}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Go Back
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button variant="ghost" size="sm" onClick={() => router.back()}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{getReportTypeDisplay(report.reportType)}</h1>
            <p className="text-gray-600">{report.siteName}</p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <Button onClick={handleDownloadPDF} variant="outline">
            <Download className="mr-2 h-4 w-4" />
            Download PDF
          </Button>
          <Button onClick={() => setSendDialogOpen(true)} className="bg-green-600 hover:bg-green-700">
            <Send className="mr-2 h-4 w-4" />
            Send
          </Button>
        </div>
      </div>

      {/* Report Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            Report Overview
            <Badge className={getStatusColor(report.status)}>
              <CheckCircle className="mr-1 h-3 w-3" />
              {report.status.charAt(0).toUpperCase() + report.status.slice(1)}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="flex items-center space-x-2">
              <Calendar className="h-4 w-4 text-gray-500" />
              <div>
                <p className="text-sm font-medium">Date</p>
                <p className="text-sm text-gray-600">{new Date(report.date).toLocaleDateString()}</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <MapPin className="h-4 w-4 text-gray-500" />
              <div>
                <p className="text-sm font-medium">Site ID</p>
                <p className="text-sm text-gray-600">{report.siteId}</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <User className="h-4 w-4 text-gray-500" />
              <div>
                <p className="text-sm font-medium">Technician</p>
                <p className="text-sm text-gray-600">{report.technician}</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Clock className="h-4 w-4 text-gray-500" />
              <div>
                <p className="text-sm font-medium">Duration</p>
                <p className="text-sm text-gray-600">{report.duration}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Report Content */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <FileText className="mr-2 h-5 w-5" />
            Report Details
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Summary */}
          <div>
            <h3 className="text-lg font-semibold mb-2">Summary</h3>
            <p className="text-gray-700">{report.summary}</p>
          </div>

          <Separator />

          {/* Work Performed */}
          <div>
            <h3 className="text-lg font-semibold mb-3">Work Performed</h3>
            <ul className="space-y-2">
              {report.workPerformed.map((item, index) => (
                <li key={index} className="flex items-start space-x-2">
                  <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700">{item}</span>
                </li>
              ))}
            </ul>
          </div>

          <Separator />

          {/* Issues Found */}
          {report.issuesFound && report.issuesFound.length > 0 && (
            <>
              <div>
                <h3 className="text-lg font-semibold mb-3">Issues Found</h3>
                <ul className="space-y-2">
                  {report.issuesFound.map((issue, index) => (
                    <li key={index} className="flex items-start space-x-2">
                      <div className="h-2 w-2 bg-red-500 rounded-full mt-2 flex-shrink-0"></div>
                      <span className="text-gray-700">{issue}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <Separator />
            </>
          )}

          {/* Recommendations */}
          {report.recommendations && report.recommendations.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold mb-3">Recommendations</h3>
              <ul className="space-y-2">
                {report.recommendations.map((recommendation, index) => (
                  <li key={index} className="flex items-start space-x-2">
                    <div className="h-2 w-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                    <span className="text-gray-700">{recommendation}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Send Report Dialog */}
      {report && (
        <SendReportDialog
          isOpen={sendDialogOpen}
          onClose={() => setSendDialogOpen(false)}
          report={report}
          onSelectOption={handleSendOption}
        />
      )}
    </div>
  )
}

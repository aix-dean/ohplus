"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { ArrowLeft, Download, Share2, Edit3, MoreVertical } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { useToast } from "@/hooks/use-toast"
import { getReportById, type ReportData } from "@/lib/report-service"
import { useAuth } from "@/contexts/auth-context"

export default function ReportPage() {
  const params = useParams()
  const router = useRouter()
  const { toast } = useToast()
  const { user } = useAuth()
  const [report, setReport] = useState<ReportData | null>(null)
  const [loading, setLoading] = useState(true)

  const reportId = params.id as string

  useEffect(() => {
    if (reportId) {
      fetchReport()
    }
  }, [reportId])

  const fetchReport = async () => {
    try {
      setLoading(true)
      const reportData = await getReportById(reportId)
      setReport(reportData)
    } catch (error) {
      console.error("Error fetching report:", error)
      toast({
        title: "Error",
        description: "Failed to load report",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleDownload = () => {
    toast({
      title: "Download",
      description: "Report download will be implemented soon",
    })
  }

  const handleShare = () => {
    toast({
      title: "Share",
      description: "Report sharing will be implemented soon",
    })
  }

  const handleEdit = () => {
    toast({
      title: "Edit",
      description: "Report editing will be implemented soon",
    })
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading report...</p>
        </div>
      </div>
    )
  }

  if (!report) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Report Not Found</h2>
          <p className="text-gray-600 mb-4">The report you're looking for doesn't exist.</p>
          <Button onClick={() => router.back()} variant="outline">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Go Back
          </Button>
        </div>
      </div>
    )
  }

  const getReportTypeLabel = (type: string) => {
    switch (type) {
      case "installation-report":
        return "Installation Report"
      case "completion-report":
        return "Completion Report"
      case "monitoring-report":
        return "Monitoring Report"
      default:
        return "Report"
    }
  }

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "completed":
        return "bg-green-100 text-green-800"
      case "in-progress":
        return "bg-blue-100 text-blue-800"
      case "draft":
        return "bg-gray-100 text-gray-800"
      case "delayed":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top Navigation */}
      <div className="bg-white border-b border-gray-200 px-4 py-3">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={() => router.back()} className="p-2">
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <Badge variant="secondary" className="bg-blue-100 text-blue-800 font-medium">
              {report.subcategory || "General"}
            </Badge>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handleDownload}>
              <Download className="h-4 w-4 mr-2" />
              Download
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={handleShare}>
                  <Share2 className="h-4 w-4 mr-2" />
                  Share
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleEdit}>
                  <Edit3 className="h-4 w-4 mr-2" />
                  Edit
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>

      {/* Angular Header Section */}
      <div className="relative overflow-hidden">
        {/* Base blue section */}
        <div className="bg-blue-900 h-24 relative">
          {/* Angular cyan accent */}
          <div className="absolute top-0 right-0 w-1/3 h-full bg-cyan-400 transform skew-x-12 origin-top-right"></div>
          {/* Content overlay */}
          <div className="relative z-10 px-4 py-6 max-w-7xl mx-auto">
            <h1 className="text-white text-2xl font-bold">Logistics</h1>
          </div>
        </div>
      </div>

      {/* Report Header */}
      <div className="bg-white border-b border-gray-200 px-4 py-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              <Badge className="bg-blue-500 text-white px-3 py-1 text-sm font-medium">
                {getReportTypeLabel(report.reportType)}
              </Badge>
              <span className="text-sm text-gray-600">
                as of{" "}
                {new Date(report.date).toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </span>
            </div>
            <div className="w-16 h-16 bg-yellow-400 rounded-full flex items-center justify-center">
              <span className="text-yellow-900 font-bold text-lg">GTS</span>
            </div>
          </div>
        </div>
      </div>

      {/* Report Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Project Information */}
          <Card>
            <CardContent className="p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-6">Project Information</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <div className="mb-3">
                    <span className="font-medium text-gray-700">Site ID:</span>
                    <div className="text-gray-900">{report.siteCode || report.siteId}</div>
                  </div>
                  <div className="mb-3">
                    <span className="font-medium text-gray-700">Job Order:</span>
                    <div className="text-gray-900">JO064</div>
                  </div>
                  <div className="mb-3">
                    <span className="font-medium text-gray-700">Job Order Date:</span>
                    <div className="text-gray-900">
                      {new Date(report.bookingDates.start).toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}
                    </div>
                  </div>
                  <div className="mb-3">
                    <span className="font-medium text-gray-700">Site:</span>
                    <div className="text-gray-900">{report.siteName}</div>
                  </div>
                  <div className="mb-3">
                    <span className="font-medium text-gray-700">Size:</span>
                    <div className="text-gray-900">130ft (H) x 83ft (W) 22 Panels</div>
                  </div>
                  <div className="mb-3">
                    <span className="font-medium text-gray-700">Start Date:</span>
                    <div className="text-gray-900">
                      {new Date(report.bookingDates.start).toLocaleDateString("en-US", {
                        month: "2-digit",
                        day: "2-digit",
                        year: "2-digit",
                      })}
                    </div>
                  </div>
                  <div className="mb-3">
                    <span className="font-medium text-gray-700">End Date:</span>
                    <div className="text-gray-900">
                      {new Date(report.bookingDates.end).toLocaleDateString("en-US", {
                        month: "2-digit",
                        day: "2-digit",
                        year: "2-digit",
                      })}
                    </div>
                  </div>
                  <div className="mb-3">
                    <span className="font-medium text-gray-700">Installation Duration:</span>
                    <div className="text-gray-900">12 days</div>
                  </div>
                </div>
                <div>
                  <div className="mb-3">
                    <span className="font-medium text-gray-700">Content:</span>
                    <div className="text-gray-900">{report.subcategory}</div>
                  </div>
                  <div className="mb-3">
                    <span className="font-medium text-gray-700">Material Specs:</span>
                    <div className="text-gray-900">Stickers</div>
                  </div>
                  <div className="mb-3">
                    <span className="font-medium text-gray-700">Crew:</span>
                    <div className="text-gray-900">Team J</div>
                  </div>
                  <div className="mb-3">
                    <span className="font-medium text-gray-700">Illumination:</span>
                    <div className="text-gray-900">Tech: 2097 (200 Watts x 40)</div>
                  </div>
                  <div className="mb-3">
                    <span className="font-medium text-gray-700">Gondola:</span>
                    <div className="text-gray-900">YES</div>
                  </div>
                  <div className="mb-3">
                    <span className="font-medium text-gray-700">Technology:</span>
                    <div className="text-gray-900">Clear Tapes</div>
                  </div>
                  <div className="mb-3">
                    <span className="font-medium text-gray-700">Sales:</span>
                    <div className="text-gray-900">{report.sales}</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Project Status */}
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900">Project Status</h2>
                <Badge className="bg-green-500 text-white px-2 py-1 text-sm font-medium">
                  {report.installationStatus || report.completionPercentage}%
                </Badge>
              </div>

              <div className="mb-6">
                <div className="text-sm text-gray-600 mb-2">
                  <span className="font-medium">Date:</span>{" "}
                  {new Date(report.date).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </div>
                <div className="text-sm text-gray-600 mb-4">
                  <span className="font-medium">Status:</span>{" "}
                  {report.installationStatus || report.completionPercentage}% of 100
                </div>

                {/* Progress Chart */}
                <div className="flex items-center justify-center mb-6">
                  <div className="relative w-32 h-32">
                    <svg className="w-32 h-32 transform -rotate-90" viewBox="0 0 36 36">
                      <path
                        d="M18 2.0845
                          a 15.9155 15.9155 0 0 1 0 31.831
                          a 15.9155 15.9155 0 0 1 0 -31.831"
                        fill="none"
                        stroke="#e5e7eb"
                        strokeWidth="3"
                      />
                      <path
                        d="M18 2.0845
                          a 15.9155 15.9155 0 0 1 0 31.831
                          a 15.9155 15.9155 0 0 1 0 -31.831"
                        fill="none"
                        stroke="#06b6d4"
                        strokeWidth="3"
                        strokeDasharray={`${report.installationStatus || report.completionPercentage}, 100`}
                      />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="text-center">
                        <div className="text-xs text-gray-500">Accomplished</div>
                        <div className="text-lg font-bold text-cyan-500">
                          {report.installationStatus || report.completionPercentage}%
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="text-center text-xs text-gray-500">
                  <div>Pending</div>
                  <div>
                    {100 - Number.parseInt(report.installationStatus || report.completionPercentage.toString())}%
                  </div>
                </div>
              </div>

              {/* Installation Image */}
              {report.attachments && report.attachments.length > 0 && report.attachments[0].fileUrl && (
                <div className="mt-6">
                  <img
                    src={report.attachments[0].fileUrl || "/placeholder.svg"}
                    alt="Installation progress"
                    className="w-full h-48 object-cover rounded-lg"
                  />
                </div>
              )}

              {/* Post Report Button */}
              <div className="mt-6 text-center">
                <Button className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2">Post Report</Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Attachments Section */}
        {report.attachments && report.attachments.length > 0 && (
          <Card className="mt-8">
            <CardContent className="p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-6">Attachments</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {report.attachments.map((attachment, index) => (
                  <div key={index} className="border border-gray-200 rounded-lg p-4">
                    {attachment.fileUrl && attachment.fileType?.startsWith("image/") ? (
                      <img
                        src={attachment.fileUrl || "/placeholder.svg"}
                        alt={attachment.fileName}
                        className="w-full h-32 object-cover rounded mb-2"
                      />
                    ) : (
                      <div className="w-full h-32 bg-gray-100 rounded mb-2 flex items-center justify-center">
                        <span className="text-gray-500 text-sm">{attachment.fileName}</span>
                      </div>
                    )}
                    <p className="text-sm text-gray-600">{attachment.note}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Timeline/Delay Information */}
        {report.installationTimeline === "delayed" && (
          <Card className="mt-8">
            <CardContent className="p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-6">Timeline Information</h2>
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Badge variant="destructive">Delayed</Badge>
                  {report.delayDays && (
                    <span className="text-sm text-red-700">{report.delayDays} days behind schedule</span>
                  )}
                </div>
                {report.delayReason && (
                  <p className="text-sm text-red-700">
                    <span className="font-medium">Reason:</span> {report.delayReason}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}

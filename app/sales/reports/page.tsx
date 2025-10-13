"use client"

import { useState, useEffect } from "react"
import { Search, MoreVertical, Plus, Printer, Eye, Trash2, History } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { useRouter } from "next/navigation"
import { getReportsByCompany, type ReportData } from "@/lib/report-service"
import { useAuth } from "@/contexts/auth-context"
import { useToast } from "@/hooks/use-toast"
import { ReportPostSuccessDialog } from "@/components/report-post-success-dialog"
import { SentHistoryDialog } from "@/components/sent-history-dialog"

export default function SalesReportsPage() {
  const [filteredReports, setFilteredReports] = useState<ReportData[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [filterType, setFilterType] = useState("All")
  const [currentPage, setCurrentPage] = useState(1)
  const [totalReports, setTotalReports] = useState(0)
  const itemsPerPage = 15

  const [showSuccessDialog, setShowSuccessDialog] = useState(false)
  const [postedReportId, setPostedReportId] = useState<string>("")
  const [showSentHistoryDialog, setShowSentHistoryDialog] = useState(false)
  const [selectedReportId, setSelectedReportId] = useState<string>("")
  const [showReportDialog, setShowReportDialog] = useState(false)
  const [selectedReport, setSelectedReport] = useState<ReportData | null>(null)

  const router = useRouter()
  const { user, userData } = useAuth()
  const { toast } = useToast()

  useEffect(() => {
    const loadReports = async () => {
      await filterReports()
    }
    loadReports()
  }, [searchQuery, filterType, userData, currentPage])

  useEffect(() => {
    // Check if we just posted a report
    const lastPostedReportId = sessionStorage.getItem("lastPostedReportId")
    if (lastPostedReportId) {
      setPostedReportId(lastPostedReportId)
      setShowSuccessDialog(true)
      // Clear the session storage
      sessionStorage.removeItem("lastPostedReportId")
    }

  }, [])

  // Reset page when filter or search changes
  useEffect(() => {
    setCurrentPage(1)
  }, [filterType, searchQuery])


  const filterReports = async () => {
    try {
      setLoading(true)

      if (!userData?.company_id) {
        setFilteredReports([])
        setTotalReports(0)
        return
      }

      // Get all reports for the company (ordered by created desc)
      const allReports = await getReportsByCompany(userData.company_id)
      console.log("All reports data:", allReports)

      // Apply client-side filters
      let filtered = allReports

      // Status filter - exclude draft reports
      filtered = filtered.filter(report => report.status !== 'draft')

      // Report type filter
      if (filterType !== "All") {
        filtered = filtered.filter(report => report.reportType === filterType)
      }

      // Search query filter (search in siteName, reportType, createdByName)
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase()
        filtered = filtered.filter(report =>
          report.siteName?.toLowerCase().includes(query) ||
          report.reportType?.toLowerCase().includes(query) ||
          report.createdByName?.toLowerCase().includes(query) ||
          report.report_id?.toLowerCase().includes(query)
        )
      }

      // Apply pagination client-side
      const startIndex = (currentPage - 1) * itemsPerPage
      const endIndex = startIndex + itemsPerPage
      const paginatedReports = filtered.slice(startIndex, endIndex)

      setFilteredReports(paginatedReports)
      setTotalReports(filtered.length)
    } catch (error) {
      console.error("Error filtering reports:", error)
      toast({
        title: "Error",
        description: "Failed to filter reports",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }


  const formatDate = (date: any) => {
    if (!date) return "N/A"

    let dateObj: Date
    if (date.toDate) {
      dateObj = date.toDate()
    } else if (date instanceof Date) {
      dateObj = date
    } else {
      dateObj = new Date(date)
    }

    return dateObj.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    })
  }

  const getReportTypeDisplay = (reportType: string) => {
    switch (reportType) {
      case "completion-report":
        return "Completion Report"
      case "monitoring-report":
        return "Monitoring Report"
      case "installation-report":
        return "Installation Report"
      case "roll-down":
        return "Roll Down"
      default:
        return reportType
    }
  }


  const handleViewReport = (report: ReportData) => {
    setSelectedReport(report)
    setShowReportDialog(true)
  }


  const handleDeleteReport = (reportId: string) => {
    // Implement delete functionality
    toast({
      title: "Delete Report",
      description: "Delete functionality will be implemented",
    })
  }

  const handlePrintReport = (report: ReportData) => {
    // Navigate to detail page and trigger print there
    // This ensures the report is rendered and can be printed
    router.push(`/sales/reports/${report.id}?action=print`)
  }

  const handleViewSentHistory = (reportId: string) => {
    setSelectedReportId(reportId)
    setShowSentHistoryDialog(true)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center gap-4">
          <h1 className="text-xl font-semibold text-gray-900">Sales Reports</h1>
        </div>
      </div>


      {/* Content Title */}
      <div className="bg-white px-6 py-4">
        <h2 className="text-lg font-semibold text-gray-900">Report</h2>
      </div>

      {/* Search and Filters */}
      <div className="bg-white px-6 py-4 border-b border-gray-200 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="relative">
            <Search className="absolute left-[13px] top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 opacity-30" />
            <Input
              placeholder="Search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 w-[257px] h-[22px] rounded-[15px] border border-gray-400"
            />
          </div>
        </div>
        <Button
          variant="outline"
          className="border-gray-400 rounded-[5px] w-[103px] h-[24px] text-xs"
          onClick={() => setShowSentHistoryDialog(true)}
        >
          Sent History
        </Button>
      </div>

      {/* Reports List */}
      <div className="bg-white mx-6 mt-6 rounded-tl-[10px] rounded-tr-[10px] overflow-hidden">
        {/* Table Headers */}
        <div className="bg-white px-6 py-4 border-b border-gray-200">
          <div className="grid grid-cols-8 gap-4 text-xs font-semibold text-gray-900">
            <div>Date Issued</div>
            <div>Report ID</div>
            <div>Report Type</div>
            <div>Site</div>
            <div>Campaign</div>
            <div>Sender</div>
            <div>Status</div>
            <div>Actions</div>
          </div>
        </div>

        {loading ? (
          <div className="px-6 py-8 text-center text-gray-500">
            <div className="flex items-center justify-center">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
              <span className="ml-2">Loading reports...</span>
            </div>
          </div>
        ) : filteredReports.length === 0 ? (
          <div className="px-6 py-8 text-center text-gray-500">
            No reports found
          </div>
        ) : (
          <div className="p-4 space-y-3">
            {filteredReports.map((report) => (
              <div key={report.id} className="bg-[#f6f9ff] border-2 border-[#b8d9ff] rounded-[10px] p-4 cursor-pointer hover:bg-[#e8f0ff]" onClick={() => handleViewReport(report)}>
                <div className="grid grid-cols-8 gap-4 items-center text-sm">
                  <div className="text-gray-900">
                    {formatDate(report.date || report.created)}
                  </div>
                  <div className="text-gray-900">
                    {report.report_id || "N/A"}
                  </div>
                  <div className="text-gray-900">
                    {getReportTypeDisplay(report.reportType)}
                  </div>
                  <div className="text-gray-900 font-bold">
                    {report.siteName || "Unknown Site"}
                  </div>
                  <div className="text-gray-900">
                    {report.product?.name || "N/A"}
                  </div>
                  <div className="text-gray-900">
                    {report.createdByName || "Unknown User"}
                  </div>
                  <div
                    className="text-[#2d3fff] underline cursor-pointer"
                    onClick={() => report.status === 'posted' && handleViewSentHistory(report.id!)}
                  >
                    {report.status === 'posted' ? 'PDF' : 'Draft'}
                  </div>
                  <div className="text-gray-500">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="p-1">
                          <MoreVertical className="h-4 w-4 opacity-50" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleViewReport(report)}>
                          <Eye className="mr-2 h-4 w-4" />
                          View Report
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handlePrintReport(report)}>
                          <Printer className="mr-2 h-4 w-4" />
                          Print Report
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleViewSentHistory(report.id!)}>
                          <History className="mr-2 h-4 w-4" />
                          View Sent History
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleDeleteReport(report.id!)} className="text-red-600">
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete Report
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalReports > itemsPerPage && (
        <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200">
          <div className="text-sm text-gray-700">
            Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, totalReports)} of {totalReports} reports
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
            >
              Previous
            </Button>
            <span className="text-sm text-gray-600">
              Page {currentPage} of {Math.ceil(totalReports / itemsPerPage)}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(prev => Math.min(Math.ceil(totalReports / itemsPerPage), prev + 1))}
              disabled={currentPage === Math.ceil(totalReports / itemsPerPage)}
            >
              Next
            </Button>
          </div>
        </div>
      )}


      {/* Report Post Success Dialog */}
      <ReportPostSuccessDialog open={showSuccessDialog} onOpenChange={setShowSuccessDialog} reportId={postedReportId} />

      {/* Sent History Dialog */}
      <SentHistoryDialog
        open={showSentHistoryDialog}
        onOpenChange={setShowSentHistoryDialog}
        reportId={selectedReportId}
        emailType="report"
      />

      {/* Report Details Dialog */}
      {showReportDialog && selectedReport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="fixed inset-0 bg-black bg-opacity-50" onClick={() => setShowReportDialog(false)} />
          <div className="relative bg-white rounded-[13.681px] h-[621px] w-[604px]">
            {/* Close button */}
            <div className="absolute flex items-center justify-center left-[559.54px] top-[-4.79px] w-[35.57px] h-[27.36px] z-10">
              <button
                onClick={() => setShowReportDialog(false)}
                className="text-[#333333] text-[34.202px] font-normal rotate-[46.133deg] cursor-pointer"
              >
                +
              </button>
            </div>

            {/* Title */}
            <p className="text-center font-light">
              {getReportTypeDisplay(selectedReport.reportType)}_{formatDate(selectedReport.date).replace(/\s+/g, '_').replace(/,/g, '')}.pdf
            </p>

            {/* Content Area */}
            <div className="bg-[rgba(217,217,217,0.3)] h-[400px] rounded-[6.84px] w-[575.271px] overflow-y-auto">
              <div className="">
                <div className="bg-white shadow-lg rounded-lg m-2" style={{ width: '210mm', minHeight: '297mm', maxWidth: 'none', transform: 'scale(0.7)', transformOrigin: 'top left' }}>
                  <div className="w-full relative">
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

                  <div className="p-4 space-y-6">
                    <div className="flex justify-between items-center">
                      <div className="flex flex-col">
                        <div className="bg-cyan-400 text-white px-6 py-3 rounded-lg text-base font-medium inline-block">
                          {getReportTypeDisplay(selectedReport.reportType)}
                        </div>
                        <p className="text-gray-600 text-sm mt-2">as of {formatDate(selectedReport.date)}</p>
                      </div>
                      <div className="flex-shrink-0">
                        <div
                          className="bg-white rounded-lg px-4 py-2 flex items-center justify-center shadow-sm"
                          style={{ width: "160px", height: "160px" }}
                        >
                          <img
                            src="/ohplus-new-logo.png"
                            alt="Company Logo"
                            className="max-h-full max-w-full object-contain"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="shadow-sm border rounded-lg">
                      <div className="p-6">
                        <h2 className="text-xl font-bold mb-4 text-gray-900">Project Information</h2>
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                          <div className="space-y-2">
                            <div className="grid grid-cols-[auto_1fr] gap-4 items-start">
                              <span className="font-bold text-gray-700 whitespace-nowrap">Site ID:</span>
                              <span className="text-gray-900">{selectedReport.siteId || "N/A"}</span>
                            </div>
                            <div className="grid grid-cols-[auto_1fr] gap-4 items-start">
                              <span className="font-bold text-gray-700 whitespace-nowrap">Job Order:</span>
                              <span className="text-gray-900">
                                {selectedReport.joNumber || selectedReport.id?.slice(-4).toUpperCase() || "N/A"}
                              </span>
                            </div>
                            <div className="grid grid-cols-[auto_1fr] gap-4 items-start">
                              <span className="font-bold text-gray-700 whitespace-nowrap">Job Order Date:</span>
                              <span className="text-gray-900">{formatDate(selectedReport.date)}</span>
                            </div>
                            <div className="grid grid-cols-[auto_1fr] gap-4 items-start">
                              <span className="font-bold text-gray-700 whitespace-nowrap">Site:</span>
                              <span className="text-gray-900">{selectedReport.siteName || "N/A"}</span>
                            </div>
                            <div className="grid grid-cols-[auto_1fr] gap-4 items-start">
                              <span className="font-bold text-gray-700 whitespace-nowrap">Start Date:</span>
                              <span className="text-gray-900">
                                {selectedReport.bookingDates?.start ? formatDate(selectedReport.bookingDates.start) : "N/A"}
                              </span>
                            </div>
                            <div className="grid grid-cols-[auto_1fr] gap-4 items-start">
                              <span className="font-bold text-gray-700 whitespace-nowrap">End Date:</span>
                              <span className="text-gray-900">
                                {selectedReport.bookingDates?.end ? formatDate(selectedReport.bookingDates.end) : "N/A"}
                              </span>
                            </div>
                          </div>

                          <div className="space-y-2">
                            <div className="grid grid-cols-[auto_1fr] gap-4 items-start">
                              <span className="font-bold text-gray-700 whitespace-nowrap">Client:</span>
                              <span className="text-gray-900">{selectedReport.client || "N/A"}</span>
                            </div>
                            <div className="grid grid-cols-[auto_1fr] gap-4 items-start">
                              <span className="font-bold text-gray-700 whitespace-nowrap">Sales:</span>
                              <span className="text-gray-900">{selectedReport.sales || "N/A"}</span>
                            </div>
                            <div className="grid grid-cols-[auto_1fr] gap-4 items-start">
                              <span className="font-bold text-gray-700 whitespace-nowrap">Status:</span>
                              <span className="text-gray-900">{selectedReport.status || "N/A"}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {selectedReport.descriptionOfWork && (
                      <div className="shadow-sm border rounded-lg">
                        <div className="p-6">
                          <h2 className="text-xl font-bold mb-4 text-gray-900">Description</h2>
                          <p className="text-gray-900">{selectedReport.descriptionOfWork}</p>
                        </div>
                      </div>
                    )}

                    <div className="flex justify-between items-end pt-8 border-t">
                      <div>
                        <h3 className="font-semibold mb-2">Prepared by:</h3>
                        <div className="text-sm text-gray-600">
                          <div>{selectedReport.createdByName || "Unknown"}</div>
                          <div>LOGISTICS</div>
                          <div>{formatDate(selectedReport.created)}</div>
                        </div>
                      </div>
                      <div className="text-right text-sm text-gray-500 italic">
                        "All data are based on the latest available records as of{" "}
                        {formatDate(new Date().toISOString().split("T")[0])}."
                      </div>
                    </div>
                  </div>

                  <div className="w-full absolute bottom-0">
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
                </div>
              </div>
            </div>

            {/* Prepared By Section */}
            <div className="absolute font-light text-[#333333] text-[12px] left-[29px] top-[555px] w-[273px]">
              <p>
                <span className="font-bold">Prepared By: </span>
                <span className="font-normal">{selectedReport.createdByName || "Unknown"} (Logistics)</span>
              </p>
              <p>
                <span className="font-bold">Date:</span>
                <span> {formatDate(selectedReport.created)}</span>
              </p>
              <p>
                <span className="font-bold">Time: </span>
                {new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: false })} GMT
              </p>
            </div>

            {/* Forward Button */}
            <div className="absolute bg-[#1d0beb] h-[32.15px] rounded-[6.84px] left-[453.51px] top-[564.33px] w-[127.23px]">
              <button className="w-full h-full text-white font-bold text-[13.681px] text-center leading-none">
                Forward
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
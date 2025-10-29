"use client"

import { useState, useEffect } from "react"
import { Search } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"
import { getReports, type ReportData } from "@/lib/report-service"
import { useAuth } from "@/contexts/auth-context"
import { useToast } from "@/hooks/use-toast"
import { ReportPostSuccessDialog } from "@/components/report-post-success-dialog"
import { Pagination } from "@/components/ui/pagination"

export default function ServiceReportsPage() {
  const [reports, setReports] = useState<ReportData[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1)
  const [hasNextPage, setHasNextPage] = useState(false)
  const [lastDoc, setLastDoc] = useState<any>(null)
  const [pageLastDocs, setPageLastDocs] = useState<{ [page: number]: any }>({})
  const [isSearchMode, setIsSearchMode] = useState(false)
  const itemsPerPage = 10

  const [showSuccessDialog, setShowSuccessDialog] = useState(false)
  const [postedReportId, setPostedReportId] = useState<string>("")

  const router = useRouter()
  const { user, userData } = useAuth()
  const { toast } = useToast()

  // Single useEffect to handle all data fetching
  useEffect(() => {
    fetchReports(currentPage)
  }, [currentPage, searchQuery])

  // Separate effect to reset pagination when search changes
  useEffect(() => {
    setCurrentPage(1)
    setLastDoc(null)
    setPageLastDocs({})
    setIsSearchMode(false)
  }, [searchQuery])

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

  const fetchReports = async (page: number = 1) => {
    setLoading(true)
    try {
      const hasSearch = !!(searchQuery && searchQuery.trim())
      setIsSearchMode(hasSearch)

      const result = await getReports({
        page,
        limit: itemsPerPage,
        companyId: userData?.company_id || undefined,
        status: "published", // Only show published reports
        searchQuery: hasSearch ? searchQuery.trim() : undefined,
        lastDoc: page > 1 ? pageLastDocs[page - 1] || lastDoc : undefined
      })

      // Update cursor for next page (only when going forward)
      if (page >= currentPage && result.hasNextPage && result.lastDoc) {
        setLastDoc(result.lastDoc)
        setPageLastDocs(prev => ({
          ...prev,
          [page]: result.lastDoc
        }))
      }

      setReports(result.reports)
      setHasNextPage(result.hasNextPage)
      setCurrentPage(page)
    } catch (error) {
      console.error("Error fetching reports:", error)
      toast({
        title: "Error",
        description: "Failed to load reports",
        variant: "destructive",
      })
      setReports([])
      setHasNextPage(false)
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

  const generateReportNumber = (id: string) => {
    return id ? `000${id.slice(-3)}` : "000000"
  }

  const handleViewReport = (reportId: string) => {
    router.push(`/logistics/reports/${reportId}`)
  }

  // Pagination handlers
  const handleNextPage = () => {
    if (hasNextPage) {
      setCurrentPage(prev => prev + 1)
    }
  }

  const handlePreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(prev => prev - 1)
    }
  }

  const handleCreateReport = () => {
    router.push('/logistics/reports/select-service-assignment')
  }

  const handleHistory = () => {
    // No function for now
  }

  return (
    <div className="min-h-screen">
      <div className="w-full mx-auto">
        {/* Header with title and buttons */}
        <div className="flex justify-between items-center px-6 py-6">
          <h1 className="text-lg font-medium text-gray-900">Reports</h1>
          <div className="flex gap-2">
            <button onClick={handleHistory} className="text-xs w-[103px] h-6 border-[#c4c4c4] border-[2px] rounded-[5px]">
              History
            </button>
            <button onClick={handleCreateReport} className="text-xs w-[103px] h-6 border-[#c4c4c4] border-[2px] rounded-[5px]">
              Create Report
            </button>
          </div>
        </div>

        {/* Search */}
        <div className="mb-4 px-6">
          <div className="relative">
            <input
              type="text"
              placeholder="Search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-64 h-6 pl-8 pr-2 py-2 rounded-full bg-white border border-gray-300 text-gray-500 text-sm"
            />
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          </div>
        </div>

        {/* Reports Grid */}
        <div className="bg-white rounded-t-lg overflow-hidden shadow-sm mx-6">
          <div className="grid grid-cols-7 gap-4 p-4 border-b mx-4 border-gray-200 text-xs font-semibold text-left">
            <div>Date</div>
            <div>Report ID</div>
            <div>Site</div>
            <div>Campaign Name</div>
            <div>Type</div>
            <div>Sender</div>
            <div>Attachments</div>
          </div>

          <div className="p-4 space-y-2 relative">
            {loading ? (
              <div className="text-center py-8 text-gray-500">
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                  <span className="ml-2">Loading reports...</span>
                </div>
              </div>
            ) : reports.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No reports found
              </div>
            ) : (
              reports.map((report) => (
                <div
                  key={report.id}
                  className="rounded-lg bg-blue-50 border border-blue-200 p-4 cursor-pointer hover:bg-blue-100 transition-colors"
                  onClick={() => handleViewReport(report.id!)}
                >
                  <div className="grid grid-cols-7 gap-4 text-sm">
                    <div>{formatDate(report.date || report.created)}</div>
                    <div>{generateReportNumber(report.id || "—")}</div>
                    <div className="truncate">{report.siteName || "—"}</div>
                    <div className="truncate">{report.client || "—"}</div>
                    <div className="truncate">{getReportTypeDisplay(report.reportType)}</div>
                    <div className="truncate">LOG- {report.createdByName || "—"}</div>
                    <div className="truncate">
                      {report.attachments.length > 0 ? report.attachments[0].fileName : "—"}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Pagination Controls */}
        {reports.length > 0 && (
          <Pagination
            currentPage={currentPage}
            itemsPerPage={itemsPerPage}
            totalItems={reports.length}
            onNextPage={handleNextPage}
            onPreviousPage={handlePreviousPage}
            hasMore={hasNextPage}
          />
        )}

        {/* Report Post Success Dialog */}
        <ReportPostSuccessDialog open={showSuccessDialog} onOpenChange={setShowSuccessDialog} reportId={postedReportId} />
      </div>
    </div>
  )
}

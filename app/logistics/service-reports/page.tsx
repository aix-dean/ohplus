"use client"

import { useState, useEffect } from "react"
import { Search, ChevronDown, Eye, Download, Share, MoreVertical } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useRouter } from "next/navigation"
import { getReports, type ReportData } from "@/lib/report-service"
import { useAuth } from "@/contexts/auth-context"
import { useToast } from "@/hooks/use-toast"
import { Pagination } from "@/components/ui/pagination"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { searchReports, type SearchResult } from "@/lib/algolia-service"
import { useDebounce } from "@/hooks/use-debounce"
import { Timestamp } from "firebase/firestore"
import { getUserById, type User } from "@/lib/access-management-service"
import { ReportPostSuccessDialog } from "@/components/report-post-success-dialog"

export default function ServiceReportsPage() {
  const [reports, setReports] = useState<ReportData[]>([])
  const [loading, setLoading] = useState(true)
  const [filterType, setFilterType] = useState("All")
  const [searchQuery, setSearchQuery] = useState("")

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1)
  const [hasNextPage, setHasNextPage] = useState(false)
  const [lastDoc, setLastDoc] = useState<any>(null)
  const [pageLastDocs, setPageLastDocs] = useState<{ [page: number]: any }>({})
  // Algolia search states
  const [searchResults, setSearchResults] = useState<SearchResult[]>([])
  const [searchLoading, setSearchLoading] = useState(false)
  const [isSearching, setIsSearching] = useState(false)
  const [isSearchMode, setIsSearchMode] = useState(false)
  const [totalOverall, setTotalOverall] = useState(0)
  const itemsPerPage = 10
  // Debounce search term
  const debouncedSearchTerm = useDebounce(searchQuery, 300)

  const [showSuccessDialog, setShowSuccessDialog] = useState(false)
  const [postedReportId, setPostedReportId] = useState<string>("")
  // User cache to avoid duplicate API calls
  const [userCache, setUserCache] = useState<{ [userId: string]: User }>({})

  const router = useRouter()
  const { user, userData } = useAuth()
  const { toast } = useToast()

  // Single useEffect to handle all data fetching
  useEffect(() => {
    fetchReports(currentPage)
  }, [currentPage, debouncedSearchTerm, filterType])

  // Separate effect to reset pagination when search changes
  useEffect(() => {
    setCurrentPage(1)
    setLastDoc(null)
    setPageLastDocs({})
    setIsSearchMode(false)
  }, [debouncedSearchTerm, filterType])


  const fetchReports = async (page: number = 1) => {
    setLoading(true)
    try {
      const hasSearch = !!(debouncedSearchTerm && debouncedSearchTerm.trim())
      setIsSearchMode(hasSearch)

      if (hasSearch) {
        // Build filters for Algolia search
        let filters = ""
        if (filterType !== "All") {
          filters = `reportType:${filterType}`
        }

        // Use Algolia search
        const searchResults = await searchReports(debouncedSearchTerm.trim(), userData?.company_id || undefined, page - 1, itemsPerPage, filters)

        if (searchResults.error) {
          console.error("Search error:", searchResults.error)
          // Fallback to Firebase if search fails
          const result = await getReports({
            page,
            limit: itemsPerPage,
            companyId: userData?.company_id || undefined,
            lastDoc: page > 1 ? pageLastDocs[page - 1] || lastDoc : undefined
          })

          setReports(result.reports)
          setHasNextPage(result.hasNextPage)
          setCurrentPage(page)
          // Fetch user data for display
          fetchUserData(result.reports)
          return
        }

        // Transform Algolia results to match ReportData format
        const transformedReports: ReportData[] = searchResults.hits.map((hit: any) => ({
          id: hit.objectID,
          report_id: hit.report_id,
          site: hit.site || { name: hit.siteName || "", id: "", location: "" },
          companyId: hit.companyId,
          sellerId: hit.sellerId,
          client: hit.client,
          campaignName: hit.campaignName,
          crew: hit.crew,
          joNumber: hit.joNumber,
          joType: hit.joType,
          bookingDates: hit.bookingDates,
          start_date: hit.start_date,
          booking_id: hit.booking_id,
          sales: hit.sales,
          reportType: hit.reportType,
          end_date: hit.end_date,
          attachments: hit.attachments || [],
          requestedBy: hit.requestedBy,
          saNumber: hit.saNumber,
          saId: hit.saId,
          saType: hit.saType,
          status: hit.status,
          createdBy: hit.createdBy,
          created: hit.created ? Timestamp.fromDate(new Date(hit.created)) : undefined,
          updated: hit.updated ? Timestamp.fromDate(new Date(hit.updated)) : undefined,
          completionPercentage: hit.completionPercentage || 0,
          tags: hit.tags || [],
          assignedTo: hit.assignedTo,
          product: hit.product,
          descriptionOfWork: hit.descriptionOfWork,
          installationStatus: hit.installationStatus,
          installationTimeline: hit.installationTimeline,
          delayReason: hit.delayReason,
          delayDays: hit.delayDays,
          siteImageUrl: hit.siteImageUrl,
          logistics_report: hit.logistics_report,
        }))

        setReports(transformedReports)
        setHasNextPage(searchResults.page < searchResults.nbPages - 1)
        setCurrentPage(page)
        // Fetch user data for display
        fetchUserData(transformedReports)
      } else {
        // Use Firebase for non-search queries
        const result = await getReports({
          page,
          limit: itemsPerPage,
          companyId: userData?.company_id || undefined,
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
        // Fetch user data for display
        fetchUserData(result.reports)
      }
    } catch (error) {
      console.error("Error fetching reports:", error)
      toast({
        title: "Error",
        description: "Failed to load reports",
        variant: "destructive",
      })
      setReports([])
      setHasNextPage(false)
      setTotalOverall(0)
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

  const getFileNameFromUrl = (url: string | undefined) => {
    if (!url) return "—"
    try {
      // Extract filename from Firebase Storage URL
      const urlParts = url.split('/')
      const lastPart = urlParts[urlParts.length - 1]
      // Remove query parameters and decode
      const fileName = decodeURIComponent(lastPart.split('?')[0])
      return fileName
    } catch {
      return "—"
    }
  }

  // Fetch user data for reports that don't have cached user info
  const fetchUserData = async (reports: ReportData[]) => {
    const userIdsToFetch = reports
      .map(report => report.createdBy)
      .filter(userId => userId && !userCache[userId])

    if (userIdsToFetch.length === 0) return

    const userPromises = userIdsToFetch.map(async (userId) => {
      try {
        const user = await getUserById(userId)
        return { userId, user }
      } catch (error) {
        console.error(`Error fetching user ${userId}:`, error)
        return { userId, user: null }
      }
    })

    const userResults = await Promise.all(userPromises)
    const newUserCache = { ...userCache }

    userResults.forEach(({ userId, user }) => {
      if (user) {
        newUserCache[userId] = user
      }
    })

    setUserCache(newUserCache)
  }

  // Get user display name
  const getUserDisplayName = (userId: string) => {
    const user = userCache[userId]
    if (user) {
      const firstName = user.first_name || ""
      const lastName = user.last_name || ""
      const fullName = `${firstName} ${lastName}`.trim()
      return fullName || user.displayName || user.display_name || userId
    }
    return userId
  }

  const handleViewReport = (reportId: string) => {
    router.push(`/logistics/reports/${reportId}`)
  }
  const handleDownload = async (report: ReportData) => {
    if (!report.logistics_report) {
      toast({
        title: "Download not available",
        description: "Logistics report PDF is not available for this report",
        variant: "destructive",
      })
      return
    }

    try {
      const response = await fetch(report.logistics_report)
      if (!response.ok) throw new Error("Failed to fetch file")

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement("a")
      link.href = url
      link.download = `logistics_report_${report.id || "report"}.pdf`
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(url)
    } catch (err) {
      console.error("Download failed:", err)
      toast({
        title: "Download failed",
        description: "Failed to download the report",
        variant: "destructive",
      })
    }
  }

  const handleShare = (report: ReportData) => {
    const reportUrl = `${window.location.origin}/logistics/reports/${report.id}`

    if (navigator.share && report.logistics_report) {
      navigator.share({
        title: 'Logistics Report',
        text: `Check out this logistics report: ${report.client || 'Report'}`,
        url: reportUrl
      })
    } else {
      // Fallback: copy URL to clipboard
      navigator.clipboard.writeText(reportUrl)
      toast({
        title: "Link copied",
        description: "Report link copied to clipboard",
      })
    }
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

        {/* Search and Filters */}
        <div className="mb-4 px-6">
          <div className="flex items-center gap-4">
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
        </div>

        {/* Reports Grid */}
        <div className="bg-white rounded-t-lg overflow-hidden shadow-sm mx-6">
          <div className="flex gap-4 p-4 border-b mx-4 border-gray-200 text-xs font-semibold text-left">
            <div className="flex-1">Date</div>
            <div className="flex-1">Report ID</div>
            <div className="flex-1">Site</div>
            <div className="flex-1">Campaign Name</div>
            <div className="flex-1">Type</div>
            <div className="flex-1">Sender</div>
            <div className="flex-1">Attachments</div>
            <div className="flex-1">Actions</div>
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
                  <div className="flex gap-4 text-sm">
                    <div className="flex-1">{formatDate(report.created)}</div>
                    <div className="flex-1">{generateReportNumber(report.report_id || "—")}</div>
                    <div className="flex-1 truncate">{report.site?.name || "—"}</div>
                    <div className="flex-1 truncate">{report.campaignName || "—"}</div>
                    <div className="flex-1 truncate">{getReportTypeDisplay(report.reportType)}</div>
                    <div className="flex-1 truncate">{getUserDisplayName(report.createdBy || "")}</div>
                    <div className="flex-1 truncate">
                      {getFileNameFromUrl(report.logistics_report)}
                    </div>
                    <div className="flex-1">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" onClick={(e) => e.stopPropagation()}>
                            <MoreVertical className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent>
                          <DropdownMenuItem onClick={() => handleViewReport(report.id!)}>
                            <Eye className="w-4 h-4 mr-2" /> View
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleDownload(report)}>
                            <Download className="w-4 h-4 mr-2" /> Download
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleShare(report)}>
                            <Share className="w-4 h-4 mr-2" /> Share
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
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

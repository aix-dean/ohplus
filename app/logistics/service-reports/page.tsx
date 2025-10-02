"use client"

import { useState, useEffect } from "react"
import { ArrowLeft, Search, MoreVertical, Bell } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { useRouter } from "next/navigation"
import { getReports, type ReportData } from "@/lib/report-service"
import { useAuth } from "@/contexts/auth-context"
import { useToast } from "@/hooks/use-toast"
import { ReportPostSuccessDialog } from "@/components/report-post-success-dialog"

export default function ServiceReportsPage() {
  const [reports, setReports] = useState<ReportData[]>([])
  const [filteredReports, setFilteredReports] = useState<ReportData[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [filterType, setFilterType] = useState("All")
  const [showDrafts, setShowDrafts] = useState(false)

  const [showSuccessDialog, setShowSuccessDialog] = useState(false)
  const [postedReportId, setPostedReportId] = useState<string>("")
  const [currentTime, setCurrentTime] = useState(new Date().toLocaleString())

  const router = useRouter()
  const { user, userData } = useAuth()
  const { toast } = useToast()

  useEffect(() => {
    fetchReports()
  }, [])

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date().toLocaleString())
    }, 60000) // update every minute
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    filterReports()
  }, [reports, searchQuery, filterType, showDrafts])

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

  const fetchReports = async () => {
    try {
      setLoading(true)
      const reportsData = await getReports()
      console.log("Fetched reports data:", reportsData)
      setReports(reportsData)
    } catch (error) {
      console.error("Error fetching reports:", error)
      toast({
        title: "Error",
        description: "Failed to load reports",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const filterReports = () => {
    let filtered = [...reports]

    // Filter by company ID - only show reports from the same company
    if (userData?.company_id) {
      filtered = filtered.filter((report) => report.companyId === userData.company_id)
    }


    // Filter by drafts
    if (showDrafts) {
      filtered = filtered.filter((report) => report.status === "draft")
    } else {
      filtered = filtered.filter((report) => report.status !== "draft")
    }

    // Filter by report type
    if (filterType !== "All") {
      filtered = filtered.filter((report) => report.reportType === filterType)
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(
        (report) =>
          report.siteName?.toLowerCase().includes(query) ||
          report.reportType?.toLowerCase().includes(query) ||
          report.createdByName?.toLowerCase().includes(query) ||
          report.id?.toLowerCase().includes(query) ||
          report.report_id?.toLowerCase().includes(query) ||
          report.client?.toLowerCase().includes(query),
      )
    }

    setFilteredReports(filtered)
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

  const handleEditReport = (reportId: string) => {
    router.push(`/logistics/reports/${reportId}/edit`)
  }

  const handleDeleteReport = (reportId: string) => {
    // Implement delete functionality
    toast({
      title: "Delete Report",
      description: "Delete functionality will be implemented",
    })
  }

  return (
    <div className="min-h-screen bg-gray-50">



      {/* Reports Title */}
      <div className="px-6 py-6">
        <h2 className="text-2xl font-semibold text-gray-900">Reports</h2>
      </div>

      {/* Search and Filters */}
      <div className="px-6 pb-4">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-4 flex-1">
            <div className="relative flex-1 max-w-sm">
              <div className="bg-white rounded-[15px] border-2 border-gray-300 px-4 flex items-center h-10">
                <Search className="h-4 w-4 text-gray-400 mr-2 border-none" />
                <Input
                  placeholder="Search"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="border-0 p-0 focus:ring-0 focus-visible:ring-0 focus:outline-none focus:border-transparent text-gray-400 h-[90%] rounded-none"
                />
              </div>
            </div>
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="All">All</SelectItem>
                <SelectItem value="completion-report">Completion</SelectItem>
                <SelectItem value="monitoring-report">Monitoring</SelectItem>
                <SelectItem value="installation-report">Installation</SelectItem>
                <SelectItem value="roll-down">Roll Down</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button
            variant={showDrafts ? "default" : "outline"}
            onClick={() => setShowDrafts(!showDrafts)}
            className="px-4"
          >
            Drafts
          </Button>
        </div>
      </div>

      {/* Reports Table */}
      <div className="bg-white mx-6 rounded-t-lg border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full table-fixed min-w-[800px]">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-20">
                  Date
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-24">
                  Report ID
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-32">Site</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-40">
                  Campaign Name
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-28">
                  Type
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-32">
                  Sender
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-40">
                  Attachments
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-20">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white">
              {loading ? (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-gray-500">
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                      <span className="ml-2">Loading reports...</span>
                    </div>
                  </td>
                </tr>
              ) : filteredReports.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-gray-500">
                    No reports found
                  </td>
                </tr>
              ) : (
                filteredReports.map((report, index) => (
                  <>
                    <tr key={report.id} className="hover:bg-gray-50">
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900 w-20">
                        {formatDate(report.date || report.created)}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900 w-24">
                        {generateReportNumber(report.id || "")}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900 w-32 truncate">
                        {report.siteName || "Unknown Site"}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900 w-40 truncate">
                        {report.client || "N/A"}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900 w-28 truncate">
                        {getReportTypeDisplay(report.reportType)}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900 w-32 truncate">
                        LOG- {report.createdByName || "Unknown User"}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900 w-40">
                        {report.attachments.length > 0 ? (
                          <a
                            href={report.attachments[0].fileUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 underline truncate block max-w-full"
                          >
                            {report.attachments[0].fileName}
                          </a>
                        ) : (
                          "N/A"
                        )}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500 w-20">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="p-1">
                              <div className="w-6 h-6 flex items-center justify-center">
                                <div className="w-1 h-1 bg-gray-400 rounded-full"></div>
                                <div className="w-1 h-1 bg-gray-400 rounded-full ml-1"></div>
                                <div className="w-1 h-1 bg-gray-400 rounded-full ml-1"></div>
                              </div>
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleViewReport(report.id!)}>View Report</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleEditReport(report.id!)}>Edit Report</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleDeleteReport(report.id!)} className="text-red-600">
                              Delete Report
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                    {index < filteredReports.length - 1 && (
                      <tr>
                        <td colSpan={8} className="p-0">
                          <hr className="border-gray-200 mx-4" />
                        </td>
                      </tr>
                    )}
                  </>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>


      {/* Report Post Success Dialog */}
      <ReportPostSuccessDialog open={showSuccessDialog} onOpenChange={setShowSuccessDialog} reportId={postedReportId} />
    </div>
  )
}

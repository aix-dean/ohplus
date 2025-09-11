"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { ArrowLeft, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { CreateReportDialog } from "@/components/create-report-dialog"
import { db } from "@/lib/firebase"
import { doc, getDoc, collection, query, where, getDocs, orderBy, limit, startAfter, QueryDocumentSnapshot, DocumentData } from "firebase/firestore"

interface ServiceAssignment {
  id: string
  saNumber: string
  projectSiteId: string
  projectSiteName: string
  projectSiteLocation: string
  serviceType: string
  assignedTo: string
  crew?: string
  message: string
  coveredDateStart: any
  coveredDateEnd: any
  alarmDate?: any
  alarmTime?: string
  status: string
  created: any
  updated?: any
  attachments?: Array<{
    name: string
    type: string
  }>
  requestedBy: {
    id: string
    name: string
    department: string
  }
  remarks?: string
  materialSpecs?: string
  illuminationNits?: string
  gondola?: string
  technology?: string
  sales?: string
  serviceCost?: {
    crewFee: string
    mealAllowance: string
    overtimeFee: string
    tollFee: string
    transpo: string
    total: number
    otherFees?: any[]
  }
  serviceDuration?: string
  equipmentRequired?: string
  priority?: string
  project_key?: string
}

interface Report {
  id: string
  joNumber: string
  date: string
  created: any
  updated: any
  category: string
  subcategory: string
  status: string
  reportType: string
  attachments?: Array<{
    fileName: string
    fileType: string
    fileUrl: string
    note?: string
  }>
}

export default function ServiceAssignmentDetailsPage() {
  const params = useParams()
  const router = useRouter()
  const [assignment, setAssignment] = useState<ServiceAssignment | null>(null)
  const [reports, setReports] = useState<Report[]>([])
  const [loading, setLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage] = useState(15)
  const [lastVisibleDocs, setLastVisibleDocs] = useState<QueryDocumentSnapshot<DocumentData>[]>([null as any])
  const [hasMore, setHasMore] = useState(true)

  const [createReportDialogOpen, setCreateReportDialogOpen] = useState(false)

  const fetchReports = async (saNumber: string, page: number = 1) => {
    try {
      const reportsRef = collection(db, "reports")
      let reportsQuery = query(
        reportsRef,
        where("joNumber", "==", saNumber),
        orderBy("updated", "desc"),
        limit(itemsPerPage + 1)
      )

      const lastDoc = lastVisibleDocs[page - 1]
      if (lastDoc && page > 1) {
        reportsQuery = query(
          reportsRef,
          where("joNumber", "==", saNumber),
          orderBy("updated", "desc"),
          startAfter(lastDoc),
          limit(itemsPerPage + 1)
        )
      }

      const reportsSnapshot = await getDocs(reportsQuery)
      const reportsData = reportsSnapshot.docs.slice(0, itemsPerPage).map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Report[]

      const newLastVisible = reportsSnapshot.docs[reportsSnapshot.docs.length - 1]
      setHasMore(reportsSnapshot.docs.length > itemsPerPage)

      if (newLastVisible && page === lastVisibleDocs.length) {
        setLastVisibleDocs((prev) => [...prev, newLastVisible])
      }

      setReports(reportsData)
    } catch (error) {
      console.error("Error fetching reports:", error)
      setReports([])
    }
  }

  useEffect(() => {
    const fetchServiceAssignment = async () => {
      if (!params.id) return

      try {
        const docRef = doc(db, "service_assignments", params.id as string)
        const docSnap = await getDoc(docRef)

        if (docSnap.exists()) {
          const assignmentData = {
            id: docSnap.id,
            ...docSnap.data(),
          } as ServiceAssignment

          setAssignment(assignmentData)

          if (assignmentData.saNumber) {
            await fetchReports(assignmentData.saNumber, 1)
          }
        }
      } catch (error) {
        console.error("Error fetching service assignment:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchServiceAssignment()
  }, [params.id])

  useEffect(() => {
    if (assignment?.saNumber && currentPage > 1) {
      fetchReports(assignment.saNumber, currentPage)
    }
  }, [currentPage, assignment?.saNumber])

  const handleNextPage = () => {
    if (hasMore) {
      setCurrentPage((prevPage) => prevPage + 1)
    }
  }

  const handlePreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage((prevPage) => prevPage - 1)
    }
  }

  const formatDate = (dateField: any) => {
    if (!dateField) return "Not specified"

    try {
      if (dateField?.toDate) {
        return dateField.toDate().toLocaleDateString()
      } else if (dateField) {
        const date = new Date(dateField)
        return isNaN(date.getTime()) ? "Invalid Date" : date.toLocaleDateString()
      }
      return "Not specified"
    } catch (error) {
      return "Invalid Date"
    }
  }

  const formatTime = (dateField: any) => {
    if (!dateField) return "N/A"

    try {
      if (dateField?.toDate) {
        return dateField.toDate().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
      } else if (dateField) {
        const date = new Date(dateField)
        return isNaN(date.getTime()) ? "N/A" : date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
      }
      return "N/A"
    } catch (error) {
      return "N/A"
    }
  }

  const getTeamBadge = (category: string) => {
    switch (category.toLowerCase()) {
      case "sales":
        return <Badge className="bg-orange-500 hover:bg-orange-600 text-white">Sales</Badge>
      case "logistics":
        return <Badge className="bg-blue-500 hover:bg-blue-600 text-white">Logistics</Badge>
      case "installer":
      case "installation":
        return <Badge className="bg-green-500 hover:bg-green-600 text-white">Installer</Badge>
      case "delivery":
        return <Badge className="bg-purple-500 hover:bg-purple-600 text-white">Delivery</Badge>
      default:
        return <Badge className="bg-gray-500 hover:bg-gray-600 text-white">{category}</Badge>
    }
  }

  const getUpdateText = (report: Report) => {
    if (report.reportType === "completion-report") {
      return `Completion report submitted - ${report.subcategory || "general"}`
    }
    return report.subcategory || report.reportType || "Report submitted"
  }

  const getSiteData = () => {
    if (assignment) {
      return {
        site: assignment.projectSiteName || assignment.projectSiteId || "Not specified",
        client: assignment.requestedBy?.name || "Not specified",
        serviceDates:
          assignment.coveredDateStart && assignment.coveredDateEnd
            ? `${formatDate(assignment.coveredDateStart)} to ${formatDate(assignment.coveredDateEnd)}`
            : "Not specified",
        assignedTo: assignment.assignedTo || "Not specified",
      }
    }

    return {
      site: "Not specified",
      client: "Not specified",
      serviceDates: "Not specified",
      assignedTo: "Not specified",
    }
  }

  const siteData = getSiteData()

  return (
    <div className="space-y-6 relative">
      <div className="flex items-center gap-3 py-2">
        <Button variant="ghost" size="sm" onClick={() => router.back()} className="p-1 h-8 w-8">
          <ArrowLeft className="h-4 w-4" />
        </Button>

        <Badge variant="default" className="bg-blue-500 text-white px-3 py-1 text-sm font-medium" style={{ fontSize: '27.7px', fontWeight: '700', borderRadius: '10px' }}>
          {assignment?.projectSiteName || 'Project Site'}
        </Badge>

        <div style={{ borderRadius: '10px', padding: '0 10px', backgroundColor: '#efefef' }}>
          <span className="text-lg font-medium text-gray-900" style={{ fontSize: '25.1px', color: '#0f76ff', fontWeight: '650' }}>
            {loading ? "Loading..." : assignment?.saNumber || "Service Assignment Not Found"}
          </span>
        </div>
      </div>

      <div className="flex justify-start">
        <div className="flex items-start gap-6 max-w-2xl">
          {/* Service assignment image placeholder */}
          <div className="flex-shrink-0">
            <img
              src="/lilo-and-stitch-product-box.png"
              alt="Service Assignment"
              className="w-32 h-32 object-cover rounded-md border"
            />
          </div>

          {/* Site information */}
          <div className="flex-1 space-y-3 text-base">
            <div>
              <span className="font-semibold text-gray-900">Site: </span>
              <span className="text-gray-700">{loading ? "Loading..." : siteData.site}</span>
            </div>

            <div>
              <span className="font-semibold text-gray-900">Requested By: </span>
              <span className="text-gray-700">{loading ? "Loading..." : siteData.client}</span>
            </div>

            <div>
              <span className="font-semibold text-gray-900">Service Dates: </span>
              <span className="text-gray-700">{loading ? "Loading..." : siteData.serviceDates}</span>
            </div>

            <div>
              <span className="font-semibold text-gray-900">Assigned To: </span>
              <span className="text-gray-700">{loading ? "Loading..." : siteData.assignedTo}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-8">
        <div className="bg-gradient-to-r from-blue-600 to-teal-400 text-white px-4 py-3 rounded-t-lg">
          <h2 className="text-lg font-semibold">Service Assignment Monitoring</h2>
        </div>

        <div className="bg-white border border-gray-200 rounded-b-lg overflow-x-auto max-h-96 overflow-y-auto">
          <table className="w-full min-w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">Date</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">Time</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">Team</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">Update</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">Attachments</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-gray-500">
                    Loading service assignment monitoring data...
                  </td>
                </tr>
              ) : reports.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-gray-500">
                    No service assignment monitoring data available for this assignment.
                  </td>
                </tr>
              ) : (
                reports.map((report) => (
                  <tr key={report.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm text-gray-900">{formatDate(report.updated || report.created || report.date)}</td>
                    <td className="px-4 py-3 text-sm text-gray-900">{formatTime(report.updated || report.created)}</td>
                    <td className="px-4 py-3">{getTeamBadge(report.category)}</td>
                    <td className="px-4 py-3 text-sm text-gray-900">{getUpdateText(report)}</td>
                    <td className="px-4 py-3">
                      {report.attachments && report.attachments.length > 0 ? (
                        <button
                          className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                          onClick={() => window.open(report.attachments![0].fileUrl, "_blank")}
                        >
                          See Attachment
                        </button>
                      ) : (
                        <span className="text-sm text-gray-500">N/A</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls */}
        {reports.length > 0 && (
          <div className="flex justify-between items-center mt-4 px-4">
            <button
              onClick={handlePreviousPage}
              disabled={currentPage === 1}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            <span className="text-sm text-gray-600">
              Page {currentPage}
            </span>
            <button
              onClick={handleNextPage}
              disabled={!hasMore}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        )}
      </div>

      <div className="fixed bottom-6 right-6 z-50">
        <Button
          className="bg-blue-600 hover:bg-blue-700 text-white shadow-lg rounded-lg px-4 py-2 flex items-center gap-2"
          onClick={() => {
            if (assignment?.projectSiteId) {
              setCreateReportDialogOpen(true)
            } else {
              console.log("No project site ID available for creating report")
            }
          }}
        >
          <Plus className="h-4 w-4" />
          Create Report
        </Button>
      </div>

      {assignment?.projectSiteId && (
        <CreateReportDialog
          open={createReportDialogOpen}
          onOpenChange={setCreateReportDialogOpen}
          siteId={assignment.projectSiteId}
          module="logistics"
          hideJobOrderSelection={true}
          preSelectedJobOrder={assignment.saNumber}
        />
      )}
    </div>
  )
}
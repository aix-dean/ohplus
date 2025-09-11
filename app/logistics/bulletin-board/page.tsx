"use client"

import { ArrowLeft, Search, ChevronDown, X } from "lucide-react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { useEffect, useState } from "react"
import { collection, query, where, orderBy, limit, startAfter, getDocs, doc, getDoc, DocumentData, QueryDocumentSnapshot } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { Pagination } from "@/components/ui/pagination"

interface ServiceAssignmentCount {
  [projectSiteId: string]: number
}

interface ServiceAssignment {
  id: string
  saNumber: string
  projectSiteId: string
  projectSiteName: string
  projectSiteLocation: string
  serviceType: string
  assignedTo: string
  status: string
  created: any
  updated?: any
  [key: string]: any
}

interface Report {
  id: string
  saNumber: string
  date: any
  updated: any
  category: string
  status: string
  description: string
  descriptionOfWork?: string
  attachments?: string[]
  [key: string]: any
}

interface ProjectReports {
  [projectSiteId: string]: Report[]
}

export default function LogisticsBulletinBoardPage() {
  const router = useRouter()
  const { userData } = useAuth()
  const [serviceAssignments, setServiceAssignments] = useState<ServiceAssignment[]>([])
  const [loading, setLoading] = useState(true)
  const [serviceAssignmentCounts, setServiceAssignmentCounts] = useState<ServiceAssignmentCount>({})
  const [latestSaNumbers, setLatestSaNumbers] = useState<{ [projectSiteId: string]: string }>({})
  const [latestSaIds, setLatestSaIds] = useState<{ [projectSiteId: string]: string }>({})
  const [projectReports, setProjectReports] = useState<ProjectReports>({})
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isDialogLoading, setIsDialogLoading] = useState(false)
  const [selectedProject, setSelectedProject] = useState<ServiceAssignment | null>(null)
  const [assignments, setAssignments] = useState<ServiceAssignment[]>([])
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage] = useState(15)
  const [lastVisibleDocs, setLastVisibleDocs] = useState<QueryDocumentSnapshot<DocumentData>[]>([null as any])
  const [hasMore, setHasMore] = useState(true)

  const fetchProjectReports = async (projectSiteIds: string[]) => {
    if (!userData?.company_id || projectSiteIds.length === 0) return

    try {
      // First, get all service assignments for the projects
      const serviceAssignmentsRef = collection(db, "service_assignments")
      const serviceAssignmentsQuery = query(serviceAssignmentsRef, where("company_id", "==", userData.company_id))
      const serviceAssignmentsSnapshot = await getDocs(serviceAssignmentsQuery)

      // Create a map of saNumber to projectSiteId
      const saNumberToProjectId: { [saNumber: string]: string } = {}
      serviceAssignmentsSnapshot.forEach((doc) => {
        const data = doc.data()
        if (data.saNumber && data.projectSiteId && projectSiteIds.includes(data.projectSiteId)) {
          saNumberToProjectId[data.saNumber] = data.projectSiteId
        }
      })

      // Get all saNumbers for the projects
      const saNumbers = Object.keys(saNumberToProjectId)

      if (saNumbers.length === 0) return

      // Fetch reports for these saNumbers and company
      const reportsRef = collection(db, "reports")
      const reportsQuery = query(
        reportsRef,
        where("joNumber", "in", saNumbers),
        where("companyId", "==", userData.company_id)
      )
      const reportsSnapshot = await getDocs(reportsQuery)

      // Group reports by projectSiteId
      const reportsByProject: ProjectReports = {}
      reportsSnapshot.forEach((doc) => {
        const reportData = { id: doc.id, ...doc.data() } as Report
        const projectId = saNumberToProjectId[reportData.joNumber]

        if (projectId) {
          if (!reportsByProject[projectId]) {
            reportsByProject[projectId] = []
          }
          reportsByProject[projectId].push(reportData)
        }
      })

      // Sort reports by updated timestamp (newest first) for each project
      Object.keys(reportsByProject).forEach((projectId) => {
        reportsByProject[projectId].sort((a, b) => {
          const aTime = a.updated?.toDate ? a.updated.toDate() : new Date(a.updated || a.date || 0)
          const bTime = b.updated?.toDate ? b.updated.toDate() : new Date(b.updated || b.date || 0)
          return bTime.getTime() - aTime.getTime()
        })
      })

      setProjectReports(reportsByProject)
    } catch (error) {
      console.error("Error fetching project reports:", error)
    }
  }

  const fetchServiceAssignmentCounts = async (projectSiteIds: string[]) => {
    if (!userData?.company_id || projectSiteIds.length === 0) return

    try {
      const counts: ServiceAssignmentCount = {}
      const latestSaNumbersMap: { [projectSiteId: string]: string } = {}
      const latestSaIdsMap: { [projectSiteId: string]: string } = {}

      // Fetch service assignments for all projects at once
      const serviceAssignmentsRef = collection(db, "service_assignments")
      const q = query(serviceAssignmentsRef, where("company_id", "==", userData.company_id))
      const querySnapshot = await getDocs(q)

      // Group service assignments by projectSiteId
      const assignmentsByProject: { [projectSiteId: string]: ServiceAssignment[] } = {}
      querySnapshot.forEach((doc) => {
        const data = doc.data()
        const projectSiteId = data.projectSiteId
        if (projectSiteId && projectSiteIds.includes(projectSiteId)) {
          if (!assignmentsByProject[projectSiteId]) {
            assignmentsByProject[projectSiteId] = []
          }
          assignmentsByProject[projectSiteId].push({ id: doc.id, ...data } as ServiceAssignment)
        }
      })

      // For each project, sort service assignments by createdAt descending and get latest saNumber and ID
      Object.keys(assignmentsByProject).forEach((projectSiteId) => {
        const assignments = assignmentsByProject[projectSiteId]
        counts[projectSiteId] = assignments.length

        if (assignments.length > 0) {
          // Sort by created descending (newest first)
          assignments.sort((a, b) => {
            let aTime: Date
            let bTime: Date

            if (a.created?.toDate) {
              aTime = a.created.toDate()
            } else if (a.created) {
              aTime = new Date(a.created)
            } else {
              aTime = new Date(0)
            }

            if (b.created?.toDate) {
              bTime = b.created.toDate()
            } else if (b.created) {
              bTime = new Date(b.created)
            } else {
              bTime = new Date(0)
            }

            return bTime.getTime() - aTime.getTime()
          })

          // Get the latest service assignment
          const latestSa = assignments[0]
          latestSaNumbersMap[projectSiteId] = latestSa.saNumber || latestSa.id.slice(-6)
          latestSaIdsMap[projectSiteId] = latestSa.id
        }
      })

      console.log('Service Assignment Counts:', counts)
      console.log('Latest SA Numbers:', latestSaNumbersMap)
      console.log('Latest SA IDs:', latestSaIdsMap)
      setServiceAssignmentCounts(counts)
      setLatestSaNumbers(latestSaNumbersMap)
      setLatestSaIds(latestSaIdsMap)
    } catch (error) {
      console.error("Error fetching service assignment counts:", error)
    }
  }

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

  const handleOpenDialog = async (assignment: ServiceAssignment) => {
    setSelectedProject(assignment)
    setIsDialogOpen(true)
    setIsDialogLoading(true)

    try {
      if (!userData?.company_id) return

      const serviceAssignmentsRef = collection(db, "service_assignments")
      const q = query(
        serviceAssignmentsRef,
        where("company_id", "==", userData.company_id),
        where("projectSiteId", "==", assignment.projectSiteId),
      )
      const querySnapshot = await getDocs(q)

      const fetchedAssignments: ServiceAssignment[] = []
      querySnapshot.forEach((doc) => {
        fetchedAssignments.push({ id: doc.id, ...doc.data() } as ServiceAssignment)
      })

      fetchedAssignments.sort((a, b) => {
        let aTime: Date
        let bTime: Date

        // Handle Firestore Timestamp objects
        if (a.created?.toDate) {
          aTime = a.created.toDate()
        } else if (a.created) {
          aTime = new Date(a.created)
        } else {
          aTime = new Date(0)
        }

        if (b.created?.toDate) {
          bTime = b.created.toDate()
        } else if (b.created) {
          bTime = new Date(b.created)
        } else {
          bTime = new Date(0)
        }

        // Sort descending (newest first)
        return bTime.getTime() - aTime.getTime()
      })

      setAssignments(fetchedAssignments)
    } catch (error) {
      console.error("Error fetching service assignments:", error)
      setAssignments([])
    } finally {
      setIsDialogLoading(false)
    }
  }

  useEffect(() => {
    const fetchServiceAssignments = async () => {
      if (!userData?.company_id) {
        setLoading(false)
        return
      }

      try {
        setLoading(true)
        const serviceAssignmentsRef = collection(db, "service_assignments")
        let assignmentsQuery = query(
          serviceAssignmentsRef,
          where("company_id", "==", userData.company_id),
          orderBy("created", "desc"),
          limit(itemsPerPage + 1)
        )

        const lastDoc = lastVisibleDocs[currentPage - 1]
        if (lastDoc) {
          assignmentsQuery = query(
            serviceAssignmentsRef,
            where("company_id", "==", userData.company_id),
            orderBy("created", "desc"),
            startAfter(lastDoc),
            limit(itemsPerPage + 1)
          )
        }

        const querySnapshot = await getDocs(assignmentsQuery)
        const fetchedAssignments: ServiceAssignment[] = []
        const newLastVisible = querySnapshot.docs[querySnapshot.docs.length - 1]

        setHasMore(querySnapshot.docs.length > itemsPerPage)

        querySnapshot.docs.slice(0, itemsPerPage).forEach((doc) => {
          fetchedAssignments.push({ id: doc.id, ...doc.data() } as ServiceAssignment)
        })

        setServiceAssignments(fetchedAssignments)

        // Only update lastVisibleDocs if we are moving to a new page
        if (newLastVisible && currentPage === lastVisibleDocs.length) {
          setLastVisibleDocs((prev) => [...prev, newLastVisible])
        }

        const projectSiteIds = fetchedAssignments
          .map((assignment) => assignment.projectSiteId)
          .filter((id): id is string => Boolean(id))

        const uniqueProjectSiteIds = [...new Set(projectSiteIds)]

        if (uniqueProjectSiteIds.length > 0) {
          await fetchServiceAssignmentCounts(uniqueProjectSiteIds)
          await fetchProjectReports(uniqueProjectSiteIds)
        }
      } catch (error) {
        console.error("Error fetching service assignments:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchServiceAssignments()
  }, [userData?.company_id, currentPage, itemsPerPage, lastVisibleDocs.length])

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-200">
        <div className="flex items-center px-4 py-3">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-gray-700 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="text-lg font-medium">Logistics Bulletin Board</span>
          </button>
        </div>
      </div>

      <div className="bg-white border-b border-gray-200 px-4 py-4">
        <div className="flex items-center gap-4">
          {/* Search Bar */}
          <div className="relative w-64">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Dropdown Filter */}
          <div className="flex-1 flex justify-end">
            <div className="relative">
              <select className="appearance-none bg-white border border-gray-300 rounded-md px-4 py-2 pr-8 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-700">
                <option value="">Select Site</option>
                <option value="site1">Site 1</option>
                <option value="site2">Site 2</option>
                <option value="site3">Site 3</option>
              </select>
              <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 pointer-events-none" />
            </div>
          </div>
        </div>
      </div>

      <div className="p-4">
        {loading ? (
          <div className="text-center py-8">Loading...</div>
        ) : serviceAssignments.length > 0 ? (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {serviceAssignments
                .filter((assignment) => latestSaNumbers[assignment.projectSiteId!])
                .map((assignment) => (
                  <div
                    key={assignment.id}
                    className="bg-white rounded-lg border border-gray-300 p-4 cursor-pointer hover:shadow-md transition-shadow"
                    onClick={() => {
                      console.log('Project Site ID:', assignment.projectSiteId)
                      console.log('Latest SA IDs:', latestSaIds)
                      console.log('Latest SA ID for this project:', latestSaIds[assignment.projectSiteId!])
                      if (latestSaIds[assignment.projectSiteId!]) {
                        router.push(`/logistics/bulletin-board/details/${latestSaIds[assignment.projectSiteId!]}`)
                      } else {
                        console.log('No latest SA ID found for project:', assignment.projectSiteId)
                      }
                    }}
                  >
                    <div className="text-blue-600 text-sm mb-3 rounded inline-block" style={{ backgroundColor: '#e7f1ff', fontWeight: '650' }}>
                      <span style={{ padding: '0 2px' }}>{latestSaNumbers[assignment.projectSiteId!] || 'No SA'}</span>
                    </div>

                    {/* Project Title Banner */}
                    <div className="text-white px-4 py-2 rounded mb-3 w-fit" style={{ backgroundColor: "#00aeef", borderRadius: "10px" }}>
                      <h3 className="font-semibold text-lg">{assignment.projectSiteName || 'Project Site'}</h3>
                    </div>

                    {/* Project Location */}
                    <div className="text-gray-900 font-medium mb-3">
                      {assignment.projectSiteLocation || assignment.projectSiteId || "No site location available"}
                    </div>

                    {/* Last Activity Section */}
                    <div>
                      <h4 className="text-gray-700 font-medium mb-2">Last Activity:</h4>
                      <div className="space-y-1 text-sm text-gray-600">
                        {projectReports[assignment.projectSiteId!] && projectReports[assignment.projectSiteId!].length > 0 ? (
                          projectReports[assignment.projectSiteId!].slice(0, 3).map((report: Report, index: number) => {
                            const reportDate = report.updated?.toDate ? report.updated.toDate() : new Date(report.updated || report.date || 0)
                            const formattedDate = reportDate.toLocaleDateString("en-US", {
                              month: "numeric",
                              day: "numeric",
                              year: "2-digit",
                            })
                            const formattedTime = reportDate.toLocaleTimeString("en-US", {
                              hour: "numeric",
                              minute: "2-digit",
                              hour12: true,
                            })

                            return (
                              <div key={report.id}>
                                {formattedDate} {formattedTime} - {report.descriptionOfWork || report.description || "No description available"}
                              </div>
                            )
                          })
                        ) : (
                          <div className="text-gray-500 italic">No recent activity</div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
            </div>

            {/* Pagination Controls */}
            <div className="flex justify-end mt-4">
              <Pagination
                currentPage={currentPage}
                itemsPerPage={itemsPerPage}
                totalItems={serviceAssignments.length} // This will be inaccurate for true total, but works for current page display
                onNextPage={handleNextPage}
                onPreviousPage={handlePreviousPage}
                hasMore={hasMore}
              />
            </div>
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">No service assignments found</div>
        )}
      </div>

      {isDialogOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 animate-in fade-in duration-200">
          <div className="bg-white rounded-lg p-6 w-[600px] max-w-[90vw] max-h-[80vh] relative animate-in zoom-in-95 duration-300">
            <button
              onClick={() => setIsDialogOpen(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="mb-4">
              <h2 className="text-xl font-semibold text-gray-900">Service Assignments</h2>
              {selectedProject && (
                <p className="text-sm text-gray-600 mt-1">
                  {selectedProject.projectSiteLocation || selectedProject.projectSiteName || "Unknown Site"}
                </p>
              )}
            </div>

            {isDialogLoading ? (
              <div className="text-center py-8">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <p className="mt-2 text-gray-500">Loading service assignments...</p>
              </div>
            ) : assignments.length > 0 ? (
              <div className="max-h-96 overflow-y-auto">
                <div className="space-y-3">
                  {assignments.map((assignment) => (
                    <div
                      key={assignment.id}
                      className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors cursor-pointer"
                      onClick={() => router.push(`/logistics/bulletin-board/details/${assignment.id}`)}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="font-medium text-gray-900">
                          Service Assignment #: {assignment.saNumber || assignment.id.slice(-6)}
                        </h3>
                        <span
                          className={`px-2 py-1 text-xs rounded-full ${
                            assignment.status === "completed"
                              ? "bg-green-100 text-green-800"
                              : assignment.status === "in_progress"
                              ? "bg-blue-100 text-blue-800"
                              : assignment.status === "pending"
                              ? "bg-yellow-100 text-yellow-800"
                              : "bg-gray-100 text-gray-800"
                          }`}
                        >
                          {assignment.status || "Unknown"}
                        </span>
                      </div>

                      {assignment.serviceType && <p className="text-sm text-gray-600 mb-2">{assignment.serviceType}</p>}

                      <div className="text-xs text-gray-500">
                        Created: {(() => {
                          if (assignment.created?.toDate) {
                            return assignment.created.toDate().toLocaleDateString()
                          } else if (assignment.created) {
                            const date = new Date(assignment.created)
                            return isNaN(date.getTime()) ? "Unknown" : date.toLocaleDateString()
                          }
                          return "Unknown"
                        })()}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">No service assignments found for this site</div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

"use client"

import { useRouter } from "next/navigation"
import { useState, useEffect } from "react"
import { ArrowLeft, Search } from "lucide-react"
import { useAuth } from "@/contexts/auth-context"
import { searchServiceAssignments } from "@/lib/algolia-service"
import { getPaginatedServiceAssignmentsByCompanyId, getServiceAssignmentsByCompanyIdRealtime } from "@/lib/firebase-service"
import { useDebounce } from "@/hooks/use-debounce"
import { getTeamById } from "@/lib/teams-service"
import type { Team } from "@/lib/types/team"
import type { ServiceAssignment } from "@/lib/firebase-service"
import ReportTypeDialog from "@/components/report-type-dialog"
import { Pagination } from "@/components/ui/pagination"

const SelectServiceAssignmentPage = () => {
  const router = useRouter()
  const { userData } = useAuth()
  const [assignments, setAssignments] = useState<ServiceAssignment[]>([])
  const [allAssignments, setAllAssignments] = useState<ServiceAssignment[]>([])
  const [loading, setLoading] = useState(true)
  const [searchLoading, setSearchLoading] = useState(false)
  const [isInitialLoad, setIsInitialLoad] = useState(true)
  const [teamsMap, setTeamsMap] = useState<Record<string, string>>({})
  const [searchQuery, setSearchQuery] = useState("")
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [selectedAssignment, setSelectedAssignment] = useState<ServiceAssignment | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalHits, setTotalHits] = useState(0)
  const [hasMore, setHasMore] = useState(false)
  const [lastDoc, setLastDoc] = useState<any>(null)
  const [firebasePage, setFirebasePage] = useState(1)

  const debouncedSearchQuery = useDebounce(searchQuery, 300)

  useEffect(() => {
    if (!userData?.company_id) {
      setLoading(false)
      setSearchLoading(false)
      setIsInitialLoad(false)
      return
    }

    const performSearch = async () => {
      if (isInitialLoad) {
        setLoading(true)
      } else {
        setSearchLoading(true)
      }
      try {
        if (debouncedSearchQuery) {
          // Use Algolia for search
          const response = await searchServiceAssignments(debouncedSearchQuery, userData.company_id || undefined, currentPage - 1, 10)
          if (response.hits) {
            const assignmentsData = response.hits.map(hit => ({ id: hit.objectID, ...hit })) as unknown as ServiceAssignment[]
            // Sort by created date descending
            assignmentsData.sort((a, b) => new Date(b.created).getTime() - new Date(a.created).getTime())
            setAssignments(assignmentsData)
            setTotalHits(response.nbHits)
            setHasMore(response.page < response.nbPages - 1)
          } else {
            setAssignments([])
            setTotalHits(0)
            setHasMore(false)
          }
        } else {
          // Use real-time data for default loading with client-side pagination
          const startIndex = (firebasePage - 1) * 10
          const endIndex = startIndex + 10
          const paginatedAssignments = allAssignments.slice(startIndex, endIndex)
          setAssignments(paginatedAssignments)
          setTotalHits(allAssignments.length)
          setHasMore(endIndex < allAssignments.length)
        }
      } catch (error) {
        console.error("Error fetching service assignments:", error)
        setAssignments([])
        setTotalHits(0)
        setHasMore(false)
      } finally {
        setLoading(false)
        setSearchLoading(false)
        setIsInitialLoad(false)
      }
    }

    // Only perform search if we have search query or if we have all assignments loaded
    if (debouncedSearchQuery || allAssignments.length > 0) {
      performSearch()
    }
  }, [debouncedSearchQuery, userData?.company_id, isInitialLoad, currentPage, firebasePage, allAssignments])

  useEffect(() => {
    setCurrentPage(1)
    setFirebasePage(1)
  }, [debouncedSearchQuery])

  useEffect(() => {
    if (!userData?.company_id || assignments.length === 0) return

    const fetchRelevantTeams = async () => {
      try {
        const teamIds = new Set<string>()
        assignments.forEach(assignment => {
          if (assignment.crew) teamIds.add(assignment.crew)
          if (assignment.assignedTo) teamIds.add(assignment.assignedTo)
        })

        const teams = await Promise.all(
          Array.from(teamIds).map(id => getTeamById(id, userData.company_id || undefined))
        )

        const teamsMapping: Record<string, string> = {}
        teams.forEach(team => {
          if (team) {
            teamsMapping[team.id] = team.name
          }
        })
        setTeamsMap(teamsMapping)
      } catch (error) {
        console.error("Error fetching teams:", error)
      }
    }

    fetchRelevantTeams()
  }, [assignments, userData?.company_id])

  // Real-time listener for service assignments when not searching
  useEffect(() => {
    if (!userData?.company_id || debouncedSearchQuery) return

    const unsubscribe = getServiceAssignmentsByCompanyIdRealtime(
      userData.company_id,
      (assignments) => {
        setAllAssignments(assignments)
        setLoading(false)
        setSearchLoading(false)
        setIsInitialLoad(false)
      }
    )

    return () => unsubscribe()
  }, [userData?.company_id, debouncedSearchQuery])

  const formatDate = (date: any) => {
    if (!date) return "—"

    // Handle Firestore Timestamp objects
    const dateObj = date?.toDate ? date.toDate() : new Date(date)

    if (isNaN(dateObj.getTime())) return "-"

    return dateObj.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric"
    })
  }


  const handleAssignmentClick = (assignment: ServiceAssignment) => {
    if (assignment.serviceType.toLowerCase() === "monitoring") {
      // For monitoring assignments, navigate directly to create report with report type
      router.push(`/logistics/reports/create/${assignment.id}?reportType=monitoring`)
    } else {
      // For other types, show the report type selection dialog
      setSelectedAssignment(assignment)
      setIsDialogOpen(true)
    }
  }

  const handleReportTypeSelect = (reportType: "progress" | "completion") => {
    if (selectedAssignment) {
      // Navigate to the create report page with the selected assignment and report type
      router.push(`/logistics/reports/create/${selectedAssignment.id}?reportType=${reportType}`)
    }
  }

  const handleNextPage = () => {
    if (debouncedSearchQuery) {
      // Algolia pagination
      setCurrentPage(prev => prev + 1)
    } else {
      // Client-side pagination for real-time data
      setFirebasePage(prev => prev + 1)
    }
  }

  const handlePreviousPage = () => {
    if (debouncedSearchQuery) {
      // Algolia pagination
      setCurrentPage(prev => Math.max(1, prev - 1))
    } else {
      // Client-side pagination for real-time data
      setFirebasePage(prev => Math.max(1, prev - 1))
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 p-6">
        <div className="w-full">
          <div className="animate-pulse">
            <div className="h-6 bg-gray-300 rounded mb-4"></div>
            <div className="h-8 bg-gray-300 rounded mb-4"></div>
            <div className="bg-white rounded-t-lg p-4">
              <div className="h-4 bg-gray-300 rounded mb-2"></div>
              <div className="space-y-3">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="h-16 bg-gray-200 rounded"></div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen">
      <div className="w-full mx-auto">
        <h1
          className="text-lg font-medium mb-4 cursor-pointer flex items-center gap-2 w-[300px]"
          onClick={() => router.back()}
        >
          <ArrowLeft className="w-4 h-4 font-semibold"/>
           Select a Service Assignment
        </h1>

        <div className="mb-4">
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

        <div className="bg-white rounded-t-lg overflow-hidden shadow-sm">
          <div className="grid grid-cols-8 gap-4 p-4 border-b mx-4 border-gray-200 text-xs font-semibold text-left">
            <div>Date</div>
            <div>SA I.D.</div>
            <div>Type</div>
            <div>Site</div>
            <div>Campaign Name</div>
            <div>Crew</div>
            <div>Deadline</div>
            <div>Status</div>
          </div>

          <div className="p-4 space-y-2 relative font-semibold">
            {searchLoading && (
              <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center z-10">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
              </div>
            )}
            {assignments.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No service assignments found
              </div>
            ) : (
              assignments.map((assignment) => (
                <div
                  key={assignment.id}
                  className="rounded-lg bg-blue-50 border border-blue-200 p-4 cursor-pointer hover:bg-blue-100 transition-colors"
                  onClick={() => handleAssignmentClick(assignment)}
                >
                  <div className="grid grid-cols-8 gap-4 text-sm">
                    <div>{formatDate(assignment.created) || "—"}</div>
                    <div>{assignment.saNumber || "—"}</div>
                    <div>{assignment.serviceType || "—"}</div>
                    <div>{assignment.projectSiteName || "—"}</div>
                    <div>{assignment.campaignName || "—"}</div>
                    <div className="truncate">{assignment.assignedToName || assignment.assignedTo || "—"}</div>
                    <div >{formatDate(assignment.coveredDateEnd) || "—"}</div>
                    <div className="capitalize">{assignment.status || "—"}</div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {assignments.length > 0 && (
          <Pagination
            currentPage={debouncedSearchQuery ? currentPage : firebasePage}
            itemsPerPage={10}
            totalItems={assignments.length}
            totalOverall={totalHits}
            onNextPage={handleNextPage}
            onPreviousPage={handlePreviousPage}
            hasMore={hasMore}
          />
        )}

        <ReportTypeDialog
          isOpen={isDialogOpen}
          onClose={() => setIsDialogOpen(false)}
          onSelectReport={handleReportTypeSelect}
        />
      </div>
    </div>
  )
}

export default SelectServiceAssignmentPage
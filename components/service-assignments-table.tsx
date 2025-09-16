"use client"

import { useState, useEffect } from "react"
import { collection, query, orderBy, onSnapshot, where, doc, getDoc, getDocs, limit, startAfter } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { generateServiceAssignmentDetailsPDF } from "@/lib/pdf-service"
import { teamsService } from "@/lib/teams-service"
import { searchServiceAssignments } from "@/lib/algolia-service"
import type { Product } from "@/lib/firebase-service"
import type { JobOrder } from "@/lib/types/job-order"
import type { Team } from "@/lib/types/team"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { format } from "date-fns"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Pagination } from "@/components/ui/pagination"
import { MoreVertical, Printer, X, Bell, FileText } from "lucide-react"

interface ServiceAssignment {
  id: string
  saNumber: string
  projectSiteId: string
  projectSiteName: string
  projectSiteLocation: string
  serviceType: string
  assignedTo: string
  jobDescription: string
  message: string
  joNumber?: string
  requestedBy: {
    id: string
    name: string
    department: string
  }
  status: string
  coveredDateStart: any
  coveredDateEnd: any
  created: any
  updated: any
  company_id?: string | null
}

interface ServiceAssignmentSearchResult {
  objectID: string
  saNumber?: string
  projectSiteId?: string
  projectSiteName?: string
  projectSiteLocation?: string
  serviceType?: string
  assignedTo?: string
  jobDescription?: string
  message?: string
  joNumber?: string
  requestedBy?: {
    id: string
    name: string
    department: string
  }
  status?: string
  coveredDateStart?: any
  coveredDateEnd?: any
  created?: any
  updated?: any
  company_id?: string
}

interface ServiceAssignmentsTableProps {
  onSelectAssignment?: (id: string) => void
  companyId?: string
  searchQuery?: string
}

export function ServiceAssignmentsTable({ onSelectAssignment, companyId, searchQuery }: ServiceAssignmentsTableProps) {
  const router = useRouter()
  const [assignments, setAssignments] = useState<ServiceAssignment[]>([])
  const [teams, setTeams] = useState<Record<string, Team>>({})
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState<string>("all")

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [hasMore, setHasMore] = useState(false)
  const [totalItems, setTotalItems] = useState(0)
  const [lastDoc, setLastDoc] = useState<any>(null)
  const [allFetchedDocs, setAllFetchedDocs] = useState<any[]>([])
  const [isSearchMode, setIsSearchMode] = useState(false)
  const itemsPerPage = 10

  const handlePrint = async (assignment: ServiceAssignment) => {
    try {
      // Fetch full assignment data
      const assignmentDoc = await getDoc(doc(db, "service_assignments", assignment.id))
      if (!assignmentDoc.exists()) {
        console.error("Assignment not found")
        return
      }
      const fullAssignmentData: any = { id: assignmentDoc.id, ...assignmentDoc.data() }

      // Fetch job order if present
      let jobOrderData = null
      if (fullAssignmentData.jobOrderId) {
        const jobOrderDoc = await getDoc(doc(db, "job_orders", fullAssignmentData.jobOrderId))
        if (jobOrderDoc.exists()) {
          jobOrderData = { id: jobOrderDoc.id, ...jobOrderDoc.data() }
        }
      }

      // Fetch products
      const productsRef = collection(db, "products")
      const q = query(productsRef, where("deleted", "==", false), orderBy("name", "asc"), limit(100))
      const querySnapshot = await getDocs(q)
      const products: Product[] = []
      querySnapshot.forEach((doc) => {
        products.push({ id: doc.id, ...doc.data() } as Product)
      })

      // Fetch teams
      const teamsData = await teamsService.getAllTeams()
      const teams = teamsData.filter((team) => team.status === "active")

      // Generate PDF
      await generateServiceAssignmentDetailsPDF(fullAssignmentData, jobOrderData, products, teams)
    } catch (error) {
      console.error("Error generating PDF:", error)
    }
  }

  // Function to fetch team data for assignments
  const fetchTeamsForAssignments = async (assignmentsData: ServiceAssignment[]) => {
    const teamIds = assignmentsData
      .map(assignment => assignment.assignedTo)
      .filter(teamId => teamId && !teams[teamId])

    console.log("Team IDs to fetch:", teamIds)

    if (teamIds.length === 0) return

    const teamPromises = teamIds.map(async (teamId) => {
      try {
        console.log(`Fetching team ${teamId}`)
        const teamDoc = await getDoc(doc(db, "logistics_teams", teamId))
        if (teamDoc.exists()) {
          console.log(`Team ${teamId} found:`, teamDoc.data())
          return { id: teamId, data: teamDoc.data() as Team }
        } else {
          console.log(`Team ${teamId} not found in logistics_teams collection`)
        }
      } catch (error) {
        console.error(`Error fetching team ${teamId}:`, error)
      }
      return null
    })

    const teamResults = await Promise.all(teamPromises)
    const newTeams: Record<string, Team> = {}

    teamResults.forEach(result => {
      if (result) {
        newTeams[result.id] = { ...result.data, id: result.id }
      }
    })

    console.log("New teams fetched:", newTeams)
    setTeams(prev => ({ ...prev, ...newTeams }))
  }

  // Function to fetch assignments from Firestore with server-side pagination
  const fetchAssignmentsFromFirestore = async (page: number = 1) => {
    setLoading(true)
    try {
      const hasSearch = !!(searchQuery && searchQuery.trim())
      setIsSearchMode(hasSearch)

      if (hasSearch) {
        // For search: fetch all data for client-side filtering and pagination
        console.log(`Fetching all data for search: "${searchQuery.trim()}"`)
        let q = query(collection(db, "service_assignments"), orderBy("created", "desc"))

        if (companyId) {
          q = query(q, where("company_id", "==", companyId))
        }

        const querySnapshot = await getDocs(q)
        const allDocs = querySnapshot.docs

        // Convert to assignments data
        let allAssignments: ServiceAssignment[] = allDocs.map(doc => {
          const data = doc.data()
          return {
            id: doc.id,
            ...data,
            coveredDateStart: data.coveredDateStart,
            coveredDateEnd: data.coveredDateEnd,
            created: data.created,
            updated: data.updated,
          } as ServiceAssignment
        })

        // Apply search filtering
        const searchTerm = searchQuery.trim().toLowerCase()
        allAssignments = allAssignments.filter(assignment =>
          assignment.saNumber.toLowerCase().includes(searchTerm) ||
          assignment.projectSiteName.toLowerCase().includes(searchTerm) ||
          assignment.serviceType.toLowerCase().includes(searchTerm) ||
          (assignment.message && assignment.message.toLowerCase().includes(searchTerm))
        )

        // Client-side pagination for search results
        const startIndex = (page - 1) * itemsPerPage
        const endIndex = Math.min(startIndex + itemsPerPage, allAssignments.length)
        const pageAssignments = allAssignments.slice(startIndex, endIndex)

        setAssignments(pageAssignments)
        setHasMore(allAssignments.length > endIndex)
        setTotalPages(Math.ceil(allAssignments.length / itemsPerPage))
        setTotalItems(allAssignments.length)
        setAllFetchedDocs(allDocs)

        await fetchTeamsForAssignments(pageAssignments)
      } else {
        // For non-search: use server-side pagination
        let q = query(collection(db, "service_assignments"), orderBy("created", "desc"), limit(itemsPerPage + 1))

        if (companyId) {
          q = query(q, where("company_id", "==", companyId))
        }

        // Handle pagination cursor
        if (page > 1) {
          if (lastDoc && page > currentPage) {
            // Going forward: use cursor
            q = query(q, startAfter(lastDoc))
          } else {
            // Going backward or jumping: refetch from beginning and slice
            q = query(collection(db, "service_assignments"), orderBy("created", "desc"), limit(page * itemsPerPage + 1))
            if (companyId) {
              q = query(q, where("company_id", "==", companyId))
            }
          }
        } else {
          // Page 1: reset cursor
          setLastDoc(null)
        }

        const querySnapshot = await getDocs(q)
        const docs = querySnapshot.docs

        let pageDocs: any[]
        let hasMorePages: boolean

        if (page > 1 && page <= currentPage) {
          // Going backward: slice the fetched documents
          const startIndex = (page - 1) * itemsPerPage
          const endIndex = Math.min(startIndex + itemsPerPage, docs.length)
          pageDocs = docs.slice(startIndex, endIndex)
          hasMorePages = docs.length > endIndex
        } else {
          // Going forward or page 1: use the first itemsPerPage documents
          hasMorePages = docs.length > itemsPerPage
          pageDocs = hasMorePages ? docs.slice(0, itemsPerPage) : docs
        }

        // Convert to assignments data
        const pageAssignments: ServiceAssignment[] = pageDocs.map(doc => {
          const data = doc.data()
          return {
            id: doc.id,
            ...data,
            coveredDateStart: data.coveredDateStart,
            coveredDateEnd: data.coveredDateEnd,
            created: data.created,
            updated: data.updated,
          } as ServiceAssignment
        })

        // Update cursor for next page (only when going forward)
        if (page >= currentPage && hasMorePages && pageDocs.length > 0) {
          setLastDoc(pageDocs[pageDocs.length - 1])
        }

        setAssignments(pageAssignments)
        setHasMore(hasMorePages)
        setTotalPages(hasMorePages ? page + 1 : page) // Estimate based on current page
        setTotalItems(0) // Unknown with server-side pagination
        setAllFetchedDocs(docs)

        await fetchTeamsForAssignments(pageAssignments)
      }
    } catch (error) {
      console.error("Error fetching assignments:", error)
      setAssignments([])
      setHasMore(false)
      setTotalPages(1)
      setTotalItems(0)
    } finally {
      setLoading(false)
    }
  }

  // Function to fetch assignments using Algolia search
  const fetchAssignmentsFromAlgolia = async (query: string, page: number = 1) => {
    setLoading(true)
    try {
      const searchResult = await searchServiceAssignments(query, companyId || undefined, page - 1, itemsPerPage) // Algolia uses 0-based indexing

      if (searchResult.error) {
        console.error("Algolia search error:", searchResult.error)
        setAssignments([])
        setTotalPages(1)
        setHasMore(false)
        setTotalItems(0)
        return
      }

      // Convert Algolia hits to ServiceAssignment format
      const assignmentsData: ServiceAssignment[] = searchResult.hits.map(hit => {
        const saHit = hit as any // Cast to any to access service assignment fields
        return {
          id: hit.objectID,
          saNumber: saHit.saNumber || '',
          projectSiteId: saHit.projectSiteId || '',
          projectSiteName: saHit.projectSiteName || '',
          projectSiteLocation: saHit.projectSiteLocation || '',
          serviceType: saHit.serviceType || '',
          assignedTo: saHit.assignedTo || '',
          jobDescription: saHit.jobDescription || '',
          message: saHit.message || '',
          joNumber: saHit.joNumber || '',
          requestedBy: saHit.requestedBy || { id: '', name: '', department: '' },
          status: saHit.status || '',
          coveredDateStart: saHit.coveredDateStart ? new Date(saHit.coveredDateStart) : null,
          coveredDateEnd: saHit.coveredDateEnd ? new Date(saHit.coveredDateEnd) : null,
          created: saHit.created ? new Date(saHit.created) : null,
          updated: saHit.updated ? new Date(saHit.updated) : null,
          company_id: saHit.company_id
        }
      })

      setAssignments(assignmentsData)
      setTotalPages(searchResult.nbPages)
      setHasMore(page < searchResult.nbPages)
      setTotalItems(searchResult.nbHits)

      // Fetch team data for the assignments
      await fetchTeamsForAssignments(assignmentsData)
    } catch (error) {
      console.error("Error searching assignments:", error)
      setAssignments([])
      setTotalPages(1)
      setHasMore(false)
      setTotalItems(0)
    } finally {
      setLoading(false)
    }
  }

  // Pagination handlers
  const handleNextPage = () => {
    if (hasMore) {
      setCurrentPage(prev => prev + 1)
    }
  }

  const handlePreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(prev => prev - 1)
    }
  }

  // Single useEffect to handle all data fetching
  useEffect(() => {
    // Use Firestore for all data fetching
    fetchAssignmentsFromFirestore(currentPage)
  }, [currentPage, searchQuery, companyId])

  // Separate effect to reset pagination when search/filter changes
  useEffect(() => {
    setCurrentPage(1)
    setLastDoc(null)
    setAllFetchedDocs([])
    setIsSearchMode(false)
  }, [searchQuery, companyId])

  // Fallback function using real-time Firestore listener (original implementation)
  const fetchAssignmentsFromFirestoreRealtime = () => {
    setLoading(true)

    let realtimeQuery = query(collection(db, "service_assignments"), orderBy("created", "desc"))

    // Filter by company_id if provided
    if (companyId) {
      realtimeQuery = query(realtimeQuery, where("company_id", "==", companyId))
    }

    const unsubscribe = onSnapshot(realtimeQuery, async (querySnapshot) => {
      const assignmentsData: ServiceAssignment[] = []
      querySnapshot.forEach((doc) => {
        const data = doc.data()
        assignmentsData.push({
          id: doc.id,
          ...data,
        } as ServiceAssignment)
      })

      // Apply pagination client-side for real-time data
      const startIndex = (currentPage - 1) * itemsPerPage
      const endIndex = startIndex + itemsPerPage
      const paginatedData = assignmentsData.slice(startIndex, endIndex)

      setAssignments(paginatedData)
      setHasMore(assignmentsData.length > endIndex)
      setTotalPages(Math.ceil(assignmentsData.length / itemsPerPage))

      // Fetch team data for the assignments
      await fetchTeamsForAssignments(paginatedData)

      setLoading(false)
    })

    return unsubscribe
  }

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "completed":
        return "bg-green-100 text-green-800"
      case "in progress":
        return "bg-blue-100 text-blue-800"
      case "pending":
        return "bg-yellow-100 text-yellow-800"
      case "cancelled":
        return "bg-red-100 text-red-800"
      case "draft":
        return "bg-orange-100 text-orange-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  // Filter assignments based on status (search is now handled server-side)
  const filteredAssignments = assignments.filter(assignment => {
    return statusFilter === "all" || assignment.status.toLowerCase() === statusFilter.toLowerCase()
  })

  if (loading) {
    return <div className="flex justify-center p-8">Loading assignments...</div>
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>SA#</TableHead>
            <TableHead>JO#</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Site</TableHead>
            <TableHead>End Date</TableHead>
            <TableHead>Campaign Name</TableHead>
            <TableHead>Crew</TableHead>
            <TableHead>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-32 h-8">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="in progress">In Progress</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                  <SelectItem value="draft">Draft</SelectItem>
                </SelectContent>
              </Select>
            </TableHead>
            <TableHead>Action</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filteredAssignments.length === 0 ? (
            <TableRow>
              <TableCell colSpan={9} className="text-center py-8 text-gray-500">
                No service assignments found. Create your first assignment.
              </TableCell>
            </TableRow>
          ) : (
            filteredAssignments.map((assignment) => (
              <TableRow
                key={assignment.id}
                className="cursor-pointer hover:bg-gray-50"
                onClick={() => router.push(`/logistics/assignments/${assignment.id}`)}
              >
                <TableCell className="font-medium">{assignment.saNumber}</TableCell>
                <TableCell>{assignment.joNumber || "N/A"}</TableCell>
                <TableCell>{assignment.serviceType}</TableCell>
                <TableCell>{assignment.projectSiteName}</TableCell>
                <TableCell>
                  {assignment.coveredDateEnd ? (
                    format(
                      assignment.coveredDateEnd instanceof Date
                        ? assignment.coveredDateEnd
                        : assignment.coveredDateEnd.toDate
                          ? assignment.coveredDateEnd.toDate()
                          : new Date(assignment.coveredDateEnd),
                      "MMM d, yyyy"
                    )
                  ) : (
                    "Not specified"
                  )}
                </TableCell>
                <TableCell>{assignment.message || assignment.jobDescription || "N/A"}</TableCell>
                <TableCell>{assignment.assignedTo ? (teams[assignment.assignedTo]?.name || assignment.assignedTo) : "N/A"}</TableCell>
                <TableCell>
                  <Badge className={getStatusColor(assignment.status)}>{assignment.status}</Badge>
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handlePrint(assignment); }}>
                        <Printer className="mr-2 h-4 w-4" />
                        Print
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={(e) => { e.stopPropagation(); console.log("Cancel assignment", assignment.id); }}>
                        <X className="mr-2 h-4 w-4" />
                        Cancel
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={(e) => { e.stopPropagation(); console.log("Set alarm for", assignment.id); }}>
                        <Bell className="mr-2 h-4 w-4" />
                        Set an Alarm
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={(e) => { e.stopPropagation(); router.push(`/logistics/reports/create?assignment=${assignment.id}`); }}>
                        <FileText className="mr-2 h-4 w-4" />
                        Create a Report
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>

      {/* Pagination Controls */}
      {assignments.length > 0 && (
        <Pagination
          currentPage={currentPage}
          itemsPerPage={itemsPerPage}
          totalItems={totalItems}
          onNextPage={handleNextPage}
          onPreviousPage={handlePreviousPage}
          hasMore={hasMore}
        />
      )}
    </div>
  )
}

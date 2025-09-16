"use client"

import { useState, useEffect } from "react"
import { collection, query, orderBy, onSnapshot, where, doc, getDoc } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { format } from "date-fns"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { MoreVertical, Printer, X, Bell, FileText } from "lucide-react"
import type { Team } from "@/lib/types/team"

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

interface ServiceAssignmentsTableProps {
  onSelectAssignment?: (id: string) => void
  companyId?: string
}

export function ServiceAssignmentsTable({ onSelectAssignment, companyId }: ServiceAssignmentsTableProps) {
  const router = useRouter()
  const [assignments, setAssignments] = useState<ServiceAssignment[]>([])
  const [teams, setTeams] = useState<Record<string, Team>>({})
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState<string>("all")

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

  useEffect(() => {
    let q = query(collection(db, "service_assignments"), orderBy("created", "desc"))

    // Filter by company_id if provided
    if (companyId) {
      q = query(collection(db, "service_assignments"), where("company_id", "==", companyId), orderBy("created", "desc"))
    }

    const unsubscribe = onSnapshot(q, async (querySnapshot) => {
      const assignmentsData: ServiceAssignment[] = []
      querySnapshot.forEach((doc) => {
        const data = doc.data()
        console.log(`Assignment ${doc.id} data:`, data)
        assignmentsData.push({
          id: doc.id,
          ...data,
        } as ServiceAssignment)
      })
      console.log("All assignments data:", assignmentsData)
      setAssignments(assignmentsData)

      // Fetch team data for the assignments
      await fetchTeamsForAssignments(assignmentsData)

      setLoading(false)
    })

    return () => unsubscribe()
  }, [companyId])

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

  // Filter assignments based on status
  const filteredAssignments = assignments.filter(assignment => {
    if (statusFilter === "all") return true
    return assignment.status.toLowerCase() === statusFilter.toLowerCase()
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
                    format(new Date(assignment.coveredDateEnd.toDate()), "MMM d, yyyy")
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
                      <DropdownMenuItem onClick={() => window.print()}>
                        <Printer className="mr-2 h-4 w-4" />
                        Print
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => console.log("Cancel assignment", assignment.id)}>
                        <X className="mr-2 h-4 w-4" />
                        Cancel
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => console.log("Set alarm for", assignment.id)}>
                        <Bell className="mr-2 h-4 w-4" />
                        Set an Alarm
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => router.push(`/logistics/reports/create?assignment=${assignment.id}`)}>
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
    </div>
  )
}

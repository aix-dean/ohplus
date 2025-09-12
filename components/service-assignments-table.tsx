"use client"

import { useState, useEffect } from "react"
import { collection, query, orderBy, onSnapshot, where } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { format } from "date-fns"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { MoreVertical, Printer, X, Bell, FileText } from "lucide-react"

interface ServiceAssignment {
  id: string
  saNumber: string
  projectSiteName: string
  projectSiteLocation: string
  serviceType: string
  assignedTo: string
  jobDescription: string
  campaignName?: string
  requestedBy: {
    id: string
    name: string
    department: string
  }
  status: string
  coveredDateStart: any
  coveredDateEnd: any
  created: any
  company_id: string
}

interface ServiceAssignmentsTableProps {
  onSelectAssignment?: (id: string) => void
  companyId?: string
}

export function ServiceAssignmentsTable({ onSelectAssignment, companyId }: ServiceAssignmentsTableProps) {
  const router = useRouter()
  const [assignments, setAssignments] = useState<ServiceAssignment[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState<string>("all")

  useEffect(() => {
    let q = query(collection(db, "service_assignments"), orderBy("created", "desc"))

    // Filter by company_id if provided
    if (companyId) {
      q = query(collection(db, "service_assignments"), where("company_id", "==", companyId), orderBy("created", "desc"))
    }

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const assignmentsData: ServiceAssignment[] = []
      querySnapshot.forEach((doc) => {
        assignmentsData.push({
          id: doc.id,
          ...doc.data(),
        } as ServiceAssignment)
      })
      setAssignments(assignmentsData)
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
              <TableRow key={assignment.id} className="cursor-pointer hover:bg-gray-50">
                <TableCell className="font-medium">{assignment.saNumber}</TableCell>
                <TableCell>{assignment.id.slice(0, 8)}</TableCell>
                <TableCell>{assignment.serviceType}</TableCell>
                <TableCell>{assignment.projectSiteName}</TableCell>
                <TableCell>
                  {assignment.coveredDateEnd ? (
                    format(new Date(assignment.coveredDateEnd.toDate()), "MMM d, yyyy")
                  ) : (
                    "Not specified"
                  )}
                </TableCell>
                <TableCell>{assignment.campaignName || assignment.jobDescription || "N/A"}</TableCell>
                <TableCell>{assignment.assignedTo}</TableCell>
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

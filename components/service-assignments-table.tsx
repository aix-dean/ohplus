"use client"

import { useState, useEffect } from "react"
import { collection, query, orderBy, onSnapshot, where } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { format } from "date-fns"
import { Button } from "@/components/ui/button"

interface ServiceAssignment {
  id: string
  alarmDate: any
  alarmTime: string
  assignedTo: string
  attachments: any[]
  company_id: string
  coveredDateEnd: any
  coveredDateStart: any
  created: any
  crew: string
  equipmentRequired: string
  gondola: string
  illuminationNits: string
  materialSpecs: string
  message: string
  priority: string
  projectSiteId: string
  projectSiteLocation: string
  projectSiteName: string
  project_key: string
  remarks: string
  requestedBy: {
    department: string
    id: string
    name: string
  }
  saNumber: string
  sales: string
  serviceCost: {
    crewFee: string
    mealAllowance: string
    otherFees: any[]
    overtimeFee: string
    tollFee: string
    total: number
    transpo: string
  }
  serviceDuration: string
  serviceType: string
  status: string
  technology: string
  updated: any
}

interface ServiceAssignmentsTableProps {
  onSelectAssignment?: (id: string) => void
  companyId?: string
}

export function ServiceAssignmentsTable({ onSelectAssignment, companyId }: ServiceAssignmentsTableProps) {
  const [assignments, setAssignments] = useState<ServiceAssignment[]>([])
  const [loading, setLoading] = useState(true)

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
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  if (loading) {
    return <div className="flex justify-center p-8">Loading assignments...</div>
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>SA#</TableHead>
            <TableHead>Project Site</TableHead>
            <TableHead>Service Type</TableHead>
            <TableHead>Assigned To</TableHead>
            <TableHead>Covered Date</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Created</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {assignments.length === 0 ? (
            <TableRow>
              <TableCell colSpan={8} className="text-center py-8 text-gray-500">
                No service assignments found. Create your first assignment.
              </TableCell>
            </TableRow>
          ) : (
            assignments.map((assignment) => (
              <TableRow key={assignment.id} className="cursor-pointer hover:bg-gray-50">
                <TableCell className="font-medium">{assignment.saNumber}</TableCell>
                <TableCell>
                  <div>
                    <div className="font-medium">{assignment.projectSiteName}</div>
                    <div className="text-sm text-gray-500">{assignment.projectSiteLocation}</div>
                  </div>
                </TableCell>
                <TableCell>{assignment.serviceType}</TableCell>
                <TableCell>{assignment.assignedTo}</TableCell>
                <TableCell>
                  {assignment.coveredDateStart && assignment.coveredDateEnd ? (
                    <>
                      {format(new Date(assignment.coveredDateStart.toDate()), "MMM d, yyyy")} -
                      {format(new Date(assignment.coveredDateEnd.toDate()), "MMM d, yyyy")}
                    </>
                  ) : (
                    "Not specified"
                  )}
                </TableCell>
                <TableCell>
                  <Badge className={getStatusColor(assignment.status)}>{assignment.status}</Badge>
                </TableCell>
                <TableCell>
                  {assignment.created ? format(new Date(assignment.created.toDate()), "MMM d, yyyy") : "Unknown"}
                </TableCell>
                <TableCell>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onSelectAssignment && onSelectAssignment(assignment.id)}
                  >
                    View
                  </Button>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  )
}

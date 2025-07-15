import type React from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

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
    saNumber?: string
    sales?: string
  }
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
  assignments: ServiceAssignment[]
}

const ServiceAssignmentsTable: React.FC<ServiceAssignmentsTableProps> = ({ assignments }) => {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Project Site Name</TableHead>
          <TableHead>Service Type</TableHead>
          <TableHead>Priority</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Requested By</TableHead>
          <TableHead>Assigned To</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {assignments.map((assignment) => (
          <TableRow key={assignment.id}>
            <TableCell className="font-medium">{assignment.projectSiteName}</TableCell>
            <TableCell>{assignment.serviceType}</TableCell>
            <TableCell>{assignment.priority}</TableCell>
            <TableCell>{assignment.status}</TableCell>
            <TableCell className="font-medium">{assignment.requestedBy?.name || "N/A"}</TableCell>
            <TableCell>{assignment.assignedTo}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}

export default ServiceAssignmentsTable

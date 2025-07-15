import type React from "react"
import { Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper } from "@mui/material"
import { formatDate } from "@/utils/formatDate"

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
  assignments: ServiceAssignment[]
}

const ServiceAssignmentsTable: React.FC<ServiceAssignmentsTableProps> = ({ assignments }) => {
  return (
    <TableContainer component={Paper}>
      <Table sx={{ minWidth: 650 }} aria-label="simple table">
        <TableHead>
          <TableRow>
            <TableCell>Project Site Name</TableCell>
            <TableCell>Service Type</TableCell>
            <TableCell>Assigned Team</TableCell>
            <TableCell>Status</TableCell>
            <TableCell>Start Date</TableCell>
            <TableCell>End Date</TableCell>
            <TableCell>Created Date</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {assignments.map((assignment) => (
            <TableRow key={assignment.id} sx={{ "&:last-child td, &:last-child th": { border: 0 } }}>
              <TableCell component="th" scope="row">
                {assignment.projectSiteName}
              </TableCell>
              <TableCell>{assignment.serviceType}</TableCell>
              <TableCell>{assignment.assignedTo}</TableCell>
              <TableCell>{assignment.status}</TableCell>
              <TableCell>{formatDate(assignment.coveredDateStart)}</TableCell>
              <TableCell>{formatDate(assignment.coveredDateEnd)}</TableCell>
              <TableCell>{formatDate(assignment.created)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  )
}

export default ServiceAssignmentsTable

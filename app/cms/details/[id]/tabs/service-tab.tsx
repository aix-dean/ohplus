"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Plus, Wrench } from "lucide-react"
import type { ServiceAssignment } from "@/lib/firebase-service"

interface ServiceTabProps {
  productId: string
  serviceAssignments: ServiceAssignment[]
}

const getStatusColor = (status: string) => {
  switch (status.toLowerCase()) {
    case "completed":
      return "bg-green-100 text-green-800"
    case "ongoing":
    case "in progress":
      return "bg-blue-100 text-blue-800"
    case "pending":
      return "bg-yellow-100 text-yellow-800"
    case "scheduled":
      return "bg-purple-100 text-purple-800"
    default:
      return "bg-gray-100 text-gray-800"
  }
}

export default function ServiceTab({ productId, serviceAssignments }: ServiceTabProps) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Wrench size={20} />
            Service Assignments
          </CardTitle>
          <Button size="sm" className="bg-blue-600 hover:bg-blue-700">
            <Plus size={16} className="mr-2" />
            Create Assignment
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {serviceAssignments.length > 0 ? (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Assignment ID</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Assigned To</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Notes</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {serviceAssignments.map((assignment) => (
                  <TableRow key={assignment.id}>
                    <TableCell className="font-mono text-sm">{assignment.saNumber || assignment.id}</TableCell>
                    <TableCell className="font-medium">{assignment.jobDescription || "Service Assignment"}</TableCell>
                    <TableCell>{assignment.assignedTo || "Unassigned"}</TableCell>
                    <TableCell>
                      {assignment.coveredDateStart ? new Date(assignment.coveredDateStart).toLocaleDateString() : "TBD"}
                    </TableCell>
                    <TableCell>
                      <Badge className={getStatusColor(assignment.status || "pending")}>
                        {assignment.status || "Pending"}
                      </Badge>
                    </TableCell>
                    <TableCell className="max-w-xs truncate">{assignment.message || "No notes available"}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : (
          <div className="text-center py-12">
            <Wrench size={48} className="mx-auto text-gray-300 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Service Assignments</h3>
            <p className="text-gray-500 mb-4">No service assignments have been created for this product yet.</p>
            <Button className="bg-blue-600 hover:bg-blue-700">
              <Plus size={16} className="mr-2" />
              Create First Assignment
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

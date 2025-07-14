"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Plus, Edit, Trash2, Calendar, Clock, AlertCircle, CheckCircle, XCircle } from "lucide-react"
import { toast } from "@/components/ui/use-toast"
import type { Product, ServiceAssignment } from "@/lib/firebase-service"

interface ServiceTabProps {
  product: Product
  serviceAssignments: ServiceAssignment[]
}

export function ServiceTab({ product, serviceAssignments }: ServiceTabProps) {
  const [assignments, setAssignments] = useState<ServiceAssignment[]>(serviceAssignments)
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [editingAssignment, setEditingAssignment] = useState<ServiceAssignment | null>(null)
  const [assignmentForm, setAssignmentForm] = useState({
    service_type: "",
    assigned_to_name: "",
    assigned_to_email: "",
    priority: "medium" as "high" | "medium" | "low",
    scheduled_date: "",
    estimated_duration: 60,
    notes: "",
  })

  const handleAddAssignment = () => {
    const newAssignment: ServiceAssignment = {
      id: Date.now().toString(),
      product_id: product.id,
      service_type: assignmentForm.service_type,
      assigned_to_name: assignmentForm.assigned_to_name,
      assigned_to_email: assignmentForm.assigned_to_email,
      priority: assignmentForm.priority,
      status: "pending",
      scheduled_date: assignmentForm.scheduled_date,
      estimated_duration: assignmentForm.estimated_duration,
      notes: assignmentForm.notes,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }

    setAssignments((prev) => [...prev, newAssignment])
    setIsAddDialogOpen(false)
    resetForm()

    toast({
      title: "Service Assignment Created",
      description: "New service assignment has been created successfully.",
    })
  }

  const handleEditAssignment = (assignment: ServiceAssignment) => {
    setEditingAssignment(assignment)
    setAssignmentForm({
      service_type: assignment.service_type,
      assigned_to_name: assignment.assigned_to_name,
      assigned_to_email: assignment.assigned_to_email,
      priority: assignment.priority,
      scheduled_date: assignment.scheduled_date,
      estimated_duration: assignment.estimated_duration,
      notes: assignment.notes || "",
    })
    setIsAddDialogOpen(true)
  }

  const handleUpdateAssignment = () => {
    if (!editingAssignment) return

    setAssignments((prev) =>
      prev.map((assignment) =>
        assignment.id === editingAssignment.id
          ? {
              ...assignment,
              service_type: assignmentForm.service_type,
              assigned_to_name: assignmentForm.assigned_to_name,
              assigned_to_email: assignmentForm.assigned_to_email,
              priority: assignmentForm.priority,
              scheduled_date: assignmentForm.scheduled_date,
              estimated_duration: assignmentForm.estimated_duration,
              notes: assignmentForm.notes,
              updated_at: new Date().toISOString(),
            }
          : assignment,
      ),
    )

    setIsAddDialogOpen(false)
    setEditingAssignment(null)
    resetForm()

    toast({
      title: "Service Assignment Updated",
      description: "Service assignment has been updated successfully.",
    })
  }

  const handleDeleteAssignment = (assignmentId: string) => {
    setAssignments((prev) => prev.filter((assignment) => assignment.id !== assignmentId))

    toast({
      title: "Service Assignment Deleted",
      description: "Service assignment has been removed.",
    })
  }

  const handleStatusChange = (assignmentId: string, newStatus: string) => {
    setAssignments((prev) =>
      prev.map((assignment) =>
        assignment.id === assignmentId
          ? {
              ...assignment,
              status: newStatus,
              updated_at: new Date().toISOString(),
            }
          : assignment,
      ),
    )

    toast({
      title: "Status Updated",
      description: `Service assignment status changed to ${newStatus}.`,
    })
  }

  const resetForm = () => {
    setAssignmentForm({
      service_type: "",
      assigned_to_name: "",
      assigned_to_email: "",
      priority: "medium",
      scheduled_date: "",
      estimated_duration: 60,
      notes: "",
    })
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-100 text-green-800"
      case "in_progress":
        return "bg-blue-100 text-blue-800"
      case "pending":
        return "bg-yellow-100 text-yellow-800"
      case "cancelled":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "bg-red-100 text-red-800"
      case "medium":
        return "bg-yellow-100 text-yellow-800"
      case "low":
        return "bg-green-100 text-green-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="h-4 w-4 text-green-600" />
      case "in_progress":
        return <Clock className="h-4 w-4 text-blue-600" />
      case "pending":
        return <AlertCircle className="h-4 w-4 text-yellow-600" />
      case "cancelled":
        return <XCircle className="h-4 w-4 text-red-600" />
      default:
        return <AlertCircle className="h-4 w-4 text-gray-600" />
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Service Assignments</h2>
          <p className="text-sm text-gray-500">Manage service assignments and maintenance tasks for this display</p>
        </div>
        <Button onClick={() => setIsAddDialogOpen(true)} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          New Assignment
        </Button>
      </div>

      {/* Service Assignments Table */}
      <Card>
        <CardHeader>
          <CardTitle>Current Assignments</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Service Type</TableHead>
                <TableHead>Assigned To</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Priority</TableHead>
                <TableHead>Scheduled</TableHead>
                <TableHead>Duration</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {assignments.map((assignment) => (
                <TableRow key={assignment.id}>
                  <TableCell className="font-medium">{assignment.service_type}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Avatar className="h-6 w-6">
                        <AvatarImage src={assignment.assigned_to_avatar || "/placeholder.svg"} />
                        <AvatarFallback className="text-xs">
                          {assignment.assigned_to_name.substring(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="font-medium">{assignment.assigned_to_name}</div>
                        <div className="text-xs text-gray-500">{assignment.assigned_to_email}</div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {getStatusIcon(assignment.status)}
                      <Badge className={getStatusColor(assignment.status)}>{assignment.status.replace("_", " ")}</Badge>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge className={getPriorityColor(assignment.priority)}>{assignment.priority}</Badge>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {assignment.scheduled_date}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>{assignment.estimated_duration} min</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Select
                        value={assignment.status}
                        onValueChange={(value) => handleStatusChange(assignment.id, value)}
                      >
                        <SelectTrigger className="w-32">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pending">Pending</SelectItem>
                          <SelectItem value="in_progress">In Progress</SelectItem>
                          <SelectItem value="completed">Completed</SelectItem>
                          <SelectItem value="cancelled">Cancelled</SelectItem>
                        </SelectContent>
                      </Select>
                      <Button variant="ghost" size="sm" onClick={() => handleEditAssignment(assignment)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => handleDeleteAssignment(assignment.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Add/Edit Assignment Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editingAssignment ? "Edit Service Assignment" : "New Service Assignment"}</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="service-type">Service Type</Label>
              <Input
                id="service-type"
                value={assignmentForm.service_type}
                onChange={(e) => setAssignmentForm((prev) => ({ ...prev, service_type: e.target.value }))}
                placeholder="e.g., Maintenance, Repair, Installation"
              />
            </div>

            <div>
              <Label htmlFor="priority">Priority</Label>
              <Select
                value={assignmentForm.priority}
                onValueChange={(value) => setAssignmentForm((prev) => ({ ...prev, priority: value as any }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="assigned-name">Assigned To (Name)</Label>
              <Input
                id="assigned-name"
                value={assignmentForm.assigned_to_name}
                onChange={(e) => setAssignmentForm((prev) => ({ ...prev, assigned_to_name: e.target.value }))}
                placeholder="Enter technician name"
              />
            </div>

            <div>
              <Label htmlFor="assigned-email">Email</Label>
              <Input
                id="assigned-email"
                type="email"
                value={assignmentForm.assigned_to_email}
                onChange={(e) => setAssignmentForm((prev) => ({ ...prev, assigned_to_email: e.target.value }))}
                placeholder="Enter email address"
              />
            </div>

            <div>
              <Label htmlFor="scheduled-date">Scheduled Date</Label>
              <Input
                id="scheduled-date"
                type="date"
                value={assignmentForm.scheduled_date}
                onChange={(e) => setAssignmentForm((prev) => ({ ...prev, scheduled_date: e.target.value }))}
              />
            </div>

            <div>
              <Label htmlFor="duration">Estimated Duration (minutes)</Label>
              <Input
                id="duration"
                type="number"
                value={assignmentForm.estimated_duration}
                onChange={(e) =>
                  setAssignmentForm((prev) => ({ ...prev, estimated_duration: Number.parseInt(e.target.value) || 60 }))
                }
                min="15"
                max="480"
              />
            </div>

            <div className="col-span-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={assignmentForm.notes}
                onChange={(e) => setAssignmentForm((prev) => ({ ...prev, notes: e.target.value }))}
                placeholder="Additional notes or instructions"
                rows={3}
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 mt-6">
            <Button
              variant="outline"
              onClick={() => {
                setIsAddDialogOpen(false)
                setEditingAssignment(null)
                resetForm()
              }}
            >
              Cancel
            </Button>
            <Button onClick={editingAssignment ? handleUpdateAssignment : handleAddAssignment}>
              {editingAssignment ? "Update" : "Create"} Assignment
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

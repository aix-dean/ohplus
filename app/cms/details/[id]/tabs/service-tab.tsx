"use client"

import type React from "react"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Plus, MoreVertical, Edit, Trash2, Calendar, Clock, User, AlertTriangle, CheckCircle } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import type { ServiceAssignment } from "@/lib/firebase-service"

interface ServiceTabProps {
  productId: string
  serviceAssignments: ServiceAssignment[]
}

export default function ServiceTab({ productId, serviceAssignments }: ServiceTabProps) {
  const [assignments, setAssignments] = useState<ServiceAssignment[]>(serviceAssignments)
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [selectedAssignment, setSelectedAssignment] = useState<ServiceAssignment | null>(null)
  const { toast } = useToast()

  const [formData, setFormData] = useState({
    saNumber: "",
    serviceType: "",
    assignedTo: "",
    jobDescription: "",
    message: "",
    coveredDateStart: "",
    coveredDateEnd: "",
    alarmDate: "",
    alarmTime: "",
    priority: "medium" as "low" | "medium" | "high" | "urgent",
  })

  const resetForm = () => {
    setFormData({
      saNumber: "",
      serviceType: "",
      assignedTo: "",
      jobDescription: "",
      message: "",
      coveredDateStart: "",
      coveredDateEnd: "",
      alarmDate: "",
      alarmTime: "",
      priority: "medium",
    })
  }

  const handleCreate = () => {
    setIsCreateOpen(true)
    resetForm()
    // Generate SA number
    setFormData((prev) => ({
      ...prev,
      saNumber: `SA-${Date.now().toString().slice(-6)}`,
    }))
  }

  const handleEdit = (assignment: ServiceAssignment) => {
    setSelectedAssignment(assignment)
    setFormData({
      saNumber: assignment.saNumber,
      serviceType: assignment.serviceType,
      assignedTo: assignment.assignedTo,
      jobDescription: assignment.jobDescription,
      message: assignment.message,
      coveredDateStart: assignment.coveredDateStart?.toISOString().split("T")[0] || "",
      coveredDateEnd: assignment.coveredDateEnd?.toISOString().split("T")[0] || "",
      alarmDate: assignment.alarmDate?.toISOString().split("T")[0] || "",
      alarmTime: assignment.alarmTime || "",
      priority: "medium",
    })
    setIsEditOpen(true)
  }

  const handleDelete = (assignmentId: string) => {
    setAssignments((prev) => prev.filter((a) => a.id !== assignmentId))
    toast({
      title: "Service assignment deleted",
      description: "The service assignment has been removed.",
    })
  }

  const handleStatusChange = (assignmentId: string, newStatus: string) => {
    setAssignments((prev) =>
      prev.map((a) =>
        a.id === assignmentId
          ? {
              ...a,
              status: newStatus,
              updated: new Date(),
            }
          : a,
      ),
    )
    toast({
      title: "Status updated",
      description: `Service assignment status changed to ${newStatus}.`,
    })
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (selectedAssignment) {
      // Edit existing assignment
      setAssignments((prev) =>
        prev.map((a) =>
          a.id === selectedAssignment.id
            ? {
                ...a,
                saNumber: formData.saNumber,
                serviceType: formData.serviceType,
                assignedTo: formData.assignedTo,
                jobDescription: formData.jobDescription,
                message: formData.message,
                coveredDateStart: formData.coveredDateStart ? new Date(formData.coveredDateStart) : null,
                coveredDateEnd: formData.coveredDateEnd ? new Date(formData.coveredDateEnd) : null,
                alarmDate: formData.alarmDate ? new Date(formData.alarmDate) : null,
                alarmTime: formData.alarmTime,
                updated: new Date(),
              }
            : a,
        ),
      )
      toast({
        title: "Service assignment updated",
        description: "The service assignment has been updated successfully.",
      })
      setIsEditOpen(false)
    } else {
      // Create new assignment
      const newAssignment: ServiceAssignment = {
        id: Date.now().toString(),
        saNumber: formData.saNumber,
        projectSiteId: productId,
        projectSiteName: "LED Display Site",
        projectSiteLocation: "Current Location",
        serviceType: formData.serviceType,
        assignedTo: formData.assignedTo,
        jobDescription: formData.jobDescription,
        requestedBy: {
          id: "current-user",
          name: "Current User",
          department: "CMS",
        },
        message: formData.message,
        coveredDateStart: formData.coveredDateStart ? new Date(formData.coveredDateStart) : null,
        coveredDateEnd: formData.coveredDateEnd ? new Date(formData.coveredDateEnd) : null,
        alarmDate: formData.alarmDate ? new Date(formData.alarmDate) : null,
        alarmTime: formData.alarmTime,
        attachments: [],
        status: "pending",
        created: new Date(),
        updated: new Date(),
      }
      setAssignments((prev) => [...prev, newAssignment])
      toast({
        title: "Service assignment created",
        description: "New service assignment has been created successfully.",
      })
      setIsCreateOpen(false)
    }

    setSelectedAssignment(null)
    resetForm()
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
      case "cancelled":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority.toLowerCase()) {
      case "urgent":
        return "bg-red-100 text-red-800"
      case "high":
        return "bg-orange-100 text-orange-800"
      case "medium":
        return "bg-blue-100 text-blue-800"
      case "low":
        return "bg-gray-100 text-gray-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case "completed":
        return <CheckCircle className="h-4 w-4 text-green-600" />
      case "ongoing":
      case "in progress":
        return <Clock className="h-4 w-4 text-blue-600" />
      case "pending":
        return <AlertTriangle className="h-4 w-4 text-yellow-600" />
      default:
        return <Clock className="h-4 w-4 text-gray-600" />
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold">Service Assignments</h3>
          <p className="text-sm text-muted-foreground">Manage maintenance and service tasks for this display</p>
        </div>
        <Button onClick={handleCreate}>
          <Plus className="h-4 w-4 mr-2" />
          New Assignment
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total</p>
                <p className="text-2xl font-bold">{assignments.length}</p>
              </div>
              <div className="h-8 w-8 bg-blue-100 rounded-full flex items-center justify-center">
                <Calendar className="h-4 w-4 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Pending</p>
                <p className="text-2xl font-bold text-yellow-600">
                  {assignments.filter((a) => a.status.toLowerCase() === "pending").length}
                </p>
              </div>
              <div className="h-8 w-8 bg-yellow-100 rounded-full flex items-center justify-center">
                <AlertTriangle className="h-4 w-4 text-yellow-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Ongoing</p>
                <p className="text-2xl font-bold text-blue-600">
                  {assignments.filter((a) => a.status.toLowerCase() === "ongoing").length}
                </p>
              </div>
              <div className="h-8 w-8 bg-blue-100 rounded-full flex items-center justify-center">
                <Clock className="h-4 w-4 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Completed</p>
                <p className="text-2xl font-bold text-green-600">
                  {assignments.filter((a) => a.status.toLowerCase() === "completed").length}
                </p>
              </div>
              <div className="h-8 w-8 bg-green-100 rounded-full flex items-center justify-center">
                <CheckCircle className="h-4 w-4 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Assignments Table */}
      <Card>
        <CardHeader>
          <CardTitle>Service Assignments</CardTitle>
        </CardHeader>
        <CardContent>
          {assignments.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">No service assignments found for this display.</p>
              <Button onClick={handleCreate} className="mt-4">
                Create First Assignment
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>SA Number</TableHead>
                  <TableHead>Service Type</TableHead>
                  <TableHead>Assigned To</TableHead>
                  <TableHead>Schedule</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {assignments.map((assignment) => (
                  <TableRow key={assignment.id}>
                    <TableCell>
                      <div className="font-medium">{assignment.saNumber}</div>
                      <div className="text-sm text-muted-foreground">{assignment.jobDescription}</div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{assignment.serviceType}</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4" />
                        {assignment.assignedTo}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {assignment.coveredDateStart && (
                          <div>Start: {assignment.coveredDateStart.toLocaleDateString()}</div>
                        )}
                        {assignment.coveredDateEnd && <div>End: {assignment.coveredDateEnd.toLocaleDateString()}</div>}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {getStatusIcon(assignment.status)}
                        <Badge className={getStatusColor(assignment.status)}>{assignment.status.toUpperCase()}</Badge>
                      </div>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleEdit(assignment)}>
                            <Edit className="h-4 w-4 mr-2" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleStatusChange(assignment.id, "ongoing")}>
                            <Clock className="h-4 w-4 mr-2" />
                            Mark Ongoing
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleStatusChange(assignment.id, "completed")}>
                            <CheckCircle className="h-4 w-4 mr-2" />
                            Mark Completed
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleDelete(assignment.id)} className="text-red-600">
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Create Assignment Dialog */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Create Service Assignment</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="saNumber">SA Number</Label>
              <Input id="saNumber" value={formData.saNumber} disabled />
            </div>

            <div>
              <Label htmlFor="serviceType">Service Type</Label>
              <Select
                value={formData.serviceType}
                onValueChange={(value) => setFormData({ ...formData, serviceType: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select service type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="maintenance">Maintenance</SelectItem>
                  <SelectItem value="repair">Repair</SelectItem>
                  <SelectItem value="installation">Installation</SelectItem>
                  <SelectItem value="inspection">Inspection</SelectItem>
                  <SelectItem value="cleaning">Cleaning</SelectItem>
                  <SelectItem value="upgrade">Upgrade</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="assignedTo">Assigned To</Label>
              <Input
                id="assignedTo"
                value={formData.assignedTo}
                onChange={(e) => setFormData({ ...formData, assignedTo: e.target.value })}
                placeholder="Enter technician name"
                required
              />
            </div>

            <div>
              <Label htmlFor="jobDescription">Job Description</Label>
              <Textarea
                id="jobDescription"
                value={formData.jobDescription}
                onChange={(e) => setFormData({ ...formData, jobDescription: e.target.value })}
                placeholder="Describe the service task"
                rows={3}
                required
              />
            </div>

            <div>
              <Label htmlFor="message">Additional Notes</Label>
              <Textarea
                id="message"
                value={formData.message}
                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                placeholder="Any additional information"
                rows={2}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="coveredDateStart">Start Date</Label>
                <Input
                  id="coveredDateStart"
                  type="date"
                  value={formData.coveredDateStart}
                  onChange={(e) => setFormData({ ...formData, coveredDateStart: e.target.value })}
                />
              </div>

              <div>
                <Label htmlFor="coveredDateEnd">End Date</Label>
                <Input
                  id="coveredDateEnd"
                  type="date"
                  value={formData.coveredDateEnd}
                  onChange={(e) => setFormData({ ...formData, coveredDateEnd: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="alarmDate">Reminder Date</Label>
                <Input
                  id="alarmDate"
                  type="date"
                  value={formData.alarmDate}
                  onChange={(e) => setFormData({ ...formData, alarmDate: e.target.value })}
                />
              </div>

              <div>
                <Label htmlFor="alarmTime">Reminder Time</Label>
                <Input
                  id="alarmTime"
                  type="time"
                  value={formData.alarmTime}
                  onChange={(e) => setFormData({ ...formData, alarmTime: e.target.value })}
                />
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setIsCreateOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">Create Assignment</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Assignment Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit Service Assignment</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="edit-saNumber">SA Number</Label>
              <Input id="edit-saNumber" value={formData.saNumber} disabled />
            </div>

            <div>
              <Label htmlFor="edit-serviceType">Service Type</Label>
              <Select
                value={formData.serviceType}
                onValueChange={(value) => setFormData({ ...formData, serviceType: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select service type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="maintenance">Maintenance</SelectItem>
                  <SelectItem value="repair">Repair</SelectItem>
                  <SelectItem value="installation">Installation</SelectItem>
                  <SelectItem value="inspection">Inspection</SelectItem>
                  <SelectItem value="cleaning">Cleaning</SelectItem>
                  <SelectItem value="upgrade">Upgrade</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="edit-assignedTo">Assigned To</Label>
              <Input
                id="edit-assignedTo"
                value={formData.assignedTo}
                onChange={(e) => setFormData({ ...formData, assignedTo: e.target.value })}
                placeholder="Enter technician name"
                required
              />
            </div>

            <div>
              <Label htmlFor="edit-jobDescription">Job Description</Label>
              <Textarea
                id="edit-jobDescription"
                value={formData.jobDescription}
                onChange={(e) => setFormData({ ...formData, jobDescription: e.target.value })}
                placeholder="Describe the service task"
                rows={3}
                required
              />
            </div>

            <div>
              <Label htmlFor="edit-message">Additional Notes</Label>
              <Textarea
                id="edit-message"
                value={formData.message}
                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                placeholder="Any additional information"
                rows={2}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-coveredDateStart">Start Date</Label>
                <Input
                  id="edit-coveredDateStart"
                  type="date"
                  value={formData.coveredDateStart}
                  onChange={(e) => setFormData({ ...formData, coveredDateStart: e.target.value })}
                />
              </div>

              <div>
                <Label htmlFor="edit-coveredDateEnd">End Date</Label>
                <Input
                  id="edit-coveredDateEnd"
                  type="date"
                  value={formData.coveredDateEnd}
                  onChange={(e) => setFormData({ ...formData, coveredDateEnd: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-alarmDate">Reminder Date</Label>
                <Input
                  id="edit-alarmDate"
                  type="date"
                  value={formData.alarmDate}
                  onChange={(e) => setFormData({ ...formData, alarmDate: e.target.value })}
                />
              </div>

              <div>
                <Label htmlFor="edit-alarmTime">Reminder Time</Label>
                <Input
                  id="edit-alarmTime"
                  type="time"
                  value={formData.alarmTime}
                  onChange={(e) => setFormData({ ...formData, alarmTime: e.target.value })}
                />
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setIsEditOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">Update Assignment</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}

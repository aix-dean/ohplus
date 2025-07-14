"use client"

import type React from "react"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Plus, Wrench, Calendar, Clock, User, AlertTriangle } from "lucide-react"
import type { ServiceAssignment } from "@/lib/firebase-service"
import { toast } from "@/hooks/use-toast"

interface ServiceTabProps {
  productId: string
  serviceAssignments: ServiceAssignment[]
}

export default function ServiceTab({ productId, serviceAssignments }: ServiceTabProps) {
  const [dialogOpen, setDialogOpen] = useState(false)
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    priority: "medium" as "low" | "medium" | "high" | "urgent",
    assignee: "",
    dueDate: "",
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      // Here you would typically save to Firebase
      console.log("Creating service assignment:", formData)

      toast({
        title: "Success",
        description: "Service assignment created successfully",
      })

      setDialogOpen(false)
      setFormData({
        title: "",
        description: "",
        priority: "medium",
        assignee: "",
        dueDate: "",
      })
    } catch (error) {
      console.error("Error creating service assignment:", error)
      toast({
        title: "Error",
        description: "Failed to create service assignment",
        variant: "destructive",
      })
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "urgent":
        return "bg-red-100 text-red-800 border-red-200"
      case "high":
        return "bg-orange-100 text-orange-800 border-orange-200"
      case "medium":
        return "bg-yellow-100 text-yellow-800 border-yellow-200"
      case "low":
        return "bg-green-100 text-green-800 border-green-200"
      default:
        return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case "completed":
        return "bg-green-100 text-green-800 border-green-200"
      case "in_progress":
      case "ongoing":
        return "bg-blue-100 text-blue-800 border-blue-200"
      case "pending":
        return "bg-yellow-100 text-yellow-800 border-yellow-200"
      case "cancelled":
        return "bg-red-100 text-red-800 border-red-200"
      default:
        return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  const formatDate = (timestamp: any) => {
    try {
      if (!timestamp) return "Not set"
      if (timestamp.seconds) {
        return new Date(timestamp.seconds * 1000).toLocaleDateString()
      }
      if (timestamp instanceof Date) {
        return timestamp.toLocaleDateString()
      }
      if (typeof timestamp === "string") {
        return new Date(timestamp).toLocaleDateString()
      }
      return "Invalid date"
    } catch {
      return "Invalid date"
    }
  }

  // Get service statistics
  const totalAssignments = serviceAssignments.length
  const completedAssignments = serviceAssignments.filter((sa) => sa.status === "completed").length
  const pendingAssignments = serviceAssignments.filter((sa) => sa.status === "pending").length
  const urgentAssignments = serviceAssignments.filter((sa) => sa.priority === "urgent").length

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Service Management</h2>
          <p className="text-gray-600">Track maintenance and service assignments for this display</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus size={16} className="mr-2" />
              New Service Request
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create Service Assignment</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="title">Service Title</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g., LED Panel Replacement"
                  required
                />
              </div>

              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                  placeholder="Describe the service requirements..."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="priority">Priority</Label>
                  <Select
                    value={formData.priority}
                    onValueChange={(value: "low" | "medium" | "high" | "urgent") =>
                      setFormData({ ...formData, priority: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="urgent">Urgent</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="assignee">Assignee</Label>
                  <Input
                    id="assignee"
                    value={formData.assignee}
                    onChange={(e) => setFormData({ ...formData, assignee: e.target.value })}
                    placeholder="Technician name"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="dueDate">Due Date</Label>
                <Input
                  id="dueDate"
                  type="date"
                  value={formData.dueDate}
                  onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                />
              </div>

              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit">Create Assignment</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Service Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Wrench size={20} className="text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Assignments</p>
                <p className="text-2xl font-bold">{totalAssignments}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <Calendar size={20} className="text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Completed</p>
                <p className="text-2xl font-bold">{completedAssignments}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <Clock size={20} className="text-yellow-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Pending</p>
                <p className="text-2xl font-bold">{pendingAssignments}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-100 rounded-lg">
                <AlertTriangle size={20} className="text-red-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Urgent</p>
                <p className="text-2xl font-bold">{urgentAssignments}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Service Assignments Table */}
      <Card>
        <CardHeader>
          <CardTitle>Service Assignments</CardTitle>
        </CardHeader>
        <CardContent>
          {serviceAssignments.length === 0 ? (
            <div className="text-center py-8">
              <Wrench size={48} className="mx-auto text-gray-400 mb-4" />
              <p className="text-gray-500">No service assignments found</p>
              <p className="text-sm text-gray-400 mt-1">
                Create your first service assignment to track maintenance tasks
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Service</TableHead>
                  <TableHead>Priority</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Assignee</TableHead>
                  <TableHead>Due Date</TableHead>
                  <TableHead>Created</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {serviceAssignments.map((assignment) => (
                  <TableRow key={assignment.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{assignment.title || "Untitled Service"}</div>
                        <div className="text-sm text-gray-500 truncate max-w-xs">
                          {assignment.description || "No description"}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={getPriorityColor(assignment.priority || "medium")}>
                        {(assignment.priority || "medium").charAt(0).toUpperCase() +
                          (assignment.priority || "medium").slice(1)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge className={getStatusColor(assignment.status || "pending")}>
                        {(assignment.status || "pending").replace("_", " ").charAt(0).toUpperCase() +
                          (assignment.status || "pending").replace("_", " ").slice(1)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <User size={16} className="text-gray-400" />
                        <span>{assignment.assignee || "Unassigned"}</span>
                      </div>
                    </TableCell>
                    <TableCell>{formatDate(assignment.due_date)}</TableCell>
                    <TableCell>{formatDate(assignment.created)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

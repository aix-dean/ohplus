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
import { Plus, MoreVertical, Edit, Trash2, Play, Pause, Calendar, Clock } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface Program {
  id: string
  name: string
  description: string
  type: "image" | "video" | "html"
  duration: number
  status: "active" | "paused" | "scheduled" | "expired"
  startDate: string
  endDate: string
  priority: number
  fileUrl?: string
  createdAt: string
  updatedAt: string
}

interface ProgramListTabProps {
  productId: string
}

export default function ProgramListTab({ productId }: ProgramListTabProps) {
  const [programs, setPrograms] = useState<Program[]>([
    {
      id: "1",
      name: "Summer Sale Campaign",
      description: "Promotional video for summer sale event",
      type: "video",
      duration: 30,
      status: "active",
      startDate: "2024-06-01",
      endDate: "2024-08-31",
      priority: 1,
      fileUrl: "/placeholder.mp4",
      createdAt: "2024-05-15",
      updatedAt: "2024-06-01",
    },
    {
      id: "2",
      name: "Brand Awareness",
      description: "Static brand image display",
      type: "image",
      duration: 15,
      status: "active",
      startDate: "2024-01-01",
      endDate: "2024-12-31",
      priority: 2,
      fileUrl: "/placeholder.jpg",
      createdAt: "2023-12-15",
      updatedAt: "2024-01-01",
    },
    {
      id: "3",
      name: "Interactive Product Demo",
      description: "HTML-based interactive product showcase",
      type: "html",
      duration: 45,
      status: "scheduled",
      startDate: "2024-09-01",
      endDate: "2024-11-30",
      priority: 3,
      createdAt: "2024-07-10",
      updatedAt: "2024-07-10",
    },
  ])

  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [selectedProgram, setSelectedProgram] = useState<Program | null>(null)
  const { toast } = useToast()

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    type: "image" as "image" | "video" | "html",
    duration: 15,
    startDate: "",
    endDate: "",
    priority: 1,
    fileUrl: "",
  })

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      type: "image",
      duration: 15,
      startDate: "",
      endDate: "",
      priority: 1,
      fileUrl: "",
    })
  }

  const handleCreate = () => {
    setIsCreateOpen(true)
    resetForm()
  }

  const handleEdit = (program: Program) => {
    setSelectedProgram(program)
    setFormData({
      name: program.name,
      description: program.description,
      type: program.type,
      duration: program.duration,
      startDate: program.startDate,
      endDate: program.endDate,
      priority: program.priority,
      fileUrl: program.fileUrl || "",
    })
    setIsEditOpen(true)
  }

  const handleDelete = (programId: string) => {
    setPrograms((prev) => prev.filter((p) => p.id !== programId))
    toast({
      title: "Program deleted",
      description: "The advertising program has been removed.",
    })
  }

  const handleToggleStatus = (programId: string) => {
    setPrograms((prev) =>
      prev.map((p) =>
        p.id === programId
          ? {
              ...p,
              status: p.status === "active" ? "paused" : "active",
              updatedAt: new Date().toISOString().split("T")[0],
            }
          : p,
      ),
    )
    toast({
      title: "Status updated",
      description: "Program status has been changed.",
    })
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (selectedProgram) {
      // Edit existing program
      setPrograms((prev) =>
        prev.map((p) =>
          p.id === selectedProgram.id
            ? {
                ...p,
                ...formData,
                updatedAt: new Date().toISOString().split("T")[0],
              }
            : p,
        ),
      )
      toast({
        title: "Program updated",
        description: "The advertising program has been updated successfully.",
      })
      setIsEditOpen(false)
    } else {
      // Create new program
      const newProgram: Program = {
        id: Date.now().toString(),
        ...formData,
        status: "scheduled",
        createdAt: new Date().toISOString().split("T")[0],
        updatedAt: new Date().toISOString().split("T")[0],
      }
      setPrograms((prev) => [...prev, newProgram])
      toast({
        title: "Program created",
        description: "New advertising program has been created successfully.",
      })
      setIsCreateOpen(false)
    }

    setSelectedProgram(null)
    resetForm()
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800"
      case "paused":
        return "bg-yellow-100 text-yellow-800"
      case "scheduled":
        return "bg-blue-100 text-blue-800"
      case "expired":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "video":
        return "🎥"
      case "image":
        return "🖼️"
      case "html":
        return "🌐"
      default:
        return "📄"
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold">Advertising Programs</h3>
          <p className="text-sm text-muted-foreground">Manage content programs for this display</p>
        </div>
        <Button onClick={handleCreate}>
          <Plus className="h-4 w-4 mr-2" />
          Add Program
        </Button>
      </div>

      {/* Programs Table */}
      <Card>
        <CardHeader>
          <CardTitle>Active Programs ({programs.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Program</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Duration</TableHead>
                <TableHead>Schedule</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Priority</TableHead>
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {programs.map((program) => (
                <TableRow key={program.id}>
                  <TableCell>
                    <div>
                      <div className="font-medium flex items-center gap-2">
                        <span>{getTypeIcon(program.type)}</span>
                        {program.name}
                      </div>
                      <div className="text-sm text-muted-foreground">{program.description}</div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{program.type.toUpperCase()}</Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {program.duration}s
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {program.startDate}
                      </div>
                      <div className="text-muted-foreground">to {program.endDate}</div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge className={getStatusColor(program.status)}>{program.status.toUpperCase()}</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary">#{program.priority}</Badge>
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleEdit(program)}>
                          <Edit className="h-4 w-4 mr-2" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleToggleStatus(program.id)}>
                          {program.status === "active" ? (
                            <>
                              <Pause className="h-4 w-4 mr-2" />
                              Pause
                            </>
                          ) : (
                            <>
                              <Play className="h-4 w-4 mr-2" />
                              Activate
                            </>
                          )}
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleDelete(program.id)} className="text-red-600">
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
        </CardContent>
      </Card>

      {/* Create Program Dialog */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Create New Program</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="name">Program Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Enter program name"
                required
              />
            </div>

            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Enter program description"
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="type">Content Type</Label>
                <Select value={formData.type} onValueChange={(value: any) => setFormData({ ...formData, type: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="image">Image</SelectItem>
                    <SelectItem value="video">Video</SelectItem>
                    <SelectItem value="html">HTML</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="duration">Duration (seconds)</Label>
                <Input
                  id="duration"
                  type="number"
                  value={formData.duration}
                  onChange={(e) => setFormData({ ...formData, duration: Number.parseInt(e.target.value) || 15 })}
                  min="1"
                  max="300"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="startDate">Start Date</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                  required
                />
              </div>

              <div>
                <Label htmlFor="endDate">End Date</Label>
                <Input
                  id="endDate"
                  type="date"
                  value={formData.endDate}
                  onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                  required
                />
              </div>
            </div>

            <div>
              <Label htmlFor="priority">Priority</Label>
              <Input
                id="priority"
                type="number"
                value={formData.priority}
                onChange={(e) => setFormData({ ...formData, priority: Number.parseInt(e.target.value) || 1 })}
                min="1"
                max="10"
              />
            </div>

            <div>
              <Label htmlFor="fileUrl">File URL</Label>
              <Input
                id="fileUrl"
                value={formData.fileUrl}
                onChange={(e) => setFormData({ ...formData, fileUrl: e.target.value })}
                placeholder="Enter file URL"
              />
            </div>

            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setIsCreateOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">Create Program</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Program Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Program</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="edit-name">Program Name</Label>
              <Input
                id="edit-name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Enter program name"
                required
              />
            </div>

            <div>
              <Label htmlFor="edit-description">Description</Label>
              <Textarea
                id="edit-description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Enter program description"
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-type">Content Type</Label>
                <Select value={formData.type} onValueChange={(value: any) => setFormData({ ...formData, type: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="image">Image</SelectItem>
                    <SelectItem value="video">Video</SelectItem>
                    <SelectItem value="html">HTML</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="edit-duration">Duration (seconds)</Label>
                <Input
                  id="edit-duration"
                  type="number"
                  value={formData.duration}
                  onChange={(e) => setFormData({ ...formData, duration: Number.parseInt(e.target.value) || 15 })}
                  min="1"
                  max="300"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-startDate">Start Date</Label>
                <Input
                  id="edit-startDate"
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                  required
                />
              </div>

              <div>
                <Label htmlFor="edit-endDate">End Date</Label>
                <Input
                  id="edit-endDate"
                  type="date"
                  value={formData.endDate}
                  onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                  required
                />
              </div>
            </div>

            <div>
              <Label htmlFor="edit-priority">Priority</Label>
              <Input
                id="edit-priority"
                type="number"
                value={formData.priority}
                onChange={(e) => setFormData({ ...formData, priority: Number.parseInt(e.target.value) || 1 })}
                min="1"
                max="10"
              />
            </div>

            <div>
              <Label htmlFor="edit-fileUrl">File URL</Label>
              <Input
                id="edit-fileUrl"
                value={formData.fileUrl}
                onChange={(e) => setFormData({ ...formData, fileUrl: e.target.value })}
                placeholder="Enter file URL"
              />
            </div>

            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setIsEditOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">Update Program</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}

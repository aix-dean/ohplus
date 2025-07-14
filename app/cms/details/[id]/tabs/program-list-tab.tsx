"use client"

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
import { Plus, Edit, Trash2, Play, Pause, Calendar } from "lucide-react"
import { toast } from "@/components/ui/use-toast"
import type { Product } from "@/lib/firebase-service"

interface Program {
  id: string
  name: string
  type: "advertising" | "content" | "emergency"
  status: "active" | "paused" | "scheduled" | "completed"
  startDate: string
  endDate: string
  duration: number
  priority: "high" | "medium" | "low"
  advertiser?: string
  description?: string
  createdAt: string
}

interface ProgramListTabProps {
  product: Product
}

export function ProgramListTab({ product }: ProgramListTabProps) {
  const [programs, setPrograms] = useState<Program[]>([
    {
      id: "1",
      name: "Summer Sale Campaign",
      type: "advertising",
      status: "active",
      startDate: "2024-06-01",
      endDate: "2024-08-31",
      duration: 30,
      priority: "high",
      advertiser: "MerryMart",
      description: "Summer promotional campaign for retail store",
      createdAt: "2024-05-15",
    },
    {
      id: "2",
      name: "Brand Awareness",
      type: "advertising",
      status: "scheduled",
      startDate: "2024-07-01",
      endDate: "2024-07-31",
      duration: 15,
      priority: "medium",
      advertiser: "Samsung",
      description: "Brand awareness campaign for new product launch",
      createdAt: "2024-06-01",
    },
    {
      id: "3",
      name: "Emergency Alert System",
      type: "emergency",
      status: "paused",
      startDate: "2024-01-01",
      endDate: "2024-12-31",
      duration: 10,
      priority: "high",
      description: "Emergency alert and notification system",
      createdAt: "2024-01-01",
    },
  ])

  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [editingProgram, setEditingProgram] = useState<Program | null>(null)
  const [programForm, setProgramForm] = useState({
    name: "",
    type: "advertising" as "advertising" | "content" | "emergency",
    startDate: "",
    endDate: "",
    duration: 30,
    priority: "medium" as "high" | "medium" | "low",
    advertiser: "",
    description: "",
  })

  const handleAddProgram = () => {
    const newProgram: Program = {
      id: Date.now().toString(),
      name: programForm.name,
      type: programForm.type,
      status: "scheduled",
      startDate: programForm.startDate,
      endDate: programForm.endDate,
      duration: programForm.duration,
      priority: programForm.priority,
      advertiser: programForm.advertiser,
      description: programForm.description,
      createdAt: new Date().toISOString(),
    }

    setPrograms((prev) => [...prev, newProgram])
    setIsAddDialogOpen(false)
    resetForm()

    toast({
      title: "Program Added",
      description: "New advertising program has been created successfully.",
    })
  }

  const handleEditProgram = (program: Program) => {
    setEditingProgram(program)
    setProgramForm({
      name: program.name,
      type: program.type,
      startDate: program.startDate,
      endDate: program.endDate,
      duration: program.duration,
      priority: program.priority,
      advertiser: program.advertiser || "",
      description: program.description || "",
    })
    setIsAddDialogOpen(true)
  }

  const handleUpdateProgram = () => {
    if (!editingProgram) return

    setPrograms((prev) =>
      prev.map((program) =>
        program.id === editingProgram.id
          ? {
              ...program,
              name: programForm.name,
              type: programForm.type,
              startDate: programForm.startDate,
              endDate: programForm.endDate,
              duration: programForm.duration,
              priority: programForm.priority,
              advertiser: programForm.advertiser,
              description: programForm.description,
            }
          : program,
      ),
    )

    setIsAddDialogOpen(false)
    setEditingProgram(null)
    resetForm()

    toast({
      title: "Program Updated",
      description: "Program has been updated successfully.",
    })
  }

  const handleDeleteProgram = (programId: string) => {
    setPrograms((prev) => prev.filter((program) => program.id !== programId))

    toast({
      title: "Program Deleted",
      description: "Program has been removed from the schedule.",
    })
  }

  const handleToggleStatus = (programId: string) => {
    setPrograms((prev) =>
      prev.map((program) =>
        program.id === programId
          ? {
              ...program,
              status: program.status === "active" ? "paused" : "active",
            }
          : program,
      ),
    )
  }

  const resetForm = () => {
    setProgramForm({
      name: "",
      type: "advertising",
      startDate: "",
      endDate: "",
      duration: 30,
      priority: "medium",
      advertiser: "",
      description: "",
    })
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800"
      case "paused":
        return "bg-yellow-100 text-yellow-800"
      case "scheduled":
        return "bg-blue-100 text-blue-800"
      case "completed":
        return "bg-gray-100 text-gray-800"
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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Program List</h2>
          <p className="text-sm text-gray-500">Manage advertising programs and content scheduling</p>
        </div>
        <Button onClick={() => setIsAddDialogOpen(true)} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Add Program
        </Button>
      </div>

      {/* Programs Table */}
      <Card>
        <CardHeader>
          <CardTitle>Active Programs</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Program Name</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Priority</TableHead>
                <TableHead>Duration</TableHead>
                <TableHead>Schedule</TableHead>
                <TableHead>Advertiser</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {programs.map((program) => (
                <TableRow key={program.id}>
                  <TableCell className="font-medium">{program.name}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="capitalize">
                      {program.type}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge className={getStatusColor(program.status)}>{program.status}</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge className={getPriorityColor(program.priority)}>{program.priority}</Badge>
                  </TableCell>
                  <TableCell>{program.duration}s</TableCell>
                  <TableCell>
                    <div className="text-sm">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {program.startDate} - {program.endDate}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>{program.advertiser || "-"}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Button variant="ghost" size="sm" onClick={() => handleToggleStatus(program.id)}>
                        {program.status === "active" ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => handleEditProgram(program)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => handleDeleteProgram(program.id)}>
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

      {/* Add/Edit Program Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editingProgram ? "Edit Program" : "Add New Program"}</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="program-name">Program Name</Label>
              <Input
                id="program-name"
                value={programForm.name}
                onChange={(e) => setProgramForm((prev) => ({ ...prev, name: e.target.value }))}
                placeholder="Enter program name"
              />
            </div>

            <div>
              <Label htmlFor="program-type">Program Type</Label>
              <Select
                value={programForm.type}
                onValueChange={(value) => setProgramForm((prev) => ({ ...prev, type: value as any }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="advertising">Advertising</SelectItem>
                  <SelectItem value="content">Content</SelectItem>
                  <SelectItem value="emergency">Emergency</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="start-date">Start Date</Label>
              <Input
                id="start-date"
                type="date"
                value={programForm.startDate}
                onChange={(e) => setProgramForm((prev) => ({ ...prev, startDate: e.target.value }))}
              />
            </div>

            <div>
              <Label htmlFor="end-date">End Date</Label>
              <Input
                id="end-date"
                type="date"
                value={programForm.endDate}
                onChange={(e) => setProgramForm((prev) => ({ ...prev, endDate: e.target.value }))}
              />
            </div>

            <div>
              <Label htmlFor="duration">Duration (seconds)</Label>
              <Input
                id="duration"
                type="number"
                value={programForm.duration}
                onChange={(e) =>
                  setProgramForm((prev) => ({ ...prev, duration: Number.parseInt(e.target.value) || 30 }))
                }
                min="1"
                max="300"
              />
            </div>

            <div>
              <Label htmlFor="priority">Priority</Label>
              <Select
                value={programForm.priority}
                onValueChange={(value) => setProgramForm((prev) => ({ ...prev, priority: value as any }))}
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

            <div className="col-span-2">
              <Label htmlFor="advertiser">Advertiser/Client</Label>
              <Input
                id="advertiser"
                value={programForm.advertiser}
                onChange={(e) => setProgramForm((prev) => ({ ...prev, advertiser: e.target.value }))}
                placeholder="Enter advertiser name"
              />
            </div>

            <div className="col-span-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={programForm.description}
                onChange={(e) => setProgramForm((prev) => ({ ...prev, description: e.target.value }))}
                placeholder="Enter program description"
                rows={3}
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 mt-6">
            <Button
              variant="outline"
              onClick={() => {
                setIsAddDialogOpen(false)
                setEditingProgram(null)
                resetForm()
              }}
            >
              Cancel
            </Button>
            <Button onClick={editingProgram ? handleUpdateProgram : handleAddProgram}>
              {editingProgram ? "Update" : "Add"} Program
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

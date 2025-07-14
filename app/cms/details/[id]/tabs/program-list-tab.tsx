"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Plus, Search, Edit, Trash2, Play, Pause, Eye } from "lucide-react"
import { collection, query, where, getDocs, addDoc, updateDoc, doc } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { toast } from "@/hooks/use-toast"

interface Program {
  id: string
  name: string
  description: string
  status: "active" | "pending" | "paused" | "completed"
  type: "video" | "image" | "text"
  duration: number
  created: any
  updated: any
  media_url?: string
  content?: string
}

interface ProgramListTabProps {
  productId: string
}

export default function ProgramListTab({ productId }: ProgramListTabProps) {
  const [programs, setPrograms] = useState<Program[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [typeFilter, setTypeFilter] = useState<string>("all")
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingProgram, setEditingProgram] = useState<Program | null>(null)
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    type: "video" as "video" | "image" | "text",
    duration: 15,
    media_url: "",
    content: "",
  })

  // Fetch programs
  useEffect(() => {
    fetchPrograms()
  }, [productId])

  const fetchPrograms = async () => {
    if (!productId) return

    setLoading(true)
    try {
      const q = query(
        collection(db, "advertising_programs"),
        where("product_id", "==", productId),
        where("deleted", "==", false),
      )
      const querySnapshot = await getDocs(q)
      const programsData = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Program[]

      setPrograms(programsData)
    } catch (error) {
      console.error("Error fetching programs:", error)
      toast({
        title: "Error",
        description: "Failed to fetch programs",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      const programData = {
        ...formData,
        product_id: productId,
        status: "pending",
        created: new Date(),
        updated: new Date(),
        deleted: false,
      }

      if (editingProgram) {
        await updateDoc(doc(db, "advertising_programs", editingProgram.id), {
          ...formData,
          updated: new Date(),
        })
        toast({
          title: "Success",
          description: "Program updated successfully",
        })
      } else {
        await addDoc(collection(db, "advertising_programs"), programData)
        toast({
          title: "Success",
          description: "Program created successfully",
        })
      }

      setDialogOpen(false)
      setEditingProgram(null)
      setFormData({
        name: "",
        description: "",
        type: "video",
        duration: 15,
        media_url: "",
        content: "",
      })
      fetchPrograms()
    } catch (error) {
      console.error("Error saving program:", error)
      toast({
        title: "Error",
        description: "Failed to save program",
        variant: "destructive",
      })
    }
  }

  const handleEdit = (program: Program) => {
    setEditingProgram(program)
    setFormData({
      name: program.name,
      description: program.description,
      type: program.type,
      duration: program.duration,
      media_url: program.media_url || "",
      content: program.content || "",
    })
    setDialogOpen(true)
  }

  const handleDelete = async (programId: string) => {
    if (!confirm("Are you sure you want to delete this program?")) return

    try {
      await updateDoc(doc(db, "advertising_programs", programId), {
        deleted: true,
        updated: new Date(),
      })
      toast({
        title: "Success",
        description: "Program deleted successfully",
      })
      fetchPrograms()
    } catch (error) {
      console.error("Error deleting program:", error)
      toast({
        title: "Error",
        description: "Failed to delete program",
        variant: "destructive",
      })
    }
  }

  const handleStatusChange = async (programId: string, newStatus: string) => {
    try {
      await updateDoc(doc(db, "advertising_programs", programId), {
        status: newStatus,
        updated: new Date(),
      })
      toast({
        title: "Success",
        description: "Program status updated",
      })
      fetchPrograms()
    } catch (error) {
      console.error("Error updating status:", error)
      toast({
        title: "Error",
        description: "Failed to update status",
        variant: "destructive",
      })
    }
  }

  const filteredPrograms = programs.filter((program) => {
    const matchesSearch =
      program.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      program.description.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === "all" || program.status === statusFilter
    const matchesType = typeFilter === "all" || program.type === typeFilter

    return matchesSearch && matchesStatus && matchesType
  })

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800 border-green-200"
      case "pending":
        return "bg-yellow-100 text-yellow-800 border-yellow-200"
      case "paused":
        return "bg-gray-100 text-gray-800 border-gray-200"
      case "completed":
        return "bg-blue-100 text-blue-800 border-blue-200"
      default:
        return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "video":
        return "🎥"
      case "image":
        return "🖼️"
      case "text":
        return "📝"
      default:
        return "📄"
    }
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-2">Loading programs...</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Advertising Programs</h2>
          <p className="text-gray-600">Manage content and campaigns for this display</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus size={16} className="mr-2" />
              Add Program
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>{editingProgram ? "Edit Program" : "Create New Program"}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Program Name</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="type">Content Type</Label>
                  <Select
                    value={formData.type}
                    onValueChange={(value: "video" | "image" | "text") => setFormData({ ...formData, type: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="video">Video</SelectItem>
                      <SelectItem value="image">Image</SelectItem>
                      <SelectItem value="text">Text</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                />
              </div>

              <div>
                <Label htmlFor="duration">Duration (seconds)</Label>
                <Input
                  id="duration"
                  type="number"
                  min="1"
                  value={formData.duration}
                  onChange={(e) => setFormData({ ...formData, duration: Number.parseInt(e.target.value) })}
                  required
                />
              </div>

              {(formData.type === "video" || formData.type === "image") && (
                <div>
                  <Label htmlFor="media_url">Media URL</Label>
                  <Input
                    id="media_url"
                    type="url"
                    value={formData.media_url}
                    onChange={(e) => setFormData({ ...formData, media_url: e.target.value })}
                    placeholder="https://example.com/media.mp4"
                  />
                </div>
              )}

              {formData.type === "text" && (
                <div>
                  <Label htmlFor="content">Text Content</Label>
                  <Textarea
                    id="content"
                    value={formData.content}
                    onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                    rows={4}
                    placeholder="Enter your text content here..."
                  />
                </div>
              )}

              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit">{editingProgram ? "Update" : "Create"} Program</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-64">
              <div className="relative">
                <Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <Input
                  placeholder="Search programs..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="paused">Paused</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
              </SelectContent>
            </Select>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="video">Video</SelectItem>
                <SelectItem value="image">Image</SelectItem>
                <SelectItem value="text">Text</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Programs Table */}
      <Card>
        <CardHeader>
          <CardTitle>Programs ({filteredPrograms.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {filteredPrograms.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500">No programs found</p>
              <p className="text-sm text-gray-400 mt-1">
                {programs.length === 0 ? "Create your first program to get started" : "Try adjusting your filters"}
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Program</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Duration</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPrograms.map((program) => (
                  <TableRow key={program.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{program.name}</div>
                        <div className="text-sm text-gray-500 truncate max-w-xs">{program.description}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span>{getTypeIcon(program.type)}</span>
                        <span className="capitalize">{program.type}</span>
                      </div>
                    </TableCell>
                    <TableCell>{program.duration}s</TableCell>
                    <TableCell>
                      <Badge className={getStatusColor(program.status)}>{program.status}</Badge>
                    </TableCell>
                    <TableCell>{program.created?.toDate?.()?.toLocaleDateString() || "Unknown"}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {program.media_url && (
                          <Button size="sm" variant="ghost" onClick={() => window.open(program.media_url, "_blank")}>
                            <Eye size={14} />
                          </Button>
                        )}
                        {program.status === "active" ? (
                          <Button size="sm" variant="ghost" onClick={() => handleStatusChange(program.id, "paused")}>
                            <Pause size={14} />
                          </Button>
                        ) : (
                          <Button size="sm" variant="ghost" onClick={() => handleStatusChange(program.id, "active")}>
                            <Play size={14} />
                          </Button>
                        )}
                        <Button size="sm" variant="ghost" onClick={() => handleEdit(program)}>
                          <Edit size={14} />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDelete(program.id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 size={14} />
                        </Button>
                      </div>
                    </TableCell>
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

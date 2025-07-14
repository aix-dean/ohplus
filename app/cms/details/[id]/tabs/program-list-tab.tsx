"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { List, Calendar, Plus, Edit, Trash2, Search } from "lucide-react"

interface ProgramListTabProps {
  productId: string
}

// Mock program data - in a real app, this would come from Firebase
const mockPrograms = [
  {
    id: "SPOT001",
    name: "Morning Slot",
    duration: "15 seconds",
    timeSlot: "06:00 AM - 12:00 PM",
    advertiser: "Coca Cola",
    price: "PHP 1,200",
    status: "Active",
    content: "Summer Campaign 2024",
    startDate: "2024-01-15",
    endDate: "2024-02-15",
  },
  {
    id: "SPOT002",
    name: "Afternoon Slot",
    duration: "30 seconds",
    timeSlot: "12:00 PM - 06:00 PM",
    advertiser: "Samsung",
    price: "PHP 1,800",
    status: "Active",
    content: "Galaxy S24 Launch",
    startDate: "2024-01-10",
    endDate: "2024-03-10",
  },
  {
    id: "SPOT003",
    name: "Evening Slot",
    duration: "15 seconds",
    timeSlot: "06:00 PM - 12:00 AM",
    advertiser: "Nike",
    price: "PHP 2,100",
    status: "Pending",
    content: "Just Do It Campaign",
    startDate: "2024-02-01",
    endDate: "2024-02-28",
  },
  {
    id: "SPOT004",
    name: "Late Night Slot",
    duration: "30 seconds",
    timeSlot: "12:00 AM - 06:00 AM",
    advertiser: "-",
    price: "PHP 900",
    status: "Available",
    content: "-",
    startDate: "-",
    endDate: "-",
  },
]

const getStatusColor = (status: string) => {
  switch (status.toLowerCase()) {
    case "active":
      return "bg-green-100 text-green-800 border-green-200"
    case "pending":
      return "bg-yellow-100 text-yellow-800 border-yellow-200"
    case "available":
      return "bg-blue-100 text-blue-800 border-blue-200"
    default:
      return "bg-gray-100 text-gray-800 border-gray-200"
  }
}

export default function ProgramListTab({ productId }: ProgramListTabProps) {
  const [viewMode, setViewMode] = useState<"list" | "calendar">("list")
  const [searchTerm, setSearchTerm] = useState("")
  const [filterStatus, setFilterStatus] = useState("all")
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)

  const filteredPrograms = mockPrograms.filter((program) => {
    const matchesSearch =
      program.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      program.advertiser.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = filterStatus === "all" || program.status.toLowerCase() === filterStatus
    return matchesSearch && matchesStatus
  })

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <List size={20} />
          <h2 className="text-xl font-semibold">Program List</h2>
        </div>
        <div className="flex gap-2">
          <Button variant={viewMode === "list" ? "default" : "outline"} size="sm" onClick={() => setViewMode("list")}>
            <List size={16} className="mr-2" />
            List
          </Button>
          <Button
            variant={viewMode === "calendar" ? "default" : "outline"}
            size="sm"
            onClick={() => setViewMode("calendar")}
          >
            <Calendar size={16} className="mr-2" />
            Calendar
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
            <Input
              placeholder="Search programs..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="available">Available</SelectItem>
          </SelectContent>
        </Select>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-blue-600 hover:bg-blue-700">
              <Plus size={16} className="mr-2" />
              Add Program
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Add New Program</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="program-name">Program Name</Label>
                <Input id="program-name" placeholder="Enter program name" />
              </div>
              <div>
                <Label htmlFor="advertiser">Advertiser</Label>
                <Input id="advertiser" placeholder="Enter advertiser name" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="duration">Duration (seconds)</Label>
                  <Input id="duration" type="number" placeholder="15" />
                </div>
                <div>
                  <Label htmlFor="price">Price (PHP)</Label>
                  <Input id="price" placeholder="1,200" />
                </div>
              </div>
              <div>
                <Label htmlFor="time-slot">Time Slot</Label>
                <Input id="time-slot" placeholder="06:00 AM - 12:00 PM" />
              </div>
              <div>
                <Label htmlFor="content">Content Description</Label>
                <Textarea id="content" placeholder="Describe the content..." />
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                  Cancel
                </Button>
                <Button className="bg-blue-600 hover:bg-blue-700">Add Program</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Program List */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Program Name</TableHead>
                <TableHead>Duration</TableHead>
                <TableHead>Time Slot</TableHead>
                <TableHead>Advertiser</TableHead>
                <TableHead>Price</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredPrograms.length > 0 ? (
                filteredPrograms.map((program) => (
                  <TableRow key={program.id}>
                    <TableCell className="font-mono text-sm">{program.id}</TableCell>
                    <TableCell className="font-medium">{program.name}</TableCell>
                    <TableCell>{program.duration}</TableCell>
                    <TableCell>{program.timeSlot}</TableCell>
                    <TableCell>{program.advertiser}</TableCell>
                    <TableCell className="font-medium">{program.price}</TableCell>
                    <TableCell>
                      <Badge className={getStatusColor(program.status)}>{program.status}</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button variant="ghost" size="sm">
                          <Edit size={14} />
                        </Button>
                        <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700">
                          <Trash2 size={14} />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-gray-500">
                    No programs found matching your criteria.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-green-600">
              {mockPrograms.filter((p) => p.status === "Active").length}
            </div>
            <div className="text-sm text-gray-500">Active Programs</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-yellow-600">
              {mockPrograms.filter((p) => p.status === "Pending").length}
            </div>
            <div className="text-sm text-gray-500">Pending Programs</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-blue-600">
              {mockPrograms.filter((p) => p.status === "Available").length}
            </div>
            <div className="text-sm text-gray-500">Available Slots</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-gray-900">
              PHP{" "}
              {mockPrograms
                .filter((p) => p.status === "Active")
                .reduce((sum, p) => sum + Number.parseInt(p.price.replace(/[^\d]/g, "")), 0)
                .toLocaleString()}
            </div>
            <div className="text-sm text-gray-500">Total Revenue</div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

"use client"

import { useState } from "react"
import Link from "next/link"
import { Search, Plus, Filter, ListFilter } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { ResponsiveTable } from "@/components/responsive-table"
import { Badge } from "@/components/ui/badge"
import { ServiceAssignmentDialog } from "@/components/service-assignment-dialog"
import { ServiceAssignmentDetailsDialog } from "@/components/service-assignment-details-dialog"

interface ServiceAssignment {
  id: string
  type: string
  site: string
  assignedTo: string
  status: "Pending" | "In Progress" | "Completed" | "Cancelled"
  dueDate: string
  priority: "High" | "Medium" | "Low"
}

const mockAssignments: ServiceAssignment[] = [
  {
    id: "SA001",
    type: "Content Update",
    site: "LED Billboard - EDSA",
    assignedTo: "Jonathan",
    status: "In Progress",
    dueDate: "2024-07-05",
    priority: "High",
  },
  {
    id: "SA002",
    type: "Maintenance Check",
    site: "Static Billboard - C5",
    assignedTo: "May",
    status: "Pending",
    dueDate: "2024-07-10",
    priority: "Medium",
  },
  {
    id: "SA003",
    type: "Installation",
    site: "Digital Kiosk - Mall A",
    assignedTo: "Chona",
    status: "Completed",
    dueDate: "2024-06-28",
    priority: "High",
  },
  {
    id: "SA004",
    type: "Repair",
    site: "LED Billboard - SLEX",
    assignedTo: "Jonathan",
    status: "Pending",
    dueDate: "2024-07-03",
    priority: "High",
  },
  {
    id: "SA005",
    type: "Content Update",
    site: "Digital Display - Airport",
    assignedTo: "May",
    status: "In Progress",
    dueDate: "2024-07-08",
    priority: "Medium",
  },
]

export default function LogisticsAssignmentsPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [filterStatus, setFilterStatus] = useState("All")
  const [filterPriority, setFilterPriority] = useState("All")
  const [isNewAssignmentDialogOpen, setIsNewAssignmentDialogOpen] = useState(false)
  const [selectedAssignment, setSelectedAssignment] = useState<ServiceAssignment | null>(null)

  const filteredAssignments = mockAssignments.filter((assignment) => {
    const matchesSearch =
      assignment.site.toLowerCase().includes(searchTerm.toLowerCase()) ||
      assignment.assignedTo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      assignment.type.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = filterStatus === "All" || assignment.status === filterStatus
    const matchesPriority = filterPriority === "All" || assignment.priority === filterPriority
    return matchesSearch && matchesStatus && matchesPriority
  })

  const columns = [
    {
      header: "ID",
      accessorKey: "id",
      cell: (info: any) => (
        <Button variant="link" className="p-0 h-auto" onClick={() => setSelectedAssignment(info.row.original)}>
          {info.getValue()}
        </Button>
      ),
    },
    { header: "Type", accessorKey: "type" },
    {
      header: "Site",
      accessorKey: "site",
      cell: (info: any) => (
        <Link
          href={`/logistics/sites/${info.row.original.site.split(" - ")[1] ? "1" : "2"}`}
          className="text-blue-600 hover:underline"
        >
          {info.getValue()}
        </Link>
      ),
    },
    { header: "Assigned To", accessorKey: "assignedTo" },
    { header: "Due Date", accessorKey: "dueDate" },
    {
      header: "Priority",
      accessorKey: "priority",
      cell: (info: any) => (
        <Badge
          variant={info.getValue() === "High" ? "destructive" : info.getValue() === "Medium" ? "secondary" : "outline"}
        >
          {info.getValue()}
        </Badge>
      ),
    },
    {
      header: "Status",
      accessorKey: "status",
      cell: (info: any) => (
        <Badge
          variant={
            info.getValue() === "Completed" ? "default" : info.getValue() === "In Progress" ? "secondary" : "outline"
          }
        >
          {info.getValue()}
        </Badge>
      ),
    },
  ]

  const handleNewAssignmentSubmit = (data: any) => {
    console.log("New Assignment Data:", data)
    // In a real app, send this to your backend
    setIsNewAssignmentDialogOpen(false)
  }

  return (
    <div className="flex-1 p-4 md:p-6">
      <div className="flex flex-col gap-6">
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <h1 className="text-xl md:text-2xl font-bold">Service Assignments</h1>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <div className="relative flex-grow">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search assignments..."
                className="w-full rounded-lg bg-background pl-8"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="flex items-center gap-2 bg-transparent">
                  <ListFilter className="h-4 w-4" /> Status: {filterStatus}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setFilterStatus("All")}>All</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setFilterStatus("Pending")}>Pending</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setFilterStatus("In Progress")}>In Progress</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setFilterStatus("Completed")}>Completed</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setFilterStatus("Cancelled")}>Cancelled</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="flex items-center gap-2 bg-transparent">
                  <Filter className="h-4 w-4" /> Priority: {filterPriority}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setFilterPriority("All")}>All</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setFilterPriority("High")}>High</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setFilterPriority("Medium")}>Medium</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setFilterPriority("Low")}>Low</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <Button size="sm" onClick={() => setIsNewAssignmentDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" /> New Assignment
            </Button>
          </div>
        </div>

        {/* Assignments Table */}
        <Card>
          <CardHeader>
            <CardTitle>All Service Assignments</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveTable data={filteredAssignments} columns={columns} />
          </CardContent>
        </Card>
      </div>

      <ServiceAssignmentDialog
        isOpen={isNewAssignmentDialogOpen}
        onClose={() => setIsNewAssignmentDialogOpen(false)}
        onSubmit={handleNewAssignmentSubmit}
      />

      {selectedAssignment && (
        <ServiceAssignmentDetailsDialog
          isOpen={!!selectedAssignment}
          onClose={() => setSelectedAssignment(null)}
          assignment={selectedAssignment}
        />
      )}
    </div>
  )
}

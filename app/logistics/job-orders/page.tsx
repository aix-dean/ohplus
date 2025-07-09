"use client"

import { useState, useEffect } from "react"
import { Search, MoreHorizontal, Plus } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { useAuth } from "@/contexts/auth-context"

interface JobOrder {
  id: string
  joNumber: string
  site: string
  dateRequested: string
  joType: "Installation" | "Maintenance" | "Repair" | "Dismantling" | "Other"
  deadline: string
  requestedBy: string
  assignedTo: string
  status: string
}

// Mock data for demonstration
const mockJobOrders: JobOrder[] = [
  {
    id: "1",
    joNumber: "JO-AUTO-GEN",
    site: "P01",
    dateRequested: "Jul 1, 2025",
    joType: "Installation",
    deadline: "Jul 2, 2025",
    requestedBy: "AIX",
    assignedTo: "Unassigned",
    status: "pending",
  },
  {
    id: "2",
    joNumber: "JO-AUTO-GEN",
    site: "P04",
    dateRequested: "Jun 27, 2025",
    joType: "Installation",
    deadline: "Jun 25, 2025",
    requestedBy: "AIX",
    assignedTo: "Unassigned",
    status: "pending",
  },
  {
    id: "3",
    joNumber: "JO-AUTO-GEN",
    site: "P04",
    dateRequested: "Jun 27, 2025",
    joType: "Repair",
    deadline: "Jun 26, 2025",
    requestedBy: "AIX",
    assignedTo: "Unassigned",
    status: "pending",
  },
  {
    id: "4",
    joNumber: "JO-AUTO-GEN",
    site: "P04",
    dateRequested: "Jun 26, 2025",
    joType: "Maintenance",
    deadline: "Jun 25, 2025",
    requestedBy: "AIX",
    assignedTo: "Unassigned",
    status: "pending",
  },
  {
    id: "5",
    joNumber: "JO-AUTO-GEN",
    site: "P04",
    dateRequested: "Jun 26, 2025",
    joType: "Maintenance",
    deadline: "Jun 26, 2025",
    requestedBy: "AIX",
    assignedTo: "Unassigned",
    status: "pending",
  },
  {
    id: "6",
    joNumber: "JO-AUTO-GEN",
    site: "P04",
    dateRequested: "Jun 26, 2025",
    joType: "Repair",
    deadline: "Jun 26, 2025",
    requestedBy: "AIX",
    assignedTo: "Unassigned",
    status: "pending",
  },
]

export default function LogisticsJobOrdersPage() {
  const { user } = useAuth()
  const [jobOrders, setJobOrders] = useState<JobOrder[]>(mockJobOrders)
  const [searchTerm, setSearchTerm] = useState("")
  const [filteredJobOrders, setFilteredJobOrders] = useState<JobOrder[]>(mockJobOrders)

  useEffect(() => {
    if (searchTerm) {
      const filtered = jobOrders.filter(
        (jobOrder) =>
          jobOrder.joNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
          jobOrder.site.toLowerCase().includes(searchTerm.toLowerCase()) ||
          jobOrder.joType.toLowerCase().includes(searchTerm.toLowerCase()) ||
          jobOrder.requestedBy.toLowerCase().includes(searchTerm.toLowerCase()) ||
          jobOrder.assignedTo.toLowerCase().includes(searchTerm.toLowerCase()),
      )
      setFilteredJobOrders(filtered)
    } else {
      setFilteredJobOrders(jobOrders)
    }
  }, [searchTerm, jobOrders])

  const getJobTypeBadgeVariant = (type: string) => {
    switch (type) {
      case "Installation":
        return "default" // Blue
      case "Maintenance":
        return "secondary" // Yellow/Gray
      case "Repair":
        return "destructive" // Red
      case "Dismantling":
        return "outline"
      default:
        return "outline"
    }
  }

  const getJobTypeBadgeClass = (type: string) => {
    switch (type) {
      case "Installation":
        return "bg-blue-100 text-blue-800 hover:bg-blue-100"
      case "Maintenance":
        return "bg-yellow-100 text-yellow-800 hover:bg-yellow-100"
      case "Repair":
        return "bg-red-100 text-red-800 hover:bg-red-100"
      case "Dismantling":
        return "bg-gray-100 text-gray-800 hover:bg-gray-100"
      default:
        return "bg-gray-100 text-gray-800 hover:bg-gray-100"
    }
  }

  const handleCreateJobOrder = () => {
    // TODO: Implement create job order functionality
    console.log("Create job order clicked")
  }

  const handleJobOrderAction = (jobOrderId: string, action: string) => {
    // TODO: Implement job order actions
    console.log(`Action ${action} for job order ${jobOrderId}`)
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Job Orders</h1>
      </div>

      {/* Search Bar */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
        <Input
          placeholder="Search job orders..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Job Orders Table */}
      <div className="bg-white rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="font-medium text-gray-900">JO #</TableHead>
              <TableHead className="font-medium text-gray-900">Site</TableHead>
              <TableHead className="font-medium text-gray-900">Date Requested</TableHead>
              <TableHead className="font-medium text-gray-900">JO Type</TableHead>
              <TableHead className="font-medium text-gray-900">Deadline</TableHead>
              <TableHead className="font-medium text-gray-900">Requested By</TableHead>
              <TableHead className="font-medium text-gray-900">Assigned To</TableHead>
              <TableHead className="font-medium text-gray-900">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredJobOrders.map((jobOrder) => (
              <TableRow key={jobOrder.id} className="hover:bg-gray-50">
                <TableCell className="font-medium text-gray-900">{jobOrder.joNumber}</TableCell>
                <TableCell className="text-gray-600">{jobOrder.site}</TableCell>
                <TableCell className="text-gray-600">{jobOrder.dateRequested}</TableCell>
                <TableCell>
                  <Badge
                    variant={getJobTypeBadgeVariant(jobOrder.joType)}
                    className={getJobTypeBadgeClass(jobOrder.joType)}
                  >
                    {jobOrder.joType}
                  </Badge>
                </TableCell>
                <TableCell className="text-gray-600">{jobOrder.deadline}</TableCell>
                <TableCell className="text-gray-600">{jobOrder.requestedBy}</TableCell>
                <TableCell>
                  <span className={`${jobOrder.assignedTo === "Unassigned" ? "text-blue-600" : "text-gray-600"}`}>
                    {jobOrder.assignedTo}
                  </span>
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => handleJobOrderAction(jobOrder.id, "view")}>
                        View Details
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleJobOrderAction(jobOrder.id, "edit")}>
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleJobOrderAction(jobOrder.id, "assign")}>
                        Assign
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => handleJobOrderAction(jobOrder.id, "delete")}
                        className="text-red-600"
                      >
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        {filteredJobOrders.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500">No job orders found.</p>
          </div>
        )}
      </div>

      {/* Floating Create Button */}
      <div className="fixed bottom-6 right-6">
        <Button
          onClick={handleCreateJobOrder}
          className="bg-blue-600 hover:bg-blue-700 text-white rounded-full px-6 py-3 shadow-lg hover:shadow-xl transition-all duration-200"
        >
          <Plus className="h-4 w-4 mr-2" />
          Create JO
        </Button>
      </div>
    </div>
  )
}

"use client"

import { useState, useEffect } from "react"
import { Search, Plus, MoreHorizontal } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { useAuth } from "@/contexts/auth-context"

// Mock data for job orders
const mockJobOrders = [
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

function getJobTypeColor(type: string) {
  switch (type.toLowerCase()) {
    case "installation":
      return "bg-blue-100 text-blue-800 hover:bg-blue-200"
    case "repair":
      return "bg-red-100 text-red-800 hover:bg-red-200"
    case "maintenance":
      return "bg-yellow-100 text-yellow-800 hover:bg-yellow-200"
    default:
      return "bg-gray-100 text-gray-800 hover:bg-gray-200"
  }
}

export default function LogisticsJobOrdersPage() {
  const { user } = useAuth()
  const [searchTerm, setSearchTerm] = useState("")
  const [jobOrders, setJobOrders] = useState(mockJobOrders)
  const [filteredJobOrders, setFilteredJobOrders] = useState(mockJobOrders)

  useEffect(() => {
    if (searchTerm) {
      const filtered = jobOrders.filter(
        (order) =>
          order.joNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
          order.site.toLowerCase().includes(searchTerm.toLowerCase()) ||
          order.joType.toLowerCase().includes(searchTerm.toLowerCase()) ||
          order.requestedBy.toLowerCase().includes(searchTerm.toLowerCase()) ||
          order.assignedTo.toLowerCase().includes(searchTerm.toLowerCase()),
      )
      setFilteredJobOrders(filtered)
    } else {
      setFilteredJobOrders(jobOrders)
    }
  }, [searchTerm, jobOrders])

  const handleCreateJO = () => {
    // Handle create job order action
    console.log("Create JO clicked")
  }

  const handleActionClick = (jobOrder: any, action: string) => {
    console.log(`${action} clicked for job order:`, jobOrder)
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">Job Orders</h1>
      </div>

      {/* Search */}
      <div className="mb-6">
        <div className="relative w-full max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search job orders..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Job Orders Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>JO #</TableHead>
                <TableHead>Site</TableHead>
                <TableHead>Date Requested</TableHead>
                <TableHead>JO Type</TableHead>
                <TableHead>Deadline</TableHead>
                <TableHead>Requested By</TableHead>
                <TableHead>Assigned To</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredJobOrders.map((order) => (
                <TableRow key={order.id}>
                  <TableCell className="font-medium">{order.joNumber}</TableCell>
                  <TableCell>{order.site}</TableCell>
                  <TableCell>{order.dateRequested}</TableCell>
                  <TableCell>
                    <Badge className={getJobTypeColor(order.joType)}>{order.joType}</Badge>
                  </TableCell>
                  <TableCell>{order.deadline}</TableCell>
                  <TableCell>{order.requestedBy}</TableCell>
                  <TableCell>
                    <span className="text-blue-600">{order.assignedTo}</span>
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleActionClick(order, "view")}>
                          View Details
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleActionClick(order, "edit")}>Edit</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleActionClick(order, "assign")}>Assign</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleActionClick(order, "complete")}>
                          Mark Complete
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleActionClick(order, "delete")} className="text-red-600">
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

      {/* Floating Create Button */}
      <div className="fixed bottom-6 right-6">
        <Button
          onClick={handleCreateJO}
          className="bg-blue-600 hover:bg-blue-700 text-white rounded-full px-6 py-3 shadow-lg"
        >
          <Plus className="h-4 w-4 mr-2" />
          Create JO
        </Button>
      </div>
    </div>
  )
}

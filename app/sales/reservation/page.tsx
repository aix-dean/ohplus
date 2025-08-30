"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Search, Plus, MoreHorizontal, Calendar, MapPin, User, Clock } from "lucide-react"

// Mock data for reservations
const mockReservations = [
  {
    id: "RES-001",
    clientName: "ABC Corporation",
    location: "Makati CBD",
    date: "2024-01-15",
    time: "09:00 AM",
    duration: "30 days",
    status: "confirmed",
    amount: "₱150,000",
    type: "Billboard",
  },
  {
    id: "RES-002",
    clientName: "XYZ Marketing",
    location: "BGC Taguig",
    date: "2024-01-20",
    time: "02:00 PM",
    duration: "60 days",
    status: "pending",
    amount: "₱280,000",
    type: "LED Display",
  },
  {
    id: "RES-003",
    clientName: "Tech Solutions Inc",
    location: "Ortigas Center",
    date: "2024-01-25",
    time: "10:30 AM",
    duration: "45 days",
    status: "draft",
    amount: "₱200,000",
    type: "Transit Ad",
  },
  {
    id: "RES-004",
    clientName: "Fashion Brand Co",
    location: "Mall of Asia",
    date: "2024-02-01",
    time: "11:00 AM",
    duration: "90 days",
    status: "cancelled",
    amount: "₱350,000",
    type: "Digital Billboard",
  },
]

const getStatusColor = (status: string) => {
  switch (status) {
    case "confirmed":
      return "bg-green-100 text-green-800"
    case "pending":
      return "bg-yellow-100 text-yellow-800"
    case "draft":
      return "bg-gray-100 text-gray-800"
    case "cancelled":
      return "bg-red-100 text-red-800"
    default:
      return "bg-gray-100 text-gray-800"
  }
}

export default function ReservationPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [typeFilter, setTypeFilter] = useState("all")

  const filteredReservations = mockReservations.filter((reservation) => {
    const matchesSearch =
      reservation.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      reservation.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      reservation.location.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === "all" || reservation.status === statusFilter
    const matchesType = typeFilter === "all" || reservation.type === typeFilter

    return matchesSearch && matchesStatus && matchesType
  })

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto p-4 md:p-6 lg:p-8">
        {/* Header Section */}
        <div className="mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-2xl font-semibold text-gray-900">Reservations</h1>
              <p className="text-sm text-gray-600 mt-1">Manage advertising space reservations</p>
            </div>
            <Button className="mt-4 sm:mt-0">
              <Plus className="h-4 w-4 mr-2" />
              New Reservation
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <Card className="border-gray-200 shadow-sm rounded-xl">
            <CardContent className="p-5">
              <div className="flex items-center">
                <Calendar className="h-8 w-8 text-blue-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Reservations</p>
                  <p className="text-2xl font-semibold text-gray-900">24</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-gray-200 shadow-sm rounded-xl">
            <CardContent className="p-5">
              <div className="flex items-center">
                <Clock className="h-8 w-8 text-green-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Confirmed</p>
                  <p className="text-2xl font-semibold text-gray-900">18</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-gray-200 shadow-sm rounded-xl">
            <CardContent className="p-5">
              <div className="flex items-center">
                <User className="h-8 w-8 text-yellow-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Pending</p>
                  <p className="text-2xl font-semibold text-gray-900">4</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-gray-200 shadow-sm rounded-xl">
            <CardContent className="p-5">
              <div className="flex items-center">
                <MapPin className="h-8 w-8 text-purple-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Locations</p>
                  <p className="text-2xl font-semibold text-gray-900">12</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search and Filters */}
        <Card className="border-gray-200 shadow-sm rounded-xl mb-6">
          <CardContent className="p-5">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search reservations..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 border-gray-200 focus:border-blue-500 focus:ring-blue-500"
                />
              </div>

              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full sm:w-[180px] border-gray-200">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="confirmed">Confirmed</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>

              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-full sm:w-[180px] border-gray-200">
                  <SelectValue placeholder="Filter by type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="Billboard">Billboard</SelectItem>
                  <SelectItem value="LED Display">LED Display</SelectItem>
                  <SelectItem value="Transit Ad">Transit Ad</SelectItem>
                  <SelectItem value="Digital Billboard">Digital Billboard</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Reservations Table */}
        <Card className="border-gray-200 shadow-sm overflow-hidden rounded-xl">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50 border-b border-gray-200">
                <TableHead className="py-3 font-medium text-gray-900">Reservation ID</TableHead>
                <TableHead className="py-3 font-medium text-gray-900">Client</TableHead>
                <TableHead className="py-3 font-medium text-gray-900">Location</TableHead>
                <TableHead className="py-3 font-medium text-gray-900">Date & Time</TableHead>
                <TableHead className="py-3 font-medium text-gray-900">Duration</TableHead>
                <TableHead className="py-3 font-medium text-gray-900">Type</TableHead>
                <TableHead className="py-3 font-medium text-gray-900">Amount</TableHead>
                <TableHead className="py-3 font-medium text-gray-900">Status</TableHead>
                <TableHead className="py-3 font-medium text-gray-900">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredReservations.map((reservation) => (
                <TableRow key={reservation.id} className="hover:bg-gray-50 transition-colors">
                  <TableCell className="py-3 font-medium text-blue-600">{reservation.id}</TableCell>
                  <TableCell className="py-3">
                    <div>
                      <p className="font-medium text-gray-900">{reservation.clientName}</p>
                    </div>
                  </TableCell>
                  <TableCell className="py-3">
                    <div className="flex items-center">
                      <MapPin className="h-4 w-4 text-gray-400 mr-2" />
                      <span className="text-gray-900">{reservation.location}</span>
                    </div>
                  </TableCell>
                  <TableCell className="py-3">
                    <div>
                      <p className="text-gray-900">{reservation.date}</p>
                      <p className="text-sm text-gray-500">{reservation.time}</p>
                    </div>
                  </TableCell>
                  <TableCell className="py-3 text-gray-900">{reservation.duration}</TableCell>
                  <TableCell className="py-3">
                    <Badge variant="outline" className="border-gray-200">
                      {reservation.type}
                    </Badge>
                  </TableCell>
                  <TableCell className="py-3 font-medium text-gray-900">{reservation.amount}</TableCell>
                  <TableCell className="py-3">
                    <Badge className={getStatusColor(reservation.status)}>
                      {reservation.status.charAt(0).toUpperCase() + reservation.status.slice(1)}
                    </Badge>
                  </TableCell>
                  <TableCell className="py-3">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem>View Details</DropdownMenuItem>
                        <DropdownMenuItem>Edit Reservation</DropdownMenuItem>
                        <DropdownMenuItem>Send Confirmation</DropdownMenuItem>
                        <DropdownMenuItem className="text-red-600">Cancel Reservation</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      </div>
    </div>
  )
}

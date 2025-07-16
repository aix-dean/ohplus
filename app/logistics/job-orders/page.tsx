"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { format } from "date-fns"
import {
  Search,
  Plus,
  MoreHorizontal,
  Eye,
  Edit,
  Trash2,
  Calendar,
  User,
  MapPin,
  Clock,
  AlertCircle,
  Package,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useAuth } from "@/contexts/auth-context"
import { getJobOrdersByCompanyId } from "@/lib/job-order-service"
import type { JobOrder } from "@/lib/types/job-order"

export default function JobOrdersPage() {
  const router = useRouter()
  const { user, userData } = useAuth()
  const [jobOrders, setJobOrders] = useState<JobOrder[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [typeFilter, setTypeFilter] = useState<string>("all")

  useEffect(() => {
    const fetchJobOrders = async () => {
      try {
        setLoading(true)
        setError(null)

        console.log("DEBUG: Auth state - user:", !!user, "userData:", !!userData)

        if (!user) {
          console.log("DEBUG: No user found")
          setError("Please log in to view job orders")
          return
        }

        if (!userData?.company_id) {
          console.log("DEBUG: No company_id found in userData:", userData)
          setError("Company information not found. Please contact support.")
          return
        }

        console.log("DEBUG: Fetching job orders for company_id:", userData.company_id)

        const { jobOrders: fetchedJobOrders } = await getJobOrdersByCompanyId(userData.company_id)

        console.log("DEBUG: Fetched job orders:", fetchedJobOrders)
        setJobOrders(fetchedJobOrders || [])
      } catch (err) {
        console.error("DEBUG: Error fetching job orders:", err)
        setError("Failed to load job orders. Please try again.")
      } finally {
        setLoading(false)
      }
    }

    fetchJobOrders()
  }, [user, userData])

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case "completed":
        return "bg-green-100 text-green-800 border-green-200"
      case "pending":
        return "bg-yellow-100 text-yellow-800 border-yellow-200"
      case "approved":
        return "bg-blue-100 text-blue-800 border-blue-200"
      case "rejected":
        return "bg-red-100 text-red-800 border-red-200"
      case "cancelled":
        return "bg-gray-100 text-gray-800 border-gray-200"
      default:
        return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  const getTypeColor = (type: string) => {
    switch (type?.toLowerCase()) {
      case "installation":
        return "bg-blue-100 text-blue-800 border-blue-200"
      case "maintenance":
        return "bg-yellow-100 text-yellow-800 border-yellow-200"
      case "repair":
        return "bg-red-100 text-red-800 border-red-200"
      case "dismantling":
        return "bg-gray-100 text-gray-800 border-gray-200"
      default:
        return "bg-purple-100 text-purple-800 border-purple-200"
    }
  }

  const filteredJobOrders = (jobOrders || []).filter((jobOrder) => {
    const matchesSearch =
      jobOrder.joNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      jobOrder.siteName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      jobOrder.requestedBy?.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesStatus = statusFilter === "all" || jobOrder.status === statusFilter
    const matchesType = typeFilter === "all" || jobOrder.joType === typeFilter

    return matchesSearch && matchesStatus && matchesType
  })

  const formatDate = (dateValue: any) => {
    if (!dateValue) return "N/A"

    try {
      let date: Date

      if (dateValue instanceof Date) {
        date = dateValue
      } else if (typeof dateValue === "string") {
        date = new Date(dateValue)
      } else if (dateValue.toDate && typeof dateValue.toDate === "function") {
        date = dateValue.toDate()
      } else {
        return "N/A"
      }

      return format(date, "MMM dd, yyyy")
    } catch (error) {
      console.error("Error formatting date:", error)
      return "N/A"
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-64px)]">
        <div className="flex items-center space-x-2">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="text-lg">Loading job orders...</span>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-64px)] p-4 text-center">
        <AlertCircle className="h-12 w-12 text-red-500 mb-4" />
        <h2 className="text-xl font-semibold mb-2">Error Loading Job Orders</h2>
        <p className="text-gray-600 mb-4">{error}</p>
        <Button onClick={() => window.location.reload()}>Try Again</Button>

        {/* Debug Information (only in development) */}
        {process.env.NODE_ENV === "development" && (
          <div className="mt-8 p-4 bg-gray-100 rounded-lg text-left text-sm">
            <h3 className="font-semibold mb-2">Debug Information:</h3>
            <p>User: {user ? "✓ Authenticated" : "✗ Not authenticated"}</p>
            <p>User ID: {user?.uid || "N/A"}</p>
            <p>Company ID: {userData?.company_id || "N/A"}</p>
            <p>User Data: {userData ? "✓ Available" : "✗ Not available"}</p>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="flex flex-col min-h-screen bg-white p-4 md:p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <h1 className="text-2xl font-bold text-gray-900">Job Orders</h1>
          <Badge variant="secondary">
            <Package className="h-3 w-3 mr-1" />
            Logistics
          </Badge>
        </div>
        <Button onClick={() => router.push("/logistics/job-orders/create")}>
          <Plus className="h-4 w-4 mr-2" />
          Create JO
        </Button>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Search job orders..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex gap-2">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="approved">Approved</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="rejected">Rejected</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="Installation">Installation</SelectItem>
              <SelectItem value="Maintenance">Maintenance</SelectItem>
              <SelectItem value="Repair">Repair</SelectItem>
              <SelectItem value="Dismantling">Dismantling</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Job Orders List */}
      {filteredJobOrders.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <Package className="h-12 w-12 text-gray-400 mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            {(jobOrders || []).length === 0 ? "No job orders found" : "No matching job orders"}
          </h3>
          <p className="text-gray-600 mb-4">
            {(jobOrders || []).length === 0
              ? "No job orders have been created yet."
              : "Try adjusting your search or filter criteria."}
          </p>
          {(jobOrders || []).length === 0 && (
            <Button onClick={() => router.push("/logistics/job-orders/create")}>
              <Plus className="h-4 w-4 mr-2" />
              Create Your First Job Order
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredJobOrders.map((jobOrder) => (
            <Card key={jobOrder.id} className="hover:shadow-md transition-shadow cursor-pointer">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-base font-semibold text-blue-600 mb-1">{jobOrder.joNumber}</CardTitle>
                    <p className="text-sm text-gray-600">{jobOrder.siteName}</p>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => router.push(`/logistics/job-orders/${jobOrder.id}`)}>
                        <Eye className="h-4 w-4 mr-2" />
                        View Details
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        <Edit className="h-4 w-4 mr-2" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem className="text-red-600">
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                  <Badge variant="outline" className={`${getStatusColor(jobOrder.status)} border font-medium`}>
                    {jobOrder.status}
                  </Badge>
                  <Badge variant="outline" className={`${getTypeColor(jobOrder.joType)} border font-medium`}>
                    {jobOrder.joType}
                  </Badge>
                </div>

                <div className="space-y-2 text-sm">
                  <div className="flex items-center text-gray-600">
                    <MapPin className="h-3 w-3 mr-2" />
                    <span className="truncate">{jobOrder.siteLocation || jobOrder.siteCode || "N/A"}</span>
                  </div>
                  <div className="flex items-center text-gray-600">
                    <User className="h-3 w-3 mr-2" />
                    <span>Requested by {jobOrder.requestedBy}</span>
                  </div>
                  <div className="flex items-center text-gray-600">
                    <Calendar className="h-3 w-3 mr-2" />
                    <span>{formatDate(jobOrder.dateRequested)}</span>
                  </div>
                  <div className="flex items-center text-gray-600">
                    <Clock className="h-3 w-3 mr-2" />
                    <span>Due: {formatDate(jobOrder.deadline)}</span>
                  </div>
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  className="w-full mt-3 bg-transparent"
                  onClick={() => router.push(`/logistics/job-orders/${jobOrder.id}`)}
                >
                  View Details
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}

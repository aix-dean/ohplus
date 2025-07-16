"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/contexts/auth-context"
import { getJobOrdersByCompanyId } from "@/lib/job-order-service"
import type { JobOrder } from "@/lib/types/job-order"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Search, Plus, MoreHorizontal, Eye, Edit, UserCheck } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { useRouter } from "next/navigation"
import Link from "next/link"

export default function LogisticsJobOrdersPage() {
  const { user } = useAuth()
  const router = useRouter()
  const [jobOrders, setJobOrders] = useState<JobOrder[]>([])
  const [filteredJobOrders, setFilteredJobOrders] = useState<JobOrder[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")

  useEffect(() => {
    if (user?.company_id) {
      fetchJobOrders()
    }
  }, [user])

  useEffect(() => {
    filterJobOrders()
  }, [searchTerm, jobOrders])

  const fetchJobOrders = async () => {
    try {
      setLoading(true)
      if (user?.company_id) {
        const orders = await getJobOrdersByCompanyId(user.company_id)
        setJobOrders(orders)
      }
    } catch (error) {
      console.error("Error fetching job orders:", error)
    } finally {
      setLoading(false)
    }
  }

  const filterJobOrders = () => {
    if (!searchTerm) {
      setFilteredJobOrders(jobOrders)
      return
    }

    const filtered = jobOrders.filter(
      (order) =>
        order.joNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.siteName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.joType.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.requestedBy.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.assignTo.toLowerCase().includes(searchTerm.toLowerCase()),
    )
    setFilteredJobOrders(filtered)
  }

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case "completed":
        return "default"
      case "pending":
        return "secondary"
      case "in_progress":
        return "outline"
      case "cancelled":
        return "destructive"
      default:
        return "secondary"
    }
  }

  const getTypeBadgeColor = (type: string) => {
    switch (type.toLowerCase()) {
      case "installation":
        return "bg-blue-100 text-blue-800"
      case "maintenance":
        return "bg-green-100 text-green-800"
      case "repair":
        return "bg-red-100 text-red-800"
      case "dismantling":
        return "bg-orange-100 text-orange-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const formatDate = (timestamp: any) => {
    if (!timestamp) return "N/A"

    let date: Date
    if (timestamp.toDate) {
      date = timestamp.toDate()
    } else if (timestamp instanceof Date) {
      date = timestamp
    } else {
      date = new Date(timestamp)
    }

    return date.toLocaleDateString()
  }

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Job Orders</h1>
          <p className="text-muted-foreground">Manage and track job orders for your company</p>
        </div>
        <Button onClick={() => router.push("/logistics/job-orders/create")} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Create Job Order
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Search job orders..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="text-sm text-muted-foreground">
              {filteredJobOrders.length} of {jobOrders.length} job orders
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filteredJobOrders.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">No job orders found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-2 font-medium">JO Number</th>
                    <th className="text-left p-2 font-medium">Site Name</th>
                    <th className="text-left p-2 font-medium">Type</th>
                    <th className="text-left p-2 font-medium">Requested By</th>
                    <th className="text-left p-2 font-medium">Assigned To</th>
                    <th className="text-left p-2 font-medium">Date Requested</th>
                    <th className="text-left p-2 font-medium">Deadline</th>
                    <th className="text-left p-2 font-medium">Status</th>
                    <th className="text-left p-2 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredJobOrders.map((order) => (
                    <tr key={order.id} className="border-b hover:bg-muted/50">
                      <td className="p-2">
                        <Link
                          href={`/logistics/job-orders/${order.id}`}
                          className="font-medium text-primary hover:underline"
                        >
                          {order.joNumber}
                        </Link>
                      </td>
                      <td className="p-2">{order.siteName}</td>
                      <td className="p-2">
                        <Badge className={getTypeBadgeColor(order.joType)}>{order.joType}</Badge>
                      </td>
                      <td className="p-2">{order.requestedBy}</td>
                      <td className="p-2">{order.assignTo}</td>
                      <td className="p-2">{formatDate(order.dateRequested)}</td>
                      <td className="p-2">{formatDate(order.deadline)}</td>
                      <td className="p-2">
                        <Badge variant={getStatusBadgeVariant(order.status)}>{order.status.replace("_", " ")}</Badge>
                      </td>
                      <td className="p-2">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => router.push(`/logistics/job-orders/${order.id}`)}>
                              <Eye className="h-4 w-4 mr-2" />
                              View Details
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => router.push(`/logistics/job-orders/${order.id}/edit`)}>
                              <Edit className="h-4 w-4 mr-2" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <UserCheck className="h-4 w-4 mr-2" />
                              Assign
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

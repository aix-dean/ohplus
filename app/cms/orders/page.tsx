"use client"

import { Input } from "@/components/ui/input"

import { useEffect } from "react"
import Link from "next/link"
import { Search, Plus, Filter, ListFilter } from "lucide-react"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { useToast } from "@/hooks/use-toast"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { ResponsiveTable } from "@/components/responsive-table"
import { Badge } from "@/components/ui/badge"

interface Order {
  id: string
  client: string
  campaign: string
  status: string
  amount: number
  date: string
}

const mockOrdersData: Order[] = [
  { id: "ORD001", client: "Acme Corp", campaign: "Summer Sale", status: "Pending", amount: 15000, date: "2024-06-28" },
  {
    id: "ORD002",
    client: "Globex Inc.",
    campaign: "Brand Launch",
    status: "Completed",
    amount: 25000,
    date: "2024-06-25",
  },
  {
    id: "ORD003",
    client: "Soylent Corp",
    campaign: "Holiday Promo",
    status: "Cancelled",
    amount: 10000,
    date: "2024-06-20",
  },
  { id: "ORD004", client: "Initech", campaign: "Q3 Campaign", status: "Pending", amount: 18000, date: "2024-06-18" },
  {
    id: "ORD005",
    client: "Umbrella Corp",
    campaign: "New Year Ad",
    status: "Completed",
    amount: 30000,
    date: "2024-06-15",
  },
  {
    id: "ORD006",
    client: "Cyberdyne Systems",
    campaign: "Product X Launch",
    status: "Pending",
    amount: 22000,
    date: "2024-06-10",
  },
]

export default function CMSOrdersPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [filterStatus, setFilterStatus] = useState("All")
  const [filterCampaign, setFilterCampaign] = useState("All")
  const [orders, setOrders] = useState<Order[]>(mockOrdersData)
  const [filteredOrders, setFilteredOrders] = useState<Order[]>(mockOrdersData)
  const [loading, setLoading] = useState(false)
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const [detailsOpen, setDetailsOpen] = useState(false)
  const [approvalDialogOpen, setApprovalDialogOpen] = useState(false)
  const [rejectionReason, setRejectionReason] = useState("")
  const [approvalAction, setApprovalAction] = useState<"approve" | "reject" | null>(null)
  const [approvalRole, setApprovalRole] = useState<"admin" | "sales" | null>(null)
  const [processingApproval, setProcessingApproval] = useState(false)

  const { user } = useAuth()
  const router = useRouter()
  const { toast } = useToast()

  // Filter orders
  useEffect(() => {
    let result = [...orders]

    // Apply search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase()
      result = result.filter(
        (order) =>
          order.client.toLowerCase().includes(term) ||
          order.campaign.toLowerCase().includes(term) ||
          order.id.toLowerCase().includes(term),
      )
    }

    // Apply status filter
    if (filterStatus !== "All") {
      result = result.filter((order) => order.status === filterStatus)
    }

    // Apply campaign filter
    if (filterCampaign !== "All") {
      result = result.filter((order) => order.campaign === filterCampaign)
    }

    setFilteredOrders(result)
  }, [orders, searchTerm, filterStatus, filterCampaign])

  const columns = [
    {
      header: "Order ID",
      accessorKey: "id",
      cell: (info: any) => (
        <Link href={`/cms/details/${info.getValue()}`} className="text-blue-600 hover:underline">
          {info.getValue()}
        </Link>
      ),
    },
    { header: "Client", accessorKey: "client" },
    { header: "Campaign", accessorKey: "campaign" },
    {
      header: "Status",
      accessorKey: "status",
      cell: (info: any) => (
        <Badge
          variant={
            info.getValue() === "Completed" ? "default" : info.getValue() === "Pending" ? "secondary" : "destructive"
          }
        >
          {info.getValue()}
        </Badge>
      ),
    },
    { header: "Amount", accessorKey: "amount", cell: (info: any) => `$${info.getValue().toLocaleString()}` },
    { header: "Date", accessorKey: "date" },
  ]

  // Handle view details
  const handleViewDetails = (order: Order) => {
    setSelectedOrder(order)
    setDetailsOpen(true)
  }

  // Open approval dialog
  const handleApprovalAction = (order: Order, action: "approve" | "reject", role: "admin" | "sales") => {
    setSelectedOrder(order)
    setApprovalAction(action)
    setApprovalRole(role)
    setRejectionReason("")
    setApprovalDialogOpen(true)
  }

  // Process approval or rejection
  const processApprovalAction = async () => {
    if (!selectedOrder || !approvalAction || !approvalRole) return

    setProcessingApproval(true)

    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000))

      // Update order in state
      const updatedOrders = orders.map((order) => {
        if (order.id === selectedOrder.id) {
          const updatedOrder = { ...order }

          // Update approval status
          if (approvalAction === "approve") {
            updatedOrder.status = "Completed"
          } else {
            updatedOrder.status = "Cancelled"
          }

          return updatedOrder
        }
        return order
      })

      setOrders(updatedOrders)

      toast({
        title: `Order ${approvalAction === "approve" ? "Approved" : "Rejected"}`,
        description: `You have successfully ${approvalAction === "approve" ? "approved" : "rejected"} the order.`,
      })

      setApprovalDialogOpen(false)
      setSelectedOrder(null)
      setApprovalAction(null)
      setApprovalRole(null)
    } catch (error) {
      console.error("Error processing approval:", error)
      toast({
        title: "Error",
        description: "Failed to process your action. Please try again.",
        variant: "destructive",
      })
    } finally {
      setProcessingApproval(false)
    }
  }

  return (
    <div className="flex-1 p-4 md:p-6">
      <div className="flex flex-col gap-6">
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <h1 className="text-xl md:text-2xl font-bold">Content Orders</h1>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <div className="relative flex-grow">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search orders..."
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
                <DropdownMenuItem onClick={() => setFilterStatus("Completed")}>Completed</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setFilterStatus("Cancelled")}>Cancelled</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="flex items-center gap-2 bg-transparent">
                  <Filter className="h-4 w-4" /> Campaign: {filterCampaign}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setFilterCampaign("All")}>All</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setFilterCampaign("Summer Sale")}>Summer Sale</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setFilterCampaign("Brand Launch")}>Brand Launch</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setFilterCampaign("Holiday Promo")}>Holiday Promo</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setFilterCampaign("Q3 Campaign")}>Q3 Campaign</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <Button size="sm" asChild>
              <Link href="/sales/job-orders/create">
                <Plus className="mr-2 h-4 w-4" /> New Order
              </Link>
            </Button>
          </div>
        </div>

        {/* Orders Table */}
        <Card>
          <CardHeader>
            <CardTitle>All Content Orders</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveTable data={filteredOrders} columns={columns} />
          </CardContent>
        </Card>
      </div>

      {/* Order Details Dialog */}
      <div
        className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50 hidden"
        style={{ display: detailsOpen ? "flex" : "none" }}
      >
        {selectedOrder && (
          <div className="bg-white p-6 rounded-lg w-full max-w-3xl">
            <h2 className="text-2xl font-bold mb-4">{selectedOrder.campaign}</h2>
            <p className="text-gray-600 mb-2">Client: {selectedOrder.client}</p>
            <p className="text-gray-600 mb-2">Order ID: {selectedOrder.id}</p>
            <p className="text-gray-600 mb-2">Status: {selectedOrder.status}</p>
            <p className="text-gray-600 mb-2">Amount: ${selectedOrder.amount.toLocaleString()}</p>
            <p className="text-gray-600 mb-2">Date: {selectedOrder.date}</p>
            <div className="mt-6 flex justify-end">
              <Button variant="outline" onClick={() => setDetailsOpen(false)}>
                Close
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Approval/Rejection Dialog */}
      <div
        className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50 hidden"
        style={{ display: approvalDialogOpen ? "flex" : "none" }}
      >
        {selectedOrder && approvalAction && approvalRole && (
          <div className="bg-white p-6 rounded-lg w-full max-w-md">
            <h2 className="text-2xl font-bold mb-4">{approvalAction === "approve" ? "Approve" : "Reject"} Order</h2>
            <p className="text-gray-600 mb-4">
              {approvalAction === "approve"
                ? "Confirm that you want to approve this order."
                : "Please provide a reason for rejecting this order."}
            </p>
            <p className="text-gray-600 mb-2">Order ID: {selectedOrder.id}</p>
            <p className="text-gray-600 mb-2">Client: {selectedOrder.client}</p>
            <p className="text-gray-600 mb-2">Campaign: {selectedOrder.campaign}</p>
            {approvalAction === "reject" && (
              <div className="mt-4">
                <label htmlFor="rejection-reason" className="block text-sm font-medium mb-2">
                  Reason for Rejection
                </label>
                <textarea
                  id="rejection-reason"
                  className="w-full p-2 border rounded-md"
                  rows={3}
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder="Please explain why you are rejecting this order..."
                  required
                />
              </div>
            )}
            <div className="mt-6 flex justify-end">
              <Button variant="outline" onClick={() => setApprovalDialogOpen(false)}>
                Cancel
              </Button>
              <Button
                onClick={processApprovalAction}
                disabled={(approvalAction === "reject" && !rejectionReason.trim()) || processingApproval}
                className={
                  approvalAction === "approve" ? "bg-green-600 hover:bg-green-700" : "bg-red-600 hover:bg-red-700"
                }
              >
                {processingApproval && <span className="mr-2">Processing...</span>}
                {approvalAction === "approve" ? "Approve" : "Reject"}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

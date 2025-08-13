"use client"

import { useState, useEffect } from "react"
import { useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Plus, Search, Package, HardDrive, Wrench, Package2, Edit, Trash2, Eye } from "lucide-react"
import Link from "next/link"

interface InventoryItem {
  id: string
  name: string
  category: string
  inventory_type: "assets" | "tools" | "consumables"
  quantity: number
  unit: string
  location: string
  status: "available" | "in-use" | "maintenance" | "retired"
  last_updated: string
  assigned_to?: string
  serial_number?: string
  purchase_date?: string
  warranty_expiry?: string
  cost?: number
}

const mockInventoryData: InventoryItem[] = [
  {
    id: "1",
    name: "Dell OptiPlex 7090",
    category: "Desktop Computer",
    inventory_type: "assets",
    quantity: 5,
    unit: "units",
    location: "IT Storage Room A",
    status: "available",
    last_updated: "2024-01-15",
    serial_number: "DL7090001",
    purchase_date: "2024-01-10",
    warranty_expiry: "2027-01-10",
    cost: 45000,
  },
  {
    id: "2",
    name: "Phillips Head Screwdriver Set",
    category: "Hand Tools",
    inventory_type: "tools",
    quantity: 10,
    unit: "sets",
    location: "Tool Cabinet B",
    status: "available",
    last_updated: "2024-01-14",
    cost: 1500,
  },
  {
    id: "3",
    name: "Ethernet Cable Cat6",
    category: "Network Cables",
    inventory_type: "consumables",
    quantity: 50,
    unit: "meters",
    location: "Supply Room C",
    status: "available",
    last_updated: "2024-01-13",
    cost: 25,
  },
  {
    id: "4",
    name: "HP LaserJet Pro M404n",
    category: "Printer",
    inventory_type: "assets",
    quantity: 2,
    unit: "units",
    location: "Office Floor 2",
    status: "in-use",
    last_updated: "2024-01-12",
    assigned_to: "John Doe",
    serial_number: "HP404001",
    purchase_date: "2023-12-15",
    warranty_expiry: "2026-12-15",
    cost: 18000,
  },
  {
    id: "5",
    name: "Network Tester",
    category: "Testing Equipment",
    inventory_type: "tools",
    quantity: 3,
    unit: "units",
    location: "Tool Cabinet A",
    status: "available",
    last_updated: "2024-01-11",
    cost: 8500,
  },
  {
    id: "6",
    name: "Thermal Paste",
    category: "Computer Maintenance",
    inventory_type: "consumables",
    quantity: 20,
    unit: "tubes",
    location: "Supply Room A",
    status: "available",
    last_updated: "2024-01-10",
    cost: 150,
  },
]

const getInventoryTypeIcon = (type: string) => {
  switch (type) {
    case "assets":
      return <HardDrive className="h-4 w-4" />
    case "tools":
      return <Wrench className="h-4 w-4" />
    case "consumables":
      return <Package2 className="h-4 w-4" />
    default:
      return <Package className="h-4 w-4" />
  }
}

const getInventoryTypeBadgeColor = (type: string) => {
  switch (type) {
    case "assets":
      return "bg-blue-100 text-blue-800"
    case "tools":
      return "bg-green-100 text-green-800"
    case "consumables":
      return "bg-orange-100 text-orange-800"
    default:
      return "bg-gray-100 text-gray-800"
  }
}

const getStatusBadgeColor = (status: string) => {
  switch (status) {
    case "available":
      return "bg-green-100 text-green-800"
    case "in-use":
      return "bg-blue-100 text-blue-800"
    case "maintenance":
      return "bg-yellow-100 text-yellow-800"
    case "retired":
      return "bg-red-100 text-red-800"
    default:
      return "bg-gray-100 text-gray-800"
  }
}

export default function InventoryPage() {
  const searchParams = useSearchParams()
  const typeFilter = searchParams.get("type")

  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [inventoryTypeFilter, setInventoryTypeFilter] = useState(typeFilter || "all")
  const [filteredData, setFilteredData] = useState<InventoryItem[]>(mockInventoryData)

  useEffect(() => {
    if (typeFilter) {
      setInventoryTypeFilter(typeFilter)
    }
  }, [typeFilter])

  useEffect(() => {
    let filtered = mockInventoryData

    if (searchTerm) {
      filtered = filtered.filter(
        (item) =>
          item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          item.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
          item.location.toLowerCase().includes(searchTerm.toLowerCase()),
      )
    }

    if (statusFilter !== "all") {
      filtered = filtered.filter((item) => item.status === statusFilter)
    }

    if (inventoryTypeFilter !== "all") {
      filtered = filtered.filter((item) => item.inventory_type === inventoryTypeFilter)
    }

    setFilteredData(filtered)
  }, [searchTerm, statusFilter, inventoryTypeFilter])

  const totalItems = mockInventoryData.length
  const assetsCount = mockInventoryData.filter((item) => item.inventory_type === "assets").length
  const toolsCount = mockInventoryData.filter((item) => item.inventory_type === "tools").length
  const consumablesCount = mockInventoryData.filter((item) => item.inventory_type === "consumables").length
  const availableItems = mockInventoryData.filter((item) => item.status === "available").length

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">IT Inventory Management</h1>
          <p className="text-muted-foreground">Manage and track IT assets, tools, and consumables</p>
        </div>
        <Link href="/it/inventory/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Add New Item
          </Button>
        </Link>
      </div>

      {/* Statistics Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Items</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalItems}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Assets</CardTitle>
            <HardDrive className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{assetsCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tools</CardTitle>
            <Wrench className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{toolsCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Consumables</CardTitle>
            <Package2 className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{consumablesCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Available</CardTitle>
            <Package className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{availableItems}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search items..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>
            <Select value={inventoryTypeFilter} onValueChange={setInventoryTypeFilter}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Inventory Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="assets">Assets</SelectItem>
                <SelectItem value="tools">Tools</SelectItem>
                <SelectItem value="consumables">Consumables</SelectItem>
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="available">Available</SelectItem>
                <SelectItem value="in-use">In Use</SelectItem>
                <SelectItem value="maintenance">Maintenance</SelectItem>
                <SelectItem value="retired">Retired</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Inventory Table */}
      <Card>
        <CardHeader>
          <CardTitle>Inventory Items</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Item Name</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Quantity</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Last Updated</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredData.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">{item.name}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {getInventoryTypeIcon(item.inventory_type)}
                        <Badge className={getInventoryTypeBadgeColor(item.inventory_type)}>{item.inventory_type}</Badge>
                      </div>
                    </TableCell>
                    <TableCell>{item.category}</TableCell>
                    <TableCell>
                      {item.quantity} {item.unit}
                    </TableCell>
                    <TableCell>{item.location}</TableCell>
                    <TableCell>
                      <Badge className={getStatusBadgeColor(item.status)}>{item.status}</Badge>
                    </TableCell>
                    <TableCell>{item.last_updated}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Link href={`/it/inventory/${item.id}`}>
                          <Button variant="ghost" size="sm">
                            <Eye className="h-4 w-4" />
                          </Button>
                        </Link>
                        <Link href={`/it/inventory/edit/${item.id}`}>
                          <Button variant="ghost" size="sm">
                            <Edit className="h-4 w-4" />
                          </Button>
                        </Link>
                        <Button variant="ghost" size="sm" className="text-red-600">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

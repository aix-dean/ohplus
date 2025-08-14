"use client"

import { useState } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Plus,
  Search,
  Package,
  HardDrive,
  Wrench,
  Package2,
  Edit,
  Eye,
  AlertTriangle,
  CheckCircle,
  Clock,
} from "lucide-react"
import Link from "next/link"

interface InventoryItem {
  id: string
  name: string
  category: string
  inventory_type: "assets" | "tools" | "consumables"
  status: "available" | "in-use" | "maintenance" | "retired"
  location: string
  quantity: number
  unit_price: number
  purchase_date: string
  warranty_expiry?: string
  assigned_to?: string
  specifications?: string
}

const mockInventoryData: InventoryItem[] = [
  {
    id: "1",
    name: "Dell OptiPlex 7090",
    category: "Desktop Computer",
    inventory_type: "assets",
    status: "in-use",
    location: "Office Floor 2",
    quantity: 1,
    unit_price: 45000,
    purchase_date: "2023-01-15",
    warranty_expiry: "2026-01-15",
    assigned_to: "John Doe",
    specifications: "Intel i7, 16GB RAM, 512GB SSD",
  },
  {
    id: "2",
    name: "Network Cable Tester",
    category: "Testing Equipment",
    inventory_type: "tools",
    status: "available",
    location: "IT Storage Room",
    quantity: 2,
    unit_price: 3500,
    purchase_date: "2023-03-10",
    specifications: "RJ45/RJ11 Cable Tester",
  },
  {
    id: "3",
    name: "CAT6 Ethernet Cable",
    category: "Networking",
    inventory_type: "consumables",
    status: "available",
    location: "IT Storage Room",
    quantity: 50,
    unit_price: 150,
    purchase_date: "2023-06-20",
    specifications: "1 meter length, blue color",
  },
  {
    id: "4",
    name: "HP LaserJet Pro",
    category: "Printer",
    inventory_type: "assets",
    status: "maintenance",
    location: "Office Floor 1",
    quantity: 1,
    unit_price: 25000,
    purchase_date: "2022-08-15",
    warranty_expiry: "2025-08-15",
    specifications: "Monochrome laser printer",
  },
  {
    id: "5",
    name: "Screwdriver Set",
    category: "Hand Tools",
    inventory_type: "tools",
    status: "available",
    location: "IT Storage Room",
    quantity: 3,
    unit_price: 800,
    purchase_date: "2023-02-05",
    specifications: "Phillips and flathead, various sizes",
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

const getStatusIcon = (status: string) => {
  switch (status) {
    case "available":
      return <CheckCircle className="h-4 w-4 text-green-500" />
    case "in-use":
      return <Clock className="h-4 w-4 text-blue-500" />
    case "maintenance":
      return <AlertTriangle className="h-4 w-4 text-yellow-500" />
    case "retired":
      return <AlertTriangle className="h-4 w-4 text-red-500" />
    default:
      return <Package className="h-4 w-4" />
  }
}

const getStatusBadgeVariant = (status: string) => {
  switch (status) {
    case "available":
      return "default"
    case "in-use":
      return "secondary"
    case "maintenance":
      return "destructive"
    case "retired":
      return "outline"
    default:
      return "default"
  }
}

export default function ITInventoryPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [inventoryData, setInventoryData] = useState<InventoryItem[]>(mockInventoryData)

  const typeFilter = searchParams.get("type") || "all"

  // Filter data based on search term, status, and type
  const filteredData = inventoryData.filter((item) => {
    const matchesSearch =
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.location.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesStatus = statusFilter === "all" || item.status === statusFilter
    const matchesType = typeFilter === "all" || item.inventory_type === typeFilter

    return matchesSearch && matchesStatus && matchesType
  })

  // Calculate statistics
  const totalItems = inventoryData.length
  const assetsCount = inventoryData.filter((item) => item.inventory_type === "assets").length
  const toolsCount = inventoryData.filter((item) => item.inventory_type === "tools").length
  const consumablesCount = inventoryData.filter((item) => item.inventory_type === "consumables").length
  const availableCount = inventoryData.filter((item) => item.status === "available").length

  const getTypeDisplayName = (type: string) => {
    switch (type) {
      case "assets":
        return "Assets"
      case "tools":
        return "Tools"
      case "consumables":
        return "Consumables"
      default:
        return "All Items"
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">IT Inventory</h1>
          <p className="text-muted-foreground">
            {typeFilter !== "all"
              ? `Manage your ${getTypeDisplayName(typeFilter).toLowerCase()}`
              : "Manage your IT assets, tools, and consumables"}
          </p>
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

        <Card className={typeFilter === "assets" ? "ring-2 ring-blue-500" : ""}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Assets</CardTitle>
            <HardDrive className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{assetsCount}</div>
          </CardContent>
        </Card>

        <Card className={typeFilter === "tools" ? "ring-2 ring-orange-500" : ""}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tools</CardTitle>
            <Wrench className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{toolsCount}</div>
          </CardContent>
        </Card>

        <Card className={typeFilter === "consumables" ? "ring-2 ring-green-500" : ""}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Consumables</CardTitle>
            <Package2 className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{consumablesCount}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Available</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{availableCount}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
          <CardDescription>Filter and search your inventory items</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4 md:flex-row md:items-center">
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

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="available">Available</SelectItem>
                <SelectItem value="in-use">In Use</SelectItem>
                <SelectItem value="maintenance">Maintenance</SelectItem>
                <SelectItem value="retired">Retired</SelectItem>
              </SelectContent>
            </Select>

            <Select
              value={typeFilter}
              onValueChange={(value) => {
                if (value === "all") {
                  router.push("/it/inventory")
                } else {
                  router.push(`/it/inventory?type=${value}`)
                }
              }}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="assets">Assets</SelectItem>
                <SelectItem value="tools">Tools</SelectItem>
                <SelectItem value="consumables">Consumables</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Inventory Table */}
      <Card>
        <CardHeader>
          <CardTitle>
            {typeFilter !== "all" ? getTypeDisplayName(typeFilter) : "All Items"}
            <Badge variant="secondary" className="ml-2">
              {filteredData.length} items
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Item</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Quantity</TableHead>
                <TableHead>Value</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredData.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>
                    <div>
                      <div className="font-medium">{item.name}</div>
                      <div className="text-sm text-muted-foreground">{item.category}</div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {getInventoryTypeIcon(item.inventory_type)}
                      <Badge
                        variant="outline"
                        className={
                          item.inventory_type === "assets"
                            ? "border-blue-200 text-blue-700"
                            : item.inventory_type === "tools"
                              ? "border-orange-200 text-orange-700"
                              : "border-green-200 text-green-700"
                        }
                      >
                        {item.inventory_type}
                      </Badge>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {getStatusIcon(item.status)}
                      <Badge variant={getStatusBadgeVariant(item.status)}>{item.status}</Badge>
                    </div>
                  </TableCell>
                  <TableCell>{item.location}</TableCell>
                  <TableCell>{item.quantity}</TableCell>
                  <TableCell>₱{item.unit_price.toLocaleString()}</TableCell>
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
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {filteredData.length === 0 && (
            <div className="text-center py-8">
              <Package className="mx-auto h-12 w-12 text-muted-foreground" />
              <h3 className="mt-2 text-sm font-semibold text-gray-900">No items found</h3>
              <p className="mt-1 text-sm text-muted-foreground">Try adjusting your search or filter criteria.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

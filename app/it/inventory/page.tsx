"use client"

import { useState, useEffect } from "react"
import { useSearchParams } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Plus, Search, Filter, Package, HardDrive, Wrench, Package2, Edit, Eye } from "lucide-react"
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
  model?: string
  manufacturer?: string
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
    model: "OptiPlex 7090",
    manufacturer: "Dell",
  },
  {
    id: "2",
    name: "Network Cable Tester",
    category: "Testing Equipment",
    inventory_type: "tools",
    quantity: 2,
    unit: "units",
    location: "Tool Cabinet B",
    status: "available",
    last_updated: "2024-01-10",
    model: "NT-100",
    manufacturer: "TechTools",
  },
  {
    id: "3",
    name: "Ethernet Cables (Cat6)",
    category: "Networking",
    inventory_type: "consumables",
    quantity: 50,
    unit: "meters",
    location: "Supply Closet C",
    status: "available",
    last_updated: "2024-01-12",
  },
  {
    id: "4",
    name: "HP LaserJet Pro 4025n",
    category: "Printer",
    inventory_type: "assets",
    quantity: 3,
    unit: "units",
    location: "Office Floor 2",
    status: "in-use",
    last_updated: "2024-01-08",
    assigned_to: "Marketing Department",
    serial_number: "HP4025001",
    model: "LaserJet Pro 4025n",
    manufacturer: "HP",
  },
  {
    id: "5",
    name: "Screwdriver Set",
    category: "Hand Tools",
    inventory_type: "tools",
    quantity: 3,
    unit: "sets",
    location: "Tool Cabinet A",
    status: "available",
    last_updated: "2024-01-05",
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

const getInventoryTypeBadge = (type: string) => {
  const variants = {
    assets: "default",
    tools: "secondary",
    consumables: "outline",
  } as const

  return (
    <Badge variant={variants[type as keyof typeof variants] || "default"} className="flex items-center gap-1">
      {getInventoryTypeIcon(type)}
      {type.charAt(0).toUpperCase() + type.slice(1)}
    </Badge>
  )
}

const getStatusBadge = (status: string) => {
  const variants = {
    available: "default",
    "in-use": "secondary",
    maintenance: "destructive",
    retired: "outline",
  } as const

  return <Badge variant={variants[status as keyof typeof variants] || "default"}>{status}</Badge>
}

export default function ITInventoryPage() {
  const searchParams = useSearchParams()
  const typeFilter = searchParams.get("type")

  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [inventoryTypeFilter, setInventoryTypeFilter] = useState<string>(typeFilter || "all")
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

  const getStatistics = () => {
    const stats = {
      total: mockInventoryData.length,
      assets: mockInventoryData.filter((item) => item.inventory_type === "assets").length,
      tools: mockInventoryData.filter((item) => item.inventory_type === "tools").length,
      consumables: mockInventoryData.filter((item) => item.inventory_type === "consumables").length,
      available: mockInventoryData.filter((item) => item.status === "available").length,
      inUse: mockInventoryData.filter((item) => item.status === "in-use").length,
      maintenance: mockInventoryData.filter((item) => item.status === "maintenance").length,
    }
    return stats
  }

  const stats = getStatistics()

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">IT Inventory</h1>
          <p className="text-muted-foreground">Manage your IT assets, tools, and consumables</p>
        </div>
        <Link href="/it/inventory/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Add New Item
          </Button>
        </Link>
      </div>

      {/* Statistics Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Items</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground">All inventory items</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Assets</CardTitle>
            <HardDrive className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.assets}</div>
            <p className="text-xs text-muted-foreground">Hardware & equipment</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tools</CardTitle>
            <Wrench className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.tools}</div>
            <p className="text-xs text-muted-foreground">Maintenance tools</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Consumables</CardTitle>
            <Package2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.consumables}</div>
            <p className="text-xs text-muted-foreground">Supplies & materials</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Inventory Items</CardTitle>
          <CardDescription>Search and filter your inventory items</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
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
              <SelectTrigger className="w-[180px]">
                <Filter className="mr-2 h-4 w-4" />
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
              <SelectTrigger className="w-[180px]">
                <Filter className="mr-2 h-4 w-4" />
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

          {/* Table */}
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Quantity</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Last Updated</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredData.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">{item.name}</TableCell>
                    <TableCell>{getInventoryTypeBadge(item.inventory_type)}</TableCell>
                    <TableCell>{item.category}</TableCell>
                    <TableCell>
                      {item.quantity} {item.unit}
                    </TableCell>
                    <TableCell>{item.location}</TableCell>
                    <TableCell>{getStatusBadge(item.status)}</TableCell>
                    <TableCell>{item.last_updated}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
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
          </div>

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

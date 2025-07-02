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

interface InventoryItem {
  id: string
  name: string
  type: string
  status: string
  location: string
  lastMaintenance: string
  nextMaintenance: string
}

const mockInventoryData: InventoryItem[] = [
  {
    id: "1",
    name: "LED Billboard - EDSA",
    type: "LED Billboard",
    status: "Active",
    location: "EDSA, Mandaluyong City",
    lastMaintenance: "2024-05-10",
    nextMaintenance: "2025-05-10",
  },
  {
    id: "2",
    name: "Static Billboard - C5",
    type: "Static Billboard",
    status: "Under Maintenance",
    location: "C5 Road, Taguig City",
    lastMaintenance: "2024-06-01",
    nextMaintenance: "2024-06-15",
  },
  {
    id: "3",
    name: "Digital Kiosk - Mall A",
    type: "Digital Kiosk",
    status: "Active",
    location: "SM Megamall, Mandaluyong City",
    lastMaintenance: "2024-04-20",
    nextMaintenance: "2025-04-20",
  },
  {
    id: "4",
    name: "LED Billboard - SLEX",
    type: "LED Billboard",
    status: "Inactive",
    location: "SLEX, Laguna",
    lastMaintenance: "2023-12-01",
    nextMaintenance: "N/A",
  },
  {
    id: "5",
    name: "Digital Display - Airport",
    type: "Digital Display",
    status: "Active",
    location: "NAIA Terminal 3, Pasay City",
    lastMaintenance: "2024-05-25",
    nextMaintenance: "2025-05-25",
  },
]

export default function InventoryPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [filterStatus, setFilterStatus] = useState("All")
  const [filterType, setFilterType] = useState("All")

  const filteredInventory = mockInventoryData.filter((item) => {
    const matchesSearch =
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.location.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = filterStatus === "All" || item.status === filterStatus
    const matchesType = filterType === "All" || item.type === filterType
    return matchesSearch && matchesStatus && matchesType
  })

  const columns = [
    {
      header: "Item Name",
      accessorKey: "name",
      cell: (info: any) => (
        <Link href={`/admin/inventory/${info.row.original.id}`} className="text-blue-600 hover:underline">
          {info.getValue()}
        </Link>
      ),
    },
    { header: "Type", accessorKey: "type" },
    {
      header: "Status",
      accessorKey: "status",
      cell: (info: any) => (
        <Badge
          variant={
            info.getValue() === "Active" ? "default" : info.getValue() === "Under Maintenance" ? "secondary" : "outline"
          }
        >
          {info.getValue()}
        </Badge>
      ),
    },
    { header: "Location", accessorKey: "location" },
    { header: "Last Maintenance", accessorKey: "lastMaintenance" },
    { header: "Next Maintenance", accessorKey: "nextMaintenance" },
  ]

  return (
    <div className="flex-1 p-4 md:p-6">
      <div className="flex flex-col gap-6">
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <h1 className="text-xl md:text-2xl font-bold">Inventory Management</h1>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <div className="relative flex-grow">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search inventory..."
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
                <DropdownMenuItem onClick={() => setFilterStatus("Active")}>Active</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setFilterStatus("Inactive")}>Inactive</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setFilterStatus("Under Maintenance")}>
                  Under Maintenance
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setFilterStatus("Damaged")}>Damaged</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="flex items-center gap-2 bg-transparent">
                  <Filter className="h-4 w-4" /> Type: {filterType}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setFilterType("All")}>All</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setFilterType("LED Billboard")}>LED Billboard</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setFilterType("Static Billboard")}>Static Billboard</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setFilterType("Digital Display")}>Digital Display</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setFilterType("Digital Kiosk")}>Digital Kiosk</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <Button size="sm" asChild>
              <Link href="/admin/products/create">
                <Plus className="mr-2 h-4 w-4" /> Add Item
              </Link>
            </Button>
          </div>
        </div>

        {/* Inventory Table */}
        <Card>
          <CardHeader>
            <CardTitle>All Inventory Items</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveTable data={filteredInventory} columns={columns} />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

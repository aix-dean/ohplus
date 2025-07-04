"use client"

import { useState } from "react"
import Link from "next/link"
import { PlusCircle, ListFilter, MoreHorizontal, FileDown, Package } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { ResponsiveTable } from "@/components/responsive-table" // Assuming this component exists

export default function InventoryPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [filterStatus, setFilterStatus] = useState("all")

  const inventoryItems = [
    {
      id: "INV001",
      name: "LED Billboard - EDSA",
      status: "Active",
      type: "LED",
      location: "EDSA, Mandaluyong",
      lastMaintenance: "2024-06-15",
    },
    {
      id: "INV002",
      name: "Static Billboard - C5",
      status: "Inactive",
      type: "Static",
      location: "C5, Taguig",
      lastMaintenance: "2024-05-20",
    },
    {
      id: "INV003",
      name: "Digital Kiosk - Makati",
      status: "Active",
      type: "Digital",
      location: "Makati CBD",
      lastMaintenance: "2024-07-01",
    },
    {
      id: "INV004",
      name: "LED Billboard - SLEX",
      status: "Maintenance",
      type: "LED",
      location: "SLEX, Laguna",
      lastMaintenance: "2024-07-03",
    },
  ]

  const filteredItems = inventoryItems.filter((item) => {
    const matchesSearch =
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.id.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = filterStatus === "all" || item.status.toLowerCase() === filterStatus.toLowerCase()
    return matchesSearch && matchesStatus
  })

  return (
    <div className="grid flex-1 items-start gap-4 p-4 sm:px-6 sm:py-0 md:gap-8">
      <Tabs defaultValue="all">
        <div className="flex items-center">
          <TabsList>
            <TabsTrigger value="all" onClick={() => setFilterStatus("all")}>
              All
            </TabsTrigger>
            <TabsTrigger value="active" onClick={() => setFilterStatus("active")}>
              Active
            </TabsTrigger>
            <TabsTrigger value="inactive" onClick={() => setFilterStatus("inactive")}>
              Inactive
            </TabsTrigger>
            <TabsTrigger value="maintenance" onClick={() => setFilterStatus("maintenance")}>
              Maintenance
            </TabsTrigger>
          </TabsList>
          <div className="ml-auto flex items-center gap-2">
            <Input
              type="search"
              placeholder="Search inventory..."
              className="w-full max-w-xs"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="h-8 gap-1 bg-transparent">
                  <ListFilter className="h-3.5 w-3.5" />
                  <span className="sr-only sm:not-sr-only">Filter</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Filter by Status</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuCheckboxItem
                  checked={filterStatus === "all"}
                  onCheckedChange={() => setFilterStatus("all")}
                >
                  All
                </DropdownMenuCheckboxItem>
                <DropdownMenuCheckboxItem
                  checked={filterStatus === "active"}
                  onCheckedChange={() => setFilterStatus("active")}
                >
                  Active
                </DropdownMenuCheckboxItem>
                <DropdownMenuCheckboxItem
                  checked={filterStatus === "inactive"}
                  onCheckedChange={() => setFilterStatus("inactive")}
                >
                  Inactive
                </DropdownMenuCheckboxItem>
                <DropdownMenuCheckboxItem
                  checked={filterStatus === "maintenance"}
                  onCheckedChange={() => setFilterStatus("maintenance")}
                >
                  Maintenance
                </DropdownMenuCheckboxItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <Button size="sm" variant="outline" className="h-8 gap-1 bg-transparent">
              <FileDown className="h-3.5 w-3.5" />
              <span className="sr-only sm:not-sr-only">Export</span>
            </Button>
            <Link href="/admin/inventory/create" passHref>
              <Button size="sm" className="h-8 gap-1">
                <PlusCircle className="h-3.5 w-3.5" />
                <span className="sr-only sm:not-sr-only">Add Site</span>
              </Button>
            </Link>
          </div>
        </div>
        <TabsContent value="all">
          <Card x-chunk="dashboard-06-chunk-0">
            <CardHeader>
              <CardTitle>Inventory</CardTitle>
              <CardDescription>Manage your billboard sites and other inventory items.</CardDescription>
            </CardHeader>
            <CardContent>
              {filteredItems.length > 0 ? (
                <ResponsiveTable>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="hidden w-[100px] sm:table-cell">
                          <span className="sr-only">Image</span>
                        </TableHead>
                        <TableHead>ID</TableHead>
                        <TableHead>Name</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="hidden md:table-cell">Type</TableHead>
                        <TableHead className="hidden md:table-cell">Location</TableHead>
                        <TableHead className="hidden md:table-cell">Last Maintenance</TableHead>
                        <TableHead>
                          <span className="sr-only">Actions</span>
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredItems.map((item) => (
                        <TableRow key={item.id}>
                          <TableCell className="hidden sm:table-cell">
                            {/* Placeholder for image */}
                            <div className="aspect-square w-16 rounded-md object-cover bg-muted" />
                          </TableCell>
                          <TableCell className="font-medium">{item.id}</TableCell>
                          <TableCell>{item.name}</TableCell>
                          <TableCell>
                            <Badge
                              variant={
                                item.status === "Active"
                                  ? "default"
                                  : item.status === "Maintenance"
                                    ? "secondary"
                                    : "outline"
                              }
                            >
                              {item.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="hidden md:table-cell">{item.type}</TableCell>
                          <TableCell className="hidden md:table-cell">{item.location}</TableCell>
                          <TableCell className="hidden md:table-cell">{item.lastMaintenance}</TableCell>
                          <TableCell>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button aria-haspopup="true" size="icon" variant="ghost">
                                  <MoreHorizontal className="h-4 w-4" />
                                  <span className="sr-only">Toggle menu</span>
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                <DropdownMenuItem asChild>
                                  <Link href={`/admin/inventory/edit/${item.id}`}>Edit</Link>
                                </DropdownMenuItem>
                                <DropdownMenuItem>Delete</DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </ResponsiveTable>
              ) : (
                <div className="flex flex-col items-center justify-center p-4 text-center">
                  <Package className="h-12 w-12 text-muted-foreground" />
                  <h3 className="mt-4 text-lg font-semibold">No inventory items found</h3>
                  <p className="mb-4 text-sm text-muted-foreground">
                    You can start adding inventory items as soon as you add a new site.
                  </p>
                  <Link href="/admin/inventory/create" passHref>
                    <Button className="mt-4">
                      <PlusCircle className="mr-2 h-4 w-4" />
                      Add New Site
                    </Button>
                  </Link>
                </div>
              )}
            </CardContent>
            <CardFooter>
              <div className="text-xs text-muted-foreground">
                Showing <strong>{filteredItems.length}</strong> of <strong>{inventoryItems.length}</strong> products
              </div>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Card for the tour target - "Add New Site" */}
      <Card className="flex flex-col items-center justify-center p-6 text-center" data-tour-id="add-site-card">
        <PlusCircle className="h-16 w-16 text-blue-500 mb-4" />
        <CardTitle className="text-xl font-bold mb-2">Add Your First Site</CardTitle>
        <CardDescription className="text-muted-foreground mb-4">
          Click the button below to set up your first billboard location.
        </CardDescription>
        <Link href="/admin/inventory/create" passHref>
          <Button size="lg">
            <PlusCircle className="mr-2 h-5 w-5" />
            Add New Site
          </Button>
        </Link>
      </Card>
    </div>
  )
}

"use client"

import { useState } from "react"
import Link from "next/link"
import { PlusCircle, Package } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

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
    <div className="flex flex-col gap-4 p-4 md:gap-8 md:p-6">
      <div className="flex items-center">
        <h1 className="font-semibold text-lg md:text-2xl">Inventory</h1>
        <Button asChild className="ml-auto gap-1">
          <Link href="/admin/inventory/create">
            <PlusCircle className="h-4 w-4" />
            Add Site
          </Link>
        </Button>
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {/* Placeholder for "Add New Site" card for the tour */}
        <Card className="flex flex-col items-center justify-center p-6 text-center" data-tour-id="add-site-card">
          <CardHeader>
            <CardTitle>Add New Site</CardTitle>
            <CardDescription>Click to add a new billboard or digital display site to your inventory.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild size="lg">
              <Link href="/admin/inventory/create">
                <PlusCircle className="h-6 w-6 mr-2" />
                Add Site
              </Link>
            </Button>
          </CardContent>
        </Card>
        {/* Existing inventory list would go here */}
        {filteredItems.length > 0 ? (
          filteredItems.map((item) => (
            <Card key={item.id}>
              <CardHeader>
                <CardTitle>{item.name}</CardTitle>
                <CardDescription>Location: {item.location}</CardDescription>
              </CardHeader>
              <CardContent>
                <p>Status: {item.status}</p>
              </CardContent>
            </Card>
          ))
        ) : (
          <Card className="flex flex-col items-center justify-center p-6 text-center">
            <Package className="h-16 w-16 text-muted-foreground mb-4" />
            <h3 className="mt-4 text-lg font-semibold">No inventory items found</h3>
            <p className="mb-4 text-sm text-muted-foreground">
              You can start adding inventory items as soon as you add a new site.
            </p>
            <Link href="/admin/inventory/create" passHref>
              <Button size="lg">
                <PlusCircle className="mr-2 h-5 w-5" />
                Add New Site
              </Button>
            </Link>
          </Card>
        )}
      </div>
    </div>
  )
}

"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { ResponsiveCardGrid } from "@/components/responsive-card-grid"
import { Search, Plus, Filter } from "lucide-react"
import Link from "next/link"

// Mock data for inventory items
const inventoryItems = [
  {
    id: "1",
    name: "EDSA Billboard Site A",
    location: "EDSA, Mandaluyong",
    type: "LED Billboard",
    status: "Active",
    imageUrl: "/led-billboard-1.png",
  },
  {
    id: "2",
    name: "BGC Digital Display",
    location: "Bonifacio Global City, Taguig",
    type: "Digital Display",
    status: "Active",
    imageUrl: "/led-billboard-2.png",
  },
  {
    id: "3",
    name: "Cebu Roadside Billboard",
    location: "Cebu City",
    type: "Static Billboard",
    status: "Maintenance",
    imageUrl: "/roadside-billboard.png",
  },
  {
    id: "4",
    name: "Davao LED Screen",
    location: "Davao City",
    type: "LED Screen",
    status: "Active",
    imageUrl: "/led-billboard-3.png",
  },
  {
    id: "5",
    name: "Makati Flyover Billboard",
    location: "Makati City",
    type: "Static Billboard",
    status: "Booked",
    imageUrl: "/led-billboard-4.png",
  },
]

export default function AdminInventoryPage() {
  const [searchTerm, setSearchTerm] = useState("")

  const filteredItems = inventoryItems.filter(
    (item) =>
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.type.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Inventory Management</h1>
          <p className="text-muted-foreground">Manage your outdoor advertising sites and assets.</p>
        </div>
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search inventory..."
              className="w-full rounded-lg bg-background pl-8"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Button variant="outline">
            <Filter className="h-4 w-4" />
          </Button>
          <Link href="/admin/products/create" passHref>
            <Button data-tour-id="add-site-button">
              <Plus className="mr-2 h-4 w-4" />
              Add Site
            </Button>
          </Link>
        </div>
      </div>

      {/* Inventory Grid */}
      <ResponsiveCardGrid>
        {filteredItems.map((item) => (
          <Link key={item.id} href={`/admin/inventory/${item.id}`} passHref>
            <Card className="flex flex-col overflow-hidden cursor-pointer hover:shadow-lg transition-shadow h-full">
              <div className="relative w-full h-48 bg-muted">
                {item.imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={item.imageUrl || "/placeholder.svg"}
                    alt={item.name}
                    className="object-cover w-full h-full"
                    width={400}
                    height={200}
                  />
                ) : (
                  <div className="flex items-center justify-center w-full h-full text-muted-foreground">No Image</div>
                )}
              </div>
              <CardHeader>
                <CardTitle className="text-lg">{item.name}</CardTitle>
                <CardDescription className="text-sm">{item.location}</CardDescription>
              </CardHeader>
              <CardContent className="flex-grow">
                <div className="flex justify-between items-center text-sm">
                  <span className="font-medium">{item.type}</span>
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-semibold ${
                      item.status === "Active"
                        ? "bg-green-100 text-green-800"
                        : item.status === "Booked"
                          ? "bg-blue-100 text-blue-800"
                          : "bg-yellow-100 text-yellow-800"
                    }`}
                  >
                    {item.status}
                  </span>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
        {filteredItems.length === 0 && (
          <div className="col-span-full text-center text-muted-foreground py-8">No inventory items found.</div>
        )}
      </ResponsiveCardGrid>
    </div>
  )
}

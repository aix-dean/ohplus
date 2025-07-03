"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { SearchIcon, PlusIcon } from "lucide-react"
import { ResponsiveCardGrid } from "@/components/responsive-card-grid"
import { ResponsiveTable } from "@/components/responsive-table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useDebounce } from "@/hooks/use-debounce"
import { useToast } from "@/hooks/use-toast"
import { Skeleton } from "@/components/ui/skeleton"
import { useTour } from "@/contexts/tour-context" // Import useTour

// Mock data for demonstration
const mockInventoryItems = [
  {
    id: "1",
    name: "EDSA Billboard - Northbound",
    type: "LED Billboard",
    location: "EDSA, Quezon City",
    status: "Active",
    size: "10m x 20m",
    lastMaintenance: "2024-05-10",
  },
  {
    id: "2",
    name: "C5 Flyover - Southbound",
    type: "Static Billboard",
    location: "C5, Taguig City",
    status: "Under Maintenance",
    size: "12m x 24m",
    lastMaintenance: "2024-06-01",
  },
  {
    id: "3",
    name: "Makati Ave. Digital Screen",
    type: "Digital Screen",
    location: "Makati Avenue, Makati City",
    status: "Active",
    size: "5m x 3m",
    lastMaintenance: "2024-04-20",
  },
  {
    id: "4",
    name: "BGC High Street LED",
    type: "LED Billboard",
    location: "Bonifacio Global City, Taguig",
    status: "Active",
    size: "8m x 15m",
    lastMaintenance: "2024-05-25",
  },
  {
    id: "5",
    name: "Ortigas Center Static",
    type: "Static Billboard",
    location: "Ortigas Center, Pasig City",
    status: "Inactive",
    size: "15m x 30m",
    lastMaintenance: "2023-11-15",
  },
]

const inventoryColumns = [
  {
    accessorKey: "name",
    header: "Name",
  },
  {
    accessorKey: "type",
    header: "Type",
  },
  {
    accessorKey: "location",
    header: "Location",
  },
  {
    accessorKey: "status",
    header: "Status",
  },
  {
    accessorKey: "size",
    header: "Size",
  },
  {
    accessorKey: "lastMaintenance",
    header: "Last Maintenance",
  },
]

export default function AdminInventoryPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [loading, setLoading] = useState(true)
  const [inventoryItems, setInventoryItems] = useState<typeof mockInventoryItems>([])
  const debouncedSearchTerm = useDebounce(searchTerm, 500)
  const { toast } = useToast()
  const { activeStep } = useTour() // Get active tour step

  useEffect(() => {
    const fetchInventory = async () => {
      setLoading(true)
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000))
      const filteredItems = mockInventoryItems.filter(
        (item) =>
          item.name.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
          item.location.toLowerCase().includes(debouncedSearchTerm.toLowerCase()),
      )
      setInventoryItems(filteredItems)
      setLoading(false)
    }

    fetchInventory()
  }, [debouncedSearchTerm])

  const handleAddProduct = () => {
    toast({
      title: "Add Product",
      description: "Navigating to product creation page...",
    })
    // Simulate navigation
    console.log("Navigate to /admin/products/create")
  }

  return (
    <div className="flex flex-col gap-4 p-4 md:gap-8 md:p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Inventory Management</h1>
        <Button onClick={handleAddProduct} data-tour-id="add-site-button">
          {" "}
          {/* Tour target */}
          <PlusIcon className="mr-2 h-4 w-4" />
          Add Site
        </Button>
      </div>

      <div className="relative">
        <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400" />
        <Input
          type="text"
          placeholder="Search inventory..."
          className="pl-10 pr-4 py-2 rounded-md border border-gray-200 dark:border-gray-800 focus:ring-blue-500 focus:border-blue-500 w-full"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <Tabs defaultValue="table">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="table">Table View</TabsTrigger>
          <TabsTrigger value="card">Card View</TabsTrigger>
        </TabsList>
        <TabsContent value="table">
          <Card>
            <CardHeader>
              <CardTitle>All Inventory Items</CardTitle>
              <CardDescription>Manage your outdoor advertising sites.</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <Skeleton className="h-[300px] w-full rounded-md" />
              ) : (
                <ResponsiveTable data={inventoryItems} columns={inventoryColumns} />
              )}
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="card">
          <Card>
            <CardHeader>
              <CardTitle>All Inventory Items</CardTitle>
              <CardDescription>Manage your outdoor advertising sites.</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {[...Array(6)].map((_, i) => (
                    <Skeleton key={i} className="h-[150px] w-full rounded-md" />
                  ))}
                </div>
              ) : (
                <ResponsiveCardGrid
                  data={inventoryItems}
                  renderCard={(item) => (
                    <Card key={item.id} className="flex flex-col">
                      <CardHeader>
                        <CardTitle>{item.name}</CardTitle>
                        <CardDescription>{item.type}</CardDescription>
                      </CardHeader>
                      <CardContent className="flex-1">
                        <p className="text-sm text-gray-600 dark:text-gray-400">Location: {item.location}</p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">Status: {item.status}</p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">Size: {item.size}</p>
                      </CardContent>
                    </Card>
                  )}
                />
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

"use client"

import { Label } from "@/components/ui/label"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, Edit, Trash2, Plus, Package, MapPin, Calendar, DollarSign, ImageIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { ResponsiveTable } from "@/components/responsive-table"
import { DeleteConfirmationDialog } from "@/components/delete-confirmation-dialog"
import { useToast } from "@/hooks/use-toast"

interface InventoryItem {
  id: string
  name: string
  type: string
  status: string
  location: string
  lastMaintenance: string
  nextMaintenance: string
  cost: number
  imageUrl: string
  description: string
  specifications: { label: string; value: string }[]
  maintenanceHistory: { date: string; description: string; cost: number }[]
  associatedProducts: { id: string; name: string; quantity: number }[]
}

const mockInventoryItem: InventoryItem = {
  id: "1",
  name: "LED Billboard - EDSA",
  type: "LED Billboard",
  status: "Active",
  location: "EDSA, Mandaluyong City",
  lastMaintenance: "2024-05-10",
  nextMaintenance: "2025-05-10",
  cost: 150000,
  imageUrl: "/led-billboard-1.png",
  description:
    "High-resolution LED billboard located in a prime commercial area along EDSA. Ideal for large-scale advertising campaigns.",
  specifications: [
    { label: "Dimensions", value: "10m x 5m" },
    { label: "Resolution", value: "1920 x 1080" },
    { label: "Brightness", value: "6000 nits" },
    { label: "Power Consumption", value: "15 kW" },
  ],
  maintenanceHistory: [
    { date: "2024-05-10", description: "Routine check-up and cleaning", cost: 500 },
    { date: "2023-11-15", description: "LED module replacement (section A)", cost: 2500 },
    { date: "2023-05-20", description: "Power supply unit inspection", cost: 300 },
  ],
  associatedProducts: [
    { id: "prod1", name: "Digital Ad Campaign - Summer Sale", quantity: 1 },
    { id: "prod2", name: "Brand Awareness Package", quantity: 1 },
  ],
}

export default function InventoryDetailsPage() {
  const params = useParams()
  const { id } = params
  const { toast } = useToast()
  const [inventoryItem, setInventoryItem] = useState<InventoryItem | null>(null)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)

  useEffect(() => {
    // In a real application, you would fetch data based on `id`
    // For now, we use mock data
    if (id === "1") {
      setInventoryItem(mockInventoryItem)
    } else {
      setInventoryItem(null) // Or handle not found
    }
  }, [id])

  const handleDelete = () => {
    // In a real application, send a delete request to your API
    console.log(`Deleting inventory item with ID: ${id}`)
    toast({
      title: "Item Deleted",
      description: `Inventory item "${inventoryItem?.name}" has been successfully deleted.`,
      variant: "destructive",
    })
    setIsDeleteDialogOpen(false)
    // Redirect to inventory list or show a success message
    // router.push("/admin/inventory");
  }

  if (!inventoryItem) {
    return (
      <div className="flex-1 p-4 md:p-6 flex items-center justify-center">
        <p>Loading inventory item or item not found...</p>
      </div>
    )
  }

  const maintenanceColumns = [
    { header: "Date", accessorKey: "date" },
    { header: "Description", accessorKey: "description" },
    { header: "Cost", accessorKey: "cost", cell: (info: any) => `$${info.getValue().toFixed(2)}` },
  ]

  const associatedProductsColumns = [
    {
      header: "Product Name",
      accessorKey: "name",
      cell: (info: any) => (
        <Link href={`/sales/products/${info.row.original.id}`} className="text-blue-600 hover:underline">
          {info.getValue()}
        </Link>
      ),
    },
    { header: "Quantity", accessorKey: "quantity" },
  ]

  return (
    <div className="flex-1 p-4 md:p-6">
      <div className="flex flex-col gap-6">
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center gap-4">
            <Button variant="outline" size="icon" className="h-8 w-8 bg-transparent" asChild>
              <Link href="/admin/inventory">
                <ArrowLeft className="h-4 w-4" />
                <span className="sr-only">Back to inventory list</span>
              </Link>
            </Button>
            <h1 className="flex-1 shrink-0 whitespace-nowrap text-xl font-semibold tracking-tight sm:grow-0">
              {inventoryItem.name}
            </h1>
            <Badge variant="outline" className="ml-auto sm:ml-0">
              {inventoryItem.status}
            </Badge>
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Button variant="outline" size="sm" asChild>
              <Link href={`/admin/inventory/edit/${inventoryItem.id}`}>
                <Edit className="mr-2 h-4 w-4" /> Edit
              </Link>
            </Button>
            <Button variant="destructive" size="sm" onClick={() => setIsDeleteDialogOpen(true)}>
              <Trash2 className="mr-2 h-4 w-4" /> Delete
            </Button>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Item Details Card */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Item Details</CardTitle>
              <CardDescription>Comprehensive information about the inventory item.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="flex flex-col gap-2">
                  <Label className="text-sm font-medium">Type</Label>
                  <p className="text-muted-foreground flex items-center gap-2">
                    <Package className="h-4 w-4" /> {inventoryItem.type}
                  </p>
                </div>
                <div className="flex flex-col gap-2">
                  <Label className="text-sm font-medium">Location</Label>
                  <p className="text-muted-foreground flex items-center gap-2">
                    <MapPin className="h-4 w-4" /> {inventoryItem.location}
                  </p>
                </div>
                <div className="flex flex-col gap-2">
                  <Label className="text-sm font-medium">Last Maintenance</Label>
                  <p className="text-muted-foreground flex items-center gap-2">
                    <Calendar className="h-4 w-4" /> {inventoryItem.lastMaintenance}
                  </p>
                </div>
                <div className="flex flex-col gap-2">
                  <Label className="text-sm font-medium">Next Maintenance</Label>
                  <p className="text-muted-foreground flex items-center gap-2">
                    <Calendar className="h-4 w-4" /> {inventoryItem.nextMaintenance}
                  </p>
                </div>
                <div className="flex flex-col gap-2">
                  <Label className="text-sm font-medium">Cost</Label>
                  <p className="text-muted-foreground flex items-center gap-2">
                    <DollarSign className="h-4 w-4" /> ${inventoryItem.cost.toLocaleString()}
                  </p>
                </div>
              </div>
              <Separator />
              <div className="flex flex-col gap-2">
                <Label className="text-sm font-medium">Description</Label>
                <p className="text-muted-foreground">{inventoryItem.description}</p>
              </div>
              <Separator />
              <div className="flex flex-col gap-2">
                <Label className="text-sm font-medium">Specifications</Label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {inventoryItem.specifications.map((spec, index) => (
                    <div key={index} className="flex justify-between text-muted-foreground">
                      <span>{spec.label}:</span>
                      <span className="font-medium">{spec.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Item Image Card */}
          <Card>
            <CardHeader>
              <CardTitle>Item Image</CardTitle>
              <CardDescription>Visual representation of the inventory item.</CardDescription>
            </CardHeader>
            <CardContent className="flex items-center justify-center h-full">
              {inventoryItem.imageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={inventoryItem.imageUrl || "/placeholder.svg"}
                  alt={inventoryItem.name}
                  className="max-w-full max-h-64 object-contain rounded-md"
                />
              ) : (
                <div className="flex flex-col items-center justify-center h-48 w-full bg-muted rounded-md text-muted-foreground">
                  <ImageIcon className="h-12 w-12 mb-2" />
                  <span>No Image Available</span>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Maintenance History */}
        <Card>
          <CardHeader>
            <CardTitle>Maintenance History</CardTitle>
            <CardDescription>Records of past maintenance activities.</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveTable data={inventoryItem.maintenanceHistory} columns={maintenanceColumns} />
          </CardContent>
        </Card>

        {/* Associated Products */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <CardTitle>Associated Products</CardTitle>
            <Button variant="outline" size="sm">
              <Plus className="mr-2 h-4 w-4" /> Add Product
            </Button>
          </CardHeader>
          <CardContent>
            <ResponsiveTable data={inventoryItem.associatedProducts} columns={associatedProductsColumns} />
          </CardContent>
        </Card>
      </div>

      <DeleteConfirmationDialog
        isOpen={isDeleteDialogOpen}
        onClose={() => setIsDeleteDialogOpen(false)}
        onConfirm={handleDelete}
        title="Confirm Deletion"
        description={`Are you sure you want to delete "${inventoryItem.name}"? This action cannot be undone.`}
      />
    </div>
  )
}

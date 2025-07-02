"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, Plus, Trash2, ImageIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Separator } from "@/components/ui/separator"
import { ResponsiveTable } from "@/components/responsive-table"
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

export default function EditInventoryItemPage() {
  const params = useParams()
  const router = useRouter()
  const { id } = params
  const { toast } = useToast()
  const [formData, setFormData] = useState<InventoryItem | null>(null)

  useEffect(() => {
    // In a real application, you would fetch data based on `id`
    // For now, we use mock data
    if (id === "1") {
      setFormData(mockInventoryItem)
    } else {
      setFormData(null) // Or handle not found
    }
  }, [id])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { id, value } = e.target
    setFormData((prevData) => (prevData ? { ...prevData, [id]: value } : null))
  }

  const handleSelectChange = (value: string, id: string) => {
    setFormData((prevData) => (prevData ? { ...prevData, [id]: value } : null))
  }

  const handleSpecificationChange = (index: number, field: "label" | "value", value: string) => {
    setFormData((prevData) => {
      if (!prevData) return null
      const updatedSpecs = [...prevData.specifications]
      updatedSpecs[index] = { ...updatedSpecs[index], [field]: value }
      return { ...prevData, specifications: updatedSpecs }
    })
  }

  const addSpecification = () => {
    setFormData((prevData) => {
      if (!prevData) return null
      return {
        ...prevData,
        specifications: [...prevData.specifications, { label: "", value: "" }],
      }
    })
  }

  const removeSpecification = (index: number) => {
    setFormData((prevData) => {
      if (!prevData) return null
      const updatedSpecs = prevData.specifications.filter((_, i) => i !== index)
      return { ...prevData, specifications: updatedSpecs }
    })
  }

  const handleMaintenanceChange = (index: number, field: "date" | "description" | "cost", value: string | number) => {
    setFormData((prevData) => {
      if (!prevData) return null
      const updatedHistory = [...prevData.maintenanceHistory]
      updatedHistory[index] = { ...updatedHistory[index], [field]: value }
      return { ...prevData, maintenanceHistory: updatedHistory }
    })
  }

  const addMaintenanceEntry = () => {
    setFormData((prevData) => {
      if (!prevData) return null
      return {
        ...prevData,
        maintenanceHistory: [...prevData.maintenanceHistory, { date: "", description: "", cost: 0 }],
      }
    })
  }

  const removeMaintenanceEntry = (index: number) => {
    setFormData((prevData) => {
      if (!prevData) return null
      const updatedHistory = prevData.maintenanceHistory.filter((_, i) => i !== index)
      return { ...prevData, maintenanceHistory: updatedHistory }
    })
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // In a real application, send the updated formData to your API
    console.log("Form submitted:", formData)
    toast({
      title: "Inventory Item Updated",
      description: `Inventory item "${formData?.name}" has been successfully updated.`,
    })
    router.push(`/admin/inventory/${id}`)
  }

  if (!formData) {
    return (
      <div className="flex-1 p-4 md:p-6 flex items-center justify-center">
        <p>Loading inventory item or item not found...</p>
      </div>
    )
  }

  const maintenanceColumns = [
    {
      header: "Date",
      accessorKey: "date",
      cell: (info: any) => (
        <Input
          type="date"
          value={info.getValue()}
          onChange={(e) => handleMaintenanceChange(info.row.index, "date", e.target.value)}
        />
      ),
    },
    {
      header: "Description",
      accessorKey: "description",
      cell: (info: any) => (
        <Input
          value={info.getValue()}
          onChange={(e) => handleMaintenanceChange(info.row.index, "description", e.target.value)}
        />
      ),
    },
    {
      header: "Cost",
      accessorKey: "cost",
      cell: (info: any) => (
        <Input
          type="number"
          value={info.getValue()}
          onChange={(e) => handleMaintenanceChange(info.row.index, "cost", Number.parseFloat(e.target.value))}
        />
      ),
    },
    {
      header: "Actions",
      id: "actions",
      cell: (info: any) => (
        <Button variant="destructive" size="icon" onClick={() => removeMaintenanceEntry(info.row.index)}>
          <Trash2 className="h-4 w-4" />
        </Button>
      ),
    },
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
      <form onSubmit={handleSubmit} className="flex flex-col gap-6">
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center gap-4">
            <Button variant="outline" size="icon" className="h-8 w-8 bg-transparent" asChild>
              <Link href={`/admin/inventory/${id}`}>
                <ArrowLeft className="h-4 w-4" />
                <span className="sr-only">Back to item details</span>
              </Link>
            </Button>
            <h1 className="flex-1 shrink-0 whitespace-nowrap text-xl font-semibold tracking-tight sm:grow-0">
              Edit {formData.name}
            </h1>
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Button variant="outline" size="sm" type="button" onClick={() => router.push(`/admin/inventory/${id}`)}>
              Discard
            </Button>
            <Button size="sm" type="submit">
              Save Changes
            </Button>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Item Details Card */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Item Information</CardTitle>
              <CardDescription>Update the core details of the inventory item.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="name">Item Name</Label>
                  <Input id="name" value={formData.name} onChange={handleChange} required />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="type">Type</Label>
                  <Select value={formData.type} onValueChange={(value) => handleSelectChange(value, "type")}>
                    <SelectTrigger id="type">
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="LED Billboard">LED Billboard</SelectItem>
                      <SelectItem value="Static Billboard">Static Billboard</SelectItem>
                      <SelectItem value="Digital Display">Digital Display</SelectItem>
                      <SelectItem value="Kiosk">Kiosk</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="status">Status</Label>
                  <Select value={formData.status} onValueChange={(value) => handleSelectChange(value, "status")}>
                    <SelectTrigger id="status">
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Active">Active</SelectItem>
                      <SelectItem value="Inactive">Inactive</SelectItem>
                      <SelectItem value="Under Maintenance">Under Maintenance</SelectItem>
                      <SelectItem value="Damaged">Damaged</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="location">Location</Label>
                  <Input id="location" value={formData.location} onChange={handleChange} required />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="lastMaintenance">Last Maintenance Date</Label>
                  <Input id="lastMaintenance" type="date" value={formData.lastMaintenance} onChange={handleChange} />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="nextMaintenance">Next Maintenance Date</Label>
                  <Input id="nextMaintenance" type="date" value={formData.nextMaintenance} onChange={handleChange} />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="cost">Cost ($)</Label>
                  <Input id="cost" type="number" value={formData.cost} onChange={handleChange} />
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="description">Description</Label>
                <Textarea id="description" value={formData.description} onChange={handleChange} rows={4} />
              </div>
              <Separator />
              <div className="grid gap-2">
                <Label>Specifications</Label>
                {formData.specifications.map((spec, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <Input
                      placeholder="Label"
                      value={spec.label}
                      onChange={(e) => handleSpecificationChange(index, "label", e.target.value)}
                    />
                    <Input
                      placeholder="Value"
                      value={spec.value}
                      onChange={(e) => handleSpecificationChange(index, "value", e.target.value)}
                    />
                    <Button variant="outline" size="icon" onClick={() => removeSpecification(index)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
                <Button type="button" variant="outline" onClick={addSpecification}>
                  <Plus className="mr-2 h-4 w-4" /> Add Specification
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Item Image Card */}
          <Card>
            <CardHeader>
              <CardTitle>Item Image</CardTitle>
              <CardDescription>Upload or update the image for this item.</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col items-center justify-center h-full gap-4">
              {formData.imageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={formData.imageUrl || "/placeholder.svg"}
                  alt={formData.name}
                  className="max-w-full max-h-64 object-contain rounded-md"
                />
              ) : (
                <div className="flex flex-col items-center justify-center h-48 w-full bg-muted rounded-md text-muted-foreground">
                  <ImageIcon className="h-12 w-12 mb-2" />
                  <span>No Image Available</span>
                </div>
              )}
              <Input
                id="imageUrl"
                type="text"
                placeholder="Image URL"
                value={formData.imageUrl}
                onChange={handleChange}
              />
              <Button variant="outline" className="w-full bg-transparent">
                Upload New Image
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Maintenance History */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <CardTitle>Maintenance History</CardTitle>
            <Button type="button" variant="outline" size="sm" onClick={addMaintenanceEntry}>
              <Plus className="mr-2 h-4 w-4" /> Add Entry
            </Button>
          </CardHeader>
          <CardContent>
            <ResponsiveTable data={formData.maintenanceHistory} columns={maintenanceColumns} />
          </CardContent>
        </Card>

        {/* Associated Products */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <CardTitle>Associated Products</CardTitle>
            <Button type="button" variant="outline" size="sm">
              <Plus className="mr-2 h-4 w-4" /> Add Product
            </Button>
          </CardHeader>
          <CardContent>
            <ResponsiveTable data={formData.associatedProducts} columns={associatedProductsColumns} />
          </CardContent>
        </Card>
      </form>
    </div>
  )
}

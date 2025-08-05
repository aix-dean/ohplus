"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { ArrowLeft, Save } from "lucide-react"
import { toast } from "@/hooks/use-toast"

interface FormData {
  name: string
  type: "hardware" | "software"
  category: string
  status: "active" | "inactive" | "maintenance" | "retired"
  location: string
  assignedTo: string
  purchaseDate: string
  warrantyExpiry: string
  cost: string
  vendor: string
  description: string
  serialNumber?: string
  specifications?: string
  licenseKey?: string
  version?: string
}

const categories = [
  "Desktop Computer",
  "Laptop",
  "Server",
  "Printer",
  "Network Switch",
  "Router",
  "Firewall",
  "Monitor",
  "Smartphone",
  "Tablet",
  "Operating System",
  "Productivity Suite",
  "Design Software",
  "Security Software",
  "Database Software",
  "Development Tools",
]

export default function NewInventoryItemPage() {
  const router = useRouter()
  const [formData, setFormData] = useState<FormData>({
    name: "",
    type: "hardware",
    category: "",
    status: "active",
    location: "",
    assignedTo: "",
    purchaseDate: "",
    warrantyExpiry: "",
    cost: "",
    vendor: "",
    description: "",
    serialNumber: "",
    specifications: "",
    licenseKey: "",
    version: "",
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.name || !formData.category || !formData.vendor) {
      toast({
        title: "Error",
        description: "Please fill in all required fields (Name, Category, Vendor)",
        variant: "destructive",
      })
      return
    }

    // Here you would typically save to your backend/database
    // For now, we'll just show a success message and redirect
    toast({
      title: "Success",
      description: "Inventory item created successfully",
    })

    // Redirect back to inventory list
    router.push("/it/inventory")
  }

  const handleCancel = () => {
    router.push("/it/inventory")
  }

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="flex items-center space-x-4 mb-6">
        <Button variant="outline" size="sm" onClick={handleCancel}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Inventory
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Add New Inventory Item</h1>
          <p className="text-muted-foreground">Create a new hardware or software inventory item</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Basic Information</CardTitle>
            <CardDescription>Enter the basic details of the inventory item</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Enter item name"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="type">Type *</Label>
                <Select
                  value={formData.type}
                  onValueChange={(value: "hardware" | "software") =>
                    setFormData({ ...formData, type: value, category: "" })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="hardware">Hardware</SelectItem>
                    <SelectItem value="software">Software</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="category">Category *</Label>
                <Select
                  value={formData.category}
                  onValueChange={(value) => setFormData({ ...formData, category: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((category) => (
                      <SelectItem key={category} value={category}>
                        {category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value: "active" | "inactive" | "maintenance" | "retired") =>
                    setFormData({ ...formData, status: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                    <SelectItem value="maintenance">Maintenance</SelectItem>
                    <SelectItem value="retired">Retired</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="vendor">Vendor *</Label>
              <Input
                id="vendor"
                value={formData.vendor}
                onChange={(e) => setFormData({ ...formData, vendor: e.target.value })}
                placeholder="Enter vendor name"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Enter description"
                rows={3}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Location & Assignment</CardTitle>
            <CardDescription>Specify where the item is located and who it's assigned to</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="location">Location</Label>
                <Input
                  id="location"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  placeholder="Enter location"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="assignedTo">Assigned To</Label>
                <Input
                  id="assignedTo"
                  value={formData.assignedTo}
                  onChange={(e) => setFormData({ ...formData, assignedTo: e.target.value })}
                  placeholder="Enter assigned person/team"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Financial & Warranty Information</CardTitle>
            <CardDescription>Enter purchase details and warranty information</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="cost">Cost ($)</Label>
                <Input
                  id="cost"
                  type="number"
                  step="0.01"
                  value={formData.cost}
                  onChange={(e) => setFormData({ ...formData, cost: e.target.value })}
                  placeholder="Enter cost"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="purchaseDate">Purchase Date</Label>
                <Input
                  id="purchaseDate"
                  type="date"
                  value={formData.purchaseDate}
                  onChange={(e) => setFormData({ ...formData, purchaseDate: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="warrantyExpiry">Warranty Expiry</Label>
                <Input
                  id="warrantyExpiry"
                  type="date"
                  value={formData.warrantyExpiry}
                  onChange={(e) => setFormData({ ...formData, warrantyExpiry: e.target.value })}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {formData.type === "hardware" && (
          <Card>
            <CardHeader>
              <CardTitle>Hardware Details</CardTitle>
              <CardDescription>Enter hardware-specific information</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="serialNumber">Serial Number</Label>
                  <Input
                    id="serialNumber"
                    value={formData.serialNumber || ""}
                    onChange={(e) => setFormData({ ...formData, serialNumber: e.target.value })}
                    placeholder="Enter serial number"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="specifications">Specifications</Label>
                  <Input
                    id="specifications"
                    value={formData.specifications || ""}
                    onChange={(e) => setFormData({ ...formData, specifications: e.target.value })}
                    placeholder="Enter specifications"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {formData.type === "software" && (
          <Card>
            <CardHeader>
              <CardTitle>Software Details</CardTitle>
              <CardDescription>Enter software-specific information</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="licenseKey">License Key</Label>
                  <Input
                    id="licenseKey"
                    value={formData.licenseKey || ""}
                    onChange={(e) => setFormData({ ...formData, licenseKey: e.target.value })}
                    placeholder="Enter license key"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="version">Version</Label>
                  <Input
                    id="version"
                    value={formData.version || ""}
                    onChange={(e) => setFormData({ ...formData, version: e.target.value })}
                    placeholder="Enter version"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="flex justify-end space-x-4">
          <Button type="button" variant="outline" onClick={handleCancel}>
            Cancel
          </Button>
          <Button type="submit">
            <Save className="h-4 w-4 mr-2" />
            Create Item
          </Button>
        </div>
      </form>
    </div>
  )
}

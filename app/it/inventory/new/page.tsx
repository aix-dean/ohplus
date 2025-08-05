"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { ArrowLeft, ArrowRight, Save, Check } from "lucide-react"
import { toast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"

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

const steps = [
  {
    id: 1,
    title: "Basic Information",
    description: "Enter the basic details of the inventory item",
  },
  {
    id: 2,
    title: "Location & Assignment",
    description: "Specify where the item is located and who it's assigned to",
  },
  {
    id: 3,
    title: "Financial & Warranty",
    description: "Enter purchase details and warranty information",
  },
  {
    id: 4,
    title: "Technical Details",
    description: "Enter hardware or software specific information",
  },
  {
    id: 5,
    title: "Review & Submit",
    description: "Review all information before creating the item",
  },
]

export default function NewInventoryItemPage() {
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState(1)
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

  const validateStep = (step: number): boolean => {
    switch (step) {
      case 1:
        return !!(formData.name && formData.category && formData.vendor)
      case 2:
        return true // Optional fields
      case 3:
        return true // Optional fields
      case 4:
        return true // Optional fields
      default:
        return true
    }
  }

  const handleNext = () => {
    if (!validateStep(currentStep)) {
      toast({
        title: "Error",
        description: "Please fill in all required fields before proceeding",
        variant: "destructive",
      })
      return
    }

    if (currentStep < steps.length) {
      setCurrentStep(currentStep + 1)
    }
  }

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }

  const handleSubmit = () => {
    if (!validateStep(1)) {
      toast({
        title: "Error",
        description: "Please fill in all required fields (Name, Category, Vendor)",
        variant: "destructive",
      })
      return
    }

    // Here you would typically save to your backend/database
    toast({
      title: "Success",
      description: "Inventory item created successfully",
    })

    router.push("/it/inventory")
  }

  const handleCancel = () => {
    router.push("/it/inventory")
  }

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
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
        )

      case 2:
        return (
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
        )

      case 3:
        return (
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
        )

      case 4:
        return (
          <Card>
            <CardHeader>
              <CardTitle>{formData.type === "hardware" ? "Hardware Details" : "Software Details"}</CardTitle>
              <CardDescription>
                Enter {formData.type === "hardware" ? "hardware" : "software"}-specific information
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {formData.type === "hardware" ? (
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
              ) : (
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
              )}
            </CardContent>
          </Card>
        )

      case 5:
        return (
          <Card>
            <CardHeader>
              <CardTitle>Review & Submit</CardTitle>
              <CardDescription>Please review all information before creating the inventory item</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <h4 className="font-semibold text-sm text-muted-foreground mb-2">BASIC INFORMATION</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm">Name:</span>
                        <span className="text-sm font-medium">{formData.name || "Not specified"}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm">Type:</span>
                        <span className="text-sm font-medium capitalize">{formData.type}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm">Category:</span>
                        <span className="text-sm font-medium">{formData.category || "Not specified"}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm">Status:</span>
                        <span className="text-sm font-medium capitalize">{formData.status}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm">Vendor:</span>
                        <span className="text-sm font-medium">{formData.vendor || "Not specified"}</span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-semibold text-sm text-muted-foreground mb-2">LOCATION & ASSIGNMENT</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm">Location:</span>
                        <span className="text-sm font-medium">{formData.location || "Not specified"}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm">Assigned To:</span>
                        <span className="text-sm font-medium">{formData.assignedTo || "Not specified"}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <h4 className="font-semibold text-sm text-muted-foreground mb-2">FINANCIAL & WARRANTY</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm">Cost:</span>
                        <span className="text-sm font-medium">
                          {formData.cost ? `$${formData.cost}` : "Not specified"}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm">Purchase Date:</span>
                        <span className="text-sm font-medium">{formData.purchaseDate || "Not specified"}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm">Warranty Expiry:</span>
                        <span className="text-sm font-medium">{formData.warrantyExpiry || "Not specified"}</span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-semibold text-sm text-muted-foreground mb-2">TECHNICAL DETAILS</h4>
                    <div className="space-y-2">
                      {formData.type === "hardware" ? (
                        <>
                          <div className="flex justify-between">
                            <span className="text-sm">Serial Number:</span>
                            <span className="text-sm font-medium">{formData.serialNumber || "Not specified"}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm">Specifications:</span>
                            <span className="text-sm font-medium">{formData.specifications || "Not specified"}</span>
                          </div>
                        </>
                      ) : (
                        <>
                          <div className="flex justify-between">
                            <span className="text-sm">License Key:</span>
                            <span className="text-sm font-medium">{formData.licenseKey || "Not specified"}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm">Version:</span>
                            <span className="text-sm font-medium">{formData.version || "Not specified"}</span>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {formData.description && (
                <div>
                  <h4 className="font-semibold text-sm text-muted-foreground mb-2">DESCRIPTION</h4>
                  <p className="text-sm bg-muted p-3 rounded-md">{formData.description}</p>
                </div>
              )}
            </CardContent>
          </Card>
        )

      default:
        return null
    }
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

      {/* Stepper */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          {steps.map((step, index) => (
            <div key={step.id} className="flex items-center">
              <div className="flex flex-col items-center">
                <div
                  className={cn(
                    "flex items-center justify-center w-10 h-10 rounded-full border-2 transition-colors",
                    currentStep > step.id
                      ? "bg-primary border-primary text-primary-foreground"
                      : currentStep === step.id
                        ? "border-primary text-primary"
                        : "border-muted-foreground/30 text-muted-foreground",
                  )}
                >
                  {currentStep > step.id ? (
                    <Check className="h-5 w-5" />
                  ) : (
                    <span className="text-sm font-medium">{step.id}</span>
                  )}
                </div>
                <div className="mt-2 text-center">
                  <p
                    className={cn(
                      "text-sm font-medium",
                      currentStep >= step.id ? "text-foreground" : "text-muted-foreground",
                    )}
                  >
                    {step.title}
                  </p>
                  <p className="text-xs text-muted-foreground hidden md:block max-w-24">{step.description}</p>
                </div>
              </div>
              {index < steps.length - 1 && (
                <div
                  className={cn(
                    "flex-1 h-0.5 mx-4 transition-colors",
                    currentStep > step.id ? "bg-primary" : "bg-muted-foreground/30",
                  )}
                />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Step Content */}
      <div className="mb-8">{renderStepContent()}</div>

      {/* Navigation Buttons */}
      <div className="flex justify-between">
        <Button type="button" variant="outline" onClick={handlePrevious} disabled={currentStep === 1}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Previous
        </Button>

        <div className="flex space-x-2">
          <Button type="button" variant="outline" onClick={handleCancel}>
            Cancel
          </Button>
          {currentStep < steps.length ? (
            <Button type="button" onClick={handleNext}>
              Next
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          ) : (
            <Button type="button" onClick={handleSubmit}>
              <Save className="h-4 w-4 mr-2" />
              Create Item
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}

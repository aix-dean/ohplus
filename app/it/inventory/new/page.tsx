"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import {
  ArrowLeft,
  ArrowRight,
  Save,
  Check,
  Package,
  MapPin,
  DollarSign,
  Settings,
  Eye,
  HardDrive,
  Monitor,
} from "lucide-react"
import { toast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"

interface FormData {
  name: string
  type: "hardware" | "software"
  category: string
  brand: string
  department: string
  assignedTo: string
  condition: "excellent" | "good" | "fair" | "poor" | "damaged"
  location: string
  purchaseDate: string
  warrantyExpiry: string
  cost: string
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
    title: "Basic Info",
    description: "Item details",
    icon: Package,
    color: "bg-blue-500",
  },
  {
    id: 2,
    title: "Location",
    description: "Assignment",
    icon: MapPin,
    color: "bg-green-500",
  },
  {
    id: 3,
    title: "Financial",
    description: "Cost & warranty",
    icon: DollarSign,
    color: "bg-yellow-500",
  },
  {
    id: 4,
    title: "Technical",
    description: "Specifications",
    icon: Settings,
    color: "bg-purple-500",
  },
  {
    id: 5,
    title: "Review",
    description: "Final check",
    icon: Eye,
    color: "bg-indigo-500",
  },
]

const statusColors = {
  active: "bg-green-100 text-green-800 border-green-200",
  inactive: "bg-gray-100 text-gray-800 border-gray-200",
  maintenance: "bg-yellow-100 text-yellow-800 border-yellow-200",
  retired: "bg-red-100 text-red-800 border-red-200",
}

export default function NewInventoryItemPage() {
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState(1)
  const [formData, setFormData] = useState<FormData>({
    name: "",
    type: "hardware",
    category: "",
    brand: "",
    department: "",
    assignedTo: "",
    condition: "excellent",
    location: "",
    purchaseDate: "",
    warrantyExpiry: "",
    cost: "",
    description: "",
    serialNumber: "",
    specifications: "",
    licenseKey: "",
    version: "",
  })

  const [users, setUsers] = useState([
    { id: "1", name: "John Doe", email: "john.doe@company.com", department: "IT" },
    { id: "2", name: "Jane Smith", email: "jane.smith@company.com", department: "HR" },
    { id: "3", name: "Mike Johnson", email: "mike.johnson@company.com", department: "Finance" },
    { id: "4", name: "Sarah Wilson", email: "sarah.wilson@company.com", department: "Marketing" },
    { id: "5", name: "David Brown", email: "david.brown@company.com", department: "Sales" },
    { id: "6", name: "Lisa Davis", email: "lisa.davis@company.com", department: "Operations" },
    { id: "7", name: "Tom Anderson", email: "tom.anderson@company.com", department: "IT" },
    { id: "8", name: "Emily Taylor", email: "emily.taylor@company.com", department: "Administration" },
  ])

  const validateStep = (step: number): boolean => {
    switch (step) {
      case 1:
        return !!(formData.name && formData.category && formData.brand && formData.department)
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
        title: "Missing Required Fields",
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
        title: "Validation Error",
        description: "Please fill in all required fields (Name, Category, Brand, Department)",
        variant: "destructive",
      })
      return
    }

    toast({
      title: "Item Created Successfully",
      description: `${formData.name} has been added to the inventory`,
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
          <div className="space-y-8">
            <div className="text-center space-y-2">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-100 mb-4">
                <Package className="h-8 w-8 text-blue-600" />
              </div>
              <h2 className="text-2xl font-bold">Basic Information</h2>
              <p className="text-muted-foreground">Let's start with the essential details of your inventory item</p>
            </div>

            <Card className="border-2 border-dashed border-blue-200 bg-blue-50/30">
              <CardContent className="p-8 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <Label htmlFor="name" className="text-base font-medium">
                      Item Name *
                    </Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="e.g., Dell OptiPlex 7090"
                      className="h-12 text-base"
                      required
                    />
                  </div>
                  <div className="space-y-3">
                    <Label htmlFor="type" className="text-base font-medium">
                      Item Type *
                    </Label>
                    <Select
                      value={formData.type}
                      onValueChange={(value: "hardware" | "software") =>
                        setFormData({ ...formData, type: value, category: "" })
                      }
                    >
                      <SelectTrigger className="h-12 text-base">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="hardware">
                          <div className="flex items-center space-x-2">
                            <HardDrive className="h-4 w-4" />
                            <span>Hardware</span>
                          </div>
                        </SelectItem>
                        <SelectItem value="software">
                          <div className="flex items-center space-x-2">
                            <Monitor className="h-4 w-4" />
                            <span>Software</span>
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <Label htmlFor="category" className="text-base font-medium">
                      Category *
                    </Label>
                    <Select
                      value={formData.category}
                      onValueChange={(value) => setFormData({ ...formData, category: value })}
                    >
                      <SelectTrigger className="h-12 text-base">
                        <SelectValue placeholder="Select a category" />
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
                  <div className="space-y-3">
                    <Label htmlFor="brand" className="text-base font-medium">
                      Brand *
                    </Label>
                    <Input
                      id="brand"
                      value={formData.brand}
                      onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                      placeholder="e.g., Dell, Microsoft, Apple"
                      className="h-12 text-base"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <Label htmlFor="department" className="text-base font-medium">
                      Department *
                    </Label>
                    <Select
                      value={formData.department}
                      onValueChange={(value) => setFormData({ ...formData, department: value })}
                    >
                      <SelectTrigger className="h-12 text-base">
                        <SelectValue placeholder="Select a department" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="IT">IT Department</SelectItem>
                        <SelectItem value="HR">Human Resources</SelectItem>
                        <SelectItem value="Finance">Finance</SelectItem>
                        <SelectItem value="Marketing">Marketing</SelectItem>
                        <SelectItem value="Sales">Sales</SelectItem>
                        <SelectItem value="Operations">Operations</SelectItem>
                        <SelectItem value="Administration">Administration</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-3">
                    <Label htmlFor="assignedTo" className="text-base font-medium">
                      Assigned To
                    </Label>
                    <Select
                      value={formData.assignedTo}
                      onValueChange={(value) => setFormData({ ...formData, assignedTo: value })}
                    >
                      <SelectTrigger className="h-12 text-base">
                        <SelectValue placeholder="Select a user" />
                      </SelectTrigger>
                      <SelectContent>
                        {users.map((user) => (
                          <SelectItem key={user.id} value={user.name}>
                            <div className="flex flex-col">
                              <span>{user.name}</span>
                              <span className="text-xs text-muted-foreground">
                                {user.email} • {user.department}
                              </span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-3">
                  <Label htmlFor="condition" className="text-base font-medium">
                    Condition
                  </Label>
                  <Select
                    value={formData.condition}
                    onValueChange={(value: "excellent" | "good" | "fair" | "poor" | "damaged") =>
                      setFormData({ ...formData, condition: value })
                    }
                  >
                    <SelectTrigger className="h-12 text-base">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="excellent">
                        <Badge variant="outline" className="bg-green-100 text-green-800 border-green-200">
                          Excellent
                        </Badge>
                      </SelectItem>
                      <SelectItem value="good">
                        <Badge variant="outline" className="bg-blue-100 text-blue-800 border-blue-200">
                          Good
                        </Badge>
                      </SelectItem>
                      <SelectItem value="fair">
                        <Badge variant="outline" className="bg-yellow-100 text-yellow-800 border-yellow-200">
                          Fair
                        </Badge>
                      </SelectItem>
                      <SelectItem value="poor">
                        <Badge variant="outline" className="bg-orange-100 text-orange-800 border-orange-200">
                          Poor
                        </Badge>
                      </SelectItem>
                      <SelectItem value="damaged">
                        <Badge variant="outline" className="bg-red-100 text-red-800 border-red-200">
                          Damaged
                        </Badge>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-3">
                  <Label htmlFor="description" className="text-base font-medium">
                    Description
                  </Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Provide additional details about this item..."
                    rows={4}
                    className="text-base resize-none"
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        )

      case 2:
        return (
          <div className="space-y-8">
            <div className="text-center space-y-2">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 mb-4">
                <MapPin className="h-8 w-8 text-green-600" />
              </div>
              <h2 className="text-2xl font-bold">Location & Assignment</h2>
              <p className="text-muted-foreground">Where is this item located and who is responsible for it?</p>
            </div>

            <Card className="border-2 border-dashed border-green-200 bg-green-50/30">
              <CardContent className="p-8 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <Label htmlFor="location" className="text-base font-medium">
                      Physical Location
                    </Label>
                    <Input
                      id="location"
                      value={formData.location}
                      onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                      placeholder="e.g., Office Floor 2, Room 201"
                      className="h-12 text-base"
                    />
                    <p className="text-sm text-muted-foreground">Specify the physical location of this item</p>
                  </div>
                  {/*
                  <div className="space-y-3">
                    <Label htmlFor="assignedTo" className="text-base font-medium">
                      Assigned To
                    </Label>
                    <Input
                      id="assignedTo"
                      value={formData.assignedTo}
                      onChange={(e) => setFormData({ ...formData, assignedTo: e.target.value })}
                      placeholder="e.g., John Doe, IT Department"
                      className="h-12 text-base"
                    />
                    <p className="text-sm text-muted-foreground">Person or team responsible for this item</p>
                  </div>
                  */}
                </div>
              </CardContent>
            </Card>
          </div>
        )

      case 3:
        return (
          <div className="space-y-8">
            <div className="text-center space-y-2">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-yellow-100 mb-4">
                <DollarSign className="h-8 w-8 text-yellow-600" />
              </div>
              <h2 className="text-2xl font-bold">Financial & Warranty</h2>
              <p className="text-muted-foreground">Track the financial aspects and warranty information</p>
            </div>

            <Card className="border-2 border-dashed border-yellow-200 bg-yellow-50/30">
              <CardContent className="p-8 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="space-y-3">
                    <Label htmlFor="cost" className="text-base font-medium">
                      Purchase Cost
                    </Label>
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                      <Input
                        id="cost"
                        type="number"
                        step="0.01"
                        value={formData.cost}
                        onChange={(e) => setFormData({ ...formData, cost: e.target.value })}
                        placeholder="0.00"
                        className="h-12 text-base pl-10"
                      />
                    </div>
                  </div>
                  <div className="space-y-3">
                    <Label htmlFor="purchaseDate" className="text-base font-medium">
                      Purchase Date
                    </Label>
                    <Input
                      id="purchaseDate"
                      type="date"
                      value={formData.purchaseDate}
                      onChange={(e) => setFormData({ ...formData, purchaseDate: e.target.value })}
                      className="h-12 text-base"
                    />
                  </div>
                  <div className="space-y-3">
                    <Label htmlFor="warrantyExpiry" className="text-base font-medium">
                      Warranty Expiry
                    </Label>
                    <Input
                      id="warrantyExpiry"
                      type="date"
                      value={formData.warrantyExpiry}
                      onChange={(e) => setFormData({ ...formData, warrantyExpiry: e.target.value })}
                      className="h-12 text-base"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )

      case 4:
        return (
          <div className="space-y-8">
            <div className="text-center space-y-2">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-purple-100 mb-4">
                <Settings className="h-8 w-8 text-purple-600" />
              </div>
              <h2 className="text-2xl font-bold">Technical Specifications</h2>
              <p className="text-muted-foreground">
                Add {formData.type === "hardware" ? "hardware" : "software"}-specific technical details
              </p>
            </div>

            <Card className="border-2 border-dashed border-purple-200 bg-purple-50/30">
              <CardContent className="p-8 space-y-6">
                {formData.type === "hardware" ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-3">
                      <Label htmlFor="serialNumber" className="text-base font-medium">
                        Serial Number
                      </Label>
                      <Input
                        id="serialNumber"
                        value={formData.serialNumber || ""}
                        onChange={(e) => setFormData({ ...formData, serialNumber: e.target.value })}
                        placeholder="e.g., SN123456789"
                        className="h-12 text-base font-mono"
                      />
                      <p className="text-sm text-muted-foreground">Unique identifier for this hardware</p>
                    </div>
                    <div className="space-y-3">
                      <Label htmlFor="specifications" className="text-base font-medium">
                        Specifications
                      </Label>
                      <Input
                        id="specifications"
                        value={formData.specifications || ""}
                        onChange={(e) => setFormData({ ...formData, specifications: e.target.value })}
                        placeholder="e.g., Intel i7, 16GB RAM, 512GB SSD"
                        className="h-12 text-base"
                      />
                      <p className="text-sm text-muted-foreground">Key technical specifications</p>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-3">
                      <Label htmlFor="licenseKey" className="text-base font-medium">
                        License Key
                      </Label>
                      <Input
                        id="licenseKey"
                        value={formData.licenseKey || ""}
                        onChange={(e) => setFormData({ ...formData, licenseKey: e.target.value })}
                        placeholder="e.g., XXXXX-XXXXX-XXXXX-XXXXX"
                        className="h-12 text-base font-mono"
                      />
                      <p className="text-sm text-muted-foreground">Software license or activation key</p>
                    </div>
                    <div className="space-y-3">
                      <Label htmlFor="version" className="text-base font-medium">
                        Version
                      </Label>
                      <Input
                        id="version"
                        value={formData.version || ""}
                        onChange={(e) => setFormData({ ...formData, version: e.target.value })}
                        placeholder="e.g., 2024.1.0"
                        className="h-12 text-base"
                      />
                      <p className="text-sm text-muted-foreground">Current software version</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )

      case 5:
        return (
          <div className="space-y-8">
            <div className="text-center space-y-2">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-indigo-100 mb-4">
                <Eye className="h-8 w-8 text-indigo-600" />
              </div>
              <h2 className="text-2xl font-bold">Review & Submit</h2>
              <p className="text-muted-foreground">Please review all information before creating the inventory item</p>
            </div>

            <Card className="border-2 border-indigo-200">
              <CardHeader className="bg-indigo-50">
                <CardTitle className="flex items-center space-x-2">
                  <Package className="h-5 w-5" />
                  <span>{formData.name || "Unnamed Item"}</span>
                  {/*<Badge variant="outline" className={cn("ml-auto", statusColors[formData.status])}>
                    {formData.status}
                  </Badge>*/}
                </CardTitle>
                <CardDescription>{formData.description || "No description provided"}</CardDescription>
              </CardHeader>
              <CardContent className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-6">
                    <div>
                      <h4 className="font-semibold text-sm text-muted-foreground mb-3 uppercase tracking-wide">
                        Basic Information
                      </h4>
                      <div className="space-y-3">
                        <div className="flex justify-between items-center py-2 border-b border-muted">
                          <span className="text-sm font-medium">Type:</span>
                          <Badge variant="secondary" className="capitalize">
                            {formData.type}
                          </Badge>
                        </div>
                        <div className="flex justify-between items-center py-2 border-b border-muted">
                          <span className="text-sm font-medium">Category:</span>
                          <span className="text-sm text-muted-foreground">{formData.category || "Not specified"}</span>
                        </div>
                        <div className="flex justify-between items-center py-2 border-b border-muted">
                          <span className="text-sm font-medium">Brand:</span>
                          <span className="text-sm text-muted-foreground">{formData.brand || "Not specified"}</span>
                        </div>
                        <div className="flex justify-between items-center py-2 border-b border-muted">
                          <span className="text-sm font-medium">Department:</span>
                          <span className="text-sm text-muted-foreground">
                            {formData.department || "Not specified"}
                          </span>
                        </div>
                        <div className="flex justify-between items-center py-2 border-b border-muted">
                          <span className="text-sm font-medium">Condition:</span>
                          <Badge
                            variant="outline"
                            className={cn(
                              formData.condition === "excellent" && "bg-green-100 text-green-800 border-green-200",
                              formData.condition === "good" && "bg-blue-100 text-blue-800 border-blue-200",
                              formData.condition === "fair" && "bg-yellow-100 text-yellow-800 border-yellow-200",
                              formData.condition === "poor" && "bg-orange-100 text-orange-800 border-orange-200",
                              formData.condition === "damaged" && "bg-red-100 text-red-800 border-red-200",
                            )}
                          >
                            {formData.condition}
                          </Badge>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h4 className="font-semibold text-sm text-muted-foreground mb-3 uppercase tracking-wide">
                        Location & Assignment
                      </h4>
                      <div className="space-y-3">
                        <div className="flex justify-between items-center py-2 border-b border-muted">
                          <span className="text-sm font-medium">Location:</span>
                          <span className="text-sm text-muted-foreground">{formData.location || "Not specified"}</span>
                        </div>
                        <div className="flex justify-between items-center py-2 border-b border-muted">
                          <span className="text-sm font-medium">Assigned To:</span>
                          <span className="text-sm text-muted-foreground">
                            {formData.assignedTo || "Not specified"}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-6">
                    <div>
                      <h4 className="font-semibold text-sm text-muted-foreground mb-3 uppercase tracking-wide">
                        Financial & Warranty
                      </h4>
                      <div className="space-y-3">
                        <div className="flex justify-between items-center py-2 border-b border-muted">
                          <span className="text-sm font-medium">Cost:</span>
                          <span className="text-sm text-muted-foreground">
                            {formData.cost ? `$${Number.parseFloat(formData.cost).toLocaleString()}` : "Not specified"}
                          </span>
                        </div>
                        <div className="flex justify-between items-center py-2 border-b border-muted">
                          <span className="text-sm font-medium">Purchase Date:</span>
                          <span className="text-sm text-muted-foreground">
                            {formData.purchaseDate || "Not specified"}
                          </span>
                        </div>
                        <div className="flex justify-between items-center py-2 border-b border-muted">
                          <span className="text-sm font-medium">Warranty Expiry:</span>
                          <span className="text-sm text-muted-foreground">
                            {formData.warrantyExpiry || "Not specified"}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h4 className="font-semibold text-sm text-muted-foreground mb-3 uppercase tracking-wide">
                        Technical Details
                      </h4>
                      <div className="space-y-3">
                        {formData.type === "hardware" ? (
                          <>
                            <div className="flex justify-between items-center py-2 border-b border-muted">
                              <span className="text-sm font-medium">Serial Number:</span>
                              <span className="text-sm text-muted-foreground font-mono">
                                {formData.serialNumber || "Not specified"}
                              </span>
                            </div>
                            <div className="flex justify-between items-center py-2 border-b border-muted">
                              <span className="text-sm font-medium">Specifications:</span>
                              <span className="text-sm text-muted-foreground">
                                {formData.specifications || "Not specified"}
                              </span>
                            </div>
                          </>
                        ) : (
                          <>
                            <div className="flex justify-between items-center py-2 border-b border-muted">
                              <span className="text-sm font-medium">License Key:</span>
                              <span className="text-sm text-muted-foreground font-mono">
                                {formData.licenseKey || "Not specified"}
                              </span>
                            </div>
                            <div className="flex justify-between items-center py-2 border-b border-muted">
                              <span className="text-sm font-medium">Version:</span>
                              <span className="text-sm text-muted-foreground">
                                {formData.version || "Not specified"}
                              </span>
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )

      default:
        return null
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="container mx-auto p-6 max-w-5xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-4">
            <Button variant="outline" size="sm" onClick={handleCancel} className="shadow-sm bg-transparent">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Inventory
            </Button>
            <Separator orientation="vertical" className="h-6" />
            <div>
              <h1 className="text-3xl font-bold text-slate-900">Add New Item</h1>
              <p className="text-slate-600">Create a new inventory item in {steps.length} simple steps</p>
            </div>
          </div>
          <Badge variant="outline" className="text-sm px-3 py-1">
            Step {currentStep} of {steps.length}
          </Badge>
        </div>

        {/* Modern Stepper */}
        <div className="mb-12">
          <div className="flex items-center justify-between relative">
            {/* Progress Line */}
            <div className="absolute top-8 left-8 right-8 h-0.5 bg-slate-200 -z-10">
              <div
                className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 transition-all duration-500 ease-out"
                style={{ width: `${((currentStep - 1) / (steps.length - 1)) * 100}%` }}
              />
            </div>

            {steps.map((step, index) => {
              const Icon = step.icon
              const isCompleted = currentStep > step.id
              const isCurrent = currentStep === step.id
              const isUpcoming = currentStep < step.id

              return (
                <div key={step.id} className="flex flex-col items-center relative">
                  <div
                    className={cn(
                      "flex items-center justify-center w-16 h-16 rounded-full border-4 transition-all duration-300 shadow-lg",
                      isCompleted && "bg-gradient-to-r from-green-500 to-emerald-500 border-green-500 text-white",
                      isCurrent && `${step.color} border-white text-white shadow-xl scale-110`,
                      isUpcoming && "bg-white border-slate-300 text-slate-400",
                    )}
                  >
                    {isCompleted ? (
                      <Check className="h-7 w-7" />
                    ) : (
                      <Icon className={cn("h-7 w-7", isCurrent && "animate-pulse")} />
                    )}
                  </div>
                  <div className="mt-4 text-center max-w-24">
                    <p
                      className={cn(
                        "text-sm font-semibold transition-colors",
                        (isCompleted || isCurrent) && "text-slate-900",
                        isUpcoming && "text-slate-500",
                      )}
                    >
                      {step.title}
                    </p>
                    <p
                      className={cn(
                        "text-xs mt-1 transition-colors",
                        (isCompleted || isCurrent) && "text-slate-600",
                        isUpcoming && "text-slate-400",
                      )}
                    >
                      {step.description}
                    </p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Step Content */}
        <div className="mb-8">{renderStepContent()}</div>

        {/* Navigation */}
        <div className="flex justify-between items-center bg-white rounded-lg p-6 shadow-sm border">
          <Button
            type="button"
            variant="outline"
            onClick={handlePrevious}
            disabled={currentStep === 1}
            className="shadow-sm bg-transparent"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Previous
          </Button>

          <div className="flex items-center space-x-3">
            <Button type="button" variant="ghost" onClick={handleCancel}>
              Cancel
            </Button>
            {currentStep < steps.length ? (
              <Button type="button" onClick={handleNext} className="shadow-sm">
                Next Step
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            ) : (
              <Button type="button" onClick={handleSubmit} className="shadow-sm bg-green-600 hover:bg-green-700">
                <Save className="h-4 w-4 mr-2" />
                Create Item
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

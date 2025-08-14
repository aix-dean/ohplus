"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Progress } from "@/components/ui/progress"
import { ArrowLeft, ArrowRight, Check, Package, HardDrive, Loader2, Wrench, Package2 } from "lucide-react"
import { useAuth } from "@/contexts/auth-context"
import { collection, query, where, getDocs } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage"
import { useToast } from "@/hooks/use-toast"

// Initialize Firebase Storage
const storage = getStorage()

interface FormData {
  name: string
  category: string
  inventory_type: "assets" | "tools" | "consumables" | ""
  description: string
  quantity: number
  unit: string
  location: string
  status: "available" | "in-use" | "maintenance" | "retired"
  serial_number: string
  model: string
  manufacturer: string
  purchase_date: string
  warranty_expiry: string
  cost: number
  supplier: string
  assigned_to: string
  notes: string
  productNumber: string
  type: "hardware" | "software"
  inventory_type_old: "assets" | "tools" | "consumables"
  brand: string
  department: string
  assignedTo: string
  condition: "excellent" | "good" | "fair" | "poor" | "damaged"
  vendorType: "physical" | "online"
  storeName: string
  storeLocation: string
  websiteName: string
  websiteUrl: string
  purchaseDate: string
  warrantyExpiry: string
  cost_old: string
  currency?: string
  stock: string
  serialNumber?: string
  specifications?: string
  licenseKey?: string
  version?: string
  status_old: "active" | "inactive" | "maintenance" | "retired"
  categorySpecs?: Record<string, any>
  // Media fields
  images: File[]
  imageUrls: string[]
  existingImageUrls: string[]
}

interface User {
  id: string
  uid: string
  first_name: string
  last_name: string
  email: string
  company_id?: string
  license_key?: string
}

const initialFormData: FormData = {
  name: "",
  category: "",
  inventory_type: "",
  description: "",
  quantity: 1,
  unit: "units",
  location: "",
  status: "available",
  serial_number: "",
  model: "",
  manufacturer: "",
  purchase_date: "",
  warranty_expiry: "",
  cost: 0,
  supplier: "",
  assigned_to: "",
  notes: "",
  productNumber: "",
  type: "hardware",
  inventory_type_old: "assets",
  brand: "",
  department: "",
  assignedTo: "",
  condition: "excellent",
  vendorType: "physical",
  storeName: "",
  storeLocation: "",
  websiteName: "",
  websiteUrl: "",
  purchaseDate: "",
  warrantyExpiry: "",
  cost_old: "",
  currency: "USD",
  stock: "",
  serialNumber: "",
  specifications: "",
  licenseKey: "",
  version: "",
  status_old: "active",
  categorySpecs: {},
  images: [],
  imageUrls: [],
  existingImageUrls: [],
}

const hardwareCategories = [
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
  "Storage Device",
  "Keyboard",
  "Mouse",
  "Webcam",
  "Headset",
  "Projector",
  "Scanner",
  "UPS",
  "Cable",
  "Docking Station",
]

const softwareCategories = [
  "Operating System",
  "Productivity Suite",
  "Design Software",
  "Security Software",
  "Database Software",
  "Development Tools",
  "Antivirus",
  "Backup Software",
  "Communication Software",
  "Project Management",
  "Accounting Software",
  "CRM Software",
  "ERP Software",
  "Media Software",
  "Browser",
  "Utility Software",
]

// Helper function to get categories based on item type
const getCategoriesForType = (type: "hardware" | "software") => {
  return type === "hardware" ? hardwareCategories : softwareCategories
}

// Replace the static steps array with this dynamic one
const steps = [
  { id: 1, title: "Basic Info", description: "Item details and type" },
  { id: 2, title: "Specifications", description: "Technical details" },
  { id: 3, title: "Purchase Info", description: "Cost and supplier" },
  { id: 4, title: "Review", description: "Confirm changes" },
]

const getVisibleSteps = (itemType: "hardware" | "software") => {
  return steps
}

const getInventoryTypeIcon = (type: string) => {
  switch (type) {
    case "assets":
      return <HardDrive className="h-4 w-4" />
    case "tools":
      return <Wrench className="h-4 w-4" />
    case "consumables":
      return <Package2 className="h-4 w-4" />
    default:
      return <Package className="h-4 w-4" />
  }
}

export default function EditInventoryItemPage() {
  const router = useRouter()
  const params = useParams()
  const { userData } = useAuth()
  const { toast } = useToast()
  const [currentStep, setCurrentStep] = useState(1)
  const [users, setUsers] = useState<User[]>([])
  const [loadingUsers, setLoadingUsers] = useState(false)
  const [loadingItem, setLoadingItem] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [uploadingImages, setUploadingImages] = useState(false)
  const [formData, setFormData] = useState<FormData>(initialFormData)
  const [isLoading, setIsLoading] = useState(false) // Declare setIsLoading here

  const visibleSteps = getVisibleSteps(formData.type)

  // Load existing item data
  useEffect(() => {
    const loadItemData = async () => {
      try {
        // Simulate API call to load existing data
        await new Promise((resolve) => setTimeout(resolve, 1000))

        // Mock data - in real app, this would come from API
        const mockData: FormData = {
          name: "Dell OptiPlex 7090",
          category: "Desktop Computer",
          inventory_type: "assets",
          description: "High-performance desktop computer for office use",
          quantity: 5,
          unit: "units",
          location: "IT Storage Room A",
          status: "available",
          serial_number: "DL7090001",
          model: "OptiPlex 7090",
          manufacturer: "Dell",
          purchase_date: "2024-01-15",
          warranty_expiry: "2027-01-15",
          cost: 899.99,
          supplier: "Dell Direct",
          assigned_to: "",
          notes: "",
          productNumber: "123",
          type: "hardware",
          inventory_type_old: "assets",
          brand: "Dell",
          department: "IT",
          assignedTo: "",
          condition: "excellent",
          vendorType: "physical",
          storeName: "",
          storeLocation: "",
          websiteName: "",
          websiteUrl: "",
          purchaseDate: "",
          warrantyExpiry: "",
          cost_old: "",
          currency: "USD",
          stock: "",
          serialNumber: "",
          specifications: "",
          licenseKey: "",
          version: "",
          status_old: "active",
          categorySpecs: {},
          images: [],
          imageUrls: [],
          existingImageUrls: [],
        }

        setFormData(mockData)
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to load item data.",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }

    if (params.id) {
      loadItemData()
    }
  }, [params.id, toast])

  const updateFormData = (field: keyof FormData, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  // Fetch users by company_id
  useEffect(() => {
    const fetchUsers = async () => {
      if (!userData?.company_id) return

      setLoadingUsers(true)
      try {
        console.log("Fetching users for company_id:", userData.company_id)

        const usersRef = collection(db, "iboard_users")
        const q = query(usersRef, where("company_id", "==", userData.company_id))
        const querySnapshot = await getDocs(q)

        const fetchedUsers: User[] = []
        querySnapshot.forEach((doc) => {
          const data = doc.data()
          fetchedUsers.push({
            id: doc.id,
            uid: data.uid,
            first_name: data.first_name || "",
            last_name: data.last_name || "",
            email: data.email || "",
            company_id: data.company_id,
            license_key: data.license_key,
          })
        })

        console.log("Fetched users:", fetchedUsers)
        setUsers(fetchedUsers)
      } catch (error) {
        console.error("Error fetching users:", error)
        toast({
          title: "Error",
          description: "Failed to load users",
          variant: "destructive",
        })
      } finally {
        setLoadingUsers(false)
      }
    }

    fetchUsers()
  }, [userData?.company_id])

  // Add this useEffect after the existing useEffect
  useEffect(() => {
    // Reset to step 1 when item type changes to avoid being on a non-existent step
    if (currentStep > getVisibleSteps(formData.type).length) {
      setCurrentStep(1)
    }
  }, [formData.type, currentStep])

  // Helper function to get user display name from uid
  const getUserDisplayName = (uid: string) => {
    if (uid === "unassigned") return "Unassigned"
    const user = users.find((u) => u.uid === uid)
    if (!user) return "Unknown User"
    return `${user.first_name} ${user.last_name}`.trim() || user.email
  }

  // Handle image upload
  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (!files) return

    const imageFiles = Array.from(files).filter((file) => file.type.startsWith("image/"))

    if (imageFiles.length !== files.length) {
      toast({
        title: "Invalid Files",
        description: "Only image files are allowed",
        variant: "destructive",
      })
    }

    setFormData((prev) => ({
      ...prev,
      images: [...prev.images, ...imageFiles],
    }))
  }

  // Remove new image
  const removeImage = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index),
    }))
  }

  // Remove existing image
  const removeExistingImage = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      existingImageUrls: prev.existingImageUrls.filter((_, i) => i !== index),
    }))
  }

  // Upload new images to Firebase Storage
  const uploadImages = async (): Promise<string[]> => {
    if (formData.images.length === 0) return []

    setUploadingImages(true)
    const uploadPromises = formData.images.map(async (file) => {
      const fileName = `${Date.now()}-${file.name}`
      const storageRef = ref(storage, `inventory-images/${fileName}`)
      const snapshot = await uploadBytes(storageRef, file)
      return await getDownloadURL(snapshot.ref)
    })

    try {
      const urls = await Promise.all(uploadPromises)
      setUploadingImages(false)
      return urls
    } catch (error) {
      setUploadingImages(false)
      throw error
    }
  }

  const validateStep = (step: number): boolean => {
    switch (step) {
      case 1:
        return !!(formData.name && formData.category && formData.inventory_type && formData.location)
      case 2:
        return true // Optional fields
      case 3:
        return true // Optional fields
      case 4:
        return true
      default:
        return false
    }
  }

  const nextStep = () => {
    if (validateStep(currentStep)) {
      setCurrentStep((prev) => Math.min(prev + 1, steps.length))
    } else {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields before proceeding.",
        variant: "destructive",
      })
    }
  }

  const prevStep = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 1))
  }

  const handleSubmit = async () => {
    if (!validateStep(1)) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields.",
        variant: "destructive",
      })
      return
    }

    setIsSubmitting(true)

    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 2000))

      toast({
        title: "Success",
        description: "Inventory item has been updated successfully.",
      })

      router.push("/it/inventory")
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update inventory item. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleCancel = () => {
    router.push("/it/inventory")
  }

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Item Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => updateFormData("name", e.target.value)}
                  placeholder="Enter item name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="category">Category *</Label>
                <Input
                  id="category"
                  value={formData.category}
                  onChange={(e) => updateFormData("category", e.target.value)}
                  placeholder="e.g., Desktop Computer, Network Equipment"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="inventory_type">Inventory Type *</Label>
              <Select
                value={formData.inventory_type}
                onValueChange={(value) => updateFormData("inventory_type", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select inventory type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="assets">
                    <div className="flex items-center gap-2">
                      <HardDrive className="h-4 w-4" />
                      Assets
                    </div>
                  </SelectItem>
                  <SelectItem value="tools">
                    <div className="flex items-center gap-2">
                      <Wrench className="h-4 w-4" />
                      Tools
                    </div>
                  </SelectItem>
                  <SelectItem value="consumables">
                    <div className="flex items-center gap-2">
                      <Package2 className="h-4 w-4" />
                      Consumables
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => updateFormData("description", e.target.value)}
                placeholder="Brief description of the item"
                rows={3}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="quantity">Quantity</Label>
                <Input
                  id="quantity"
                  type="number"
                  value={formData.quantity}
                  onChange={(e) => updateFormData("quantity", Number.parseInt(e.target.value) || 0)}
                  min="0"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="unit">Unit</Label>
                <Select value={formData.unit} onValueChange={(value) => updateFormData("unit", value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="units">Units</SelectItem>
                    <SelectItem value="pieces">Pieces</SelectItem>
                    <SelectItem value="sets">Sets</SelectItem>
                    <SelectItem value="meters">Meters</SelectItem>
                    <SelectItem value="kilograms">Kilograms</SelectItem>
                    <SelectItem value="liters">Liters</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select value={formData.status} onValueChange={(value) => updateFormData("status", value as any)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="available">Available</SelectItem>
                    <SelectItem value="in-use">In Use</SelectItem>
                    <SelectItem value="maintenance">Maintenance</SelectItem>
                    <SelectItem value="retired">Retired</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="location">Location *</Label>
              <Input
                id="location"
                value={formData.location}
                onChange={(e) => updateFormData("location", e.target.value)}
                placeholder="e.g., IT Storage Room A, Office Floor 2"
              />
            </div>
          </div>
        )

      case 2:
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="serial_number">Serial Number</Label>
                <Input
                  id="serial_number"
                  value={formData.serial_number}
                  onChange={(e) => updateFormData("serial_number", e.target.value)}
                  placeholder="Enter serial number"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="model">Model</Label>
                <Input
                  id="model"
                  value={formData.model}
                  onChange={(e) => updateFormData("model", e.target.value)}
                  placeholder="Enter model number"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="manufacturer">Manufacturer</Label>
              <Input
                id="manufacturer"
                value={formData.manufacturer}
                onChange={(e) => updateFormData("manufacturer", e.target.value)}
                placeholder="Enter manufacturer name"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="assigned_to">Assigned To</Label>
              <Input
                id="assigned_to"
                value={formData.assigned_to}
                onChange={(e) => updateFormData("assigned_to", e.target.value)}
                placeholder="Person or department assigned to"
              />
            </div>
          </div>
        )

      case 3:
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="purchase_date">Purchase Date</Label>
                <Input
                  id="purchase_date"
                  type="date"
                  value={formData.purchase_date}
                  onChange={(e) => updateFormData("purchase_date", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="warranty_expiry">Warranty Expiry</Label>
                <Input
                  id="warranty_expiry"
                  type="date"
                  value={formData.warranty_expiry}
                  onChange={(e) => updateFormData("warranty_expiry", e.target.value)}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="cost">Cost</Label>
                <Input
                  id="cost"
                  type="number"
                  step="0.01"
                  value={formData.cost}
                  onChange={(e) => updateFormData("cost", Number.parseFloat(e.target.value) || 0)}
                  placeholder="0.00"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="supplier">Supplier</Label>
                <Input
                  id="supplier"
                  value={formData.supplier}
                  onChange={(e) => updateFormData("supplier", e.target.value)}
                  placeholder="Enter supplier name"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => updateFormData("notes", e.target.value)}
                placeholder="Additional notes or comments"
                rows={4}
              />
            </div>
          </div>
        )

      case 4:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <h3 className="text-lg font-semibold">Review Changes</h3>
              <p className="text-muted-foreground">Please review the updated information before saving.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <h4 className="font-medium">Basic Information</h4>
                <div className="space-y-2 text-sm">
                  <div>
                    <strong>Name:</strong> {formData.name}
                  </div>
                  <div>
                    <strong>Category:</strong> {formData.category}
                  </div>
                  <div className="flex items-center gap-2">
                    <strong>Type:</strong>
                    {getInventoryTypeIcon(formData.inventory_type)}
                    {formData.inventory_type.charAt(0).toUpperCase() + formData.inventory_type.slice(1)}
                  </div>
                  <div>
                    <strong>Quantity:</strong> {formData.quantity} {formData.unit}
                  </div>
                  <div>
                    <strong>Location:</strong> {formData.location}
                  </div>
                  <div>
                    <strong>Status:</strong> {formData.status}
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="font-medium">Specifications</h4>
                <div className="space-y-2 text-sm">
                  <div>
                    <strong>Serial Number:</strong> {formData.serial_number || "N/A"}
                  </div>
                  <div>
                    <strong>Model:</strong> {formData.model || "N/A"}
                  </div>
                  <div>
                    <strong>Manufacturer:</strong> {formData.manufacturer || "N/A"}
                  </div>
                  <div>
                    <strong>Assigned To:</strong> {formData.assigned_to || "N/A"}
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="font-medium">Purchase Information</h4>
                <div className="space-y-2 text-sm">
                  <div>
                    <strong>Purchase Date:</strong> {formData.purchase_date || "N/A"}
                  </div>
                  <div>
                    <strong>Warranty Expiry:</strong> {formData.warranty_expiry || "N/A"}
                  </div>
                  <div>
                    <strong>Cost:</strong> {formData.cost ? `$${formData.cost.toFixed(2)}` : "N/A"}
                  </div>
                  <div>
                    <strong>Supplier:</strong> {formData.supplier || "N/A"}
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="font-medium">Additional Details</h4>
                <div className="space-y-2 text-sm">
                  <div>
                    <strong>Description:</strong> {formData.description || "N/A"}
                  </div>
                  <div>
                    <strong>Notes:</strong> {formData.notes || "N/A"}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )

      default:
        return null
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading item data...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" onClick={() => router.back()}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Edit Inventory Item</h1>
          <p className="text-muted-foreground">Update the details of this inventory item</p>
        </div>
      </div>

      {/* Progress */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>
              Step {currentStep} of {steps.length}
            </CardTitle>
            <span className="text-sm text-muted-foreground">
              {Math.round((currentStep / steps.length) * 100)}% Complete
            </span>
          </div>
          <Progress value={(currentStep / steps.length) * 100} className="w-full" />
        </CardHeader>
      </Card>

      {/* Step Navigation */}
      <div className="flex justify-center">
        <div className="flex items-center space-x-4">
          {steps.map((step, index) => (
            <div key={step.id} className="flex items-center">
              <div
                className={`flex items-center justify-center w-8 h-8 rounded-full border-2 ${
                  currentStep >= step.id
                    ? "bg-primary border-primary text-primary-foreground"
                    : "border-muted-foreground text-muted-foreground"
                }`}
              >
                {currentStep > step.id ? (
                  <Check className="h-4 w-4" />
                ) : (
                  <span className="text-sm font-medium">{step.id}</span>
                )}
              </div>
              <div className="ml-2 hidden sm:block">
                <div
                  className={`text-sm font-medium ${
                    currentStep >= step.id ? "text-foreground" : "text-muted-foreground"
                  }`}
                >
                  {step.title}
                </div>
                <div className="text-xs text-muted-foreground">{step.description}</div>
              </div>
              {index < steps.length - 1 && <div className="w-8 h-px bg-muted-foreground mx-4 hidden sm:block" />}
            </div>
          ))}
        </div>
      </div>

      {/* Form Content */}
      <Card>
        <CardHeader>
          <CardTitle>{steps[currentStep - 1].title}</CardTitle>
          <CardDescription>{steps[currentStep - 1].description}</CardDescription>
        </CardHeader>
        <CardContent>{renderStepContent()}</CardContent>
      </Card>

      {/* Navigation Buttons */}
      <div className="flex justify-between">
        <Button variant="outline" onClick={prevStep} disabled={currentStep === 1}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Previous
        </Button>

        {currentStep < steps.length ? (
          <Button onClick={nextStep}>
            Next
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        ) : (
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? "Updating..." : "Update Item"}
            <Check className="ml-2 h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  )
}

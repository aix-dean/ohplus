"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { ArrowLeft, ArrowRight, Save, Check, Package, MapPin, DollarSign, Settings, Eye, HardDrive, Monitor, Globe } from 'lucide-react'
import { toast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"
import { useAuth } from "@/contexts/auth-context"
import { collection, query, where, getDocs, addDoc, serverTimestamp } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { GooglePlacesAutocomplete } from "@/components/google-places-autocomplete"

interface FormData {
  name: string
  type: "hardware" | "software"
  category: string
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
  cost: string
  currency?: string
  description: string
  serialNumber?: string
  specifications?: string
  licenseKey?: string
  version?: string
  // Category-specific fields
  categorySpecs?: Record<string, any>
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
const getAllSteps = () => [
  {
    id: 1,
    title: "Basic Info",
    description: "Item details",
    icon: Package,
    color: "bg-blue-500",
  },
  {
    id: 2,
    title: "Vendor Information",
    description: "Store details",
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
    showFor: "hardware", // Only show for hardware
  },
  {
    id: 5,
    title: "Review",
    description: "Final check",
    icon: Eye,
    color: "bg-indigo-500",
  },
]

const getVisibleSteps = (itemType: "hardware" | "software") => {
  return getAllSteps()
    .filter((step) => !step.showFor || step.showFor === itemType)
    .map((step, index) => ({ ...step, id: index + 1 })) // Renumber steps
}

const statusColors = {
  active: "bg-green-100 text-green-800 border-green-200",
  inactive: "bg-gray-100 text-gray-800 border-gray-200",
  maintenance: "bg-yellow-100 text-yellow-800 border-yellow-200",
  retired: "bg-red-100 text-red-800 border-red-200",
}

export default function NewInventoryItemPage() {
  const router = useRouter()
  const { userData } = useAuth()
  const [currentStep, setCurrentStep] = useState(1)
  const [users, setUsers] = useState<User[]>([])
  const [loadingUsers, setLoadingUsers] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState<FormData>({
    name: "",
    type: "hardware",
    category: "",
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
    cost: "",
    currency: "USD",
    description: "",
    serialNumber: "",
    specifications: "",
    licenseKey: "",
    version: "",
    categorySpecs: {},
  })

  const visibleSteps = getVisibleSteps(formData.type)

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

  // Helper function to update category-specific specs
  const updateCategorySpec = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      categorySpecs: {
        ...prev.categorySpecs,
        [field]: value
      }
    }))
  }

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

    if (currentStep < visibleSteps.length) {
      setCurrentStep(currentStep + 1)
    }
  }

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }

  const handleSubmit = async () => {
    if (!validateStep(1)) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields (Name, Category, Brand, Department)",
        variant: "destructive",
      })
      return
    }

    if (!userData?.company_id) {
      toast({
        title: "Error",
        description: "User company information not found",
        variant: "destructive",
      })
      return
    }

    setIsSubmitting(true)

    try {
      // Prepare the data to be saved
      const itemData = {
        name: formData.name,
        type: formData.type,
        category: formData.category,
        brand: formData.brand,
        department: formData.department,
        assignedTo: formData.assignedTo || "unassigned",
        condition: formData.condition,
        vendorType: formData.vendorType,
        storeName: formData.storeName || "",
        storeLocation: formData.storeLocation || "",
        websiteName: formData.websiteName || "",
        websiteUrl: formData.websiteUrl || "",
        purchaseDate: formData.purchaseDate || "",
        warrantyExpiry: formData.warrantyExpiry || "",
        cost: formData.cost ? Number.parseFloat(formData.cost) : 0,
        currency: formData.currency || "USD",
        description: formData.description || "",
        serialNumber: formData.serialNumber || "",
        specifications: formData.specifications || "",
        licenseKey: formData.licenseKey || "",
        version: formData.version || "",
        categorySpecs: formData.categorySpecs || {},
        status: "active", // Default status
        deleted: false, // Default deleted status
        company_id: userData.company_id,
        created_by: userData.uid,
        created_at: serverTimestamp(),
        updated_at: serverTimestamp(),
      }

      console.log("Saving item data:", itemData)

      // Save to Firestore
      const docRef = await addDoc(collection(db, "itInventory"), itemData)

      console.log("Document written with ID: ", docRef.id)

      toast({
        title: "Item Created Successfully",
        description: `${formData.name} has been added to the inventory`,
      })

      router.push("/it/inventory")
    } catch (error) {
      console.error("Error adding document: ", error)
      toast({
        title: "Error",
        description: "Failed to create inventory item. Please try again.",
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
    const currentStepData = visibleSteps[currentStep - 1]
    if (!currentStepData) return null

    // Map the step title to the appropriate content
    switch (currentStepData.title) {
      case "Basic Info":
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
                        setFormData({ ...formData, type: value, category: "", categorySpecs: {} })
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
                      onValueChange={(value) => setFormData({ ...formData, category: value, categorySpecs: {} })}
                    >
                      <SelectTrigger className="h-12 text-base">
                        <SelectValue placeholder={`Select a ${formData.type} category`} />
                      </SelectTrigger>
                      <SelectContent>
                        {getCategoriesForType(formData.type).map((category) => (
                          <SelectItem key={category} value={category}>
                            {category}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <p className="text-sm text-muted-foreground">Choose from {formData.type} specific categories</p>
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
                      disabled={loadingUsers}
                    >
                      <SelectTrigger className="h-12 text-base">
                        <SelectValue placeholder={loadingUsers ? "Loading users..." : "Select a user"} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="unassigned">
                          <span className="text-muted-foreground">Unassigned</span>
                        </SelectItem>
                        {users.map((user) => (
                          <SelectItem key={user.uid} value={user.uid}>
                            <div className="flex flex-col">
                              <span>{`${user.first_name} ${user.last_name}`.trim() || user.email}</span>
                              <span className="text-xs text-muted-foreground">{user.email}</span>
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

      case "Vendor Information":
        return (
          <div className="space-y-8">
            <div className="text-center space-y-2">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 mb-4">
                <MapPin className="h-8 w-8 text-green-600" />
              </div>
              <h2 className="text-2xl font-bold">Vendor Information</h2>
              <p className="text-muted-foreground">Where did you purchase this item from?</p>
            </div>

            <Card className="border-2 border-dashed border-green-200 bg-green-50/30">
              <CardContent className="p-8 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <Label htmlFor="vendorType" className="text-base font-medium">
                      Store Type
                    </Label>
                    <Select
                      value={formData.vendorType}
                      onValueChange={(value: "physical" | "online") =>
                        setFormData({
                          ...formData,
                          vendorType: value,
                          storeLocation: value === "online" ? "" : formData.storeLocation,
                          websiteName: value === "physical" ? "" : formData.websiteName,
                          websiteUrl: value === "physical" ? "" : formData.websiteUrl,
                        })
                      }
                    >
                      <SelectTrigger className="h-12 text-base">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="physical">
                          <div className="flex items-center space-x-2">
                            <MapPin className="h-4 w-4" />
                            <span>Physical Store</span>
                          </div>
                        </SelectItem>
                        <SelectItem value="online">
                          <div className="flex items-center space-x-2">
                            <Globe className="h-4 w-4" />
                            <span>Online Store</span>
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-sm text-muted-foreground">
                      Choose whether you purchased from a physical or online store
                    </p>
                  </div>
                  <div className="space-y-3">
                    <Label htmlFor="storeName" className="text-base font-medium">
                      Store Name
                    </Label>
                    <Input
                      id="storeName"
                      value={formData.storeName}
                      onChange={(e) => setFormData({ ...formData, storeName: e.target.value })}
                      placeholder="e.g., Best Buy, Amazon, CDR King"
                      className="h-12 text-base"
                    />
                    <p className="text-sm text-muted-foreground">Name of the store or vendor</p>
                  </div>
                </div>

                {formData.vendorType === "physical" && (
                  <div className="space-y-3">
                    <Label htmlFor="storeLocation" className="text-base font-medium">
                      Store Location
                    </Label>
                    <div className="space-y-2">
                      <GooglePlacesAutocomplete
                        value={formData.storeLocation}
                        onChange={(value) => setFormData({ ...formData, storeLocation: value })}
                        placeholder="Search for store location..."
                        className="h-12 text-base"
                        enableMap={true}
                        mapHeight="300px"
                      />
                      <p className="text-sm text-muted-foreground">
                        Search and select the exact location of the store on the map
                      </p>
                    </div>
                  </div>
                )}

                {formData.vendorType === "online" && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-3">
                      <Label htmlFor="websiteName" className="text-base font-medium">
                        Website Name
                      </Label>
                      <Input
                        id="websiteName"
                        value={formData.websiteName}
                        onChange={(e) => setFormData({ ...formData, websiteName: e.target.value })}
                        placeholder="e.g., Amazon, eBay, Shopee"
                        className="h-12 text-base"
                      />
                      <p className="text-sm text-muted-foreground">Name of the online store or marketplace</p>
                    </div>
                    <div className="space-y-3">
                      <Label htmlFor="websiteUrl" className="text-base font-medium">
                        Website URL
                      </Label>
                      <div className="relative">
                        <Globe className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                        <Input
                          id="websiteUrl"
                          type="url"
                          value={formData.websiteUrl}
                          onChange={(e) => setFormData({ ...formData, websiteUrl: e.target.value })}
                          placeholder="https://www.example.com"
                          className="h-12 text-base pl-10"
                        />
                      </div>
                      <p className="text-sm text-muted-foreground">Full URL of the online store</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )

      case "Financial":
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
                    <div className="relative flex">
                      <Select
                        value={formData.currency || "USD"}
                        onValueChange={(value) => setFormData({ ...formData, currency: value })}
                      >
                        <SelectTrigger className="h-12 w-24 rounded-r-none border-r-0">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="USD">USD</SelectItem>
                          <SelectItem value="EUR">EUR</SelectItem>
                          <SelectItem value="GBP">GBP</SelectItem>
                          <SelectItem value="JPY">JPY</SelectItem>
                          <SelectItem value="CAD">CAD</SelectItem>
                          <SelectItem value="AUD">AUD</SelectItem>
                          <SelectItem value="CHF">CHF</SelectItem>
                          <SelectItem value="CNY">CNY</SelectItem>
                          <SelectItem value="INR">INR</SelectItem>
                          <SelectItem value="KRW">KRW</SelectItem>
                          <SelectItem value="SGD">SGD</SelectItem>
                          <SelectItem value="HKD">HKD</SelectItem>
                          <SelectItem value="NOK">NOK</SelectItem>
                          <SelectItem value="SEK">SEK</SelectItem>
                          <SelectItem value="DKK">DKK</SelectItem>
                          <SelectItem value="PLN">PLN</SelectItem>
                          <SelectItem value="CZK">CZK</SelectItem>
                          <SelectItem value="HUF">HUF</SelectItem>
                          <SelectItem value="RUB">RUB</SelectItem>
                          <SelectItem value="BRL">BRL</SelectItem>
                          <SelectItem value="MXN">MXN</SelectItem>
                          <SelectItem value="ZAR">ZAR</SelectItem>
                          <SelectItem value="TRY">TRY</SelectItem>
                          <SelectItem value="NZD">NZD</SelectItem>
                          <SelectItem value="PHP">PHP</SelectItem>
                          <SelectItem value="THB">THB</SelectItem>
                          <SelectItem value="MYR">MYR</SelectItem>
                          <SelectItem value="IDR">IDR</SelectItem>
                          <SelectItem value="VND">VND</SelectItem>
                        </SelectContent>
                      </Select>
                      <Input
                        id="cost"
                        type="number"
                        step="0.01"
                        value={formData.cost}
                        onChange={(e) => setFormData({ ...formData, cost: e.target.value })}
                        placeholder="0.00"
                        className="h-12 text-base rounded-l-none flex-1"
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

      case "Technical":
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
              <CardContent className="p-8 space-y-8">
                {formData.type === "hardware" ? (
                  <div className="space-y-8">
                    {/* Basic Hardware Fields */}
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
                          General Specifications
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

                    {/* Category-specific specifications */}
                    {formData.category === "Desktop Computer" && (
                      <div className="bg-blue-50 rounded-lg p-6 border border-blue-200">
                        <h3 className="text-lg font-semibold mb-4 flex items-center">
                          <Monitor className="h-5 w-5 mr-2" />
                          Desktop Computer Specifications
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="space-y-3">
                            <Label className="text-base font-medium">Processor</Label>
                            <Input 
                              placeholder="e.g., Intel Core i7-12700K, 3.6GHz" 
                              className="h-12 text-base"
                              value={formData.categorySpecs?.processor || ""}
                              onChange={(e) => updateCategorySpec("processor", e.target.value)}
                            />
                          </div>
                          <div className="space-y-3">
                            <Label className="text-base font-medium">RAM</Label>
                            <Input 
                              placeholder="e.g., 16GB DDR4-3200" 
                              className="h-12 text-base"
                              value={formData.categorySpecs?.ram || ""}
                              onChange={(e) => updateCategorySpec("ram", e.target.value)}
                            />
                          </div>
                          <div className="space-y-3">
                            <Label className="text-base font-medium">Storage</Label>
                            <Input 
                              placeholder="e.g., 512GB NVMe SSD + 1TB HDD" 
                              className="h-12 text-base"
                              value={formData.categorySpecs?.storage || ""}
                              onChange={(e) => updateCategorySpec("storage", e.target.value)}
                            />
                          </div>
                          <div className="space-y-3">
                            <Label className="text-base font-medium">Graphics Card</Label>
                            <Input 
                              placeholder="e.g., NVIDIA RTX 3060, 12GB VRAM" 
                              className="h-12 text-base"
                              value={formData.categorySpecs?.graphics || ""}
                              onChange={(e) => updateCategorySpec("graphics", e.target.value)}
                            />
                          </div>
                          <div className="space-y-3">
                            <Label className="text-base font-medium">Motherboard</Label>
                            <Input 
                              placeholder="e.g., ASUS PRIME B660M-A" 
                              className="h-12 text-base"
                              value={formData.categorySpecs?.motherboard || ""}
                              onChange={(e) => updateCategorySpec("motherboard", e.target.value)}
                            />
                          </div>
                          <div className="space-y-3">
                            <Label className="text-base font-medium">Power Supply</Label>
                            <Input 
                              placeholder="e.g., 650W 80+ Gold" 
                              className="h-12 text-base"
                              value={formData.categorySpecs?.powerSupply || ""}
                              onChange={(e) => updateCategorySpec("powerSupply", e.target.value)}
                            />
                          </div>
                          <div className="space-y-3">
                            <Label className="text-base font-medium">Operating System</Label>
                            <Input 
                              placeholder="e.g., Windows 11 Pro 64-bit" 
                              className="h-12 text-base"
                              value={formData.categorySpecs?.operatingSystem || ""}
                              onChange={(e) => updateCategorySpec("operatingSystem", e.target.value)}
                            />
                          </div>
                          <div className="space-y-3">
                            <Label className="text-base font-medium">Optical Drive</Label>
                            <Input 
                              placeholder="e.g., DVD-RW, Blu-ray, None" 
                              className="h-12 text-base"
                              value={formData.categorySpecs?.opticalDrive || ""}
                              onChange={(e) => updateCategorySpec("opticalDrive", e.target.value)}
                            />
                          </div>
                        </div>
                        <div className="mt-6">
                          <Label className="text-base font-medium">Expansion Slots</Label>
                          <Textarea 
                            placeholder="e.g., 2x PCIe x16, 1x PCIe x1, 4x RAM slots"
                            className="mt-2 text-base resize-none"
                            rows={2}
                            value={formData.categorySpecs?.expansionSlots || ""}
                            onChange={(e) => updateCategorySpec("expansionSlots", e.target.value)}
                          />
                        </div>
                      </div>
                    )}

                    {formData.category === "Laptop" && (
                      <div className="bg-green-50 rounded-lg p-6 border border-green-200">
                        <h3 className="text-lg font-semibold mb-4 flex items-center">
                          <Monitor className="h-5 w-5 mr-2" />
                          Laptop Specifications
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="space-y-3">
                            <Label className="text-base font-medium">Processor</Label>
                            <Input 
                              placeholder="e.g., Intel Core i7-1260P, 2.1GHz" 
                              className="h-12 text-base"
                              value={formData.categorySpecs?.processor || ""}
                              onChange={(e) => updateCategorySpec("processor", e.target.value)}
                            />
                          </div>
                          <div className="space-y-3">
                            <Label className="text-base font-medium">RAM</Label>
                            <Input 
                              placeholder="e.g., 16GB LPDDR5-4800" 
                              className="h-12 text-base"
                              value={formData.categorySpecs?.ram || ""}
                              onChange={(e) => updateCategorySpec("ram", e.target.value)}
                            />
                          </div>
                          <div className="space-y-3">
                            <Label className="text-base font-medium">Storage</Label>
                            <Input 
                              placeholder="e.g., 512GB PCIe 4.0 NVMe SSD" 
                              className="h-12 text-base"
                              value={formData.categorySpecs?.storage || ""}
                              onChange={(e) => updateCategorySpec("storage", e.target.value)}
                            />
                          </div>
                          <div className="space-y-3">
                            <Label className="text-base font-medium">Display</Label>
                            <Input 
                              placeholder="e.g., 14-inch FHD IPS, 1920×1080" 
                              className="h-12 text-base"
                              value={formData.categorySpecs?.display || ""}
                              onChange={(e) => updateCategorySpec("display", e.target.value)}
                            />
                          </div>
                          <div className="space-y-3">
                            <Label className="text-base font-medium">Graphics</Label>
                            <Input 
                              placeholder="e.g., Intel Iris Xe Graphics" 
                              className="h-12 text-base"
                              value={formData.categorySpecs?.graphics || ""}
                              onChange={(e) => updateCategorySpec("graphics", e.target.value)}
                            />
                          </div>
                          <div className="space-y-3">
                            <Label className="text-base font-medium">Battery</Label>
                            <Input 
                              placeholder="e.g., 70Wh Li-ion, up to 10 hours" 
                              className="h-12 text-base"
                              value={formData.categorySpecs?.battery || ""}
                              onChange={(e) => updateCategorySpec("battery", e.target.value)}
                            />
                          </div>
                          <div className="space-y-3">
                            <Label className="text-base font-medium">Keyboard</Label>
                            <Input 
                              placeholder="e.g., Backlit, Full-size, Numeric pad" 
                              className="h-12 text-base"
                              value={formData.categorySpecs?.keyboard || ""}
                              onChange={(e) => updateCategorySpec("keyboard", e.target.value)}
                            />
                          </div>
                          <div className="space-y-3">
                            <Label className="text-base font-medium">Webcam</Label>
                            <Input 
                              placeholder="e.g., 720p HD, IR for Windows Hello" 
                              className="h-12 text-base"
                              value={formData.categorySpecs?.webcam || ""}
                              onChange={(e) => updateCategorySpec("webcam", e.target.value)}
                            />
                          </div>
                        </div>
                        <div className="mt-6">
                          <Label className="text-base font-medium">Ports & Connectivity</Label>
                          <Textarea 
                            placeholder="e.g., 2x USB-A 3.2, 2x USB-C Thunderbolt 4, HDMI 2.0, 3.5mm audio, Wi-Fi 6E, Bluetooth 5.2"
                            className="mt-2 text-base resize-none"
                            rows={2}
                            value={formData.categorySpecs?.connectivity || ""}
                            onChange={(e) => updateCategorySpec("connectivity", e.target.value)}
                          />
                        </div>
                      </div>
                    )}

                    {formData.category === "Monitor" && (
                      <div className="bg-indigo-50 rounded-lg p-6 border border-indigo-200">
                        <h3 className="text-lg font-semibold mb-4 flex items-center">
                          <Monitor className="h-5 w-5 mr-2" />
                          Monitor Specifications
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="space-y-3">
                            <Label className="text-base font-medium">Screen Size</Label>
                            <Input 
                              placeholder="e.g., 27 inches (diagonal)" 
                              className="h-12 text-base"
                              value={formData.categorySpecs?.screenSize || ""}
                              onChange={(e) => updateCategorySpec("screenSize", e.target.value)}
                            />
                          </div>
                          <div className="space-y-3">
                            <Label className="text-base font-medium">Resolution</Label>
                            <Input 
                              placeholder="e.g., 2560×1440 (QHD)" 
                              className="h-12 text-base"
                              value={formData.categorySpecs?.resolution || ""}
                              onChange={(e) => updateCategorySpec("resolution", e.target.value)}
                            />
                          </div>
                          <div className="space-y-3">
                            <Label className="text-base font-medium">Panel Type</Label>
                            <Input 
                              placeholder="e.g., IPS, VA, TN, OLED" 
                              className="h-12 text-base"
                              value={formData.categorySpecs?.panelType || ""}
                              onChange={(e) => updateCategorySpec("panelType", e.target.value)}
                            />
                          </div>
                          <div className="space-y-3">
                            <Label className="text-base font-medium">Refresh Rate</Label>
                            <Input 
                              placeholder="e.g., 144Hz, 165Hz, 240Hz" 
                              className="h-12 text-base"
                              value={formData.categorySpecs?.refreshRate || ""}
                              onChange={(e) => updateCategorySpec("refreshRate", e.target.value)}
                            />
                          </div>
                          <div className="space-y-3">
                            <Label className="text-base font-medium">Response Time</Label>
                            <Input 
                              placeholder="e.g., 1ms GTG, 5ms" 
                              className="h-12 text-base"
                              value={formData.categorySpecs?.responseTime || ""}
                              onChange={(e) => updateCategorySpec("responseTime", e.target.value)}
                            />
                          </div>
                          <div className="space-y-3">
                            <Label className="text-base font-medium">Brightness</Label>
                            <Input 
                              placeholder="e.g., 400 nits, 1000 nits HDR" 
                              className="h-12 text-base"
                              value={formData.categorySpecs?.brightness || ""}
                              onChange={(e) => updateCategorySpec("brightness", e.target.value)}
                            />
                          </div>
                          <div className="space-y-3">
                            <Label className="text-base font-medium">Contrast Ratio</Label>
                            <Input 
                              placeholder="e.g., 1000:1, 3000:1" 
                              className="h-12 text-base"
                              value={formData.categorySpecs?.contrastRatio || ""}
                              onChange={(e) => updateCategorySpec("contrastRatio", e.target.value)}
                            />
                          </div>
                          <div className="space-y-3">
                            <Label className="text-base font-medium">Color Gamut</Label>
                            <Input 
                              placeholder="e.g., 99% sRGB, 95% DCI-P3" 
                              className="h-12 text-base"
                              value={formData.categorySpecs?.colorGamut || ""}
                              onChange={(e) => updateCategorySpec("colorGamut", e.target.value)}
                            />
                          </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                          <div className="space-y-3">
                            <Label className="text-base font-medium">Connectivity</Label>
                            <Textarea 
                              placeholder="e.g., HDMI 2.1, DisplayPort 1.4, USB-C with 90W PD, USB hub"
                              className="text-base resize-none"
                              rows={2}
                              value={formData.categorySpecs?.connectivity || ""}
                              onChange={(e) => updateCategorySpec("connectivity", e.target.value)}
                            />
                          </div>
                          <div className="space-y-3">
                            <Label className="text-base font-medium">Adjustability</Label>
                            <Textarea 
                              placeholder="e.g., Height, Tilt, Swivel, Pivot, VESA 100×100"
                              className="text-base resize-none"
                              rows={2}
                              value={formData.categorySpecs?.adjustability || ""}
                              onChange={(e) => updateCategorySpec("adjustability", e.target.value)}
                            />
                          </div>
                        </div>
                      </div>
                    )}

                    {formData.category === "Printer" && (
                      <div className="bg-yellow-50 rounded-lg p-6 border border-yellow-200">
                        <h3 className="text-lg font-semibold mb-4 flex items-center">
                          <Package className="h-5 w-5 mr-2" />
                          Printer Specifications
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="space-y-3">
                            <Label className="text-base font-medium">Print Technology</Label>
                            <Input 
                              placeholder="e.g., Laser, Inkjet, Thermal" 
                              className="h-12 text-base"
                              value={formData.categorySpecs?.printTechnology || ""}
                              onChange={(e) => updateCategorySpec("printTechnology", e.target.value)}
                            />
                          </div>
                          <div className="space-y-3">
                            <Label className="text-base font-medium">Print Speed (Black)</Label>
                            <Input 
                              placeholder="e.g., 30 ppm, 45 ppm" 
                              className="h-12 text-base"
                              value={formData.categorySpecs?.printSpeedBlack || ""}
                              onChange={(e) => updateCategorySpec("printSpeedBlack", e.target.value)}
                            />
                          </div>
                          <div className="space-y-3">
                            <Label className="text-base font-medium">Print Speed (Color)</Label>
                            <Input 
                              placeholder="e.g., 25 ppm, 40 ppm" 
                              className="h-12 text-base"
                              value={formData.categorySpecs?.printSpeedColor || ""}
                              onChange={(e) => updateCategorySpec("printSpeedColor", e.target.value)}
                            />
                          </div>
                          <div className="space-y-3">
                            <Label className="text-base font-medium">Print Resolution</Label>
                            <Input 
                              placeholder="e.g., 1200×1200 dpi, 4800×1200 dpi" 
                              className="h-12 text-base"
                              value={formData.categorySpecs?.printResolution || ""}
                              onChange={(e) => updateCategorySpec("printResolution", e.target.value)}
                            />
                          </div>
                          <div className="space-y-3">
                            <Label className="text-base font-medium">Paper Capacity</Label>
                            <Input 
                              placeholder="e.g., 250 sheets input, 100 sheets output" 
                              className="h-12 text-base"
                              value={formData.categorySpecs?.paperCapacity || ""}
                              onChange={(e) => updateCategorySpec("paperCapacity", e.target.value)}
                            />
                          </div>
                          <div className="space-y-3">
                            <Label className="text-base font-medium">Paper Sizes</Label>
                            <Input 
                              placeholder="e.g., A4, Letter, Legal, A3" 
                              className="h-12 text-base"
                              value={formData.categorySpecs?.paperSizes || ""}
                              onChange={(e) => updateCategorySpec("paperSizes", e.target.value)}
                            />
                          </div>
                          <div className="space-y-3">
                            <Label className="text-base font-medium">Monthly Duty Cycle</Label>
                            <Input 
                              placeholder="e.g., 50,000 pages, 100,000 pages" 
                              className="h-12 text-base"
                              value={formData.categorySpecs?.dutyCycle || ""}
                              onChange={(e) => updateCategorySpec("dutyCycle", e.target.value)}
                            />
                          </div>
                          <div className="space-y-3">
                            <Label className="text-base font-medium">Memory</Label>
                            <Input 
                              placeholder="e.g., 512MB, 1GB RAM" 
                              className="h-12 text-base"
                              value={formData.categorySpecs?.memory || ""}
                              onChange={(e) => updateCategorySpec("memory", e.target.value)}
                            />
                          </div>
                        </div>
                        <div className="mt-6">
                          <Label className="text-base font-medium">Features</Label>
                          <Textarea 
                            placeholder="e.g., Duplex printing, Scan, Copy, Fax, ADF, Touchscreen"
                            className="mt-2 text-base resize-none"
                            rows={2}
                            value={formData.categorySpecs?.features || ""}
                            onChange={(e) => updateCategorySpec("features", e.target.value)}
                          />
                        </div>
                      </div>
                    )}

                    {formData.category === "Network Switch" && (
                      <div className="bg-cyan-50 rounded-lg p-6 border border-cyan-200">
                        <h3 className="text-lg font-semibold mb-4 flex items-center">
                          <Globe className="h-5 w-5 mr-2" />
                          Network Switch Specifications
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="space-y-3">
                            <Label className="text-base font-medium">Port Count</Label>
                            <Input 
                              placeholder="e.g., 24 ports, 48 ports" 
                              className="h-12 text-base"
                              value={formData.categorySpecs?.portCount || ""}
                              onChange={(e) => updateCategorySpec("portCount", e.target.value)}
                            />
                          </div>
                          <div className="space-y-3">
                            <Label className="text-base font-medium">Port Speed</Label>
                            <Input 
                              placeholder="e.g., Gigabit Ethernet, 10GbE" 
                              className="h-12 text-base"
                              value={formData.categorySpecs?.portSpeed || ""}
                              onChange={(e) => updateCategorySpec("portSpeed", e.target.value)}
                            />
                          </div>
                          <div className="space-y-3">
                            <Label className="text-base font-medium">Switching Capacity</Label>
                            <Input 
                              placeholder="e.g., 48 Gbps, 176 Gbps" 
                              className="h-12 text-base"
                              value={formData.categorySpecs?.switchingCapacity || ""}
                              onChange={(e) => updateCategorySpec("switchingCapacity", e.target.value)}
                            />
                          </div>
                          <div className="space-y-3">
                            <Label className="text-base font-medium">Forwarding Rate</Label>
                            <Input 
                              placeholder="e.g., 35.7 Mpps, 130.9 Mpps" 
                              className="h-12 text-base"
                              value={formData.categorySpecs?.forwardingRate || ""}
                              onChange={(e) => updateCategorySpec("forwardingRate", e.target.value)}
                            />
                          </div>
                          <div className="space-y-3">
                            <Label className="text-base font-medium">MAC Address Table</Label>
                            <Input 
                              placeholder="e.g., 8K entries, 16K entries" 
                              className="h-12 text-base"
                              value={formData.categorySpecs?.macTable || ""}
                              onChange={(e) => updateCategorySpec("macTable", e.target.value)}
                            />
                          </div>
                          <div className="space-y-3">
                            <Label className="text-base font-medium">Power Consumption</Label>
                            <Input 
                              placeholder="e.g., 25W, 45W, 180W" 
                              className="h-12 text-base"
                              value={formData.categorySpecs?.powerConsumption || ""}
                              onChange={(e) => updateCategorySpec("powerConsumption", e.target.value)}
                            />
                          </div>
                          <div className="space-y-3">
                            <Label className="text-base font-medium">PoE Support</Label>
                            <Input 
                              placeholder="e.g., PoE+, PoE++, 370W budget" 
                              className="h-12 text-base"
                              value={formData.categorySpecs?.poeSupport || ""}
                              onChange={(e) => updateCategorySpec("poeSupport", e.target.value)}
                            />
                          </div>
                          <div className="space-y-3">
                            <Label className="text-base font-medium">Management</Label>
                            <Input 
                              placeholder="e.g., Managed, Unmanaged, Smart" 
                              className="h-12 text-base"
                              value={formData.categorySpecs?.management || ""}
                              onChange={(e) => updateCategorySpec("management", e.target.value)}
                            />
                          </div>
                        </div>
                        <div className="mt-6">
                          <Label className="text-base font-medium">Features</Label>
                          <Textarea 
                            placeholder="e.g., VLAN support, QoS, SNMP, Link aggregation, Spanning tree"
                            className="mt-2 text-base resize-none"
                            rows={2}
                            value={formData.categorySpecs?.features || ""}
                            onChange={(e) => updateCategorySpec("features", e.target.value)}
                          />
                        </div>
                      </div>
                    )}

                    {formData.category === "Server" && (
                      <div className="bg-red-50 rounded-lg p-6 border border-red-200">
                        <h3 className="text-lg font-semibold mb-4 flex items-center">
                          <HardDrive className="h-5 w-5 mr-2" />
                          Server Specifications
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="space-y-3">
                            <Label className="text-base font-medium">Processor</Label>
                            <Input 
                              placeholder="e.g., Intel Xeon Silver 4314, 2.4GHz" 
                              className="h-12 text-base"
                              value={formData.categorySpecs?.processor || ""}
                              onChange={(e) => updateCategorySpec("processor", e.target.

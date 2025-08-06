"use client"

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { ArrowLeft, ArrowRight, Save, Check, Package, MapPin, DollarSign, Settings, Eye, HardDrive, Monitor, Globe, Loader2 } from 'lucide-react'
import { toast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"
import { useAuth } from "@/contexts/auth-context"
import { collection, query, where, getDocs, doc, updateDoc, getDoc, serverTimestamp } from "firebase/firestore"
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
  status: "active" | "inactive" | "maintenance" | "retired"
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

export default function EditInventoryItemPage() {
  const router = useRouter()
  const params = useParams()
  const { userData } = useAuth()
  const [currentStep, setCurrentStep] = useState(1)
  const [users, setUsers] = useState<User[]>([])
  const [loadingUsers, setLoadingUsers] = useState(false)
  const [loadingItem, setLoadingItem] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [itemId] = useState(params.id as string)
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
    status: "active",
  })

  const visibleSteps = getVisibleSteps(formData.type)

  // Fetch the existing item data
  useEffect(() => {
    const fetchItem = async () => {
      if (!itemId) return

      try {
        const itemRef = doc(db, "itInventory", itemId)
        const itemSnap = await getDoc(itemRef)

        if (itemSnap.exists()) {
          const data = itemSnap.data()
          setFormData({
            name: data.name || "",
            type: data.type || "hardware",
            category: data.category || "",
            brand: data.brand || "",
            department: data.department || "",
            assignedTo: data.assignedTo || "",
            condition: data.condition || "excellent",
            vendorType: data.vendorType || "physical",
            storeName: data.storeName || "",
            storeLocation: data.storeLocation || "",
            websiteName: data.websiteName || "",
            websiteUrl: data.websiteUrl || "",
            purchaseDate: data.purchaseDate || "",
            warrantyExpiry: data.warrantyExpiry || "",
            cost: data.cost ? data.cost.toString() : "",
            currency: data.currency || "USD",
            description: data.description || "",
            serialNumber: data.serialNumber || "",
            specifications: data.specifications || "",
            licenseKey: data.licenseKey || "",
            version: data.version || "",
            status: data.status || "active",
          })
        } else {
          toast({
            title: "Error",
            description: "Item not found",
            variant: "destructive",
          })
          router.push("/it/inventory")
        }
      } catch (error) {
        console.error("Error fetching item:", error)
        toast({
          title: "Error",
          description: "Failed to load item data",
          variant: "destructive",
        })
        router.push("/it/inventory")
      } finally {
        setLoadingItem(false)
      }
    }

    fetchItem()
  }, [itemId, router])

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
      // Prepare the data to be updated
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
        status: formData.status,
        updated_at: serverTimestamp(),
      }

      console.log("Updating item data:", itemData)

      // Update in Firestore
      const itemRef = doc(db, "itInventory", itemId)
      await updateDoc(itemRef, itemData)

      console.log("Document updated successfully")

      toast({
        title: "Item Updated Successfully",
        description: `${formData.name} has been updated in the inventory`,
      })

      router.push("/it/inventory")
    } catch (error) {
      console.error("Error updating document: ", error)
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

  if (loadingItem) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
        <div className="container mx-auto p-6 max-w-5xl">
          <div className="flex justify-center items-center min-h-[400px]">
            <div className="flex flex-col items-center space-y-4">
              <Loader2 className="h-8 w-8 animate-spin" />
              <p className="text-muted-foreground">Loading item data...</p>
            </div>
          </div>
        </div>
      </div>
    )
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
              <p className="text-muted-foreground">Update the essential details of your inventory item</p>
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

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                    <Label htmlFor="status" className="text-base font-medium">
                      Status
                    </Label>
                    <Select
                      value={formData.status}
                      onValueChange={(value: "active" | "inactive" | "maintenance" | "retired") =>
                        setFormData({ ...formData, status: value })
                      }
                    >
                      <SelectTrigger className="h-12 text-base">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="active">
                          <Badge variant="outline" className="bg-green-100 text-green-800 border-green-200">
                            Active
                          </Badge>
                        </SelectItem>
                        <SelectItem value="inactive">
                          <Badge variant="outline" className="bg-gray-100 text-gray-800 border-gray-200">
                            Inactive
                          </Badge>
                        </SelectItem>
                        <SelectItem value="maintenance">
                          <Badge variant="outline" className="bg-yellow-100 text-yellow-800 border-yellow-200">
                            Maintenance
                          </Badge>
                        </SelectItem>
                        <SelectItem value="retired">
                          <Badge variant="outline" className="bg-red-100 text-red-800 border-red-200">
                            Retired
                          </Badge>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
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
              <p className="text-muted-foreground">Update vendor and store information</p>
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
              <p className="text-muted-foreground">Update the financial aspects and warranty information</p>
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
                Update {formData.type === "hardware" ? "hardware" : "software"}-specific technical details
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

      case "Review":
        return (
          <div className="space-y-8">
            <div className="text-center space-y-2">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-indigo-100 mb-4">
                <Eye className="h-8 w-8 text-indigo-600" />
              </div>
              <h2 className="text-2xl font-bold">Review & Update</h2>
              <p className="text-muted-foreground">Please review all changes before updating the inventory item</p>
            </div>

            <Card className="border-2 border-indigo-200">
              <CardHeader className="bg-indigo-50">
                <CardTitle className="flex items-center space-x-2">
                  <Package className="h-5 w-5" />
                  <span>{formData.name || "Unnamed Item"}</span>
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
                        <div className="flex justify-between items-center py-2 border-b border-muted">
                          <span className="text-sm font-medium">Status:</span>
                          <Badge
                            variant="outline"
                            className={cn(
                              formData.status === "active" && "bg-green-100 text-green-800 border-green-200",
                              formData.status === "inactive" && "bg-gray-100 text-gray-800 border-gray-200",
                              formData.status === "maintenance" && "bg-yellow-100 text-yellow-800 border-yellow-200",
                              formData.status === "retired" && "bg-red-100 text-red-800 border-red-200",
                            )}
                          >
                            {formData.status}
                          </Badge>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h4 className="font-semibold text-sm text-muted-foreground mb-3 uppercase tracking-wide">
                        Vendor & Assignment
                      </h4>
                      <div className="space-y-3">
                        <div className="flex justify-between items-center py-2 border-b border-muted">
                          <span className="text-sm font-medium">Store Type:</span>
                          <Badge variant="secondary" className="capitalize">
                            {formData.vendorType === "physical" ? "Physical Store" : "Online Store"}
                          </Badge>
                        </div>
                        <div className="flex justify-between items-center py-2 border-b border-muted">
                          <span className="text-sm font-medium">Store Name:</span>
                          <span className="text-sm text-muted-foreground">{formData.storeName || "Not specified"}</span>
                        </div>
                        {formData.vendorType === "physical" && (
                          <div className="flex justify-between items-start py-2 border-b border-muted">
                            <span className="text-sm font-medium">Store Location:</span>
                            <span className="text-sm text-muted-foreground text-right max-w-xs">
                              {formData.storeLocation || "Not specified"}
                            </span>
                          </div>
                        )}
                        {formData.vendorType === "online" && (
                          <>
                            <div className="flex justify-between items-center py-2 border-b border-muted">
                              <span className="text-sm font-medium">Website Name:</span>
                              <span className="text-sm text-muted-foreground">
                                {formData.websiteName || "Not specified"}
                              </span>
                            </div>
                            <div className="flex justify-between items-start py-2 border-b border-muted">
                              <span className="text-sm font-medium">Website URL:</span>
                              <span className="text-sm text-muted-foreground text-right max-w-xs break-all">
                                {formData.websiteUrl ? (
                                  <a
                                    href={formData.websiteUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-blue-600 hover:text-blue-800 underline"
                                  >
                                    {formData.websiteUrl}
                                  </a>
                                ) : (
                                  "Not specified"
                                )}
                              </span>
                            </div>
                          </>
                        )}
                        <div className="flex justify-between items-center py-2 border-b border-muted">
                          <span className="text-sm font-medium">Assigned To:</span>
                          <span className="text-sm text-muted-foreground">
                            {getUserDisplayName(formData.assignedTo) || "Unassigned"}
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
                            {formData.cost
                              ? `${formData.currency || "USD"} ${Number.parseFloat(formData.cost).toLocaleString()}`
                              : "Not specified"}
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
              <h1 className="text-3xl font-bold text-slate-900">Edit Item</h1>
              <p className="text-slate-600">Update inventory item in {visibleSteps.length} simple steps</p>
            </div>
          </div>
          <Badge variant="outline" className="text-sm px-3 py-1">
            Step {currentStep} of {visibleSteps.length}
          </Badge>
        </div>

        {/* Modern Stepper */}
        <div className="mb-12">
          <div className="flex items-center justify-between relative">
            {/* Progress Line */}
            <div className="absolute top-8 left-8 right-8 h-0.5 bg-slate-200 -z-10">
              <div
                className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 transition-all duration-500 ease-out"
                style={{ width: `${((currentStep - 1) / (visibleSteps.length - 1)) * 100}%` }}
              />
            </div>

            {visibleSteps.map((step, index) => {
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
            {currentStep < visibleSteps.length ? (
              <Button type="button" onClick={handleNext} className="shadow-sm">
                Next Step
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            ) : (
              <Button
                type="button"
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="shadow-sm bg-green-600 hover:bg-green-700"
              >
                <Save className="h-4 w-4 mr-2" />
                {isSubmitting ? "Updating..." : "Update Item"}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

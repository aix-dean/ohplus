"use client"

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { ArrowLeft, Edit, Trash2, Package, HardDrive, Monitor, Globe, MapPin, DollarSign, Calendar, Settings, User, Building, AlertCircle, Loader2, ExternalLink } from 'lucide-react'
import { toast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"
import { useAuth } from "@/contexts/auth-context"
import { collection, query, where, getDocs, doc, getDoc, updateDoc, serverTimestamp } from "firebase/firestore"
import { db } from "@/lib/firebase"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

interface InventoryItem {
  id: string
  name: string
  type: "hardware" | "software"
  category: string
  brand: string
  department: string
  assignedTo: string
  condition: "excellent" | "good" | "fair" | "poor" | "damaged"
  status: "active" | "inactive" | "maintenance" | "retired"
  cost: number
  currency: string
  purchaseDate: string
  warrantyExpiry: string
  serialNumber?: string
  licenseKey?: string
  version?: string
  description: string
  vendorType: "physical" | "online"
  storeName: string
  storeLocation: string
  websiteName: string
  websiteUrl: string
  specifications?: string
  categorySpecs?: Record<string, any>
  created_at: any
  updated_at: any
  created_by: string
  company_id: string
  deleted: boolean
}

interface User {
  id: string
  uid: string
  first_name: string
  last_name: string
  email: string
  company_id?: string
}

const statusColors = {
  active: "bg-green-100 text-green-800 border-green-200",
  inactive: "bg-gray-100 text-gray-800 border-gray-200",
  maintenance: "bg-yellow-100 text-yellow-800 border-yellow-200",
  retired: "bg-red-100 text-red-800 border-red-200",
}

const conditionColors = {
  excellent: "bg-green-100 text-green-800 border-green-200",
  good: "bg-blue-100 text-blue-800 border-blue-200",
  fair: "bg-yellow-100 text-yellow-800 border-yellow-200",
  poor: "bg-orange-100 text-orange-800 border-orange-200",
  damaged: "bg-red-100 text-red-800 border-red-200",
}

export default function InventoryDetailsPage() {
  const router = useRouter()
  const params = useParams()
  const { userData } = useAuth()
  const [item, setItem] = useState<InventoryItem | null>(null)
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  // Fetch item details
  useEffect(() => {
    const fetchItem = async () => {
      if (!params.id || typeof params.id !== 'string') return

      try {
        const itemRef = doc(db, "itInventory", params.id)
        const itemSnap = await getDoc(itemRef)

        if (itemSnap.exists()) {
          const data = itemSnap.data()
          
          // Check if item is deleted
          if (data.deleted === true) {
            toast({
              title: "Item Not Found",
              description: "This item has been deleted or does not exist",
              variant: "destructive",
            })
            router.push("/it/inventory")
            return
          }

          setItem({
            id: itemSnap.id,
            name: data.name || "",
            type: data.type || "hardware",
            category: data.category || "",
            brand: data.brand || "",
            department: data.department || "",
            assignedTo: data.assignedTo || "unassigned",
            condition: data.condition || "excellent",
            status: data.status || "active",
            cost: data.cost || 0,
            currency: data.currency || "USD",
            purchaseDate: data.purchaseDate || "",
            warrantyExpiry: data.warrantyExpiry || "",
            serialNumber: data.serialNumber || "",
            licenseKey: data.licenseKey || "",
            version: data.version || "",
            description: data.description || "",
            vendorType: data.vendorType || "physical",
            storeName: data.storeName || "",
            storeLocation: data.storeLocation || "",
            websiteName: data.websiteName || "",
            websiteUrl: data.websiteUrl || "",
            specifications: data.specifications || "",
            categorySpecs: data.categorySpecs || {},
            created_at: data.created_at,
            updated_at: data.updated_at,
            created_by: data.created_by || "",
            company_id: data.company_id || "",
            deleted: data.deleted || false,
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
          description: "Failed to load item details",
          variant: "destructive",
        })
        router.push("/it/inventory")
      } finally {
        setLoading(false)
      }
    }

    fetchItem()
  }, [params.id, router])

  // Fetch users for display names
  useEffect(() => {
    const fetchUsers = async () => {
      if (!userData?.company_id) return

      try {
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
          })
        })

        setUsers(fetchedUsers)
      } catch (error) {
        console.error("Error fetching users:", error)
      }
    }

    fetchUsers()
  }, [userData?.company_id])

  // Helper function to get user display name
  const getUserDisplayName = (uid: string) => {
    if (uid === "unassigned") return "Unassigned"
    const user = users.find((u) => u.uid === uid)
    if (!user) return "Unknown User"
    return `${user.first_name} ${user.last_name}`.trim() || user.email
  }

  const handleEdit = () => {
    if (item) {
      router.push(`/it/inventory/edit/${item.id}`)
    }
  }

  const handleDelete = () => {
    setDeleteDialogOpen(true)
  }

  const confirmDelete = async () => {
    if (!item) return

    setIsDeleting(true)
    try {
      // Soft delete: update the deleted field to true instead of actually deleting the document
      const itemRef = doc(db, "itInventory", item.id)
      await updateDoc(itemRef, {
        deleted: true,
        deleted_at: serverTimestamp(),
        updated_at: serverTimestamp(),
      })

      // Close dialog and reset state first
      setDeleteDialogOpen(false)
      setIsDeleting(false)

      // Show success toast
      toast({
        title: "Item Deleted",
        description: `${item.name} has been deleted from inventory`,
      })

      // Navigate back to inventory list after a short delay
      setTimeout(() => {
        router.push("/it/inventory")
      }, 1000)
    } catch (error) {
      console.error("Error deleting item:", error)
      toast({
        title: "Error",
        description: "Failed to delete item. Please try again.",
        variant: "destructive",
      })
      // Reset states on error
      setIsDeleting(false)
      setDeleteDialogOpen(false)
    }
  }

  const handleBack = () => {
    router.push("/it/inventory")
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
        <div className="container mx-auto p-6">
          <div className="flex justify-center items-center min-h-[400px]">
            <div className="flex flex-col items-center space-y-4">
              <Loader2 className="h-8 w-8 animate-spin" />
              <p className="text-muted-foreground">Loading item details...</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!item) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
        <div className="container mx-auto p-6">
          <div className="flex justify-center items-center min-h-[400px]">
            <div className="flex flex-col items-center space-y-4">
              <AlertCircle className="h-12 w-12 text-red-500" />
              <p className="text-lg font-semibold">Item not found</p>
              <Button onClick={handleBack}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Inventory
              </Button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  const handleDeleteDialogClose = () => {
    if (!isDeleting) {
      setDeleteDialogOpen(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="container mx-auto p-6 max-w-6xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-4">
            <Button variant="outline" size="sm" onClick={handleBack} className="shadow-sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Inventory
            </Button>
            <Separator orientation="vertical" className="h-6" />
            <div>
              <h1 className="text-3xl font-bold text-slate-900">{item.name}</h1>
              <p className="text-slate-600">{item.brand} • {item.category}</p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <Button variant="outline" onClick={handleEdit} className="shadow-sm">
              <Edit className="h-4 w-4 mr-2" />
              Edit Item
            </Button>
            <Button variant="outline" onClick={handleDelete} className="shadow-sm text-red-600 hover:text-red-700 hover:bg-red-50">
              <Trash2 className="h-4 w-4 mr-2" />
              Delete
            </Button>
          </div>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Main Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Basic Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  {item.type === "hardware" ? (
                    <HardDrive className="h-5 w-5 text-blue-600" />
                  ) : (
                    <Monitor className="h-5 w-5 text-green-600" />
                  )}
                  <span>Basic Information</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-muted-foreground">Item Type</p>
                    <Badge variant="secondary" className="capitalize">
                      {item.type}
                    </Badge>
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-muted-foreground">Category</p>
                    <p className="text-sm">{item.category}</p>
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-muted-foreground">Brand</p>
                    <p className="text-sm">{item.brand}</p>
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-muted-foreground">Department</p>
                    <div className="flex items-center space-x-2">
                      <Building className="h-4 w-4 text-muted-foreground" />
                      <p className="text-sm">{item.department}</p>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-muted-foreground">Status</p>
                    <Badge variant="outline" className={cn(statusColors[item.status])}>
                      {item.status}
                    </Badge>
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-muted-foreground">Condition</p>
                    <Badge variant="outline" className={cn(conditionColors[item.condition])}>
                      {item.condition}
                    </Badge>
                  </div>
                </div>
                {item.description && (
                  <div className="pt-4 border-t">
                    <p className="text-sm font-medium text-muted-foreground mb-2">Description</p>
                    <p className="text-sm text-muted-foreground">{item.description}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Technical Specifications */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Settings className="h-5 w-5 text-purple-600" />
                  <span>Technical Specifications</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {item.type === "hardware" ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {item.serialNumber && (
                      <div className="space-y-2">
                        <p className="text-sm font-medium text-muted-foreground">Serial Number</p>
                        <p className="text-sm font-mono bg-muted px-2 py-1 rounded">{item.serialNumber}</p>
                      </div>
                    )}
                    {item.specifications && (
                      <div className="space-y-2">
                        <p className="text-sm font-medium text-muted-foreground">General Specifications</p>
                        <p className="text-sm">{item.specifications}</p>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {item.licenseKey && (
                      <div className="space-y-2">
                        <p className="text-sm font-medium text-muted-foreground">License Key</p>
                        <p className="text-sm font-mono bg-muted px-2 py-1 rounded">{item.licenseKey}</p>
                      </div>
                    )}
                    {item.version && (
                      <div className="space-y-2">
                        <p className="text-sm font-medium text-muted-foreground">Version</p>
                        <p className="text-sm">{item.version}</p>
                      </div>
                    )}
                  </div>
                )}

                {/* Category-specific specifications */}
                {item.categorySpecs && Object.keys(item.categorySpecs).length > 0 && (
                  <div className="pt-4 border-t">
                    <p className="text-sm font-medium text-muted-foreground mb-4">Category-Specific Details</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {Object.entries(item.categorySpecs).map(([key, value]) => {
                        if (!value) return null
                        return (
                          <div key={key} className="space-y-2">
                            <p className="text-sm font-medium text-muted-foreground capitalize">
                              {key.replace(/([A-Z])/g, ' $1').trim()}
                            </p>
                            <p className="text-sm">{value}</p>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Vendor Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  {item.vendorType === "physical" ? (
                    <MapPin className="h-5 w-5 text-green-600" />
                  ) : (
                    <Globe className="h-5 w-5 text-blue-600" />
                  )}
                  <span>Vendor Information</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-muted-foreground">Store Type</p>
                    <Badge variant="secondary" className="capitalize">
                      {item.vendorType === "physical" ? "Physical Store" : "Online Store"}
                    </Badge>
                  </div>
                  {item.storeName && (
                    <div className="space-y-2">
                      <p className="text-sm font-medium text-muted-foreground">Store Name</p>
                      <p className="text-sm">{item.storeName}</p>
                    </div>
                  )}
                </div>

                {item.vendorType === "physical" && item.storeLocation && (
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-muted-foreground">Store Location</p>
                    <div className="flex items-start space-x-2">
                      <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                      <p className="text-sm">{item.storeLocation}</p>
                    </div>
                  </div>
                )}

                {item.vendorType === "online" && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {item.websiteName && (
                      <div className="space-y-2">
                        <p className="text-sm font-medium text-muted-foreground">Website Name</p>
                        <p className="text-sm">{item.websiteName}</p>
                      </div>
                    )}
                    {item.websiteUrl && (
                      <div className="space-y-2">
                        <p className="text-sm font-medium text-muted-foreground">Website URL</p>
                        <a
                          href={item.websiteUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-blue-600 hover:text-blue-800 underline flex items-center space-x-1"
                        >
                          <span className="break-all">{item.websiteUrl}</span>
                          <ExternalLink className="h-3 w-3 flex-shrink-0" />
                        </a>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Summary & Actions */}
          <div className="space-y-6">
            {/* Assignment & Status */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <User className="h-5 w-5 text-indigo-600" />
                  <span>Assignment</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <p className="text-sm font-medium text-muted-foreground">Assigned To</p>
                  <div className="flex items-center space-x-2">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <p className="text-sm">{getUserDisplayName(item.assignedTo)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Financial Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <DollarSign className="h-5 w-5 text-yellow-600" />
                  <span>Financial</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {item.cost > 0 && (
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-muted-foreground">Purchase Cost</p>
                    <p className="text-lg font-semibold">
                      {item.currency} {item.cost.toLocaleString()}
                    </p>
                  </div>
                )}
                {item.purchaseDate && (
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-muted-foreground">Purchase Date</p>
                    <div className="flex items-center space-x-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <p className="text-sm">{new Date(item.purchaseDate).toLocaleDateString()}</p>
                    </div>
                  </div>
                )}
                {item.warrantyExpiry && (
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-muted-foreground">Warranty Expiry</p>
                    <div className="flex items-center space-x-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <p className="text-sm">{new Date(item.warrantyExpiry).toLocaleDateString()}</p>
                      {new Date(item.warrantyExpiry) < new Date() && (
                        <Badge variant="outline" className="bg-red-100 text-red-800 border-red-200 text-xs">
                          Expired
                        </Badge>
                      )}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button onClick={handleEdit} className="w-full justify-start" variant="outline">
                  <Edit className="h-4 w-4 mr-2" />
                  Edit Item Details
                </Button>
                <Button 
                  onClick={handleDelete} 
                  className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50" 
                  variant="outline"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Item
                </Button>
              </CardContent>
            </Card>

            {/* Metadata */}
            <Card>
              <CardHeader>
                <CardTitle>Item Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm text-muted-foreground">
                <div className="flex justify-between">
                  <span>Item ID:</span>
                  <span className="font-mono">{item.id}</span>
                </div>
                {item.created_at && (
                  <div className="flex justify-between">
                    <span>Created:</span>
                    <span>{new Date(item.created_at.toDate()).toLocaleDateString()}</span>
                  </div>
                )}
                {item.updated_at && (
                  <div className="flex justify-between">
                    <span>Last Updated:</span>
                    <span>{new Date(item.updated_at.toDate()).toLocaleDateString()}</span>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={deleteDialogOpen} onOpenChange={handleDeleteDialogClose}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle className="flex items-center space-x-2">
                <AlertCircle className="h-5 w-5 text-red-600" />
                <span>Delete Inventory Item</span>
              </AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete "{item.name}"? This action will move the item to trash and it won't be visible in your inventory list.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={confirmDelete}
                disabled={isDeleting}
                className="bg-red-600 hover:bg-red-700"
              >
                {isDeleting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Deleting...
                  </>
                ) : (
                  "Delete Item"
                )}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  )
}

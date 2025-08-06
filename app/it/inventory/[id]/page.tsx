"use client"

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { ArrowLeft, Edit, Trash2, Package, Monitor, Smartphone, Printer, Wifi, HardDrive, Shield, Server, Laptop, Loader2, Calendar, DollarSign, User, Building, MapPin, Globe, Clock, Settings } from 'lucide-react'
import { toast } from "@/hooks/use-toast"
import { useAuth } from "@/contexts/auth-context"
import { doc, getDoc, deleteDoc, collection, query, where, getDocs } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { cn } from "@/lib/utils"

interface InventoryItem {
  id: string
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
  cost: number
  currency: string
  description: string
  serialNumber: string
  specifications: string
  licenseKey: string
  version: string
  status: "active" | "inactive" | "maintenance" | "retired"
  company_id: string
  created_by: string
  created_at: any
  updated_at: any
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

const categoryIcons = {
  "Desktop Computer": Monitor,
  Laptop: Laptop,
  Server: Server,
  Printer: Printer,
  "Network Switch": Wifi,
  Router: Wifi,
  Firewall: Shield,
  Monitor: Monitor,
  Smartphone: Smartphone,
  Tablet: Smartphone,
  "Operating System": HardDrive,
  "Productivity Suite": Package,
  "Design Software": Package,
  "Security Software": Shield,
  "Database Software": HardDrive,
  "Development Tools": Package,
}

export default function InventoryItemDetailsPage() {
  const router = useRouter()
  const params = useParams()
  const { userData } = useAuth()
  const [item, setItem] = useState<InventoryItem | null>(null)
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

  const itemId = params.id as string

  // Fetch users by company_id
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
            license_key: data.license_key,
          })
        })

        setUsers(fetchedUsers)
      } catch (error) {
        console.error("Error fetching users:", error)
      }
    }

    fetchUsers()
  }, [userData?.company_id])

  // Helper function to get user display name from uid
  const getUserDisplayName = (uid: string) => {
    if (uid === "unassigned" || !uid) return "Unassigned"
    const user = users.find((u) => u.uid === uid)
    if (!user) return "Unknown User"
    return `${user.first_name} ${user.last_name}`.trim() || user.email
  }

  // Fetch item data
  useEffect(() => {
    const fetchItem = async () => {
      if (!itemId || !userData?.company_id) return

      try {
        const itemRef = doc(db, "itInventory", itemId)
        const itemSnap = await getDoc(itemRef)

        if (itemSnap.exists()) {
          const itemData = { id: itemSnap.id, ...itemSnap.data() } as InventoryItem
          
          // Check if user has access to this item (same company)
          if (itemData.company_id === userData.company_id) {
            setItem(itemData)
          } else {
            setNotFound(true)
          }
        } else {
          setNotFound(true)
        }
      } catch (error) {
        console.error("Error fetching item:", error)
        toast({
          title: "Error",
          description: "Failed to fetch item details",
          variant: "destructive",
        })
        setNotFound(true)
      } finally {
        setLoading(false)
      }
    }

    fetchItem()
  }, [itemId, userData?.company_id])

  const handleEdit = () => {
    router.push(`/it/inventory/edit/${itemId}`)
  }

  const handleDelete = async () => {
    if (!item) return

    try {
      await deleteDoc(doc(db, "itInventory", item.id))
      toast({
        title: "Success",
        description: "Inventory item deleted successfully",
      })
      router.push("/it/inventory")
    } catch (error) {
      console.error("Error deleting item:", error)
      toast({
        title: "Error",
        description: "Failed to delete inventory item",
        variant: "destructive",
      })
    }
  }

  const handleBack = () => {
    router.push("/it/inventory")
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
        <div className="container mx-auto p-6 max-w-6xl">
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

  if (notFound || !item) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
        <div className="container mx-auto p-6 max-w-6xl">
          <div className="flex items-center justify-between mb-8">
            <Button variant="outline" size="sm" onClick={handleBack} className="shadow-sm bg-transparent">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Inventory
            </Button>
          </div>
          
          <Card className="max-w-md mx-auto">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Package className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">Item not found</h3>
              <p className="text-muted-foreground text-center">
                The inventory item you're looking for doesn't exist or you don't have access to it.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  const IconComponent = categoryIcons[item.category as keyof typeof categoryIcons] || Package

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="container mx-auto p-6 max-w-6xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-4">
            <Button variant="outline" size="sm" onClick={handleBack} className="shadow-sm bg-transparent">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Inventory
            </Button>
            <Separator orientation="vertical" className="h-6" />
            <div>
              <h1 className="text-3xl font-bold text-slate-900">Item Details</h1>
              <p className="text-slate-600">Complete information about this inventory item</p>
            </div>
          </div>
          <div className="flex space-x-2">
            <Button onClick={handleEdit} className="shadow-sm">
              <Edit className="h-4 w-4 mr-2" />
              Edit Item
            </Button>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" className="shadow-sm">
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This action cannot be undone. This will permanently delete the inventory item "{item.name}".
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Information */}
          <div className="lg:col-span-2 space-y-6">
            {/* Item Overview */}
            <Card className="border-2 shadow-sm">
              <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b">
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="p-3 bg-white rounded-lg shadow-sm">
                      <IconComponent className="h-8 w-8 text-blue-600" />
                    </div>
                    <div>
                      <CardTitle className="text-2xl text-slate-900">{item.name}</CardTitle>
                      <CardDescription className="text-lg">{item.category}</CardDescription>
                    </div>
                  </div>
                  <div className="flex flex-col items-end space-y-2">
                    <Badge variant="outline" className={cn("text-sm", statusColors[item.status])}>
                      {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
                    </Badge>
                    <Badge variant="outline" className="capitalize">
                      {item.type}
                    </Badge>
                  </div>
                </div>
                {item.description && (
                  <p className="text-slate-700 mt-4 leading-relaxed">{item.description}</p>
                )}
              </CardHeader>
            </Card>

            {/* Technical Details */}
            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Settings className="h-5 w-5" />
                  <span>Technical Details</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Brand</label>
                      <p className="text-base font-medium">{item.brand || "Not specified"}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Condition</label>
                      <div className="mt-1">
                        <Badge variant="outline" className={cn("text-sm", conditionColors[item.condition])}>
                          {item.condition.charAt(0).toUpperCase() + item.condition.slice(1)}
                        </Badge>
                      </div>
                    </div>
                    {item.type === "hardware" && item.serialNumber && (
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Serial Number</label>
                        <p className="text-base font-mono bg-slate-100 px-2 py-1 rounded text-sm">
                          {item.serialNumber}
                        </p>
                      </div>
                    )}
                  </div>
                  <div className="space-y-4">
                    {item.type === "hardware" && item.specifications && (
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Specifications</label>
                        <p className="text-base">{item.specifications}</p>
                      </div>
                    )}
                    {item.type === "software" && (
                      <>
                        {item.version && (
                          <div>
                            <label className="text-sm font-medium text-muted-foreground">Version</label>
                            <p className="text-base font-medium">{item.version}</p>
                          </div>
                        )}
                        {item.licenseKey && (
                          <div>
                            <label className="text-sm font-medium text-muted-foreground">License Key</label>
                            <p className="text-base font-mono bg-slate-100 px-2 py-1 rounded text-sm">
                              {item.licenseKey}
                            </p>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Purchase Information */}
            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <DollarSign className="h-5 w-5" />
                  <span>Purchase Information</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Cost</label>
                      <p className="text-2xl font-bold text-green-600">
                        {item.currency} {(item.cost || 0).toLocaleString()}
                      </p>
                    </div>
                    {item.purchaseDate && (
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Purchase Date</label>
                        <p className="text-base flex items-center space-x-2">
                          <Calendar className="h-4 w-4" />
                          <span>{new Date(item.purchaseDate).toLocaleDateString()}</span>
                        </p>
                      </div>
                    )}
                  </div>
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Store Type</label>
                      <Badge variant="outline" className="capitalize">
                        {item.vendorType === "physical" ? "Physical Store" : "Online Store"}
                      </Badge>
                    </div>
                    {item.warrantyExpiry && (
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Warranty Expiry</label>
                        <p className="text-base flex items-center space-x-2">
                          <Calendar className="h-4 w-4" />
                          <span>{new Date(item.warrantyExpiry).toLocaleDateString()}</span>
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Vendor Details */}
                {item.storeName && (
                  <div className="border-t pt-4">
                    <h4 className="font-medium mb-3">Vendor Details</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Store Name</label>
                        <p className="text-base">{item.storeName}</p>
                      </div>
                      {item.vendorType === "physical" && item.storeLocation && (
                        <div>
                          <label className="text-sm font-medium text-muted-foreground">Location</label>
                          <p className="text-base flex items-start space-x-2">
                            <MapPin className="h-4 w-4 mt-0.5 flex-shrink-0" />
                            <span>{item.storeLocation}</span>
                          </p>
                        </div>
                      )}
                      {item.vendorType === "online" && (
                        <>
                          {item.websiteName && (
                            <div>
                              <label className="text-sm font-medium text-muted-foreground">Website</label>
                              <p className="text-base">{item.websiteName}</p>
                            </div>
                          )}
                          {item.websiteUrl && (
                            <div>
                              <label className="text-sm font-medium text-muted-foreground">URL</label>
                              <p className="text-base">
                                <a
                                  href={item.websiteUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-blue-600 hover:text-blue-800 underline flex items-center space-x-1"
                                >
                                  <Globe className="h-4 w-4" />
                                  <span className="break-all">{item.websiteUrl}</span>
                                </a>
                              </p>
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Assignment Details */}
            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <User className="h-5 w-5" />
                  <span>Assignment</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Department</label>
                  <p className="text-base flex items-center space-x-2">
                    <Building className="h-4 w-4" />
                    <span>{item.department}</span>
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Assigned To</label>
                  <p className="text-base flex items-center space-x-2">
                    <User className="h-4 w-4" />
                    <span>{getUserDisplayName(item.assignedTo)}</span>
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Timeline */}
            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Clock className="h-5 w-5" />
                  <span>Timeline</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Created</label>
                  <p className="text-sm">
                    {item.created_at ? new Date(item.created_at.toDate()).toLocaleString() : "Unknown"}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Last Updated</label>
                  <p className="text-sm">
                    {item.updated_at ? new Date(item.updated_at.toDate()).toLocaleString() : "Unknown"}
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button onClick={handleEdit} className="w-full justify-start">
                  <Edit className="h-4 w-4 mr-2" />
                  Edit Item
                </Button>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive" className="w-full justify-start">
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete Item
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This action cannot be undone. This will permanently delete the inventory item "{item.name}".
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}

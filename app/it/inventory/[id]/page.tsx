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
import { ArrowLeft, Edit, Trash2, Monitor, Smartphone, Printer, Wifi, HardDrive, Shield, Package, Server, Laptop, Loader2, Calendar, DollarSign, User, Building, MapPin, Globe, Key, Hash, Settings, FileText, ShoppingCart } from 'lucide-react'
import { toast } from "@/hooks/use-toast"
import { useAuth } from "@/contexts/auth-context"
import { collection, query, where, getDocs, doc, getDoc, deleteDoc } from "firebase/firestore"
import { db } from "@/lib/firebase"

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
  const [loadingUsers, setLoadingUsers] = useState(false)
  const [notFound, setNotFound] = useState(false)

  const itemId = params.id as string

  // Fetch users by company_id
  useEffect(() => {
    const fetchUsers = async () => {
      if (!userData?.company_id) return

      setLoadingUsers(true)
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
      } finally {
        setLoadingUsers(false)
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

  // Fetch item details
  useEffect(() => {
    const fetchItem = async () => {
      if (!itemId) return

      try {
        const itemRef = doc(db, "itInventory", itemId)
        const itemSnap = await getDoc(itemRef)

        if (itemSnap.exists()) {
          const itemData = { id: itemSnap.id, ...itemSnap.data() } as InventoryItem
          
          // Check if user has access to this item (same company)
          if (userData?.company_id && itemData.company_id !== userData.company_id) {
            setNotFound(true)
            return
          }
          
          setItem(itemData)
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
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex justify-center items-center min-h-[400px]">
          <div className="flex flex-col items-center space-y-4">
            <Loader2 className="h-8 w-8 animate-spin" />
            <p className="text-muted-foreground">Loading item details...</p>
          </div>
        </div>
      </div>
    )
  }

  if (notFound || !item) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex items-center space-x-4">
          <Button variant="outline" onClick={handleBack}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Inventory
          </Button>
        </div>
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Package className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Item not found</h3>
            <p className="text-muted-foreground text-center">
              The inventory item you're looking for doesn't exist or you don't have access to it.
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  const IconComponent = categoryIcons[item.category as keyof typeof categoryIcons] || Package

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button variant="outline" onClick={handleBack}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Inventory
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Inventory Item Details</h1>
            <p className="text-muted-foreground">View and manage item information</p>
          </div>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline" onClick={handleEdit}>
            <Edit className="h-4 w-4 mr-2" />
            Edit
          </Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="outline">
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
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Main Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <div className="flex items-center space-x-3">
                <IconComponent className="h-8 w-8 text-muted-foreground" />
                <div>
                  <CardTitle className="text-2xl">{item.name}</CardTitle>
                  <CardDescription className="text-lg">{item.category}</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-4">
                <Badge variant="outline" className={statusColors[item.status]}>
                  {item.status?.charAt(0).toUpperCase() + item.status?.slice(1)}
                </Badge>
                <Badge variant="outline" className={conditionColors[item.condition]}>
                  {item.condition?.charAt(0).toUpperCase() + item.condition?.slice(1)}
                </Badge>
                <Badge variant="outline">
                  {item.type?.charAt(0).toUpperCase() + item.type?.slice(1)}
                </Badge>
              </div>
              
              {item.description && (
                <div>
                  <h4 className="font-semibold mb-2 flex items-center">
                    <FileText className="h-4 w-4 mr-2" />
                    Description
                  </h4>
                  <p className="text-muted-foreground">{item.description}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Technical Details */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Settings className="h-5 w-5 mr-2" />
                Technical Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Brand</label>
                  <p className="text-sm">{item.brand || 'N/A'}</p>
                </div>
                {item.type === "hardware" && item.serialNumber && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground flex items-center">
                      <Hash className="h-3 w-3 mr-1" />
                      Serial Number
                    </label>
                    <p className="text-sm font-mono">{item.serialNumber}</p>
                  </div>
                )}
                {item.type === "hardware" && item.specifications && (
                  <div className="md:col-span-2">
                    <label className="text-sm font-medium text-muted-foreground">Specifications</label>
                    <p className="text-sm">{item.specifications}</p>
                  </div>
                )}
                {item.type === "software" && item.licenseKey && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground flex items-center">
                      <Key className="h-3 w-3 mr-1" />
                      License Key
                    </label>
                    <p className="text-sm font-mono">{item.licenseKey}</p>
                  </div>
                )}
                {item.type === "software" && item.version && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Version</label>
                    <p className="text-sm">{item.version}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Purchase Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <ShoppingCart className="h-5 w-5 mr-2" />
                Purchase Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground flex items-center">
                    <DollarSign className="h-3 w-3 mr-1" />
                    Cost
                  </label>
                  <p className="text-lg font-semibold">
                    {item.currency} {(item.cost || 0).toLocaleString()}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Vendor Type</label>
                  <p className="text-sm capitalize">{item.vendorType || 'N/A'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Store Name</label>
                  <p className="text-sm">{item.storeName || 'N/A'}</p>
                </div>
                {item.vendorType === "physical" && item.storeLocation && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground flex items-center">
                      <MapPin className="h-3 w-3 mr-1" />
                      Store Location
                    </label>
                    <p className="text-sm">{item.storeLocation}</p>
                  </div>
                )}
                {item.vendorType === "online" && item.websiteName && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground flex items-center">
                      <Globe className="h-3 w-3 mr-1" />
                      Website
                    </label>
                    <p className="text-sm">{item.websiteName}</p>
                    {item.websiteUrl && (
                      <a 
                        href={item.websiteUrl} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-xs text-blue-600 hover:underline"
                      >
                        {item.websiteUrl}
                      </a>
                    )}
                  </div>
                )}
                {item.purchaseDate && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground flex items-center">
                      <Calendar className="h-3 w-3 mr-1" />
                      Purchase Date
                    </label>
                    <p className="text-sm">{new Date(item.purchaseDate).toLocaleDateString()}</p>
                  </div>
                )}
                {item.warrantyExpiry && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground flex items-center">
                      <Calendar className="h-3 w-3 mr-1" />
                      Warranty Expiry
                    </label>
                    <p className="text-sm">{new Date(item.warrantyExpiry).toLocaleDateString()}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Assignment & Status */}
        <div className="space-y-6">
          {/* Assignment Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <User className="h-5 w-5 mr-2" />
                Assignment
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground flex items-center">
                  <Building className="h-3 w-3 mr-1" />
                  Department
                </label>
                <p className="text-sm">{item.department || 'N/A'}</p>
              </div>
              <Separator />
              <div>
                <label className="text-sm font-medium text-muted-foreground flex items-center">
                  <User className="h-3 w-3 mr-1" />
                  Assigned To
                </label>
                <p className="text-sm">{getUserDisplayName(item.assignedTo)}</p>
                {loadingUsers && (
                  <p className="text-xs text-muted-foreground">Loading user information...</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Status Information */}
          <Card>
            <CardHeader>
              <CardTitle>Status Overview</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Current Status</label>
                  <div className="mt-1">
                    <Badge variant="outline" className={statusColors[item.status]}>
                      {item.status?.charAt(0).toUpperCase() + item.status?.slice(1)}
                    </Badge>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Condition</label>
                  <div className="mt-1">
                    <Badge variant="outline" className={conditionColors[item.condition]}>
                      {item.condition?.charAt(0).toUpperCase() + item.condition?.slice(1)}
                    </Badge>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Timestamps */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Calendar className="h-5 w-5 mr-2" />
                Timeline
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {item.created_at && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Created</label>
                  <p className="text-sm">
                    {item.created_at.toDate ? 
                      item.created_at.toDate().toLocaleDateString() : 
                      new Date(item.created_at).toLocaleDateString()
                    }
                  </p>
                </div>
              )}
              {item.updated_at && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Last Updated</label>
                  <p className="text-sm">
                    {item.updated_at.toDate ? 
                      item.updated_at.toDate().toLocaleDateString() : 
                      new Date(item.updated_at).toLocaleDateString()
                    }
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

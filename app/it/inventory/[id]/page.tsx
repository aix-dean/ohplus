"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ArrowLeft, Edit, Trash2, Calendar, MapPin, User, Package, Zap, Monitor, Cpu, HardDrive, Wifi, Camera, Printer, Smartphone, Tablet, Headphones, Mouse, Keyboard, ExternalLink, Download, Share2, Loader2, AlertCircle, DollarSign, Building, Globe } from 'lucide-react'
import { toast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"
import { useAuth } from "@/contexts/auth-context"
import { doc, getDoc, collection, query, where, getDocs, deleteDoc, updateDoc, serverTimestamp } from "firebase/firestore"
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
  serialNumber?: string
  specifications?: string
  licenseKey?: string
  version?: string
  categorySpecs?: Record<string, any>
  created_at: any
  updated_at: any
  created_by: string
  company_id: string
}

interface User {
  id: string
  uid: string
  first_name: string
  last_name: string
  email: string
  company_id?: string
}

const categoryIcons = {
  "Desktop Computer": Monitor,
  "Laptop": Monitor,
  "Server": Cpu,
  "Printer": Printer,
  "Network Switch": Wifi,
  "Router": Wifi,
  "Firewall": Wifi,
  "Monitor": Monitor,
  "Smartphone": Smartphone,
  "Tablet": Tablet,
  "Storage Device": HardDrive,
  "Keyboard": Keyboard,
  "Mouse": Mouse,
  "Webcam": Camera,
  "Headset": Headphones,
  "Projector": Monitor,
  "Scanner": Camera,
  "UPS": Zap,
  "Cable": Zap,
  "Docking Station": Monitor,
  "Operating System": Monitor,
  "Productivity Suite": Monitor,
  "Design Software": Monitor,
  "Security Software": Monitor,
  "Database Software": Monitor,
  "Development Tools": Monitor,
  "Antivirus": Monitor,
  "Backup Software": Monitor,
  "Communication Software": Monitor,
  "Project Management": Monitor,
  "Accounting Software": Monitor,
  "CRM Software": Monitor,
  "ERP Software": Monitor,
  "Media Software": Monitor,
  "Browser": Monitor,
  "Utility Software": Monitor,
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

export default function InventoryItemDetails() {
  const params = useParams()
  const router = useRouter()
  const { userData } = useAuth()
  const [item, setItem] = useState<InventoryItem | null>(null)
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  // Fetch item details and users
  useEffect(() => {
    const fetchData = async () => {
      if (!params.id || typeof params.id !== 'string' || !userData?.company_id) return
    
      // If the ID is "new", redirect to the new item page
      if (params.id === 'new') {
        router.push('/it/inventory/new')
        return
      }

      try {
        // Fetch item details
        const itemRef = doc(db, "itInventory", params.id)
        const itemSnap = await getDoc(itemRef)

        if (itemSnap.exists()) {
          const itemData = itemSnap.data()
        
        // Check if item is deleted
        if (itemData.deleted === true) {
          toast({
            title: "Error",
            description: "This item has been deleted",
            variant: "destructive",
          })
          router.push("/it/inventory")
          return
        }

        setItem({
          id: itemSnap.id,
          name: itemData.name || "",
          type: itemData.type || "hardware",
          category: itemData.category || "",
          brand: itemData.brand || "",
          department: itemData.department || "",
          assignedTo: itemData.assignedTo || "unassigned",
          condition: itemData.condition || "excellent",
          status: itemData.status || "active",
          vendorType: itemData.vendorType || "physical",
          storeName: itemData.storeName || "",
          storeLocation: itemData.storeLocation || "",
          websiteName: itemData.websiteName || "",
          websiteUrl: itemData.websiteUrl || "",
          purchaseDate: itemData.purchaseDate || "",
          warrantyExpiry: itemData.warrantyExpiry || "",
          cost: itemData.cost || 0,
          currency: itemData.currency || "USD",
          description: itemData.description || "",
          serialNumber: itemData.serialNumber || "",
          specifications: itemData.specifications || "",
          licenseKey: itemData.licenseKey || "",
          version: itemData.version || "",
          categorySpecs: itemData.categorySpecs || {},
          created_at: itemData.created_at,
          updated_at: itemData.updated_at,
          created_by: itemData.created_by || "",
          company_id: itemData.company_id || "",
        })
      } else {
        toast({
          title: "Error",
          description: "Item not found",
          variant: "destructive",
        })
        router.push("/it/inventory")
        return
      }

      // Fetch users for display names
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
      console.error("Error fetching data:", error)
      toast({
        title: "Error",
        description: "Failed to load item details",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  fetchData()
}, [params.id, userData?.company_id, router])

  // Helper function to get user display name
  const getUserDisplayName = (uid: string) => {
    if (uid === "unassigned") return "Unassigned"
    const user = users.find((u) => u.uid === uid)
    if (!user) return "Unknown User"
    return `${user.first_name} ${user.last_name}`.trim() || user.email
  }

  const handleEdit = () => {
    router.push(`/it/inventory/edit/${params.id}`)
  }

  const handleDelete = async () => {
    if (!item) return

  setIsDeleting(true)
  try {
    // Soft delete: update the document with deleted: true instead of deleting it
    await updateDoc(doc(db, "itInventory", item.id), {
      deleted: true,
      deleted_at: serverTimestamp(),
      updated_at: serverTimestamp(),
    })
    
    toast({
      title: "Item Deleted",
      description: `${item.name} has been deleted from inventory`,
    })
    router.push("/it/inventory")
  } catch (error) {
    console.error("Error deleting item:", error)
    toast({
      title: "Error",
      description: "Failed to delete item. Please try again.",
      variant: "destructive",
    })
  } finally {
    setIsDeleting(false)
    setDeleteDialogOpen(false)
  }
}

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href)
    toast({
      title: "Link Copied",
      description: "Item link copied to clipboard",
    })
  }

  const formatSpecificationKey = (key: string) => {
    return key
      .replace(/([A-Z])/g, " $1")
      .replace(/^./, (str) => str.toUpperCase())
      .trim()
  }

  const formatCurrency = (amount: number, currency: string = "USD") => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency,
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    if (!dateString) return "Not specified"
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    })
  }

  const formatTimestamp = (timestamp: any) => {
    if (!timestamp) return "Not available"
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp)
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
        <div className="container mx-auto p-6 max-w-7xl">
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
        <div className="container mx-auto p-6 max-w-7xl">
          <div className="text-center py-12">
            <AlertCircle className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h2 className="text-2xl font-semibold text-gray-900 mb-2">Item Not Found</h2>
            <p className="text-gray-600 mb-6">The requested inventory item could not be found.</p>
            <Button onClick={() => router.push("/it/inventory")}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Inventory
            </Button>
          </div>
        </div>
      </div>
    )
  }

  const CategoryIcon = categoryIcons[item.category as keyof typeof categoryIcons] || Package

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="container mx-auto p-6 max-w-7xl">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 space-y-4 md:space-y-0">
          <div className="flex items-center space-x-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push("/it/inventory")}
              className="shadow-sm bg-white"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Inventory
            </Button>
            <Separator orientation="vertical" className="h-6" />
            <div>
              <h1 className="text-3xl font-bold text-slate-900">{item.name}</h1>
              <p className="text-slate-600">
                {item.brand} • {item.category}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Button variant="outline" size="sm" onClick={handleShare} className="shadow-sm bg-white">
              <Share2 className="h-4 w-4 mr-2" />
              Share
            </Button>
            <Button variant="outline" size="sm" onClick={handleEdit} className="shadow-sm bg-white">
              <Edit className="h-4 w-4 mr-2" />
              Edit
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setDeleteDialogOpen(true)}
              className="shadow-sm bg-white text-red-600 hover:text-red-700 hover:bg-red-50"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Basic Information Card */}
            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <CategoryIcon className="h-5 w-5 mr-2" />
                  Item Overview
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium text-gray-600">Type</label>
                      <div className="flex items-center mt-1">
                        {item.type === "hardware" ? (
                          <HardDrive className="h-4 w-4 mr-2 text-blue-600" />
                        ) : (
                          <Monitor className="h-4 w-4 mr-2 text-green-600" />
                        )}
                        <span className="text-sm font-medium capitalize">{item.type}</span>
                      </div>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600">Department</label>
                      <div className="flex items-center mt-1">
                        <Building className="h-4 w-4 mr-2 text-gray-400" />
                        <span className="text-sm">{item.department}</span>
                      </div>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600">Status</label>
                      <div className="mt-1">
                        <Badge variant="outline" className={cn(statusColors[item.status])}>
                          {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
                        </Badge>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium text-gray-600">Condition</label>
                      <div className="mt-1">
                        <Badge variant="outline" className={cn(conditionColors[item.condition])}>
                          {item.condition.charAt(0).toUpperCase() + item.condition.slice(1)}
                        </Badge>
                      </div>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600">Assigned To</label>
                      <div className="flex items-center mt-1">
                        <User className="h-4 w-4 mr-2 text-gray-400" />
                        <span className="text-sm">{getUserDisplayName(item.assignedTo)}</span>
                      </div>
                    </div>
                    {item.serialNumber && (
                      <div>
                        <label className="text-sm font-medium text-gray-600">Serial Number</label>
                        <div className="mt-1">
                          <code className="text-sm bg-gray-100 px-2 py-1 rounded font-mono">
                            {item.serialNumber}
                          </code>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                {item.description && (
                  <div className="mt-6 pt-6 border-t">
                    <label className="text-sm font-medium text-gray-600">Description</label>
                    <p className="text-sm text-gray-700 mt-2 leading-relaxed">{item.description}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Technical Specifications */}
            {((item.type === "hardware" && (item.specifications || item.categorySpecs)) ||
              (item.type === "software" && (item.licenseKey || item.version || item.categorySpecs))) && (
              <Card className="shadow-sm">
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Cpu className="h-5 w-5 mr-2" />
                    Technical Specifications
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    {/* Basic specs */}
                    {item.type === "hardware" && item.specifications && (
                      <div>
                        <h4 className="text-sm font-semibold text-gray-700 mb-3">General Specifications</h4>
                        <div className="bg-gray-50 p-3 rounded-lg">
                          <p className="text-sm font-mono">{item.specifications}</p>
                        </div>
                      </div>
                    )}

                    {item.type === "software" && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {item.licenseKey && (
                          <div>
                            <label className="text-sm font-medium text-gray-600">License Key</label>
                            <div className="mt-1">
                              <code className="text-sm bg-gray-100 px-2 py-1 rounded font-mono block">
                                {item.licenseKey}
                              </code>
                            </div>
                          </div>
                        )}
                        {item.version && (
                          <div>
                            <label className="text-sm font-medium text-gray-600">Version</label>
                            <div className="mt-1">
                              <span className="text-sm font-medium">{item.version}</span>
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Category-specific specs */}
                    {item.categorySpecs && Object.keys(item.categorySpecs).length > 0 && (
                      <div>
                        <h4 className="text-sm font-semibold text-gray-700 mb-3">
                          {item.category} Specifications
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {Object.entries(item.categorySpecs).map(([key, value]) => {
                            if (!value) return null
                            return (
                              <div key={key}>
                                <label className="text-sm font-medium text-gray-600">
                                  {formatSpecificationKey(key)}
                                </label>
                                <div className="mt-1">
                                  <span className="text-sm bg-gray-50 px-2 py-1 rounded block">
                                    {value}
                                  </span>
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Vendor Information */}
            {(item.storeName || item.storeLocation || item.websiteName) && (
              <Card className="shadow-sm">
                <CardHeader>
                  <CardTitle className="flex items-center">
                    {item.vendorType === "physical" ? (
                      <MapPin className="h-5 w-5 mr-2" />
                    ) : (
                      <Globe className="h-5 w-5 mr-2" />
                    )}
                    Vendor Information
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-gray-600">Store Type</label>
                      <div className="mt-1">
                        <Badge variant="secondary" className="capitalize">
                          {item.vendorType === "physical" ? "Physical Store" : "Online Store"}
                        </Badge>
                      </div>
                    </div>
                    {item.storeName && (
                      <div>
                        <label className="text-sm font-medium text-gray-600">Store Name</label>
                        <p className="text-sm mt-1">{item.storeName}</p>
                      </div>
                    )}
                    {item.vendorType === "physical" && item.storeLocation && (
                      <div className="md:col-span-2">
                        <label className="text-sm font-medium text-gray-600">Store Location</label>
                        <p className="text-sm mt-1">{item.storeLocation}</p>
                      </div>
                    )}
                    {item.vendorType === "online" && (
                      <>
                        {item.websiteName && (
                          <div>
                            <label className="text-sm font-medium text-gray-600">Website Name</label>
                            <p className="text-sm mt-1">{item.websiteName}</p>
                          </div>
                        )}
                        {item.websiteUrl && (
                          <div>
                            <label className="text-sm font-medium text-gray-600">Website URL</label>
                            <div className="mt-1">
                              <a
                                href={item.websiteUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-sm text-blue-600 hover:text-blue-800 underline flex items-center"
                              >
                                {item.websiteUrl}
                                <ExternalLink className="h-3 w-3 ml-1" />
                              </a>
                            </div>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Financial Information */}
            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <DollarSign className="h-5 w-5 mr-2" />
                  Financial Information
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center mb-4">
                  <p className="text-sm text-gray-600 mb-1">Purchase Cost</p>
                  <p className="text-2xl font-bold text-green-600">
                    {item.cost > 0 ? formatCurrency(item.cost, item.currency) : "Not specified"}
                  </p>
                </div>
                <Separator className="my-4" />
                <div className="space-y-3">
                  <div className="flex items-center space-x-3">
                    <Calendar className="h-4 w-4 text-gray-400" />
                    <div>
                      <p className="text-sm font-medium">Purchase Date</p>
                      <p className="text-sm text-gray-600">{formatDate(item.purchaseDate)}</p>
                    </div>
                  </div>
                  {item.warrantyExpiry && (
                    <div className="flex items-center space-x-3">
                      <Calendar className="h-4 w-4 text-gray-400" />
                      <div>
                        <p className="text-sm font-medium">Warranty Expiry</p>
                        <p className="text-sm text-gray-600">{formatDate(item.warrantyExpiry)}</p>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* System Information */}
            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle>System Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm font-medium text-gray-600">Created</p>
                  <p className="text-sm text-gray-600">{formatTimestamp(item.created_at)}</p>
                  {item.created_by && (
                    <p className="text-xs text-gray-500">by {item.created_by}</p>
                  )}
                </div>

                <Separator />

                <div>
                  <p className="text-sm font-medium text-gray-600">Last Updated</p>
                  <p className="text-sm text-gray-600">{formatTimestamp(item.updated_at)}</p>
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button variant="outline" className="w-full justify-start" onClick={handleEdit}>
                  <Edit className="h-4 w-4 mr-2" />
                  Edit Item
                </Button>
                <Button variant="outline" className="w-full justify-start" onClick={handleShare}>
                  <Share2 className="h-4 w-4 mr-2" />
                  Share Item
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <Download className="h-4 w-4 mr-2" />
                  Export Details
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle className="flex items-center space-x-2">
                <AlertCircle className="h-5 w-5 text-red-600" />
                <span>Delete Inventory Item</span>
              </AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete "{item?.name}"? This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDelete}
                disabled={isDeleting}
                className="bg-red-600 hover:bg-red-700"
              >
                {isDeleting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Deleting...
                  </>
                ) : (
                  "Delete"
                )}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  )
}

"use client"

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { ArrowLeft, Edit, Trash2, HardDrive, Monitor, Loader2, AlertCircle, Calendar, DollarSign, User, Building, Package, Shield, Clock } from 'lucide-react'
import { toast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"
import { useAuth } from "@/contexts/auth-context"
import { doc, getDoc, deleteDoc, collection, query, where, getDocs } from "firebase/firestore"
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

export default function InventoryItemDetailPage() {
  const router = useRouter()
  const params = useParams()
  const { userData } = useAuth()
  const [item, setItem] = useState<InventoryItem | null>(null)
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  const itemId = params.id as string

  // Handle case where "new" is passed as ID (routing conflict)
  if (itemId === "new") {
    router.push("/it/inventory/new")
    return null
  }

  // Handle case where "edit" is passed as ID (routing conflict)  
  if (itemId === "edit") {
    router.push("/it/inventory")
    return null
  }

  // Fetch item details
  useEffect(() => {
    const fetchItem = async () => {
      if (!itemId || !userData?.company_id) return
    
      // Prevent fetching if itemId is a route segment
      if (itemId === "new" || itemId === "edit") return

      try {
        const itemDoc = await getDoc(doc(db, "itInventory", itemId))
        
        if (!itemDoc.exists()) {
          toast({
            title: "Item Not Found",
            description: "The requested inventory item could not be found.",
            variant: "destructive",
          })
          router.push("/it/inventory")
          return
        }

        const data = itemDoc.data()
        
        // Check if item belongs to user's company
        if (data.company_id !== userData.company_id) {
          toast({
            title: "Access Denied",
            description: "You don't have permission to view this item.",
            variant: "destructive",
          })
          router.push("/it/inventory")
          return
        }

        setItem({
          id: itemDoc.id,
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
          created_at: data.created_at,
          updated_at: data.updated_at,
          created_by: data.created_by || "",
          company_id: data.company_id || "",
        })
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
  }, [itemId, userData?.company_id, router])

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

  // Helper function to format date
  const formatDate = (dateString: string) => {
    if (!dateString) return "Not specified"
    try {
      return new Date(dateString).toLocaleDateString()
    } catch {
      return dateString
    }
  }

  const handleEdit = () => {
    router.push(`/it/inventory/edit/${itemId}`)
  }

  const handleDelete = () => {
    setDeleteDialogOpen(true)
  }

  const confirmDelete = async () => {
    if (!item) return

    setIsDeleting(true)
    try {
      await deleteDoc(doc(db, "itInventory", item.id))
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
              <AlertCircle className="h-16 w-16 text-muted-foreground" />
              <div className="text-center">
                <h3 className="text-lg font-semibold">Item Not Found</h3>
                <p className="text-muted-foreground">The requested inventory item could not be found.</p>
              </div>
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="container mx-auto p-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 space-y-4 md:space-y-0">
          <div className="flex items-center space-x-4">
            <Button variant="outline" onClick={handleBack}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-slate-900">{item.name}</h1>
              <p className="text-slate-600">{item.brand} • {item.category}</p>
            </div>
          </div>
          <div className="flex space-x-2">
            <Button onClick={handleEdit} variant="outline">
              <Edit className="h-4 w-4 mr-2" />
              Edit
            </Button>
            <Button onClick={handleDelete} variant="outline" className="text-red-600 hover:text-red-700">
              <Trash2 className="h-4 w-4 mr-2" />
              Delete
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Details */}
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
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Name</label>
                    <p className="text-sm font-semibold">{item.name}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Type</label>
                    <p className="text-sm font-semibold capitalize">{item.type}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Brand</label>
                    <p className="text-sm font-semibold">{item.brand}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Category</label>
                    <p className="text-sm font-semibold">{item.category}</p>
                  </div>
                  {item.serialNumber && (
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Serial Number</label>
                      <p className="text-sm font-mono">{item.serialNumber}</p>
                    </div>
                  )}
                  {item.version && (
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Version</label>
                      <p className="text-sm font-semibold">{item.version}</p>
                    </div>
                  )}
                </div>
                
                {item.licenseKey && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">License Key</label>
                    <p className="text-sm font-mono bg-muted p-2 rounded">{item.licenseKey}</p>
                  </div>
                )}

                {item.description && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Description</label>
                    <p className="text-sm">{item.description}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Assignment & Status */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <User className="h-5 w-5 text-purple-600" />
                  <span>Assignment & Status</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Department</label>
                    <div className="flex items-center space-x-2 mt-1">
                      <Building className="h-4 w-4 text-muted-foreground" />
                      <p className="text-sm font-semibold">{item.department}</p>
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Assigned To</label>
                    <div className="flex items-center space-x-2 mt-1">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <p className="text-sm font-semibold">{getUserDisplayName(item.assignedTo)}</p>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center space-x-4">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Status</label>
                    <div className="mt-1">
                      <Badge variant="outline" className={cn(statusColors[item.status])}>
                        {item.status}
                      </Badge>
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Condition</label>
                    <div className="mt-1">
                      <Badge variant="outline" className={cn(conditionColors[item.condition])}>
                        {item.condition}
                      </Badge>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Financial Information */}
            {item.cost > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <DollarSign className="h-5 w-5 text-green-600" />
                    <span>Financial Information</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Purchase Cost</label>
                      <p className="text-lg font-bold text-green-600">
                        {item.currency} {item.cost.toLocaleString()}
                      </p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Purchase Date</label>
                      <div className="flex items-center space-x-2 mt-1">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <p className="text-sm font-semibold">{formatDate(item.purchaseDate)}</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Quick Stats */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Package className="h-5 w-5 text-blue-600" />
                  <span>Quick Overview</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-center">
                  {item.type === "hardware" ? (
                    <HardDrive className="h-12 w-12 text-blue-600 mx-auto mb-2" />
                  ) : (
                    <Monitor className="h-12 w-12 text-green-600 mx-auto mb-2" />
                  )}
                  <p className="font-semibold">{item.type === "hardware" ? "Hardware Asset" : "Software License"}</p>
                  <p className="text-sm text-muted-foreground">{item.category}</p>
                </div>
                
                <Separator />
                
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Status:</span>
                    <Badge variant="outline" className={cn(statusColors[item.status], "text-xs")}>
                      {item.status}
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Condition:</span>
                    <Badge variant="outline" className={cn(conditionColors[item.condition], "text-xs")}>
                      {item.condition}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Warranty Information */}
            {item.warrantyExpiry && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Shield className="h-5 w-5 text-orange-600" />
                    <span>Warranty</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center">
                    <p className="text-sm text-muted-foreground">Expires on</p>
                    <p className="text-lg font-semibold">{formatDate(item.warrantyExpiry)}</p>
                    {new Date(item.warrantyExpiry) < new Date() && (
                      <Badge variant="outline" className="bg-red-100 text-red-800 border-red-200 mt-2">
                        Expired
                      </Badge>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Timestamps */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Clock className="h-5 w-5 text-gray-600" />
                  <span>Record Information</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Created</label>
                  <p className="text-sm">
                    {item.created_at ? new Date(item.created_at.toDate()).toLocaleString() : "Unknown"}
                  </p>
                </div>
                {item.updated_at && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Last Updated</label>
                    <p className="text-sm">
                      {new Date(item.updated_at.toDate()).toLocaleString()}
                    </p>
                  </div>
                )}
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
                Are you sure you want to delete "{item.name}"? This action cannot be undone.
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

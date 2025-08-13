"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import {
  ArrowLeft,
  Edit,
  Trash2,
  Package,
  HardDrive,
  Monitor,
  Loader2,
  AlertCircle,
  Calendar,
  UserIcon,
  Building,
  Tag,
} from "lucide-react"
import { toast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"
import { useAuth } from "@/contexts/auth-context"
import { doc, getDoc, updateDoc, serverTimestamp } from "firebase/firestore"
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
import { StockLevelIndicator } from "@/components/stock-level-indicator"
import { CrossDepartmentAlertBanner } from "@/components/cross-department-alert-banner"

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
  stock: number
  created_at: any
  updated_at: any
  created_by: string
  company_id: string
  deleted: boolean
}

interface InventoryUser {
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

export default function ITInventoryDetailsPage() {
  const params = useParams()
  const router = useRouter()
  const { userData } = useAuth()
  const [item, setItem] = useState<InventoryItem | null>(null)
  const [users, setUsers] = useState<InventoryUser[]>([])
  const [loading, setLoading] = useState(true)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  const [stockAdjustment, setStockAdjustment] = useState("")
  const [isAdjustingStock, setIsAdjustingStock] = useState(false)

  useEffect(() => {
    const fetchItem = async () => {
      if (!params.id || !userData?.company_id) return

      try {
        const itemRef = doc(db, "itInventory", params.id as string)
        const itemDoc = await getDoc(itemRef)

        if (itemDoc.exists()) {
          const data = itemDoc.data()
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
            stock: data.stock || 0,
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
      } finally {
        setLoading(false)
      }
    }

    fetchItem()
  }, [params.id, userData?.company_id, router])

  const handleStockAdjustment = async () => {
    if (!item || !stockAdjustment) return

    const adjustment = Number.parseInt(stockAdjustment)
    if (isNaN(adjustment)) {
      toast({
        title: "Error",
        description: "Please enter a valid number",
        variant: "destructive",
      })
      return
    }

    const newStock = Math.max(0, item.stock + adjustment)

    setIsAdjustingStock(true)
    try {
      const itemRef = doc(db, "itInventory", item.id)
      await updateDoc(itemRef, {
        stock: newStock,
        updated_at: serverTimestamp(),
      })

      setItem({ ...item, stock: newStock })
      setStockAdjustment("")

      toast({
        title: "Stock Updated",
        description: `Stock level updated to ${newStock} units`,
      })
    } catch (error) {
      console.error("Error updating stock:", error)
      toast({
        title: "Error",
        description: "Failed to update stock level",
        variant: "destructive",
      })
    } finally {
      setIsAdjustingStock(false)
    }
  }

  const handleEdit = () => {
    router.push(`/it/inventory/edit/${item?.id}`)
  }

  const handleDelete = async () => {
    if (!item || isDeleting) return

    setIsDeleting(true)

    try {
      const itemRef = doc(db, "itInventory", item.id)
      await updateDoc(itemRef, {
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
          <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
            <Package className="h-16 w-16 text-muted-foreground" />
            <h2 className="text-2xl font-bold">Item Not Found</h2>
            <p className="text-muted-foreground">The item you're looking for doesn't exist or has been removed.</p>
            <Button onClick={() => router.push("/it/inventory")}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Inventory
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="container mx-auto p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-4">
            <Button variant="ghost" onClick={() => router.push("/it/inventory")}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Inventory
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-slate-900">{item.name}</h1>
              <p className="text-slate-600">
                {item.brand} • {item.category}
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <Button variant="outline" onClick={handleEdit}>
              <Edit className="h-4 w-4 mr-2" />
              Edit
            </Button>
            <Button
              variant="outline"
              onClick={() => setDeleteDialogOpen(true)}
              className="text-red-600 hover:text-red-700"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete
            </Button>
          </div>
        </div>

        <CrossDepartmentAlertBanner className="mb-6" />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Item Overview */}
            <Card>
              <CardHeader>
                <div className="flex items-center space-x-3">
                  {item.type === "hardware" ? (
                    <HardDrive className="h-6 w-6 text-blue-600" />
                  ) : (
                    <Monitor className="h-6 w-6 text-green-600" />
                  )}
                  <div>
                    <CardTitle className="text-xl">{item.name}</CardTitle>
                    <CardDescription>
                      {item.brand} • {item.category}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <Badge variant="outline" className={cn(statusColors[item.status])}>
                    {item.status}
                  </Badge>
                  <Badge variant="outline" className={cn(conditionColors[item.condition])}>
                    {item.condition}
                  </Badge>
                </div>

                <StockLevelIndicator stock={item.stock} showProgress={true} size="lg" />

                <Separator />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="flex items-center space-x-2">
                      <Building className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-sm font-medium">Department</p>
                        <p className="text-sm text-muted-foreground">{item.department}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <UserIcon className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-sm font-medium">Assigned To</p>
                        <p className="text-sm text-muted-foreground">
                          {item.assignedTo === "unassigned" ? "Unassigned" : item.assignedTo}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Tag className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-sm font-medium">Type</p>
                        <p className="text-sm text-muted-foreground capitalize">{item.type}</p>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-4">
                    {item.cost > 0 && (
                      <div>
                        <p className="text-sm font-medium">Cost</p>
                        <p className="text-sm text-muted-foreground">
                          {item.currency} {item.cost.toLocaleString()}
                        </p>
                      </div>
                    )}
                    {item.serialNumber && (
                      <div>
                        <p className="text-sm font-medium">Serial Number</p>
                        <p className="text-sm text-muted-foreground font-mono">{item.serialNumber}</p>
                      </div>
                    )}
                    {item.version && (
                      <div>
                        <p className="text-sm font-medium">Version</p>
                        <p className="text-sm text-muted-foreground">{item.version}</p>
                      </div>
                    )}
                  </div>
                </div>

                {item.description && (
                  <>
                    <Separator />
                    <div>
                      <p className="text-sm font-medium mb-2">Description</p>
                      <p className="text-sm text-muted-foreground">{item.description}</p>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Stock Management</CardTitle>
                <CardDescription>Adjust stock levels for this item</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center space-x-4">
                  <div className="flex-1">
                    <label className="text-sm font-medium">Stock Adjustment</label>
                    <div className="flex items-center space-x-2 mt-1">
                      <Input
                        type="number"
                        placeholder="Enter adjustment (+/-)"
                        value={stockAdjustment}
                        onChange={(e) => setStockAdjustment(e.target.value)}
                        className="w-48"
                      />
                      <Button onClick={handleStockAdjustment} disabled={!stockAdjustment || isAdjustingStock} size="sm">
                        {isAdjustingStock ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Updating...
                          </>
                        ) : (
                          "Update Stock"
                        )}
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Use positive numbers to add stock, negative to remove. Current: {item.stock} units
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Item Information */}
            <Card>
              <CardHeader>
                <CardTitle>Item Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Current Stock</p>
                  <p className="text-2xl font-bold">{item.stock} units</p>
                </div>

                <Separator />

                <div>
                  <p className="text-sm font-medium text-muted-foreground">Status</p>
                  <Badge variant="outline" className={cn(statusColors[item.status], "mt-1")}>
                    {item.status}
                  </Badge>
                </div>

                <div>
                  <p className="text-sm font-medium text-muted-foreground">Condition</p>
                  <Badge variant="outline" className={cn(conditionColors[item.condition], "mt-1")}>
                    {item.condition}
                  </Badge>
                </div>

                <Separator />

                {item.purchaseDate && (
                  <div className="flex items-center space-x-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">Purchase Date</p>
                      <p className="text-sm text-muted-foreground">{item.purchaseDate}</p>
                    </div>
                  </div>
                )}

                {item.warrantyExpiry && (
                  <div className="flex items-center space-x-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">Warranty Expiry</p>
                      <p className="text-sm text-muted-foreground">{item.warrantyExpiry}</p>
                    </div>
                  </div>
                )}

                {item.licenseKey && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">License Key</p>
                    <p className="text-sm text-muted-foreground font-mono break-all">{item.licenseKey}</p>
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
                Are you sure you want to delete "{item.name}"? This action will move the item to trash and it won't be
                visible in your inventory list.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleDelete} disabled={isDeleting} className="bg-red-600 hover:bg-red-700">
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

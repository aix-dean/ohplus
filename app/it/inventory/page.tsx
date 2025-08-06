"use client"

import { useState, useMemo, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
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
import { Plus, Search, Edit, Trash2, Monitor, Smartphone, Printer, Wifi, HardDrive, Shield, Package, Server, Laptop, Loader2 } from 'lucide-react'
import { toast } from "@/hooks/use-toast"
import { useAuth } from "@/contexts/auth-context"
import { collection, query, where, getDocs, doc, updateDoc, deleteDoc, orderBy } from "firebase/firestore"
import { db } from "@/lib/firebase"

interface InventoryItem {
  id: string
  name: string
  type: "hardware" | "software"
  category: string
  status: "active" | "inactive" | "maintenance" | "retired"
  location: string
  assignedTo: string
  purchaseDate: string
  warrantyExpiry: string
  cost: number
  vendor: string
  description: string
  serialNumber?: string
  specifications?: string
  licenseKey?: string
  version?: string
  company_id?: string
  created_by?: string
  created_at?: any
  updated_at?: any
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

const statusColors = {
  active: "bg-green-100 text-green-800",
  inactive: "bg-gray-100 text-gray-800",
  maintenance: "bg-yellow-100 text-yellow-800",
  retired: "bg-red-100 text-red-800",
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

export default function ITInventoryPage() {
  const router = useRouter()
  const { user } = useAuth()
  const [inventory, setInventory] = useState<InventoryItem[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [typeFilter, setTypeFilter] = useState<string>("all")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null)
  const [formData, setFormData] = useState<Partial<InventoryItem>>({
    type: "hardware",
    status: "active",
  })

  // Fetch inventory data from Firestore
  useEffect(() => {
    const fetchInventory = async () => {
      try {
        console.log("Current user:", user)
        console.log("User company_id:", user?.company_id)
        
        const inventoryRef = collection(db, "itInventory")
        
        // First, try to fetch all documents to debug
        const allDocsQuery = query(inventoryRef)
        const allDocsSnapshot = await getDocs(allDocsQuery)
        
        console.log("Total documents in itInventory:", allDocsSnapshot.size)
        
        const allInventoryData: InventoryItem[] = []
        allDocsSnapshot.forEach((doc) => {
          const data = doc.data()
          console.log("Document data:", { id: doc.id, ...data })
          allInventoryData.push({
            id: doc.id,
            ...data,
          } as InventoryItem)
        })
        
        // If user has company_id, filter by it, otherwise show all for debugging
        let filteredData = allInventoryData
        if (user?.company_id) {
          filteredData = allInventoryData.filter(item => item.company_id === user.company_id)
          console.log("Filtered by company_id:", filteredData.length)
        } else {
          console.log("No company_id found, showing all items for debugging")
        }
        
        setInventory(filteredData)
      } catch (error) {
        console.error("Error fetching inventory:", error)
        toast({
          title: "Error",
          description: "Failed to fetch inventory data",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }

    fetchInventory()
  }, [user])

  const filteredInventory = useMemo(() => {
    return inventory.filter((item) => {
      const matchesSearch =
        item.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.category?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.vendor?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.location?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.assignedTo?.toLowerCase().includes(searchTerm.toLowerCase())

      const matchesType = typeFilter === "all" || item.type === typeFilter
      const matchesStatus = statusFilter === "all" || item.status === statusFilter

      return matchesSearch && matchesType && matchesStatus
    })
  }, [inventory, searchTerm, typeFilter, statusFilter])

  const stats = useMemo(() => {
    const total = inventory.length
    const active = inventory.filter((item) => item.status === "active").length
    const maintenance = inventory.filter((item) => item.status === "maintenance").length
    const totalValue = inventory.reduce((sum, item) => sum + (item.cost || 0), 0)

    return { total, active, maintenance, totalValue }
  }, [inventory])

  const handleEdit = (item: InventoryItem) => {
    setEditingItem(item)
    setFormData(item)
  }

  const handleUpdate = async () => {
    if (!editingItem || !formData.name || !formData.category || !formData.vendor) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      })
      return
    }

    try {
      const itemRef = doc(db, "itInventory", editingItem.id)
      const updatedData = {
        ...formData,
        updated_at: new Date(),
      }

      await updateDoc(itemRef, updatedData)

      const updatedItem: InventoryItem = {
        ...editingItem,
        ...formData,
      } as InventoryItem

      setInventory(inventory.map((item) => (item.id === editingItem.id ? updatedItem : item)))

      setEditingItem(null)
      setFormData({ type: "hardware", status: "active" })

      toast({
        title: "Success",
        description: "Inventory item updated successfully",
      })
    } catch (error) {
      console.error("Error updating item:", error)
      toast({
        title: "Error",
        description: "Failed to update inventory item",
        variant: "destructive",
      })
    }
  }

  const handleDelete = async (id: string) => {
    try {
      await deleteDoc(doc(db, "itInventory", id))
      setInventory(inventory.filter((item) => item.id !== id))
      toast({
        title: "Success",
        description: "Inventory item deleted successfully",
      })
    } catch (error) {
      console.error("Error deleting item:", error)
      toast({
        title: "Error",
        description: "Failed to delete inventory item",
        variant: "destructive",
      })
    }
  }

  const handleAddNew = () => {
    router.push("/it/inventory/new")
  }

  if (loading) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex justify-center items-center min-h-[400px]">
          <div className="flex flex-col items-center space-y-4">
            <Loader2 className="h-8 w-8 animate-spin" />
            <p className="text-muted-foreground">Loading inventory...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">IT Inventory Management</h1>
          <p className="text-muted-foreground">Manage your hardware and software assets</p>
        </div>
        <Button onClick={handleAddNew}>
          <Plus className="h-4 w-4 mr-2" />
          Add Item
        </Button>
      </div>

      {/* Debug Info */}
      {process.env.NODE_ENV === 'development' && (
        <Card className="bg-yellow-50 border-yellow-200">
          <CardHeader>
            <CardTitle className="text-sm">Debug Info</CardTitle>
          </CardHeader>
          <CardContent className="text-xs">
            <p>User ID: {user?.uid || 'Not logged in'}</p>
            <p>Company ID: {user?.company_id || 'No company_id'}</p>
            <p>Total inventory items: {inventory.length}</p>
            <p>Filtered items: {filteredInventory.length}</p>
          </CardContent>
        </Card>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Items</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Items</CardTitle>
            <Monitor className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.active}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Maintenance</CardTitle>
            <HardDrive className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{stats.maintenance}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Value</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${stats.totalValue.toLocaleString()}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Search & Filter</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name, category, vendor, location, or assigned person..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-full md:w-[180px]">
                <SelectValue placeholder="Filter by type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="hardware">Hardware</SelectItem>
                <SelectItem value="software">Software</SelectItem>
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-[180px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
                <SelectItem value="maintenance">Maintenance</SelectItem>
                <SelectItem value="retired">Retired</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Inventory List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredInventory.map((item) => {
          const IconComponent = categoryIcons[item.category as keyof typeof categoryIcons] || Package

          return (
            <Card key={item.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-2">
                    <IconComponent className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <CardTitle className="text-lg">{item.name}</CardTitle>
                      <CardDescription>{item.category}</CardDescription>
                    </div>
                  </div>
                  <div className="flex space-x-1">
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button variant="outline" size="sm" onClick={() => handleEdit(item)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                        <DialogHeader>
                          <DialogTitle>Edit Inventory Item</DialogTitle>
                          <DialogDescription>Update the inventory item details</DialogDescription>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label htmlFor="edit-name">Name *</Label>
                              <Input
                                id="edit-name"
                                value={formData.name || ""}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                placeholder="Enter item name"
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="edit-type">Type *</Label>
                              <Select
                                value={formData.type}
                                onValueChange={(value) =>
                                  setFormData({ ...formData, type: value as "hardware" | "software" })
                                }
                              >
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="hardware">Hardware</SelectItem>
                                  <SelectItem value="software">Software</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label htmlFor="edit-category">Category *</Label>
                              <Select
                                value={formData.category}
                                onValueChange={(value) => setFormData({ ...formData, category: value })}
                              >
                                <SelectTrigger>
                                  <SelectValue placeholder="Select category" />
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
                            <div className="space-y-2">
                              <Label htmlFor="edit-status">Status</Label>
                              <Select
                                value={formData.status}
                                onValueChange={(value) => setFormData({ ...formData, status: value as any })}
                              >
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="active">Active</SelectItem>
                                  <SelectItem value="inactive">Inactive</SelectItem>
                                  <SelectItem value="maintenance">Maintenance</SelectItem>
                                  <SelectItem value="retired">Retired</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label htmlFor="edit-location">Location</Label>
                              <Input
                                id="edit-location"
                                value={formData.location || ""}
                                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                                placeholder="Enter location"
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="edit-assignedTo">Assigned To</Label>
                              <Input
                                id="edit-assignedTo"
                                value={formData.assignedTo || ""}
                                onChange={(e) => setFormData({ ...formData, assignedTo: e.target.value })}
                                placeholder="Enter assigned person/team"
                              />
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label htmlFor="edit-purchaseDate">Purchase Date</Label>
                              <Input
                                id="edit-purchaseDate"
                                type="date"
                                value={formData.purchaseDate || ""}
                                onChange={(e) => setFormData({ ...formData, purchaseDate: e.target.value })}
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="edit-warrantyExpiry">Warranty Expiry</Label>
                              <Input
                                id="edit-warrantyExpiry"
                                type="date"
                                value={formData.warrantyExpiry || ""}
                                onChange={(e) => setFormData({ ...formData, warrantyExpiry: e.target.value })}
                              />
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label htmlFor="edit-cost">Cost ($)</Label>
                              <Input
                                id="edit-cost"
                                type="number"
                                value={formData.cost || ""}
                                onChange={(e) =>
                                  setFormData({ ...formData, cost: Number.parseFloat(e.target.value) || 0 })
                                }
                                placeholder="Enter cost"
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="edit-vendor">Vendor *</Label>
                              <Input
                                id="edit-vendor"
                                value={formData.vendor || ""}
                                onChange={(e) => setFormData({ ...formData, vendor: e.target.value })}
                                placeholder="Enter vendor name"
                              />
                            </div>
                          </div>

                          {formData.type === "hardware" && (
                            <div className="grid grid-cols-2 gap-4">
                              <div className="space-y-2">
                                <Label htmlFor="edit-serialNumber">Serial Number</Label>
                                <Input
                                  id="edit-serialNumber"
                                  value={formData.serialNumber || ""}
                                  onChange={(e) => setFormData({ ...formData, serialNumber: e.target.value })}
                                  placeholder="Enter serial number"
                                />
                              </div>
                              <div className="space-y-2">
                                <Label htmlFor="edit-specifications">Specifications</Label>
                                <Input
                                  id="edit-specifications"
                                  value={formData.specifications || ""}
                                  onChange={(e) => setFormData({ ...formData, specifications: e.target.value })}
                                  placeholder="Enter specifications"
                                />
                              </div>
                            </div>
                          )}

                          {formData.type === "software" && (
                            <div className="grid grid-cols-2 gap-4">
                              <div className="space-y-2">
                                <Label htmlFor="edit-licenseKey">License Key</Label>
                                <Input
                                  id="edit-licenseKey"
                                  value={formData.licenseKey || ""}
                                  onChange={(e) => setFormData({ ...formData, licenseKey: e.target.value })}
                                  placeholder="Enter license key"
                                />
                              </div>
                              <div className="space-y-2">
                                <Label htmlFor="edit-version">Version</Label>
                                <Input
                                  id="edit-version"
                                  value={formData.version || ""}
                                  onChange={(e) => setFormData({ ...formData, version: e.target.value })}
                                  placeholder="Enter version"
                                />
                              </div>
                            </div>
                          )}

                          <div className="space-y-2">
                            <Label htmlFor="edit-description">Description</Label>
                            <Textarea
                              id="edit-description"
                              value={formData.description || ""}
                              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                              placeholder="Enter description"
                              rows={3}
                            />
                          </div>
                        </div>
                        <DialogFooter>
                          <Button variant="outline" onClick={() => setEditingItem(null)}>
                            Cancel
                          </Button>
                          <Button onClick={handleUpdate}>Update Item</Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>

                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="outline" size="sm">
                          <Trash2 className="h-4 w-4" />
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
                          <AlertDialogAction onClick={() => handleDelete(item.id)}>Delete</AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                  <Badge className={statusColors[item.status]}>
                    {item.status?.charAt(0).toUpperCase() + item.status?.slice(1)}
                  </Badge>
                  <span className="text-sm font-medium">${(item.cost || 0).toLocaleString()}</span>
                </div>

                <div className="space-y-1 text-sm text-muted-foreground">
                  <div>
                    <strong>Location:</strong> {item.location || 'N/A'}
                  </div>
                  <div>
                    <strong>Assigned to:</strong> {item.assignedTo || 'N/A'}
                  </div>
                  <div>
                    <strong>Vendor:</strong> {item.vendor || 'N/A'}
                  </div>
                  {item.serialNumber && (
                    <div>
                      <strong>Serial:</strong> {item.serialNumber}
                    </div>
                  )}
                  {item.licenseKey && (
                    <div>
                      <strong>License:</strong> {item.licenseKey}
                    </div>
                  )}
                  {item.warrantyExpiry && (
                    <div>
                      <strong>Warranty:</strong> {new Date(item.warrantyExpiry).toLocaleDateString()}
                    </div>
                  )}
                </div>

                {item.description && <p className="text-sm text-muted-foreground line-clamp-2">{item.description}</p>}
              </CardContent>
            </Card>
          )
        })}
      </div>

      {filteredInventory.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Package className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No items found</h3>
            <p className="text-muted-foreground text-center">
              {searchTerm || typeFilter !== "all" || statusFilter !== "all"
                ? "Try adjusting your search or filters"
                : "Get started by adding your first inventory item"}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

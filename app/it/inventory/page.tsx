"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Search,
  Plus,
  MoreHorizontal,
  Edit,
  Trash2,
  Eye,
  Package,
  HardDrive,
  Monitor,
  Loader2,
  AlertCircle,
  Download,
  Upload,
  RefreshCw,
  Users,
  Calendar,
  MapPin,
  DollarSign,
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
} from "lucide-react"
import { toast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"
import { useAuth } from "@/contexts/auth-context"
import { collection, query, where, getDocs, doc, updateDoc, orderBy, serverTimestamp } from "firebase/firestore"
import { db } from "@/lib/firebase"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu"
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Checkbox } from "@/components/ui/checkbox"

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
  deleted: boolean
  productNumber: string
  location?: string
  supplier?: string
  model?: string
  notes?: string
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

const statusIcons = {
  active: CheckCircle,
  inactive: XCircle,
  maintenance: Clock,
  retired: AlertTriangle,
}

export default function ITInventoryPage() {
  const router = useRouter()
  const { userData } = useAuth()
  const [items, setItems] = useState<InventoryItem[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [typeFilter, setTypeFilter] = useState<string>("all")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [departmentFilter, setDepartmentFilter] = useState<string>("all")
  const [conditionFilter, setConditionFilter] = useState<string>("all")
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [itemToDelete, setItemToDelete] = useState<InventoryItem | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [selectedItems, setSelectedItems] = useState<string[]>([])
  const [viewMode, setViewMode] = useState<"table" | "grid">("table")
  const [sortBy, setSortBy] = useState<string>("created_at")
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc")

  // Statistics
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    inactive: 0,
    maintenance: 0,
    retired: 0,
    hardware: 0,
    software: 0,
    totalValue: 0,
  })

  // Fetch inventory items (only non-deleted ones)
  useEffect(() => {
    const fetchItems = async () => {
      if (!userData?.company_id) return

      try {
        const itemsRef = collection(db, "itInventory")
        const q = query(
          itemsRef,
          where("company_id", "==", userData.company_id),
          where("deleted", "==", false),
          orderBy("created_at", "desc"),
        )
        const querySnapshot = await getDocs(q)

        const fetchedItems: InventoryItem[] = []
        querySnapshot.forEach((doc) => {
          const data = doc.data()
          fetchedItems.push({
            id: doc.id,
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
            deleted: data.deleted || false,
            productNumber: data.productNumber || "",
            location: data.location || "",
            supplier: data.supplier || "",
            model: data.model || "",
            notes: data.notes || "",
          })
        })

        setItems(fetchedItems)

        // Calculate statistics
        const newStats = {
          total: fetchedItems.length,
          active: fetchedItems.filter((item) => item.status === "active").length,
          inactive: fetchedItems.filter((item) => item.status === "inactive").length,
          maintenance: fetchedItems.filter((item) => item.status === "maintenance").length,
          retired: fetchedItems.filter((item) => item.status === "retired").length,
          hardware: fetchedItems.filter((item) => item.type === "hardware").length,
          software: fetchedItems.filter((item) => item.type === "software").length,
          totalValue: fetchedItems.reduce((sum, item) => sum + (item.cost || 0), 0),
        }
        setStats(newStats)
      } catch (error) {
        console.error("Error fetching items:", error)
        toast({
          title: "Error",
          description: "Failed to load inventory items",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }

    fetchItems()
  }, [userData?.company_id])

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

  // Filter items based on search and filters
  const filteredItems = items.filter((item) => {
    const matchesSearch =
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.brand.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.serialNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.productNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.description.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesType = typeFilter === "all" || item.type === typeFilter
    const matchesStatus = statusFilter === "all" || item.status === statusFilter
    const matchesDepartment = departmentFilter === "all" || item.department === departmentFilter
    const matchesCondition = conditionFilter === "all" || item.condition === conditionFilter

    return matchesSearch && matchesType && matchesStatus && matchesDepartment && matchesCondition
  })

  const handleEdit = useCallback(
    (item: InventoryItem) => {
      router.push(`/it/inventory/edit/${item.id}`)
    },
    [router],
  )

  const handleView = useCallback(
    (item: InventoryItem) => {
      router.push(`/it/inventory/details/${item.id}`)
    },
    [router],
  )

  const handleDelete = useCallback((item: InventoryItem) => {
    setItemToDelete(item)
    setDeleteDialogOpen(true)
  }, [])

  const resetDeleteState = useCallback(() => {
    setDeleteDialogOpen(false)
    setItemToDelete(null)
    setIsDeleting(false)
  }, [])

  const confirmDelete = useCallback(async () => {
    if (!itemToDelete || isDeleting) return

    setIsDeleting(true)

    try {
      const itemRef = doc(db, "itInventory", itemToDelete.id)
      await updateDoc(itemRef, {
        deleted: true,
        deleted_at: serverTimestamp(),
        updated_at: serverTimestamp(),
      })

      setItems((prevItems) => prevItems.filter((item) => item.id !== itemToDelete.id))

      const deletedItemName = itemToDelete.name
      resetDeleteState()

      toast({
        title: "Asset Deleted",
        description: `${deletedItemName} has been deleted from inventory`,
      })
    } catch (error) {
      console.error("Error deleting item:", error)
      resetDeleteState()

      toast({
        title: "Error",
        description: "Failed to delete asset. Please try again.",
        variant: "destructive",
      })
    }
  }, [itemToDelete, isDeleting, resetDeleteState])

  const handleDeleteDialogOpenChange = useCallback(
    (open: boolean) => {
      if (!open && !isDeleting) {
        resetDeleteState()
      }
    },
    [isDeleting, resetDeleteState],
  )

  const handleAddNew = useCallback(() => {
    router.push("/it/inventory/new")
  }, [router])

  const handleSelectAll = useCallback(
    (checked: boolean) => {
      if (checked) {
        setSelectedItems(filteredItems.map((item) => item.id))
      } else {
        setSelectedItems([])
      }
    },
    [filteredItems],
  )

  const handleSelectItem = useCallback((itemId: string, checked: boolean) => {
    if (checked) {
      setSelectedItems((prev) => [...prev, itemId])
    } else {
      setSelectedItems((prev) => prev.filter((id) => id !== itemId))
    }
  }, [])

  const handleBulkAction = useCallback(
    (action: string) => {
      // Implement bulk actions
      toast({
        title: "Bulk Action",
        description: `${action} action will be implemented for ${selectedItems.length} items`,
      })
    },
    [selectedItems],
  )

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
        <div className="container mx-auto p-6">
          <div className="flex justify-center items-center min-h-[400px]">
            <div className="flex flex-col items-center space-y-4">
              <Loader2 className="h-8 w-8 animate-spin" />
              <p className="text-muted-foreground">Loading asset inventory...</p>
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
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Asset Management</h1>
            <p className="text-slate-600">Manage your IT assets and equipment inventory</p>
          </div>
          <div className="flex items-center space-x-3">
            <Button variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
            <Button variant="outline" size="sm">
              <Upload className="h-4 w-4 mr-2" />
              Import
            </Button>
            <Button onClick={handleAddNew} className="shadow-sm">
              <Plus className="h-4 w-4 mr-2" />
              Create Asset
            </Button>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4 mb-6">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Package className="h-4 w-4 text-blue-600" />
                <div>
                  <p className="text-2xl font-bold">{stats.total}</p>
                  <p className="text-xs text-muted-foreground">Total Assets</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <div>
                  <p className="text-2xl font-bold">{stats.active}</p>
                  <p className="text-xs text-muted-foreground">Active</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Clock className="h-4 w-4 text-yellow-600" />
                <div>
                  <p className="text-2xl font-bold">{stats.maintenance}</p>
                  <p className="text-xs text-muted-foreground">Maintenance</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <XCircle className="h-4 w-4 text-gray-600" />
                <div>
                  <p className="text-2xl font-bold">{stats.inactive}</p>
                  <p className="text-xs text-muted-foreground">Inactive</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <HardDrive className="h-4 w-4 text-purple-600" />
                <div>
                  <p className="text-2xl font-bold">{stats.hardware}</p>
                  <p className="text-xs text-muted-foreground">Hardware</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Monitor className="h-4 w-4 text-indigo-600" />
                <div>
                  <p className="text-2xl font-bold">{stats.software}</p>
                  <p className="text-xs text-muted-foreground">Software</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <DollarSign className="h-4 w-4 text-green-600" />
                <div>
                  <p className="text-2xl font-bold">${stats.totalValue.toLocaleString()}</p>
                  <p className="text-xs text-muted-foreground">Total Value</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <AlertTriangle className="h-4 w-4 text-red-600" />
                <div>
                  <p className="text-2xl font-bold">{stats.retired}</p>
                  <p className="text-xs text-muted-foreground">Retired</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters and Search */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="flex flex-col lg:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search assets by name, brand, category, serial number, or asset tag..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <div className="flex flex-col sm:flex-row gap-4">
                <Select value={typeFilter} onValueChange={setTypeFilter}>
                  <SelectTrigger className="w-full sm:w-[140px]">
                    <SelectValue placeholder="Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="hardware">Hardware</SelectItem>
                    <SelectItem value="software">Software</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-full sm:w-[140px]">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                    <SelectItem value="maintenance">Maintenance</SelectItem>
                    <SelectItem value="retired">Retired</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={conditionFilter} onValueChange={setConditionFilter}>
                  <SelectTrigger className="w-full sm:w-[140px]">
                    <SelectValue placeholder="Condition" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Conditions</SelectItem>
                    <SelectItem value="excellent">Excellent</SelectItem>
                    <SelectItem value="good">Good</SelectItem>
                    <SelectItem value="fair">Fair</SelectItem>
                    <SelectItem value="poor">Poor</SelectItem>
                    <SelectItem value="damaged">Damaged</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
                  <SelectTrigger className="w-full sm:w-[160px]">
                    <SelectValue placeholder="Department" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Departments</SelectItem>
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
            </div>
          </CardContent>
        </Card>

        {/* Bulk Actions and View Controls */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-4">
            <p className="text-sm text-muted-foreground">
              Showing {filteredItems.length} of {items.length} assets
            </p>
            {selectedItems.length > 0 && (
              <div className="flex items-center space-x-2">
                <span className="text-sm font-medium">{selectedItems.length} selected</span>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm">
                      Bulk Actions
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    <DropdownMenuItem onClick={() => handleBulkAction("check-out")}>Check Out</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleBulkAction("check-in")}>Check In</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleBulkAction("update-status")}>Update Status</DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => handleBulkAction("delete")} className="text-red-600">
                      Delete Selected
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            )}
          </div>
          <div className="flex items-center space-x-2">
            {(searchTerm ||
              typeFilter !== "all" ||
              statusFilter !== "all" ||
              departmentFilter !== "all" ||
              conditionFilter !== "all") && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSearchTerm("")
                  setTypeFilter("all")
                  setStatusFilter("all")
                  setDepartmentFilter("all")
                  setConditionFilter("all")
                }}
              >
                Clear Filters
              </Button>
            )}
            <Button variant="outline" size="sm">
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Assets Table */}
        {filteredItems.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <div className="flex flex-col items-center space-y-4">
                <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center">
                  <Package className="h-8 w-8 text-muted-foreground" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-lg font-semibold">No assets found</h3>
                  <p className="text-muted-foreground">
                    {items.length === 0
                      ? "Get started by adding your first asset to the inventory"
                      : "Try adjusting your search or filter criteria"}
                  </p>
                </div>
                {items.length === 0 && (
                  <Button onClick={handleAddNew}>
                    <Plus className="h-4 w-4 mr-2" />
                    Create First Asset
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">
                      <Checkbox
                        checked={selectedItems.length === filteredItems.length}
                        onCheckedChange={handleSelectAll}
                      />
                    </TableHead>
                    <TableHead>Asset Tag</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Assigned To</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Purchase Date</TableHead>
                    <TableHead>Purchase Cost</TableHead>
                    <TableHead className="w-12"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredItems.map((item) => {
                    const StatusIcon = statusIcons[item.status]
                    return (
                      <TableRow key={item.id} className="hover:bg-muted/50">
                        <TableCell>
                          <Checkbox
                            checked={selectedItems.includes(item.id)}
                            onCheckedChange={(checked) => handleSelectItem(item.id, checked as boolean)}
                          />
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            {item.type === "hardware" ? (
                              <HardDrive className="h-4 w-4 text-blue-600" />
                            ) : (
                              <Monitor className="h-4 w-4 text-green-600" />
                            )}
                            <span className="font-mono text-sm">{item.productNumber}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium">{item.name}</div>
                            <div className="text-sm text-muted-foreground">{item.brand}</div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-xs">
                            {item.category}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <StatusIcon className="h-4 w-4" />
                            <Badge variant="outline" className={cn("text-xs", statusColors[item.status])}>
                              {item.status}
                            </Badge>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <Users className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm">{getUserDisplayName(item.assignedTo)}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <MapPin className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm">{item.location || item.department}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm">
                              {item.purchaseDate ? new Date(item.purchaseDate).toLocaleDateString() : "N/A"}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <DollarSign className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm">
                              {item.cost > 0 ? `${item.currency} ${item.cost.toLocaleString()}` : "N/A"}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuLabel>Actions</DropdownMenuLabel>
                              <DropdownMenuItem onClick={() => handleView(item)}>
                                <Eye className="h-4 w-4 mr-2" />
                                View Details
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleEdit(item)}>
                                <Edit className="h-4 w-4 mr-2" />
                                Edit Asset
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem>
                                <Users className="h-4 w-4 mr-2" />
                                Check Out
                              </DropdownMenuItem>
                              <DropdownMenuItem>
                                <RefreshCw className="h-4 w-4 mr-2" />
                                Check In
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem onClick={() => handleDelete(item)} className="text-red-600">
                                <Trash2 className="h-4 w-4 mr-2" />
                                Delete Asset
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={deleteDialogOpen} onOpenChange={handleDeleteDialogOpenChange}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle className="flex items-center space-x-2">
                <AlertCircle className="h-5 w-5 text-red-600" />
                <span>Delete Asset</span>
              </AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete "{itemToDelete?.name}"? This action will move the asset to trash and it
                won't be visible in your inventory list.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={confirmDelete} disabled={isDeleting} className="bg-red-600 hover:bg-red-700">
                {isDeleting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Deleting...
                  </>
                ) : (
                  "Delete Asset"
                )}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  )
}

"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Plus,
  Search,
  Edit,
  Trash2,
  Monitor,
  Smartphone,
  Server,
  HardDrive,
  Wifi,
  Printer,
  Laptop,
  Database,
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface InventoryItem {
  id: string
  name: string
  type: "hardware" | "software"
  category: string
  status: "active" | "inactive" | "maintenance" | "retired"
  location: string
  assignedTo?: string
  serialNumber?: string
  purchaseDate: string
  warrantyExpiry?: string
  cost: number
  vendor: string
  description: string
  specifications?: string
  licenseKey?: string
  version?: string
  created: string
  updated: string
}

const ITEM_CATEGORIES = {
  hardware: [
    "Desktop Computer",
    "Laptop",
    "Server",
    "Monitor",
    "Printer",
    "Router",
    "Switch",
    "Smartphone",
    "Tablet",
    "Storage Device",
    "Other Hardware",
  ],
  software: [
    "Operating System",
    "Office Suite",
    "Antivirus",
    "Database",
    "Development Tool",
    "Design Software",
    "Communication Tool",
    "Other Software",
  ],
}

const STATUS_COLORS = {
  active: "bg-green-100 text-green-800",
  inactive: "bg-gray-100 text-gray-800",
  maintenance: "bg-yellow-100 text-yellow-800",
  retired: "bg-red-100 text-red-800",
}

const getCategoryIcon = (category: string) => {
  const iconMap: { [key: string]: any } = {
    "Desktop Computer": Monitor,
    Laptop: Laptop,
    Server: Server,
    Monitor: Monitor,
    Printer: Printer,
    Router: Wifi,
    Switch: Wifi,
    Smartphone: Smartphone,
    "Storage Device": HardDrive,
    Database: Database,
    "Operating System": Monitor,
    "Office Suite": Monitor,
    Antivirus: Monitor,
    "Development Tool": Monitor,
    "Design Software": Monitor,
    "Communication Tool": Monitor,
  }

  const IconComponent = iconMap[category] || Monitor
  return <IconComponent className="h-4 w-4" />
}

export default function ITInventoryPage() {
  const [items, setItems] = useState<InventoryItem[]>([])
  const [filteredItems, setFilteredItems] = useState<InventoryItem[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [filterType, setFilterType] = useState<"all" | "hardware" | "software">("all")
  const [filterStatus, setFilterStatus] = useState<"all" | "active" | "inactive" | "maintenance" | "retired">("all")
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null)
  const [formData, setFormData] = useState({
    name: "",
    type: "hardware" as "hardware" | "software",
    category: "",
    status: "active" as "active" | "inactive" | "maintenance" | "retired",
    location: "",
    assignedTo: "",
    serialNumber: "",
    purchaseDate: "",
    warrantyExpiry: "",
    cost: "",
    vendor: "",
    description: "",
    specifications: "",
    licenseKey: "",
    version: "",
  })

  const { toast } = useToast()

  // Load sample data on component mount
  useEffect(() => {
    const sampleData: InventoryItem[] = [
      {
        id: "1",
        name: "Dell OptiPlex 7090",
        type: "hardware",
        category: "Desktop Computer",
        status: "active",
        location: "IT Department - Floor 2",
        assignedTo: "John Doe",
        serialNumber: "DL7090001",
        purchaseDate: "2023-01-15",
        warrantyExpiry: "2026-01-15",
        cost: 1200,
        vendor: "Dell Technologies",
        description: "High-performance desktop computer for development work",
        specifications: "Intel i7-11700, 16GB RAM, 512GB SSD",
        created: "2023-01-15T10:00:00Z",
        updated: "2023-01-15T10:00:00Z",
      },
      {
        id: "2",
        name: "Microsoft Office 365",
        type: "software",
        category: "Office Suite",
        status: "active",
        location: "Company-wide",
        purchaseDate: "2023-01-01",
        cost: 2400,
        vendor: "Microsoft",
        description: "Office productivity suite with cloud services",
        licenseKey: "XXXXX-XXXXX-XXXXX-XXXXX",
        version: "2023",
        created: "2023-01-01T10:00:00Z",
        updated: "2023-01-01T10:00:00Z",
      },
      {
        id: "3",
        name: "HP LaserJet Pro M404n",
        type: "hardware",
        category: "Printer",
        status: "maintenance",
        location: "Sales Department - Floor 1",
        serialNumber: "HP404001",
        purchaseDate: "2022-06-10",
        warrantyExpiry: "2024-06-10",
        cost: 350,
        vendor: "HP Inc.",
        description: "Monochrome laser printer for office use",
        specifications: "38 ppm, 1200x1200 dpi, USB/Ethernet",
        created: "2022-06-10T10:00:00Z",
        updated: "2024-01-05T14:30:00Z",
      },
      {
        id: "4",
        name: "Cisco Catalyst 2960",
        type: "hardware",
        category: "Switch",
        status: "active",
        location: "Server Room - Floor 3",
        serialNumber: "CS2960001",
        purchaseDate: "2022-03-20",
        warrantyExpiry: "2025-03-20",
        cost: 800,
        vendor: "Cisco Systems",
        description: "24-port Ethernet switch for network infrastructure",
        specifications: "24x 10/100/1000 ports, 2x SFP uplinks",
        created: "2022-03-20T10:00:00Z",
        updated: "2022-03-20T10:00:00Z",
      },
      {
        id: "5",
        name: "Adobe Creative Suite",
        type: "software",
        category: "Design Software",
        status: "active",
        location: "Marketing Department",
        assignedTo: "Design Team",
        purchaseDate: "2023-02-01",
        cost: 1800,
        vendor: "Adobe Inc.",
        description: "Professional design and creative software suite",
        licenseKey: "ADOBE-XXXXX-XXXXX-XXXXX",
        version: "2023",
        created: "2023-02-01T10:00:00Z",
        updated: "2023-02-01T10:00:00Z",
      },
    ]
    setItems(sampleData)
    setFilteredItems(sampleData)
  }, [])

  // Filter items based on search term, type, and status
  useEffect(() => {
    let filtered = items

    if (searchTerm) {
      filtered = filtered.filter(
        (item) =>
          item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          item.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
          item.vendor.toLowerCase().includes(searchTerm.toLowerCase()) ||
          item.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (item.assignedTo && item.assignedTo.toLowerCase().includes(searchTerm.toLowerCase())),
      )
    }

    if (filterType !== "all") {
      filtered = filtered.filter((item) => item.type === filterType)
    }

    if (filterStatus !== "all") {
      filtered = filtered.filter((item) => item.status === filterStatus)
    }

    setFilteredItems(filtered)
  }, [items, searchTerm, filterType, filterStatus])

  const resetForm = () => {
    setFormData({
      name: "",
      type: "hardware",
      category: "",
      status: "active",
      location: "",
      assignedTo: "",
      serialNumber: "",
      purchaseDate: "",
      warrantyExpiry: "",
      cost: "",
      vendor: "",
      description: "",
      specifications: "",
      licenseKey: "",
      version: "",
    })
  }

  const handleAdd = () => {
    if (!formData.name || !formData.category || !formData.vendor) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      })
      return
    }

    const newItem: InventoryItem = {
      id: Date.now().toString(),
      name: formData.name,
      type: formData.type,
      category: formData.category,
      status: formData.status,
      location: formData.location,
      assignedTo: formData.assignedTo || undefined,
      serialNumber: formData.serialNumber || undefined,
      purchaseDate: formData.purchaseDate,
      warrantyExpiry: formData.warrantyExpiry || undefined,
      cost: Number.parseFloat(formData.cost) || 0,
      vendor: formData.vendor,
      description: formData.description,
      specifications: formData.specifications || undefined,
      licenseKey: formData.licenseKey || undefined,
      version: formData.version || undefined,
      created: new Date().toISOString(),
      updated: new Date().toISOString(),
    }

    setItems([...items, newItem])
    setIsAddDialogOpen(false)
    resetForm()

    toast({
      title: "Success",
      description: "Inventory item added successfully",
    })
  }

  const handleEdit = (item: InventoryItem) => {
    setEditingItem(item)
    setFormData({
      name: item.name,
      type: item.type,
      category: item.category,
      status: item.status,
      location: item.location,
      assignedTo: item.assignedTo || "",
      serialNumber: item.serialNumber || "",
      purchaseDate: item.purchaseDate,
      warrantyExpiry: item.warrantyExpiry || "",
      cost: item.cost.toString(),
      vendor: item.vendor,
      description: item.description,
      specifications: item.specifications || "",
      licenseKey: item.licenseKey || "",
      version: item.version || "",
    })
    setIsEditDialogOpen(true)
  }

  const handleUpdate = () => {
    if (!editingItem || !formData.name || !formData.category || !formData.vendor) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      })
      return
    }

    const updatedItem: InventoryItem = {
      ...editingItem,
      name: formData.name,
      type: formData.type,
      category: formData.category,
      status: formData.status,
      location: formData.location,
      assignedTo: formData.assignedTo || undefined,
      serialNumber: formData.serialNumber || undefined,
      purchaseDate: formData.purchaseDate,
      warrantyExpiry: formData.warrantyExpiry || undefined,
      cost: Number.parseFloat(formData.cost) || 0,
      vendor: formData.vendor,
      description: formData.description,
      specifications: formData.specifications || undefined,
      licenseKey: formData.licenseKey || undefined,
      version: formData.version || undefined,
      updated: new Date().toISOString(),
    }

    setItems(items.map((item) => (item.id === editingItem.id ? updatedItem : item)))
    setIsEditDialogOpen(false)
    setEditingItem(null)
    resetForm()

    toast({
      title: "Success",
      description: "Inventory item updated successfully",
    })
  }

  const handleDelete = (id: string) => {
    if (confirm("Are you sure you want to delete this inventory item?")) {
      setItems(items.filter((item) => item.id !== id))
      toast({
        title: "Success",
        description: "Inventory item deleted successfully",
      })
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    if (!dateString) return "N/A"
    return new Date(dateString).toLocaleDateString()
  }

  const totalValue = items.reduce((sum, item) => sum + item.cost, 0)
  const activeItems = items.filter((item) => item.status === "active").length
  const maintenanceItems = items.filter((item) => item.status === "maintenance").length

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">IT Inventory</h2>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm}>
              <Plus className="mr-2 h-4 w-4" />
              Add Item
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Add New Inventory Item</DialogTitle>
              <DialogDescription>Add a new hardware or software item to the inventory</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Item name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="type">Type *</Label>
                  <Select
                    value={formData.type}
                    onValueChange={(value: "hardware" | "software") =>
                      setFormData({ ...formData, type: value, category: "" })
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
                  <Label htmlFor="category">Category *</Label>
                  <Select
                    value={formData.category}
                    onValueChange={(value) => setFormData({ ...formData, category: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {ITEM_CATEGORIES[formData.type].map((category) => (
                        <SelectItem key={category} value={category}>
                          {category}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="status">Status</Label>
                  <Select
                    value={formData.status}
                    onValueChange={(value: "active" | "inactive" | "maintenance" | "retired") =>
                      setFormData({ ...formData, status: value })
                    }
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
                  <Label htmlFor="location">Location</Label>
                  <Input
                    id="location"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    placeholder="Physical location"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="assignedTo">Assigned To</Label>
                  <Input
                    id="assignedTo"
                    value={formData.assignedTo}
                    onChange={(e) => setFormData({ ...formData, assignedTo: e.target.value })}
                    placeholder="Person or department"
                  />
                </div>
              </div>

              {formData.type === "hardware" && (
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="serialNumber">Serial Number</Label>
                    <Input
                      id="serialNumber"
                      value={formData.serialNumber}
                      onChange={(e) => setFormData({ ...formData, serialNumber: e.target.value })}
                      placeholder="Serial number"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="specifications">Specifications</Label>
                    <Input
                      id="specifications"
                      value={formData.specifications}
                      onChange={(e) => setFormData({ ...formData, specifications: e.target.value })}
                      placeholder="Technical specifications"
                    />
                  </div>
                </div>
              )}

              {formData.type === "software" && (
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="licenseKey">License Key</Label>
                    <Input
                      id="licenseKey"
                      value={formData.licenseKey}
                      onChange={(e) => setFormData({ ...formData, licenseKey: e.target.value })}
                      placeholder="Software license key"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="version">Version</Label>
                    <Input
                      id="version"
                      value={formData.version}
                      onChange={(e) => setFormData({ ...formData, version: e.target.value })}
                      placeholder="Software version"
                    />
                  </div>
                </div>
              )}

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="purchaseDate">Purchase Date</Label>
                  <Input
                    id="purchaseDate"
                    type="date"
                    value={formData.purchaseDate}
                    onChange={(e) => setFormData({ ...formData, purchaseDate: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="warrantyExpiry">Warranty Expiry</Label>
                  <Input
                    id="warrantyExpiry"
                    type="date"
                    value={formData.warrantyExpiry}
                    onChange={(e) => setFormData({ ...formData, warrantyExpiry: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cost">Cost ($)</Label>
                  <Input
                    id="cost"
                    type="number"
                    step="0.01"
                    value={formData.cost}
                    onChange={(e) => setFormData({ ...formData, cost: e.target.value })}
                    placeholder="0.00"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="vendor">Vendor *</Label>
                <Input
                  id="vendor"
                  value={formData.vendor}
                  onChange={(e) => setFormData({ ...formData, vendor: e.target.value })}
                  placeholder="Vendor/Manufacturer"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Item description"
                  rows={3}
                />
              </div>
            </div>
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleAdd}>Add Item</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Items</CardTitle>
            <Monitor className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{items.length}</div>
            <p className="text-xs text-muted-foreground">
              {items.filter((i) => i.type === "hardware").length} hardware,{" "}
              {items.filter((i) => i.type === "software").length} software
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Items</CardTitle>
            <Monitor className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeItems}</div>
            <p className="text-xs text-muted-foreground">Currently in use</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Maintenance</CardTitle>
            <Monitor className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{maintenanceItems}</div>
            <p className="text-xs text-muted-foreground">Requires attention</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Value</CardTitle>
            <Monitor className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalValue)}</div>
            <p className="text-xs text-muted-foreground">Asset value</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <Card>
        <CardHeader>
          <CardTitle>Inventory Management</CardTitle>
          <CardDescription>Manage your IT hardware and software inventory</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search items..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>
            <Select value={filterType} onValueChange={(value: "all" | "hardware" | "software") => setFilterType(value)}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="hardware">Hardware</SelectItem>
                <SelectItem value="software">Software</SelectItem>
              </SelectContent>
            </Select>
            <Select
              value={filterStatus}
              onValueChange={(value: "all" | "active" | "inactive" | "maintenance" | "retired") =>
                setFilterStatus(value)
              }
            >
              <SelectTrigger className="w-[180px]">
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

          {/* Inventory Table */}
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Item</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Assigned To</TableHead>
                  <TableHead>Cost</TableHead>
                  <TableHead>Purchase Date</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredItems.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        {getCategoryIcon(item.category)}
                        <div>
                          <div className="font-medium">{item.name}</div>
                          <div className="text-sm text-muted-foreground">{item.category}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{item.type}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge className={STATUS_COLORS[item.status]}>{item.status}</Badge>
                    </TableCell>
                    <TableCell>{item.location || "N/A"}</TableCell>
                    <TableCell>{item.assignedTo || "Unassigned"}</TableCell>
                    <TableCell>{formatCurrency(item.cost)}</TableCell>
                    <TableCell>{formatDate(item.purchaseDate)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end space-x-2">
                        <Button variant="outline" size="sm" onClick={() => handleEdit(item)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => handleDelete(item.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {filteredItems.length === 0 && (
            <div className="text-center py-8">
              <p className="text-muted-foreground">No inventory items found.</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
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
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Item name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-type">Type *</Label>
                <Select
                  value={formData.type}
                  onValueChange={(value: "hardware" | "software") => setFormData({ ...formData, type: value })}
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
                    {ITEM_CATEGORIES[formData.type].map((category) => (
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
                  onValueChange={(value: "active" | "inactive" | "maintenance" | "retired") =>
                    setFormData({ ...formData, status: value })
                  }
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
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  placeholder="Physical location"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-assignedTo">Assigned To</Label>
                <Input
                  id="edit-assignedTo"
                  value={formData.assignedTo}
                  onChange={(e) => setFormData({ ...formData, assignedTo: e.target.value })}
                  placeholder="Person or department"
                />
              </div>
            </div>

            {formData.type === "hardware" && (
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-serialNumber">Serial Number</Label>
                  <Input
                    id="edit-serialNumber"
                    value={formData.serialNumber}
                    onChange={(e) => setFormData({ ...formData, serialNumber: e.target.value })}
                    placeholder="Serial number"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-specifications">Specifications</Label>
                  <Input
                    id="edit-specifications"
                    value={formData.specifications}
                    onChange={(e) => setFormData({ ...formData, specifications: e.target.value })}
                    placeholder="Technical specifications"
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
                    value={formData.licenseKey}
                    onChange={(e) => setFormData({ ...formData, licenseKey: e.target.value })}
                    placeholder="Software license key"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-version">Version</Label>
                  <Input
                    id="edit-version"
                    value={formData.version}
                    onChange={(e) => setFormData({ ...formData, version: e.target.value })}
                    placeholder="Software version"
                  />
                </div>
              </div>
            )}

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-purchaseDate">Purchase Date</Label>
                <Input
                  id="edit-purchaseDate"
                  type="date"
                  value={formData.purchaseDate}
                  onChange={(e) => setFormData({ ...formData, purchaseDate: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-warrantyExpiry">Warranty Expiry</Label>
                <Input
                  id="edit-warrantyExpiry"
                  type="date"
                  value={formData.warrantyExpiry}
                  onChange={(e) => setFormData({ ...formData, warrantyExpiry: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-cost">Cost ($)</Label>
                <Input
                  id="edit-cost"
                  type="number"
                  step="0.01"
                  value={formData.cost}
                  onChange={(e) => setFormData({ ...formData, cost: e.target.value })}
                  placeholder="0.00"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-vendor">Vendor *</Label>
              <Input
                id="edit-vendor"
                value={formData.vendor}
                onChange={(e) => setFormData({ ...formData, vendor: e.target.value })}
                placeholder="Vendor/Manufacturer"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-description">Description</Label>
              <Textarea
                id="edit-description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Item description"
                rows={3}
              />
            </div>
          </div>
          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpdate}>Update Item</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

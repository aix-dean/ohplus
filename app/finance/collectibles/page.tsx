"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Trash2, Edit, Plus, Search, Filter } from "lucide-react"

interface Collectible {
  id: string
  created: string
  company_id: string
  type: "sites" | "supplies"
  updated: string
  deleted: boolean
  client_name: string
  net_amount: number
  total_amount: number
  mode_of_payment: string
  bank_name: string
  bi_no: string
  or_no: string
  invoice_no: string
  next_collection_date: string
  status: "pending" | "collected" | "overdue" | "cancelled"

  // Sites specific fields
  booking_no?: string
  site?: string
  covered_period?: string
  bir_2307?: string
  collection_date?: string

  // Supplies specific fields
  date?: string
  product?: string
  transfer_date?: string
  bs_no?: string
  due_for_collection?: string
  date_paid?: string
  net_amount_collection?: number
}

const initialFormData: Partial<Collectible> = {
  type: "sites",
  client_name: "",
  net_amount: 0,
  total_amount: 0,
  mode_of_payment: "",
  bank_name: "",
  bi_no: "",
  or_no: "",
  invoice_no: "",
  next_collection_date: "",
  status: "pending",
  deleted: false,
}

export default function CollectiblesPage() {
  const [collectibles, setCollectibles] = useState<Collectible[]>([])
  const [filteredCollectibles, setFilteredCollectibles] = useState<Collectible[]>([])
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [formData, setFormData] = useState<Partial<Collectible>>(initialFormData)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [typeFilter, setTypeFilter] = useState<string>("all")

  // Mock data - replace with actual API calls
  useEffect(() => {
    const mockData: Collectible[] = [
      {
        id: "1",
        created: "2024-01-15",
        company_id: "COMP001",
        type: "sites",
        updated: "2024-01-15",
        deleted: false,
        client_name: "ABC Corporation",
        net_amount: 50000,
        total_amount: 56000,
        mode_of_payment: "Bank Transfer",
        bank_name: "BPI",
        bi_no: "BI001",
        or_no: "OR001",
        invoice_no: "INV001",
        next_collection_date: "2024-02-15",
        status: "pending",
        booking_no: "BK001",
        site: "EDSA Site",
        covered_period: "Jan 2024",
        bir_2307: "2307-001",
        collection_date: "2024-01-15",
      },
      {
        id: "2",
        created: "2024-01-16",
        company_id: "COMP002",
        type: "supplies",
        updated: "2024-01-16",
        deleted: false,
        client_name: "XYZ Industries",
        net_amount: 25000,
        total_amount: 28000,
        mode_of_payment: "Check",
        bank_name: "BDO",
        bi_no: "BI002",
        or_no: "OR002",
        invoice_no: "INV002",
        next_collection_date: "2024-02-16",
        status: "collected",
        date: "2024-01-16",
        product: "Office Supplies",
        transfer_date: "2024-01-17",
        bs_no: "BS002",
        due_for_collection: "2024-02-16",
        date_paid: "2024-01-16",
        net_amount_collection: 25000,
      },
    ]
    setCollectibles(mockData)
  }, [])

  // Filter collectibles (soft delete - only show deleted: false)
  useEffect(() => {
    let filtered = collectibles.filter((item) => !item.deleted)

    if (searchTerm) {
      filtered = filtered.filter(
        (item) =>
          item.client_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          item.invoice_no.toLowerCase().includes(searchTerm.toLowerCase()) ||
          item.or_no.toLowerCase().includes(searchTerm.toLowerCase()),
      )
    }

    if (statusFilter !== "all") {
      filtered = filtered.filter((item) => item.status === statusFilter)
    }

    if (typeFilter !== "all") {
      filtered = filtered.filter((item) => item.type === typeFilter)
    }

    setFilteredCollectibles(filtered)
  }, [collectibles, searchTerm, statusFilter, typeFilter])

  const handleInputChange = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleSubmit = () => {
    if (editingId) {
      // Update existing collectible
      setCollectibles((prev) =>
        prev.map((item) =>
          item.id === editingId ? { ...item, ...formData, updated: new Date().toISOString().split("T")[0] } : item,
        ),
      )
      setIsEditDialogOpen(false)
    } else {
      // Create new collectible
      const newCollectible: Collectible = {
        ...formData,
        id: Date.now().toString(),
        created: new Date().toISOString().split("T")[0],
        updated: new Date().toISOString().split("T")[0],
        company_id:
          "COMP" +
          Math.floor(Math.random() * 1000)
            .toString()
            .padStart(3, "0"),
      } as Collectible

      setCollectibles((prev) => [...prev, newCollectible])
      setIsCreateDialogOpen(false)
    }

    setFormData(initialFormData)
    setEditingId(null)
  }

  const handleEdit = (collectible: Collectible) => {
    setFormData(collectible)
    setEditingId(collectible.id)
    setIsEditDialogOpen(true)
  }

  const handleSoftDelete = (id: string) => {
    setCollectibles((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, deleted: true, updated: new Date().toISOString().split("T")[0] } : item,
      ),
    )
  }

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case "collected":
        return "default"
      case "pending":
        return "secondary"
      case "overdue":
        return "destructive"
      case "cancelled":
        return "outline"
      default:
        return "secondary"
    }
  }

  const renderFormFields = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {/* Base Fields */}
      <div>
        <Label htmlFor="type">Type *</Label>
        <Select value={formData.type} onValueChange={(value) => handleInputChange("type", value)}>
          <SelectTrigger>
            <SelectValue placeholder="Select type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="sites">Sites</SelectItem>
            <SelectItem value="supplies">Supplies</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label htmlFor="client_name">Client Name *</Label>
        <Input
          id="client_name"
          value={formData.client_name || ""}
          onChange={(e) => handleInputChange("client_name", e.target.value)}
          required
        />
      </div>

      <div>
        <Label htmlFor="net_amount">Net Amount *</Label>
        <Input
          id="net_amount"
          type="number"
          value={formData.net_amount || 0}
          onChange={(e) => handleInputChange("net_amount", Number.parseFloat(e.target.value))}
          required
        />
      </div>

      <div>
        <Label htmlFor="total_amount">Total Amount *</Label>
        <Input
          id="total_amount"
          type="number"
          value={formData.total_amount || 0}
          onChange={(e) => handleInputChange("total_amount", Number.parseFloat(e.target.value))}
          required
        />
      </div>

      <div>
        <Label htmlFor="mode_of_payment">Mode of Payment</Label>
        <Select value={formData.mode_of_payment} onValueChange={(value) => handleInputChange("mode_of_payment", value)}>
          <SelectTrigger>
            <SelectValue placeholder="Select payment mode" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="Cash">Cash</SelectItem>
            <SelectItem value="Check">Check</SelectItem>
            <SelectItem value="Bank Transfer">Bank Transfer</SelectItem>
            <SelectItem value="Credit Card">Credit Card</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label htmlFor="bank_name">Bank Name</Label>
        <Input
          id="bank_name"
          value={formData.bank_name || ""}
          onChange={(e) => handleInputChange("bank_name", e.target.value)}
        />
      </div>

      <div>
        <Label htmlFor="bi_no">BI No.</Label>
        <Input id="bi_no" value={formData.bi_no || ""} onChange={(e) => handleInputChange("bi_no", e.target.value)} />
      </div>

      <div>
        <Label htmlFor="or_no">OR No.</Label>
        <Input id="or_no" value={formData.or_no || ""} onChange={(e) => handleInputChange("or_no", e.target.value)} />
      </div>

      <div>
        <Label htmlFor="invoice_no">Invoice No.</Label>
        <Input
          id="invoice_no"
          value={formData.invoice_no || ""}
          onChange={(e) => handleInputChange("invoice_no", e.target.value)}
        />
      </div>

      <div>
        <Label htmlFor="next_collection_date">Next Collection Date</Label>
        <Input
          id="next_collection_date"
          type="date"
          value={formData.next_collection_date || ""}
          onChange={(e) => handleInputChange("next_collection_date", e.target.value)}
        />
      </div>

      <div>
        <Label htmlFor="status">Status</Label>
        <Select value={formData.status} onValueChange={(value) => handleInputChange("status", value)}>
          <SelectTrigger>
            <SelectValue placeholder="Select status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="collected">Collected</SelectItem>
            <SelectItem value="overdue">Overdue</SelectItem>
            <SelectItem value="cancelled">Cancelled</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Sites specific fields */}
      {formData.type === "sites" && (
        <>
          <div>
            <Label htmlFor="booking_no">Booking No.</Label>
            <Input
              id="booking_no"
              value={formData.booking_no || ""}
              onChange={(e) => handleInputChange("booking_no", e.target.value)}
            />
          </div>

          <div>
            <Label htmlFor="site">Site</Label>
            <Input id="site" value={formData.site || ""} onChange={(e) => handleInputChange("site", e.target.value)} />
          </div>

          <div>
            <Label htmlFor="covered_period">Covered Period</Label>
            <Input
              id="covered_period"
              value={formData.covered_period || ""}
              onChange={(e) => handleInputChange("covered_period", e.target.value)}
            />
          </div>

          <div>
            <Label htmlFor="bir_2307">BIR 2307</Label>
            <Input
              id="bir_2307"
              value={formData.bir_2307 || ""}
              onChange={(e) => handleInputChange("bir_2307", e.target.value)}
            />
          </div>

          <div>
            <Label htmlFor="collection_date">Collection Date</Label>
            <Input
              id="collection_date"
              type="date"
              value={formData.collection_date || ""}
              onChange={(e) => handleInputChange("collection_date", e.target.value)}
            />
          </div>
        </>
      )}

      {/* Supplies specific fields */}
      {formData.type === "supplies" && (
        <>
          <div>
            <Label htmlFor="date">Date</Label>
            <Input
              id="date"
              type="date"
              value={formData.date || ""}
              onChange={(e) => handleInputChange("date", e.target.value)}
            />
          </div>

          <div>
            <Label htmlFor="product">Product</Label>
            <Input
              id="product"
              value={formData.product || ""}
              onChange={(e) => handleInputChange("product", e.target.value)}
            />
          </div>

          <div>
            <Label htmlFor="transfer_date">Transfer Date</Label>
            <Input
              id="transfer_date"
              type="date"
              value={formData.transfer_date || ""}
              onChange={(e) => handleInputChange("transfer_date", e.target.value)}
            />
          </div>

          <div>
            <Label htmlFor="bs_no">BS No.</Label>
            <Input
              id="bs_no"
              value={formData.bs_no || ""}
              onChange={(e) => handleInputChange("bs_no", e.target.value)}
            />
          </div>

          <div>
            <Label htmlFor="due_for_collection">Due for Collection</Label>
            <Input
              id="due_for_collection"
              type="date"
              value={formData.due_for_collection || ""}
              onChange={(e) => handleInputChange("due_for_collection", e.target.value)}
            />
          </div>

          <div>
            <Label htmlFor="date_paid">Date Paid</Label>
            <Input
              id="date_paid"
              type="date"
              value={formData.date_paid || ""}
              onChange={(e) => handleInputChange("date_paid", e.target.value)}
            />
          </div>

          <div>
            <Label htmlFor="net_amount_collection">Net Amount Collection</Label>
            <Input
              id="net_amount_collection"
              type="number"
              value={formData.net_amount_collection || 0}
              onChange={(e) => handleInputChange("net_amount_collection", Number.parseFloat(e.target.value))}
            />
          </div>
        </>
      )}
    </div>
  )

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Collectibles</h1>
          <p className="text-muted-foreground">Manage your collection records and tracking</p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => setFormData(initialFormData)}>
              <Plus className="h-4 w-4 mr-2" />
              Create Collectible
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create New Collectible</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              {renderFormFields()}
              <div className="flex justify-end space-x-2 pt-4">
                <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleSubmit}>Create Collectible</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <Label htmlFor="search">Search</Label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="search"
                  placeholder="Search by client, invoice, OR no..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="status-filter">Status</Label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="collected">Collected</SelectItem>
                  <SelectItem value="overdue">Overdue</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="type-filter">Type</Label>
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="sites">Sites</SelectItem>
                  <SelectItem value="supplies">Supplies</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Collectibles Table */}
      <Card>
        <CardHeader>
          <CardTitle>Collectibles Records ({filteredCollectibles.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Client Name</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Invoice No.</TableHead>
                  <TableHead>OR No.</TableHead>
                  <TableHead>Net Amount</TableHead>
                  <TableHead>Total Amount</TableHead>
                  <TableHead>Next Collection</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCollectibles.map((collectible) => (
                  <TableRow key={collectible.id}>
                    <TableCell className="font-medium">{collectible.client_name}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="capitalize">
                        {collectible.type}
                      </Badge>
                    </TableCell>
                    <TableCell>{collectible.invoice_no}</TableCell>
                    <TableCell>{collectible.or_no}</TableCell>
                    <TableCell>₱{collectible.net_amount.toLocaleString()}</TableCell>
                    <TableCell>₱{collectible.total_amount.toLocaleString()}</TableCell>
                    <TableCell>{collectible.next_collection_date}</TableCell>
                    <TableCell>
                      <Badge variant={getStatusBadgeVariant(collectible.status)}>{collectible.status}</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        <Button variant="outline" size="sm" onClick={() => handleEdit(collectible)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => handleSoftDelete(collectible.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Collectible</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {renderFormFields()}
            <div className="flex justify-end space-x-2 pt-4">
              <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleSubmit}>Update Collectible</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

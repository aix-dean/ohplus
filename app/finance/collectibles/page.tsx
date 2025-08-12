"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Plus, Search, Edit, Trash2, Save, X, Check, Eye } from "lucide-react"
import { useAuth } from "@/contexts/auth-context"
import { collection, addDoc, updateDoc, doc, getDocs, query, where, serverTimestamp } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { toast } from "sonner"
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage"
import { Loader2 } from "lucide-react"

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
  status: "pending" | "collected" | "overdue"
  // Sites specific fields
  booking_no?: string
  site?: string
  covered_period?: string
  bir_2307?: string
  bir_2307_filename?: string
  next_bir_2307?: string
  next_bir_2307_filename?: string
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

export default function CollectiblesPage() {
  const { user } = useAuth()
  const [collectibles, setCollectibles] = useState<Collectible[]>([])
  const [filteredCollectibles, setFilteredCollectibles] = useState<Collectible[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [typeFilter, setTypeFilter] = useState<string>("all")
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editData, setEditData] = useState<Record<string, Partial<Collectible>>>({})
  const [isAddingNew, setIsAddingNew] = useState(false)
  const [newRowData, setNewRowData] = useState<Partial<Collectible>>({
    type: "sites",
    status: "pending",
    mode_of_payment: "Cash",
    deleted: false,
  })
  const [loading, setLoading] = useState(false)
  const [uploadingFiles, setUploadingFiles] = useState<{ [key: string]: boolean }>({})

  const fetchCollectibles = async () => {
    if (!user?.company_id && !user?.uid) return

    try {
      setLoading(true)
      const q = query(collection(db, "collectibles"), where("company_id", "==", user?.company_id || user?.uid))
      const querySnapshot = await getDocs(q)
      const collectiblesData = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Collectible[]

      setCollectibles(collectiblesData)
    } catch (error) {
      console.error("Error fetching collectibles:", error)
      toast.error("Failed to load collectibles")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchCollectibles()
  }, [user])

  // Filter collectibles (soft delete - only show deleted: false)
  useEffect(() => {
    let filtered = collectibles.filter((item) => !item.deleted)

    if (searchTerm) {
      filtered = filtered.filter(
        (item) =>
          item.client_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          item.invoice_no?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          item.or_no?.toLowerCase().includes(searchTerm.toLowerCase()),
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

  const startEditing = (id: string) => {
    const collectible = collectibles.find((c) => c.id === id)
    if (collectible) {
      setEditingId(id)
      setEditData((prev) => ({ ...prev, [id]: { ...collectible } }))
    }
  }

  const cancelEditing = () => {
    setEditingId(null)
    setEditData((prev) => {
      const newData = { ...prev }
      delete newData[editingId || ""]
      return newData
    })
  }

  const saveEdit = async () => {
    const data = editData[editingId || ""]
    if (!data || !editingId) return

    try {
      await updateDoc(doc(db, "collectibles", editingId), {
        ...data,
        updated: serverTimestamp(),
      })

      setCollectibles((prev) => prev.map((c) => (c.id === editingId ? { ...c, ...data } : c)))
      cancelEditing()
      toast.success("Collectible updated successfully")
    } catch (error) {
      console.error("Error updating collectible:", error)
      toast.error("Failed to update collectible")
    }
  }

  const updateEditData = (id: string, field: string, value: any) => {
    setEditData((prev) => ({
      ...prev,
      [id]: { ...prev[id], [field]: value },
    }))
  }

  const startAddingNew = () => {
    setIsAddingNew(true)
    setNewRowData({
      type: "sites",
      status: "pending",
      mode_of_payment: "Cash",
      deleted: false,
    })
  }

  const cancelAddingNew = () => {
    setIsAddingNew(false)
    setNewRowData({
      type: "sites",
      status: "pending",
      mode_of_payment: "Cash",
      deleted: false,
    })
  }

  const saveNewRow = async () => {
    if (!newRowData.client_name || !newRowData.total_amount) {
      toast.error("Please fill in required fields")
      return
    }

    try {
      const collectibleData = {
        ...newRowData,
        company_id: user?.company_id || user?.uid,
        created: serverTimestamp(),
        updated: serverTimestamp(),
      }

      const docRef = await addDoc(collection(db, "collectibles"), collectibleData)
      const newCollectible = { ...collectibleData, id: docRef.id } as Collectible

      setCollectibles((prev) => [...prev, newCollectible])
      cancelAddingNew()
      toast.success("Collectible created successfully")
    } catch (error) {
      console.error("Error creating collectible:", error)
      toast.error("Failed to create collectible")
    }
  }

  const updateNewRowData = (field: string, value: any) => {
    setNewRowData((prev) => ({ ...prev, [field]: value }))
  }

  const handleSoftDelete = async (id: string) => {
    try {
      await updateDoc(doc(db, "collectibles", id), {
        deleted: true,
        updated: serverTimestamp(),
      })

      setCollectibles((prev) => prev.map((c) => (c.id === id ? { ...c, deleted: true } : c)))
      toast.success("Collectible deleted successfully")
    } catch (error) {
      console.error("Error deleting collectible:", error)
      toast.error("Failed to delete collectible")
    }
  }

  const getStatusBadge = (status: string) => {
    const variants = {
      pending: "secondary",
      collected: "default",
      overdue: "destructive",
    } as const

    return <Badge variant={variants[status as keyof typeof variants] || "secondary"}>{status}</Badge>
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-PH", {
      style: "currency",
      currency: "PHP",
    }).format(amount || 0)
  }

  const renderEditableCell = (
    collectible: Collectible,
    field: string,
    type: "text" | "number" | "date" | "select" = "text",
    options?: string[],
  ) => {
    const isEditing = editingId === collectible.id
    const value = isEditing
      ? editData[collectible.id]?.[field as keyof Collectible]
      : collectible[field as keyof Collectible]

    if (!isEditing) {
      if (field === "total_amount" || field === "net_amount") {
        return formatCurrency(value as number)
      }
      if (field === "status") {
        return getStatusBadge(value as string)
      }
      if (field === "type") {
        return <Badge variant="outline">{value as string}</Badge>
      }
      return value as string
    }

    if (type === "select" && options) {
      return (
        <Select value={value as string} onValueChange={(val) => updateEditData(collectible.id, field, val)}>
          <SelectTrigger className="h-8">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {options.map((option) => (
              <SelectItem key={option} value={option}>
                {option}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )
    }

    return (
      <Input
        type={type}
        value={(value as string) || ""}
        onChange={(e) =>
          updateEditData(
            collectible.id,
            field,
            type === "number" ? Number.parseFloat(e.target.value) || 0 : e.target.value,
          )
        }
        className="h-8"
      />
    )
  }

  const renderNewRowCell = (
    field: string,
    type: "text" | "number" | "date" | "select" = "text",
    options?: string[],
  ) => {
    const value = newRowData[field as keyof Collectible]

    if (type === "select" && options) {
      return (
        <Select value={value as string} onValueChange={(val) => updateNewRowData(field, val)}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {options.map((option) => (
              <SelectItem key={option} value={option}>
                {option}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )
    }

    return (
      <Input
        type={type}
        value={(value as string) || ""}
        onChange={(e) =>
          updateNewRowData(field, type === "number" ? Number.parseFloat(e.target.value) || 0 : e.target.value)
        }
        className="h-8 text-xs"
        placeholder={field === "client_name" ? "Required" : ""}
      />
    )
  }

  const handleFileUpload = async (file: File, collectibleId: string, fieldName: string) => {
    const uploadKey = `${collectibleId}-${fieldName}`
    setUploadingFiles((prev) => ({ ...prev, [uploadKey]: true }))

    try {
      // Create a reference to Firebase Storage
      const storage = getStorage()
      const fileRef = ref(storage, `collectibles/${collectibleId}/${fieldName}/${file.name}`)

      // Upload file
      await uploadBytes(fileRef, file)
      const downloadURL = await getDownloadURL(fileRef)

      // Update the collectible record with the file URL
      const collectibleRef = doc(db, "collectibles", collectibleId)
      await updateDoc(collectibleRef, {
        [fieldName]: downloadURL,
        [`${fieldName}_filename`]: file.name,
        updated: serverTimestamp(),
      })

      // Update local state
      setCollectibles((prev) =>
        prev.map((item) =>
          item.id === collectibleId
            ? { ...item, [fieldName]: downloadURL, [`${fieldName}_filename`]: file.name }
            : item,
        ),
      )

      toast({
        title: "File uploaded successfully",
        description: `${file.name} has been uploaded.`,
      })
    } catch (error) {
      console.error("Error uploading file:", error)
      toast({
        title: "Upload failed",
        description: "Failed to upload file. Please try again.",
        variant: "destructive",
      })
    } finally {
      setUploadingFiles((prev) => ({ ...prev, [uploadKey]: false }))
    }
  }

  const handleViewFile = (fileUrl: string, filename: string) => {
    if (fileUrl) {
      window.open(fileUrl, "_blank")
    }
  }

  const FileUploadCell = ({
    collectible,
    fieldName,
    isEditing,
  }: {
    collectible: Collectible
    fieldName: string
    isEditing: boolean
  }) => {
    const uploadKey = `${collectible.id}-${fieldName}`
    const isUploading = uploadingFiles[uploadKey]
    const fileUrl = collectible[fieldName as keyof Collectible] as string
    const filename = collectible[`${fieldName}_filename` as keyof Collectible] as string

    if (!isEditing) {
      return (
        <div className="flex items-center gap-2">
          {fileUrl ? (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleViewFile(fileUrl, filename)}
                className="h-8 px-2"
              >
                <Eye className="h-3 w-3 mr-1" />
                View
              </Button>
              <span className="text-xs text-muted-foreground truncate max-w-[100px]">{filename || "File"}</span>
            </>
          ) : (
            <span className="text-xs text-muted-foreground">No file</span>
          )}
        </div>
      )
    }

    return (
      <div className="flex items-center gap-2">
        <Input
          type="file"
          accept=".pdf,.doc,.docx"
          onChange={(e) => {
            const file = e.target.files?.[0]
            if (file) {
              handleFileUpload(file, collectible.id, fieldName)
            }
          }}
          className="h-8 text-xs"
          disabled={isUploading}
        />
        {isUploading && <Loader2 className="h-3 w-3 animate-spin" />}
        {fileUrl && (
          <Button variant="outline" size="sm" onClick={() => handleViewFile(fileUrl, filename)} className="h-8 px-2">
            <Eye className="h-3 w-3" />
          </Button>
        )}
      </div>
    )
  }

  const showNextCollectionFields = typeFilter === "all" || typeFilter === "sites"

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Collectibles</h1>
          <p className="text-muted-foreground">Manage your collection records and track payments</p>
        </div>
        <Button onClick={startAddingNew} disabled={isAddingNew}>
          <Plus className="h-4 w-4 mr-2" />
          Add New Row
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by client name, invoice no, or OR no..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="collected">Collected</SelectItem>
                <SelectItem value="overdue">Overdue</SelectItem>
              </SelectContent>
            </Select>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Filter by type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="sites">Sites</SelectItem>
                <SelectItem value="supplies">Supplies</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Collectibles Records</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Client Name</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Invoice No</TableHead>
                  <TableHead>OR No</TableHead>
                  <TableHead>Total Amount</TableHead>
                  <TableHead>Net Amount</TableHead>
                  <TableHead>Payment Mode</TableHead>
                  <TableHead>Bank Name</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Next Collection</TableHead>
                  {/* Conditional columns based on type filter */}
                  {(typeFilter === "all" || typeFilter === "sites") && (
                    <>
                      <TableHead>Booking No</TableHead>
                      <TableHead>Site</TableHead>
                      <TableHead>Collection Date</TableHead>
                      <TableHead>BIR 2307</TableHead>
                      {showNextCollectionFields && <TableHead>Next Collection BIR 2307</TableHead>}
                    </>
                  )}
                  {(typeFilter === "all" || typeFilter === "supplies") && (
                    <>
                      <TableHead>Product</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Due Collection</TableHead>
                    </>
                  )}
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isAddingNew && (
                  <TableRow className="bg-blue-50">
                    <TableCell>{renderNewRowCell("client_name")}</TableCell>
                    <TableCell>{renderNewRowCell("type", "select", ["sites", "supplies"])}</TableCell>
                    <TableCell>{renderNewRowCell("invoice_no")}</TableCell>
                    <TableCell>{renderNewRowCell("or_no")}</TableCell>
                    <TableCell>{renderNewRowCell("total_amount", "number")}</TableCell>
                    <TableCell>{renderNewRowCell("net_amount", "number")}</TableCell>
                    <TableCell>
                      {renderNewRowCell("mode_of_payment", "select", [
                        "Cash",
                        "Credit/Debit Card",
                        "Gcash",
                        "Bank Transfer",
                      ])}
                    </TableCell>
                    <TableCell>{renderNewRowCell("bank_name")}</TableCell>
                    <TableCell>{renderNewRowCell("status", "select", ["pending", "collected", "overdue"])}</TableCell>
                    <TableCell>{renderNewRowCell("next_collection_date", "date")}</TableCell>
                    {/* Conditional fields for new row */}
                    {(typeFilter === "all" || typeFilter === "sites") && (
                      <>
                        <TableCell>{newRowData.type === "sites" ? renderNewRowCell("booking_no") : ""}</TableCell>
                        <TableCell>{newRowData.type === "sites" ? renderNewRowCell("site") : ""}</TableCell>
                        <TableCell>
                          {newRowData.type === "sites" ? renderNewRowCell("collection_date", "date") : ""}
                        </TableCell>
                        <TableCell>{newRowData.type === "sites" ? renderNewRowCell("bir_2307") : ""}</TableCell>
                        {showNextCollectionFields && (
                          <TableCell>{newRowData.type === "sites" ? renderNewRowCell("next_bir_2307") : ""}</TableCell>
                        )}
                      </>
                    )}
                    {(typeFilter === "all" || typeFilter === "supplies") && (
                      <>
                        <TableCell>{newRowData.type === "supplies" ? renderNewRowCell("product") : ""}</TableCell>
                        <TableCell>{newRowData.type === "supplies" ? renderNewRowCell("date", "date") : ""}</TableCell>
                        <TableCell>
                          {newRowData.type === "supplies" ? renderNewRowCell("due_for_collection", "date") : ""}
                        </TableCell>
                      </>
                    )}
                    <TableCell>
                      <div className="flex space-x-1">
                        <Button size="sm" onClick={saveNewRow}>
                          <Check className="h-4 w-4" />
                        </Button>
                        <Button variant="outline" size="sm" onClick={cancelAddingNew}>
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                )}

                {filteredCollectibles.length === 0 && !isAddingNew ? (
                  <TableRow>
                    <TableCell colSpan={15} className="text-center py-8">
                      <p className="text-muted-foreground">No collectibles found</p>
                      <Button className="mt-4" onClick={startAddingNew}>
                        <Plus className="h-4 w-4 mr-2" />
                        Create First Collectible
                      </Button>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredCollectibles.map((collectible) => (
                    <TableRow key={collectible.id} className={editingId === collectible.id ? "bg-yellow-50" : ""}>
                      <TableCell>{renderEditableCell(collectible, "client_name")}</TableCell>
                      <TableCell>{renderEditableCell(collectible, "type", "select", ["sites", "supplies"])}</TableCell>
                      <TableCell>{renderEditableCell(collectible, "invoice_no")}</TableCell>
                      <TableCell>{renderEditableCell(collectible, "or_no")}</TableCell>
                      <TableCell>{renderEditableCell(collectible, "total_amount", "number")}</TableCell>
                      <TableCell>{renderEditableCell(collectible, "net_amount", "number")}</TableCell>
                      <TableCell>
                        {renderEditableCell(collectible, "mode_of_payment", "select", [
                          "Cash",
                          "Credit/Debit Card",
                          "Gcash",
                          "Bank Transfer",
                        ])}
                      </TableCell>
                      <TableCell>{renderEditableCell(collectible, "bank_name")}</TableCell>
                      <TableCell>
                        {renderEditableCell(collectible, "status", "select", ["pending", "collected", "overdue"])}
                      </TableCell>
                      <TableCell>{renderEditableCell(collectible, "next_collection_date", "date")}</TableCell>
                      {/* Conditional columns */}
                      {(typeFilter === "all" || typeFilter === "sites") && (
                        <>
                          <TableCell>
                            {collectible.type === "sites" ? renderEditableCell(collectible, "booking_no") : ""}
                          </TableCell>
                          <TableCell>
                            {collectible.type === "sites" ? renderEditableCell(collectible, "site") : ""}
                          </TableCell>
                          <TableCell>
                            {collectible.type === "sites"
                              ? renderEditableCell(collectible, "collection_date", "date")
                              : ""}
                          </TableCell>
                          <TableCell>
                            {collectible.type === "sites" ? (
                              <FileUploadCell
                                collectible={collectible}
                                fieldName="bir_2307"
                                isEditing={editingId === collectible.id}
                              />
                            ) : (
                              ""
                            )}
                          </TableCell>
                          {showNextCollectionFields && (
                            <TableCell>
                              {collectible.type === "sites" ? (
                                <FileUploadCell
                                  collectible={collectible}
                                  fieldName="next_bir_2307"
                                  isEditing={editingId === collectible.id}
                                />
                              ) : (
                                ""
                              )}
                            </TableCell>
                          )}
                        </>
                      )}
                      {(typeFilter === "all" || typeFilter === "supplies") && (
                        <>
                          <TableCell>
                            {collectible.type === "supplies" ? renderEditableCell(collectible, "product") : ""}
                          </TableCell>
                          <TableCell>
                            {collectible.type === "supplies" ? renderEditableCell(collectible, "date", "date") : ""}
                          </TableCell>
                          <TableCell>
                            {collectible.type === "supplies"
                              ? renderEditableCell(collectible, "due_for_collection", "date")
                              : ""}
                          </TableCell>
                        </>
                      )}
                      <TableCell>
                        <div className="flex space-x-1">
                          {editingId === collectible.id ? (
                            <>
                              <Button size="sm" onClick={saveEdit}>
                                <Save className="h-4 w-4" />
                              </Button>
                              <Button variant="outline" size="sm" onClick={cancelEditing}>
                                <X className="h-4 w-4" />
                              </Button>
                            </>
                          ) : (
                            <>
                              <Button variant="outline" size="sm" onClick={() => startEditing(collectible.id)}>
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button variant="outline" size="sm" onClick={() => handleSoftDelete(collectible.id)}>
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

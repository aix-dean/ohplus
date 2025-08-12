"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { ArrowLeft, Upload, X, FileText } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { doc, getDoc, updateDoc, serverTimestamp } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { useAuth } from "@/contexts/auth-context"

interface CollectibleFormData {
  type: "sites" | "supplies"
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
  bir_2307?: File | string | null // Changed to support both File and existing file reference
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

const initialFormData: CollectibleFormData = {
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
}

export default function EditCollectiblePage({ params }: { params: { id: string } }) {
  const [formData, setFormData] = useState<CollectibleFormData>(initialFormData)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const { user } = useAuth()

  useEffect(() => {
    const fetchCollectible = async () => {
      try {
        setLoading(true)
        setError(null)

        const collectibleDoc = await getDoc(doc(db, "collectibles", params.id))

        if (collectibleDoc.exists()) {
          const collectibleData = collectibleDoc.data()

          // Convert Firestore data to form data format
          const formattedData: CollectibleFormData = {
            type: collectibleData.type || "sites",
            client_name: collectibleData.client_name || "",
            net_amount: collectibleData.net_amount || 0,
            total_amount: collectibleData.total_amount || 0,
            mode_of_payment: collectibleData.mode_of_payment || "",
            bank_name: collectibleData.bank_name || "",
            bi_no: collectibleData.bi_no || "",
            or_no: collectibleData.or_no || "",
            invoice_no: collectibleData.invoice_no || "",
            next_collection_date: collectibleData.next_collection_date || "",
            status: collectibleData.status || "pending",
            // Sites specific fields
            booking_no: collectibleData.booking_no || "",
            site: collectibleData.site || "",
            covered_period: collectibleData.covered_period || "",
            bir_2307: collectibleData.bir_2307 || null,
            collection_date: collectibleData.collection_date || "",
            // Supplies specific fields
            date: collectibleData.date || "",
            product: collectibleData.product || "",
            transfer_date: collectibleData.transfer_date || "",
            bs_no: collectibleData.bs_no || "",
            due_for_collection: collectibleData.due_for_collection || "",
            date_paid: collectibleData.date_paid || "",
            net_amount_collection: collectibleData.net_amount_collection || 0,
          }

          setFormData(formattedData)
        } else {
          setError("Collectible not found")
        }
      } catch (error) {
        console.error("Error fetching collectible:", error)
        setError("Failed to load collectible data")
      } finally {
        setLoading(false)
      }
    }

    if (params.id) {
      fetchCollectible()
    }
  }, [params.id])

  const handleInputChange = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      // Validate file type
      const allowedTypes = [
        "application/pdf",
        "application/msword",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      ]
      if (!allowedTypes.includes(file.type)) {
        alert("Only PDF and DOC files are allowed")
        e.target.value = ""
        return
      }
      handleInputChange("bir_2307", file)
    }
  }

  const removeFile = () => {
    handleInputChange("bir_2307", null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      setLoading(true)

      const collectibleRef = doc(db, "collectibles", params.id)

      // Prepare update data, filtering out undefined values
      const updateData: any = {
        type: formData.type,
        client_name: formData.client_name,
        net_amount: formData.net_amount,
        total_amount: formData.total_amount,
        mode_of_payment: formData.mode_of_payment,
        bank_name: formData.bank_name,
        bi_no: formData.bi_no,
        or_no: formData.or_no,
        invoice_no: formData.invoice_no,
        next_collection_date: formData.next_collection_date,
        status: formData.status,
        updated: serverTimestamp(),
        company_id: user?.company_id || user?.uid || "default_company",
      }

      // Add type-specific fields
      if (formData.type === "sites") {
        if (formData.booking_no) updateData.booking_no = formData.booking_no
        if (formData.site) updateData.site = formData.site
        if (formData.covered_period) updateData.covered_period = formData.covered_period
        if (formData.bir_2307) updateData.bir_2307 = formData.bir_2307
        if (formData.collection_date) updateData.collection_date = formData.collection_date
      } else if (formData.type === "supplies") {
        if (formData.date) updateData.date = formData.date
        if (formData.product) updateData.product = formData.product
        if (formData.transfer_date) updateData.transfer_date = formData.transfer_date
        if (formData.bs_no) updateData.bs_no = formData.bs_no
        if (formData.due_for_collection) updateData.due_for_collection = formData.due_for_collection
        if (formData.date_paid) updateData.date_paid = formData.date_paid
        if (formData.net_amount_collection) updateData.net_amount_collection = formData.net_amount_collection
      }

      await updateDoc(collectibleRef, updateData)

      // Navigate back to collectibles list
      router.push("/finance/collectibles")
    } catch (error) {
      console.error("Error updating collectible:", error)
      setError("Failed to update collectible")
    } finally {
      setLoading(false)
    }
  }

  const renderFormFields = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {/* Base Fields */}
      <div className="space-y-2">
        <Label htmlFor="type">Type</Label>
        <Select value={formData.type} onValueChange={(value) => handleInputChange("type", value)}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="sites">Sites</SelectItem>
            <SelectItem value="supplies">Supplies</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="client_name">Client Name</Label>
        <Input
          id="client_name"
          value={formData.client_name}
          onChange={(e) => handleInputChange("client_name", e.target.value)}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="net_amount">Net Amount</Label>
        <Input
          id="net_amount"
          type="number"
          value={formData.net_amount}
          onChange={(e) => handleInputChange("net_amount", Number.parseFloat(e.target.value) || 0)}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="total_amount">Total Amount</Label>
        <Input
          id="total_amount"
          type="number"
          value={formData.total_amount}
          onChange={(e) => handleInputChange("total_amount", Number.parseFloat(e.target.value) || 0)}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="mode_of_payment">Mode of Payment</Label>
        <Input
          id="mode_of_payment"
          value={formData.mode_of_payment}
          onChange={(e) => handleInputChange("mode_of_payment", e.target.value)}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="bank_name">Bank Name</Label>
        <Input
          id="bank_name"
          value={formData.bank_name}
          onChange={(e) => handleInputChange("bank_name", e.target.value)}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="bi_no">BI No</Label>
        <Input
          id="bi_no"
          value={formData.bi_no}
          onChange={(e) => handleInputChange("bi_no", e.target.value)}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="or_no">OR No</Label>
        <Input
          id="or_no"
          value={formData.or_no}
          onChange={(e) => handleInputChange("or_no", e.target.value)}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="invoice_no">Invoice No</Label>
        <Input
          id="invoice_no"
          value={formData.invoice_no}
          onChange={(e) => handleInputChange("invoice_no", e.target.value)}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="next_collection_date">Next Collection Date</Label>
        <Input
          id="next_collection_date"
          type="date"
          value={formData.next_collection_date}
          onChange={(e) => handleInputChange("next_collection_date", e.target.value)}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="status">Status</Label>
        <Select value={formData.status} onValueChange={(value) => handleInputChange("status", value)}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="collected">Collected</SelectItem>
            <SelectItem value="overdue">Overdue</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Conditional Fields based on type */}
      {formData.type === "sites" && (
        <>
          <div className="space-y-2">
            <Label htmlFor="booking_no">Booking No</Label>
            <Input
              id="booking_no"
              value={formData.booking_no || ""}
              onChange={(e) => handleInputChange("booking_no", e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="site">Site</Label>
            <Input id="site" value={formData.site || ""} onChange={(e) => handleInputChange("site", e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="covered_period">Covered Period</Label>
            <Input
              id="covered_period"
              value={formData.covered_period || ""}
              onChange={(e) => handleInputChange("covered_period", e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="bir_2307">BIR 2307 (PDF/DOC only)</Label>
            {!formData.bir_2307 ? (
              <div className="flex items-center justify-center w-full">
                <label
                  htmlFor="bir_2307"
                  className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100"
                >
                  <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    <Upload className="w-8 h-8 mb-4 text-gray-500" />
                    <p className="mb-2 text-sm text-gray-500">
                      <span className="font-semibold">Click to upload</span> BIR 2307
                    </p>
                    <p className="text-xs text-gray-500">PDF or DOC files only</p>
                  </div>
                  <input
                    id="bir_2307"
                    type="file"
                    className="hidden"
                    accept=".pdf,.doc,.docx"
                    onChange={handleFileChange}
                  />
                </label>
              </div>
            ) : (
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border">
                <div className="flex items-center space-x-2">
                  {formData.bir_2307 instanceof File ? (
                    <>
                      <Upload className="w-4 h-4 text-gray-500" />
                      <span className="text-sm text-gray-700">{formData.bir_2307.name}</span>
                      <span className="text-xs text-gray-500">
                        ({(formData.bir_2307.size / 1024 / 1024).toFixed(2)} MB)
                      </span>
                    </>
                  ) : (
                    <>
                      <FileText className="w-4 h-4 text-gray-500" />
                      <span className="text-sm text-gray-700">Existing file: {formData.bir_2307}</span>
                    </>
                  )}
                </div>
                <div className="flex items-center space-x-2">
                  {typeof formData.bir_2307 === "string" && (
                    <label htmlFor="bir_2307_replace" className="cursor-pointer">
                      <Button type="button" variant="ghost" size="sm" className="text-blue-500 hover:text-blue-700">
                        Replace
                      </Button>
                      <input
                        id="bir_2307_replace"
                        type="file"
                        className="hidden"
                        accept=".pdf,.doc,.docx"
                        onChange={handleFileChange}
                      />
                    </label>
                  )}
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={removeFile}
                    className="text-red-500 hover:text-red-700"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            )}
          </div>
          <div className="space-y-2">
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

      {formData.type === "supplies" && (
        <>
          <div className="space-y-2">
            <Label htmlFor="date">Date</Label>
            <Input
              id="date"
              type="date"
              value={formData.date || ""}
              onChange={(e) => handleInputChange("date", e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="product">Product</Label>
            <Input
              id="product"
              value={formData.product || ""}
              onChange={(e) => handleInputChange("product", e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="transfer_date">Transfer Date</Label>
            <Input
              id="transfer_date"
              type="date"
              value={formData.transfer_date || ""}
              onChange={(e) => handleInputChange("transfer_date", e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="bs_no">BS No</Label>
            <Input
              id="bs_no"
              value={formData.bs_no || ""}
              onChange={(e) => handleInputChange("bs_no", e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="due_for_collection">Due for Collection</Label>
            <Input
              id="due_for_collection"
              type="date"
              value={formData.due_for_collection || ""}
              onChange={(e) => handleInputChange("due_for_collection", e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="date_paid">Date Paid</Label>
            <Input
              id="date_paid"
              type="date"
              value={formData.date_paid || ""}
              onChange={(e) => handleInputChange("date_paid", e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="net_amount_collection">Net Amount Collection</Label>
            <Input
              id="net_amount_collection"
              type="number"
              value={formData.net_amount_collection || 0}
              onChange={(e) => handleInputChange("net_amount_collection", Number.parseFloat(e.target.value) || 0)}
            />
          </div>
        </>
      )}
    </div>
  )

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Link href="/finance/collectibles">
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold">Edit Collectible</h1>
            <p className="text-muted-foreground">Loading...</p>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Link href="/finance/collectibles">
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold">Edit Collectible</h1>
            <p className="text-muted-foreground text-red-500">{error}</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/finance/collectibles">
          <Button variant="outline" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold">Edit Collectible</h1>
          <p className="text-muted-foreground">Update collectible record</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Collectible Information</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {renderFormFields()}
            <div className="flex justify-end space-x-2 pt-4">
              <Link href="/finance/collectibles">
                <Button variant="outline" type="button">
                  Cancel
                </Button>
              </Link>
              <Button type="submit">Update Collectible</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

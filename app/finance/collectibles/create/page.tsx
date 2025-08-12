"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { ArrowLeft, Upload, X } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"

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
  bir_2307?: File | null // Changed from string to File for file upload
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

export default function CreateCollectiblePage() {
  const [formData, setFormData] = useState<CollectibleFormData>(initialFormData)
  const router = useRouter()

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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    // TODO: Replace with actual API call to create collectible
    console.log("Creating collectible:", formData)

    // Navigate back to collectibles list
    router.push("/finance/collectibles")
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
                  <Upload className="w-4 h-4 text-gray-500" />
                  <span className="text-sm text-gray-700">{formData.bir_2307.name}</span>
                  <span className="text-xs text-gray-500">
                    ({(formData.bir_2307.size / 1024 / 1024).toFixed(2)} MB)
                  </span>
                </div>
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
          <h1 className="text-3xl font-bold">Create Collectible</h1>
          <p className="text-muted-foreground">Add a new collectible record</p>
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
              <Button type="submit">Create Collectible</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

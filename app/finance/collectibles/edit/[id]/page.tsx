"use client"

import type React from "react"
import { useState, useEffect, useRef, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { ArrowLeft, Upload, X, FileText, PlusCircle, CheckCircle, Loader2 } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { doc, getDoc, updateDoc, serverTimestamp } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { useAuth } from "@/contexts/auth-context"
import { query, collection, where, getDocs, limit } from "firebase/firestore"
import { debounce } from "lodash"
import ClientDialog from "@/components/client-dialog"

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
  proceed_next_collection: boolean
  next_collection_bir_2307?: File | string | null
  next_collection_status: "pending" | "collected" | "overdue"
  // Sites specific fields
  booking_no?: string
  site?: string
  covered_period?: string
  bir_2307?: File | string | null
  collection_date?: string
  // Supplies specific fields
  date?: string
  product?: string
  transfer_date?: string
  bs_no?: string
  due_for_collection?: string
  date_paid?: string
  net_amount_collection?: number
  vendor_name?: string
  tin_no?: string
  business_address?: string
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
  proceed_next_collection: false,
  next_collection_status: "pending",
}

export default function EditCollectiblePage({ params }: { params: { id: string } }) {
  const [formData, setFormData] = useState<CollectibleFormData>(initialFormData)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const { user } = useAuth()
  const [clientSearchTerm, setClientSearchTerm] = useState("")
  const [clientSearchResults, setClientSearchResults] = useState<any[]>([])
  const [selectedClient, setSelectedClient] = useState<any>(null)
  const [isClientDropdownOpen, setIsClientDropdownOpen] = useState(false)
  const [isSearchingClients, setIsSearchingClients] = useState(false)
  const [isNewClientDialogOpen, setIsNewClientDialogOpen] = useState(false)
  const clientSearchRef = useRef<HTMLDivElement>(null)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    const fetchCollectible = async () => {
      try {
        setLoading(true)
        setError(null)

        const collectibleDoc = await getDoc(doc(db, "collectibles", params.id))

        if (collectibleDoc.exists()) {
          const data = collectibleDoc.data()

          // Convert Firestore data to form format
          const collectibleData: CollectibleFormData = {
            type: data.type || "sites",
            client_name: data.client_name || "",
            net_amount: data.net_amount || 0,
            total_amount: data.total_amount || 0,
            mode_of_payment: data.mode_of_payment || "",
            bank_name: data.bank_name || "",
            bi_no: data.bi_no || "",
            or_no: data.or_no || "",
            invoice_no: data.invoice_no || "",
            next_collection_date: data.next_collection_date || "",
            status: data.status || "pending",
            proceed_next_collection: data.proceed_next_collection || false,
            next_collection_bir_2307: data.next_collection_bir_2307 || null,
            next_collection_status: data.next_collection_status || "pending",
            // Sites specific fields
            booking_no: data.booking_no || "",
            site: data.site || "",
            covered_period: data.covered_period || "",
            bir_2307: data.bir_2307 || null,
            collection_date: data.collection_date || "",
            // Supplies specific fields
            date: data.date || "",
            product: data.product || "",
            transfer_date: data.transfer_date || "",
            bs_no: data.bs_no || "",
            due_for_collection: data.due_for_collection || "",
            date_paid: data.date_paid || "",
            net_amount_collection: data.net_amount_collection || 0,
            // Added vendor fields initialization
            vendor_name: data.vendor_name || "",
            tin_no: data.tin_no || "",
            business_address: data.business_address || "",
          }

          setFormData(collectibleData)
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
      setIsSubmitting(true)
      setSubmitError(null)

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
        // Added next collection fields to update data
        proceed_next_collection: formData.proceed_next_collection,
        next_collection_status: formData.next_collection_status,
        // Added vendor fields to update data
        vendor_name: formData.vendor_name,
        tin_no: formData.tin_no,
        business_address: formData.business_address,
      }

      // Add type-specific fields
      if (formData.type === "sites") {
        if (formData.booking_no) updateData.booking_no = formData.booking_no
        if (formData.site) updateData.site = formData.site
        if (formData.covered_period) updateData.covered_period = formData.covered_period
        if (formData.collection_date) updateData.collection_date = formData.collection_date
        if (formData.bir_2307) updateData.bir_2307 = formData.bir_2307
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
      setSubmitError("Failed to update collectible")
    } finally {
      setIsSubmitting(false)
    }
  }

  const searchClients = useCallback(
    debounce(async (searchTerm: string) => {
      if (!searchTerm.trim() || !user?.uid) {
        setClientSearchResults([])
        setIsSearchingClients(false)
        return
      }

      setIsSearchingClients(true)
      try {
        const clientsQuery = query(
          collection(db, "clients"),
          where("company_id", "==", user.company_id || user.uid),
          where("deleted", "==", false),
          limit(10),
        )

        const querySnapshot = await getDocs(clientsQuery)
        const clients = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }))

        const filteredClients = clients.filter(
          (client) =>
            client.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            client.company?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            client.email?.toLowerCase().includes(searchTerm.toLowerCase()),
        )

        setClientSearchResults(filteredClients)
      } catch (error) {
        console.error("Error searching clients:", error)
        setClientSearchResults([])
      } finally {
        setIsSearchingClients(false)
      }
    }, 300),
    [user],
  )

  const handleClientSelect = (client: any) => {
    setSelectedClient(client)
    setFormData((prev) => ({ ...prev, client_name: client.company || client.name }))
    setIsClientDropdownOpen(false)
    setClientSearchTerm("")
  }

  const handleNewClientSuccess = (newClient: any) => {
    handleClientSelect(newClient)
    setIsNewClientDialogOpen(false)
  }

  const handleNextCollectionFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (file.type === "application/pdf" || file.name.endsWith(".doc") || file.name.endsWith(".docx")) {
        setFormData((prev) => ({ ...prev, next_collection_bir_2307: file }))
      } else {
        alert("Please select a PDF or DOC file.")
      }
    }
  }

  const removeNextCollectionFile = () => {
    setFormData((prev) => ({ ...prev, next_collection_bir_2307: null }))
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
        <div className="relative" ref={clientSearchRef}>
          <div className="relative">
            <Input
              placeholder="Search or select client..."
              value={selectedClient ? selectedClient.company || selectedClient.name : clientSearchTerm}
              onChange={(e) => {
                setClientSearchTerm(e.target.value)
                setSelectedClient(null)
                setFormData((prev) => ({ ...prev, client_name: "" }))
              }}
              onFocus={() => {
                setIsClientDropdownOpen(true)
                if (selectedClient) {
                  setClientSearchTerm("")
                }
              }}
              className="pr-10"
              required
            />
            {isSearchingClients && (
              <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-gray-500" />
            )}
          </div>
          {/* Results dropdown */}
          {isClientDropdownOpen && (
            <Card className="absolute top-full z-50 mt-1 w-full max-h-[200px] overflow-auto shadow-lg">
              <div className="p-2">
                {/* Always show "Add New Client" option at the top */}
                <div
                  className="flex items-center gap-2 py-1.5 px-2 hover:bg-gray-100 cursor-pointer rounded-md text-sm mb-2 border-b pb-2"
                  onClick={() => setIsNewClientDialogOpen(true)}
                >
                  <PlusCircle className="h-4 w-4 text-blue-500" />
                  <span className="font-medium text-blue-700">Add New Client</span>
                </div>

                {clientSearchResults.length > 0 ? (
                  clientSearchResults.map((result) => (
                    <div
                      key={result.id}
                      className="flex items-center justify-between py-1.5 px-2 hover:bg-gray-100 cursor-pointer rounded-md text-sm"
                      onClick={() => handleClientSelect(result)}
                    >
                      <div>
                        <p className="font-medium">
                          {result.name} ({result.company})
                        </p>
                        <p className="text-xs text-gray-500">{result.email}</p>
                      </div>
                      {selectedClient?.id === result.id && <CheckCircle className="h-4 w-4 text-green-500" />}
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-gray-500 text-center py-2">
                    {clientSearchTerm.trim() && !isSearchingClients
                      ? `No clients found for "${clientSearchTerm}".`
                      : "Start typing to search for clients."}
                  </p>
                )}
              </div>
            </Card>
          )}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="vendor_name">Vendor Name</Label>
        <Input
          id="vendor_name"
          value={formData.vendor_name || ""}
          onChange={(e) => handleInputChange("vendor_name", e.target.value)}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="tin_no">TIN No.</Label>
        <Input
          id="tin_no"
          value={formData.tin_no || ""}
          onChange={(e) => handleInputChange("tin_no", e.target.value)}
        />
      </div>

      <div className="md:col-span-2 space-y-2">
        <Label htmlFor="business_address">Business Address</Label>
        <Input
          id="business_address"
          value={formData.business_address || ""}
          onChange={(e) => handleInputChange("business_address", e.target.value)}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="mode_of_payment">Mode of Payment</Label>
        <Select value={formData.mode_of_payment} onValueChange={(value) => handleInputChange("mode_of_payment", value)}>
          <SelectTrigger>
            <SelectValue placeholder="Select payment method" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="Cash">Cash</SelectItem>
            <SelectItem value="Credit/Debit Card">Credit/Debit Card</SelectItem>
            <SelectItem value="Gcash">Gcash</SelectItem>
            <SelectItem value="Bank Transfer">Bank Transfer</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="md:col-span-2 space-y-4 border-t pt-4">
        <div className="flex items-center space-x-2">
          <input
            type="checkbox"
            id="proceed_next_collection"
            checked={formData.proceed_next_collection}
            onChange={(e) => handleInputChange("proceed_next_collection", e.target.checked)}
            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
          />
          <Label htmlFor="proceed_next_collection" className="text-sm font-medium">
            Proceed to set the next collection date?
          </Label>
        </div>

        {formData.proceed_next_collection && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
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
              <Label htmlFor="next_collection_status">Status</Label>
              <Select
                value={formData.next_collection_status}
                onValueChange={(value) => handleInputChange("next_collection_status", value)}
              >
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

            <div className="md:col-span-2 space-y-2">
              <Label htmlFor="next_collection_bir_2307">BIR 2307 for Next Collection (PDF/DOC only)</Label>
              {!formData.next_collection_bir_2307 ? (
                <div className="flex items-center justify-center w-full">
                  <label
                    htmlFor="next_collection_bir_2307"
                    className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100"
                  >
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                      <Upload className="w-8 h-8 mb-4 text-gray-500" />
                      <p className="mb-2 text-sm text-gray-500">
                        <span className="font-semibold">Click to upload</span> BIR 2307 for Next Collection
                      </p>
                      <p className="text-xs text-gray-500">PDF or DOC files only</p>
                    </div>
                    <input
                      id="next_collection_bir_2307"
                      type="file"
                      className="hidden"
                      accept=".pdf,.doc,.docx"
                      onChange={handleNextCollectionFileChange}
                    />
                  </label>
                </div>
              ) : (
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border">
                  <div className="flex items-center space-x-2">
                    {formData.next_collection_bir_2307 instanceof File ? (
                      <>
                        <Upload className="w-4 h-4 text-gray-500" />
                        <span className="text-sm text-gray-700">{formData.next_collection_bir_2307.name}</span>
                        <span className="text-xs text-gray-500">
                          ({(formData.next_collection_bir_2307.size / 1024 / 1024).toFixed(2)} MB)
                        </span>
                      </>
                    ) : (
                      <>
                        <FileText className="w-4 h-4 text-gray-500" />
                        <span className="text-sm text-gray-700">
                          Existing file: {formData.next_collection_bir_2307}
                        </span>
                      </>
                    )}
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={removeNextCollectionFile}
                    className="text-red-500 hover:text-red-700"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Conditional Fields based on type */}
      {formData.type === "sites" && (
        <>
          <div className="space-y-2">
            <Label htmlFor="covered_period">Covered Period</Label>
            <Input
              id="covered_period"
              type="date"
              value={formData.covered_period || ""}
              onChange={(e) => handleInputChange("covered_period", e.target.value)}
            />
          </div>
        </>
      )}

      {formData.type === "supplies" && <></>}
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
            <p className="text-red-500">{error}</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto space-y-6">
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
            {submitError && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">{submitError}</div>
            )}
            <div className="flex justify-end gap-4 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push("/finance/collectibles")}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Updating..." : "Update Collectible"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <ClientDialog
        open={isNewClientDialogOpen}
        onOpenChange={setIsNewClientDialogOpen}
        onSuccess={handleNewClientSuccess}
      />
    </div>
  )
}

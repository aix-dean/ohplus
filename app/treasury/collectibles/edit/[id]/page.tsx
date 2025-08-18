"use client"

import type React from "react"
import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import type { Client } from "@/lib/client-service"
import { useAuth } from "@/contexts/auth-context"
import { doc, getDoc, updateDoc, serverTimestamp } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { uploadFileToFirebaseStorage } from "@/lib/firebase-service"
import { useParams } from "next/navigation"

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
  next_collection_bir_2307?: File | null
  next_collection_status: "pending" | "collected" | "overdue"
  // Sites specific fields
  booking_no?: string
  site?: string
  covered_period?: string
  bir_2307?: File | null
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
  // Existing file URLs
  existing_bir_2307?: string
  existing_next_collection_bir_2307?: string
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

export default function EditTreasuryCollectiblePage() {
  const [formData, setFormData] = useState<CollectibleFormData>(initialFormData)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const params = useParams()
  const { user } = useAuth()
  const [selectedClient, setSelectedClient] = useState<Client | null>(null)

  const [clientSearchTerm, setClientSearchTerm] = useState("")
  const [clientSearchResults, setClientSearchResults] = useState<Client[]>([])
  const [isSearchingClients, setIsSearchingClients] = useState(false)
  const [isClientDropdownOpen, setIsClientDropdownOpen] = useState(false)
  const [isNewClientDialogOpen, setIsNewClientDialogOpen] = useState(false)
  const clientSearchRef = useRef<HTMLDivElement>(null)

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

  useEffect(() => {
    const fetchCollectible = async () => {
      if (!params.id) return

      try {
        setLoading(true)
        const collectibleRef = doc(db, "collectibles", params.id as string)
        const docSnapshot = await getDoc(collectibleRef)

        if (docSnapshot.exists()) {
          const data = docSnapshot.data()

          // Convert data to form format
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
            proceed_next_collection: !!data.next_collection_date,
            next_collection_status: data.next_status || "pending",
            // Sites specific fields
            booking_no: data.booking_no || "",
            site: data.site || "",
            covered_period: data.covered_period || "",
            collection_date: data.collection_date || "",
            // Supplies specific fields
            date: data.date || "",
            product: data.product || "",
            transfer_date: data.transfer_date || "",
            bs_no: data.bs_no || "",
            due_for_collection: data.due_for_collection || "",
            date_paid: data.date_paid || "",
            net_amount_collection: data.net_amount_collection || 0,
            vendor_name: data.vendor_name || "",
            tin_no: data.tin_no || "",
            business_address: data.business_address || "",
            // Store existing file URLs
            existing_bir_2307: data.bir_2307 || "",
            existing_next_collection_bir_2307: data.next_bir_2307 || "",
          }

          setFormData(collectibleData)
        } else {
          setError("Treasury collectible not found")
        }
      } catch (error) {
        console.error("Error fetching treasury collectible:", error)
        setError("Error loading treasury collectible")
      } finally {
        setLoading(false)
      }
    }

    fetchCollectible()
  }, [params.id])

  // ... existing code for client search and form handling ...

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setSubmitError(null)

    try {
      // Upload BIR 2307 file if a new one is selected
      let bir2307Url = formData.existing_bir_2307 || ""
      if (formData.bir_2307 && formData.bir_2307 instanceof File) {
        bir2307Url = await uploadFileToFirebaseStorage(formData.bir_2307, "treasury_collectibles/bir_2307/")
      }

      // Upload Next Collection BIR 2307 file if a new one is selected
      let nextBir2307Url = formData.existing_next_collection_bir_2307 || ""
      if (
        formData.proceed_next_collection &&
        formData.next_collection_bir_2307 &&
        formData.next_collection_bir_2307 instanceof File
      ) {
        nextBir2307Url = await uploadFileToFirebaseStorage(
          formData.next_collection_bir_2307,
          "treasury_collectibles/next_bir_2307/",
        )
      }

      const collectibleData: any = {
        client_name: formData.client_name || "",
        net_amount: Number.parseFloat(formData.net_amount.toString()) || 0,
        total_amount: Number.parseFloat(formData.total_amount.toString()) || 0,
        mode_of_payment: formData.mode_of_payment || "",
        bank_name: formData.bank_name || "",
        bi_no: formData.bi_no || "",
        or_no: formData.or_no || "",
        invoice_no: formData.invoice_no || "",
        status: formData.status || "",
        vendor_name: formData.vendor_name || "",
        tin_no: formData.tin_no || "",
        business_address: formData.business_address || "",
        type: formData.type,
        updated: serverTimestamp(),
      }

      // Add type-specific fields
      if (formData.type === "sites") {
        if (formData.booking_no) collectibleData.booking_no = formData.booking_no
        if (formData.site) collectibleData.site = formData.site
        if (formData.covered_period) collectibleData.covered_period = formData.covered_period
        if (bir2307Url) collectibleData.bir_2307 = bir2307Url
        if (formData.collection_date) collectibleData.collection_date = formData.collection_date
      } else if (formData.type === "supplies") {
        if (formData.date) collectibleData.date = formData.date
        if (formData.product) collectibleData.product = formData.product
        if (formData.transfer_date) collectibleData.transfer_date = formData.transfer_date
        if (formData.bs_no) collectibleData.bs_no = formData.bs_no
        if (formData.due_for_collection) collectibleData.due_for_collection = formData.due_for_collection
        if (formData.date_paid) collectibleData.date_paid = formData.date_paid
        if (formData.net_amount_collection) collectibleData.net_amount_collection = formData.net_amount_collection
      }

      // Add next collection fields only if proceed_next_collection is true
      if (formData.proceed_next_collection) {
        if (formData.next_collection_date) collectibleData.next_collection_date = formData.next_collection_date
        if (nextBir2307Url) collectibleData.next_bir_2307 = nextBir2307Url
        if (formData.next_collection_status) collectibleData.next_status = formData.next_collection_status
      } else {
        // Clear next collection fields if not proceeding
        collectibleData.next_collection_date = ""
        collectibleData.next_bir_2307 = ""
        collectibleData.next_status = ""
      }

      const collectibleRef = doc(db, "collectibles", params.id as string)
      await updateDoc(collectibleRef, collectibleData)

      console.log("Treasury collectible updated successfully")

      // Navigate back to treasury collectibles list
      router.push("/treasury/collectibles")
    } catch (error) {
      console.error("Error updating treasury collectible:", error)
      setSubmitError("Failed to update treasury collectible. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  // ... rest of the component implementation similar to create page but with edit functionality ...

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Link href="/treasury/collectibles">
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold">Edit Treasury Collectible</h1>
            <p className="text-muted-foreground">Loading treasury collectible information...</p>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Link href="/treasury/collectibles">
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold">Edit Treasury Collectible</h1>
            <p className="text-muted-foreground text-red-500">{error}</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/treasury/collectibles">
          <Button variant="outline" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold">Edit Treasury Collectible</h1>
          <p className="text-muted-foreground">Update treasury collectible record</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Treasury Collectible Information</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Form fields would go here - similar to create page */}
            <div className="text-center py-8">
              <p className="text-muted-foreground">Edit form implementation in progress...</p>
            </div>
            {submitError && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">{submitError}</div>
            )}
            <div className="flex justify-end gap-4 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push("/treasury/collectibles")}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Updating..." : "Update Treasury Collectible"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

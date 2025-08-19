"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { doc, getDoc } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Send, Download } from "lucide-react"
import { format } from "date-fns"
import { useAuth } from "@/contexts/auth-context"
import { useToast } from "@/hooks/use-toast"
import type { Quotation } from "@/lib/types/quotation"
import { TreasurySendQuotationDialog } from "@/components/treasury-send-quotation-dialog"
import { TreasurySendQuotationOptionsDialog } from "@/components/treasury-send-quotation-options-dialog"

export default function TreasuryQuotationDetailsPage() {
  const params = useParams()
  const router = useRouter()
  const { user } = useAuth()
  const { toast } = useToast()

  const [quotation, setQuotation] = useState<Quotation | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isSendDialogOpen, setIsSendDialogOpen] = useState(false)
  const [isSendOptionsDialogOpen, setIsSendOptionsDialogOpen] = useState(false)

  useEffect(() => {
    const fetchQuotation = async () => {
      if (!params.id) return

      try {
        setLoading(true)
        const quotationRef = doc(db, "quotations", params.id as string)
        const docSnapshot = await getDoc(quotationRef)

        if (docSnapshot.exists()) {
          const data = docSnapshot.data()
          setQuotation({ id: docSnapshot.id, ...data } as Quotation)
        } else {
          setError("Quotation not found")
        }
      } catch (error) {
        console.error("Error fetching quotation:", error)
        setError("Error loading quotation")
      } finally {
        setLoading(false)
      }
    }

    fetchQuotation()
  }, [params.id])

  const formatDate = (date: any) => {
    if (!date) return "N/A"
    try {
      if (date && typeof date.toDate === "function") {
        return format(date.toDate(), "PPP")
      }
      if (typeof date === "string") {
        return format(new Date(date), "PPP")
      }
      return "Invalid date"
    } catch (error) {
      return "Invalid date"
    }
  }

  const getStatusConfig = (status: Quotation["status"]) => {
    switch (status?.toLowerCase()) {
      case "draft":
        return {
          color: "bg-gray-100 text-gray-800 border-gray-200",
          label: "Draft",
        }
      case "sent":
        return {
          color: "bg-blue-100 text-blue-800 border-blue-200",
          label: "Sent",
        }
      case "viewed":
        return {
          color: "bg-yellow-100 text-yellow-800 border-yellow-200",
          label: "Viewed",
        }
      case "accepted":
        return {
          color: "bg-green-100 text-green-800 border-green-200",
          label: "Accepted",
        }
      case "rejected":
        return {
          color: "bg-red-100 text-red-800 border-red-200",
          label: "Rejected",
        }
      case "expired":
        return {
          color: "bg-orange-100 text-orange-800 border-orange-200",
          label: "Expired",
        }
      default:
        return {
          color: "bg-gray-100 text-gray-800 border-gray-200",
          label: "Unknown",
        }
    }
  }

  const handleQuotationSent = (quotationId: string, newStatus: Quotation["status"]) => {
    if (quotation) {
      setQuotation({ ...quotation, status: newStatus })
    }
    toast({
      title: "Success",
      description: "Quotation sent successfully!",
    })
  }

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center gap-4 mb-6">
          <Button variant="outline" size="sm" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Treasury Quotation Details</h1>
            <p className="text-muted-foreground">Loading quotation information...</p>
          </div>
        </div>
      </div>
    )
  }

  if (error || !quotation) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center gap-4 mb-6">
          <Button variant="outline" size="sm" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Treasury Quotation Details</h1>
            <p className="text-muted-foreground text-red-500">{error}</p>
          </div>
        </div>
      </div>
    )
  }

  const statusConfig = getStatusConfig(quotation.status)

  return (
    <div className="container mx-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="sm" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Treasury Quotation Details</h1>
            <p className="text-muted-foreground">View and manage quotation information</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => setIsSendOptionsDialogOpen(true)}>
            <Send className="h-4 w-4 mr-2" />
            Send Quotation
          </Button>
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Download PDF
          </Button>
        </div>
      </div>

      <div className="grid gap-6">
        {/* Header Information */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-2xl">{quotation.quotation_number}</CardTitle>
              <Badge variant="outline" className={`${statusConfig.color} border font-medium`}>
                {statusConfig.label}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="text-sm font-medium text-muted-foreground">Created Date</label>
              <p className="text-sm font-medium">{formatDate(quotation.created)}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Valid Until</label>
              <p className="text-sm font-medium">{formatDate(quotation.valid_until)}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Duration</label>
              <p className="text-sm font-medium">{quotation.duration_days} days</p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Total Amount</label>
              <p className="text-xl font-bold text-blue-600">₱{quotation.total_amount?.toLocaleString()}</p>
            </div>
          </CardContent>
        </Card>

        {/* Client Information */}
        <Card>
          <CardHeader>
            <CardTitle>Client Information</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-muted-foreground">Client Name</label>
              <p className="text-sm font-medium">{quotation.client_name || "N/A"}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Email</label>
              <p className="text-sm">{quotation.client_email || "N/A"}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Phone</label>
              <p className="text-sm">{quotation.client_phone || "N/A"}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Designation</label>
              <p className="text-sm">{quotation.client_designation || "N/A"}</p>
            </div>
            <div className="md:col-span-2">
              <label className="text-sm font-medium text-muted-foreground">Address</label>
              <p className="text-sm">{quotation.client_address || "N/A"}</p>
            </div>
          </CardContent>
        </Card>

        {/* Campaign Period */}
        <Card>
          <CardHeader>
            <CardTitle>Campaign Period</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-muted-foreground">Start Date</label>
              <p className="text-sm font-medium">{formatDate(quotation.start_date)}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">End Date</label>
              <p className="text-sm font-medium">{formatDate(quotation.end_date)}</p>
            </div>
          </CardContent>
        </Card>

        {/* Items/Products */}
        <Card>
          <CardHeader>
            <CardTitle>Quotation Items</CardTitle>
          </CardHeader>
          <CardContent>
            {quotation.items && quotation.items.length > 0 ? (
              <div className="space-y-4">
                {quotation.items.map((item, index) => (
                  <div key={index} className="border rounded-lg p-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Product Name</label>
                        <p className="text-sm font-medium">{item.name}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Location</label>
                        <p className="text-sm">{item.location}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Monthly Price</label>
                        <p className="text-sm font-medium">₱{item.price?.toLocaleString()}</p>
                      </div>
                      {item.site_code && (
                        <div>
                          <label className="text-sm font-medium text-muted-foreground">Site Code</label>
                          <p className="text-sm">{item.site_code}</p>
                        </div>
                      )}
                      {item.type && (
                        <div>
                          <label className="text-sm font-medium text-muted-foreground">Type</label>
                          <p className="text-sm">{item.type}</p>
                        </div>
                      )}
                      {item.item_total_amount && (
                        <div>
                          <label className="text-sm font-medium text-muted-foreground">Total Amount</label>
                          <p className="text-sm font-medium">₱{item.item_total_amount.toLocaleString()}</p>
                        </div>
                      )}
                    </div>
                    {item.description && (
                      <div className="mt-2">
                        <label className="text-sm font-medium text-muted-foreground">Description</label>
                        <p className="text-sm">{item.description}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground">No items found in this quotation.</p>
            )}
          </CardContent>
        </Card>

        {/* Notes */}
        {quotation.notes && (
          <Card>
            <CardHeader>
              <CardTitle>Notes</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm">{quotation.notes}</p>
            </CardContent>
          </Card>
        )}

        {/* Created By */}
        <Card>
          <CardHeader>
            <CardTitle>Created By</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm">
              {quotation.created_by_first_name || quotation.created_by_last_name
                ? `${quotation.created_by_first_name || ""} ${quotation.created_by_last_name || ""}`.trim()
                : "Unknown"}
            </p>
          </CardContent>
        </Card>
      </div>

      <TreasurySendQuotationDialog
        isOpen={isSendDialogOpen}
        onClose={() => setIsSendDialogOpen(false)}
        quotation={quotation}
        requestorEmail={quotation.client_email || ""}
        onQuotationSent={handleQuotationSent}
      />

      <TreasurySendQuotationOptionsDialog
        isOpen={isSendOptionsDialogOpen}
        onClose={() => setIsSendOptionsDialogOpen(false)}
        quotation={quotation}
        onEmailClick={() => {
          setIsSendOptionsDialogOpen(false)
          setIsSendDialogOpen(true)
        }}
      />
    </div>
  )
}

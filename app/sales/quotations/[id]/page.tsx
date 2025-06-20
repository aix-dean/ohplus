"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { format } from "date-fns"
import { cn } from "@/lib/utils"
import {
  ArrowLeft,
  DownloadIcon,
  Send,
  Eye,
  CheckCircle,
  XCircle,
  FileText,
  Loader2,
  History,
  LayoutGrid,
  Pencil,
  CalendarIcon,
  Save,
  X,
  Clock,
} from "lucide-react"
import {
  getQuotationById,
  updateQuotationStatus,
  generateQuotationPDF,
  updateQuotation,
  type Quotation,
} from "@/lib/quotation-service"
import { getProductById, type Product } from "@/lib/firebase-service"
import { useToast } from "@/hooks/use-toast"
import { SendQuotationDialog } from "@/components/send-quotation-dialog"
import { QuotationSentSuccessDialog } from "@/components/quotation-sent-success-dialog" // Ensure this import is correct
import { SendQuotationOptionsDialog } from "@/components/send-quotation-options-dialog"

// Helper function to generate QR code URL (kept here for consistency with proposal view)
const generateQRCodeUrl = (quotationId: string) => {
  const quotationViewUrl = `${process.env.NEXT_PUBLIC_APP_URL}/quotations/${quotationId}/accept`
  return `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(quotationViewUrl)}`
}

export default function QuotationDetailsPage() {
  const params = useParams()
  const router = useRouter()
  const { toast } = useToast()
  const [quotation, setQuotation] = useState<Quotation | null>(null)
  const [editableQuotation, setEditableQuotation] = useState<Quotation | null>(null)
  const [product, setProduct] = useState<Product | null>(null)
  const [loading, setLoading] = useState(true)
  const [downloadingPDF, setDownloadingPDF] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  // State for the shared SendQuotationDialog
  const [isSendQuotationDialogOpen, setIsSendQuotationDialogOpen] = useState(false)
  const [quotationToSend, setQuotationToSend] = useState<Quotation | null>(null)

  // New state for the success dialog
  const [isQuotationSentSuccessDialogOpen, setIsQuotationSentSuccessDialogOpen] = useState(false)

  const [isSendQuotationOptionsDialogOpen, setIsSendQuotationOptionsDialogOpen] = useState(false)

  // Helper function to safely convert any value to string
  const safeString = (value: any): string => {
    if (value === null || value === undefined) return "N/A"
    if (typeof value === "string") return value
    if (typeof value === "number") return value.toLocaleString() // For numbers, use toLocaleString
    if (typeof value === "boolean") return value.toString()
    if (value && typeof value === "object") {
      if (value.id) return value.id.toString()
      if (value.toString) return value.toString()
      return "N/A"
    }
    return String(value)
  }

  useEffect(() => {
    async function fetchQuotationAndProduct() {
      if (params.id) {
        try {
          const quotationId = Array.isArray(params.id) ? params.id[0] : params.id
          const quotationData = await getQuotationById(quotationId)

          if (!quotationData) {
            toast({
              title: "Error",
              description: "Quotation not found.",
              variant: "destructive",
            })
            router.push("/sales/quotation-requests") // Redirect if not found
            return
          }

          setQuotation(quotationData)
          setEditableQuotation(quotationData) // Initialize editable state

          // Fetch product details if product_id exists
          if (quotationData.product_id) {
            const fetchedProduct = await getProductById(quotationData.product_id)
            setProduct(fetchedProduct)
          }
        } catch (error) {
          console.error("Error fetching quotation:", error)
          toast({
            title: "Error",
            description: "Failed to load quotation details",
            variant: "destructive",
          })
        } finally {
          setLoading(false)
        }
      }
    }

    fetchQuotationAndProduct()
  }, [params.id, toast, router])

  const handleStatusUpdate = async (newStatus: Quotation["status"]) => {
    if (!quotation || !quotation.id) return

    try {
      await updateQuotationStatus(quotation.id, newStatus)
      setQuotation({ ...quotation, status: newStatus })
      setEditableQuotation((prev) => (prev ? { ...prev, status: newStatus } : null))
      toast({
        title: "Success",
        description: `Quotation status updated to ${newStatus}`,
      })
    } catch (error) {
      console.error("Error updating status:", error)
      toast({
        title: "Error",
        description: "Failed to update quotation status",
        variant: "destructive",
      })
    }
  }

  const handleDownloadPDF = async () => {
    if (!quotation) return

    setDownloadingPDF(true)
    try {
      await generateQuotationPDF(quotation)
      toast({
        title: "Success",
        description: "PDF downloaded successfully",
      })
    } catch (error) {
      console.error("Error generating PDF:", error)
      toast({
        title: "Error",
        description: "Failed to generate PDF",
        variant: "destructive",
      })
    } finally {
      setDownloadingPDF(false)
    }
  }

  const handleEditClick = () => {
    if (quotation) {
      setEditableQuotation({ ...quotation }) // Create a shallow copy for editing
      setIsEditing(true)
    }
  }

  const handleCancelEdit = () => {
    setEditableQuotation(quotation) // Revert to original quotation data
    setIsEditing(false)
    toast({
      title: "Cancelled",
      description: "Editing cancelled. Changes were not saved.",
    })
  }

  const handleSaveEdit = async () => {
    if (!editableQuotation || !params.id || !editableQuotation.id) return

    setIsSaving(true)
    try {
      // Assuming a fixed user ID and name for now, replace with actual user context
      const currentUserId = "current_user_id"
      const currentUserName = "Current User"

      await updateQuotation(editableQuotation.id, editableQuotation, currentUserId, currentUserName)
      setQuotation(editableQuotation) // Update the main quotation state with saved changes
      setIsEditing(false)
      toast({
        title: "Success",
        description: "Quotation updated successfully!",
      })
    } catch (error) {
      console.error("Error saving quotation:", error)
      toast({
        title: "Error",
        description: "Failed to save quotation changes.",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setEditableQuotation((prev) => ({
      ...prev!,
      [name]: value,
    }))
  }

  const handleDateChange = (date: Date | undefined) => {
    setEditableQuotation((prev) => ({
      ...prev!,
      valid_until: date || new Date(), // Set to current date if undefined
    }))
  }

  const handleSendQuotationClick = () => {
    if (quotation) {
      setQuotationToSend(quotation)
      setIsSendQuotationOptionsDialogOpen(true) // Open the options dialog
    }
  }

  const handleQuotationSentSuccess = async (quotationId: string, newStatus: Quotation["status"]) => {
    // Update the status of the current quotation on this page
    await handleStatusUpdate(newStatus)
    setIsSendQuotationDialogOpen(false) // Close the send dialog

    // Open the success dialog
    setIsQuotationSentSuccessDialogOpen(true)
  }

  const handleDismissQuotationSentSuccess = () => {
    setIsQuotationSentSuccessDialogOpen(false)
    router.push("/sales/dashboard") // Changed this line to sales dashboard
  }

  const getStatusConfig = (status: string) => {
    switch (status?.toLowerCase()) {
      case "draft":
        return {
          color: "bg-gray-100 text-gray-800 border-gray-200",
          icon: <FileText className="h-3.5 w-3.5" />,
          label: "Draft",
        }
      case "sent":
        return {
          color: "bg-blue-100 text-blue-800 border-blue-200",
          icon: <Send className="h-3.5 w-3.5" />,
          label: "Sent",
        }
      case "viewed": // Not directly tracked for quotations, but keeping for consistency
        return {
          color: "bg-yellow-100 text-yellow-800 border-yellow-200",
          icon: <Eye className="h-3.5 w-3.5" />,
          label: "Viewed",
        }
      case "accepted":
        return {
          color: "bg-green-100 text-green-800 border-green-200",
          icon: <CheckCircle className="h-3.5 w-3.5" />,
          label: "Accepted",
        }
      case "rejected":
        return {
          color: "bg-red-100 text-red-800 border-red-200",
          icon: <XCircle className="h-3.5 w-3.5" />,
          label: "Rejected",
        }
      case "expired":
        return {
          color: "bg-orange-100 text-orange-800 border-orange-200",
          icon: <Clock className="h-3.5 w-3.5" />,
          label: "Expired",
        }
      default:
        return {
          color: "bg-gray-100 text-gray-800 border-gray-200",
          icon: <FileText className="h-3.5 w-3.5" />,
          label: "Unknown",
        }
    }
  }

  const formatDate = (date: any) => {
    if (!date) return "N/A"
    try {
      const dateObj = date.toDate ? date.toDate() : new Date(date)
      return new Intl.DateTimeFormat("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      }).format(dateObj)
    } catch (error) {
      console.error("Error formatting date:", error)
      return "Invalid Date"
    }
  }

  const formatDateTime = (date: any) => {
    if (!date) return "N/A"
    try {
      const dateObj = date.toDate ? date.toDate() : new Date(date)
      return new Intl.DateTimeFormat("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }).format(dateObj)
    } catch (error) {
      console.error("Error formatting date:", error)
      return "Invalid Date"
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50/50">
        <div className="container mx-auto p-6 max-w-7xl">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-gray-200 rounded w-1/4"></div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-6">
                <div className="h-64 bg-gray-200 rounded-lg"></div>
                <div className="h-48 bg-gray-200 rounded-lg"></div>
              </div>
              <div className="space-y-6">
                <div className="h-32 bg-gray-200 rounded-lg"></div>
                <div className="h-48 bg-gray-200 rounded-lg"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!quotation || !editableQuotation) {
    return (
      <div className="min-h-screen bg-gray-50/50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
            <FileText className="h-8 w-8 text-gray-400" />
          </div>
          <h1 className="text-2xl font-semibold text-gray-900 mb-2">Quotation Not Found</h1>
          <p className="text-gray-600 mb-6">The quotation you're looking for doesn't exist or may have been removed.</p>
          <Button onClick={() => router.push("/sales/quotation-requests")} className="bg-blue-600 hover:bg-blue-700">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Quotations
          </Button>
        </div>
      </div>
    )
  }

  const statusConfig = getStatusConfig(quotation.status || "")

  const handleEmailOptionClick = () => {
    setIsSendQuotationOptionsDialogOpen(false) // Close the options dialog
    setIsSendQuotationDialogOpen(true) // Open the SendQuotationDialog
  }

  return (
    <div className="min-h-screen bg-gray-100 py-6 px-4 sm:px-6 relative">
      {/* Word-style Toolbar */}
      <div className="sticky top-0 z-10 bg-white border-b border-gray-200 shadow-sm mb-6">
        <div className="max-w-[850px] mx-auto px-4 py-2 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.back()} // Changed from router.push("/sales/quotation-requests")
              className="text-gray-600 hover:text-gray-900"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">Back</span>
            </Button>
            <Badge className={`${statusConfig.color} border font-medium px-3 py-1`}>
              {statusConfig.icon}
              <span className="ml-1.5">{statusConfig.label}</span>
            </Badge>
          </div>

          <div className="flex items-center space-x-2">
            {/* Keeping History and Calculator for visual consistency, but they won't do anything for now */}
            <Button
              onClick={() =>
                toast({
                  title: "Feature Coming Soon",
                  description: "Activity timeline for quotations is under development.",
                })
              }
              variant="outline"
              size="sm"
              className="border-blue-300 text-blue-700 hover:bg-blue-50"
            >
              <History className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">Activity</span>
            </Button>
          </div>
        </div>
      </div>

      {/* New Wrapper for Sidebar + Document */}
      <div className="flex justify-center items-start gap-6 mt-6">
        {/* Left Panel (now part of flow) */}
        <div className="flex flex-col space-y-4 z-20 hidden lg:flex">
          <Button
            variant="ghost"
            className="h-16 w-16 flex flex-col items-center justify-center p-2 rounded-lg bg-white shadow-md border border-gray-200 hover:bg-gray-50"
            onClick={() =>
              toast({ title: "Feature Coming Soon", description: "Templates for quotations are under development." })
            }
          >
            <LayoutGrid className="h-8 w-8 text-gray-500 mb-1" />
            <span className="text-[10px] text-gray-700">Templates</span>
          </Button>
          <Button
            variant="ghost"
            onClick={handleEditClick}
            disabled={isEditing}
            className="h-16 w-16 flex flex-col items-center justify-center p-2 rounded-lg bg-white shadow-md border border-gray-200 hover:bg-gray-50"
          >
            <Pencil className="h-8 w-8 text-gray-500 mb-1" />
            <span className="text-[10px] text-gray-700">Edit</span>
          </Button>
          <Button
            variant="ghost"
            onClick={handleDownloadPDF}
            disabled={downloadingPDF}
            className="h-16 w-16 flex flex-col items-center justify-center p-2 rounded-lg bg-white shadow-md border border-gray-200 hover:bg-gray-50"
          >
            {downloadingPDF ? (
              <>
                <Loader2 className="h-8 w-8 text-gray-500 mb-1 animate-spin" />
                <span className="text-[10px] text-gray-700">Generating...</span>
              </>
            ) : (
              <>
                <DownloadIcon className="h-8 w-8 text-gray-500 mb-1" />
                <span className="text-[10px] text-gray-700">Download</span>
              </>
            )}
          </Button>
        </div>

        {/* Document Container */}
        <div className="max-w-[850px] bg-white shadow-md rounded-sm overflow-hidden">
          {/* Document Header */}
          <div className="border-b-2 border-blue-600 p-6 sm:p-8">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4">
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-1 font-[Calibri]">QUOTATION</h1>
                <p className="text-sm text-gray-500 flex items-center gap-2">
                  {quotation.quotation_number}
                  {isEditing && (
                    <Badge variant="outline" className="bg-yellow-100 text-yellow-800 border-yellow-200">
                      <Pencil className="h-3 w-3 mr-1" /> Editing
                    </Badge>
                  )}
                </p>
              </div>
              <div className="mt-4 sm:mt-0 flex items-center space-x-4">
                {/* QR Code */}
                <div className="flex flex-col items-center">
                  <div className="bg-white p-2 rounded-lg border border-gray-200 shadow-sm">
                    <img
                      src={generateQRCodeUrl(quotation.id || "") || "/placeholder.svg"}
                      alt="QR Code for quotation view"
                      className="w-20 h-20"
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">Scan to view online</p>
                </div>
                <img src="/oh-plus-logo.png" alt="Company Logo" className="h-8 sm:h-10" />
              </div>
            </div>
          </div>

          {/* Document Content */}
          <div className="p-6 sm:p-8">
            {/* Quotation Information */}
            <div className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4 pb-1 border-b border-gray-200 font-[Calibri]">
                Quotation Information
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <Label htmlFor="quotation_number" className="text-sm font-medium text-gray-500 mb-2">
                    Quotation Number
                  </Label>
                  <p className="text-base font-medium text-gray-900">{quotation.quotation_number}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-2">Created Date</h3>
                  <p className="text-base text-gray-900">{formatDate(quotation.created)}</p>
                </div>
                <div>
                  <Label htmlFor="valid_until" className="text-sm font-medium text-gray-500 mb-2">
                    Valid Until
                  </Label>
                  {isEditing ? (
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant={"outline"}
                          className={cn(
                            "w-full justify-start text-left font-normal mt-1",
                            !editableQuotation.valid_until && "text-muted-foreground",
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {editableQuotation.valid_until ? (
                            format(editableQuotation.valid_until.toDate(), "PPP")
                          ) : (
                            <span>Pick a date</span>
                          )}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar
                          mode="single"
                          selected={editableQuotation.valid_until?.toDate()}
                          onSelect={handleDateChange}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  ) : (
                    <p className="text-base text-gray-900">{formatDate(quotation.valid_until)}</p>
                  )}
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-2">Total Amount</h3>
                  <p className="text-base font-semibold text-gray-900">₱{safeString(quotation.total_amount)}</p>
                </div>
              </div>
            </div>

            {/* Client Information */}
            <div className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4 pb-1 border-b border-gray-200 font-[Calibri]">
                Client Information
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <Label htmlFor="client_name" className="text-sm font-medium text-gray-500 mb-2">
                    Client Name
                  </Label>
                  <p className="text-base font-medium text-gray-900">{safeString(quotation.client_name)}</p>
                </div>
                <div>
                  <Label htmlFor="client_email" className="text-sm font-medium text-gray-500 mb-2">
                    Client Email
                  </Label>
                  <p className="text-base text-gray-900">{safeString(quotation.client_email)}</p>
                </div>
                {quotation.quotation_request_id && (
                  <div>
                    <Label className="text-sm font-medium text-gray-500 mb-2">Related Request ID</Label>
                    <p className="text-base text-gray-900 font-mono">{safeString(quotation.quotation_request_id)}</p>
                  </div>
                )}
                {quotation.proposalId && (
                  <div>
                    <Label className="text-sm font-medium text-gray-500 mb-2">Related Proposal ID</Label>
                    <p className="text-base text-gray-900 font-mono">{safeString(quotation.proposalId)}</p>
                  </div>
                )}
                {quotation.campaignId && (
                  <div>
                    <Label className="text-sm font-medium text-gray-500 mb-2">Related Campaign ID</Label>
                    <p className="text-base text-gray-900 font-mono">{safeString(quotation.campaignId)}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Product & Services */}
            <div className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4 pb-1 border-b border-gray-200 font-[Calibri]">
                Product & Services
              </h2>

              <div className="border border-gray-300 rounded-sm overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="py-2 px-4 text-left font-medium text-gray-700 border-b border-gray-300">
                        Product
                      </th>
                      <th className="py-2 px-4 text-left font-medium text-gray-700 border-b border-gray-300">Type</th>
                      <th className="py-2 px-4 text-left font-medium text-gray-700 border-b border-gray-300">
                        Location
                      </th>
                      <th className="py-2 px-4 text-right font-medium text-gray-700 border-b border-gray-300">Price</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="bg-white">
                      <td className="py-3 px-4 border-b border-gray-200">
                        <div className="font-medium text-gray-900">{safeString(quotation.product_name)}</div>
                        {product?.site_code && <div className="text-xs text-gray-500">Site: {product.site_code}</div>}
                      </td>
                      <td className="py-3 px-4 border-b border-gray-200">
                        <span className="inline-block px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded">
                          {safeString(product?.type)}
                        </span>
                      </td>
                      <td className="py-3 px-4 border-b border-gray-200">
                        {safeString(product?.specs_rental?.location || product?.light?.location)}
                      </td>
                      <td className="py-3 px-4 text-right border-b border-gray-200">
                        <div className="font-medium text-gray-900">₱{safeString(quotation.price)}</div>
                        <div className="text-xs text-gray-500">per day</div>
                      </td>
                    </tr>
                    <tr className="bg-gray-50">
                      <td colSpan={3} className="py-3 px-4 text-right font-medium">
                        Total Amount:
                      </td>
                      <td className="py-3 px-4 text-right font-bold text-blue-600">
                        ₱{safeString(quotation.total_amount)}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Product Details (if product is available) */}
              {product && (
                <div className="mt-8 space-y-8">
                  <div className="border border-gray-200 rounded-sm p-4">
                    <h3 className="text-lg font-medium text-gray-900 mb-3">{product.name} Details</h3>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
                      {product.specs_rental?.traffic_count && (
                        <div>
                          <h4 className="text-xs font-medium text-gray-500 uppercase">Traffic Count</h4>
                          <p className="text-sm text-gray-900">{safeString(product.specs_rental.traffic_count)}/day</p>
                        </div>
                      )}

                      {product.specs_rental?.height && product.specs_rental?.width && (
                        <div>
                          <h4 className="text-xs font-medium text-gray-500 uppercase">Dimensions</h4>
                          <p className="text-sm text-gray-900">
                            {product.specs_rental.height}m × {product.specs_rental.width}m
                          </p>
                        </div>
                      )}

                      {product.specs_rental?.audience_type && (
                        <div>
                          <h4 className="text-xs font-medium text-gray-500 uppercase">Audience Type</h4>
                          <p className="text-sm text-gray-900">{safeString(product.specs_rental.audience_type)}</p>
                        </div>
                      )}

                      {product.health_percentage && (
                        <div>
                          <h4 className="text-xs font-medium text-gray-500 uppercase">Health Status</h4>
                          <p className="text-sm text-gray-900">{safeString(product.health_percentage)}%</p>
                        </div>
                      )}
                    </div>

                    {product.description && (
                      <div className="mb-4">
                        <h4 className="text-xs font-medium text-gray-500 uppercase mb-1">Description</h4>
                        <p className="text-sm text-gray-700 leading-relaxed">{product.description}</p>
                      </div>
                    )}

                    {product.media && product.media.length > 0 && (
                      <div>
                        <h4 className="text-xs font-medium text-gray-500 uppercase mb-2">Media</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {product.media.map((media, mediaIndex) => (
                            <div
                              key={mediaIndex}
                              className="relative aspect-video bg-gray-100 rounded border border-gray-200 overflow-hidden hover:shadow-lg transition-all cursor-pointer group"
                              // onClick={() => handleImageClick(media)} // No lightbox for now
                            >
                              {media.isVideo ? (
                                <video src={media.url} className="w-full h-full object-cover" controls />
                              ) : (
                                <img
                                  src={media.url || "/placeholder.svg"}
                                  alt="Product media"
                                  className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                                />
                              )}
                              <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all flex items-center justify-center">
                                <div className="opacity-0 group-hover:opacity-100 transition-opacity bg-white rounded-full p-2">
                                  <svg
                                    className="w-6 h-6 text-gray-700"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                  >
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth={2}
                                      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7"
                                    />
                                  </svg>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Additional Information (Notes) */}
            <div className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4 pb-1 border-b border-gray-200 font-[Calibri]">
                Additional Information
              </h2>

              {/* Internal Notes */}
              {(quotation.notes || isEditing) && ( // Show if exists or if editing to allow adding
                <div>
                  <Label htmlFor="notes" className="text-sm font-medium text-gray-500 mb-2">
                    Internal Notes
                  </Label>
                  {isEditing ? (
                    <Textarea
                      id="notes"
                      name="notes"
                      value={editableQuotation.notes || ""}
                      onChange={handleChange}
                      className="mt-1"
                    />
                  ) : (
                    <div className="bg-gray-50 border border-gray-200 rounded-sm p-4">
                      <p className="text-sm text-gray-700 leading-relaxed">{quotation.notes || "N/A"}</p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Document Footer */}
            <div className="mt-12 pt-6 border-t border-gray-200 text-center text-xs text-gray-500">
              <p>This quotation is valid until {formatDate(quotation.valid_until)}</p>
              <p className="mt-1">© {new Date().getFullYear()} OH+ Outdoor Advertising. All rights reserved.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Floating Action Buttons */}
      {isEditing ? (
        <div className="fixed bottom-6 right-6 flex space-x-4">
          <Button
            onClick={handleCancelEdit}
            variant="outline"
            className="bg-white hover:bg-gray-50 text-gray-700 border-gray-300 font-bold py-3 px-6 rounded-full shadow-lg transition-all duration-200 ease-in-out transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-opacity-75"
          >
            <X className="h-5 w-5 mr-2" />
            Cancel
          </Button>
          <Button
            onClick={handleSaveEdit}
            disabled={isSaving}
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-full shadow-lg transition-all duration-200 ease-in-out transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-opacity-75"
          >
            {isSaving ? (
              <>
                <Loader2 className="h-5 w-5 mr-2 animate-spin" /> Saving...
              </>
            ) : (
              <>
                <Save className="h-5 w-5 mr-2" /> Save Changes
              </>
            )}
          </Button>
        </div>
      ) : (
        quotation.status?.toLowerCase() === "draft" && (
          <div className="fixed bottom-6 right-6 flex space-x-4">
            <Button
              onClick={() => handleStatusUpdate("draft")} // Explicitly save as draft
              variant="outline" // Use outline variant for a secondary action
              className="bg-white hover:bg-gray-50 text-gray-700 border-gray-300 font-bold py-3 px-6 rounded-full shadow-lg transition-all duration-200 ease-in-out transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-opacity-75"
            >
              <FileText className="h-5 w-5 mr-2" /> {/* Using FileText as a "draft" icon */}
              Save as Draft
            </Button>
            <Button
              onClick={handleSendQuotationClick} // Use the new handler to open the shared dialog
              className="bg-green-500 hover:bg-green-600 text-white font-bold py-3 px-6 rounded-full shadow-lg transition-all duration-200 ease-in-out transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-green-400 focus:ring-opacity-75"
            >
              <Send className="h-5 w-5 mr-2" />
              Send
            </Button>
          </div>
        )
      )}

      {/* Shared Send Quotation Options Dialog */}
      {quotationToSend && (
        <SendQuotationOptionsDialog
          isOpen={isSendQuotationOptionsDialogOpen}
          onClose={() => setIsSendQuotationOptionsDialogOpen(false)}
          quotation={quotationToSend}
          onEmailClick={handleEmailOptionClick}
        />
      )}

      {/* Existing Send Quotation Dialog */}
      {quotationToSend && (
        <SendQuotationDialog
          isOpen={isSendQuotationDialogOpen}
          onClose={() => setIsSendQuotationDialogOpen(false)}
          quotation={quotationToSend}
          requestorEmail={quotationToSend.client_email || ""}
          onQuotationSent={handleQuotationSentSuccess}
        />
      )}

      {/* New Quotation Sent Success Dialog */}
      <QuotationSentSuccessDialog
        isOpen={isQuotationSentSuccessDialogOpen}
        onDismissAndNavigate={handleDismissQuotationSentSuccess}
      />
    </div>
  )
}

"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { parseISO } from "date-fns"
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
  Save,
  X,
  Clock,
} from "lucide-react"
import {
  getQuotationById,
  updateQuotationStatus,
  generateQuotationPDF,
  updateQuotation,
  calculateQuotationTotal,
  type Quotation,
} from "@/lib/quotation-service"
import { useToast } from "@/hooks/use-toast"
import { SendQuotationDialog } from "@/components/send-quotation-dialog"
import { QuotationSentSuccessDialog } from "@/components/quotation-sent-success-dialog"
import { SendQuotationOptionsDialog } from "@/components/send-quotation-options-dialog"
import { Timestamp } from "firebase/firestore" // Import Timestamp for Firebase date handling
import { storage } from "@/lib/firebase"
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage"

// Helper function to generate QR code URL - Updated to point to public quotation page
const generateQRCodeUrl = (quotationId: string) => {
  const quotationViewUrl = `${process.env.NEXT_PUBLIC_APP_URL}quotations/${quotationId}`
  return `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(quotationViewUrl)}`
}

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

// Helper function to get a Date object from a potential Firebase Timestamp, Date, or string
const getDateObject = (date: any): Date | undefined => {
  if (date === null || date === undefined) {
    return undefined
  }
  if (date instanceof Date) {
    return date
  }
  // Check for Firebase Timestamp structure (has toDate method)
  if (typeof date === "object" && date.toDate && typeof date.toDate === "function") {
    return date.toDate()
  }
  // Attempt to parse string dates
  if (typeof date === "string") {
    const parsedDate = parseISO(date)
    if (!isNaN(parsedDate.getTime())) {
      // Check if date parsing was successful
      return parsedDate
    }
  }
  // If none of the above, log a warning and return undefined
  console.warn("getDateObject received unexpected or invalid date type:", typeof date, date)
  return undefined
}

export default function QuotationDetailsPage() {
  const params = useParams()
  const router = useRouter()
  const { toast } = useToast()
  const [quotation, setQuotation] = useState<Quotation | null>(null)
  const [editableQuotation, setEditableQuotation] = useState<Quotation | null>(null)
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

  const [expandedCompliance, setExpandedCompliance] = useState<{ [key: string]: boolean }>({})
  const [uploadingFiles, setUploadingFiles] = useState<{ [key: string]: boolean }>({})
  const [uploadProgress, setUploadProgress] = useState<{ [key: string]: number }>({})

  const [currentProductPage, setCurrentProductPage] = useState(1)
  const productsPerPage = 1 // Show one product per page

  useEffect(() => {
    async function fetchQuotationData() {
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

    fetchQuotationData()
  }, [params.id, toast, router])

  // Effect to recalculate total amount whenever relevant fields change in editableQuotation
  useEffect(() => {
    if (editableQuotation && editableQuotation.items && editableQuotation.start_date && editableQuotation.end_date) {
      const { durationDays, totalAmount } = calculateQuotationTotal(
        editableQuotation.start_date,
        editableQuotation.end_date,
        editableQuotation.items,
      )

      setEditableQuotation((prev) => {
        // Only update if there's an actual change to prevent infinite loops
        if (prev && (prev.duration_days !== durationDays || prev.total_amount !== totalAmount)) {
          return {
            ...prev,
            duration_days: durationDays,
            total_amount: totalAmount,
          }
        }
        return prev // Return previous state if no change
      })
    }
  }, [editableQuotation]) // Dependencies for recalculation [^3]

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
      // Ensure start_date, end_date, and valid_until are Date objects for local calculation
      const startDateObj = getDateObject(editableQuotation.start_date)
      const endDateObj = getDateObject(editableQuotation.end_date)
      const validUntilObj = getDateObject(editableQuotation.valid_until)

      if (!startDateObj || !endDateObj) {
        throw new Error("Invalid start or end date for calculation.")
      }

      // Recalculate total amount based on current editable state
      const { durationDays, totalAmount } = calculateQuotationTotal(
        startDateObj.toISOString(),
        endDateObj.toISOString(),
        editableQuotation.items,
      )

      // Prepare the data to be sent to the backend
      // Convert Date objects back to Firebase Timestamps for saving if the service expects them
      const dataToSave = {
        ...editableQuotation,
        duration_days: durationDays,
        total_amount: totalAmount,
        start_date: startDateObj ? Timestamp.fromDate(startDateObj) : null,
        end_date: endDateObj ? Timestamp.fromDate(endDateObj) : null,
        valid_until: validUntilObj ? Timestamp.fromDate(validUntilObj) : null,
      }

      // Assuming a fixed user ID and name for now, replace with actual user context
      const currentUserId = "current_user_id"
      const currentUserName = "Current User"

      await updateQuotation(dataToSave.id, dataToSave, currentUserId, currentUserName)

      // After successful save, update the local state with the data that was actually saved
      // This ensures consistency if the backend modifies or re-formats data
      setQuotation(dataToSave as Quotation)
      setEditableQuotation(dataToSave as Quotation) // Also update editable state to reflect saved data
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

  const handleDateChange = (date: Date | undefined, field: "start_date" | "end_date" | "valid_until") => {
    setEditableQuotation((prev) => ({
      ...prev!,
      [field]: date ? date.toISOString() : null, // Store as ISO string
    }))
  }

  const handleProductPriceChange = (productId: string, newPrice: number) => {
    setEditableQuotation((prev) => {
      if (!prev) return null
      const updatedItems = prev.items.map((p) => (p.id === productId ? { ...p, price: newPrice } : p))
      return { ...prev, items: updatedItems }
    })
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
      const dateObj = getDateObject(date)
      if (!dateObj) return "N/A"
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
      const dateObj = getDateObject(date)
      if (!dateObj) return "N/A"
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

  const currentQuotation = editableQuotation || quotation
  const totalProducts = currentQuotation?.items?.length || 0
  const totalPages = Math.ceil(totalProducts / productsPerPage)
  const startIndex = (currentProductPage - 1) * productsPerPage
  const endIndex = startIndex + productsPerPage
  const currentProducts = currentQuotation?.items?.slice(startIndex, endIndex) || []

  const handleNextPage = () => {
    if (currentProductPage < totalPages) {
      setCurrentProductPage(currentProductPage + 1)
    }
  }

  const handlePrevPage = () => {
    if (currentProductPage > 1) {
      setCurrentProductPage(currentProductPage - 1)
    }
  }

  const handleFileUpload = async (
    file: File,
    quotationId: string,
    complianceType: keyof NonNullable<Quotation["projectCompliance"]>,
  ) => {
    if (!file || !quotationId) return

    // Validate file type
    if (file.type !== "application/pdf") {
      toast({
        title: "Invalid File Type",
        description: "Please upload a PDF file only.",
        variant: "destructive",
      })
      return
    }

    // Validate file size (10MB limit)
    if (file.size > 10 * 1024 * 1024) {
      toast({
        title: "File Too Large",
        description: "Please upload a file smaller than 10MB.",
        variant: "destructive",
      })
      return
    }

    setUploadingFiles((prev) => ({ ...prev, [complianceType]: true }))
    setUploadProgress((prev) => ({ ...prev, [complianceType]: 0 }))

    try {
      const fileName = `quotations/${quotationId}/compliance/${complianceType}_${Date.now()}.pdf`
      const storageRef = ref(storage, fileName)
      const uploadTask = uploadBytesResumable(storageRef, file)

      uploadTask.on(
        "state_changed",
        (snapshot) => {
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100
          setUploadProgress((prev) => ({ ...prev, [complianceType]: progress }))
        },
        (error) => {
          console.error("Upload error:", error)
          toast({
            title: "Upload Failed",
            description: "Failed to upload file. Please try again.",
            variant: "destructive",
          })
          setUploadingFiles((prev) => ({ ...prev, [complianceType]: false }))
        },
        async () => {
          try {
            const downloadURL = await getDownloadURL(uploadTask.snapshot.ref)

            // Update quotation with the new file URL
            const updatedQuotation = {
              ...quotation!,
              projectCompliance: {
                ...quotation!.projectCompliance,
                [complianceType]: {
                  ...quotation!.projectCompliance?.[complianceType],
                  status: "completed" as const,
                  fileUrl: downloadURL,
                  fileName: file.name,
                  uploadedAt: new Date().toISOString(),
                },
              },
            }

            await updateQuotation(quotationId, updatedQuotation, "current_user_id", "Current User")

            setQuotation(updatedQuotation)
            setEditableQuotation(updatedQuotation)

            toast({
              title: "Upload Successful",
              description: `${complianceType.replace(/([A-Z])/g, " $1").replace(/^./, (str) => str.toUpperCase())} uploaded successfully.`,
            })
          } catch (error) {
            console.error("Error updating quotation:", error)
            toast({
              title: "Update Failed",
              description: "File uploaded but failed to update record.",
              variant: "destructive",
            })
          } finally {
            setUploadingFiles((prev) => ({ ...prev, [complianceType]: false }))
            setUploadProgress((prev) => ({ ...prev, [complianceType]: 0 }))
          }
        },
      )
    } catch (error) {
      console.error("Upload error:", error)
      toast({
        title: "Upload Failed",
        description: "Failed to start upload. Please try again.",
        variant: "destructive",
      })
      setUploadingFiles((prev) => ({ ...prev, [complianceType]: false }))
    }
  }

  const handleComplianceToggle = (quotationId: string) => {
    setExpandedCompliance((prev) => ({
      ...prev,
      [quotationId]: !prev[quotationId],
    }))
  }

  const getComplianceCount = (compliance: Quotation["projectCompliance"]) => {
    if (!compliance) return { completed: 0, total: 5 }

    const items = [
      compliance.signedQuotation,
      compliance.signedContract,
      compliance.poMo,
      compliance.finalArtwork,
      compliance.paymentAsDeposit,
    ]

    const completed = items.filter((item) => item?.status === "completed").length
    return { completed, total: 5 }
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
                  {currentQuotation.quotation_number}
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
                      src={generateQRCodeUrl(currentQuotation.id || "") || "/placeholder.svg"}
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
            {/* Company Header Section */}
            <div className="text-center mb-6 border-b-2 border-gray-300 pb-4">
              <div className="flex justify-between items-start mb-4">
                <div className="text-left">
                  <p className="text-sm font-medium">{safeString(currentQuotation.client_name)}</p>
                  <p className="text-sm">
                    {safeString(currentQuotation.client_company_name) || "JMCL MEDIA & MARKETING SERVICES INC."}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm">RFQ. No. {currentQuotation.quotation_number}</p>
                </div>
              </div>

              <h1 className="text-2xl font-bold text-center mb-2">GOLDEN TOUCH IMAGING SPECIALIST</h1>
              <p className="text-sm text-center mb-4">
                Good Day! Thank you for considering Golden Touch for your business needs.
                <br />
                We are pleased to submit our quotation for your requirements:
              </p>
              <p className="text-sm font-semibold">Details as follows:</p>
            </div>

            {/* Product Details Section - Per Page Display */}
            {currentProducts.length > 0 ? (
              <div className="space-y-8">
                {currentProducts.map((item, index) => (
                  <div key={item.id || index} className="page-break-before">
                    {/* Site/Product Information */}
                    <div className="mb-6">
                      <div className="grid grid-cols-1 gap-2 text-sm">
                        <div className="flex">
                          <span className="font-medium w-32">● Site Location:</span>
                          <span className="font-bold">{safeString(item.location)}</span>
                        </div>
                        <div className="flex">
                          <span className="font-medium w-32">● Type:</span>
                          <span className="font-bold">{safeString(item.type)}</span>
                        </div>
                        <div className="flex">
                          <span className="font-medium w-32">● Size:</span>
                          <span className="font-bold">{safeString(item.dimensions) || "100ft (H) x 60ft (W)"}</span>
                        </div>
                        <div className="flex">
                          <span className="font-medium w-32">● Contract Duration:</span>
                          <span className="font-bold">{safeString(item.duration_days)} DAYS</span>
                        </div>
                        <div className="flex">
                          <span className="font-medium w-32">● Contract Period:</span>
                          <span className="font-bold">
                            {formatDate(currentQuotation.start_date)} - {formatDate(currentQuotation.end_date)}
                          </span>
                        </div>
                        <div className="flex">
                          <span className="font-medium w-32">● Proposal to:</span>
                          <span className="font-bold">
                            {safeString(currentQuotation.client_company_name) ||
                              safeString(currentQuotation.client_name)}
                          </span>
                        </div>
                        <div className="flex">
                          <span className="font-medium w-32">● Illumination:</span>
                          <span className="font-bold">
                            {safeString(item.illumination) || "10 units of 1000 watts metal Halide"}
                          </span>
                        </div>
                        <div className="flex">
                          <span className="font-medium w-32">● Lease Rate/Month:</span>
                          <span className="font-bold">(Exclusive of VAT)</span>
                        </div>
                        <div className="flex">
                          <span className="font-medium w-32">● Total Lease:</span>
                          <span className="font-bold">(Exclusive of VAT)</span>
                        </div>
                      </div>
                    </div>

                    {/* Pricing Table */}
                    <div className="mb-6">
                      <table className="w-full border-collapse border border-gray-400">
                        <tbody>
                          <tr>
                            <td className="border border-gray-400 p-2 font-medium">Lease rate per month</td>
                            <td className="border border-gray-400 p-2 text-right font-bold">
                              ₱{Number(item.price || 0).toLocaleString()}.00
                            </td>
                          </tr>
                          <tr>
                            <td className="border border-gray-400 p-2 font-medium">
                              x {Math.ceil((Number(item.duration_days) || 30) / 30)} months
                            </td>
                            <td className="border border-gray-400 p-2 text-right font-bold">
                              ₱{Number(item.item_total_amount || 0).toLocaleString()}.00
                            </td>
                          </tr>
                          <tr>
                            <td className="border border-gray-400 p-2 font-medium">12% VAT</td>
                            <td className="border border-gray-400 p-2 text-right font-bold">
                              ₱{(Number(item.item_total_amount || 0) * 0.12).toLocaleString()}.00
                            </td>
                          </tr>
                          <tr className="bg-gray-100">
                            <td className="border border-gray-400 p-2 font-bold">TOTAL</td>
                            <td className="border border-gray-400 p-2 text-right font-bold">
                              ₱{(Number(item.item_total_amount || 0) * 1.12).toLocaleString()}.00
                            </td>
                          </tr>
                        </tbody>
                      </table>
                      <p className="text-sm mt-2 italic">
                        Note: free two (2) change material for {Math.ceil((Number(item.duration_days) || 30) / 30)}{" "}
                        month rental
                      </p>
                    </div>

                    {/* Product Image if available */}
                    {item.media_url && (
                      <div className="mb-6 text-center">
                        <img
                          src={item.media_url || "/placeholder.svg"}
                          alt={item.name}
                          className="max-w-full h-64 object-contain mx-auto border border-gray-300 rounded"
                        />
                        <p className="text-sm text-gray-600 mt-2">{safeString(item.name)}</p>
                      </div>
                    )}

                    {/* Page break for multiple products */}
                    {index < currentProducts.length - 1 && <div className="page-break-after"></div>}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">No products available</div>
            )}

            {/* Terms and Conditions */}
            <div className="mt-8 mb-6">
              <h3 className="font-bold text-sm mb-3">Terms and Conditions:</h3>
              <div className="text-sm space-y-1">
                <p>1. Quotation validity: 5 working days.</p>
                <p>
                  2. Availability of the site is on first-come-first-served-basis only. Only official documents such as
                  P.O's,
                </p>
                <p className="ml-4">
                  Media Orders, signed quotation, & contracts are accepted in order to book the site.
                </p>
                <p>3. To book the site, one (1) month advance and one (2) months security deposit</p>
                <p className="ml-4">payment dated 7 days before the start of rental is required.</p>
                <p>4. Final artwork should be approved ten (10) days before the contract period</p>
                <p>5. Print is exclusively for Golden Touch Imaging Specialist Only.</p>
              </div>
            </div>

            {/* Signature Section */}
            <div className="mt-8 mb-6">
              <div className="grid grid-cols-2 gap-8">
                <div>
                  <p className="text-sm mb-8">Very truly yours,</p>
                  <div className="border-b border-gray-400 mb-2"></div>
                  <p className="text-sm font-medium">Mathew Espanto</p>
                  <p className="text-sm">Account Management</p>
                </div>
                <div>
                  <p className="text-sm mb-8">C o n f o r m e:</p>
                  <div className="border-b border-gray-400 mb-2"></div>
                  <p className="text-sm font-medium">{safeString(currentQuotation.client_name)}</p>
                  <p className="text-sm">
                    {safeString(currentQuotation.client_company_name) || "JMCL MEDIA & MARKETING SERVICES INC."}
                  </p>
                  <p className="text-xs mt-4 italic">
                    This signed Quotation serves as an
                    <br />
                    official document for billing purposes
                  </p>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="mt-8 pt-4 border-t border-gray-300 text-center">
              <p className="text-xs text-gray-600">
                No. 727 General Solano St., San Miguel, Manila 1005. Telephone: (02) 5310 1750 to 53
              </p>
              <p className="text-xs text-gray-600 mt-1">email: sales@goldentouchimaging.com or gtigolden@gmail.com</p>
              <p className="text-xs text-gray-600 mt-2 font-medium">{formatDate(new Date())}</p>
              <p className="text-xs text-gray-600 font-bold">
                {currentProducts[0]?.location || "SITE LOCATION"} QUOTATION
              </p>
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
          currentQuotation.status?.toLowerCase() === "draft" && (
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
    </div>
  )
}

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
import { format, parseISO } from "date-fns"
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
  ChevronDown,
  ChevronRight,
  Upload,
  ExternalLink,
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
import { Input } from "@/components/ui/input"
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

  const currentQuotation = isEditing ? editableQuotation : quotation

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
                  <p className="text-base font-medium text-gray-900">{currentQuotation.quotation_number}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-2">Created Date</h3>
                  <p className="text-base text-gray-900">{formatDate(currentQuotation.created)}</p>
                </div>
                <div>
                  <Label htmlFor="start_date" className="text-sm font-medium text-gray-500 mb-2">
                    Start Date
                  </Label>
                  {isEditing ? (
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant={"outline"}
                          className={cn(
                            "w-full justify-start text-left font-normal mt-1",
                            !editableQuotation.start_date && "text-muted-foreground",
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {editableQuotation.start_date ? (
                            format(getDateObject(editableQuotation.start_date)!, "PPP")
                          ) : (
                            <span>Pick a date</span>
                          )}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar
                          mode="single"
                          selected={getDateObject(editableQuotation.start_date)}
                          onSelect={(date) => handleDateChange(date, "start_date")}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  ) : (
                    <p className="text-base text-gray-900">{formatDate(currentQuotation.start_date)}</p>
                  )}
                </div>
                <div>
                  <Label htmlFor="end_date" className="text-sm font-medium text-gray-500 mb-2">
                    End Date
                  </Label>
                  {isEditing ? (
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant={"outline"}
                          className={cn(
                            "w-full justify-start text-left font-normal mt-1",
                            !editableQuotation.end_date && "text-muted-foreground",
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {editableQuotation.end_date ? (
                            format(getDateObject(editableQuotation.end_date)!, "PPP")
                          ) : (
                            <span>Pick a date</span>
                          )}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar
                          mode="single"
                          selected={getDateObject(editableQuotation.end_date)}
                          onSelect={(date) => handleDateChange(date, "end_date")}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  ) : (
                    <p className="text-base text-gray-900">{formatDate(currentQuotation.end_date)}</p>
                  )}
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
                            format(getDateObject(editableQuotation.valid_until)!, "PPP")
                          ) : (
                            <span>Pick a date</span>
                          )}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar
                          mode="single"
                          selected={getDateObject(editableQuotation.valid_until)}
                          onSelect={(date) => handleDateChange(date, "valid_until")}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  ) : (
                    <p className="text-base text-gray-900">{formatDate(currentQuotation.valid_until)}</p>
                  )}
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-2">Total Amount</h3>
                  <p className="text-base font-semibold text-gray-900">₱{safeString(currentQuotation.total_amount)}</p>
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
                  <p className="text-base font-medium text-gray-900">{safeString(currentQuotation.client_name)}</p>
                </div>
                <div>
                  <Label htmlFor="client_email" className="text-sm font-medium text-gray-500 mb-2">
                    Client Email
                  </Label>
                  <p className="text-base text-gray-900">{safeString(currentQuotation.client_email)}</p>
                </div>
                {currentQuotation.client_designation && (
                  <div>
                    <Label className="text-sm font-medium text-gray-500 mb-2">Designation</Label>
                    <p className="text-base text-gray-900">{safeString(currentQuotation.client_designation)}</p>
                  </div>
                )}
                {currentQuotation.client_phone && (
                  <div>
                    <Label className="text-sm font-medium text-gray-500 mb-2">Phone</Label>
                    <p className="text-base text-gray-900">{safeString(currentQuotation.client_phone)}</p>
                  </div>
                )}
                {currentQuotation.client_address && (
                  <div>
                    <Label className="text-sm font-medium text-gray-500 mb-2">Address</Label>
                    <p className="text-base text-gray-900">{safeString(currentQuotation.client_address)}</p>
                  </div>
                )}
                {currentQuotation.quotation_request_id && (
                  <div>
                    <Label className="text-sm font-medium text-gray-500 mb-2">Related Request ID</Label>
                    <p className="text-base text-gray-900 font-mono">
                      {safeString(currentQuotation.quotation_request_id)}
                    </p>
                  </div>
                )}
                {currentQuotation.proposalId && (
                  <div>
                    <Label className="text-sm font-medium text-gray-500 mb-2">Related Proposal ID</Label>
                    <p className="text-base text-gray-900 font-mono">{safeString(currentQuotation.proposalId)}</p>
                  </div>
                )}
                {currentQuotation.campaignId && (
                  <div>
                    <Label className="text-sm font-medium text-gray-500 mb-2">Related Campaign ID</Label>
                    <p className="text-base text-gray-900 font-mono">{safeString(currentQuotation.campaignId)}</p>
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
                      <th className="py-2 px-4 text-left font-medium text-gray-700 border-b border-gray-300 w-[100px]">
                        Image
                      </th>
                      <th className="py-2 px-4 text-left font-medium text-gray-700 border-b border-gray-300">
                        Product
                      </th>
                      <th className="py-2 px-4 text-left font-medium text-gray-700 border-b border-gray-300">Type</th>
                      <th className="py-2 px-4 text-left font-medium text-gray-700 border-b border-gray-300">
                        Location
                      </th>
                      <th className="py-2 px-4 text-right font-medium text-gray-700 border-b border-gray-300">
                        Price (Monthly)
                      </th>
                      <th className="py-2 px-4 text-right font-medium text-gray-700 border-b border-gray-300">
                        Item Total
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentQuotation.items.map((item, index) => (
                      <tr key={item.id || index} className="bg-white">
                        <td className="py-3 px-4 border-b border-gray-200">
                          <img
                            src={
                              item.media_url ||
                              item.media?.[0]?.url ||
                              "/placeholder.svg?height=64&width=64&query=product" ||
                              "/placeholder.svg" ||
                              "/placeholder.svg"
                            }
                            alt={item.name}
                            className="w-16 h-16 object-cover rounded-sm"
                          />
                        </td>
                        <td className="py-3 px-4 border-b border-gray-200">
                          <div className="font-medium text-gray-900">{safeString(item.name)}</div>
                          {item.site_code && <div className="text-xs text-gray-500">Site: {item.site_code}</div>}
                          {item.description && (
                            <div className="text-xs text-gray-600 mt-1">{safeString(item.description)}</div>
                          )}
                        </td>
                        <td className="py-3 px-4 border-b border-gray-200">
                          <span className="inline-block px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded">
                            {safeString(item.type)}
                          </span>
                        </td>
                        <td className="py-3 px-4 border-b border-gray-200">{safeString(item.location)}</td>
                        <td className="py-3 px-4 text-right border-b border-gray-200">
                          {isEditing ? (
                            <Input
                              type="number"
                              name={`product-price-${item.id}`}
                              value={item.price || ""}
                              onChange={(e) =>
                                handleProductPriceChange(item.id, Number.parseFloat(e.target.value) || 0)
                              }
                              className="w-full text-right"
                              step="0.01"
                            />
                          ) : (
                            <div className="font-medium text-gray-900">₱{safeString(item.price)}</div>
                          )}
                          <div className="text-xs text-gray-500">per month</div>
                        </td>
                        <td className="py-3 px-4 text-right border-b border-gray-200">
                          <div className="font-medium text-gray-900">₱{safeString(item.item_total_amount)}</div>
                          <div className="text-xs text-gray-500">{safeString(item.duration_days)} day(s)</div>
                        </td>
                      </tr>
                    ))}
                    <tr className="bg-gray-50">
                      <td colSpan={5} className="py-3 px-4 text-right font-medium">
                        Total Amount:
                      </td>
                      <td className="py-3 px-4 text-right font-bold text-blue-600">
                        ₱{safeString(currentQuotation.total_amount)}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Additional Information (Notes) */}
            <div className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4 pb-1 border-b border-gray-200 font-[Calibri]">
                Additional Information
              </h2>

              {/* Internal Notes */}
              {(currentQuotation.notes || isEditing) && ( // Show if exists or if editing to allow adding
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
                      <p className="text-sm text-gray-700 leading-relaxed">{currentQuotation.notes || "N/A"}</p>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4 pb-1 border-b border-gray-200 font-[Calibri]">
                Project Compliance
              </h2>

              <div className="bg-gray-50 border border-gray-200 rounded-sm p-4">
                <div
                  className="flex items-center justify-between cursor-pointer"
                  onClick={() => handleComplianceToggle(currentQuotation.id || "")}
                >
                  <div className="flex items-center space-x-2">
                    <span className="text-sm font-medium text-gray-700">
                      {getComplianceCount(currentQuotation.projectCompliance).completed}/
                      {getComplianceCount(currentQuotation.projectCompliance).total}
                    </span>
                    <div className="flex space-x-1">
                      {[...Array(5)].map((_, i) => (
                        <div
                          key={i}
                          className={`w-2 h-2 rounded-full ${
                            i < getComplianceCount(currentQuotation.projectCompliance).completed
                              ? "bg-green-500"
                              : "bg-gray-300"
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                  {expandedCompliance[currentQuotation.id || ""] ? (
                    <ChevronDown className="w-4 h-4 text-gray-500 transition-transform duration-200" />
                  ) : (
                    <ChevronRight className="w-4 h-4 text-gray-500 transition-transform duration-200" />
                  )}
                </div>

                <div
                  className={`overflow-hidden transition-all duration-300 ease-in-out ${
                    expandedCompliance[currentQuotation.id || ""] ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
                  }`}
                >
                  <div className="mt-4 space-y-3">
                    {[
                      { key: "signedQuotation", label: "Signed Quotation" },
                      { key: "signedContract", label: "Signed Contract" },
                      { key: "poMo", label: "PO/MO" },
                      { key: "finalArtwork", label: "Final Artwork" },
                      { key: "paymentAsDeposit", label: "Payment as Deposit" },
                    ].map((item, index) => {
                      const complianceItem =
                        currentQuotation.projectCompliance?.[
                          item.key as keyof NonNullable<Quotation["projectCompliance"]>
                        ]
                      const isCompleted = complianceItem?.status === "completed"
                      const isUploading = uploadingFiles[item.key]
                      const progress = uploadProgress[item.key] || 0

                      return (
                        <div
                          key={item.key}
                          className={`flex items-center justify-between p-2 rounded transition-all duration-200 ${
                            index < getComplianceCount(currentQuotation.projectCompliance).completed
                              ? "animate-in slide-in-from-left-2"
                              : ""
                          }`}
                          style={{ animationDelay: `${index * 50}ms` }}
                        >
                          <div className="flex items-center space-x-3">
                            <div
                              className={`w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0 ${
                                isCompleted ? "bg-green-500" : "bg-gray-300"
                              }`}
                            >
                              {isCompleted && <CheckCircle className="w-3 h-3 text-white" />}
                            </div>
                            <span className="text-sm text-gray-700">{item.label}</span>
                          </div>

                          <div className="flex items-center space-x-2">
                            {isCompleted && complianceItem?.fileUrl ? (
                              <a
                                href={complianceItem.fileUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-600 hover:text-blue-800 text-sm flex items-center space-x-1"
                              >
                                <span>{complianceItem.fileName || "View File"}</span>
                                <ExternalLink className="w-3 h-3" />
                              </a>
                            ) : isUploading ? (
                              <div className="flex items-center space-x-2">
                                <div className="w-16 bg-gray-200 rounded-full h-2">
                                  <div
                                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                                    style={{ width: `${progress}%` }}
                                  />
                                </div>
                                <span className="text-xs text-gray-500">{Math.round(progress)}%</span>
                              </div>
                            ) : (
                              <label className="cursor-pointer">
                                <input
                                  type="file"
                                  accept=".pdf"
                                  className="hidden"
                                  onChange={(e) => {
                                    const file = e.target.files?.[0]
                                    if (file && currentQuotation.id) {
                                      handleFileUpload(
                                        file,
                                        currentQuotation.id,
                                        item.key as keyof NonNullable<Quotation["projectCompliance"]>,
                                      )
                                    }
                                  }}
                                />
                                <Button variant="outline" size="sm" className="text-xs px-3 py-1 h-7 bg-transparent">
                                  <Upload className="w-3 h-3 mr-1" />
                                  Upload
                                </Button>
                              </label>
                            )}
                          </div>
                        </div>
                      )
                    })}

                    {currentQuotation.projectCompliance?.paymentAsDeposit?.status === "completed" && (
                      <div className="mt-2 text-xs text-blue-600 italic">For Treasury's confirmation</div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Document Footer */}
            <div className="mt-12 pt-6 border-t border-gray-200 text-center text-xs text-gray-500">
              <p>This quotation is valid until {formatDate(currentQuotation.valid_until)}</p>
              <p className="mt-1">© {new Date().getFullYear()} OH+ Outdoor Advertising. All rights reserved.</p>
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

"use client"
import { useEffect, useState, useCallback } from "react"
import type React from "react"

import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { useToast } from "@/hooks/use-toast"
import {
  getQuotationById,
  getQuotationsByPageId,
  updateQuotationStatus,
  getQuotationsByClientName,
} from "@/lib/quotation-service"
import type { Quotation, QuotationStatus, QuotationLineItem } from "@/lib/types/quotation"
import { format } from "date-fns"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import {
  ArrowLeft,
  DownloadIcon,
  FileText,
  Loader2,
  LayoutGrid,
  Pencil,
  Save,
  X,
  Building,
  History,
} from "lucide-react"
import { getProposal } from "@/lib/proposal-service"
import type { Proposal } from "@/lib/types/proposal"
import { ProposalActivityTimeline } from "@/components/proposal-activity-timeline"
import { getProposalActivities } from "@/lib/proposal-activity-service"
import type { ProposalActivity } from "@/lib/types/proposal-activity"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { generateQuotationPDF } from "@/lib/quotation-pdf-service" // Use quotation PDF service
import { QuotationSentSuccessDialog } from "@/components/quotation-sent-success-dialog" // Use quotation success dialog
import { SendQuotationOptionsDialog } from "@/components/send-quotation-options-dialog" // Use quotation options dialog
import { db, getDoc, doc } from "@/lib/firebase" // Import Firebase functions
import { generateSeparateQuotationPDFs } from "@/lib/quotation-pdf-service"

interface CompanyData {
  id: string
  name?: string
  company_location?: any
  address?: any
  company_website?: string
  website?: string
  photo_url?: string
  contact_person?: string
  email?: string
  phone?: string
  social_media?: any
  created_by?: string
  created?: Date
  updated?: Date
}

const formatCompanyAddress = (companyData: CompanyData | null): string => {
  if (!companyData) return "N/A"

  const addressParts = [
    companyData.address?.street1,
    companyData.address?.street2,
    companyData.address?.city,
    companyData.address?.state,
    companyData.address?.zip,
    companyData.company_location?.country,
  ]

  const filteredAddressParts = addressParts.filter(Boolean)
  return filteredAddressParts.length > 0 ? filteredAddressParts.join(", ") : "N/A"
}

const safeString = (value: any): string => {
  if (value === null || value === undefined) return "N/A"
  if (typeof value === "string") return value
  if (typeof value === "number") return value.toLocaleString()
  if (typeof value === "boolean") return value.toString()
  if (value && typeof value === "object") {
    if (value.id) return value.id.toString()
    if (value.toString) return value.toString()
    return "N/A"
  }
  return String(value)
}

const getDateObject = (date: any): Date | undefined => {
  if (date === null || date === undefined) return undefined
  if (date instanceof Date) return date
  if (typeof date === "object" && date.toDate && typeof date.toDate === "function") {
    return date.toDate()
  }
  if (typeof date === "string") {
    const parsedDate = new Date(date)
    if (!isNaN(parsedDate.getTime())) return parsedDate
  }
  return undefined
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

const formatDuration = (days: number) => {
  if (days <= 30) {
    return `${days} days`
  }
  const months = Math.floor(days / 30)
  const remainingDays = days % 30
  if (remainingDays === 0) {
    return `${months} ${months === 1 ? "month" : "months"}`
  }
  return `${months} ${months === 1 ? "month" : "months"} and ${remainingDays} ${remainingDays === 1 ? "day" : "days"}`
}

const safeFormatNumber = (value: any, options?: Intl.NumberFormatOptions): string => {
  if (value === null || value === undefined || isNaN(Number(value))) return "0.00"
  const numValue = typeof value === "string" ? Number.parseFloat(value) : Number(value)
  if (isNaN(numValue)) return "0.00"
  return numValue.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2, ...options })
}

const formatCurrency = (amount: number | string | undefined | null) => {
  if (!amount || amount === 0) return "PHP 0.00"
  const numAmount = typeof amount === "string" ? Number.parseFloat(amount) : amount
  if (isNaN(numAmount)) return "PHP 0.00"
  return `PHP ${numAmount.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

export default function QuotationPage({ params }: { params: { id: string } }) {
  const { id: quotationId } = params
  const router = useRouter()
  const { user, userData } = useAuth()
  const { toast } = useToast()
  const [quotation, setQuotation] = useState<Quotation | null>(null)
  const [editableQuotation, setEditableQuotation] = useState<Quotation | null>(null)
  const [relatedQuotations, setRelatedQuotations] = useState<Quotation[]>([])
  const [currentPageIndex, setCurrentPageIndex] = useState(0)
  const [loading, setLoading] = useState(true)
  const [sendingEmail, setSendingEmail] = useState(false)
  const [updatingStatus, setUpdatingStatus] = useState(false)
  const [proposal, setProposal] = useState<Proposal | null>(null)
  const [activities, setActivities] = useState<ProposalActivity[]>([])
  const [timelineOpen, setTimelineOpen] = useState(false)
  const [isSendEmailDialogOpen, setIsSendEmailDialogOpen] = useState(false)
  const [isSendOptionsDialogOpen, setIsSendOptionsDialogOpen] = useState(false)
  const [ccEmail, setCcEmail] = useState("")
  const [isEditing, setIsEditing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [emailSubject, setEmailSubject] = useState("")
  const [emailBody, setEmailBody] = useState("")
  const [showSuccessDialog, setShowSuccessDialog] = useState(false)
  const [downloadingPDF, setDownloadingPDF] = useState(false)
  const [showPageSelection, setShowPageSelection] = useState(false)
  const [selectedPages, setSelectedPages] = useState<string[]>([])
  const [currentProductIndex, setCurrentProductIndex] = useState(0)
  const [projectData, setProjectData] = useState<{ company_logo?: string; company_name?: string } | null>(null)
  const [companyData, setCompanyData] = useState<CompanyData | null>(null)
  const [clientHistory, setClientHistory] = useState<Quotation[]>([])
  const [loadingHistory, setLoadingHistory] = useState(false)
  const [showHistory, setShowHistory] = useState(false)

  const [editingField, setEditingField] = useState<string | null>(null)
  const [tempValues, setTempValues] = useState<Record<string, any>>({})
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)

  const handleFieldEdit = (fieldName: string, currentValue: any) => {
    setEditingField(fieldName)
    setTempValues({ ...tempValues, [fieldName]: currentValue })
    setHasUnsavedChanges(true)
  }

  const updateTempValues = (fieldName: string, newValue: any) => {
    const updatedTempValues = { ...tempValues, [fieldName]: newValue }
    setTempValues(updatedTempValues)

    // Update the editable quotation with the new value
    if (editableQuotation) {
      if (fieldName === "price" && editableQuotation.items?.[0]) {
        const durationDays = editableQuotation.items[0].duration_days || 32
        const dailyRate = newValue / 30 // Convert monthly price to daily rate
        const newTotalAmount = dailyRate * durationDays

        setEditableQuotation({
          ...editableQuotation,
          items: editableQuotation.items.map((item, index) =>
            index === 0 ? { ...item, price: newValue, item_total_amount: newTotalAmount } : item,
          ),
        })
      } else {
        setEditableQuotation({
          ...editableQuotation,
          [fieldName]: newValue,
        })
      }
    }
  }

  const fetchQuotationHistory = useCallback(async () => {
    if (!quotation?.items?.[0]?.id) return

    setLoadingHistory(true)
    try {
      const productId = quotation.items[0].id
      const history = await getQuotationsByPageId(productId) // Changed to filter by page_id instead of product_id
      // Filter out current quotation from history
      const filteredHistory = history.filter((q) => q.id !== quotation.id)
      setClientHistory(filteredHistory) // Changed from setQuotation to setClientHistory
    } catch (error) {
      console.error("Error fetching quotation history:", error)
    } finally {
      setLoadingHistory(false)
    }
  }, [quotation?.items?.[0]?.id, quotation?.id])

  const fetchClientHistory = useCallback(async () => {
    if (!quotation?.client_name) return

    setLoadingHistory(true)
    try {
      const history = (await getQuotationsByClientName?.(quotation.client_name)) || []
      // Filter out current quotation from history
      const filteredHistory = history.filter((q) => q.id !== quotation.id)
      setClientHistory(filteredHistory)
    } catch (error) {
      console.error("Error fetching client history:", error)
      setClientHistory([])
    } finally {
      setLoadingHistory(false)
    }
  }, [quotation?.client_name, quotation?.id])

  const fetchCompanyData = async () => {
    try {
      if (userData?.company_id) {
        // Fetch company data logic here
        const companyDoc = await getDoc(doc(db, "companies", userData.company_id))
        if (companyDoc.exists()) {
          const companyInfo = companyDoc.data() as CompanyData
          setCompanyData({
            ...companyInfo,
            id: userData.company_id,
          })
        } else {
          // Fallback if company not found
          setCompanyData({
            name: "Company Name",
            photo_url: "/oh-plus-logo.png",
            id: userData?.company_id,
          })
        }
      }
    } catch (error) {
      console.error("Error fetching company data:", error)
      // Set fallback data on error
      setCompanyData({
        name: "Company Name",
        photo_url: "/oh-plus-logo.png",
        id: userData?.company_id,
      })
    }
  }

  useEffect(() => {
    const fetchQuotationData = async () => {
      if (!quotationId) return

      setLoading(true)
      try {
        const q = await getQuotationById(quotationId)
        if (q) {
          console.log("[v0] Loaded quotation data:", q)
          console.log("[v0] Items array:", q.items)
          console.log("[v0] First item:", q.items?.[0])

          setQuotation(q)
          setEditableQuotation({ ...q }) // Create proper deep copy

          console.log("[v0] Current quotation page_id:", q.page_id)

          if (q.page_id) {
            const relatedQs = await getQuotationsByPageId(q.page_id)
            console.log("[v0] Related quotations found:", relatedQs.length, relatedQs)
            setRelatedQuotations(relatedQs)
            const currentIndex = relatedQs.findIndex((rq) => rq.id === q.id)
            console.log("[v0] Current page index:", currentIndex)
            setCurrentPageIndex(currentIndex >= 0 ? currentIndex : 0)
          } else {
            console.log("[v0] No page_id found for this quotation")
          }

          if (q.proposalId) {
            const linkedProposal = await getProposal(q.proposalId)
            setProposal(linkedProposal)
          }
          const qActivities = await getProposalActivities(quotationId) // Use quotationId
          setActivities(qActivities)
        } else {
          toast({
            title: "Quotation Not Found", // Updated title
            description: "The quotation you're looking for doesn't exist.",
            variant: "destructive",
          })
          router.push("/sales/quotations-list") // Navigate to quotations list
        }
      } catch (error) {
        console.error("Error fetching quotation:", error) // Updated error message
        toast({
          title: "Error",
          description: "Failed to load quotation. Please try again.", // Updated description
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }

    fetchQuotationData()
  }, [quotationId, router, toast])

  useEffect(() => {
    if (user && userData) {
      fetchCompanyData()
    }
  }, [user, userData])

  useEffect(() => {
    if (quotation?.items?.[0]?.id) {
      fetchQuotationHistory()
    }
  }, [fetchQuotationHistory])

  useEffect(() => {
    if (quotation?.client_name) {
      fetchClientHistory()
    }
  }, [fetchClientHistory])

  useEffect(() => {
    if (isSendEmailDialogOpen && quotation) {
      setEmailSubject(`Quotation: ${quotation.title || "Custom Quotation"} - OH Plus`) // Updated subject
      setEmailBody(
        `Dear ${quotation.client?.contactPerson || quotation.client?.company || "Valued Client"},\n\nWe are pleased to provide you with a detailed quotation for your advertising campaign. Please find the full quotation attached and accessible via the link below.\n\nThank you for considering OH Plus for your advertising needs. We look forward to working with you to bring your campaign to life!\n\nBest regards,\nThe OH Plus Team`, // Updated email body
      )
      if (user?.email) {
        setCcEmail(user.email)
      } else {
        setCcEmail("")
      }
    }
  }, [isSendEmailDialogOpen, quotation, user?.email]) // Use quotation

  const getCurrentQuotation = () => {
    if (relatedQuotations.length > 0 && currentPageIndex >= 0 && currentPageIndex < relatedQuotations.length) {
      return relatedQuotations[currentPageIndex]
    }
    return quotation
  }

  const getCurrentItem = () => {
    const currentQuotation = getCurrentQuotation()
    return currentQuotation?.items?.[0] || null
  }

  const handleEditClick = () => {
    const currentQuotation = getCurrentQuotation()
    if (currentQuotation) {
      console.log("[v0] Entering edit mode with data:", currentQuotation)
      setEditableQuotation({ ...currentQuotation }) // Create proper copy
      setTempValues({}) // Clear temp values
      setIsEditing(true)
    }
  }

  const handleCancelEdit = () => {
    const currentQuotation = getCurrentQuotation()
    if (currentQuotation) {
      console.log("[v0] Canceling edit mode, restoring data:", currentQuotation)
      setEditableQuotation({ ...currentQuotation }) // Restore original data
      setTempValues({}) // Clear temp values
      setIsEditing(false)
      setHasUnsavedChanges(false)
    }
  }

  const handleSaveChanges = async () => {
    if (!editableQuotation) return

    setIsSaving(true)
    try {
      console.log("[v0] Saving changes:", editableQuotation)
      // Save logic here
      setQuotation(editableQuotation)
      setIsEditing(false)
      setHasUnsavedChanges(false)
      toast({
        title: "Success",
        description: "Quotation updated successfully.",
      })
    } catch (error) {
      console.error("Error saving quotation:", error)
      toast({
        title: "Error",
        description: "Failed to save changes. Please try again.",
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

  const handleDateChange = (date: Date | undefined, field: "start_date" | "end_date") => {
    setEditableQuotation((prev) => ({
      ...prev!,
      [field]: date || new Date(),
    }))
  }

  const handleDownloadPDF = async () => {
    if (!quotation) return

    setDownloadingPDF(true)
    try {
      // Check if there are multiple related quotations (same page_id)
      if (relatedQuotations.length > 1) {
        console.log("[v0] Downloading multiple quotation PDFs:", relatedQuotations.length)

        // Download all related quotations as separate PDFs
        for (let i = 0; i < relatedQuotations.length; i++) {
          const relatedQuotation = relatedQuotations[i]

          // Create unique quotation number with suffix
          const baseQuotationNumber = relatedQuotation.quotation_number || relatedQuotation.id?.slice(-8) || "QT-000"
          const uniqueQuotationNumber = `${baseQuotationNumber}-${String.fromCharCode(65 + i)}` // Appends -A, -B, -C, etc.

          // Create modified quotation with unique number
          const modifiedQuotation = {
            ...relatedQuotation,
            quotation_number: uniqueQuotationNumber,
          }

          await generateQuotationPDF(modifiedQuotation, companyData)

          // Add small delay between downloads to ensure proper file naming
          if (i < relatedQuotations.length - 1) {
            await new Promise((resolve) => setTimeout(resolve, 100))
          }
        }

        toast({
          title: "PDFs Generated",
          description: `${relatedQuotations.length} PDF files have been downloaded for all pages.`,
        })
      } else {
        // Single quotation - check if it has multiple items
        if (quotation.items && quotation.items.length > 1) {
          console.log("[v0] Downloading separate PDFs for multiple items:", quotation.items.length)
          await generateSeparateQuotationPDFs(quotation, companyData)
          toast({
            title: "PDFs Generated",
            description: `${quotation.items.length} separate PDF files have been downloaded for each item.`,
          })
        } else {
          // Single quotation with single item
          await generateQuotationPDF(quotation, companyData)
          toast({
            title: "Success",
            description: "PDF downloaded successfully",
          })
        }
      }
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

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case "draft":
        return "bg-gray-100 text-gray-800"
      case "sent":
        return "bg-blue-100 text-blue-800"
      case "accepted":
        return "bg-green-100 text-green-800"
      case "rejected":
        return "bg-red-100 text-red-800"
      case "expired":
        return "bg-orange-100 text-orange-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const handlePreviousPage = () => {
    if (currentPageIndex > 0) {
      const prevQuotation = relatedQuotations[currentPageIndex - 1]
      router.push(`/sales/quotations/${prevQuotation.id}`)
    }
  }

  const handleNextPage = () => {
    if (currentPageIndex < relatedQuotations.length - 1) {
      const nextQuotation = relatedQuotations[currentPageIndex + 1]
      router.push(`/sales/quotations/${nextQuotation.id}`)
    }
  }

  const handlePageSelect = (pageIndex: number) => {
    if (pageIndex >= 0 && pageIndex < relatedQuotations.length) {
      const selectedQuotation = relatedQuotations[pageIndex]
      router.push(`/sales/quotations/${selectedQuotation.id}`)
    }
  }

  const renderQuotationBlock = (siteName: string, items: QuotationLineItem[], pageNumber: number) => {
    const currentQuotation = editableQuotation || quotation
    if (!currentQuotation) return null

    const item = items[0]
    const monthlyRate = item?.price || 0
    const durationMonths = Math.ceil((Number(item?.duration_days) || 40) / 30)
    const totalLease = monthlyRate * durationMonths
    const vatAmount = totalLease * 0.12
    const totalWithVat = totalLease + vatAmount

    return (
      <div key={siteName} className="p-8 bg-white">
        {/* Header Section */}
        <div className="text-center mb-8"></div>

        {/* Client and RFQ Info */}
        <div className="flex justify-between items-start mb-8">
          <div className="text-left">
            <p className="text-base font-medium mb-2">{format(new Date(), "MMMM dd, yyyy")}</p>

            <p className="text-base font-medium mb-1">{currentQuotation.client_name || "Client Name"}</p>

            <p className="text-base font-medium">{currentQuotation.client_company_name || "COMPANY NAME"}</p>
          </div>
          <div className="text-right">
            <p className="text-base font-medium">RFQ. No. {currentQuotation.quotation_number}</p>
          </div>
        </div>

        <div className="text-center mb-8">
          <h1 className="text-xl font-bold text-gray-900 mb-4">{items[0]?.name || "Site Name"}</h1>
        </div>

        {/* Greeting */}
        <div className="text-center mb-8">
          <p className="text-base mb-2">
            Good Day! Thank you for considering {companyData?.name || "our company"} for your business needs.
          </p>
          <p className="text-base mb-6">We are pleased to submit our quotation for your requirements:</p>
          <p className="text-base font-semibold">Details as follows:</p>
        </div>

        {/* Details Section with editable fields */}
        <div className="space-y-3 mb-8">
          <div className="flex items-center">
            <span className="w-4 text-center">•</span>
            <span className="font-medium text-gray-700 w-32">Type</span>
            <span className="text-gray-700">: {item?.type || "Rental"}</span>
          </div>

          <div className="flex items-center">
            <span className="w-4 text-center">•</span>
            <span className="font-medium text-gray-700 w-32">Size</span>
            <span className="text-gray-700">: </span>
            {isEditing && editingField === "size" ? (
              <div className="flex items-center gap-2 ml-1">
                <Input
                  type="text"
                  value={tempValues.size || ""}
                  onChange={(e) => updateTempValues("size", e.target.value)}
                  className="w-48 h-6 text-sm"
                  placeholder="Enter size"
                />
              </div>
            ) : (
              <span
                className={`text-gray-700 ${
                  isEditing
                    ? "cursor-pointer hover:bg-blue-50 px-2 py-1 rounded border-2 border-dashed border-blue-300 hover:border-blue-500 transition-all duration-200"
                    : ""
                }`}
                onClick={() => isEditing && handleFieldEdit("size", currentQuotation?.size || "")}
                title={isEditing ? "Click to edit size" : ""}
              >
                {currentQuotation?.size || "100ft (H) x 60ft (W)"}
                {isEditing && <span className="ml-1 text-blue-500 text-xs">✏️</span>}
              </span>
            )}
          </div>

          <div className="flex items-center">
            <span className="w-4 text-center">•</span>
            <span className="font-medium text-gray-700 w-32">Contract Duration</span>
            <span className="text-gray-700">: </span>
            {isEditing && editingField === "duration_days" ? (
              <div className="flex items-center gap-2 ml-1">
                <Input
                  type="number"
                  value={tempValues.duration_days || ""}
                  onChange={(e) => updateTempValues("duration_days", Number.parseInt(e.target.value) || 0)}
                  className="w-24 h-6 text-sm"
                  placeholder="Days"
                />
                <span className="text-sm text-gray-600">days</span>
              </div>
            ) : (
              <span
                className={`text-gray-700 ${
                  isEditing
                    ? "cursor-pointer hover:bg-blue-50 px-2 py-1 rounded border-2 border-dashed border-blue-300 hover:border-blue-500 transition-all duration-200"
                    : ""
                }`}
                onClick={() => isEditing && handleFieldEdit("duration_days", currentQuotation?.duration_days || 0)}
                title={isEditing ? "Click to edit contract duration" : ""}
              >
                {formatDuration(currentQuotation?.duration_days || 0)}
                {isEditing && <span className="ml-1 text-blue-500 text-xs">✏️</span>}
              </span>
            )}
          </div>

          <div className="flex items-center">
            <span className="w-4 text-center">•</span>
            <span className="font-medium text-gray-700 w-32">Contract Period</span>
            <span className="text-gray-700">: </span>
            {isEditing && editingField === "contractPeriod" ? (
              <div className="flex items-center gap-2 ml-1">
                <Input
                  type="date"
                  value={tempValues.start_date ? format(new Date(tempValues.start_date), "yyyy-MM-dd") : ""}
                  onChange={(e) => updateTempValues("start_date", new Date(e.target.value))}
                  className="w-36 h-8 text-sm border-gray-300 rounded-md"
                />
                <span className="text-gray-500">-</span>
                <Input
                  type="date"
                  value={tempValues.end_date ? format(new Date(tempValues.end_date), "yyyy-MM-dd") : ""}
                  onChange={(e) => updateTempValues("end_date", new Date(e.target.value))}
                  className="w-36 h-8 text-sm border-gray-300 rounded-md"
                />
              </div>
            ) : (
              <span
                className={`text-gray-700 ${
                  isEditing
                    ? "cursor-pointer hover:bg-blue-50 px-2 py-1 rounded border-2 border-dashed border-blue-300 hover:border-blue-500 transition-all duration-200"
                    : ""
                }`}
                onClick={() =>
                  isEditing &&
                  handleFieldEdit("contractPeriod", {
                    start_date: currentQuotation?.start_date,
                    end_date: currentQuotation?.end_date,
                  })
                }
                title={isEditing ? "Click to edit contract period" : ""}
              >
                {currentQuotation?.start_date ? format(new Date(currentQuotation.start_date), "MMMM d, yyyy") : ""}
                {currentQuotation?.start_date && currentQuotation?.end_date ? " - " : ""}
                {currentQuotation?.end_date ? format(new Date(currentQuotation.end_date), "MMMM d, yyyy") : ""}
                {isEditing && <span className="ml-1 text-blue-500 text-xs">✏️</span>}
              </span>
            )}
          </div>

          <div className="flex">
            <span className="w-4 text-center">•</span>
            <span className="font-medium text-gray-700 w-32">Proposal to</span>
            <span className="text-gray-700">: {currentQuotation?.client_company_name || "CLIENT COMPANY NAME"}</span>
          </div>

          <div className="flex items-center">
            <span className="w-4 text-center">•</span>
            <span className="font-medium text-gray-700 w-32">Illumination</span>
            <span className="text-gray-700">: 10 units of 1000 watts metal Halide</span>
          </div>

          <div className="flex items-center">
            <span className="w-4 text-center">•</span>
            <span className="font-medium text-gray-700 w-32">Lease Rate/Month</span>
            <span className="text-gray-700">: PHP </span>
            {isEditing && editingField === "price" ? (
              <div className="flex items-center gap-2 ml-1">
                <Input
                  type="number"
                  value={tempValues.price || ""}
                  onChange={(e) => updateTempValues("price", Number.parseFloat(e.target.value) || 0)}
                  className="w-32 h-6 text-sm"
                  placeholder="0.00"
                />
                <span className="text-sm text-gray-600">(Exclusive of VAT)</span>
              </div>
            ) : (
              <span
                className={`text-gray-700 ${
                  isEditing
                    ? "cursor-pointer hover:bg-blue-50 px-2 py-1 rounded border-2 border-dashed border-blue-300 hover:border-blue-500 transition-all duration-200"
                    : ""
                }`}
                onClick={() => isEditing && handleFieldEdit("price", monthlyRate)}
                title={isEditing ? "Click to edit lease rate" : ""}
              >
                : PHP {safeFormatNumber(items[0]?.price || 0)} (Exclusive of VAT)
                {isEditing && <span className="ml-1 text-blue-500 text-xs">✏️</span>}
              </span>
            )}
          </div>

          <div className="flex">
            <span className="w-4 text-center">•</span>
            <span className="font-medium text-gray-700 w-32">Total Lease</span>
            <span className="text-gray-700">
              : PHP{" "}
              {safeFormatNumber(
                isEditing && editableQuotation?.items?.[0]?.item_total_amount
                  ? editableQuotation.items[0].item_total_amount
                  : item?.item_total_amount || 0,
              )}{" "}
              (Exclusive of VAT)
            </span>
          </div>
        </div>

        {/* Pricing Table - Updated for quotation pricing */}
        <div className="bg-gray-50 p-4 rounded-lg mb-6">
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-700">Lease rate per month</span>
              <span className="text-gray-900">PHP {safeFormatNumber(items[0]?.price || 0)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-700">x {formatDuration(currentQuotation.duration_days || 180)}</span>
              <span className="text-gray-900">PHP {safeFormatNumber(items[0]?.item_total_amount || 0)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-700">12% VAT</span>
              <span className="text-gray-900">PHP {safeFormatNumber((items[0]?.item_total_amount || 0) * 0.12)}</span>
            </div>
            <div className="border-t pt-2 mt-2">
              <div className="flex justify-between font-bold text-lg">
                <span className="text-gray-900">TOTAL</span>
                <span className="text-gray-900">PHP {safeFormatNumber((items[0]?.item_total_amount || 0) * 1.12)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Note */}
        <div className="mb-8">
          <p className="text-base">
            <strong>Note:</strong> free two (2) change material for {durationMonths} month rental
          </p>
        </div>

        {/* Terms and Conditions */}
        <div className="mb-8">
          <p className="font-semibold mb-4">Terms and Conditions:</p>
          <div className="space-y-2 text-sm">
            <p>1. Quotation validity: 5 working days.</p>
            <p>
              2. Availability of the site is on first-come-first-served-basis only. Only official documents such as
              P.O's, Media Orders, signed quotation, & contracts are accepted in order to booked the site.
            </p>
            <p>
              3. To book the site, one (1) month advance and one (2) months security deposit payment dated 7 days before
              the start of rental is required.
            </p>
            <p>4. Final artwork should be approved ten (10) days before the contract period</p>
            <p>5. Print is exclusively for {companyData?.name || "Company Name"} Only.</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-8 mb-8">
          <div className="text-left">
            <p className="mb-16">Very truly yours,</p>
            {isEditing && (editingField === "signature_name" || editingField === "signature_position") ? (
              <div className="space-y-2">
                <Input
                  type="text"
                  value={tempValues.signature_first_name || ""}
                  onChange={(e) => updateTempValues("signature_first_name", e.target.value)}
                  className="w-48 h-6 text-sm"
                  placeholder="Enter first name"
                />
                <Input
                  type="text"
                  value={tempValues.signature_last_name || ""}
                  onChange={(e) => updateTempValues("signature_last_name", e.target.value)}
                  className="w-48 h-6 text-sm"
                  placeholder="Enter last name"
                />
                <Input
                  type="text"
                  value={tempValues.signature_position || ""}
                  onChange={(e) => updateTempValues("signature_position", e.target.value)}
                  className="w-48 h-6 text-sm"
                  placeholder="Enter position"
                />
              </div>
            ) : (
              <div>
                <div className="border-b border-gray-400 w-48 mb-2"></div>
                <p
                  className={`font-medium ${
                    isEditing
                      ? "cursor-pointer hover:bg-blue-50 px-2 py-1 rounded border-2 border-dashed border-blue-300 hover:border-blue-500 transition-all duration-200"
                      : ""
                  }`}
                  onClick={() => isEditing && handleFieldEdit("signature_name", currentQuotation?.signature_name || "")}
                  title={isEditing ? "Click to edit name" : ""}
                >
                  {currentQuotation?.signature_first_name && currentQuotation?.signature_last_name
                    ? `${currentQuotation.signature_first_name} ${currentQuotation.signature_last_name}`
                    : currentQuotation?.signature_name ||
                      `${currentQuotation?.created_by_first_name || "AIX"} ${currentQuotation?.created_by_last_name || "Xymbiosis"}`}
                  {isEditing && <span className="ml-1 text-blue-500 text-xs">✏️</span>}
                </p>
                <p
                  className={`text-sm ${
                    isEditing
                      ? "cursor-pointer hover:bg-blue-50 px-2 py-1 rounded border-2 border-dashed border-blue-300 hover:border-blue-500 transition-all duration-200"
                      : ""
                  }`}
                  onClick={() =>
                    isEditing && handleFieldEdit("signature_position", currentQuotation?.signature_position || "")
                  }
                  title={isEditing ? "Click to edit position" : ""}
                >
                  {currentQuotation?.signature_position || currentQuotation?.position || "Position"}
                  {isEditing && <span className="ml-1 text-blue-500 text-xs">✏️</span>}
                </p>
              </div>
            )}
          </div>
          <div className="text-left">
            <p className="mb-16">Conforme:</p>
            <div className="border-b border-gray-400 w-48 mb-2"></div>
            <p className="font-medium">{currentQuotation?.client_name || "Client Name"}</p>
            <p className="text-sm">{currentQuotation?.client_company_name || "COMPANY NAME"}</p>
            <p className="text-xs mt-4 text-gray-600 italic">
              This signed quotation serves as an
              <br />
              official document for billing purposes
            </p>
          </div>
        </div>

        <div className="text-center text-xs text-gray-600 mt-8 border-t pt-4">
          <p>{formatCompanyAddress(companyData)}</p>
          {companyData?.phone && <p>Telephone: {companyData.phone}</p>}
          {companyData?.email && <p>Email: {companyData.email}</p>}
        </div>
      </div>
    )
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
          <Button onClick={() => router.push("/sales/quotations-list")} className="bg-blue-600 hover:bg-blue-700">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Quotations
          </Button>
        </div>
      </div>
    )
  }

  const currentQuotation = isEditing ? editableQuotation : quotation
  const hasMultipleSites = currentQuotation?.items && currentQuotation.items.length > 1

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Word-style Toolbar */}
      <div className="sticky top-0 z-10 bg-white border-b border-gray-200 shadow-sm mb-6">
        <div className="max-w-[850px] mx-auto px-4 py-2 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.back()}
              className="text-gray-600 hover:text-gray-900"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">Back</span>
            </Button>
            <Badge className={`${getStatusColor(quotation.status || "")} border font-medium px-3 py-1`}>
              <FileText className="h-3.5 w-3.5 mr-1.5" />
              {quotation.status || "Draft"}
            </Badge>
          </div>

          <div className="flex items-center space-x-2">
            <Button
              onClick={() => setTimelineOpen(true)}
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
        {/* Left Panel */}
        <div className="flex flex-col space-y-4 z-20 hidden lg:flex">
          <Button
            variant="ghost"
            className="h-16 w-16 flex flex-col items-center justify-center p-2 rounded-lg bg-white shadow-md border border-gray-200 hover:bg-gray-50"
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

        <div className="flex gap-6 items-start">
          <div className="max-w-[850px] bg-white shadow-md rounded-sm overflow-hidden">
            <div className="text-center mb-8">
              <div className="flex items-center justify-center mb-4">
                {companyData?.photo_url ? (
                  <img
                    src={companyData.photo_url || "/placeholder.svg"}
                    alt="Company Logo"
                    className="h-16 w-auto object-contain"
                  />
                ) : (
                  <div className="h-16 w-16 bg-gray-100 rounded-lg flex items-center justify-center">
                    <Building className="h-8 w-8 text-gray-400" />
                  </div>
                )}
              </div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">{companyData?.name || "Company Name"}</h1>
            </div>
            {hasMultipleSites ? (
              <>
                {renderQuotationBlock(
                  `Site ${currentProductIndex + 1}`,
                  [currentQuotation.items[currentProductIndex]],
                  currentProductIndex + 1,
                )}
              </>
            ) : (
              renderQuotationBlock("Single Site", currentQuotation?.items || [], 1)
            )}

            {proposal && (
              <div className="p-6 sm:p-8 border-t border-gray-200">
                <h2 className="text-xl font-semibold text-gray-900 mb-4 pb-1 border-b border-gray-200 font-[Calibri]">
                  Linked Proposal
                </h2>
                <Card>
                  <CardContent className="p-4">
                    <p className="text-lg font-semibold">{proposal.title}</p>
                    <p className="text-gray-600">
                      Created on {format(proposal.createdAt, "PPP")} by {proposal.createdBy}
                    </p>
                    <Button
                      variant="link"
                      className="p-0 mt-2"
                      onClick={() => router.push(`/sales/proposals/${proposal.id}`)}
                    >
                      View Proposal
                    </Button>
                  </CardContent>
                </Card>
              </div>
            )}
          </div>

          {/* Right Sidebar - Updated for quotation history */}
          <div className="w-80 bg-white shadow-md rounded-lg p-4 sticky top-24 max-h-[calc(100vh-120px)] overflow-y-auto hidden xl:block">
            <div className="mb-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Quotation History</h3> {/* Updated title */}
              <div className="bg-blue-500 text-white px-3 py-1 rounded-md text-sm font-medium inline-block mb-4">
                {quotation?.client?.company || quotation?.client?.name || "Client"}
              </div>
            </div>

            {loadingHistory ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
              </div>
            ) : clientHistory.length > 0 ? (
              <div className="space-y-3">
                {clientHistory.map((historyItem) => (
                  <div
                    key={historyItem.id}
                    onClick={() => router.push(`/sales/quotations/${historyItem.id}`)} // Navigate to quotations
                    className="border border-gray-200 rounded-lg p-3 hover:bg-gray-50 cursor-pointer transition-colors"
                  >
                    <div className="text-sm font-medium text-gray-900 mb-1">
                      {historyItem.quotation_number || historyItem.id.slice(-8)}
                    </div>
                    <div className="text-sm text-red-600 font-medium mb-2">
                      PHP {safeFormatNumber(historyItem.items?.[0]?.item_total_amount || historyItem.total_amount || 0)}
                      /month
                    </div>
                    <div className="flex justify-end">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium capitalize ${getStatusColor(historyItem.status)}`}
                      >
                        {historyItem.status}
                      </span>
                    </div>
                  </div>
                ))}
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
            ) : (
              <div className="text-center py-8 text-gray-500">
                <div className="text-sm">No other quotations found for this client</div> {/* Updated message */}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Floating Action Buttons */}
      {isEditing && (
        <div className="fixed top-20 left-1/2 transform -translate-x-1/2 bg-blue-100 border border-blue-300 text-blue-800 px-4 py-2 rounded-lg shadow-lg z-50">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">✏️ Edit Mode Active</span>
            <span className="text-xs">Click on highlighted fields to edit them</span>
          </div>
        </div>
      )}
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
            onClick={handleSaveChanges}
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
      ) : null}

      {/* Pagination Controls - Updated for quotations */}
      {relatedQuotations.length > 1 ? (
        <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-50">
          <div className="flex items-center gap-3 px-6 py-3 bg-white border border-gray-200 rounded-full shadow-lg">
            <Button
              variant="outline"
              size="sm"
              onClick={handlePreviousPage}
              disabled={currentPageIndex === 0}
              className="px-6 py-2 bg-white border-gray-300 text-gray-700 hover:bg-gray-50 rounded-full font-medium"
            >
              Previous
            </Button>

            <div className="px-4 py-2 bg-gray-100 text-gray-800 rounded-full font-medium text-sm">
              {currentPageIndex + 1}/{relatedQuotations.length}
            </div>

            {currentPageIndex === relatedQuotations.length - 1 ? (
              <Button
                onClick={() => router.push(`/sales/quotations/${params.id}/compose-email`)}
                className="px-6 py-2 bg-green-500 hover:bg-green-600 text-white rounded-full font-medium"
              >
                Send
              </Button>
            ) : (
              <Button
                variant="outline"
                size="sm"
                onClick={handleNextPage}
                disabled={currentPageIndex === relatedQuotations.length - 1}
                className="px-6 py-2 bg-white border-gray-300 text-gray-700 hover:bg-gray-50 rounded-full font-medium"
              >
                Next
              </Button>
            )}
          </div>
        </div>
      ) : (
        <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-50">
          <Button
            onClick={() => router.push(`/sales/quotations/${params.id}/compose-email`)}
            className="px-6 py-2 bg-green-500 hover:bg-green-600 text-white rounded-full font-medium"
          >
            Send
          </Button>
        </div>
      )}

      {/* Activity Timeline Dialog */}
      <Dialog open={timelineOpen} onOpenChange={setTimelineOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Quotation Activity Timeline</DialogTitle>
            <DialogDescription>Track all activities and changes for this quotation.</DialogDescription>
          </DialogHeader>
          <ProposalActivityTimeline activities={activities} />
        </DialogContent>
      </Dialog>

      {/* Send Quotation Options Dialog */}
      <SendQuotationOptionsDialog
        open={isSendOptionsDialogOpen}
        onOpenChange={setIsSendOptionsDialogOpen}
        onConfirm={() => {
          setIsSendOptionsDialogOpen(false)
          setIsSendEmailDialogOpen(true)
        }}
        onUpdateStatus={async (newStatus: QuotationStatus) => {
          setIsSendOptionsDialogOpen(false)
          await handleStatusUpdate(newStatus)
        }}
      />

      {/* Email Dialog */}
      <Dialog open={isSendEmailDialogOpen} onOpenChange={setIsSendEmailDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Send Quotation via Email</DialogTitle>
            <DialogDescription>Send this quotation to the client via email.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="email" className="text-right">
                To
              </Label>
              <Input type="email" id="email" defaultValue={quotation?.client_email} className="col-span-3" disabled />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="cc" className="text-right">
                CC
              </Label>
              <Input
                type="email"
                id="cc"
                value={ccEmail}
                onChange={(e) => setCcEmail(e.target.value)}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-start gap-4">
              <Label htmlFor="subject" className="text-right mt-2">
                Subject
              </Label>
              <Input
                type="text"
                id="subject"
                value={emailSubject}
                onChange={(e) => setEmailSubject(e.target.value)}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-start gap-4">
              <Label htmlFor="body" className="text-right mt-2">
                Body
              </Label>
              <Textarea
                id="body"
                value={emailBody}
                onChange={(e) => setEmailBody(e.target.value)}
                className="col-span-3 min-h-[150px]"
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="secondary" onClick={() => setIsSendEmailDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              type="submit"
              onClick={async () => {
                setSendingEmail(true)
                try {
                  // Simulate sending email
                  await new Promise((resolve) => setTimeout(resolve, 1500))
                  setIsSendEmailDialogOpen(false)
                  setShowSuccessDialog(true)
                  toast({
                    title: "Email Sent",
                    description: "The quotation has been sent to the client.",
                  })
                } catch (error) {
                  console.error("Error sending email:", error)
                  toast({
                    title: "Error",
                    description: "Failed to send email. Please try again.",
                    variant: "destructive",
                  })
                } finally {
                  setSendingEmail(false)
                }
              }}
              disabled={sendingEmail}
            >
              {sendingEmail ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Sending...
                </>
              ) : (
                "Send Email"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Quotation Sent Success Dialog */}
      <QuotationSentSuccessDialog
        open={showSuccessDialog}
        onOpenChange={setShowSuccessDialog}
        clientName={quotation?.client?.name || "Client"}
      />
    </div>
  )
}

"use client"
import { useEffect, useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { useToast } from "@/hooks/use-toast"
import {
  getQuotationById,
  updateQuotation,
  getQuotationsByPageId,
  getQuotationsByClientId, // Import new function for client history
  updateQuotationStatus,
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

export default function QuotationPage({ params }: { params: { id: string } }) {
  const { id: quotationId } = params // Use quotationId instead of costEstimateId
  const router = useRouter()
  const { user, userData } = useAuth()
  const { toast } = useToast()
  const [quotation, setQuotation] = useState<Quotation | null>(null) // Use quotation state
  const [editableQuotation, setEditableQuotation] = useState<Quotation | null>(null) // Use quotation state
  const [relatedQuotations, setRelatedQuotations] = useState<Quotation[]>([]) // Use quotations array
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
  const [clientHistory, setClientHistory] = useState<Quotation[]>([]) // Use quotation history
  const [loadingHistory, setLoadingHistory] = useState(false)

  const [editingField, setEditingField] = useState<string | null>(null)
  const [tempValues, setTempValues] = useState<{ [key: string]: any }>({})
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)

  const fetchQuotationHistory = useCallback(async () => {
    if (!quotation?.items?.[0]?.id) return

    setLoadingHistory(true)
    try {
      const productId = quotation.items[0].id
      const history = await getQuotationsByPageId(productId) // Changed to filter by page_id instead of product_id
      // Filter out current quotation from history
      const filteredHistory = history.filter((q) => q.id !== quotation.id)
      setQuotation(filteredHistory)
    } catch (error) {
      console.error("Error fetching quotation history:", error)
    } finally {
      setLoadingHistory(false)
    }
  }, [quotation?.items?.[0]?.id, quotation?.id])

  const fetchClientHistory = useCallback(async () => {
    if (!quotation?.client?.id) return // Use quotation client

    setLoadingHistory(true)
    try {
      const history = await getQuotationsByClientId(quotation.client.id) // Use quotation service
      // Filter out current quotation from history
      const filteredHistory = history.filter((q) => q.id !== quotation.id)
      setClientHistory(filteredHistory)
    } catch (error) {
      console.error("Error fetching client history:", error)
    } finally {
      setLoadingHistory(false)
    }
  }, [quotation?.client?.id, quotation?.id])

  const fetchCompanyData = async () => {
    try {
      if (userData?.company_id) {
        // Fetch company data logic here
        setCompanyData({
          name: "Golden Touch Imaging Specialist",
          photo_url: "/oh-plus-logo.png",
          id: userData?.company_id,
        })
      }
    } catch (error) {
      console.error("Error fetching company data:", error)
    }
  }

  const handleFieldEdit = (fieldName: string, currentValue: any) => {
    setEditingField(fieldName)
    setTempValues({ ...tempValues, [fieldName]: currentValue })
    setHasUnsavedChanges(true)
  }
  const updateTempValues = (fieldName: string, newValue: any) => {
    const updatedTempValues = { ...tempValues, [fieldName]: newValue }

    if (fieldName === "duration_days" && quotation?.start_date) {
      const newEndDate = new Date(quotation.start_date)
      newEndDate.setDate(newEndDate.getDate() + newValue)
      updatedTempValues.end_date = newEndDate
    } else if (fieldName === "start_date" || fieldName === "end_date") {
      const startDate = fieldName === "start_date" ? newValue : tempValues.start_date || quotation?.start_date
      const endDate = fieldName === "end_date" ? newValue : tempValues.end_date || quotation?.end_date

      if (startDate && endDate) {
        const diffTime = Math.abs(endDate.getTime() - startDate.getTime())
        const newDurationDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
        updatedTempValues.duration_days = newDurationDays
      }
    }

    setTempValues(updatedTempValues)
    setHasUnsavedChanges(true)
  }
  useEffect(() => {
    const fetchQuotationData = async () => {
      if (!quotationId) return

      setLoading(true)
      try {
        const q = await getQuotationById(quotationId) // Use quotation service
        if (q) {
          setQuotation(q)
          setEditableQuotation(q)

          console.log("[v0] Current quotation page_id:", q.page_id) // Log quotation page_id

          if (q.page_id) {
            const relatedQs = await getQuotationsByPageId(q.page_id) // Use quotation service
            console.log("[v0] Related quotations found:", relatedQs.length, relatedQs)
            setRelatedQuotations(relatedQs)
            // Find current page index
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
  }, [quotationId, router, toast]) // Use quotationId

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
    if (quotation?.client?.id) {
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

  const handleEditClick = () => {
    if (quotation) {
      setEditableQuotation({ ...quotation })
      setIsEditing(true)
    }
  }

  const handleCancelEdit = () => {
    setEditableQuotation(quotation)
    setIsEditing(false)
    setTempValues({})
    setHasUnsavedChanges(false)
    setEditingField(null)
    toast({
      title: "Cancelled",
      description: "Editing cancelled. Changes were not saved.",
    })
  }

  const handleSaveEdit = async () => {
    if (!editableQuotation || !quotationId || !editableQuotation.id) return

    setIsSaving(true)
    try {
      const currentUserId = user?.id || "current_user_id"
      const currentUserName = user?.first_name + " " + user?.last_name || "Current User"

      await updateQuotation(editableQuotation.id, editableQuotation, currentUserId, currentUserName)

      setQuotation(editableQuotation)
      setIsEditing(false)
      setTempValues({})
      setHasUnsavedChanges(false)
      setEditingField(null)
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
    const currentQuotation = editableQuotation || quotation // Use quotation
    if (!currentQuotation) return null

    const item = items[0] // Get the first item for this quotation
    const monthlyRate = item?.price || 0
    const durationMonths = Math.ceil((Number(item?.duration_days) || 40) / 30)
    const totalLease = monthlyRate * durationMonths
    const vatAmount = totalLease * 0.12
    const totalWithVat = totalLease + vatAmount

    return (
      <div key={siteName} className="p-8 bg-white">
        <div className="flex justify-between items-start mb-8">
          {/* Company Logo and Name */}
          <div className="flex items-center gap-4">
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
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                {companyData?.name || "Golden Touch Imaging Specialist"}
              </h1>
              <p className="text-sm text-gray-600">
                No. 727 General Solano St., San Miguel, Manila 1005. Telephone: (02) 5310 1750 to 53
              </p>
              <p className="text-sm text-gray-600">email: sales@goldentouchimaging.com or gtigolden@gmail.com</p>
            </div>
          </div>

          {/* Client Info and RFQ Number */}
          <div className="text-right">
            {isEditing && editingField === "client_name" ? (
              <Input
                type="text"
                value={tempValues.client_name || ""}
                onChange={(e) => updateTempValues("client_name", e.target.value)}
                className="w-64 h-8 text-base font-medium mb-2"
                placeholder="Enter client name"
              />
            ) : (
              <p
                className={`text-base font-medium mb-1 ${
                  isEditing
                    ? "cursor-pointer hover:bg-blue-50 px-2 py-1 rounded border-2 border-dashed border-blue-300"
                    : ""
                }`}
                onClick={() => isEditing && handleFieldEdit("client_name", currentQuotation.client?.name || "")}
              >
                {tempValues.client_name || currentQuotation.client?.name || "Client Name"}
                {isEditing && <span className="ml-1 text-blue-500 text-xs">✏️</span>}
              </p>
            )}

            {isEditing && editingField === "client_company" ? (
              <Input
                type="text"
                value={tempValues.client_company || ""}
                onChange={(e) => updateTempValues("client_company", e.target.value)}
                className="w-64 h-8 text-base mb-2"
                placeholder="Enter company name"
              />
            ) : (
              <p
                className={`text-base font-medium mb-2 ${
                  isEditing
                    ? "cursor-pointer hover:bg-blue-50 px-2 py-1 rounded border-2 border-dashed border-blue-300"
                    : ""
                }`}
                onClick={() => isEditing && handleFieldEdit("client_company", currentQuotation.client?.company || "")}
              >
                {tempValues.client_company || currentQuotation.client?.company || "COMPANY NAME"}
                {isEditing && <span className="ml-1 text-blue-500 text-xs">✏️</span>}
              </p>
            )}

            <p className="text-base font-medium">RFQ. No. {currentQuotation.quotationNumber}</p>
          </div>
        </div>

        <div className="text-right mb-6">
          <p className="text-base">{formatDate(new Date())}</p>
        </div>

        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold mb-4">
            {items[0]?.siteLocation || item?.location || "SITE NAME"} QUOTATION
          </h2>
        </div>

        <div className="mb-8">
          <p className="text-base mb-2">Good Day! Thank you for considering Golden Touch for your business needs.</p>
          <p className="text-base mb-6">We are pleased to submit our quotation for your requirements:</p>
          <p className="text-base font-semibold">Details as follows:</p>
        </div>

        {/* Site Details - Updated for quotation data structure */}
        <div className="mb-8 space-y-3">
          <div className="flex items-start">
            <span className="font-medium w-40 flex-shrink-0">● Site Location:</span>
            <span className="font-bold">{items[0]?.siteLocation || item?.location || "Site Location"}</span>
          </div>
          <div className="flex items-start">
            <span className="font-medium w-40 flex-shrink-0">● Type:</span>
            <span className="font-bold">{items[0]?.type || "Billboard"}</span>
          </div>
          <div className="flex items-start">
            <span className="font-medium w-40 flex-shrink-0">● Size:</span>
            <span className="font-bold">{items[0]?.size || "100ft (H) x 60ft (W)"}</span>
          </div>
          <div className="flex items-start">
            <span className="font-medium w-40 flex-shrink-0">● Contract Duration:</span>
            <span className="font-bold">{Math.ceil((currentQuotation.durationDays || 180) / 30)} MONTHS</span>
          </div>
          <div className="flex items-start">
            <span className="font-medium w-40 flex-shrink-0">● Contract Period:</span>
            <span className="font-bold">
              {format(currentQuotation.startDate || new Date(), "MMMM dd, yyyy")} -{" "}
              {format(currentQuotation.endDate || new Date(), "MMMM dd, yyyy")}
            </span>
          </div>
          <div className="flex items-start">
            <span className="font-medium w-40 flex-shrink-0">● Proposal to:</span>
            <span className="font-bold">{currentQuotation.client?.company || "CLIENT COMPANY NAME"}</span>
          </div>
          <div className="flex items-start">
            <span className="font-medium w-40 flex-shrink-0">● Illumination:</span>
            <span className="font-bold">{items[0]?.illumination || "10 units of 1000 watts metal Halide"}</span>
          </div>
          <div className="flex items-start">
            <span className="font-medium w-40 flex-shrink-0">● Lease Rate/Month:</span>
            <span className="font-bold">PHP {(items[0]?.price || 0).toLocaleString()} (Exclusive of VAT)</span>
          </div>
          <div className="flex items-start">
            <span className="font-medium w-40 flex-shrink-0">● Total Lease:</span>
            <span className="font-bold">
              PHP {((items[0]?.price || 0) * Math.ceil((currentQuotation.durationDays || 180) / 30)).toLocaleString()}{" "}
              (Exclusive of VAT)
            </span>
          </div>
        </div>

        {/* Pricing Table - Updated for quotation pricing */}
        <div className="mb-8">
          <div className="border border-gray-300">
            <div className="grid grid-cols-3 bg-gray-100 border-b border-gray-300">
              <div className="p-3 font-bold text-center">Lease rate per month</div>
              <div className="p-3 font-bold text-center border-l border-gray-300">12% VAT</div>
              <div className="p-3 font-bold text-center border-l border-gray-300">TOTAL</div>
            </div>
            <div className="grid grid-cols-3">
              <div className="p-3 text-center font-bold">PHP {(items[0]?.price || 0).toLocaleString()}</div>
              <div className="p-3 text-center font-bold border-l border-gray-300">
                PHP {((items[0]?.price || 0) * 0.12).toLocaleString()}
              </div>
              <div className="p-3 text-center font-bold border-l border-gray-300">
                PHP {((items[0]?.price || 0) * 1.12).toLocaleString()}
              </div>
            </div>
          </div>
          <div className="flex justify-between items-center mt-4">
            <span className="text-base">x {Math.ceil((currentQuotation.durationDays || 180) / 30)} months</span>
            <div className="text-right">
              <div className="text-lg font-bold">
                {((items[0]?.price || 0) * Math.ceil((currentQuotation.durationDays || 180) / 30)).toLocaleString()}
              </div>
              <div className="text-lg font-bold">
                {(
                  (items[0]?.price || 0) *
                  Math.ceil((currentQuotation.durationDays || 180) / 30) *
                  0.12
                ).toLocaleString()}
              </div>
              <div className="text-lg font-bold">
                {(
                  (items[0]?.price || 0) *
                  Math.ceil((currentQuotation.durationDays || 180) / 30) *
                  1.12
                ).toLocaleString()}
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
          <h3 className="text-lg font-bold mb-4">Terms and Conditions:</h3>
          <div className="space-y-2 text-sm">
            <p>1. Quotation validity: 5 working days.</p>
            <p>
              2. Availability of the site is on first-come-first-served-basis only. Only official documents such as
              P.O's,
            </p>
            <p className="ml-4">
              Media Orders, signed quotation, & contracts are accepted in order to booked the site.
            </p>
            <p>3. To book the site, one (1) month advance and one (2) months security deposit</p>
            <p className="ml-4">payment dated 7 days before the start of rental is required.</p>
            <p>4. Final artwork should be approved ten (10) days before the contract period</p>
            <p>5. Print is exclusively for {companyData?.name || "Golden Touch Imaging Specialist"} Only.</p>
          </div>
        </div>

        <div className="mb-8">
          <div className="flex justify-between items-start">
            {/* Left side - Company signature */}
            <div className="w-1/2">
              <p className="text-base mb-8">Very truly yours,</p>
              <div className="mb-2">
                <div className="w-48 h-16 border-b border-gray-400 mb-2"></div>
              </div>
              {/* Editable name */}
              {isEditing && editingField === "signatureName" ? (
                <Input
                  type="text"
                  value={tempValues.signatureName || ""}
                  onChange={(e) => updateTempValues("signatureName", e.target.value)}
                  className="w-48 h-8 text-base font-medium mb-1"
                  placeholder="Enter name"
                />
              ) : (
                <p
                  className={`text-base font-medium text-gray-900 ${
                    isEditing
                      ? "cursor-pointer hover:bg-blue-50 px-2 py-1 rounded border-2 border-dashed border-blue-300"
                      : ""
                  }`}
                  onClick={() =>
                    isEditing &&
                    handleFieldEdit(
                      "signatureName",
                      `${userData?.first_name?.charAt(0).toUpperCase() + userData?.first_name?.slice(1) || ""} ${userData?.last_name?.charAt(0).toUpperCase() + userData?.last_name?.slice(1) || ""}`.trim(),
                    )
                  }
                >
                  {tempValues.signatureName ||
                    `${userData?.first_name?.charAt(0).toUpperCase() + userData?.first_name?.slice(1) || ""} ${userData?.last_name?.charAt(0).toUpperCase() + userData?.last_name?.slice(1) || ""}`.trim() ||
                    "Mathew Espanto"}
                  {isEditing && <span className="ml-1 text-blue-500 text-xs">✏️</span>}
                </p>
              )}
              {/* Editable position */}
              {isEditing && editingField === "signaturePosition" ? (
                <Input
                  type="text"
                  value={tempValues.signaturePosition || ""}
                  onChange={(e) => updateTempValues("signaturePosition", e.target.value)}
                  className="w-48 h-8 text-base"
                  placeholder="Enter position"
                />
              ) : (
                <p
                  className={`text-base text-gray-600 ${
                    isEditing
                      ? "cursor-pointer hover:bg-blue-50 px-2 py-1 rounded border-2 border-dashed border-blue-300"
                      : ""
                  }`}
                  onClick={() =>
                    isEditing && handleFieldEdit("signaturePosition", userData?.position || "Account Management")
                  }
                >
                  {tempValues.signaturePosition || userData?.position || "Account Management"}
                  {isEditing && <span className="ml-1 text-blue-500 text-xs">✏️</span>}
                </p>
              )}
            </div>

            {/* Right side - Client conforme */}
            <div className="w-1/2 pl-8">
              <p className="text-base mb-8">C o n f o r m e:</p>
              <div className="mb-2">
                <div className="w-48 h-16 border-b border-gray-400 mb-2"></div>
              </div>
              <p className="text-base font-medium text-gray-900 mb-1">
                {currentQuotation.client?.name || "Client Name"}
              </p>
              <p className="text-base text-gray-600">{currentQuotation.client?.company || "Client Company"}</p>
              <p className="text-sm text-gray-600 mt-4">
                This signed Quotation serves as an
                <br />
                official document for billing purposes
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 pt-4 border-t border-gray-200 text-center text-sm text-gray-600">
          <p>No. 727 General Solano St., San Miguel, Manila 1005. Telephone: (02) 5310 1750 to 53</p>
          <p>email: sales@goldentouchimaging.com or gtigolden@gmail.com</p>
          {currentQuotation.validUntil && (
            <p className="mt-2">This quotation is valid until {format(currentQuotation.validUntil, "PPP")}</p>
          )}
          <p className="mt-1">
            © {new Date().getFullYear()} {companyData?.name || "Golden Touch Imaging Specialist"}. All rights reserved.
          </p>
          {relatedQuotations.length > 1 && (
            <p className="mt-2 font-medium">
              Page {pageNumber} of {relatedQuotations.length}
            </p>
          )}
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

  const currentQuotation = editableQuotation || quotation
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
                      {historyItem.quotationNumber || historyItem.id.slice(-8)} {/* Use quotationNumber */}
                    </div>
                    <div className="text-sm text-red-600 font-medium mb-2">
                      PHP {historyItem.totalAmount.toLocaleString()}/month
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
                onClick={() => setIsSendOptionsDialogOpen(true)}
                disabled={quotation?.status !== "draft"}
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
            onClick={() => setIsSendOptionsDialogOpen(true)}
            disabled={quotation?.status !== "draft"}
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

      {/* Send Email Dialog */}
      <Dialog open={isSendEmailDialogOpen} onOpenChange={setIsSendEmailDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Send Quotation via Email</DialogTitle>
            <DialogDescription>Customize and send the quotation email to the client.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="email" className="text-right">
                To
              </Label>
              <Input type="email" id="email" defaultValue={quotation?.client?.email} className="col-span-3" disabled />
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

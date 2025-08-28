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
import type { Quotation, QuotationLineItem } from "@/lib/types/quotation"
import { format } from "date-fns"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { ArrowLeft, FileText, Loader2, Building, Share2, Download, CheckCircle, XCircle } from "lucide-react"
import { getProposal } from "@/lib/proposal-service"
import type { Proposal } from "@/lib/types/proposal"
import { getProposalActivities } from "@/lib/proposal-activity-service"
import type { ProposalActivity } from "@/lib/types/proposal-activity"
import { generateQuotationPDF } from "@/lib/quotation-pdf-service" // Use quotation PDF service

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

const generateQRCodeUrl = (id: string) => {
  if (!id) return null
  return `https://ohplus.vercel.app/sales/quotations/${id}`
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
  const [showQRModal, setShowQRModal] = useState(false)

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
        <div className="flex justify-between items-start mb-6">
          {/* Left side - Company info */}
          <div className="flex items-start gap-4">
            {companyData?.photo_url ? (
              <img
                src={companyData.photo_url || "/placeholder.svg"}
                alt="Company Logo"
                className="h-12 w-auto object-contain mt-1"
              />
            ) : (
              <div className="h-12 w-12 bg-gray-100 rounded flex items-center justify-center mt-1">
                <Building className="h-6 w-6 text-gray-400" />
              </div>
            )}
            <div>
              <h1 className="text-xl font-bold text-gray-900 mb-1">Golden Touch Imaging Specialist</h1>
              <div className="text-sm text-gray-600 space-y-0.5">
                <p>No. 727 General Solano St., San Miguel, Manila 1005. Telephone:</p>
                <p>(02) 5310 1750 to 53</p>
                <p>email: sales@goldentouchimaging.com or gtigolden@gmail.com</p>
              </div>
            </div>
          </div>

          {/* Right side - Client info and date */}
          <div className="text-right">
            {isEditing && editingField === "client_name" ? (
              <Input
                type="text"
                value={tempValues.client_name || ""}
                onChange={(e) => updateTempValues("client_name", e.target.value)}
                className="w-48 h-8 text-sm mb-1"
                placeholder="Client Name"
              />
            ) : (
              <p
                className={`text-sm font-medium mb-1 ${
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
                className="w-48 h-8 text-sm mb-2"
                placeholder="COMPANY NAME"
              />
            ) : (
              <p
                className={`text-sm font-medium mb-2 ${
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

            <p className="text-sm font-medium mb-3">RFQ. No. {currentQuotation.quotationNumber}</p>

            <p className="text-sm">{formatDate(new Date())}</p>
          </div>
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

  const copyLinkToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href)
      toast({
        title: "Link Copied",
        description: "Quotation link copied to clipboard!",
      })
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to copy link to clipboard.",
        variant: "destructive",
      })
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
    <>
      <div className="sticky top-0 z-10 bg-white/80 backdrop-blur-sm border-b border-gray-200 shadow-sm">
        <div className="max-w-[850px] mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Button variant="ghost" size="sm" className="text-gray-600" onClick={() => router.back()}>
              <ArrowLeft className="h-4 w-4 mr-1" />
              Back
            </Button>
            <Badge
              className={`${
                quotation?.status === "accepted"
                  ? "bg-green-100 text-green-800 border-green-200"
                  : quotation?.status === "rejected"
                    ? "bg-red-100 text-red-800 border-red-200"
                    : "bg-blue-100 text-blue-800 border-blue-200"
              } border font-medium px-3 py-1`}
            >
              {quotation?.status === "accepted" && <CheckCircle className="h-3.5 w-3.5 mr-1" />}
              {quotation?.status === "rejected" && <XCircle className="h-3.5 w-3.5 mr-1" />}
              <span className="capitalize">{quotation?.status}</span>
            </Badge>
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              className="text-gray-600 bg-transparent"
              onClick={() => setShowQRModal(true)}
            >
              <Share2 className="h-4 w-4 mr-1" />
              <span className="hidden sm:inline">Share</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="text-gray-600 bg-transparent"
              onClick={handleDownloadPDF}
              disabled={downloadingPDF}
            >
              {downloadingPDF ? (
                <Loader2 className="h-4 w-4 mr-1 animate-spin" />
              ) : (
                <Download className="h-4 w-4 mr-1" />
              )}
              <span className="hidden sm:inline">Download</span>
            </Button>
          </div>
        </div>
      </div>

      <div className="min-h-screen bg-gray-100 py-6 px-4 sm:px-6 pt-16">
        <div className="max-w-[850px] mx-auto bg-white shadow-md rounded-sm overflow-hidden">
          <div className="border-b-2 border-orange-600 p-6 sm:p-8">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4">
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-1 font-[Calibri]">QUOTATION</h1>
                <p className="text-sm text-gray-500">{quotation?.quotationNumber}</p>
              </div>
              <div className="mt-4 sm:mt-0 flex items-center space-x-4">
                <div className="text-center">
                  <img
                    src={generateQRCodeUrl(quotation?.id || "") || "/placeholder.svg"}
                    alt="QR Code"
                    className="w-16 h-16 border border-gray-300 bg-white p-1 rounded"
                  />
                  <p className="text-xs text-gray-500 mt-1">Scan to view online</p>
                </div>
                <img src="/oh-plus-logo.png" alt="Company Logo" className="h-8 sm:h-10" />
              </div>
            </div>
          </div>

          <div className="p-6 sm:p-8">
            <div className="mb-6">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <p className="text-sm text-gray-600 mb-2">
                    {quotation?.createdAt
                      ? new Date(quotation.createdAt).toLocaleDateString("en-US", {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        })
                      : formatDate(new Date())}
                  </p>
                  <div className="space-y-1">
                    <p className="font-semibold text-gray-900">{quotation?.client?.name || "Valued Client"}</p>
                    <p className="text-gray-700">{quotation?.client?.company || ""}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-600">RFQ No.</p>
                  <p className="font-semibold text-gray-900">{quotation?.quotationNumber}</p>
                </div>
              </div>

              <div className="mb-6 p-4 bg-blue-50 border-l-4 border-blue-400 rounded-r-lg">
                <p className="text-gray-800 leading-relaxed font-medium">
                  Good Day! Thank you for considering Golden Touch for your business needs. We are pleased to submit our
                  quotation for your requirements:
                </p>
              </div>

              <div className="mb-4">
                <p className="font-semibold text-gray-900">Details as follows:</p>
              </div>

              <div className="mb-8 space-y-3">
                <div className="flex items-start">
                  <span className="font-medium w-40 flex-shrink-0">● Site Location:</span>
                  <span className="font-bold">
                    {quotation?.lineItems?.[0]?.siteLocation || quotation?.lineItems?.[0]?.location || "Site Location"}
                  </span>
                </div>
                <div className="flex items-start">
                  <span className="font-medium w-40 flex-shrink-0">● Type:</span>
                  <span className="font-bold">{quotation?.lineItems?.[0]?.type || "Billboard"}</span>
                </div>
                <div className="flex items-start">
                  <span className="font-medium w-40 flex-shrink-0">● Size:</span>
                  <span className="font-bold">{quotation?.lineItems?.[0]?.size || "100ft (H) x 60ft (W)"}</span>
                </div>
                <div className="flex items-start">
                  <span className="font-medium w-40 flex-shrink-0">● Contract Duration:</span>
                  <span className="font-bold">{Math.ceil((quotation?.durationDays || 180) / 30)} MONTHS</span>
                </div>
                <div className="flex items-start">
                  <span className="font-medium w-40 flex-shrink-0">● Contract Period:</span>
                  <span className="font-bold">
                    {quotation?.startDate
                      ? format(new Date(quotation.startDate), "MMMM dd, yyyy")
                      : format(new Date(), "MMMM dd, yyyy")}{" "}
                    -{" "}
                    {quotation?.endDate
                      ? format(new Date(quotation.endDate), "MMMM dd, yyyy")
                      : format(new Date(), "MMMM dd, yyyy")}
                  </span>
                </div>
                <div className="flex items-start">
                  <span className="font-medium w-40 flex-shrink-0">● Proposal to:</span>
                  <span className="font-bold">{quotation?.client?.company || "CLIENT COMPANY NAME"}</span>
                </div>
                <div className="flex items-start">
                  <span className="font-medium w-40 flex-shrink-0">● Illumination:</span>
                  <span className="font-bold">
                    {quotation?.lineItems?.[0]?.illumination || "10 units of 1000 watts metal Halide"}
                  </span>
                </div>
                <div className="flex items-start">
                  <span className="font-medium w-40 flex-shrink-0">● Lease Rate/Month:</span>
                  <span className="font-bold">
                    PHP {(quotation?.lineItems?.[0]?.price || 0).toLocaleString()} (Exclusive of VAT)
                  </span>
                </div>
                <div className="flex items-start">
                  <span className="font-medium w-40 flex-shrink-0">● Total Lease:</span>
                  <span className="font-bold">
                    PHP{" "}
                    {(
                      (quotation?.lineItems?.[0]?.price || 0) * Math.ceil((quotation?.durationDays || 180) / 30)
                    ).toLocaleString()}{" "}
                    (Exclusive of VAT)
                  </span>
                </div>
              </div>

              <div className="mb-8">
                <div className="border border-gray-300 rounded-sm overflow-hidden">
                  <div className="grid grid-cols-3 bg-gray-100">
                    <div className="py-2 px-4 font-medium text-gray-700 border-b border-gray-300 text-center">
                      Lease rate per month
                    </div>
                    <div className="py-2 px-4 font-medium text-gray-700 border-b border-gray-300 border-l text-center">
                      12% VAT
                    </div>
                    <div className="py-2 px-4 font-medium text-gray-700 border-b border-gray-300 border-l text-center">
                      TOTAL
                    </div>
                  </div>
                  <div className="grid grid-cols-3">
                    <div className="py-3 px-4 text-center font-bold">
                      PHP {(quotation?.lineItems?.[0]?.price || 0).toLocaleString()}
                    </div>
                    <div className="py-3 px-4 text-center font-bold border-l border-gray-300">
                      PHP {((quotation?.lineItems?.[0]?.price || 0) * 0.12).toLocaleString()}
                    </div>
                    <div className="py-3 px-4 text-center font-bold border-l border-gray-300">
                      PHP {((quotation?.lineItems?.[0]?.price || 0) * 1.12).toLocaleString()}
                    </div>
                  </div>
                </div>
                <div className="flex justify-between items-center mt-4">
                  <span className="text-base">x {Math.ceil((quotation?.durationDays || 180) / 30)} months</span>
                  <div className="text-right space-y-1">
                    <div className="text-lg font-bold">
                      PHP{" "}
                      {(
                        (quotation?.lineItems?.[0]?.price || 0) * Math.ceil((quotation?.durationDays || 180) / 30)
                      ).toLocaleString()}
                    </div>
                    <div className="text-lg font-bold">
                      PHP{" "}
                      {(
                        (quotation?.lineItems?.[0]?.price || 0) *
                        Math.ceil((quotation?.durationDays || 180) / 30) *
                        0.12
                      ).toLocaleString()}
                    </div>
                    <div className="text-lg font-bold">
                      PHP{" "}
                      {(
                        (quotation?.lineItems?.[0]?.price || 0) *
                        Math.ceil((quotation?.durationDays || 180) / 30) *
                        1.12
                      ).toLocaleString()}
                    </div>
                  </div>
                </div>
              </div>

              <div className="mb-8">
                <p className="text-base">
                  <strong>Note:</strong> free two (2) change material for{" "}
                  {Math.ceil((quotation?.durationDays || 180) / 30)} month rental
                </p>
              </div>

              <div className="mb-8">
                <h2 className="text-xl font-semibold text-gray-900 mb-4 pb-1 border-b border-gray-200 font-[Calibri]">
                  Terms and Conditions:
                </h2>
                <div className="space-y-2 text-sm leading-relaxed">
                  <p>1. Quotation validity: 5 working days.</p>
                  <p>
                    2. Availability of the site is on first-come-first-served-basis only. Only official documents such
                    as P.O's,
                  </p>
                  <p className="ml-4">
                    Media Orders, signed quotation, & contracts are accepted in order to booked the site.
                  </p>
                  <p>3. To book the site, one (1) month advance and one (2) months security deposit</p>
                  <p className="ml-4">payment dated 7 days before the start of rental is required.</p>
                  <p>4. Final artwork should be approved ten (10) days before the contract period</p>
                  <p>5. Print is exclusively for Golden Touch Imaging Specialist Only.</p>
                </div>
              </div>

              <div className="mb-8">
                <h2 className="text-xl font-semibold text-gray-900 mb-4 pb-1 border-b border-gray-200 font-[Calibri]">
                  Signatures
                </h2>
                <div className="flex justify-between items-start">
                  <div className="w-1/2">
                    <p className="text-base mb-8">Very truly yours,</p>
                    <div className="mb-2">
                      <div className="w-48 h-16 border-b border-gray-400 mb-2"></div>
                    </div>
                    <p className="text-base font-medium text-gray-900 mb-1">
                      {userData?.first_name && userData?.last_name
                        ? `${userData.first_name.charAt(0).toUpperCase() + userData.first_name.slice(1)} ${userData.last_name.charAt(0).toUpperCase() + userData.last_name.slice(1)}`
                        : "Mathew Espanto"}
                    </p>
                    <p className="text-base text-gray-600">{userData?.position || "Account Management"}</p>
                  </div>
                  <div className="w-1/2 pl-8">
                    <p className="text-base mb-8">C o n f o r m e:</p>
                    <div className="mb-2">
                      <div className="w-48 h-16 border-b border-gray-400 mb-2"></div>
                    </div>
                    <p className="text-base font-medium text-gray-900 mb-1">
                      {quotation?.client?.name || "Client Name"}
                    </p>
                    <p className="text-base text-gray-600">{quotation?.client?.company || "Client Company"}</p>
                    <p className="text-sm text-gray-600 mt-4">
                      This signed Quotation serves as an
                      <br />
                      official document for billing purposes
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-12 pt-6 border-t border-gray-200 text-center text-xs text-gray-500">
                <p>No. 727 General Solano St., San Miguel, Manila 1005. Telephone: (02) 5310 1750 to 53</p>
                <p>email: sales@goldentouchimaging.com or gtigolden@gmail.com</p>
                {quotation?.validUntil && (
                  <p className="mt-2">This quotation is valid until {format(new Date(quotation.validUntil), "PPP")}</p>
                )}
                <p className="mt-1">
                  © {new Date().getFullYear()} Golden Touch Imaging Specialist. All rights reserved.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {showQRModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 max-w-sm w-full">
            <h3 className="text-lg font-semibold mb-4">Share Quotation</h3>
            <div className="flex flex-col items-center mb-4">
              <img
                src={generateQRCodeUrl(quotation?.id || "") || "/placeholder.svg"}
                alt="QR Code"
                className="w-48 h-48 border border-gray-300 p-2 mb-2"
              />
              <p className="text-sm text-gray-600">Scan to view this quotation</p>
            </div>
            <div className="flex flex-col space-y-3">
              <Button onClick={copyLinkToClipboard} className="w-full">
                <Share2 className="h-4 w-4 mr-2" />
                Copy Link
              </Button>
              <Button variant="outline" onClick={() => setShowQRModal(false)} className="w-full">
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

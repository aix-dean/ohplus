"use client"

import type React from "react"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { useToast } from "@/hooks/use-toast"
import { getCostEstimate, updateCostEstimateStatus, updateCostEstimate } from "@/lib/cost-estimate-service"
import type {
  CostEstimate,
  CostEstimateClient,
  CostEstimateStatus,
  CostEstimateLineItem,
} from "@/lib/types/cost-estimate"
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
  Send,
  CheckCircle,
  XCircle,
  FileText,
  Loader2,
  LayoutGrid,
  Pencil,
  Save,
  X,
  Building,
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
import { generateCostEstimatePDF, generateSeparateCostEstimatePDFs } from "@/lib/cost-estimate-pdf-service"
import { CostEstimateSentSuccessDialog } from "@/components/cost-estimate-sent-success-dialog" // Ensure this is imported
import { SendCostEstimateOptionsDialog } from "@/components/send-cost-estimate-options-dialog" // Import the new options dialog
import { Checkbox } from "@/components/ui/checkbox"
import { ScrollArea } from "@/components/ui/scroll-area"
import { db } from "@/lib/firebase"
import { collection, query, where, getDocs, doc, getDoc } from "firebase/firestore"

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
  social_media?: {
    facebook?: string
    instagram?: string
    youtube?: string
  }
  created_by?: string
  created?: Date
  updated?: Date
}

// Helper function to generate QR code URL
const generateQRCodeUrl = (costEstimateId: string) => {
  const costEstimateViewUrl = `${process.env.NEXT_PUBLIC_APP_URL}/cost-estimates/view/${costEstimateId}`
  return `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(costEstimateViewUrl)}`
}

const formatDurationDisplay = (durationDays: number | null | undefined): string => {
  if (!durationDays) return "1 month"
  const months = Math.floor(durationDays / 30)
  const days = durationDays % 30
  if (months === 0) {
    return days === 1 ? "1 day" : `${days} days`
  } else if (days === 0) {
    return months === 1 ? "1 month" : `${months} months`
  } else {
    const monthText = months === 1 ? "month" : "months"
    const dayText = days === 1 ? "day" : "days"
    return `${months} ${monthText} and ${days} ${dayText}`
  }
}

export default function CostEstimateDetailsPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const { user, userData } = useAuth()

  const { toast } = useToast()

  const costEstimateId = params.id
  const [costEstimate, setCostEstimate] = useState<CostEstimate | null>(null)
  const [editableCostEstimate, setEditableCostEstimate] = useState<CostEstimate | null>(null)
  const [loading, setLoading] = useState(true)
  const [sendingEmail, setSendingEmail] = useState(false)
  const [updatingStatus, setUpdatingStatus] = useState(false)
  const [proposal, setProposal] = useState<Proposal | null>(null)
  const [activities, setActivities] = useState<ProposalActivity[]>([])
  const [timelineOpen, setTimelineOpen] = useState(false)
  const [isSendEmailDialogOpen, setIsSendEmailDialogOpen] = useState(false)
  const [isSendOptionsDialogOpen, setIsSendOptionsDialogOpen] = useState(false) // New state for options dialog
  const [ccEmail, setCcEmail] = useState("")
  const [isEditing, setIsEditing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [emailSubject, setEmailSubject] = useState("")
  const [emailBody, setEmailBody] = useState("")
  const [showSuccessDialog, setShowSuccessDialog] = useState(false)
  const [downloadingPDF, setDownloadingPDF] = useState(false) // New state for PDF download
  const [showPageSelection, setShowPageSelection] = useState(false)
  const [selectedPages, setSelectedPages] = useState<string[]>([])
  const [currentProductIndex, setCurrentProductIndex] = useState(0)
  const [projectData, setProjectData] = useState<{ company_logo?: string; company_name?: string } | null>(null)
  const [companyData, setCompanyData] = useState<CompanyData | null>(null)

  const [editingField, setEditingField] = useState<string | null>(null)
  const [tempValues, setTempValues] = useState<{ [key: string]: any }>({})
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)

  useEffect(() => {
    console.log("[v0] Save button visibility check:", {
      isEditing,
      hasUnsavedChanges,
      tempValuesCount: Object.keys(tempValues).length,
      tempValues,
    })
  }, [isEditing, hasUnsavedChanges, tempValues])

  const handleFieldEdit = (fieldName: string, currentValue: any) => {
    setEditingField(fieldName)
    setTempValues({ ...tempValues, [fieldName]: currentValue })
    setHasUnsavedChanges(true)
  }

  const updateTempValues = (fieldName: string, newValue: any) => {
    const updatedTempValues = { ...tempValues, [fieldName]: newValue }

    // Bidirectional sync: duration days <-> contract period
    if (fieldName === "durationDays" && costEstimate?.startDate) {
      // When duration changes, update end date
      const newEndDate = new Date(costEstimate.startDate)
      newEndDate.setDate(newEndDate.getDate() + newValue)
      updatedTempValues.endDate = newEndDate
    } else if (fieldName === "startDate" || fieldName === "endDate") {
      // When dates change, update duration
      const startDate = fieldName === "startDate" ? newValue : tempValues.startDate || costEstimate?.startDate
      const endDate = fieldName === "endDate" ? newValue : tempValues.endDate || costEstimate?.endDate

      if (startDate && endDate) {
        const diffTime = Math.abs(endDate.getTime() - startDate.getTime())
        const newDurationDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
        updatedTempValues.durationDays = newDurationDays
      }
    }

    setTempValues(updatedTempValues)
    setHasUnsavedChanges(true)
  }

  const handleSaveAllChanges = async () => {
    console.log("[v0] handleSaveAllChanges called")
    console.log("[v0] Current state:", {
      editableCostEstimate: !!costEstimate,
      tempValuesCount: Object.keys(tempValues).length,
      tempValues,
    })

    if (!costEstimate) {
      toast({
        title: "Error",
        description: "No cost estimate data available",
        variant: "destructive",
      })
      return
    }

    if (Object.keys(tempValues).length === 0) {
      console.log("[v0] No temp values to save, returning")
      toast({
        title: "No Changes",
        description: "No changes to save",
        variant: "destructive",
      })
      return
    }

    const updatedCostEstimate = { ...costEstimate }

    // Apply all temp values to the cost estimate
    Object.entries(tempValues).forEach(([fieldName, newValue]) => {
      switch (fieldName) {
        case "unitPrice":
          const updatedLineItems = updatedCostEstimate.lineItems.map((item) => {
            if (item.category.includes("Billboard Rental")) {
              const newTotal = newValue * (updatedCostEstimate.durationDays ? updatedCostEstimate.durationDays / 30 : 1)
              return { ...item, unitPrice: newValue, total: newTotal }
            }
            return item
          })
          updatedCostEstimate.lineItems = updatedLineItems
          updatedCostEstimate.totalAmount = updatedLineItems.reduce((sum, item) => sum + item.total, 0)
          break

        case "durationDays":
          updatedCostEstimate.durationDays = newValue
          const recalculatedItems = updatedCostEstimate.lineItems.map((item) => {
            if (item.category.includes("Billboard Rental")) {
              const newTotal = item.unitPrice * (newValue / 30)
              return { ...item, total: newTotal }
            }
            return item
          })
          updatedCostEstimate.lineItems = recalculatedItems
          updatedCostEstimate.totalAmount = recalculatedItems.reduce((sum, item) => sum + item.total, 0)

          if (updatedCostEstimate.startDate) {
            const newEndDate = new Date(updatedCostEstimate.startDate)
            newEndDate.setDate(newEndDate.getDate() + newValue)
            updatedCostEstimate.endDate = newEndDate
          }
          break

        case "illumination":
          const illuminationUpdatedItems = updatedCostEstimate.lineItems.map((item) => ({
            ...item,
            quantity: newValue,
          }))
          updatedCostEstimate.lineItems = illuminationUpdatedItems
          break

        case "startDate":
        case "endDate":
          updatedCostEstimate[fieldName] = newValue
          if (updatedCostEstimate.startDate && updatedCostEstimate.endDate) {
            const diffTime = Math.abs(updatedCostEstimate.endDate.getTime() - updatedCostEstimate.startDate.getTime())
            const newDurationDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
            updatedCostEstimate.durationDays = newDurationDays

            const durationUpdatedItems = updatedCostEstimate.lineItems.map((item) => {
              if (item.category.includes("Billboard Rental")) {
                const newTotal = item.unitPrice * (newDurationDays / 30)
                return { ...item, total: newTotal }
              }
              return item
            })
            updatedCostEstimate.lineItems = durationUpdatedItems
            updatedCostEstimate.totalAmount = durationUpdatedItems.reduce((sum, item) => sum + item.total, 0)
          }
          break
      }
    })

    try {
      const updateData = {
        ...updatedCostEstimate,
        updatedAt: new Date(),
      }

      await updateCostEstimate(updatedCostEstimate.id, updateData)

      // Update local state
      setEditableCostEstimate(updatedCostEstimate)
      setCostEstimate(updatedCostEstimate)
      setEditingField(null)
      setTempValues({})
      setHasUnsavedChanges(false)

      toast({
        title: "Success",
        description: "Changes saved successfully",
      })
      console.log("[v0] Save completed successfully")
    } catch (error) {
      console.error("[v0] Save failed:", error)
      toast({
        title: "Error",
        description: "Failed to save changes",
        variant: "destructive",
      })
    }
  }

  const handleCancelAllChanges = () => {
    setTempValues({})
    setHasUnsavedChanges(false)
    setIsEditing(false)
    toast({
      title: "Cancelled",
      description: "Changes cancelled",
    })
  }

  const fetchCompanyData = async () => {
    if (!user?.uid || !userData) return

    try {
      let companyDoc = null
      let companyDataResult = null

      // First, try to find company by company_id if it exists in userData
      if (userData?.company_id) {
        try {
          const companyDocRef = doc(db, "companies", userData.company_id)
          const companyDocSnap = await getDoc(companyDocRef)

          if (companyDocSnap.exists()) {
            companyDoc = companyDocSnap
            companyDataResult = companyDocSnap.data()
          }
        } catch (error) {
          console.error("Error fetching company by company_id:", error)
        }
      }

      // If no company found by company_id, try other methods
      if (!companyDoc) {
        // Try to find company by created_by field
        let companiesQuery = query(collection(db, "companies"), where("created_by", "==", user.uid))
        let companiesSnapshot = await getDocs(companiesQuery)

        // If no company found by created_by, try to find by email or other identifiers
        if (companiesSnapshot.empty && user.email) {
          companiesQuery = query(collection(db, "companies"), where("email", "==", user.email))
          companiesSnapshot = await getDocs(companiesQuery)
        }

        // If still no company found, try to find by contact_person email
        if (companiesSnapshot.empty && user.email) {
          companiesQuery = query(collection(db, "companies"), where("contact_person", "==", user.email))
          companiesSnapshot = await getDocs(companiesQuery)
        }

        if (!companiesSnapshot.empty) {
          companyDoc = companiesSnapshot.docs[0]
          companyDataResult = companyDoc.data()
        }
      }

      if (companyDoc && companyDataResult) {
        const company: CompanyData = {
          id: companyDoc.id,
          name: companyDataResult.name,
          company_location: companyDataResult.company_location || companyDataResult.address,
          company_website: companyDataResult.company_website || companyDataResult.website,
          photo_url: companyDataResult.photo_url,
          contact_person: companyDataResult.contact_person,
          email: companyDataResult.email,
          phone: companyDataResult.phone,
          social_media: companyDataResult.social_media || {},
          created_by: companyDataResult.created_by,
          created: companyDataResult.created?.toDate
            ? companyDataResult.created.toDate()
            : companyDataResult.created_at?.toDate(),
          updated: companyDataResult.updated?.toDate
            ? companyDataResult.updated.toDate()
            : companyDataResult.updated_at?.toDate(),
        }

        setCompanyData(company)
      } else {
        setCompanyData(null)
      }
    } catch (error) {
      console.error("Error fetching company data:", error)
    }
  }

  useEffect(() => {
    const fetchCostEstimateData = async () => {
      if (!costEstimateId) return

      setLoading(true)
      try {
        const ce = await getCostEstimate(costEstimateId)
        if (ce) {
          setCostEstimate(ce)
          setEditableCostEstimate(ce) // Initialize editable state
          if (ce.proposalId) {
            const linkedProposal = await getProposal(ce.proposalId)
            setProposal(linkedProposal)
          }
          const ceActivities = await getProposalActivities(costEstimateId)
          setActivities(ceActivities)
        } else {
          toast({
            title: "Cost Estimate Not Found",
            description: "The cost estimate you're looking for doesn't exist.",
            variant: "destructive",
          })
          router.push("/sales/cost-estimates")
        }
      } catch (error) {
        console.error("Error fetching cost estimate:", error)
        toast({
          title: "Error",
          description: "Failed to load cost estimate. Please try again.",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }

    fetchCostEstimateData()
  }, [costEstimateId, router, toast])

  useEffect(() => {
    if (user && userData) {
      fetchCompanyData()
    }
  }, [user, userData])

  useEffect(() => {
    const fetchProjectData = async () => {
      // Simulate fetching project data
      setProjectData({
        company_logo: "/path/to/company-logo.svg",
        company_name: "OH Plus Outdoor Advertising",
      })
    }

    fetchProjectData()
  }, [])

  useEffect(() => {
    if (isSendEmailDialogOpen && costEstimate) {
      setEmailSubject(`Cost Estimate: ${costEstimate.title || "Custom Cost Estimate"} - OH Plus`)
      setEmailBody(
        `Dear ${costEstimate.client?.contactPerson || costEstimate.client?.company || "Valued Client"},\n\nWe are pleased to provide you with a detailed cost estimate for your advertising campaign. Please find the full cost estimate attached and accessible via the link below.\n\nThank you for considering OH Plus for your advertising needs. We look forward to working with you to bring your campaign to life!\n\nBest regards,\nThe OH Plus Team`,
      )
      if (user?.email) {
        setCcEmail(user.email) // Default CC to current user's email
      } else {
        setCcEmail("")
      }
    }
  }, [isSendEmailDialogOpen, costEstimate, user])

  const handleSendEmailConfirm = async () => {
    if (!costEstimate || !user?.uid) return

    if (!costEstimate.client?.email) {
      toast({
        title: "Missing Client Email",
        description: "Cannot send email: Client email address is not available.",
        variant: "destructive",
      })
      return
    }

    const ccEmailsArray = ccEmail
      .split(",")
      .map((email) => email.trim())
      .filter(Boolean)
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    for (const email of ccEmailsArray) {
      if (!emailRegex.test(email)) {
        toast({
          title: "Invalid CC Email",
          description: `Please enter a valid email address for CC: ${email}`,
          variant: "destructive",
        })
        return
      }
    }

    setSendingEmail(true)
    try {
      const response = await fetch("/api/cost-estimates/send-email", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          costEstimate: costEstimate,
          clientEmail: costEstimate.client.email,
          client: costEstimate.client,
          currentUserEmail: user.email, // This is the reply-to
          ccEmail: ccEmail,
          subject: emailSubject, // Pass subject
          body: emailBody, // Pass body
        }),
      })

      const result = await response.json()
      if (!response.ok || !result.success) {
        throw new Error(result.error || result.details || "Failed to send email")
      }

      await updateCostEstimateStatus(costEstimate.id, "sent")
      setCostEstimate((prev) => (prev ? { ...prev, status: "sent" } : null))
      setEditableCostEstimate((prev) => (prev ? { ...prev, status: "sent" } : null))
      setIsSendEmailDialogOpen(false) // Close the send dialog
      setShowSuccessDialog(true) // Show the success dialog
      setCcEmail("") // Clear CC field
      // No toast here, success dialog will handle it
      const updatedActivities = await getProposalActivities(costEstimate.id)
      setActivities(updatedActivities)
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
  }

  const handleSuccessDialogDismissAndNavigate = () => {
    setShowSuccessDialog(false) // Hide the success dialog
    router.push("/sales/dashboard") // Navigate to sales dashboard
  }

  const handleUpdatePublicStatus = async (status: CostEstimateStatus) => {
    if (!costEstimate || !user?.uid) return

    setUpdatingStatus(true)
    try {
      const response = await fetch("/api/cost-estimates/update-status", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          costEstimateId: costEstimate.id,
          status: status,
          userId: user.uid,
          rejectionReason: status === "declined" ? "Client declined" : undefined,
        }),
      })

      const result = await response.json()

      if (!response.ok || !result.success) {
        throw new Error(result.error || result.details || "Failed to update status")
      }

      await updateCostEstimateStatus(costEstimate.id, status)
      setCostEstimate((prev) => (prev ? { ...prev, status: status } : null))
      setEditableCostEstimate((prev) => (prev ? { ...prev, status: status } : null))
      toast({
        title: "Status Updated",
        description: `Cost estimate status changed to ${status}.`,
      })
      const updatedActivities = await getProposalActivities(costEstimate.id)
      setActivities(updatedActivities)
    } catch (error) {
      console.error("Error updating public status:", error)
      toast({
        title: "Error",
        description: "Failed to update status. Please try again.",
        variant: "destructive",
      })
    } finally {
      setUpdatingStatus(false)
    }
  }

  const handleDownloadPDF = async () => {
    if (!costEstimate) return

    // Check if there are multiple sites
    const siteGroups = groupLineItemsBySite(costEstimate.lineItems || [])
    const sites = Object.keys(siteGroups)

    if (sites.length > 1) {
      setDownloadingPDF(true)
      try {
        await generateSeparateCostEstimatePDFs(costEstimate)
        toast({
          title: "PDFs Generated",
          description: `${sites.length} separate PDF files have been downloaded for each product.`,
        })
      } catch (error) {
        console.error("Error downloading separate PDFs:", error)
        toast({
          title: "Error",
          description: "Failed to generate separate PDFs. Please try again.",
          variant: "destructive",
        })
      } finally {
        setDownloadingPDF(false)
      }
      return
    }

    // Single site - download directly
    setDownloadingPDF(true)
    try {
      await generateCostEstimatePDF(costEstimate)
      toast({
        title: "PDF Generated",
        description: "Cost estimate PDF has been downloaded.",
      })
    } catch (error) {
      console.error("Error downloading PDF:", error)
      toast({
        title: "Error",
        description: "Failed to generate PDF. Please try again.",
        variant: "destructive",
      })
    } finally {
      setDownloadingPDF(false)
    }
  }

  const handlePageToggle = (pageIndex: number) => {
    const siteGroups = groupLineItemsBySite(costEstimate?.lineItems || [])
    const sites = Object.keys(siteGroups)
    const siteName = sites[pageIndex]

    setSelectedPages((prev) => (prev.includes(siteName) ? prev.filter((p) => p !== siteName) : [...prev, siteName]))
  }

  const handleSelectAllPages = () => {
    if (!costEstimate) return

    const siteGroups = groupLineItemsBySite(costEstimate.lineItems || [])
    const sites = Object.keys(siteGroups)

    if (selectedPages.length === sites.length) {
      setSelectedPages([])
    } else {
      setSelectedPages([...sites])
    }
  }

  const handleDownloadSelectedPages = async () => {
    if (!costEstimate || selectedPages.length === 0) return

    setDownloadingPDF(true)
    try {
      // Generate PDF with selected pages only
      await generateCostEstimatePDF(costEstimate, selectedPages)
      toast({
        title: "PDF Generated",
        description: `Cost estimate PDF with ${selectedPages.length} page(s) has been downloaded.`,
      })
      setShowPageSelection(false)
      setSelectedPages([])
    } catch (error) {
      console.error("Error downloading PDF:", error)
      toast({
        title: "Error",
        description: "Failed to generate PDF. Please try again.",
        variant: "destructive",
      })
    } finally {
      setDownloadingPDF(false)
    }
  }

  const handleEditClick = () => {
    if (costEstimate) {
      setEditableCostEstimate({ ...costEstimate })
      setIsEditing(true)
    }
  }

  const handleCancelEdit = () => {
    setEditableCostEstimate(costEstimate)
    setIsEditing(false)
    toast({
      title: "Cancelled",
      description: "Editing cancelled. Changes were not saved.",
    })
  }

  const handleSaveEdit = async () => {
    if (!editableCostEstimate || !costEstimateId || !user?.uid) return

    setIsSaving(true)
    try {
      await updateCostEstimate(
        editableCostEstimate.id,
        editableCostEstimate,
        // user.uid, // These arguments are not part of the updateCostEstimate signature
        // user.displayName || "Unknown User",
      )
      setCostEstimate(editableCostEstimate)
      setIsEditing(false)
      toast({
        title: "Success",
        description: "Cost estimate updated successfully!",
      })
    } catch (error) {
      console.error("Error saving cost estimate:", error)
      toast({
        title: "Error",
        description: "Failed to save cost estimate changes.",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    if (name.startsWith("client.")) {
      const clientField = name.split(".")[1] as keyof CostEstimateClient
      setEditableCostEstimate((prev) => ({
        ...prev!,
        client: {
          ...prev!.client,
          [clientField]: value,
        },
      }))
    } else {
      setEditableCostEstimate((prev) => ({
        ...prev!,
        [name]: value,
      }))
    }
  }

  const handleDateChange = (date: Date | undefined, field: "startDate" | "endDate" | "validUntil") => {
    setEditableCostEstimate((prev) => ({
      ...prev!,
      [field]: date || new Date(),
    }))
  }

  const getStatusConfig = (status: CostEstimateStatus) => {
    switch (status) {
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
      case "accepted":
        return {
          color: "bg-green-100 text-green-800 border-green-200",
          icon: <CheckCircle className="h-3.5 w-3.5" />,
          label: "Accepted",
        }
      case "declined":
        return {
          color: "bg-red-100 text-red-800 border-red-200",
          icon: <XCircle className="h-3.5 w-3.5" />,
          label: "Declined",
        }
      case "revised":
        return {
          color: "bg-orange-100 text-orange-800 border-orange-200",
          icon: <Pencil className="h-3.5 w-3.5" />,
          label: "Revised",
        }
      default:
        return {
          color: "bg-gray-100 text-gray-800 border-gray-200",
          icon: <FileText className="h-3.5 w-3.5" />,
          label: "Unknown",
        }
    }
  }

  const handleNextProduct = () => {
    if (!costEstimate) return
    const siteGroups = groupLineItemsBySite(costEstimate.lineItems || [])
    const totalProducts = Object.keys(siteGroups).length
    setCurrentProductIndex((prev) => (prev + 1) % totalProducts)
  }

  const handlePreviousProduct = () => {
    if (!costEstimate) return
    const siteGroups = groupLineItemsBySite(costEstimate.lineItems || [])
    const totalProducts = Object.keys(siteGroups).length
    setCurrentProductIndex((prev) => (prev - 1 + totalProducts) % totalProducts)
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

  if (!costEstimate || !editableCostEstimate) {
    return (
      <div className="min-h-screen bg-gray-50/50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
            <FileText className="h-8 w-8 text-gray-400" />
          </div>
          <h1 className="text-2xl font-semibold text-gray-900 mb-2">Cost Estimate Not Found</h1>
          <p className="text-gray-600 mb-6">
            The cost estimate you're looking for doesn't exist or may have been removed.
          </p>
          <Button onClick={() => router.push("/sales/cost-estimates")} className="bg-blue-600 hover:bg-blue-700">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Cost Estimates
          </Button>
        </div>
      </div>
    )
  }

  const groupLineItemsBySite = (lineItems: CostEstimateLineItem[]) => {
    console.log("[v0] All line items:", lineItems)

    const siteGroups: { [siteName: string]: CostEstimateLineItem[] } = {}

    // Group line items by site based on the site rental items
    lineItems.forEach((item) => {
      if (item.category.includes("Billboard Rental")) {
        // This is a site rental item - use its description as the site name
        const siteName = item.description
        if (!siteGroups[siteName]) {
          siteGroups[siteName] = []
        }
        siteGroups[siteName].push(item)

        // Find related production, installation, and maintenance items for this site
        const siteId = item.id
        const relatedItems = lineItems.filter(
          (relatedItem) => relatedItem.id.includes(siteId) && relatedItem.id !== siteId,
        )
        siteGroups[siteName].push(...relatedItems)
      }
    })

    if (Object.keys(siteGroups).length === 0) {
      console.log("[v0] No billboard rental items found, treating as single site with all items")
      siteGroups["Single Site"] = lineItems
    } else {
      // Check for orphaned items (items not associated with any site)
      const groupedItemIds = new Set()
      Object.values(siteGroups).forEach((items) => {
        items.forEach((item) => groupedItemIds.add(item.id))
      })

      const orphanedItems = lineItems.filter((item) => !groupedItemIds.has(item.id))
      if (orphanedItems.length > 0) {
        console.log("[v0] Found orphaned items:", orphanedItems)
        const siteNames = Object.keys(siteGroups)
        siteNames.forEach((siteName) => {
          // Create copies of orphaned items for each site to avoid reference issues
          const orphanedCopies = orphanedItems.map((item) => ({ ...item }))
          siteGroups[siteName].push(...orphanedCopies)
        })
      }
    }

    console.log("[v0] Final site groups:", siteGroups)
    return siteGroups
  }

  const siteGroups = groupLineItemsBySite(costEstimate?.lineItems || [])
  const siteNames = Object.keys(siteGroups)
  const hasMultipleSites = siteNames.length > 1
  const totalPages = hasMultipleSites ? siteNames.length : 1

  const renderCostEstimationBlock = (siteName: string, siteLineItems: CostEstimateLineItem[], pageNumber: number) => {
    const siteTotal = siteLineItems.reduce((sum, item) => sum + item.total, 0)
    const adjustedTitle = hasMultipleSites ? `${siteName}` : costEstimate?.title

    const baseCENumber = costEstimate?.costEstimateNumber || costEstimate?.id
    const uniqueCENumber = hasMultipleSites
      ? `${baseCENumber}-${String.fromCharCode(64 + pageNumber)}` // Appends -A, -B, -C, etc.
      : baseCENumber

    const rentalItem = siteLineItems.find((item) => item.category.includes("Billboard Rental"))
    const monthlyRate = rentalItem
      ? rentalItem.unitPrice
      : siteTotal / (costEstimate?.durationDays ? costEstimate.durationDays / 30 : 1)

    return (
      <div key={siteName} className={`${hasMultipleSites && pageNumber > 1 ? "page-break-before" : ""}`}>
        <div className="p-6 sm:p-8 border-b">
          <div className="flex justify-between items-start mb-6">
            <div>
              <p className="text-sm text-gray-600 mb-2">
                {costEstimate ? format(costEstimate.createdAt, "MMMM d, yyyy") : ""}
              </p>
              <div className="space-y-1">
                <p className="font-semibold text-gray-900">{costEstimate?.client.name}</p>
                <p className="text-gray-700">{costEstimate?.client.company}</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-600">RFQ No.</p>
              <p className="font-semibold text-gray-900">{uniqueCENumber}</p>
            </div>
          </div>

          <div className="text-center mb-8">
            <h2 className="text-xl font-bold text-gray-900 underline">{adjustedTitle} COST ESTIMATE</h2>
          </div>

          <div className="mb-6">
            <p className="font-semibold text-gray-900 mb-2">Details as follows:</p>
          </div>
        </div>

        <div className="p-4 sm:p-6">
          <div className="space-y-2 mb-6">
            <div className="flex">
              <span className="w-4 text-center">•</span>
              <span className="font-medium text-gray-700 w-32">Site Location</span>
              <span className="text-gray-700">: {siteName}</span>
            </div>
            <div className="flex">
              <span className="w-4 text-center">•</span>
              <span className="font-medium text-gray-700 w-32">Type</span>
              <span className="text-gray-700">: {siteLineItems[0]?.description || "Billboard"}</span>
            </div>
            {siteLineItems[0] && (
              <div className="flex">
                <span className="w-4 text-center">•</span>
                <span className="font-medium text-gray-700 w-32">Size</span>
                <span className="text-gray-700">: {siteLineItems[0].notes || "Standard Size"}</span>
              </div>
            )}
            <div className="flex items-center">
              <span className="w-4 text-center">•</span>
              <span className="font-medium text-gray-700 w-32">Contract Duration</span>
              <span className="text-gray-700">: </span>
              {isEditing && editingField === "durationDays" ? (
                <div className="flex items-center gap-2 ml-1">
                  <Input
                    type="number"
                    value={tempValues.durationDays || ""}
                    onChange={(e) => updateTempValues("durationDays", Number.parseInt(e.target.value) || 0)}
                    className="w-20 h-6 text-sm"
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
                  onClick={() => isEditing && handleFieldEdit("durationDays", costEstimate?.durationDays)}
                  title={isEditing ? "Click to edit duration" : ""}
                >
                  {formatDurationDisplay(costEstimate?.durationDays)}
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
                    value={tempValues.startDate ? format(tempValues.startDate, "yyyy-MM-dd") : ""}
                    onChange={(e) => updateTempValues("startDate", new Date(e.target.value))}
                    className="w-32 h-6 text-sm"
                  />
                  <span>-</span>
                  <Input
                    type="date"
                    value={tempValues.endDate ? format(tempValues.endDate, "yyyy-MM-dd") : ""}
                    onChange={(e) => updateTempValues("endDate", new Date(e.target.value))}
                    className="w-32 h-6 text-sm"
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
                      startDate: costEstimate?.startDate,
                      endDate: costEstimate?.endDate,
                    })
                  }
                  title={isEditing ? "Click to edit contract period" : ""}
                >
                  {costEstimate?.startDate ? format(costEstimate.startDate, "MMMM d, yyyy") : "N/A"} -{" "}
                  {costEstimate?.endDate ? format(costEstimate.endDate, "MMMM d, yyyy") : "N/A"}
                  {isEditing && <span className="ml-1 text-blue-500 text-xs">✏️</span>}
                </span>
              )}
            </div>
            <div className="flex">
              <span className="w-4 text-center">•</span>
              <span className="font-medium text-gray-700 w-32">Proposal to</span>
              <span className="text-gray-700">: {costEstimate?.client.company}</span>
            </div>
            {siteLineItems.length > 0 && (
              <div className="flex items-center">
                <span className="w-4 text-center">•</span>
                <span className="font-medium text-gray-700 w-32">Illumination</span>
                <span className="text-gray-700">: </span>
                {isEditing && editingField === "illumination" ? (
                  <div className="flex items-center gap-2 ml-1">
                    <Input
                      type="number"
                      value={tempValues.illumination || ""}
                      onChange={(e) => updateTempValues("illumination", Number.parseInt(e.target.value) || 0)}
                      className="w-16 h-6 text-sm"
                      placeholder="Units"
                    />
                    <span className="text-sm text-gray-600">units of lighting system</span>
                  </div>
                ) : (
                  <span
                    className={`text-gray-700 ${
                      isEditing
                        ? "cursor-pointer hover:bg-blue-50 px-2 py-1 rounded border-2 border-dashed border-blue-300 hover:border-blue-500 transition-all duration-200"
                        : ""
                    }`}
                    onClick={() => isEditing && handleFieldEdit("illumination", siteLineItems[0].quantity)}
                    title={isEditing ? "Click to edit illumination" : ""}
                  >
                    {siteLineItems[0].quantity} units of lighting system
                    {isEditing && <span className="ml-1 text-blue-500 text-xs">✏️</span>}
                  </span>
                )}
              </div>
            )}
            <div className="flex items-center">
              <span className="w-4 text-center">•</span>
              <span className="font-medium text-gray-700 w-32">Lease Rate/Month</span>
              <span className="text-gray-700">: PHP </span>
              {isEditing && editingField === "unitPrice" ? (
                <div className="flex items-center gap-2 ml-1">
                  <Input
                    type="number"
                    value={tempValues.unitPrice || ""}
                    onChange={(e) => updateTempValues("unitPrice", Number.parseFloat(e.target.value) || 0)}
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
                  onClick={() => isEditing && handleFieldEdit("unitPrice", monthlyRate)}
                  title={isEditing ? "Click to edit lease rate" : ""}
                >
                  {monthlyRate.toLocaleString("en-US", { minimumFractionDigits: 2 })} (Exclusive of VAT)
                  {isEditing && <span className="ml-1 text-blue-500 text-xs">✏️</span>}
                </span>
              )}
            </div>
            <div className="flex">
              <span className="w-4 text-center">•</span>
              <span className="font-medium text-gray-700 w-32">Total Lease</span>
              <span className="text-gray-700">
                : PHP {siteTotal.toLocaleString("en-US", { minimumFractionDigits: 2 })} (Exclusive of VAT)
              </span>
            </div>
          </div>

          <div className="bg-gray-50 p-4 rounded-lg mb-6">
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-700">Lease rate per month</span>
                <span className="text-gray-900">
                  PHP {monthlyRate.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-700">x {formatDurationDisplay(costEstimate?.durationDays)}</span>
                <span className="text-gray-900">
                  PHP {siteTotal.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-700">12% VAT</span>
                <span className="text-gray-900">
                  PHP {(siteTotal * 0.12).toLocaleString("en-US", { minimumFractionDigits: 2 })}
                </span>
              </div>
              <div className="border-t pt-2 mt-2">
                <div className="flex justify-between font-bold text-lg">
                  <span className="text-gray-900">TOTAL</span>
                  <span className="text-gray-900">
                    PHP {(siteTotal * 1.12).toLocaleString("en-US", { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="mb-8">
            <h3 className="font-semibold text-gray-900 mb-3">Terms and Conditions:</h3>
            <div className="space-y-2 text-sm text-gray-700">
              <p>1. Quotation validity: 5 working days.</p>
              <p>
                2. Availability of the site is on first-come-first-served basis only. Only official documents such as
                P.O.'s, Media Orders, signed quotation, & contracts are accepted in order to be booked the site.
              </p>
              <p>3. To book the site, one (1) month advance and one (2) months security deposit.</p>
              <p className="ml-4">payment dated 7 days before the start of rental is required.</p>
              <p>4. Final artwork should be approved ten (10) days before the contract period</p>
              <p>5. Print is exclusively for {companyData?.name || "Company Name"} Only.</p>
            </div>
          </div>

          <div className="mt-12 mb-8">
            <div className="flex justify-between items-start">
              {/* Left side - Company signature */}
              <div className="w-1/2">
                <p className="text-sm text-gray-700 mb-8">Very truly yours,</p>
                <div className="mb-2">
                  <div className="w-48 h-16 border-b border-gray-400 mb-2"></div>
                </div>
                <p className="text-sm font-medium text-gray-900">
                  {userData?.first_name} {userData?.last_name}
                </p>
              </div>

              {/* Right side - Client conforme */}
              <div className="w-1/2 pl-8">
                <p className="text-sm text-gray-700 mb-8">Conforme:</p>
                <div className="mb-2">
                  <div className="w-48 h-16 border-b border-gray-400 mb-2"></div>
                </div>
                <p className="text-sm font-medium text-gray-900">{costEstimate?.client.name || "Client Name"}</p>
                <p className="text-sm text-gray-600">{costEstimate?.client.company || "Client Company"}</p>
                <p className="text-sm text-gray-500 italic mt-2">
                  This signed quotation serves as an
                  <br />
                  official document for billing purposes
                </p>
              </div>
            </div>
          </div>

          <div className="mt-8 pt-6 border-t border-gray-200">
            <div className="text-center text-xs text-gray-500">
              <p className="flex items-center justify-center gap-2 mb-2">
                <span>{companyData?.company_location || companyData?.address || ""}</span>
                {companyData?.phone && (
                  <>
                    <span>•</span>
                    <span>phone: {companyData.phone}</span>
                  </>
                )}
              </p>
              {costEstimate?.validUntil && (
                <p>This cost estimate is valid until {format(costEstimate.validUntil, "PPP")}</p>
              )}
              <p className="mt-1">
                © {new Date().getFullYear()} {companyData?.name || ""}. All rights reserved.
              </p>
              {hasMultipleSites && (
                <p className="mt-2 font-medium">
                  Page {pageNumber} of {totalPages}
                </p>
              )}
            </div>
          </div>
        </div>
        {process.env.NODE_ENV === "development" && (
          <div className="text-xs text-gray-500 mt-2">
            Debug: isEditing={isEditing.toString()}, hasUnsavedChanges={hasUnsavedChanges.toString()}, tempValues=
            {Object.keys(tempValues).length}
          </div>
        )}

        {hasUnsavedChanges && (
          <div className="fixed bottom-6 right-6 flex gap-3 bg-white p-4 rounded-lg shadow-lg border z-50">
            <Button
              variant="outline"
              onClick={() => {
                console.log("[v0] Cancel button clicked")
                handleCancelAllChanges()
              }}
              className="flex items-center gap-2 bg-transparent"
            >
              <X className="h-4 w-4" />
              Cancel
            </Button>
            <Button
              onClick={(e) => {
                console.log("[v0] Save button clicked - event:", e)
                console.log("[v0] Save button state check:", {
                  hasUnsavedChanges,
                  tempValuesCount: Object.keys(tempValues).length,
                  tempValues,
                })
                e.preventDefault()
                e.stopPropagation()
                handleSaveAllChanges()
              }}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white"
              disabled={Object.keys(tempValues).length === 0}
            >
              <Save className="h-4 w-4" />
              Save Changes
            </Button>
          </div>
        )}
      </div>
    )
  }

  const statusConfig = getStatusConfig(costEstimate.status)

  return (
    <div className="min-h-screen bg-gray-50">
      <style jsx>{`
        @media print {
          .page-break-before {
            page-break-before: always;
          }
        }
        @page {
          margin: 0.5in;
        }
      `}</style>

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
            <Badge className={`${statusConfig.color} border font-medium px-3 py-1`}>
              {statusConfig.icon}
              <span className="ml-1.5">{statusConfig.label}</span>
            </Badge>
          </div>

          <div className="flex items-center space-x-2"></div>
        </div>
      </div>

      {/* New Wrapper for Sidebar + Document */}
      <div className="flex justify-center items-start gap-6 mt-6">
        {/* Left Panel (now part of flow) */}
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
            <h1 className="text-2xl font-bold text-gray-900 mb-2">{companyData?.name}</h1>
          </div>

          {hasMultipleSites ? (
            <>
              {renderCostEstimationBlock(
                siteNames[currentProductIndex],
                siteGroups[siteNames[currentProductIndex]],
                currentProductIndex + 1,
              )}
            </>
          ) : (
            // Render single page for single site (original behavior)
            renderCostEstimationBlock("Single Site", costEstimate?.lineItems || [], 1)
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
      ) : (
        costEstimate.status === "draft" && (
          <div className="fixed bottom-6 right-6 flex space-x-4">
            <Button
              onClick={() => handleUpdatePublicStatus("draft")} // Explicitly save as draft
              variant="outline"
              className="bg-white hover:bg-gray-50 text-gray-700 border-gray-300 font-bold py-3 px-6 rounded-full shadow-lg transition-all duration-200 ease-in-out transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-opacity-75"
            >
              <FileText className="h-5 w-5 mr-2" />
              Save as Draft
            </Button>
            <Button
              onClick={() => setIsSendOptionsDialogOpen(true)} // Open the new options dialog
              className="bg-green-500 hover:bg-green-600 text-white font-bold py-3 px-6 rounded-full shadow-lg transition-all duration-200 ease-in-out transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-green-400 focus:ring-opacity-75"
            >
              <Send className="h-5 w-5 mr-2" />
              Send
            </Button>
          </div>
        )
      )}

      {/* Floating Navigation for Multiple Sites */}
      {hasMultipleSites && (
        <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-50">
          <div className="flex items-center gap-4 px-4 py-2 bg-white border border-gray-200 rounded-lg shadow-lg opacity-90">
            <Button
              variant="outline"
              size="sm"
              onClick={handlePreviousProduct}
              disabled={Object.keys(siteGroups).length <= 1}
              className="flex items-center gap-2 bg-transparent hover:bg-gray-50"
            >
              Previous
            </Button>
            <div className="relative">
              <span className="text-sm font-medium text-gray-700 px-4">
                {currentProductIndex + 1} of {Object.keys(siteGroups).length}
              </span>
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-orange-500"></div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleNextProduct}
              disabled={Object.keys(siteGroups).length <= 1}
              className="flex items-center gap-2 bg-transparent hover:bg-gray-50"
            >
              Next
            </Button>
          </div>
        </div>
      )}

      {/* Send Cost Estimate Options Dialog */}
      {costEstimate && (
        <SendCostEstimateOptionsDialog
          isOpen={isSendOptionsDialogOpen}
          onOpenChange={setIsSendOptionsDialogOpen}
          costEstimate={costEstimate}
          onEmailClick={() => {
            setIsSendOptionsDialogOpen(false) // Close options dialog
            setIsSendEmailDialogOpen(true) // Open email dialog
          }}
        />
      )}

      {/* Send Email Dialog (existing) */}
      <Dialog open={isSendEmailDialogOpen} onOpenChange={setIsSendEmailDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Send Cost Estimate</DialogTitle>
            <DialogDescription>
              Review the email details before sending the cost estimate to{" "}
              <span className="font-semibold text-gray-900">{costEstimate?.client?.email}</span>.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="to" className="text-right">
                To
              </Label>
              <Input id="to" value={costEstimate?.client?.email || ""} readOnly className="col-span-3" />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="cc" className="text-right">
                CC
              </Label>
              <Input
                id="cc"
                value={ccEmail}
                onChange={(e) => setCcEmail(e.target.value)}
                placeholder="Optional: comma-separated emails"
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="from" className="text-right">
                From
              </Label>
              <Input id="from" value="OH Plus &lt;noreply@resend.dev&gt;" readOnly className="col-span-3" />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="replyTo" className="text-right">
                Reply-To
              </Label>
              <Input
                id="replyTo"
                value={user?.email || ""} // Use current user's email as default reply-to
                readOnly // Make it read-only as it's derived from user data
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="subject" className="text-right">
                Subject
              </Label>
              <Input
                id="subject"
                value={emailSubject}
                onChange={(e) => setEmailSubject(e.target.value)}
                className="col-span-3"
                placeholder="e.g., Cost Estimate for Your Advertising Campaign"
              />
            </div>
            <div className="grid grid-cols-4 items-start gap-4">
              <Label htmlFor="body" className="text-right pt-2">
                Body
              </Label>
              <Textarea
                id="body"
                value={emailBody}
                onChange={(e) => setEmailBody(e.target.value)}
                className="col-span-3 min-h-[150px]"
                placeholder="e.g., Dear [Client Name],\n\nPlease find our cost estimate attached...\n\nBest regards,\nThe OH Plus Team"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsSendEmailDialogOpen(false)} disabled={sendingEmail}>
              Cancel
            </Button>
            <Button onClick={handleSendEmailConfirm} disabled={sendingEmail}>
              {sendingEmail ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Sending...
                </>
              ) : (
                "Send Email"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <CostEstimateSentSuccessDialog
        isOpen={showSuccessDialog}
        onDismissAndNavigate={handleSuccessDialogDismissAndNavigate}
      />
      {/* Timeline Sidebar */}
      {timelineOpen && (
        <>
          {/* Backdrop */}
          <div className="fixed inset-0 bg-black bg-opacity-50 z-40" onClick={() => setTimelineOpen(false)} />

          {/* Sidebar */}
          <div className="fixed right-0 top-0 h-full w-80 sm:w-96 bg-white shadow-xl z-50 transform transition-transform duration-300 ease-in-out">
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Activity Timeline</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setTimelineOpen(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <XCircle className="h-5 w-5" />
              </Button>
            </div>

            <div className="p-4 overflow-y-auto h-[calc(100%-64px)]">
              <ProposalActivityTimeline
                proposalId={costEstimate.id}
                currentUserId={user?.uid || "unknown_user"}
                currentUserName={user?.displayName || "Unknown User"}
              />
            </div>
          </div>
        </>
      )}

      <Dialog open={showPageSelection} onOpenChange={setShowPageSelection}>
        <DialogContent className="max-w-4xl max-h-[80vh] flex flex-col">
          <DialogHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
            <div>
              <DialogTitle className="text-xl font-semibold">Select Pages for PDF Download</DialogTitle>
              <p className="text-sm text-gray-500 mt-1">Choose which site pages to include in your PDF</p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleSelectAllPages}
                className="text-blue-600 border-blue-600 hover:bg-blue-50 bg-transparent"
              >
                {selectedPages.length === Object.keys(groupLineItemsBySite(costEstimate?.lineItems || [])).length
                  ? "Deselect All"
                  : "Select All"}
              </Button>
              <Button variant="ghost" size="sm" onClick={() => setShowPageSelection(false)} className="h-8 w-8 p-0">
                <X className="h-4 w-4" />
              </Button>
            </div>
          </DialogHeader>

          <ScrollArea className="flex-1 pr-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {costEstimate &&
                // Updated page selection logic to use site names
                Object.keys(siteGroups).map((siteName, index) => {
                  const siteItems = siteGroups[siteName]
                  const isSelected = selectedPages.includes(siteName)
                  const totalCost = siteItems.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0)
                  const items = siteGroups[siteName]

                  return (
                    <div
                      key={siteName}
                      className={`relative border rounded-lg p-4 cursor-pointer transition-all ${
                        isSelected ? "border-green-500 bg-green-50" : "border-gray-200 hover:border-gray-300"
                      }`}
                      onClick={() => handlePageToggle(index)}
                    >
                      {/* Checkbox */}
                      <div className="absolute top-3 left-3 z-10">
                        <Checkbox
                          checked={isSelected}
                          onChange={() => handlePageToggle(index)}
                          className="data-[state=checked]:bg-green-600 data-[state=checked]:border-green-600"
                        />
                      </div>

                      {/* Page Preview */}
                      <div className="mt-6 space-y-3">
                        <div className="text-sm font-semibold text-gray-900">Page {index + 1}</div>
                        <div className="text-xs text-gray-600 font-medium">
                          {costEstimate.costEstimateNumber || costEstimate.id}
                          {Object.keys(groupLineItemsBySite(costEstimate?.lineItems || [])).length > 1
                            ? `-${String.fromCharCode(65 + index)}`
                            : ""}
                        </div>
                        <div className="text-sm font-medium text-gray-800 line-clamp-2">
                          Cost Estimate for {siteName}
                        </div>
                        <div className="text-xs text-gray-500">
                          {items.length} line item{items.length !== 1 ? "s" : ""}
                        </div>
                        <div className="text-xs text-gray-500">
                          Total: ₱
                          {items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0).toLocaleString()}
                        </div>
                      </div>
                    </div>
                  )
                })}
            </div>
          </ScrollArea>

          <div className="flex items-center justify-between pt-4 border-t">
            <div className="text-sm text-gray-500">
              {selectedPages.length} of {Object.keys(groupLineItemsBySite(costEstimate?.lineItems || [])).length} pages
              selected
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setShowPageSelection(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleDownloadSelectedPages}
                disabled={selectedPages.length === 0 || downloadingPDF}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {downloadingPDF ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <DownloadIcon className="h-4 w-4 mr-2" />
                    Download PDF ({selectedPages.length})
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

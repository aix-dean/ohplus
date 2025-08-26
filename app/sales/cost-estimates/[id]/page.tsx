"use client"

import type React from "react"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { useToast } from "@/hooks/use-toast"
import {
  getCostEstimate,
  updateCostEstimateStatus,
  updateCostEstimate,
  getCostEstimatesByPageId, // Import new function
} from "@/lib/cost-estimate-service"
import type {
  CostEstimate,
  CostEstimateClient,
  CostEstimateStatus,
  CostEstimateLineItem,
} from "@/lib/types/cost-estimate"
import { format } from "date-fns"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Send, CheckCircle, XCircle, FileText, Pencil, Save, X } from "lucide-react"
import { getProposal } from "@/lib/proposal-service"
import type { Proposal } from "@/lib/types/proposal"
import { getProposalActivities } from "@/lib/proposal-activity-service"
import type { ProposalActivity } from "@/lib/types/proposal-activity"
import { generateCostEstimatePDF, generateSeparateCostEstimatePDFs } from "@/lib/cost-estimate-pdf-service"
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

export default function CostEstimatePage({ params }: { params: { id: string } }) {
  const { id: costEstimateId } = params
  const router = useRouter()
  const { user, userData } = useAuth()

  const { toast } = useToast()

  const [costEstimate, setCostEstimate] = useState<CostEstimate | null>(null)
  const [editableCostEstimate, setEditableCostEstimate] = useState<CostEstimate | null>(null)
  const [relatedCostEstimates, setRelatedCostEstimates] = useState<CostEstimate[]>([])
  const [currentPageIndex, setCurrentPageIndex] = useState(0)
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
      currentProductIndex,
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

    const siteGroups = groupLineItemsBySite(updatedCostEstimate.lineItems || [])
    const siteNames = Object.keys(siteGroups)
    const currentSiteName = siteNames[currentProductIndex]
    const currentSiteItems = siteGroups[currentSiteName] || []

    console.log("[v0] Editing site:", currentSiteName, "with items:", currentSiteItems.length)

    const currentSiteRentalItem = currentSiteItems.find((item) => item.category.includes("Billboard Rental"))
    const currentSiteId = currentSiteRentalItem?.id

    // Apply all temp values to the cost estimate - but only for current site
    Object.entries(tempValues).forEach(([fieldName, newValue]) => {
      switch (fieldName) {
        case "unitPrice":
          const updatedLineItems = updatedCostEstimate.lineItems.map((item) => {
            const belongsToCurrentSite = currentSiteItems.some((siteItem) => siteItem.id === item.id)
            if (belongsToCurrentSite && item.category.includes("Billboard Rental")) {
              const newTotal = newValue * (updatedCostEstimate.durationDays ? updatedCostEstimate.durationDays / 30 : 1)
              console.log("[v0] Updating price for item:", item.id, "from", item.unitPrice, "to", newValue)
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
            const belongsToCurrentSite = currentSiteItems.some((siteItem) => siteItem.id === item.id)
            if (belongsToCurrentSite && item.category.includes("Billboard Rental")) {
              const newTotal = item.unitPrice * (newValue / 30)
              console.log("[v0] Updating duration for item:", item.id, "new total:", newTotal)
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
          const illuminationUpdatedItems = updatedCostEstimate.lineItems.map((item) => {
            const belongsToCurrentSite = currentSiteItems.some((siteItem) => siteItem.id === item.id)
            if (belongsToCurrentSite) {
              console.log("[v0] Updating illumination for item:", item.id, "from", item.quantity, "to", newValue)
              return { ...item, quantity: newValue }
            }
            return item
          })
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
              const belongsToCurrentSite = currentSiteItems.some((siteItem) => siteItem.id === item.id)
              if (belongsToCurrentSite && item.category.includes("Billboard Rental")) {
                const newTotal = item.unitPrice * (newDurationDays / 30)
                console.log("[v0] Updating date-based duration for item:", item.id, "new total:", newTotal)
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

      setEditableCostEstimate(updatedCostEstimate)
      setCostEstimate(updatedCostEstimate)
      setEditingField(null)
      setTempValues({})
      setHasUnsavedChanges(false)
      setIsEditing(false) // Added missing setIsEditing(false) to disable edit mode

      toast({
        title: "Success",
        description: `Changes saved successfully for ${currentSiteName}`,
      })
      console.log("[v0] Save completed successfully for site:", currentSiteName)
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
          setEditableCostEstimate(ce)

          console.log("[v0] Current cost estimate page_id:", ce.page_id)

          if (ce.page_id) {
            const relatedCEs = await getCostEstimatesByPageId(ce.page_id)
            console.log("[v0] Related cost estimates found:", relatedCEs.length, relatedCEs)
            setRelatedCostEstimates(relatedCEs)
            // Find current page index
            const currentIndex = relatedCEs.findIndex((rce) => rce.id === ce.id)
            console.log("[v0] Current page index:", currentIndex)
            setCurrentPageIndex(currentIndex >= 0 ? currentIndex : 0)
          } else {
            console.log("[v0] No page_id found for this cost estimate")
          }

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
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+\$/
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

    const userDataForPDF = userData
      ? {
          first_name: userData.first_name || "",
          last_name: userData.last_name || "",
          email: userData.email || "",
        }
      : undefined

    if (sites.length > 1) {
      setDownloadingPDF(true)
      try {
        await generateSeparateCostEstimatePDFs(costEstimate, undefined, userDataForPDF)
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
      await generateCostEstimatePDF(costEstimate, undefined, false, userDataForPDF)
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

    const userDataForPDF = userData
      ? {
          first_name: userData.first_name || "",
          last_name: userData.last_name || "",
          email: userData.email || "",
        }
      : undefined

    setDownloadingPDF(true)
    try {
      await generateCostEstimatePDF(costEstimate, selectedPages, false, userDataForPDF)
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

  const handlePreviousPage = () => {
    if (currentPageIndex > 0) {
      const prevCostEstimate = relatedCostEstimates[currentPageIndex - 1]
      setCostEstimate(prevCostEstimate)
      setEditableCostEstimate(prevCostEstimate)
      setCurrentPageIndex(currentPageIndex - 1)
    }
  }

  const handleNextPage = () => {
    if (currentPageIndex < relatedCostEstimates.length - 1) {
      const nextCostEstimate = relatedCostEstimates[currentPageIndex + 1]
      setCostEstimate(nextCostEstimate)
      setEditableCostEstimate(nextCostEstimate)
      setCurrentPageIndex(currentPageIndex + 1)
    }
  }

  const handlePageSelect = (pageIndex: number) => {
    const selectedCostEstimate = relatedCostEstimates[pageIndex]
    setCostEstimate(selectedCostEstimate)
    setEditableCostEstimate(selectedCostEstimate)
    setCurrentPageIndex(pageIndex)
  }

  const groupLineItemsBySite = (lineItems: CostEstimateLineItem[]) => {
    return lineItems.reduce((acc: { [key: string]: CostEstimateLineItem[] }, item) => {
      const siteName = item.site || "Unknown Site"
      if (!acc[siteName]) {
        acc[siteName] = []
      }
      acc[siteName].push(item)
      return acc
    }, {})
  }

  const hasMultipleSites = Object.keys(groupLineItemsBySite(costEstimate?.lineItems || [])).length > 1
  const siteGroups = groupLineItemsBySite(costEstimate?.lineItems || [])
  const siteNames = Object.keys(siteGroups)
  const totalPages = siteNames.length

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

          <div className="mb-6 p-4 text-center">
            <p className="text-gray-800 font-medium">
              Good Day! Thank you for considering Golden Touch for your business needs. We are pleased to submit our
              quotation for your requirements:
            </p>
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
                <p className="text-sm text-gray-600">Account Manager</p>
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
    <>
      <style jsx global>{`
        @media print {
          .page-break {
            page-break-before: always;
          }
        }
        @page {
          margin: 0.5in;
        }
      `}</style>
      <div className="container max-w-5xl mx-auto py-12">
        <Button variant="ghost" onClick={() => router.back()} className="mb-4">
          ← Back
        </Button>
        <div className="grid grid-cols-1 gap-6">
          {/* Main content area */}
          <div className="col-span-1">
            {/* Cost Estimate Details */}
            {loading ? (
              <div>Loading cost estimate...</div>
            ) : costEstimate ? (
              <>
                {/* Header Section */}
                <div className="flex justify-between items-center mb-4">
                  <div>
                    <h1 className="text-2xl font-bold text-gray-900">{costEstimate.title}</h1>
                    <p className="text-sm text-gray-600">
                      Created on {costEstimate ? format(costEstimate.createdAt, "MMMM d, yyyy") : ""}
                    </p>
                  </div>
                  {companyData?.photo_url ? (
                    <div className="flex items-center space-x-4">
                      <img
                        src={companyData.photo_url || "/placeholder.svg"}
                        alt="Company Logo"
                        className="w-20 h-auto rounded-md shadow-md"
                      />
                    </div>
                  ) : (
                    <div className="flex items-center space-x-4">
                      <div className="w-20 h-20 bg-gray-200 rounded-md flex items-center justify-center">
                        <span className="text-gray-500">No Logo</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Render Cost Estimation Block */}
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

                {/* Linked Proposal Section */}
                {proposal && (
                  <div className="mt-8 p-4 bg-gray-50 rounded-lg border">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-semibold text-gray-900">Linked Proposal</h3>
                        <p className="text-sm text-gray-600">
                          {proposal.title} - Created on {format(proposal.createdAt, "PPP")} by {proposal.createdBy}
                        </p>
                      </div>
                      <div>
                        <Button asChild>
                          <a href={`/sales/proposals/${proposal.id}`} target="_blank" rel="noopener noreferrer">
                            View Proposal
                          </a>
                        </Button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Edit Mode Indicator */}
                {isEditing && (
                  <div className="fixed top-6 right-6 bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-2 rounded-md shadow-md z-50">
                    <div className="flex items-center gap-2">
                      <Pencil className="h-4 w-4" />
                      <span>Edit Mode Active</span>
                    </div>
                    <p className="text-sm mt-1">Click on highlighted fields to edit them</p>
                  </div>
                )}

                {/* Edit and Save Buttons */}
                {isEditing ? (
                  <div className="fixed bottom-6 left-6 flex gap-3 bg-white p-4 rounded-lg shadow-lg border z-50">
                    <Button variant="outline" onClick={handleCancelEdit}>
                      Cancel
                    </Button>
                    {isSaving ? (
                      <Button disabled>
                        <div className="flex items-center gap-2">
                          <svg className="animate-spin h-4 w-4 mr-2" viewBox="0 0 24 24">
                            <path
                              fill="currentColor"
                              d="M12 4V2a1 1 0 0 1 1-1h0a1 1 0 0 1 1 1v2a1 1 0 0 1-1 1h-2a1 1 0 0 1-1-1zm5.37 2.59a1 1 0 0 1 1.44 1.22l-1.4 2.43a10 10 0 1 1-8.34-8.34l2.43-1.4a1 1 0 0 1 1.22 1.44l-2.43 1.4a10 10 0 0 0 8.34 8.34l1.4-2.43z"
                            />
                          </svg>
                          Saving...
                        </div>
                      </Button>
                    ) : (
                      <Button onClick={handleSaveEdit}>
                        <div className="flex items-center gap-2">
                          <Save className="h-4 w-4" />
                          Save Changes
                        </div>
                      </Button>
                    )}
                  </div>
                ) : null}

                {/* Page Navigation */}
                {relatedCostEstimates.length > 1 && (
                  <div className="flex justify-between items-center mt-8">
                    <Button
                      variant="outline"
                      onClick={handlePreviousPage}
                      disabled={currentPageIndex === 0}
                      className="flex items-center gap-2 bg-transparent"
                    >
                      <Send className="w-4 h-4 rotate-180" />
                      Previous
                    </Button>
                    <span className="text-sm text-gray-600">
                      Page {currentPageIndex + 1} of {relatedCostEstimates.length}
                    </span>
                    <Button
                      variant="outline"
                      onClick={handleNextPage}
                      disabled={currentPageIndex === relatedCostEstimates.length - 1}
                      className="flex items-center gap-2 bg-transparent"
                    >
                      {currentPageIndex === relatedCostEstimates.length - 1 ? Send : "Next"}
                      <Send className="w-4 h-4" />
                    </Button>
                  </div>
                )}

                {/* Product Navigation */}
                {hasMultipleSites && relatedCostEstimates.length <= 1 && (
                  <div className="flex justify-between items-center mt-8">
                    <Button
                      variant="outline"
                      onClick={handlePreviousProduct}
                      disabled={currentProductIndex === 0}
                      className="flex items-center gap-2 bg-transparent"
                    >
                      <Send className="w-4 h-4 rotate-180" />
                      Previous
                    </Button>
                    <span className="text-sm text-gray-600">
                      Page {currentProductIndex + 1} of {Object.keys(siteGroups).length}
                    </span>
                    <Button
                      variant="outline"
                      onClick={handleNextProduct}
                      disabled={currentProductIndex === Object.keys(siteGroups).length - 1}
                      className="flex items-center gap-2 bg-transparent"
                    >
                      Next
                      <Send className="w-4 h-4" />
                    </Button>
                  </div>
                )}

                {/* Action Buttons */}
                {costEstimate && (
                  <div className="mt-8 flex justify-end gap-4">
                    <Button onClick={() => setIsSendEmailDialogOpen(true)} className="flex items-center gap-2">
                      <Send className="w-4 h-4" />
                      Send Cost Estimate
                    </Button>
                  </div>
                )}
              </>
            ) : (
              <div>Cost estimate not found.</div>
            )}
          </div>
        </div>
      </div>

      {/* Send Email Dialog */}
      {isSendEmailDialogOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold mb-4">Send Cost Estimate</h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">To</label>
                <div className="text-sm text-gray-600">{costEstimate?.client?.email}</div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">CC</label>
                <Input
                  type="email"
                  value={ccEmail}
                  onChange={(e) => setCcEmail(e.target.value)}
                  placeholder="Enter CC email addresses (comma separated)"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">From</label>
                <div className="text-sm text-gray-600">{user?.email}</div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Reply-To</label>
                <div className="text-sm text-gray-600">{user?.email}</div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Subject</label>
                <Input type="text" value={emailSubject} onChange={(e) => setEmailSubject(e.target.value)} />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Body</label>
                <textarea
                  className="w-full p-2 border border-gray-300 rounded-md resize-none"
                  rows={6}
                  value={emailBody}
                  onChange={(e) => setEmailBody(e.target.value)}
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <Button variant="outline" onClick={() => setIsSendEmailDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleSendEmailConfirm} disabled={sendingEmail}>
                {sendingEmail ? (
                  <div className="flex items-center gap-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Sending...
                  </div>
                ) : (
                  "Send Email"
                )}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Success Dialog */}
      {showSuccessDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4 text-center">
            <div className="mb-4">
              <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-2" />
              <h3 className="text-lg font-semibold">Email Sent Successfully!</h3>
            </div>
            <p className="text-gray-600 mb-6">The cost estimate has been successfully sent to the client.</p>
            <Button onClick={handleSuccessDialogDismissAndNavigate} className="w-full">
              Dismiss and Go to Dashboard
            </Button>
          </div>
        </div>
      )}

      {/* Timeline Dialog */}
      {timelineOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl mx-4">
            <h3 className="text-lg font-semibold mb-4">Activity Timeline</h3>
            <Button variant="outline" onClick={() => setTimelineOpen(false)}>
              Close
            </Button>
          </div>
        </div>
      )}

      {/* Page Selection Dialog */}
      {showPageSelection && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl mx-4">
            <h3 className="text-lg font-semibold mb-2">Select Pages for PDF Download</h3>
            <p className="text-gray-600 mb-4">Choose which site pages to include in your PDF</p>

            <Button variant="outline" onClick={handleSelectAllPages} className="mb-4 bg-transparent">
              {selectedPages.length === Object.keys(groupLineItemsBySite(costEstimate?.lineItems || [])).length
                ? "Deselect All"
                : "Select All"}
            </Button>

            <div className="space-y-3 max-h-60 overflow-y-auto">
              {costEstimate &&
                Object.keys(siteGroups).map((siteName, index) => {
                  const siteItems = siteGroups[siteName]
                  const isSelected = selectedPages.includes(siteName)
                  const items = siteGroups[siteName]

                  return (
                    <div
                      key={siteName}
                      className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                        isSelected ? "border-blue-500 bg-blue-50" : "border-gray-200 hover:border-gray-300"
                      }`}
                      onClick={() => handlePageToggle(index)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => handlePageToggle(index)}
                            className="rounded"
                          />
                          <div>
                            <div className="font-medium">
                              Page {index + 1} - {costEstimate.costEstimateNumber || costEstimate.id}
                              {Object.keys(groupLineItemsBySite(costEstimate?.lineItems || [])).length > 1
                                ? `-${String.fromCharCode(65 + index)}`
                                : ""}
                            </div>
                            <div className="text-sm text-gray-600">Cost Estimate for {siteName}</div>
                            <div className="text-sm text-gray-500">
                              {items.length} line item{items.length !== 1 ? "s" : ""} • Total: ₱
                              {items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0).toLocaleString()}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                })}
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <Button variant="outline" onClick={() => setShowPageSelection(false)}>
                Cancel
              </Button>
              <Button onClick={handleDownloadSelectedPages} disabled={downloadingPDF || selectedPages.length === 0}>
                {downloadingPDF ? (
                  <div className="flex items-center gap-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Generating PDF...
                  </div>
                ) : (
                  "Download Selected Pages"
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

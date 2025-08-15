"use client"

import type React from "react"
import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { useToast } from "@/hooks/use-toast"
import { getCostEstimate, updateCostEstimateStatus, updateCostEstimate } from "@/lib/cost-estimate-service"
import type { CostEstimate, CostEstimateClient, CostEstimateStatus } from "@/lib/types/cost-estimate"
import { format } from "date-fns"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"
import {
  ArrowLeft,
  DownloadIcon,
  Send,
  CheckCircle,
  XCircle,
  FileText,
  Loader2,
  Pencil,
  ChevronLeft,
  ChevronRight,
} from "lucide-react"
import type { Proposal } from "@/lib/types/proposal"
import { getProposalActivities } from "@/lib/proposal-activity-service"
import type { ProposalActivity } from "@/lib/types/proposal-activity"
import { generateCostEstimatePDF } from "@/lib/pdf-service" // Import the new PDF generation function
import { getCostEstimatesByBatchId } from "@/lib/cost-estimate-service"

// Helper function to generate QR code URL
const generateQRCodeUrl = (costEstimateId: string) => {
  const costEstimateViewUrl = `${process.env.NEXT_PUBLIC_APP_URL}/cost-estimates/view/${costEstimateId}`
  return `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(costEstimateViewUrl)}`
}

export default function CostEstimateDetailsPage() {
  const params = useParams()
  const router = useRouter()
  const { user } = useAuth()

  const { toast } = useToast()

  const [costEstimate, setCostEstimate] = useState<CostEstimate | null>(null)
  const [editableCostEstimate, setEditableCostEstimate] = useState<CostEstimate | null>(null)
  const [batchCostEstimates, setBatchCostEstimates] = useState<CostEstimate[]>([])
  const [currentPageIndex, setCurrentPageIndex] = useState(0)
  const [loading, setLoading] = useState(true)
  const [isEditing, setIsEditing] = useState(false)
  const [sendingEmail, setSendingEmail] = useState(false)
  const [updatingStatus, setUpdatingStatus] = useState(false)
  const [proposal, setProposal] = useState<Proposal | null>(null)
  const [activities, setActivities] = useState<ProposalActivity[]>([])
  const [timelineOpen, setTimelineOpen] = useState(false)
  const [isSendEmailDialogOpen, setIsSendEmailDialogOpen] = useState(false)
  const [isSendOptionsDialogOpen, setIsSendOptionsDialogOpen] = useState(false) // New state for options dialog
  const [ccEmail, setCcEmail] = useState("")
  const [isSaving, setIsSaving] = useState(false)
  const [emailSubject, setEmailSubject] = useState("")
  const [emailBody, setEmailBody] = useState("")
  const [showSuccessDialog, setShowSuccessDialog] = useState(false)
  const [downloadingPDF, setDownloadingPDF] = useState(false) // New state for PDF download

  const currentEstimate = batchCostEstimates[currentPageIndex] || costEstimate
  const isMultiPage = batchCostEstimates.length > 1

  const getCurrentSiteLineItems = () => {
    if (!currentEstimate || !isMultiPage) {
      return currentEstimate?.lineItems || []
    }

    // If this is a multi-page cost estimate, filter line items by site
    if (currentEstimate.siteInfo?.name) {
      return currentEstimate.lineItems.filter(
        (item) =>
          item.description.includes(currentEstimate.siteInfo.name) ||
          item.siteLocation === currentEstimate.siteInfo.name ||
          item.siteName === currentEstimate.siteInfo.name,
      )
    }

    return currentEstimate.lineItems || []
  }

  const getCurrentSiteTotal = () => {
    const siteLineItems = getCurrentSiteLineItems()
    return siteLineItems.reduce((sum, item) => sum + item.total, 0)
  }

  const handlePageChange = (pageIndex: number) => {
    if (pageIndex >= 0 && pageIndex < batchCostEstimates.length) {
      setCurrentPageIndex(pageIndex)
      // Update the URL to reflect the current page
      const newEstimate = batchCostEstimates[pageIndex]
      router.replace(`/sales/cost-estimates/${newEstimate.id}`, { scroll: false })
    }
  }

  const handlePreviousPage = () => {
    if (currentPageIndex > 0) {
      handlePageChange(currentPageIndex - 1)
    }
  }

  const handleNextPage = () => {
    if (currentPageIndex < batchCostEstimates.length - 1) {
      handlePageChange(currentPageIndex + 1)
    }
  }

  useEffect(() => {
    const fetchCostEstimate = async () => {
      if (!params.id || typeof params.id !== "string") return

      try {
        setLoading(true)
        const fetchedCostEstimate = await getCostEstimate(params.id)
        if (fetchedCostEstimate) {
          setCostEstimate(fetchedCostEstimate)
          setEditableCostEstimate({ ...fetchedCostEstimate })

          if (fetchedCostEstimate.batchId) {
            const batchEstimates = await getCostEstimatesByBatchId(fetchedCostEstimate.batchId)
            setBatchCostEstimates(batchEstimates)
            // Find the current page index
            const currentIndex = batchEstimates.findIndex((est) => est.id === params.id)
            setCurrentPageIndex(currentIndex >= 0 ? currentIndex : 0)
          } else {
            setBatchCostEstimates([fetchedCostEstimate])
            setCurrentPageIndex(0)
          }

          // Fetch activities
          const fetchedActivities = await getProposalActivities(fetchedCostEstimate.id)
          setActivities(fetchedActivities)
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

    fetchCostEstimate()
  }, [params.id, toast])

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
    if (!editableCostEstimate || !params.id || !user?.uid) return

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

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-gray-600">Loading cost estimate...</p>
        </div>
      </div>
    )
  }

  if (!currentEstimate) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <FileText className="h-12 w-12 mx-auto mb-4 text-gray-400" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Cost Estimate Not Found</h2>
          <p className="text-gray-600 mb-4">The cost estimate you're looking for doesn't exist or has been removed.</p>
          <Button onClick={() => router.back()} variant="outline">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Go Back
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="container py-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <Button variant="ghost" size="sm" onClick={() => router.back()}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <div>
              <h1 className="text-xl font-semibold text-gray-900">
                {currentEstimate.title}
                {isMultiPage && (
                  <span className="ml-2 text-sm font-normal text-gray-500">
                    (Page {currentPageIndex + 1} of {batchCostEstimates.length})
                  </span>
                )}
              </h1>
              <p className="text-sm text-gray-500">
                Cost Estimate #{currentEstimate.costEstimateNumber || currentEstimate.id}
                {isMultiPage && currentEstimate.siteInfo && (
                  <span className="ml-2">• {currentEstimate.siteInfo.name}</span>
                )}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2 mt-4 sm:mt-0">
            {isMultiPage && (
              <div className="flex items-center space-x-2 mr-4">
                <Button variant="outline" size="sm" onClick={handlePreviousPage} disabled={currentPageIndex === 0}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="text-sm text-gray-600 px-2">
                  {currentPageIndex + 1} / {batchCostEstimates.length}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleNextPage}
                  disabled={currentPageIndex === batchCostEstimates.length - 1}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            )}

            {isMultiPage && currentEstimate.siteInfo && (
              <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                {currentEstimate.siteInfo.name}
              </Badge>
            )}

            <Badge
              variant={
                currentEstimate.status === "approved"
                  ? "default"
                  : currentEstimate.status === "rejected"
                    ? "destructive"
                    : "secondary"
              }
              className="capitalize"
            >
              {currentEstimate.status === "approved" && <CheckCircle className="h-3 w-3 mr-1" />}
              {currentEstimate.status === "rejected" && <XCircle className="h-3 w-3 mr-1" />}
              {currentEstimate.status}
            </Badge>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container py-6 lg:py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Left Sidebar - Page Navigation for Multi-page */}
          {isMultiPage && (
            <div className="lg:col-span-1">
              <div className="bg-white rounded-lg shadow-md p-4">
                <h3 className="text-sm font-semibold text-gray-900 mb-3">Document Pages</h3>
                <div className="space-y-2">
                  {batchCostEstimates.map((estimate, index) => (
                    <button
                      key={estimate.id}
                      onClick={() => handlePageChange(index)}
                      className={cn(
                        "w-full text-left p-3 rounded-md border transition-colors",
                        index === currentPageIndex
                          ? "bg-blue-50 border-blue-200 text-blue-900"
                          : "bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100",
                      )}
                    >
                      <div className="text-sm font-medium">Page {index + 1}</div>
                      {estimate.siteInfo && <div className="text-xs text-gray-500 mt-1">{estimate.siteInfo.name}</div>}
                      <div className="text-xs text-gray-500 mt-1">₱{getCurrentSiteTotal().toLocaleString()}</div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Actions Sidebar */}
          <div className={cn("hidden lg:block", isMultiPage ? "lg:col-span-1" : "lg:col-span-1")}>
            <div className="bg-white rounded-lg shadow-md p-4">
              <h3 className="text-sm font-semibold text-gray-900 mb-2">Actions</h3>
              <div className="space-y-2">
                <Button variant="outline" className="w-full justify-start bg-transparent">
                  <DownloadIcon className="h-4 w-4 mr-2" />
                  Download PDF
                </Button>
                <Button variant="outline" className="w-full justify-start bg-transparent">
                  <Send className="h-4 w-4 mr-2" />
                  Send to Client
                </Button>
                <Button variant="outline" className="w-full justify-start bg-transparent">
                  <FileText className="h-4 w-4 mr-2" />
                  Generate Proposal
                </Button>
              </div>
            </div>
          </div>

          {/* Document */}
          <div className={cn(isMultiPage ? "lg:col-span-2" : "lg:col-span-2")}>
            <div className="bg-white shadow-md rounded-lg overflow-hidden">
              {/* Document Header */}
              <div className="border-b border-gray-200 px-6 sm:px-8 py-4 bg-gray-50">
                <div className="flex items-start justify-between">
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900">Cost Estimate Details</h2>
                    <p className="text-sm text-gray-500">Last updated on {format(new Date(), "PPP")}</p>
                    {isMultiPage && currentEstimate.siteInfo && (
                      <p className="text-sm font-medium text-blue-600 mt-1">Site: {currentEstimate.siteInfo.name}</p>
                    )}
                  </div>
                  <img src="/oh-plus-logo.png" alt="Company Logo" className="h-8" />
                </div>
              </div>

              {/* Document Content */}
              <div className="p-6 sm:p-8">
                {/* Cost Estimate Information */}
                <div className="mb-8">
                  <h2 className="text-xl font-semibold text-gray-900 mb-4 pb-1 border-b border-gray-200 font-[Calibri]">
                    Cost Estimate Information
                  </h2>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div>
                      <Label htmlFor="title" className="text-sm font-medium text-gray-500 mb-2">
                        Title
                      </Label>
                      <p className="text-base font-medium text-gray-900">
                        {currentEstimate.title}
                        {isMultiPage && currentEstimate.siteInfo && (
                          <span className="text-sm font-normal text-gray-600 ml-2">
                            - {currentEstimate.siteInfo.name}
                          </span>
                        )}
                      </p>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-gray-500 mb-2">Created Date</h3>
                      <p className="text-base text-gray-900">{format(currentEstimate.createdAt, "PPP")}</p>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-gray-500 mb-2">Start Date</h3>
                      <p className="text-base text-gray-900">
                        {currentEstimate.startDate ? format(currentEstimate.startDate, "PPP") : "N/A"}
                      </p>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-gray-500 mb-2">End Date</h3>
                      <p className="text-base text-gray-900">
                        {currentEstimate.endDate ? format(currentEstimate.endDate, "PPP") : "N/A"}
                      </p>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-gray-500 mb-2">Valid Until</h3>
                      <p className="text-base text-gray-900">
                        {currentEstimate.validUntil
                          ? format(currentEstimate.validUntil, "PPP")
                          : "September 14th, 2025"}
                      </p>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-gray-500 mb-2">Total Amount</h3>
                      <p className="text-base font-bold text-blue-600">₱{getCurrentSiteTotal().toLocaleString()}</p>
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
                      <h3 className="text-sm font-medium text-gray-500 mb-2">Company</h3>
                      <p className="text-base font-medium text-gray-900">{currentEstimate.client.company}</p>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-gray-500 mb-2">Contact Person</h3>
                      <p className="text-base text-blue-600">{currentEstimate.client.contactPerson}</p>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-gray-500 mb-2">Designation</h3>
                      <p className="text-base text-gray-900">{currentEstimate.client.designation}</p>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-gray-500 mb-2">Email</h3>
                      <p className="text-base text-blue-600">{currentEstimate.client.email}</p>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-gray-500 mb-2">Phone</h3>
                      <p className="text-base text-gray-900">{currentEstimate.client.phone}</p>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-gray-500 mb-2">Industry</h3>
                      <p className="text-base text-gray-900">{currentEstimate.client.industry}</p>
                    </div>
                  </div>
                </div>

                {/* Cost Breakdown */}
                <div className="mb-8">
                  <h2 className="text-xl font-semibold text-gray-900 mb-4 pb-1 border-b border-gray-200 font-[Calibri]">
                    Cost Breakdown
                  </h2>

                  <div className="border border-gray-300 rounded-sm overflow-hidden">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-100">
                        <tr>
                          <th className="py-2 px-4 text-left font-medium text-gray-700 border-b border-gray-300">
                            Description
                          </th>
                          <th className="py-2 px-4 text-left font-medium text-gray-700 border-b border-gray-300">
                            Quantity
                          </th>
                          <th className="py-2 px-4 text-right font-medium text-gray-700 border-b border-gray-300">
                            Unit Price
                          </th>
                          <th className="py-2 px-4 text-right font-medium text-gray-700 border-b border-gray-300">
                            Total
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {getCurrentSiteLineItems().map((item, index) => (
                          <tr key={item.id} className={index % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                            <td className="py-3 px-4 border-b border-gray-200">
                              <div className="font-medium text-gray-900">{item.description}</div>
                              {item.notes && <div className="text-xs text-gray-500">{item.notes}</div>}
                            </td>
                            <td className="py-3 px-4 border-b border-gray-200">{item.quantity}</td>
                            <td className="py-3 px-4 text-right border-b border-gray-200">
                              ₱{item.unitPrice.toLocaleString()}
                            </td>
                            <td className="py-3 px-4 text-right border-b border-gray-200">
                              <div className="font-medium text-gray-900">₱{item.total.toLocaleString()}</div>
                            </td>
                          </tr>
                        ))}
                        <tr className="bg-gray-50">
                          <td colSpan={3} className="py-3 px-4 text-right font-medium">
                            Total Estimated Cost:
                          </td>
                          <td className="py-3 px-4 text-right font-bold text-blue-600">
                            ₱{getCurrentSiteTotal().toLocaleString()}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Additional Information */}
                <div className="mb-8">
                  <h2 className="text-xl font-semibold text-gray-900 mb-4 pb-1 border-b border-gray-200 font-[Calibri]">
                    Additional Information
                  </h2>

                  {currentEstimate.customMessage && (
                    <div className="mb-4">
                      <p className="text-gray-700">{currentEstimate.customMessage}</p>
                    </div>
                  )}
                </div>

                {/* Footer */}
                <div className="text-xs text-gray-500 border-t border-gray-200 pt-4 flex flex-col sm:flex-row sm:justify-between">
                  <div>
                    <p>
                      This cost estimate is valid until{" "}
                      {currentEstimate.validUntil ? format(currentEstimate.validUntil, "PPP") : "N/A"}.
                    </p>
                    <p>© 2025 OH+ Outdoor Advertising. All rights reserved.</p>
                  </div>
                  {isMultiPage && (
                    <div className="mt-2 sm:mt-0">
                      <p>
                        Page {currentPageIndex + 1} of {batchCostEstimates.length}
                      </p>
                      {currentEstimate.siteInfo && <p className="font-medium">{currentEstimate.siteInfo.name}</p>}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

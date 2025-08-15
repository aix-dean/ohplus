"use client"

import type React from "react"
import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { useToast } from "@/hooks/use-toast"
import { getCostEstimate, updateCostEstimateStatus, updateCostEstimate } from "@/lib/cost-estimate-service"
import type { CostEstimate, CostEstimateClient, CostEstimateStatus } from "@/lib/types/cost-estimate"
import { format } from "date-fns"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn } from "@/lib/utils"
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
  CalendarIcon,
  Save,
  X,
  ChevronLeft,
  ChevronRight,
} from "lucide-react"
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
import { generateCostEstimatePDF } from "@/lib/pdf-service" // Import the new PDF generation function
import { CostEstimateSentSuccessDialog } from "@/components/cost-estimate-sent-success-dialog" // Ensure this is imported
import { SendCostEstimateOptionsDialog } from "@/components/send-cost-estimate-options-dialog" // Import the new options dialog
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

  const handlePageChange = (pageIndex: number) => {
    if (pageIndex >= 0 && pageIndex < batchCostEstimates.length) {
      const targetEstimate = batchCostEstimates[pageIndex]
      router.push(`/sales/cost-estimates/${targetEstimate.id}`)
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

  const statusConfig = getStatusConfig(costEstimate.status)
  const currentEstimate = batchCostEstimates[currentPageIndex] || costEstimate
  const isMultiPage = batchCostEstimates.length > 1

  return (
    <div className="min-h-screen bg-gray-100 py-6 px-4 sm:px-6 relative">
      {/* Word-style Toolbar */}
      <div className="sticky top-0 z-10 bg-white border-b border-gray-200 shadow-sm mb-6">
        <div className="max-w-[850px] mx-auto px-4 py-2 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.back()} // Changed from router.push("/sales/cost-estimates")
              className="text-gray-600 hover:text-gray-900"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">Back</span>
            </Button>
            <Badge className={`${statusConfig.color} border font-medium px-3 py-1`}>
              {statusConfig.icon}
              <span className="ml-1.5">{statusConfig.label}</span>
            </Badge>
            {isMultiPage && (
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <span>
                  Page {currentPageIndex + 1} of {batchCostEstimates.length}
                </span>
                <div className="flex items-center space-x-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handlePageChange(currentPageIndex - 1)}
                    disabled={currentPageIndex === 0}
                    className="h-6 w-6 p-0"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handlePageChange(currentPageIndex + 1)}
                    disabled={currentPageIndex === batchCostEstimates.length - 1}
                    className="h-6 w-6 p-0"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </div>

          <div className="flex items-center space-x-2"></div>
        </div>
      </div>

      {/* New Wrapper for Sidebar + Document */}
      <div className="flex justify-center items-start gap-6 mt-6">
        {/* Left Panel (now part of flow) */}
        <div className="flex flex-col space-y-4 z-20 hidden lg:flex">
          {isMultiPage && (
            <div className="bg-white rounded-lg shadow-md border border-gray-200 p-3">
              <h3 className="text-xs font-medium text-gray-700 mb-2">Pages</h3>
              <div className="space-y-2">
                {batchCostEstimates.map((estimate, index) => (
                  <button
                    key={estimate.id}
                    onClick={() => handlePageChange(index)}
                    className={`w-full text-left p-2 rounded text-xs border transition-colors ${
                      index === currentPageIndex
                        ? "bg-blue-50 border-blue-200 text-blue-700"
                        : "bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100"
                    }`}
                  >
                    <div className="font-medium truncate">{estimate.siteInfo?.name || `Site ${index + 1}`}</div>
                    <div className="text-gray-500 truncate">{estimate.siteInfo?.location}</div>
                  </button>
                ))}
              </div>
            </div>
          )}

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
            disabled={downloadingPDF} // Re-enable when PDF generation is implemented
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
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-1 font-[Calibri]">COST ESTIMATE</h1>
                <p className="text-sm text-gray-500 flex items-center gap-2">
                  {currentEstimate.costEstimateNumber || currentEstimate.id}
                  {isEditing && (
                    <Badge variant="outline" className="bg-yellow-100 text-yellow-800 border-yellow-200">
                      <Pencil className="h-3 w-3 mr-1" /> Editing
                    </Badge>
                  )}
                  {isMultiPage && currentEstimate.siteInfo && (
                    <Badge variant="outline" className="bg-blue-100 text-blue-800 border-blue-200">
                      {currentEstimate.siteInfo.name}
                    </Badge>
                  )}
                </p>
              </div>
              <div className="mt-4 sm:mt-0 flex items-center space-x-4">
                {/* QR Code */}
                <div className="flex flex-col items-center">
                  <div className="bg-white p-2 rounded-lg border border-gray-200 shadow-sm">
                    <img
                      src={generateQRCodeUrl(currentEstimate.id) || "/placeholder.svg"}
                      alt="QR Code for cost estimate view"
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
                  {isEditing ? (
                    <Input
                      id="title"
                      name="title"
                      value={editableCostEstimate.title}
                      onChange={handleChange}
                      className="mt-1"
                    />
                  ) : (
                    <p className="text-base font-medium text-gray-900">{currentEstimate.title}</p>
                  )}
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-2">Created Date</h3>
                  <p className="text-base text-gray-900">{format(costEstimate.createdAt, "PPP")}</p>
                </div>
                <div>
                  <Label htmlFor="startDate" className="text-sm font-medium text-gray-500 mb-2">
                    Start Date
                  </Label>
                  {isEditing ? (
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant={"outline"}
                          className={cn(
                            "w-full justify-start text-left font-normal mt-1",
                            !editableCostEstimate.startDate && "text-muted-foreground",
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {editableCostEstimate.startDate ? (
                            format(editableCostEstimate.startDate, "PPP")
                          ) : (
                            <span>Pick a date</span>
                          )}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar
                          mode="single"
                          selected={editableCostEstimate.startDate}
                          onSelect={(date) => handleDateChange(date, "startDate")}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  ) : (
                    <p className="text-base text-gray-900">
                      {costEstimate.startDate ? format(costEstimate.startDate, "PPP") : "N/A"}
                    </p>
                  )}
                </div>
                <div>
                  <Label htmlFor="endDate" className="text-sm font-medium text-gray-500 mb-2">
                    End Date
                  </Label>
                  {isEditing ? (
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant={"outline"}
                          className={cn(
                            "w-full justify-start text-left font-normal mt-1",
                            !editableCostEstimate.endDate && "text-muted-foreground",
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {editableCostEstimate.endDate ? (
                            format(editableCostEstimate.endDate, "PPP")
                          ) : (
                            <span>Pick a date</span>
                          )}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar
                          mode="single"
                          selected={editableCostEstimate.endDate}
                          onSelect={(date) => handleDateChange(date, "endDate")}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  ) : (
                    <p className="text-base text-gray-900">
                      {costEstimate.endDate ? format(costEstimate.endDate, "PPP") : "N/A"}
                    </p>
                  )}
                </div>
                <div>
                  <Label htmlFor="validUntil" className="text-sm font-medium text-gray-500 mb-2">
                    Valid Until
                  </Label>
                  {isEditing ? (
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant={"outline"}
                          className={cn(
                            "w-full justify-start text-left font-normal mt-1",
                            !editableCostEstimate.validUntil && "text-muted-foreground",
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {editableCostEstimate.validUntil ? (
                            format(editableCostEstimate.validUntil, "PPP")
                          ) : (
                            <span>Pick a date</span>
                          )}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar
                          mode="single"
                          selected={editableCostEstimate.validUntil}
                          onSelect={(date) => handleDateChange(date, "validUntil")}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  ) : (
                    <p className="text-base text-gray-900">
                      {costEstimate.validUntil ? format(costEstimate.validUntil, "PPP") : "N/A"}
                    </p>
                  )}
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-2">Total Amount</h3>
                  <p className="text-base font-semibold text-gray-900">₱{costEstimate.totalAmount.toLocaleString()}</p>
                </div>
                {costEstimate.durationDays !== null && (
                  <div>
                    <h3 className="text-sm font-medium text-gray-500 mb-2">Duration</h3>
                    <p className="text-base text-gray-900">
                      {costEstimate.durationDays} day{costEstimate.durationDays !== 1 ? "s" : ""}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Client Information */}
            <div className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4 pb-1 border-b border-gray-200 font-[Calibri]">
                Client Information
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <Label htmlFor="client.company" className="text-sm font-medium text-gray-500 mb-2">
                    Company
                  </Label>
                  {isEditing ? (
                    <Input
                      id="client.company"
                      name="client.company"
                      value={editableCostEstimate.client.company}
                      onChange={handleChange}
                      className="mt-1"
                    />
                  ) : (
                    <p className="text-base font-medium text-gray-900">{costEstimate.client.company}</p>
                  )}
                </div>
                <div>
                  <Label htmlFor="client.contactPerson" className="text-sm font-medium text-gray-500 mb-2">
                    Contact Person
                  </Label>
                  {isEditing ? (
                    <Input
                      id="client.contactPerson"
                      name="client.contactPerson"
                      value={editableCostEstimate.client.name}
                      onChange={handleChange}
                      className="mt-1"
                    />
                  ) : (
                    <p className="text-base text-gray-900">{costEstimate.client.name}</p>
                  )}
                </div>
                <div>
                  <Label htmlFor="client.designation" className="text-sm font-medium text-gray-500 mb-2">
                    Designation
                  </Label>
                  {isEditing ? (
                    <Input
                      id="client.designation"
                      name="client.designation"
                      value={editableCostEstimate.client.designation || ""}
                      onChange={handleChange}
                      className="mt-1"
                    />
                  ) : (
                    <p className="text-base text-gray-900">{costEstimate.client.designation || "N/A"}</p>
                  )}
                </div>
                <div>
                  <Label htmlFor="client.email" className="text-sm font-medium text-gray-500 mb-2">
                    Email
                  </Label>
                  {isEditing ? (
                    <Input
                      id="client.email"
                      name="client.email"
                      type="email"
                      value={editableCostEstimate.client.email}
                      onChange={handleChange}
                      className="mt-1"
                    />
                  ) : (
                    <p className="text-base text-gray-900">{costEstimate.client.email}</p>
                  )}
                </div>
                <div>
                  <Label htmlFor="client.phone" className="text-sm font-medium text-gray-500 mb-2">
                    Phone
                  </Label>
                  {isEditing ? (
                    <Input
                      id="client.phone"
                      name="client.phone"
                      value={editableCostEstimate.client.phone}
                      onChange={handleChange}
                      className="mt-1"
                    />
                  ) : (
                    <p className="text-base text-gray-900">{costEstimate.client.phone}</p>
                  )}
                </div>
                <div>
                  <Label htmlFor="client.industry" className="text-sm font-medium text-gray-500 mb-2">
                    Industry
                  </Label>
                  {isEditing ? (
                    <Input
                      id="client.industry"
                      name="client.industry"
                      value={editableCostEstimate.client.industry || ""}
                      onChange={handleChange}
                      className="mt-1"
                    />
                  ) : (
                    <p className="text-base text-gray-900">{costEstimate.client.industry || "N/A"}</p>
                  )}
                </div>
              </div>

              {(costEstimate.client.address || isEditing) && (
                <div className="mt-4">
                  <Label htmlFor="client.address" className="text-sm font-medium text-gray-500 mb-2">
                    Address
                  </Label>
                  {isEditing ? (
                    <Textarea
                      id="client.address"
                      name="client.address"
                      value={editableCostEstimate.client.address || ""}
                      onChange={handleChange}
                      className="mt-1"
                    />
                  ) : (
                    <p className="text-base text-gray-900">{costEstimate.client.address}</p>
                  )}
                </div>
              )}

              {(costEstimate.client.campaignObjective || isEditing) && (
                <div className="mt-4">
                  <Label htmlFor="client.campaignObjective" className="text-sm font-medium text-gray-500 mb-2">
                    Campaign Objective
                  </Label>
                  {isEditing ? (
                    <Textarea
                      id="client.campaignObjective"
                      name="client.campaignObjective"
                      value={editableCostEstimate.client.campaignObjective || ""}
                      onChange={handleChange}
                      className="mt-1"
                    />
                  ) : (
                    <p className="text-base text-gray-900">{costEstimate.client.campaignObjective}</p>
                  )}
                </div>
              )}
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
                      <th className="py-2 px-4 text-right font-medium text-gray-700 border-b border-gray-300">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {costEstimate.lineItems.map((item, index) => (
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
                        ₱{costEstimate.totalAmount.toLocaleString()}
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

              {(costEstimate.customMessage || isEditing) && (
                <div className="mb-4">
                  <Label htmlFor="customMessage" className="text-sm font-medium text-gray-500 mb-2">
                    Custom Message
                  </Label>
                  {isEditing ? (
                    <Textarea
                      id="customMessage"
                      name="customMessage"
                      value={editableCostEstimate.customMessage || ""}
                      onChange={handleChange}
                      className="mt-1"
                    />
                  ) : (
                    <div className="bg-blue-50 border border-blue-200 rounded-sm p-4">
                      <p className="text-sm text-gray-700 leading-relaxed">{costEstimate.customMessage}</p>
                    </div>
                  )}
                </div>
              )}

              {(costEstimate.notes || isEditing) && (
                <div>
                  <Label htmlFor="notes" className="text-sm font-medium text-gray-500 mb-2">
                    Internal Notes
                  </Label>
                  {isEditing ? (
                    <Textarea
                      id="notes"
                      name="notes"
                      value={editableCostEstimate.notes || ""}
                      onChange={handleChange}
                      className="mt-1"
                    />
                  ) : (
                    <div className="bg-gray-50 border border-gray-200 rounded-sm p-4">
                      <p className="text-sm text-gray-700 leading-relaxed">{costEstimate.notes}</p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Linked Proposal (if exists) */}
            {proposal && (
              <div className="mb-8">
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

            {/* Document Footer */}
            <div className="mt-12 pt-6 border-t border-gray-200 text-center text-xs text-gray-500">
              {costEstimate.validUntil && (
                <p>This cost estimate is valid until {format(costEstimate.validUntil, "PPP")}</p>
              )}
              <p className="mt-1">© {new Date().getFullYear()} OH+ Outdoor Advertising. All rights reserved.</p>
              {isMultiPage && (
                <p className="mt-2 text-gray-400">
                  Page {currentPageIndex + 1} of {batchCostEstimates.length} - {currentEstimate.siteInfo?.name}
                </p>
              )}
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
    </div>
  )
}

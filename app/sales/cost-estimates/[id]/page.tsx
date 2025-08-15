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
  Pencil,
  CalendarIcon,
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
      <div className="bg-white border-b border-gray-200 px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between">
          <div className="flex items-center space-x-4">
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
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Sidebar */}
          <div className="hidden lg:block">
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
          <div className="lg:col-span-2">
            <div className="bg-white shadow-md rounded-lg overflow-hidden">
              {/* Document Header */}
              <div className="border-b border-gray-200 px-6 sm:px-8 py-4 bg-gray-50">
                <div className="flex items-start justify-between">
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900">Cost Estimate Details</h2>
                    <p className="text-sm text-gray-500">Last updated on {format(new Date(), "PPP")}</p>
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
                      <p className="text-base text-gray-900">{format(currentEstimate.createdAt, "PPP")}</p>
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
                          {currentEstimate.startDate ? format(currentEstimate.startDate, "PPP") : "N/A"}
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
                          {currentEstimate.endDate ? format(currentEstimate.endDate, "PPP") : "N/A"}
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
                          {currentEstimate.validUntil ? format(currentEstimate.validUntil, "PPP") : "N/A"}
                        </p>
                      )}
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-gray-500 mb-2">Total Amount</h3>
                      <p className="text-base font-semibold text-gray-900">
                        ₱{currentEstimate.totalAmount.toLocaleString()}
                      </p>
                    </div>
                    {currentEstimate.durationDays !== null && (
                      <div>
                        <h3 className="text-sm font-medium text-gray-500 mb-2">Duration</h3>
                        <p className="text-base text-gray-900">
                          {currentEstimate.durationDays} day{currentEstimate.durationDays !== 1 ? "s" : ""}
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
                        <p className="text-base font-medium text-gray-900">{currentEstimate.client.company}</p>
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
                        <p className="text-base text-gray-900">{currentEstimate.client.name}</p>
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
                        <p className="text-base text-gray-900">{currentEstimate.client.designation || "N/A"}</p>
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
                        <p className="text-base text-gray-900">{currentEstimate.client.email}</p>
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
                        <p className="text-base text-gray-900">{currentEstimate.client.phone}</p>
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
                        <p className="text-base text-gray-900">{currentEstimate.client.industry || "N/A"}</p>
                      )}
                    </div>
                  </div>

                  {(currentEstimate.client.address || isEditing) && (
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
                        <p className="text-base text-gray-900">{currentEstimate.client.address}</p>
                      )}
                    </div>
                  )}

                  {(currentEstimate.client.campaignObjective || isEditing) && (
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
                        <p className="text-base text-gray-900">{currentEstimate.client.campaignObjective}</p>
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
                          <th className="py-2 px-4 text-right font-medium text-gray-700 border-b border-gray-300">
                            Total
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {currentEstimate.lineItems.map((item, index) => (
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
                            ₱{currentEstimate.totalAmount.toLocaleString()}
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

                  {(currentEstimate.customMessage || isEditing) && (
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
                          <p className="text-sm text-gray-700 leading-relaxed">{currentEstimate.customMessage}</p>
                        </div>
                      )}
                    </div>
                  )}

                  {(currentEstimate.notes || isEditing) && (
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
                          <p className="text-sm text-gray-700 leading-relaxed">{currentEstimate.notes}</p>
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
              </div>

              {/* Document Footer */}
              <div className="border-t border-gray-200 px-6 sm:px-8 py-4 bg-gray-50">
                <div className="flex flex-col sm:flex-row justify-between items-center text-xs text-gray-500">
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

          {/* Right Sidebar */}
          <div className="hidden lg:block">
            <div className="bg-white rounded-lg shadow-md p-4">
              <h3 className="text-sm font-semibold text-gray-900 mb-2">Additional Details</h3>
              <div className="space-y-2">
                <p className="text-gray-600 text-sm">
                  Created by: <span className="font-medium">John Doe</span>
                </p>
                <p className="text-gray-600 text-sm">
                  Last modified: <span className="font-medium">Yesterday</span>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

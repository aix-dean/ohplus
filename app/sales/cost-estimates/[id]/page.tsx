"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { useToast } from "@/hooks/use-toast"
import { getCostEstimate, updateCostEstimateStatus } from "@/lib/cost-estimate-service"
import type { CostEstimate, CostEstimateStatus } from "@/lib/types/cost-estimate"
import { format } from "date-fns"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  ArrowLeft,
  DownloadIcon,
  Send,
  CheckCircle,
  XCircle,
  FileText,
  Loader2,
  History,
  LayoutGrid,
  Pencil,
} from "lucide-react"
import { getProposal } from "@/lib/proposal-service" // To fetch proposal details if linked
import type { Proposal } from "@/lib/types/proposal"
import { ProposalActivityTimeline } from "@/components/proposal-activity-timeline" // Reusing for CE activity
import { getProposalActivities } from "@/lib/proposal-activity-service" // Reusing for CE activity
import type { ProposalActivity } from "@/lib/types/proposal-activity"
import { Input } from "@/components/ui/input" // Import Input for CC field
import { Label } from "@/components/ui/label" // Import Label for CC field
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog" // Import Dialog components

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

  const costEstimateId = params.id as string
  const [costEstimate, setCostEstimate] = useState<CostEstimate | null>(null)
  const [loading, setLoading] = useState(true)
  const [sendingEmail, setSendingEmail] = useState(false)
  const [updatingStatus, setUpdatingStatus] = useState(false)
  const [proposal, setProposal] = useState<Proposal | null>(null)
  const [activities, setActivities] = useState<ProposalActivity[]>([])
  const [timelineOpen, setTimelineOpen] = useState(false)
  const [isSendEmailDialogOpen, setIsSendEmailDialogOpen] = useState(false) // State for send email dialog
  const [ccEmail, setCcEmail] = useState("") // State for CC email in dialog (can be multiple, comma-separated)

  useEffect(() => {
    const fetchCostEstimateData = async () => {
      if (!costEstimateId) return

      setLoading(true)
      try {
        const ce = await getCostEstimate(costEstimateId)
        if (ce) {
          setCostEstimate(ce)
          if (ce.proposalId) {
            const linkedProposal = await getProposal(ce.proposalId)
            setProposal(linkedProposal)
          }
          const ceActivities = await getProposalActivities(costEstimateId) // Use CE ID for activities
          setActivities(ceActivities)
        } else {
          toast({
            title: "Cost Estimate Not Found",
            description: "The cost estimate you're looking for doesn't exist.",
            variant: "destructive",
          })
          router.push("/sales/cost-estimates") // Redirect to list if not found
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

  const handleSendEmailConfirm = async () => {
    if (!costEstimate || !user?.uid) return

    // Ensure client email is available before sending
    if (!costEstimate.client?.email) {
      toast({
        title: "Missing Client Email",
        description: "Cannot send email: Client email address is not available.",
        variant: "destructive",
      })
      return
    }

    // Validate each email in the comma-separated CC list
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
          costEstimate: costEstimate, // Send the full cost estimate object
          clientEmail: costEstimate.client.email,
          client: costEstimate.client,
          currentUserEmail: user.email, // Pass current user's email for reply-to
          ccEmail: ccEmail, // Pass CC email string
        }),
      })

      const result = await response.json()
      if (!response.ok || !result.success) {
        throw new Error(result.error || result.details || "Failed to send email")
      }

      await updateCostEstimateStatus(costEstimate.id, "sent")
      setCostEstimate((prev) => (prev ? { ...prev, status: "sent" } : null))
      toast({
        title: "Email Sent",
        description: `Cost estimate sent to ${costEstimate.client.email}${ccEmail ? ` and CC'd to ${ccEmail}` : ""}.`,
      })
      const updatedActivities = await getProposalActivities(costEstimate.id)
      setActivities(updatedActivities)
      setIsSendEmailDialogOpen(false) // Close dialog on success
      setCcEmail("") // Clear CC email
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
    // Implement PDF download logic for cost estimates here
    toast({
      title: "Download PDF",
      description: "PDF download functionality for cost estimates is not yet implemented.",
      variant: "default",
    })
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

  if (!costEstimate) {
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

  return (
    <div className="min-h-screen bg-gray-100 py-6 px-4 sm:px-6 relative">
      {/* Word-style Toolbar */}
      <div className="sticky top-0 z-10 bg-white border-b border-gray-200 shadow-sm mb-6">
        <div className="max-w-[850px] mx-auto px-4 py-2 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push("/sales/cost-estimates")}
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
            <Button
              onClick={() => setTimelineOpen(!timelineOpen)}
              variant="outline"
              size="sm"
              className="border-blue-300 text-blue-700 hover:bg-blue-50"
            >
              <History className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">Activity</span>
            </Button>

            {costEstimate.status === "draft" && (
              <Button
                onClick={() => setIsSendEmailDialogOpen(true)} // Open dialog
                disabled={sendingEmail}
                size="sm"
                className="bg-green-500 hover:bg-green-600"
              >
                {sendingEmail ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4 mr-2" />
                    <span className="hidden sm:inline">Send to Client</span>
                    <span className="sm:hidden">Send</span>
                  </>
                )}
              </Button>
            )}
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
          >
            <LayoutGrid className="h-8 w-8 text-gray-500 mb-1" />
            <span className="text-[10px] text-gray-700">Templates</span>
          </Button>
          <Button
            variant="ghost"
            onClick={() => router.push(`/sales/cost-estimates/edit/${costEstimate.id}`)}
            className="h-16 w-16 flex flex-col items-center justify-center p-2 rounded-lg bg-white shadow-md border border-gray-200 hover:bg-gray-50"
          >
            <Pencil className="h-8 w-8 text-gray-500 mb-1" />
            <span className="text-[10px] text-gray-700">Edit</span>
          </Button>
          <Button
            variant="ghost"
            onClick={handleDownloadPDF}
            // disabled={downloadingPDF} // Re-enable when PDF generation is implemented
            className="h-16 w-16 flex flex-col items-center justify-center p-2 rounded-lg bg-white shadow-md border border-gray-200 hover:bg-gray-50"
          >
            {/* {downloadingPDF ? (
              <>
                <Loader2 className="h-8 w-8 text-gray-500 mb-1 animate-spin" />
                <span className="text-[10px] text-gray-700">Generating...</span>
              </>
            ) : ( */}
            <>
              <DownloadIcon className="h-8 w-8 text-gray-500 mb-1" />
              <span className="text-[10px] text-gray-700">Download</span>
            </>
            {/* )} */}
          </Button>
        </div>

        {/* Document Container */}
        <div className="max-w-[850px] bg-white shadow-md rounded-sm overflow-hidden">
          {/* Document Header */}
          <div className="border-b-2 border-blue-600 p-6 sm:p-8">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4">
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-1 font-[Calibri]">COST ESTIMATE</h1>
                <p className="text-sm text-gray-500">{costEstimate.id}</p>
              </div>
              <div className="mt-4 sm:mt-0 flex items-center space-x-4">
                {/* QR Code */}
                <div className="flex flex-col items-center">
                  <div className="bg-white p-2 rounded-lg border border-gray-200 shadow-sm">
                    <img
                      src={generateQRCodeUrl(costEstimate.id) || "/placeholder.svg"}
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
                  <h3 className="text-sm font-medium text-gray-500 mb-2">Title</h3>
                  <p className="text-base font-medium text-gray-900">{costEstimate.title}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-2">Created Date</h3>
                  <p className="text-base text-gray-900">{format(costEstimate.createdAt, "PPP")}</p>
                </div>
                {costEstimate.startDate && (
                  <div>
                    <h3 className="text-sm font-medium text-gray-500 mb-2">Start Date</h3>
                    <p className="text-base text-gray-900">{format(costEstimate.startDate, "PPP")}</p>
                  </div>
                )}
                {costEstimate.endDate && (
                  <div>
                    <h3 className="text-sm font-medium text-gray-500 mb-2">End Date</h3>
                    <p className="text-base text-gray-900">{format(costEstimate.endDate, "PPP")}</p>
                  </div>
                )}
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-2">Total Amount</h3>
                  <p className="text-base font-semibold text-gray-900">₱{costEstimate.totalAmount.toLocaleString()}</p>
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
                  <p className="text-base font-medium text-gray-900">{costEstimate.client.company}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-2">Contact Person</h3>
                  <p className="text-base text-gray-900">{costEstimate.client.contactPerson}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-2">Email</h3>
                  <p className="text-base text-gray-900">{costEstimate.client.email}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-2">Phone</h3>
                  <p className="text-base text-gray-900">{costEstimate.client.phone}</p>
                </div>
                {costEstimate.client.industry && (
                  <div>
                    <h3 className="text-sm font-medium text-gray-500 mb-2">Industry</h3>
                    <p className="text-base text-gray-900">{costEstimate.client.industry}</p>
                  </div>
                )}
                {costEstimate.client.targetAudience && (
                  <div>
                    <h3 className="text-sm font-medium text-gray-500 mb-2">Target Audience</h3>
                    <p className="text-base text-gray-900">{costEstimate.client.targetAudience}</p>
                  </div>
                )}
              </div>

              {costEstimate.client.address && (
                <div className="mt-4">
                  <h3 className="text-sm font-medium text-gray-500 mb-2">Address</h3>
                  <p className="text-base text-gray-900">{costEstimate.client.address}</p>
                </div>
              )}

              {costEstimate.client.campaignObjective && (
                <div className="mt-4">
                  <h3 className="text-sm font-medium text-gray-500 mb-2">Campaign Objective</h3>
                  <p className="text-base text-gray-900">{costEstimate.client.campaignObjective}</p>
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
            {(costEstimate.notes || costEstimate.customMessage) && (
              <div className="mb-8">
                <h2 className="text-xl font-semibold text-gray-900 mb-4 pb-1 border-b border-gray-200 font-[Calibri]">
                  Additional Information
                </h2>

                {costEstimate.customMessage && (
                  <div className="mb-4">
                    <h3 className="text-sm font-medium text-gray-500 mb-2">Custom Message</h3>
                    <div className="bg-blue-50 border border-blue-200 rounded-sm p-4">
                      <p className="text-sm text-gray-700 leading-relaxed">{costEstimate.customMessage}</p>
                    </div>
                  </div>
                )}

                {costEstimate.notes && (
                  <div>
                    <h3 className="text-sm font-medium text-gray-500 mb-2">Internal Notes</h3>
                    <div className="bg-gray-50 border border-gray-200 rounded-sm p-4">
                      <p className="text-sm text-gray-700 leading-relaxed">{costEstimate.notes}</p>
                    </div>
                  </div>
                )}
              </div>
            )}

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
            </div>
          </div>
        </div>
      </div>

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
                proposalId={costEstimate.id} // Pass costEstimate.id as entityId for activities
                currentUserId={user?.uid || "unknown_user"}
                currentUserName={user?.displayName || "Unknown User"}
              />
            </div>
          </div>
        </>
      )}

      {/* Send Email Dialog */}
      <Dialog open={isSendEmailDialogOpen} onOpenChange={setIsSendEmailDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Send Cost Estimate</DialogTitle>
            <DialogDescription>
              Confirm client email and add CC if needed before sending the cost estimate.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="client-email">To</Label>
              <Input id="client-email" value={costEstimate.client?.email || ""} readOnly />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cc-email">CC (Optional, comma-separated)</Label>
              <Input
                id="cc-email"
                type="text" // Changed to text to allow comma-separated values
                value={ccEmail}
                onChange={(e) => setCcEmail(e.target.value)}
                placeholder="carboncopy1@example.com, carboncopy2@example.com"
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
    </div>
  )
}

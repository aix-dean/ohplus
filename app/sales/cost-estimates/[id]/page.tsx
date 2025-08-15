"use client"
import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { useToast } from "@/hooks/use-toast"
import { getCostEstimate } from "@/lib/cost-estimate-service"
import type { CostEstimate } from "@/lib/types/cost-estimate"
import { format } from "date-fns"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"
import { ArrowLeft, DownloadIcon, Send, CheckCircle, XCircle, FileText, Loader2 } from "lucide-react"
import type { Proposal } from "@/lib/types/proposal"
import { getProposalActivities } from "@/lib/proposal-activity-service"
import type { ProposalActivity } from "@/lib/types/proposal-activity"
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
  const [loading, setLoading] = useState(true)
  const [isEditing, setIsEditing] = useState(false)
  const [sendingEmail, setSendingEmail] = useState(false)
  const [updatingStatus, setUpdatingStatus] = useState(false)
  const [proposal, setProposal] = useState<Proposal | null>(null)
  const [activities, setActivities] = useState<ProposalActivity[]>([])
  const [timelineOpen, setTimelineOpen] = useState(false)
  const [isSendEmailDialogOpen, setIsSendEmailDialogOpen] = useState(false)
  const [isSendOptionsDialogOpen, setIsSendOptionsDialogOpen] = useState(false)
  const [ccEmail, setCcEmail] = useState("")
  const [isSaving, setIsSaving] = useState(false)
  const [emailSubject, setEmailSubject] = useState("")
  const [emailBody, setEmailBody] = useState("")
  const [showSuccessDialog, setShowSuccessDialog] = useState(false)
  const [downloadingPDF, setDownloadingPDF] = useState(false)

  const isMultiSite = batchCostEstimates.length > 1

  const getSiteLineItems = (estimate: CostEstimate) => {
    if (!isMultiSite) {
      return estimate.lineItems || []
    }

    // Filter line items by site if this is a multi-site cost estimate
    if (estimate.siteInfo?.name) {
      return estimate.lineItems.filter(
        (item) =>
          item.description.includes(estimate.siteInfo.name) ||
          item.siteLocation === estimate.siteInfo.name ||
          item.siteName === estimate.siteInfo.name,
      )
    }

    return estimate.lineItems || []
  }

  const getSiteTotal = (estimate: CostEstimate) => {
    const siteLineItems = getSiteLineItems(estimate)
    return siteLineItems.reduce((sum, item) => sum + item.total, 0)
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
          } else {
            setBatchCostEstimates([fetchedCostEstimate])
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

  const CostEstimateDetailsBlock = ({
    estimate,
    pageNumber,
    totalPages,
  }: {
    estimate: CostEstimate
    pageNumber: number
    totalPages: number
  }) => {
    const siteLineItems = getSiteLineItems(estimate)
    const siteTotal = getSiteTotal(estimate)

    return (
      <div
        className={cn(
          "bg-white shadow-md rounded-lg overflow-hidden mb-8",
          // Add page break for PDF export
          pageNumber > 1 && "print:break-before-page",
        )}
      >
        {/* Document Header */}
        <div className="border-b border-gray-200 px-6 sm:px-8 py-4 bg-gray-50">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Cost Estimate Details</h2>
              <p className="text-sm text-gray-500">Last updated on {format(new Date(), "PPP")}</p>
              {isMultiSite && estimate.siteInfo && (
                <p className="text-sm font-medium text-blue-600 mt-1">Site: {estimate.siteInfo.name}</p>
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
                  {estimate.title}
                  {isMultiSite && estimate.siteInfo && (
                    <span className="text-sm font-normal text-gray-600 ml-2">– {estimate.siteInfo.name}</span>
                  )}
                </p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-2">Created Date</h3>
                <p className="text-base text-gray-900">{format(estimate.createdAt, "PPP")}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-2">Start Date</h3>
                <p className="text-base text-gray-900">
                  {estimate.startDate ? format(estimate.startDate, "PPP") : "N/A"}
                </p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-2">End Date</h3>
                <p className="text-base text-gray-900">{estimate.endDate ? format(estimate.endDate, "PPP") : "N/A"}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-2">Valid Until</h3>
                <p className="text-base text-gray-900">
                  {estimate.validUntil ? format(estimate.validUntil, "PPP") : "September 14th, 2025"}
                </p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-2">Total Amount</h3>
                <p className="text-base font-bold text-blue-600">₱{siteTotal.toLocaleString()}</p>
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
                <p className="text-base font-medium text-gray-900">{estimate.client.company}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-2">Contact Person</h3>
                <p className="text-base text-blue-600">{estimate.client.contactPerson}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-2">Designation</h3>
                <p className="text-base text-gray-900">{estimate.client.designation}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-2">Email</h3>
                <p className="text-base text-blue-600">{estimate.client.email}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-2">Phone</h3>
                <p className="text-base text-gray-900">{estimate.client.phone}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-2">Industry</h3>
                <p className="text-base text-gray-900">{estimate.client.industry}</p>
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
                    <th className="py-2 px-4 text-left font-medium text-gray-700 border-b border-gray-300">Quantity</th>
                    <th className="py-2 px-4 text-right font-medium text-gray-700 border-b border-gray-300">
                      Unit Price
                    </th>
                    <th className="py-2 px-4 text-right font-medium text-gray-700 border-b border-gray-300">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {siteLineItems.map((item, index) => (
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
                    <td className="py-3 px-4 text-right font-bold text-blue-600">₱{siteTotal.toLocaleString()}</td>
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

            {estimate.customMessage && (
              <div className="mb-4">
                <p className="text-gray-700">{estimate.customMessage}</p>
              </div>
            )}
          </div>

          {/* Footer with Page Numbering */}
          <div className="text-xs text-gray-500 border-t border-gray-200 pt-4 flex flex-col sm:flex-row sm:justify-between">
            <div>
              <p>
                This cost estimate is valid until {estimate.validUntil ? format(estimate.validUntil, "PPP") : "N/A"}.
              </p>
              <p>© 2025 OH+ Outdoor Advertising. All rights reserved.</p>
            </div>
            <div className="mt-2 sm:mt-0 text-right">
              <p className="font-medium">
                Page {pageNumber} of {totalPages}
              </p>
              {isMultiSite && estimate.siteInfo && <p className="text-blue-600">{estimate.siteInfo.name}</p>}
            </div>
          </div>
        </div>
      </div>
    )
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

  if (!costEstimate) {
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
                {costEstimate.title}
                {isMultiSite && (
                  <span className="ml-2 text-sm font-normal text-gray-500">({batchCostEstimates.length} Sites)</span>
                )}
              </h1>
              <p className="text-sm text-gray-500">
                Cost Estimate #{costEstimate.costEstimateNumber || costEstimate.id}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2 mt-4 sm:mt-0">
            <Badge
              variant={
                costEstimate.status === "approved"
                  ? "default"
                  : costEstimate.status === "rejected"
                    ? "destructive"
                    : "secondary"
              }
              className="capitalize"
            >
              {costEstimate.status === "approved" && <CheckCircle className="h-3 w-3 mr-1" />}
              {costEstimate.status === "rejected" && <XCircle className="h-3 w-3 mr-1" />}
              {costEstimate.status}
            </Badge>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container py-6 lg:py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Actions Sidebar */}
          <div className="lg:col-span-1">
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

              {isMultiSite && (
                <div className="mt-6">
                  <h3 className="text-sm font-semibold text-gray-900 mb-2">Sites Summary</h3>
                  <div className="space-y-2">
                    {batchCostEstimates.map((estimate, index) => (
                      <div key={estimate.id} className="text-xs p-2 bg-gray-50 rounded">
                        <div className="font-medium">Page {index + 1}</div>
                        {estimate.siteInfo && <div className="text-gray-600">{estimate.siteInfo.name}</div>}
                        <div className="text-blue-600">₱{getSiteTotal(estimate).toLocaleString()}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Document Content */}
          <div className="lg:col-span-3">
            {batchCostEstimates.map((estimate, index) => (
              <CostEstimateDetailsBlock
                key={estimate.id}
                estimate={estimate}
                pageNumber={index + 1}
                totalPages={batchCostEstimates.length}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

"use client"
import { useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { useToast } from "@/hooks/use-toast"
import { getCostEstimate } from "@/lib/cost-estimate-service"
import type { CostEstimate } from "@/lib/types/cost-estimate"
import { format } from "date-fns"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
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
  Mail,
  Eye,
  Clock,
  ChevronLeft,
  ChevronRight,
  Copy,
} from "lucide-react"
import { CostEstimateSentSuccessDialog } from "@/components/cost-estimate-sent-success-dialog"
import { SendCostEstimateOptionsDialog } from "@/components/send-cost-estimate-options-dialog"

// Helper function to generate QR code URL
const generateQRCodeUrl = (costEstimateId: string) => {
  const costEstimateViewUrl = `${process.env.NEXT_PUBLIC_APP_URL}/cost-estimates/view/${costEstimateId}`
  return `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(costEstimateViewUrl)}`
}

export default function MultipleCostEstimatesPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user } = useAuth()
  const { toast } = useToast()

  // Get cost estimate IDs from URL parameters
  const costEstimateIds = searchParams.get("ids")?.split(",") || []

  const [costEstimates, setCostEstimates] = useState<CostEstimate[]>([])
  const [loading, setLoading] = useState(true)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [downloadingPDF, setDownloadingPDF] = useState(false)
  const [showSuccessDialog, setShowSuccessDialog] = useState(false)
  const [isSendOptionsDialogOpen, setIsSendOptionsDialogOpen] = useState(false)
  const [selectedCostEstimate, setSelectedCostEstimate] = useState<CostEstimate | null>(null)

  useEffect(() => {
    const fetchCostEstimates = async () => {
      if (costEstimateIds.length === 0) {
        toast({
          title: "Error",
          description: "No cost estimate IDs provided",
          variant: "destructive",
        })
        router.push("/sales/cost-estimates")
        return
      }

      setLoading(true)
      try {
        const estimates = await Promise.all(costEstimateIds.map((id) => getCostEstimate(id)))
        const validEstimates = estimates.filter(Boolean) as CostEstimate[]
        setCostEstimates(validEstimates)

        if (validEstimates.length === 0) {
          toast({
            title: "Error",
            description: "No valid cost estimates found",
            variant: "destructive",
          })
          router.push("/sales/cost-estimates")
        }
      } catch (error) {
        console.error("Error fetching cost estimates:", error)
        toast({
          title: "Error",
          description: "Failed to load cost estimates",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }

    fetchCostEstimates()
  }, [costEstimateIds, toast, router])

  const getStatusConfig = (status: CostEstimate["status"]) => {
    switch (status?.toLowerCase()) {
      case "draft":
        return {
          color: "bg-gray-100 text-gray-800 border-gray-200",
          icon: <FileText className="h-3.5 w-3.5" />,
          label: "Draft",
        }
      case "sent":
        return {
          color: "bg-blue-100 text-blue-800 border-blue-200",
          icon: <Mail className="h-3.5 w-3.5" />,
          label: "Sent",
        }
      case "viewed":
        return {
          color: "bg-yellow-100 text-yellow-800 border-yellow-200",
          icon: <Eye className="h-3.5 w-3.5" />,
          label: "Viewed",
        }
      case "approved":
        return {
          color: "bg-green-100 text-green-800 border-green-200",
          icon: <CheckCircle className="h-3.5 w-3.5" />,
          label: "Approved",
        }
      case "rejected":
        return {
          color: "bg-red-100 text-red-800 border-red-200",
          icon: <XCircle className="h-3.5 w-3.5" />,
          label: "Rejected",
        }
      default:
        return {
          color: "bg-gray-100 text-gray-800 border-gray-200",
          icon: <Clock className="h-3.5 w-3.5" />,
          label: "Unknown",
        }
    }
  }

  const handleDownloadPDF = async (costEstimate: CostEstimate) => {
    setDownloadingPDF(true)
    try {
      // TODO: Implement PDF generation for individual cost estimate
      toast({
        title: "PDF Download",
        description: `Downloading PDF for ${costEstimate.title}`,
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to generate PDF",
        variant: "destructive",
      })
    } finally {
      setDownloadingPDF(false)
    }
  }

  const handleDownloadAllPDFs = async () => {
    setDownloadingPDF(true)
    try {
      // TODO: Implement bulk PDF generation
      toast({
        title: "Bulk PDF Download",
        description: `Generating ${costEstimates.length} PDF documents`,
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to generate PDFs",
        variant: "destructive",
      })
    } finally {
      setDownloadingPDF(false)
    }
  }

  const handleSendCostEstimate = (costEstimate: CostEstimate) => {
    setSelectedCostEstimate(costEstimate)
    setIsSendOptionsDialogOpen(true)
  }

  const handleEmailClick = () => {
    setIsSendOptionsDialogOpen(false)
    // TODO: Implement email sending
    setShowSuccessDialog(true)
  }

  const handleSuccessDialogDismissAndNavigate = () => {
    setShowSuccessDialog(false)
  }

  const nextEstimate = () => {
    setCurrentIndex((prev) => (prev + 1) % costEstimates.length)
  }

  const prevEstimate = () => {
    setCurrentIndex((prev) => (prev - 1 + costEstimates.length) % costEstimates.length)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading cost estimates...</p>
        </div>
      </div>
    )
  }

  if (costEstimates.length === 0) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
            <FileText className="h-8 w-8 text-gray-400" />
          </div>
          <h1 className="text-2xl font-semibold text-gray-900 mb-2">No Cost Estimates Found</h1>
          <p className="text-gray-600 mb-6">
            The cost estimates you're looking for don't exist or may have been removed.
          </p>
          <Button onClick={() => router.push("/sales/cost-estimates")} className="bg-blue-600 hover:bg-blue-700">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Cost Estimates
          </Button>
        </div>
      </div>
    )
  }

  const currentCostEstimate = costEstimates[currentIndex]
  const statusConfig = getStatusConfig(currentCostEstimate.status)

  return (
    <div className="min-h-screen bg-gray-100 py-6 px-4 sm:px-6 relative">
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
            <div className="text-sm text-gray-600">
              {currentIndex + 1} of {costEstimates.length} sites
            </div>
          </div>

          {/* Navigation Controls */}
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={prevEstimate}
              disabled={costEstimates.length <= 1}
              className="px-2 bg-transparent"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={nextEstimate}
              disabled={costEstimates.length <= 1}
              className="px-2 bg-transparent"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Site Navigation Tabs */}
      {costEstimates.length > 1 && (
        <div className="max-w-[850px] mx-auto mb-6">
          <div className="flex space-x-2 overflow-x-auto pb-2">
            {costEstimates.map((estimate, index) => (
              <Button
                key={estimate.id}
                variant={index === currentIndex ? "default" : "outline"}
                size="sm"
                onClick={() => setCurrentIndex(index)}
                className={cn("flex-shrink-0 min-w-[120px]", index === currentIndex && "bg-blue-600 text-white")}
              >
                <div className="text-left">
                  <div className="font-medium truncate max-w-[100px]">{estimate.title || `Site ${index + 1}`}</div>
                  <div className="text-xs opacity-75">₱{estimate.totalAmount.toLocaleString()}</div>
                </div>
              </Button>
            ))}
          </div>
        </div>
      )}

      {/* Wrapper for Sidebar + Document */}
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
            onClick={() => handleDownloadPDF(currentCostEstimate)}
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
          <Button
            variant="ghost"
            onClick={handleDownloadAllPDFs}
            disabled={downloadingPDF}
            className="h-16 w-16 flex flex-col items-center justify-center p-2 rounded-lg bg-white shadow-md border border-gray-200 hover:bg-gray-50"
          >
            {downloadingPDF ? (
              <>
                <Loader2 className="h-8 w-8 text-gray-500 mb-1 animate-spin" />
                <span className="text-[10px] text-gray-700">Bulk PDF</span>
              </>
            ) : (
              <>
                <Copy className="h-8 w-8 text-gray-500 mb-1" />
                <span className="text-[10px] text-gray-700">All PDFs</span>
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
                  {currentCostEstimate.costEstimateNumber || currentCostEstimate.id}
                  <Badge variant="outline" className="bg-blue-100 text-blue-800 border-blue-200">
                    Site {currentIndex + 1} of {costEstimates.length}
                  </Badge>
                </p>
              </div>
              <div className="mt-4 sm:mt-0 flex items-center space-x-4">
                {/* QR Code */}
                <div className="flex flex-col items-center">
                  <div className="bg-white p-2 rounded-lg border border-gray-200 shadow-sm">
                    <img
                      src={generateQRCodeUrl(currentCostEstimate.id) || "/placeholder.svg"}
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
                  <p className="text-base font-medium text-gray-900">{currentCostEstimate.title}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-2">Created Date</h3>
                  <p className="text-base text-gray-900">{format(currentCostEstimate.createdAt, "PPP")}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-2">Start Date</h3>
                  <p className="text-base text-gray-900">
                    {currentCostEstimate.startDate ? format(currentCostEstimate.startDate, "PPP") : "N/A"}
                  </p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-2">End Date</h3>
                  <p className="text-base text-gray-900">
                    {currentCostEstimate.endDate ? format(currentCostEstimate.endDate, "PPP") : "N/A"}
                  </p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-2">Duration</h3>
                  <p className="text-base text-gray-900">{currentCostEstimate.duration || "N/A"}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-2">Total Amount</h3>
                  <p className="text-base font-bold text-blue-600">
                    ₱{currentCostEstimate.totalAmount.toLocaleString()}
                  </p>
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
                  <h3 className="text-sm font-medium text-gray-500 mb-2">Company Name</h3>
                  <p className="text-base font-medium text-gray-900">{currentCostEstimate.client.companyName}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-2">Contact Person</h3>
                  <p className="text-base text-gray-900">{currentCostEstimate.client.contactPerson}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-2">Email</h3>
                  <p className="text-base text-gray-900">{currentCostEstimate.client.email}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-2">Phone</h3>
                  <p className="text-base text-gray-900">{currentCostEstimate.client.phone}</p>
                </div>
              </div>

              {currentCostEstimate.client.address && (
                <div className="mt-4">
                  <h3 className="text-sm font-medium text-gray-500 mb-2">Address</h3>
                  <p className="text-base text-gray-900">{currentCostEstimate.client.address}</p>
                </div>
              )}

              {currentCostEstimate.client.campaignObjective && (
                <div className="mt-4">
                  <h3 className="text-sm font-medium text-gray-500 mb-2">Campaign Objective</h3>
                  <p className="text-base text-gray-900">{currentCostEstimate.client.campaignObjective}</p>
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
                    {currentCostEstimate.lineItems.map((item, index) => (
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
                        ₱{currentCostEstimate.totalAmount.toLocaleString()}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Additional Information */}
            {(currentCostEstimate.customMessage || currentCostEstimate.notes) && (
              <div className="mb-8">
                <h2 className="text-xl font-semibold text-gray-900 mb-4 pb-1 border-b border-gray-200 font-[Calibri]">
                  Additional Information
                </h2>

                {currentCostEstimate.customMessage && (
                  <div className="mb-4">
                    <h3 className="text-sm font-medium text-gray-500 mb-2">Custom Message</h3>
                    <div className="bg-blue-50 border border-blue-200 rounded-sm p-4">
                      <p className="text-sm text-gray-700 leading-relaxed">{currentCostEstimate.customMessage}</p>
                    </div>
                  </div>
                )}

                {currentCostEstimate.notes && (
                  <div>
                    <h3 className="text-sm font-medium text-gray-500 mb-2">Internal Notes</h3>
                    <div className="bg-gray-50 border border-gray-200 rounded-sm p-4">
                      <p className="text-sm text-gray-700 leading-relaxed">{currentCostEstimate.notes}</p>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Document Footer */}
            <div className="mt-12 pt-6 border-t border-gray-200 text-center text-xs text-gray-500">
              {currentCostEstimate.validUntil && (
                <p>This cost estimate is valid until {format(currentCostEstimate.validUntil, "PPP")}</p>
              )}
              <p className="mt-1">© {new Date().getFullYear()} OH+ Outdoor Advertising. All rights reserved.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Floating Action Buttons */}
      {currentCostEstimate.status === "draft" && (
        <div className="fixed bottom-6 right-6 flex space-x-4">
          <Button
            onClick={() => handleSendCostEstimate(currentCostEstimate)}
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-full shadow-lg transition-all duration-200 ease-in-out transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-opacity-75"
          >
            <Send className="h-5 w-5 mr-2" />
            Send to Client
          </Button>
        </div>
      )}

      {/* Dialogs */}
      {selectedCostEstimate && (
        <SendCostEstimateOptionsDialog
          isOpen={isSendOptionsDialogOpen}
          onOpenChange={setIsSendOptionsDialogOpen}
          costEstimate={selectedCostEstimate}
          onEmailClick={handleEmailClick}
        />
      )}

      <CostEstimateSentSuccessDialog
        isOpen={showSuccessDialog}
        onDismissAndNavigate={handleSuccessDialogDismissAndNavigate}
      />
    </div>
  )
}

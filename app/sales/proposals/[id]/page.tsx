"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  ArrowLeft,
  DownloadIcon,
  Send,
  Eye,
  CheckCircle,
  XCircle,
  FileText,
  Loader2,
  History,
  Calculator,
  LayoutGrid,
  Pencil,
} from "lucide-react"
import { getProposalById, updateProposalStatus } from "@/lib/proposal-service" // Removed sendProposalEmail
import { generateProposalPDF } from "@/lib/pdf-service"
import type { Proposal } from "@/lib/types/proposal"
import { useToast } from "@/hooks/use-toast"
import { ProposalActivityTimeline } from "@/components/proposal-activity-timeline"
import { CostEstimatesList } from "@/components/cost-estimates-list"
import { SendProposalDialog } from "@/components/send-proposal-dialog" // Import the new dialog

// Helper function to generate QR code URL (kept here for consistency with proposal view)
const generateQRCodeUrl = (proposalId: string) => {
  const proposalViewUrl = `${process.env.NEXT_PUBLIC_APP_URL}/proposals/view/${proposalId}`
  return `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(proposalViewUrl)}`
}

export default function ProposalDetailsPage() {
  const params = useParams()
  const router = useRouter()
  const { toast } = useToast()
  const [proposal, setProposal] = useState<Proposal | null>(null)
  const [loading, setLoading] = useState(true)
  const [downloadingPDF, setDownloadingPDF] = useState(false)
  const [timelineOpen, setTimelineOpen] = useState(false)
  const [lightboxImage, setLightboxImage] = useState<{ url: string; isVideo: boolean } | null>(null)
  const [isSendDialogOpen, setIsSendDialogOpen] = useState(false) // New state for send dialog

  useEffect(() => {
    async function fetchProposal() {
      if (params.id) {
        try {
          const proposalData = await getProposalById(params.id as string)
          setProposal(proposalData)
        } catch (error) {
          console.error("Error fetching proposal:", error)
          toast({
            title: "Error",
            description: "Failed to load proposal details",
            variant: "destructive",
          })
        } finally {
          setLoading(false)
        }
      }
    }

    fetchProposal()
  }, [params.id, toast])

  const handleStatusUpdate = async (newStatus: Proposal["status"]) => {
    if (!proposal) return

    try {
      await updateProposalStatus(proposal.id, newStatus)
      setProposal({ ...proposal, status: newStatus })
      toast({
        title: "Success",
        description: `Proposal status updated to ${newStatus}`,
      })
    } catch (error) {
      console.error("Error updating status:", error)
      toast({
        title: "Error",
        description: "Failed to update proposal status",
        variant: "destructive",
      })
    }
  }

  // Callback for when the proposal is successfully sent from the dialog
  const handleProposalSent = (proposalId: string, newStatus: Proposal["status"]) => {
    setProposal((prev) => (prev ? { ...prev, status: newStatus } : null))
    // Toast is handled by the dialog itself
  }

  const handleDownloadPDF = async () => {
    if (!proposal) return

    setDownloadingPDF(true)
    try {
      await generateProposalPDF(proposal)
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

  const handleGenerateQuotation = () => {
    router.push(`/sales/proposals/${params.id}/generate-quotation`)
  }

  const handleImageClick = (media: { url: string; isVideo: boolean }) => {
    setLightboxImage(media)
  }

  const getStatusConfig = (status: string) => {
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
      case "viewed":
        return {
          color: "bg-yellow-100 text-yellow-800 border-yellow-200",
          icon: <Eye className="h-3.5 w-3.5" />,
          label: "Viewed",
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
      case "cost_estimate_pending":
        return {
          color: "bg-orange-100 text-orange-800 border-orange-200",
          icon: <Calculator className="h-3.5 w-3.5" />,
          label: "Cost Estimate Pending",
        }
      case "cost_estimate_approved":
        return {
          color: "bg-purple-100 text-purple-800 border-purple-200",
          icon: <CheckCircle className="h-3.5 w-3.5" />,
          label: "Cost Estimate Approved",
        }
      case "cost_estimate_rejected":
        return {
          color: "bg-red-100 text-red-800 border-red-200",
          icon: <XCircle className="h-3.5 w-3.5" />,
          label: "Cost Estimate Rejected",
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

  if (!proposal) {
    return (
      <div className="min-h-screen bg-gray-50/50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
            <FileText className="h-8 w-8 text-gray-400" />
          </div>
          <h1 className="text-2xl font-semibold text-gray-900 mb-2">Proposal Not Found</h1>
          <p className="text-gray-600 mb-6">The proposal you're looking for doesn't exist or may have been removed.</p>
          <Button onClick={() => router.push("/sales/proposals")} className="bg-blue-600 hover:bg-blue-700">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Proposals
          </Button>
        </div>
      </div>
    )
  }

  const statusConfig = getStatusConfig(proposal.status)

  return (
    <div className="min-h-screen bg-gray-100 py-6 px-4 sm:px-6 relative">
      {/* Word-style Toolbar */}
      <div className="sticky top-0 z-10 bg-white border-b border-gray-200 shadow-sm mb-6">
        <div className="max-w-[850px] mx-auto px-4 py-2 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push("/sales/proposals")}
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

            {proposal.status === "accepted" && (
              <Button
                onClick={() => router.push(`/sales/proposals/${params.id}/create-cost-estimate`)}
                size="sm"
                className="bg-orange-600 hover:bg-orange-700"
              >
                <Calculator className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">Create Cost Estimate</span>
                <span className="sm:hidden">Cost Estimate</span>
              </Button>
            )}
            {proposal.status === "cost_estimate_approved" && (
              <Button onClick={handleGenerateQuotation} size="sm" className="bg-green-600 hover:bg-green-700">
                <FileText className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">Generate Quotation</span>
                <span className="sm:hidden">Quotation</span>
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

        {/* Document Container */}
        <div className="max-w-[850px] bg-white shadow-md rounded-sm overflow-hidden">
          {/* Document Header */}
          <div className="border-b-2 border-blue-600 p-6 sm:p-8">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4">
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-1 font-[Calibri]">PROPOSAL</h1>
                <p className="text-sm text-gray-500">{proposal.id}</p>
              </div>
              <div className="mt-4 sm:mt-0 flex items-center space-x-4">
                {/* QR Code */}
                <div className="flex flex-col items-center">
                  <div className="bg-white p-2 rounded-lg border border-gray-200 shadow-sm">
                    <img
                      src={generateQRCodeUrl(proposal.id) || "/placeholder.svg"}
                      alt="QR Code for proposal view"
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
            {/* Proposal Information */}
            <div className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4 pb-1 border-b border-gray-200 font-[Calibri]">
                Proposal Information
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-2">Title</h3>
                  <p className="text-base font-medium text-gray-900">{proposal.title}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-2">Created Date</h3>
                  <p className="text-base text-gray-900">{proposal.createdAt.toLocaleDateString()}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-2">Valid Until</h3>
                  <p className="text-base text-gray-900">{proposal.validUntil.toLocaleDateString()}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-2">Total Amount</h3>
                  <p className="text-base font-semibold text-gray-900">₱{proposal.totalAmount.toLocaleString()}</p>
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
                  <p className="text-base font-medium text-gray-900">{proposal.client.company}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-2">Contact Person</h3>
                  <p className="text-base text-gray-900">{proposal.client.contactPerson}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-2">Email</h3>
                  <p className="text-base text-gray-900">{proposal.client.email}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-2">Phone</h3>
                  <p className="text-base text-gray-900">{proposal.client.phone}</p>
                </div>
                {proposal.client.industry && (
                  <div>
                    <h3 className="text-sm font-medium text-gray-500 mb-2">Industry</h3>
                    <p className="text-base text-gray-900">{proposal.client.industry}</p>
                  </div>
                )}
                {proposal.client.targetAudience && (
                  <div>
                    <h3 className="text-sm font-medium text-gray-500 mb-2">Target Audience</h3>
                    <p className="text-base text-gray-900">{proposal.client.targetAudience}</p>
                  </div>
                )}
              </div>

              {proposal.client.address && (
                <div className="mt-4">
                  <h3 className="text-sm font-medium text-gray-500 mb-2">Address</h3>
                  <p className="text-base text-gray-900">{proposal.client.address}</p>
                </div>
              )}

              {proposal.client.campaignObjective && (
                <div className="mt-4">
                  <h3 className="text-sm font-medium text-gray-500 mb-2">Campaign Objective</h3>
                  <p className="text-base text-gray-900">{proposal.client.campaignObjective}</p>
                </div>
              )}
            </div>

            {/* Products & Services */}
            <div className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4 pb-1 border-b border-gray-200 font-[Calibri]">
                Products & Services
              </h2>

              <div className="border border-gray-300 rounded-sm overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="py-2 px-4 text-left font-medium text-gray-700 border-b border-gray-300">
                        Product
                      </th>
                      <th className="py-2 px-4 text-left font-medium text-gray-700 border-b border-gray-300">Type</th>
                      <th className="py-2 px-4 text-left font-medium text-gray-700 border-b border-gray-300">
                        Location
                      </th>
                      <th className="py-2 px-4 text-right font-medium text-gray-700 border-b border-gray-300">Price</th>
                    </tr>
                  </thead>
                  <tbody>
                    {proposal.products.map((product, index) => (
                      <tr key={product.id} className={index % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                        <td className="py-3 px-4 border-b border-gray-200">
                          <div className="font-medium text-gray-900">{product.name}</div>
                          {product.site_code && <div className="text-xs text-gray-500">Site: {product.site_code}</div>}
                        </td>
                        <td className="py-3 px-4 border-b border-gray-200">
                          <span className="inline-block px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded">
                            {product.type}
                          </span>
                        </td>
                        <td className="py-3 px-4 border-b border-gray-200">{product.location}</td>
                        <td className="py-3 px-4 text-right border-b border-gray-200">
                          <div className="font-medium text-gray-900">₱{product.price.toLocaleString()}</div>
                          <div className="text-xs text-gray-500">per day</div>
                        </td>
                      </tr>
                    ))}
                    <tr className="bg-gray-50">
                      <td colSpan={3} className="py-3 px-4 text-right font-medium">
                        Total Amount:
                      </td>
                      <td className="py-3 px-4 text-right font-bold text-blue-600">
                        ₱{proposal.totalAmount.toLocaleString()}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Product Details */}
              <div className="mt-8 space-y-8">
                {proposal.products.map((product) => (
                  <div key={product.id} className="border border-gray-200 rounded-sm p-4">
                    <h3 className="text-lg font-medium text-gray-900 mb-3">{product.name} Details</h3>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
                      {product.specs_rental?.traffic_count && (
                        <div>
                          <h4 className="text-xs font-medium text-gray-500 uppercase">Traffic Count</h4>
                          <p className="text-sm text-gray-900">
                            {product.specs_rental.traffic_count.toLocaleString()}/day
                          </p>
                        </div>
                      )}

                      {product.specs_rental?.height && product.specs_rental?.width && (
                        <div>
                          <h4 className="text-xs font-medium text-gray-500 uppercase">Dimensions</h4>
                          <p className="text-sm text-gray-900">
                            {product.specs_rental.height}m × {product.specs_rental.width}m
                          </p>
                        </div>
                      )}

                      {product.specs_rental?.audience_type && (
                        <div>
                          <h4 className="text-xs font-medium text-gray-500 uppercase">Audience Type</h4>
                          <p className="text-sm text-gray-900">{product.specs_rental.audience_type}</p>
                        </div>
                      )}

                      {product.health_percentage && (
                        <div>
                          <h4 className="text-xs font-medium text-gray-500 uppercase">Health Status</h4>
                          <p className="text-sm text-gray-900">{product.health_percentage}%</p>
                        </div>
                      )}
                    </div>

                    {product.description && (
                      <div className="mb-4">
                        <h4 className="text-xs font-medium text-gray-500 uppercase mb-1">Description</h4>
                        <p className="text-sm text-gray-700 leading-relaxed">{product.description}</p>
                      </div>
                    )}

                    {product.media && product.media.length > 0 && (
                      <div>
                        <h4 className="text-xs font-medium text-gray-500 uppercase mb-2">Media</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {product.media.map((media, mediaIndex) => (
                            <div
                              key={mediaIndex}
                              className="relative aspect-video bg-gray-100 rounded border border-gray-200 overflow-hidden hover:shadow-lg transition-all cursor-pointer group"
                              onClick={() => handleImageClick(media)}
                            >
                              {media.isVideo ? (
                                <video src={media.url} className="w-full h-full object-cover" />
                              ) : (
                                <img
                                  src={media.url || "/placeholder.svg"}
                                  alt="Product media"
                                  className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                                />
                              )}
                              <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all flex items-center justify-center">
                                <div className="opacity-0 group-hover:opacity-100 transition-opacity bg-white rounded-full p-2">
                                  <svg
                                    className="w-6 h-6 text-gray-700"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                  >
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth={2}
                                      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7"
                                    />
                                  </svg>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Additional Information */}
            {(proposal.notes || proposal.customMessage) && (
              <div className="mb-8">
                <h2 className="text-xl font-semibold text-gray-900 mb-4 pb-1 border-b border-gray-200 font-[Calibri]">
                  Additional Information
                </h2>

                {proposal.customMessage && (
                  <div className="mb-4">
                    <h3 className="text-sm font-medium text-gray-500 mb-2">Custom Message</h3>
                    <div className="bg-blue-50 border border-blue-200 rounded-sm p-4">
                      <p className="text-sm text-gray-700 leading-relaxed">{proposal.customMessage}</p>
                    </div>
                  </div>
                )}

                {proposal.notes && (
                  <div>
                    <h3 className="text-sm font-medium text-gray-500 mb-2">Internal Notes</h3>
                    <div className="bg-gray-50 border border-gray-200 rounded-sm p-4">
                      <p className="text-sm text-gray-700 leading-relaxed">{proposal.notes}</p>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Cost Estimates */}
            <div className="mb-8">
              <CostEstimatesList proposalId={proposal.id} />
            </div>

            {/* Document Footer */}
            <div className="mt-12 pt-6 border-t border-gray-200 text-center text-xs text-gray-500">
              <p>This proposal is valid until {proposal.validUntil.toLocaleDateString()}</p>
              <p className="mt-1">© {new Date().getFullYear()} OH+ Outdoor Advertising. All rights reserved.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Floating Send Button - now opens dialog */}
      {proposal.status === "draft" && (
        <Button
          onClick={() => setIsSendDialogOpen(true)} // Open the new dialog
          className="fixed bottom-6 right-32 bg-green-500 hover:bg-green-600 text-white font-bold py-3 px-6 rounded-full shadow-lg transition-all duration-200 ease-in-out transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-green-400 focus:ring-opacity-75"
        >
          <Send className="h-5 w-5 mr-2" />
          Send
        </Button>
      )}

      {/* Send Proposal Dialog */}
      {proposal && (
        <SendProposalDialog
          isOpen={isSendDialogOpen}
          onClose={() => setIsSendDialogOpen(false)}
          proposal={proposal}
          onProposalSent={handleProposalSent}
        />
      )}

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
                proposalId={proposal.id}
                currentUserId="current_user"
                currentUserName="Current User"
              />
            </div>
          </div>
        </>
      )}
      {/* Image Lightbox */}
      {lightboxImage && (
        <div
          className="fixed inset-0 bg-black bg-opacity-75 z-50 flex items-center justify-center p-4"
          onClick={() => setLightboxImage(null)}
        >
          <div className="relative max-w-4xl max-h-full" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => setLightboxImage(null)}
              className="absolute -top-10 right-0 text-white hover:text-gray-300 transition-colors"
            >
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            {lightboxImage.isVideo ? (
              <video src={lightboxImage.url} className="max-w-full max-h-full rounded-lg" controls autoPlay />
            ) : (
              <img
                src={lightboxImage.url || "/placeholder.svg"}
                alt="Expanded view"
                className="max-w-full max-h-full rounded-lg"
              />
            )}
          </div>
        </div>
      )}
    </div>
  )
}

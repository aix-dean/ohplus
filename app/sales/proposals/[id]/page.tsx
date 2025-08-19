"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
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
  Save,
  X,
} from "lucide-react"
import { getProposalById, updateProposalStatus, updateProposal } from "@/lib/proposal-service"
import { generateProposalPDF } from "@/lib/pdf-service"
import type { Proposal, ProposalClient } from "@/lib/types/proposal"
import { useToast } from "@/hooks/use-toast"
import { ProposalActivityTimeline } from "@/components/proposal-activity-timeline"
import { SendProposalDialog } from "@/components/send-proposal-dialog"
import { SendProposalOptionsDialog } from "@/components/send-proposal-options-dialog"
import { ComingSoonDialog } from "@/components/coming-soon-dialog"

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
  const [editableProposal, setEditableProposal] = useState<Proposal | null>(null)
  const [loading, setLoading] = useState(true)
  const [downloadingPDF, setDownloadingPDF] = useState(false)
  const [timelineOpen, setTimelineOpen] = useState(false)
  const [lightboxImage, setLightboxImage] = useState<{ url: string; isVideo: boolean } | null>(null)
  const [isSendOptionsDialogOpen, setIsSendOptionsDialogOpen] = useState(false) // State for options dialog
  const [isSendEmailDialogOpen, setIsSendEmailDialogOpen] = useState(false) // State for email dialog
  const [isEditing, setIsEditing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [isComingSoonDialogOpen, setIsComingSoonDialogOpen] = useState(false) // State for Coming Soon dialog

  useEffect(() => {
    async function fetchProposal() {
      if (params.id) {
        try {
          const proposalData = await getProposalById(params.id as string)
          setProposal(proposalData)
          setEditableProposal(proposalData) // Initialize editable state
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
      setEditableProposal((prev) => (prev ? { ...prev, status: newStatus } : null))
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

  const handleProposalSent = (proposalId: string, newStatus: Proposal["status"]) => {
    setProposal((prev) => (prev ? { ...prev, status: newStatus } : null))
    setEditableProposal((prev) => (prev ? { ...prev, status: newStatus } : null))
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

  const handleEditClick = () => {
    if (proposal) {
      setEditableProposal({ ...proposal }) // Create a shallow copy for editing
      setIsEditing(true)
    }
  }

  const handleCancelEdit = () => {
    setEditableProposal(proposal) // Revert to original proposal data
    setIsEditing(false)
    toast({
      title: "Cancelled",
      description: "Editing cancelled. Changes were not saved.",
    })
  }

  const handleSaveEdit = async () => {
    if (!editableProposal || !params.id) return

    setIsSaving(true)
    try {
      // Assuming a fixed user ID and name for now, replace with actual user context
      const currentUserId = "current_user_id"
      const currentUserName = "Current User"

      await updateProposal(editableProposal.id, editableProposal, currentUserId, currentUserName)
      setProposal(editableProposal) // Update the main proposal state with saved changes
      setIsEditing(false)
      toast({
        title: "Success",
        description: "Proposal updated successfully!",
      })
    } catch (error) {
      console.error("Error saving proposal:", error)
      toast({
        title: "Error",
        description: "Failed to save proposal changes.",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    if (name.startsWith("client.")) {
      const clientField = name.split(".")[1] as keyof ProposalClient
      setEditableProposal((prev) => ({
        ...prev!,
        client: {
          ...prev!.client,
          [clientField]: value,
        },
      }))
    } else {
      setEditableProposal((prev) => ({
        ...prev!,
        [name]: value,
      }))
    }
  }

  const handleDateChange = (date: Date | undefined) => {
    setEditableProposal((prev) => ({
      ...prev!,
      validUntil: date || new Date(), // Set to current date if undefined
    }))
  }

  const handleSelectSendOption = (option: "email" | "whatsapp" | "viber" | "messenger") => {
    setIsSendOptionsDialogOpen(false) // Close the options dialog
    if (option === "email") {
      setIsSendEmailDialogOpen(true) // Open the email dialog
    } else {
      // Handle other options like SMS here if implemented
      toast({
        title: "Not Implemented",
        description: `Sending via ${option.toUpperCase()} is not yet available.`,
      })
    }
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
      <div className="min-h-screen bg-gray-50/50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-gray-600">Loading proposal...</p>
        </div>
        <div className="absolute inset-0 bg-white/80 backdrop-blur-sm">
          <div className="flex items-center justify-center h-full">
            <div className="text-center space-y-4">
              <div className="w-16 h-16 mx-auto bg-gray-100 rounded-full flex items-center justify-center animate-pulse">
                <FileText className="h-8 w-8 text-gray-400" />
              </div>
              <div className="space-y-2">
                <div className="h-4 bg-gray-200 rounded w-48 mx-auto animate-pulse"></div>
                <div className="h-4 bg-gray-200 rounded w-32 mx-auto animate-pulse"></div>
              </div>
              <div className="grid grid-cols-2 gap-4 w-64 mx-auto">
                <div className="h-32 bg-gray-200 rounded-lg animate-pulse"></div>
                <div className="h-32 bg-gray-200 rounded-lg animate-pulse"></div>
              </div>
              <div className="space-y-2">
                <div className="h-48 bg-gray-200 rounded-lg"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!proposal || !editableProposal) {
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
    <div
      className="min-h-screen py-6 px-4 sm:px-6 relative"
      style={{
        backgroundImage: `url('/placeholder.svg?height=1080&width=1920')`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
      }}
    >
      <div className="absolute inset-0 bg-black/20"></div>

      <div className="sticky top-0 z-10 bg-white/90 backdrop-blur-sm border-b border-gray-200 shadow-sm mb-6">
        <div className="max-w-[850px] mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.back()}
              className="text-gray-600 hover:text-gray-900"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              <span className="font-semibold">Finalize Proposal</span>
            </Button>
            <span className="text-gray-400">|</span>
            <span className="font-medium text-gray-900">{proposal.proposalNumber}</span>
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

      <div className="flex justify-center items-start gap-6 mt-6 relative z-10">
        <div className="flex flex-col space-y-4 z-20 hidden lg:flex">
          <Button
            variant="ghost"
            onClick={() => setIsComingSoonDialogOpen(true)}
            className="h-16 w-16 flex flex-col items-center justify-center p-2 rounded-lg bg-white/90 backdrop-blur-sm shadow-md border border-gray-200 hover:bg-white/95"
          >
            <LayoutGrid className="h-8 w-8 text-gray-500 mb-1" />
            <span className="text-[10px] text-gray-700">Templates</span>
          </Button>
          <Button
            variant="ghost"
            onClick={handleEditClick}
            disabled={isEditing}
            className="h-16 w-16 flex flex-col items-center justify-center p-2 rounded-lg bg-white/90 backdrop-blur-sm shadow-md border border-gray-200 hover:bg-white/95"
          >
            <Pencil className="h-8 w-8 text-gray-500 mb-1" />
            <span className="text-[10px] text-gray-700">Edit</span>
          </Button>
          <Button
            variant="ghost"
            onClick={handleDownloadPDF}
            disabled={downloadingPDF}
            className="h-16 w-16 flex flex-col items-center justify-center p-2 rounded-lg bg-white/90 backdrop-blur-sm shadow-md border border-gray-200 hover:bg-white/95"
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

        <div className="max-w-[850px] bg-white/95 backdrop-blur-sm shadow-lg rounded-lg overflow-hidden">
          <div className="p-8">
            <div className="flex items-start justify-between mb-8">
              <div className="flex items-center space-x-6">
                <div className="bg-yellow-400 rounded-full p-4 shadow-lg">
                  <div className="text-2xl font-bold text-black">GTS</div>
                </div>

                <div>
                  <h1 className="text-3xl font-bold text-gray-900 mb-2">{proposal.title}</h1>
                  <div className="inline-block bg-green-500 text-white px-4 py-2 rounded-full font-bold text-lg">
                    ₱{proposal.totalAmount.toLocaleString()}.00
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
              <div className="space-y-4">
                {proposal.products[0]?.media && proposal.products[0].media.length > 0 && (
                  <div className="relative">
                    <img
                      src={
                        proposal.products[0].media[0].url ||
                        "/placeholder.svg?height=300&width=400&query=building billboard" ||
                        "/placeholder.svg"
                      }
                      alt="Building Location"
                      className="w-full h-80 object-cover rounded-lg shadow-md"
                    />
                  </div>
                )}
              </div>

              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Location Map:</h3>
                  <div className="bg-gray-100 h-32 rounded-lg flex items-center justify-center mb-4">
                    <span className="text-gray-500">Map Placeholder</span>
                  </div>
                </div>

                <div className="space-y-3">
                  <div>
                    <span className="font-semibold text-gray-900">Location: </span>
                    <span className="text-gray-700">{proposal.products[0]?.location || "Location details"}</span>
                  </div>

                  <div>
                    <span className="font-semibold text-gray-900">Average Daily Traffic Count: </span>
                    <span className="text-gray-700">
                      {proposal.products[0]?.specs_rental?.traffic_count
                        ? `${proposal.products[0].specs_rental.traffic_count.toLocaleString()} vehicles`
                        : "405,882 vehicles"}
                    </span>
                  </div>

                  <div>
                    <span className="font-semibold text-gray-900">Location Visibility: </span>
                    <span className="text-gray-700">500 meters</span>
                  </div>

                  <div>
                    <span className="font-semibold text-gray-900">Dimension: </span>
                    <span className="text-gray-700">
                      {proposal.products[0]?.specs_rental?.height && proposal.products[0]?.specs_rental?.width
                        ? `${proposal.products[0].specs_rental.height}ft (H) x ${proposal.products[0].specs_rental.width}ft (W)`
                        : "150ft (H) x 83ft (W)"}
                    </span>
                  </div>

                  <div>
                    <span className="font-semibold text-gray-900">Type: </span>
                    <span className="text-gray-700">{proposal.products[0]?.type || "Building Wrap"}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between pt-6 border-t border-gray-200">
              <div className="bg-yellow-400 rounded-full p-3">
                <div className="text-xl font-bold text-black">GTS</div>
              </div>

              <div className="flex space-x-4">
                {proposal.status === "draft" && (
                  <>
                    <Button
                      onClick={() => handleStatusUpdate("draft")}
                      variant="outline"
                      className="bg-white hover:bg-gray-50 text-gray-700 border-gray-300 font-semibold py-2 px-6 rounded-full"
                    >
                      Save as Draft
                    </Button>
                    <Button
                      onClick={() => setIsSendOptionsDialogOpen(true)}
                      className="bg-green-500 hover:bg-green-600 text-white font-semibold py-2 px-8 rounded-full"
                    >
                      Send
                    </Button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="w-80 bg-white/90 backdrop-blur-sm rounded-lg shadow-md p-6 hidden xl:block">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Proposal History</h3>
          <div className="space-y-4">
            <div className="flex items-start space-x-3">
              <div className="w-3 h-3 bg-blue-500 rounded-full mt-2"></div>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900">Proposals sent to the chosen client</p>
                <p className="text-xs text-gray-500 mt-1">{proposal.createdAt.toLocaleDateString()}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

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
        proposal.status === "draft" && (
          <div className="fixed bottom-6 right-6 flex space-x-4">
            <Button
              onClick={() => handleStatusUpdate("draft")}
              variant="outline"
              className="bg-white hover:bg-gray-50 text-gray-700 border-gray-300 font-bold py-3 px-6 rounded-full shadow-lg transition-all duration-200 ease-in-out transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-opacity-75"
            >
              <FileText className="h-5 w-5 mr-2" />
              Save as Draft
            </Button>
            <Button
              onClick={() => setIsSendOptionsDialogOpen(true)}
              className="bg-green-500 hover:bg-green-600 text-white font-bold py-3 px-6 rounded-full shadow-lg transition-all duration-200 ease-in-out transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-green-400 focus:ring-opacity-75"
            >
              <Send className="h-5 w-5 mr-2" />
              Send
            </Button>
          </div>
        )
      )}

      {proposal && (
        <SendProposalOptionsDialog
          isOpen={isSendOptionsDialogOpen}
          onClose={() => setIsSendOptionsDialogOpen(false)}
          proposal={proposal}
          onSelectOption={handleSelectSendOption}
        />
      )}

      {proposal && (
        <SendProposalDialog
          isOpen={isSendEmailDialogOpen}
          onClose={() => setIsSendEmailDialogOpen(false)}
          proposal={proposal}
          onProposalSent={handleProposalSent}
        />
      )}

      {timelineOpen && (
        <>
          <div className="fixed inset-0 bg-black bg-opacity-50 z-40" onClick={() => setTimelineOpen(false)} />

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

      <ComingSoonDialog
        isOpen={isComingSoonDialogOpen}
        onClose={() => setIsComingSoonDialogOpen(false)}
        feature="Templates"
      />
    </div>
  )
}

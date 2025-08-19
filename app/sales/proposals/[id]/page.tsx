"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
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
  MapPin,
  Users,
  Ruler,
} from "lucide-react"
import { getProposalById, updateProposalStatus, updateProposal } from "@/lib/proposal-service"
import { generateProposalPDF } from "@/lib/pdf-service"
import type { Proposal } from "@/lib/types/proposal"
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
  const [isEditing, setIsEditing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [downloadingPDF, setDownloadingPDF] = useState(false)
  const [timelineOpen, setTimelineOpen] = useState(false)
  const [lightboxImage, setLightboxImage] = useState<{ url: string; isVideo: boolean } | null>(null)
  const [isSendDialogOpen, setIsSendDialogOpen] = useState(false)
  const [isSendOptionsDialogOpen, setIsSendOptionsDialogOpen] = useState(false)
  const [isSendEmailDialogOpen, setIsSendEmailDialogOpen] = useState(false)
  const [isComingSoonDialogOpen, setIsComingSoonDialogOpen] = useState(false)

  useEffect(() => {
    const fetchProposal = async () => {
      if (!params.id) return

      try {
        setLoading(true)
        const data = await getProposalById(params.id as string)
        setProposal(data)
        setEditableProposal(data)
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

    fetchProposal()
  }, [params.id, toast])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    if (!editableProposal) return

    if (name.startsWith("client.")) {
      const clientField = name.split(".")[1]
      setEditableProposal({
        ...editableProposal,
        client: {
          ...editableProposal.client,
          [clientField]: value,
        },
      })
    } else {
      setEditableProposal({
        ...editableProposal,
        [name]: value,
      })
    }
  }

  const handleDateChange = (date: Date | undefined) => {
    if (!editableProposal || !date) return
    setEditableProposal({
      ...editableProposal,
      validUntil: date,
    })
  }

  const handleEditClick = () => {
    setIsEditing(true)
  }

  const handleCancelEdit = () => {
    setIsEditing(false)
    setEditableProposal(proposal)
  }

  const handleSaveEdit = async () => {
    if (!editableProposal) return

    try {
      setIsSaving(true)
      const updatedProposal = await updateProposal(editableProposal.id, editableProposal)
      setProposal(updatedProposal)
      setEditableProposal(updatedProposal)
      setIsEditing(false)
      toast({
        title: "Success",
        description: "Proposal updated successfully",
      })
    } catch (error) {
      console.error("Error updating proposal:", error)
      toast({
        title: "Error",
        description: "Failed to update proposal",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  const handleStatusUpdate = async (status: string) => {
    if (!proposal) return

    try {
      await updateProposalStatus(proposal.id, status)
      setProposal({ ...proposal, status })
      toast({
        title: "Success",
        description: `Proposal ${status === "sent" ? "sent" : "saved"} successfully`,
      })
    } catch (error) {
      console.error("Error updating proposal status:", error)
      toast({
        title: "Error",
        description: "Failed to update proposal status",
        variant: "destructive",
      })
    }
  }

  const handleDownloadPDF = async () => {
    if (!proposal) return

    try {
      setDownloadingPDF(true)
      await generateProposalPDF(proposal)
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

  const handleImageClick = (media: { url: string; isVideo: boolean }) => {
    setLightboxImage(media)
  }

  const handleSelectSendOption = (option: string) => {
    setIsSendOptionsDialogOpen(false)
    if (option === "email") {
      setIsSendEmailDialogOpen(true)
    } else if (option === "direct") {
      handleStatusUpdate("sent")
    }
  }

  const handleProposalSent = () => {
    setIsSendEmailDialogOpen(false)
    if (proposal) {
      setProposal({ ...proposal, status: "sent" })
    }
  }

  const handleGenerateQuotation = () => {
    router.push(`/sales/quotations/create?proposalId=${params.id}`)
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
          color: "bg-purple-100 text-purple-800 border-purple-200",
          icon: <Eye className="h-3.5 w-3.5" />,
          label: "Viewed",
        }
      case "accepted":
        return {
          color: "bg-green-100 text-green-800 border-green-200",
          icon: <CheckCircle className="h-3.5 w-3.5" />,
          label: "Accepted",
        }
      case "rejected":
        return {
          color: "bg-red-100 text-red-800 border-red-200",
          icon: <XCircle className="h-3.5 w-3.5" />,
          label: "Rejected",
        }
      case "cost_estimate_approved":
        return {
          color: "bg-emerald-100 text-emerald-800 border-emerald-200",
          icon: <Calculator className="h-3.5 w-3.5" />,
          label: "Cost Estimate Approved",
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
  const mainProduct = proposal.products[0] // Get the first product for main display

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.back()}
              className="text-gray-600 hover:text-gray-900"
            >
              <ArrowLeft className="h-5 w-5 mr-2" />
              Finalize Proposal
            </Button>
            <span className="text-lg font-semibold text-gray-900">{proposal.proposalNumber}</span>
          </div>
          <Badge className={`${statusConfig.color} border font-medium px-3 py-1`}>
            {statusConfig.icon}
            <span className="ml-1.5">{statusConfig.label}</span>
          </Badge>
        </div>
      </div>

      <div className="flex max-w-7xl mx-auto">
        <div className="w-20 bg-white border-r border-gray-200 p-4 space-y-4">
          <Button
            variant="ghost"
            onClick={() => setIsComingSoonDialogOpen(true)}
            className="w-12 h-12 flex flex-col items-center justify-center p-1 rounded-lg hover:bg-gray-50"
          >
            <LayoutGrid className="h-6 w-6 text-gray-500 mb-1" />
            <span className="text-[8px] text-gray-700">Templates</span>
          </Button>
          <Button
            variant="ghost"
            onClick={handleEditClick}
            disabled={isEditing}
            className="w-12 h-12 flex flex-col items-center justify-center p-1 rounded-lg hover:bg-gray-50"
          >
            <Pencil className="h-6 w-6 text-gray-500 mb-1" />
            <span className="text-[8px] text-gray-700">Edit</span>
          </Button>
          <Button
            variant="ghost"
            onClick={handleDownloadPDF}
            disabled={downloadingPDF}
            className="w-12 h-12 flex flex-col items-center justify-center p-1 rounded-lg hover:bg-gray-50"
          >
            {downloadingPDF ? (
              <Loader2 className="h-6 w-6 text-gray-500 animate-spin" />
            ) : (
              <DownloadIcon className="h-6 w-6 text-gray-500 mb-1" />
            )}
            <span className="text-[8px] text-gray-700">Download</span>
          </Button>
        </div>

        <div className="flex-1 bg-white">
          {/* Colorful cityscape header */}
          <div className="h-24 bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 relative overflow-hidden">
            <img src="/cityscape-banner.png" alt="Cityscape" className="w-full h-full object-cover opacity-80" />
          </div>

          <div className="p-8">
            <div className="flex items-start justify-between mb-8">
              <div className="flex items-center space-x-6">
                <div className="w-16 h-16 bg-yellow-400 rounded-full flex items-center justify-center">
                  <span className="text-2xl font-bold text-black">GTS</span>
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-gray-900 mb-2">
                    {isEditing ? (
                      <Input
                        value={editableProposal.title}
                        onChange={(e) => handleChange({ target: { name: "title", value: e.target.value } })}
                        className="text-3xl font-bold border-none p-0 h-auto"
                      />
                    ) : (
                      proposal.title
                    )}
                  </h1>
                  <div className="bg-green-500 text-white px-4 py-1 rounded-full inline-block">
                    <span className="font-semibold">Php {proposal.totalAmount.toLocaleString()}.00</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="space-y-6">
                {mainProduct?.media && mainProduct.media.length > 0 && (
                  <div className="aspect-video bg-gray-100 rounded-lg overflow-hidden">
                    <img
                      src={mainProduct.media[0].url || "/placeholder.svg?height=300&width=400&query=billboard location"}
                      alt="Product location"
                      className="w-full h-full object-cover cursor-pointer"
                      onClick={() => handleImageClick(mainProduct.media[0])}
                    />
                  </div>
                )}

                {/* Location details */}
                <div className="bg-gray-50 p-6 rounded-lg">
                  <h3 className="text-lg font-semibold mb-4">Location Details</h3>
                  <div className="space-y-3">
                    <div className="flex items-center space-x-2">
                      <MapPin className="h-4 w-4 text-gray-500" />
                      <span className="text-sm">Location: {mainProduct?.location || "N/A"}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Users className="h-4 w-4 text-gray-500" />
                      <span className="text-sm">
                        Average Daily Traffic Count: {mainProduct?.specs_rental?.traffic_count?.toLocaleString() || "0"}{" "}
                        vehicles
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Eye className="h-4 w-4 text-gray-500" />
                      <span className="text-sm">Location Visibility: 500 meters</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Ruler className="h-4 w-4 text-gray-500" />
                      <span className="text-sm">
                        Dimension: {mainProduct?.specs_rental?.height || "N/A"}ft (H) x{" "}
                        {mainProduct?.specs_rental?.width || "N/A"}ft (W)
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <FileText className="h-4 w-4 text-gray-500" />
                      <span className="text-sm">Type: {mainProduct?.type || "Building Wrap"}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold mb-4">Location Map:</h3>
                  <div className="aspect-square bg-gray-100 rounded-lg flex items-center justify-center">
                    <div className="text-center">
                      <MapPin className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                      <p className="text-gray-500">Interactive map will be displayed here</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {isEditing && (
              <div className="mt-8 p-6 bg-gray-50 rounded-lg">
                <h3 className="text-lg font-semibold mb-4">Client Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="client.company">Company</Label>
                    <Input
                      id="client.company"
                      name="client.company"
                      value={editableProposal.client.company}
                      onChange={handleChange}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="client.contactPerson">Contact Person</Label>
                    <Input
                      id="client.contactPerson"
                      name="client.contactPerson"
                      value={editableProposal.client.contactPerson}
                      onChange={handleChange}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="client.email">Email</Label>
                    <Input
                      id="client.email"
                      name="client.email"
                      value={editableProposal.client.email}
                      onChange={handleChange}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="client.phone">Phone</Label>
                    <Input
                      id="client.phone"
                      name="client.phone"
                      value={editableProposal.client.phone}
                      onChange={handleChange}
                      className="mt-1"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="h-16 bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 relative overflow-hidden">
            <img src="/cityscape-banner.png" alt="Cityscape" className="w-full h-full object-cover opacity-80" />
          </div>

          <div className="p-8 bg-white">
            <div className="flex items-center justify-between">
              <div className="w-12 h-12 bg-yellow-400 rounded-full flex items-center justify-center">
                <span className="text-lg font-bold text-black">GTS</span>
              </div>

              <div className="flex space-x-4">
                {isEditing ? (
                  <>
                    <Button onClick={handleCancelEdit} variant="outline" className="px-8 py-2 bg-transparent">
                      <X className="h-4 w-4 mr-2" />
                      Cancel
                    </Button>
                    <Button
                      onClick={handleSaveEdit}
                      disabled={isSaving}
                      className="bg-green-500 hover:bg-green-600 px-8 py-2"
                    >
                      {isSaving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                      Save Changes
                    </Button>
                  </>
                ) : proposal.status === "draft" ? (
                  <>
                    <Button onClick={() => handleStatusUpdate("draft")} variant="outline" className="px-8 py-2">
                      Save as Draft
                    </Button>
                    <Button
                      onClick={() => setIsSendOptionsDialogOpen(true)}
                      className="bg-green-500 hover:bg-green-600 px-8 py-2"
                    >
                      <Send className="h-4 w-4 mr-2" />
                      Send
                    </Button>
                  </>
                ) : null}
              </div>
            </div>
          </div>
        </div>

        <div className="w-80 bg-gray-50 border-l border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">Proposal History</h3>
            <Button variant="ghost" size="sm" onClick={() => setTimelineOpen(!timelineOpen)}>
              <History className="h-4 w-4" />
            </Button>
          </div>

          <div className="space-y-4">
            <ProposalActivityTimeline
              proposalId={proposal.id}
              currentUserId="current_user"
              currentUserName="Current User"
            />
          </div>
        </div>
      </div>

      {/* Floating Action Buttons */}
      {/* {isEditing ? (
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
              onClick={() => handleStatusUpdate("draft")} // Explicitly save as draft
              variant="outline" // Use outline variant for a secondary action
              className="bg-white hover:bg-gray-50 text-gray-700 border-gray-300 font-bold py-3 px-6 rounded-full shadow-lg transition-all duration-200 ease-in-out transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-opacity-75"
            >
              <FileText className="h-5 w-5 mr-2" />
              Save as Draft
            </Button>
            <Button
              onClick={() => setIsSendOptionsDialogOpen(true)} // Open the options dialog first
              className="bg-green-500 hover:bg-green-600 text-white font-bold py-3 px-6 rounded-full shadow-lg transition-all duration-200 ease-in-out transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-green-400 focus:ring-opacity-75"
            >
              <Send className="h-5 w-5 mr-2" />
              Send
            </Button>
          </div>
        )
      )} */}

      {/* Send Proposal Options Dialog */}
      {proposal && (
        <SendProposalOptionsDialog
          isOpen={isSendOptionsDialogOpen}
          onClose={() => setIsSendOptionsDialogOpen(false)}
          proposal={proposal}
          onSelectOption={handleSelectSendOption}
        />
      )}

      {/* Send Proposal Email Dialog */}
      {proposal && (
        <SendProposalDialog
          isOpen={isSendEmailDialogOpen}
          onClose={() => setIsSendEmailDialogOpen(false)}
          proposal={proposal}
          onProposalSent={handleProposalSent}
        />
      )}

      {/* Timeline Sidebar */}
      {/* {timelineOpen && (
        <>
          {/* Backdrop */}
      {/* <div className="fixed inset-0 bg-black bg-opacity-50 z-40" onClick={() => setTimelineOpen(false)} /> */}

      {/* Sidebar */}
      {/* <div className="fixed right-0 top-0 h-full w-80 sm:w-96 bg-white shadow-xl z-50 transform transition-transform duration-300 ease-in-out">
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
      )} */}
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

      {/* Coming Soon Dialog */}
      <ComingSoonDialog
        isOpen={isComingSoonDialogOpen}
        onClose={() => setIsComingSoonDialogOpen(false)}
        feature="Templates"
      />
    </div>
  )
}

"use client"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Eye, CheckCircle, XCircle, Mail, Phone, Download, AlertCircle } from "lucide-react"
import type { Proposal } from "@/lib/types/proposal"
import Image from "next/image"
import { initializeApp, getApps } from "firebase/app"
import { getFirestore } from "firebase/firestore"
import { generateProposalPDF } from "@/lib/pdf-service"
import { logProposalPDFGenerated } from "@/lib/proposal-activity-service"
import { updateProposalStatus } from "@/lib/proposal-service"
import { useToast } from "@/hooks/use-toast"

// Helper function to generate QR code URL
const generateQRCodeUrl = (proposalId: string) => {
  const proposalViewUrl = `https://ohplus.aix.ph/proposals/view/${proposalId}`
  return `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(proposalViewUrl)}`
}

// Firebase initialization function
function initializeFirebaseIfNeeded() {
  try {
    const firebaseConfig = {
      apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
      authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
      storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
      messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
      appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
    }

    // Check if Firebase is already initialized
    const existingApps = getApps()

    let app
    if (existingApps.length === 0) {
      app = initializeApp(firebaseConfig)
    } else {
      app = existingApps[0]
    }

    // Initialize Firestore
    const db = getFirestore(app)

    return { success: true, db }
  } catch (error) {
    console.error("Firebase initialization error:", error)
    return { success: false, error: error instanceof Error ? error.message : "Unknown error" }
  }
}

// Public PDF generation function using existing service
async function generatePublicProposalPDF(proposal: Proposal) {
  try {
    await generateProposalPDF(proposal, false)
  } catch (error) {
    console.error("Error generating PDF:", error)
    throw error
  }
}

export default function PublicProposalViewPage() {
  const params = useParams()
  const [proposal, setProposal] = useState<Proposal | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false)
  const [isAccepting, setIsAccepting] = useState(false)
  const { toast } = useToast()
  const [lightboxImage, setLightboxImage] = useState<{ url: string; isVideo: boolean } | null>(null)

  useEffect(() => {
    // Initialize Firebase when component mounts
    const firebaseInit = initializeFirebaseIfNeeded()
    if (!firebaseInit.success) {
      setError(`Firebase initialization failed: ${firebaseInit.error}`)
    }

    async function fetchProposal() {
      if (!params.id) {
        setError("Proposal ID is missing.")
        setLoading(false)
        return
      }

      try {
        const response = await fetch(`/api/proposals/public/${params.id}`)
        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.error || "Failed to fetch proposal.")
        }
        const data = await response.json()
        if (data.success && data.proposal) {
          setProposal({
            ...data.proposal,
            createdAt: new Date(data.proposal.createdAt),
            updatedAt: new Date(data.proposal.updatedAt),
            validUntil: new Date(data.proposal.validUntil),
          })
        } else {
          setError("Proposal not found or invalid data.")
        }
      } catch (err) {
        console.error("Error fetching proposal:", err)
        setError(err instanceof Error ? err.message : "Failed to load proposal.")
      } finally {
        setLoading(false)
      }
    }

    fetchProposal()
  }, [params.id])

  const handleDownloadPDF = async () => {
    if (!proposal) return

    setIsGeneratingPDF(true)
    try {
      await generatePublicProposalPDF(proposal)

      // Log PDF generation activity (only for client-side downloads)
      try {
        await logProposalPDFGenerated(
          proposal.id,
          "public_viewer",
          `${proposal.client.contactPerson} (${proposal.client.company})`,
        )
      } catch (error) {
        console.error("Error logging PDF generation:", error)
        // Don't block the UI if logging fails
      }

      toast({
        title: "PDF Downloaded",
        description: "The proposal PDF has been generated and downloaded successfully.",
      })
    } catch (error) {
      console.error("Error generating PDF:", error)
      toast({
        title: "Download Failed",
        description: "Failed to generate PDF. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsGeneratingPDF(false)
    }
  }

  const handleAcceptProposal = async () => {
    if (!proposal) return

    setIsAccepting(true)
    try {
      // Update proposal status to accepted with custom user info for public viewer
      await updateProposalStatus(
        proposal.id,
        "accepted",
        "public_viewer",
        `${proposal.client.contactPerson} (${proposal.client.company})`,
      )

      // Update local state
      setProposal((prev) => (prev ? { ...prev, status: "accepted" } : null))

      toast({
        title: "Proposal Accepted",
        description: "Thank you! Your proposal has been accepted. Our team will contact you shortly.",
      })
    } catch (error) {
      console.error("Error accepting proposal:", error)
      toast({
        title: "Error",
        description: "Failed to accept proposal. Please try again or contact our sales team.",
        variant: "destructive",
      })
    } finally {
      setIsAccepting(false)
    }
  }

  const handleContactSales = () => {
    const subject = encodeURIComponent(`Inquiry about Proposal: ${proposal?.title || "Proposal"}`)
    const body = encodeURIComponent(`Hello,

I would like to discuss the proposal "${proposal?.title || "Proposal"}" for ${proposal?.client.company || "our company"}.

Please contact me at your earliest convenience.

Best regards,
${proposal?.client.contactPerson || "Client"}`)

    window.location.href = `mailto:sales@oohoperator.com?subject=${subject}&body=${body}`
  }

  const handleImageClick = (media: { url: string; isVideo: boolean }) => {
    setLightboxImage(media)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "draft":
        return "bg-gray-500"
      case "sent":
        return "bg-blue-500"
      case "viewed":
        return "bg-yellow-500"
      case "accepted":
        return "bg-green-500"
      case "declined":
        return "bg-red-500"
      default:
        return "bg-gray-500"
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "accepted":
        return <CheckCircle className="h-4 w-4" />
      case "declined":
        return <XCircle className="h-4 w-4" />
      case "viewed":
        return <Eye className="h-4 w-4" />
      default:
        return null
    }
  }

  // Show loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading proposal...</p>
        </div>
      </div>
    )
  }

  // Show error state
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <div className="mb-6">
            <Image src="/oh-plus-logo.png" alt="OH+ Logo" width={80} height={80} className="mx-auto mb-4" />
            <div className="flex items-center justify-center mb-4">
              <AlertCircle className="h-8 w-8 text-red-500 mr-2" />
              <h1 className="text-2xl font-bold text-gray-900">Error Loading Proposal</h1>
            </div>
            <p className="text-gray-600 mb-4">{error}</p>
            <div className="mt-4">
              <Button onClick={() => window.location.reload()} variant="outline" className="text-sm">
                Try Again
              </Button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Show proposal not found if no proposal after loading
  if (!proposal) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <div className="mb-6">
            <Image src="/oh-plus-logo.png" alt="OH+ Logo" width={80} height={80} className="mx-auto mb-4" />
            <div className="flex items-center justify-center mb-4">
              <AlertCircle className="h-8 w-8 text-red-500 mr-2" />
              <h1 className="text-2xl font-bold text-gray-900">Proposal Not Found</h1>
            </div>
            <p className="text-gray-600 mb-4">The proposal you're looking for doesn't exist or has been removed.</p>
            <div className="mt-4">
              <Button onClick={() => window.location.reload()} variant="outline" className="text-sm">
                Try Again
              </Button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-100 py-6 px-4 sm:px-6">
      {/* Custom Header for Public View */}
      <div className="sticky top-0 z-10 bg-white border-b border-gray-200 shadow-sm mb-6">
        <div className="max-w-[850px] mx-auto px-4 py-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center space-x-3 sm:space-x-4">
            <Image src="/oh-plus-logo.png" alt="OH+ Logo" width={32} height={32} className="sm:w-10 sm:h-10" />
            <div>
              <h1 className="text-lg sm:text-xl font-bold text-gray-900">OH Plus</h1>
              <p className="text-xs sm:text-sm text-gray-600">Professional Advertising Solutions</p>
            </div>
          </div>
          <div className="flex items-center space-x-2 w-full sm:w-auto justify-between sm:justify-end">
            <div className="flex flex-col items-center space-y-1">
              <div className="bg-white p-1 rounded border border-gray-200">
                <img
                  src={generateQRCodeUrl(proposal.id) || "/placeholder.svg"}
                  alt="QR Code"
                  className="w-10 h-10 sm:w-12 sm:h-12"
                />
              </div>
              <span className="text-xs text-gray-500">Share</span>
            </div>
            <Badge className={`${getStatusColor(proposal.status)} text-white border-0 text-xs sm:text-sm`}>
              {getStatusIcon(proposal.status)}
              <span className="ml-1 capitalize">{proposal.status}</span>
            </Badge>
            <Button
              onClick={handleDownloadPDF}
              disabled={isGeneratingPDF}
              size="sm"
              className="bg-blue-600 hover:bg-blue-700 text-xs sm:text-sm px-2 sm:px-4"
            >
              <Download className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
              <span className="hidden sm:inline">{isGeneratingPDF ? "Generating..." : "Download PDF"}</span>
              <span className="sm:hidden">PDF</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Document Container */}
      <div className="max-w-[850px] mx-auto bg-white shadow-md rounded-sm overflow-hidden">
        {/* Document Header */}
        <div className="border-b-2 border-blue-600 p-4 sm:p-6 md:p-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between mb-4">
            <div>
              <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 mb-1 font-[Calibri]">PROPOSAL</h1>
              <p className="text-sm text-gray-500">{proposal.title}</p>
            </div>
            <div className="mt-4 md:mt-0">
              <Image src="/oh-plus-logo.png" alt="Company Logo" width={40} height={40} />
            </div>
          </div>
        </div>

        {/* Document Content */}
        <div className="p-4 sm:p-6 md:p-8">
          {/* Proposal Information */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4 pb-1 border-b border-gray-200 font-[Calibri]">
              Proposal Information
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                <h3 className="text-sm font-medium text-gray-500 mb-2">Total Investment</h3>
                <p className="text-base font-semibold text-green-600">₱{proposal.totalAmount.toLocaleString()}</p>
              </div>
            </div>
          </div>

          {/* Client Information */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4 pb-1 border-b border-gray-200 font-[Calibri]">
              Client Information
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-2">Company</h3>
                <p className="text-base font-medium text-gray-900">{proposal.client.company}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-2">Contact Person</h3>
                <p className="text-base text-gray-900">{proposal.client.contactPerson}</p>
              </div>
              {proposal.client.designation && (
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-2">Designation</h3>
                  <p className="text-base text-gray-900">{proposal.client.designation}</p>
                </div>
              )}
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
              <div className="overflow-x-auto">
                <table className="w-full text-sm min-w-[600px]">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="py-2 px-2 sm:px-4 text-left font-medium text-gray-700 border-b border-gray-300">
                        Product
                      </th>
                      <th className="py-2 px-2 sm:px-4 text-left font-medium text-gray-700 border-b border-gray-300">
                        Type
                      </th>
                      <th className="py-2 px-2 sm:px-4 text-left font-medium text-gray-700 border-b border-gray-300">
                        Location
                      </th>
                      <th className="py-2 px-2 sm:px-4 text-right font-medium text-gray-700 border-b border-gray-300">
                        Price
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {proposal.products.map((product, index) => (
                      <tr key={product.id} className={index % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                        <td className="py-3 px-2 sm:px-4 border-b border-gray-200">
                          <div className="font-medium text-gray-900 text-xs sm:text-sm">{product.name}</div>
                          {product.site_code && <div className="text-xs text-gray-500">Site: {product.site_code}</div>}
                        </td>
                        <td className="py-3 px-2 sm:px-4 border-b border-gray-200">
                          <span className="inline-block px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded">
                            {product.type}
                          </span>
                        </td>
                        <td className="py-3 px-2 sm:px-4 border-b border-gray-200 text-xs sm:text-sm">
                          {product.location}
                        </td>
                        <td className="py-3 px-2 sm:px-4 text-right border-b border-gray-200">
                          <div className="font-medium text-gray-900 text-xs sm:text-sm">
                            ₱{product.price.toLocaleString()}
                          </div>
                          <div className="text-xs text-gray-500">per day</div>
                        </td>
                      </tr>
                    ))}
                    <tr className="bg-gray-50">
                      <td colSpan={3} className="py-3 px-2 sm:px-4 text-right font-medium text-xs sm:text-sm">
                        Total Investment:
                      </td>
                      <td className="py-3 px-2 sm:px-4 text-right font-bold text-green-600 text-sm sm:text-base">
                        ₱{proposal.totalAmount.toLocaleString()}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Product Details */}
            <div className="mt-8 space-y-8">
              {proposal.products.map((product) => (
                <div key={product.id} className="border border-gray-200 rounded-sm p-4">
                  <h3 className="text-lg font-medium text-gray-900 mb-3">{product.name} Details</h3>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
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
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
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
                                  className="w-4 h-4 sm:w-6 sm:h-6 text-gray-700"
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

          {/* Client Actions */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4 pb-1 border-b border-gray-200 font-[Calibri]">
              Next Steps
            </h2>

            {proposal.status === "accepted" ? (
              <div className="bg-green-50 border border-green-200 rounded-sm p-4 sm:p-6">
                <div className="flex items-center text-green-700 mb-3">
                  <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
                  <span className="font-semibold text-base sm:text-lg">Proposal Accepted!</span>
                </div>
                <p className="text-green-600 mb-4 text-sm sm:text-base">
                  Thank you for accepting our proposal. Our team is now preparing your quotation and will contact you
                  shortly with the next steps.
                </p>
                <div className="space-y-3">
                  <Button
                    variant="outline"
                    className="w-full text-sm sm:text-base bg-transparent"
                    onClick={handleContactSales}
                  >
                    <Mail className="h-4 w-4 mr-2" />
                    Contact Sales Team
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <p className="text-gray-600 mb-4 text-sm sm:text-base">
                  We're excited about the opportunity to work with you. Please review our proposal and let us know your
                  decision.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Button
                    onClick={handleAcceptProposal}
                    disabled={isAccepting}
                    className="bg-green-600 hover:bg-green-700 text-sm sm:text-base"
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    {isAccepting ? "Accepting..." : "Accept Proposal"}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={handleContactSales}
                    className="text-sm sm:text-base bg-transparent"
                  >
                    <Mail className="h-4 w-4 mr-2" />
                    Contact Sales Team
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* Contact Information */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4 pb-1 border-b border-gray-200 font-[Calibri]">
              Contact Information
            </h2>

            <div className="bg-gray-50 border border-gray-200 rounded-sm p-4 sm:p-6">
              <p className="text-sm text-gray-600 mb-4">
                Have questions about this proposal? We'd love to discuss it with you.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex items-center space-x-3">
                  <Mail className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">Email</p>
                    <p className="text-sm text-blue-600 break-all">sales@oohoperator.com</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <Phone className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">Phone</p>
                    <p className="text-sm text-blue-600">+63 123 456 7890</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Document Footer */}
          <div className="mt-12 pt-6 border-t border-gray-200 text-center text-xs text-gray-500">
            <p>This proposal is valid until {proposal.validUntil.toLocaleDateString()}</p>
            <p className="mt-1">© {new Date().getFullYear()} OH+ Outdoor Advertising. All rights reserved.</p>
          </div>
        </div>
      </div>
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

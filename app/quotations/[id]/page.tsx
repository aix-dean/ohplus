"use client"
import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { parseISO } from "date-fns"
import { CheckCircle, XCircle, FileText, Clock, Send, Eye, Download, ArrowLeft, Share2 } from "lucide-react"
import { getQuotationById, generateQuotationPDF, type Quotation } from "@/lib/quotation-service"
import { useToast } from "@/hooks/use-toast"

// Helper function to generate QR code URL
const generateQRCodeUrl = (quotationId: string) => {
  const quotationViewUrl = `${process.env.NEXT_PUBLIC_APP_URL}/quotations/${quotationId}`
  return `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(quotationViewUrl)}`
}

// Helper function to safely convert any value to string
const safeString = (value: any): string => {
  if (value === null || value === undefined) return "N/A"
  if (typeof value === "string") return value
  if (typeof value === "number") return value.toLocaleString()
  if (typeof value === "boolean") return value.toString()
  if (value && typeof value === "object") {
    if (value.id) return value.id.toString()
    if (value.toString) return value.toString()
    return "N/A"
  }
  return String(value)
}

// Helper function to get a Date object from a potential Firebase Timestamp, Date, or string
const getDateObject = (date: any): Date | undefined => {
  if (date === null || date === undefined) {
    return undefined
  }
  if (date instanceof Date) {
    return date
  }
  // Check for Firebase Timestamp structure (has toDate method)
  if (typeof date === "object" && date.toDate && typeof date.toDate === "function") {
    return date.toDate()
  }
  // Attempt to parse string dates
  if (typeof date === "string") {
    const parsedDate = parseISO(date)
    if (!isNaN(parsedDate.getTime())) {
      return parsedDate
    }
  }
  console.warn("getDateObject received unexpected or invalid date type:", typeof date, date)
  return undefined
}

export default function PublicQuotationPage() {
  const params = useParams()
  const router = useRouter()
  const { toast } = useToast()
  const [quotation, setQuotation] = useState<Quotation | null>(null)
  const [loading, setLoading] = useState(true)
  const [showQRModal, setShowQRModal] = useState(false)
  const [currentProductPage, setCurrentProductPage] = useState(0)

  useEffect(() => {
    async function fetchQuotationData() {
      if (params.id) {
        try {
          const quotationId = Array.isArray(params.id) ? params.id[0] : params.id
          const quotationData = await getQuotationById(quotationId)

          if (!quotationData) {
            toast({
              title: "Error",
              description: "Quotation not found.",
              variant: "destructive",
            })
            return
          }

          setQuotation(quotationData)
        } catch (error) {
          console.error("Error fetching quotation:", error)
          toast({
            title: "Error",
            description: "Failed to load quotation details",
            variant: "destructive",
          })
        } finally {
          setLoading(false)
        }
      }
    }

    fetchQuotationData()
  }, [params.id, toast])

  const getStatusConfig = (status: string) => {
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
      case "rejected":
        return {
          color: "bg-red-100 text-red-800 border-red-200",
          icon: <XCircle className="h-3.5 w-3.5" />,
          label: "Rejected",
        }
      case "expired":
        return {
          color: "bg-orange-100 text-orange-800 border-orange-200",
          icon: <Clock className="h-3.5 w-3.5" />,
          label: "Expired",
        }
      default:
        return {
          color: "bg-gray-100 text-gray-800 border-gray-200",
          icon: <FileText className="h-3.5 w-3.5" />,
          label: "Unknown",
        }
    }
  }

  const formatDate = (date: any) => {
    if (!date) return "N/A"
    try {
      const dateObj = getDateObject(date)
      if (!dateObj) return "N/A"
      return new Intl.DateTimeFormat("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      }).format(dateObj)
    } catch (error) {
      console.error("Error formatting date:", error)
      return "Invalid Date"
    }
  }

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case "draft":
        return "bg-gray-500"
      case "sent":
        return "bg-blue-500"
      case "viewed":
        return "bg-yellow-500"
      case "accepted":
        return "bg-green-500"
      case "rejected":
        return "bg-red-500"
      default:
        return "bg-gray-500"
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status?.toLowerCase()) {
      case "accepted":
        return <CheckCircle className="h-4 w-4" />
      case "rejected":
        return <XCircle className="h-4 w-4" />
      case "viewed":
        return <Eye className="h-4 w-4" />
      default:
        return null
    }
  }

  const handleDownloadPdf = async () => {
    if (quotation) {
      try {
        await generateQuotationPDF(quotation)
        toast({
          title: "Success",
          description: "Quotation PDF downloaded successfully.",
        })
      } catch (error) {
        console.error("Error generating PDF:", error)
        toast({
          title: "Error",
          description: "Failed to download quotation PDF.",
          variant: "destructive",
        })
      }
    }
  }

  const copyLinkToClipboard = () => {
    if (!quotation) return

    const url = `${process.env.NEXT_PUBLIC_APP_URL}/quotations/${quotation.id}`
    navigator.clipboard.writeText(url)

    toast({
      title: "Link copied",
      description: "Quotation link copied to clipboard",
    })
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading quotation...</p>
        </div>
      </div>
    )
  }

  if (!quotation) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
            <FileText className="h-8 w-8 text-gray-400" />
          </div>
          <h1 className="text-2xl font-semibold text-gray-900 mb-2">Quotation Not Found</h1>
          <p className="text-gray-600">The quotation you're looking for doesn't exist or may have been removed.</p>
        </div>
      </div>
    )
  }

  const statusConfig = getStatusConfig(quotation.status || "")
  const items = quotation.items || []
  const currentItem = items[currentProductPage]

  return (
    <>
      <div className="sticky top-0 z-10 bg-white/80 backdrop-blur-sm border-b border-gray-200 shadow-sm">
        <div className="max-w-[850px] mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Button variant="ghost" size="sm" className="text-gray-600" onClick={() => router.back()}>
              <ArrowLeft className="h-4 w-4 mr-1" />
              Back
            </Button>
            <Badge
              className={`${
                quotation.status === "accepted"
                  ? "bg-green-100 text-green-800 border-green-200"
                  : quotation.status === "rejected"
                    ? "bg-red-100 text-red-800 border-red-200"
                    : "bg-blue-100 text-blue-800 border-blue-200"
              } border font-medium px-3 py-1`}
            >
              {quotation.status === "accepted" && <CheckCircle className="h-3.5 w-3.5 mr-1" />}
              {quotation.status === "rejected" && <XCircle className="h-3.5 w-3.5 mr-1" />}
              <span className="capitalize">{quotation.status}</span>
            </Badge>
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              className="text-gray-600 bg-transparent"
              onClick={() => setShowQRModal(true)}
            >
              <Share2 className="h-4 w-4 mr-1" />
              <span className="hidden sm:inline">Share</span>
            </Button>
            <Button variant="outline" size="sm" className="text-gray-600 bg-transparent" onClick={handleDownloadPdf}>
              <Download className="h-4 w-4 mr-1" />
              <span className="hidden sm:inline">Download</span>
            </Button>
          </div>
        </div>
      </div>

      <div className="min-h-screen bg-gray-100 py-6 px-4 sm:px-6 pt-16">
        <div className="max-w-[850px] mx-auto bg-white shadow-md rounded-sm overflow-hidden">
          <div className="border-b-2 border-orange-600 p-6 sm:p-8">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4">
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-1 font-[Calibri]">QUOTATION</h1>
                <p className="text-sm text-gray-500">{quotation.quotation_number}</p>
              </div>
              <div className="mt-4 sm:mt-0 flex items-center space-x-4">
                <div className="text-center">
                  <img
                    src={generateQRCodeUrl(quotation.id) || "/placeholder.svg"}
                    alt="QR Code"
                    className="w-16 h-16 border border-gray-300 bg-white p-1 rounded"
                  />
                  <p className="text-xs text-gray-500 mt-1">Scan to view online</p>
                </div>
                <img src="/oh-plus-logo.png" alt="Company Logo" className="h-8 sm:h-10" />
              </div>
            </div>
          </div>

          {/* Document Content */}
          <div className="p-6 sm:p-8">
            <div className="mb-6">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <p className="text-sm text-gray-600 mb-2">{formatDate(quotation.created)}</p>
                  <div className="space-y-1">
                    <p className="font-semibold text-gray-900">{safeString(quotation.client_name)}</p>
                    <p className="text-gray-700">{safeString(quotation.client_email)}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-600">Quotation No.</p>
                  <p className="font-semibold text-gray-900">{quotation.quotation_number}</p>
                </div>
              </div>

              <div className="mb-6 p-4 bg-blue-50 border-l-4 border-blue-400 rounded-r-lg">
                <p className="text-gray-800 leading-relaxed font-medium">
                  Good Day! Thank you for considering OH+ Outdoor Advertising for your business needs. We are pleased to
                  submit our quotation for your requirements:
                </p>
              </div>

              {/* Details Section */}
              <div className="mb-4">
                <p className="font-semibold text-gray-900">Details as follows:</p>
              </div>

              {/* Quotation Information */}
              <div className="mb-8">
                <h2 className="text-xl font-semibold text-gray-900 mb-4 pb-1 border-b border-gray-200 font-[Calibri]">
                  Quotation Details
                </h2>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div>
                    <h3 className="text-sm font-medium text-gray-500 mb-2">Quotation Number</h3>
                    <p className="text-base font-medium text-gray-900">{quotation.quotation_number}</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-500 mb-2">Created Date</h3>
                    <p className="text-base text-gray-900">{formatDate(quotation.created)}</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-500 mb-2">Start Date</h3>
                    <p className="text-base text-gray-900">{formatDate(quotation.start_date)}</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-500 mb-2">End Date</h3>
                    <p className="text-base text-gray-900">{formatDate(quotation.end_date)}</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-500 mb-2">Valid Until</h3>
                    <p className="text-base text-gray-900">{formatDate(quotation.valid_until)}</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-500 mb-2">Status</h3>
                    <Badge
                      className={`${
                        quotation.status === "accepted"
                          ? "bg-green-100 text-green-800 border-green-200"
                          : quotation.status === "rejected"
                            ? "bg-red-100 text-red-800 border-red-200"
                            : "bg-blue-100 text-blue-800 border-blue-200"
                      } border font-medium px-3 py-1`}
                    >
                      {quotation.status === "accepted" && <CheckCircle className="h-3.5 w-3.5 mr-1" />}
                      {quotation.status === "rejected" && <XCircle className="h-3.5 w-3.5 mr-1" />}
                      <span className="capitalize">{quotation.status}</span>
                    </Badge>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-500 mb-2">Duration</h3>
                    <p className="text-base text-gray-900">{quotation.duration_days} day(s)</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-500 mb-2">Total Amount</h3>
                    <p className="text-base font-semibold text-orange-600">₱{safeString(quotation.total_amount)}</p>
                  </div>
                </div>
              </div>

              {items.length > 0 && (
                <div className="mb-8">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-semibold text-gray-900 pb-1 border-b border-gray-200 font-[Calibri]">
                      Product & Services {items.length > 1 && `(${currentProductPage + 1} of ${items.length})`}
                    </h2>
                    {items.length > 1 && (
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setCurrentProductPage(Math.max(0, currentProductPage - 1))}
                          disabled={currentProductPage === 0}
                        >
                          Previous
                        </Button>
                        <span className="text-sm text-gray-600">
                          {currentProductPage + 1} / {items.length}
                        </span>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setCurrentProductPage(Math.min(items.length - 1, currentProductPage + 1))}
                          disabled={currentProductPage === items.length - 1}
                        >
                          Next
                        </Button>
                      </div>
                    )}
                  </div>

                  {currentItem && (
                    <div className="border border-gray-300 rounded-sm overflow-hidden mb-6">
                      <div className="bg-gray-100 p-4 border-b border-gray-300">
                        <div className="flex items-center space-x-4">
                          <img
                            src={currentItem.media_url || "/placeholder.svg?height=80&width=80&query=product"}
                            alt={currentItem.name}
                            className="w-20 h-20 object-cover rounded-sm border border-gray-200"
                          />
                          <div className="flex-1">
                            <h3 className="text-lg font-semibold text-gray-900">{safeString(currentItem.name)}</h3>
                            {currentItem.site_code && (
                              <p className="text-sm text-gray-600">Site Code: {currentItem.site_code}</p>
                            )}
                            <p className="text-sm text-gray-600">{safeString(currentItem.location)}</p>
                            <span className="inline-block mt-1 px-2 py-1 text-xs font-medium bg-orange-100 text-orange-800 rounded">
                              {safeString(currentItem.type)}
                            </span>
                          </div>
                          <div className="text-right">
                            <p className="text-lg font-bold text-orange-600">₱{safeString(currentItem.price)}</p>
                            <p className="text-sm text-gray-500">per month</p>
                          </div>
                        </div>
                      </div>

                      <div className="p-4">
                        {currentItem.description && (
                          <div className="mb-4">
                            <h4 className="text-sm font-medium text-gray-500 uppercase mb-2">Description</h4>
                            <p className="text-sm text-gray-700 leading-relaxed">
                              {safeString(currentItem.description)}
                            </p>
                          </div>
                        )}

                        {currentItem.specs_rental && (
                          <div className="mb-4">
                            <h4 className="text-sm font-medium text-gray-500 uppercase mb-2">Specifications</h4>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                              {currentItem.specs_rental.width && currentItem.specs_rental.height && (
                                <div>
                                  <p className="text-xs font-medium text-gray-500">Dimensions</p>
                                  <p className="text-sm text-gray-900">
                                    {safeString(currentItem.specs_rental.width)}m x{" "}
                                    {safeString(currentItem.specs_rental.height)}m
                                  </p>
                                </div>
                              )}
                              {currentItem.specs_rental.elevation && (
                                <div>
                                  <p className="text-xs font-medium text-gray-500">Elevation</p>
                                  <p className="text-sm text-gray-900">
                                    {safeString(currentItem.specs_rental.elevation)}m
                                  </p>
                                </div>
                              )}
                              {currentItem.specs_rental.traffic_count && (
                                <div>
                                  <p className="text-xs font-medium text-gray-500">Traffic Count</p>
                                  <p className="text-sm text-gray-900">
                                    {safeString(currentItem.specs_rental.traffic_count)}
                                  </p>
                                </div>
                              )}
                            </div>
                          </div>
                        )}

                        {currentItem.media && currentItem.media.length > 0 && (
                          <div className="mb-4">
                            <h4 className="text-sm font-medium text-gray-500 uppercase mb-2">Media Gallery</h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              {currentItem.media.map((mediaItem, mediaIndex) => (
                                <div
                                  key={mediaIndex}
                                  className="relative aspect-video bg-gray-100 rounded border border-gray-200 overflow-hidden"
                                >
                                  {mediaItem.isVideo ? (
                                    <video
                                      src={mediaItem.url || "/placeholder.svg?height=200&width=300&query=video"}
                                      controls
                                      className="w-full h-full object-cover"
                                    >
                                      Your browser does not support the video tag.
                                    </video>
                                  ) : (
                                    <img
                                      src={mediaItem.url || "/placeholder.svg?height=200&width=300&query=image"}
                                      alt={mediaItem.name || `Product media ${mediaIndex + 1}`}
                                      className="w-full h-full object-cover"
                                    />
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  <div className="border border-gray-300 rounded-sm overflow-hidden">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-100">
                        <tr>
                          <th className="py-2 px-4 text-left font-medium text-gray-700 border-b border-gray-300">
                            Product
                          </th>
                          <th className="py-2 px-4 text-left font-medium text-gray-700 border-b border-gray-300">
                            Location
                          </th>
                          <th className="py-2 px-4 text-center font-medium text-gray-700 border-b border-gray-300">
                            Duration
                          </th>
                          <th className="py-2 px-4 text-right font-medium text-gray-700 border-b border-gray-300">
                            Monthly Rate
                          </th>
                          <th className="py-2 px-4 text-right font-medium text-gray-700 border-b border-gray-300">
                            Total
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {items.map((item, index) => (
                          <tr key={item.product_id || index} className={index % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                            <td className="py-3 px-4 border-b border-gray-200">
                              <div className="font-medium text-gray-900">{safeString(item.name)}</div>
                              {item.site_code && <div className="text-xs text-gray-500">Site: {item.site_code}</div>}
                            </td>
                            <td className="py-3 px-4 border-b border-gray-200">{safeString(item.location)}</td>
                            <td className="py-3 px-4 text-center border-b border-gray-200">
                              {item.duration_days} days
                            </td>
                            <td className="py-3 px-4 text-right border-b border-gray-200">₱{safeString(item.price)}</td>
                            <td className="py-3 px-4 text-right border-b border-gray-200">
                              <div className="font-medium text-gray-900">₱{safeString(item.item_total_amount)}</div>
                            </td>
                          </tr>
                        ))}
                        <tr className="bg-orange-50">
                          <td colSpan={4} className="py-3 px-4 text-right font-bold">
                            Total Amount:
                          </td>
                          <td className="py-3 px-4 text-right font-bold text-orange-600">
                            ₱{safeString(quotation.total_amount)}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {quotation.notes && (
                <div className="mb-8">
                  <h2 className="text-xl font-semibold text-gray-900 mb-4 pb-1 border-b border-gray-200 font-[Calibri]">
                    Notes
                  </h2>
                  <div className="bg-gray-50 border border-gray-200 rounded-sm p-4">
                    <p className="text-sm text-gray-700 leading-relaxed">{quotation.notes}</p>
                  </div>
                </div>
              )}

              {quotation.status === "sent" || quotation.status === "viewed" ? (
                <div className="mb-8">
                  <h2 className="text-xl font-semibold text-gray-900 mb-4 pb-1 border-b border-gray-200 font-[Calibri]">
                    Your Response
                  </h2>
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                    <p className="text-gray-700 mb-4">
                      Please review the quotation above and let us know if you approve or need any modifications.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-4">
                      <Button
                        onClick={() => (window.location.href = `/quotations/${quotation.id}/accept`)}
                        className="bg-green-600 hover:bg-green-700 flex-1"
                      >
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Accept Quotation
                      </Button>
                      <Button
                        onClick={() => (window.location.href = `/quotations/${quotation.id}/decline`)}
                        variant="outline"
                        className="border-red-300 text-red-700 hover:bg-red-50 flex-1 bg-transparent"
                      >
                        <XCircle className="h-4 w-4 mr-2" />
                        Request Changes
                      </Button>
                    </div>
                  </div>
                </div>
              ) : quotation.status === "accepted" ? (
                <div className="mb-8">
                  <div className="bg-green-50 border border-green-200 rounded-lg p-6 text-center">
                    <CheckCircle className="h-12 w-12 text-green-600 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-green-900 mb-2">Quotation Accepted</h3>
                    <p className="text-green-700">
                      Thank you for accepting this quotation. We will proceed with the next steps and contact you soon.
                    </p>
                  </div>
                </div>
              ) : quotation.status === "rejected" ? (
                <div className="mb-8">
                  <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
                    <XCircle className="h-12 w-12 text-red-600 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-red-900 mb-2">Changes Requested</h3>
                    <p className="text-red-700">
                      We have received your feedback. Our team will review your requirements and contact you with a
                      revised quotation.
                    </p>
                  </div>
                </div>
              ) : null}

              {/* Document Footer */}
              <div className="mt-12 pt-6 border-t border-gray-200 text-center text-xs text-gray-500">
                <p>This quotation is subject to final approval and may be revised based on project requirements.</p>
                <p className="mt-1">© {new Date().getFullYear()} OH+ Outdoor Advertising. All rights reserved.</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {showQRModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 max-w-sm w-full">
            <h3 className="text-lg font-semibold mb-4">Share Quotation</h3>
            <div className="flex flex-col items-center mb-4">
              <img
                src={generateQRCodeUrl(quotation.id) || "/placeholder.svg"}
                alt="QR Code"
                className="w-48 h-48 border border-gray-300 p-2 mb-2"
              />
              <p className="text-sm text-gray-600">Scan to view this quotation</p>
            </div>
            <div className="flex flex-col space-y-3">
              <Button onClick={copyLinkToClipboard} className="w-full">
                <Share2 className="h-4 w-4 mr-2" />
                Copy Link
              </Button>
              <Button variant="outline" onClick={() => setShowQRModal(false)} className="w-full">
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

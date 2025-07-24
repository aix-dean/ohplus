"use client"
import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { parseISO } from "date-fns"
import { CheckCircle, XCircle, FileText, Clock, Send, Eye } from "lucide-react"
import { getQuotationById, type Quotation } from "@/lib/quotation-service"
import { useToast } from "@/hooks/use-toast"

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
  const { toast } = useToast()
  const [quotation, setQuotation] = useState<Quotation | null>(null)
  const [loading, setLoading] = useState(true)

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

  if (!quotation) {
    return (
      <div className="min-h-screen bg-gray-50/50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
            <FileText className="h-8 w-8 text-gray-400" />
          </div>
          <h1 className="text-2xl font-semibold text-gray-900 mb-2">Quotation Not Found</h1>
          <p className="text-gray-600 mb-6">The quotation you're looking for doesn't exist or may have been removed.</p>
        </div>
      </div>
    )
  }

  const statusConfig = getStatusConfig(quotation.status || "")

  return (
    <div className="min-h-screen bg-gray-100 py-6 px-4 sm:px-6">
      {/* Document Container */}
      <div className="max-w-[850px] mx-auto bg-white shadow-md rounded-sm overflow-hidden">
        {/* Document Header */}
        <div className="border-b-2 border-blue-600 p-6 sm:p-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-1 font-[Calibri]">QUOTATION</h1>
              <p className="text-sm text-gray-500 flex items-center gap-2">
                {quotation.quotation_number}
                <Badge className={`${statusConfig.color} border font-medium px-3 py-1`}>
                  {statusConfig.icon}
                  <span className="ml-1.5">{statusConfig.label}</span>
                </Badge>
              </p>
            </div>
            <div className="mt-4 sm:mt-0 flex items-center space-x-4">
              <img src="/oh-plus-logo.png" alt="Company Logo" className="h-8 sm:h-10" />
            </div>
          </div>
        </div>

        {/* Document Content */}
        <div className="p-6 sm:p-8">
          {/* Quotation Information */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4 pb-1 border-b border-gray-200 font-[Calibri]">
              Quotation Information
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <Label className="text-sm font-medium text-gray-500 mb-2">Quotation Number</Label>
                <p className="text-base font-medium text-gray-900">{quotation.quotation_number}</p>
              </div>
              <div>
                <Label className="text-sm font-medium text-gray-500 mb-2">Created Date</Label>
                <p className="text-base text-gray-900">{formatDate(quotation.created)}</p>
              </div>
              <div>
                <Label className="text-sm font-medium text-gray-500 mb-2">Start Date</Label>
                <p className="text-base text-gray-900">{formatDate(quotation.start_date)}</p>
              </div>
              <div>
                <Label className="text-sm font-medium text-gray-500 mb-2">End Date</Label>
                <p className="text-base text-gray-900">{formatDate(quotation.end_date)}</p>
              </div>
              <div>
                <Label className="text-sm font-medium text-gray-500 mb-2">Valid Until</Label>
                <p className="text-base text-gray-900">{formatDate(quotation.valid_until)}</p>
              </div>
              <div>
                <Label className="text-sm font-medium text-gray-500 mb-2">Total Amount</Label>
                <p className="text-base font-semibold text-gray-900">₱{safeString(quotation.total_amount)}</p>
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
                <Label className="text-sm font-medium text-gray-500 mb-2">Client Name</Label>
                <p className="text-base font-medium text-gray-900">{safeString(quotation.client_name)}</p>
              </div>
              <div>
                <Label className="text-sm font-medium text-gray-500 mb-2">Client Email</Label>
                <p className="text-base text-gray-900">{safeString(quotation.client_email)}</p>
              </div>
            </div>
          </div>

          {/* Product & Services */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4 pb-1 border-b border-gray-200 font-[Calibri]">
              Product & Services
            </h2>

            <div className="border border-gray-300 rounded-sm overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="py-2 px-4 text-left font-medium text-gray-700 border-b border-gray-300 w-[100px]">
                      Image
                    </th>
                    <th className="py-2 px-4 text-left font-medium text-gray-700 border-b border-gray-300">Product</th>
                    <th className="py-2 px-4 text-left font-medium text-gray-700 border-b border-gray-300">Type</th>
                    <th className="py-2 px-4 text-left font-medium text-gray-700 border-b border-gray-300">Location</th>
                    <th className="py-2 px-4 text-right font-medium text-gray-700 border-b border-gray-300">
                      Price (Monthly)
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {quotation.products.map((product, index) => (
                    <tr key={product.id || index} className="bg-white">
                      <td className="py-3 px-4 border-b border-gray-200">
                        <img
                          src={product.media?.[0]?.url || "/placeholder.svg?height=64&width=64&query=product"}
                          alt={product.name}
                          className="w-16 h-16 object-cover rounded-sm"
                        />
                      </td>
                      <td className="py-3 px-4 border-b border-gray-200">
                        <div className="font-medium text-gray-900">{safeString(product.name)}</div>
                        {product.site_code && <div className="text-xs text-gray-500">Site: {product.site_code}</div>}
                        {product.description && (
                          <div className="text-xs text-gray-600 mt-1">{safeString(product.description)}</div>
                        )}
                      </td>
                      <td className="py-3 px-4 border-b border-gray-200">
                        <span className="inline-block px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded">
                          {safeString(product.type)}
                        </span>
                      </td>
                      <td className="py-3 px-4 border-b border-gray-200">{safeString(product.location)}</td>
                      <td className="py-3 px-4 text-right border-b border-gray-200">
                        <div className="font-medium text-gray-900">₱{safeString(product.price)}</div>
                        <div className="text-xs text-gray-500">per month</div>
                      </td>
                    </tr>
                  ))}
                  <tr className="bg-gray-50">
                    <td colSpan={4} className="py-3 px-4 text-right font-medium">
                      Total Amount:
                    </td>
                    <td className="py-3 px-4 text-right font-bold text-blue-600">
                      ₱{safeString(quotation.total_amount)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Product Details */}
          {quotation.products.map((product, index) => (
            <div key={product.id || index} className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4 pb-1 border-b border-gray-200 font-[Calibri]">
                {safeString(product.name)} Details
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-6">
                {product.specs_rental?.width && product.specs_rental?.height && (
                  <div>
                    <Label className="text-sm font-medium text-gray-500 mb-2">Dimensions</Label>
                    <p className="text-base text-gray-900">
                      {safeString(product.specs_rental.width)}m x {safeString(product.specs_rental.height)}m
                    </p>
                  </div>
                )}
                {product.specs_rental?.elevation && (
                  <div>
                    <Label className="text-sm font-medium text-gray-500 mb-2">Elevation</Label>
                    <p className="text-base text-gray-900">{safeString(product.specs_rental.elevation)}m</p>
                  </div>
                )}
                {product.specs_rental?.traffic_count && (
                  <div>
                    <Label className="text-sm font-medium text-gray-500 mb-2">Traffic Count</Label>
                    <p className="text-base text-gray-900">{safeString(product.specs_rental.traffic_count)}</p>
                  </div>
                )}
                {product.specs_rental?.audience_type && (
                  <div>
                    <Label className="text-sm font-medium text-gray-500 mb-2">Audience Type</Label>
                    <p className="text-base text-gray-900">{safeString(product.specs_rental.audience_type)}</p>
                  </div>
                )}
                {product.specs_rental?.audience_types && product.specs_rental.audience_types.length > 0 && (
                  <div>
                    <Label className="text-sm font-medium text-gray-500 mb-2">Audience Types</Label>
                    <p className="text-base text-gray-900">{product.specs_rental.audience_types.join(", ")}</p>
                  </div>
                )}
              </div>

              {product.description && (
                <div className="mb-6">
                  <Label className="text-sm font-medium text-gray-500 mb-2">Description</Label>
                  <div className="bg-gray-50 border border-gray-200 rounded-sm p-4">
                    <p className="text-sm text-gray-700 leading-relaxed">{safeString(product.description)}</p>
                  </div>
                </div>
              )}

              {product.media && product.media.length > 0 && (
                <div className="mb-6">
                  <Label className="text-sm font-medium text-gray-500 mb-2">Media</Label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 mt-2">
                    {product.media.map((mediaItem, mediaIndex) => (
                      <div
                        key={mediaIndex}
                        className="relative aspect-video overflow-hidden rounded-sm border border-gray-200"
                      >
                        {mediaItem.isVideo ? (
                          <video
                            src={mediaItem.url || "/placeholder.svg?height=200&width=300&query=video"}
                            controls
                            className="absolute inset-0 w-full h-full object-cover"
                          >
                            Your browser does not support the video tag.
                          </video>
                        ) : (
                          <img
                            src={mediaItem.url || "/placeholder.svg?height=200&width=300&query=image"}
                            alt={mediaItem.name || `Product media ${mediaIndex + 1}`}
                            className="absolute inset-0 w-full h-full object-cover"
                          />
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}

          {/* Action Buttons for Public View */}
          {quotation.status?.toLowerCase() === "sent" && (
            <div className="mb-8 flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                onClick={() => (window.location.href = `/quotations/${quotation.id}/accept`)}
                className="bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-8 rounded-lg"
              >
                <CheckCircle className="h-5 w-5 mr-2" />
                Accept Quotation
              </Button>
              <Button
                onClick={() => (window.location.href = `/quotations/${quotation.id}/decline`)}
                variant="outline"
                className="border-red-300 text-red-700 hover:bg-red-50 font-bold py-3 px-8 rounded-lg"
              >
                <XCircle className="h-5 w-5 mr-2" />
                Decline Quotation
              </Button>
            </div>
          )}

          {/* Document Footer */}
          <div className="mt-12 pt-6 border-t border-gray-200 text-center text-xs text-gray-500">
            <p>This quotation is valid until {formatDate(quotation.valid_until)}</p>
            <p className="mt-1">© {new Date().getFullYear()} OH+ Outdoor Advertising. All rights reserved.</p>
          </div>
        </div>
      </div>
    </div>
  )
}

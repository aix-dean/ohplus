"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Loader2, DownloadIcon, LayoutGrid } from "lucide-react"
import { format } from "date-fns"
import { getCostEstimate } from "@/lib/cost-estimate-service"
import type { CostEstimate } from "@/lib/types/cost-estimate"

// QR Code generation function
const generateQRCodeUrl = (id: string) => {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://your-app-url.com"
  const viewUrl = `${baseUrl}/cost-estimates/view/${id}`
  return `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(viewUrl)}`
}

// Status configuration
const getStatusConfig = (status: string) => {
  switch (status) {
    case "draft":
      return {
        label: "Draft",
        color: "bg-gray-100 text-gray-800 border-gray-200",
        icon: "📝",
      }
    case "sent":
      return {
        label: "Sent",
        color: "bg-blue-100 text-blue-800 border-blue-200",
        icon: "📤",
      }
    case "approved":
      return {
        label: "Approved",
        color: "bg-green-100 text-green-800 border-green-200",
        icon: "✅",
      }
    case "rejected":
      return {
        label: "Rejected",
        color: "bg-red-100 text-red-800 border-red-200",
        icon: "❌",
      }
    default:
      return {
        label: "Unknown",
        color: "bg-gray-100 text-gray-800 border-gray-200",
        icon: "❓",
      }
  }
}

// Group line items by site location
const groupLineItemsBySite = (lineItems: any[]) => {
  const siteGroups: { [key: string]: any[] } = {}
  const nonSiteItems: any[] = []

  lineItems.forEach((item) => {
    if (item.notes && item.notes.includes("Location:")) {
      const locationMatch = item.notes.match(/Location:\s*(.+?)(?:\n|$)/)
      if (locationMatch) {
        const location = locationMatch[1].trim()
        if (!siteGroups[location]) {
          siteGroups[location] = []
        }
        siteGroups[location].push(item)
      } else {
        nonSiteItems.push(item)
      }
    } else {
      nonSiteItems.push(item)
    }
  })

  return { siteGroups, nonSiteItems }
}

export default function MultipleCostEstimatesPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [costEstimates, setCostEstimates] = useState<CostEstimate[]>([])
  const [loading, setLoading] = useState(true)
  const [downloadingPDF, setDownloadingPDF] = useState(false)

  // Get cost estimate IDs from query parameters
  const costEstimateIds = searchParams.get("ids")?.split(",") || []

  useEffect(() => {
    const fetchCostEstimates = async () => {
      if (costEstimateIds.length === 0) {
        setLoading(false)
        return
      }

      try {
        const estimates = await Promise.all(costEstimateIds.map((id) => getCostEstimate(id)))
        setCostEstimates(estimates.filter(Boolean) as CostEstimate[])
      } catch (error) {
        console.error("Error fetching cost estimates:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchCostEstimates()
  }, [costEstimateIds])

  const handleDownloadPDF = async () => {
    setDownloadingPDF(true)
    // TODO: Implement PDF generation for multiple documents
    setTimeout(() => setDownloadingPDF(false), 2000)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  if (costEstimates.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-semibold text-gray-900 mb-2">No Cost Estimates Found</h2>
          <p className="text-gray-600 mb-4">The cost estimates you're looking for don't exist.</p>
          <Button onClick={() => router.push("/sales/cost-estimates")}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Cost Estimates
          </Button>
        </div>
      </div>
    )
  }

  const renderSiteDocument = (
    costEstimate: CostEstimate,
    siteLocation: string,
    siteItems: any[],
    siteIndex: number,
    totalSites: number,
  ) => {
    const siteTotal = siteItems.reduce((sum, item) => sum + item.total, 0)
    const siteName =
      siteItems.find((item) => item.category?.includes("Billboard Rental"))?.description || `Site ${siteIndex + 1}`
    const statusConfig = getStatusConfig(costEstimate.status)

    return (
      <div
        key={`${costEstimate.id}-${siteLocation}`}
        className="max-w-[850px] bg-white shadow-md rounded-sm overflow-hidden mb-8"
      >
        {/* Document Header */}
        <div className="border-b-2 border-blue-600 p-6 sm:p-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-1 font-[Calibri]">COST ESTIMATE</h1>
              <p className="text-sm text-gray-500 flex items-center gap-2">
                {costEstimate.costEstimateNumber || costEstimate.id} - {siteName}
                <Badge className={`${statusConfig.color} border font-medium px-2 py-1 text-xs`}>
                  {statusConfig.icon}
                  <span className="ml-1">{statusConfig.label}</span>
                </Badge>
              </p>
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
          {/* Cost Estimate Information - Only show on first document */}
          {siteIndex === 0 && (
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
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-2">Start Date</h3>
                  <p className="text-base text-gray-900">
                    {costEstimate.startDate ? format(costEstimate.startDate, "PPP") : "N/A"}
                  </p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-2">End Date</h3>
                  <p className="text-base text-gray-900">
                    {costEstimate.endDate ? format(costEstimate.endDate, "PPP") : "N/A"}
                  </p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-2">Valid Until</h3>
                  <p className="text-base text-gray-900">
                    {costEstimate.validUntil ? format(costEstimate.validUntil, "PPP") : "N/A"}
                  </p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-2">Total Amount</h3>
                  <p className="text-base font-semibold text-gray-900">₱{costEstimate.totalAmount.toLocaleString()}</p>
                </div>
                {costEstimate.durationDays !== null && (
                  <div>
                    <h3 className="text-sm font-medium text-gray-500 mb-2">Duration</h3>
                    <p className="text-base text-gray-900">
                      {costEstimate.durationDays} day{costEstimate.durationDays !== 1 ? "s" : ""}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Client Information - Only show on first document */}
          {siteIndex === 0 && (
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
                  <p className="text-base text-gray-900">{costEstimate.client.name}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-2">Designation</h3>
                  <p className="text-base text-gray-900">{costEstimate.client.designation || "N/A"}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-2">Email</h3>
                  <p className="text-base text-gray-900">{costEstimate.client.email}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-2">Phone</h3>
                  <p className="text-base text-gray-900">{costEstimate.client.phone}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-2">Industry</h3>
                  <p className="text-base text-gray-900">{costEstimate.client.industry || "N/A"}</p>
                </div>
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
          )}

          {/* Cost Breakdown for this specific site */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4 pb-1 border-b border-gray-200 font-[Calibri]">
              Cost Breakdown - {siteName}
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
                  {siteItems.map((item, index) => (
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

          {/* Additional Information - Only show on last document */}
          {siteIndex === totalSites - 1 && (
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
                <div className="mb-4">
                  <h3 className="text-sm font-medium text-gray-500 mb-2">Internal Notes</h3>
                  <div className="bg-gray-50 border border-gray-200 rounded-sm p-4">
                    <p className="text-sm text-gray-700 leading-relaxed">{costEstimate.notes}</p>
                  </div>
                </div>
              )}

              <div className="text-center text-sm text-gray-500 mt-8 pt-4 border-t border-gray-200">
                <p>
                  This cost estimate is valid until{" "}
                  {costEstimate.validUntil ? format(costEstimate.validUntil, "PPP") : "N/A"}.
                </p>
                <p className="mt-1">© 2024 OH+ Outdoor Advertising. All rights reserved.</p>
              </div>
            </div>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
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
            <Badge className="bg-blue-100 text-blue-800 border-blue-200 font-medium px-3 py-1">
              📄 Multiple Sites Cost Estimate
            </Badge>
          </div>
        </div>
      </div>

      {/* New Wrapper for Sidebar + Document */}
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

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Document Container */}
          <div className="space-y-8">
            {costEstimates.map((costEstimate) => {
              const { siteGroups } = groupLineItemsBySite(costEstimate.lineItems)
              const siteKeys = Object.keys(siteGroups)

              return siteKeys.map((siteLocation, index) =>
                renderSiteDocument(costEstimate, siteLocation, siteGroups[siteLocation], index, siteKeys.length),
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}

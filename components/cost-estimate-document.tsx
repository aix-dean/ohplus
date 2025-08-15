"use client"
import { format } from "date-fns"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import type { CostEstimate } from "@/lib/types/cost-estimate"
import { CheckCircle, XCircle, FileText, Send, Pencil, MapPin, Building2 } from "lucide-react"

// Helper function to generate QR code URL
const generateQRCodeUrl = (costEstimateId: string) => {
  const costEstimateViewUrl = `${process.env.NEXT_PUBLIC_APP_URL}/cost-estimates/view/${costEstimateId}`
  return `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(costEstimateViewUrl)}`
}

interface CostEstimateDocumentProps {
  costEstimate: CostEstimate
  siteName?: string
  showSiteHeader?: boolean
}

export function CostEstimateDocument({ costEstimate, siteName, showSiteHeader = false }: CostEstimateDocumentProps) {
  const getStatusConfig = (status: CostEstimate["status"]) => {
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

  const statusConfig = getStatusConfig(costEstimate.status)

  return (
    <div className="bg-white">
      {/* Site Header (optional) */}
      {showSiteHeader && siteName && (
        <div className="bg-blue-50 border-b border-blue-200 p-4">
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-2">
              <Building2 className="h-5 w-5 text-blue-600" />
              <h2 className="text-lg font-semibold text-blue-900">{siteName}</h2>
            </div>
            <Badge className={`${statusConfig.color} border font-medium`}>
              {statusConfig.icon}
              <span className="ml-1.5">{statusConfig.label}</span>
            </Badge>
          </div>
          {costEstimate.client?.address && (
            <div className="flex items-center space-x-2 mt-2 text-sm text-blue-700">
              <MapPin className="h-4 w-4" />
              <span>{costEstimate.client.address}</span>
            </div>
          )}
        </div>
      )}

      {/* Document Header */}
      <div className="border-b-2 border-blue-600 p-6 sm:p-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-1 font-[Calibri]">COST ESTIMATE</h1>
            <p className="text-sm text-gray-500">{costEstimate.costEstimateNumber || costEstimate.id}</p>
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
              <Label className="text-sm font-medium text-gray-500 mb-2">Title</Label>
              <p className="text-base font-medium text-gray-900">{costEstimate.title}</p>
            </div>
            <div>
              <Label className="text-sm font-medium text-gray-500 mb-2">Created Date</Label>
              <p className="text-base text-gray-900">{format(costEstimate.createdAt, "PPP")}</p>
            </div>
            <div>
              <Label className="text-sm font-medium text-gray-500 mb-2">Start Date</Label>
              <p className="text-base text-gray-900">
                {costEstimate.startDate ? format(costEstimate.startDate, "PPP") : "N/A"}
              </p>
            </div>
            <div>
              <Label className="text-sm font-medium text-gray-500 mb-2">End Date</Label>
              <p className="text-base text-gray-900">
                {costEstimate.endDate ? format(costEstimate.endDate, "PPP") : "N/A"}
              </p>
            </div>
            <div>
              <Label className="text-sm font-medium text-gray-500 mb-2">Valid Until</Label>
              <p className="text-base text-gray-900">
                {costEstimate.validUntil ? format(costEstimate.validUntil, "PPP") : "N/A"}
              </p>
            </div>
            <div>
              <Label className="text-sm font-medium text-gray-500 mb-2">Total Amount</Label>
              <p className="text-base font-semibold text-gray-900">₱{costEstimate.totalAmount.toLocaleString()}</p>
            </div>
            {costEstimate.durationDays !== null && (
              <div>
                <Label className="text-sm font-medium text-gray-500 mb-2">Duration</Label>
                <p className="text-base text-gray-900">
                  {costEstimate.durationDays} day{costEstimate.durationDays !== 1 ? "s" : ""}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Client Information */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4 pb-1 border-b border-gray-200 font-[Calibri]">
            Client Information
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <Label className="text-sm font-medium text-gray-500 mb-2">Company</Label>
              <p className="text-base font-medium text-gray-900">{costEstimate.client.company}</p>
            </div>
            <div>
              <Label className="text-sm font-medium text-gray-500 mb-2">Contact Person</Label>
              <p className="text-base text-gray-900">{costEstimate.client.name}</p>
            </div>
            <div>
              <Label className="text-sm font-medium text-gray-500 mb-2">Designation</Label>
              <p className="text-base text-gray-900">{costEstimate.client.designation || "N/A"}</p>
            </div>
            <div>
              <Label className="text-sm font-medium text-gray-500 mb-2">Email</Label>
              <p className="text-base text-gray-900">{costEstimate.client.email}</p>
            </div>
            <div>
              <Label className="text-sm font-medium text-gray-500 mb-2">Phone</Label>
              <p className="text-base text-gray-900">{costEstimate.client.phone}</p>
            </div>
            <div>
              <Label className="text-sm font-medium text-gray-500 mb-2">Industry</Label>
              <p className="text-base text-gray-900">{costEstimate.client.industry || "N/A"}</p>
            </div>
          </div>

          {costEstimate.client.address && (
            <div className="mt-4">
              <Label className="text-sm font-medium text-gray-500 mb-2">Address</Label>
              <p className="text-base text-gray-900">{costEstimate.client.address}</p>
            </div>
          )}

          {costEstimate.client.campaignObjective && (
            <div className="mt-4">
              <Label className="text-sm font-medium text-gray-500 mb-2">Campaign Objective</Label>
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
                  <th className="py-2 px-4 text-left font-medium text-gray-700 border-b border-gray-300">Quantity</th>
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
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4 pb-1 border-b border-gray-200 font-[Calibri]">
            Additional Information
          </h2>

          {costEstimate.customMessage && (
            <div className="mb-4">
              <Label className="text-sm font-medium text-gray-500 mb-2">Custom Message</Label>
              <div className="bg-blue-50 border border-blue-200 rounded-sm p-4">
                <p className="text-sm text-gray-700 leading-relaxed">{costEstimate.customMessage}</p>
              </div>
            </div>
          )}

          {costEstimate.notes && (
            <div>
              <Label className="text-sm font-medium text-gray-500 mb-2">Internal Notes</Label>
              <div className="bg-gray-50 border border-gray-200 rounded-sm p-4">
                <p className="text-sm text-gray-700 leading-relaxed">{costEstimate.notes}</p>
              </div>
            </div>
          )}
        </div>

        {/* Document Footer */}
        <div className="mt-12 pt-6 border-t border-gray-200 text-center text-xs text-gray-500">
          {costEstimate.validUntil && <p>This cost estimate is valid until {format(costEstimate.validUntil, "PPP")}</p>}
          <p className="mt-1">© {new Date().getFullYear()} OH+ Outdoor Advertising. All rights reserved.</p>
        </div>
      </div>
    </div>
  )
}

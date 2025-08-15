"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { useToast } from "@/hooks/use-toast"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import { ArrowLeft, DownloadIcon, Send, CheckCircle, XCircle, FileText, Loader2, MapPin, Save, Eye } from "lucide-react"
import { format } from "date-fns"
import type { CostEstimate } from "@/lib/types/cost-estimate"
import { getCostEstimate, sendCostEstimateEmail, updateCostEstimate } from "@/lib/cost-estimate-service"

// Helper function to generate QR code URL
const generateQRCodeUrl = (costEstimateId: string) => {
  const costEstimateViewUrl = `${process.env.NEXT_PUBLIC_APP_URL}/cost-estimates/view/${costEstimateId}`
  return `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(costEstimateViewUrl)}`
}

export default function MultipleSitesCostEstimatesPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user, userData } = useAuth()
  const { toast } = useToast()

  const [costEstimates, setCostEstimates] = useState<CostEstimate[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [sending, setSending] = useState(false)
  const [expandedSites, setExpandedSites] = useState<Set<string>>(new Set())

  useEffect(() => {
    const fetchCostEstimates = async () => {
      const idsParam = searchParams.get("ids")
      if (!idsParam) {
        toast({
          title: "Error",
          description: "No cost estimate IDs provided.",
          variant: "destructive",
        })
        router.push("/sales/dashboard")
        return
      }

      const ids = idsParam.split(",")
      setLoading(true)

      try {
        const estimates = await Promise.all(
          ids.map(async (id) => {
            const estimate = await getCostEstimate(id.trim())
            return estimate
          }),
        )

        // Filter out null results
        const validEstimates = estimates.filter((est): est is CostEstimate => est !== null)

        if (validEstimates.length === 0) {
          toast({
            title: "Error",
            description: "No valid cost estimates found.",
            variant: "destructive",
          })
          router.push("/sales/dashboard")
          return
        }

        setCostEstimates(validEstimates)
        // Expand all sites by default
        setExpandedSites(new Set(validEstimates.map((est) => est.id)))
      } catch (error) {
        console.error("Error fetching cost estimates:", error)
        toast({
          title: "Error",
          description: "Failed to load cost estimates.",
          variant: "destructive",
        })
        router.push("/sales/dashboard")
      } finally {
        setLoading(false)
      }
    }

    fetchCostEstimates()
  }, [searchParams, toast, router])

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
          icon: <FileText className="h-3.5 w-3.5" />,
          label: "Unknown",
        }
    }
  }

  const toggleSiteExpansion = (siteId: string) => {
    const newExpanded = new Set(expandedSites)
    if (newExpanded.has(siteId)) {
      newExpanded.delete(siteId)
    } else {
      newExpanded.add(siteId)
    }
    setExpandedSites(newExpanded)
  }

  const handleSaveAll = async () => {
    setSaving(true)
    try {
      // Update all cost estimates to ensure they're saved
      await Promise.all(
        costEstimates.map(async (estimate) => {
          await updateCostEstimate(estimate.id, {
            updatedAt: new Date(),
          })
        }),
      )

      toast({
        title: "Success",
        description: "All cost estimates have been saved as drafts.",
      })
    } catch (error) {
      console.error("Error saving cost estimates:", error)
      toast({
        title: "Error",
        description: "Failed to save cost estimates.",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  const handleSendAll = async () => {
    if (!costEstimates.length || !costEstimates[0].client?.email) {
      toast({
        title: "Error",
        description: "Client email not found.",
        variant: "destructive",
      })
      return
    }

    setSending(true)
    try {
      // Send all cost estimates to the client
      await Promise.all(
        costEstimates.map(async (estimate) => {
          await sendCostEstimateEmail(estimate, estimate.client.email, estimate.client, userData?.email)

          // Update status to sent
          await updateCostEstimate(estimate.id, {
            status: "sent",
            updatedAt: new Date(),
          })
        }),
      )

      toast({
        title: "Success",
        description: "All cost estimates have been sent to the client.",
      })

      // Update local state
      setCostEstimates((prev) => prev.map((est) => ({ ...est, status: "sent" as const })))
    } catch (error) {
      console.error("Error sending cost estimates:", error)
      toast({
        title: "Error",
        description: "Failed to send cost estimates.",
        variant: "destructive",
      })
    } finally {
      setSending(false)
    }
  }

  const totalAmount = costEstimates.reduce((sum, estimate) => sum + estimate.totalAmount, 0)

  const getSiteName = (estimate: CostEstimate): string => {
    // Try to extract site name from the first line item that looks like a site
    const siteLineItem = estimate.lineItems.find(
      (item) =>
        item.category === "LED Billboard Rental" ||
        item.category === "Static Billboard Rental" ||
        item.notes?.includes("Location:"),
    )

    if (siteLineItem) {
      return siteLineItem.description
    }

    // Fallback to title
    return estimate.title.replace("Cost Estimate for ", "").split(" - ")[0]
  }

  const getSiteLocation = (estimate: CostEstimate): string => {
    const siteLineItem = estimate.lineItems.find((item) => item.notes?.includes("Location:"))

    if (siteLineItem?.notes) {
      return siteLineItem.notes.replace("Location: ", "")
    }

    return "Location not specified"
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-gray-600">Loading multiple site cost estimates...</p>
        </div>
      </div>
    )
  }

  if (costEstimates.length === 0) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <FileText className="h-16 w-16 mx-auto mb-4 text-gray-400" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">No Cost Estimates Found</h2>
          <p className="text-gray-600 mb-4">The cost estimates you're looking for could not be loaded.</p>
          <Button onClick={() => router.push("/sales/dashboard")}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-100 py-6 px-4 sm:px-6">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white border-b border-gray-200 shadow-sm mb-6">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button variant="ghost" onClick={() => router.back()} className="text-gray-600 hover:text-gray-900">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Multiple Sites Cost Estimates</h1>
              <p className="text-gray-600">
                {costEstimates.length} sites • Total: ₱{totalAmount.toLocaleString()}
                {costEstimates[0]?.client && (
                  <span className="ml-2">
                    • Client: {costEstimates[0].client.company || costEstimates[0].client.name}
                  </span>
                )}
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <Button variant="outline" onClick={handleSaveAll} disabled={saving || sending}>
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Save All
                </>
              )}
            </Button>
            <Button onClick={handleSendAll} disabled={saving || sending} className="bg-blue-600 hover:bg-blue-700">
              {sending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Send All to Client
                </>
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Sites Overview Cards */}
      <div className="max-w-7xl mx-auto mb-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {costEstimates.map((estimate) => {
            const statusConfig = getStatusConfig(estimate.status)
            const siteName = getSiteName(estimate)
            const siteLocation = getSiteLocation(estimate)

            return (
              <Card key={estimate.id} className="hover:shadow-lg transition-shadow cursor-pointer">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900 mb-1">{siteName}</h3>
                      <p className="text-sm text-gray-600 flex items-center">
                        <MapPin className="h-4 w-4 mr-1" />
                        {siteLocation}
                      </p>
                    </div>
                    <Badge className={`${statusConfig.color} border font-medium px-2 py-1`}>
                      {statusConfig.icon}
                      <span className="ml-1">{statusConfig.label}</span>
                    </Badge>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Total Amount:</span>
                      <span className="font-semibold">₱{estimate.totalAmount.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Line Items:</span>
                      <span>{estimate.lineItems.length} items</span>
                    </div>
                    {estimate.costEstimateNumber && (
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">CE Number:</span>
                        <span className="font-mono text-xs">{estimate.costEstimateNumber}</span>
                      </div>
                    )}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full mt-4 bg-transparent"
                    onClick={() => toggleSiteExpansion(estimate.id)}
                  >
                    {expandedSites.has(estimate.id) ? "Hide Details" : "View Details"}
                  </Button>
                </CardContent>
              </Card>
            )
          })}
        </div>
      </div>

      {/* Detailed Cost Estimate Documents - Each as separate page */}
      <div className="max-w-7xl mx-auto space-y-12">
        {costEstimates.map((estimate, index) => {
          const statusConfig = getStatusConfig(estimate.status)
          const isExpanded = expandedSites.has(estimate.id)
          const siteName = getSiteName(estimate)
          const siteLocation = getSiteLocation(estimate)

          if (!isExpanded) return null

          return (
            <div
              key={estimate.id}
              className={`bg-white shadow-md rounded-sm overflow-hidden ${index > 0 ? "page-break-before" : ""}`}
            >
              {/* Document Header */}
              <div className="border-b-2 border-blue-600 p-6 sm:p-8">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4">
                  <div>
                    <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-1 font-[Calibri]">COST ESTIMATE</h2>
                    <p className="text-sm text-gray-500 flex items-center gap-2">
                      {estimate.costEstimateNumber || estimate.id}
                      <Badge className={`${statusConfig.color} border font-medium px-2 py-1`}>
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
                          src={generateQRCodeUrl(estimate.id) || "/placeholder.svg"}
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
                {/* Client Information */}
                {estimate.client && (
                  <div className="mb-8">
                    <h3 className="text-xl font-semibold text-gray-900 mb-4 pb-1 border-b border-gray-200 font-[Calibri]">
                      Client Information
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                      <div>
                        <Label className="text-sm font-medium text-gray-500 mb-2">Company</Label>
                        <p className="text-base font-medium text-gray-900">{estimate.client.company}</p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-gray-500 mb-2">Contact Person</Label>
                        <p className="text-base text-gray-900">{estimate.client.name}</p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-gray-500 mb-2">Email</Label>
                        <p className="text-base text-gray-900">{estimate.client.email}</p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-gray-500 mb-2">Phone</Label>
                        <p className="text-base text-gray-900">{estimate.client.phone || "N/A"}</p>
                      </div>
                      {estimate.client.designation && (
                        <div>
                          <Label className="text-sm font-medium text-gray-500 mb-2">Designation</Label>
                          <p className="text-base text-gray-900">{estimate.client.designation}</p>
                        </div>
                      )}
                      {estimate.client.industry && (
                        <div>
                          <Label className="text-sm font-medium text-gray-500 mb-2">Industry</Label>
                          <p className="text-base text-gray-900">{estimate.client.industry}</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Site Information */}
                <div className="mb-8">
                  <h3 className="text-xl font-semibold text-gray-900 mb-4 pb-1 border-b border-gray-200 font-[Calibri]">
                    Site Information
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div>
                      <Label className="text-sm font-medium text-gray-500 mb-2">Site Name</Label>
                      <p className="text-base font-medium text-gray-900">{siteName}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-500 mb-2">Location</Label>
                      <p className="text-base text-gray-900 flex items-center">
                        <MapPin className="h-4 w-4 mr-2 text-gray-400" />
                        {siteLocation}
                      </p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-500 mb-2">Campaign Title</Label>
                      <p className="text-base font-medium text-gray-900">{estimate.title}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-500 mb-2">Created Date</Label>
                      <p className="text-base text-gray-900">
                        {estimate.createdAt ? format(estimate.createdAt, "PPP") : "N/A"}
                      </p>
                    </div>
                    {estimate.startDate && estimate.endDate && (
                      <>
                        <div>
                          <Label className="text-sm font-medium text-gray-500 mb-2">Campaign Start</Label>
                          <p className="text-base text-gray-900">{format(estimate.startDate, "PPP")}</p>
                        </div>
                        <div>
                          <Label className="text-sm font-medium text-gray-500 mb-2">Campaign End</Label>
                          <p className="text-base text-gray-900">{format(estimate.endDate, "PPP")}</p>
                        </div>
                      </>
                    )}
                    {estimate.durationDays && (
                      <div>
                        <Label className="text-sm font-medium text-gray-500 mb-2">Duration</Label>
                        <p className="text-base text-gray-900">{estimate.durationDays} days</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Cost Breakdown */}
                <div className="mb-8">
                  <h3 className="text-xl font-semibold text-gray-900 mb-4 pb-1 border-b border-gray-200 font-[Calibri]">
                    Cost Breakdown
                  </h3>
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
                          <th className="py-2 px-4 text-right font-medium text-gray-700 border-b border-gray-300">
                            Total
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {estimate.lineItems.map((item, index) => (
                          <tr key={item.id} className={index % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                            <td className="py-3 px-4 border-b border-gray-200">
                              <div className="font-medium text-gray-900">{item.description}</div>
                              {item.notes && <div className="text-xs text-gray-500 mt-1">{item.notes}</div>}
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
                        <tr className="bg-blue-50">
                          <td colSpan={3} className="py-3 px-4 text-right font-bold">
                            Site Total:
                          </td>
                          <td className="py-3 px-4 text-right font-bold text-blue-600">
                            ₱{estimate.totalAmount.toLocaleString()}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Notes */}
                {estimate.notes && (
                  <div className="mb-8">
                    <h3 className="text-xl font-semibold text-gray-900 mb-4 pb-1 border-b border-gray-200 font-[Calibri]">
                      Additional Notes
                    </h3>
                    <div className="bg-gray-50 border border-gray-200 rounded-sm p-4">
                      <p className="text-sm text-gray-700 leading-relaxed">{estimate.notes}</p>
                    </div>
                  </div>
                )}

                {/* Document Footer */}
                <div className="mt-8 pt-6 border-t border-gray-200 text-center text-xs text-gray-500">
                  <p>
                    This cost estimate is subject to final approval and may be revised based on project requirements.
                  </p>
                  <p className="mt-1">© {new Date().getFullYear()} OH+ Outdoor Advertising. All rights reserved.</p>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Summary Footer */}
      <div className="max-w-7xl mx-auto mt-8">
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-blue-900 mb-1">Campaign Summary</h3>
                <p className="text-blue-700">
                  {costEstimates.length} sites • Total estimated cost: ₱{totalAmount.toLocaleString()}
                  {costEstimates[0]?.client && (
                    <span className="block sm:inline sm:ml-2">
                      Client: {costEstimates[0].client.company || costEstimates[0].client.name}
                    </span>
                  )}
                </p>
              </div>
              <div className="flex items-center space-x-3">
                <Button variant="outline" className="border-blue-300 text-blue-700 hover:bg-blue-100 bg-transparent">
                  <DownloadIcon className="h-4 w-4 mr-2" />
                  Download All PDFs
                </Button>
                <Button
                  className="bg-blue-600 hover:bg-blue-700"
                  onClick={() => {
                    // Expand all sites for preview
                    setExpandedSites(new Set(costEstimates.map((est) => est.id)))
                  }}
                >
                  <Eye className="h-4 w-4 mr-2" />
                  Preview All
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

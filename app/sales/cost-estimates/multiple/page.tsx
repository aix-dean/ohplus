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
import type { CostEstimateLineItem } from "@/lib/types/cost-estimate"

// Mock data structure for multiple sites
interface SiteCostEstimate {
  id: string
  siteId: string
  siteName: string
  location: string
  title: string
  status: "draft" | "sent" | "viewed" | "approved" | "rejected"
  totalAmount: number
  lineItems: CostEstimateLineItem[]
  notes?: string
  createdAt: Date
}

// Helper function to generate QR code URL
const generateQRCodeUrl = (costEstimateId: string) => {
  const costEstimateViewUrl = `${process.env.NEXT_PUBLIC_APP_URL}/cost-estimates/view/${costEstimateId}`
  return `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(costEstimateViewUrl)}`
}

export default function MultipleSitesCostEstimatesPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user } = useAuth()
  const { toast } = useToast()

  const [siteCostEstimates, setSiteCostEstimates] = useState<SiteCostEstimate[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [sending, setSending] = useState(false)
  const [expandedSites, setExpandedSites] = useState<Set<string>>(new Set())

  // Mock data - in real implementation, this would come from API
  useEffect(() => {
    const mockData: SiteCostEstimate[] = [
      {
        id: "ce-site-1",
        siteId: "site-001",
        siteName: "EDSA Guadalupe Billboard",
        location: "EDSA Guadalupe, Makati City",
        title: "Q1 2024 Campaign - EDSA Guadalupe",
        status: "draft",
        totalAmount: 450000,
        createdAt: new Date(),
        lineItems: [
          {
            id: "item-1",
            description: "Billboard Space Rental (30 days)",
            quantity: 1,
            unitPrice: 300000,
            total: 300000,
            category: "media_cost",
          },
          {
            id: "item-2",
            description: "Creative Design & Production",
            quantity: 1,
            unitPrice: 75000,
            total: 75000,
            category: "production_cost",
          },
          {
            id: "item-3",
            description: "Installation & Setup",
            quantity: 1,
            unitPrice: 50000,
            total: 50000,
            category: "installation_cost",
          },
        ],
        notes: "Premium location with high visibility during rush hours.",
      },
      {
        id: "ce-site-2",
        siteId: "site-002",
        siteName: "BGC Central Square LED",
        location: "Bonifacio Global City, Taguig",
        title: "Q1 2024 Campaign - BGC Central",
        status: "draft",
        totalAmount: 680000,
        createdAt: new Date(),
        lineItems: [
          {
            id: "item-4",
            description: "LED Display Rental (30 days)",
            quantity: 1,
            unitPrice: 500000,
            total: 500000,
            category: "media_cost",
          },
          {
            id: "item-5",
            description: "Digital Content Creation",
            quantity: 1,
            unitPrice: 100000,
            total: 100000,
            category: "production_cost",
          },
          {
            id: "item-6",
            description: "Technical Setup & Monitoring",
            quantity: 1,
            unitPrice: 80000,
            total: 80000,
            category: "installation_cost",
          },
        ],
        notes: "Digital LED display with premium positioning in BGC business district.",
      },
      {
        id: "ce-site-3",
        siteId: "site-003",
        siteName: "Ortigas Transit Billboard",
        location: "Ortigas Avenue, Pasig City",
        title: "Q1 2024 Campaign - Ortigas Transit",
        status: "draft",
        totalAmount: 320000,
        createdAt: new Date(),
        lineItems: [
          {
            id: "item-7",
            description: "Transit Billboard Space (30 days)",
            quantity: 1,
            unitPrice: 220000,
            total: 220000,
            category: "media_cost",
          },
          {
            id: "item-8",
            description: "Weather-resistant Printing",
            quantity: 1,
            unitPrice: 60000,
            total: 60000,
            category: "production_cost",
          },
          {
            id: "item-9",
            description: "Installation & Maintenance",
            quantity: 1,
            unitPrice: 40000,
            total: 40000,
            category: "installation_cost",
          },
        ],
        notes: "Strategic location near major transit hub with consistent foot traffic.",
      },
    ]

    // Simulate loading
    setTimeout(() => {
      setSiteCostEstimates(mockData)
      setLoading(false)
      // Expand all sites by default
      setExpandedSites(new Set(mockData.map((site) => site.id)))
    }, 1000)
  }, [])

  const getStatusConfig = (status: SiteCostEstimate["status"]) => {
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
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 2000))
      toast({
        title: "Success",
        description: "All cost estimates have been saved as drafts.",
      })
    } catch (error) {
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
    setSending(true)
    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 3000))
      toast({
        title: "Success",
        description: "All cost estimates have been sent to the client.",
      })
      // Update status of all sites
      setSiteCostEstimates((prev) => prev.map((site) => ({ ...site, status: "sent" as const })))
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to send cost estimates.",
        variant: "destructive",
      })
    } finally {
      setSending(false)
    }
  }

  const totalAmount = siteCostEstimates.reduce((sum, site) => sum + site.totalAmount, 0)

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
                {siteCostEstimates.length} sites • Total: ₱{totalAmount.toLocaleString()}
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
          {siteCostEstimates.map((site) => {
            const statusConfig = getStatusConfig(site.status)
            return (
              <Card key={site.id} className="hover:shadow-lg transition-shadow cursor-pointer">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900 mb-1">{site.siteName}</h3>
                      <p className="text-sm text-gray-600 flex items-center">
                        <MapPin className="h-4 w-4 mr-1" />
                        {site.location}
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
                      <span className="font-semibold">₱{site.totalAmount.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Line Items:</span>
                      <span>{site.lineItems.length} items</span>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full mt-4 bg-transparent"
                    onClick={() => toggleSiteExpansion(site.id)}
                  >
                    {expandedSites.has(site.id) ? "Hide Details" : "View Details"}
                  </Button>
                </CardContent>
              </Card>
            )
          })}
        </div>
      </div>

      {/* Detailed Cost Estimate Documents */}
      <div className="max-w-7xl mx-auto space-y-8">
        {siteCostEstimates.map((site) => {
          const statusConfig = getStatusConfig(site.status)
          const isExpanded = expandedSites.has(site.id)

          if (!isExpanded) return null

          return (
            <div key={site.id} className="bg-white shadow-md rounded-sm overflow-hidden">
              {/* Document Header */}
              <div className="border-b-2 border-blue-600 p-6 sm:p-8">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4">
                  <div>
                    <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-1 font-[Calibri]">COST ESTIMATE</h2>
                    <p className="text-sm text-gray-500 flex items-center gap-2">
                      {site.id}
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
                          src={generateQRCodeUrl(site.id) || "/placeholder.svg"}
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
                {/* Site Information */}
                <div className="mb-8">
                  <h3 className="text-xl font-semibold text-gray-900 mb-4 pb-1 border-b border-gray-200 font-[Calibri]">
                    Site Information
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div>
                      <Label className="text-sm font-medium text-gray-500 mb-2">Site Name</Label>
                      <p className="text-base font-medium text-gray-900">{site.siteName}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-500 mb-2">Location</Label>
                      <p className="text-base text-gray-900 flex items-center">
                        <MapPin className="h-4 w-4 mr-2 text-gray-400" />
                        {site.location}
                      </p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-500 mb-2">Campaign Title</Label>
                      <p className="text-base font-medium text-gray-900">{site.title}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-500 mb-2">Created Date</Label>
                      <p className="text-base text-gray-900">{format(site.createdAt, "PPP")}</p>
                    </div>
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
                        {site.lineItems.map((item, index) => (
                          <tr key={item.id} className={index % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                            <td className="py-3 px-4 border-b border-gray-200">
                              <div className="font-medium text-gray-900">{item.description}</div>
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
                            ₱{site.totalAmount.toLocaleString()}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Notes */}
                {site.notes && (
                  <div className="mb-8">
                    <h3 className="text-xl font-semibold text-gray-900 mb-4 pb-1 border-b border-gray-200 font-[Calibri]">
                      Site Notes
                    </h3>
                    <div className="bg-gray-50 border border-gray-200 rounded-sm p-4">
                      <p className="text-sm text-gray-700 leading-relaxed">{site.notes}</p>
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
                  {siteCostEstimates.length} sites • Total estimated cost: ₱{totalAmount.toLocaleString()}
                </p>
              </div>
              <div className="flex items-center space-x-3">
                <Button variant="outline" className="border-blue-300 text-blue-700 hover:bg-blue-100 bg-transparent">
                  <DownloadIcon className="h-4 w-4 mr-2" />
                  Download All PDFs
                </Button>
                <Button className="bg-blue-600 hover:bg-blue-700">
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

"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Download, Send, Eye, CheckCircle, XCircle, FileText, Loader2, Calculator } from "lucide-react"
import { getCostEstimateById, updateCostEstimateStatus, sendCostEstimateEmail } from "@/lib/cost-estimate-service"
import { getProposalById } from "@/lib/proposal-service"
import type { CostEstimate } from "@/lib/types/cost-estimate"
import type { Proposal } from "@/lib/types/proposal"
import { useToast } from "@/hooks/use-toast"

const categoryLabels = {
  media_cost: "Media Cost",
  production_cost: "Production Cost",
  installation_cost: "Installation Cost",
  maintenance_cost: "Maintenance Cost",
  other: "Other",
}

export default function CostEstimateDetailsPage() {
  const params = useParams()
  const router = useRouter()
  const { toast } = useToast()
  const [costEstimate, setCostEstimate] = useState<CostEstimate | null>(null)
  const [proposal, setProposal] = useState<Proposal | null>(null)
  const [loading, setLoading] = useState(true)
  const [sendingEmail, setSendingEmail] = useState(false)

  useEffect(() => {
    async function fetchData() {
      if (params.id) {
        try {
          const costEstimateData = await getCostEstimateById(params.id as string)
          setCostEstimate(costEstimateData)

          if (costEstimateData) {
            const proposalData = await getProposalById(costEstimateData.proposalId)
            setProposal(proposalData)
          }
        } catch (error) {
          console.error("Error fetching data:", error)
          toast({
            title: "Error",
            description: "Failed to load cost estimate details",
            variant: "destructive",
          })
        } finally {
          setLoading(false)
        }
      }
    }

    fetchData()
  }, [params.id, toast])

  const handleStatusUpdate = async (newStatus: CostEstimate["status"]) => {
    if (!costEstimate) return

    try {
      await updateCostEstimateStatus(costEstimate.id, newStatus)
      setCostEstimate({ ...costEstimate, status: newStatus })
      toast({
        title: "Success",
        description: `Cost estimate status updated to ${newStatus}`,
      })
    } catch (error) {
      console.error("Error updating status:", error)
      toast({
        title: "Error",
        description: "Failed to update cost estimate status",
        variant: "destructive",
      })
    }
  }

  const handleResendEmail = async () => {
    if (!costEstimate || !proposal) return

    setSendingEmail(true)
    try {
      await sendCostEstimateEmail(costEstimate, proposal.client.email, proposal.client)
      toast({
        title: "Cost estimate resent successfully!",
        description: `The cost estimate has been resent to ${proposal.client.email}.`,
      })
    } catch (error) {
      console.error("Error resending cost estimate:", error)
      toast({
        title: "Error",
        description: "Failed to resend cost estimate to client",
        variant: "destructive",
      })
    } finally {
      setSendingEmail(false)
    }
  }

  const handleSendToClient = async () => {
    if (!costEstimate || !proposal) return

    setSendingEmail(true)
    try {
      await sendCostEstimateEmail(costEstimate, proposal.client.email, proposal.client)
      await updateCostEstimateStatus(costEstimate.id, "sent")
      setCostEstimate({ ...costEstimate, status: "sent" })
      toast({
        title: "Cost estimate sent successfully!",
        description: `The cost estimate has been sent to ${proposal.client.email}.`,
      })
    } catch (error) {
      console.error("Error sending cost estimate:", error)
      toast({
        title: "Error",
        description: "Failed to send cost estimate to client",
        variant: "destructive",
      })
    } finally {
      setSendingEmail(false)
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50/50">
        <div className="container mx-auto p-6 max-w-7xl">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-gray-200 rounded w-1/4"></div>
            <div className="h-64 bg-gray-200 rounded-lg"></div>
          </div>
        </div>
      </div>
    )
  }

  if (!costEstimate || !proposal) {
    return (
      <div className="min-h-screen bg-gray-50/50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
            <Calculator className="h-8 w-8 text-gray-400" />
          </div>
          <h1 className="text-2xl font-semibold text-gray-900 mb-2">Cost Estimate Not Found</h1>
          <p className="text-gray-600 mb-6">
            The cost estimate you're looking for doesn't exist or may have been removed.
          </p>
          <Button onClick={() => router.push("/sales/proposals")} className="bg-blue-600 hover:bg-blue-700">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Proposals
          </Button>
        </div>
      </div>
    )
  }

  const statusConfig = getStatusConfig(costEstimate.status)

  return (
    <div className="min-h-screen bg-gray-100 py-6 px-4 sm:px-6">
      {/* Toolbar */}
      <div className="sticky top-0 z-10 bg-white border-b border-gray-200 shadow-sm mb-6">
        <div className="max-w-[850px] mx-auto px-4 py-2 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push(`/sales/proposals/${proposal.id}`)}
              className="text-gray-600 hover:text-gray-900"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">Back to Proposal</span>
            </Button>
            <Badge className={`${statusConfig.color} border font-medium px-3 py-1`}>
              {statusConfig.icon}
              <span className="ml-1.5">{statusConfig.label}</span>
            </Badge>
          </div>

          <div className="flex items-center space-x-2">
            {costEstimate.status === "draft" && (
              <Button
                onClick={handleSendToClient}
                disabled={sendingEmail}
                size="sm"
                className="bg-blue-600 hover:bg-blue-700"
              >
                {sendingEmail ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    <span className="hidden sm:inline">Sending...</span>
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4 mr-2" />
                    <span className="hidden sm:inline">Send to Client</span>
                  </>
                )}
              </Button>
            )}
            {(costEstimate.status === "sent" || costEstimate.status === "viewed") && (
              <Button
                onClick={handleResendEmail}
                disabled={sendingEmail}
                variant="outline"
                size="sm"
                className="border-blue-300 text-blue-700 hover:bg-blue-50"
              >
                {sendingEmail ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    <span className="hidden sm:inline">Resending...</span>
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4 mr-2" />
                    <span className="hidden sm:inline">Resend</span>
                  </>
                )}
              </Button>
            )}
            <Button variant="outline" size="sm" className="border-gray-300 hover:bg-gray-50">
              <Download className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">Download</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Document Container */}
      <div className="max-w-[850px] mx-auto bg-white shadow-md rounded-sm overflow-hidden">
        {/* Document Header */}
        <div className="border-b-2 border-orange-600 p-6 sm:p-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-1 font-[Calibri]">COST ESTIMATE</h1>
              <p className="text-sm text-gray-500">{costEstimate.id}</p>
            </div>
            <div className="mt-4 sm:mt-0">
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
                <h3 className="text-sm font-medium text-gray-500 mb-2">Title</h3>
                <p className="text-base font-medium text-gray-900">{costEstimate.title}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-2">Created Date</h3>
                <p className="text-base text-gray-900">{costEstimate.createdAt.toLocaleDateString()}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-2">Related Proposal</h3>
                <p className="text-base text-gray-900">{proposal.title}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-2">Total Amount</h3>
                <p className="text-base font-semibold text-gray-900">₱{costEstimate.totalAmount.toLocaleString()}</p>
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
            </div>
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
                    <th className="py-2 px-4 text-left font-medium text-gray-700 border-b border-gray-300">Category</th>
                    <th className="py-2 px-4 text-center font-medium text-gray-700 border-b border-gray-300">Qty</th>
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
                      </td>
                      <td className="py-3 px-4 border-b border-gray-200">
                        <span className="inline-block px-2 py-1 text-xs font-medium bg-orange-100 text-orange-800 rounded">
                          {categoryLabels[item.category]}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center border-b border-gray-200">{item.quantity}</td>
                      <td className="py-3 px-4 text-right border-b border-gray-200">
                        ₱{item.unitPrice.toLocaleString()}
                      </td>
                      <td className="py-3 px-4 text-right border-b border-gray-200">
                        <div className="font-medium text-gray-900">₱{item.totalPrice.toLocaleString()}</div>
                      </td>
                    </tr>
                  ))}
                  <tr className="bg-gray-50">
                    <td colSpan={4} className="py-3 px-4 text-right font-medium">
                      Subtotal:
                    </td>
                    <td className="py-3 px-4 text-right font-medium">₱{costEstimate.subtotal.toLocaleString()}</td>
                  </tr>
                  <tr className="bg-gray-50">
                    <td colSpan={4} className="py-3 px-4 text-right font-medium">
                      VAT ({(costEstimate.taxRate * 100).toFixed(0)}%):
                    </td>
                    <td className="py-3 px-4 text-right font-medium">₱{costEstimate.taxAmount.toLocaleString()}</td>
                  </tr>
                  <tr className="bg-orange-50">
                    <td colSpan={4} className="py-3 px-4 text-right font-bold">
                      Total Amount:
                    </td>
                    <td className="py-3 px-4 text-right font-bold text-orange-600">
                      ₱{costEstimate.totalAmount.toLocaleString()}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Notes */}
          {costEstimate.notes && (
            <div className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4 pb-1 border-b border-gray-200 font-[Calibri]">
                Notes
              </h2>
              <div className="bg-gray-50 border border-gray-200 rounded-sm p-4">
                <p className="text-sm text-gray-700 leading-relaxed">{costEstimate.notes}</p>
              </div>
            </div>
          )}

          {/* Document Footer */}
          <div className="mt-12 pt-6 border-t border-gray-200 text-center text-xs text-gray-500">
            <p>This cost estimate is subject to final approval and may be revised based on project requirements.</p>
            <p className="mt-1">© {new Date().getFullYear()} OH+ Outdoor Advertising. All rights reserved.</p>
          </div>
        </div>
      </div>
    </div>
  )
}

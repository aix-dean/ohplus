"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { format } from "date-fns"
import Image from "next/image"
import {
  ArrowLeft,
  Calendar,
  User,
  Clock,
  FileText,
  AlertCircle,
  Package,
  Edit,
  UserCheck,
  RefreshCw,
  Printer,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { getJobOrders } from "@/lib/job-order-service"
import { generateJobOrderPDF } from "@/lib/pdf-service"
import type { JobOrder } from "@/lib/types/job-order"
import { toast } from "sonner"
import { auth } from "@/lib/firebase"

export default function JobOrderDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [jobOrder, setJobOrder] = useState<JobOrder | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [generatingPDF, setGeneratingPDF] = useState(false)

  const jobOrderId = params.id as string

  useEffect(() => {
    const fetchJobOrder = async () => {
      try {
        setLoading(true)
        // Get current user from auth context
        const user = auth.currentUser
        if (!user) {
          setError("User not authenticated.")
          return
        }

        const allJobOrders = await getJobOrders(user.uid)
        const fetchedJobOrder = allJobOrders.find((jo) => jo.id === jobOrderId)

        if (fetchedJobOrder) {
          setJobOrder(fetchedJobOrder)
        } else {
          setError("Job order not found.")
        }
      } catch (err) {
        console.error("Failed to fetch job order:", err)
        setError("Failed to load job order details.")
      } finally {
        setLoading(false)
      }
    }

    if (jobOrderId) {
      fetchJobOrder()
    }
  }, [jobOrderId])

  const handlePrintPDF = async () => {
    if (!jobOrder) return

    try {
      setGeneratingPDF(true)
      toast.info("Generating PDF...")

      await generateJobOrderPDF(jobOrder, false)

      toast.success("PDF generated successfully!")
    } catch (error) {
      console.error("Error generating PDF:", error)
      toast.error("Failed to generate PDF. Please try again.")
    } finally {
      setGeneratingPDF(false)
    }
  }

  const getJoTypeColor = (joType: string) => {
    switch (joType?.toLowerCase()) {
      case "installation":
        return "bg-blue-100 text-blue-800 border-blue-200"
      case "maintenance":
        return "bg-yellow-100 text-yellow-800 border-yellow-200"
      case "repair":
        return "bg-red-100 text-red-800 border-red-200"
      case "dismantling":
        return "bg-gray-100 text-gray-800 border-gray-200"
      default:
        return "bg-purple-100 text-purple-800 border-purple-200"
    }
  }

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case "completed":
        return "bg-green-100 text-green-800 border-green-200"
      case "in-progress":
        return "bg-blue-100 text-blue-800 border-blue-200"
      case "pending":
        return "bg-yellow-100 text-yellow-800 border-yellow-200"
      case "cancelled":
        return "bg-red-100 text-red-800 border-red-200"
      default:
        return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-64px)]">
        <div className="flex items-center space-x-2">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="text-lg">Loading Job Order details...</span>
        </div>
      </div>
    )
  }

  if (error || !jobOrder) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-64px)] p-4 text-center">
        <AlertCircle className="h-12 w-12 text-red-500 mb-4" />
        <h2 className="text-xl font-semibold mb-2">Job Order Not Found</h2>
        <p className="text-gray-600 mb-4">{error || "The selected job order could not be loaded."}</p>
        <Button onClick={() => router.push("/logistics/job-orders")}>Back to Job Orders</Button>
      </div>
    )
  }

  return (
    <div className="flex flex-col min-h-screen bg-white p-4 md:p-6">
      <div className="flex items-center gap-4 mb-6">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-2xl font-bold text-gray-900">Job Order Details</h1>
        <Badge variant="secondary">
          <Package className="h-3 w-3 mr-1" />
          Logistics
        </Badge>
        <div className="ml-auto">
          <Button
            onClick={handlePrintPDF}
            disabled={generatingPDF}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            {generatingPDF ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Generating...
              </>
            ) : (
              <>
                <Printer className="h-4 w-4 mr-2" />
                Print PDF
              </>
            )}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-6xl mx-auto w-full">
        {/* Left Column: Job Information */}
        <div className="space-y-6">
          <h2 className="text-lg font-bold text-gray-900">Job Information</h2>
          <div className="space-y-3 text-gray-800">
            <div className="space-y-0.5">
              <div className="flex items-center justify-between">
                <h3 className="text-blue-600 font-bold text-base">{jobOrder.joNumber}</h3>
                <Badge variant="outline" className={`${getStatusColor(jobOrder.status)} border font-medium`}>
                  {jobOrder.status}
                </Badge>
              </div>
              <p className="text-xs text-gray-600">Job Order ID: {jobOrder.id}</p>
            </div>

            <div className="space-y-0.5">
              <p className="text-sm">
                <span className="font-semibold">Site Name:</span> {jobOrder.siteName}
              </p>
              <p className="text-sm">
                <span className="font-semibold">Site Location:</span>{" "}
                {jobOrder.siteLocation || jobOrder.siteCode || "N/A"}
              </p>
              <p className="text-sm">
                <span className="font-semibold">JO Type:</span>{" "}
                <Badge variant="outline" className={`${getJoTypeColor(jobOrder.joType)} border font-medium ml-1`}>
                  {jobOrder.joType}
                </Badge>
              </p>
            </div>

            {/* Site Preview */}
            <div className="space-y-1 mt-3">
              <p className="text-sm font-semibold">Site Preview:</p>
              <div className="flex items-center gap-2 p-3 bg-gray-100 rounded-md">
                <Image
                  src={jobOrder.siteImageUrl || "/placeholder.svg?height=48&width=48"}
                  alt="Site preview"
                  width={48}
                  height={48}
                  className="rounded-md object-cover"
                />
                <div className="flex-1">
                  <p className="font-semibold text-sm">{jobOrder.siteName}</p>
                  <p className="text-xs text-gray-600">
                    {jobOrder.siteLocation || jobOrder.siteCode || "Location not specified"}
                  </p>
                  <p className="text-xs text-gray-500">{jobOrder.joType} Job</p>
                </div>
              </div>
            </div>

            {/* Job Description */}
            {jobOrder.jobDescription && (
              <div className="space-y-0.5 pt-4 border-t border-gray-200 mt-6">
                <p className="text-sm font-semibold">Job Description:</p>
                <p className="text-sm text-gray-700">{jobOrder.jobDescription}</p>
              </div>
            )}

            {/* Additional Message */}
            {jobOrder.message && (
              <div className="space-y-0.5">
                <p className="text-sm font-semibold">Additional Message:</p>
                <p className="text-sm text-gray-700">{jobOrder.message}</p>
              </div>
            )}

            {/* Remarks */}
            {jobOrder.remarks && (
              <div className="space-y-0.5">
                <p className="text-sm font-semibold">Remarks:</p>
                <p className="text-sm text-gray-700">{jobOrder.remarks}</p>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Job Order Details */}
        <div className="space-y-6">
          <h2 className="text-lg font-bold text-gray-900">Job Order Details</h2>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Job Order Form
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label className="text-sm text-gray-800">JO #</Label>
                <div className="p-2 bg-gray-100 rounded text-sm text-gray-600">{jobOrder.joNumber}</div>
              </div>

              <div className="space-y-2">
                <Label className="text-sm text-gray-800">Date Requested</Label>
                <div className="flex items-center gap-2 p-2 bg-gray-50 rounded text-sm">
                  <Calendar className="h-4 w-4 text-gray-500" />
                  {jobOrder.dateRequested ? format(new Date(jobOrder.dateRequested), "PPP") : "N/A"}
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-sm text-gray-800">JO Type</Label>
                <div className="p-2">
                  <Badge variant="outline" className={`${getJoTypeColor(jobOrder.joType)} border font-medium`}>
                    {jobOrder.joType}
                  </Badge>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-sm text-gray-800">Deadline</Label>
                <div className="flex items-center gap-2 p-2 bg-gray-50 rounded text-sm">
                  <Clock className="h-4 w-4 text-gray-500" />
                  {jobOrder.deadline ? format(new Date(jobOrder.deadline), "PPP") : "N/A"}
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-sm text-gray-800">Requested By</Label>
                <div className="flex items-center gap-2 p-2 bg-gray-50 rounded text-sm">
                  <User className="h-4 w-4 text-gray-500" />
                  {jobOrder.requestedBy}
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-sm text-gray-800">Assigned To</Label>
                <div className="flex items-center gap-2 p-2 bg-gray-50 rounded text-sm">
                  <UserCheck className="h-4 w-4 text-gray-500" />
                  {jobOrder.assignTo || "Unassigned"}
                </div>
              </div>

              {/* Client Information */}
              {(jobOrder.clientCompany || jobOrder.clientName) && (
                <>
                  <div className="space-y-2">
                    <Label className="text-sm text-gray-800">Client Company</Label>
                    <div className="p-2 bg-gray-50 rounded text-sm">{jobOrder.clientCompany || "N/A"}</div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm text-gray-800">Client Name</Label>
                    <div className="p-2 bg-gray-50 rounded text-sm">{jobOrder.clientName || "N/A"}</div>
                  </div>
                </>
              )}

              {/* Financial Information */}
              {jobOrder.totalAmount && (
                <div className="space-y-2">
                  <Label className="text-sm text-gray-800">Total Amount</Label>
                  <div className="p-2 bg-green-50 rounded text-sm font-semibold text-green-800">
                    PHP {jobOrder.totalAmount.toLocaleString()}
                  </div>
                </div>
              )}

              {/* Attachments */}
              {jobOrder.attachments && jobOrder.attachments.length > 0 && (
                <div className="space-y-2">
                  <Label className="text-sm text-gray-800">Attachments</Label>
                  <div className="space-y-2">
                    {jobOrder.attachments.map((attachment, index) => (
                      <div key={index} className="flex items-center gap-2 p-2 bg-gray-50 rounded text-sm">
                        <FileText className="h-4 w-4 text-gray-500" />
                        <span className="text-gray-700">
                          {typeof attachment === "string" ? attachment : attachment.name || "Attachment"}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex flex-col gap-2 pt-4">
            <Button variant="outline" className="w-full bg-transparent text-gray-800 border-gray-300 hover:bg-gray-50">
              <Edit className="mr-2 h-4 w-4" />
              Edit Job Order
            </Button>
            <Button variant="outline" className="w-full bg-transparent text-gray-800 border-gray-300 hover:bg-gray-50">
              <UserCheck className="mr-2 h-4 w-4" />
              Assign Personnel
            </Button>
            <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white">
              <RefreshCw className="mr-2 h-4 w-4" />
              Update Status
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

function Label({ children, className }: { children: React.ReactNode; className?: string }) {
  return <label className={className}>{children}</label>
}

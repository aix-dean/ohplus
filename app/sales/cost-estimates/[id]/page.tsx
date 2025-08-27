"use client"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { useToast } from "@/hooks/use-toast"
import { getCostEstimate } from "@/lib/cost-estimate-service"
import type { CostEstimate } from "@/lib/types/cost-estimate"
import { format } from "date-fns"
import { Button } from "@/components/ui/button"
import { ArrowLeft, DownloadIcon, Send, Pencil } from "lucide-react"
import { generateCostEstimatePDF } from "@/lib/cost-estimate-pdf-service"

export default function CostEstimatePage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const { user, userData } = useAuth()
  const { toast } = useToast()
  const [costEstimate, setCostEstimate] = useState<CostEstimate | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchCostEstimate = async () => {
      try {
        const data = await getCostEstimate(params.id)
        setCostEstimate(data)
      } catch (error) {
        console.error("Error fetching cost estimate:", error)
        toast({
          title: "Error",
          description: "Failed to load cost estimate",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }

    fetchCostEstimate()
  }, [params.id, toast])

  const handleDownloadPDF = async () => {
    if (!costEstimate) return

    try {
      await generateCostEstimatePDF(costEstimate)
      toast({
        title: "Success",
        description: "PDF downloaded successfully",
      })
    } catch (error) {
      console.error("Error generating PDF:", error)
      toast({
        title: "Error",
        description: "Failed to generate PDF",
        variant: "destructive",
      })
    }
  }

  const handleSendEmail = () => {
    router.push(`/sales/cost-estimates/${params.id}/compose-email`)
  }

  const handleEdit = () => {
    // Navigate to edit page or enable edit mode
    toast({
      title: "Edit Mode",
      description: "Edit functionality coming soon",
    })
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="animate-pulse text-gray-500">Loading...</div>
      </div>
    )
  }

  if (!costEstimate) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-semibold text-gray-900 mb-4">Cost Estimate Not Found</h1>
          <Button onClick={() => router.push("/sales/cost-estimates")} variant="outline">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Cost Estimates
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-4xl mx-auto p-8">
        {/* Header */}
        <div className="flex justify-between items-start mb-8">
          <div>
            <h1 className="text-xl font-semibold text-gray-900">{costEstimate.client.name}</h1>
            <p className="text-gray-600">{costEstimate.client.company}</p>
          </div>
          <div className="text-right">
            <p className="text-lg font-semibold text-gray-900">{costEstimate.costEstimateNumber}</p>
          </div>
        </div>

        {/* Title */}
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-gray-900 underline">{costEstimate.title} COST ESTIMATE</h2>
        </div>

        {/* Greeting */}
        <div className="text-center mb-8">
          <p className="text-gray-800 leading-relaxed">
            Good Day! Thank you for considering Golden Touch for your business needs. We are pleased to submit our
            quotation for your requirements:
          </p>
        </div>

        {/* Details */}
        <div className="mb-12">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">Details as follows:</h3>

          <div className="space-y-3">
            <div className="flex items-start">
              <span className="text-gray-900 mr-2">•</span>
              <span className="font-medium text-gray-900 w-40">Site Location</span>
              <span className="text-gray-900">: {costEstimate.lineItems?.[0]?.description || "Unknown"}</span>
            </div>

            <div className="flex items-start">
              <span className="text-gray-900 mr-2">•</span>
              <span className="font-medium text-gray-900 w-40">Type</span>
              <span className="text-gray-900">: {costEstimate.lineItems?.[0]?.category || "Unknown"}</span>
            </div>

            <div className="flex items-start">
              <span className="text-gray-900 mr-2">•</span>
              <span className="font-medium text-gray-900 w-40">Size</span>
              <span className="text-gray-900">
                : {costEstimate.lineItems?.[0]?.notes || "Location: Manila, Metro Manila, Philippines"}
              </span>
            </div>

            <div className="flex items-start">
              <span className="text-gray-900 mr-2">•</span>
              <span className="font-medium text-gray-900 w-40">Contract Duration</span>
              <span className="text-gray-900">
                :{" "}
                {costEstimate.durationDays
                  ? `${Math.ceil(costEstimate.durationDays / 30)} month${Math.ceil(costEstimate.durationDays / 30) > 1 ? "s" : ""}`
                  : "1 month"}
              </span>
            </div>

            <div className="flex items-start">
              <span className="text-gray-900 mr-2">•</span>
              <span className="font-medium text-gray-900 w-40">Contract Period</span>
              <span className="text-gray-900">
                :{" "}
                {costEstimate.startDate && costEstimate.endDate
                  ? `${format(costEstimate.startDate, "MMM d, yyyy")} - ${format(costEstimate.endDate, "MMM d, yyyy")}`
                  : "N/A - N/A"}
              </span>
            </div>

            <div className="flex items-start">
              <span className="text-gray-900 mr-2">•</span>
              <span className="font-medium text-gray-900 w-40">Proposal to</span>
              <span className="text-gray-900">: {costEstimate.client.company}</span>
            </div>

            <div className="flex items-start">
              <span className="text-gray-900 mr-2">•</span>
              <span className="font-medium text-gray-900 w-40">Illumination</span>
              <span className="text-gray-900">
                :{" "}
                {costEstimate.lineItems?.find((item) => item.category.includes("Installation"))?.description ||
                  "1 units of lighting system"}
              </span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-center gap-4">
          <Button onClick={handleEdit} className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2">
            <Pencil className="h-4 w-4 mr-2" />
            Edit
          </Button>

          <Button onClick={handleSendEmail} className="bg-green-600 hover:bg-green-700 text-white px-6 py-2">
            <Send className="h-4 w-4 mr-2" />
            Send Email
          </Button>

          <Button onClick={handleDownloadPDF} className="bg-gray-600 hover:bg-gray-700 text-white px-6 py-2">
            <DownloadIcon className="h-4 w-4 mr-2" />
            Download PDF
          </Button>
        </div>
      </div>
    </div>
  )
}

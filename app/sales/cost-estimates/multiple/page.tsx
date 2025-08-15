"use client"
import { useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { useToast } from "@/hooks/use-toast"
import { getCostEstimate } from "@/lib/cost-estimate-service"
import type { CostEstimate } from "@/lib/types/cost-estimate"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { cn } from "@/lib/utils"
import {
  ArrowLeft,
  DownloadIcon,
  Send,
  CheckCircle,
  XCircle,
  FileText,
  Loader2,
  LayoutGrid,
  Pencil,
  Plus,
  MapPin,
  Building2,
} from "lucide-react"
import { generateCostEstimatePDF } from "@/lib/pdf-service"
import { CostEstimateDocument } from "@/components/cost-estimate-document"
import { AddSiteDialog } from "@/components/add-site-dialog"

// Helper function to generate QR code URL
const generateQRCodeUrl = (costEstimateId: string) => {
  const costEstimateViewUrl = `${process.env.NEXT_PUBLIC_APP_URL}/cost-estimates/view/${costEstimateId}`
  return `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(costEstimateViewUrl)}`
}

interface SiteEstimate {
  id: string
  siteName: string
  location: string
  costEstimate: CostEstimate
}

export default function MultipleCostEstimatesPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user } = useAuth()
  const { toast } = useToast()

  const [siteEstimates, setSiteEstimates] = useState<SiteEstimate[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<string>("")
  const [downloadingPDF, setDownloadingPDF] = useState(false)
  const [isAddSiteDialogOpen, setIsAddSiteDialogOpen] = useState(false)

  // Get cost estimate IDs from URL parameters
  const costEstimateIds = searchParams.get("ids")?.split(",") || []

  useEffect(() => {
    const fetchMultipleCostEstimates = async () => {
      if (costEstimateIds.length === 0) {
        setLoading(false)
        return
      }

      setLoading(true)
      try {
        const estimates: SiteEstimate[] = []

        for (const id of costEstimateIds) {
          const costEstimate = await getCostEstimate(id.trim())
          if (costEstimate) {
            estimates.push({
              id: id.trim(),
              siteName: costEstimate.client?.company || `Site ${estimates.length + 1}`,
              location: costEstimate.client?.address || "Location not specified",
              costEstimate,
            })
          }
        }

        setSiteEstimates(estimates)
        if (estimates.length > 0) {
          setActiveTab(estimates[0].id)
        }
      } catch (error) {
        console.error("Error fetching cost estimates:", error)
        toast({
          title: "Error",
          description: "Failed to load cost estimates. Please try again.",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }

    fetchMultipleCostEstimates()
  }, [costEstimateIds, toast])

  const handleDownloadAllPDFs = async () => {
    if (siteEstimates.length === 0) return

    setDownloadingPDF(true)
    try {
      for (const siteEstimate of siteEstimates) {
        await generateCostEstimatePDF(siteEstimate.costEstimate)
      }
      toast({
        title: "PDFs Generated",
        description: `${siteEstimates.length} cost estimate PDFs have been downloaded.`,
      })
    } catch (error) {
      console.error("Error downloading PDFs:", error)
      toast({
        title: "Error",
        description: "Failed to generate PDFs. Please try again.",
        variant: "destructive",
      })
    } finally {
      setDownloadingPDF(false)
    }
  }

  const handleAddSite = (costEstimateId: string) => {
    // Add new site to the current list
    const newUrl = new URL(window.location.href)
    const currentIds = newUrl.searchParams.get("ids")?.split(",") || []
    if (!currentIds.includes(costEstimateId)) {
      currentIds.push(costEstimateId)
      newUrl.searchParams.set("ids", currentIds.join(","))
      window.location.href = newUrl.toString()
    }
  }

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

  if (siteEstimates.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50/50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
            <Building2 className="h-8 w-8 text-gray-400" />
          </div>
          <h1 className="text-2xl font-semibold text-gray-900 mb-2">No Sites Selected</h1>
          <p className="text-gray-600 mb-6">
            Please select cost estimates to view multiple sites or add cost estimate IDs to the URL.
          </p>
          <div className="space-y-3">
            <Button onClick={() => setIsAddSiteDialogOpen(true)} className="bg-blue-600 hover:bg-blue-700 w-full">
              <Plus className="h-4 w-4 mr-2" />
              Add Site
            </Button>
            <Button onClick={() => router.push("/sales/cost-estimates")} variant="outline" className="w-full">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Cost Estimates
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-100 py-6 px-4 sm:px-6 relative">
      {/* Word-style Toolbar */}
      <div className="sticky top-0 z-10 bg-white border-b border-gray-200 shadow-sm mb-6">
        <div className="max-w-[1200px] mx-auto px-4 py-2 flex items-center justify-between">
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
            <div className="flex items-center space-x-2">
              <Building2 className="h-5 w-5 text-gray-500" />
              <span className="font-medium text-gray-900">Multiple Sites Cost Estimates</span>
              <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                {siteEstimates.length} {siteEstimates.length === 1 ? "Site" : "Sites"}
              </Badge>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsAddSiteDialogOpen(true)}
              className="text-gray-600 hover:text-gray-900"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Site
            </Button>
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
            onClick={handleDownloadAllPDFs}
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
                <span className="text-[10px] text-gray-700">Download All</span>
              </>
            )}
          </Button>
        </div>

        {/* Main Content Container */}
        <div className="max-w-[1200px] w-full">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            {/* Site Tabs */}
            <div className="bg-white rounded-t-lg border-b border-gray-200 px-4 py-2">
              <TabsList className="grid w-full grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2 bg-transparent h-auto p-0">
                {siteEstimates.map((siteEstimate) => {
                  const statusConfig = getStatusConfig(siteEstimate.costEstimate.status)
                  return (
                    <TabsTrigger
                      key={siteEstimate.id}
                      value={siteEstimate.id}
                      className={cn(
                        "flex flex-col items-start p-4 h-auto text-left border rounded-lg transition-all",
                        "data-[state=active]:bg-blue-50 data-[state=active]:border-blue-200 data-[state=active]:text-blue-900",
                        "data-[state=inactive]:bg-gray-50 data-[state=inactive]:border-gray-200 data-[state=inactive]:text-gray-700",
                        "hover:bg-gray-100",
                      )}
                    >
                      <div className="flex items-center space-x-2 mb-1">
                        <MapPin className="h-4 w-4 text-gray-500" />
                        <span className="font-medium text-sm truncate max-w-[120px]">{siteEstimate.siteName}</span>
                      </div>
                      <div className="text-xs text-gray-500 truncate max-w-[140px] mb-2">{siteEstimate.location}</div>
                      <Badge className={`${statusConfig.color} border font-medium text-xs`}>
                        {statusConfig.icon}
                        <span className="ml-1">{statusConfig.label}</span>
                      </Badge>
                    </TabsTrigger>
                  )
                })}
              </TabsList>
            </div>

            {/* Site Content */}
            {siteEstimates.map((siteEstimate) => (
              <TabsContent key={siteEstimate.id} value={siteEstimate.id} className="mt-0">
                <div className="bg-white shadow-md rounded-b-lg overflow-hidden">
                  <CostEstimateDocument
                    costEstimate={siteEstimate.costEstimate}
                    siteName={siteEstimate.siteName}
                    showSiteHeader={true}
                  />
                </div>
              </TabsContent>
            ))}
          </Tabs>
        </div>
      </div>

      {/* Add Site Dialog */}
      <AddSiteDialog isOpen={isAddSiteDialogOpen} onOpenChange={setIsAddSiteDialogOpen} onAddSite={handleAddSite} />
    </div>
  )
}

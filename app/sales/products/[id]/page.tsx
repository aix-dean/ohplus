"use client"

import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import {
  ArrowLeft,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock3,
  Maximize,
  Check,
  X,
  Calendar,
  FileText,
  Mail,
  Eye,
  AlertCircle,
  Briefcase,
} from "lucide-react"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { doc, getDoc } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { Skeleton } from "@/components/ui/skeleton"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { getQuotationRequestsByProductId, type QuotationRequest } from "@/lib/firebase-service"
import { getAllCostEstimates, type CostEstimate } from "@/lib/cost-estimate-service"
import { getAllQuotations, type Quotation } from "@/lib/quotation-service"
import { getAllJobOrders, type JobOrder } from "@/lib/job-order-service"

function formatDate(dateString: any): string {
  if (!dateString) return "N/A"

  try {
    const date =
      typeof dateString === "string"
        ? new Date(dateString)
        : dateString instanceof Date
          ? dateString
          : dateString.toDate
            ? dateString.toDate()
            : new Date()

    return new Intl.DateTimeFormat("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    }).format(date)
  } catch (error) {
    console.error("Error formatting date:", error)
    return "Invalid Date"
  }
}

function Notification({
  show,
  type,
  message,
  onClose,
}: {
  show: boolean
  type: "success" | "error"
  message: string
  onClose: () => void
}) {
  useEffect(() => {
    if (show) {
      const timer = setTimeout(() => {
        onClose()
      }, 4000)
      return () => clearTimeout(timer)
    }
  }, [show, onClose])

  if (!show) return null

  return (
    <div
      className="fixed top-4 right-4 z-50 animate-in slide-in-from-top-2 duration-300"
      role="alert"
      aria-live="polite"
    >
      <div
        className={`flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg border backdrop-blur-sm ${
          type === "success"
            ? "bg-green-50/95 border-green-200 text-green-800"
            : "bg-red-50/95 border-red-200 text-red-800"
        }`}
      >
        <div className="flex-shrink-0">
          {type === "success" ? (
            <div className="w-5 h-5 rounded-full bg-green-500 flex items-center justify-center">
              <Check className="w-3 h-3 text-white" />
            </div>
          ) : (
            <div className="w-5 h-5 rounded-full bg-red-500 flex items-center justify-center">
              <X className="w-3 h-3 text-white" />
            </div>
          )}
        </div>
        <div className="flex-1">
          <p className="text-sm font-medium">{message}</p>
        </div>
        <button
          onClick={onClose}
          className="flex-shrink-0 p-1 rounded-full hover:bg-black/10 transition-colors"
          aria-label="Close notification"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}

export default function ProductDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const [product, setProduct] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [activeImageIndex, setActiveImageIndex] = useState(0)
  const [imageViewerOpen, setImageViewerOpen] = useState(false)
  const [quotationRequests, setQuotationRequests] = useState<QuotationRequest[]>([])
  const [quotationRequestsLoading, setQuotationRequestsLoading] = useState(true)
  const [costEstimates, setCostEstimates] = useState<CostEstimate[]>([])
  const [costEstimatesLoading, setCostEstimatesLoading] = useState(true)
  const [quotations, setQuotations] = useState<Quotation[]>([])
  const [quotationsLoading, setQuotationsLoading] = useState(true)
  const [jobOrders, setJobOrders] = useState<JobOrder[]>([])
  const [jobOrdersLoading, setJobOrdersLoading] = useState(true)
  const [marketplaceDialogOpen, setMarketplaceDialogOpen] = useState(false)

  const [notification, setNotification] = useState<{
    show: boolean
    type: "success" | "error"
    message: string
  }>({
    show: false,
    type: "success",
    message: "",
  })

  const showNotification = (type: "success" | "error", message: string) => {
    setNotification({
      show: true,
      type,
      message,
    })
  }

  const hideNotification = () => {
    setNotification((prev) => ({ ...prev, show: false }))
  }

  useEffect(() => {
    async function fetchProduct() {
      if (!params.id) return

      setLoading(true)
      try {
        const productId = Array.isArray(params.id) ? params.id[0] : params.id

        if (productId === "new") {
          router.push("/sales/product/upload")
          return
        }

        const productDoc = await getDoc(doc(db, "products", productId))

        if (productDoc.exists()) {
          const productData = { id: productDoc.id, ...productDoc.data() }
          setProduct(productData)
        } else {
          console.error("Product not found")
          showNotification("error", "Product not found")
        }
      } catch (error) {
        console.error("Error fetching product:", error)
        showNotification("error", "Failed to load product details")
      } finally {
        setLoading(false)
      }
    }

    fetchProduct()
  }, [params.id, router])

  // Fetch quotation requests for this product
  useEffect(() => {
    const fetchQuotationRequests = async () => {
      if (!params.id || params.id === "new") {
        setQuotationRequestsLoading(false)
        return
      }

      setQuotationRequestsLoading(true)
      try {
        const productId = Array.isArray(params.id) ? params.id[0] : params.id
        const requests = await getQuotationRequestsByProductId(productId)
        setQuotationRequests(requests)
      } catch (error) {
        console.error("Error fetching quotation requests:", error)
      } finally {
        setQuotationRequestsLoading(false)
      }
    }

    fetchQuotationRequests()
  }, [params.id])

  useEffect(() => {
    const fetchCostEstimates = async () => {
      if (!params.id || params.id === "new" || !product) {
        setCostEstimatesLoading(false)
        return
      }

      setCostEstimatesLoading(true)
      try {
        const allCostEstimates = await getAllCostEstimates()
        const productId = Array.isArray(params.id) ? params.id[0] : params.id
        const productName = product?.name || ""
        const productLocation =
          product?.type?.toLowerCase() === "rental"
            ? product.specs_rental?.location || ""
            : product.light?.location || ""

        const relatedEstimates = allCostEstimates.filter((estimate) =>
          estimate.lineItems?.some(
            (item) =>
              item.id === productId ||
              item.description?.toLowerCase().includes(productName.toLowerCase()) ||
              (productLocation && item.notes?.toLowerCase().includes(productLocation.toLowerCase())),
          ),
        )

        setCostEstimates(relatedEstimates)
      } catch (error) {
        console.error("Error fetching cost estimates:", error)
        showNotification("error", "Failed to load cost estimates")
      } finally {
        setCostEstimatesLoading(false)
      }
    }

    fetchCostEstimates()
  }, [params.id, product])

  useEffect(() => {
    const fetchQuotations = async () => {
      if (!params.id || params.id === "new" || !product) {
        setQuotationsLoading(false)
        return
      }

      setQuotationsLoading(true)
      try {
        const allQuotations = await getAllQuotations()

        // Filter quotations that have products referencing this product
        const productId = Array.isArray(params.id) ? params.id[0] : params.id
        const productName = product?.name || ""
        const productLocation =
          product?.type?.toLowerCase() === "rental"
            ? product.specs_rental?.location || ""
            : product.light?.location || ""

        const relatedQuotations = allQuotations.filter((quotation) =>
          quotation.products?.some(
            (item) =>
              item.id === productId ||
              item.name?.toLowerCase().includes(productName.toLowerCase()) ||
              (productLocation && item.location?.toLowerCase().includes(productLocation.toLowerCase())),
          ),
        )

        setQuotations(relatedQuotations)
      } catch (error) {
        console.error("Error fetching quotations:", error)
      } finally {
        setQuotationsLoading(false)
      }
    }

    fetchQuotations()
  }, [params.id, product])

  useEffect(() => {
    const fetchJobOrders = async () => {
      if (!params.id || params.id === "new" || !product) {
        setJobOrdersLoading(false)
        return
      }

      setJobOrdersLoading(true)
      try {
        const allJobOrders = await getAllJobOrders()

        // Filter job orders that reference this product by site info
        const productId = Array.isArray(params.id) ? params.id[0] : params.id
        const productName = product?.name || ""
        const productLocation =
          product?.type?.toLowerCase() === "rental"
            ? product.specs_rental?.location || ""
            : product.light?.location || ""

        const relatedJobOrders = allJobOrders.filter(
          (jobOrder) =>
            jobOrder.siteId === productId ||
            jobOrder.siteName?.toLowerCase().includes(productName.toLowerCase()) ||
            (productLocation && jobOrder.siteLocation?.toLowerCase().includes(productLocation.toLowerCase())),
        )

        setJobOrders(relatedJobOrders)
      } catch (error) {
        console.error("Error fetching job orders:", error)
      } finally {
        setJobOrdersLoading(false)
      }
    }

    fetchJobOrders()
  }, [params.id, product])

  const handleBack = () => {
    router.back()
  }

  const handleDelete = async () => {
    if (!product) return

    try {
      // Mock function - replace with actual implementation
      showNotification("success", `${product.name} has been successfully deleted.`)
      // Update the product in the UI to show it as deleted
      setProduct({
        ...product,
        deleted: true,
        date_deleted: new Date().toISOString(),
      })
    } catch (error) {
      console.error("Error deleting product:", error)
      showNotification("error", "Failed to delete the product. Please try again.")
    }
  }

  const handleEdit = () => {
    if (product) {
      router.push(`/sales/products/edit/${product.id}`)
    }
  }

  const handleShare = () => {
    const shareUrl = `https://oohshop.online/product-details/${product.id}`
    navigator.clipboard
      .writeText(shareUrl)
      .then(() => {
        showNotification("success", "Product link copied to clipboard and ready to share!")
      })
      .catch(() => {
        showNotification("error", "Failed to copy link. Please try again.")
      })
  }

  function renderBookingStatusBadge(status) {
    switch (status?.toUpperCase()) {
      case "CONFIRMED":
        return (
          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
            <CheckCircle className="mr-1 h-3 w-3" />
            CONFIRMED
          </Badge>
        )
      case "PENDING":
        return (
          <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
            <Clock3 className="mr-1 h-3 w-3" />
            PENDING
          </Badge>
        )
      case "CANCELLED":
        return (
          <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
            <XCircle className="mr-1 h-3 w-3" />
            CANCELLED
          </Badge>
        )
      default:
        return (
          <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-200">
            {status || "UNKNOWN"}
          </Badge>
        )
    }
  }

  function renderPaymentStatusBadge(status) {
    switch (status?.toUpperCase()) {
      case "PAID":
        return (
          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
            <CheckCircle className="mr-1 h-3 w-3" />
            PAID
          </Badge>
        )
      case "PENDING":
        return (
          <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
            <Clock3 className="mr-1 h-3 w-3" />
            PENDING
          </Badge>
        )
      case "OVERDUE":
        return (
          <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
            <XCircle className="mr-1 h-3 w-3" />
            OVERDUE
          </Badge>
        )
      default:
        return (
          <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-200">
            {status || "UNKNOWN"}
          </Badge>
        )
    }
  }

  function renderStatusBadge(status: string, deleted = false) {
    if (deleted) {
      return (
        <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200" aria-label="Product deleted">
          DELETED
        </Badge>
      )
    }

    const statusConfig = {
      ACTIVE: { color: "bg-green-50 text-green-700 border-green-200", label: "ACTIVE" },
      PENDING: { color: "bg-yellow-50 text-yellow-700 border-yellow-200", label: "PENDING" },
      DEFAULT: { color: "bg-gray-50 text-gray-700 border-gray-200", label: status || "UNKNOWN" },
    }

    const config = statusConfig[status?.toUpperCase() as keyof typeof statusConfig] || statusConfig.DEFAULT

    return (
      <Badge variant="outline" className={config.color} aria-label={`Status: ${config.label}`}>
        {config.label}
      </Badge>
    )
  }

  // Function to get site code from product
  const getSiteCode = (product) => {
    if (!product) return null

    // Try different possible locations for site_code
    if (product.site_code) return product.site_code
    if (product.specs_rental && "site_code" in product.specs_rental) return product.specs_rental.site_code
    if (product.light && "site_code" in product.light) return product.light.site_code

    // Check for camelCase variant
    if ("siteCode" in product) return product.siteCode

    return null
  }

  // Function to get current content from product
  const getCurrentContent = (product) => {
    if (!product) return null

    // Try different possible locations for current content
    if (product.current_content) return product.current_content
    if (product.current_campaign) return product.current_campaign

    return null
  }

  const getCostEstimateStatusConfig = (status: CostEstimate["status"]) => {
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
          icon: <Mail className="h-3.5 w-3.5" />,
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
          icon: <Clock3 className="h-3.5 w-3.5" />,
          label: "Unknown",
        }
    }
  }

  const getQuotationStatusConfig = (status: Quotation["status"]) => {
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
          icon: <Mail className="h-3.5 w-3.5" />,
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
          icon: <AlertCircle className="h-3.5 w-3.5" />,
          label: "Expired",
        }
      default:
        return {
          color: "bg-gray-100 text-gray-800 border-gray-200",
          icon: <Clock3 className="h-3.5 w-3.5" />,
          label: "Unknown",
        }
    }
  }

  const getJobOrderStatusConfig = (status: JobOrder["status"]) => {
    switch (status?.toLowerCase()) {
      case "draft":
        return {
          color: "bg-gray-100 text-gray-800 border-gray-200",
          icon: <FileText className="h-3.5 w-3.5" />,
          label: "Draft",
        }
      case "pending":
        return {
          color: "bg-yellow-100 text-yellow-800 border-yellow-200",
          icon: <Clock3 className="h-3.5 w-3.5" />,
          label: "Pending",
        }
      case "approved":
        return {
          color: "bg-blue-100 text-blue-800 border-blue-200",
          icon: <CheckCircle className="h-3.5 w-3.5" />,
          label: "Approved",
        }
      case "completed":
        return {
          color: "bg-green-100 text-green-800 border-green-200",
          icon: <CheckCircle className="h-3.5 w-3.5" />,
          label: "Completed",
        }
      case "cancelled":
        return {
          color: "bg-red-100 text-red-800 border-red-200",
          icon: <XCircle className="h-3.5 w-3.5" />,
          label: "Cancelled",
        }
      default:
        return {
          color: "bg-gray-100 text-gray-800 border-gray-200",
          icon: <Clock3 className="h-3.5 w-3.5" />,
          label: "Unknown",
        }
    }
  }

  const getJobOrderPriorityConfig = (priority: JobOrder["priority"]) => {
    switch (priority?.toLowerCase()) {
      case "high":
        return {
          color: "bg-red-100 text-red-800 border-red-200",
          label: "High",
        }
      case "medium":
        return {
          color: "bg-yellow-100 text-yellow-800 border-yellow-200",
          label: "Medium",
        }
      case "low":
        return {
          color: "bg-green-100 text-green-800 border-green-200",
          label: "Low",
        }
      default:
        return {
          color: "bg-gray-100 text-gray-800 border-gray-200",
          label: "Normal",
        }
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-6">
        <div className="flex items-center mb-6">
          <Button variant="ghost" size="sm" className="mr-2" disabled>
            <ArrowLeft className="h-4 w-4 mr-1" />
            <Skeleton className="h-4 w-16" />
          </Button>
          <Skeleton className="h-6 w-48" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1">
            <Card className="rounded-xl">
              <CardContent className="p-0">
                <Skeleton className="h-[250px] w-full rounded-t-xl" />
                <div className="p-4 space-y-4">
                  <Skeleton className="h-6 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                  <div className="space-y-2">
                    {Array(6)
                      .fill(0)
                      .map((_, i) => (
                        <Skeleton key={i} className="h-4 w-full" />
                      ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="lg:col-span-2">
            <Skeleton className="h-10 w-full mb-4" />
            <Card className="rounded-xl">
              <CardContent className="p-8">
                <Skeleton className="h-[200px] w-full" />
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    )
  }

  if (!product) {
    return (
      <div className="container mx-auto px-4 py-12 text-center">
        <div className="max-w-md mx-auto">
          <AlertTriangle className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">Product Not Found</h2>
          <p className="text-gray-500 mb-6">The product you're looking for doesn't exist or has been removed.</p>
          <Button onClick={() => router.back()}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Go Back
          </Button>
        </div>
      </div>
    )
  }

  // Get site code
  const siteCode = getSiteCode(product)

  // Get current content if available
  const currentContent = getCurrentContent(product)

  return (
    <div className="container mx-auto px-4 py-6">
      {/* Notification */}
      <Notification
        show={notification.show}
        type={notification.type}
        message={notification.message}
        onClose={hideNotification}
      />

      <header className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <Button variant="ghost" size="sm" onClick={() => router.back()} className="mr-2">
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back
          </Button>
          <h1 className="text-xl font-semibold">Site Information</h1>
        </div>
        <div className="flex items-center gap-2">
          <Button
            className="bg-[#ff3333] text-white hover:bg-[#cc2929]"
            onClick={() => setMarketplaceDialogOpen(true)}
            aria-label="Open marketplace dialog"
          >
            Marketplace
          </Button>
        </div>
      </header>

      {product?.deleted && (
        <Alert variant="destructive" className="mb-6 border border-red-200 rounded-xl">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Deleted Product</AlertTitle>
          <AlertDescription>
            This product has been marked as deleted on {formatDate(product.date_deleted)}. It is no longer visible in
            product listings.
          </AlertDescription>
        </Alert>
      )}

      <main className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Sidebar - Site Information */}
        <aside className="lg:col-span-1">
          <Card className="rounded-xl shadow-sm border border-gray-200">
            <CardContent className="p-0">
              {/* Site Image */}
              <div className="relative aspect-[4/3] w-full rounded-t-xl overflow-hidden">
                {product?.media && product.media.length > 0 ? (
                  <>
                    <Image
                      src={product.media[activeImageIndex]?.url || "/placeholder.svg"}
                      alt={product.name || "Site image"}
                      fill
                      className="object-cover"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement
                        target.src = "/building-billboard.png"
                        target.className = "object-cover opacity-50"
                      }}
                    />
                    <Button
                      variant="secondary"
                      size="icon"
                      className="absolute top-2 right-2 h-8 w-8 bg-white/80 backdrop-blur-sm border border-gray-200 shadow-md rounded-full"
                      onClick={() => setImageViewerOpen(true)}
                      aria-label="View full size image"
                    >
                      <Maximize className="h-4 w-4" />
                    </Button>
                  </>
                ) : (
                  <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                    <Image
                      src="/building-billboard.png"
                      alt="Site placeholder"
                      fill
                      className="object-cover opacity-50"
                    />
                  </div>
                )}
              </div>

              {/* Site Code and Name */}
              <div className="p-4 border-b border-gray-100">
                <div className="text-lg font-bold text-gray-900 mb-1">
                  {product?.site_code || product?.specs_rental?.site_code || "No Site Code"}
                </div>
                <div className="text-sm text-gray-600">{product?.name || "Unknown Site"}</div>
              </div>

              {/* Site Calendar Button */}
              <div className="p-4 border-b border-gray-100">
                <Button variant="outline" className="w-full bg-transparent">
                  <Calendar className="h-4 w-4 mr-2" />
                  Site Calendar
                </Button>
              </div>

              {/* Site Details */}
              <div className="p-4 space-y-3">
                <div>
                  <span className="text-sm font-medium text-gray-900">Type: </span>
                  <span className="text-sm text-gray-600">{product?.type || "Unknown"}</span>
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-900">Dimension: </span>
                  <span className="text-sm text-gray-600">{product?.specs_rental?.dimensions || "Not specified"}</span>
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-900">Traffic Count: </span>
                  <span className="text-sm text-gray-600">
                    {product?.specs_rental?.traffic_count || "Not specified"}
                  </span>
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-900">Location: </span>
                  <span className="text-sm text-gray-600">
                    {product?.type?.toLowerCase() === "rental"
                      ? product.specs_rental?.location || "Unknown"
                      : product.light?.location || "Unknown"}
                  </span>
                </div>
                {product?.specs_rental?.geopoint && (
                  <div>
                    <span className="text-sm font-medium text-gray-900">Geopoint: </span>
                    <span className="text-sm text-gray-600">
                      {product.specs_rental.geopoint[0]}, {product.specs_rental.geopoint[1]}
                    </span>
                  </div>
                )}
                <div>
                  <span className="text-sm font-medium text-gray-900">Site Orientation: </span>
                  <span className="text-sm text-gray-600">{product?.specs_rental?.orientation || "Not specified"}</span>
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-900">Site Owner: </span>
                  <span className="text-sm text-gray-600">
                    {product?.owner_name || product?.seller_name || "Unknown"}
                  </span>
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-900">Land Owner: </span>
                  <span className="text-sm text-gray-600">{product?.land_owner || "Not specified"}</span>
                </div>
              </div>

              {/* Action Buttons */}
              {!product?.deleted && (
                <div className="p-4 space-y-2 border-t border-gray-100">
                  <Button className="w-full bg-red-500 hover:bg-red-600 text-white">Propose this Site</Button>
                  <Button className="w-full bg-red-500 hover:bg-red-600 text-white">Create CE/ Quote</Button>
                  <Button
                    className="w-full bg-red-500 hover:bg-red-600 text-white"
                    onClick={() => router.push(`/sales/job-orders/select-quotation?productId=${params.id}`)}
                  >
                    Create Job Order
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </aside>

        {/* Right Content - Tabbed Interface */}
        <section className="lg:col-span-2">
          <Tabs defaultValue="booking-summary" className="w-full">
            <div className="flex items-center justify-between mb-4">
              <TabsList className="grid w-fit grid-cols-4">
                <TabsTrigger value="booking-summary">Booking Summary</TabsTrigger>
                <TabsTrigger value="ce">CE</TabsTrigger>
                <TabsTrigger value="quote">Quote</TabsTrigger>
                <TabsTrigger value="job-order">Job Order</TabsTrigger>
              </TabsList>
              <div className="text-sm text-gray-600">Total: 2025</div>
            </div>

            <TabsContent value="booking-summary" className="mt-0">
              <Card className="rounded-xl shadow-sm border border-gray-200">
                <CardContent className="p-0">
                  <div className="grid grid-cols-7 gap-4 p-4 bg-gray-50 border-b border-gray-200 text-sm font-medium text-gray-700">
                    <div>Date</div>
                    <div>Project ID</div>
                    <div>Client</div>
                    <div>Content</div>
                    <div>Price</div>
                    <div>Total</div>
                    <div>Status</div>
                  </div>

                  <div className="divide-y divide-gray-100">
                    <div className="grid grid-cols-7 gap-4 p-4 text-sm">
                      <div className="text-gray-600">
                        Apr 30, 2025 to
                        <br />
                        Jun 30, 2025
                      </div>
                      <div className="text-gray-900 font-medium">JO-SU-LS-0013-043025</div>
                      <div className="text-gray-900">Summit Media</div>
                      <div className="text-gray-900">Disney-Lilo&Stitch</div>
                      <div className="text-red-600 font-medium">
                        ₱2,000,000
                        <br />
                        <span className="text-xs">/month</span>
                      </div>
                      <div className="text-red-600 font-bold">₱4,000,000</div>
                      <div>
                        <Badge className="bg-red-100 text-red-800 border-red-200">Ongoing</Badge>
                      </div>
                    </div>

                    <div className="grid grid-cols-7 gap-4 p-4 text-sm">
                      <div className="text-gray-600">
                        Jan 15, 2025 to
                        <br />
                        Mar 25, 2025
                      </div>
                      <div className="text-gray-900 font-medium">JO-CC-JD-0012-011525</div>
                      <div className="text-gray-900">Coca-Cola</div>
                      <div className="text-gray-900">Jack Daniel</div>
                      <div className="text-red-600 font-medium">
                        ₱1,900,000
                        <br />
                        <span className="text-xs">/month</span>
                      </div>
                      <div className="text-red-600 font-bold">₱5,700,000</div>
                      <div>
                        <Badge className="bg-green-100 text-green-800 border-green-200">Completed</Badge>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* CE Tab */}
            <TabsContent value="ce" className="mt-0">
              <Card className="rounded-xl shadow-sm border border-gray-200">
                <CardContent className="p-0">
                  {costEstimatesLoading ? (
                    <div className="p-8">
                      <div className="space-y-4">
                        {Array(3)
                          .fill(0)
                          .map((_, i) => (
                            <div key={i} className="grid grid-cols-6 gap-4">
                              <Skeleton className="h-4 w-24" />
                              <Skeleton className="h-4 w-32" />
                              <Skeleton className="h-4 w-28" />
                              <Skeleton className="h-4 w-20" />
                              <Skeleton className="h-4 w-24" />
                              <Skeleton className="h-4 w-16" />
                            </div>
                          ))}
                      </div>
                    </div>
                  ) : costEstimates.length === 0 ? (
                    <div className="p-8 text-center">
                      <FileText className="h-10 w-10 text-gray-400 mx-auto mb-3" />
                      <h3 className="text-sm font-medium text-gray-900 mb-1">No CE records</h3>
                      <p className="text-sm text-gray-500">No cost estimates have been created for this site yet.</p>
                    </div>
                  ) : (
                    <>
                      <div className="grid grid-cols-6 gap-4 p-4 bg-gray-50 border-b border-gray-200 text-sm font-medium text-gray-700">
                        <div>Date</div>
                        <div>Project ID</div>
                        <div>Type</div>
                        <div>Client</div>
                        <div>Status</div>
                        <div>Price</div>
                      </div>
                      <div className="divide-y divide-gray-100">
                        {costEstimates.map((estimate) => (
                          <div
                            key={estimate.id}
                            className="grid grid-cols-6 gap-4 p-4 text-sm hover:bg-gray-50 cursor-pointer transition-colors"
                            onClick={() => router.push(`/sales/cost-estimates/${estimate.id}`)}
                          >
                            <div className="text-gray-600">{formatDate(estimate.createdAt)}</div>
                            <div className="text-gray-900 font-medium">
                              {estimate.costEstimateNumber || estimate.id.slice(-8)}
                            </div>
                            <div className="text-gray-600">Cost Estimate</div>
                            <div className="text-gray-900">
                              {estimate.client?.company || estimate.client?.name || "Unknown Client"}
                            </div>
                            <div>
                              <Badge variant="outline" className="bg-blue-100 text-blue-800 border-blue-200">
                                {estimate.status || "Draft"}
                              </Badge>
                            </div>
                            <div className="text-red-600 font-medium">
                              ₱{estimate.totalAmount?.toLocaleString()}/month
                            </div>
                          </div>
                        ))}
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Quote Tab */}
            <TabsContent value="quote" className="space-y-4">
              <div className="rounded-lg border bg-white">
                <div className="p-4 border-b">
                  <h3 className="font-semibold">Quotations</h3>
                  <p className="text-sm text-gray-600">
                    {quotationsLoading ? "Loading..." : `${quotations.length} quotation(s) found`}
                  </p>
                </div>
                <div className="overflow-x-auto">
                  {quotationsLoading ? (
                    <div className="p-8 text-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                      <p className="mt-2 text-sm text-gray-600">Loading quotations...</p>
                    </div>
                  ) : quotations.length === 0 ? (
                    <div className="p-8 text-center text-gray-500">
                      <FileText className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                      <p>No quotations found for this product</p>
                    </div>
                  ) : (
                    <table className="w-full">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Quotation #
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Client
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Amount
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Status
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Date
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {quotations.map((quotation) => {
                          const statusConfig = getQuotationStatusConfig(quotation.status)
                          const totalAmount =
                            quotation.products?.reduce((sum, product) => sum + (product.total || 0), 0) || 0

                          return (
                            <tr key={quotation.id} className="hover:bg-gray-50">
                              <td className="px-4 py-4 whitespace-nowrap">
                                <div className="text-sm font-medium text-gray-900">
                                  {quotation.quotationNumber || quotation.id}
                                </div>
                              </td>
                              <td className="px-4 py-4 whitespace-nowrap">
                                <div className="text-sm text-gray-900">{quotation.client?.name || "N/A"}</div>
                                <div className="text-sm text-gray-500">{quotation.client?.company || ""}</div>
                              </td>
                              <td className="px-4 py-4 whitespace-nowrap">
                                <div className="text-sm font-medium text-gray-900">₱{totalAmount.toLocaleString()}</div>
                              </td>
                              <td className="px-4 py-4 whitespace-nowrap">
                                <span
                                  className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${statusConfig.color}`}
                                >
                                  {statusConfig.icon}
                                  {statusConfig.label}
                                </span>
                              </td>
                              <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                                {quotation.createdAt ? formatDate(quotation.createdAt) : "N/A"}
                              </td>
                              <td className="px-4 py-4 whitespace-nowrap text-sm font-medium">
                                <button
                                  onClick={() => window.open(`/quotations/${quotation.id}`, "_blank")}
                                  className="text-blue-600 hover:text-blue-900"
                                >
                                  View
                                </button>
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>
            </TabsContent>

            {/* Job Order Tab */}
            <TabsContent value="job-order" className="space-y-4">
              <div className="rounded-lg border bg-white">
                <div className="p-4 border-b">
                  <h3 className="font-semibold">Job Orders</h3>
                  <p className="text-sm text-gray-600">
                    {jobOrdersLoading ? "Loading..." : `${jobOrders.length} job order(s) found`}
                  </p>
                </div>
                <div className="overflow-x-auto">
                  {jobOrdersLoading ? (
                    <div className="p-8 text-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                      <p className="mt-2 text-sm text-gray-600">Loading job orders...</p>
                    </div>
                  ) : jobOrders.length === 0 ? (
                    <div className="p-8 text-center text-gray-500">
                      <Briefcase className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                      <p>No job orders found for this product</p>
                    </div>
                  ) : (
                    <table className="w-full">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Job Order #
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Title
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Client
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Status
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Priority
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Date
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {jobOrders.map((jobOrder) => {
                          const statusConfig = getJobOrderStatusConfig(jobOrder.status)
                          const priorityConfig = getJobOrderPriorityConfig(jobOrder.priority)

                          return (
                            <tr key={jobOrder.id} className="hover:bg-gray-50">
                              <td className="px-4 py-4 whitespace-nowrap">
                                <div className="text-sm font-medium text-gray-900">
                                  {jobOrder.jobOrderNumber || jobOrder.id}
                                </div>
                              </td>
                              <td className="px-4 py-4">
                                <div className="text-sm text-gray-900 max-w-xs truncate">
                                  {jobOrder.title || "Untitled Job Order"}
                                </div>
                                <div className="text-sm text-gray-500">{jobOrder.siteName || ""}</div>
                              </td>
                              <td className="px-4 py-4 whitespace-nowrap">
                                <div className="text-sm text-gray-900">{jobOrder.clientName || "N/A"}</div>
                              </td>
                              <td className="px-4 py-4 whitespace-nowrap">
                                <span
                                  className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${statusConfig.color}`}
                                >
                                  {statusConfig.icon}
                                  {statusConfig.label}
                                </span>
                              </td>
                              <td className="px-4 py-4 whitespace-nowrap">
                                <span
                                  className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${priorityConfig.color}`}
                                >
                                  {priorityConfig.label}
                                </span>
                              </td>
                              <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                                {jobOrder.createdAt ? formatDate(jobOrder.createdAt) : "N/A"}
                              </td>
                              <td className="px-4 py-4 whitespace-nowrap text-sm font-medium">
                                <button
                                  onClick={() => window.open(`/job-orders/${jobOrder.id}`, "_blank")}
                                  className="text-blue-600 hover:text-blue-900"
                                >
                                  View
                                </button>
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </section>
      </main>

      <Dialog open={marketplaceDialogOpen} onOpenChange={setMarketplaceDialogOpen}>
        <DialogContent className="sm:max-w-2xl" aria-labelledby="marketplace-dialog-title">
          <DialogHeader>
            <DialogTitle id="marketplace-dialog-title">Connect to a marketplace</DialogTitle>
            <DialogDescription>Select a DSP:</DialogDescription>
          </DialogHeader>

          <div className="flex justify-center items-center gap-8 py-6">
            {[
              { name: "OOH!Shop", logo: "/ooh-shop-logo.png" },
              { name: "Vistar Media", logo: "/vistar-media-logo.png" },
              { name: "Broadsign", logo: "/broadsign-logo.png" },
              { name: "Moving Walls", logo: "/moving-walls-logo.png" },
            ].map((marketplace) => (
              <button
                key={marketplace.name}
                className="flex flex-col items-center p-4 rounded-lg hover:bg-gray-50 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
                aria-label={`Connect to ${marketplace.name}`}
              >
                <div className="w-24 h-24 rounded-xl flex items-center justify-center mb-2 bg-white">
                  <Image
                    src={marketplace.logo || "/placeholder.svg"}
                    alt={`${marketplace.name} logo`}
                    width={80}
                    height={80}
                    className="object-contain rounded-lg"
                  />
                </div>
                <span className="text-sm font-medium">{marketplace.name}</span>
              </button>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

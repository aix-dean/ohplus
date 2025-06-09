"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import {
  ArrowLeft,
  MapPin,
  Tag,
  AlertTriangle,
  Trash2,
  CheckCircle,
  XCircle,
  Clock3,
  Share2,
  MoreHorizontal,
  ChevronRight,
  Info,
  Maximize,
  Check,
  X,
  Calendar,
  FileText,
  Mail,
  Phone,
} from "lucide-react"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { doc, getDoc } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { Skeleton } from "@/components/ui/skeleton"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import { getQuotationRequestsByProductId, type QuotationRequest } from "@/lib/firebase-service"

// Helper function to format dates
function formatDate(dateString) {
  if (!dateString) return "N/A"

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
}

// Notification Component
function Notification({ show, type, message, onClose }) {
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
    <div className="fixed top-4 right-4 z-50 animate-in slide-in-from-top-2 duration-300">
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
        <button onClick={onClose} className="flex-shrink-0 p-1 rounded-full hover:bg-black/10 transition-colors">
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}

export default function ProductDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [product, setProduct] = useState(null)
  const [loading, setLoading] = useState(true)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [activeImageIndex, setActiveImageIndex] = useState(0)
  const [imageViewerOpen, setImageViewerOpen] = useState(false)
  const [quotationRequests, setQuotationRequests] = useState<QuotationRequest[]>([])
  const [quotationRequestsLoading, setQuotationRequestsLoading] = useState(true)

  // Notification state
  const [notification, setNotification] = useState({
    show: false,
    type: "success",
    message: "",
  })

  const showNotification = (type, message) => {
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

        // Check if the ID is "new" and redirect to the upload page
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
        }
      } catch (error) {
        console.error("Error fetching product:", error)
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

  function renderStatusBadge(status, deleted = false) {
    if (deleted) {
      return (
        <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
          DELETED
        </Badge>
      )
    }

    switch (status?.toUpperCase()) {
      case "ACTIVE":
        return (
          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
            ACTIVE
          </Badge>
        )
      case "PENDING":
        return (
          <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
            PENDING
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

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-6">
        <div className="flex items-center mb-6">
          <Button variant="ghost" size="sm" className="mr-2">
            <ArrowLeft className="h-4 w-4 mr-1" />
            <Skeleton className="h-4 w-16" />
          </Button>
          <Skeleton className="h-6 w-48" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader className="pb-0">
                <Skeleton className="h-7 w-3/4 mb-2" />
                <Skeleton className="h-4 w-1/2" />
              </CardHeader>
              <CardContent className="pt-4">
                <Skeleton className="h-[250px] w-full rounded-md mb-4" />
                <div className="flex gap-2 mb-4">
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-16 w-16 rounded-md" />
                  ))}
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-full" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <Skeleton className="h-6 w-32" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-[200px] w-full rounded-md" />
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card>
              <CardHeader className="pb-2">
                <Skeleton className="h-6 w-32" />
              </CardHeader>
              <CardContent className="space-y-4">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
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
          <Button onClick={handleBack}>
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

      {/* Header with breadcrumb and actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
        <div>
          <div className="flex items-center mb-1">
            <Button variant="ghost" size="sm" onClick={handleBack} className="mr-1 -ml-3 h-8">
              <ArrowLeft className="h-4 w-4 mr-1" />
              <span className="text-sm">Back</span>
            </Button>
            <span className="text-sm text-muted-foreground mx-1">/</span>
            <span className="text-sm">Products</span>
            <ChevronRight className="h-4 w-4 mx-1 text-muted-foreground" />
            <span className="text-sm font-medium truncate max-w-[200px]">{product.name || "Product Details"}</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {!product.deleted && (
            <>
              <Button
                variant="default"
                size="sm"
                className="bg-primary hover:bg-primary/90"
                onClick={() => {
                  const shareUrl = `https://oohshop.online/product-details/${product.id}`
                  window.open(shareUrl, "_blank")
                }}
              >
                <Calendar className="h-4 w-4 mr-1" />
                Book Now
              </Button>
              <Button variant="outline" size="sm" className="border-gray-300" onClick={handleShare}>
                <Share2 className="h-4 w-4 mr-1" />
                Share
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="border-gray-300">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={handleShare}>
                    <Share2 className="h-4 w-4 mr-2" />
                    Copy Link
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setDeleteDialogOpen(true)} className="text-red-600">
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          )}
        </div>
      </div>

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

      {/* Main product overview - new layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <div className="lg:col-span-2 overflow-hidden rounded-xl">
          <div className="flex flex-col md:flex-row">
            {/* Left side - Product image */}
            <div className="md:w-1/2 relative">
              <div className="relative aspect-[16/9] w-full rounded-t-xl md:rounded-tr-none md:rounded-l-xl overflow-hidden border-b md:border-b-0 md:border-r border-gray-200">
                {product?.media && product.media.length > 0 ? (
                  <>
                    <Image
                      src={product.media[activeImageIndex]?.url || "/placeholder.svg"}
                      alt={product.name || "Product image"}
                      fill
                      className="object-cover transition-transform duration-300 hover:scale-105"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement
                        target.src = "/abstract-geometric-sculpture.png"
                        target.className = "object-cover opacity-50"
                      }}
                    />
                    <Button
                      variant="secondary"
                      size="icon"
                      className="absolute top-2 right-2 h-8 w-8 bg-white/80 backdrop-blur-sm border border-gray-200 shadow-md rounded-full"
                      onClick={() => setImageViewerOpen(true)}
                    >
                      <Maximize className="h-4 w-4" />
                    </Button>
                  </>
                ) : (
                  <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                    <p className="text-gray-400">No image available</p>
                  </div>
                )}
              </div>

              {/* Thumbnail gallery */}
              {product?.media && product.media.length > 1 && (
                <div className="flex gap-2 p-3 overflow-x-auto bg-gray-50 border-b md:border-b-0 md:border-r border-gray-200">
                  {product.media.map((item, index) => (
                    <button
                      key={index}
                      className={`relative h-16 w-16 rounded-lg overflow-hidden border-2 flex-shrink-0 transition-all ${
                        activeImageIndex === index
                          ? "border-primary shadow-md"
                          : "border-gray-200 hover:border-gray-300"
                      }`}
                      onClick={() => setActiveImageIndex(index)}
                    >
                      <Image
                        src={item.url || "/placeholder.svg"}
                        alt={`Thumbnail ${index + 1}`}
                        fill
                        className="object-cover"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement
                          target.src = "/abstract-geometric-sculpture.png"
                          target.className = "object-cover opacity-50"
                        }}
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Right side - Product info */}
            <div className="md:w-1/2 p-6">
              <div className="flex flex-col h-full">
                <div className="mb-4">
                  <div className="text-sm text-gray-500 mb-1">Site Code</div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-xl font-bold">{siteCode || "No Site Code"}</h2>
                    <Badge variant="outline" className="border-gray-300">
                      {product.type || "Unknown Type"}
                    </Badge>
                  </div>
                </div>

                {currentContent && (
                  <div className="mb-6 p-4 bg-blue-50 border border-blue-100 rounded-lg">
                    <div className="text-sm font-medium text-blue-800 mb-1">Current Content</div>
                    <div className="text-lg font-semibold mb-1">
                      {currentContent.title || currentContent.name || "Unknown Content"}
                    </div>
                    {currentContent.end_date && (
                      <div className="text-sm text-gray-600">Until {formatDate(currentContent.end_date)}</div>
                    )}
                  </div>
                )}

                <div className="mb-4">
                  <div className="flex items-start gap-2">
                    <MapPin className="h-5 w-5 text-gray-400 mt-0.5 flex-shrink-0" />
                    <div>
                      <div className="text-sm text-gray-500 mb-1">Location</div>
                      <div className="font-medium">
                        {product.type?.toLowerCase() === "rental"
                          ? product.specs_rental?.location || "Unknown Location"
                          : product.light?.location || "Unknown Location"}
                      </div>
                    </div>
                  </div>
                </div>

                {product.price && (
                  <div className="mb-4">
                    <div className="flex items-start gap-2">
                      <Tag className="h-5 w-5 text-gray-400 mt-0.5 flex-shrink-0" />
                      <div>
                        <div className="text-sm text-gray-500 mb-1">Price</div>
                        <div className="font-medium text-green-700">₱{Number(product.price).toLocaleString()}</div>
                      </div>
                    </div>
                  </div>
                )}

                <div className="mt-auto pt-4 border-t border-gray-100">
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-gray-500">Status</div>
                    {renderStatusBadge(product.status || "", product.deleted)}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Site Information Card */}
        <Card className="rounded-xl shadow-lg border border-gray-200">
          <CardHeader className="pb-3 border-b border-gray-100">
            <CardTitle className="text-lg flex items-center gap-2">
              <Info className="h-5 w-5 text-gray-500" />
              Site Information
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <ul className="divide-y divide-gray-100">
              <li className="px-6 py-3">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500">Site Code:</span>
                  <span className="text-sm font-medium">{siteCode || "Not assigned"}</span>
                </div>
              </li>
              <li className="px-6 py-3">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500">Site Name:</span>
                  <span className="text-sm font-medium">{product.name || "Unknown"}</span>
                </div>
              </li>
              <li className="px-6 py-3">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500">Type:</span>
                  <span className="text-sm font-medium">{product.type || "Unknown"}</span>
                </div>
              </li>
              {product.specs_rental?.dimensions && (
                <li className="px-6 py-3">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-500">Dimension:</span>
                    <span className="text-sm font-medium">{product.specs_rental.dimensions}</span>
                  </div>
                </li>
              )}
              <li className="px-6 py-3">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500">Location:</span>
                  <span className="text-sm font-medium">
                    {product.type?.toLowerCase() === "rental"
                      ? product.specs_rental?.location || "Unknown"
                      : product.light?.location || "Unknown"}
                  </span>
                </div>
              </li>
              {product.specs_rental?.geopoint && (
                <li className="px-6 py-3">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-500">Geopoint:</span>
                    <span className="text-sm font-medium truncate max-w-[180px]">
                      {product.specs_rental.geopoint[0]}, {product.specs_rental.geopoint[1]}
                    </span>
                  </div>
                </li>
              )}
              {product.specs_rental?.orientation && (
                <li className="px-6 py-3">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-500">Site Orientation:</span>
                    <span className="text-sm font-medium">{product.specs_rental.orientation}</span>
                  </div>
                </li>
              )}
              <li className="px-6 py-3">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500">Site Owner:</span>
                  <span className="text-sm font-medium">{product.owner_name || product.seller_name || "Unknown"}</span>
                </div>
              </li>
            </ul>
          </CardContent>
          {!product.deleted && null}
        </Card>
      </div>

      {/* Quotation Requests Section */}
      <div className="mt-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-1">Quotation Requests</h2>
            <p className="text-sm text-gray-600">Client requests for this product</p>
          </div>
          {quotationRequests.length > 0 && (
            <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200">
              {quotationRequests.length} request{quotationRequests.length !== 1 ? "s" : ""}
            </Badge>
          )}
        </div>

        {quotationRequestsLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[1, 2].map((i) => (
              <Card key={i} className="border border-gray-200">
                <CardContent className="p-6">
                  <Skeleton className="h-5 w-3/4 mb-2" />
                  <Skeleton className="h-4 w-1/2 mb-3" />
                  <Skeleton className="h-4 w-full mb-2" />
                  <Skeleton className="h-4 w-2/3" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : quotationRequests.length === 0 ? (
          <Card className="border border-gray-200">
            <CardContent className="p-8 text-center">
              <FileText className="h-10 w-10 text-gray-400 mx-auto mb-3" />
              <h3 className="text-sm font-medium text-gray-900 mb-1">No quotation requests</h3>
              <p className="text-sm text-gray-500">No clients have requested quotes for this product yet.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {quotationRequests.map((request) => {
              const formatRequestDate = (date: any) => {
                if (!date) return "N/A"
                const dateObj = date.toDate ? date.toDate() : new Date(date)
                return new Intl.DateTimeFormat("en-US", {
                  year: "numeric",
                  month: "short",
                  day: "numeric",
                }).format(dateObj)
              }

              const getStatusBadgeVariant = (status: string) => {
                switch (status?.toLowerCase()) {
                  case "pending":
                    return "bg-yellow-100 text-yellow-800 border-yellow-200"
                  case "approved":
                    return "bg-green-100 text-green-800 border-green-200"
                  case "rejected":
                    return "bg-red-100 text-red-800 border-red-200"
                  case "sent":
                    return "bg-blue-100 text-blue-800 border-blue-200"
                  default:
                    return "bg-gray-100 text-gray-800 border-gray-200"
                }
              }

              return (
                <Card
                  key={request.id}
                  className="border border-gray-200 hover:shadow-md transition-shadow cursor-pointer"
                  onClick={() => router.push(`/sales/quotation-requests/${request.id}`)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-gray-900 line-clamp-1">{request.name}</h3>
                        <p className="text-sm text-gray-600 line-clamp-1">{request.company}</p>
                      </div>
                      <Badge variant="outline" className={`${getStatusBadgeVariant(request.status || "")} ml-2`}>
                        {request.status || "Unknown"}
                      </Badge>
                    </div>

                    <div className="space-y-1 mb-2">
                      <div className="flex items-center text-sm text-gray-600">
                        <Mail className="h-4 w-4 mr-2 text-gray-400 flex-shrink-0" />
                        <span className="line-clamp-1">{request.email_address}</span>
                      </div>
                      <div className="flex items-center text-sm text-gray-600">
                        <Phone className="h-4 w-4 mr-2 text-gray-400 flex-shrink-0" />
                        <span>{request.contact_number}</span>
                      </div>
                      <div className="flex items-center text-sm text-gray-600">
                        <Calendar className="h-4 w-4 mr-2 text-gray-400 flex-shrink-0" />
                        <span>
                          {formatRequestDate(request.start_date)} - {formatRequestDate(request.end_date)}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-xs text-gray-500 pt-2 border-t border-gray-100">
                      <span>Submitted {formatRequestDate(request.created)}</span>
                      <span className="font-medium">{request.position}</span>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}
      </div>

      {/* Image viewer dialog */}
      <Dialog open={imageViewerOpen} onOpenChange={setImageViewerOpen}>
        <DialogContent className="max-w-4xl p-0 overflow-hidden bg-black/95 border-none">
          {product?.media && product.media.length > 0 && (
            <div className="relative h-[80vh] w-full">
              <Image
                src={product.media[activeImageIndex]?.url || "/placeholder.svg"}
                alt={product.name || "Product image"}
                fill
                className="object-contain"
                onError={(e) => {
                  const target = e.target as HTMLImageElement
                  target.src = "/abstract-geometric-sculpture.png"
                  target.className = "object-contain opacity-50"
                }}
              />
              <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-2">
                {product.media.map((_, index) => (
                  <button
                    key={index}
                    className={`w-2 h-2 rounded-full ${activeImageIndex === index ? "bg-white" : "bg-white/30"}`}
                    onClick={() => setActiveImageIndex(index)}
                  />
                ))}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

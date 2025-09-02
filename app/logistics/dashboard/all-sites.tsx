"use client"

import type React from "react"
import { useState, useEffect, useCallback } from "react"
import { useAuth } from "@/contexts/auth-context"
import { useToast } from "@/hooks/use-toast"
import { getPaginatedUserProducts, getUserProductsCount, type Product } from "@/lib/firebase-service"
import type { DocumentData, QueryDocumentSnapshot } from "firebase/firestore"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight, Loader2, AlertCircle, Bell } from "lucide-react"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { CreateReportDialog } from "@/components/create-report-dialog"
import { JobOrdersListDialog } from "@/components/job-orders-list-dialog"

// Direct Firebase imports for job order fetching
import { collection, query, where, getDocs } from "firebase/firestore"
import { db } from "@/lib/firebase"

// Number of items to display per page
const ITEMS_PER_PAGE = 8

interface AllSitesTabProps {
  searchQuery?: string
  contentTypeFilter?: string
  viewMode?: "grid" | "list"
}

export default function AllSitesTab({
  searchQuery = "",
  contentTypeFilter = "All",
  viewMode = "grid",
}: AllSitesTabProps) {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [jobOrderCounts, setJobOrderCounts] = useState<Record<string, number>>({})

  const { toast } = useToast()
  const { userData } = useAuth()
  const router = useRouter()

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1)
  const [totalItems, setTotalItems] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const [hasMore, setHasMore] = useState(false)
  const [lastDoc, setLastDoc] = useState<QueryDocumentSnapshot<DocumentData> | null>(null)
  const [pageCache, setPageCache] = useState<
    Map<number, { items: Product[]; lastDoc: QueryDocumentSnapshot<DocumentData> | null }>
  >(new Map())
  const [loadingMore, setLoadingMore] = useState(false)
  const [loadingCount, setLoadingCount] = useState(false)

  // Report dialog state
  const [reportDialogOpen, setReportDialogOpen] = useState(false)
  const [selectedSiteId, setSelectedSiteId] = useState<string>("")

  // Job Orders dialog state
  const [jobOrdersDialogOpen, setJobOrdersDialogOpen] = useState(false)
  const [selectedSiteForJO, setSelectedSiteForJO] = useState<{
    id: string
    name: string
  }>({ id: "", name: "" })

  // Simplified direct job order fetching function
  const fetchJobOrderCountsDirectly = useCallback(async () => {
    if (!userData?.company_id) {
      console.log("No company_id available")
      return
    }

    try {
      const counts: Record<string, number> = {}

      // Get all product IDs from current products
      const productIds = products.map((p) => p.id).filter(Boolean)

      if (productIds.length === 0) {
        console.log("No products available to fetch job orders for")
        setJobOrderCounts({})
        return
      }

      // Query job orders collection directly
      const jobOrdersRef = collection(db, "job_orders")
      const q = query(jobOrdersRef, where("company_id", "==", userData.company_id))
      const querySnapshot = await getDocs(q)

      // Count job orders for each product, but only for existing products
      querySnapshot.forEach((doc) => {
        const data = doc.data()
        const productId = data.product_id
        if (productId && productIds.includes(productId)) {
          counts[productId] = (counts[productId] || 0) + 1
        }
      })

      setJobOrderCounts(counts)
    } catch (error) {
      console.error("Error fetching job orders directly:", error)
      setJobOrderCounts({})
    }
  }, [userData?.company_id, products])

  // Fetch total count of products
  const fetchTotalCount = useCallback(async () => {
    if (!userData?.company_id) return

    setLoadingCount(true)
    try {
      const count = await getUserProductsCount(userData?.company_id, {
        active: true,
        searchTerm: searchQuery,
      })

      setTotalItems(count)
      setTotalPages(Math.max(1, Math.ceil(count / ITEMS_PER_PAGE)))
    } catch (error) {
      console.error("Error fetching total count:", error)
    } finally {
      setLoadingCount(false)
    }
  }, [userData?.company_id, searchQuery])

  // Fetch products for the current page
  const fetchProducts = useCallback(
    async (page: number, forceRefresh = false) => {
      if (!userData?.company_id) return

      // Check if we have this page in cache and not forcing refresh
      if (!forceRefresh && pageCache.has(page)) {
        const cachedData = pageCache.get(page)!
        setProducts(cachedData.items)
        setLastDoc(cachedData.lastDoc)
        return
      }

      const isFirstPage = page === 1
      setLoading(isFirstPage)
      setLoadingMore(!isFirstPage)

      try {
        // For the first page, start from the beginning
        // For subsequent pages, use the last document from the previous page
        const startDoc = isFirstPage ? null : lastDoc

        const result = await getPaginatedUserProducts(userData?.company_id, ITEMS_PER_PAGE, startDoc, {
          active: true,
          searchTerm: searchQuery,
        })

        setProducts(result.items)
        setLastDoc(result.lastDoc)
        setHasMore(result.hasMore)

        // Cache this page
        setPageCache((prev) => {
          const newCache = new Map(prev)
          newCache.set(page, {
            items: result.items,
            lastDoc: result.lastDoc,
          })
          return newCache
        })
      } catch (error) {
        console.error("Error fetching products:", error)
        setError("Failed to load sites. Please try again.")
      } finally {
        setLoading(false)
        setLoadingMore(false)
      }
    },
    [userData?.company_id, lastDoc, pageCache, searchQuery],
  )

  // Reset pagination when search or filter changes
  useEffect(() => {
    setCurrentPage(1)
    setPageCache(new Map())
    fetchTotalCount()
    fetchProducts(1, true)
  }, [searchQuery, contentTypeFilter])

  // Load initial data and count
  useEffect(() => {
    if (userData?.company_id) {
      fetchProducts(1)
      fetchTotalCount()
      fetchJobOrderCountsDirectly()
    }
  }, [userData?.company_id, fetchProducts, fetchTotalCount, fetchJobOrderCountsDirectly])

  // Load data when page changes
  useEffect(() => {
    if (currentPage > 0 && userData?.company_id) {
      fetchProducts(currentPage)
    }
  }, [currentPage, fetchProducts, userData?.company_id])

  // Debug effect to log JO counts when they change
  useEffect(() => {
    Object.entries(jobOrderCounts).forEach(([productId, count]) => {
      console.log(`Product ${productId}: ${count} JOs`)
    })
  }, [jobOrderCounts])

  // Pagination handlers
  const goToPage = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page)
      // Scroll to top when changing pages
      window.scrollTo({ top: 0, behavior: "smooth" })
    }
  }

  const goToPreviousPage = () => goToPage(currentPage - 1)
  const goToNextPage = () => goToPage(currentPage + 1)

  // Generate page numbers for pagination
  const getPageNumbers = () => {
    const pageNumbers = []
    const maxPagesToShow = 5

    if (totalPages <= maxPagesToShow) {
      // If we have 5 or fewer pages, show all of them
      for (let i = 1; i <= totalPages; i++) {
        pageNumbers.push(i)
      }
    } else {
      // Always include first page
      pageNumbers.push(1)

      // Calculate start and end of page range around current page
      let startPage = Math.max(2, currentPage - 1)
      let endPage = Math.min(totalPages - 1, currentPage + 1)

      // Adjust if we're near the beginning
      if (currentPage <= 3) {
        endPage = Math.min(totalPages - 1, 4)
      }

      // Adjust if we're near the end
      if (currentPage >= totalPages - 2) {
        startPage = Math.max(2, totalPages - 3)
      }

      // Add ellipsis if needed before the range
      if (startPage > 2) {
        pageNumbers.push("...")
      }

      // Add the range of pages
      for (let i = startPage; i <= endPage; i++) {
        pageNumbers.push(i)
      }

      // Add ellipsis if needed after the range
      if (endPage < totalPages - 1) {
        pageNumbers.push("...")
      }

      // Always include last page
      pageNumbers.push(totalPages)
    }

    return pageNumbers
  }

  // Filter products based on contentTypeFilter prop
  const filteredProducts = products.filter((product) => {
    // Content type filter
    if (contentTypeFilter !== "All") {
      if (contentTypeFilter === "Static") return product.content_type === "Static" || product.content_type === "static"
      else if (contentTypeFilter === "Dynamic")
        return product.content_type === "Dynamic" || product.content_type === "dynamic"
    }
    return true
  })

  // Convert product to site format for display
  const productToSite = (product: Product) => {
    // Determine status color based on product status
    let statusColor = "blue"
    if (product.status === "ACTIVE" || product.status === "OCCUPIED") statusColor = "blue"
    if (product.status === "VACANT" || product.status === "AVAILABLE") statusColor = "green"
    if (product.status === "MAINTENANCE" || product.status === "REPAIR") statusColor = "red"
    if (product.status === "PENDING" || product.status === "INSTALLATION") statusColor = "orange"

    // Get image from product media or use placeholder
    const image =
      product.media && product.media.length > 0
        ? product.media[0].url
        : product.content_type === "dynamic"
          ? "/led-billboard-1.png"
          : "/roadside-billboard.png"

    // Generate a health percentage based on status if not available
    const healthPercentage =
      product.health_percentage ||
      (product.status === "ACTIVE"
        ? Math.floor(Math.random() * 20) + 80
        : // 80-100 for operational
          product.status === "PENDING"
          ? Math.floor(Math.random() * 30) + 50
          : // 50-80 for warning
            Math.floor(Math.random() * 40) + 10) // 10-50 for error

    // Extract address information from different possible locations
    const address =
      product.specs_rental?.location ||
      product.light?.location ||
      product.location ||
      product.address ||
      "Address not specified"

    // Get JO count for this site using the product ID
    const joCount = jobOrderCounts[product.id || ""] || 0

    return {
      id: product.id,
      name: product.name || `Site ${product.id?.substring(0, 8)}`,
      status: product.status || "UNKNOWN",
      statusColor,
      image,
      address,
      contentType: product.content_type || "static",
      healthPercentage,
      siteCode: product.site_code || product.id?.substring(0, 8),
      joCount,
      operationalStatus:
        product.status === "ACTIVE" || product.status === "OCCUPIED"
          ? "Operational"
          : product.status === "MAINTENANCE" || product.status === "REPAIR"
            ? "Under Maintenance"
            : product.status === "PENDING" || product.status === "INSTALLATION"
              ? "Pending Setup"
              : "Inactive",
    }
  }

  // Handle JO count click
  const handleJOCountClick = (siteId: string, siteName: string) => {
    setSelectedSiteForJO({ id: siteId, name: siteName })
    setJobOrdersDialogOpen(true)
  }

  // Show loading if no user
  if (!userData?.company_id) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
        <p className="text-gray-500">Loading user data...</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-5 p-6 bg-transparent min-h-screen">
      {/* Debug Panel - Remove this in production */}
      {process.env.NODE_ENV === "development" && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4 mb-4">
          <h4 className="font-bold text-yellow-800 mb-2">Debug Info</h4>
          <div className="text-sm text-yellow-700">
            <p>
              <strong>Company ID:</strong> {userData?.company_id}
            </p>
            <p>
              <strong>Total JO Counts:</strong> {Object.keys(jobOrderCounts).length}
            </p>
            <p>
              <strong>JO Counts:</strong> {JSON.stringify(jobOrderCounts, null, 2)}
            </p>
            <Button size="sm" onClick={fetchJobOrderCountsDirectly} className="mt-2">
              Refresh JO Counts
            </Button>
          </div>
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="flex flex-col items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
          <p className="text-gray-500">Loading sites...</p>
        </div>
      )}

      {/* Error State */}
      {error && !loading && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4 text-center">
          <AlertCircle className="h-6 w-6 text-red-500 mx-auto mb-2" />
          <p className="text-red-700">{error}</p>
          <Button variant="outline" className="mt-4 bg-transparent" onClick={() => fetchProducts(1, true)}>
            Try Again
          </Button>
        </div>
      )}

      {/* Empty State */}
      {!loading && !error && filteredProducts.length === 0 && (
        <div className="bg-gray-50 border border-gray-200 border-dashed rounded-md p-8 text-center">
          <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
            <AlertCircle size={24} className="text-gray-400" />
          </div>
          <h3 className="text-lg font-medium mb-2">No sites found</h3>
          <p className="text-gray-500 mb-4">
            {searchQuery || contentTypeFilter !== "All"
              ? "No sites match your search criteria. Try adjusting your search terms or filters."
              : "There are no sites in the system yet."}
          </p>
          {(searchQuery || contentTypeFilter !== "All") && (
            <Button variant="outline" onClick={() => window.location.reload()}>
              Clear Filters
            </Button>
          )}
        </div>
      )}
      {/* Site Display - Grid or List View */}
      {!loading && !error && filteredProducts.length > 0 && (
        <>
          {viewMode === "grid" ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-4">
              {filteredProducts.map((product) => (
                <UnifiedSiteCard
                  key={product.id}
                  site={productToSite(product)}
                  onCreateReport={(siteId) => {
                    setSelectedSiteId(siteId)
                    setReportDialogOpen(true)
                  }}
                  onJOCountClick={handleJOCountClick}
                  router={router}
                />
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              {filteredProducts.map((product) => (
                <UnifiedSiteListItem
                  key={product.id}
                  site={productToSite(product)}
                  onCreateReport={(siteId) => {
                    setSelectedSiteId(siteId)
                    setReportDialogOpen(true)
                  }}
                  onJOCountClick={handleJOCountClick}
                />
              ))}
            </div>
          )}
        </>
      )}

      {/* Loading More Indicator */}
      {loadingMore && (
        <div className="flex justify-center my-4">
          <div className="flex items-center gap-2">
            <Loader2 size={18} className="animate-spin" />
            <span>Loading more...</span>
          </div>
        </div>
      )}

      {/* Pagination Controls */}
      {!loading && !error && filteredProducts.length > 0 && (
        <div className="flex flex-col sm:flex-row justify-between items-center mt-6 gap-4">
          <div className="text-sm text-gray-500 flex items-center">
            {loadingCount ? (
              <div className="flex items-center">
                <Loader2 size={14} className="animate-spin mr-2" />
                <span>Calculating pages...</span>
              </div>
            ) : (
              <span>
                Page {currentPage} of {totalPages} ({totalItems} items)
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={goToPreviousPage}
              disabled={currentPage === 1}
              className="h-8 w-8 p-0 bg-transparent"
            >
              <ChevronLeft size={16} />
            </Button>

            {/* Page numbers */}
            <div className="flex items-center gap-1">
              {getPageNumbers().map((page, index) =>
                page === "..." ? (
                  <span key={`ellipsis-${index}`} className="px-2">
                    ...
                  </span>
                ) : (
                  <Button
                    key={`page-${page}`}
                    variant={currentPage === page ? "default" : "outline"}
                    size="sm"
                    onClick={() => goToPage(page as number)}
                    className="h-8 w-8 p-0"
                  >
                    {page}
                  </Button>
                ),
              )}
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={goToNextPage}
              disabled={currentPage >= totalPages}
              className="h-8 w-8 p-0"
            >
              <ChevronRight size={16} />
            </Button>
          </div>
        </div>
      )}

      {/* Report Dialog */}
      <CreateReportDialog open={reportDialogOpen} onOpenChange={setReportDialogOpen} siteId={selectedSiteId} />

      {/* Job Orders Dialog */}
      <JobOrdersListDialog
        open={jobOrdersDialogOpen}
        onOpenChange={setJobOrdersDialogOpen}
        siteId={selectedSiteForJO.id}
        siteName={selectedSiteForJO.name}
        companyId={userData?.company_id || ""}
      />
    </div>
  )
}

// Unified Site Card that matches the exact reference design
function UnifiedSiteCard({
  site,
  onCreateReport,
  onJOCountClick,
  router,
}: {
  site: any
  onCreateReport: (siteId: string) => void
  onJOCountClick: (siteId: string, siteName: string) => void
  router: any
}) {
  const handleCreateReport = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    onCreateReport(site.id)
  }

  const handleJOClick = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (site.joCount > 0) {
      onJOCountClick(site.id, site.name)
    }
  }

  const handleCardClick = () => {
    router.push(`/logistics/sites/${site.id}`)
  }

  return (
    <div className="p-3 bg-gray-200 rounded-xl">
      <Card
        className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer bg-white border border-gray-200 rounded-lg w-full"
        onClick={handleCardClick}
      >
        <div className="relative h-32 bg-gray-200">
          <Image
            src={site.image || "/placeholder.svg"}
            alt={site.name}
            fill
            className="object-cover"
            onError={(e) => {
              const target = e.target as HTMLImageElement
              target.src = site.contentType === "dynamic" ? "/led-billboard-1.png" : "/roadside-billboard.png"
              target.className = "opacity-50 object-contain"
            }}
          />

          {/* Status Badge - Bottom Left */}
          <div className="absolute bottom-2 left-2">
            <div className="px-2 py-1 rounded text-xs font-bold text-white" style={{ backgroundColor: "#38b6ff" }}>
              {site.operationalStatus === "Operational"
                ? "OPEN"
                : site.operationalStatus === "Under Maintenance"
                  ? "MAINTENANCE"
                  : site.operationalStatus === "Pending Setup"
                    ? "PENDING"
                    : "CLOSED"}
            </div>
          </div>
        </div>

        <CardContent className="p-3">
          <div className="flex flex-col gap-2">
            {/* Site Code */}
            <div className="text-xs text-gray-500 uppercase tracking-wide">{site.siteCode}</div>

            {/* Site Name with Badge */}
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-sm text-gray-900 truncate">{site.name}</h3>
              <div className="bg-purple-500 text-white text-xs px-1.5 py-0.5 rounded font-bold flex-shrink-0">
                {site.contentType === "dynamic" ? "M" : "S"}
              </div>
            </div>

            {/* Site Information */}
            <div className="space-y-1 text-xs">
              <div className="flex flex-col">
                <span className="text-black">
                  <span className="font-bold">Operation:</span>
                  <span
                    className={`ml-1 ${
                      site.operationalStatus === "Operational"
                        ? "text-black"
                        : site.operationalStatus === "Under Maintenance"
                          ? "text-black"
                          : site.operationalStatus === "Pending Setup"
                            ? "text-black"
                            : "text-black"
                    }`}
                  >
                    {site.operationalStatus === "Operational"
                      ? "Active"
                      : site.operationalStatus === "Under Maintenance"
                        ? "Maintenance"
                        : site.operationalStatus === "Pending Setup"
                          ? "Pending"
                          : "Inactive"}
                  </span>
                </span>
              </div>

              <div className="flex flex-col">
                <span className="text-black">
                  <span className="font-bold">Display Health:</span>
                  <span className="ml-1" style={{ color: "#00bf63" }}>
                    {site.healthPercentage > 90
                      ? "100%"
                      : site.healthPercentage > 80
                        ? "90%"
                        : site.healthPercentage > 60
                          ? "75%"
                          : "50%"}
                  </span>
                </span>
              </div>
            </div>

            {/* JO Notification */}
            <div className="flex items-center gap-1 text-xs">
              <Bell className="h-3 w-3 text-gray-400" />
              {site.joCount > 0 ? (
                <button
                  onClick={handleJOClick}
                  className="text-blue-600 hover:text-blue-800 hover:underline cursor-pointer font-medium"
                >
                  JO ({site.joCount})
                </button>
              ) : (
                <span className="text-gray-600">None</span>
              )}
              {/* Debug info - remove in production */}
              {process.env.NODE_ENV === "development" && (
                <span className="text-red-500 ml-2">
                  [Debug: ID={site.id?.substring(0, 8)}, Count={site.joCount}]
                </span>
              )}
            </div>

            {/* Create Report Button */}
            <Button
              variant="secondary"
              className="mt-3 w-full h-8 text-xs border-0 text-white hover:text-white rounded-md font-medium"
              style={{ backgroundColor: "#0f76ff" }}
              onClick={handleCreateReport}
            >
              Create Report
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

// List view component for sites
function UnifiedSiteListItem({
  site,
  onCreateReport,
  onJOCountClick,
}: {
  site: any
  onCreateReport: (siteId: string) => void
  onJOCountClick: (siteId: string, siteName: string) => void
}) {
  const handleCreateReport = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    onCreateReport(site.id)
  }

  const handleJOClick = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (site.joCount > 0) {
      onJOCountClick(site.id, site.name)
    }
  }

  const handleCardClick = () => {
    window.location.href = `/logistics/sites/${site.id}`
  }

  return (
    <div className="p-3 bg-gray-200 rounded-xl">
      <Card
        className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer bg-white border border-gray-200 rounded-lg w-full"
        onClick={handleCardClick}
      >
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            {/* Site Image */}
            <div className="relative w-20 h-20 bg-gray-200 rounded-lg flex-shrink-0">
              <Image
                src={site.image || "/placeholder.svg"}
                alt={site.name}
                fill
                className="object-cover rounded-lg"
                onError={(e) => {
                  const target = e.target as HTMLImageElement
                  target.src = site.contentType === "dynamic" ? "/led-billboard-1.png" : "/roadside-billboard.png"
                  target.className = "opacity-50 object-contain rounded-lg"
                }}
              />
              {/* Status Badge */}
              <div className="absolute bottom-1 left-1">
                <div
                  className="px-1.5 py-0.5 rounded text-xs font-bold text-white"
                  style={{ backgroundColor: "#38b6ff" }}
                >
                  {site.operationalStatus === "Operational"
                    ? "OPEN"
                    : site.operationalStatus === "Under Maintenance"
                      ? "MAINT"
                      : site.operationalStatus === "Pending Setup"
                        ? "PEND"
                        : "CLOSED"}
                </div>
              </div>
            </div>

            {/* Site Information */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-2">
                <div className="text-xs text-gray-500 uppercase tracking-wide">{site.siteCode}</div>
                <div className="bg-purple-500 text-white text-xs px-1.5 py-0.5 rounded font-bold">
                  {site.contentType === "dynamic" ? "M" : "S"}
                </div>
              </div>

              <h3 className="font-bold text-lg text-gray-900 mb-2 truncate">{site.name}</h3>

              <div className="grid grid-cols-2 gap-4 text-sm mb-2">
                <div>
                  <span className="font-bold text-gray-700">Operation:</span>
                  <div className="text-gray-600">
                    {site.operationalStatus === "Operational"
                      ? "Active"
                      : site.operationalStatus === "Under Maintenance"
                        ? "Maintenance"
                        : site.operationalStatus === "Pending Setup"
                          ? "Pending"
                          : "Inactive"}
                  </div>
                </div>

                <div>
                  <span className="font-bold text-gray-700">Display Health:</span>
                  <div style={{ color: "#00bf63" }}>
                    {site.healthPercentage > 90
                      ? "100%"
                      : site.healthPercentage > 80
                        ? "90%"
                        : site.healthPercentage > 60
                          ? "75%"
                          : "50%"}
                  </div>
                </div>
              </div>

              {/* JO Notification */}
              <div className="flex items-center gap-1 text-sm">
                <Bell className="h-4 w-4 text-gray-400" />
                {site.joCount > 0 ? (
                  <button
                    onClick={handleJOClick}
                    className="text-blue-600 hover:text-blue-800 hover:underline cursor-pointer font-medium"
                  >
                    JO ({site.joCount})
                  </button>
                ) : (
                  <span className="text-gray-600">None</span>
                )}
                {/* Debug info - remove in production */}
                {process.env.NODE_ENV === "development" && (
                  <span className="text-red-500 ml-2">
                    [Debug: ID={site.id?.substring(0, 8)}, Count={site.joCount}]
                  </span>
                )}
              </div>
            </div>

            {/* Create Report Button */}
            <div className="flex-shrink-0">
              <Button
                variant="secondary"
                className="h-10 px-6 text-sm border-0 text-white hover:text-white rounded-md font-medium"
                style={{ backgroundColor: "#0f76ff" }}
                onClick={handleCreateReport}
              >
                Create Report
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

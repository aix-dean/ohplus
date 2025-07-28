"use client"

import type React from "react"
import { useState, useEffect, useCallback } from "react"
import { useAuth } from "@/contexts/auth-context"
import { useToast } from "@/hooks/use-toast"
import { getPaginatedUserProducts, getUserProductsCount, type Product } from "@/lib/firebase-service"
import type { DocumentData, QueryDocumentSnapshot } from "firebase/firestore"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight, Loader2, AlertCircle } from "lucide-react"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { CreateReportDialog } from "@/components/create-report-dialog"

// Number of items to display per page
const ITEMS_PER_PAGE = 8

interface AllSitesTabProps {
  searchQuery?: string
  filterBy?: string
  viewMode?: "grid" | "list"
}

export default function AllSitesTab({ searchQuery = "", filterBy = "All", viewMode = "grid" }: AllSitesTabProps) {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

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

  const { toast } = useToast()
  const { userData } = useAuth()
  const router = useRouter()

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
  }, [searchQuery, filterBy])

  // Load initial data and count
  useEffect(() => {
    if (userData?.company_id) {
      fetchProducts(1)
      fetchTotalCount()
    }
  }, [userData?.company_id, fetchProducts, fetchTotalCount])

  // Load data when page changes
  useEffect(() => {
    if (currentPage > 0 && userData?.company_id) {
      fetchProducts(currentPage)
    }
  }, [currentPage, fetchProducts, userData?.company_id])

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

  // Filter products based on filterBy prop
  const filteredProducts = products.filter((product) => {
    if (filterBy === "All") return true
    if (filterBy === "Active") return product.status === "ACTIVE" || product.status === "OCCUPIED"
    if (filterBy === "Inactive") return product.status !== "ACTIVE" && product.status !== "OCCUPIED"
    if (filterBy === "Open") return product.status === "ACTIVE" || product.status === "AVAILABLE"
    if (filterBy === "Occupied") return product.status === "OCCUPIED"
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

    // Get notifications count (placeholder logic - replace with real logic)
    const notifications =
      product.status === "MAINTENANCE" ? 3 : product.status === "PENDING" ? 1 : Math.random() > 0.7 ? 1 : 0

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

    return {
      id: product.id,
      name: product.name || `Site ${product.id.substring(0, 8)}`,
      status: product.status || "UNKNOWN",
      statusColor,
      image,
      notifications,
      address,
      contentType: product.content_type || "static",
      healthPercentage,
      siteCode: product.site_code || product.id.substring(0, 8),
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
    <div className="flex flex-col gap-5 p-6">
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
            {searchQuery || filterBy !== "All"
              ? "No sites match your search criteria. Try adjusting your search terms or filters."
              : "There are no sites in the system yet."}
          </p>
          {(searchQuery || filterBy !== "All") && (
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
    </div>
  )
}

// Unified Site Card that matches the reference image design
function UnifiedSiteCard({ site, onCreateReport }: { site: any; onCreateReport: (siteId: string) => void }) {
  const handleCreateReport = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    onCreateReport(site.id)
  }

  const handleCardClick = () => {
    window.location.href = `/logistics/sites/${site.id}`
  }

  // Get status text and color based on operational status
  const getStatusInfo = () => {
    switch (site.operationalStatus) {
      case "Operational":
        return { text: "OCCUPIED", color: "#007bff" }
      case "Under Maintenance":
        return { text: "MAINTENANCE", color: "#dc3545" }
      case "Pending Setup":
        return { text: "PENDING", color: "#ffc107" }
      default:
        return { text: "VACANT", color: "#28a745" }
    }
  }

  const statusInfo = getStatusInfo()

  return (
    <div className="bg-gray-200 rounded-2xl p-3">
      <Card
        className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer bg-white border-0 rounded-xl w-full"
        onClick={handleCardClick}
      >
        <div className="relative h-32 bg-gray-100 rounded-t-xl overflow-hidden">
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
            <div
              className="px-2 py-1 rounded text-xs font-bold text-white"
              style={{ backgroundColor: statusInfo.color }}
            >
              {statusInfo.text}
            </div>
          </div>
        </div>

        <CardContent className="p-3">
          <div className="flex flex-col gap-2">
            {/* Site Code */}
            <div className="text-xs text-gray-500 uppercase tracking-wide font-medium">{site.siteCode}</div>

            {/* Site Name */}
            <h3 className="font-bold text-sm text-black leading-tight">{site.name}</h3>

            {/* Content and Illumination Info */}
            <div className="text-xs text-gray-600 space-y-0.5">
              <div>
                <span className="font-medium">Content:</span> {site.contentType === "dynamic" ? "Digital" : "Static"}
              </div>
              <div>
                <span className="font-medium">Illumin:</span> {site.operationalStatus === "Operational" ? "ON" : "OFF"}
              </div>
            </div>

            {/* Create Report Button */}
            <Button
              className="mt-3 w-full h-9 text-xs font-semibold text-white rounded-lg border-0 hover:opacity-90 transition-opacity"
              style={{ backgroundColor: "#007bff" }}
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
function UnifiedSiteListItem({ site, onCreateReport }: { site: any; onCreateReport: (siteId: string) => void }) {
  const handleCreateReport = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    onCreateReport(site.id)
  }

  const handleCardClick = () => {
    window.location.href = `/logistics/sites/${site.id}`
  }

  // Get status text and color based on operational status
  const getStatusInfo = () => {
    switch (site.operationalStatus) {
      case "Operational":
        return { text: "OCCUPIED", color: "#007bff" }
      case "Under Maintenance":
        return { text: "MAINTENANCE", color: "#dc3545" }
      case "Pending Setup":
        return { text: "PENDING", color: "#ffc107" }
      default:
        return { text: "VACANT", color: "#28a745" }
    }
  }

  const statusInfo = getStatusInfo()

  return (
    <div className="bg-gray-200 rounded-2xl p-3">
      <Card
        className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer bg-white border-0 rounded-xl w-full"
        onClick={handleCardClick}
      >
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            {/* Site Image */}
            <div className="relative w-20 h-20 bg-gray-100 rounded-lg flex-shrink-0 overflow-hidden">
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
              {/* Status Badge */}
              <div className="absolute bottom-1 left-1">
                <div
                  className="px-1.5 py-0.5 rounded text-xs font-bold text-white"
                  style={{ backgroundColor: statusInfo.color }}
                >
                  {statusInfo.text}
                </div>
              </div>
            </div>

            {/* Site Information */}
            <div className="flex-1 min-w-0">
              <div className="text-xs text-gray-500 uppercase tracking-wide font-medium mb-1">{site.siteCode}</div>

              <h3 className="font-bold text-lg text-black mb-2 leading-tight">{site.name}</h3>

              <div className="grid grid-cols-3 gap-4 text-sm">
                <div>
                  <span className="font-medium text-gray-700">Content:</span>
                  <div className="text-gray-600">{site.contentType === "dynamic" ? "Digital" : "Static"}</div>
                </div>

                <div>
                  <span className="font-medium text-gray-700">Illumin:</span>
                  <div className="text-gray-600">{site.operationalStatus === "Operational" ? "ON" : "OFF"}</div>
                </div>

                <div>
                  <span className="font-medium text-gray-700">Status:</span>
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
              </div>
            </div>

            {/* Create Report Button */}
            <div className="flex-shrink-0">
              <Button
                className="h-10 px-6 text-sm font-semibold text-white rounded-lg border-0 hover:opacity-90 transition-opacity"
                style={{ backgroundColor: "#007bff" }}
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

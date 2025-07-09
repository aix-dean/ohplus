"use client"

import type React from "react"

import { useState, useEffect, useCallback } from "react"
import { LayoutGrid, List, AlertCircle, Search, Loader2, ChevronLeft, ChevronRight } from "lucide-react"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { type Product, getPaginatedUserProducts } from "@/lib/firebase-service"
import type { DocumentData, QueryDocumentSnapshot } from "firebase/firestore"
import { useToast } from "@/hooks/use-toast"
import { CreateReportDialog } from "@/components/create-report-dialog"
import { useAuth } from "@/hooks/use-auth"

// Number of items to display per page
const ITEMS_PER_PAGE = 8

export default function AllSitesTab() {
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("")

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
  const { user } = useAuth()

  const currentDate = new Date().toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  })

  const currentTime = new Date().toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  })

  // Debounce search term
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm)
    }, 500)

    return () => clearTimeout(timer)
  }, [searchTerm])

  // Reset pagination when search term changes
  useEffect(() => {
    setCurrentPage(1)
    setPageCache(new Map())
    fetchTotalCount()
    fetchProducts(1, true)
  }, [debouncedSearchTerm])

  // Fetch total count of products
  const fetchTotalCount = useCallback(async () => {
    if (!user?.uid || !user?.company_id) return

    setLoadingCount(true)
    try {
      // Get all user products and filter by company_id
      const allProducts = await getPaginatedUserProducts(user.uid, 1000, null, {
        searchTerm: debouncedSearchTerm,
      })

      const companyProducts = allProducts.items.filter((product) => product.company_id === user.company_id)
      const count = companyProducts.length

      setTotalItems(count)
      setTotalPages(Math.max(1, Math.ceil(count / ITEMS_PER_PAGE)))
    } catch (error) {
      console.error("Error fetching total count:", error)
    } finally {
      setLoadingCount(false)
    }
  }, [user?.uid, user?.company_id, debouncedSearchTerm])

  // Fetch products for the current page
  const fetchProducts = useCallback(
    async (page: number, forceRefresh = false) => {
      if (!user?.uid || !user?.company_id) return

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

        // Get products filtered by company_id only
        const result = await getPaginatedUserProducts(user.uid, ITEMS_PER_PAGE * 2, startDoc, {
          searchTerm: debouncedSearchTerm,
        })

        // Filter products to only show those with matching company_id
        const filteredItems = result.items.filter((product) => product.company_id === user.company_id)

        // Take only the first ITEMS_PER_PAGE items
        const paginatedItems = filteredItems.slice(0, ITEMS_PER_PAGE)

        setProducts(paginatedItems)
        setLastDoc(result.lastDoc)
        setHasMore(filteredItems.length > ITEMS_PER_PAGE)

        // Cache this page
        setPageCache((prev) => {
          const newCache = new Map(prev)
          newCache.set(page, {
            items: paginatedItems,
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
    [user?.uid, user?.company_id, lastDoc, pageCache, debouncedSearchTerm],
  )

  // Load initial data and count
  useEffect(() => {
    fetchProducts(1)
    fetchTotalCount()
  }, [])

  // Load data when page changes
  useEffect(() => {
    if (currentPage > 0) {
      fetchProducts(currentPage)
    }
  }, [currentPage, fetchProducts])

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

  return (
    <div className="flex flex-col gap-5">
      {/* Date, Search and View Toggle */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="text-sm text-gray-600 font-medium">
          {currentDate}, {currentTime}
        </div>

        <div className="flex flex-1 max-w-md mx-auto md:mx-0">
          <div className="relative w-full">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
            <Input
              type="search"
              placeholder="Search sites..."
              className="pl-8 w-full"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div className="flex gap-2">
          <div className="border rounded-md p-1 flex">
            <Button
              variant={viewMode === "grid" ? "default" : "ghost"}
              size="icon"
              className="h-8 w-8"
              onClick={() => setViewMode("grid")}
            >
              <LayoutGrid size={18} />
            </Button>
            <Button
              variant={viewMode === "list" ? "default" : "ghost"}
              size="icon"
              className="h-8 w-8"
              onClick={() => setViewMode("list")}
            >
              <List size={18} />
            </Button>
          </div>
        </div>
      </div>

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
      {!loading && !error && products.length === 0 && (
        <div className="bg-gray-50 border border-gray-200 border-dashed rounded-md p-8 text-center">
          <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
            <AlertCircle size={24} className="text-gray-400" />
          </div>
          <h3 className="text-lg font-medium mb-2">No sites found</h3>
          <p className="text-gray-500 mb-4">
            {debouncedSearchTerm
              ? "No sites match your search criteria. Try adjusting your search terms."
              : "There are no sites in the system yet."}
          </p>
          {debouncedSearchTerm && (
            <Button variant="outline" onClick={() => setSearchTerm("")}>
              Clear Search
            </Button>
          )}
        </div>
      )}

      {/* Site Grid */}
      {!loading && !error && products.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mt-4">
          {products.map((product) => (
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
      {!loading && !error && products.length > 0 && (
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

// Unified Site Card that shows all UI elements with Create Report button
function UnifiedSiteCard({ site, onCreateReport }: { site: any; onCreateReport: (siteId: string) => void }) {
  const handleCreateReport = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    onCreateReport(site.id)
  }

  const handleCardClick = () => {
    window.location.href = `/logistics/sites/${site.id}`
  }

  // Generate mock data for demonstration - replace with real data from your backend
  const getDisplayHealth = () => {
    if (site.healthPercentage > 90) return "100%"
    if (site.healthPercentage > 80) return "90%"
    if (site.healthPercentage > 60) return "75%"
    return "50%"
  }

  const getIlluminationStatus = () => {
    return site.operationalStatus === "Operational" ? "ON" : "OFF"
  }

  const getComplianceStatus = () => {
    return site.operationalStatus === "Operational" ? "Complete" : "Incomplete"
  }

  const getContentInfo = () => {
    // Mock content based on site type
    if (site.contentType === "dynamic") {
      const contents = ["Leon", "Lilo and Stitch", "Marvel Heroes", "Nike Campaign"]
      return contents[Math.floor(Math.random() * contents.length)]
    }
    return "Static Billboard"
  }

  return (
    <Card
      className="erp-card overflow-hidden hover:shadow-md transition-shadow cursor-pointer"
      onClick={handleCardClick}
    >
      <div className="relative h-48 bg-gray-200">
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
        {site.notifications > 0 && (
          <div className="absolute top-2 right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold">
            {site.notifications}
          </div>
        )}

        {/* Status Badge */}
        <div className="absolute top-2 left-2">
          <Badge
            variant="outline"
            className={`
              ${site.operationalStatus === "Operational" ? "bg-blue-50 text-blue-700 border-blue-200" : ""}
              ${site.operationalStatus === "Under Maintenance" ? "bg-red-50 text-red-700 border-red-200" : ""}
              ${site.operationalStatus === "Pending Setup" ? "bg-orange-50 text-orange-700 border-orange-200" : ""}
              ${site.operationalStatus === "Inactive" ? "bg-gray-50 text-gray-700 border-gray-200" : ""}
            `}
          >
            {site.operationalStatus === "Operational"
              ? "OPEN"
              : site.operationalStatus === "Under Maintenance"
                ? "OCCUPIED"
                : site.operationalStatus === "Pending Setup"
                  ? "OCCUPIED"
                  : "CLOSED"}
          </Badge>
        </div>
      </div>

      <CardContent className="p-4">
        <div className="flex flex-col gap-2">
          {/* Site Name */}
          <h3 className="font-semibold text-lg text-gray-900">{site.name}</h3>

          {/* Site ID */}
          <div className="text-sm text-gray-600 mb-2">
            <span className="font-medium">ID:</span> {site.siteCode}
          </div>

          {/* Site Information Section */}
          <div className="space-y-2 py-2">
            {/* Operation Status */}
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-gray-700">Operation:</span>
              <span
                className={`text-sm font-semibold ${
                  site.operationalStatus === "Operational"
                    ? "text-green-600"
                    : site.operationalStatus === "Under Maintenance"
                      ? "text-red-600"
                      : site.operationalStatus === "Pending Setup"
                        ? "text-orange-600"
                        : "text-gray-600"
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
            </div>

            {/* Display Health */}
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-gray-700">Display Health:</span>
              <span
                className={`text-sm font-semibold ${
                  site.healthPercentage > 80
                    ? "text-green-600"
                    : site.healthPercentage > 60
                      ? "text-yellow-600"
                      : "text-red-600"
                }`}
              >
                {site.healthPercentage > 90
                  ? "100%"
                  : site.healthPercentage > 80
                    ? "90%"
                    : site.healthPercentage > 60
                      ? "75%"
                      : "50%"}
              </span>
            </div>

            {/* Content */}
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-gray-700">Content:</span>
              <span className="text-sm font-semibold text-blue-600">
                {site.contentType === "dynamic"
                  ? ["Leon", "Lilo and Stitch", "Marvel Heroes", "Nike Campaign"][Math.floor(Math.random() * 4)]
                  : "Static Billboard"}
              </span>
            </div>

            {/* Illumination */}
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-gray-700">Illumination:</span>
              <span
                className={`text-sm font-semibold ${
                  site.operationalStatus === "Operational" ? "text-green-600" : "text-red-600"
                }`}
              >
                {site.operationalStatus === "Operational" ? "ON" : "OFF"}
              </span>
            </div>

            {/* Compliance */}
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-gray-700">Compliance:</span>
              <span
                className={`text-sm font-semibold ${
                  site.operationalStatus === "Operational" ? "text-green-600" : "text-red-600"
                }`}
              >
                {site.operationalStatus === "Operational" ? "Complete" : "Incomplete"}
                {site.operationalStatus !== "Operational" && (
                  <span className="ml-1 text-xs bg-red-100 text-red-800 px-1 rounded">(2)</span>
                )}
              </span>
            </div>
          </div>

          {/* Current Status */}
          <div className="text-sm mt-3 pt-3 border-t border-gray-200">
            <span className="text-gray-600 font-medium">Current:</span>{" "}
            <span
              className={`font-semibold ${
                site.status === "ACTIVE" || site.status === "OCCUPIED"
                  ? "text-blue-600"
                  : site.status === "VACANT" || site.status === "AVAILABLE"
                    ? "text-green-600"
                    : site.status === "MAINTENANCE" || site.status === "REPAIR"
                      ? "text-red-600"
                      : "text-orange-600"
              }`}
            >
              {site.status}
            </span>
          </div>

          {/* Create Report Button */}
          <Button
            variant="outline"
            className="mt-4 w-full bg-gray-50 hover:bg-gray-100 border-gray-300 text-gray-700 hover:text-gray-900"
            onClick={handleCreateReport}
          >
            Create Report
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

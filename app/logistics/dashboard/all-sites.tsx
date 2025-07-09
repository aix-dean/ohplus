"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { MapPin, Calendar, Users, FileText } from "lucide-react"
import { CreateReportDialog } from "@/components/create-report-dialog"
import { getProductsByContentType, getProductsCountByContentType, type Product } from "@/lib/firebase-service"
import type { DocumentData, QueryDocumentSnapshot } from "firebase/firestore"
import { useToast } from "@/hooks/use-toast"

// Number of items to display per page
const ITEMS_PER_PAGE = 8

const sites = [
  {
    id: "1",
    name: "EDSA Northbound",
    location: "Quezon City",
    type: "LED Billboard",
    status: "Active",
    lastUpdate: "2 hours ago",
    occupancy: "85%",
    revenue: "₱125,000",
  },
  {
    id: "2",
    name: "Ayala Avenue",
    location: "Makati City",
    type: "Static Billboard",
    status: "Active",
    lastUpdate: "1 hour ago",
    occupancy: "92%",
    revenue: "₱180,000",
  },
  {
    id: "3",
    name: "BGC Central",
    location: "Taguig City",
    type: "LED Display",
    status: "Maintenance",
    lastUpdate: "4 hours ago",
    occupancy: "0%",
    revenue: "₱0",
  },
  {
    id: "4",
    name: "Ortigas Center",
    location: "Pasig City",
    type: "Digital Screen",
    status: "Active",
    lastUpdate: "30 minutes ago",
    occupancy: "78%",
    revenue: "₱95,000",
  },
]

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
  const fetchTotalCount = async () => {
    setLoadingCount(true)
    try {
      // For all sites, we'll get both static and dynamic content types and combine them
      const staticCount = await getProductsCountByContentType("static", debouncedSearchTerm)
      const dynamicCount = await getProductsCountByContentType("dynamic", debouncedSearchTerm)
      const totalCount = staticCount + dynamicCount

      setTotalItems(totalCount)
      setTotalPages(Math.max(1, Math.ceil(totalCount / ITEMS_PER_PAGE)))
    } catch (error) {
      console.error("Error fetching total count:", error)
    } finally {
      setLoadingCount(false)
    }
  }

  // Fetch products for the current page
  const fetchProducts = async (page: number, forceRefresh = false) => {
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

      // Get both static and dynamic products
      const staticResult = await getProductsByContentType("static", ITEMS_PER_PAGE / 2, startDoc, debouncedSearchTerm)
      const dynamicResult = await getProductsByContentType("dynamic", ITEMS_PER_PAGE / 2, startDoc, debouncedSearchTerm)

      // Combine the results
      const combinedItems = [...staticResult.items, ...dynamicResult.items]

      // Sort by name for consistency
      combinedItems.sort((a, b) => (a.name || "").localeCompare(b.name || ""))

      // Take only the first ITEMS_PER_PAGE items
      const paginatedItems = combinedItems.slice(0, ITEMS_PER_PAGE)

      setProducts(paginatedItems)

      // Use the last doc from either result based on which has more items
      const lastVisible =
        staticResult.items.length > dynamicResult.items.length ? staticResult.lastDoc : dynamicResult.lastDoc

      setLastDoc(lastVisible)
      setHasMore(staticResult.hasMore || dynamicResult.hasMore)

      // Cache this page
      setPageCache((prev) => {
        const newCache = new Map(prev)
        newCache.set(page, {
          items: paginatedItems,
          lastDoc: lastVisible,
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
  }

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
  }, [currentPage])

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

    return {
      id: product.id,
      name: product.name,
      status: product.status,
      statusColor,
      image,
      notifications,
      location: product.specs_rental?.location || product.light?.location || "Unknown location",
      contentType: product.content_type || "static",
      healthPercentage,
    }
  }

  const handleCreateReport = (siteId: string, event: React.MouseEvent) => {
    event.stopPropagation()
    setSelectedSiteId(siteId)
    setReportDialogOpen(true)
    console.log("Creating report for site:", siteId)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">All Sites</h2>
        <Badge variant="secondary">{sites.length} Total Sites</Badge>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {sites.map((site) => (
          <Card key={site.id} className="hover:shadow-lg transition-shadow cursor-pointer">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">{site.name}</CardTitle>
                <Badge
                  variant={site.status === "Active" ? "default" : "destructive"}
                  className={site.status === "Active" ? "bg-green-500" : ""}
                >
                  {site.status}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center text-sm text-gray-600">
                  <MapPin className="h-4 w-4 mr-2" />
                  {site.location}
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <Calendar className="h-4 w-4 mr-2" />
                  Updated {site.lastUpdate}
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <Users className="h-4 w-4 mr-2" />
                  {site.occupancy} Occupancy
                </div>
              </div>

              <div className="pt-2 border-t">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Revenue</span>
                  <span className="text-lg font-bold text-green-600">{site.revenue}</span>
                </div>
              </div>

              <div className="pt-2">
                <Button
                  onClick={(e) => handleCreateReport(site.id, e)}
                  variant="outline"
                  size="sm"
                  className="w-full flex items-center gap-2 hover:bg-blue-50 hover:border-blue-300"
                >
                  <FileText className="h-4 w-4" />
                  Create Report
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <CreateReportDialog open={reportDialogOpen} onOpenChange={setReportDialogOpen} siteId={selectedSiteId} />
    </div>
  )
}

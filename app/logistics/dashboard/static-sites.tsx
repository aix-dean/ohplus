"use client"

import { useCallback } from "react"
import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { LayoutGrid, List, AlertCircle, Search, Loader2, ChevronLeft, ChevronRight } from "lucide-react"
import Image from "next/image"
import { collection, query, where, getDocs, orderBy } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { useAuth } from "@/contexts/auth-context"
import { CreateReportDialog } from "@/components/create-report-dialog"

interface Site {
  id: string
  name: string
  location: string
  type: "static" | "led"
  status: "active" | "maintenance" | "offline"
  operationalStatus: string
  displayHealth: string
  compliance: string
  lastUpdate: string
  image?: string
  companyId: string
}

export default function StaticSitesTab() {
  const { user } = useAuth()
  const [sites, setSites] = useState<Site[]>([])
  const [loading, setLoading] = useState(true)
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")
  const [searchTerm, setSearchTerm] = useState("")
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("")

  // Number of items to display per page
  const ITEMS_PER_PAGE = 8

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1)
  const [totalItems, setTotalItems] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const [hasMore, setHasMore] = useState(false)
  const [lastDoc, setLastDoc] = useState<any | null>(null)
  const [pageCache, setPageCache] = useState<Map<number, { items: Site[]; lastDoc: any | null }>>(new Map())
  const [loadingMore, setLoadingMore] = useState(false)
  const [loadingCount, setLoadingCount] = useState(false)

  // Report dialog state
  const [reportDialogOpen, setReportDialogOpen] = useState(false)
  const [selectedSiteId, setSelectedSiteId] = useState<string>("")

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
    fetchSites(1, true)
  }, [debouncedSearchTerm])

  // Fetch total count of sites
  const fetchTotalCount = useCallback(async () => {
    if (!user?.companyId) return

    setLoadingCount(true)
    try {
      const sitesQuery = query(
        collection(db, "sites"),
        where("companyId", "==", user.companyId),
        where("type", "==", "static"),
        orderBy("name"),
      )

      const sitesSnapshot = await getDocs(sitesQuery)
      const sitesData = sitesSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Site[]

      setTotalItems(sitesData.length)
      setTotalPages(Math.max(1, Math.ceil(sitesData.length / ITEMS_PER_PAGE)))
    } catch (error) {
      console.error("Error fetching total count:", error)
    } finally {
      setLoadingCount(false)
    }
  }, [user?.companyId])

  // Fetch sites for the current page
  const fetchSites = useCallback(
    async (page: number, forceRefresh = false) => {
      if (!user?.companyId) return

      // Check if we have this page in cache and not forcing refresh
      if (!forceRefresh && pageCache.has(page)) {
        const cachedData = pageCache.get(page)!
        setSites(cachedData.items)
        setLastDoc(cachedData.lastDoc)
        return
      }

      const isFirstPage = page === 1
      setLoading(isFirstPage)
      setLoadingMore(!isFirstPage)

      try {
        const sitesQuery = query(
          collection(db, "sites"),
          where("companyId", "==", user.companyId),
          where("type", "==", "static"),
          orderBy("name"),
          page === 1 ? undefined : where("__name__", ">", lastDoc),
          page === 1 ? undefined : orderBy("__name__"),
          page === 1 ? undefined : { limit: ITEMS_PER_PAGE },
        )

        const sitesSnapshot = await getDocs(sitesQuery)
        const sitesData = sitesSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as Site[]

        setSites(sitesData)
        setLastDoc(sitesSnapshot.docs[sitesSnapshot.docs.length - 1])
        setHasMore(sitesSnapshot.docs.length === ITEMS_PER_PAGE)

        // Cache this page with filtered items
        setPageCache((prev) => {
          const newCache = new Map(prev)
          newCache.set(page, {
            items: sitesData,
            lastDoc: sitesSnapshot.docs[sitesSnapshot.docs.length - 1],
          })
          return newCache
        })
      } catch (error) {
        console.error("Error fetching sites:", error)
      } finally {
        setLoading(false)
        setLoadingMore(false)
      }
    },
    [user?.companyId, lastDoc, pageCache],
  )

  // Load initial data and count
  useEffect(() => {
    if (user?.companyId) {
      fetchSites(1)
      fetchTotalCount()
    }
  }, [user?.companyId, fetchSites, fetchTotalCount])

  // Load data when page changes
  useEffect(() => {
    if (currentPage > 0 && user?.companyId) {
      fetchSites(currentPage)
    }
  }, [currentPage, fetchSites, user?.companyId])

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

  // Get status badge based on site status
  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case "active":
        return <Badge className="bg-green-500 text-white text-xs px-2 py-1">OPEN</Badge>
      case "maintenance":
        return <Badge className="bg-red-500 text-white text-xs px-2 py-1">MAINTENANCE</Badge>
      case "offline":
        return <Badge className="bg-gray-500 text-white text-xs px-2 py-1">OFFLINE</Badge>
      default:
        return <Badge className="bg-gray-500 text-white text-xs px-2 py-1">{status.toUpperCase()}</Badge>
    }
  }

  // Show loading if no user
  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
        <p className="text-gray-500">Loading user data...</p>
      </div>
    )
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
            <input
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-4">
          {[...Array(8)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <div className="h-32 bg-gray-200 rounded-t-lg"></div>
              <CardContent className="p-3">
                <div className="h-4 bg-gray-200 rounded mb-2"></div>
                <div className="h-3 bg-gray-200 rounded mb-1"></div>
                <div className="h-3 bg-gray-200 rounded"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Error State */}
      {(!sites || sites.length === 0) && !loading && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4 text-center">
          <AlertCircle className="h-6 w-6 text-red-500 mx-auto mb-2" />
          <p className="text-red-700">No static sites found for your company.</p>
          <Button variant="outline" className="mt-4 bg-transparent" onClick={() => fetchSites(1, true)}>
            Try Again
          </Button>
        </div>
      )}

      {/* Site Grid */}
      {!loading && sites.length > 0 && (
        <div
          className={`grid grid-cols-1 ${viewMode === "grid" ? "md:grid-cols-2 lg:grid-cols-4" : "md:grid-cols-1 lg:grid-cols-2"} gap-5 mt-4`}
        >
          {sites.map((site) => (
            <Card key={site.id} className="overflow-hidden hover:shadow-md transition-shadow relative">
              {/* Status Badge */}
              <div className="absolute top-2 left-2 z-10">{getStatusBadge(site.status)}</div>

              {/* Site Image */}
              <div className="relative h-32 bg-gray-100">
                <Image
                  src={site.image || "/placeholder.svg?height=128&width=256&query=static billboard"}
                  alt={site.name}
                  fill
                  className="object-cover"
                />
              </div>

              <CardContent className="p-3">
                {/* Site Code */}
                <div className="text-xs text-gray-500 uppercase tracking-wide mb-1">{site.id}</div>

                {/* Site Name with Type Badge */}
                <div className="flex items-center gap-2 mb-2">
                  <h3 className="font-semibold text-base text-gray-900 truncate flex-1">{site.name}</h3>
                  <Badge className="bg-purple-500 text-white text-xs px-1.5 py-0.5 min-w-[20px] h-5 flex items-center justify-center">
                    S
                  </Badge>
                </div>

                {/* Site Details */}
                <div className="space-y-1 text-xs text-gray-600 mb-3">
                  <div className="flex items-center justify-between">
                    <span>Operation:</span>
                    <span className="font-medium">{site.operationalStatus || "Active"}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Display Health:</span>
                    <span className="font-medium text-green-600">{site.displayHealth || "100%"}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Compliance:</span>
                    <span className="font-medium">{site.compliance || "Complete"}</span>
                  </div>
                </div>

                {/* Create Report Button */}
                <Button
                  variant="secondary"
                  size="sm"
                  className="w-full h-9 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium border-0"
                  onClick={() => {
                    setSelectedSiteId(site.id)
                    setReportDialogOpen(true)
                  }}
                >
                  Create Report
                </Button>
              </CardContent>
            </Card>
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
      {!loading && sites.length > 0 && (
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

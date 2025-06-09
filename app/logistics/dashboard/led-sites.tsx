"use client"

import { useState, useEffect, useCallback } from "react"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import LEDSitesContentTab from "./led-sites-content"
import LEDSitesDisplayHealthTab from "./led-sites-display-health"
import LEDSitesStructureTab from "./led-sites-structure"
import LEDSitesComplianceTab from "./led-sites-compliance"
import { getPaginatedUserProducts, type Product } from "@/lib/firebase-service"
import type { DocumentData, QueryDocumentSnapshot } from "firebase/firestore"
import { Loader2 } from "lucide-react"
import { AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/contexts/auth-context"
import { Search, ChevronLeft, ChevronRight } from "lucide-react"
import { Input } from "@/components/ui/input"

// Number of items to display per page
const ITEMS_PER_PAGE = 8

export default function LEDSitesTab() {
  const [contentTab, setContentTab] = useState<"content" | "display-health" | "structure" | "compliance">("content")
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
    if (!user?.uid) return

    setLoadingCount(true)
    try {
      // Get all user products and filter by content_type
      const allProducts = await getPaginatedUserProducts(user.uid, 1000, null, {
        active: true,
        searchTerm: debouncedSearchTerm,
      })

      const dynamicProducts = allProducts.items.filter((product) => product.content_type?.toLowerCase() === "dynamic")
      const count = dynamicProducts.length

      setTotalItems(count)
      setTotalPages(Math.max(1, Math.ceil(count / ITEMS_PER_PAGE)))
    } catch (error) {
      console.error("Error fetching total count:", error)
    } finally {
      setLoadingCount(false)
    }
  }, [user?.uid, debouncedSearchTerm])

  // Fetch products for the current page
  const fetchProducts = useCallback(
    async (page: number, forceRefresh = false) => {
      if (!user?.uid) return

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

        const result = await getPaginatedUserProducts(user.uid, ITEMS_PER_PAGE, startDoc, {
          active: true,
          searchTerm: debouncedSearchTerm,
        })

        // Filter products to only show dynamic content type
        const filteredItems = result.items.filter((product) => product.content_type?.toLowerCase() === "dynamic")

        setProducts(filteredItems)
        setLastDoc(result.lastDoc)
        setHasMore(result.hasMore)

        // Cache this page with filtered items
        setPageCache((prev) => {
          const newCache = new Map(prev)
          newCache.set(page, {
            items: filteredItems,
            lastDoc: result.lastDoc,
          })
          return newCache
        })
      } catch (error) {
        console.error("Error fetching products:", error)
        setError("Failed to load LED sites. Please try again.")
      } finally {
        setLoading(false)
        setLoadingMore(false)
      }
    },
    [user?.uid, lastDoc, pageCache, debouncedSearchTerm],
  )

  // Load initial data and count
  useEffect(() => {
    if (user?.uid) {
      fetchProducts(1)
      fetchTotalCount()
    }
  }, [user?.uid, fetchProducts, fetchTotalCount])

  // Load data when page changes
  useEffect(() => {
    if (currentPage > 0 && user?.uid) {
      fetchProducts(currentPage)
    }
  }, [currentPage, fetchProducts, user?.uid])

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
    <div className="flex flex-col gap-4">
      {/* Content Type Tabs */}
      <Tabs defaultValue="content" className="w-full" onValueChange={(value) => setContentTab(value as any)}>
        <TabsList className="grid w-full max-w-[450px] grid-cols-2 md:grid-cols-4">
          <TabsTrigger value="content">Content</TabsTrigger>
          <TabsTrigger value="display-health">Display Health</TabsTrigger>
          <TabsTrigger value="structure">Structure</TabsTrigger>
          <TabsTrigger value="compliance">Compliance</TabsTrigger>
        </TabsList>

        {/* Date and Search */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="text-sm text-gray-600 font-medium">
            {currentDate}, {currentTime}
          </div>

          <div className="flex flex-1 max-w-md mx-auto md:mx-0">
            <div className="relative w-full">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
              <Input
                type="search"
                placeholder="Search LED sites..."
                className="pl-8 w-full"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center items-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <span className="ml-2 text-lg">Loading LED sites...</span>
          </div>
        ) : error ? (
          <div className="text-center py-12 bg-red-50 rounded-lg border border-dashed border-red-200">
            <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
              <AlertCircle size={24} className="text-red-500" />
            </div>
            <h3 className="text-lg font-medium mb-2 text-red-700">Error Loading LED Sites</h3>
            <p className="text-red-600 mb-4">{error}</p>
            <Button variant="outline" onClick={() => fetchProducts(1, true)} className="bg-white">
              Try Again
            </Button>
          </div>
        ) : products.length === 0 ? (
          <div className="bg-gray-50 border border-gray-200 border-dashed rounded-md p-8 text-center">
            <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
              <AlertCircle size={24} className="text-gray-400" />
            </div>
            <h3 className="text-lg font-medium mb-2">No LED sites found</h3>
            <p className="text-gray-500 mb-4">
              {debouncedSearchTerm
                ? "No LED sites match your search criteria. Try adjusting your search terms."
                : "You don't have any LED sites yet. Contact an administrator to add LED sites."}
            </p>
            {debouncedSearchTerm && (
              <Button variant="outline" onClick={() => setSearchTerm("")}>
                Clear Search
              </Button>
            )}
          </div>
        ) : (
          <>
            <TabsContent value="content" className="mt-4">
              <LEDSitesContentTab products={products} />
            </TabsContent>

            <TabsContent value="display-health" className="mt-4">
              <LEDSitesDisplayHealthTab products={products} />
            </TabsContent>

            <TabsContent value="structure" className="mt-4">
              <LEDSitesStructureTab products={products} />
            </TabsContent>

            <TabsContent value="compliance" className="mt-4">
              <LEDSitesComplianceTab products={products} />
            </TabsContent>

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
            {products.length > 0 && (
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
                    className="h-8 w-8 p-0"
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
          </>
        )}
      </Tabs>
    </div>
  )
}

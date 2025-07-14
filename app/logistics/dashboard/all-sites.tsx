"use client"

import { useState, useEffect, useCallback } from "react"
import { useAuth } from "@/contexts/auth-context"
import { useToast } from "@/hooks/use-toast"
import { getPaginatedUserProducts, getUserProductsCount, type Product } from "@/lib/firebase-service"
import type { DocumentData, QueryDocumentSnapshot } from "firebase/firestore"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { MapPin, ChevronLeft, ChevronRight, Loader2 } from "lucide-react"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { ResponsiveCardGrid } from "@/components/responsive-card-grid"

// Number of items to display per page
const ITEMS_PER_PAGE = 12

export default function AllSitesTab() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalItems, setTotalItems] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const [lastDoc, setLastDoc] = useState<QueryDocumentSnapshot<DocumentData> | null>(null)
  const [pageCache, setPageCache] = useState<
    Map<number, { items: Product[]; lastDoc: QueryDocumentSnapshot<DocumentData> | null }>
  >(new Map())
  const [loadingMore, setLoadingMore] = useState(false)
  const [loadingCount, setLoadingCount] = useState(false)

  const { userData } = useAuth()
  const { toast } = useToast()
  const router = useRouter()

  // Fetch total count of products
  const fetchTotalCount = useCallback(async () => {
    if (!userData?.company_id) return

    setLoadingCount(true)
    try {
      const count = await getUserProductsCount(userData?.company_id, { active: true })
      setTotalItems(count)
      setTotalPages(Math.max(1, Math.ceil(count / ITEMS_PER_PAGE)))
    } catch (error) {
      console.error("Error fetching total count:", error)
      toast({
        title: "Error",
        description: "Failed to load product count. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoadingCount(false)
    }
  }, [userData, toast])

  // Fetch products for the current page
  const fetchProducts = useCallback(
    async (page: number) => {
      if (!userData?.company_id) return

      // Check if we have this page in cache
      if (pageCache.has(page)) {
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

        const result = await getPaginatedUserProducts(userData?.company_id, ITEMS_PER_PAGE, startDoc, { active: true })

        setProducts(result.items)
        setLastDoc(result.lastDoc)

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
        toast({
          title: "Error",
          description: "Failed to load products. Please try again.",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
        setLoadingMore(false)
      }
    },
    [userData, lastDoc, pageCache, toast],
  )

  // Load initial data and count
  useEffect(() => {
    if (userData?.company_id) {
      fetchProducts(1)
      fetchTotalCount()
    }
  }, [userData?.company_id, fetchProducts, fetchTotalCount])

  // Load data when page changes
  useEffect(() => {
    if (userData?.company_id && currentPage > 0) {
      fetchProducts(currentPage)
    }
  }, [currentPage, fetchProducts, userData?.company_id])

  // Pagination handlers
  const goToPage = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page)
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
      for (let i = 1; i <= totalPages; i++) {
        pageNumbers.push(i)
      }
    } else {
      pageNumbers.push(1)

      let startPage = Math.max(2, currentPage - 1)
      let endPage = Math.min(totalPages - 1, currentPage + 1)

      if (currentPage <= 3) {
        endPage = Math.min(totalPages - 1, 4)
      }

      if (currentPage >= totalPages - 2) {
        startPage = Math.max(2, totalPages - 3)
      }

      if (startPage > 2) {
        pageNumbers.push("...")
      }

      for (let i = startPage; i <= endPage; i++) {
        pageNumbers.push(i)
      }

      if (endPage < totalPages - 1) {
        pageNumbers.push("...")
      }

      pageNumbers.push(totalPages)
    }

    return pageNumbers
  }

  // Handle site click
  const handleSiteClick = (productId: string) => {
    router.push(`/logistics/sites/${productId}`)
  }

  // Get site code from product
  const getSiteCode = (product: Product | null) => {
    if (!product) return null
    if (product.site_code) return product.site_code
    if (product.specs_rental && "site_code" in product.specs_rental) return product.specs_rental.site_code
    if (product.light && "site_code" in product.light) return product.light.siteCode
    if ("siteCode" in product) return (product as any).siteCode
    return null
  }

  if (loading) {
    return (
      <div className="flex flex-col gap-5">
        <div className="flex justify-between items-center">
          <div>
            <Skeleton className="h-8 w-64 mb-2" />
            <Skeleton className="h-4 w-48" />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mt-4">
          {Array(8)
            .fill(0)
            .map((_, i) => (
              <div key={i} className="border rounded-lg overflow-hidden">
                <Skeleton className="h-48 w-full" />
                <div className="p-4">
                  <Skeleton className="h-4 w-1/3 mb-2" />
                  <Skeleton className="h-4 w-2/3 mb-4" />
                  <Skeleton className="h-4 w-1/2 mb-2" />
                  <Skeleton className="h-4 w-1/4" />
                </div>
              </div>
            ))}
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">All Sites</h2>
          <p className="text-gray-600">Manage and monitor all your sites</p>
        </div>
      </div>

      {/* Empty state */}
      {!loading && products.length === 0 && (
        <div className="text-center py-8 md:py-12 bg-gray-50 rounded-lg border border-dashed">
          <div className="mx-auto w-12 h-12 md:w-16 md:h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
            <MapPin size={24} className="text-gray-400" />
          </div>
          <h3 className="text-base md:text-lg font-medium mb-2">No sites yet</h3>
          <p className="text-sm text-gray-500 mb-4">Contact an administrator to add sites</p>
        </div>
      )}

      {/* Sites Grid */}
      {!loading && products.length > 0 && (
        <ResponsiveCardGrid mobileColumns={1} tabletColumns={2} desktopColumns={4} gap="md">
          {products.map((product) => (
            <SiteCard
              key={product.id}
              product={product}
              onClick={() => handleSiteClick(product.id)}
              getSiteCode={getSiteCode}
            />
          ))}
        </ResponsiveCardGrid>
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
      {!loading && products.length > 0 && (
        <div className="flex flex-col sm:flex-row justify-between items-center mt-6 gap-4">
          <div className="text-sm text-gray-500 flex items-center">
            {loadingCount ? (
              <div className="flex items-center">
                <Loader2 size={14} className="animate-spin mr-2" />
                <span>Calculating pages...</span>
              </div>
            ) : (
              <span>
                Page {currentPage} of {totalPages} ({products.length} items)
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

            <div className="hidden sm:flex items-center gap-1">
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
    </div>
  )
}

// Site Card Component
function SiteCard({
  product,
  onClick,
  getSiteCode,
}: {
  product: Product
  onClick: () => void
  getSiteCode: (product: Product | null) => string | null
}) {
  const thumbnailUrl =
    product.media && product.media.length > 0 ? product.media[0].url : "/abstract-geometric-sculpture.png"

  const location = product.specs_rental?.location || product.light?.location || "Unknown location"
  const siteCode = getSiteCode(product)

  return (
    <Card
      className="overflow-hidden cursor-pointer border shadow-md rounded-xl transition-all hover:shadow-lg"
      onClick={onClick}
    >
      <div className="h-48 bg-gray-200 relative">
        <Image
          src={thumbnailUrl || "/placeholder.svg"}
          alt={product.name || "Site image"}
          fill
          className="object-cover"
          onError={(e) => {
            const target = e.target as HTMLImageElement
            target.src = "/abstract-geometric-sculpture.png"
            target.className = "opacity-50 object-contain"
          }}
        />
      </div>

      <CardContent className="p-4">
        <div className="flex flex-col">
          {siteCode && <span className="text-xs text-gray-700 mb-1">Site Code: {siteCode}</span>}

          <h3 className="font-semibold line-clamp-1">{product.name}</h3>

          <div className="mt-1 text-xs text-gray-500 flex items-center">
            <MapPin size={12} className="mr-1 flex-shrink-0" />
            <span className="truncate">{location}</span>
          </div>

          <div className="mt-2 flex items-center justify-between">
            <Badge
              variant="outline"
              className={
                product.type?.toLowerCase() === "rental"
                  ? "bg-blue-50 text-blue-700 border-blue-200"
                  : "bg-purple-50 text-purple-700 border-purple-200"
              }
            >
              {product.type || "Unknown"}
            </Badge>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

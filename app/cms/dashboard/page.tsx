"use client"

import type React from "react"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { useToast } from "@/hooks/use-toast"
import {
  getProductsByContentTypeCaseInsensitive,
  getProductsCountByContentTypeServerSide,
  softDeleteProduct,
  type Product,
} from "@/lib/firebase-service"
import type { DocumentData, QueryDocumentSnapshot } from "firebase/firestore"

// Number of items to display per page
const ITEMS_PER_PAGE = 12

// Map product to content format for display
const mapProductToContent = (product: Product) => {
  return {
    id: product.id,
    title: product.name || "Untitled",
    type: product.type || "Document",
    status: product.status || "Draft",
    author: product.seller_name || "Unknown",
    dateCreated: typeof product.created === "string" ? product.created : "Recent",
    dateModified: typeof product.updated === "string" ? product.updated : "Recent",
    thumbnail: product.media?.[0]?.url || "/abstract-geometric-sculpture.png",
    tags: product.categories || [],
    description: product.description || "",
    // Billboard/LED specific fields
    dimensions: product.dimensions || "1920×1080",
    duration: product.duration || "15s",
    scheduledDates: product.scheduled_dates || { start: "Not scheduled", end: "Not scheduled" },
    locations: product.locations || [],
    format: product.format || "Image",
    approvalStatus: product.approval_status || "Pending",
    campaignName: product.campaign_name || "Unassigned",
    impressions: product.impressions || 0,
    // CMS specific fields
    cms: product.cms || null,
    productId: product.id?.substring(0, 8).toUpperCase() || "UNKNOWN",
    location: product.specs_rental?.location || "Unknown Location",
    operation: product.campaignName || "Unassigned Campaign",
    displayHealth: product.active ? "ON" : "OFF",
  }
}

export default function CMSDashboardPage() {
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [productToDelete, setProductToDelete] = useState<Product | null>(null)
  const [searchTerm, setSearchTerm] = useState("")

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

  const { user, userData } = useAuth()
  const router = useRouter()
  const { toast } = useToast()

  // Navigation handlers for analytics cards
  const handleNavigateToActiveScreens = () => {
    // Navigate to active screens page (you can change this to the appropriate route)
    router.push("/cms/screens/active")
  }

  const handleNavigateToInactiveScreens = () => {
    // Navigate to inactive screens page
    router.push("/cms/screens/inactive")
  }

  const handleNavigateToWarnings = () => {
    // Navigate to warnings page
    router.push("/cms/warnings")
  }

  const handleNavigateToOrders = () => {
    // Navigate to orders page
    router.push("/cms/orders")
  }

  // Fetch total count of dynamic products using server-side query
  const fetchTotalCount = useCallback(async () => {
    if (!userData?.company_id) return

    setLoadingCount(true)
    try {
      const count = await getProductsCountByContentTypeServerSide(userData.company_id, "dynamic", searchTerm)
      setTotalItems(count)
      setTotalPages(Math.max(1, Math.ceil(count / ITEMS_PER_PAGE)))
    } catch (error) {
      console.error("Error fetching total count:", error)
      toast({
        title: "Error",
        description: "Failed to load content count. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoadingCount(false)
    }
  }, [userData, toast, searchTerm])

  // Fetch dynamic products for the current page using server-side query
  const fetchProducts = useCallback(
    async (page: number) => {
      if (!userData?.company_id) return

      // Check if we have this page in cache
      const cacheKey = `${page}-${searchTerm}`
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

        // Use the new server-side case-insensitive query
        const result = await getProductsByContentTypeCaseInsensitive(
          userData.company_id,
          "dynamic", // Content type filter for dynamic products (case-insensitive)
          ITEMS_PER_PAGE,
          startDoc,
          searchTerm,
        )

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
        toast({
          title: "Error",
          description: "Failed to load content. Please try again.",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
        setLoadingMore(false)
      }
    },
    [userData, lastDoc, pageCache, toast, searchTerm],
  )

  // Store products in localStorage for use in breadcrumbs
  useEffect(() => {
    if (products.length > 0) {
      try {
        // Only store essential data (id and name) to keep localStorage size small
        const simplifiedProducts = products.map((product) => ({
          id: product.id,
          name: product.name,
        }))
        localStorage.setItem("cmsProducts", JSON.stringify(simplifiedProducts))
      } catch (error) {
        console.error("Error storing products in localStorage:", error)
      }
    }
  }, [products])

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

  // Handle search
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    // Reset pagination and cache when searching
    setCurrentPage(1)
    setPageCache(new Map())
    fetchProducts(1)
    fetchTotalCount()
  }

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

  // Handle product deletion
  const handleDeleteClick = (product: Product, e: React.MouseEvent) => {
    e.stopPropagation()
    setProductToDelete(product)
    setDeleteDialogOpen(true)
  }

  const handleDeleteConfirm = async () => {
    if (!productToDelete) return

    try {
      await softDeleteProduct(productToDelete.id)

      // Update the UI by removing the deleted product
      setProducts((prevProducts) => prevProducts.filter((p) => p.id !== productToDelete.id))

      // Update total count
      setTotalItems((prev) => prev - 1)

      // Recalculate total pages
      setTotalPages(Math.max(1, Math.ceil((totalItems - 1) / ITEMS_PER_PAGE)))

      // Clear cache to force refresh
      setPageCache(new Map())

      toast({
        title: "Content deleted",
        description: `${productToDelete.name} has been successfully deleted.`,
      })
    } catch (error) {
      console.error("Error deleting product:", error)
      toast({
        title: "Error",
        description: "Failed to delete the content. Please try again.",
        variant: "destructive",
      })
    } finally {
      setDeleteDialogOpen(false)
      setProductToDelete(null)
    }
  }

  // Handle edit click
  const handleEditClick = (product: Product, e: React.MouseEvent) => {
    e.stopPropagation()
    router.push(`/cms/details/${product.id}`)
  }

  // Handle view details click
  const handleViewDetails = (productId: string) => {
    router.push(`/cms/details/${productId}`)
  }

  // Use mock data if no products are available from Firebase
  const [useMockData, setUseMockData] = useState(false)

  useEffect(() => {
    if (!loading && products.length === 0 && !userData?.company_id) {
      setUseMockData(true)
    }
  }, [loading, products, userData])

// Mock data for demonstration when no Firebase data is available

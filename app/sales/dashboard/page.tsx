"use client"

import type React from "react"
import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { useAuth } from "@/contexts/auth-context"
import { useToast } from "@/hooks/use-toast"
import {
  MoreVertical,
  MapPin,
  LayoutGrid,
  List,
  Loader2,
  ChevronLeft,
  ChevronRight,
  Calendar,
  CheckCircle2,
  ArrowLeft,
  Filter,
  AlertCircle,
  Search,
  FileText,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { DeleteConfirmationDialog } from "@/components/delete-confirmation-dialog"
import { CreateProposalDialog } from "@/components/create-proposal-dialog"
import {
  getPaginatedUserProducts,
  getUserProductsCount,
  softDeleteProduct,
  type Product,
  type Booking,
} from "@/lib/firebase-service"
import type { DocumentData, QueryDocumentSnapshot } from "firebase/firestore"
import ProtectedRoute from "@/components/protected-route"
import { collection, query, where, getDocs, Timestamp } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { SearchBox } from "@/components/search-box"
import type { SearchResult } from "@/lib/algolia-service"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useResponsive } from "@/hooks/use-responsive"
import { ResponsiveCardGrid } from "@/components/responsive-card-grid"
import { OhliverWelcomeNotification } from "@/components/ohliver-welcome-notification"
import { cn } from "@/lib/utils"

// Number of items to display per page
const ITEMS_PER_PAGE = 12

// Function to get site code from product
const getSiteCode = (product: Product | null) => {
  if (!product) return null

  // Try different possible locations for site_code
  if (product.site_code) return product.site_code
  if (product.specs_rental && "site_code" in product.specs_rental) return product.specs_rental.site_code
  if (product.light && "site_code" in product.light) return product.light.site_code

  // Check for camelCase variant
  if ("siteCode" in product) return (product as any).siteCode

  return null
}

function SalesDashboardContent() {
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [productToDelete, setProductToDelete] = useState<Product | null>(null)
  const [productsWithBookings, setProductsWithBookings] = useState<Record<string, boolean>>({})
  const [loadingBookings, setLoadingBookings] = useState(false)
  const { isMobile, isTablet } = useResponsive()

  // Search state
  const [searchResults, setSearchResults] = useState<SearchResult[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [isSearching, setIsSearching] = useState(false)
  const [searchError, setSearchError] = useState<string | null>(null)

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
  const router = useRouter()
  const { toast } = useToast()

  const [createProposalOpen, setCreateProposalOpen] = useState(false)
  const [selectedProducts, setSelectedProducts] = useState<Product[]>([])
  const [selectionMode, setSelectionMode] = useState(false)

  // On mobile, default to grid view
  useEffect(() => {
    if (isMobile) {
      setViewMode("grid")
    }
  }, [isMobile])

  // Check for ongoing bookings
  const checkOngoingBookings = useCallback(
    async (productIds: string[]) => {
      if (!productIds.length) return

      setLoadingBookings(true)
      try {
        const currentDate = new Date()
        const bookingsRef = collection(db, "booking")

        // Create a map to store booking status for each product
        const bookingStatus: Record<string, boolean> = {}

        // We need to check each product individually since Firestore doesn't support OR queries
        for (const productId of productIds) {
          // Only check rental products
          const product = products.find((p) => p.id === productId)
          if (product?.type?.toLowerCase() !== "rental") continue

          const q = query(bookingsRef, where("product_id", "==", productId), where("status", "==", "CONFIRMED"))

          const querySnapshot = await getDocs(q)

          // Check if any booking is ongoing (current date is between start_date and end_date)
          let hasOngoingBooking = false
          querySnapshot.forEach((doc) => {
            const booking = doc.data() as Booking
            const startDate =
              booking.start_date instanceof Timestamp ? booking.start_date.toDate() : new Date(booking.start_date)

            const endDate =
              booking.end_date instanceof Timestamp ? booking.end_date.toDate() : new Date(booking.end_date)

            if (currentDate >= startDate && currentDate <= endDate) {
              hasOngoingBooking = true
            }
          })

          bookingStatus[productId] = hasOngoingBooking
        }

        setProductsWithBookings(bookingStatus)
      } catch (error) {
        console.error("Error checking ongoing bookings:", error)
      } finally {
        setLoadingBookings(false)
      }
    },
    [products],
  )

  // Fetch total count of products
  const fetchTotalCount = useCallback(async () => {
    if (!user?.uid) return

    setLoadingCount(true)
    try {
      const count = await getUserProductsCount(user.uid, { active: true })
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
  }, [user, toast])

  // Fetch products for the current page
  const fetchProducts = useCallback(
    async (page: number) => {
      if (!user?.uid) return

      // Check if we have this page in cache
      if (pageCache.has(page)) {
        const cachedData = pageCache.get(page)!
        setProducts(cachedData.items)
        setLastDoc(cachedData.lastDoc)

        // Check for ongoing bookings for the cached products
        const productIds = cachedData.items.map((product) => product.id)
        checkOngoingBookings(productIds)

        return
      }

      const isFirstPage = page === 1
      setLoading(isFirstPage)
      setLoadingMore(!isFirstPage)

      try {
        // For the first page, start from the beginning
        // For subsequent pages, use the last document from the previous page
        const startDoc = isFirstPage ? null : lastDoc

        const result = await getPaginatedUserProducts(user.uid, ITEMS_PER_PAGE, startDoc, { active: true })

        setProducts(result.items)
        setLastDoc(result.lastDoc)
        setHasMore(result.hasMore)

        // Check for ongoing bookings
        const productIds = result.items.map((product) => product.id)
        checkOngoingBookings(productIds)

        // Cache this page
        setPageCache((prev) => {
          const newCache = new Map(prev)
          newCache.set(page, {
            items: result.items,
            lastDoc: result.lastDoc,
          })
          return newCache
        })

        // Store product names in localStorage for breadcrumb navigation
        const simplifiedProducts = result.items.map((product) => ({
          id: product.id,
          name: product.name,
        }))
        localStorage.setItem("salesProducts", JSON.stringify(simplifiedProducts))
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
    [user, lastDoc, pageCache, toast, checkOngoingBookings],
  )

  // Load initial data and count
  useEffect(() => {
    if (user?.uid) {
      fetchProducts(1)
      fetchTotalCount()
    }
  }, [user, fetchProducts, fetchTotalCount])

  // Load data when page changes
  useEffect(() => {
    if (user?.uid && currentPage > 0) {
      fetchProducts(currentPage)
    }
  }, [currentPage, fetchProducts, user])

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
        title: "Product deleted",
        description: `${productToDelete.name} has been successfully deleted.`,
      })
    } catch (error) {
      console.error("Error deleting product:", error)
      toast({
        title: "Error",
        description: "Failed to delete the product. Please try again.",
        variant: "destructive",
      })
    }
  }

  // Handle edit click
  const handleEditClick = (product: Product, e: React.MouseEvent) => {
    e.stopPropagation()
    router.push(`/sales/products/edit/${product.id}`)
  }

  // Handle view details click
  const handleViewDetails = (productId: string) => {
    router.push(`/sales/products/${productId}`)
  }

  // Handle search result click
  const handleSearchResultClick = (result: SearchResult) => {
    if (result.type === "product") {
      router.push(`/sales/products/${result.objectID}`)
    } else if (result.type === "client") {
      router.push(`/sales/clients/${result.objectID}`)
    }
  }

  // Handle search results
  const handleSearchResults = (results: SearchResult[], query: string) => {
    setSearchResults(results)
    setSearchQuery(query)
    setIsSearching(!!query)
  }

  // Handle search error
  const handleSearchError = (error: string | null) => {
    setSearchError(error)
  }

  // Handle search loading
  const handleSearchLoading = (isLoading: boolean) => {
    // We don't need to do anything with this for now
  }

  // Handle search clear
  const handleSearchClear = () => {
    setSearchResults([])
    setSearchQuery("")
    setIsSearching(false)
    setSearchError(null)
  }

  // Clear search and return to normal view
  const handleClearSearch = () => {
    handleSearchClear()
  }

  // Handle proposal creation
  const handleCreateProposal = () => {
    setSelectionMode(true)
    setSelectedProducts([])
  }

  const handleProductSelect = (product: Product) => {
    setSelectedProducts((prev) => {
      const isSelected = prev.some((p) => p.id === product.id)
      if (isSelected) {
        return prev.filter((p) => p.id !== product.id)
      } else {
        return [...prev, product]
      }
    })
  }

  const handleConfirmSelection = () => {
    if (selectedProducts.length > 0) {
      setCreateProposalOpen(true)
    } else {
      toast({
        title: "No products selected",
        description: "Please select at least one product to create a proposal.",
        variant: "destructive",
      })
    }
  }

  const handleCancelSelection = () => {
    setSelectionMode(false)
    setSelectedProducts([])
  }

  const handleProposalCreated = () => {
    setCreateProposalOpen(false)
    setSelectionMode(false)
    setSelectedProducts([])
    toast({
      title: "Proposal created",
      description: "Your proposal has been created successfully.",
    })
  }

  return (
    <div className="flex-1 p-4 md:p-6">
      <div className="flex flex-col gap-4 md:gap-6">
        {/* Header with title, search, and actions */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <h1 className="text-xl md:text-2xl font-bold">Dashboard</h1>

          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 w-full sm:w-auto">
            {/* Selection Mode Controls */}
            {selectionMode && (
              <div className="flex items-center gap-2 p-2 bg-blue-50 rounded-lg border border-blue-200">
                <span className="text-sm text-blue-700">{selectedProducts.length} selected</span>
                <Button size="sm" onClick={handleConfirmSelection} disabled={selectedProducts.length === 0}>
                  Create Proposal
                </Button>
                <Button size="sm" variant="outline" onClick={handleCancelSelection}>
                  Cancel
                </Button>
              </div>
            )}

            {/* Create Proposal Button */}
            {!selectionMode && !isSearching && (
              <Button onClick={handleCreateProposal} className="gap-2">
                <FileText size={16} />
                Create Proposal
              </Button>
            )}

            {/* Search Box */}
            <div className="w-full sm:w-64 md:w-80">
              <SearchBox
                onSearchResults={handleSearchResults}
                onSearchError={handleSearchError}
                onSearchLoading={handleSearchLoading}
                onSearchClear={handleSearchClear}
                showDropdown={false}
                userId={user?.uid} // Pass the current user's ID
              />
            </div>

            {!isMobile && (
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
            )}
          </div>
        </div>

        {/* Search Results View */}
        {isSearching && (
          <div className="flex flex-col gap-4">
            {/* Search Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="sm" onClick={handleClearSearch} className="h-8 w-8 p-0">
                  <ArrowLeft size={16} />
                </Button>
                <h2 className="text-base md:text-lg font-medium truncate">
                  Results for "{searchQuery}" ({searchResults.length})
                </h2>
              </div>
              <Button variant="outline" size="sm" className="gap-1 hidden sm:flex">
                <Filter size={14} />
                <span>Filter</span>
              </Button>
            </div>

            {/* Search Error */}
            {searchError && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{searchError}</AlertDescription>
              </Alert>
            )}

            {/* Search Results */}
            {searchResults.length > 0 ? (
              <div>
                {viewMode === "grid" ? (
                  // Grid View for Search Results
                  <ResponsiveCardGrid mobileColumns={1} tabletColumns={2} desktopColumns={4} gap="md">
                    {searchResults.map((result) => (
                      <Card
                        key={result.objectID}
                        className="overflow-hidden cursor-pointer border border-gray-200 shadow-md rounded-xl transition-all hover:shadow-lg"
                        onClick={() => handleSearchResultClick(result)}
                      >
                        <div className="h-48 bg-gray-200 relative">
                          <Image
                            src={result.image_url || "/abstract-geometric-sculpture.png"}
                            alt={result.name || "Search result"}
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
                            {result.site_code && (
                              <span className="text-xs text-gray-700 mb-1">Site Code: {result.site_code}</span>
                            )}

                            <h3 className="font-semibold line-clamp-1">{result.name}</h3>

                            {result.price && (
                              <div className="mt-2 text-sm font-medium text-green-700">
                                ₱{Number(result.price).toLocaleString()}
                              </div>
                            )}

                            {result.location && (
                              <div className="mt-1 text-xs text-gray-500 flex items-center">
                                <MapPin size={12} className="mr-1 flex-shrink-0" />
                                <span className="truncate">{result.location}</span>
                              </div>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </ResponsiveCardGrid>
                ) : (
                  // List View for Search Results - Only show on tablet and desktop
                  !isMobile && (
                    <div className="border rounded-lg overflow-hidden">
                      <div className="overflow-x-auto">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead className="w-[80px]">Image</TableHead>
                              <TableHead>Name</TableHead>
                              <TableHead>Type</TableHead>
                              <TableHead className="hidden md:table-cell">Location</TableHead>
                              <TableHead>Price</TableHead>
                              <TableHead className="hidden md:table-cell">Site Code</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {searchResults.map((result) => (
                              <TableRow
                                key={result.objectID}
                                className="cursor-pointer hover:bg-gray-50"
                                onClick={() => handleSearchResultClick(result)}
                              >
                                <TableCell>
                                  <div className="h-12 w-12 bg-gray-200 rounded overflow-hidden relative">
                                    {result.image_url ? (
                                      <Image
                                        src={result.image_url || "/placeholder.svg"}
                                        alt={result.name || "Search result"}
                                        width={48}
                                        height={48}
                                        className="h-full w-full object-cover"
                                        onError={(e) => {
                                          const target = e.target as HTMLImageElement
                                          target.src = "/abstract-geometric-sculpture.png"
                                          target.className = "opacity-50"
                                        }}
                                      />
                                    ) : (
                                      <div className="h-full w-full flex items-center justify-center bg-gray-100">
                                        <MapPin size={16} className="text-gray-400" />
                                      </div>
                                    )}
                                  </div>
                                </TableCell>
                                <TableCell className="font-medium">{result.name}</TableCell>
                                <TableCell>
                                  <Badge
                                    variant="outline"
                                    className={
                                      result.type?.toLowerCase() === "product" ||
                                      result.type?.toLowerCase() === "rental"
                                        ? "bg-blue-50 text-blue-700 border-blue-200"
                                        : result.type?.toLowerCase() === "client"
                                          ? "bg-green-50 text-green-700 border-green-200"
                                          : "bg-purple-50 text-purple-700 border-purple-200"
                                    }
                                  >
                                    {result.type || "Unknown"}
                                  </Badge>
                                </TableCell>
                                <TableCell className="hidden md:table-cell">
                                  {result.location || "Unknown location"}
                                </TableCell>
                                <TableCell>
                                  {result.price ? `₱${Number(result.price).toLocaleString()}` : "Not set"}
                                </TableCell>
                                <TableCell className="hidden md:table-cell">{result.site_code || "—"}</TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    </div>
                  )
                )}
              </div>
            ) : (
              // No Search Results
              <div className="text-center py-8 md:py-12 bg-gray-50 rounded-lg border border-dashed">
                <div className="mx-auto w-12 h-12 md:w-16 md:h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                  <Search size={24} className="text-gray-400" />
                </div>
                <h3 className="text-base md:text-lg font-medium mb-2">No results found</h3>
                <p className="text-sm text-gray-500 mb-4 px-4">
                  No items match your search for "{searchQuery}". Try using different keywords.
                </p>
              </div>
            )}
          </div>
        )}

        {/* Regular Dashboard Content - Only show when not searching */}
        {!isSearching && (
          <>
            {/* Loading state */}
            {loading && (
              <div className="flex justify-center items-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <span className="ml-2 text-lg">Loading products...</span>
              </div>
            )}

            {/* Empty state */}
            {!loading && products.length === 0 && (
              <div className="text-center py-8 md:py-12 bg-gray-50 rounded-lg border border-dashed">
                <div className="mx-auto w-12 h-12 md:w-16 md:h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                  <MapPin size={24} className="text-gray-400" />
                </div>
                <h3 className="text-base md:text-lg font-medium mb-2">No products yet</h3>
                <p className="text-sm text-gray-500 mb-4">Contact an administrator to add products</p>
              </div>
            )}

            {/* Grid View */}
            {!loading && products.length > 0 && viewMode === "grid" && (
              <ResponsiveCardGrid mobileColumns={1} tabletColumns={2} desktopColumns={4} gap="md">
                {products.map((product) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    hasOngoingBooking={productsWithBookings[product.id] || false}
                    onView={() => handleViewDetails(product.id)}
                    onEdit={(e) => handleEditClick(product, e)}
                    onDelete={(e) => handleDeleteClick(product, e)}
                    isSelected={selectedProducts.some((p) => p.id === product.id)}
                    onSelect={() => handleProductSelect(product)}
                    selectionMode={selectionMode}
                  />
                ))}
              </ResponsiveCardGrid>
            )}

            {/* List View - Only show on tablet and desktop */}
            {!loading && products.length > 0 && viewMode === "list" && !isMobile && (
              <div className="border rounded-lg overflow-hidden">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[80px]">Image</TableHead>
                        <TableHead>Name</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead className="hidden md:table-cell">Location</TableHead>
                        <TableHead>Price</TableHead>
                        <TableHead className="hidden md:table-cell">Site Code</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {products.map((product) => (
                        <TableRow
                          key={product.id}
                          className={`cursor-pointer hover:bg-gray-50 ${selectionMode ? "opacity-50" : ""}`}
                          onClick={() => (selectionMode ? handleProductSelect(product) : handleViewDetails(product.id))}
                        >
                          <TableCell>
                            <div className="h-12 w-12 bg-gray-200 rounded overflow-hidden relative">
                              {product.media && product.media.length > 0 ? (
                                <>
                                  <Image
                                    src={product.media[0].url || "/placeholder.svg"}
                                    alt={product.name || "Product image"}
                                    width={48}
                                    height={48}
                                    className={`h-full w-full object-cover ${productsWithBookings[product.id] ? "grayscale" : ""}`}
                                    onError={(e) => {
                                      const target = e.target as HTMLImageElement
                                      target.src = "/abstract-geometric-sculpture.png"
                                      target.className = "opacity-50"
                                    }}
                                  />
                                </>
                              ) : (
                                <div className="h-full w-full flex items-center justify-center bg-gray-100">
                                  <MapPin size={16} className="text-gray-400" />
                                </div>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="font-medium">{product.name}</TableCell>
                          <TableCell>
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
                          </TableCell>
                          <TableCell className="hidden md:table-cell">
                            {product.specs_rental?.location || product.light?.location || "Unknown location"}
                          </TableCell>
                          <TableCell>
                            {product.price ? `₱${Number(product.price).toLocaleString()}` : "Not set"}
                          </TableCell>
                          <TableCell className="hidden md:table-cell">{getSiteCode(product) || "—"}</TableCell>
                          <TableCell>
                            {product.type?.toLowerCase() === "rental" &&
                              (productsWithBookings[product.id] ? (
                                <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
                                  <Calendar className="mr-1 h-3 w-3" /> Booked
                                </Badge>
                              ) : (
                                <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                                  <CheckCircle2 className="mr-1 h-3 w-3" /> Available
                                </Badge>
                              ))}
                          </TableCell>
                          <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                            {/* Edit and delete buttons removed */}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
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
                    className="h-8 w-8 p-0"
                  >
                    <ChevronLeft size={16} />
                  </Button>

                  {/* Page numbers - Hide on mobile */}
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
          </>
        )}
      </div>

      {/* Create Proposal Dialog */}
      <CreateProposalDialog
        isOpen={createProposalOpen}
        onClose={() => setCreateProposalOpen(false)}
        selectedProducts={selectedProducts}
        onProposalCreated={handleProposalCreated}
      />

      {/* Delete Confirmation Dialog */}
      <DeleteConfirmationDialog
        isOpen={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        onConfirm={handleDeleteConfirm}
        title="Delete Product"
        description="This product will be removed from your dashboard. This action cannot be undone."
        itemName={productToDelete?.name}
      />
    </div>
  )
}

export default function SalesDashboard() {
  const [showWelcome, setShowWelcome] = useState(false)
  const [assistantTriggered, setAssistantTriggered] = useState(false)
  const { user } = useAuth()

  // Check if this is a new session
  useEffect(() => {
    const hasSeenWelcome = localStorage.getItem("ohliverWelcomeSeen")
    const lastLoginTime = localStorage.getItem("lastLoginTime")
    const currentTime = new Date().getTime()

    // Show welcome if:
    // 1. User hasn't seen it before, or
    // 2. It's been more than 24 hours since last login
    if (!hasSeenWelcome || (lastLoginTime && currentTime - Number.parseInt(lastLoginTime) > 24 * 60 * 60 * 1000)) {
      setShowWelcome(true)
      // Update last login time
      localStorage.setItem("lastLoginTime", currentTime.toString())
    }
  }, [user])

  const handleDismissWelcome = () => {
    localStorage.setItem("ohliverWelcomeSeen", "true")
    setShowWelcome(false)
  }

  const handleOpenAssistant = () => {
    // This will be picked up by the global event listener in AssistantWidget
    const event = new CustomEvent("openOhliverAssistant")
    window.dispatchEvent(event)
    setAssistantTriggered(true)
  }

  return (
    <div>
      <ProtectedRoute module="sales" action="view">
        <SalesDashboardContent />
      </ProtectedRoute>

      {showWelcome && (
        <OhliverWelcomeNotification
          onDismiss={handleDismissWelcome}
          onOpenAssistant={handleOpenAssistant}
          delay={2500} // Show after 2.5 seconds
        />
      )}
    </div>
  )
}

// Product Card Component for Grid View
function ProductCard({
  product,
  hasOngoingBooking,
  onView,
  onEdit,
  onDelete,
  isSelected = false,
  onSelect,
  selectionMode = false,
}: {
  product: Product
  hasOngoingBooking: boolean
  onView: () => void
  onEdit: (e: React.MouseEvent) => void
  onDelete: (e: React.MouseEvent) => void
  isSelected?: boolean
  onSelect?: () => void
  selectionMode?: boolean
}) {
  // Get the first media item for the thumbnail
  const thumbnailUrl =
    product.media && product.media.length > 0 ? product.media[0].url : "/abstract-geometric-sculpture.png"

  // Determine location based on product type
  const location = product.specs_rental?.location || product.light?.location || "Unknown location"

  // Format price if available
  const formattedPrice = product.price ? `₱${Number(product.price).toLocaleString()}` : "Price not set"

  // Get site code
  const siteCode = getSiteCode(product)

  const handleClick = () => {
    if (selectionMode && onSelect) {
      onSelect()
    } else {
      onView()
    }
  }

  return (
    <Card
      className={cn(
        "overflow-hidden cursor-pointer border shadow-md rounded-xl transition-all hover:shadow-lg",
        isSelected ? "border-blue-500 bg-blue-50" : "border-gray-200",
        selectionMode ? "hover:border-blue-300" : "",
      )}
      onClick={handleClick}
    >
      <div className="h-48 bg-gray-200 relative">
        <Image
          src={thumbnailUrl || "/placeholder.svg"}
          alt={product.name || "Product image"}
          fill
          className={`object-cover ${hasOngoingBooking ? "grayscale" : ""}`}
          onError={(e) => {
            const target = e.target as HTMLImageElement
            target.src = "/abstract-geometric-sculpture.png"
            target.className = `opacity-50 object-contain ${hasOngoingBooking ? "grayscale" : ""}`
          }}
        />

        {/* Selection indicator */}
        {selectionMode && (
          <div className="absolute top-2 left-2 z-10">
            <div
              className={cn(
                "w-6 h-6 rounded-full border-2 flex items-center justify-center",
                isSelected ? "bg-blue-500 border-blue-500" : "bg-white border-gray-300",
              )}
            >
              {isSelected && <CheckCircle2 size={16} className="text-white" />}
            </div>
          </div>
        )}

        {!selectionMode && (
          <div className="absolute top-2 right-2 z-10" onClick={(e) => e.stopPropagation()}>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="secondary" size="icon" className="h-8 w-8 bg-white/80 backdrop-blur-sm">
                  <MoreVertical size={16} />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={onView}>View Details</DropdownMenuItem>
                {/* Edit and delete options removed */}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )}
      </div>

      <CardContent className="p-4">
        <div className="flex flex-col">
          {siteCode && <span className="text-xs text-gray-700 mb-1">Site Code: {siteCode}</span>}

          <h3 className="font-semibold line-clamp-1">{product.name}</h3>

          <div className="mt-2 text-sm font-medium text-green-700">{formattedPrice}</div>

          {/* Booking Status - Only show for rental products */}
          {product.type?.toLowerCase() === "rental" && (
            <div className="mt-2">
              {hasOngoingBooking ? (
                <Badge
                  variant="outline"
                  className="bg-amber-50 text-amber-700 border-amber-200 flex items-center w-fit"
                >
                  <Calendar className="mr-1 h-3 w-3" /> Currently Booked
                </Badge>
              ) : (
                <Badge
                  variant="outline"
                  className="bg-green-50 text-green-700 border-green-200 flex items-center w-fit"
                >
                  <CheckCircle2 className="mr-1 h-3 w-3" /> Available
                </Badge>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

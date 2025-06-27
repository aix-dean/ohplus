"use client"

import type React from "react"
import { useEffect, useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { useAuth } from "@/contexts/auth-context"
import { useToast } from "@/hooks/use-toast"
import {
  Plus,
  MoreVertical,
  MapPin,
  LayoutGrid,
  List,
  Edit,
  Trash2,
  Loader2,
  ChevronLeft,
  ChevronRight,
  Info,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { DeleteConfirmationDialog } from "@/components/delete-confirmation-dialog"
import { getPaginatedUserProducts, getUserProductsCount, softDeleteProduct, type Product } from "@/lib/firebase-service"
import type { DocumentData, QueryDocumentSnapshot } from "firebase/firestore"

// Number of items to display per page
const ITEMS_PER_PAGE = 12

export default function AdminInventoryPage() {
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [productToDelete, setProductToDelete] = useState<Product | null>(null)

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

  const { user, projectData, subscriptionData } = useAuth() // Get projectData from auth context
  const router = useRouter()
  const { toast } = useToast()

  // State for current product count and loading status for subscription check
  const [currentProductsCount, setCurrentProductsCount] = useState<number | null>(null)
  const [isLoadingCurrentCount, setIsLoadingCurrentCount] = useState(true)

  // Fetch total count of products (used for pagination display)
  const fetchTotalCount = useCallback(async () => {
    if (!user?.uid) return

    setLoadingCount(true)
    try {
      const count = await getUserProductsCount(user.uid, { deleted: false }) // Ensure count is for active products
      setTotalItems(count)
      setTotalPages(Math.max(1, Math.ceil(count / ITEMS_PER_PAGE)))
    } catch (error) {
      console.error("Error fetching total count:", error)
      toast({
        title: "Error",
        description: "Failed to load product count for pagination. Please try again.",
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
        return
      }

      const isFirstPage = page === 1
      setLoading(isFirstPage)
      setLoadingMore(!isFirstPage)

      try {
        const startDoc = isFirstPage ? null : lastDoc

        const result = await getPaginatedUserProducts(user.uid, ITEMS_PER_PAGE, startDoc)

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

        // Store product names in localStorage for breadcrumb navigation
        const simplifiedProducts = result.items.map((product) => ({
          id: product.id,
          name: product.name,
        }))
        localStorage.setItem("adminProducts", JSON.stringify(simplifiedProducts))
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
    [user, lastDoc, pageCache, toast],
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

  // Fetch current product count for subscription limit check
  useEffect(() => {
    const fetchCurrentProductCount = async () => {
      if (user?.uid) {
        setIsLoadingCurrentCount(true)
        try {
          const count = await getUserProductsCount(user.uid, { deleted: false })
          setCurrentProductsCount(count)
        } catch (error) {
          console.error("Failed to fetch current product count for subscription check:", error)
          setCurrentProductsCount(0) // Default to 0 on error
        } finally {
          setIsLoadingCurrentCount(false)
        }
      }
    }
    fetchCurrentProductCount()
  }, [user?.uid, products]) // Re-fetch when user changes or products list updates (after add/delete)

  // Calculate if the user can add a product based on subscription limit
  const maxProducts = subscriptionData?.maxProducts
  const canAddProduct = maxProducts === null || (currentProductsCount !== null && currentProductsCount < maxProducts)
  const isLimitReached = currentProductsCount !== null && maxProducts !== null && currentProductsCount >= maxProducts

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

      // Update total count (this will trigger re-fetch of currentProductsCount)
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
    router.push(`/admin/inventory/edit/${product.id}`)
  }

  // Handle view details click
  const handleViewDetails = (productId: string) => {
    router.push(`/admin/inventory/${productId}`)
  }

  // Handle add new product
  const handleAddProduct = () => {
    router.push("/admin/products/create")
  }

  return (
    <div className="flex-1 p-6">
      <div className="flex flex-col gap-6">
        {/* Header with title and actions */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <h1 className="text-2xl font-bold">Admin Inventory</h1>
          <div className="flex flex-col items-end gap-2">
            {" "}
            {/* Changed to flex-col for button and message */}
            <div className="flex items-center gap-3">
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
              <Button onClick={handleAddProduct} disabled={!canAddProduct || isLoadingCurrentCount}>
                {isLoadingCurrentCount ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Loading...
                  </>
                ) : (
                  <>
                    <Plus size={16} />
                    Add Product
                  </>
                )}
              </Button>
            </div>
            {isLimitReached && (
              <p className="text-sm text-red-500 flex items-center gap-1">
                <Info className="h-4 w-4" />
                You have reached your product limit ({maxProducts}). Please upgrade your subscription.
              </p>
            )}
          </div>
        </div>

        {/* Loading state */}
        {loading && (
          <div className="flex justify-center items-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <span className="ml-2 text-lg">Loading products...</span>
          </div>
        )}

        {/* Empty state */}
        {!loading && products.length === 0 && (
          <div className="text-center py-12 bg-gray-50 rounded-lg border border-dashed">
            <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
              <MapPin size={24} className="text-gray-400" />
            </div>
            <h3 className="text-lg font-medium mb-2">No products yet</h3>
            <p className="text-gray-500 mb-4">Add your first product to get started</p>
            <Button onClick={handleAddProduct} disabled={!canAddProduct || isLoadingCurrentCount}>
              {isLoadingCurrentCount ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Loading...
                </>
              ) : (
                <>
                  <Plus size={16} className="mr-2" />
                  Add Product
                </>
              )}
            </Button>
            {isLimitReached && (
              <p className="text-sm text-red-500 flex items-center justify-center gap-1 mt-4">
                <Info className="h-4 w-4" />
                You have reached your product limit ({maxProducts}). Please upgrade your subscription.
              </p>
            )}
          </div>
        )}

        {/* Grid View */}
        {!loading && products.length > 0 && viewMode === "grid" && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {products.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                onView={() => handleViewDetails(product.id)}
                onEdit={(e) => handleEditClick(product, e)}
                onDelete={(e) => handleDeleteClick(product, e)}
              />
            ))}
          </div>
        )}

        {/* List View */}
        {!loading && products.length > 0 && viewMode === "list" && (
          <div className="border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[80px]">Image</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {products.map((product) => (
                  <TableRow
                    key={product.id}
                    className="cursor-pointer hover:bg-gray-50"
                    onClick={() => handleViewDetails(product.id)}
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
                              className="h-full w-full object-cover"
                              onError={(e) => {
                                const target = e.target as HTMLImageElement
                                target.src = "/abstract-geometric-sculpture.png"
                                target.className = "opacity-50"
                              }}
                            />
                            <Badge
                              variant="outline"
                              className={`absolute bottom-0 left-0 z-10 text-[8px] px-1 py-0 ${
                                product.status === "PENDING"
                                  ? "bg-blue-50 text-blue-700 border-blue-200"
                                  : product.status === "ACTIVE"
                                    ? "bg-green-50 text-green-700 border-green-200"
                                    : "bg-gray-50 text-gray-700 border-gray-200"
                              }`}
                            >
                              {product.status}
                            </Badge>
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
                      {product.specs_rental?.location || product.light?.location || "Unknown location"}
                    </TableCell>
                    <TableCell>{product.price ? `₱${Number(product.price).toLocaleString()}` : "Not set"}</TableCell>
                    <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={(e) => handleEditClick(product, e)}
                        >
                          <Edit size={16} />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive"
                          onClick={(e) => handleDeleteClick(product, e)}
                        >
                          <Trash2 size={16} />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
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
      </div>

      {/* Delete Confirmation Dialog */}
      <DeleteConfirmationDialog
        isOpen={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        onConfirm={handleDeleteConfirm}
        title="Delete Product"
        description="This product will be removed from your inventory. This action cannot be undone."
        itemName={productToDelete?.name}
      />
    </div>
  )
}

// Product Card Component for Grid View
function ProductCard({
  product,
  onView,
  onEdit,
  onDelete,
}: {
  product: Product
  onView: () => void
  onEdit: (e: React.MouseEvent) => void
  onDelete: (e: React.MouseEvent) => void
}) {
  // Get the first media item for the thumbnail
  const thumbnailUrl =
    product.media && product.media.length > 0 ? product.media[0].url : "/abstract-geometric-sculpture.png"

  // Determine location based on product type
  const location = product.specs_rental?.location || product.light?.location || "Unknown location"

  // Format price if available
  const formattedPrice = product.price ? `₱${Number(product.price).toLocaleString()}` : "Price not set"

  return (
    <Card
      className="overflow-hidden cursor-pointer border border-gray-200 shadow-sm transition-all hover:shadow-md"
      onClick={onView}
    >
      <div className="h-48 bg-gray-200 relative">
        <Image
          src={thumbnailUrl || "/placeholder.svg"}
          alt={product.name || "Product image"}
          fill
          className="object-cover"
          onError={(e) => {
            const target = e.target as HTMLImageElement
            target.src = "/abstract-geometric-sculpture.png"
            target.className = "opacity-50 object-contain"
          }}
        />

        {/* Status Badge positioned at the bottom left of the image */}
        <Badge
          variant="outline"
          className={`absolute bottom-2 left-2 z-10 ${
            product.status === "PENDING"
              ? "bg-blue-50 text-blue-700 border-blue-200"
              : product.status === "ACTIVE"
                ? "bg-green-50 text-green-700 border-green-200"
                : "bg-gray-50 text-gray-700 border-gray-200"
          }`}
        >
          {product.status}
        </Badge>

        {/* Type Badge positioned at the bottom right of the image */}
        {product.type && (
          <Badge variant="outline" className="absolute bottom-2 right-12 z-10 bg-blue-50 text-blue-700 border-blue-200">
            {product.type}
          </Badge>
        )}

        <div className="absolute top-2 right-2 z-10" onClick={(e) => e.stopPropagation()}>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="secondary" size="icon" className="h-8 w-8 bg-white/80 backdrop-blur-sm">
                <MoreVertical size={16} />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={onView}>View Details</DropdownMenuItem>
              <DropdownMenuItem onClick={onEdit}>
                <Edit className="mr-2 h-4 w-4" />
                Edit Product
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onDelete} className="text-destructive">
                <Trash2 className="mr-2 h-4 w-4" />
                Delete Product
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <CardContent className="p-4">
        <div className="flex justify-between items-start">
          <div>
            <h3 className="font-semibold line-clamp-1">{product.name}</h3>
            <div className="mt-1 text-sm text-gray-600 flex items-center gap-1">
              <MapPin size={14} />
              <span className="truncate max-w-[200px]">{location}</span>
            </div>
          </div>
        </div>

        <div className="mt-2 text-sm font-medium text-green-700">{formattedPrice}</div>

        <div className="mt-4 flex justify-between">
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              className="h-8 bg-transparent"
              onClick={(e) => {
                e.stopPropagation()
                onEdit(e)
              }}
            >
              <Edit size={14} className="mr-1" />
              Edit
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="h-8 text-destructive border-destructive/30 hover:bg-destructive/10 bg-transparent"
              onClick={(e) => {
                e.stopPropagation()
                onDelete(e)
              }}
            >
              <Trash2 size={14} className="mr-1" />
              Delete
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

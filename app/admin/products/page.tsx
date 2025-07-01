"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import {
  collection,
  query,
  where,
  orderBy,
  getDocs,
  limit,
  startAfter,
  type DocumentData,
  type QueryDocumentSnapshot,
} from "firebase/firestore"
import { db } from "@/lib/firebase"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  MoreVertical,
  Plus,
  Search,
  Eye,
  Edit,
  Trash2,
  Loader2,
  ChevronLeft,
  ChevronRight,
  MapPin,
  PackageIcon,
} from "lucide-react"
import Image from "next/image"
import { useToast } from "@/components/ui/use-toast"
import { DeleteConfirmationDialog } from "@/components/delete-confirmation-dialog"
import { softDeleteProduct, type Product } from "@/lib/firebase-service"
import { format } from "date-fns"
import { useAuth } from "@/contexts/auth-context"

// Number of items to display per page
const ITEMS_PER_PAGE = 10

export default function ProductsPage() {
  const { user } = useAuth()
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [productToDelete, setProductToDelete] = useState<Product | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [typeFilter, setTypeFilter] = useState("all")

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

  const router = useRouter()
  const { toast } = useToast()

  // Fetch total count of products
  const fetchTotalCount = async () => {
    setLoadingCount(true)
    try {
      const productsRef = collection(db, "products")
      let q = productsRef

      if (searchTerm) {
        q = query(q, where("name", ">=", searchTerm), where("name", "<=", searchTerm + "\uf8ff"))
      }
      if (statusFilter !== "all") {
        q = query(q, where("status", "==", statusFilter))
      }
      if (typeFilter !== "all") {
        q = query(q, where("type", "==", typeFilter))
      }

      const snapshot = await getDocs(q)
      setTotalItems(snapshot.size)
      setTotalPages(Math.max(1, Math.ceil(snapshot.size / ITEMS_PER_PAGE)))
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
  }

  // Fetch products for the current page
  const fetchProducts = async (page: number) => {
    setLoading(true)
    try {
      // Check if we have this page in cache
      const cacheKey = `${page}-${searchTerm}-${statusFilter}-${typeFilter}`
      if (pageCache.has(page)) {
        const cachedData = pageCache.get(page)!
        setProducts(cachedData.items)
        setLastDoc(cachedData.lastDoc)
        setLoading(false)
        return
      }

      const isFirstPage = page === 1
      setLoading(isFirstPage)
      setLoadingMore(!isFirstPage)

      const productsRef = collection(db, "products")
      let q = query(productsRef, orderBy("created", "desc"))

      if (searchTerm) {
        q = query(q, where("name", ">=", searchTerm), where("name", "<=", searchTerm + "\uf8ff"))
      }
      if (statusFilter !== "all") {
        q = query(q, where("status", "==", statusFilter))
      }
      if (typeFilter !== "all") {
        q = query(q, where("type", "==", typeFilter))
      }

      // For the first page, start from the beginning
      // For subsequent pages, use the last document from the previous page
      const startDoc = isFirstPage ? null : lastDoc

      if (startDoc) {
        q = query(q, startAfter(startDoc))
      }
      q = query(q, limit(ITEMS_PER_PAGE))

      const querySnapshot = await getDocs(q)
      const fetchedProducts: Product[] = []
      querySnapshot.forEach((doc) => {
        fetchedProducts.push({ id: doc.id, ...doc.data() } as Product)
      })

      setProducts(fetchedProducts)
      setLastDoc(querySnapshot.docs[querySnapshot.docs.length - 1] || null)
      setHasMore(fetchedProducts.length === ITEMS_PER_PAGE)

      // Cache this page
      setPageCache((prev) => {
        const newCache = new Map(prev)
        newCache.set(page, {
          items: fetchedProducts,
          lastDoc: querySnapshot.docs[querySnapshot.docs.length - 1] || null,
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
  }

  // Load initial data and count
  useEffect(() => {
    fetchProducts(1)
    fetchTotalCount()
  }, [searchTerm, statusFilter, typeFilter]) // Re-fetch on filter/search change

  // Load data when page changes
  useEffect(() => {
    if (currentPage > 0) {
      fetchProducts(currentPage)
    }
  }, [currentPage])

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
  const handleDeleteClick = (product: Product) => {
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
    } finally {
      setDeleteDialogOpen(false)
      setProductToDelete(null)
    }
  }

  // Handle edit click
  const handleEditClick = (productId: string) => {
    router.push(`/admin/inventory/edit/${productId}`)
  }

  // Handle view details click
  const handleViewDetails = (productId: string) => {
    router.push(`/admin/inventory/${productId}`)
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800 border-green-200"
      case "inactive":
        return "bg-red-100 text-red-800 border-red-200"
      default:
        return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  return (
    <div className="flex-1 p-4">
      <div className="flex flex-col gap-3">
        {/* Header with title and actions */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
          <h1 className="text-2xl font-bold">Product Management</h1>
          <Button onClick={() => router.push("/admin/products/create")} className="flex items-center gap-2">
            <Plus size={16} />
            Add New Product
          </Button>
        </div>

        {/* Search and filters */}
        <div className="flex flex-col md:flex-row gap-4">
          <form onSubmit={handleSearch} className="flex w-full md:max-w-sm items-center space-x-2">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search products..."
                className="pl-8"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Button type="submit">Search</Button>
          </form>

          <div className="flex gap-2">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>

            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="rental">Rental</SelectItem>
                <SelectItem value="light">Light</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Loading state */}
        {loading && products.length === 0 ? (
          <div className="flex justify-center items-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <span className="ml-2 text-lg">Loading products...</span>
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 rounded-lg border border-dashed">
            <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
              <PackageIcon size={24} className="text-gray-400" />
            </div>
            <h3 className="text-lg font-medium mb-2">No products found</h3>
            <p className="text-gray-500 mb-4">Add your first product to get started</p>
            <Button onClick={() => router.push("/admin/products/create")}>
              <Plus size={16} className="mr-2" />
              Add Product
            </Button>
          </div>
        ) : (
          <div className="border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[80px]">Image</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead className="hidden md:table-cell">Location</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead className="hidden md:table-cell">Created</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {products.map((product) => (
                  <TableRow key={product.id} className="cursor-pointer hover:bg-gray-50">
                    <TableCell onClick={() => handleViewDetails(product.id)}>
                      <div className="h-12 w-12 bg-gray-200 rounded overflow-hidden relative">
                        {product.media && product.media.length > 0 ? (
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
                        ) : (
                          <div className="h-full w-full flex items-center justify-center bg-gray-100">
                            <MapPin size={16} className="text-gray-400" />
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="font-medium" onClick={() => handleViewDetails(product.id)}>
                      {product.name}
                    </TableCell>
                    <TableCell onClick={() => handleViewDetails(product.id)}>
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
                    <TableCell className="hidden md:table-cell" onClick={() => handleViewDetails(product.id)}>
                      {product.specs_rental?.location || product.light?.location || "Unknown location"}
                    </TableCell>
                    <TableCell onClick={() => handleViewDetails(product.id)}>
                      {product.price ? `₱${Number(product.price).toLocaleString()}` : "Not set"}
                    </TableCell>
                    <TableCell className="hidden md:table-cell" onClick={() => handleViewDetails(product.id)}>
                      {product.created ? format(new Date(product.created), "MMM d, yyyy") : "N/A"}
                    </TableCell>
                    <TableCell onClick={() => handleViewDetails(product.id)}>
                      <Badge variant="outline" className={getStatusBadge(product.status || "inactive")}>
                        {product.status?.charAt(0).toUpperCase() + product.status?.slice(1) || "N/A"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreVertical size={16} />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleViewDetails(product.id)}>
                            <Eye className="mr-2 h-4 w-4" />
                            View Details
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleEditClick(product.id)}>
                            <Edit className="mr-2 h-4 w-4" />
                            Edit Product
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleDeleteClick(product)} className="text-destructive">
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete Product
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
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
          <div className="flex flex-col sm:flex-row justify-between items-center mt-3 gap-4">
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
        description="This product will be permanently removed. This action cannot be undone."
        itemName={productToDelete?.name}
      />
    </div>
  )
}

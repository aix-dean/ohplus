"use client"

import type React from "react"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { useAuth } from "@/contexts/auth-context"
import { useToast } from "@/hooks/use-toast"
import {
  Plus,
  MoreVertical,
  FileText,
  LayoutGrid,
  List,
  Edit,
  Trash2,
  Loader2,
  ChevronLeft,
  ChevronRight,
  Eye,
  Search,
  Clock,
  Play,
  Repeat,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { DeleteConfirmationDialog } from "@/components/delete-confirmation-dialog"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import { getPaginatedUserProducts, getUserProductsCount, softDeleteProduct, type Product } from "@/lib/firebase-service"
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

  // Fetch total count of products
  const fetchTotalCount = useCallback(async () => {
    if (!user?.uid) return

    setLoadingCount(true)
    try {
      const count = await getUserProductsCount(user.uid, searchTerm)
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
  }, [user, toast, searchTerm])

  // Fetch products for the current page
  const fetchProducts = useCallback(
    async (page: number) => {
      if (!user?.uid) return

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

        const result = await getPaginatedUserProducts(user.uid, ITEMS_PER_PAGE, startDoc, searchTerm)

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
    [user, lastDoc, pageCache, toast, searchTerm],
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

  // Handle add new c

  // Use mock data if no products are available from Firebase
  const [useMockData, setUseMockData] = useState(false)

  useEffect(() => {
    if (!loading && products.length === 0 && !user?.uid) {
      setUseMockData(true)
    }
  }, [loading, products, user])

  // Mock data for demonstration when no Firebase data is available
  const mockContent = [
    {
      id: "1",
      title: "Bocaue 11",
      type: "Billboard",
      status: "Published",
      author: "John Smith",
      dateCreated: "2023-05-15",
      dateModified: "2023-06-10",
      thumbnail: "/abstract-geometric-sculpture.png",
      tags: ["Sale", "Summer"],
      dimensions: "14' × 48'",
      duration: "30 days",
      scheduledDates: { start: "2023-06-01", end: "2023-06-30" },
      locations: ["Downtown", "Highway 101"],
      format: "Static Image",
      approvalStatus: "Approved",
      campaignName: "Summer 2023",
      impressions: 45000,
      productId: "NAN20010",
      location: "Bocaue 11",
      operation: "MerryMart",
      displayHealth: "ON",
      cms: {
        start_time: "16:44",
        end_time: "18:44",
        spot_duration: 15,
        loops_per_day: 20,
        spots_per_loop: 5,
      },
    },
    {
      id: "2",
      title: "EDSA Corner Shaw",
      type: "LED Display",
      status: "Draft",
      author: "Sarah Johnson",
      dateCreated: "2023-06-20",
      dateModified: "2023-06-20",
      thumbnail: "/roadside-billboard.png",
      tags: ["Product Launch", "Digital"],
      dimensions: "1920×1080",
      duration: "15s",
      scheduledDates: { start: "Not scheduled", end: "Not scheduled" },
      locations: [],
      format: "Video",
      approvalStatus: "Pending",
      campaignName: "Q3 Launch",
      impressions: 0,
      productId: "LED20011",
      location: "EDSA Corner Shaw",
      operation: "Jollibee Campaign",
      displayHealth: "OFF",
      cms: {
        start_time: "08:00",
        end_time: "22:00",
        spot_duration: 30,
        loops_per_day: 48,
        spots_per_loop: 3,
      },
    },
    {
      id: "3",
      title: "Ayala Triangle",
      type: "LED Display",
      status: "Published",
      author: "Michael Brown",
      dateCreated: "2023-04-01",
      dateModified: "2023-04-15",
      thumbnail: "/led-billboard-1.png",
      tags: ["Holiday", "Promotion"],
      dimensions: "1920×1080",
      duration: "20s",
      scheduledDates: { start: "2023-12-01", end: "2023-12-31" },
      locations: ["Shopping Mall", "City Center"],
      format: "HTML Animation",
      approvalStatus: "Approved",
      campaignName: "Holiday 2023",
      impressions: 28500,
      productId: "AYA30001",
      location: "Ayala Triangle",
      operation: "Samsung Promo",
      displayHealth: "ON",
      cms: {
        start_time: "06:00",
        end_time: "24:00",
        spot_duration: 20,
        loops_per_day: 72,
        spots_per_loop: 4,
      },
    },
    {
      id: "4",
      title: "BGC Central Square",
      type: "Billboard",
      status: "Review",
      author: "Emily Davis",
      dateCreated: "2023-05-10",
      dateModified: "2023-06-05",
      thumbnail: "/led-billboard-2.png",
      tags: ["Brand", "Awareness"],
      dimensions: "10' × 30'",
      duration: "45 days",
      scheduledDates: { start: "2023-07-01", end: "2023-08-15" },
      locations: ["Airport", "Train Station"],
      format: "Static Image",
      approvalStatus: "In Review",
      campaignName: "Brand Expansion",
      impressions: 0,
      productId: "BGC40001",
      location: "BGC Central Square",
      operation: "Nike Campaign",
      displayHealth: "ON",
      cms: {
        start_time: "07:00",
        end_time: "23:00",
        spot_duration: 25,
        loops_per_day: 32,
        spots_per_loop: 6,
      },
    },
  ]

  // Map products to content format for display
  const content = useMockData ? mockContent : products.map(mapProductToContent)

  return (
    <div className="flex-1 p-4">
      <div className="flex flex-col gap-3">
        {/* Header with title and actions */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
          <h1 className="text-2xl font-bold">
            {userData?.first_name
  ? `${userData.first_name.charAt(0).toUpperCase()}${userData.first_name.slice(1).toLowerCase()}'s Dashboard`
  : "Logistics Dashboard"}
          </h1>
        </div>

        {/* Screen Analytics Monitoring */}
        {!loading && (
          <>
            <Separator className="my-3" />
          </>
        )}

        {/* Search and controls */}
        {!loading && !useMockData && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-4">
            <form onSubmit={handleSearch} className="flex w-full sm:w-auto items-center space-x-2">
              <div className="relative flex-1">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Search content..."
                  className="pl-8 w-full sm:w-[250px]"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <Button type="submit" size="sm">
                Search
              </Button>
            </form>
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
            </div>
          </div>
        )}

        {/* Loading state */}
        {loading && (
          <div className="flex justify-center items-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <span className="ml-2 text-lg">Loading content...</span>
          </div>
        )}

        {/* Empty state */}
        {!loading && content.length === 0 && (
          <div className="text-center py-12 bg-gray-50 rounded-lg border border-dashed">
            <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
              <FileText size={24} className="text-gray-400" />
            </div>
            <h3 className="text-lg font-medium mb-2">No content yet</h3>
            <p className="text-gray-500 mb-4">Add your first content item to get started</p>
            <Button>
              <Plus size={16} className="mr-2" />
              Add Content
            </Button>
          </div>
        )}

        {/* Grid View */}
        {!loading && content.length > 0 && viewMode === "grid" && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
            {content.map((item) => (
              <ContentCard
                key={item.id}
                content={item}
                onView={() => handleViewDetails(item.id)}
                onEdit={(e) => handleEditClick(useMockData ? item : products.find((p) => p.id === item.id)!, e)}
                onDelete={(e) => handleDeleteClick(useMockData ? item : products.find((p) => p.id === item.id)!, e)}
              />
            ))}
          </div>
        )}

        {/* List View */}
        {!loading && content.length > 0 && viewMode === "list" && (
          <div className="border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[80px]">Thumbnail</TableHead>
                  <TableHead>Title</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Last Modified</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {content.map((item) => (
                  <TableRow
                    key={item.id}
                    className="cursor-pointer hover:bg-gray-50"
                    onClick={() => handleViewDetails(item.id)}
                  >
                    <TableCell>
                      <div className="h-12 w-12 bg-gray-200 rounded overflow-hidden relative">
                        <Image
                          src={item.thumbnail || "/placeholder.svg"}
                          alt={item.title || "Content thumbnail"}
                          width={48}
                          height={48}
                          className="h-full w-full object-cover"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement
                            target.src = "/abstract-geometric-sculpture.png"
                            target.className = "opacity-50"
                          }}
                        />
                      </div>
                    </TableCell>
                    <TableCell className="font-medium">{item.title}</TableCell>
                    <TableCell>{item.type}</TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={`${
                          item.status === "Published"
                            ? "bg-green-50 text-green-700 border-green-200"
                            : item.status === "Draft"
                              ? "bg-blue-50 text-blue-700 border-blue-200"
                              : "bg-amber-50 text-amber-700 border-amber-200"
                        }`}
                      >
                        {item.status}
                      </Badge>
                    </TableCell>
                    <TableCell>{item.dateModified}</TableCell>
                    <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={(e) =>
                            handleEditClick(useMockData ? item : products.find((p) => p.id === item.id)!, e)
                          }
                        >
                          <Edit size={16} />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive"
                          onClick={(e) =>
                            handleDeleteClick(useMockData ? item : products.find((p) => p.id === item.id)!, e)
                          }
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
        {!loading && content.length > 0 && (
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
        title="Delete Content"
        description="This content will be permanently removed. This action cannot be undone."
        itemName={productToDelete?.name}
      />
    </div>
  )
}

// Content Card Component for Grid View
function ContentCard({
  content,
  onView,
  onEdit,
  onDelete,
}: {
  content: any
  onView: () => void
  onEdit: (e: React.MouseEvent) => void
  onDelete: (e: React.MouseEvent) => void
}) {
  return (
    <Card
      className="overflow-hidden cursor-pointer transition-all border border-gray-300 shadow-sm hover:shadow-md rounded-lg bg-white"
      onClick={onView}
    >
      <div className="h-32 bg-gray-200 relative">
        <Image
          src={content.thumbnail || "/placeholder.svg"}
          alt={content.title || "Content thumbnail"}
          fill
          className="object-cover"
          onError={(e) => {
            const target = e.target as HTMLImageElement
            target.src = "/abstract-geometric-sculpture.png"
            target.className = "opacity-50 object-contain"
          }}
        />

        {/* Status Badge - positioned at bottom left of image */}
        <div className="absolute bottom-2 left-2 z-10">
          <Badge
            className={`${
              content.status === "Published"
                ? "bg-blue-500 text-white border-0 font-medium px-3 py-1"
                : content.status === "Draft"
                  ? "bg-orange-500 text-white border-0 font-medium px-3 py-1"
                  : "bg-gray-500 text-white border-0 font-medium px-3 py-1"
            }`}
          >
            {content.status === "Published" ? "OCCUPIED" : content.status.toUpperCase()}
          </Badge>
        </div>

        {/* Action Menu - top right */}
        <div className="absolute top-2 right-2 z-10" onClick={(e) => e.stopPropagation()}>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="secondary"
                size="icon"
                className="h-7 w-7 bg-white/90 backdrop-blur-sm border-0 shadow-sm"
              >
                <MoreVertical size={14} />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={onView}>
                <Eye className="mr-2 h-4 w-4" />
                View Details
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onEdit}>
                <Edit className="mr-2 h-4 w-4" />
                Edit Content
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onDelete} className="text-destructive">
                <Trash2 className="mr-2 h-4 w-4" />
                Delete Content
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <CardContent className="p-3">
        <div className="flex flex-col space-y-2">
          {/* Title/Location */}
          <h3 className="text-base font-semibold text-gray-900">{content.title}</h3>

          {/* Location Info */}
          <div className="text-sm text-gray-700">
            <div className="flex items-center gap-1 mb-1 line-clamp-1">
              <span>{content.location}</span>
            </div>
          </div>

          {/* CMS Schedule Info */}
          {content.cms && (
            <div className="mt-2 pt-2 border-t border-gray-100">
              <div className="grid grid-cols-2 gap-2 text-xs text-gray-600">
                <div className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  <span>
                    {content.cms.start_time} - {content.cms.end_time}
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <Play className="h-3 w-3" />
                  <span>{content.cms.spot_duration}s spots</span>
                </div>
                <div className="flex items-center gap-1">
                  <Repeat className="h-3 w-3" />
                  <span>{content.cms.loops_per_day} loops/day</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-xs">•</span>
                  <span>{content.cms.spots_per_loop} spots/loop</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

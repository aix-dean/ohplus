"use client"

import { Input } from "@/components/ui/input"

import type React from "react"
import Link from "next/link"
import { Search, ChevronDown, Plus, Eye, MessageSquare, DollarSign, Calendar } from "lucide-react"
import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { useAuth } from "@/contexts/auth-context"
import { useToast } from "@/hooks/use-toast"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { CartesianGrid, XAxis, YAxis, Line, LineChart } from "recharts"
import { ResponsiveTable } from "@/components/responsive-table"
import { Badge } from "@/components/ui/badge"
import { getPaginatedUserProducts, getUserProductsCount, softDeleteProduct, type Product } from "@/lib/firebase-service"
import type { DocumentData, QueryDocumentSnapshot } from "firebase/firestore"

// Sample Data for Charts and Tables
const contentPerformanceData = [
  { month: "Jan", views: 1200, engagements: 800 },
  { month: "Feb", views: 1500, engagements: 950 },
  { month: "Mar", views: 1300, engagements: 850 },
  { month: "Apr", views: 1800, engagements: 1100 },
  { month: "May", views: 1600, engagements: 1000 },
  { month: "Jun", views: 1900, engagements: 1200 },
]

const recentOrdersData = [
  { id: "ORD001", client: "Acme Corp", campaign: "Summer Sale", status: "Pending", amount: 15000, date: "2024-06-28" },
  {
    id: "ORD002",
    client: "Globex Inc.",
    campaign: "Brand Launch",
    status: "Completed",
    amount: 25000,
    date: "2024-06-25",
  },
  {
    id: "ORD003",
    client: "Soylent Corp",
    campaign: "Holiday Promo",
    status: "Cancelled",
    amount: 10000,
    date: "2024-06-20",
  },
  { id: "ORD004", client: "Initech", campaign: "Q3 Campaign", status: "Pending", amount: 18000, date: "2024-06-18" },
]

const upcomingContentData = [
  { id: "CON001", title: "New Product Showcase", type: "Video Ad", status: "Draft", dueDate: "2024-07-15" },
  {
    id: "CON002",
    title: "Client Testimonial Series",
    type: "Social Media",
    status: "In Review",
    dueDate: "2024-07-20",
  },
  { id: "CON003", title: "Industry Whitepaper", type: "Document", status: "Approved", dueDate: "2024-07-30" },
]

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
  }
}

const orderColumns = [
  {
    header: "Order ID",
    accessorKey: "id",
    cell: (info: any) => (
      <Link href={`/cms/details/${info.getValue()}`} className="text-blue-600 hover:underline">
        {info.getValue()}
      </Link>
    ),
  },
  { header: "Client", accessorKey: "client" },
  { header: "Campaign", accessorKey: "campaign" },
  {
    header: "Status",
    accessorKey: "status",
    cell: (info: any) => (
      <Badge
        variant={
          info.getValue() === "Completed" ? "default" : info.getValue() === "Pending" ? "secondary" : "destructive"
        }
      >
        {info.getValue()}
      </Badge>
    ),
  },
  { header: "Amount", accessorKey: "amount", cell: (info: any) => `$${info.getValue().toLocaleString()}` },
  { header: "Date", accessorKey: "date" },
]

const upcomingContentColumns = [
  {
    header: "Title",
    accessorKey: "title",
    cell: (info: any) => (
      <Link href={`/cms/details/${info.row.original.id}`} className="text-blue-600 hover:underline">
        {info.getValue()}
      </Link>
    ),
  },
  { header: "Type", accessorKey: "type" },
  {
    header: "Status",
    accessorKey: "status",
    cell: (info: any) => (
      <Badge
        variant={info.getValue() === "Approved" ? "default" : info.getValue() === "In Review" ? "secondary" : "outline"}
      >
        {info.getValue()}
      </Badge>
    ),
  },
  { header: "Due Date", accessorKey: "dueDate" },
]

export default function CMSDashboardPage() {
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [productToDelete, setProductToDelete] = useState<Product | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedDateRange, setSelectedDateRange] = useState("Last 30 Days")

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
    router.push(`/cms/content/edit/${product.id}`)
  }

  // Handle view details click
  const handleViewDetails = (productId: string) => {
    router.push(`/cms/details/${productId}`)
  }

  // Handle add new content
  const handleAddContent = () => {
    router.push("/cms/content/new")
  }

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
      title: "Summer Sale Billboard",
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
    },
    {
      id: "2",
      title: "New Product Launch",
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
    },
    {
      id: "3",
      title: "Holiday Special Promotion",
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
    },
    {
      id: "4",
      title: "Brand Awareness Campaign",
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
    },
  ]

  // Map products to content format for display
  const content = useMockData ? mockContent : products.map(mapProductToContent)

  return (
    <div className="flex-1 p-4 md:p-6">
      <div className="flex flex-col gap-6">
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <h1 className="text-xl md:text-2xl font-bold">CMS Dashboard</h1>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <div className="relative flex-grow">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search content or orders..."
                className="w-full rounded-lg bg-background pl-8"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="flex items-center gap-2 bg-transparent">
                  {selectedDateRange} <ChevronDown className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setSelectedDateRange("Last 7 Days")}>Last 7 Days</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setSelectedDateRange("Last 30 Days")}>Last 30 Days</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setSelectedDateRange("Last 90 Days")}>Last 90 Days</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setSelectedDateRange("This Year")}>This Year</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <Button size="sm" asChild>
              <Link href="/cms/planner">
                <Plus className="mr-2 h-4 w-4" /> New Content
              </Link>
            </Button>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Views</CardTitle>
              <Eye className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">7,500</div>
              <p className="text-xs text-muted-foreground">+15.5% from last month</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Engagements</CardTitle>
              <MessageSquare className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">4,800</div>
              <p className="text-xs text-muted-foreground">+10.2% from last month</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Revenue Generated</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">$75,000</div>
              <p className="text-xs text-muted-foreground">+8.1% from last month</p>
            </CardContent>
          </Card>
        </div>

        {/* Screen Analytics Monitoring */}
        {!loading && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
              <Card
                className="bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-shadow cursor-pointer"
                onClick={handleNavigateToActiveScreens}
              >
                <CardContent className="p-3">
                  <div className="flex justify-between items-start gap-2">
                    <div>
                      <p className="text-sm font-medium text-gray-500">Active Screens</p>
                      <h3 className="text-2xl font-bold">42</h3>
                    </div>
                    <div className="bg-green-100 p-1.5 rounded-full">
                      <Eye className="h-4 w-4 text-green-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card
                className="bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-shadow cursor-pointer"
                onClick={handleNavigateToInactiveScreens}
              >
                <CardContent className="p-3">
                  <div className="flex justify-between items-start gap-2">
                    <div>
                      <p className="text-sm font-medium text-gray-500">Inactive Screens</p>
                      <h3 className="text-2xl font-bold">1,284</h3>
                    </div>
                    <div className="bg-blue-100 p-1.5 rounded-full">
                      <Calendar className="h-4 w-4 text-blue-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card
                className="bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-shadow cursor-pointer"
                onClick={handleNavigateToWarnings}
              >
                <CardContent className="p-3">
                  <div className="flex justify-between items-start gap-2">
                    <div>
                      <p className="text-sm font-medium text-gray-500">Warnings</p>
                      <h3 className="text-2xl font-bold">3</h3>
                    </div>
                    <div className="bg-amber-100 p-1.5 rounded-full">
                      <MessageSquare className="h-4 w-4 text-amber-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card
                className="bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-shadow cursor-pointer"
                onClick={handleNavigateToOrders}
              >
                <CardContent className="p-3">
                  <div className="flex justify-between items-start gap-2">
                    <div>
                      <p className="text-sm font-medium text-gray-500">Pending Orders</p>
                      <h3 className="text-2xl font-bold">7</h3>
                    </div>
                    <div className="bg-purple-100 p-1.5 rounded-full">
                      <Calendar className="h-4 w-4 text-purple-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </>
        )}

        {/* Content Performance Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Content Performance</CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer
              config={{
                views: { label: "Views", color: "hsl(var(--primary))" },
                engagements: { label: "Engagements", color: "hsl(var(--secondary))" },
              }}
              className="aspect-auto h-[300px] w-full"
            >
              <LineChart data={contentPerformanceData}>
                <CartesianGrid vertical={false} />
                <XAxis dataKey="month" tickLine={false} tickMargin={10} axisLine={false} />
                <YAxis tickLine={false} tickMargin={10} axisLine={false} />
                <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
                <Line type="monotone" dataKey="views" stroke="var(--color-views)" strokeWidth={2} dot={{ r: 6 }} />
                <Line
                  type="monotone"
                  dataKey="engagements"
                  stroke="var(--color-engagements)"
                  strokeWidth={2}
                  dot={{ r: 6 }}
                />
              </LineChart>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* Recent Orders and Upcoming Content */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Recent Orders</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveTable data={recentOrdersData} columns={orderColumns} />
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Upcoming Content</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveTable data={upcomingContentData} columns={upcomingContentColumns} />
            </CardContent>
          </Card>
        </div>

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
                  {/* Grid Icon */}
                </Button>
                <Button
                  variant={viewMode === "list" ? "default" : "ghost"}
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => setViewMode("list")}
                >
                  {/* List Icon */}
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Loading state */}
        {loading && (
          <div className="flex justify-center items-center py-12">
            {/* Loader Icon */}
            <span className="ml-2 text-lg">Loading content...</span>
          </div>
        )}

        {/* Empty state */}
        {!loading && content.length === 0 && (
          <div className="text-center py-12 bg-gray-50 rounded-lg border border-dashed">
            <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
              {/* File Text Icon */}
            </div>
            <h3 className="text-lg font-medium mb-2">No content yet</h3>
            <p className="text-gray-500 mb-4">Add your first content item to get started</p>
            <Button onClick={handleAddContent}>
              {/* Plus Icon */}
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
          <div className="border rounded-lg overflow-hidden">{/* Table Component */}</div>
        )}

        {/* Loading More Indicator */}
        {loadingMore && (
          <div className="flex justify-center my-4">
            <div className="flex items-center gap-2">
              {/* Loader Icon */}
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
                  {/* Loader Icon */}
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
                {/* Chevron Left Icon */}
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
                {/* Chevron Right Icon */}
              </Button>
            </div>
          </div>
        )}
      </div>
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
    <div
      className="overflow-hidden cursor-pointer transition-all border border-gray-200 shadow-sm hover:shadow-md"
      onClick={onView}
    >
      <div className="h-48 bg-gray-200 relative">
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

        {/* Status Badge */}
        <div className="absolute top-2 left-2 z-10">
          <Badge
            variant="outline"
            className={`${
              content.status === "Published"
                ? "bg-green-50 text-green-700 border-green-200"
                : content.status === "Draft"
                  ? "bg-blue-50 text-blue-700 border-blue-200"
                  : "bg-amber-50 text-amber-700 border-amber-200"
            }`}
          >
            {content.status}
          </Badge>
        </div>

        <div className="absolute top-2 right-2 z-10" onClick={(e) => e.stopPropagation()}>
          {/* Dropdown Menu Component */}
        </div>
      </div>

      <div className="p-4">
        <div className="flex flex-col">
          <h3 className="text-lg font-semibold line-clamp-1 mb-1">{content.title}</h3>
          <p className="text-sm text-gray-500 mb-2 flex items-center gap-1">
            {/* Map Pin Icon */}
            <span>Edsa corner Aurora Blvd.</span>
          </p>

          <div className="grid grid-cols-2 gap-x-4 gap-y-2 mt-2 text-sm">
            <div className="flex items-center gap-1 text-gray-600">
              {/* Monitor Icon */}
              <span>{content.dimensions}</span>
            </div>

            <div className="flex items-center gap-1 text-gray-600">
              {/* Clock Icon */}
              <span>{content.duration}</span>
            </div>

            <div className="flex items-center gap-1 text-gray-600">
              {/* File Text Icon */}
              <span>{content.format}</span>
            </div>

            <div className="flex items-center gap-1 text-gray-600">
              <Badge variant="outline" className="h-5 px-1.5 text-xs">
                {content.approvalStatus}
              </Badge>
            </div>
          </div>

          <div className="mt-3 pt-3 border-t border-gray-100">
            <div className="flex justify-between items-center text-xs text-gray-500">
              <span>Campaign: {content.campaignName}</span>
              <span>Modified: {content.dateModified}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

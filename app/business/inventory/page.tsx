"use client"

import type React from "react"
import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Loader2, Plus, MapPin, ChevronLeft, ChevronRight, Search, List, Grid3X3, Upload } from "lucide-react"
import { getPaginatedUserProducts, getUserProductsCount, softDeleteProduct, createProduct, uploadFileToFirebaseStorage, type Product } from "@/lib/firebase-service"
import type { DocumentData, QueryDocumentSnapshot } from "firebase/firestore"
import { toast } from "@/components/ui/use-toast"
import { useResponsive } from "@/hooks/use-responsive"
import { ResponsiveCardGrid } from "@/components/responsive-card-grid"
import { DeleteConfirmationDialog } from "@/components/delete-confirmation-dialog"
import { CompanyRegistrationDialog } from "@/components/company-registration-dialog"
import { CompanyUpdateDialog } from "@/components/company-update-dialog"
import { CompanyService } from "@/lib/company-service"
import Image from "next/image"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog"
import { subscriptionService } from "@/lib/subscription-service"
import { RouteProtection } from "@/components/route-protection"
import { GooglePlacesAutocomplete } from "@/components/google-places-autocomplete"

// Number of items to display per page
const ITEMS_PER_PAGE = 12

export default function BusinessInventoryPage() {
  const router = useRouter()
  const { user, userData, subscriptionData, refreshUserData } = useAuth()
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [productToDelete, setProductToDelete] = useState<Product | null>(null)
  const { isMobile, isTablet } = useResponsive()

  // Company registration dialog state
  const [showCompanyDialog, setShowCompanyDialog] = useState(false)

  // Company update dialog state
  const [showCompanyUpdateDialog, setShowCompanyUpdateDialog] = useState(false)

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

  // Search and view mode state
  const [searchQuery, setSearchQuery] = useState("")
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")

  // Subscription limit dialog state
  const [showSubscriptionLimitDialog, setShowSubscriptionLimitDialog] = useState(false)
  const [subscriptionLimitMessage, setSubscriptionLimitMessage] = useState("")

  // Add site dialog state
  const [showAddSiteDialog, setShowAddSiteDialog] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Form state
  const [siteType, setSiteType] = useState<"static" | "digital">("static")
  const [category, setCategory] = useState("LED")
  const [siteName, setSiteName] = useState("")
  const [location, setLocation] = useState("")
  const [locationLabel, setLocationLabel] = useState("")
  const [height, setHeight] = useState("")
  const [width, setWidth] = useState("")
  const [dimensionUnit, setDimensionUnit] = useState<"ft" | "m">("ft")
  const [elevation, setElevation] = useState("")
  const [elevationUnit, setElevationUnit] = useState<"ft" | "m">("ft")
  const [description, setDescription] = useState("")
  const [selectedAudience, setSelectedAudience] = useState<string[]>([])
  const [dailyTraffic, setDailyTraffic] = useState("")
  const [trafficUnit, setTrafficUnit] = useState<"daily" | "weekly" | "monthly">("monthly")
  const [price, setPrice] = useState("")
  const [priceUnit, setPriceUnit] = useState<"per spot" | "per day" | "per month">("per spot")
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([])
  const [currentImageIndex, setCurrentImageIndex] = useState(0)

  // Fetch total count of products
  const fetchTotalCount = useCallback(async () => {
    if (!userData?.company_id) {
      setTotalItems(0)
      setTotalPages(1)
      setLoadingCount(false)
      return
    }

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
      if (!userData?.company_id) {
        setProducts([])
        setLastDoc(null)
        setHasMore(false)
        setLoading(false)
        setLoadingMore(false)
        return
      }

      // Check if we have this page in cache
      if (pageCache.has(page)) {
        const cachedData = pageCache.get(page)!
        setProducts(cachedData.items)
        setLastDoc(cachedData.lastDoc)
        setLoading(false)
        setLoadingMore(false)
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
          description: "Failed to load products. Please try again.",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
        setLoadingMore(false)
      }
    },
    [userData?.company_id, lastDoc, pageCache, toast],
  )

  // Load initial data and count
  useEffect(() => {
    fetchProducts(1)
    fetchTotalCount()
  }, [userData?.company_id, fetchProducts, fetchTotalCount])

  // Load data when page changes
  useEffect(() => {
    if (currentPage > 0) {
      fetchProducts(currentPage)
    }
  }, [currentPage, fetchProducts])

  // Update price unit based on site type
  useEffect(() => {
    if (siteType === "static") {
      setPriceUnit("per month")
    } else if (siteType === "digital") {
      setPriceUnit("per spot")
    }
  }, [siteType])

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
    if (!productToDelete || !productToDelete.id) return

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

  const handleEditClick = (product: Product, e: React.MouseEvent) => {
    e.stopPropagation()
    router.push(`/business/inventory/edit/${product.id}`)
  }

  const handleViewDetails = (productId: string) => {
    router.push(`/business/inventory/${productId}`)
  }

  const handleAddSiteClick = async () => {
    console.log("handleAddSiteClick: Starting subscription check")
    console.log("userData:", { company_id: userData?.company_id, license_key: userData?.license_key })

    // Check if user has company_id first
    if (!userData?.company_id) {
      console.log("No company_id found, showing company registration dialog")
      setShowCompanyDialog(true)
      return
    }

    // Check if company information is complete
    try {
      const isCompanyComplete = await CompanyService.isCompanyInfoComplete(userData.company_id)
      if (!isCompanyComplete) {
        console.log("Company information incomplete, showing company update dialog")
        setShowCompanyUpdateDialog(true)
        return
      }
    } catch (error) {
      console.error("Error checking company completeness:", error)
      setSubscriptionLimitMessage("Error checking company information. Please try again or contact support.")
      setShowSubscriptionLimitDialog(true)
      return
    }

    // Query subscription by company ID
    let currentSubscription = null
    try {
      console.log("Fetching subscription for company_id:", userData.company_id)
      currentSubscription = await subscriptionService.getSubscriptionByCompanyId(userData.company_id)
      console.log("Current subscription:", currentSubscription)
    } catch (error) {
      console.error("Error fetching subscription:", error)
      setSubscriptionLimitMessage("Error fetching subscription data. Please try again or contact support.")
      setShowSubscriptionLimitDialog(true)
      return
    }

    // Check if user has license key
    if (!userData?.license_key) {
      console.log("No license key found")
      setSubscriptionLimitMessage("No active license found. Please choose a subscription plan to get started.")
      setShowSubscriptionLimitDialog(true)
      return
    }

    // Check if subscription exists and is active
    if (!currentSubscription) {
      console.log("No subscription found")
      setSubscriptionLimitMessage("No active subscription found. Please choose a plan to start adding sites.")
      setShowSubscriptionLimitDialog(true)
      return
    }

    if (currentSubscription.status !== "active") {
      console.log("Subscription not active, status:", currentSubscription.status)
      setSubscriptionLimitMessage(
        `Your subscription is ${currentSubscription.status}. Please activate your subscription to continue.`,
      )
      setShowSubscriptionLimitDialog(true)
      return
    }

    // Check product limit
    console.log("Checking product limit:", { totalItems, maxProducts: currentSubscription.maxProducts })
    if (totalItems >= currentSubscription.maxProducts) {
      console.log("Product limit reached")
      setSubscriptionLimitMessage(
        `You've reached your plan limit of ${currentSubscription.maxProducts} sites. Upgrade your plan to add more sites.`,
      )
      setShowSubscriptionLimitDialog(true)
      return
    }

    console.log("All checks passed, opening add site dialog")
    setShowAddSiteDialog(true)
  }

  const handleCompanyRegistrationSuccess = async () => {
    console.log("Company registration successful, refreshing user data")
    await refreshUserData()
    setShowCompanyDialog(false)

    // Wait a bit for userData to update
    setTimeout(async () => {
      // Query subscription by company ID after company registration
      let currentSubscription = null
      try {
        if (userData?.company_id) {
          console.log("Fetching subscription after company registration for company_id:", userData.company_id)
          currentSubscription = await subscriptionService.getSubscriptionByCompanyId(userData.company_id)
          console.log("Subscription after company registration:", currentSubscription)
        }
      } catch (error) {
        console.error("Error fetching subscription after company registration:", error)
      }

      // Check subscription after company registration
      if (!userData?.license_key) {
        console.log("No license key after company registration")
        setSubscriptionLimitMessage(
          "Company registered successfully! Now choose a subscription plan to start adding sites.",
        )
        setShowSubscriptionLimitDialog(true)
        return
      }

      if (!currentSubscription) {
        console.log("No subscription found after company registration")
        setSubscriptionLimitMessage(
          "Company registered successfully! Please choose a subscription plan to start adding sites.",
        )
        setShowSubscriptionLimitDialog(true)
        return
      }

      if (currentSubscription.status !== "active") {
        console.log("Subscription not active after company registration, status:", currentSubscription.status)
        setSubscriptionLimitMessage(
          `Company registered successfully! Your subscription is ${currentSubscription.status}. Please activate it to continue.`,
        )
        setShowSubscriptionLimitDialog(true)
        return
      }

      if (totalItems >= currentSubscription.maxProducts) {
        console.log("Product limit reached after company registration")
        setSubscriptionLimitMessage(
          `Company registered successfully! You've reached your plan limit of ${currentSubscription.maxProducts} sites. Upgrade your plan to add more sites.`,
        )
        setShowSubscriptionLimitDialog(true)
        return
      }

      // Only redirect if all subscription checks pass
      console.log("All checks passed after company registration, redirecting to create product")
      router.push("/admin/products/create")
    }, 1000) // Wait 1 second for userData to refresh
  }

  const handleCompanyUpdateSuccess = async () => {
    console.log("Company update successful")
    setShowCompanyUpdateDialog(false)

    // Wait a bit for any updates to propagate
    setTimeout(async () => {
      // Continue with the subscription checks after company update
      let currentSubscription = null
      try {
        if (userData?.company_id) {
          console.log("Fetching subscription after company update for company_id:", userData.company_id)
          currentSubscription = await subscriptionService.getSubscriptionByCompanyId(userData.company_id)
          console.log("Subscription after company update:", currentSubscription)
        }
      } catch (error) {
        console.error("Error fetching subscription after company update:", error)
        setSubscriptionLimitMessage("Error fetching subscription data. Please try again or contact support.")
        setShowSubscriptionLimitDialog(true)
        return
      }

      // Check if user has license key
      if (!userData?.license_key) {
        console.log("No license key found after company update")
        setSubscriptionLimitMessage("No active license found. Please choose a subscription plan to get started.")
        setShowSubscriptionLimitDialog(true)
        return
      }

      // Check if subscription exists and is active
      if (!currentSubscription) {
        console.log("No subscription found after company update")
        setSubscriptionLimitMessage("No active subscription found. Please choose a plan to start adding sites.")
        setShowSubscriptionLimitDialog(true)
        return
      }

      if (currentSubscription.status !== "active") {
        console.log("Subscription not active after company update, status:", currentSubscription.status)
        setSubscriptionLimitMessage(
          `Your subscription is ${currentSubscription.status}. Please activate your subscription to continue.`,
        )
        setShowSubscriptionLimitDialog(true)
        return
      }

      // Check product limit
      console.log("Checking product limit after company update:", { totalItems, maxProducts: currentSubscription.maxProducts })
      if (totalItems >= currentSubscription.maxProducts) {
        console.log("Product limit reached after company update")
        setSubscriptionLimitMessage(
          `You've reached your plan limit of ${currentSubscription.maxProducts} sites. Upgrade your plan to add more sites.`,
        )
        setShowSubscriptionLimitDialog(true)
        return
      }

      // Only open dialog if all checks pass
      console.log("All checks passed after company update, opening add site dialog")
      setShowAddSiteDialog(true)
    }, 500) // Wait 0.5 seconds for updates to propagate
  }

  // Form handlers
  const toggleAudience = (type: string) => {
    setSelectedAudience(prev =>
      prev.includes(type)
        ? prev.filter(t => t !== type)
        : [...prev, type]
    )
  }

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (files) {
      setUploadedFiles(prev => [...prev, ...Array.from(files)])
    }
  }

  const handlePrevImage = () => {
    setCurrentImageIndex(prev => (prev > 0 ? prev - 1 : uploadedFiles.length - 1))
  }

  const handleNextImage = () => {
    setCurrentImageIndex(prev => (prev < uploadedFiles.length - 1 ? prev + 1 : 0))
  }

  const handleRemoveImage = (index: number) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index))
    if (currentImageIndex >= index && currentImageIndex > 0) {
      setCurrentImageIndex(prev => prev - 1)
    }
  }

  const handleSubmit = async () => {
    if (!userData?.company_id || !user?.uid) return

    setIsSubmitting(true)
    try {
      // Upload files to Firebase Storage
      const mediaUrls: Array<{ url: string; distance: string; type: string; isVideo: boolean }> = []
      for (const file of uploadedFiles) {
        const url = await uploadFileToFirebaseStorage(file, `products/${userData.company_id}`)
        mediaUrls.push({
          url,
          distance: "0",
          type: file.type,
          isVideo: file.type.startsWith('video/')
        })
      }

      // Create product data
      const productData: Partial<Product> = {
        name: siteName,
        description,
        price: parseFloat(price) || 0,
        content_type: siteType,
        categories: [category],
        company_id: userData.company_id,
        seller_id: user?.uid,
        seller_name: user?.displayName || user?.email || "",
        specs_rental: {
          audience_types: selectedAudience,
          location,
          traffic_count: parseInt(dailyTraffic) || null,
          height: parseFloat(height) || null,
          width: parseFloat(width) || null,
          elevation: parseFloat(elevation) || null,
          structure: {
            color: null,
            condition: null,
            contractor: null,
            last_maintenance: null,
          },
          illumination: {
            bottom_count: null,
            bottom_lighting_specs: null,
            left_count: null,
            left_lighting_specs: null,
            right_count: null,
            right_lighting_specs: null,
            upper_count: null,
            upper_lighting_specs: null,
            power_consumption_monthly: null,
          },
        },
        media: mediaUrls,
        type: siteType,
        active: true,
      }

      await createProduct(productData)

      // Reset form
      setSiteType("static")
      setCategory("LED")
      setSiteName("")
      setLocation("")
      setLocationLabel("")
      setHeight("")
      setWidth("")
      setDimensionUnit("ft")
      setElevation("")
      setElevationUnit("ft")
      setDescription("")
      setSelectedAudience([])
      setDailyTraffic("")
      setTrafficUnit("monthly")
      setPrice("")
      setPriceUnit("per spot")
      setUploadedFiles([])
      setCurrentImageIndex(0)

      setShowAddSiteDialog(false)

      // Refresh the product list
      fetchProducts(1)
      fetchTotalCount()

      toast({
        title: "Site added successfully",
        description: `${siteName} has been added to your inventory.`,
      })
    } catch (error) {
      console.error("Error creating product:", error)
      toast({
        title: "Error",
        description: "Failed to add site. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  // Show loading only on initial load
  if (loading && products.length === 0 && userData === null) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <RouteProtection requiredRoles="business">
      <main className="flex-1 p-6">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold text-[#333333] mb-4">Inventory</h1>

          <div className="flex items-center justify-between mb-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#a1a1a1] w-4 h-4" />
              <Input placeholder="Search" className="pl-10 w-80 bg-white border-[#d9d9d9]" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
            </div>

            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" onClick={() => setViewMode("list")} className={viewMode === "list" ? "bg-gray-100" : ""}>
                <List className="w-4 h-4 text-[#a1a1a1]" />
              </Button>
              <Button variant="ghost" size="sm" onClick={() => setViewMode("grid")} className={viewMode === "grid" ? "bg-gray-100" : ""}>
                <Grid3X3 className="w-4 h-4 text-[#a1a1a1]" />
              </Button>
            </div>
          </div>

          {/* Inventory Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {loading && products.length === 0
              ? Array.from({ length: 8 }).map((_, index) => (
                  <Card key={`shimmer-${index}`} className="overflow-hidden border border-gray-200 shadow-md rounded-xl">
                    <div className="h-48 bg-gray-200 animate-pulse" />
                    <CardContent className="p-4">
                      <div className="space-y-3">
                        <div className="h-4 bg-gray-200 rounded animate-pulse" />
                        <div className="h-4 bg-gray-200 rounded w-2/3 animate-pulse" />
                        <div className="flex items-center space-x-2">
                          <div className="h-3 w-3 bg-gray-200 rounded animate-pulse" />
                          <div className="h-3 bg-gray-200 rounded w-3/4 animate-pulse" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              : products.map((product) => (
                  <Card
                    key={product.id}
                    className="bg-white border-[#d9d9d9] hover:shadow-md transition-shadow cursor-pointer"
                    onClick={() => product.id && handleViewDetails(product.id)}
                  >
                    <div className="h-48 bg-gray-200 relative">
                      <Image
                        src={
                          product.media && product.media.length > 0
                            ? product.media[0].url
                            : "/abstract-geometric-sculpture.png"
                        }
                        alt={product.name || "Product image"}
                        fill
                        className="object-cover"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement
                          target.src = "/abstract-geometric-sculpture.png"
                          target.className = "opacity-50"
                        }}
                      />
                    </div>

                    <CardContent className="p-4">
                      <div className="flex flex-col">
                        <h3 className="font-semibold line-clamp-1">{product.name}</h3>
                        <div className="mt-2 text-sm font-medium text-green-700">
                          ₱{Number(product.price).toLocaleString()}
                        </div>
                        <div className="mt-1 text-xs text-gray-500 flex items-center">
                          <MapPin size={12} className="mr-1 flex-shrink-0" />
                          <span className="truncate">{product.specs_rental?.location || "Unknown location"}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
          </div>

          {/* Show empty state message when no products and not loading */}
          {!loading && products.length === 0 && userData?.company_id && (
            <div className="text-center py-12">
              <div className="text-gray-500 text-lg mb-2">No sites found</div>
              <div className="text-gray-400 text-sm">Click the "Add Site" button below to create your first site.</div>
            </div>
          )}

          {/* Show company setup message when no company_id */}
          {!loading && !userData?.company_id && (
            <div className="text-center py-12">
              <div className="text-gray-500 text-lg mb-2">Welcome to your inventory!</div>
              <div className="text-gray-400 text-sm">
                Click the "Add Site" button below to set up your company and create your first site.
              </div>
            </div>
          )}

          {/* Pagination Controls - Only show if there are products or multiple pages */}
          {(products.length > 0 || totalPages > 1) && (
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
        </div>
      </main>
      {/* Floating Action Button */}
      <Button
        className="fixed bottom-6 right-6 w-14 h-14 rounded-full bg-[#4169e1] hover:bg-[#1d0beb] shadow-lg"
        size="icon"
        onClick={handleAddSiteClick}
      >
        <Plus className="w-6 h-6" />
      </Button>

      {/* Delete Confirmation Dialog */}
      <DeleteConfirmationDialog
        isOpen={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        onConfirm={handleDeleteConfirm}
        title="Delete Product"
        description="This product will be removed from your inventory. This action cannot be undone."
        itemName={productToDelete?.name}
      />

      {/* Subscription Limit Dialog */}
      <Dialog open={showSubscriptionLimitDialog} onOpenChange={setShowSubscriptionLimitDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>🎯 Let's Get You Started!</DialogTitle>
            <DialogDescription>{subscriptionLimitMessage}</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button onClick={() => router.push("/admin/subscriptions/choose-plan")}>Choose Plan</Button>
            <DialogClose asChild>
              <Button variant="outline">Close</Button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Company Registration Dialog */}
      <CompanyRegistrationDialog
        isOpen={showCompanyDialog}
        onClose={() => setShowCompanyDialog(false)}
        onSuccess={handleCompanyRegistrationSuccess}
      />

      {/* Company Update Dialog */}
      <CompanyUpdateDialog
        isOpen={showCompanyUpdateDialog}
        onClose={() => setShowCompanyUpdateDialog(false)}
        onSuccess={handleCompanyUpdateSuccess}
      />

      {/* Add Site Dialog */}
      <Dialog open={showAddSiteDialog} onOpenChange={setShowAddSiteDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl font-semibold text-[#333333]">+Add site</DialogTitle>
          </DialogHeader>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Left Column */}
            <div className="space-y-6">
              {/* Site Type */}
              <div>
                <Label className="text-[#4e4e4e] font-medium mb-3 block">Site Type:</Label>
                <div className="flex gap-2">
                  <Button
                    variant={siteType === "static" ? "default" : "outline"}
                    onClick={() => setSiteType("static")}
                    className={`flex-1 ${
                      siteType === "static"
                        ? "bg-[#30c71d] hover:bg-[#28a819] text-white border-[#30c71d]"
                        : "bg-white border-[#c4c4c4] text-[#4e4e4e] hover:bg-gray-50"
                    }`}
                  >
                    Static
                  </Button>
                  <Button
                    variant={siteType === "digital" ? "default" : "outline"}
                    onClick={() => setSiteType("digital")}
                    className={`flex-1 ${
                      siteType === "digital"
                        ? "bg-[#30c71d] hover:bg-[#28a819] text-white border-[#30c71d]"
                        : "bg-white border-[#c4c4c4] text-[#4e4e4e] hover:bg-gray-50"
                    }`}
                  >
                    Digital
                  </Button>
                </div>
              </div>

              {/* Category */}
              <div>
                <Label className="text-[#4e4e4e] font-medium mb-3 block">Category:</Label>
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger className="border-[#c4c4c4]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="LED">LED</SelectItem>
                    <SelectItem value="Billboard">Billboard</SelectItem>
                    <SelectItem value="Transit">Transit</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Site Name */}
              <div>
                <Label className="text-[#4e4e4e] font-medium mb-3 block">Site Name:</Label>
                <Input
                  placeholder="Site Name"
                  className="border-[#c4c4c4]"
                  value={siteName}
                  onChange={(e) => setSiteName(e.target.value)}
                />
              </div>

              {/* Location */}
              <div>
                <Label className="text-[#4e4e4e] font-medium mb-3 block">Location:</Label>
                <GooglePlacesAutocomplete
                  value={location}
                  onChange={setLocation}
                  placeholder="Enter street address or search location..."
                  enableMap={true}
                  mapHeight="250px"
                />
              </div>

              {/* Location Label */}
              <div>
                <Label className="text-[#4e4e4e] font-medium mb-3 block">Location Label:</Label>
                <Input
                  className="border-[#c4c4c4]"
                  value={locationLabel}
                  onChange={(e) => setLocationLabel(e.target.value)}
                />
              </div>

              {/* Dimension */}
              <div>
                <Label className="text-[#4e4e4e] font-medium mb-3 block">Dimension:</Label>
                <div className="flex items-center gap-3">
                  <div className="flex-1">
                    <Input
                      placeholder="Height"
                      className="border-[#c4c4c4]"
                      value={height}
                      onChange={(e) => setHeight(e.target.value)}
                    />
                  </div>
                  <span className="text-[#4e4e4e]">x</span>
                  <div className="flex-1">
                    <Input
                      placeholder="Width"
                      className="border-[#c4c4c4]"
                      value={width}
                      onChange={(e) => setWidth(e.target.value)}
                    />
                  </div>
                  <Select value={dimensionUnit} onValueChange={(value: "ft" | "m") => setDimensionUnit(value)}>
                    <SelectTrigger className="w-20 border-[#c4c4c4]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ft">ft</SelectItem>
                      <SelectItem value="m">m</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Elevation from ground */}
              <div>
                <Label className="text-[#4e4e4e] font-medium mb-3 block">
                  Elevation from ground: <span className="text-[#c4c4c4]">(Optional)</span>
                </Label>
                <div className="flex gap-3">
                  <Input
                    className="flex-1 border-[#c4c4c4]"
                    value={elevation}
                    onChange={(e) => setElevation(e.target.value)}
                  />
                  <Select value={elevationUnit} onValueChange={(value: "ft" | "m") => setElevationUnit(value)}>
                    <SelectTrigger className="w-20 border-[#c4c4c4]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ft">ft</SelectItem>
                      <SelectItem value="m">m</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Right Column */}
            <div className="space-y-6">
              {/* Description */}
              <div>
                <Label className="text-[#4e4e4e] font-medium mb-3 block">Description:</Label>
                <Textarea
                  className="min-h-[120px] border-[#c4c4c4] resize-none"
                  placeholder=""
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>

              {/* Audience Type */}
              <div>
                <Label className="text-[#4e4e4e] font-medium mb-3 block">
                  Audience Type: <span className="text-[#c4c4c4]">(can choose multiple)</span>
                </Label>
                <div className="flex gap-2">
                  {["A", "B", "C", "D", "E"].map((type) => (
                    <Button
                      key={type}
                      variant="outline"
                      onClick={() => toggleAudience(type)}
                      className={`w-12 h-10 ${
                        selectedAudience.includes(type)
                          ? "bg-[#30c71d] hover:bg-[#28a819] text-white border-[#30c71d]"
                          : "bg-white border-[#c4c4c4] text-[#4e4e4e] hover:bg-gray-50"
                      }`}
                    >
                      {type}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Daily Traffic */}
              <div>
                <Label className="text-[#4e4e4e] font-medium mb-3 block">Daily Traffic:</Label>
                <div className="flex gap-3">
                  <Input
                    className="flex-1 border-[#c4c4c4]"
                    value={dailyTraffic}
                    onChange={(e) => setDailyTraffic(e.target.value)}
                  />
                  <Select value={trafficUnit} onValueChange={(value: "daily" | "weekly" | "monthly") => setTrafficUnit(value)}>
                    <SelectTrigger className="w-24 border-[#c4c4c4]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="daily">daily</SelectItem>
                      <SelectItem value="weekly">weekly</SelectItem>
                      <SelectItem value="monthly">monthly</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Photo Upload */}
              <div>
                <Label className="text-[#4e4e4e] font-medium mb-3 block">
                  Photo: <span className="text-[#c4c4c4]">(can upload multiple)</span>
                </Label>

                {/* Image Preview/Carousel */}
                {uploadedFiles.length > 0 && (
                  <div className="mb-4">
                    <div className="relative bg-gray-100 rounded-lg overflow-hidden">
                      {/* Main Image Display */}
                      <div className="aspect-video relative">
                        <img
                          src={URL.createObjectURL(uploadedFiles[currentImageIndex])}
                          alt={`Preview ${currentImageIndex + 1}`}
                          className="w-full h-full object-cover"
                        />

                        {/* Remove Button */}
                        <Button
                          variant="destructive"
                          size="sm"
                          className="absolute top-2 right-2 h-8 w-8 p-0"
                          onClick={() => handleRemoveImage(currentImageIndex)}
                        >
                          ×
                        </Button>
                      </div>

                      {/* Navigation Arrows (only show if multiple images) */}
                      {uploadedFiles.length > 1 && (
                        <>
                          <Button
                            variant="secondary"
                            size="sm"
                            className="absolute left-2 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0 bg-white/80 hover:bg-white"
                            onClick={handlePrevImage}
                          >
                            <ChevronLeft className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="secondary"
                            size="sm"
                            className="absolute right-2 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0 bg-white/80 hover:bg-white"
                            onClick={handleNextImage}
                          >
                            <ChevronRight className="h-4 w-4" />
                          </Button>
                        </>
                      )}

                      {/* Image Counter */}
                      <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 bg-black/50 text-white px-2 py-1 rounded text-sm">
                        {currentImageIndex + 1} / {uploadedFiles.length}
                      </div>
                    </div>

                    {/* Thumbnail Strip */}
                    {uploadedFiles.length > 1 && (
                      <div className="flex gap-2 mt-2 overflow-x-auto">
                        {uploadedFiles.map((file, index) => (
                          <button
                            key={index}
                            className={`flex-shrink-0 w-16 h-16 rounded border-2 overflow-hidden ${
                              index === currentImageIndex ? 'border-blue-500' : 'border-gray-300'
                            }`}
                            onClick={() => setCurrentImageIndex(index)}
                          >
                            <img
                              src={URL.createObjectURL(file)}
                              alt={`Thumbnail ${index + 1}`}
                              className="w-full h-full object-cover"
                            />
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Upload Area */}
                <div className="border-2 border-dashed border-[#c4c4c4] rounded-lg p-8 text-center bg-gray-50">
                  <input
                    type="file"
                    multiple
                    accept="image/*,video/*"
                    onChange={handleFileUpload}
                    className="hidden"
                    id="file-upload"
                  />
                  <label htmlFor="file-upload" className="cursor-pointer">
                    <Upload className="w-8 h-8 text-[#c4c4c4] mx-auto mb-2" />
                    <p className="text-[#c4c4c4] font-medium">Upload</p>
                  </label>
                  {uploadedFiles.length === 0 && (
                    <p className="text-sm text-gray-600 mt-2">
                      Click to select images
                    </p>
                  )}
                </div>
              </div>

              {/* Price */}
              <div>
                <Label className="text-[#4e4e4e] font-medium mb-3 block">Price:</Label>
                <div className="flex gap-3">
                  <Input
                    className="flex-1 border-[#c4c4c4]"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                  />
                  <Select value={priceUnit} disabled>
                    <SelectTrigger className="w-28 border-[#c4c4c4] bg-gray-50">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="per spot">per spot</SelectItem>
                      <SelectItem value="per day">per day</SelectItem>
                      <SelectItem value="per month">per month</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-4 mt-8 pt-6 border-t border-[#c4c4c4]">
            <Button
              variant="outline"
              className="px-8 border-[#c4c4c4] text-[#4e4e4e] hover:bg-gray-50 bg-transparent"
              onClick={() => setShowAddSiteDialog(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              className="px-8 bg-[#1d0beb] hover:bg-[#1508d1] text-white"
              onClick={handleSubmit}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  Uploading...
                </>
              ) : (
                "Upload"
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </RouteProtection>
  )
}

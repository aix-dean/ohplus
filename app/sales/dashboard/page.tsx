"use client"
import { useState, useEffect, useCallback, useRef } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { useToast } from "@/hooks/use-toast"
import {
  getPaginatedCompanyProducts,
  getCompanyProductsCount,
  type Product,
  type Booking,
} from "@/lib/firebase-service"
import type { DocumentData, QueryDocumentSnapshot } from "firebase/firestore"
import { collection, query, where, getDocs, Timestamp } from "firebase/firestore"
import { db } from "@/lib/firebase"
import type { SearchResult } from "@/lib/algolia-service"
import { useResponsive } from "@/hooks/use-responsive"
import { useDebounce } from "@/hooks/use-debounce"
import { getPaginatedClients, type Client } from "@/lib/client-service"
import type { ProposalClient } from "@/lib/types/proposal"
// Removed: import { SelectQuotationDialog } from "@/components/select-quotation-dialog"

// Number of items to display per page
const ITEMS_PER_PAGE = 12

// Function to get site code from product
const getSiteCode = (product: Product | null) => {
  if (!product) return null

  // Try different possible locations for site_code
  if (product.site_code) return product.site_code
  if (product.specs_rental && "site_code" in product.specs_rental) return product.specs_rental.site_code
  if (product.light && "site_code" in product.light) return product.light.siteCode

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

  const { user, userData } = useAuth()
  const router = useRouter()
  const { toast } = useToast()

  // Proposal Creation Flow State
  const [selectedProducts, setSelectedProducts] = useState<Product[]>([])
  const [proposalCreationMode, setProposalCreationMode] = useState(false)
  const [selectedClientForProposal, setSelectedClientForProposal] = useState<ProposalClient | null>(null)
  const [isCreatingProposal, setIsCreatingProposal] = useState(false)

  // Client Search/Selection on Dashboard (now for both proposal and CE/Quote)
  const [dashboardClientSearchTerm, setDashboardClientSearchTerm] = useState("")
  const [dashboardClientSearchResults, setDashboardClientSearchResults] = useState<Client[]>([])
  const [isSearchingDashboardClients, setIsSearchingDashboardClients] = useState(false)
  const debouncedDashboardClientSearchTerm = useDebounce(dashboardClientSearchTerm, 500)

  const clientSearchRef = useRef<HTMLDivElement>(null)
  const [isClientDropdownOpen, setIsClientDropdownOpen] = useState(false)
  const [isNewClientDialogOpen, setIsNewClientDialogOpen] = useState(false)

  // CE/Quote mode states
  const [ceQuoteMode, setCeQuoteMode] = useState(false)
  const [selectedSites, setSelectedSites] = useState<Product[]>([])
  const [isDateRangeDialogOpen, setIsDateRangeDialogOpen] = useState(false)
  const [actionAfterDateSelection, setActionAfterDateSelection] = useState<"cost_estimate" | "quotation" | null>(null)
  const [isCreatingDocument, setIsCreatingDocument] = useState(false) // New loading state for document creation
  const [isCollabPartnerDialogOpen, setIsCollabPartnerDialogOpen] = useState(false)

  // Removed: const [isSelectQuotationDialogOpen, setIsSelectQuotationDialogOpen] = useState(false)

  // On mobile, default to grid view
  useEffect(() => {
    if (isMobile) {
      setViewMode("grid")
    }
  }, [isMobile])

  // Fetch clients for dashboard client selection (for proposals and CE/Quote)
  useEffect(() => {
    const fetchClients = async () => {
      if (user?.uid && (proposalCreationMode || ceQuoteMode)) {
        // Ensure user is logged in
        setIsSearchingDashboardClients(true)
        try {
          const result = await getPaginatedClients(10, null, debouncedDashboardClientSearchTerm.trim(), null, user.uid) // Pass user.uid as uploadedByFilter
          setDashboardClientSearchResults(result.items)
        } catch (error) {
          console.error("Error fetching clients for dashboard:", error)
          setDashboardClientSearchResults([])
        } finally {
          setIsSearchingDashboardClients(false)
        }
      } else {
        setDashboardClientSearchResults([])
      }
    }
    fetchClients()
  }, [debouncedDashboardClientSearchTerm, proposalCreationMode, ceQuoteMode, user?.uid]) // Add user.uid to dependencies

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (clientSearchRef.current && !clientSearchRef.current.contains(event.target as Node)) {
        setIsClientDropdownOpen(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [])

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
    if (!userData?.company_id) return

    setLoadingCount(true)
    try {
      const count = await getCompanyProductsCount(userData.company_id, { active: true })
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
  }, [userData?.company_id, toast])

  // Fetch products for the current page
  const fetchProducts = useCallback(
    async (page: number) => {
      if (!userData?.company_id) return

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

        const result = await getPaginatedCompanyProducts(userData.company_id, ITEMS_PER_PAGE, startDoc, { active: true })

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
    [userData?.company_id, lastDoc, pageCache, toast, checkOngoingBookings],
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

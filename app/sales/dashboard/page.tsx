"use client"

import type React from "react"
import { useState, useEffect, useCallback, useRef } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { useAuth } from "@/contexts/auth-context"
import { useToast } from "@/hooks/use-toast"
import {
  MapPin,
  LayoutGrid,
  List,
  Loader2,
  ChevronLeft,
  ChevronRight,
  CalendarIcon,
  CheckCircle2,
  ArrowLeft,
  Filter,
  AlertCircle,
  Search,
  PlusCircle,
  Calculator,
  FileText,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { DeleteConfirmationDialog } from "@/components/delete-confirmation-dialog"
import {
  getPaginatedUserProducts,
  getUserProductsCount,
  softDeleteProduct,
  type Product,
  type Booking,
} from "@/lib/firebase-service"
import type { DocumentData, QueryDocumentSnapshot } from "firebase/firestore"
import { collection, query, where, getDocs, Timestamp } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { SearchBox } from "@/components/search-box"
import type { SearchResult } from "@/lib/algolia-service"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useResponsive } from "@/hooks/use-responsive"
import { ResponsiveCardGrid } from "@/components/responsive-card-grid"
import { cn } from "@/lib/utils"
import { SalesChatWidget } from "@/components/sales-chat/sales-chat-widget"
import { Input } from "@/components/ui/input"
import { useDebounce } from "@/hooks/use-debounce"
import { getPaginatedClients, type Client } from "@/lib/client-service"
import { createProposal } from "@/lib/proposal-service"
import type { ProposalClient } from "@/lib/types/proposal"
import { ProposalHistory } from "@/components/proposal-history"
import { ClientDialog } from "@/components/client-dialog"
import { DateRangeCalendarDialog } from "@/components/date-range-calendar-dialog"
import { createDirectCostEstimate, createMultipleCostEstimates } from "@/lib/cost-estimate-service" // Import createMultipleCostEstimates function
import { Skeleton } from "@/components/ui/skeleton" // Import Skeleton
import { CollabPartnerDialog } from "@/components/collab-partner-dialog"
import { RouteProtection } from "@/components/route-protection"
import { CheckCircle } from "lucide-react"
import { createDirectQuotation, createMultipleQuotations } from "@/lib/quotation-service"
import { CreateReportDialog } from "@/components/create-report-dialog"

// Number of items to display per page
const ITEMS_PER_PAGE = 15

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

  const [createReportDialogOpen, setCreateReportDialogOpen] = useState(false)
  const [selectedProductForReport, setSelectedProductForReport] = useState<string>("")

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
  const [ceMode, setCeMode] = useState(false)
  const [quoteMode, setQuoteMode] = useState(false)
  const [selectedSites, setSelectedSites] = useState<Product[]>([])
  const [isDateRangeDialogOpen, setIsDateRangeDialogOpen] = useState(false)
  const [actionAfterDateSelection, setActionAfterDateSelection] = useState<"cost_estimate" | "quotation" | null>(null)
  const [isCreatingDocument, setIsCreatingDocument] = useState(false) // New loading state for document creation

  const [isCollabPartnerDialogOpen, setIsCollabPartnerDialogOpen] = useState(false)

  const handleCreateReport = (product: Product, e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setSelectedProductForReport(product.id)
    setCreateReportDialogOpen(true)
  }

  const handleCopySitesFromProposal = (sites: Product[]) => {
    // Switch to CE/Quote mode and select the copied sites
    setCeQuoteMode(true)
    setProposalCreationMode(false)
    setSelectedSites(sites)

    // Show success message
    toast({
      title: "Sites Copied",
      description: `${sites.length} site${sites.length === 1 ? "" : "s"} copied and selected.`,
    })
  }

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

        const result = await getPaginatedUserProducts(userData?.company_id, ITEMS_PER_PAGE, startDoc, { active: true })

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
          description: "Failed to load product count. Please try again.",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
        setLoadingMore(false)
      }
    },
    [userData, lastDoc, pageCache, toast, checkOngoingBookings],
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

  // Handle proposal creation flow
  const handleInitiateProposalFlow = () => {
    setProposalCreationMode(true) // Activate the combined client & product selection mode
    setCeQuoteMode(false) // Ensure CE/Quote mode is off
    setSelectedClientForProposal(null) // Reset selected client
    setDashboardClientSearchTerm("") // Clear client search term
    setSelectedProducts([]) // Clear any previously selected products
    setSelectedSites([]) // Clear any previously selected sites
  }

  const handleClientSelectOnDashboard = (client: Client) => {
    setSelectedClientForProposal({
      id: client.id,
      company: client.company || "",
      contactPerson: client.name || "",
      email: client.email || "",
      phone: client.phone || "",
      address: client.address || "",
      industry: client.industry || "",
      designation: client.designation || "", // Add designation field
      targetAudience: "", // These might need to be fetched or added later
      campaignObjective: "", // These might need to be fetched or added later
    })
    setDashboardClientSearchTerm(client.company || client.name || "") // Display selected client in search bar
    toast({
      title: "Client Selected",
      description: `Selected ${client.name} (${client.company}). Now select products.`,
      variant: "success",
    })
    setIsClientDropdownOpen(false) // Close dropdown after selection
  }

  const handleCancelProposalCreationMode = () => {
    setProposalCreationMode(false)
    setSelectedClientForProposal(null)
    setDashboardClientSearchTerm("")
    setDashboardClientSearchResults([])
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

  const handleConfirmProposalCreation = async () => {
    if (!selectedClientForProposal) {
      toast({
        title: "No Client Selected",
        description: "Please select a client first.",
        variant: "destructive",
      })
      return
    }
    if (selectedProducts.length === 0) {
      toast({
        title: "No products selected",
        description: "Please select at least one product for the proposal.",
        variant: "destructive",
      })
      return
    }

    if (!user?.uid || !userData?.company_id) {
      toast({
        title: "Authentication Required",
        description: "Please log in to create a proposal.",
        variant: "destructive",
      })
      return
    }

    setIsCreatingProposal(true) // Set loading state for proposal creation
    try {
      // Generate a simple title for the proposal
      const proposalTitle = `Proposal for ${selectedClientForProposal.company} - ${new Date().toLocaleDateString()}`

      const proposalId = await createProposal(proposalTitle, selectedClientForProposal, selectedProducts, user.uid, {
        // You can add notes or custom messages here if needed
        // notes: "Generated from dashboard selection",
        companyId: userData.company_id, // Add company_id to the proposal creation
        client_company_id: selectedClientForProposal.id, // Add client's company_id
      })

      toast({
        title: "Proposal Created",
        description: "Your proposal has been created successfully.",
      })

      // Redirect to the new proposal's detail page
      router.push(`/sales/proposals/${proposalId}`)

      // Reset the proposal creation mode and selected items
      setProposalCreationMode(false)
      setSelectedProducts([])
      setSelectedClientForProposal(null)
    } catch (error) {
      console.error("Error creating proposal:", error)
      toast({
        title: "Error",
        description: "Failed to create proposal. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsCreatingProposal(false) // Reset loading state
    }
  }

  // Handle CE/Quote mode
  const handleCeQuoteMode = () => {
    setCeQuoteMode(true)
    setProposalCreationMode(false) // Ensure proposal mode is off
    setSelectedSites([])
    setSelectedClientForProposal(null) // Reset selected client
    setDashboardClientSearchTerm("") // Clear client search term
    setSelectedProducts([]) // Clear any previously selected products
  }

  const handleCeMode = () => {
    setCeMode(true)
    setQuoteMode(false)
    setCeQuoteMode(true)
    setProposalCreationMode(false)
    setSelectedSites([])
    setSelectedClientForProposal(null)
    setDashboardClientSearchTerm("")
    setSelectedProducts([])
  }

  const handleQuoteMode = () => {
    setQuoteMode(true)
    setCeMode(false)
    setCeQuoteMode(true)
    setProposalCreationMode(false)
    setSelectedSites([])
    setSelectedClientForProposal(null)
    setDashboardClientSearchTerm("")
    setSelectedProducts([])
  }

  const handleSiteSelect = (product: Product) => {
    setSelectedSites((prev) => {
      const isSelected = prev.some((p) => p.id === product.id)
      if (isSelected) {
        return prev.filter((p) => p.id !== product.id)
      } else {
        return [...prev, product]
      }
    })
  }

  // New functions to open the date range dialog
  const openCreateCostEstimateDateDialog = () => {
    if (selectedSites.length === 0) {
      toast({
        title: "No sites selected",
        description: "Please select at least one site for the cost estimate.",
        variant: "destructive",
      })
      return
    }
    if (!selectedClientForProposal) {
      toast({
        title: "No Client Selected",
        description: "Please select a client first.",
        variant: "destructive",
      })
      return
    }
    setActionAfterDateSelection("cost_estimate")
    setIsDateRangeDialogOpen(true)
  }

  const openCreateQuotationDateDialog = () => {
    if (selectedSites.length === 0) {
      toast({
        title: "No sites selected",
        description: "Please select at least one site for the quotation.",
        variant: "destructive",
      })
      return
    }
    if (!selectedClientForProposal) {
      toast({
        title: "No Client Selected",
        description: "Please select a client first.",
        variant: "destructive",
      })
      return
    }
    setActionAfterDateSelection("quotation")
    setIsDateRangeDialogOpen(true)
  }

  // Callback from DateRangeCalendarDialog - NOW CREATES THE DOCUMENT
  const [isCreatingCostEstimate, setIsCreatingCostEstimate] = useState(false)
  const [showDatePicker, setShowDatePicker] = useState(false)

  const handleDatesSelected = async (startDate: Date, endDate: Date) => {
    console.log("[v0] handleDatesSelected - userData:", userData)
    console.log("[v0] handleDatesSelected - userData.company_id:", userData?.company_id)
    console.log("[v0] handleDatesSelected - user:", user)
    console.log("[v0] handleDatesSelected - actionAfterDateSelection:", actionAfterDateSelection)

    if (!user?.uid || !userData?.company_id) {
      console.log("[v0] handleDatesSelected - Missing auth data:", {
        userUid: user?.uid,
        userDataCompanyId: userData?.company_id,
        userData: userData,
      })
      toast({
        title: "Authentication Required",
        description: `Please log in to create a ${actionAfterDateSelection === "quotation" ? "quotation" : "cost estimate"}.`,
        variant: "destructive",
      })
      return
    }

    if (actionAfterDateSelection === "quotation") {
      // For quotations, check selectedSites
      if (selectedSites.length === 0) {
        toast({
          title: "No Sites Selected",
          description: "Please select at least one site to create a quotation.",
          variant: "destructive",
        })
        return
      }
    } else {
      if (selectedSites.length === 0) {
        toast({
          title: "No Sites Selected",
          description: "Please select at least one site to create a cost estimate.",
          variant: "destructive",
        })
        return
      }
    }

    if (actionAfterDateSelection === "quotation") {
      setIsCreatingDocument(true)
      try {
        const sitesData = selectedSites.map((site) => ({
          id: site.id,
          name: site.name,
          location: site.specs_rental?.location || site.light?.location || "N/A",
          price: site.price || 0,
          type: site.type || "Unknown",
          image: site.media && site.media.length > 0 ? site.media[0].url : undefined,
        }))

        const clientData = {
          id: selectedClientForProposal.id,
          name: selectedClientForProposal.contactPerson,
          email: selectedClientForProposal.email,
          company: selectedClientForProposal.company,
          phone: selectedClientForProposal.phone,
          address: selectedClientForProposal.address,
          designation: selectedClientForProposal.designation,
          industry: selectedClientForProposal.industry,
        }

        const options = {
          startDate,
          endDate,
          company_id: userData.company_id,
          client_company_id: selectedClientForProposal.id, // Add client's company_id
          page_id: selectedSites.length > 1 ? `PAGE-${Date.now()}` : undefined,
          created_by_first_name: userData.first_name,
          created_by_last_name: userData.last_name,
        }

        console.log("[v0] handleDatesSelected - creating quotation with options:", options)

        let quotationIds: string[]

        if (selectedSites.length > 1) {
          // Create multiple quotations for multiple sites
          quotationIds = await createMultipleQuotations(clientData, sitesData, user.uid, options)

          toast({
            title: "Quotations Created",
            description: `Successfully created ${quotationIds.length} quotations for the selected sites.`,
          })
        } else {
          // Create single quotation for one site
          const quotationId = await createDirectQuotation(clientData, sitesData, user.uid, options)
          quotationIds = [quotationId]

          toast({
            title: "Quotation Created",
            description: "Quotation has been created successfully.",
          })
        }

        // Navigate to the first quotation
        router.push(`/sales/quotations/${quotationIds[0]}`)
      } catch (error) {
        console.error("Error creating quotation:", error)
        toast({
          title: "Error",
          description: "Failed to create quotation. Please try again.",
          variant: "destructive",
        })
      } finally {
        setIsCreatingDocument(false)
        setIsDateRangeDialogOpen(false)
      }
      return
    }
    setIsCreatingCostEstimate(true)
    try {
      const sitesData = selectedSites.map((site) => ({
        id: site.id,
        name: site.name,
        location: site.specs_rental?.location || site.light?.location || "N/A",
        price: site.price || 0,
        type: site.type || "Unknown",
        image: site.media && site.media.length > 0 ? site.media[0].url : undefined,
      }))

      const clientData = {
        id: selectedClientForProposal.id,
        name: selectedClientForProposal.contactPerson,
        email: selectedClientForProposal.email,
        company: selectedClientForProposal.company,
        phone: selectedClientForProposal.phone,
        address: selectedClientForProposal.address,
        designation: selectedClientForProposal.designation,
        industry: selectedClientForProposal.industry,
      }

      const options = {
        startDate,
        endDate,
        company_id: userData.company_id,
        client_company_id: selectedClientForProposal.id, // Add client's company_id
        page_id: selectedSites.length > 1 ? `PAGE-${Date.now()}` : undefined,
      }

      console.log("[v0] handleDatesSelected - options being passed:", options)

      let costEstimateIds: string[]

      if (selectedSites.length > 1) {
        // Create multiple cost estimates for multiple sites
        costEstimateIds = await createMultipleCostEstimates(clientData, sitesData, user.uid, options)

        toast({
          title: "Cost Estimates Created",
          description: `Successfully created ${costEstimateIds.length} cost estimates for the selected sites.`,
        })
      } else {
        // Create single cost estimate for one site
        const costEstimateId = await createDirectCostEstimate(clientData, sitesData, user.uid, options)
        costEstimateIds = [costEstimateId]

        toast({
          title: "Cost Estimate Created",
          description: "Cost estimate has been created successfully.",
        })
      }

      // Navigate to the first cost estimate
      router.push(`/sales/cost-estimates/${costEstimateIds[0]}`)
    } catch (error) {
      console.error("Error creating cost estimate:", error)
      toast({
        title: "Error",
        description: "Failed to create cost estimate. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsCreatingCostEstimate(false)
      setShowDatePicker(false)
    }
  }

  const handleSkipDates = async () => {
    console.log("[v0] handleSkipDates - userData:", userData)
    console.log("[v0] handleSkipDates - userData.company_id:", userData?.company_id)
    console.log("[v0] handleSkipDates - user:", user)

    if (!user?.uid || !userData?.company_id) {
      console.log("[v0] handleSkipDates - Missing auth data:", {
        userUid: user?.uid,
        userDataCompanyId: userData?.company_id,
        userData: userData,
      })
      toast({
        title: "Authentication Required",
        description: "Please log in to create a cost estimate.",
        variant: "destructive",
      })
      return
    }

    setIsCreatingDocument(true)
    try {
      if (actionAfterDateSelection === "cost_estimate") {
        const clientData = {
          id: selectedClientForProposal!.id,
          name: selectedClientForProposal!.contactPerson,
          email: selectedClientForProposal!.email,
          company: selectedClientForProposal!.company,
          phone: selectedClientForProposal!.phone,
          address: selectedClientForProposal!.address,
          designation: selectedClientForProposal!.designation,
          industry: selectedClientForProposal!.industry,
        }

        const sitesData = selectedSites.map((site) => ({
          id: site.id,
          name: site.name,
          location: site.specs_rental?.location || site.light?.location || "N/A",
          price: site.price || 0,
          type: site.type || "Unknown",
          image: site.media && site.media.length > 0 ? site.media[0].url : undefined,
        }))

        const options = {
          startDate: undefined,
          endDate: undefined,
          company_id: userData.company_id,
          client_company_id: selectedClientForProposal.id, // Added client_company_id to skip dates options
          page_id: selectedSites.length > 1 ? `PAGE-${Date.now()}` : undefined,
        }

        console.log("[v0] handleSkipDates - options being passed:", options)

        if (selectedSites.length === 1) {
          // Single site - create one document
          const newCostEstimateId = await createDirectCostEstimate(clientData, sitesData, user.uid, options)

          toast({
            title: "Cost Estimate Created",
            description: "Your cost estimate has been created successfully without dates.",
          })
          router.push(`/sales/cost-estimates/${newCostEstimateId}`) // Navigate to view page
        } else {
          // Multiple sites - create separate documents for each site
          const newCostEstimateIds = await createMultipleCostEstimates(clientData, sitesData, user.uid, options)

          toast({
            title: "Cost Estimates Created",
            description: `${newCostEstimateIds.length} cost estimates have been created successfully without dates - one for each selected site.`,
          })

          // Navigate to the first cost estimate
          if (newCostEstimateIds.length > 0) {
            router.push(`/sales/cost-estimates/${newCostEstimateIds[0]}`)
          }
        }
      }
    } catch (error) {
      console.error("Error creating cost estimate:", error)
      toast({
        title: "Error",
        description: "Failed to create cost estimate. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsCreatingDocument(false)
    }
  }

  const handleCancelCeQuote = () => {
    setCeQuoteMode(false)
    setSelectedSites([])
    setSelectedClientForProposal(null)
    setDashboardClientSearchTerm("")
  }

  return (
    <div className="h-screen overflow-hidden flex flex-col">
      {proposalCreationMode && (
        <div className="flex items-center justify-between p-4 pb-2 bg-white border-b border-gray-200 flex-shrink-0">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleCancelProposalCreationMode}
              className="p-1 hover:bg-gray-100"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h2 className="text-lg font-semibold text-gray-900">Select Sites</h2>
          </div>
          <Button
            size="sm"
            className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded-md"
            onClick={() => setIsCollabPartnerDialogOpen(true)}
          >
            + Collab
          </Button>
        </div>
      )}

      {/* Main content area */}
      <div className="flex-1 overflow-hidden">
        {loading ? (
          // Skeleton Loading State
          <div className="flex flex-col gap-5">
            {/* Header Skeleton */}
            <div className="flex justify-between items-center">
              <div>
                <Skeleton className="h-8 w-64 mb-2" />
                <Skeleton className="h-4 w-48" />
              </div>
            </div>

            {/* Search and Actions Bar Skeleton */}
            <div className="flex flex-col sm:flex-row gap-4 justify-between">
              <Skeleton className="h-10 w-full sm:w-96" />
              <div className="flex gap-3">
                <Skeleton className="h-10 w-20" />
                <Skeleton className="h-10 w-20" />
                <Skeleton className="h-10 w-20" />
              </div>
            </div>

            {/* Filters Skeleton (if applicable, otherwise can be removed) */}
            <div className="flex gap-3">
              <Skeleton className="h-9 w-24" />
              <Skeleton className="h-9 w-24" />
              <Skeleton className="h-9 w-32" />
            </div>

            {/* Grid View Skeleton */}
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
        ) : (
          // Actual Dashboard Content
          <div
            className={cn(
              "grid grid-cols-1 gap-6 h-full",
              // Only apply two-column layout when proposalCreationMode is true
              proposalCreationMode && "lg:grid-cols-[1fr_300px]",
            )}
          >
            {/* Left Column: Main Dashboard Content */}
            <div className="flex flex-col gap-1 md:gap-2 h-full overflow-hidden">
              {/* Header with title, actions, and search box */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                <div className="flex flex-col gap-2">
                  {!proposalCreationMode && (
                    <h1 className="text-xl md:text-2xl font-bold">
                      {userData?.first_name
                        ? `${userData.first_name.charAt(0).toUpperCase()}${userData.first_name.slice(1).toLowerCase()}'s Dashboard`
                        : "Dashboard"}
                    </h1>
                  )}
                  {/* Conditionally hide the SearchBox when in proposalCreationMode or ceQuoteMode */}
                  {!(proposalCreationMode || ceQuoteMode) && (
                    <div className="w-full sm:w-64 md:w-80">
                      <SearchBox
                        onSearchResults={handleSearchResults}
                        onSearchError={handleSearchError}
                        onSearchLoading={handleSearchLoading}
                        onSearchClear={handleSearchClear}
                        userId={user?.uid}
                      />
                    </div>
                  )}
                </div>

                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 w-full sm:w-auto mt-2">
                  {/* Proposal Creation Mode Controls (on dashboard) */}
                  {proposalCreationMode && (
                    <div className="flex items-center gap-2 p-2 bg-blue-50 rounded-lg border border-blue-200">
                      <span className="text-sm text-blue-700">
                        {selectedClientForProposal ? (
                          <>
                            Client: <span className="font-semibold">{selectedClientForProposal.company}</span>
                          </>
                        ) : (
                          "Select a client"
                        )}
                        {selectedProducts.length > 0 && `, ${selectedProducts.length} products selected`}
                      </span>
                      <Button size="sm" variant="outline" onClick={handleCancelProposalCreationMode}>
                        Cancel
                      </Button>
                    </div>
                  )}

                  {/* CE/Quote Mode Controls (on dashboard) */}
                  {ceQuoteMode && (
                    <div className="flex items-center gap-2 p-2 bg-blue-50 rounded-lg border border-blue-200">
                      <span className="text-sm text-blue-700">
                        {selectedClientForProposal ? (
                          <>
                            Client: <span className="font-semibold">{selectedClientForProposal.company}</span>
                          </>
                        ) : (
                          "Select a client"
                        )}
                        {selectedSites.length > 0 && `, ${selectedSites.length} sites selected`}
                      </span>
                      <Button size="sm" variant="outline" onClick={handleCancelCeQuote}>
                        Cancel
                      </Button>
                    </div>
                  )}

                  {/* Action Buttons (only visible when not in any selection mode) */}
                  {!(proposalCreationMode || ceQuoteMode) && !isSearching && (
                    <div className="flex gap-2">
                      <Button
                        onClick={handleInitiateProposalFlow}
                        className="bg-[#ff3333] text-white hover:bg-[#cc2929]"
                      >
                        Planning & Proposals
                      </Button>
                      <Button onClick={handleCeMode} className="bg-[#ff3333] text-white hover:bg-[#cc2929]">
                        CE
                      </Button>
                      <Button onClick={handleQuoteMode} className="bg-[#ff3333] text-white hover:bg-[#cc2929]">
                        Quote
                      </Button>
                      <Button
                        className="bg-[#ff3333] text-white hover:bg-[#cc2929]"
                        onClick={() => setIsCollabPartnerDialogOpen(true)}
                      >
                        Collab
                      </Button>
                      <Button
                        onClick={() => router.push("/sales/job-orders/select-quotation")} // Changed to navigate to new page
                        className="bg-[#ff3333] text-white hover:bg-[#cc2929]"
                      >
                        Job Order
                      </Button>
                    </div>
                  )}

                  {!isMobile && (
                    <div className="border rounded-md p-1 flex">
                      <Button
                        variant={viewMode === "grid" ? "default" : "ghost"}
                        size="icon"
                        className={cn("h-8 w-8", viewMode === "grid" && "bg-gray-200 text-gray-800 hover:bg-gray-300")}
                        onClick={() => setViewMode("grid")}
                      >
                        <LayoutGrid size={18} />
                      </Button>
                      <Button
                        variant={viewMode === "list" ? "default" : "ghost"}
                        size="icon"
                        className={cn("h-8 w-8", viewMode === "list" && "bg-gray-200 text-gray-800 hover:bg-gray-300")}
                        onClick={() => setViewMode("list")}
                      >
                        <List size={18} />
                      </Button>
                    </div>
                  )}
                </div>
              </div>

              {/* Client Selection UI on Dashboard - Visible when proposalCreationMode OR ceQuoteMode is active */}
              {(proposalCreationMode || ceQuoteMode) && (
                <div className="relative w-full max-w-xs mt-1" ref={clientSearchRef}>
                  <div className="relative">
                    <Input
                      placeholder="Search or select client..."
                      value={
                        selectedClientForProposal
                          ? selectedClientForProposal.company || selectedClientForProposal.contactPerson
                          : dashboardClientSearchTerm
                      }
                      onChange={(e) => {
                        setDashboardClientSearchTerm(e.target.value)
                        setSelectedClientForProposal(null)
                      }}
                      onFocus={() => {
                        setIsClientDropdownOpen(true)
                        if (selectedClientForProposal) {
                          setDashboardClientSearchTerm("")
                        }
                      }}
                      className={cn(
                        "pr-10 h-9 text-sm",
                        (proposalCreationMode || ceQuoteMode) && "border-blue-500 ring-2 ring-blue-200",
                      )}
                    />
                    {isSearchingDashboardClients && (
                      <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-gray-500" />
                    )}
                  </div>
                  {/* Results dropdown */}
                  {isClientDropdownOpen && (
                    <Card className="absolute top-full z-50 mt-1 w-full shadow-lg">
                      <div className="max-h-[200px] overflow-y-auto">
                        <div className="p-2">
                          {/* Always show "Add New Client" option at the top */}
                          <div
                            className="flex items-center gap-2 py-1.5 px-2 hover:bg-gray-100 cursor-pointer rounded-md text-sm mb-2 border-b pb-2"
                            onClick={() => setIsNewClientDialogOpen(true)}
                          >
                            <PlusCircle className="h-4 w-4 text-blue-500" />
                            <span className="font-medium text-blue-700">Add New Client</span>
                          </div>

                          {dashboardClientSearchResults.length > 0 ? (
                            dashboardClientSearchResults.map((result) => (
                              <div
                                key={result.id}
                                className="flex items-center justify-between py-1.5 px-2 hover:bg-gray-100 cursor-pointer rounded-md text-sm"
                                onClick={() => handleClientSelectOnDashboard(result)}
                              >
                                <div>
                                  <p className="font-medium">
                                    {result.name} ({result.company})
                                  </p>
                                  <p className="text-xs text-gray-500">{result.email}</p>
                                </div>
                                {selectedClientForProposal?.id === result.id && (
                                  <CheckCircle className="h-4 w-4 text-green-500" />
                                )}
                              </div>
                            ))
                          ) : (
                            <p className="text-sm text-gray-500 text-center py-2">
                              {dashboardClientSearchTerm.trim() && !isSearchingDashboardClients
                                ? `No clients found for "${dashboardClientSearchTerm}".`
                                : "Start typing to search for clients."}
                            </p>
                          )}
                        </div>
                      </div>
                    </Card>
                  )}
                </div>
              )}

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
                    <Button variant="outline" size="sm" className="gap-1 hidden sm:flex bg-transparent">
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
                        // Changed from 6 to 5 columns for better spacing
                        <ResponsiveCardGrid mobileColumns={1} tabletColumns={2} desktopColumns={5} gap="sm">
                          {searchResults.map((result) => (
                            <Card
                              key={result.objectID}
                              className="overflow-hidden cursor-pointer border border-gray-200 shadow-md rounded-xl transition-all hover:shadow-lg"
                              onClick={() => handleSearchResultClick(result)}
                            >
                              <div className="h-52 bg-gray-200 relative">
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
                    <div className="flex-1 overflow-y-auto">
                      <ResponsiveCardGrid mobileColumns={1} tabletColumns={2} desktopColumns={5} gap="sm">
                        {products.map((product) => (
                          <ProductCard
                            key={product.id}
                            product={product}
                            hasOngoingBooking={productsWithBookings[product.id] || false}
                            onView={() => handleViewDetails(product.id)}
                            onEdit={(e) => handleEditClick(product, e)}
                            onDelete={(e) => handleDeleteClick(product, e)}
                            onCreateReport={(e) => handleCreateReport(product, e)}
                            isSelected={
                              proposalCreationMode
                                ? selectedProducts.some((p) => p.id === product.id)
                                : selectedSites.some((p) => p.id === product.id)
                            }
                            onSelect={() =>
                              proposalCreationMode ? handleProductSelect(product) : handleSiteSelect(product)
                            }
                            selectionMode={proposalCreationMode || ceQuoteMode}
                          />
                        ))}
                      </ResponsiveCardGrid>
                    </div>
                  )}

                  {/* List View - Only show on tablet and desktop */}
                  {!loading && products.length > 0 && viewMode === "list" && !isMobile && (
                    <div className="flex-1 overflow-y-auto">
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
                                  className={`cursor-pointer hover:bg-gray-50 ${proposalCreationMode || ceQuoteMode ? "opacity-50" : ""}`}
                                  onClick={() => {
                                    if (proposalCreationMode) {
                                      handleProductSelect(product)
                                    } else if (ceQuoteMode) {
                                      handleSiteSelect(product)
                                    } else {
                                      handleViewDetails(product.id)
                                    }
                                  }}
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
                                        <Badge
                                          variant="outline"
                                          className="bg-amber-50 text-amber-700 border-amber-200"
                                        >
                                          <CalendarIcon className="mr-1 h-3 w-3" /> Booked
                                        </Badge>
                                      ) : (
                                        <Badge
                                          variant="outline"
                                          className="bg-green-50 text-green-700 border-green-200"
                                        >
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
                </>
              )}
            </div>

            {/* Right Column: Proposal History - Conditionally rendered */}
            {proposalCreationMode && (
              <div className="flex flex-col gap-4 pt-4 md:pt-6">
                <ProposalHistory selectedClient={selectedClientForProposal} onCopySites={handleCopySitesFromProposal} />
              </div>
            )}
          </div>
        )}

        {/* Create Proposal Button - Fixed position when in proposal mode */}
        {proposalCreationMode && (
          <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-50">
            <Button
              onClick={handleConfirmProposalCreation}
              disabled={!selectedClientForProposal || selectedProducts.length === 0 || isCreatingProposal}
              className={`px-8 py-3 text-lg font-semibold transition-all duration-200 ${
                selectedClientForProposal && selectedProducts.length > 0
                  ? "bg-green-600 hover:bg-green-700 text-white"
                  : "bg-gray-400 text-gray-600 cursor-not-allowed"
              }`}
            >
              {isCreatingProposal ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Creating...
                </>
              ) : (
                "Create Proposal"
              )}
            </Button>
          </div>
        )}

        {/* CE/Quote Button - Fixed position when in CE mode */}
        {ceQuoteMode && selectedSites.length > 0 && (
          <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-50">
            {ceMode && (
              <Button
                onClick={openCreateCostEstimateDateDialog}
                className="gap-2 bg-gray-200 text-gray-800 hover:bg-gray-300"
                disabled={selectedSites.length === 0 || !selectedClientForProposal || isCreatingDocument}
              >
                {isCreatingDocument && actionAfterDateSelection === "cost_estimate" ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <Calculator className="h-4 w-4" />
                    Create Cost Estimate
                  </>
                )}
              </Button>
            )}
            {quoteMode && (
              <Button
                onClick={openCreateQuotationDateDialog}
                className="gap-2 bg-green-600 text-white hover:bg-green-700"
                disabled={selectedSites.length === 0 || !selectedClientForProposal || isCreatingDocument}
              >
                {isCreatingDocument && actionAfterDateSelection === "quotation" ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <FileText className="h-4 w-4" />
                    Create Quotation
                  </>
                )}
              </Button>
            )}
          </div>
        )}

        {ceMode && (
          <div className="fixed bottom-4 left-1/2 -translate-x-1/2 p-4 bg-white border rounded-lg shadow-lg z-50">
            <Button
              onClick={openCreateCostEstimateDateDialog}
              className="gap-2 bg-gray-200 text-gray-800 hover:bg-gray-300"
              disabled={selectedSites.length === 0 || !selectedClientForProposal || isCreatingDocument}
            >
              {isCreatingDocument && actionAfterDateSelection === "cost_estimate" ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Calculator className="h-4 w-4" />
                  Create Cost Estimate
                </>
              )}
            </Button>
          </div>
        )}

        {quoteMode && (
          <div className="fixed bottom-4 left-1/2 -translate-x-1/2 p-4 bg-white border rounded-lg shadow-lg z-50">
            <Button
              onClick={openCreateQuotationDateDialog}
              className="gap-2 bg-green-600 text-white hover:bg-green-700"
              disabled={selectedSites.length === 0 || !selectedClientForProposal || isCreatingDocument}
            >
              {isCreatingDocument && actionAfterDateSelection === "quotation" ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <FileText className="h-4 w-4" />
                  Create Quotation
                </>
              )}
            </Button>
          </div>
        )}

        {/* Date Range Selection Dialog */}
        <DateRangeCalendarDialog
          isOpen={isDateRangeDialogOpen}
          onClose={() => setIsDateRangeDialogOpen(false)}
          onSelectDates={handleDatesSelected}
          onSkipDates={handleSkipDates}
          selectedSiteIds={selectedSites.map((site) => site.id)}
          selectedClientId={selectedClientForProposal?.id}
          showSkipButton={actionAfterDateSelection === "cost_estimate"}
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

        {/* Collab Partner Selection Dialog */}
        <CollabPartnerDialog isOpen={isCollabPartnerDialogOpen} onClose={() => setIsCollabPartnerDialogOpen(false)} />

        {/* New Client Dialog (now using ClientDialog) */}
        <ClientDialog
          open={isNewClientDialogOpen}
          onOpenChange={setIsNewClientDialogOpen}
          onSuccess={(newClient) => {
            setIsNewClientDialogOpen(false)
            handleClientSelectOnDashboard(newClient)
            toast({
              title: "Client Added",
              description: `${newClient.name} (${newClient.company}) has been added.`,
              variant: "success",
            })
          }}
        />

        <CreateReportDialog
          open={createReportDialogOpen}
          onOpenChange={setCreateReportDialogOpen}
          siteId={selectedProductForReport}
          module="sales"
        />
      </div>
    </div>
  )
}

export default function SalesDashboardPage() {
  const { user } = useAuth()

  return (
    <RouteProtection requiredRoles="sales">
      <div className="h-screen overflow-hidden">
        <SalesDashboardContent />

        {/* Render SalesChatWidget without the floating button */}
        <SalesChatWidget />
      </div>
    </RouteProtection>
  )
}

// Product Card Component for Grid View
function ProductCard({
  product,
  hasOngoingBooking,
  onView,
  onEdit,
  onDelete,
  onCreateReport,
  isSelected = false,
  onSelect,
  selectionMode = false,
}: {
  product: Product
  hasOngoingBooking: boolean
  onView: () => void
  onEdit: (e: React.MouseEvent) => void
  onDelete: (e: React.MouseEvent) => void
  onCreateReport: (e: React.MouseEvent) => void
  isSelected?: boolean
  onSelect?: () => void
  selectionMode?: boolean
}) {
  if (!product) {
    return (
      <Card className="overflow-hidden border shadow-sm rounded-2xl bg-gray-50 aspect-[3/4]">
        <div className="relative h-48 bg-gray-100 p-3">
          <div className="relative h-full w-full rounded-xl overflow-hidden bg-gray-200 flex items-center justify-center">
            <div className="text-gray-400 text-sm">No data available</div>
          </div>
        </div>
        <CardContent className="p-4 flex-1 flex flex-col">
          <div className="flex flex-col gap-2 flex-1">
            <div className="text-base font-bold text-gray-400">N/A</div>
            <h3 className="text-sm text-gray-400">Record not available</h3>
            <div className="text-sm font-semibold text-gray-400 mt-1">Price not available</div>
            <Button
              variant="outline"
              className="mt-auto w-full h-9 text-sm bg-gray-100 text-gray-400 rounded-lg font-medium cursor-not-allowed"
              disabled
            >
              Create Report
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  // Get the first media item for the thumbnail
  const thumbnailUrl =
    product.media && product.media.length > 0 ? product.media[0].url : "/abstract-geometric-sculpture.png"

  // Determine location based on product type
  const location = product.specs_rental?.location || product.light?.location || "Unknown location"

  const formattedPrice = product.price
    ? `₱${Number(product.price).toLocaleString("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}/month`
    : "Price not set"

  // Get site code
  const siteCode = getSiteCode(product)

  const getStatusInfo = () => {
    if (product.status === "ACTIVE" || product.status === "OCCUPIED") {
      return { label: "OPEN", color: "#38b6ff" }
    }
    if (product.status === "VACANT" || product.status === "AVAILABLE") {
      return { label: "AVAILABLE", color: "#00bf63" }
    }
    if (product.status === "MAINTENANCE" || product.status === "REPAIR") {
      return { label: "MAINTENANCE", color: "#ef4444" }
    }
    return { label: "OPEN", color: "#38b6ff" }
  }

  const statusInfo = getStatusInfo()

  const handleClick = () => {
    if (selectionMode && onSelect) {
      onSelect()
    } else {
      onView()
    }
  }

  const handleCreateReport = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    onCreateReport(e)
  }

  return (
    <Card
      className={cn(
        "overflow-hidden cursor-pointer border shadow-sm rounded-2xl transition-all hover:shadow-md bg-white aspect-[3/4] flex flex-col",
        isSelected ? "border-green-500 bg-green-50" : "border-gray-200",
        selectionMode ? "hover:border-green-300" : "",
      )}
      onClick={handleClick}
    >
      <div className="relative h-40 p-3">
        <div className="relative h-full w-full rounded-xl overflow-hidden">
          <Image
            src={thumbnailUrl || "/placeholder.svg"}
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
      </div>
      <CardContent className="p-4 flex-1 flex flex-col">
        <div className="flex flex-col gap-2 flex-1">
          <div className="text-base font-bold line-clamp-1">{product.name}</div>
          <h3 className="text-sm text-gray-500 line-clamp-1">{location}</h3>
          <div className="text-sm font-semibold text-green-700 mt-1">{formattedPrice}</div>
          <div className="flex items-center justify-between mt-auto">
            <Badge variant="secondary" className="bg-[#e0f2fe] text-[#0369a1]">
              {statusInfo.label}
            </Badge>
            <Button variant="outline" size="sm" onClick={handleCreateReport}>
              Create Report
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

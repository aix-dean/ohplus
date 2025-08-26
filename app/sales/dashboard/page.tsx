"use client"

import type React from "react"
import { useState, useEffect, useCallback, useRef } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { useToast } from "@/hooks/use-toast"
import { LayoutGrid, List, ChevronLeft, ChevronRight, ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
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
import { useResponsive } from "@/hooks/use-responsive"
import { ResponsiveCardGrid } from "@/components/responsive-card-grid"
import { cn } from "@/lib/utils"
import { Input } from "@/components/ui/input"
import { useDebounce } from "@/hooks/use-debounce"
import { getPaginatedClients, type Client } from "@/lib/client-service"
import { createProposal } from "@/lib/proposal-service"
import type { ProposalClient } from "@/lib/types/proposal"
import { DateRangeCalendarDialog } from "@/components/date-range-calendar-dialog"
import { createDirectCostEstimate } from "@/lib/cost-estimate-service" // Import for CE creation
import { createQuotation, generateQuotationNumber, calculateQuotationTotal } from "@/lib/quotation-service" // Imports for Quotation creation
import { Skeleton } from "@/components/ui/skeleton" // Import Skeleton
import { CollabPartnerDialog } from "@/components/collab-partner-dialog"
import type { QuotationProduct } from "@/lib/types/quotation"

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
  const [ceMode, setCeMode] = useState(false)
  const [quoteMode, setQuoteMode] = useState(false)
  const [selectedSites, setSelectedSites] = useState<Product[]>([])
  const [isDateRangeDialogOpen, setIsDateRangeDialogOpen] = useState(false)
  const [actionAfterDateSelection, setActionAfterDateSelection] = useState<"cost_estimate" | "quotation" | null>(null)
  const [isCreatingDocument, setIsCreatingDocument] = useState(false) // New loading state for document creation

  const [isCollabPartnerDialogOpen, setIsCollabPartnerDialogOpen] = useState(false)

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
  const handleDatesSelected = async (startDate: Date, endDate: Date) => {
    if (!user?.uid || !selectedClientForProposal || selectedSites.length === 0) {
      toast({
        title: "Missing Information",
        description: "Client, sites, or user information is missing. Cannot create document.",
        variant: "destructive",
      })
      return
    }

    setIsCreatingDocument(true)
    setIsDateRangeDialogOpen(false) // Close dialog immediately

    try {
      if (actionAfterDateSelection === "cost_estimate") {
        const clientData = {
          id: selectedClientForProposal.id,
          name: selectedClientForProposal.contactPerson,
          email: selectedClientForProposal.email,
          company: selectedClientForProposal.company,
          phone: selectedClientForProposal.phone,
          designation: selectedClientForProposal.designation,
          address: selectedClientForProposal.address,
          industry: selectedClientForProposal.industry,
        }

        const sitesData = selectedSites.map((site) => ({
          id: site.id,
          name: site.name,
          location: site.specs_rental?.location || site.light?.location || "N/A",
          price: site.price || 0,
          type: site.type || "Unknown",
        }))

        const newCostEstimateId = await createDirectCostEstimate(clientData, sitesData, user.uid, {
          startDate,
          endDate,
        })

        toast({
          title: "Cost Estimate Created",
          description: "Your cost estimate has been created successfully.",
        })
        router.push(`/sales/cost-estimates/${newCostEstimateId}`) // Navigate to view page
      } else if (actionAfterDateSelection === "quotation") {
        // Prepare products for quotation
        const quotationItems: QuotationProduct[] = selectedSites.map((site) => ({
          product_id: site.id,
          name: site.name,
          location: site.specs_rental?.location || site.light?.location || "N/A",
          price: site.price || 0, // This is the monthly price
          type: site.type || "Unknown",
          site_code: getSiteCode(site) || "N/A",
          media_url: site.media && site.media.length > 0 ? site.media[0].url : undefined,
        }))

        // Calculate total amount for all selected products
        const { durationDays, totalAmount } = calculateQuotationTotal(
          startDate.toISOString(),
          endDate.toISOString(),
          quotationItems,
        )

        const validUntil = new Date()
        validUntil.setDate(validUntil.getDate() + 5) // Valid for 5 days

        const quotationData = {
          quotation_number: generateQuotationNumber(),
          items: quotationItems, // Pass the array of products
          start_date: startDate.toISOString(),
          end_date: endDate.toISOString(),
          total_amount: totalAmount,
          valid_until: validUntil,
          duration_days: durationDays,
          status: "draft" as const, // Default status
          created_by: user.uid,
          created_by_first_name: userData?.first_name || "",
          created_by_last_name: userData?.last_name || "",
          client_name: selectedClientForProposal.contactPerson,
          client_email: selectedClientForProposal.email,
          client_id: selectedClientForProposal.id,
          client_designation: selectedClientForProposal.designation || "", // Add client designation
          client_address: selectedClientForProposal.address || "", // Add client address
          client_phone: selectedClientForProposal.phone || "", // Add client phone
        }

        console.log("Final quotationData object being sent:", quotationData)

        const newQuotationId = await createQuotation(quotationData)

        toast({
          title: "Quotation Created",
          description: "Your quotation has been created successfully.",
        })
        router.push(`/sales/quotations/${newQuotationId}`) // Navigate to the new internal quotation view page
      }
    } catch (error: any) {
      console.error("Error creating document:", error)
      toast({
        title: "Error",
        description: `Failed to create document: ${error.message || "Unknown error"}`,
        variant: "destructive",
      })
    } finally {
      setIsCreatingDocument(false)
      setCeQuoteMode(false)
      setSelectedSites([])
      setSelectedClientForProposal(null)
      setActionAfterDateSelection(null)
    }
  }

  const handleSkipDates = async () => {
    if (!user?.uid || !selectedClientForProposal || selectedSites.length === 0) {
      toast({
        title: "Missing Information",
        description: "Client, sites, or user information is missing. Cannot create document.",
        variant: "destructive",
      })
      return
    }

    setIsCreatingDocument(true)
    setIsDateRangeDialogOpen(false) // Close dialog immediately

    try {
      if (actionAfterDateSelection === "cost_estimate") {
        const clientData = {
          id: selectedClientForProposal.id,
          name: selectedClientForProposal.contactPerson,
          email: selectedClientForProposal.email,
          company: selectedClientForProposal.company,
          phone: selectedClientForProposal.phone,
          designation: selectedClientForProposal.designation,
          address: selectedClientForProposal.address,
          industry: selectedClientForProposal.industry,
        }

        const sitesData = selectedSites.map((site) => ({
          id: site.id,
          name: site.name,
          location: site.specs_rental?.location || site.light?.location || "N/A",
          price: site.price || 0,
          type: site.type || "Unknown",
        }))

        const newCostEstimateId = await createDirectCostEstimate(clientData, sitesData, user.uid, {
          startDate: undefined,
          endDate: undefined,
        })

        toast({
          title: "Cost Estimate Created",
          description: "Your cost estimate has been created successfully without dates.",
        })
        router.push(`/sales/cost-estimates/${newCostEstimateId}`) // Navigate to view page
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
        <div className="flex items-center justify-between p-4 bg-white border-b border-gray-200 flex-shrink-0">
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
          <Button size="sm" className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded-md">
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
            <div className="flex flex-col gap-4 md:gap-6 h-full overflow-hidden">
              {/* Header with title, actions, and search box */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
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
                <div className="relative w-full max-w-xs mt-2" ref={clientSearchRef}>
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
                    {/* Dropdown for client search results */}
                    {isClientDropdownOpen && (
                      <div className="absolute top-full left-0 w-full bg-white border border-gray-200 rounded-b-md shadow-lg max-h-48 overflow-y-auto">
                        {dashboardClientSearchResults.map((client) => (
                          <div
                            key={client.id}
                            className="p-2 cursor-pointer hover:bg-gray-100"
                            onClick={() => handleClientSelectOnDashboard(client)}
                          >
                            {client.name} ({client.company})
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Products Grid/List View */}
              {viewMode === "grid" ? (
                <ResponsiveCardGrid
                  products={products}
                  onEdit={handleEditClick}
                  onDelete={handleDeleteClick}
                  onViewDetails={handleViewDetails}
                />
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Location</TableHead>
                      <TableHead>Price</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {products.map((product) => (
                      <TableRow key={product.id}>
                        <TableCell>{product.name}</TableCell>
                        <TableCell>{product.specs_rental?.location || product.light?.location || "N/A"}</TableCell>
                        <TableCell>${product.price}</TableCell>
                        <TableCell>
                          {productsWithBookings[product.id] ? (
                            <Badge variant="destructive">Booked</Badge>
                          ) : (
                            <Badge variant="success">Available</Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          <Button size="sm" onClick={() => handleEditClick(product)}>
                            Edit
                          </Button>
                          <Button size="sm" onClick={(e) => handleDeleteClick(product, e)}>
                            Delete
                          </Button>
                          <Button size="sm" onClick={() => handleViewDetails(product.id)}>
                            View Details
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}

              {/* Pagination Controls */}
              {!loading && totalPages > 1 && (
                <div className="flex justify-center mt-4">
                  <Button size="sm" onClick={goToPreviousPage} disabled={currentPage === 1}>
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  {getPageNumbers().map((pageNumber) => (
                    <Button
                      key={pageNumber}
                      size="sm"
                      onClick={() => goToPage(pageNumber as number)}
                      className={cn(currentPage === pageNumber && "bg-blue-500 text-white")}
                      disabled={typeof pageNumber === "string"}
                    >
                      {pageNumber}
                    </Button>
                  ))}
                  <Button size="sm" onClick={goToNextPage} disabled={currentPage === totalPages}>
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>

            {/* Right Column: Proposal/CE/Quote Selection */}
            {proposalCreationMode && (
              <div className="hidden lg:block">
                {/* Proposal Selection UI */}
                <div className="flex flex-col gap-4">
                  <h2 className="text-lg font-semibold">Select Products</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {products.map((product) => (
                      <div key={product.id} className="border rounded-lg p-4 flex items-center gap-4">
                        <div className="flex-1">
                          <h3 className="text-sm font-semibold">{product.name}</h3>
                          <p className="text-sm text-gray-500">${product.price}</p>
                        </div>
                        <Button
                          size="sm"
                          onClick={() => handleProductSelect(product)}
                          className={cn(selectedProducts.some((p) => p.id === product.id) && "bg-blue-500 text-white")}
                        >
                          {selectedProducts.some((p) => p.id === product.id) ? "Selected" : "Select"}
                        </Button>
                      </div>
                    ))}
                  </div>
                  <Button
                    size="lg"
                    className="bg-green-500 text-white hover:bg-green-600"
                    onClick={handleConfirmProposalCreation}
                    disabled={selectedProducts.length === 0 || !selectedClientForProposal}
                  >
                    Create Proposal
                  </Button>
                </div>
              </div>
            )}

            {ceQuoteMode && (
              <div className="hidden lg:block">
                {/* CE/Quote Selection UI */}
                <div className="flex flex-col gap-4">
                  <h2 className="text-lg font-semibold">Select Sites</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {products.map((product) => (
                      <div key={product.id} className="border rounded-lg p-4 flex items-center gap-4">
                        <div className="flex-1">
                          <h3 className="text-sm font-semibold">{product.name}</h3>
                          <p className="text-sm text-gray-500">${product.price}</p>
                        </div>
                        <Button
                          size="sm"
                          onClick={() => handleSiteSelect(product)}
                          className={cn(selectedSites.some((p) => p.id === product.id) && "bg-blue-500 text-white")}
                        >
                          {selectedSites.some((p) => p.id === product.id) ? "Selected" : "Select"}
                        </Button>
                      </div>
                    ))}
                  </div>
                  <Button
                    size="lg"
                    className="bg-green-500 text-white hover:bg-green-600"
                    onClick={openCreateCostEstimateDateDialog}
                    disabled={selectedSites.length === 0 || !selectedClientForProposal}
                  >
                    Create Cost Estimate
                  </Button>
                  <Button
                    size="lg"
                    className="bg-green-500 text-white hover:bg-green-600"
                    onClick={openCreateQuotationDateDialog}
                    disabled={selectedSites.length === 0 || !selectedClientForProposal}
                  >
                    Create Quotation
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Delete Confirmation Dialog */}
      {deleteDialogOpen && (
        <DeleteConfirmationDialog
          isOpen={deleteDialogOpen}
          onClose={() => setDeleteDialogOpen(false)}
          onConfirm={handleDeleteConfirm}
          product={productToDelete}
        />
      )}

      {/* Date Range Calendar Dialog */}
      {isDateRangeDialogOpen && (
        <DateRangeCalendarDialog
          isOpen={isDateRangeDialogOpen}
          onClose={() => setIsDateRangeDialogOpen(false)}
          onDatesSelected={handleDatesSelected}
          onSkipDates={handleSkipDates}
        />
      )}

      {/* Collab Partner Dialog */}
      {isCollabPartnerDialogOpen && (
        <CollabPartnerDialog isOpen={isCollabPartnerDialogOpen} onClose={() => setIsCollabPartnerDialogOpen(false)} />
      )}
    </div>
  )
}

export default SalesDashboardContent

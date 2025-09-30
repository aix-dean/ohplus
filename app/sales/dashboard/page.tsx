"use client"

import type React from "react"
import { useState, useEffect, useCallback, useRef } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Image from "next/image"
import { useAuth } from "@/contexts/auth-context"
import { useToast } from "@/hooks/use-toast"
import {
  MapPin,
  LayoutGrid,
  List,
  Grid3X3,
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
import { collection, query, where, getDocs, getDoc, doc, Timestamp, orderBy, limit } from "firebase/firestore"
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
import type { ProposalClient, ProposalProduct } from "@/lib/types/proposal"
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
  if ((product as any).light && "siteCode" in (product as any).light) return (product as any).light.siteCode

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
  const searchParams = useSearchParams()
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

  const handleCreateReport = async (product: Product, e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()

    try {
      const jobOrdersRef = collection(db, "job_orders")
      const q = query(
        jobOrdersRef,
        where("product_id", "==", product.id),
        orderBy("createdAt", "desc"),
        limit(1)
      )
      const snapshot = await getDocs(q)

      if (!snapshot.empty) {
        const latestJobOrder = snapshot.docs[0]
        router.push(`/sales/project-monitoring/details/${latestJobOrder.id}`)
      } else {
        toast({
          title: "No Job Order Found",
          description: "No job order found for this product.",
          variant: "destructive",
          open: true,
        })
      }
    } catch (error) {
      console.error("Error fetching job order:", error)
      toast({
        title: "Error",
        description: "Failed to fetch job order.",
        variant: "destructive",
        open: true,
      })
    }
  }

  const handleCopySitesFromProposal = (sites: Product[], client?: any) => {
    // Add the copied sites to the selected products for proposal creation
    setSelectedProducts(sites)

    // If no client is currently selected and we have client info from the proposal, select it
    if (!selectedClientForProposal && client) {
      setSelectedClientForProposal({
        id: client.id || "",
        company: client.company || "",
        contactPerson: client.contactPerson || "",
        email: client.email || "",
        phone: client.phone || "",
        address: client.address || "",
        industry: client.industry || "",
        designation: client.designation || "",
        targetAudience: client.targetAudience || "",
        campaignObjective: client.campaignObjective || "",
        company_id: client.company_id || "",
      })

      // Update the search term to show the selected client
      setDashboardClientSearchTerm(client.company || client.contactPerson || "")

      toast({
        title: "Sites and Client Copied",
        description: `${sites.length} site${sites.length === 1 ? "" : "s"} copied and client ${client.company || client.contactPerson} selected.`,
        open: true,
      })
    } else {
      // Show success message for sites only
      toast({
        title: "Sites Copied",
        description: `${sites.length} site${sites.length === 1 ? "" : "s"} copied and ready for proposal creation.`,
        open: true,
      })
    }
  }

  // On mobile, default to grid view
  useEffect(() => {
    if (isMobile) {
      setViewMode("grid")
    }
  }, [isMobile])
  console.log(`user comoany id ${userData?.company_id}`)
  // Fetch clients for dashboard client selection (for proposals and CE/Quote)
  useEffect(() => {
    const fetchClients = async () => {
      if (user?.uid && (proposalCreationMode || ceQuoteMode)) {
        // Ensure user is logged in
        setIsSearchingDashboardClients(true)
        try {
          const itemsPerPage = debouncedDashboardClientSearchTerm.trim() ? 10000 : 100; // 1. Adjust itemsPerPage for initial load to 100. 2. If search term is not empty, fetch all clients (10000).
          const lastDocForSearch = debouncedDashboardClientSearchTerm.trim() ? null : null; // Ensure lastDoc is null for full client fetch when searching.
          const result = await getPaginatedClients(itemsPerPage, lastDocForSearch, debouncedDashboardClientSearchTerm.trim(), null, null, userData?.company_id || undefined, false);
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

  // Handle URL parameters for auto-activation of modes and client selection
  useEffect(() => {
    const mode = searchParams.get('mode')
    const clientId = searchParams.get('clientId')

    if (mode && clientId && userData?.company_id) {
      // Reset all modes first
      setProposalCreationMode(false)
      setCeQuoteMode(false)
      setCeMode(false)
      setQuoteMode(false)
      setSelectedClientForProposal(null)
      setDashboardClientSearchTerm("")
      setSelectedProducts([])
      setSelectedSites([])

      // Fetch and select the client
      const fetchClient = async () => {
        try {
          const clientsRef = collection(db, "client_company")
          const clientDoc = await getDoc(doc(clientsRef, clientId))

          if (clientDoc.exists()) {
            const clientData = clientDoc.data()
            const client: Client = {
              id: clientDoc.id,
              name: clientData.contactPersons?.[0]?.name || clientData.name || "",
              company: clientData.name || "",
              email: clientData.contactPersons?.[0]?.email || "",
              phone: clientData.contactPersons?.[0]?.phone || "",
              address: clientData.address || "",
              industry: clientData.industry || "",
              designation: clientData.contactPersons?.[0]?.position || "",
              company_id: clientData.user_company_id || "",
              status: "lead",
              created: new Date(),
              updated: new Date(),
            }

            // Select the client first
            handleClientSelectOnDashboard(client)

            // Then activate the appropriate mode
            setTimeout(() => {
              if (mode === 'proposal') {
                setProposalCreationMode(true)
                setCeQuoteMode(false)
              } else if (mode === 'cost_estimate') {
                // Activate CE mode without resetting the client
                setCeMode(true)
                setQuoteMode(false)
                setCeQuoteMode(true)
                setProposalCreationMode(false)
                setSelectedSites([])
                setDashboardClientSearchTerm(client.company || client.name || "")
              } else if (mode === 'quotation') {
                // Activate Quotation mode without resetting the client
                setQuoteMode(true)
                setCeMode(false)
                setCeQuoteMode(true)
                setProposalCreationMode(false)
                setSelectedSites([])
                setDashboardClientSearchTerm(client.company || client.name || "")
              }
            }, 100)

            // Clean up URL parameters
            const newUrl = new URL(window.location.href)
            newUrl.searchParams.delete('mode')
            newUrl.searchParams.delete('clientId')
            window.history.replaceState({}, '', newUrl.toString())
          }
        } catch (error) {
          console.error("Error fetching client for auto-selection:", error)
        }
      }

      fetchClient()
    }
  }, [searchParams, userData?.company_id])

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

          // Check for bookings with status "RESERVED" (case insensitive)
          const reservedStatuses = ["RESERVED", "reserved", "Reserved"]
          const bookingPromises = reservedStatuses.map(status =>
            getDocs(query(bookingsRef, where("product_id", "==", productId), where("status", "==", status)))
          )
          const bookingSnapshots = await Promise.all(bookingPromises)
          const allBookingDocs = bookingSnapshots.flatMap(snapshot => snapshot.docs)

          // Check if any booking is ongoing (current date is between start_date and end_date)
          let hasOngoingBooking = false
          allBookingDocs.forEach((doc) => {
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
        open: true, // Add the missing 'open' property
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
        const productIds = cachedData.items.map((product) => product.id).filter((id): id is string => id !== undefined) as string[];
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
        const productIds = result.items.map((product) => product.id).filter((id): id is string => id !== undefined) as string[];
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
          open: true, // Add the missing 'open' property
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
      if (productToDelete.id) {
        await softDeleteProduct(productToDelete.id)
      } else {
        console.error("Product to delete has no ID:", productToDelete);
        toast({
          title: "Error",
          description: "Cannot delete product: ID is missing.",
          variant: "destructive",
          open: true, // Add the missing 'open' property
        });
        return;
      }

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
        open: true, // Add the missing 'open' property
      })
    } catch (error) {
      console.error("Error deleting product:", error)
      toast({
        title: "Error",
        description: "Failed to delete the product. Please try again.",
        variant: "destructive",
        open: true, // Add the missing 'open' property
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
      company_id: client.company_id || "", // Add company_id here
    })
    setDashboardClientSearchTerm(client.company || client.name || "") // Display selected client in search bar
    toast({
      title: "Client Selected",
      description: `Selected ${client.name} (${client.company}). Now select products.`,
      open: true, // Add the missing 'open' property
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
        open: true, // Add the missing 'open' property
      })
      return
    }
    if (selectedProducts.length === 0) {
      toast({
        title: "No products selected",
        description: "Please select at least one product for the proposal.",
        variant: "destructive",
        open: true, // Add the missing 'open' property
      })
      return
    }

    if (!user?.uid || !userData?.company_id) {
      toast({
        title: "Authentication Required",
        description: "Please log in to create a proposal.",
        variant: "destructive",
        open: true, // Add the missing 'open' property
      })
      return
    }

    setIsCreatingProposal(true) // Set loading state for proposal creation
    try {
      // Generate a simple title for the proposal
      const proposalTitle = `Proposal for ${selectedClientForProposal.company} - ${new Date().toLocaleDateString()}`

      const proposalProducts = selectedProducts.map(product => ({
        id: product.id || "",
        name: product.name,
        type: product.type || "rental",
        price: product.price || 0,
        location: product.specs_rental?.location || (product as any).light?.location || "N/A", // Ensure location is present
        site_code: product.site_code || product.specs_rental?.site_code || (product as any).light?.siteCode || undefined, // Ensure site_code is present
        media: product.media || [],
        specs_rental: product.specs_rental || null,
        light: (product as any).light || null,
        description: product.description || "",
        health_percentage: 0, // Default value
      }));

      const proposalId = await createProposal(proposalTitle, selectedClientForProposal, proposalProducts as ProposalProduct[], user.uid, {
        // You can add notes or custom messages here if needed
        // notes: "Generated from dashboard selection",
        companyId: userData.company_id, // Add company_id to the proposal creation
        client_company_id: selectedClientForProposal.company_id, // Use client's company_id
      })

      toast({
        title: "Proposal Created",
        description: "Your proposal has been created successfully.",
        open: true, // Add the missing 'open' property
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
        open: true, // Add the missing 'open' property
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
        open: true, // Add the missing 'open' property
      })
      return
    }
    if (!selectedClientForProposal) {
      toast({
        title: "No Client Selected",
        description: "Please select a client first.",
        variant: "destructive",
        open: true, // Add the missing 'open' property
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
        open: true, // Add the missing 'open' property
      })
      return
    }
    if (!selectedClientForProposal) {
      toast({
        title: "No Client Selected",
        description: "Please select a client first.",
        variant: "destructive",
        open: true, // Add the missing 'open' property
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
        open: true, // Add the missing 'open' property
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
          open: true, // Add the missing 'open' property
        })
        return
      }
    } else {
      if (selectedSites.length === 0) {
        toast({
          title: "No Sites Selected",
          description: "Please select at least one site to create a cost estimate.",
          variant: "destructive",
          open: true, // Add the missing 'open' property
        })
        return
      }
    }

    if (actionAfterDateSelection === "quotation") {
      setIsCreatingDocument(true)
      try {
        const sitesData = selectedSites.map((site) => ({
          id: site.id!, // Ensure id is a string
          name: site.name,
          location: site.specs_rental?.location || (site as any).light?.location || "N/A",
          price: site.price || 0,
          type: site.type || "Unknown",
          image: site.media && site.media.length > 0 ? site.media[0].url : undefined,
          content_type: site.content_type || "",
          specs_rental: site.specs_rental,

        }))
        const clientData = {
          id: selectedClientForProposal!.id,
          name: selectedClientForProposal!.contactPerson,
          email: selectedClientForProposal!.email,
          company: selectedClientForProposal!.company,
          phone: selectedClientForProposal!.phone,
          address: selectedClientForProposal!.address,
          designation: selectedClientForProposal!.designation,
          industry: selectedClientForProposal!.industry,
          company_id: selectedClientForProposal!.company_id
        }

        const options = {
          startDate,
          endDate,
          company_id: userData.company_id,
          client_company_id: selectedClientForProposal!.company_id, // Use client's company_id
          page_id: selectedSites.length > 1 ? `PAGE-${Date.now()}` : undefined,
          created_by_first_name: userData.first_name,
          created_by_last_name: userData.last_name,
        }



        let quotationIds: string[]

        if (selectedSites.length > 1) {
          // Create multiple quotations for multiple sites
          console.log(`client data: ${JSON.stringify(clientData)}`)
          quotationIds = await createMultipleQuotations(clientData, sitesData, user.uid, options)

          toast({
            title: "Quotations Created",
            description: `Successfully created ${quotationIds.length} quotations for the selected sites.`,
            open: true, // Add the missing 'open' property
          })
        } else {
          // Create single quotation for one site
          const quotationId = await createDirectQuotation(clientData, sitesData, user.uid, options)
          quotationIds = [quotationId]

          toast({
            title: "Quotation Created",
            description: "Quotation has been created successfully.",
            open: true, // Add the missing 'open' property
          })
        }

        // Navigate to the first quotation
        router.push(`/sales/quotations/${quotationIds[quotationIds.length - 1]}`)
      } catch (error) {
        console.error("Error creating quotation:", error)
        toast({
          title: "Error",
          description: "Failed to create quotation. Please try again.",
          variant: "destructive",
          open: true, // Add the missing 'open' property
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
          id: site.id!, // Ensure id is a string
          name: site.name,
          location: site.specs_rental?.location || (site as any).light?.location || "N/A",
          price: site.price || 0,
          type: site.type || "Unknown",
          image: site.media && site.media.length > 0 ? site.media[0].url : undefined,
          content_type: site.content_type || "",
          specs_rental: site.specs_rental,
        }))
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

      const options = {
        startDate,
        endDate,
        company_id: userData.company_id,
        client_company_id: selectedClientForProposal!.company_id, // Use client's company_id
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
          open: true, // Add the missing 'open' property
        })
      } else {
        // Create single cost estimate for one site
        const costEstimateId = await createDirectCostEstimate(clientData, sitesData, user.uid, options)
        costEstimateIds = [costEstimateId]

        toast({
          title: "Cost Estimate Created",
          description: "Cost estimate has been created successfully.",
          open: true, // Add the missing 'open' property
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
        open: true, // Add the missing 'open' property
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
        open: true, // Add the missing 'open' property
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
          id: site.id!, // Ensure id is a string
          name: site.name,
          location: site.specs_rental?.location || (site as any).light?.location || "N/A",
          price: site.price || 0,
          type: site.type || "Unknown",
          image: site.media && site.media.length > 0 ? site.media[0].url : undefined,
          content_type: site.content_type || "",
          specs_rental: site.specs_rental,
        }))
        console.log("sites data", sitesData)
        const options = {
          startDate: undefined,
          endDate: undefined,
          company_id: userData.company_id,
          client_company_id: selectedClientForProposal!.company_id, // Use client's company_id
          page_id: selectedSites.length > 1 ? `PAGE-${Date.now()}` : undefined,
        }

        console.log("[v0] handleSkipDates - options being passed:", options)

        if (selectedSites.length === 1) {
          // Single site - create one document
          const newCostEstimateId = await createDirectCostEstimate(clientData, sitesData, user.uid, options)

          toast({
            title: "Cost Estimate Created",
            description: "Your cost estimate has been created successfully without dates.",
            open: true, // Add the missing 'open' property
          })
          router.push(`/sales/cost-estimates/${newCostEstimateId}`) // Navigate to view page
        } else {
          // Multiple sites - create separate documents for each site
          const newCostEstimateIds = await createMultipleCostEstimates(clientData, sitesData, user.uid, options)

          toast({
            title: "Cost Estimates Created",
            description: `${newCostEstimateIds.length} cost estimates have been created successfully without dates - one for each selected site.`,
            open: true, // Add the missing 'open' property
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
        open: true, // Add the missing 'open' property
      })
    } finally {
      setIsCreatingDocument(false)
    }
  }

  const handleCancelCeQuote = () => {
    setCeQuoteMode(false)
    setCeMode(false)
    setQuoteMode(false)
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
            <h2 className="text-[30px] font-bold text-gray-900">← Create Proposal</h2>
          </div>
        </div>
      )}

      {ceQuoteMode && !proposalCreationMode && (
        <div className="flex items-center justify-between p-4 pb-2 bg-white border-b border-gray-200 flex-shrink-0">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleCancelCeQuote}
              className="p-1 hover:bg-gray-100"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h2 className="text-lg font-semibold text-gray-900">Select Sites</h2>
          </div>
          {/* No collab button for CE/Quote mode */}
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
              {/* Dashboard Header */}
              {!(proposalCreationMode || ceQuoteMode) && (
                <div className="mb-6">
                  <div className="flex justify-between items-center mb-4">
                    <h1 className="text-2xl font-semibold text-[#333333]">
                      {userData?.first_name
                        ? `${userData.first_name.charAt(0).toUpperCase()}${userData.first_name.slice(1).toLowerCase()}'s Dashboard`
                        : "Dashboard"}
                    </h1>

                    {/* Navigation Tabs */}
                    <div className="flex gap-2">
                      <Button variant="outline" className="bg-white border-[#d9d9d9] text-[#333333] hover:bg-gray-50" onClick={handleInitiateProposalFlow}>
                        Proposal
                      </Button>
                      <Button variant="outline" className="bg-white border-[#d9d9d9] text-[#333333] hover:bg-gray-50" onClick={handleCeMode}>
                        Cost Estimate
                      </Button>
                      <Button variant="outline" className="bg-white border-[#d9d9d9] text-[#333333] hover:bg-gray-50" onClick={handleQuoteMode}>
                        Quotation
                      </Button>
                      <Button variant="outline" className="bg-white border-[#d9d9d9] text-[#333333] hover:bg-gray-50" onClick={() => router.push("/sales/job-orders/select-quotation")}>
                        Job Order
                      </Button>
                      <Button variant="outline" className="bg-white border-[#d9d9d9] text-[#333333] hover:bg-gray-50" onClick={() => setIsCollabPartnerDialogOpen(true)}>
                        Collab
                      </Button>
                    </div>
                  </div>

                  {/* Search and View Controls */}
                  <div className="flex justify-between items-center">
                    <div className="relative">
                      <div className="w-80 mt-2 mb-2">
                        <SearchBox
                          onSearchResults={handleSearchResults}
                          onSearchError={handleSearchError}
                          onSearchLoading={handleSearchLoading}
                          onSearchClear={handleSearchClear}
                          userId={user?.uid}
                        />
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="icon" className="bg-white border-[#d9d9d9] hover:bg-gray-50" onClick={() => setViewMode("list")}>
                        <List className="w-4 h-4 text-[#b7b7b7]" />
                      </Button>
                      <Button variant="outline" size="icon" className="bg-white border-[#d9d9d9] hover:bg-gray-50" onClick={() => setViewMode("grid")}>
                        <Grid3X3 className="w-4 h-4 text-[#b7b7b7]" />
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              {/* Search and Client Selection - Side by side layout */}
              {(proposalCreationMode || ceQuoteMode) && (
                <div className="flex items-center gap-4 mt-4 mb-4">
                  {/* Search Bar */}
                  <div className="flex items-center gap-2">
                    <span className="text-xl font-medium text-gray-900">Search:</span>
                    <div className="relative w-[311px]">
                      <Input
                        placeholder="Search"
                        value=""
                        onChange={() => {}}
                        className="h-[39px] text-sm border-gray-400 rounded-[10px]"
                        aria-label="Search sites"
                      />
                    </div>
                  </div>

                  {/* Client Selection */}
                  <div className="flex items-center gap-2">
                    <span className="text-xl font-medium text-gray-900">Client:</span>
                    <div className="relative w-[311px]" ref={clientSearchRef}>
                      <div className="relative">
                        <Input
                          placeholder="Select client"
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
                            "h-[39px] pr-10 text-sm rounded-[10px] border-gray-400",
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
                  </div>
                </div>
              )}

              {/* Static/Digital Toggle Buttons - Visible when proposalCreationMode OR ceQuoteMode is active */}
              {(proposalCreationMode || ceQuoteMode) && (
                <div className="flex items-center gap-4 mt-4 mb-4">
                  <Button
                    variant="default"
                    className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-md font-bold"
                    aria-label="Select static display type"
                    aria-pressed={true}
                  >
                    Static
                  </Button>
                  <Button
                    variant="outline"
                    className="border-gray-400 text-gray-900 hover:bg-gray-50 px-4 py-2 rounded-md font-medium"
                    aria-label="Select digital display type"
                    aria-pressed={false}
                  >
                    Digital
                  </Button>
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
                        <ResponsiveCardGrid
                          mobileColumns={1}
                          tabletColumns={2}
                          desktopColumns={5}
                          gap="xl"
                        >
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
                      <ResponsiveCardGrid
                        mobileColumns={1}
                        tabletColumns={2}
                        desktopColumns={4}
                        gap="lg"
                      >
                        {products.map((product) => (
                          <ProductCard
                            key={product.id}
                            product={product}
                            hasOngoingBooking={productsWithBookings[product.id || ""] || false}
                            onView={() => handleViewDetails(product.id || "")}
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
                                      handleViewDetails(product.id || "")
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
                                            className={`h-full w-full object-cover ${productsWithBookings[product.id || ""] ? "grayscale" : ""}`}
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
                                    {product.specs_rental?.location || (product as any).light?.location || "Unknown location"}
                                  </TableCell>
                                  <TableCell>
                                    {product.price ? `₱${Number(product.price).toLocaleString()}` : "Not set"}
                                  </TableCell>
                                  <TableCell className="hidden md:table-cell">{getSiteCode(product) || "—"}</TableCell>
                                  <TableCell>
                                    {product.type?.toLowerCase() === "rental" &&
                                      (productsWithBookings[product.id || ""] ? (
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

{/* Right Column: Proposal History - Always show when in proposal mode or when copying sites */}
{proposalCreationMode && (
  <div className="flex flex-col gap-4 pt-4 md:pt-6 h-[calc(100vh-120px)]">
    <ProposalHistory
      selectedClient={selectedClientForProposal}
      onCopySites={handleCopySitesFromProposal}
    />
  </div>
)}

          </div>
        )}

        {/* Next Button - Fixed position when in proposal mode */}
        {proposalCreationMode && (
          <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-50">
            <div className="bg-white rounded-[50px] w-[440px] h-[112px] shadow-lg border border-gray-200 relative">
              <Button
                onClick={handleConfirmProposalCreation}
                disabled={!selectedClientForProposal || selectedProducts.length === 0 || isCreatingProposal}
                className={`absolute left-[238px] top-[25px] w-[175px] h-[61px] text-[30px] font-bold rounded-[15px] transition-all duration-200 ${
                  selectedClientForProposal && selectedProducts.length > 0
                    ? "bg-[#1d0beb] hover:bg-blue-700 text-white"
                    : "bg-gray-400 text-gray-600 cursor-not-allowed"
                }`}
                aria-label={`Create proposal with ${selectedProducts.length} selected sites`}
              >
                {isCreatingProposal ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    Next →
                  </>
                )}
              </Button>
              <div className="absolute left-[123px] top-[86px] text-[20px] font-semibold text-gray-900 text-center w-[160px]">
                ({selectedProducts.length}) selected
              </div>
            </div>
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
          selectedSiteIds={selectedSites.map((site) => site.id || "")}
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
              open: true, // Add the missing 'open' property
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
  const { user, userData } = useAuth()

  return (
    <RouteProtection requiredRoles="sales">
      <div className="min-h-screen bg-[#fafafa] p-6">
        <div className="max-w-7xl mx-auto">
          <SalesDashboardContent />

          {/* Render SalesChatWidget without the floating button */}
          <SalesChatWidget />
        </div>
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
  // Get the first media item for the thumbnail
  const thumbnailUrl =
    product.media && product.media.length > 0 ? product.media[0].url : "/abstract-geometric-sculpture.png"

  // Determine location based on product type
  const location = product.specs_rental?.location || product.light?.location || "Unknown location"

  // Format price if available
  const formattedPrice = product.price ? `₱${Number(product.price).toLocaleString()}/month` : "Price not set"

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
    <div
      className={cn(
        "bg-white rounded-2xl shadow-lg overflow-hidden cursor-pointer transition-all hover:shadow-xl border",
        isSelected ? "border-green-500" : "border-gray-200",
        selectionMode ? "hover:border-green-300" : "",
      )}
      onClick={handleClick}
    >
      <div className="h-[218px] bg-gray-300 relative rounded-t-2xl">
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
          <div className="absolute top-3 left-3 z-10">
            <div
              className={cn(
                "w-6 h-6 rounded-full border-2 flex items-center justify-center",
                isSelected ? "bg-green-500 border-green-500" : "bg-white border-gray-300",
              )}
            >
              {isSelected && <CheckCircle2 size={16} className="text-white" />}
            </div>
          </div>
        )}

        {/* Site Photo label */}
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-lg font-semibold text-black bg-white bg-opacity-80 px-3 py-1 rounded-md">
            Site Photo
          </span>
        </div>
      </div>

      <div className="p-4">
        <div className="space-y-2">
          <div className="text-sm text-gray-500 font-medium">Site Code</div>
          <div className="text-sm text-black font-medium">{siteCode || "N/A"}</div>

          <div className="text-sm text-black font-medium">Site Name</div>
          <div className="text-sm text-black font-medium line-clamp-1">{product.name}</div>

          <div className="text-sm text-black font-medium">Location</div>
          <div className="text-sm text-black font-medium flex items-center">
            <MapPin size={12} className="mr-1 flex-shrink-0" />
            <span className="truncate">{location}</span>
          </div>

          <div className="text-sm text-black font-medium">PRICE</div>
          <div className="text-sm font-medium text-green-700">{formattedPrice}</div>
        </div>
      </div>
    </div>
  )
}

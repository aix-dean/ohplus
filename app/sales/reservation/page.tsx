"use client"

import { useState, useEffect, useCallback } from "react"
import { useAuth } from "@/contexts/auth-context"
import { collection, query, where, orderBy, limit, startAfter, getDocs, doc, getDoc, DocumentData, QueryDocumentSnapshot } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { format } from "date-fns"
import { Search, MoreHorizontal, FileText, Calculator } from "lucide-react"
import { Input } from "@/components/ui/input"
import { useRouter } from "next/navigation"
import { useToast } from "@/hooks/use-toast"
import { CreateReportDialog } from "@/components/create-report-dialog"
import { createJobOrder, generatePersonalizedJONumber, getQuotationDetailsForJobOrder } from "@/lib/job-order-service"
import { createReport } from "@/lib/report-service"
import type { JobOrderStatus } from "@/lib/types/job-order"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { searchProducts, SearchResult } from "@/lib/algolia-service"
import { Pagination } from "@/components/ui/pagination"

interface Booking {
  id: string
  product_name?: string
  product_id?: string
  product_owner?: string
  client_name?: string
  start_date?: any
  end_date?: any
  status?: string
  created?: any
  quotation_id?: string
}

interface Product {
  id?: string
  site_code?: string
  specs_rental?: {
    site_code?: string
    location?: string
  }
  light?: {
    site_code?: string
    location?: string
  }
  siteCode?: string
  [key: string]: any
}

// Function to get site code from product - following the pattern from sales dashboard
const getSiteCode = (product: Product | null) => {
  if (!product) return null

  // Try different possible locations for site_code
  if (product.site_code) return product.site_code
  if (product.specs_rental && "site_code" in product.specs_rental) return product.specs_rental.site_code
  if (product.light && "site_code" in product.light) return product.light.site_code

  // Check for camelCase variant
  if ("siteCode" in product) return product.siteCode

  return null
}

export default function ReservationsPage() {
  const { user, userData } = useAuth()
  const router = useRouter()
  const { toast } = useToast()
  const [searchQuery, setSearchQuery] = useState("")
  const [bookings, setBookings] = useState<Booking[]>([])
  const [algoliaSearchResults, setAlgoliaSearchResults] = useState<SearchResult[]>([])
  const [loading, setLoading] = useState(true)
  const [products, setProducts] = useState<{ [key: string]: Product }>({})
  const [isSearchingAlgolia, setIsSearchingAlgolia] = useState(false)

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage] = useState(15)
  const [lastVisibleDocs, setLastVisibleDocs] = useState<QueryDocumentSnapshot<DocumentData>[]>([null as any]) // Stores last visible doc for each page
  const [hasMore, setHasMore] = useState(true)

  const [createReportDialogOpen, setCreateReportDialogOpen] = useState(false)
  const [selectedProductForReport, setSelectedProductForReport] = useState<string>("")
  const [isCreatingJobOrder, setIsCreatingJobOrder] = useState(false)
  const [isCreatingReport, setIsCreatingReport] = useState(false)

  useEffect(() => {
    const fetchBookings = async () => {
      if (!user?.uid || !userData?.company_id) return

      try {
        setLoading(true)
        const bookingsRef = collection(db, "booking")
        let bookingsQuery = query(
          bookingsRef,
          where("company_id", "==", userData.company_id),
          where("quotation_id", "!=", null), // Add this line to filter by quotation_id being set
          orderBy("created", "desc"),
          limit(itemsPerPage + 1) // Fetch one more to check if there's a next page
        )

        const lastDoc = lastVisibleDocs[currentPage - 1]
        if (lastDoc) {
          bookingsQuery = query(
            bookingsRef,
            where("company_id", "==", userData.company_id),
            where("quotation_id", "!=", null), // Add this line to filter by quotation_id being set
            orderBy("created", "desc"),
            startAfter(lastDoc),
            limit(itemsPerPage + 1)
          )
        }

        const querySnapshot = await getDocs(bookingsQuery)
        const fetchedBookings: Booking[] = []
        const newLastVisible = querySnapshot.docs[querySnapshot.docs.length - 1]

        setHasMore(querySnapshot.docs.length > itemsPerPage)

        querySnapshot.docs.slice(0, itemsPerPage).forEach((doc) => {
          fetchedBookings.push({ id: doc.id, ...doc.data() })
        })

        setBookings(fetchedBookings)

        // Only update lastVisibleDocs if we are moving to a new page (i.e., currentPage is the last index)
        if (newLastVisible && currentPage === lastVisibleDocs.length) {
          setLastVisibleDocs((prev) => [...prev, newLastVisible])
        }


        const productIds = fetchedBookings
          .map((booking) => booking.product_id)
          .filter((id): id is string => Boolean(id))

        const uniqueProductIds = [...new Set(productIds)]
        const productData: { [key: string]: Product } = {}

        for (const productId of uniqueProductIds) {
          try {
            const productDoc = await getDoc(doc(db, "products", productId))
            if (productDoc.exists()) {
              productData[productId] = { id: productDoc.id, ...productDoc.data() }
            }
          } catch (error) {
            console.error(`Error fetching product ${productId}:`, error)
          }
        }

        setProducts(productData)
      } catch (error) {
        console.error("Error fetching bookings:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchBookings()
  }, [user, userData, currentPage, itemsPerPage, lastVisibleDocs.length])

  const formatDate = (date: any) => {
    if (!date) return "N/A"
    try {
      if (date && typeof date.toDate === "function") {
        return format(date.toDate(), "MMM d, yyyy")
      }
      if (typeof date === "string") {
        return format(new Date(date), "MMM d, yyyy")
      }
      return "N/A"
    } catch (error) {
      return "N/A"
    }
  }

  const calculateDuration = (startDate: any, endDate: any) => {
    if (!startDate || !endDate) return "N/A"

    try {
      const start = startDate.toDate ? startDate.toDate() : new Date(startDate)
      const end = endDate.toDate ? endDate.toDate() : new Date(endDate)

      const months = (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth())
      return `${months} ${months === 1 ? "month" : "months"}`
    } catch (error) {
      return "N/A"
    }
  }

  const performAlgoliaSearch = useCallback(async () => {
    if (!searchQuery.trim()) {
      setAlgoliaSearchResults([])
      return
    }

    setIsSearchingAlgolia(true)
    try {
      const { hits } = await searchProducts(searchQuery, userData?.company_id || undefined)
      setAlgoliaSearchResults(hits)
    } catch (error) {
      console.error("Algolia search failed:", error)
      setAlgoliaSearchResults([])
    } finally {
      setIsSearchingAlgolia(false)
    }
  }, [searchQuery, userData?.company_id])

  useEffect(() => {
    const handler = setTimeout(() => {
      if (searchQuery.trim()) {
        performAlgoliaSearch()
      } else {
        setAlgoliaSearchResults([])
      }
    }, 300) // Debounce search input

    return () => {
      clearTimeout(handler)
    }
  }, [searchQuery, performAlgoliaSearch])

  const getFilteredBookings = () => {
    if (searchQuery.trim() && algoliaSearchResults.length > 0) {
      const algoliaProductIds = new Set(algoliaSearchResults.map((hit) => hit.objectID))
      return bookings.filter((booking) => algoliaProductIds.has(booking.product_id || ""))
    }
    // Fallback to client-side filtering if no Algolia results or no search query
    return bookings.filter((booking) => {
      const product = booking.product_id ? products[booking.product_id] : null
      const siteCode = getSiteCode(product)

      return (
        siteCode?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        booking.client_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        booking.status?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    })
  }

  const handleCreateReport = (productId: string) => {
    setSelectedProductForReport(productId)
    setCreateReportDialogOpen(true)
  }

  const handleCreateJobOrder = async (booking: Booking) => {
    if (!user?.uid || !userData?.company_id || !booking.quotation_id) {
      toast({
        title: "Error",
        description: "Missing required information (user, company, or quotation ID) to create Job Order.",
        variant: "destructive",
      });
      return;
    }

    setIsCreatingJobOrder(true)
    try {
      // Fetch quotation details
      const quotationDetails = await getQuotationDetailsForJobOrder(booking.quotation_id);

      if (!quotationDetails) {
        toast({
          title: "Error",
          description: "Quotation details not found for the selected reservation.",
          variant: "destructive",
        });
        return;
      }

      const { quotation, products: quotationProducts, client } = quotationDetails;
      const mainProduct = quotationProducts[0]; // Assuming the first product is the main one for job order creation
      const siteCode = getSiteCode(mainProduct);

      const joNumber = await generatePersonalizedJONumber(userData); // Generate personalized JO number

      const jobOrderData = {
        joNumber: joNumber,
        siteName: mainProduct?.name || "N/A",
        siteLocation: mainProduct?.specs_rental?.location || mainProduct?.light?.location || "N/A",
        joType: "Installation", // Default type, can be made dynamic later
        requestedBy: `${userData.first_name} ${userData.last_name}`,
        assignTo: user.uid, // Assign to the current user for now
        dateRequested: quotation.created?.toDate() || new Date(), // Use quotation creation date
        deadline: quotation.end_date ? new Date(quotation.end_date) : new Date(), // Use quotation end date as deadline
        jobDescription: `Job Order for reservation of site ${siteCode} by client ${quotation.client_name}.`,
        message: `This Job Order is linked to quotation ID: ${quotation.id}.`,
        attachments: [],
        company_id: userData.company_id,
        quotation_id: quotation.id, // Link to the actual quotation ID
        product_id: mainProduct?.id,
        clientName: quotation.client_name || "N/A",
        siteCode: siteCode || "N/A",
        created_by: user.uid,
        total_amount: quotation.total_amount, // Add total_amount from quotation
      };

      const jobOrderId = await createJobOrder(jobOrderData, user.uid, "pending" as JobOrderStatus);
      toast({
        title: "Job Order Created",
        description: `Job Order ${jobOrderId} has been created successfully.`,
      });
      router.push(`/sales/job-orders/create?quotationId=${quotation.id}`);
    } catch (error) {
      console.error("Error creating Job Order:", error);
      toast({
        title: "Error",
        description: "Failed to create Job Order. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsCreatingJobOrder(false);
    }
  };

  const displayedReservations = getFilteredBookings()

  const handleNextPage = () => {
    if (hasMore) {
      setCurrentPage((prevPage) => prevPage + 1)
    }
  }

  const handlePreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage((prevPage) => prevPage - 1)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto p-4 md:p-6 lg:p-8">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold text-gray-900 mb-1">Reservations</h1>
          <p className="text-sm text-gray-600">See the status of the quotations you've generated</p>
        </div>

        <div className="flex items-center justify-between mb-6">
          <div className="relative w-80">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <Input
              type="search"
              placeholder=""
              className="pl-10 bg-white border-gray-300"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-600">
              Total Reservations: {loading || isSearchingAlgolia ? "..." : displayedReservations.length}
            </span>
            <Button
              variant="outline"
              size="sm"
              className="text-blue-600 border-blue-600 hover:bg-blue-50 bg-transparent"
            >
              See History
            </Button>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50">
                <TableHead className="font-semibold text-gray-900">Site</TableHead>
                <TableHead className="font-semibold text-gray-900">Client</TableHead>
                <TableHead className="font-semibold text-gray-900">From</TableHead>
                <TableHead className="font-semibold text-gray-900">To</TableHead>
                <TableHead className="font-semibold text-gray-900">Total</TableHead>
                <TableHead className="font-semibold text-gray-900">Status</TableHead>
                <TableHead className="font-semibold text-gray-900">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                Array(5)
                  .fill(0)
                  .map((_, i) => (
                    <TableRow key={i}>
                      <TableCell>
                        <Skeleton className="h-4 w-24" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-4 w-32" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-4 w-24" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-4 w-24" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-4 w-20" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-4 w-16" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-4 w-8" />
                      </TableCell>
                    </TableRow>
                  ))
              ) : displayedReservations.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                    No reservations found
                  </TableCell>
                </TableRow>
              ) : (
                displayedReservations.map((booking: Booking) => {
                  const product = booking.product_id ? products[booking.product_id] : null
                  const siteCode = getSiteCode(product)

                  return (
                    <TableRow key={booking.id} className="hover:bg-gray-50">
                      <TableCell className="font-medium">{booking.product_name || "-"}</TableCell>
                      <TableCell>{booking.client_name || "N/A"}</TableCell>
                      <TableCell>{formatDate(booking.start_date)}</TableCell>
                      <TableCell>{formatDate(booking.end_date)}</TableCell>
                      <TableCell>{calculateDuration(booking.start_date, booking.end_date)}</TableCell>
                      <TableCell>
                        <Badge
                          variant={booking.status?.toLowerCase() === "confirmed" ? "default" : "secondary"}
                          className={
                            booking.status?.toLowerCase() === "confirmed"
                              ? "bg-green-100 text-green-800 hover:bg-green-100"
                              : "bg-blue-100 text-blue-800 hover:bg-blue-100"
                          }
                        >
                          {booking.status?.toUpperCase() || "PENDING"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleCreateJobOrder(booking)} disabled={isCreatingJobOrder}>
                              {isCreatingJobOrder ? "Creating JO..." : "Create JO"}
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleCreateReport(booking.product_id || "")} disabled={isCreatingReport}>
                              {isCreatingReport ? "Creating Report..." : "Create Report"}
                            </DropdownMenuItem>
                            <DropdownMenuItem className="text-red-600">Cancel</DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  )
                })
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination Controls */}
        <div className="flex justify-end mt-4">
          <Pagination
            currentPage={currentPage}
            itemsPerPage={itemsPerPage}
            totalItems={displayedReservations.length} // This will be inaccurate for true total, but works for current page display
            onNextPage={handleNextPage}
            onPreviousPage={handlePreviousPage}
            hasMore={hasMore}
          />
        </div>
      </div>

      <CreateReportDialog
        open={createReportDialogOpen}
        onOpenChange={setCreateReportDialogOpen}
        siteId={selectedProductForReport}
        module="sales"
      />
    </div>
  )
}

"use client"

import { useState, useEffect, useCallback } from "react"
import { useAuth } from "@/contexts/auth-context"
import { collection, query, where, orderBy, limit, startAfter, getDocs, doc, getDoc, DocumentData, QueryDocumentSnapshot, serverTimestamp, updateDoc, getCountFromServer } from "firebase/firestore"
import { db, storage } from "@/lib/firebase"
import { ref, uploadBytes, getDownloadURL } from "firebase/storage"
import { format } from "date-fns"
import { Search, MoreHorizontal, FileText, Calculator, ChevronDown, ChevronRight, Upload, Loader2, CheckCircle, ChevronLeft } from "lucide-react"
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
  reservation_id?: string // Generated reservation ID with format "RV-" + currentmillis
  projectCompliance?: {
    signedContract?: { status: string; fileUrl?: string; fileName?: string };
    irrevocablePo?: { status: string; fileUrl?: string; fileName?: string };
    paymentAsDeposit?: { status: string; note?: string; fileUrl?: string; fileName?: string };
    finalArtwork?: { status: string; fileUrl?: string; fileName?: string };
    signedQuotation?: { status: string; fileUrl?: string; fileName?: string };
  };
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
  const [expandedCompliance, setExpandedCompliance] = useState<Set<string>>(new Set())
  const [uploadingFiles, setUploadingFiles] = useState<Set<string>>(new Set())

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage] = useState(10)
  const [lastDoc, setLastDoc] = useState<any>(null)
  const [pageLastDocs, setPageLastDocs] = useState<{ [page: number]: any }>({})
  const [hasMore, setHasMore] = useState(true)

  const [createReportDialogOpen, setCreateReportDialogOpen] = useState(false)
  const [selectedProductForReport, setSelectedProductForReport] = useState<string>("")
  const [isCreatingJobOrder, setIsCreatingJobOrder] = useState(false)
  const [isCreatingReport, setIsCreatingReport] = useState(false)
  const [totalReservationsCount, setTotalReservationsCount] = useState<number>(0)

  const fetchTotalReservationsCount = async () => {
    if (!user?.uid || !userData?.company_id) return

    try {
      const bookingsRef = collection(db, "booking")
      const countQuery = query(
        bookingsRef,
        where("company_id", "==", userData.company_id)
      )

      const snapshot = await getCountFromServer(countQuery)
      setTotalReservationsCount(snapshot.data().count)
    } catch (error) {
      console.error("Error fetching total reservations count:", error)
    }
  }

  const fetchBookings = async (page: number = 1, reset: boolean = false) => {
    if (!user?.uid || !userData?.company_id) return

    try {
      setLoading(true)
      const bookingsRef = collection(db, "booking")
      let bookingsQuery = query(
        bookingsRef,
        where("company_id", "==", userData.company_id),
        orderBy("created", "desc"),
        limit(itemsPerPage + 1) // Fetch one extra to check if there's a next page
      )

      // If not the first page, start after the last document of the previous page
      if (page > 1 && !reset) {
        const prevPageLastDoc = pageLastDocs[page - 1]
        if (prevPageLastDoc) {
          bookingsQuery = query(bookingsQuery, startAfter(prevPageLastDoc))
        }
      }

      const querySnapshot = await getDocs(bookingsQuery)
      const fetchedBookings: Booking[] = []

      querySnapshot.forEach((doc) => {
        fetchedBookings.push({ id: doc.id, ...doc.data() })
      })

      // Check if there are more pages
      const hasMore = fetchedBookings.length > itemsPerPage
      const currentPageData = hasMore ? fetchedBookings.slice(0, itemsPerPage) : fetchedBookings

      // Store the last document for this page
      const pageLastDoc = hasMore ? querySnapshot.docs[itemsPerPage - 1] : querySnapshot.docs[querySnapshot.docs.length - 1]

      if (pageLastDoc) {
        setPageLastDocs(prev => ({
          ...prev,
          [page]: pageLastDoc
        }))
      }

      setBookings(currentPageData)
      setLastDoc(pageLastDoc)
      setHasMore(hasMore)

      const productIds = currentPageData
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

  useEffect(() => {
    fetchBookings(1, true)
    fetchTotalReservationsCount()
  }, [user, userData])

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

  const getProjectCompliance = (booking: Booking) => {
    const compliance = booking.projectCompliance || {}

    const toReserveItems = [
      {
        key: "signedContract",
        name: "Signed Contract",
        status: compliance.signedContract?.status || "upload",
        file: compliance.signedContract?.fileName,
        fileUrl: compliance.signedContract?.fileUrl,
      },
      {
        key: "irrevocablePo",
        name: "Irrevocable PO",
        status: compliance.irrevocablePo?.status || "upload",
        file: compliance.irrevocablePo?.fileName,
        fileUrl: compliance.irrevocablePo?.fileUrl,
      },
      {
        key: "paymentAsDeposit",
        name: "Payment as Deposit",
        status: compliance.paymentAsDeposit?.status || "confirmation",
        note: "For Treasury's confirmation",
        file: compliance.paymentAsDeposit?.fileName,
        fileUrl: compliance.paymentAsDeposit?.fileUrl,
      },
    ]

    const otherRequirementsItems = [
      {
        key: "finalArtwork",
        name: "Final Artwork",
        status: compliance.finalArtwork?.status || "upload",
        file: compliance.finalArtwork?.fileName,
        fileUrl: compliance.finalArtwork?.fileUrl,
      },
      {
        key: "signedQuotation",
        name: "Signed Quotation",
        status: compliance.signedQuotation?.status || "upload",
        file: compliance.signedQuotation?.fileName,
        fileUrl: compliance.signedQuotation?.fileUrl,
      },
    ]

    const allItems = [...toReserveItems, ...otherRequirementsItems]
    const completed = allItems.filter((item) => item.status === "completed").length
    return {
      completed,
      total: allItems.length,
      toReserve: toReserveItems,
      otherRequirements: otherRequirementsItems,
    }
  }

  const toggleComplianceExpansion = (bookingId: string) => {
    setExpandedCompliance((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(bookingId)) {
        newSet.delete(bookingId)
      } else {
        newSet.add(bookingId)
      }
      return newSet
    })
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

  const handleFileUpload = async (bookingId: string, complianceType: string, file: File) => {
    const uploadKey = `${bookingId}-${complianceType}`
    setUploadingFiles((prev) => new Set(prev).add(uploadKey))

    try {
      if (file.type !== "application/pdf") {
        throw new Error("Only PDF files are allowed")
      }

      if (file.size > 10 * 1024 * 1024) {
        throw new Error("File size must be less than 10MB")
      }

      const fileName = `${Date.now()}-${file.name}`
      const storageRef = ref(storage, `bookings/${bookingId}/compliance/${complianceType}/${fileName}`)

      const snapshot = await uploadBytes(storageRef, file)
      const downloadURL = await getDownloadURL(snapshot.ref)

      // Find the booking to get the quotation_id
      const currentBooking = bookings.find(b => b.id === bookingId)
      const quotationId = currentBooking?.quotation_id

      const updateData: { [key: string]: any } = {
        [`projectCompliance.${complianceType}`]: {
          status: "completed",
          fileUrl: downloadURL,
          fileName: file.name,
          uploadedAt: serverTimestamp(),
          uploadedBy: user?.uid,
        },
        updated: serverTimestamp(),
      }

      // Update booking document
      const bookingRef = doc(db, "booking", bookingId)
      await updateDoc(bookingRef, updateData)

      // Update quotation document if quotation_id exists
      if (quotationId) {
        try {
          const quotationRef = doc(db, "quotations", quotationId)
          await updateDoc(quotationRef, updateData)
          console.log(`Updated quotation ${quotationId} with compliance data`)
        } catch (quotationError) {
          console.error("Error updating quotation:", quotationError)
          // Don't fail the entire operation if quotation update fails
        }
      }

      setBookings((prevBookings) =>
        prevBookings.map((b) =>
          b.id === bookingId
            ? {
                ...b,
                projectCompliance: {
                  ...b.projectCompliance,
                  [complianceType]: {
                    status: "completed",
                    fileUrl: downloadURL,
                    fileName: file.name,
                    uploadedAt: new Date().toISOString(), // Placeholder, actual timestamp is server-side
                    uploadedBy: user?.uid,
                  },
                },
              }
            : b,
        ),
      )

      toast({
        title: "Success",
        description: `${complianceType.replace(/([A-Z])/g, " $1").replace(/^./, (str) => str.toUpperCase())} uploaded successfully`,
      })
    } catch (error: any) {
      console.error("Error uploading file:", error)
      toast({
        title: "Upload Failed",
        description: error.message || "Failed to upload file. Please try again.",
        variant: "destructive",
      })
    } finally {
      setUploadingFiles((prev) => {
        const newSet = new Set(prev)
        newSet.delete(uploadKey)
        return newSet
      })
    }
  }

  const triggerFileUpload = (bookingId: string, complianceType: string) => {
    const input = document.createElement("input")
    input.type = "file"
    input.accept = ".pdf"
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (file) {
        handleFileUpload(bookingId, complianceType, file)
      }
    }
    input.click()
  }

  const displayedReservations = getFilteredBookings()

  const handleNextPage = async () => {
    if (hasMore) {
      const nextPage = currentPage + 1
      setCurrentPage(nextPage)
      await fetchBookings(nextPage, false)
    }
  }

  const handlePreviousPage = async () => {
    if (currentPage > 1) {
      const prevPage = currentPage - 1
      setCurrentPage(prevPage)
      await fetchBookings(prevPage, false)
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
              Total Reservations: {loading ? "..." : totalReservationsCount}
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
                <TableHead className="font-semibold text-gray-900">Reservation ID</TableHead>
                <TableHead className="font-semibold text-gray-900">Site</TableHead>
                <TableHead className="font-semibold text-gray-900">Client</TableHead>
                <TableHead className="font-semibold text-gray-900">From</TableHead>
                <TableHead className="font-semibold text-gray-900">To</TableHead>
                <TableHead className="font-semibold text-gray-900">Total</TableHead>
                <TableHead className="font-semibold text-gray-900">Status</TableHead>
                <TableHead className="font-semibold text-gray-900">Project Compliance</TableHead>
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
                        <Skeleton className="h-4 w-28" />
                      </TableCell>
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
                        <Skeleton className="h-4 w-16" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-4 w-8" />
                      </TableCell>
                    </TableRow>
                  ))
              ) : displayedReservations.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-8 text-gray-500">
                    No reservations found
                  </TableCell>
                </TableRow>
              ) : (
                displayedReservations.map((booking: Booking) => {
                  const product = booking.product_id ? products[booking.product_id] : null
                  const siteCode = getSiteCode(product)
                  const compliance = getProjectCompliance(booking)
                  const isExpanded = expandedCompliance.has(booking.id)

                  return (
                    <TableRow
                      key={booking.id}
                      className="hover:bg-gray-50 cursor-pointer"
                      onClick={() => router.push(`/sales/reservation/${booking.id}`)}
                    >
                      <TableCell className="font-medium text-sm font-mono">{booking.reservation_id || "N/A"}</TableCell>
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
                      <TableCell className="py-3 text-sm text-gray-700">
                        <div className="space-y-2">
                          <div
                            className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 p-1 rounded"
                            onClick={() => toggleComplianceExpansion(booking.id)}
                          >
                            <span className="font-medium">
                              {compliance.completed}/{compliance.total}
                            </span>
                            <div className="w-2 h-2 rounded-full bg-gray-300"></div>
                            <div className="transition-transform duration-200 ease-in-out">
                              {isExpanded ? (
                                <ChevronDown className="w-3 h-3 text-gray-400" />
                              ) : (
                                <ChevronRight className="w-3 h-3 text-gray-400" />
                              )}
                            </div>
                          </div>

                          <div
                            className={`overflow-hidden transition-all duration-300 ease-in-out ${
                              isExpanded ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
                            }`}
                          >
                            <div className="space-y-1 pt-1">
                                <p className="text-xs font-semibold text-gray-800 mt-2 mb-1">To Reserve</p>
                                {compliance.toReserve.map((item: any, index: number) => {
                                  const uploadKey = `${booking.id}-${item.key}`
                                  const isUploading = uploadingFiles.has(uploadKey)

                                  return (
                                    <div
                                      key={index}
                                      className="flex items-center justify-between text-xs animate-in fade-in-0 slide-in-from-top-1"
                                      style={{
                                        animationDelay: isExpanded ? `${index * 50}ms` : "0ms",
                                        animationDuration: "200ms",
                                      }}
                                    >
                                      <div className="flex items-center gap-2">
                                        {item.status === "completed" ? (
                                          <div className="w-4 h-4 rounded-full bg-green-500 flex items-center justify-center flex-shrink-0">
                                            <CheckCircle className="w-3 h-3 text-white" />
                                          </div>
                                        ) : (
                                          <div className="w-4 h-4 rounded-full border border-gray-300 flex-shrink-0"></div>
                                        )}
                                        <div className="flex flex-col">
                                          <span className="text-gray-700">{item.name}</span>
                                          {item.note && <span className="text-xs text-gray-500 italic">{item.note}</span>}
                                        </div>
                                      </div>
                                      <div className="flex items-center gap-1">
                                        {item.file && item.fileUrl ? (
                                          <a
                                            href={item.fileUrl}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-blue-600 hover:underline cursor-pointer flex items-center gap-1"
                                            onClick={(e) => e.stopPropagation()}
                                          >
                                            <FileText className="w-3 h-3" />
                                            {item.file}
                                          </a>
                                        ) : item.status === "upload" ? (
                                          <Button
                                            size="sm"
                                            variant="outline"
                                            className="h-6 px-2 text-xs bg-transparent"
                                            onClick={(e) => {
                                              e.stopPropagation()
                                              triggerFileUpload(booking.id, item.key)
                                            }}
                                            disabled={isUploading}
                                          >
                                            {isUploading ? (
                                              <>
                                                <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                                                Uploading...
                                              </>
                                            ) : (
                                              <>
                                                <Upload className="w-3 h-3 mr-1" />
                                                Upload
                                              </>
                                            )}
                                          </Button>
                                        ) : item.status === "confirmation" ? (
                                          <span className="text-gray-500 bg-gray-100 px-1 py-0.5 rounded text-xs">
                                            Pending
                                          </span>
                                        ) : null}
                                      </div>
                                    </div>
                                  )
                                })}

                                <p className="text-xs font-semibold text-gray-800 mt-4 mb-1">Other Requirements</p>
                                {compliance.otherRequirements.map((item: any, index: number) => {
                                  const uploadKey = `${booking.id}-${item.key}`
                                  const isUploading = uploadingFiles.has(uploadKey)

                                  return (
                                    <div
                                      key={index}
                                      className="flex items-center justify-between text-xs animate-in fade-in-0 slide-in-from-top-1"
                                      style={{
                                        animationDelay: isExpanded ? `${index * 50}ms` : "0ms",
                                        animationDuration: "200ms",
                                      }}
                                    >
                                      <div className="flex items-center gap-2">
                                        {item.status === "completed" ? (
                                          <div className="w-4 h-4 rounded-full bg-green-500 flex items-center justify-center flex-shrink-0">
                                            <CheckCircle className="w-3 h-3 text-white" />
                                          </div>
                                        ) : (
                                          <div className="w-4 h-4 rounded-full border border-gray-300 flex-shrink-0"></div>
                                        )}
                                        <span className="text-gray-700">{item.name}</span>
                                      </div>
                                      <div className="flex items-center gap-1">
                                        {item.file && item.fileUrl ? (
                                          <a
                                            href={item.fileUrl}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-blue-600 hover:underline cursor-pointer flex items-center gap-1"
                                            onClick={(e) => e.stopPropagation()}
                                          >
                                            <FileText className="w-3 h-3" />
                                            {item.file}
                                          </a>
                                        ) : item.status === "upload" ? (
                                          <Button
                                            size="sm"
                                            variant="outline"
                                            className="h-6 px-2 text-xs bg-transparent"
                                            onClick={(e) => {
                                              e.stopPropagation()
                                              triggerFileUpload(booking.id, item.key)
                                            }}
                                            disabled={isUploading}
                                          >
                                            {isUploading ? (
                                              <>
                                                <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                                                Uploading...
                                              </>
                                            ) : (
                                              <>
                                                <Upload className="w-3 h-3 mr-1" />
                                                Upload
                                              </>
                                            )}
                                          </Button>
                                        ) : item.status === "confirmation" ? (
                                          <span className="text-gray-500 bg-gray-100 px-1 py-0.5 rounded text-xs">
                                            Pending
                                          </span>
                                        ) : null}
                                      </div>
                                    </div>
                                  )
                                })}

                            </div>
                          </div>
                        </div>
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
          <div className="flex items-center justify-between px-4 py-3 sm:px-6">
            <div className="flex flex-1 justify-between sm:hidden">
              <Button onClick={handlePreviousPage} disabled={currentPage === 1 || loading} variant="outline" size="sm">
                Previous
              </Button>
              <Button onClick={handleNextPage} disabled={!hasMore || loading} variant="outline" size="sm">
                Next
              </Button>
            </div>
            <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-gray-700">
                  Showing <span className="font-medium">{(currentPage - 1) * itemsPerPage + 1}</span> to{" "}
                  <span className="font-medium">{(currentPage - 1) * itemsPerPage + bookings.length}</span> of{" "}
                  <span className="font-medium">{totalReservationsCount}</span> results
                </p>
              </div>
              <div>
                <nav className="isolate inline-flex -space-x-px rounded-md shadow-sm" aria-label="Pagination">
                  <Button
                    onClick={handlePreviousPage}
                    disabled={currentPage === 1 || loading}
                    variant="outline"
                    className="relative inline-flex items-center rounded-l-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0"
                  >
                    <span className="sr-only">Previous</span>
                    <ChevronLeft className="h-5 w-5" aria-hidden="true" />
                  </Button>
                  <span className="relative inline-flex items-center px-4 py-2 text-sm font-semibold text-gray-900 ring-1 ring-inset ring-gray-300 focus:outline-offset-0">
                    {currentPage}
                  </span>
                  <Button
                    onClick={handleNextPage}
                    disabled={!hasMore || loading}
                    variant="outline"
                    className="relative inline-flex items-center rounded-r-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0"
                  >
                    <span className="sr-only">Next</span>
                    <ChevronRight className="h-5 w-5" aria-hidden="true" />
                  </Button>
                </nav>
              </div>
            </div>
          </div>
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

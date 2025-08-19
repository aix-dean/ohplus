"use client"

import { useState, useEffect, useMemo } from "react"
import { useAuth } from "@/contexts/auth-context"
import { useRouter } from "next/navigation"
import {
  collection,
  query,
  where,
  orderBy,
  getDocs,
  addDoc,
  serverTimestamp,
  doc,
  getDoc,
  Timestamp,
} from "firebase/firestore"
import { db } from "@/lib/firebase"
import { format } from "date-fns"
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { CheckCircle, Search, X, MoreHorizontal } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"

export default function SalesQuotationsPage() {
  const { user } = useAuth()
  const [quotations, setQuotations] = useState<any[]>([])
  const [allQuotations, setAllQuotations] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [currentPage, setCurrentPage] = useState(1)
  const [signingQuotes, setSigningQuotes] = useState<Set<string>>(new Set())
  const router = useRouter()
  const pageSize = 10
  const { toast } = useToast()

  const filteredQuotations = useMemo(() => {
    let filtered = allQuotations

    // Apply search filter
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase()
      filtered = filtered.filter(
        (quotation) =>
          quotation.client_name?.toLowerCase().includes(searchLower) ||
          quotation.client_phone?.toLowerCase().includes(searchLower) ||
          quotation.quotation_number?.toLowerCase().includes(searchLower) ||
          quotation.client_address?.toLowerCase().includes(searchLower),
      )
    }

    // Apply status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter((quotation) => quotation.status?.toLowerCase() === statusFilter)
    }

    return filtered
  }, [allQuotations, searchTerm, statusFilter])

  const paginatedQuotations = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize
    const endIndex = startIndex + pageSize
    return filteredQuotations.slice(startIndex, endIndex)
  }, [filteredQuotations, currentPage, pageSize])

  const totalPages = Math.ceil(filteredQuotations.length / pageSize)

  const fetchAllQuotations = async () => {
    if (!user?.uid) {
      setLoading(false)
      return
    }

    setLoading(true)

    try {
      const quotationsRef = collection(db, "quotations")
      const q = query(quotationsRef, where("created_by", "==", user.uid), orderBy("created", "desc"))

      const querySnapshot = await getDocs(q)
      const fetchedQuotations: any[] = []

      querySnapshot.forEach((doc) => {
        fetchedQuotations.push({ id: doc.id, ...doc.data() })
      })

      setAllQuotations(fetchedQuotations)
    } catch (error) {
      console.error("Error fetching quotations:", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (user?.uid) {
      fetchAllQuotations()
    }
  }, [user?.uid])

  useEffect(() => {
    setCurrentPage(1)
  }, [searchTerm, statusFilter])

  const handlePageChange = (page: number) => {
    setCurrentPage(page)
  }

  const clearFilters = () => {
    setSearchTerm("")
    setStatusFilter("all")
    setCurrentPage(1)
  }

  const formatDate = (date: any) => {
    if (!date) return "N/A"
    try {
      if (date && typeof date.toDate === "function") {
        return format(date.toDate(), "MMM d, yyyy")
      }
      if (typeof date === "string") {
        return format(new Date(date), "MMM d, yyyy")
      }
      return "Invalid date"
    } catch (error) {
      return "Invalid date"
    }
  }

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case "booked":
        return "bg-red-100 text-red-800 border-red-200"
      case "sent":
        return "bg-blue-100 text-blue-800 border-blue-200"
      case "reserved":
        return "bg-gray-100 text-gray-800 border-gray-200"
      case "accepted":
        return "bg-green-100 text-green-800 border-green-200"
      case "draft":
        return "bg-gray-100 text-gray-800 border-gray-200"
      case "rejected":
        return "bg-red-100 text-red-800 border-red-200"
      case "expired":
        return "bg-orange-100 text-orange-800 border-orange-200"
      case "viewed":
        return "bg-purple-100 text-purple-800 border-purple-200"
      default:
        return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  const handleQuoteSigned = async (quotation: any) => {
    if (!quotation.id || !user?.uid) return

    setSigningQuotes((prev) => new Set(prev).add(quotation.id))

    try {
      // First, get the full quotation details including items
      const quotationRef = doc(db, "quotations", quotation.id)
      const quotationDoc = await getDoc(quotationRef)

      if (!quotationDoc.exists()) {
        throw new Error("Quotation not found")
      }

      const fullQuotationData = quotationDoc.data()
      const items = fullQuotationData.items || []

      if (items.length === 0) {
        throw new Error("No items found in quotation")
      }

      const startDate = fullQuotationData.start_date ? new Date(fullQuotationData.start_date) : new Date()
      const durationDays = fullQuotationData.duration_days || 30

      const collectionPeriods = []
      let remainingDays = durationDays
      const currentDate = new Date(startDate)

      while (remainingDays > 0) {
        const periodDays = Math.min(30, remainingDays)
        currentDate.setDate(currentDate.getDate() + (collectionPeriods.length === 0 ? 30 : periodDays))
        collectionPeriods.push({
          collectionDate: new Date(currentDate),
          periodDays: periodDays,
          periodNumber: collectionPeriods.length + 1,
        })
        remainingDays -= periodDays
      }

      // Generate collectibles for each item and each collection period
      const collectiblesPromises = []

      for (const item of items) {
        const productId = item.product_id || item.id || `product-${Date.now()}`
        const totalItemAmount = item.item_total_amount || item.price * durationDays || 0
        const itemName = item.name || `Product ${items.indexOf(item) + 1}`

        // Create collectibles for each collection period
        for (const period of collectionPeriods) {
          const periodAmount = (totalItemAmount / durationDays) * period.periodDays

          const collectibleData = {
            // Basic information from quotation
            client_name: quotation.client_name || fullQuotationData.client_name || "",
            company_id: user.company_id || user.uid,
            type: "sites", // Default to sites type based on the business model

            // Financial data - proportional amount for this period
            net_amount: periodAmount,
            total_amount: periodAmount,

            // Document references with period number
            invoice_no: `INV-${quotation.quotation_number}-${productId.toString().slice(-4)}-P${period.periodNumber}`,
            or_no: `OR-${Date.now()}-${productId.toString().slice(-4)}-P${period.periodNumber}`,
            bi_no: `BI-${Date.now()}-${productId.toString().slice(-4)}-P${period.periodNumber}`,

            // Payment information
            mode_of_payment: "Credit/Debit Card", // Default payment method
            bank_name: "", // To be filled later

            // Status and dates
            status: "pending",
            collection_date: Timestamp.fromDate(period.collectionDate), // Use calculated collection date
            covered_period: `${fullQuotationData.start_date?.split("T")[0] || new Date().toISOString().split("T")[0]} - ${fullQuotationData.end_date?.split("T")[0] || new Date().toISOString().split("T")[0]}`,

            // Sites-specific fields
            site: item.location || item.site_code || "",
            booking_no: `BK-${quotation.quotation_number}-${productId.toString().slice(-4)}-P${period.periodNumber}`,

            // Additional fields from collectibles model
            vendor_name: quotation.client_name || fullQuotationData.client_name || "",
            business_address: quotation.client_address || fullQuotationData.client_address || "",
            tin_no: "", // To be filled later

            // System fields
            deleted: false,
            created: serverTimestamp(),
            updated: serverTimestamp(),

            // Reference to original quotation
            quotation_id: quotation.id,
            quotation_number: quotation.quotation_number,
            product_name: itemName,
            product_id: productId,

            period_number: period.periodNumber,
            period_days: period.periodDays,
            total_periods: collectionPeriods.length,
            duration_days: durationDays,
          }

          collectiblesPromises.push(addDoc(collection(db, "collectibles"), collectibleData))
        }
      }

      // Execute all collectibles creation
      const results = await Promise.all(collectiblesPromises)

      toast({
        title: "Success",
        description: `Quote signed successfully! Generated ${results.length} collectible document${results.length > 1 ? "s" : ""} across ${collectionPeriods.length} collection period${collectionPeriods.length > 1 ? "s" : ""}.`,
      })

      // Optionally update quotation status to 'accepted'
      // await updateDoc(quotationRef, { status: 'accepted', updated: serverTimestamp() })
    } catch (error) {
      console.error("Error generating collectibles:", error)
      toast({
        title: "Error",
        description: "Failed to generate collectibles documents. Please try again.",
        variant: "destructive",
      })
    } finally {
      setSigningQuotes((prev) => {
        const newSet = new Set(prev)
        newSet.delete(quotation.id)
        return newSet
      })
    }
  }

  const getProjectCompliance = (quotation: any) => {
    const items = [
      { name: "Signed Quotation", status: "completed", file: "Quotation_Fairyskin.jpeg" },
      { name: "Signed Contract", status: "upload" },
      { name: "PO/MO", status: "upload" },
      { name: "Final Artwork", status: "upload" },
      { name: "Payment as Deposit", status: "confirmation", note: "For Treasury's confirmation" },
    ]

    const completed = items.filter((item) => item.status === "completed").length
    return { completed, total: items.length, items }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto p-4 md:p-6 lg:p-8">
        {user?.uid ? (
          <div className="space-y-6">
            <div className="space-y-2">
              <h1 className="text-2xl font-semibold text-gray-900">Quotation</h1>
              <p className="text-sm text-gray-600">See the status of the quotations you've generated</p>
            </div>

            <Card className="border-gray-200 shadow-sm rounded-xl">
              <CardHeader className="px-6 py-4 border-b border-gray-200">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div className="flex flex-col sm:flex-row gap-3 sm:items-center">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                      <Input
                        placeholder="Search by client, phone, or quotation number..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10 pr-10 w-full sm:w-80"
                      />
                      {searchTerm && (
                        <button
                          onClick={() => setSearchTerm("")}
                          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      )}
                    </div>

                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                      <SelectTrigger className="w-full sm:w-40">
                        <SelectValue placeholder="Filter by status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Status</SelectItem>
                        <SelectItem value="draft">Draft</SelectItem>
                        <SelectItem value="sent">Sent</SelectItem>
                        <SelectItem value="booked">Booked</SelectItem>
                        <SelectItem value="reserved">Reserved</SelectItem>
                        <SelectItem value="viewed">Viewed</SelectItem>
                        <SelectItem value="accepted">Accepted</SelectItem>
                        <SelectItem value="rejected">Rejected</SelectItem>
                        <SelectItem value="expired">Expired</SelectItem>
                      </SelectContent>
                    </Select>

                    {(searchTerm || statusFilter !== "all") && (
                      <Button variant="outline" onClick={clearFilters} size="sm">
                        Clear Filters
                      </Button>
                    )}
                  </div>
                </div>

                {!loading && (
                  <div className="text-sm text-gray-600 mt-2">
                    Showing {paginatedQuotations.length} of {filteredQuotations.length} quotations
                    {filteredQuotations.length !== allQuotations.length &&
                      ` (filtered from ${allQuotations.length} total)`}
                  </div>
                )}
              </CardHeader>

              {loading ? (
                <Table>
                  <TableHeader>
                    <TableRow className="bg-gray-50 border-b border-gray-200">
                      <TableHead className="font-semibold text-gray-900 py-3 w-8"></TableHead>
                      <TableHead className="font-semibold text-gray-900 py-3">NO.</TableHead>
                      <TableHead className="font-semibold text-gray-900 py-3">Site</TableHead>
                      <TableHead className="font-semibold text-gray-900 py-3">Client</TableHead>
                      <TableHead className="font-semibold text-gray-900 py-3">Project Compliance</TableHead>
                      <TableHead className="font-semibold text-gray-900 py-3">Status</TableHead>
                      <TableHead className="font-semibold text-gray-900 py-3">Remarks</TableHead>
                      <TableHead className="font-semibold text-gray-900 py-3">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {Array(pageSize)
                      .fill(0)
                      .map((_, i) => (
                        <TableRow key={i} className="border-b border-gray-100">
                          <TableCell className="py-3">
                            <Skeleton className="h-4 w-4" />
                          </TableCell>
                          <TableCell className="py-3">
                            <Skeleton className="h-4 w-32" />
                          </TableCell>
                          <TableCell className="py-3">
                            <Skeleton className="h-4 w-40" />
                          </TableCell>
                          <TableCell className="py-3">
                            <Skeleton className="h-4 w-32" />
                          </TableCell>
                          <TableCell className="py-3">
                            <Skeleton className="h-4 w-16" />
                          </TableCell>
                          <TableCell className="py-3">
                            <Skeleton className="h-4 w-20" />
                          </TableCell>
                          <TableCell className="py-3">
                            <Skeleton className="h-4 w-24" />
                          </TableCell>
                          <TableCell className="py-3">
                            <Skeleton className="h-4 w-8" />
                          </TableCell>
                        </TableRow>
                      ))}
                  </TableBody>
                </Table>
              ) : paginatedQuotations.length > 0 ? (
                <>
                  <CardContent className="p-0">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-gray-50 border-b border-gray-200">
                          <TableHead className="font-semibold text-gray-900 py-3 w-8"></TableHead>
                          <TableHead className="font-semibold text-gray-900 py-3">NO.</TableHead>
                          <TableHead className="font-semibold text-gray-900 py-3">Site</TableHead>
                          <TableHead className="font-semibold text-gray-900 py-3">Client</TableHead>
                          <TableHead className="font-semibold text-gray-900 py-3">Project Compliance</TableHead>
                          <TableHead className="font-semibold text-gray-900 py-3">Status</TableHead>
                          <TableHead className="font-semibold text-gray-900 py-3">Remarks</TableHead>
                          <TableHead className="font-semibold text-gray-900 py-3">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {paginatedQuotations.map((quotation) => {
                          const compliance = getProjectCompliance(quotation)

                          return (
                            <TableRow key={quotation.id} className="border-b border-gray-100 hover:bg-gray-50">
                              <TableCell className="py-3"></TableCell>
                              <TableCell
                                className="py-3 text-sm text-gray-700 cursor-pointer font-medium"
                                onClick={() => router.push(`/sales/quotations/${quotation.id}`)}
                              >
                                {quotation.quotation_number || "N/A"}
                              </TableCell>
                              <TableCell
                                className="py-3 text-sm text-blue-600 cursor-pointer hover:underline"
                                onClick={() => router.push(`/sales/quotations/${quotation.id}`)}
                              >
                                {quotation.items?.[0]?.name || quotation.product_name || "N/A"}
                              </TableCell>
                              <TableCell
                                className="py-3 text-sm text-gray-700 cursor-pointer"
                                onClick={() => router.push(`/sales/quotations/${quotation.id}`)}
                              >
                                {quotation.client_name || "N/A"}
                              </TableCell>
                              <TableCell className="py-3 text-sm text-gray-700">
                                <div className="space-y-2">
                                  <div className="flex items-center gap-2">
                                    <span className="font-medium">
                                      {compliance.completed}/{compliance.total}
                                    </span>
                                    <div className="w-2 h-2 rounded-full bg-gray-300"></div>
                                  </div>

                                  <div className="space-y-1">
                                    {compliance.items.map((item, index) => (
                                      <div key={index} className="flex items-center justify-between text-xs">
                                        <div className="flex items-center gap-2">
                                          {item.status === "completed" ? (
                                            <div className="w-3 h-3 rounded-full bg-green-500 flex items-center justify-center">
                                              <CheckCircle className="w-2 h-2 text-white" />
                                            </div>
                                          ) : (
                                            <div className="w-3 h-3 rounded-full border border-gray-300"></div>
                                          )}
                                          <span className="text-gray-700">{item.name}</span>
                                        </div>
                                        <div className="flex items-center gap-1">
                                          {item.file && (
                                            <span className="text-blue-600 hover:underline cursor-pointer">
                                              {item.file}
                                            </span>
                                          )}
                                          {item.status === "upload" && (
                                            <span className="text-gray-500 bg-gray-100 px-1 py-0.5 rounded text-xs">
                                              Upload
                                            </span>
                                          )}
                                        </div>
                                      </div>
                                    ))}
                                    {compliance.items.find((item) => item.note) && (
                                      <div className="text-xs text-gray-500 mt-1">
                                        {compliance.items.find((item) => item.note)?.note}
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </TableCell>
                              <TableCell
                                className="py-3 cursor-pointer"
                                onClick={() => router.push(`/sales/quotations/${quotation.id}`)}
                              >
                                <Badge
                                  variant="outline"
                                  className={`px-2 py-1 text-xs font-medium rounded-md ${getStatusColor(
                                    quotation.status,
                                  )}`}
                                >
                                  {quotation.status || "Draft"}
                                </Badge>
                              </TableCell>
                              <TableCell
                                className="py-3 text-sm text-gray-700 cursor-pointer"
                                onClick={() => router.push(`/sales/quotations/${quotation.id}`)}
                              >
                                {quotation.status === "sent"
                                  ? `Follow up on ${format(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), "MMM d, yyyy")}.`
                                  : "-NA"}
                              </TableCell>
                              <TableCell className="py-3">
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="sm" className="p-0 h-auto">
                                      <MoreHorizontal className="h-4 w-4 text-gray-400" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end">
                                    <DropdownMenuItem onClick={() => router.push(`/sales/quotations/${quotation.id}`)}>
                                      View Details
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                      onClick={(e) => {
                                        e.stopPropagation()
                                        handleQuoteSigned(quotation)
                                      }}
                                    >
                                      Mark as Signed
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </TableCell>
                            </TableRow>
                          )
                        })}
                      </TableBody>
                    </Table>
                  </CardContent>

                  <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
                    <p className="text-xs text-gray-500 italic">
                      A quotation is marked as "Booked" if signed quotation is uploaded. It will then be marked as
                      "Reserved" after uploading the "Signed Contract."
                    </p>
                  </div>
                </>
              ) : (
                <CardContent className="p-6 text-center text-gray-600">
                  {searchTerm || statusFilter !== "all" ? (
                    <div>
                      <p className="mb-2">No quotations found matching your filters.</p>
                      <Button variant="outline" onClick={clearFilters} size="sm">
                        Clear Filters
                      </Button>
                    </div>
                  ) : (
                    <p>No quotations found for your account.</p>
                  )}
                </CardContent>
              )}
            </Card>
          </div>
        ) : (
          <Card className="border-gray-200 shadow-sm rounded-xl">
            <CardContent className="p-6 text-center text-gray-600">
              <p>Please log in to view your quotations.</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}

"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/contexts/auth-context"
import { useRouter, useSearchParams } from "next/navigation"
import {
  collection,
  query,
  where,
  orderBy,
  limit,
  startAfter,
  getDocs,
  addDoc,
  serverTimestamp,
  doc,
  getDoc,
} from "firebase/firestore"
import { db } from "@/lib/firebase"
import { format } from "date-fns"
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ChevronLeft, ChevronRight, CheckCircle, Search, Filter } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { useDebounce } from "@/hooks/use-debounce"

interface QuotationsListContentProps {
  currentPage: number
  searchQuery: string
  statusFilter: string
}

export function QuotationsListContent({ currentPage, searchQuery, statusFilter }: QuotationsListContentProps) {
  const { user } = useAuth()
  const [quotations, setQuotations] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [hasMore, setHasMore] = useState(true)
  const [hasPrev, setHasPrev] = useState(false)
  const [signingQuotes, setSigningQuotes] = useState<Set<string>>(new Set())
  const [searchInput, setSearchInput] = useState(searchQuery)
  const [statusInput, setStatusInput] = useState(statusFilter)
  const router = useRouter()
  const searchParams = useSearchParams()
  const pageSize = 10
  const { toast } = useToast()

  // Debounce search input to avoid too many queries
  const debouncedSearch = useDebounce(searchInput, 500)

  // Update URL when search or filter changes
  useEffect(() => {
    const params = new URLSearchParams(searchParams.toString())

    if (debouncedSearch) {
      params.set("search", debouncedSearch)
    } else {
      params.delete("search")
    }

    if (statusInput) {
      params.set("status", statusInput)
    } else {
      params.delete("status")
    }

    // Reset to page 1 when search/filter changes
    if (debouncedSearch !== searchQuery || statusInput !== statusFilter) {
      params.set("page", "1")
    }

    router.push(`?${params.toString()}`, { scroll: false })
  }, [debouncedSearch, statusInput, router, searchParams, searchQuery, statusFilter])

  const fetchQuotations = async () => {
    if (!user?.uid) {
      setLoading(false)
      return
    }

    setLoading(true)

    try {
      const quotationsRef = collection(db, "quotations")
      const constraints = [where("created_by", "==", user.uid), orderBy("created", "desc")]

      // Add status filter if provided
      if (statusFilter) {
        constraints.splice(1, 0, where("status", "==", statusFilter))
      }

      // For search, we'll need to fetch more data and filter client-side
      // This is a limitation of Firestore - for better search, consider using Algolia
      const itemsToFetch = searchQuery ? pageSize * 5 : pageSize + 1
      constraints.push(limit(itemsToFetch))

      // Handle pagination by calculating offset
      if (currentPage > 1) {
        // For server-side pagination, we need to skip documents
        // This is not efficient with Firestore, but works for small datasets
        const skipQuery = query(
          quotationsRef,
          ...constraints.slice(0, -1), // Remove limit
          limit((currentPage - 1) * pageSize),
        )
        const skipSnapshot = await getDocs(skipQuery)
        const lastDoc = skipSnapshot.docs[skipSnapshot.docs.length - 1]

        if (lastDoc) {
          constraints.splice(-1, 0, startAfter(lastDoc))
        }
      }

      const q = query(quotationsRef, ...constraints)
      const querySnapshot = await getDocs(q)
      let fetchedQuotations: any[] = []

      querySnapshot.forEach((doc) => {
        fetchedQuotations.push({ id: doc.id, ...doc.data() })
      })

      // Apply client-side search filtering if search query exists
      if (searchQuery) {
        const searchLower = searchQuery.toLowerCase()
        fetchedQuotations = fetchedQuotations.filter(
          (quotation) =>
            quotation.client_name?.toLowerCase().includes(searchLower) ||
            quotation.client_phone?.toLowerCase().includes(searchLower) ||
            quotation.quotation_number?.toLowerCase().includes(searchLower) ||
            quotation.client_address?.toLowerCase().includes(searchLower),
        )
      }

      // Determine pagination state
      const hasMoreItems = !searchQuery && fetchedQuotations.length > pageSize
      if (hasMoreItems) {
        fetchedQuotations = fetchedQuotations.slice(0, pageSize)
      }

      setQuotations(fetchedQuotations)
      setHasMore(hasMoreItems)
      setHasPrev(currentPage > 1)
    } catch (error) {
      console.error("Error fetching quotations:", error)
      toast({
        title: "Error",
        description: "Failed to fetch quotations. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (user?.uid) {
      fetchQuotations()
    }
  }, [user?.uid, currentPage, searchQuery, statusFilter])

  const handlePageChange = (newPage: number) => {
    const params = new URLSearchParams(searchParams.toString())
    params.set("page", newPage.toString())
    router.push(`?${params.toString()}`)
  }

  const clearFilters = () => {
    setSearchInput("")
    setStatusInput("")
    router.push("/sales/quotations-list")
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
      case "accepted":
        return "bg-green-100 text-green-800 border-green-200"
      case "sent":
        return "bg-blue-100 text-blue-800 border-blue-200"
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

      const collectiblesPromises = items.map(async (item: any) => {
        const collectibleData = {
          client_name: quotation.client_name || fullQuotationData.client_name || "",
          company_id: user.company_id || user.uid,
          type: "sites",
          net_amount: item.item_total_amount || item.price * (fullQuotationData.duration_days || 30),
          total_amount: item.item_total_amount || item.price * (fullQuotationData.duration_days || 30),
          invoice_no: `INV-${quotation.quotation_number}-${item.id?.slice(-4) || Math.random().toString(36).substr(2, 4)}`,
          or_no: `OR-${Date.now()}-${item.id?.slice(-4) || Math.random().toString(36).substr(2, 4)}`,
          bi_no: `BI-${Date.now()}-${item.id?.slice(-4) || Math.random().toString(36).substr(2, 4)}`,
          mode_of_payment: "Credit/Debit Card",
          bank_name: "",
          status: "pending",
          collection_date: new Date().toISOString().split("T")[0],
          covered_period: `${fullQuotationData.start_date?.toDate?.()?.toISOString().split("T")[0] || new Date().toISOString().split("T")[0]} - ${fullQuotationData.end_date?.toDate?.()?.toISOString().split("T")[0] || new Date().toISOString().split("T")[0]}`,
          site: item.location || "",
          booking_no: `BK-${quotation.quotation_number}-${item.id?.slice(-4) || Math.random().toString(36).substr(2, 4)}`,
          vendor_name: quotation.client_name || fullQuotationData.client_name || "",
          business_address: quotation.client_address || fullQuotationData.client_address || "",
          tin_no: "",
          deleted: false,
          created: serverTimestamp(),
          updated: serverTimestamp(),
          quotation_id: quotation.id,
          quotation_number: quotation.quotation_number,
          product_name: item.name,
          product_id: item.id,
        }

        return addDoc(collection(db, "collectibles"), collectibleData)
      })

      const results = await Promise.all(collectiblesPromises)

      toast({
        title: "Success",
        description: `Quote signed successfully! Generated ${results.length} collectible document${results.length > 1 ? "s" : ""}.`,
      })
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

  if (!user?.uid) {
    return (
      <CardContent className="p-6 text-center text-gray-600">
        <p>Please log in to view your quotations.</p>
      </CardContent>
    )
  }

  return (
    <>
      <div className="p-6 border-b border-gray-200 bg-gray-50">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search by client name, phone, quotation number, or address..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="pl-10 bg-white border-gray-300 focus:border-blue-500 focus:ring-blue-500"
            />
          </div>
          <div className="flex gap-2">
            <Select value={statusInput} onValueChange={setStatusInput}>
              <SelectTrigger className="w-40 bg-white border-gray-300">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="sent">Sent</SelectItem>
                <SelectItem value="viewed">Viewed</SelectItem>
                <SelectItem value="accepted">Accepted</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
                <SelectItem value="expired">Expired</SelectItem>
              </SelectContent>
            </Select>
            {(searchInput || statusInput) && (
              <Button variant="outline" onClick={clearFilters} className="px-3 bg-transparent">
                Clear
              </Button>
            )}
          </div>
        </div>
      </div>

      {loading ? (
        <CardContent className="p-0">
          <div className="space-y-3 p-6">
            {Array(pageSize)
              .fill(0)
              .map((_, i) => (
                <div key={i} className="h-16 bg-gray-100 rounded-md animate-pulse" />
              ))}
          </div>
        </CardContent>
      ) : quotations.length > 0 ? (
        <>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50 border-b border-gray-200">
                    <TableHead className="font-semibold text-gray-900 py-3 px-4">Date</TableHead>
                    <TableHead className="font-semibold text-gray-900 py-3 px-4">Client</TableHead>
                    <TableHead className="font-semibold text-gray-900 py-3 px-4">Address</TableHead>
                    <TableHead className="font-semibold text-gray-900 py-3 px-4">Phone</TableHead>
                    <TableHead className="font-semibold text-gray-900 py-3 px-4">Designation</TableHead>
                    <TableHead className="font-semibold text-gray-900 py-3 px-4">Status</TableHead>
                    <TableHead className="font-semibold text-gray-900 py-3 px-4">Amount</TableHead>
                    <TableHead className="font-semibold text-gray-900 py-3 px-4">Reference</TableHead>
                    <TableHead className="font-semibold text-gray-900 py-3 px-4">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {quotations.map((quotation) => (
                    <TableRow key={quotation.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <TableCell
                        className="py-3 px-4 text-sm text-gray-700 cursor-pointer"
                        onClick={() => router.push(`/sales/quotations/${quotation.id}`)}
                      >
                        {formatDate(quotation.created)}
                      </TableCell>
                      <TableCell
                        className="py-3 px-4 text-sm text-gray-700 cursor-pointer font-medium"
                        onClick={() => router.push(`/sales/quotations/${quotation.id}`)}
                      >
                        {quotation.client_name || "N/A"}
                      </TableCell>
                      <TableCell
                        className="py-3 px-4 text-sm text-gray-700 cursor-pointer max-w-48 truncate"
                        onClick={() => router.push(`/sales/quotations/${quotation.id}`)}
                        title={quotation.client_address}
                      >
                        {quotation.client_address || "N/A"}
                      </TableCell>
                      <TableCell
                        className="py-3 px-4 text-sm text-gray-700 cursor-pointer"
                        onClick={() => router.push(`/sales/quotations/${quotation.id}`)}
                      >
                        {quotation.client_phone || "N/A"}
                      </TableCell>
                      <TableCell
                        className="py-3 px-4 text-sm text-gray-700 cursor-pointer"
                        onClick={() => router.push(`/sales/quotations/${quotation.id}`)}
                      >
                        {quotation.client_designation || "N/A"}
                      </TableCell>
                      <TableCell
                        className="py-3 px-4 cursor-pointer"
                        onClick={() => router.push(`/sales/quotations/${quotation.id}`)}
                      >
                        <Badge
                          variant="outline"
                          className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(quotation.status)}`}
                        >
                          {quotation.status}
                        </Badge>
                      </TableCell>
                      <TableCell
                        className="py-3 px-4 text-sm text-gray-700 cursor-pointer font-medium"
                        onClick={() => router.push(`/sales/quotations/${quotation.id}`)}
                      >
                        ₱{quotation.total_amount?.toLocaleString() || "0.00"}
                      </TableCell>
                      <TableCell
                        className="py-3 px-4 text-sm text-gray-700 cursor-pointer font-mono"
                        onClick={() => router.push(`/sales/quotations/${quotation.id}`)}
                      >
                        {quotation.quotation_number || "N/A"}
                      </TableCell>
                      <TableCell className="py-3 px-4">
                        {quotation.status?.toLowerCase() === "sent" || quotation.status?.toLowerCase() === "viewed" ? (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={(e) => {
                              e.stopPropagation()
                              handleQuoteSigned(quotation)
                            }}
                            disabled={signingQuotes.has(quotation.id)}
                            className="text-green-600 border-green-300 hover:bg-green-50 hover:text-green-700"
                          >
                            {signingQuotes.has(quotation.id) ? (
                              <>
                                <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-green-600 mr-1"></div>
                                Processing...
                              </>
                            ) : (
                              <>
                                <CheckCircle className="h-3 w-3 mr-1" />
                                Quote Signed
                              </>
                            )}
                          </Button>
                        ) : (
                          <span className="text-xs text-gray-400">
                            {quotation.status === "draft"
                              ? "Quote Signed"
                              : quotation.status === "accepted"
                                ? "Already signed"
                                : quotation.status === "rejected"
                                  ? "Rejected"
                                  : quotation.status === "expired"
                                    ? "Expired"
                                    : "-"}
                          </span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>

          <div className="flex justify-between items-center p-4 border-t border-gray-200 bg-gray-50">
            <Button
              variant="outline"
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={!hasPrev || loading}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
            >
              <ChevronLeft className="h-4 w-4" /> Previous
            </Button>

            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-700">Page {currentPage}</span>
              {quotations.length > 0 && <span className="text-xs text-gray-500">({quotations.length} items)</span>}
            </div>

            <Button
              variant="outline"
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={!hasMore || loading}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
            >
              Next <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </>
      ) : (
        <CardContent className="p-6 text-center text-gray-600">
          <div className="py-8">
            {searchQuery || statusFilter ? (
              <div className="space-y-2">
                <p>No quotations found matching your search criteria.</p>
                <Button variant="outline" onClick={clearFilters} className="mt-2 bg-transparent">
                  Clear filters
                </Button>
              </div>
            ) : (
              <p>No quotations found for your account.</p>
            )}
          </div>
        </CardContent>
      )}
    </>
  )
}

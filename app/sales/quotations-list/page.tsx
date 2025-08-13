"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/contexts/auth-context"
import { useRouter } from "next/navigation"
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
  type DocumentData,
  type QueryDocumentSnapshot,
} from "firebase/firestore"
import { db } from "@/lib/firebase"
import { format } from "date-fns"
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight, CheckCircle } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

export default function SalesQuotationsPage() {
  const { user } = useAuth()
  const [quotations, setQuotations] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)
  const [lastVisible, setLastVisible] = useState<QueryDocumentSnapshot<DocumentData> | null>(null)
  const [firstVisible, setFirstVisible] = useState<QueryDocumentSnapshot<DocumentData> | null>(null)
  const [pageHistory, setPageHistory] = useState<QueryDocumentSnapshot<DocumentData>[]>([])
  const [signingQuotes, setSigningQuotes] = useState<Set<string>>(new Set())
  const router = useRouter()
  const pageSize = 10
  const { toast } = useToast()

  console.log(user.uid)
  const fetchQuotations = async (direction: "first" | "next" | "prev" = "first") => {
    if (!user?.uid) {
      setLoading(false)
      return
    }

    setLoading(true)

    try {
      const quotationsRef = collection(db, "quotations")
      let q

      if (direction === "first") {
        q = query(quotationsRef, where("created_by", "==", user.uid), orderBy("created", "desc"), limit(pageSize + 1))
      } else if (direction === "next" && lastVisible) {
        q = query(
          quotationsRef,
          where("created_by", "==", user.uid),
          orderBy("created", "desc"),
          startAfter(lastVisible),
          limit(pageSize + 1),
        )
      } else if (direction === "prev" && pageHistory.length > 0) {
        const prevDoc = pageHistory[pageHistory.length - 1]
        q = query(
          quotationsRef,
          where("created_by", "==", user.uid),
          orderBy("created", "desc"),
          startAfter(prevDoc),
          limit(pageSize + 1),
        )
      } else {
        setLoading(false)
        return
      }

      const querySnapshot = await getDocs(q)
      const fetchedQuotations: any[] = []

      querySnapshot.forEach((doc) => {
        fetchedQuotations.push({ id: doc.id, ...doc.data() })
      })

      // Check if there are more items than pageSize
      const newHasMore = fetchedQuotations.length > pageSize

      // If we have more than pageSize, remove the extra item
      if (newHasMore) {
        fetchedQuotations.pop()
      }

      const docs = querySnapshot.docs.slice(0, pageSize) // Only take pageSize documents
      const newLastVisible = docs[docs.length - 1] || null
      const newFirstVisible = docs[0] || null

      setQuotations(fetchedQuotations)
      setLastVisible(newLastVisible)
      setFirstVisible(newFirstVisible)
      setHasMore(newHasMore)

      // Update page history and current page
      if (direction === "first") {
        setCurrentPage(1)
        setPageHistory([])
      } else if (direction === "next") {
        setCurrentPage((prev) => prev + 1)
        if (firstVisible) {
          setPageHistory((prev) => [...prev, firstVisible])
        }
      } else if (direction === "prev") {
        setCurrentPage((prev) => prev - 1)
        setPageHistory((prev) => prev.slice(0, -1))
      }
    } catch (error) {
      console.error("Error fetching quotations:", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (user?.uid) {
      fetchQuotations("first")
    }
  }, [user?.uid])

  const handleNextPage = () => {
    if (hasMore && !loading) {
      fetchQuotations("next")
    }
  }

  const handlePrevPage = () => {
    if (currentPage > 1 && !loading) {
      fetchQuotations("prev")
    }
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

      // Generate collectibles for each item/product
      const collectiblesPromises = items.map(async (item: any) => {
        const collectibleData = {
          // Basic information from quotation
          client_name: quotation.client_name || fullQuotationData.client_name || "",
          company_id: user.company_id || user.uid,
          type: "sites", // Default to sites type based on the business model

          // Financial data - distribute total amount across items proportionally
          net_amount: item.item_total_amount || item.price * (fullQuotationData.duration_days || 30),
          total_amount: item.item_total_amount || item.price * (fullQuotationData.duration_days || 30),

          // Document references
          invoice_no: `INV-${quotation.quotation_number}-${item.id?.slice(-4) || Math.random().toString(36).substr(2, 4)}`,
          or_no: `OR-${Date.now()}-${item.id?.slice(-4) || Math.random().toString(36).substr(2, 4)}`,
          bi_no: `BI-${Date.now()}-${item.id?.slice(-4) || Math.random().toString(36).substr(2, 4)}`,

          // Payment information
          mode_of_payment: "Credit/Debit Card", // Default payment method
          bank_name: "", // To be filled later

          // Status and dates
          status: "pending",
          collection_date: new Date().toISOString().split("T")[0],
          covered_period: `${fullQuotationData.start_date?.toDate?.()?.toISOString().split("T")[0] || new Date().toISOString().split("T")[0]} - ${fullQuotationData.end_date?.toDate?.()?.toISOString().split("T")[0] || new Date().toISOString().split("T")[0]}`,

          // Sites-specific fields
          site: item.location || "",
          booking_no: `BK-${quotation.quotation_number}-${item.id?.slice(-4) || Math.random().toString(36).substr(2, 4)}`,

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
          product_name: item.name,
          product_id: item.id,
        }

        return addDoc(collection(db, "collectibles"), collectibleData)
      })

      // Execute all collectibles creation
      const results = await Promise.all(collectiblesPromises)

      toast({
        title: "Success",
        description: `Quote signed successfully! Generated ${results.length} collectible document${results.length > 1 ? "s" : ""}.`,
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

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto p-4 md:p-6 lg:p-8">
        {user?.uid ? (
          <Card className="border-gray-200 shadow-sm rounded-xl">
            <CardHeader className="px-6 py-4 border-b border-gray-200">
              <CardTitle className="text-xl font-semibold text-gray-900">Quotations List</CardTitle>
            </CardHeader>
            {loading ? (
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50 border-b border-gray-200">
                    <TableHead className="font-semibold text-gray-900 py-3">Date</TableHead>
                    <TableHead className="font-semibold text-gray-900 py-3">Client</TableHead>
                    <TableHead className="font-semibold text-gray-900 py-3">Client Address</TableHead>
                    <TableHead className="font-semibold text-gray-900 py-3">Client Phone</TableHead>
                    <TableHead className="font-semibold text-gray-900 py-3">Client Designation</TableHead>
                    <TableHead className="font-semibold text-gray-900 py-3">Status</TableHead>
                    <TableHead className="font-semibold text-gray-900 py-3">Amount</TableHead>
                    <TableHead className="font-semibold text-gray-900 py-3">Reference</TableHead>
                    <TableHead className="font-semibold text-gray-900 py-3">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {Array(pageSize)
                    .fill(0)
                    .map((_, i) => (
                      <TableRow key={i} className="border-b border-gray-100">
                        <TableCell className="py-3">
                          <Skeleton className="h-4 w-24" />
                        </TableCell>
                        <TableCell className="py-3">
                          <Skeleton className="h-4 w-32" />
                        </TableCell>
                        <TableCell className="py-3">
                          <Skeleton className="h-4 w-48" />
                        </TableCell>
                        <TableCell className="py-3">
                          <Skeleton className="h-4 w-28" />
                        </TableCell>
                        <TableCell className="py-3">
                          <Skeleton className="h-4 w-36" />
                        </TableCell>
                        <TableCell className="py-3">
                          <Skeleton className="h-4 w-20" />
                        </TableCell>
                        <TableCell className="py-3">
                          <Skeleton className="h-4 w-24" />
                        </TableCell>
                        <TableCell className="py-3">
                          <Skeleton className="h-4 w-28" />
                        </TableCell>
                        <TableCell className="py-3">
                          <Skeleton className="h-4 w-20" />
                        </TableCell>
                      </TableRow>
                    ))}
                </TableBody>
              </Table>
            ) : quotations.length > 0 ? (
              <>
                <CardContent className="p-0">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-gray-50 border-b border-gray-200">
                        <TableHead className="font-semibold text-gray-900 py-3">Date</TableHead>
                        <TableHead className="font-semibold text-gray-900 py-3">Client</TableHead>
                        <TableHead className="font-semibold text-gray-900 py-3">Client Address</TableHead>
                        <TableHead className="font-semibold text-gray-900 py-3">Client Phone</TableHead>
                        <TableHead className="font-semibold text-gray-900 py-3">Client Designation</TableHead>
                        <TableHead className="font-semibold text-gray-900 py-3">Status</TableHead>
                        <TableHead className="font-semibold text-gray-900 py-3">Amount</TableHead>
                        <TableHead className="font-semibold text-gray-900 py-3">Reference</TableHead>
                        <TableHead className="font-semibold text-gray-900 py-3">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {quotations.map((quotation) => (
                        <TableRow key={quotation.id} className="border-b border-gray-100 hover:bg-gray-50">
                          <TableCell
                            className="py-3 text-sm text-gray-700 cursor-pointer"
                            onClick={() => router.push(`/sales/quotations/${quotation.id}`)}
                          >
                            {formatDate(quotation.created)}
                          </TableCell>
                          <TableCell
                            className="py-3 text-sm text-gray-700 cursor-pointer"
                            onClick={() => router.push(`/sales/quotations/${quotation.id}`)}
                          >
                            {quotation.client_name || "N/A"}
                          </TableCell>
                          <TableCell
                            className="py-3 text-sm text-gray-700 cursor-pointer"
                            onClick={() => router.push(`/sales/quotations/${quotation.id}`)}
                          >
                            {quotation.client_address || "N/A"}
                          </TableCell>
                          <TableCell
                            className="py-3 text-sm text-gray-700 cursor-pointer"
                            onClick={() => router.push(`/sales/quotations/${quotation.id}`)}
                          >
                            {quotation.client_phone || "N/A"}
                          </TableCell>
                          <TableCell
                            className="py-3 text-sm text-gray-700 cursor-pointer"
                            onClick={() => router.push(`/sales/quotations/${quotation.id}`)}
                          >
                            {quotation.client_designation || "N/A"}
                          </TableCell>
                          <TableCell
                            className="py-3 cursor-pointer"
                            onClick={() => router.push(`/sales/quotations/${quotation.id}`)}
                          >
                            <Badge
                              variant="outline"
                              className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(
                                quotation.status,
                              )}`}
                            >
                              {quotation.status}
                            </Badge>
                          </TableCell>
                          <TableCell
                            className="py-3 text-sm text-gray-700 cursor-pointer"
                            onClick={() => router.push(`/sales/quotations/${quotation.id}`)}
                          >
                            ₱{quotation.total_amount?.toLocaleString() || "0.00"}
                          </TableCell>
                          <TableCell
                            className="py-3 text-sm text-gray-700 cursor-pointer"
                            onClick={() => router.push(`/sales/quotations/${quotation.id}`)}
                          >
                            {quotation.quotation_number || "N/A"}
                          </TableCell>
                          <TableCell className="py-3">
                            {quotation.status?.toLowerCase() === "sent" ||
                            quotation.status?.toLowerCase() === "viewed" ? (
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
                                  ? "Send first"
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
                </CardContent>
                <div className="flex justify-between items-center p-4 border-t border-gray-200">
                  <Button
                    variant="outline"
                    onClick={handlePrevPage}
                    disabled={currentPage === 1 || loading}
                    className="flex items-center gap-2 text-gray-600 hover:text-gray-900 bg-transparent"
                  >
                    <ChevronLeft className="h-4 w-4" /> Previous
                  </Button>
                  <span className="text-sm text-gray-700">Page {currentPage}</span>
                  <Button
                    variant="outline"
                    onClick={handleNextPage}
                    disabled={!hasMore || loading}
                    className="flex items-center gap-2 text-gray-600 hover:text-gray-900 bg-transparent"
                  >
                    Next <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </>
            ) : (
              <CardContent className="p-6 text-center text-gray-600">
                <p>No quotations found for your account.</p>
              </CardContent>
            )}
          </Card>
        ) : (
          <Card className="border-gray-200 shadow-sm rounded-xl">
            <CardContent className="p-6 text-center text-gray-600">
              <p>Please log in to view your quotations.</p>
            </CardContent>
          </Card>
        )}
      </div>
      {loading && (
        <div className="fixed inset-0 bg-black/10 flex items-center justify-center z-50">
          <div className="bg-white p-4 rounded-lg shadow">
            <p>Loading quotations...</p>
          </div>
        </div>
      )}
    </div>
  )
}

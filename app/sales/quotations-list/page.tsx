"use client"

import { useState, useEffect, useCallback } from "react"
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
  type DocumentData,
  type QueryDocumentSnapshot,
} from "firebase/firestore"
import { db } from "@/lib/firebase" // Assuming db is exported from lib/firebase
import { format } from "date-fns"
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight } from "lucide-react"

export default function SalesQuotationsPage() {
  const { user } = useAuth()
  const [quotations, setQuotations] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)
  // pageCursors will store the last document snapshot of the *previous* page
  // pageCursors[0] will be null (for the very first page)
  // pageCursors[1] will be the last document of page 1 (used to fetch page 2)
  // pageCursors[2] will be the last document of page 2 (used to fetch page 3)
  const [pageCursors, setPageCursors] = useState<(QueryDocumentSnapshot<DocumentData> | null)[]>([null])

  const router = useRouter()
  const pageSize = 10 // 10 items per page

  const fetchQuotations = useCallback(
    async (pageToFetch: number) => {
      if (!user?.uid) {
        setLoading(false)
        return
      }

      setLoading(true)
      try {
        const quotationsRef = collection(db, "quotation")
        let q

        // Determine the startAfter document based on the page we want to fetch
        const startDoc = pageCursors[pageToFetch - 1] || null // Use null for the first page

        if (startDoc) {
          q = query(
            quotationsRef,
            where("seller_id", "==", user.uid),
            orderBy("created", "desc"),
            startAfter(startDoc),
            limit(pageSize),
          )
        } else {
          // For the first page (pageToFetch === 1), startDoc will be null
          q = query(quotationsRef, where("seller_id", "==", user.uid), orderBy("created", "desc"), limit(pageSize))
        }

        const querySnapshot = await getDocs(q)
        const fetchedQuotations: any[] = []
        querySnapshot.forEach((doc) => {
          fetchedQuotations.push({ id: doc.id, ...doc.data() })
        })

        const newLastVisible = querySnapshot.docs[querySnapshot.docs.length - 1] || null
        const newHasMore = querySnapshot.docs.length === pageSize

        setQuotations(fetchedQuotations)
        setHasMore(newHasMore)
        setCurrentPage(pageToFetch)

        // Update pageCursors:
        // If we are moving to a new page (forward), add the newLastVisible to the history.
        // If we are going back, the history is already correct up to that point.
        setPageCursors((prev) => {
          const newCursors = [...prev]
          // If we are fetching page N, we store its lastVisible at index N
          // This means pageCursors[0] is null (for page 1), pageCursors[1] is lastVisible of page 1, etc.
          newCursors[pageToFetch] = newLastVisible
          // If we went back, we might have extra cursors, so truncate if necessary
          if (newCursors.length > pageToFetch + 1) {
            newCursors.length = pageToFetch + 1
          }
          return newCursors
        })
      } catch (error) {
        console.error("Error fetching quotations:", error)
      } finally {
        setLoading(false)
      }
    },
    [user?.uid, pageCursors, pageSize],
  )

  useEffect(() => {
    if (user?.uid) {
      fetchQuotations(1) // Fetch the first page on component mount or user change
    }
  }, [user?.uid, fetchQuotations])

  const handleNextPage = () => {
    if (hasMore && !loading) {
      fetchQuotations(currentPage + 1)
    }
  }

  const handlePrevPage = () => {
    if (currentPage > 1 && !loading) {
      fetchQuotations(currentPage - 1)
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

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto p-4 md:p-6 lg:p-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Quotations</h1>
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
                    <TableHead className="font-semibold text-gray-900 py-3">Status</TableHead>
                    <TableHead className="font-semibold text-gray-900 py-3">Amount</TableHead>
                    <TableHead className="font-semibold text-gray-900 py-3">Reference</TableHead>
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
                          <Skeleton className="h-4 w-20" />
                        </TableCell>
                        <TableCell className="py-3">
                          <Skeleton className="h-4 w-24" />
                        </TableCell>
                        <TableCell className="py-3">
                          <Skeleton className="h-4 w-28" />
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
                        <TableHead className="font-semibold text-gray-900 py-3">Status</TableHead>
                        <TableHead className="font-semibold text-gray-900 py-3">Amount</TableHead>
                        <TableHead className="font-semibold text-gray-900 py-3">Reference</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {quotations.map((quotation) => (
                        <TableRow
                          key={quotation.id}
                          className="border-b border-gray-100 hover:bg-gray-50 cursor-pointer"
                          onClick={() => router.push(`/sales/quotations/${quotation.id}`)}
                        >
                          <TableCell className="py-3 text-sm text-gray-700">{formatDate(quotation.created)}</TableCell>
                          <TableCell className="py-3 text-sm text-gray-700">{quotation.client_name || "N/A"}</TableCell>
                          <TableCell className="py-3">
                            <Badge
                              variant="outline"
                              className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(
                                quotation.status,
                              )}`}
                            >
                              {quotation.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="py-3 text-sm text-gray-700">
                            ₱{quotation.total_amount?.toLocaleString() || "0.00"}
                          </TableCell>
                          <TableCell className="py-3 text-sm text-gray-700">
                            {quotation.quotation_number || "N/A"}
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
